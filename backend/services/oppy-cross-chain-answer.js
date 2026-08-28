'use strict';

const { readCrossChainActionStatus } = require('./cross-chain-action-status');

const TRACKED_ACTIONS = new Set(['postJob', 'startDirectContract', 'releasePayment']);
const SOURCE_CHAINS = new Set([10, 50]);
const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

function isCrossChainStatusQuestion(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  return [
    /^(?:so\s+)?is\s+(?:it|this|that|the\s+(?:job|contract|payment|transaction))\s+(?:done|complete|completed|ready|successful|confirmed|mined|finalized)(?:\s+yet)?\??$/,
    /^(?:so\s+)?(?:did|has)\s+(?:it|this|that|the\s+(?:job|contract|payment|transaction))\s+(?:go\s+through|sync|synced|complete|completed|finish|finished|deliver|delivered|succeed|succeeded|confirm|confirmed|mine|mined|finalize|finalized)(?:\s+yet)?\??$/,
    /^(?:check\s+)?(?:the\s+)?(?:live\s+)?status(?:\s+(?:of|for)\s+(?:it|this|that|the\s+(?:job|contract|payment|transaction)|\d+-\d+))?\??$/,
    /^(?:what(?:'s|\s+is)\s+)?(?:the\s+)?(?:live\s+)?status\s+(?:of|for)\s+(?:it|this|that|the\s+(?:job|contract|payment|transaction)|\d+-\d+)\??$/,
    /^(?:so\s+|okay\s+|ok\s+)?(?:was|is|has|did)\s+(?:the\s+)?(?:money|funds?|usdc|payment|milestone|escrow)(?:\s+(?:been|get|got))?\s+(?:locked|funded|received|delivered|arrived|escrowed)(?:\s+(?:on|in|at)\s+(?:arbitrum|the\s+contract|escrow))?\??$/,
    /^(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:check|confirm|verify|tell\s+me)(?:\s+(?:whether|if))?\s+(?:the\s+)?(?:job\s*taker|freelancer|recipient|worker|their\s+wallet|his\s+wallet|her\s+wallet)\s+(?:(?:has|had)\s+)?(?:received|got|been\s+paid|gotten)\s+(?:the\s+)?(?:money|funds?|usdc|payment|payout)\??$/,
    /^(?:so\s+|okay\s+|ok\s+)?(?:did|has)\s+(?:the\s+)?(?:job\s*taker|freelancer|recipient|worker|they|he|she)\s+(?:receive|get|got|been\s+paid)\s+(?:the\s+)?(?:money|funds?|usdc|payment|payout)\??$/,
    /^(?:so\s+|okay\s+|ok\s+)?(?:did|has)\s+(?:the\s+)?(?:job\s*taker|freelancer|recipient|worker|they|he|she)\s+(?:get|got|been)\s+paid\??$/,
  ].some((pattern) => pattern.test(text));
}

function latestTrackedTransaction(memory = {}) {
  const transactions = Array.isArray(memory.recentTransactions) ? memory.recentTransactions : [];
  const activeJobId = VALID_JOB_ID.test(memory.activeJob?.jobId || '') ? memory.activeJob.jobId : null;
  const valid = transactions.filter((transaction) => (
    TRACKED_ACTIONS.has(transaction?.action)
    && transaction.confirmed === true
    && VALID_JOB_ID.test(transaction.jobId || '')
    && VALID_TX_HASH.test(transaction.txHash || '')
    && SOURCE_CHAINS.has(Number(transaction.chainId))
  ));
  return [...valid].reverse().find((transaction) => !activeJobId || transaction.jobId === activeJobId)
    || valid.at(-1)
    || null;
}

function actionLabel(action) {
  if (action === 'startDirectContract') return 'direct contract';
  if (action === 'releasePayment') return 'payment release';
  return 'job post';
}

function formatUsdcRaw(raw) {
  if (!/^\d+$/.test(String(raw || ''))) return null;
  const value = BigInt(raw);
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function shortAddress(address) {
  const value = String(address || '');
  return /^0x[a-fA-F0-9]{40}$/.test(value) ? `${value.slice(0, 8)}…${value.slice(-4)}` : null;
}

function completeMessage(status) {
  const label = actionLabel(status.action);
  const sourceName = status.source?.chainName || 'the source network';
  const destinationLink = status.links?.canonicalExplorerUrl
    ? ` [View the Arbitrum transaction](${status.links.canonicalExplorerUrl}).`
    : '';

  if (status.action === 'releasePayment') {
    const target = status.cctp?.targetChainName || 'the payment network';
    const amount = formatUsdcRaw(status.cctp?.amountRaw);
    const recipient = shortAddress(status.cctp?.recipient);
    const receipt = `${amount ? `${amount} ` : ''}USDC receipt${recipient ? ` for **${recipient}**` : ''}`;
    return `Yes — the ${label} for job **${status.jobId}** is complete. The source transaction is confirmed on ${sourceName}, OpenWork recorded the payment on Arbitrum, and the ${receipt} is confirmed on ${target}. **No retry is needed.**${destinationLink}`;
  }

  if (status.action === 'startDirectContract') {
    return `Yes — the ${label} for job **${status.jobId}** is fully funded. The source transaction is confirmed on ${sourceName}, OpenWork created the contract on Arbitrum, and the first-milestone USDC receipt is confirmed there. **No retry is needed.**${destinationLink}`;
  }
  return `Yes — the ${label} for job **${status.jobId}** is complete. The source transaction is confirmed on ${sourceName}, LayerZero delivered it to Arbitrum, and the OpenWork job is ready. **No retry is needed.**${destinationLink}`;
}

function pendingMessage(status) {
  const label = actionLabel(status.action);
  const sourceName = status.source?.chainName || 'the source network';
  let currentStep = 'OpenWork is still checking the network delivery';
  if (status.layerZero?.state === 'delivered' && status.canonical?.state !== 'complete') {
    currentStep = 'LayerZero delivered it to Arbitrum; OpenWork is still recording the canonical state';
  } else if (status.canonical?.state === 'complete' && status.cctp?.required && status.cctp?.state !== 'received') {
    currentStep = status.action === 'startDirectContract'
      ? `OpenWork created the contract, but its first-milestone USDC is still being delivered to ${status.cctp?.targetChainName || 'Arbitrum'}`
      : `OpenWork recorded the payment; USDC is still being delivered to ${status.cctp?.targetChainName || 'the destination network'}`;
  }
  return `Not fully yet. The ${label} source transaction for job **${status.jobId}** is confirmed on ${sourceName}. ${currentStep}. Oppy will keep checking automatically, so **do not retry the transaction**.`;
}

function formatCrossChainStatusAnswer(status) {
  if (status?.complete === true) return completeMessage(status);
  if (status?.state === 'failed') {
    return `The source transaction for job **${status.jobId}** is confirmed, but LayerZero reports that delivery needs attention. Open the card’s **Delivery details** before attempting anything else; retry remains protected.`;
  }
  if (status?.state === 'unavailable') {
    return `The source transaction for job **${status.jobId}** is confirmed, but one live status provider is temporarily unavailable. Oppy cannot prove final delivery yet and will keep checking automatically. **Do not retry the transaction.**`;
  }
  return pendingMessage(status);
}

async function resolveCrossChainStatusAnswer(message, memory = {}, dependencies = {}) {
  if (!isCrossChainStatusQuestion(message)) return null;
  const transaction = latestTrackedTransaction(memory);
  if (!transaction) return null;
  const readStatus = dependencies.readCrossChainActionStatus || readCrossChainActionStatus;
  const status = await readStatus({
    action: transaction.action,
    jobId: transaction.jobId,
    sourceChainId: transaction.chainId,
    sourceTxHash: transaction.txHash,
    targetDomain: transaction.targetDomain,
    baselineTotalPaidRaw: transaction.baselineTotalPaidRaw,
  });
  return {
    status,
    transaction,
    text: formatCrossChainStatusAnswer(status),
  };
}

module.exports = {
  formatCrossChainStatusAnswer,
  isCrossChainStatusQuestion,
  latestTrackedTransaction,
  resolveCrossChainStatusAnswer,
};
