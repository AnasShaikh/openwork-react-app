'use strict';

const fetch = require('node-fetch');
const { Web3 } = require('web3');
const config = require('../config');
const genesisAbi = require('../../src/ABIs/genesis_ABI.json');
const genesisHelperAbi = require('../../src/ABIs/genesis_helper_ABI.json');
const { getChainIdFromJobId, getChainNameFromJobId } = require('../utils/chain-utils');

const GENESIS_READER_ADDRESS = '0x72ee091C288512f0ee9eB42B8C152fbB127Dc782';
const JOB_STATUSES = [0, 1, 2, 3];
const STATUS_LABELS = ['Open', 'In progress', 'Completed', 'Cancelled'];
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const LEDGER_CACHE_MS = 30_000;
const METADATA_CACHE_MS = 10 * 60_000;
const MAX_CONTEXT_JOBS = 12;
const MAX_METADATA_BYTES = 64 * 1024;

let ledgerCache = { expiresAt: 0, value: null, promise: null };
const metadataCache = new Map();

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function lower(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function validJobId(value) {
  return typeof value === 'string' && /^[0-9]+-[0-9]+$/.test(value);
}

function normalizeTransaction(value) {
  if (!value || typeof value !== 'object') return null;
  const jobId = validJobId(value.jobId) ? value.jobId : null;
  const txHash = typeof value.txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value.txHash)
    ? value.txHash
    : null;
  const chainId = Number(value.chainId);
  const action = typeof value.action === 'string' ? value.action.trim().slice(0, 40) : '';
  if (!action || (!jobId && !txHash)) return null;
  return {
    action,
    jobId,
    txHash,
    chainId: Number.isInteger(chainId) ? chainId : null,
    confirmed: value.confirmed === true,
  };
}

function sanitizeConversationMemory(memory = {}) {
  const rawActive = memory && typeof memory.activeJob === 'object' ? memory.activeJob : null;
  const activeJob = rawActive && validJobId(rawActive.jobId)
    ? {
        jobId: rawActive.jobId,
        title: typeof rawActive.title === 'string' ? rawActive.title.trim().slice(0, 160) : null,
        sourceChainId: Number.isInteger(Number(rawActive.sourceChainId)) ? Number(rawActive.sourceChainId) : null,
        sourceChainName: typeof rawActive.sourceChainName === 'string'
          ? rawActive.sourceChainName.trim().slice(0, 80)
          : null,
        sourceTxHash: typeof rawActive.sourceTxHash === 'string'
          && /^0x[a-fA-F0-9]{64}$/.test(rawActive.sourceTxHash)
          ? rawActive.sourceTxHash
          : null,
        sourceReceiptConfirmed: rawActive.sourceReceiptConfirmed === true,
      }
    : null;
  const recentTransactions = Array.isArray(memory.recentTransactions)
    ? memory.recentTransactions.map(normalizeTransaction).filter(Boolean).slice(-12)
    : [];
  return { activeJob, recentTransactions };
}

function rawJobValue(job, name, index, fallback = null) {
  if (job?.[name] !== undefined) return job[name];
  if (job?.[index] !== undefined) return job[index];
  return fallback;
}

function formatUsdc(rawValue) {
  try {
    const raw = BigInt(rawValue || 0);
    const whole = raw / 1_000_000n;
    const fraction = (raw % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole.toString();
  } catch {
    return '0';
  }
}

function normalizeLedgerJob(job) {
  const jobId = String(rawJobValue(job, 'id', 0, ''));
  if (!validJobId(jobId)) return null;
  const milestones = rawJobValue(job, 'finalMilestones', 7, []);
  const fallbackMilestones = rawJobValue(job, 'milestonePayments', 6, []);
  const effectiveMilestones = Array.isArray(milestones) && milestones.length ? milestones : fallbackMilestones;
  const nominalBudget = (Array.isArray(effectiveMilestones) ? effectiveMilestones : [])
    .reduce((sum, milestone) => {
      try {
        return sum + BigInt(rawJobValue(milestone, 'amount', 1, 0));
      } catch {
        return sum;
      }
    }, 0n);

  let postingChainId = null;
  let postingChainName = 'Unknown chain';
  try {
    postingChainId = getChainIdFromJobId(jobId);
    postingChainName = getChainNameFromJobId(jobId);
  } catch { /* retain explicit unknown values */ }

  return {
    jobId,
    jobGiver: String(rawJobValue(job, 'jobGiver', 1, ZERO_ADDRESS)),
    applicants: Array.from(rawJobValue(job, 'applicants', 2, []) || []).map(String),
    jobDetailHash: String(rawJobValue(job, 'jobDetailHash', 3, '')),
    status: Number(rawJobValue(job, 'status', 4, 0)),
    totalPaid: formatUsdc(rawJobValue(job, 'totalPaid', 8, 0)),
    currentMilestone: Number(rawJobValue(job, 'currentMilestone', 9, 0)),
    selectedApplicant: String(rawJobValue(job, 'selectedApplicant', 10, ZERO_ADDRESS)),
    nominalBudget: formatUsdc(nominalBudget),
    postingChainId,
    postingChainName,
  };
}

function metadataGateways(hash, env = process.env) {
  const gateways = [];
  if (env.IPFS_API_URL && env.IPFS_PROXY_SECRET) {
    gateways.push({
      url: `${env.IPFS_API_URL.replace(/\/+$/, '')}/ipfs/${hash}`,
      headers: { Authorization: `Bearer ${env.IPFS_PROXY_SECRET}` },
    });
  }
  gateways.push(
    { url: `https://gateway.lighthouse.storage/ipfs/${hash}` },
    { url: `https://dweb.link/ipfs/${hash}` },
  );
  return gateways;
}

async function fetchMetadata(hash, dependencies = {}) {
  if (!hash || !/^[A-Za-z0-9]{10,100}$/.test(hash)) return null;
  const cached = metadataCache.get(hash);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const request = dependencies.fetch || fetch;
  const env = dependencies.env || process.env;
  for (const gateway of metadataGateways(hash, env)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_500);
    try {
      const response = await request(gateway.url, { headers: gateway.headers, signal: controller.signal });
      if (!response.ok) continue;
      const text = await response.text();
      if (Buffer.byteLength(text) > MAX_METADATA_BYTES) continue;
      const value = JSON.parse(text);
      metadataCache.set(hash, { value, expiresAt: Date.now() + METADATA_CACHE_MS });
      return value;
    } catch { /* try the next gateway */ }
    finally { clearTimeout(timer); }
  }
  metadataCache.set(hash, { value: null, expiresAt: Date.now() + 30_000 });
  return null;
}

async function readLedger(dependencies = {}) {
  if (dependencies.jobs) return dependencies.jobs.map(normalizeLedgerJob).filter(Boolean);
  if (ledgerCache.value && ledgerCache.expiresAt > Date.now()) return ledgerCache.value;
  if (ledgerCache.promise) return ledgerCache.promise;

  const Web3Class = dependencies.Web3 || Web3;
  const rpcUrl = dependencies.rpcUrl || config.ARBITRUM_RPC;
  const readerAddress = dependencies.readerAddress || GENESIS_READER_ADDRESS;
  ledgerCache.promise = (async () => {
    const web3 = new Web3Class(rpcUrl);
    const helper = new web3.eth.Contract(genesisHelperAbi, readerAddress);
    const grouped = await withTimeout(
      Promise.all(JOB_STATUSES.map((status) => helper.methods.getJobsByStatus(status).call())),
      8_000,
      'OpenWork job-ledger read',
    );
    const byId = new Map();
    for (const rawJob of grouped.flat()) {
      const job = normalizeLedgerJob(rawJob);
      if (job) byId.set(job.jobId, job);
    }
    const value = [...byId.values()];
    ledgerCache = { value, expiresAt: Date.now() + LEDGER_CACHE_MS, promise: null };
    return value;
  })();

  try {
    return await ledgerCache.promise;
  } catch (error) {
    ledgerCache.promise = null;
    throw error;
  }
}

async function readPosterOrder(walletAddress, dependencies = {}) {
  if (Array.isArray(dependencies.posterJobIds)) return dependencies.posterJobIds.filter(validJobId);
  const Web3Class = dependencies.Web3 || Web3;
  const web3 = new Web3Class(dependencies.rpcUrl || config.ARBITRUM_RPC);
  const genesis = new web3.eth.Contract(genesisAbi, dependencies.genesisAddress || config.GENESIS_ADDRESS);
  return withTimeout(genesis.methods.getJobsByPoster(walletAddress).call(), 5_000, 'Wallet job-history read');
}

function walletRole(job, walletAddress) {
  const wallet = lower(walletAddress);
  if (lower(job.jobGiver) === wallet) return 'job giver';
  if (lower(job.selectedApplicant) === wallet) return 'selected applicant';
  if (job.applicants.some((applicant) => lower(applicant) === wallet)) return 'applicant';
  return null;
}

function prioritizeJobs(jobs, walletAddress, activeJobId, posterJobIds, recentTransactions) {
  const byId = new Map(jobs.map((job) => [job.jobId, job]));
  const orderedIds = [];
  const add = (jobId) => {
    if (validJobId(jobId) && byId.has(jobId) && !orderedIds.includes(jobId)) orderedIds.push(jobId);
  };
  add(activeJobId);
  [...recentTransactions].reverse().forEach((tx) => add(tx.jobId));
  [...posterJobIds].reverse().forEach(add);
  [...jobs].reverse().forEach((job) => {
    if (walletRole(job, walletAddress)) add(job.jobId);
  });
  return orderedIds.slice(0, MAX_CONTEXT_JOBS).map((jobId) => byId.get(jobId));
}

async function getWalletJobContext(walletAddress, memoryInput = {}, dependencies = {}) {
  const memory = sanitizeConversationMemory(memoryInput);
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress || '')) {
    return { available: false, reason: 'wallet not connected', activeJob: memory.activeJob, jobs: [], recentTransactions: memory.recentTransactions };
  }

  try {
    const [ledger, posterJobIds] = await Promise.all([
      readLedger(dependencies),
      readPosterOrder(walletAddress, dependencies).catch(() => []),
    ]);
    const selected = prioritizeJobs(
      ledger,
      walletAddress,
      memory.activeJob?.jobId,
      posterJobIds,
      memory.recentTransactions,
    );
    const metadataResults = await withTimeout(
      Promise.all(selected.map((job) => fetchMetadata(job.jobDetailHash, dependencies).catch(() => null))),
      4_000,
      'OpenWork job metadata read',
    ).catch(() => selected.map(() => null));

    const jobs = selected.map((job, index) => ({
      ...job,
      role: walletRole(job, walletAddress) || 'referenced job',
      title: metadataResults[index]?.title || metadataResults[index]?.jobTitle || null,
    }));
    const activeLive = jobs.find((job) => job.jobId === memory.activeJob?.jobId)
      || ledger.find((job) => job.jobId === memory.activeJob?.jobId);
    const activeJob = memory.activeJob
      ? {
          ...memory.activeJob,
          ...(activeLive || {}),
          title: activeLive?.title || memory.activeJob.title || null,
          canonicalStateAvailable: Boolean(activeLive),
          sourceDeliveryPending: !activeLive
            && memory.activeJob.sourceReceiptConfirmed === true
            && memory.activeJob.sourceChainId !== 42161,
        }
      : null;

    return {
      available: true,
      activeJob,
      jobs,
      recentTransactions: memory.recentTransactions,
    };
  } catch (error) {
    return {
      available: false,
      reason: error.message,
      activeJob: memory.activeJob,
      jobs: [],
      recentTransactions: memory.recentTransactions,
    };
  }
}

function formatJobContext(context = {}) {
  const active = context.activeJob;
  const activeLine = active
    ? `- Active job: ${active.jobId}${active.title ? ` (“${active.title}”)` : ''}; posting chain ${active.postingChainName || active.sourceChainName || 'unknown'}; ${active.canonicalStateAvailable ? `canonical status ${STATUS_LABELS[active.status] || active.status}` : (active.sourceDeliveryPending ? 'source receipt confirmed, canonical Arbitrum delivery still unconfirmed' : 'canonical state not loaded')}.`
    : '- Active job: none selected.';
  const jobs = Array.isArray(context.jobs) ? context.jobs : [];
  const jobLines = jobs.length
    ? jobs.map((job, index) => (
        `${index + 1}. ${job.jobId}${job.title ? ` — ${job.title}` : ''}; ${job.postingChainName}; ${STATUS_LABELS[job.status] || `status ${job.status}`}; role ${job.role}; nominal budget ${job.nominalBudget} USDC; paid ${job.totalPaid} USDC; milestone ${job.currentMilestone}.`
      )).join('\n')
    : '- No canonical wallet jobs were loaded.';
  const txLines = context.recentTransactions?.length
    ? context.recentTransactions.map((tx) => `- ${tx.action}: ${tx.jobId || 'job unresolved'}${tx.txHash ? `; tx ${tx.txHash}` : ''}; chain ${tx.chainId ?? 'unknown'}; ${tx.confirmed ? 'receipt confirmed' : 'status not asserted'}.`).join('\n')
    : '- No recent browser-confirmed job transactions were supplied.';

  return `## WALLET JOB MEMORY
${activeLine}
- Canonical ledger read: ${context.available ? 'available' : `unavailable${context.reason ? ` (${context.reason})` : ''}`}.

Recent relevant jobs (active first, then browser transactions and Genesis creation order):
${jobLines}

Recent transaction memory:
${txLines}`;
}

function resetCachesForTest() {
  ledgerCache = { expiresAt: 0, value: null, promise: null };
  metadataCache.clear();
}

module.exports = {
  MAX_CONTEXT_JOBS,
  STATUS_LABELS,
  formatJobContext,
  getWalletJobContext,
  normalizeLedgerJob,
  resetCachesForTest,
  sanitizeConversationMemory,
  walletRole,
};
