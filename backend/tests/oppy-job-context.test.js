'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  formatJobContext,
  getWalletJobContext,
  normalizeLedgerJob,
  resetCachesForTest,
  walletRole,
} = require('../services/oppy-job-context');

const wallet = '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C';
const other = '0x921858bf1B4c03952D911eAbf7f33061e93b5A73';
const zero = '0x0000000000000000000000000000000000000000';

function rawJob(overrides = {}) {
  return {
    id: '30365-6',
    jobGiver: wallet,
    applicants: [other],
    jobDetailHash: 'QmJobDetailsHash123456789',
    status: 1,
    milestonePayments: [{ descriptionHash: 'QmMilestone', amount: '250000' }],
    finalMilestones: [],
    totalPaid: '0',
    currentMilestone: '0',
    selectedApplicant: other,
    selectedApplicationId: '1',
    ...overrides,
  };
}

test('ledger jobs preserve XDC identity, lifecycle and exact USDC units', () => {
  const normalized = normalizeLedgerJob(rawJob());
  assert.equal(normalized.jobId, '30365-6');
  assert.equal(normalized.postingChainId, 50);
  assert.equal(normalized.postingChainName, 'XDC Network');
  assert.equal(normalized.nominalBudget, '0.25');
  assert.equal(normalized.status, 1);
  assert.equal(walletRole(normalized, wallet), 'job giver');
  assert.equal(walletRole(normalized, other), 'selected applicant');
});

test('wallet job context puts the active XDC job first and enriches its title', async () => {
  resetCachesForTest();
  const response = {
    ok: true,
    async text() { return JSON.stringify({ title: 'Minimal XDC cycle' }); },
  };
  const context = await getWalletJobContext(wallet, {
    activeJob: {
      jobId: '30365-6',
      sourceChainId: 50,
      sourceTxHash: `0x${'a'.repeat(64)}`,
      sourceReceiptConfirmed: true,
    },
    recentTransactions: [{
      action: 'postJob',
      jobId: '30365-6',
      txHash: `0x${'a'.repeat(64)}`,
      chainId: 50,
      confirmed: true,
    }],
  }, {
    jobs: [rawJob(), rawJob({ id: '42161-27', jobDetailHash: '', status: 0, selectedApplicant: zero })],
    posterJobIds: ['42161-27', '30365-6'],
    fetch: async () => response,
  });

  assert.equal(context.available, true);
  assert.equal(context.activeJob.jobId, '30365-6');
  assert.equal(context.activeJob.canonicalStateAvailable, true);
  assert.equal(context.jobs[0].jobId, '30365-6');
  assert.equal(context.jobs[0].title, 'Minimal XDC cycle');
  assert.match(formatJobContext(context), /Active job: 30365-6/);
  assert.match(formatJobContext(context), /XDC Network; In progress/);
});

test('a confirmed XDC source job remains active while canonical delivery is pending', async () => {
  resetCachesForTest();
  const context = await getWalletJobContext(wallet, {
    activeJob: {
      jobId: '30365-7',
      title: 'New XDC job',
      sourceChainId: 50,
      sourceChainName: 'XDC Network',
      sourceTxHash: `0x${'c'.repeat(64)}`,
      sourceReceiptConfirmed: true,
    },
  }, {
    jobs: [rawJob({ id: '30365-6' })],
    posterJobIds: ['30365-6'],
    fetch: async () => ({ ok: false }),
  });

  assert.equal(context.activeJob.jobId, '30365-7');
  assert.equal(context.activeJob.canonicalStateAvailable, false);
  assert.equal(context.activeJob.sourceDeliveryPending, true);
  assert.match(formatJobContext(context), /canonical Arbitrum delivery still unconfirmed/);
});

test('latest transaction diagnostics ground simple and technical chat answers', () => {
  const formatted = formatJobContext({
    available: true,
    jobs: [],
    recentTransactions: [],
    latestTransactionDiagnostic: {
      action: 'startDirectContract',
      jobId: '30365-8',
      step: 'approval',
      phase: 'wallet',
      status: 'wallet',
      chainName: 'XDC Network',
      walletName: 'MetaMask',
      safeToRetry: false,
      summary: 'No transaction has been broadcast.',
      nextStep: 'Open MetaMask pending requests.',
      checks: { walletReachable: true, rpcReachable: true, pendingNonceGap: 0, blockNumber: 123 },
    },
  });
  assert.match(formatted, /Latest transaction attempt diagnostic/);
  assert.match(formatted, /No transaction has been broadcast/);
  assert.match(formatted, /retry is protected/);
  assert.match(formatted, /Never call a transaction tool merely to diagnose/);
});
