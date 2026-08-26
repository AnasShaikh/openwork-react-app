'use strict';

const POST_ACTIONS = new Set(['postJob', 'startDirectContract']);
const VALID_JOB_ID = /^\d+-\d+$/;

function lastAssistantMessage(history = []) {
  return [...history].reverse().find((entry) => entry?.role === 'oppy' || entry?.role === 'assistant')?.text || '';
}

function isJobIdentityQuestion(message, history = []) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  if (/\b(?:job\s*)?id\b/.test(text) && /\b(?:what|which|remember|know|find|check|tell|give|forgot|forget|latest|last|recent)\b/.test(text)) {
    return true;
  }
  if (/\b(?:latest|last|most recent)\s+(?:job|contract)\b/.test(text)
      && /\b(?:what|which|remember|id|check|find|show|tell)\b/.test(text)) {
    return true;
  }
  const followUp = /\b(?:don'?t remember|do not remember|forgot|can you check|please check|you check)\b/.test(text);
  return followUp && /\b(?:job\s*)?id\b/i.test(lastAssistantMessage(history));
}

function jobParts(jobId) {
  if (!VALID_JOB_ID.test(jobId || '')) return null;
  const [prefix, sequence] = jobId.split('-').map(Number);
  return { prefix, sequence };
}

function laterSameSource(left, right) {
  const a = jobParts(left?.jobId);
  const b = jobParts(right?.jobId);
  if (!a) return right;
  if (!b) return left;
  if (a.prefix !== b.prefix) return left;
  return b.sequence > a.sequence ? right : left;
}

function candidateFromTransaction(transaction, evidence) {
  if (!POST_ACTIONS.has(transaction?.action) || !VALID_JOB_ID.test(transaction?.jobId || '')) return null;
  return {
    jobId: transaction.jobId,
    sourceChainId: Number(transaction.chainId) || null,
    sourceTxHash: transaction.txHash || null,
    sourceReceiptConfirmed: transaction.confirmed === true,
    evidence,
  };
}

function resolveLatestPostedJob(context = {}) {
  const durable = Array.isArray(context.durableTransactions)
    ? context.durableTransactions.map((tx) => candidateFromTransaction(tx, 'durable receipt')).filter(Boolean)
    : [];
  const browser = Array.isArray(context.recentTransactions)
    ? context.recentTransactions.map((tx) => candidateFromTransaction(tx, 'browser receipt')).filter(Boolean)
    : [];
  const canonicalLatestId = Array.isArray(context.posterJobIds)
    ? [...context.posterJobIds].reverse().find((jobId) => VALID_JOB_ID.test(jobId))
    : null;

  // Durable transaction rows are written only after a source receipt and are
  // ordered newest first. They survive a browser refresh and are the strongest
  // recovery signal when the client-side active job has gone stale.
  let candidate = durable[0]
    || (canonicalLatestId ? { jobId: canonicalLatestId, evidence: 'canonical poster history' } : null)
    || browser.at(-1)
    || (VALID_JOB_ID.test(context.activeJob?.jobId || '') ? { ...context.activeJob, evidence: 'active browser job' } : null);

  // A source-confirmed browser transaction may not yet be in canonical history.
  // If it belongs to the same source chain and has a newer counter, keep it.
  const browserLatest = browser.at(-1);
  if (browserLatest?.sourceReceiptConfirmed) candidate = laterSameSource(candidate, browserLatest);
  if (context.activeJob?.sourceReceiptConfirmed) {
    candidate = laterSameSource(candidate, { ...context.activeJob, evidence: 'active browser job' });
  }
  if (!candidate) return null;

  const liveJob = Array.isArray(context.jobs)
    ? context.jobs.find((job) => job.jobId === candidate.jobId)
    : null;
  const active = context.activeJob?.jobId === candidate.jobId ? context.activeJob : null;
  return {
    ...candidate,
    ...(active || {}),
    ...(liveJob || {}),
    jobId: candidate.jobId,
    title: liveJob?.title || active?.title || null,
    canonicalStateAvailable: Boolean(liveJob || active?.canonicalStateAvailable || candidate.evidence === 'canonical poster history'),
  };
}

function chainName(job) {
  if (job.postingChainName || job.sourceChainName) return job.postingChainName || job.sourceChainName;
  const prefix = jobParts(job.jobId)?.prefix;
  if (prefix === 30365) return 'XDC Network';
  if (prefix === 30111) return 'Optimism';
  if (prefix === 42161 || prefix === 30110) return 'Arbitrum One';
  return null;
}

function resolveJobIdentityAnswer(message, history, context) {
  if (!isJobIdentityQuestion(message, history)) return null;
  const job = resolveLatestPostedJob(context);
  if (!job) {
    return {
      job: null,
      text: 'I could not recover a confirmed job ID for this wallet yet. I will not guess or prepare a payment against an unverified job.',
    };
  }
  const network = chainName(job);
  const title = job.title ? ` (“${job.title}”)` : '';
  const state = job.canonicalStateAvailable
    ? ' It is present in OpenWork’s live job history.'
    : (job.sourceReceiptConfirmed ? ' Its source transaction is confirmed; final network syncing may still be in progress.' : '');
  return {
    job,
    text: `Your latest posted job is **${job.jobId}**${title}${network ? ` on ${network}` : ''}.${state}`,
  };
}

module.exports = {
  isJobIdentityQuestion,
  resolveJobIdentityAnswer,
  resolveLatestPostedJob,
};
