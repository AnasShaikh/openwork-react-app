'use strict';

const { Web3 } = require('web3');
const config = require('../config');

const CACHE_TTL_MS = 5000;
const cache = new Map();

const DESTINATIONS = {
  2: () => ({
    domain: 2,
    chainId: config.isMainnet() ? 10 : 11155420,
    chainName: config.isMainnet() ? 'Optimism' : 'Optimism Sepolia',
    nativeSymbol: 'ETH',
    rpcUrl: config.OPTIMISM_RPC,
    rpcUrls: [config.OPTIMISM_RPC, 'https://mainnet.optimism.io'].filter(Boolean),
    receiver: config.CCTP_OP_ADDRESS,
    floorWei: BigInt(process.env.RELAYER_OP_MIN_WEI || '20000000000000'),
    fallbackGas: 320000n,
  }),
  3: () => ({
    domain: 3,
    chainId: config.isMainnet() ? 42161 : 421614,
    chainName: config.isMainnet() ? 'Arbitrum One' : 'Arbitrum Sepolia',
    nativeSymbol: 'ETH',
    rpcUrl: config.ARBITRUM_RPC,
    rpcUrls: [config.ARBITRUM_RPC, 'https://arb1.arbitrum.io/rpc'].filter(Boolean),
    receiver: config.MESSAGE_TRANSMITTER_ARB,
    floorWei: BigInt(process.env.RELAYER_ARB_MIN_WEI || '1000000000000000'),
    fallbackGas: 300000n,
  }),
  18: () => ({
    domain: 18,
    chainId: 50,
    chainName: 'XDC Network',
    nativeSymbol: 'XDC',
    rpcUrl: config.XDC_RPC,
    rpcUrls: [config.XDC_RPC, 'https://rpc.xinfin.network', 'https://erpc.xinfin.network'].filter(Boolean),
    receiver: config.CCTP_XDC_ADDRESS,
    floorWei: BigInt(process.env.RELAYER_XDC_MIN_WEI || '10000000000000000'),
    fallbackGas: 320000n,
  }),
};

function destinationDomainForAction({ action, sourceChainId, targetDomain }) {
  if (['startDirectContract', 'startJob', 'lockNextMilestone'].includes(action)) {
    return [42161, 421614].includes(Number(sourceChainId)) ? null : 3;
  }
  if (['releasePayment', 'settleDispute'].includes(action)) {
    const domain = Number(targetDomain);
    return Number.isInteger(domain) && domain !== 3 ? domain : null;
  }
  return null;
}

function serviceWalletAddress() {
  if (!config.WALL2_PRIVATE_KEY) return null;
  const web3 = new Web3();
  const key = config.WALL2_PRIVATE_KEY.startsWith('0x')
    ? config.WALL2_PRIVATE_KEY
    : `0x${config.WALL2_PRIVATE_KEY}`;
  return web3.eth.accounts.privateKeyToAccount(key).address;
}

async function defaultReadChainState(destination, walletAddress) {
  const rpcUrls = [...new Set([destination.rpcUrl, ...(destination.rpcUrls || [])].filter(Boolean))];
  if (!rpcUrls.length) throw new Error(`${destination.chainName} RPC is not configured`);
  let lastError = null;
  for (const rpcUrl of rpcUrls) {
    try {
      const web3 = new Web3(rpcUrl);
      const [balanceWei, gasPriceWei, receiverCode] = await Promise.all([
        web3.eth.getBalance(walletAddress),
        web3.eth.getGasPrice(),
        web3.eth.getCode(destination.receiver),
      ]);
      return { balanceWei, gasPriceWei, receiverCode };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`${destination.chainName} RPC is unavailable`);
}

async function readRelayerReadiness(input, dependencies = {}) {
  const destinationDomain = destinationDomainForAction(input || {});
  const recoverySupported = ['startDirectContract', 'releasePayment'].includes(input?.action)
    && [10, 50].includes(Number(input?.sourceChainId));
  if (destinationDomain === null) {
    return { required: false, ready: true, checkedAt: new Date().toISOString() };
  }

  const factory = DESTINATIONS[destinationDomain];
  if (!factory) throw new Error(`CCTP destination domain ${destinationDomain} is not supported`);
  const destination = factory();
  const walletAddress = dependencies.walletAddress || serviceWalletAddress();
  if (!walletAddress) {
    return {
      required: true,
      ready: false,
      reason: 'service_wallet_unconfigured',
      recoverySupported,
      destination: {
        domain: destination.domain,
        chainId: destination.chainId,
        chainName: destination.chainName,
        nativeSymbol: destination.nativeSymbol,
        receiver: destination.receiver,
      },
      checkedAt: new Date().toISOString(),
    };
  }

  const cacheKey = `${destination.chainId}:${walletAddress.toLowerCase()}`;
  const cached = !dependencies.disableCache && cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  let result;
  try {
    const readChainState = dependencies.readChainState || defaultReadChainState;
    const state = await readChainState(destination, walletAddress);
    const balanceWei = BigInt(state.balanceWei);
    const gasPriceWei = BigInt(state.gasPriceWei);
    const estimatedWei = gasPriceWei * destination.fallbackGas * 175n / 100n;
    const requiredWei = estimatedWei > destination.floorWei ? estimatedWei : destination.floorWei;
    const receiverAvailable = Boolean(state.receiverCode && state.receiverCode !== '0x' && !/^0x0+$/.test(state.receiverCode));
    const ready = receiverAvailable && balanceWei >= requiredWei;
    result = {
      required: true,
      ready,
      reason: !receiverAvailable ? 'destination_contract_unavailable' : (ready ? null : 'service_wallet_underfunded'),
      recoverySupported,
      walletAddress,
      balanceWei: balanceWei.toString(),
      requiredWei: requiredWei.toString(),
      shortfallWei: balanceWei >= requiredWei ? '0' : (requiredWei - balanceWei).toString(),
      destination: {
        domain: destination.domain,
        chainId: destination.chainId,
        chainName: destination.chainName,
        nativeSymbol: destination.nativeSymbol,
        receiver: destination.receiver,
      },
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    result = {
      required: true,
      ready: false,
      reason: 'destination_read_unavailable',
      recoverySupported,
      walletAddress,
      destination: {
        domain: destination.domain,
        chainId: destination.chainId,
        chainName: destination.chainName,
        nativeSymbol: destination.nativeSymbol,
        receiver: destination.receiver,
      },
      error: error.message,
      checkedAt: new Date().toISOString(),
    };
  }

  if (!dependencies.disableCache) cache.set(cacheKey, { at: Date.now(), value: result });
  return result;
}

module.exports = {
  DESTINATIONS,
  destinationDomainForAction,
  readRelayerReadiness,
};
