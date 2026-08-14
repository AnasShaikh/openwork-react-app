const STORAGE_PREFIX = 'openwork:oppy:memory:v2';
const MAX_MESSAGES = 60;
const MAX_TRANSACTIONS = 12;

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
        if (!action || (!jobId && !txHash)) return [];
        return [{
          action,
          jobId,
          txHash,
          chainId: Number(transaction.chainId) || null,
          confirmed: transaction.confirmed === true,
        }];
      }).slice(-MAX_TRANSACTIONS)
    : [];
}

export function loadOppyMemory(scope, fallbackMessages = [], storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(storageKey(scope)) || 'null');
    return {
      messages: cleanMessages(parsed?.messages, fallbackMessages),
      activeJob: sanitizeActiveJob(parsed?.activeJob),
      recentTransactions: cleanTransactions(parsed?.recentTransactions),
    };
  } catch {
    return { messages: fallbackMessages, activeJob: null, recentTransactions: [] };
  }
}

export function saveOppyMemory(scope, memory, storage = globalThis.localStorage) {
  try {
    storage?.setItem(storageKey(scope), JSON.stringify({
      messages: cleanMessages(memory?.messages),
      activeJob: sanitizeActiveJob(memory?.activeJob),
      recentTransactions: cleanTransactions(memory?.recentTransactions),
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

export function historyForOppy(messages) {
  return cleanMessages(messages)
    .filter((message) => message.text !== OPPY_JOB_GREETING.text)
    .slice(-24)
    .map((message) => ({ role: message.role === 'bot' ? 'oppy' : message.role, text: message.text }));
}
