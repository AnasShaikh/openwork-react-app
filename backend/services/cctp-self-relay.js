'use strict';

const { Web3 } = require('web3');
const config = require('../config');
const { fetchCircleMessage, isCCTPMessageConsumed } = require('../utils/cctp-reconciliation');
const { fetchLayerZeroMessage, destinationTransactionHash, SOURCE_CHAINS } = require('./cross-chain-action-status');

const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const SUPPORTED_ACTIONS = new Set(['startDirectContract', 'releasePayment']);
const DIRECT_CONTRACT_SELECTORS = new Set(['0x6caa5397', '0x03edef0e']);
const DIRECT_CONTRACT_EVENT_TOPICS = new Set([
  'JobPosted(string,address)',
  'JobPosted(string,address,string)',
].map((signature) => Web3.utils.keccak256(signature).toLowerCase()));
const DIRECT_SOURCE_CHAINS = {
  10: () => ({
    name: 'Optimism',
    contract: config.LOWJC_OP_ADDRESS,
    rpcUrls: [config.OPTIMISM_RPC, 'https://mainnet.optimism.io'].filter(Boolean),
  }),
  50: () => ({
    name: 'XDC Network',
    contract: config.LOWJC_XDC_ADDRESS,
    rpcUrls: [config.XDC_RPC, 'https://rpc.xinfin.network', 'https://erpc.xinfin.network'].filter(Boolean),
  }),
};

function normalizeAddress(value) {
  const raw = String(value || '').toLowerCase().replace(/^0x/, '');
  if (raw.length < 40 || !/^[a-f0-9]+$/.test(raw)) return null;
  return `0x${raw.slice(-40)}`;
}

function destinationForDomain(domain) {
  const value = Number(domain);
  if (value === Number(config.DOMAINS.ARBITRUM)) {
    return {
      chainId: config.isMainnet() ? 42161 : 421614,
      chainName: config.isMainnet() ? 'Arbitrum One' : 'Arbitrum Sepolia',
      nativeSymbol: 'ETH',
      receiver: config.MESSAGE_TRANSMITTER_ARB,
      method: 'receiveMessage',
      explorer: config.isMainnet() ? 'https://arbiscan.io/tx/' : 'https://sepolia.arbiscan.io/tx/',
    };
  }
  if (value === Number(config.DOMAINS.OPTIMISM)) {
    return {
      chainId: config.isMainnet() ? 10 : 11155420,
      chainName: config.isMainnet() ? 'Optimism' : 'Optimism Sepolia',
      nativeSymbol: 'ETH',
      receiver: config.CCTP_OP_ADDRESS,
      method: 'receive',
      explorer: config.isMainnet() ? 'https://optimistic.etherscan.io/tx/' : 'https://sepolia-optimism.etherscan.io/tx/',
    };
  }
  if (config.DOMAINS.XDC !== undefined && value === Number(config.DOMAINS.XDC)) {
    return {
      chainId: 50,
      chainName: 'XDC Network',
      nativeSymbol: 'XDC',
      receiver: config.CCTP_XDC_ADDRESS,
      method: 'receive',
      explorer: 'https://xdcscan.com/tx/',
    };
  }
  return null;
}

async function validateDirectContractSource(input, dependencies = {}) {
  if (dependencies.validateDirectContractSource) {
    return dependencies.validateDirectContractSource(input);
  }
  const source = dependencies.sourceChain || DIRECT_SOURCE_CHAINS[Number(input.sourceChainId)]?.();
  if (!source?.contract) throw new Error('The direct-contract source is not configured');
  const expectedJobTopic = Web3.utils.keccak256(input.jobId).toLowerCase();
  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  let lastError = null;

  for (const rpcUrl of [...new Set(source.rpcUrls)]) {
    try {
      const web3 = createWeb3(rpcUrl);
      const [transaction, receipt] = await Promise.all([
        web3.eth.getTransaction(input.sourceTxHash),
        web3.eth.getTransactionReceipt(input.sourceTxHash),
      ]);
      if (!transaction || !receipt) throw new Error('The source transaction is not mined');
      const selector = String(transaction.input || transaction.data || '').slice(0, 10).toLowerCase();
      if (!DIRECT_CONTRACT_SELECTORS.has(selector)) throw new Error('The source transaction is not a direct contract');
      if (normalizeAddress(transaction.to) !== normalizeAddress(source.contract)) {
        throw new Error('The source transaction does not target the configured OpenWork contract');
      }
      const provesJob = (receipt.logs || []).some((log) => (
        Array.isArray(log?.topics)
        && DIRECT_CONTRACT_EVENT_TOPICS.has(String(log.topics[0] || '').toLowerCase())
        && String(log.topics[1] || '').toLowerCase() === expectedJobTopic
      ));
      if (!provesJob) throw new Error('The source receipt does not prove this OpenWork job ID');
      return true;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`${source.name} source transaction could not be verified`);
}

async function resolveCctpSource(input, dependencies = {}) {
  const source = SOURCE_CHAINS.get(Number(input.sourceChainId));
  if (!source) throw new Error('A supported source chain is required');
  if (input.action === 'startDirectContract') {
    return { sourceTxHash: input.sourceTxHash, sourceDomain: source.cctpDomain, expectedDestinationDomain: 3 };
  }
  const layerZero = await (dependencies.fetchLayerZeroMessage || fetchLayerZeroMessage)(input.sourceTxHash, dependencies);
  const burnTxHash = destinationTransactionHash(layerZero);
  if (!burnTxHash) throw new Error('The Arbitrum payment transaction is not delivered yet');
  const expectedDestinationDomain = Number(input.targetDomain);
  if (![2, 18].includes(expectedDestinationDomain)) {
    throw new Error('This payment does not require a user-completable CCTP receive');
  }
  return { sourceTxHash: burnTxHash, sourceDomain: 3, expectedDestinationDomain };
}

async function buildCctpRecoveryPlan(input, dependencies = {}) {
  const action = String(input?.action || '');
  if (!SUPPORTED_ACTIONS.has(action)) throw new Error('This action does not support CCTP recovery');
  if (!VALID_TX_HASH.test(input?.sourceTxHash || '')) throw new Error('A valid source transaction hash is required');

  if (action === 'startDirectContract') {
    await validateDirectContractSource(input, dependencies);
  }

  const source = await resolveCctpSource(input, dependencies);
  const message = await (dependencies.fetchCircleMessage || fetchCircleMessage)(
    source.sourceDomain,
    source.sourceTxHash,
    dependencies.cctpDependencies || {},
  );
  if (!message) {
    return { ready: false, alreadyCompleted: false, reason: 'attestation_incomplete', ...source };
  }

  const destinationDomain = Number(message.destinationDomain ?? message.decodedMessage?.destinationDomain);
  if (destinationDomain !== source.expectedDestinationDomain) {
    throw new Error('Circle destination does not match the OpenWork action');
  }
  const destination = destinationForDomain(destinationDomain);
  if (!destination?.receiver) throw new Error('The destination receive contract is not configured');

  const mintRecipient = normalizeAddress(message.decodedMessage?.decodedMessageBody?.mintRecipient);
  if (action === 'startDirectContract' && mintRecipient !== normalizeAddress(config.NOWJC_ADDRESS)) {
    throw new Error('Circle mint recipient does not match the OpenWork escrow contract');
  }

  const consumed = await (dependencies.isCCTPMessageConsumed || isCCTPMessageConsumed)({
    eventNonce: message.eventNonce,
    destinationDomain,
  }, dependencies.cctpDependencies || {});
  if (consumed) {
    return {
      ready: false,
      alreadyCompleted: true,
      reason: 'nonce_consumed',
      eventNonce: message.eventNonce,
      destinationDomain,
      destination,
      ...source,
    };
  }

  const web3 = dependencies.web3 || new Web3();
  const abi = destination.method === 'receiveMessage'
    ? config.ABIS.MESSAGE_TRANSMITTER
    : config.ABIS.CCTP_TRANSCEIVER;
  const contract = new web3.eth.Contract(abi, destination.receiver);
  const call = contract.methods[destination.method](message.message, message.attestation);

  return {
    ready: true,
    alreadyCompleted: false,
    reason: 'ready',
    chainId: destination.chainId,
    chainName: destination.chainName,
    nativeSymbol: destination.nativeSymbol,
    explorerBaseUrl: destination.explorer,
    to: destination.receiver,
    data: call.encodeABI(),
    method: destination.method,
    eventNonce: message.eventNonce,
    destinationDomain,
    mintRecipient,
    amountRaw: message.decodedMessage?.decodedMessageBody?.amount || null,
    checkedAt: new Date().toISOString(),
    ...source,
  };
}

module.exports = {
  SUPPORTED_ACTIONS,
  buildCctpRecoveryPlan,
  destinationForDomain,
  normalizeAddress,
  resolveCctpSource,
  validateDirectContractSource,
};
