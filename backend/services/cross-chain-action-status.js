'use strict';

const fetch = require('node-fetch');
const { Web3 } = require('web3');
const config = require('../config');
const genesisAbi = require('../../src/ABIs/genesis_ABI.json');
const { normalizeLedgerJob } = require('./oppy-job-context');
const { reconcileCCTPTransfer } = require('../utils/cctp-reconciliation');

const LAYERZERO_API = 'https://scan.layerzero-api.com/v1/messages/tx';
const PUBLIC_ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc';
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const VALID_JOB_ID = /^\d+-\d+$/;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SUPPORTED_ACTIONS = new Set(['postJob', 'startDirectContract', 'releasePayment']);
const SOURCE_CHAINS = new Map([
  [10, { name: 'Optimism', explorer: 'https://optimistic.etherscan.io/tx/', jobPrefix: '30111' }],
  [50, { name: 'XDC Network', explorer: 'https://xdcscan.com/tx/', jobPrefix: '30365' }],
]);
const DOMAIN_CHAINS = new Map([
  [2, { name: 'Optimism', chainId: 10, explorer: 'https://optimistic.etherscan.io/tx/' }],
  [3, { name: 'Arbitrum One', chainId: 42161, explorer: 'https://arbiscan.io/tx/' }],
  [18, { name: 'XDC Network', chainId: 50, explorer: 'https://xdcscan.com/tx/' }],
]);

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function normalizeLayerZeroStatus(message) {
  return String(message?.status?.name || message?.status || '').trim().toUpperCase();
}

function destinationTransactionHash(message) {
  const candidates = [
    message?.destination?.tx?.txHash,
    message?.destination?.txHash,
    message?.dstTxHash,
    message?.destinationTxHash,
  ];
  return candidates.find((value) => VALID_TX_HASH.test(value || '')) || null;
}

async function fetchLayerZeroMessage(sourceTxHash, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const response = await withTimeout(
    fetchImpl(`${LAYERZERO_API}/${sourceTxHash}`, { headers: { Accept: 'application/json' } }),
    dependencies.fetchTimeoutMs || 8000,
    'LayerZero status check',
  );
  if (!response.ok) throw new Error(`LayerZero API returned HTTP ${response.status}`);
  const payload = await response.json();
  const messages = payload?.data || payload?.messages || [];
  return Array.isArray(messages) && messages.length ? messages[0] : null;
}

async function readCanonicalJob(jobId, dependencies = {}) {
  if (dependencies.readCanonicalJob) return dependencies.readCanonicalJob(jobId);
  const Web3Class = dependencies.Web3 || Web3;
  const rpcUrls = [
    dependencies.rpcUrl || config.ARBITRUM_RPC,
    dependencies.publicRpcUrl || PUBLIC_ARBITRUM_RPC,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  let lastError = null;

  for (const rpcUrl of rpcUrls) {
    try {
      const web3 = new Web3Class(rpcUrl);
      const genesis = new web3.eth.Contract(genesisAbi, dependencies.genesisAddress || config.GENESIS_ADDRESS);
      const rawJob = await withTimeout(
        Promise.resolve(genesis.methods.getJob(jobId).call()),
        dependencies.rpcTimeoutMs || 8000,
        'Arbitrum job check',
      );
      return normalizeLedgerJob(rawJob);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Arbitrum job check failed');
}

function canonicalActionComplete(action, job, baselineTotalPaidRaw) {
  if (!job) return false;
  if (action === 'postJob') return true;
  if (action === 'startDirectContract') {
    return job.status === 1
      && Boolean(job.selectedApplicant)
      && String(job.selectedApplicant).toLowerCase() !== ZERO_ADDRESS;
  }
  if (action === 'releasePayment') {
    if (baselineTotalPaidRaw === null) return false;
    try {
      return BigInt(job.totalPaidRaw || 0) > BigInt(baselineTotalPaidRaw);
    } catch {
      return false;
    }
  }
  return false;
}

function statusLinks({ sourceChainId, sourceTxHash, jobId, destinationTxHash, targetDomain }) {
  const source = SOURCE_CHAINS.get(Number(sourceChainId));
  const target = DOMAIN_CHAINS.get(Number(targetDomain));
  return {
    sourceExplorerUrl: source ? `${source.explorer}${sourceTxHash}` : null,
    layerZeroScanUrl: `https://layerzeroscan.com/tx/${sourceTxHash}`,
    canonicalExplorerUrl: destinationTxHash ? `https://arbiscan.io/tx/${destinationTxHash}` : null,
    canonicalJobUrl: `/job-details/${encodeURIComponent(jobId)}`,
    circleStatusUrl: destinationTxHash
      ? `${config.CIRCLE_API_BASE_URL}/3?transactionHash=${destinationTxHash}`
      : null,
    targetExplorerUrl: target?.explorer || null,
  };
}

async function readCrossChainActionStatus(input, dependencies = {}) {
  const action = String(input?.action || '');
  const jobId = String(input?.jobId || '');
  const sourceTxHash = String(input?.sourceTxHash || '');
  const sourceChainId = Number(input?.sourceChainId);
  const targetDomain = input?.targetDomain === null || input?.targetDomain === undefined
    ? null
    : Number(input.targetDomain);
  const baselineTotalPaidRaw = input?.baselineTotalPaidRaw === null || input?.baselineTotalPaidRaw === undefined
    ? null
    : String(input.baselineTotalPaidRaw);

  if (!SUPPORTED_ACTIONS.has(action)) throw new Error('Unsupported cross-chain action');
  if (!VALID_JOB_ID.test(jobId)) throw new Error('A valid OpenWork job ID is required');
  if (!VALID_TX_HASH.test(sourceTxHash)) throw new Error('A valid source transaction hash is required');
  if (!SOURCE_CHAINS.has(sourceChainId)) throw new Error('A supported source chain is required');
  if (!jobId.startsWith(`${SOURCE_CHAINS.get(sourceChainId).jobPrefix}-`)) {
    throw new Error('The job ID does not belong to the source chain');
  }

  let layerZeroMessage = null;
  let layerZeroError = null;
  try {
    layerZeroMessage = await (dependencies.fetchLayerZeroMessage || fetchLayerZeroMessage)(sourceTxHash, dependencies);
  } catch (error) {
    layerZeroError = error.message || 'LayerZero status is temporarily unavailable';
  }

  const layerZeroName = normalizeLayerZeroStatus(layerZeroMessage);
  const destinationTxHash = destinationTransactionHash(layerZeroMessage);
  const layerZeroDelivered = ['DELIVERED', 'SUCCEEDED'].includes(layerZeroName) && Boolean(destinationTxHash);
  const layerZeroFailed = ['FAILED', 'REVERTED', 'BLOCKED'].includes(layerZeroName);

  let canonicalJob = null;
  let canonicalError = null;
  if (layerZeroDelivered) {
    try {
      canonicalJob = await readCanonicalJob(jobId, dependencies);
    } catch (error) {
      canonicalError = error.message || 'Canonical OpenWork state is temporarily unavailable';
    }
  }
  const canonicalComplete = layerZeroDelivered
    && canonicalActionComplete(action, canonicalJob, baselineTotalPaidRaw);

  const cctpRequired = action === 'releasePayment' && targetDomain !== null && targetDomain !== 3;
  let cctpResult = null;
  let cctpError = null;
  if (cctpRequired && destinationTxHash) {
    try {
      cctpResult = await (dependencies.reconcileCCTPTransfer || reconcileCCTPTransfer)({
        sourceTxHash: destinationTxHash,
        sourceDomain: 3,
      }, dependencies.cctpDependencies || {});
    } catch (error) {
      cctpError = error.message || 'Circle delivery status is temporarily unavailable';
    }
  }
  const cctpComplete = !cctpRequired || cctpResult?.completed === true;
  const complete = layerZeroDelivered && canonicalComplete && cctpComplete;
  const state = complete
    ? 'complete'
    : (layerZeroFailed ? 'failed' : ((layerZeroError || canonicalError || cctpError) ? 'unavailable' : 'in-progress'));
  const source = SOURCE_CHAINS.get(sourceChainId);
  const target = targetDomain === null ? null : DOMAIN_CHAINS.get(targetDomain);

  return {
    action,
    jobId,
    state,
    complete,
    checkedAt: new Date().toISOString(),
    source: {
      chainId: sourceChainId,
      chainName: source.name,
      txHash: sourceTxHash,
      confirmed: true,
    },
    layerZero: {
      state: layerZeroDelivered ? 'delivered' : (layerZeroFailed ? 'failed' : (layerZeroError ? 'unavailable' : 'pending')),
      rawStatus: layerZeroName || null,
      destinationTxHash,
      error: layerZeroError,
    },
    canonical: {
      state: canonicalComplete ? 'complete' : (canonicalError ? 'unavailable' : 'pending'),
      chainId: 42161,
      chainName: 'Arbitrum One',
      jobExists: Boolean(canonicalJob),
      statusCode: canonicalJob?.status ?? null,
      totalPaid: canonicalJob?.totalPaid ?? null,
      totalPaidRaw: canonicalJob?.totalPaidRaw ?? null,
      currentMilestone: canonicalJob?.currentMilestone ?? null,
      error: canonicalError,
    },
    cctp: {
      required: cctpRequired,
      state: cctpComplete ? 'received' : (cctpError ? 'unavailable' : 'pending'),
      targetDomain,
      targetChainName: target?.name || null,
      eventNonce: cctpResult?.eventNonce || null,
      amountRaw: cctpResult?.amount || null,
      recipient: cctpResult?.mintRecipient || null,
      reason: cctpResult?.reason || null,
      error: cctpError,
    },
    links: statusLinks({ sourceChainId, sourceTxHash, jobId, destinationTxHash, targetDomain }),
  };
}

module.exports = {
  DOMAIN_CHAINS,
  LAYERZERO_API,
  PUBLIC_ARBITRUM_RPC,
  SOURCE_CHAINS,
  SUPPORTED_ACTIONS,
  canonicalActionComplete,
  destinationTransactionHash,
  fetchLayerZeroMessage,
  normalizeLayerZeroStatus,
  readCanonicalJob,
  readCrossChainActionStatus,
};
