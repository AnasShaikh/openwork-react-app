'use strict';

const { Web3 } = require('web3');
const config = require('../config');

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const PUBLIC_RPC_FALLBACKS = {
  50: ['https://rpc.xinfin.network', 'https://erpc.xinfin.network'],
  10: ['https://mainnet.optimism.io'],
  42161: ['https://arb1.arbitrum.io/rpc'],
};
const CHAINS = {
  50: { name: 'XDC Network', symbol: 'XDC', rpcUrl: () => config.XDC_RPC },
  10: { name: 'Optimism', symbol: 'ETH', rpcUrl: () => config.OPTIMISM_RPC },
  42161: { name: 'Arbitrum One', symbol: 'ETH', rpcUrl: () => config.ARBITRUM_RPC },
};

function unique(values) {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function isNativeBalanceQuestion(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text || /\busdc\b/.test(text)) return false;
  const fundingWord = /\b(balance|enough|afford|cover|funds?|gas|network fee|how much)\b/.test(text);
  const nativeContext = /\b(xdc|eth|native token|wallet|transaction|tx|post|release|submit)\b/.test(text);
  return fundingWord && nativeContext;
}

function inferChainId(message, wallet = {}) {
  const text = String(message || '').toLowerCase();
  if (/\bxdc\b/.test(text)) return 50;
  if (/\boptimism\b|\bop mainnet\b/.test(text)) return 10;
  if (/\barbitrum\b|\barb one\b/.test(text)) return 42161;
  return CHAINS[Number(wallet.chainId)] ? Number(wallet.chainId) : null;
}

function formatNativeWei(value, precision = 6) {
  const amount = BigInt(value || 0);
  const base = 10n ** 18n;
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(18, '0').slice(0, precision).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function readNativeBalance(chainId, address, dependencies = {}) {
  if (dependencies.readBalance) return BigInt(await dependencies.readBalance(chainId, address));
  const chain = CHAINS[Number(chainId)];
  if (!chain) throw new Error(`Unsupported native balance chain ${chainId}`);
  const rpcUrls = unique([chain.rpcUrl(), ...(PUBLIC_RPC_FALLBACKS[chainId] || [])]);
  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  const attempts = rpcUrls.map(async (rpcUrl) => {
    const web3 = createWeb3(rpcUrl);
    return BigInt(await withTimeout(
      Promise.resolve(web3.eth.getBalance(address)),
      dependencies.timeoutMs || 6000,
      `${chain.name} balance read`,
    ));
  });
  return Promise.any(attempts);
}

function latestFundingRequirement(memory = {}, chainId) {
  const diagnostic = memory.latestTransactionDiagnostic;
  const checks = diagnostic?.checks;
  if (Number(diagnostic?.chainId) !== Number(chainId)) return null;
  if (typeof checks?.nativeRequiredWei !== 'string' || !/^\d+$/.test(checks.nativeRequiredWei)) return null;
  return {
    requiredWei: BigInt(checks.nativeRequiredWei),
    gasIncluded: checks.nativeFundingGasIncluded === true,
    checkedAt: checks.nativeFundingCheckedAt || diagnostic.updatedAt || null,
  };
}

function answerFromBalance({ chain, balanceWei, requirement }) {
  const balance = formatNativeWei(balanceWei);
  if (!requirement) {
    return `Your live ${chain.symbol} balance is **${balance} ${chain.symbol}**. `
      + `Oppy read this directly from ${chain.name}; an indexer is not needed. `
      + 'I cannot honestly say whether it is enough until the current action receives its live cross-chain quote. '
      + 'When you continue, Oppy now compares the full quote plus buffered gas before opening your wallet.';
  }

  const required = requirement.requiredWei;
  const sufficient = balanceWei >= required;
  const shortfall = sufficient ? 0n : required - balanceWei;
  const requirementLabel = requirement.gasIncluded ? 'including buffered gas' : 'before gas';
  if (sufficient) {
    return `Yes, based on the latest preflight. Your live balance is **${balance} ${chain.symbol}** and the action required about **${formatNativeWei(required)} ${chain.symbol}** ${requirementLabel}. `
      + 'Oppy will re-quote once more before opening your wallet because cross-chain fees can change.';
  }
  return `No. Your live balance is **${balance} ${chain.symbol}**, while the latest preflight required at least **${formatNativeWei(required)} ${chain.symbol}** ${requirementLabel}. `
    + `You are short by at least **${formatNativeWei(shortfall)} ${chain.symbol}**. No transaction was submitted; top up and retry.`;
}

async function resolveNativeBalanceAnswer(message, wallet = {}, memory = {}, dependencies = {}) {
  if (!isNativeBalanceQuestion(message)) return null;
  if (!wallet.connected || !ADDRESS_PATTERN.test(wallet.address || '')) {
    return {
      text: 'Connect the wallet you want to use, and Oppy can read its live native-token balance without requesting a signature.',
      chainId: null,
      balanceWei: null,
    };
  }

  const chainId = inferChainId(message, wallet);
  const chain = CHAINS[chainId];
  if (!chain) {
    return {
      text: 'Specify XDC, Optimism, or Arbitrum so Oppy can check the correct live balance.',
      chainId: null,
      balanceWei: null,
    };
  }

  try {
    const balanceWei = await readNativeBalance(chainId, wallet.address, dependencies);
    const requirement = latestFundingRequirement(memory, chainId);
    return {
      text: answerFromBalance({ chain, balanceWei, requirement }),
      chainId,
      chainName: chain.name,
      symbol: chain.symbol,
      balanceWei: balanceWei.toString(),
      requirementWei: requirement?.requiredWei.toString() || null,
    };
  } catch {
    return {
      text: `Oppy could not reach a live ${chain.name} RPC just now, so it cannot verify your ${chain.symbol} balance safely. No indexer is required; retry the balance check once the network endpoint responds.`,
      chainId,
      chainName: chain.name,
      symbol: chain.symbol,
      balanceWei: null,
    };
  }
}

module.exports = {
  answerFromBalance,
  formatNativeWei,
  inferChainId,
  isNativeBalanceQuestion,
  latestFundingRequirement,
  readNativeBalance,
  resolveNativeBalanceAnswer,
};
