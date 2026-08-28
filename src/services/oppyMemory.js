import { getOppyActionSemanticConflict } from './oppyActionSemantics.js';

const STORAGE_PREFIX = 'openwork:oppy:memory:v2';
const MAX_MESSAGES = 60;
const MAX_TRANSACTIONS = 12;
const MAX_PREPARED_ACTION_BYTES = 12 * 1024;
const DIAGNOSTIC_STATES = new Set(['preparing', 'wallet', 'pending', 'confirmed', 'reverted', 'dropped', 'cancelled', 'failed', 'unknown']);
const DELIVERY_STATES = new Set(['checking', 'in-progress', 'requires-action', 'complete', 'failed', 'unavailable']);
const DELIVERY_STEP_STATES = new Set(['pending', 'delivered', 'complete', 'received', 'failed', 'unavailable']);
const TRANSACTION_ACTIONS = new Set([
  'postJob',
  'applyToJob',
  'startJob',
  'submitWork',
  'releasePayment',
  'raiseDispute',
  'createProfile',
  'startDirectContract',
]);

export const OPPY_JOB_GREETING = {
  role: 'bot',
  text: "Hi! I'm **Agent Oppy**. I can help you find work, manage jobs, and check payments across Arbitrum, Optimism, and XDC.",
};

const JOB_PREFIX_TO_CHAIN = {
  42161: { chainId: 42161, name: 'Arbitrum One' },
  30110: { chainId: 42161, name: 'Arbitrum One' },
  30111: { chainId: 10, name: 'Optimism' },
  30365: { chainId: 50, name: 'XDC Network' },
};

function storageKey(scope) {
  const normalized = String(scope || 'anonymous').toLowerCase().replace(/[^a-z0-9:_-]/g, '');
  return `${STORAGE_PREFIX}:${normalized || 'anonymous'}`;
}

function tableToBullets(text) {
  const lines = text.split('\n');
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index];
    const divider = lines[index + 1];
    if (!/^\s*\|.*\|\s*$/.test(header) || !/^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(divider || '')) {
      output.push(header);
      continue;
    }

    const headers = header.split('|').slice(1, -1).map((cell) => cell.trim());
    index += 1;
    while (index + 1 < lines.length && /^\s*\|.*\|\s*$/.test(lines[index + 1])) {
      const cells = lines[index + 1].split('|').slice(1, -1).map((cell) => cell.trim());
      const values = cells.flatMap((cell, cellIndex) => cell
        ? [`**${headers[cellIndex] || `Field ${cellIndex + 1}`}:** ${cell}`]
        : []);
      if (values.length) output.push(`- ${values.join(' · ')}`);
      index += 1;
    }
  }
  return output.join('\n');
}

export function sanitizeOppyText(value) {
  let text = typeof value === 'string' ? value : '';
  const containsInternalTrace = /<\/?(?:tool|tool_calls?|tool_response|function_calls?|function_response|invoke|parameter)\b/i.test(text);
  const tracePatterns = [
    /<(?:function_calls?|tool_calls?)\b[^>]*>[\s\S]*?<\/(?:function_calls?|tool_calls?)>/gi,
    /<invoke\b[^>]*>[\s\S]*?<\/invoke>/gi,
    /<tool_call\b[^>]*>[\s\S]*?<\/tool_call>/gi,
    /<tool_response\b[^>]*>[\s\S]*?<\/tool_response>/gi,
    /<function_call\b[^>]*>[\s\S]*?<\/function_call>/gi,
    /<function_response\b[^>]*>[\s\S]*?<\/function_response>/gi,
    /<tool\b[^>]*>[\s\S]*?<\/tool>/gi,
  ];
  for (const pattern of tracePatterns) text = text.replace(pattern, '');
  text = text
    .replace(/<(?:function_calls?|tool_calls?|invoke)\b[^>]*>[\s\S]*$/gi, '')
    .replace(/<\/?(?:tool|tool_calls?|tool_response|function_calls?|function_response|invoke|parameter)\b[^>]*>/gi, '');
  if (containsInternalTrace) return "I couldn't prepare that review card. Please try the action again.";
  return tableToBullets(text).replace(/\n{3,}/g, '\n\n').trim();
}

function cleanMessages(messages, fallback = []) {
  const cleaned = Array.isArray(messages)
    ? messages.flatMap((message) => {
        if (!message || message.isThinking || message.isTxCard || message.isDataCard) return [];
        const role = message.role === 'user' ? 'user' : (message.role === 'bot' || message.role === 'oppy' ? message.role : null);
        const text = sanitizeOppyText(message.text).slice(0, 5000);
        return role && text ? [{ role, text }] : [];
      }).slice(-MAX_MESSAGES)
    : [];
  return cleaned.length ? cleaned : fallback;
}

export function jobChainFromId(jobId) {
  if (typeof jobId !== 'string' || !/^\d+-\d+$/.test(jobId)) return null;
  return JOB_PREFIX_TO_CHAIN[Number(jobId.split('-')[0])] || null;
}

export function sanitizeActiveJob(activeJob) {
  if (!activeJob || typeof activeJob !== 'object' || !/^\d+-\d+$/.test(activeJob.jobId || '')) return null;
  const inferredChain = jobChainFromId(activeJob.jobId);
  return {
    jobId: activeJob.jobId,
    title: typeof activeJob.title === 'string' ? activeJob.title.trim().slice(0, 160) : null,
    sourceChainId: Number(activeJob.sourceChainId || inferredChain?.chainId) || null,
    sourceChainName: activeJob.sourceChainName || inferredChain?.name || null,
    sourceTxHash: typeof activeJob.sourceTxHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(activeJob.sourceTxHash)
      ? activeJob.sourceTxHash
      : null,
    sourceReceiptConfirmed: activeJob.sourceReceiptConfirmed === true,
  };
}

function cleanTransactions(transactions) {
  return Array.isArray(transactions)
    ? transactions.flatMap((transaction) => {
        if (!transaction || typeof transaction !== 'object') return [];
        const action = typeof transaction.action === 'string' ? transaction.action.trim().slice(0, 40) : '';
        const jobId = /^\d+-\d+$/.test(transaction.jobId || '') ? transaction.jobId : null;
        const txHash = /^0x[a-fA-F0-9]{64}$/.test(transaction.txHash || '') ? transaction.txHash : null;
        const targetDomain = transaction.targetDomain === null || transaction.targetDomain === undefined
          ? null
          : Number(transaction.targetDomain);
        const baselineTotalPaidRaw = typeof transaction.baselineTotalPaidRaw === 'string'
          && /^\d+$/.test(transaction.baselineTotalPaidRaw)
          ? transaction.baselineTotalPaidRaw
          : null;
        if (!action || (!jobId && !txHash)) return [];
        const delivery = transaction.delivery && typeof transaction.delivery === 'object'
          ? {
              state: DELIVERY_STATES.has(transaction.delivery.state) ? transaction.delivery.state : 'checking',
              complete: transaction.delivery.complete === true,
              networkState: DELIVERY_STEP_STATES.has(transaction.delivery.networkState) ? transaction.delivery.networkState : null,
              canonicalState: DELIVERY_STEP_STATES.has(transaction.delivery.canonicalState) ? transaction.delivery.canonicalState : null,
              paymentState: DELIVERY_STEP_STATES.has(transaction.delivery.paymentState) ? transaction.delivery.paymentState : null,
              destinationTxHash: /^0x[a-fA-F0-9]{64}$/.test(transaction.delivery.destinationTxHash || '')
                ? transaction.delivery.destinationTxHash
                : null,
              checkedAt: typeof transaction.delivery.checkedAt === 'string' ? transaction.delivery.checkedAt.slice(0, 40) : null,
            }
          : null;
        return [{
          action,
          jobId,
          txHash,
          chainId: Number(transaction.chainId) || null,
          confirmed: transaction.confirmed === true,
          targetDomain: Number.isInteger(targetDomain) ? targetDomain : null,
          baselineTotalPaidRaw,
          delivery,
        }];
      }).slice(-MAX_TRANSACTIONS)
    : [];
}

export function sanitizeTransactionDiagnostic(value) {
  if (!value || typeof value !== 'object') return null;
  const action = typeof value.action === 'string' ? value.action.trim().slice(0, 40) : '';
  const status = DIAGNOSTIC_STATES.has(value.status) ? value.status : 'unknown';
  if (!action) return null;
  const cleanHash = (hash) => (/^0x[a-fA-F0-9]{64}$/.test(hash || '') ? hash : null);
  const integerOrNull = (candidate) => (
    candidate !== null && candidate !== undefined && candidate !== '' && Number.isInteger(Number(candidate))
      ? Number(candidate)
      : null
  );
  const digitsOrNull = (candidate) => (
    typeof candidate === 'string' && /^\d+$/.test(candidate) ? candidate : null
  );
  const checks = value.checks && typeof value.checks === 'object' ? {
    rpcReachable: typeof value.checks.rpcReachable === 'boolean' ? value.checks.rpcReachable : null,
    walletReachable: typeof value.checks.walletReachable === 'boolean' ? value.checks.walletReachable : null,
    walletConnected: typeof value.checks.walletConnected === 'boolean' ? value.checks.walletConnected : null,
    accountMatches: typeof value.checks.accountMatches === 'boolean' ? value.checks.accountMatches : null,
    walletChainId: integerOrNull(value.checks.walletChainId),
    blockNumber: integerOrNull(value.checks.blockNumber),
    pendingNonceGap: integerOrNull(value.checks.pendingNonceGap),
    checkedAt: typeof value.checks.checkedAt === 'string' ? value.checks.checkedAt.slice(0, 40) : null,
    nativeBalanceWei: digitsOrNull(value.checks.nativeBalanceWei),
    nativeRequiredWei: digitsOrNull(value.checks.nativeRequiredWei),
    nativeValueWei: digitsOrNull(value.checks.nativeValueWei),
    nativeGasCostWei: digitsOrNull(value.checks.nativeGasCostWei),
    nativeShortfallWei: digitsOrNull(value.checks.nativeShortfallWei),
    nativeSymbol: typeof value.checks.nativeSymbol === 'string' ? value.checks.nativeSymbol.slice(0, 16) : null,
    nativeFundingSufficient: typeof value.checks.nativeFundingSufficient === 'boolean'
      ? value.checks.nativeFundingSufficient
      : null,
    nativeFundingGasIncluded: typeof value.checks.nativeFundingGasIncluded === 'boolean'
      ? value.checks.nativeFundingGasIncluded
      : null,
    nativeFundingCheckedAt: typeof value.checks.nativeFundingCheckedAt === 'string'
      ? value.checks.nativeFundingCheckedAt.slice(0, 40)
      : null,
  } : {};
  return {
    attemptId: typeof value.attemptId === 'string' ? value.attemptId.slice(0, 80) : null,
    attemptNumber: Math.max(1, Number(value.attemptNumber) || 1),
    action,
    jobId: /^\d+-\d+$/.test(value.jobId || '') ? value.jobId : null,
    walletName: typeof value.walletName === 'string' ? value.walletName.trim().slice(0, 80) : null,
    chainId: integerOrNull(value.chainId),
    chainName: typeof value.chainName === 'string' ? value.chainName.trim().slice(0, 80) : null,
    phase: typeof value.phase === 'string' ? value.phase.trim().slice(0, 24) : null,
    step: value.step === 'approval' ? 'approval' : 'action',
    status,
    summary: typeof value.summary === 'string' ? value.summary.trim().slice(0, 240) : null,
    nextStep: typeof value.nextStep === 'string' ? value.nextStep.trim().slice(0, 300) : null,
    txHash: cleanHash(value.txHash),
    approvalTxHash: cleanHash(value.approvalTxHash),
    safeToRetry: value.safeToRetry === true,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt.slice(0, 40) : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt.slice(0, 40) : null,
    checks,
    error: value.error && typeof value.error === 'object' ? {
      category: typeof value.error.category === 'string' ? value.error.category.slice(0, 40) : null,
      code: typeof value.error.code === 'string' || typeof value.error.code === 'number' ? value.error.code : null,
      message: typeof value.error.message === 'string' ? value.error.message.slice(0, 500) : null,
    } : null,
  };
}

export function sanitizePreparedAction(value) {
  if (!value || typeof value !== 'object' || !TRANSACTION_ACTIONS.has(value.name)) return null;
  if (!value.params || typeof value.params !== 'object' || Array.isArray(value.params)) return null;
  if (getOppyActionSemanticConflict(value)) return null;
  try {
    const serialized = JSON.stringify(value.params);
    if (!serialized || serialized.length > MAX_PREPARED_ACTION_BYTES) return null;
    const params = JSON.parse(serialized);
    return {
      name: value.name,
      kind: 'transaction',
      params,
      display: typeof value.display === 'string' ? value.display.trim().slice(0, 240) : '',
      requiresWalletSignature: true,
    };
  } catch {
    return null;
  }
}

export function loadOppyMemory(scope, fallbackMessages = [], storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(storageKey(scope)) || 'null');
    return {
      messages: cleanMessages(parsed?.messages, fallbackMessages),
      activeJob: sanitizeActiveJob(parsed?.activeJob),
      recentTransactions: cleanTransactions(parsed?.recentTransactions),
      latestTransactionDiagnostic: sanitizeTransactionDiagnostic(parsed?.latestTransactionDiagnostic),
      lastPreparedAction: sanitizePreparedAction(parsed?.lastPreparedAction),
    };
  } catch {
    return { messages: fallbackMessages, activeJob: null, recentTransactions: [], latestTransactionDiagnostic: null, lastPreparedAction: null };
  }
}

export function saveOppyMemory(scope, memory, storage = globalThis.localStorage) {
  try {
    storage?.setItem(storageKey(scope), JSON.stringify({
      messages: cleanMessages(memory?.messages),
      activeJob: sanitizeActiveJob(memory?.activeJob),
      recentTransactions: cleanTransactions(memory?.recentTransactions),
      latestTransactionDiagnostic: sanitizeTransactionDiagnostic(memory?.latestTransactionDiagnostic),
      lastPreparedAction: sanitizePreparedAction(memory?.lastPreparedAction),
      updatedAt: new Date().toISOString(),
    }));
  } catch { /* private browsing or storage quota: chat still works in memory */ }
}

export function activeJobFromMessage(message, currentActiveJob = null) {
  const explicitIds = String(message || '').match(/\b\d+-\d+\b/g);
  if (!explicitIds?.length) return sanitizeActiveJob(currentActiveJob);
  const jobId = explicitIds[explicitIds.length - 1];
  const inferredChain = jobChainFromId(jobId);
  const retained = currentActiveJob?.jobId === jobId ? currentActiveJob : {};
  return sanitizeActiveJob({
    ...retained,
    jobId,
    sourceChainId: retained.sourceChainId || inferredChain?.chainId,
    sourceChainName: retained.sourceChainName || inferredChain?.name,
  });
}

export function recordOppyTransaction(transactions, transaction) {
  const cleaned = cleanTransactions([...(transactions || []), transaction]);
  const seen = new Set();
  return cleaned.filter((entry) => {
    const key = entry.txHash || `${entry.action}:${entry.jobId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(-MAX_TRANSACTIONS);
}

export function updateOppyTransactionDelivery(transactions, tracking, status) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(tracking?.sourceTxHash || '') || !status || typeof status !== 'object') {
    return cleanTransactions(transactions);
  }
  const key = tracking.sourceTxHash.toLowerCase();
  return cleanTransactions((transactions || []).map((transaction) => (
    transaction?.txHash?.toLowerCase() === key
      ? {
          ...transaction,
          targetDomain: status.cctp?.targetDomain !== null
            && status.cctp?.targetDomain !== undefined
            && Number.isInteger(Number(status.cctp.targetDomain))
            ? Number(status.cctp.targetDomain)
            : transaction.targetDomain,
          delivery: {
            state: status.state,
            complete: status.complete === true,
            networkState: status.layerZero?.state || null,
            canonicalState: status.canonical?.state || null,
            paymentState: status.cctp?.state || null,
            destinationTxHash: status.layerZero?.destinationTxHash || null,
            checkedAt: status.checkedAt || new Date().toISOString(),
          },
        }
      : transaction
  )));
}

export function selectPendingCrossChainTransaction(transactions, activeJob = null) {
  const eligible = cleanTransactions(transactions).filter((transaction) => (
    ['startDirectContract', 'releasePayment'].includes(transaction.action)
    && transaction.confirmed
    && transaction.txHash
    && [10, 50].includes(Number(transaction.chainId))
    && transaction.delivery?.complete !== true
  ));
  if (!eligible.length) return null;

  const activeJobId = sanitizeActiveJob(activeJob)?.jobId || null;
  if (activeJobId) {
    // Never replace the current job's completed card with an unrelated stale
    // tracker merely because an older transaction remains unresolved in memory.
    return [...eligible].reverse().find((transaction) => transaction.jobId === activeJobId) || null;
  }
  return eligible.at(-1) || null;
}

export function historyForOppy(messages) {
  return cleanMessages(messages)
    .filter((message) => message.text !== OPPY_JOB_GREETING.text)
    .slice(-12)
    .map((message) => ({ role: message.role === 'bot' ? 'oppy' : message.role, text: message.text }));
}
