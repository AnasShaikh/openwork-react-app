import Web3 from 'web3';

const JOB_EXISTS_ABI = [{
  inputs: [{ internalType: 'string', name: 'jobId', type: 'string' }],
  name: 'jobExists',
  outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  stateMutability: 'view',
  type: 'function',
}];

const CROSS_CHAIN_SOURCES = {
  10: {
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io/tx/',
    jobPrefix: '30111',
  },
  50: {
    name: 'XDC Network',
    explorer: 'https://xdcscan.com/tx/',
    jobPrefix: '30365',
  },
};

const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

export const CROSS_CHAIN_SYNC_POLL_MS = 8_000;

export function getCrossChainSource(activeJob) {
  if (!activeJob || !VALID_JOB_ID.test(activeJob.jobId || '')) return null;
  const sourceChainId = Number(activeJob.sourceChainId);
  const source = CROSS_CHAIN_SOURCES[sourceChainId];
  if (!source || !activeJob.jobId.startsWith(`${source.jobPrefix}-`)) return null;
  return { ...source, chainId: sourceChainId };
}

export function isCrossChainSyncCandidate(activeJob) {
  return Boolean(getCrossChainSource(activeJob) && activeJob?.sourceReceiptConfirmed === true);
}

export function getCrossChainTrackingLinks(activeJob) {
  const source = getCrossChainSource(activeJob);
  const txHash = VALID_TX_HASH.test(activeJob?.sourceTxHash || '') ? activeJob.sourceTxHash : null;
  return {
    sourceExplorerUrl: source && txHash ? `${source.explorer}${txHash}` : null,
    layerZeroScanUrl: txHash ? `https://layerzeroscan.com/tx/${txHash}` : null,
    canonicalJobUrl: VALID_JOB_ID.test(activeJob?.jobId || '')
      ? `/job-details/${encodeURIComponent(activeJob.jobId)}`
      : null,
  };
}

export async function readCanonicalJobSyncStatus(activeJob, dependencies = {}) {
  const source = getCrossChainSource(activeJob);
  if (!source) throw new Error('A supported XDC or Optimism job is required');
  if (activeJob.sourceReceiptConfirmed !== true) {
    return {
      state: 'waiting-source',
      jobId: activeJob.jobId,
      source,
      checkedAt: new Date().toISOString(),
    };
  }

  const nativeChain = dependencies.nativeChain
    || (await import('../config/chainConfig.js')).getNativeChain();
  if (!nativeChain?.rpcUrl || !nativeChain?.contracts?.genesis) {
    throw new Error('Arbitrum Genesis is not configured');
  }

  const contract = dependencies.contract || (() => {
    const Web3Class = dependencies.Web3Class || Web3;
    const web3 = new Web3Class(nativeChain.rpcUrl);
    return new web3.eth.Contract(JOB_EXISTS_ABI, nativeChain.contracts.genesis);
  })();
  const canonicalExists = await contract.methods.jobExists(activeJob.jobId).call();

  return {
    state: canonicalExists ? 'synced' : 'syncing',
    jobId: activeJob.jobId,
    source,
    canonicalChainId: 42161,
    canonicalChainName: 'Arbitrum One',
    canonicalExists: Boolean(canonicalExists),
    checkedAt: new Date().toISOString(),
  };
}
