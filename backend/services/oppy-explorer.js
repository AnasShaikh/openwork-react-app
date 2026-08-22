'use strict';

const { Web3 } = require('web3');
const config = require('../config');
const genesisAbi = require('../../src/ABIs/genesis_ABI.json');
const genesisHelperAbi = require('../../src/ABIs/genesis_helper_ABI.json');
const profileGenesisAbi = require('../../src/ABIs/profile-genesis_ABI.json');
const {
  STATUS_LABELS,
  fetchMetadata,
  formatUsdc,
  normalizeLedgerJob,
  readLedger,
  walletRole,
} = require('./oppy-job-context');

const GENESIS_READER_ADDRESS = '0x72ee091C288512f0ee9eB42B8C152fbB127Dc782';
const PROFILE_GENESIS_ADDRESS = '0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_INDEXED_METADATA = 80;
const MAX_DEEP_DIVE_APPLICATIONS = 20;
const MAX_DEEP_DIVE_SUBMISSIONS = 20;
const CHAIN_DOMAIN_NAMES = new Map([[2, 'Optimism'], [3, 'Arbitrum One'], [18, 'XDC Network']]);

function validAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function validJobId(value) {
  return typeof value === 'string' && /^\d+-\d+$/.test(value);
}

function lower(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function rawValue(value, name, index, fallback = null) {
  if (value?.[name] !== undefined) return value[name];
  if (value?.[index] !== undefined) return value[index];
  return fallback;
}

function boundedText(value, maximum = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function stringList(value, maximum = 20) {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, maximum);
  }
  return Array.isArray(value)
    ? value.map((item) => boundedText(item, 80)).filter(Boolean).slice(0, maximum)
    : [];
}

function metadataSummary(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') {
    return { title: null, description: null, skills: [] };
  }
  return {
    title: boundedText(metadata.title || metadata.jobTitle || metadata.name, 180) || null,
    description: boundedText(
      metadata.description || metadata.jobDescription || metadata.content || metadata.workDetails || metadata.proposal,
      1600,
    ) || null,
    skills: stringList(metadata.skills || metadata.skillTags || metadata.tags),
  };
}

function profileMetadataSummary(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};
  return {
    name: boundedText(metadata.name || metadata.displayName || metadata.fullName, 120) || null,
    bio: boundedText(metadata.bio || metadata.description || metadata.about, 600) || null,
    skills: stringList(metadata.skills || metadata.skillTags || metadata.tags),
    hourlyRate: metadata.hourlyRate === undefined ? null : boundedText(String(metadata.hourlyRate), 40),
  };
}

function milestoneMetadataSummary(metadata = {}, fallbackTitle) {
  const summary = metadataSummary(metadata);
  return {
    title: summary.title || fallbackTitle,
    description: summary.description,
  };
}

function toRawUsdc(value) {
  try { return BigInt(value || 0); } catch { return 0n; }
}

function addCount(target, key) {
  target[key] = (target[key] || 0) + 1;
}

function jobSequence(jobId) {
  const [, sequence = '0'] = String(jobId).split('-');
  return Number(sequence) || 0;
}

function sortRecent(jobs) {
  return [...jobs].sort((a, b) => jobSequence(b.jobId) - jobSequence(a.jobId));
}

function makeContracts(dependencies = {}) {
  if (dependencies.contracts) return dependencies.contracts;
  const Web3Class = dependencies.Web3 || Web3;
  const web3 = new Web3Class(dependencies.rpcUrl || config.ARBITRUM_RPC);
  return {
    genesis: new web3.eth.Contract(genesisAbi, dependencies.genesisAddress || config.GENESIS_ADDRESS),
    helper: new web3.eth.Contract(genesisHelperAbi, dependencies.readerAddress || GENESIS_READER_ADDRESS),
    profile: new web3.eth.Contract(profileGenesisAbi, dependencies.profileAddress || PROFILE_GENESIS_ADDRESS),
  };
}

async function loadMetadata(hash, dependencies) {
  return fetchMetadata(hash, dependencies).catch(() => null);
}

async function enrichLedgerJobs(jobs, dependencies = {}, maximum = MAX_INDEXED_METADATA) {
  const selected = jobs.slice(0, maximum);
  const metadata = await Promise.all(selected.map((job) => loadMetadata(job.jobDetailHash, dependencies)));
  return selected.map((job, index) => ({
    ...job,
    ...metadataSummary(metadata[index]),
  }));
}

function normalizeProfile(rawProfile, ratings, metadata, portfolioMetadata) {
  const portfolioHashes = Array.from(rawValue(rawProfile, 'portfolioHashes', 3, []) || []).map(String);
  const numericRatings = Array.from(ratings || []).map(Number).filter(Number.isFinite);
  const ratingAverage = numericRatings.length
    ? Number((numericRatings.reduce((sum, rating) => sum + rating, 0) / numericRatings.length).toFixed(2))
    : null;
  return {
    available: Boolean(rawValue(rawProfile, 'ipfsHash', 1, '')),
    address: String(rawValue(rawProfile, 'userAddress', 0, ZERO_ADDRESS)),
    ipfsHash: String(rawValue(rawProfile, 'ipfsHash', 1, '')),
    referrerAddress: String(rawValue(rawProfile, 'referrerAddress', 2, ZERO_ADDRESS)),
    ...profileMetadataSummary(metadata),
    ratingAverage,
    ratingCount: numericRatings.length,
    portfolioCount: portfolioHashes.length,
    portfolio: portfolioHashes.slice(0, 6).map((hash, index) => ({
      hash,
      ...metadataSummary(portfolioMetadata[index]),
    })),
  };
}

async function readProfile(address, dependencies = {}, contracts = makeContracts(dependencies)) {
  if (!validAddress(address)) return { available: false, address };
  try {
    const injected = dependencies.profiles?.[lower(address)];
    const rawProfile = injected?.profile || await contracts.profile.methods.getProfile(address).call();
    const ratings = injected?.ratings || await contracts.profile.methods.getUserRatings(address).call();
    const ipfsHash = String(rawValue(rawProfile, 'ipfsHash', 1, ''));
    const portfolioHashes = Array.from(rawValue(rawProfile, 'portfolioHashes', 3, []) || []).map(String);
    const [metadata, ...portfolioMetadata] = await Promise.all([
      loadMetadata(ipfsHash, dependencies),
      ...portfolioHashes.slice(0, 6).map((hash) => loadMetadata(hash, dependencies)),
    ]);
    return normalizeProfile(rawProfile, ratings, metadata, portfolioMetadata);
  } catch {
    return { available: false, address, reason: 'Profile read unavailable' };
  }
}

function actionForJob(job, role) {
  const applicationCount = job.applicants.length;
  const submissionCount = job.workSubmissionHashes.length;
  // Genesis exposes the active milestone as a one-based number after a job is
  // started. A zero value means no milestone has been activated yet.
  const activeMilestone = Math.max(1, job.currentMilestone);

  if (role === 'job giver' && job.status === 0 && applicationCount > 0) {
    return {
      priority: 'high', kind: 'review-applications', jobId: job.jobId,
      label: `Review ${applicationCount} application${applicationCount === 1 ? '' : 's'}`,
      detail: 'This open job has candidates waiting for a decision.',
      href: `/view-job-applications/${job.jobId}`,
    };
  }
  if (role === 'job giver' && job.status === 1 && submissionCount >= activeMilestone) {
    return {
      priority: 'high', kind: 'review-work', jobId: job.jobId,
      label: `Review milestone ${activeMilestone} submission`,
      detail: 'Work is recorded on the canonical job. Release only after reviewing it.',
      href: `/release-payment/${job.jobId}`,
    };
  }
  if (role === 'selected applicant' && job.status === 1 && submissionCount < activeMilestone) {
    return {
      priority: 'high', kind: 'submit-work', jobId: job.jobId,
      label: `Submit work for milestone ${activeMilestone}`,
      detail: 'You are the selected applicant and no submission is recorded for the current milestone.',
      href: `/job-details/${job.jobId}`,
    };
  }
  if (role === 'selected applicant' && job.status === 1) {
    return {
      priority: 'normal', kind: 'awaiting-review', jobId: job.jobId,
      label: `Milestone ${activeMilestone} is awaiting review`,
      detail: 'Your current submission is recorded. No further payment action is required from you.',
      href: `/job-details/${job.jobId}`,
    };
  }
  if (role === 'applicant' && job.status === 0) {
    return {
      priority: 'normal', kind: 'application-pending', jobId: job.jobId,
      label: 'Application awaiting selection',
      detail: 'The job is still open and another applicant has not been selected.',
      href: `/job-details/${job.jobId}`,
    };
  }
  return null;
}

async function getWalletDashboard(walletAddress, dependencies = {}) {
  if (!validAddress(walletAddress)) throw new Error('A valid wallet address is required');
  const [ledger, profile] = await Promise.all([
    readLedger(dependencies),
    readProfile(walletAddress, dependencies).catch(() => ({ available: false, address: walletAddress })),
  ]);
  const walletJobs = ledger
    .map((job) => ({ ...job, role: walletRole(job, walletAddress) }))
    .filter((job) => job.role);
  const recent = sortRecent(walletJobs);
  const enriched = await enrichLedgerJobs(recent, dependencies);
  const statusCounts = {};
  const roleCounts = {};
  const chainCounts = {};
  let paidByWallet = 0n;
  let earnedByWallet = 0n;
  let postedBudget = 0n;

  for (const job of walletJobs) {
    addCount(statusCounts, STATUS_LABELS[job.status] || `Status ${job.status}`);
    addCount(roleCounts, job.role);
    addCount(chainCounts, job.postingChainName);
    if (job.role === 'job giver') {
      postedBudget += toRawUsdc(job.nominalBudgetRaw);
      paidByWallet += toRawUsdc(job.totalPaidRaw);
    }
    if (job.role === 'selected applicant') earnedByWallet += toRawUsdc(job.totalPaidRaw);
  }

  const attention = enriched
    .map((job) => ({ job, action: actionForJob(job, job.role) }))
    .filter(({ action }) => action)
    .sort((a, b) => (a.action.priority === 'high' ? -1 : 1) - (b.action.priority === 'high' ? -1 : 1))
    .slice(0, 8)
    .map(({ job, action }) => ({ ...action, title: job.title || `Job ${job.jobId}`, chain: job.postingChainName }));

  return {
    type: 'wallet-dashboard',
    generatedAt: new Date().toISOString(),
    walletAddress,
    summary: {
      totalJobs: walletJobs.length,
      statusCounts,
      roleCounts,
      chainCounts,
      postedBudget: formatUsdc(postedBudget),
      paidByWallet: formatUsdc(paidByWallet),
      earnedByWallet: formatUsdc(earnedByWallet),
      attentionCount: attention.filter((item) => item.priority === 'high').length,
    },
    profile,
    attention,
    jobs: enriched.slice(0, 20).map((job) => ({
      jobId: job.jobId,
      title: job.title,
      status: STATUS_LABELS[job.status] || `Status ${job.status}`,
      role: job.role,
      chain: job.postingChainName,
      nominalBudget: job.nominalBudget,
      totalPaid: job.totalPaid,
      applicationCount: job.applicants.length,
      href: `/job-details/${job.jobId}`,
    })),
    provenance: 'Arbitrum Genesis + Profile Genesis + IPFS metadata',
  };
}

async function getPlatformOverview(dependencies = {}) {
  const ledger = await readLedger(dependencies);
  const recent = sortRecent(ledger).slice(0, MAX_INDEXED_METADATA);
  const enriched = await enrichLedgerJobs(recent, dependencies);
  const statusCounts = {};
  const chainCounts = {};
  const skillCounts = {};
  let nominalBudget = 0n;
  let totalPaid = 0n;
  let applications = 0;

  for (const job of ledger) {
    addCount(statusCounts, STATUS_LABELS[job.status] || `Status ${job.status}`);
    addCount(chainCounts, job.postingChainName);
    nominalBudget += toRawUsdc(job.nominalBudgetRaw);
    totalPaid += toRawUsdc(job.totalPaidRaw);
    applications += job.applicants.length;
  }
  for (const job of enriched) {
    job.skills.forEach((skill) => addCount(skillCounts, skill));
  }

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  return {
    type: 'platform-overview',
    generatedAt: new Date().toISOString(),
    summary: {
      totalJobs: ledger.length,
      totalApplications: applications,
      nominalBudget: formatUsdc(nominalBudget),
      totalPaid: formatUsdc(totalPaid),
      statusCounts,
      chainCounts,
    },
    topSkills,
    recentJobs: enriched.slice(0, 8).map((job) => ({
      jobId: job.jobId,
      title: job.title,
      status: STATUS_LABELS[job.status] || `Status ${job.status}`,
      chain: job.postingChainName,
      nominalBudget: job.nominalBudget,
      applicationCount: job.applicants.length,
      href: `/job-details/${job.jobId}`,
    })),
    coverage: {
      metadataJobsScanned: enriched.length,
      metadataScanLimit: MAX_INDEXED_METADATA,
      analyticsScope: 'Live canonical jobs; skill ranking uses the newest metadata-bearing jobs within the scan limit.',
    },
    provenance: 'Arbitrum Genesis Reader + IPFS metadata',
  };
}

function normalizeSearchQuery(query) {
  return boundedText(query, 200)
    .replace(/\b(?:find|search|discover|show|browse|me|for|jobs?|openwork|available|please)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchJobs(query, filters = {}, dependencies = {}) {
  const ledger = await readLedger(dependencies);
  const enriched = await enrichLedgerJobs(sortRecent(ledger), dependencies);
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase();
  const tokens = normalizedQuery.split(/[^a-z0-9+#.-]+/).filter((token) => token.length > 1);
  const statusFilter = boundedText(filters.status, 40).toLowerCase();
  const chainFilter = boundedText(filters.chain, 40).toLowerCase();

  const results = enriched.flatMap((job) => {
    const status = (STATUS_LABELS[job.status] || `Status ${job.status}`).toLowerCase();
    if (statusFilter && !status.includes(statusFilter)) return [];
    if (chainFilter && !job.postingChainName.toLowerCase().includes(chainFilter)) return [];
    const title = (job.title || '').toLowerCase();
    const skills = job.skills.join(' ').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const score = tokens.reduce((sum, token) => (
      sum
      + (job.jobId.toLowerCase().includes(token) ? 8 : 0)
      + (title.includes(token) ? 5 : 0)
      + (skills.includes(token) ? 3 : 0)
      + (description.includes(token) ? 1 : 0)
    ), 0);
    if (tokens.length && score === 0) return [];
    return [{
      jobId: job.jobId,
      title: job.title,
      description: boundedText(job.description, 240) || null,
      skills: job.skills,
      status: STATUS_LABELS[job.status] || `Status ${job.status}`,
      chain: job.postingChainName,
      nominalBudget: job.nominalBudget,
      applicationCount: job.applicants.length,
      score,
      href: `/job-details/${job.jobId}`,
    }];
  }).sort((a, b) => b.score - a.score || jobSequence(b.jobId) - jobSequence(a.jobId)).slice(0, 16);

  return {
    type: 'job-search',
    generatedAt: new Date().toISOString(),
    query: normalizedQuery || 'all recent jobs',
    filters: { status: statusFilter || null, chain: chainFilter || null },
    resultCount: results.length,
    results,
    coverage: `Searched the newest ${enriched.length} canonical jobs with IPFS metadata.`,
    provenance: 'Arbitrum Genesis Reader + IPFS metadata',
  };
}

function normalizeApplication(application) {
  const milestones = Array.from(rawValue(application, 'proposedMilestones', 4, []) || []).map((milestone) => ({
    descriptionHash: String(rawValue(milestone, 'descriptionHash', 0, '')),
    amount: formatUsdc(rawValue(milestone, 'amount', 1, 0)),
  }));
  return {
    id: Number(rawValue(application, 'id', 0, 0)),
    jobId: String(rawValue(application, 'jobId', 1, '')),
    applicant: String(rawValue(application, 'applicant', 2, ZERO_ADDRESS)),
    applicationHash: String(rawValue(application, 'applicationHash', 3, '')),
    proposedMilestones: milestones,
    preferredPaymentChainDomain: Number(rawValue(application, 'preferredPaymentChainDomain', 5, 0)),
    preferredPaymentAddress: String(rawValue(application, 'preferredPaymentAddress', 6, ZERO_ADDRESS)),
  };
}

async function getJobDeepDive(jobId, walletAddress = null, dependencies = {}) {
  if (!validJobId(jobId)) throw new Error('A valid job ID is required');
  const contracts = makeContracts(dependencies);
  const rawJob = dependencies.fullJobs?.[jobId]
    || await contracts.genesis.methods.getJob(jobId).call();
  const job = normalizeLedgerJob(rawJob);
  if (!job || job.jobId !== jobId) throw new Error(`Job ${jobId} is not available in canonical Genesis`);
  const rawApplications = dependencies.applications?.[jobId]
    || await contracts.helper.methods.getApplicationsByJob(jobId).call();
  const applications = Array.from(rawApplications || []).map(normalizeApplication).slice(0, MAX_DEEP_DIVE_APPLICATIONS);
  const effectiveMilestones = job.finalMilestones.length ? job.finalMilestones : job.milestonePayments;
  const [jobMetadata, milestoneMetadata, workMetadata, applicationMetadata] = await Promise.all([
    loadMetadata(job.jobDetailHash, dependencies),
    Promise.all(effectiveMilestones.map((milestone) => loadMetadata(milestone.descriptionHash, dependencies))),
    Promise.all(job.workSubmissionHashes.slice(0, MAX_DEEP_DIVE_SUBMISSIONS).map((hash) => loadMetadata(hash, dependencies))),
    Promise.all(applications.map((application) => loadMetadata(application.applicationHash, dependencies))),
  ]);

  const applicantProfiles = await Promise.all(applications.slice(0, 12).map((application) => (
    readProfile(application.applicant, dependencies, contracts)
  )));
  const profileByAddress = new Map(applicantProfiles.map((profile) => [lower(profile.address), profile]));
  const role = validAddress(walletAddress) ? walletRole(job, walletAddress) : null;
  const action = role ? actionForJob(job, role) : null;

  return {
    type: 'job-deep-dive',
    generatedAt: new Date().toISOString(),
    job: {
      jobId: job.jobId,
      ...metadataSummary(jobMetadata),
      status: STATUS_LABELS[job.status] || `Status ${job.status}`,
      statusCode: job.status,
      chain: job.postingChainName,
      jobGiver: job.jobGiver,
      selectedApplicant: lower(job.selectedApplicant) === lower(ZERO_ADDRESS) ? null : job.selectedApplicant,
      selectedApplicationId: job.selectedApplicationId || null,
      nominalBudget: job.nominalBudget,
      totalPaid: job.totalPaid,
      currentMilestone: job.currentMilestone,
      applicationCount: applications.length,
      submissionCount: job.workSubmissionHashes.length,
      viewerRole: role,
      paymentTargetChain: CHAIN_DOMAIN_NAMES.get(Number(rawValue(rawJob, 'paymentTargetChainDomain', 12, 0))) || null,
      paymentTargetAddress: lower(rawValue(rawJob, 'paymentTargetAddress', 13, ZERO_ADDRESS)) === lower(ZERO_ADDRESS)
        ? null
        : String(rawValue(rawJob, 'paymentTargetAddress', 13, ZERO_ADDRESS)),
      href: `/job-details/${job.jobId}`,
    },
    milestones: effectiveMilestones.map((milestone, index) => ({
      number: index + 1,
      amount: milestone.amount,
      state: index + 1 < Math.max(1, job.currentMilestone)
        ? 'released'
        : (index + 1 === Math.max(1, job.currentMilestone) && job.status === 1 ? 'current' : 'upcoming'),
      hash: milestone.descriptionHash,
      ...milestoneMetadataSummary(milestoneMetadata[index], `Milestone ${index + 1}`),
    })),
    applications: applications.map((application, index) => {
      const profile = profileByAddress.get(lower(application.applicant));
      return {
        id: application.id,
        applicant: application.applicant,
        selected: application.id === job.selectedApplicationId,
        proposal: metadataSummary(applicationMetadata[index]),
        proposedMilestones: application.proposedMilestones,
        preferredPaymentChain: CHAIN_DOMAIN_NAMES.get(application.preferredPaymentChainDomain) || null,
        preferredPaymentAddress: application.preferredPaymentAddress,
        profile: profile ? {
          name: profile.name,
          bio: profile.bio,
          skills: profile.skills,
          ratingAverage: profile.ratingAverage,
          ratingCount: profile.ratingCount,
          portfolioCount: profile.portfolioCount,
          href: `/profile/${application.applicant}`,
        } : null,
      };
    }),
    submissions: job.workSubmissionHashes.slice(0, MAX_DEEP_DIVE_SUBMISSIONS).map((hash, index) => ({
      number: index + 1,
      hash,
      ...metadataSummary(workMetadata[index]),
    })),
    nextAction: action ? { ...action, title: metadataSummary(jobMetadata).title || `Job ${jobId}` } : null,
    provenance: {
      canonicalState: `Arbitrum Genesis ${config.GENESIS_ADDRESS}`,
      applications: `Genesis Reader ${GENESIS_READER_ADDRESS}`,
      profiles: `Profile Genesis ${PROFILE_GENESIS_ADDRESS}`,
      metadata: 'IPFS content addressed by on-chain hashes',
    },
  };
}

function detectDataIntent(message, explicitToolName = null) {
  const text = boundedText(message, 2000);
  const lowerText = text.toLowerCase();
  const jobId = (text.match(/\b\d+-\d+\b/) || [])[0];

  // Navigation requests are explorer reads, not model-decided actions. Resolve
  // them first so quick suggestions and plain-language variants always produce
  // the same in-chat card even when the intent router recognizes a tool name.
  if (explicitToolName === 'browseJobs') {
    const status = /\bopen\b/.test(lowerText) ? 'open' : '';
    const chain = /\bxdc\b/.test(lowerText) ? 'xdc' : (/\boptimism\b/.test(lowerText) ? 'optimism' : (/\barbitrum\b/.test(lowerText) ? 'arbitrum' : ''));
    return { type: 'search', query: text, filters: { status, chain } };
  }
  if (explicitToolName === 'openMyJobs') return { type: 'wallet' };
  if ((explicitToolName === 'openJob' || explicitToolName === 'viewApplications') && jobId) {
    return { type: 'job', jobId };
  }
  if (explicitToolName) return null;

  if (/\b(?:platform|openwork)\s+(?:overview|analytics|stats|statistics|activity|trends)\b|\bnetwork activity\b/.test(lowerText)) {
    return { type: 'platform' };
  }
  if (jobId && /\b(?:explore|analyse|analyze|details?|deep[ -]?dive|status|history|data|what(?:'s| is) happening)\b/.test(lowerText)) {
    return { type: 'job', jobId };
  }
  if (/\b(?:what needs my attention|my dashboard|my openwork summary|my work summary|my activity|my earnings|my portfolio|my work history|summari[sz]e my)\b/.test(lowerText)) {
    return { type: 'wallet' };
  }
  if (/\b(?:find|search|discover|browse)\b[\s\S]{0,80}\bjobs?\b|\bjobs?\b[\s\S]{0,80}\b(?:matching|with skill|about)\b/.test(lowerText)) {
    const status = /\bopen\b/.test(lowerText) ? 'open' : (/\bcompleted\b/.test(lowerText) ? 'completed' : '');
    const chain = /\bxdc\b/.test(lowerText) ? 'xdc' : (/\boptimism\b/.test(lowerText) ? 'optimism' : (/\barbitrum\b/.test(lowerText) ? 'arbitrum' : ''));
    return { type: 'search', query: text, filters: { status, chain } };
  }
  return null;
}

async function runExplorerIntent(intent, walletAddress, dependencies = {}) {
  if (!intent) return null;
  if (intent.type === 'wallet') {
    if (!validAddress(walletAddress)) {
      return { type: 'wallet-dashboard', available: false, error: 'Connect a wallet to explore your OpenWork data.' };
    }
    return getWalletDashboard(walletAddress, dependencies);
  }
  if (intent.type === 'platform') return getPlatformOverview(dependencies);
  if (intent.type === 'job') return getJobDeepDive(intent.jobId, walletAddress, dependencies);
  if (intent.type === 'search') return searchJobs(intent.query, intent.filters, dependencies);
  return null;
}

function formatExplorerContext(explorer) {
  if (!explorer) return '';
  if (explorer.available === false) {
    return `## DETERMINISTIC DATA EXPLORER\nThe requested explorer view is unavailable: ${explorer.error || 'live data could not be loaded'}. Do not invent missing data.`;
  }
  const compact = JSON.stringify(explorer, null, 2)
    .replace(/"nominalBudget":/g, '"budget":')
    .slice(0, 20_000);
  return `## DETERMINISTIC DATA EXPLORER
The JSON below was produced by verified read-only OpenWork data. Treat its IDs, statuses, amounts, roles, counts and next-action labels as authoritative. Respond like a polished consumer product: summarize the useful result in plain language and let the structured card carry the detail. Call job values "budget" or "total job value"; never call them "nominal." Do not mention canonical reads, contracts, Genesis, IPFS, provenance, scan limits, internal tools, model providers or implementation details unless the user explicitly asks. Never use Markdown tables or invent links. Do not invent values outside this payload and do not call a transaction tool for this data-exploration request.

${compact}`;
}

module.exports = {
  MAX_INDEXED_METADATA,
  detectDataIntent,
  formatExplorerContext,
  getJobDeepDive,
  getPlatformOverview,
  getWalletDashboard,
  metadataSummary,
  normalizeApplication,
  normalizeSearchQuery,
  readProfile,
  runExplorerIntent,
  searchJobs,
};
