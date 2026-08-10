'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  detectDataIntent,
  formatExplorerContext,
  getJobDeepDive,
  getPlatformOverview,
  getWalletDashboard,
  searchJobs,
} = require('../services/oppy-explorer');
const { resetCachesForTest } = require('../services/oppy-job-context');

const wallet = '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C';
const applicant = '0x921858bf1B4c03952D911eAbf7f33061e93b5A73';
const zero = '0x0000000000000000000000000000000000000000';

function rawJob(overrides = {}) {
  return {
    id: '30365-8',
    jobGiver: wallet,
    applicants: [applicant],
    jobDetailHash: 'QmDataCopilotJob123456789',
    status: 1,
    workSubmissions: ['QmSubmission123456789'],
    milestonePayments: [{ descriptionHash: 'QmMilestone123456789', amount: '250000' }],
    finalMilestones: [],
    totalPaid: '0',
    currentMilestone: '0',
    selectedApplicant: applicant,
    selectedApplicationId: '1',
    paymentTargetChainDomain: '18',
    paymentTargetAddress: applicant,
    ...overrides,
  };
}

function dependencies() {
  const content = {
    QmDataCopilotJob123456789: {
      title: 'Design the Oppy explorer',
      description: 'Build a richer OpenWork data experience.',
      skills: ['Product Design', 'React'],
    },
    QmMilestone123456789: { title: 'Explorer delivery', description: 'Ship the canonical explorer.' },
    QmSubmission123456789: { workDetails: 'Explorer implementation ready for review.' },
    QmApplication123456789: { description: 'I can build the explorer.' },
    QmProfile123456789: { name: 'OpenWork Builder', skills: ['React', 'Solidity'] },
    QmPortfolio123456789: { title: 'Previous marketplace' },
  };
  return {
    jobs: [rawJob(), rawJob({
      id: '42161-25',
      status: 0,
      jobDetailHash: 'QmAnotherJob123456789',
      workSubmissions: [],
      selectedApplicant: zero,
      selectedApplicationId: '0',
    })],
    fullJobs: { '30365-8': rawJob() },
    applications: {
      '30365-8': [{
        id: '1', jobId: '30365-8', applicant, applicationHash: 'QmApplication123456789',
        proposedMilestones: [{ descriptionHash: 'QmMilestone123456789', amount: '250000' }],
        preferredPaymentChainDomain: '18', preferredPaymentAddress: applicant,
      }],
    },
    profiles: {
      [wallet.toLowerCase()]: {
        profile: { userAddress: wallet, ipfsHash: 'QmProfile123456789', referrerAddress: zero, portfolioHashes: ['QmPortfolio123456789'] },
        ratings: ['5', '4'],
      },
      [applicant.toLowerCase()]: {
        profile: { userAddress: applicant, ipfsHash: 'QmProfile123456789', referrerAddress: zero, portfolioHashes: ['QmPortfolio123456789'] },
        ratings: ['5', '5'],
      },
    },
    contracts: {
      genesis: { methods: { getJob: () => ({ call: async () => rawJob() }) } },
      helper: { methods: { getApplicationsByJob: () => ({ call: async () => [] }) } },
      profile: { methods: {
        getProfile: () => ({ call: async () => ({}) }),
        getUserRatings: () => ({ call: async () => [] }),
      } },
    },
    fetch: async (url) => {
      const hash = Object.keys(content).find((candidate) => url.includes(candidate));
      return { ok: Boolean(hash), async text() { return JSON.stringify(content[hash] || {}); } };
    },
  };
}

test('data intent detection is deterministic and never competes with an explicit transaction', () => {
  assert.deepEqual(detectDataIntent('What needs my attention?'), { type: 'wallet' });
  assert.deepEqual(detectDataIntent('Platform overview'), { type: 'platform' });
  assert.deepEqual(detectDataIntent('Explore job 30365-8'), { type: 'job', jobId: '30365-8' });
  assert.equal(detectDataIntent('release payment for 30365-8', 'releasePayment'), null);
});

test('wallet dashboard derives financials, roles and attention from canonical jobs', async () => {
  resetCachesForTest();
  const dashboard = await getWalletDashboard(wallet, dependencies());
  assert.equal(dashboard.type, 'wallet-dashboard');
  assert.equal(dashboard.summary.totalJobs, 2);
  assert.equal(dashboard.summary.postedBudget, '0.5');
  assert.equal(dashboard.profile.name, 'OpenWork Builder');
  assert.ok(dashboard.attention.some((item) => item.kind === 'review-work'));
  assert.equal(dashboard.jobs.find((job) => job.jobId === '30365-8').title, 'Design the Oppy explorer');
});

test('platform overview and job search aggregate live ledger metadata', async () => {
  resetCachesForTest();
  const deps = dependencies();
  const overview = await getPlatformOverview(deps);
  const search = await searchJobs('find React jobs', {}, deps);
  assert.equal(overview.summary.totalJobs, 2);
  assert.equal(overview.summary.nominalBudget, '0.5');
  assert.ok(overview.topSkills.some((entry) => entry.skill === 'React'));
  assert.equal(search.results[0].jobId, '30365-8');
  const promptContext = formatExplorerContext(overview);
  assert.match(promptContext, /"budget": "0\.5"/);
  assert.doesNotMatch(promptContext, /"nominalBudget":/);
});

test('job deep dive joins milestones, applications, profiles and submissions', async () => {
  resetCachesForTest();
  const deepDive = await getJobDeepDive('30365-8', wallet, dependencies());
  assert.equal(deepDive.job.title, 'Design the Oppy explorer');
  assert.equal(deepDive.job.viewerRole, 'job giver');
  assert.equal(deepDive.job.paymentTargetChain, 'XDC Network');
  assert.equal(deepDive.milestones[0].title, 'Explorer delivery');
  assert.equal(deepDive.applications[0].profile.ratingAverage, 5);
  assert.match(deepDive.submissions[0].description, /ready for review/);
  assert.match(formatExplorerContext(deepDive), /DETERMINISTIC DATA EXPLORER/);
});
