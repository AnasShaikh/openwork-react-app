const fetch = require('node-fetch');
const { Web3 } = require('web3');
const config = require('../config');

const PUBLIC_RPC_FALLBACKS = {
  ARBITRUM: ['https://arb1.arbitrum.io/rpc'],
  OPTIMISM: ['https://mainnet.optimism.io'],
  XDC: ['https://rpc.xinfin.network', 'https://erpc.xinfin.network'],
};

function uniqueRpcUrls(...values) {
  return values.flat().filter((value, index, all) => value && all.indexOf(value) === index);
}

const USED_NONCES_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'usedNonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function getDestinationConfig(destinationDomain) {
  const domain = Number(destinationDomain);

  if (domain === Number(config.DOMAINS.ARBITRUM)) {
    return {
      chainName: config.isMainnet() ? 'Arbitrum One' : 'Arbitrum Sepolia',
      rpcUrl: config.ARBITRUM_RPC,
      rpcUrls: config.isMainnet()
        ? uniqueRpcUrls(config.ARBITRUM_RPC, PUBLIC_RPC_FALLBACKS.ARBITRUM)
        : uniqueRpcUrls(config.ARBITRUM_RPC),
      messageTransmitter: config.MESSAGE_TRANSMITTER_ARB,
    };
  }

  if (domain === Number(config.DOMAINS.OPTIMISM)) {
    return {
      chainName: config.isMainnet() ? 'Optimism' : 'Optimism Sepolia',
      rpcUrl: config.OPTIMISM_RPC,
      rpcUrls: config.isMainnet()
        ? uniqueRpcUrls(config.OPTIMISM_RPC, PUBLIC_RPC_FALLBACKS.OPTIMISM)
        : uniqueRpcUrls(config.OPTIMISM_RPC),
      messageTransmitter: config.MESSAGE_TRANSMITTER_OP,
    };
  }

  if (config.DOMAINS.XDC !== undefined && domain === Number(config.DOMAINS.XDC)) {
    return {
      chainName: 'XDC Network',
      rpcUrl: config.XDC_RPC,
      rpcUrls: config.isMainnet()
        ? uniqueRpcUrls(config.XDC_RPC, PUBLIC_RPC_FALLBACKS.XDC)
        : uniqueRpcUrls(config.XDC_RPC),
      messageTransmitter: config.MESSAGE_TRANSMITTER_XDC,
    };
  }

  return null;
}

async function fetchCircleMessage(sourceDomain, sourceTxHash, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const url = `${config.CIRCLE_API_BASE_URL}/${sourceDomain}?transactionHash=${sourceTxHash}`;
  const response = await fetchImpl(url, { timeout: dependencies.fetchTimeoutMs || 8000 });

  if (!response.ok) {
    throw new Error(`Circle API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.messages?.find((message) => message.status === 'complete') || null;
}

async function isCCTPMessageConsumed(attestationData, dependencies = {}) {
  const eventNonce = attestationData?.eventNonce;
  const destinationDomain = attestationData?.destinationDomain;
  if (!eventNonce || destinationDomain === undefined || destinationDomain === null) return false;

  const destination = dependencies.destinationConfig || getDestinationConfig(destinationDomain);
  const rpcUrls = uniqueRpcUrls(destination?.rpcUrl, destination?.rpcUrls || []);
  if (!rpcUrls.length || !destination?.messageTransmitter) {
    throw new Error(`No MessageTransmitter configuration for CCTP domain ${destinationDomain}`);
  }

  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  let lastError = null;

  for (const rpcUrl of rpcUrls) {
    try {
      const web3 = createWeb3(rpcUrl);
      const transmitter = new web3.eth.Contract(USED_NONCES_ABI, destination.messageTransmitter);
      const used = await withTimeout(
        Promise.resolve(transmitter.methods.usedNonces(eventNonce).call()),
        dependencies.rpcTimeoutMs || 8000,
        `${destination.chainName} usedNonces check`
      );
      return BigInt(used.toString()) !== 0n;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`${destination.chainName} usedNonces check failed`);
}

async function reconcileCCTPTransfer(record, dependencies = {}) {
  const sourceTxHash = record?.source_tx_hash || record?.sourceTxHash;
  const sourceDomain = record?.source_domain ?? record?.sourceDomain;
  if (!sourceTxHash || sourceDomain === undefined || sourceDomain === null) {
    return { completed: false, reason: 'missing_source' };
  }

  const message = await fetchCircleMessage(sourceDomain, sourceTxHash, dependencies);
  if (!message) return { completed: false, reason: 'attestation_incomplete' };

  const destinationDomain = message.destinationDomain ?? message.decodedMessage?.destinationDomain;
  const consumed = await isCCTPMessageConsumed({
    eventNonce: message.eventNonce,
    destinationDomain,
  }, dependencies);

  if (!consumed) {
    return {
      completed: false,
      reason: 'nonce_unused',
      attestationReady: true,
      eventNonce: message.eventNonce,
      destinationDomain: Number(destinationDomain),
      mintRecipient: message.decodedMessage?.decodedMessageBody?.mintRecipient || null,
      amount: message.decodedMessage?.decodedMessageBody?.amount || null,
    };
  }

  return {
    completed: true,
    eventNonce: message.eventNonce,
    destinationDomain: Number(destinationDomain),
    mintRecipient: message.decodedMessage?.decodedMessageBody?.mintRecipient || null,
    amount: message.decodedMessage?.decodedMessageBody?.amount || null,
  };
}

module.exports = {
  PUBLIC_RPC_FALLBACKS,
  USED_NONCES_ABI,
  fetchCircleMessage,
  getDestinationConfig,
  isCCTPMessageConsumed,
  reconcileCCTPTransfer,
};
