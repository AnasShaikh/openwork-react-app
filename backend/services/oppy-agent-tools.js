'use strict';

const { Web3 } = require('web3');
const config = require('../config');
const { readCrossChainActionStatus } = require('./cross-chain-action-status');
const { getJobDeepDive } = require('./oppy-explorer');
const {
  formatNativeWei,
  latestFundingRequirement,
  readNativeBalance,
} = require('./oppy-native-balance');

const VALID_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const CROSS_CHAIN_ACTIONS = new Set(['postJob', 'startDirectContract', 'releasePayment']);
const JOB_CREATION_ACTIONS = new Set(['postJob', 'startDirectContract']);
const JOB_CREATION_BY_SELECTOR = new Map([
  ['0x4b18d3c2', 'postJob'],
  ['0xd3988d47', 'postJob'],
  ['0x6caa5397', 'startDirectContract'],
  ['0x03edef0e', 'startDirectContract'],
]);
const CHAIN_BY_JOB_PREFIX = new Map([
  ['42161', 42161],
  ['30110', 42161],
  ['30111', 10],
  ['30365', 50],
]);
const CHAIN_CONFIG = {
  10: {
    name: 'Optimism', symbol: 'ETH', rpc: () => config.OPTIMISM_RPC,
    publicRpcs: ['https://mainnet.optimism.io'], usdc: () => config.getContractAddress('USDC_OP'),
  },
  50: {
    name: 'XDC Network', symbol: 'XDC', rpc: () => config.XDC_RPC,
    publicRpcs: ['https://rpc.xinfin.network', 'https://xdc.public-rpc.com'], usdc: () => config.getContractAddress('USDC_XDC'),
  },
  42161: {
    name: 'Arbitrum One', symbol: 'ETH', rpc: () => config.ARBITRUM_RPC,
    publicRpcs: ['https://arb1.arbitrum.io/rpc'], usdc: () => config.getContractAddress('USDC_ARB'),
  },
};
const ERC20_BALANCE_ABI = [{
  inputs: [{ name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}];

function unique(values) {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function inferChainFromJobId(jobId) {
  return VALID_JOB_ID.test(jobId || '') ? CHAIN_BY_JOB_PREFIX.get(String(jobId).split('-')[0]) || null : null;
}

function conversationReferences(message, history = []) {
  const texts = [
    ...(Array.isArray(history) ? history.map((entry) => String(entry?.text || '')) : []),
    String(message || ''),
  ];
  let transactionHash = null;
  let jobId = null;
  let chainId = null;
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index];
    if (!transactionHash) transactionHash = (text.match(/0x[a-fA-F0-9]{64}(?![a-fA-F0-9])/) || [])[0] || null;
    if (!jobId) jobId = (text.match(/\b\d+-\d+\b/) || [])[0] || null;
    if (!chainId) {
      if (/xdcscan\.com|\bxdc\b/i.test(text)) chainId = 50;
      else if (/optimistic\.etherscan\.io|\boptimism\b/i.test(text)) chainId = 10;
      else if (/arbiscan\.io|\barbitrum\b/i.test(text)) chainId = 42161;
    }
    if (transactionHash && jobId && chainId) break;
  }
  return { transactionHash, jobId, chainId };
}

function currentMessageReferences(message) {
  return conversationReferences(message, []);
}

function activeContextJobId(context = {}) {
  const memoryJobId = context.memory?.activeJob?.jobId;
  if (VALID_JOB_ID.test(memoryJobId || '')) return memoryJobId;
  const serverJobId = context.jobContext?.activeJob?.jobId;
  return VALID_JOB_ID.test(serverJobId || '') ? serverJobId : null;
}

function resolveGroundedJobId(params = {}, context = {}) {
  const current = currentMessageReferences(context.message);
  if (VALID_JOB_ID.test(current.jobId || '')) return current.jobId;

  // A model-generated tool argument is only a hint. When the user uses a
  // pronoun or asks an unqualified follow-up, bind it to the active job rather
  // than allowing an older ID copied from chat history to steal the turn.
  const activeJobId = activeContextJobId(context);
  if (activeJobId) return activeJobId;

  if (VALID_JOB_ID.test(params.jobId || '')) return params.jobId;
  const historical = conversationReferences(context.message, context.history);
  return VALID_JOB_ID.test(historical.jobId || '') ? historical.jobId : null;
}

function resolveTransactionTarget(params = {}, context = {}) {
  const memory = context.memory || {};
  const currentRefs = currentMessageReferences(context.message);
  const refs = conversationReferences(context.message, context.history);
  const transactions = Array.isArray(memory.recentTransactions) ? memory.recentTransactions : [];
  const recent = [...transactions].reverse();
  const activeJob = memory.activeJob || context.jobContext?.activeJob || null;
  const activeJobId = VALID_JOB_ID.test(activeJob?.jobId || '') ? activeJob.jobId : null;
  const hasCurrentReference = Boolean(currentRefs.transactionHash || currentRefs.jobId);
  const requestedHash = currentRefs.transactionHash
    || (!hasCurrentReference && !activeJobId ? params.transactionHash || refs.transactionHash : null);
  const requestedJobId = currentRefs.jobId
    || (!hasCurrentReference && activeJobId ? activeJobId : null)
    || (!hasCurrentReference ? params.jobId || refs.jobId : null);
  const candidate = (requestedHash && recent.find((entry) => entry.txHash?.toLowerCase() === requestedHash.toLowerCase()))
    || (requestedJobId && recent.find((entry) => entry.jobId === requestedJobId))
    || recent[0]
    || null;
  const diagnostic = memory.latestTransactionDiagnostic || null;
  const transactionHash = requestedHash
    || candidate?.txHash
    || (VALID_TX_HASH.test(diagnostic?.txHash || '') ? diagnostic.txHash : null)
    || (VALID_TX_HASH.test(activeJob?.sourceTxHash || '') ? activeJob.sourceTxHash : null);
  const jobId = requestedJobId || candidate?.jobId || diagnostic?.jobId || activeJob?.jobId || null;
  const chainId = Number(params.chainId
    || candidate?.chainId
    || diagnostic?.chainId
    || activeJob?.sourceChainId
    || refs.chainId
    || inferChainFromJobId(jobId)
    || context.wallet?.chainId) || null;
  const action = params.action || candidate?.action || diagnostic?.action || null;
  return {
    action,
    jobId: VALID_JOB_ID.test(jobId || '') ? jobId : null,
    transactionHash: VALID_TX_HASH.test(transactionHash || '') ? transactionHash : null,
    chainId: CHAIN_CONFIG[chainId] ? chainId : null,
    targetDomain: candidate?.targetDomain ?? null,
    baselineTotalPaidRaw: candidate?.baselineTotalPaidRaw ?? null,
    rememberedConfirmed: candidate?.confirmed === true || activeJob?.sourceReceiptConfirmed === true,
    rememberedDelivery: candidate?.delivery || null,
    diagnostic,
  };
}

function receiptSucceeded(status) {
  return status === true || status === 1 || status === 1n || status === '1' || status === '0x1';
}

function serializeReceipt(receipt) {
  if (!receipt) return null;
  const succeeded = receiptSucceeded(receipt.status);
  return {
    state: succeeded ? 'confirmed' : 'reverted',
    confirmed: succeeded,
    reverted: !succeeded,
    blockNumber: receipt.blockNumber === undefined || receipt.blockNumber === null ? null : String(receipt.blockNumber),
    transactionHash: receipt.transactionHash || null,
  };
}

async function readTransactionReceipt(chainId, transactionHash, dependencies = {}) {
  if (dependencies.readTransactionReceipt) {
    const injected = await dependencies.readTransactionReceipt(chainId, transactionHash);
    if (injected?.state) return injected;
    return injected ? serializeReceipt(injected) : { state: 'pending', confirmed: false, reverted: false, blockNumber: null };
  }
  const chain = CHAIN_CONFIG[Number(chainId)];
  if (!chain || !VALID_TX_HASH.test(transactionHash || '')) throw new Error('A supported chain and transaction hash are required');
  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  const checks = unique([chain.rpc(), ...chain.publicRpcs]).map(async (rpcUrl) => {
    const web3 = createWeb3(rpcUrl);
    return withTimeout(
      Promise.resolve(web3.eth.getTransactionReceipt(transactionHash)),
      dependencies.timeoutMs || 6000,
      `${chain.name} receipt check`,
    );
  });
  const settled = await Promise.allSettled(checks);
  const confirmed = settled.find((entry) => entry.status === 'fulfilled' && entry.value);
  if (confirmed) return serializeReceipt(confirmed.value);
  if (settled.some((entry) => entry.status === 'fulfilled')) {
    return { state: 'pending', confirmed: false, reverted: false, blockNumber: null, transactionHash };
  }
  return { state: 'unavailable', confirmed: false, reverted: false, blockNumber: null, transactionHash };
}

async function readJobCreationTransaction(chainId, transactionHash, dependencies = {}) {
  if (dependencies.readJobCreationTransaction) {
    return dependencies.readJobCreationTransaction(chainId, transactionHash);
  }
  const chain = CHAIN_CONFIG[Number(chainId)];
  if (!chain || !VALID_TX_HASH.test(transactionHash || '')) {
    return { available: false, action: null, type: null, explanation: 'A supported source chain and transaction hash are required.' };
  }
  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  const checks = unique([chain.rpc(), ...chain.publicRpcs]).map(async (rpcUrl) => {
    const web3 = createWeb3(rpcUrl);
    return withTimeout(
      Promise.resolve(web3.eth.getTransaction(transactionHash)),
      dependencies.timeoutMs || 6000,
      `${chain.name} transaction-input check`,
    );
  });
  const settled = await Promise.allSettled(checks);
  const transaction = settled.find((entry) => entry.status === 'fulfilled' && entry.value)?.value || null;
  if (!transaction) {
    return {
      available: false,
      action: null,
      type: null,
      transactionHash,
      chainId: Number(chainId),
      explanation: 'The source transaction calldata is temporarily unavailable.',
    };
  }
  const input = String(transaction.input || transaction.data || '');
  const selector = /^0x[a-fA-F0-9]{8}/.test(input) ? input.slice(0, 10).toLowerCase() : null;
  const action = selector ? JOB_CREATION_BY_SELECTOR.get(selector) || null : null;
  const sourceReceiptConfirmed = transaction.blockNumber !== undefined && transaction.blockNumber !== null;
  return {
    available: Boolean(action) && sourceReceiptConfirmed,
    action,
    type: action === 'startDirectContract' ? 'direct-contract' : (action === 'postJob' ? 'marketplace-posting' : null),
    selector,
    transactionHash,
    chainId: Number(chainId),
    to: VALID_ADDRESS.test(transaction.to || '') ? transaction.to : null,
    sourceReceiptConfirmed,
    evidenceSource: 'live-source-calldata',
    explanation: action && sourceReceiptConfirmed
      ? 'Creation type was decoded from the mined source transaction selector.'
      : action
        ? 'The source transaction creation selector is recognized, but the transaction is not mined yet.'
      : 'The live source transaction does not call a recognized OpenWork job-creation selector.',
  };
}

function compactCrossChainStatus(status) {
  if (!status) return null;
  return {
    state: status.state,
    complete: status.complete === true,
    checkedAt: status.checkedAt || null,
    source: status.source || null,
    networkDelivery: status.layerZero ? {
      state: status.layerZero.state,
      destinationTxHash: status.layerZero.destinationTxHash || null,
      error: status.layerZero.error || null,
    } : null,
    openWork: status.canonical ? {
      state: status.canonical.state,
      jobExists: status.canonical.jobExists === true,
      statusCode: status.canonical.statusCode,
      totalPaid: status.canonical.totalPaid,
      currentMilestone: status.canonical.currentMilestone,
      error: status.canonical.error || null,
    } : null,
    paymentDelivery: status.cctp ? {
      required: status.cctp.required === true,
      state: status.cctp.state,
      targetChainName: status.cctp.targetChainName || null,
      amountRaw: status.cctp.amountRaw || null,
      reason: status.cctp.reason || null,
      error: status.cctp.error || null,
    } : null,
    links: status.links || null,
  };
}

function compactDiagnostic(diagnostic) {
  if (!diagnostic) return null;
  return {
    action: diagnostic.action || null,
    jobId: diagnostic.jobId || null,
    chainId: diagnostic.chainId || null,
    chainName: diagnostic.chainName || null,
    walletName: diagnostic.walletName || null,
    phase: diagnostic.phase || null,
    step: diagnostic.step || null,
    status: diagnostic.status || null,
    summary: diagnostic.summary || null,
    nextStep: diagnostic.nextStep || null,
    transactionHash: diagnostic.txHash || null,
    approvalTransactionHash: diagnostic.approvalTxHash || null,
    safeToRetry: diagnostic.safeToRetry === true,
    checks: diagnostic.checks || {},
    error: diagnostic.error || null,
    updatedAt: diagnostic.updatedAt || null,
  };
}

async function inspectTransaction(params, context, dependencies = {}) {
  const target = resolveTransactionTarget(params, context);
  if (!target.transactionHash || !target.chainId) {
    return {
      kind: 'transaction-status',
      available: false,
      state: target.diagnostic?.status || 'not-broadcast',
      explanation: target.diagnostic?.txHash
        ? 'A transaction hash exists, but its source chain could not be resolved.'
        : 'No broadcast transaction hash is recorded for the referenced action.',
      latestAttempt: compactDiagnostic(target.diagnostic),
      safeToRetry: target.diagnostic?.safeToRetry === true,
    };
  }

  const source = await (dependencies.readTransactionReceipt || readTransactionReceipt)(
    target.chainId,
    target.transactionHash,
    dependencies,
  ).catch(() => ({ state: 'unavailable', confirmed: false, reverted: false, blockNumber: null }));
  const sourceConfirmed = source.confirmed === true || (source.state === 'unavailable' && target.rememberedConfirmed);
  let delivery = null;
  if (sourceConfirmed
    && CROSS_CHAIN_ACTIONS.has(target.action)
    && [10, 50].includes(target.chainId)
    && target.jobId) {
    delivery = await (dependencies.readCrossChainActionStatus || readCrossChainActionStatus)({
      action: target.action,
      jobId: target.jobId,
      sourceChainId: target.chainId,
      sourceTxHash: target.transactionHash,
      targetDomain: target.targetDomain,
      baselineTotalPaidRaw: target.baselineTotalPaidRaw,
    }).then(compactCrossChainStatus).catch((error) => ({
      state: 'unavailable',
      complete: false,
      checkedAt: new Date().toISOString(),
      error: error.message || 'Cross-chain status is temporarily unavailable',
    }));
  }
  const complete = delivery ? delivery.complete === true : sourceConfirmed;
  const safeToRetry = source.reverted === true || (!target.transactionHash && target.diagnostic?.safeToRetry === true);
  return {
    kind: 'transaction-status',
    available: true,
    action: target.action,
    jobId: target.jobId,
    chainId: target.chainId,
    chainName: CHAIN_CONFIG[target.chainId].name,
    transactionHash: target.transactionHash,
    source: {
      ...source,
      confirmed: sourceConfirmed,
      rememberedReceiptUsed: source.state === 'unavailable' && target.rememberedConfirmed,
    },
    delivery: delivery || target.rememberedDelivery,
    complete,
    safeToRetry,
    retryInstruction: complete
      ? 'No retry is needed.'
      : (safeToRetry ? 'The prior transaction reverted; correct the reported cause before preparing a fresh review.' : 'Do not retry while the outcome is pending or unavailable.'),
    latestAttempt: compactDiagnostic(target.diagnostic),
  };
}

function formatUsdcRaw(raw) {
  const value = BigInt(raw || 0);
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function decimalUsdcToRaw(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'))).toString();
}

function preparedUsdcRequirement(memory = {}) {
  const prepared = memory.lastPreparedAction;
  if (!prepared?.name) return null;
  if (prepared.name === 'startDirectContract') {
    const raw = decimalUsdcToRaw(prepared.params?.budget);
    return raw === null ? null : { action: prepared.name, requiredRaw: raw, basis: 'direct-contract budget' };
  }
  if (prepared.name === 'raiseDispute') {
    const raw = decimalUsdcToRaw(prepared.params?.compensation);
    return raw === null ? null : { action: prepared.name, requiredRaw: raw, basis: 'oracle fee' };
  }
  if (['postJob', 'applyToJob', 'submitWork', 'releasePayment', 'createProfile'].includes(prepared.name)) {
    return { action: prepared.name, requiredRaw: '0', basis: 'this action does not transfer wallet USDC' };
  }
  return { action: prepared.name, requiredRaw: null, basis: 'the exact USDC requirement is resolved during the inline preflight' };
}

async function readUsdcBalance(chainId, address, dependencies = {}) {
  if (dependencies.readUsdcBalance) return BigInt(await dependencies.readUsdcBalance(chainId, address));
  const chain = CHAIN_CONFIG[Number(chainId)];
  const tokenAddress = chain?.usdc();
  if (!chain || !VALID_ADDRESS.test(address || '') || !VALID_ADDRESS.test(tokenAddress || '')) {
    throw new Error('A supported wallet and USDC contract are required');
  }
  const createWeb3 = dependencies.createWeb3 || ((rpcUrl) => new Web3(rpcUrl));
  const attempts = unique([chain.rpc(), ...chain.publicRpcs]).map(async (rpcUrl) => {
    const web3 = createWeb3(rpcUrl);
    const token = new web3.eth.Contract(ERC20_BALANCE_ABI, tokenAddress);
    return BigInt(await withTimeout(
      Promise.resolve(token.methods.balanceOf(address).call()),
      dependencies.timeoutMs || 6000,
      `${chain.name} USDC balance check`,
    ));
  });
  return Promise.any(attempts);
}

async function inspectWalletFunding(params, context, dependencies = {}) {
  const wallet = context.wallet || {};
  if (!wallet.connected || !VALID_ADDRESS.test(wallet.address || '')) {
    return { kind: 'wallet-funding', available: false, explanation: 'Connect the wallet you intend to use so Oppy can inspect it without requesting a signature.' };
  }
  const chainId = Number(params.chainId
    || context.memory?.latestTransactionDiagnostic?.chainId
    || wallet.chainId);
  const chain = CHAIN_CONFIG[chainId];
  if (!chain) return { kind: 'wallet-funding', available: false, explanation: 'Select Arbitrum, Optimism, or XDC before checking funding.' };

  const [nativeResult, usdcResult] = await Promise.allSettled([
    (dependencies.readNativeBalance || readNativeBalance)(chainId, wallet.address, dependencies),
    (dependencies.readUsdcBalance || readUsdcBalance)(chainId, wallet.address, dependencies),
  ]);
  const nativeWei = nativeResult.status === 'fulfilled' ? BigInt(nativeResult.value) : null;
  const usdcRaw = usdcResult.status === 'fulfilled' ? BigInt(usdcResult.value) : null;
  const nativeRequirement = latestFundingRequirement(context.memory, chainId);
  const usdcRequirement = preparedUsdcRequirement(context.memory);
  return {
    kind: 'wallet-funding',
    available: nativeWei !== null || usdcRaw !== null,
    walletAddress: wallet.address,
    chainId,
    chainName: chain.name,
    native: {
      symbol: chain.symbol,
      balance: nativeWei === null ? null : formatNativeWei(nativeWei),
      balanceWei: nativeWei?.toString() || null,
      required: nativeRequirement ? formatNativeWei(nativeRequirement.requiredWei) : null,
      requiredWei: nativeRequirement?.requiredWei.toString() || null,
      sufficient: nativeWei !== null && nativeRequirement ? nativeWei >= nativeRequirement.requiredWei : null,
      error: nativeResult.status === 'rejected' ? 'Live native balance unavailable' : null,
    },
    usdc: {
      balance: usdcRaw === null ? null : formatUsdcRaw(usdcRaw),
      balanceRaw: usdcRaw?.toString() || null,
      required: usdcRequirement?.requiredRaw === null || usdcRequirement?.requiredRaw === undefined
        ? null
        : formatUsdcRaw(usdcRequirement.requiredRaw),
      requiredRaw: usdcRequirement?.requiredRaw ?? null,
      sufficient: usdcRaw !== null && usdcRequirement?.requiredRaw !== null && usdcRequirement?.requiredRaw !== undefined
        ? usdcRaw >= BigInt(usdcRequirement.requiredRaw)
        : null,
      basis: usdcRequirement?.basis || null,
      error: usdcResult.status === 'rejected' ? 'Live USDC balance unavailable' : null,
    },
    latestAttempt: compactDiagnostic(context.memory?.latestTransactionDiagnostic),
  };
}

function resolveJobCreationProvenance(jobId, context = {}) {
  const recent = Array.isArray(context.memory?.recentTransactions)
    ? context.memory.recentTransactions
    : [];
  const durable = Array.isArray(context.jobContext?.durableTransactions)
    ? context.jobContext.durableTransactions
    : [];
  const isCreationProof = (transaction) => transaction?.jobId === jobId
    && JOB_CREATION_ACTIONS.has(transaction.action)
    && transaction.confirmed === true
    && VALID_TX_HASH.test(transaction.txHash || '');
  // Durable server history is stronger than browser memory. The latter is a
  // fallback for deployments without a database or while server persistence is
  // unavailable, and only a confirmed source receipt can establish creation.
  const durableCandidate = [...durable].reverse().find(isCreationProof);
  const recentCandidate = [...recent].reverse().find(isCreationProof);
  const candidate = durableCandidate || recentCandidate;
  if (!candidate) {
    return {
      available: false,
      type: null,
      action: null,
      explanation: 'Creation type is not proven by the available source-transaction history. Do not infer it from lifecycle status.',
    };
  }
  return {
    available: true,
    type: candidate.action === 'startDirectContract' ? 'direct-contract' : 'marketplace-posting',
    action: candidate.action,
    transactionHash: VALID_TX_HASH.test(candidate.txHash || '') ? candidate.txHash : null,
    chainId: Number.isInteger(Number(candidate.chainId)) ? Number(candidate.chainId) : null,
    sourceReceiptConfirmed: candidate.confirmed === true,
    evidenceSource: durableCandidate ? 'durable-server-history' : 'browser-confirmed-history',
    explanation: candidate.action === 'startDirectContract'
      ? 'The recorded creation action is startDirectContract.'
      : 'The recorded creation action is postJob.',
  };
}

async function verifyJobCreationProvenance(jobId, context = {}, dependencies = {}) {
  const recorded = resolveJobCreationProvenance(jobId, context);
  const active = context.memory?.activeJob?.jobId === jobId
    ? context.memory.activeJob
    : (context.jobContext?.activeJob?.jobId === jobId ? context.jobContext.activeJob : null);
  const transactionHash = recorded.transactionHash
    || (VALID_TX_HASH.test(active?.sourceTxHash || '') ? active.sourceTxHash : null);
  const chainId = recorded.chainId || Number(active?.sourceChainId) || inferChainFromJobId(jobId);
  if (transactionHash && CHAIN_CONFIG[chainId]) {
    const live = await (dependencies.readJobCreationTransaction || readJobCreationTransaction)(
      chainId,
      transactionHash,
      dependencies,
    ).catch(() => ({ available: false }));
    if (live?.available) return live;
  }
  return recorded.available
    ? { ...recorded, liveCalldataAvailable: false }
    : recorded;
}

function isJobCreationProvenanceQuestion(message) {
  const text = String(message || '').trim();
  if (!text || !/\b(?:direct\s+(?:contract|job)|marketplace(?:\s+(?:job|posting))?|regular\s+job)\b/i.test(text)) {
    return false;
  }
  return /^(?:was|is|did|what|which|check|tell\s+me|can\s+you\s+check|could\s+you\s+check)\b/i.test(text)
    || /\b(?:was|is)\s+(?:this|that|it|the\s+job|job\s+\d+-\d+)\b/i.test(text)
    || /\b(?:creation|created|creation\s+type|kind\s+of\s+job|type\s+of\s+job)\b/i.test(text);
}

async function resolveJobCreationProvenanceAnswer(message, context = {}, dependencies = {}) {
  if (!isJobCreationProvenanceQuestion(message)) return null;
  const explicitIds = String(message || '').match(/\b\d+-\d+\b/g);
  const jobId = explicitIds?.at(-1) || context.memory?.activeJob?.jobId || context.jobContext?.activeJob?.jobId;
  if (!VALID_JOB_ID.test(jobId || '')) {
    return {
      kind: 'job-creation-provenance',
      jobId: null,
      creation: {
        available: false,
        action: null,
        type: null,
        evidenceSource: null,
        explanation: 'No exact job ID or confirmed source transaction could be resolved.',
      },
      text: 'I cannot verify the creation type yet because I cannot resolve an exact job and its confirmed source transaction. I will not infer direct-contract versus marketplace creation from the job title or current status.',
    };
  }
  const creation = await verifyJobCreationProvenance(jobId, context, dependencies);
  if (!creation.available) {
    return {
      kind: 'job-creation-provenance',
      jobId,
      creation,
      text: `I cannot independently verify how job **${jobId}** was created because its confirmed source-transaction evidence is unavailable. I will not infer direct-contract versus marketplace creation from its title or lifecycle status.`,
    };
  }
  const isLive = creation.evidenceSource === 'live-source-calldata';
  const evidence = isLive
    ? `I decoded selector \`${creation.selector}\` from its live source transaction calldata`
    : 'OpenWork\'s confirmed transaction history records the creation action; the live calldata check is temporarily unavailable';
  const text = creation.type === 'direct-contract'
    ? `Job **${jobId}** was created as a **direct contract**. ${evidence}. The job's current lifecycle status was not used to decide this.`
    : `Job **${jobId}** was created as a **marketplace posting**, not a direct contract. ${evidence}. A title or an Open/In progress status cannot change how the job was created.`;
  return { kind: 'job-creation-provenance', jobId, creation, text };
}

function compactJobDeepDive(deepDive, creation, fundingDelivery = null) {
  return {
    kind: 'job-state',
    available: true,
    generatedAt: deepDive.generatedAt,
    job: deepDive.job,
    milestones: Array.isArray(deepDive.milestones) ? deepDive.milestones.slice(0, 12) : [],
    applicationCount: deepDive.job?.applicationCount ?? deepDive.applications?.length ?? 0,
    submissionCount: deepDive.job?.submissionCount ?? deepDive.submissions?.length ?? 0,
    nextAction: deepDive.nextAction || null,
    creation,
    fundingDelivery,
  };
}

async function readCreationFundingDelivery(jobId, creation, dependencies = {}) {
  if (creation?.action !== 'startDirectContract'
    || !VALID_TX_HASH.test(creation.transactionHash || '')
    || ![10, 50].includes(Number(creation.chainId))) {
    return null;
  }
  return (dependencies.readCrossChainActionStatus || readCrossChainActionStatus)({
    action: 'startDirectContract',
    jobId,
    sourceChainId: Number(creation.chainId),
    sourceTxHash: creation.transactionHash,
  }).then(compactCrossChainStatus).catch((error) => ({
    state: 'unavailable',
    complete: false,
    checkedAt: new Date().toISOString(),
    error: error.message || 'Direct-contract funding status is temporarily unavailable',
  }));
}

async function inspectJob(params, context, dependencies = {}) {
  const jobId = resolveGroundedJobId(params, context);
  if (!VALID_JOB_ID.test(jobId || '')) {
    return { kind: 'job-state', available: false, explanation: 'No active or explicitly referenced OpenWork job could be resolved.' };
  }
  const creation = await verifyJobCreationProvenance(jobId, context, dependencies);
  const fundingDelivery = await readCreationFundingDelivery(jobId, creation, dependencies);
  try {
    const deepDive = await (dependencies.getJobDeepDive || getJobDeepDive)(jobId, context.wallet?.address || null, dependencies);
    return compactJobDeepDive(deepDive, creation, fundingDelivery);
  } catch (error) {
    const cached = context.jobContext?.jobs?.find((job) => job.jobId === jobId)
      || (context.jobContext?.activeJob?.jobId === jobId ? context.jobContext.activeJob : null);
    return {
      kind: 'job-state',
      available: Boolean(cached),
      job: cached || { jobId },
      creation,
      fundingDelivery,
      explanation: cached
        ? 'The latest wallet context is available, but a fresh canonical deep-dive read failed.'
        : 'The canonical job could not be loaded from the live RPC.',
      error: error.message || 'Job read unavailable',
    };
  }
}

function inspectLatestAttempt(context) {
  const memory = context.memory || {};
  const latestTransaction = Array.isArray(memory.recentTransactions) ? memory.recentTransactions.at(-1) || null : null;
  return {
    kind: 'latest-attempt',
    available: Boolean(memory.latestTransactionDiagnostic || memory.lastPreparedAction || latestTransaction),
    diagnostic: compactDiagnostic(memory.latestTransactionDiagnostic),
    preparedAction: memory.lastPreparedAction || null,
    recentTransaction: latestTransaction,
    activeJob: memory.activeJob || null,
    safety: memory.latestTransactionDiagnostic?.safeToRetry === true
      ? 'The client marked this exact attempt safe to prepare again.'
      : 'Do not prepare a duplicate while retry protection is active or the outcome is unknown.',
  };
}

async function executeOppyReadTool(tool, context, dependencies = {}) {
  if (!tool || tool.kind !== 'read') throw new Error('A validated read-only Oppy tool is required');
  if (tool.name === 'inspectTransaction') return inspectTransaction(tool.params, context, dependencies);
  if (tool.name === 'inspectWalletFunding') return inspectWalletFunding(tool.params, context, dependencies);
  if (tool.name === 'inspectJob') return inspectJob(tool.params, context, dependencies);
  if (tool.name === 'inspectLatestAttempt') return inspectLatestAttempt(context);
  throw new Error('Unsupported read-only Oppy tool');
}

module.exports = {
  CHAIN_CONFIG,
  compactCrossChainStatus,
  conversationReferences,
  currentMessageReferences,
  executeOppyReadTool,
  inspectJob,
  inspectLatestAttempt,
  inspectTransaction,
  inspectWalletFunding,
  preparedUsdcRequirement,
  readJobCreationTransaction,
  readCreationFundingDelivery,
  readTransactionReceipt,
  readUsdcBalance,
  isJobCreationProvenanceQuestion,
  resolveJobCreationProvenance,
  resolveJobCreationProvenanceAnswer,
  resolveGroundedJobId,
  resolveTransactionTarget,
  verifyJobCreationProvenance,
};
