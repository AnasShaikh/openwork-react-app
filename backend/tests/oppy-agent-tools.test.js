'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  conversationReferences,
  inspectJob,
  inspectLatestAttempt,
  inspectTransaction,
  inspectWalletFunding,
  resolveTransactionTarget,
} = require('../services/oppy-agent-tools');

const walletAddress = '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C';
const transactionHash = `0x${'a'.repeat(64)}`;
const destinationTxHash = `0x${'b'.repeat(64)}`;

function context(overrides = {}) {
  return {
    message: 'Can you tell me if that actually worked?',
    history: [],
    wallet: {
      connected: true,
      address: walletAddress,
      chainId: 50,
      chainName: 'XDC Network',
    },
    memory: {
      activeJob: { jobId: '30365-11', sourceChainId: 50, sourceTxHash: transactionHash, sourceReceiptConfirmed: true },
      recentTransactions: [{
        action: 'startDirectContract',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: true,
      }],
      latestTransactionDiagnostic: null,
      lastPreparedAction: null,
    },
    jobContext: { jobs: [] },
    ...overrides,
  };
}

test('conversation references recover full transaction hashes, job IDs and chains from natural chat', () => {
  const references = conversationReferences('Did this XDC one work?', [
    { role: 'oppy', text: `Job 30365-11 is syncing. https://xdcscan.com/tx/${transactionHash}` },
  ]);
  assert.deepEqual(references, {
    transactionHash,
    jobId: '30365-11',
    chainId: 50,
  });
});

test('the latest transaction target is resolved from memory without asking the user for technical IDs', () => {
  const target = resolveTransactionTarget({}, context());
  assert.equal(target.transactionHash, transactionHash);
  assert.equal(target.jobId, '30365-11');
  assert.equal(target.chainId, 50);
  assert.equal(target.action, 'startDirectContract');
});

test('transaction inspection joins the source receipt and cross-chain delivery evidence', async () => {
  let deliveryInput;
  const result = await inspectTransaction({}, context(), {
    readTransactionReceipt: async () => ({
      state: 'confirmed',
      confirmed: true,
      reverted: false,
      blockNumber: '123',
      transactionHash,
    }),
    readCrossChainActionStatus: async (input) => {
      deliveryInput = input;
      return {
        state: 'complete',
        complete: true,
        checkedAt: '2026-08-28T05:00:00.000Z',
        source: { chainName: 'XDC Network' },
        layerZero: { state: 'delivered', destinationTxHash },
        canonical: { state: 'complete', jobExists: true, statusCode: 1 },
        cctp: { required: false, state: 'received' },
        links: { canonicalExplorerUrl: `https://arbiscan.io/tx/${destinationTxHash}` },
      };
    },
  });

  assert.equal(deliveryInput.jobId, '30365-11');
  assert.equal(deliveryInput.sourceTxHash, transactionHash);
  assert.equal(result.source.confirmed, true);
  assert.equal(result.delivery.networkDelivery.state, 'delivered');
  assert.equal(result.delivery.openWork.state, 'complete');
  assert.equal(result.complete, true);
  assert.equal(result.safeToRetry, false);
  assert.equal(result.retryInstruction, 'No retry is needed.');
});

test('pending transactions remain retry protected even when the user says nothing happened', async () => {
  const result = await inspectTransaction({}, context({
    memory: {
      activeJob: null,
      recentTransactions: [{
        action: 'releasePayment',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: false,
      }],
      latestTransactionDiagnostic: { action: 'releasePayment', status: 'pending', safeToRetry: false },
    },
  }), {
    readTransactionReceipt: async () => ({ state: 'pending', confirmed: false, reverted: false, blockNumber: null }),
  });
  assert.equal(result.complete, false);
  assert.equal(result.safeToRetry, false);
  assert.match(result.retryInstruction, /Do not retry/);
});

test('wallet funding compares live native and USDC balances with the prepared action', async () => {
  const result = await inspectWalletFunding({}, context({
    memory: {
      latestTransactionDiagnostic: {
        action: 'startDirectContract',
        chainId: 50,
        checks: {
          nativeRequiredWei: '4000000000000000000',
          nativeFundingGasIncluded: true,
        },
      },
      lastPreparedAction: {
        name: 'startDirectContract',
        params: { budget: 0.1 },
      },
    },
  }), {
    readNativeBalance: async () => 5_000_000_000_000_000_000n,
    readUsdcBalance: async () => 75_000n,
  });

  assert.equal(result.native.balance, '5');
  assert.equal(result.native.required, '4');
  assert.equal(result.native.sufficient, true);
  assert.equal(result.usdc.balance, '0.075');
  assert.equal(result.usdc.required, '0.1');
  assert.equal(result.usdc.sufficient, false);
});

test('latest-attempt and job tools return compact, conversation-grounded evidence', async () => {
  const latest = inspectLatestAttempt(context({
    memory: {
      latestTransactionDiagnostic: {
        action: 'releasePayment',
        jobId: '30365-11',
        status: 'wallet',
        summary: 'Waiting for MetaMask.',
        safeToRetry: false,
      },
      lastPreparedAction: { name: 'releasePayment', params: { jobId: '30365-11' } },
      recentTransactions: [],
    },
  }));
  assert.equal(latest.available, true);
  assert.equal(latest.diagnostic.summary, 'Waiting for MetaMask.');
  assert.match(latest.safety, /Do not prepare a duplicate/);

  const job = await inspectJob({}, context(), {
    getJobDeepDive: async (jobId) => ({
      generatedAt: '2026-08-28T05:00:00.000Z',
      job: { jobId, status: 'In progress', applicationCount: 1 },
      milestones: [{ index: 0, amount: '0.1', paid: false }],
      applications: [{}],
      submissions: [],
      nextAction: { type: 'release-payment', label: 'Release payment' },
    }),
  });
  assert.equal(job.job.jobId, '30365-11');
  assert.equal(job.applicationCount, 1);
  assert.equal(job.nextAction.type, 'release-payment');
});
