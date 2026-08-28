'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  conversationReferences,
  inspectJob,
  inspectLatestAttempt,
  inspectTransaction,
  inspectWalletFunding,
  isJobCreationProvenanceQuestion,
  readJobCreationTransaction,
  resolveJobCreationProvenance,
  resolveJobCreationProvenanceAnswer,
  resolveTransactionTarget,
  verifyJobCreationProvenance,
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
    readJobCreationTransaction: async () => ({ available: false }),
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
  assert.equal(job.creation.type, 'direct-contract');
  assert.equal(job.creation.sourceReceiptConfirmed, true);
});

test('job creation provenance comes from its recorded source action, never lifecycle status', () => {
  const openDirect = resolveJobCreationProvenance('30365-11', context({
    memory: {
      recentTransactions: [{
        action: 'startDirectContract',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: true,
      }],
    },
  }));
  assert.equal(openDirect.type, 'direct-contract');
  assert.equal(openDirect.action, 'startDirectContract');
  assert.equal(openDirect.evidenceSource, 'browser-confirmed-history');

  const inProgressPost = resolveJobCreationProvenance('30365-12', context({
    memory: {
      recentTransactions: [{
        action: 'postJob',
        jobId: '30365-12',
        txHash: destinationTxHash,
        chainId: 50,
        confirmed: true,
      }],
    },
  }));
  assert.equal(inProgressPost.type, 'marketplace-posting');
  assert.equal(inProgressPost.action, 'postJob');

  const unknown = resolveJobCreationProvenance('30365-13', context({ memory: { recentTransactions: [] } }));
  assert.equal(unknown.available, false);
  assert.match(unknown.explanation, /Do not infer it from lifecycle status/);
});

test('creation-type questions receive a deterministic source-action answer', async () => {
  const question = 'Was job 30365-11 actually created as a direct contract or as a marketplace posting?';
  assert.equal(isJobCreationProvenanceQuestion(question), true);
  const answer = await resolveJobCreationProvenanceAnswer(question, context({
    memory: {
      activeJob: { jobId: '30365-11' },
      recentTransactions: [{
        action: 'postJob',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: true,
      }],
    },
  }), { readJobCreationTransaction: async () => ({ available: false }) });
  assert.equal(answer.creation.type, 'marketplace-posting');
  assert.match(answer.text, /marketplace posting/);
  assert.match(answer.text, /not a direct contract/);
  assert.equal(await resolveJobCreationProvenanceAnswer('Create a direct contract now', context()), null);
});

test('creation-type questions fail closed instead of falling through to a model guess', async () => {
  const unknownJob = await resolveJobCreationProvenanceAnswer(
    'Was job 30365-999 a direct contract?',
    context(),
    { readJobCreationTransaction: async () => ({ available: false }) },
  );
  assert.equal(unknownJob.creation.available, false);
  assert.match(unknownJob.text, /cannot independently verify/);
  assert.match(unknownJob.text, /will not infer/);

  const unresolvedJob = await resolveJobCreationProvenanceAnswer(
    'Was this a marketplace posting or direct contract?',
    context({ memory: { activeJob: null } }),
  );
  assert.equal(unresolvedJob.jobId, null);
  assert.match(unresolvedJob.text, /cannot verify/);
  assert.match(unresolvedJob.text, /will not infer/);
});

test('durable confirmed creation history outranks contradictory browser memory', () => {
  const creation = resolveJobCreationProvenance('30365-11', context({
    memory: {
      recentTransactions: [{
        action: 'startDirectContract',
        jobId: '30365-11',
        txHash: destinationTxHash,
        chainId: 50,
        confirmed: true,
      }],
    },
    jobContext: {
      durableTransactions: [{
        action: 'postJob',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: true,
      }],
    },
  }));
  assert.equal(creation.type, 'marketplace-posting');
  assert.equal(creation.evidenceSource, 'durable-server-history');
});

test('live source calldata outranks contradictory recorded creation labels', async () => {
  const creation = await verifyJobCreationProvenance('30365-11', context({
    memory: {
      activeJob: { jobId: '30365-11', sourceChainId: 50, sourceTxHash: transactionHash },
      recentTransactions: [{
        action: 'startDirectContract',
        jobId: '30365-11',
        txHash: transactionHash,
        chainId: 50,
        confirmed: true,
      }],
    },
  }), {
    readJobCreationTransaction: async () => ({
      available: true,
      action: 'postJob',
      type: 'marketplace-posting',
      selector: '0xd3988d47',
      transactionHash,
      chainId: 50,
      sourceReceiptConfirmed: true,
      evidenceSource: 'live-source-calldata',
    }),
  });
  assert.equal(creation.type, 'marketplace-posting');
  assert.equal(creation.evidenceSource, 'live-source-calldata');
});

test('source transaction selectors distinguish marketplace and direct creation', async () => {
  const makeWeb3 = (input) => () => ({
    eth: {
      getTransaction: async () => ({
        input,
        to: '0x5cF21fA9Bc3f1B9B477A1DFB76105386a038cE7D',
        blockNumber: 123,
      }),
    },
  });
  const posted = await readJobCreationTransaction(50, transactionHash, { createWeb3: makeWeb3('0xd3988d47abcd') });
  const direct = await readJobCreationTransaction(50, transactionHash, { createWeb3: makeWeb3('0x03edef0eabcd') });
  assert.equal(posted.type, 'marketplace-posting');
  assert.equal(direct.type, 'direct-contract');
  assert.equal(posted.evidenceSource, 'live-source-calldata');
});

test('recognized creation calldata is not treated as completed before mining', async () => {
  const pending = await readJobCreationTransaction(50, transactionHash, {
    createWeb3: () => ({
      eth: {
        getTransaction: async () => ({
          input: '0x03edef0eabcd',
          to: '0x5cF21fA9Bc3f1B9B477A1DFB76105386a038cE7D',
          blockNumber: null,
        }),
      },
    }),
  });
  assert.equal(pending.available, false);
  assert.equal(pending.type, 'direct-contract');
  assert.equal(pending.sourceReceiptConfirmed, false);
  assert.match(pending.explanation, /not mined yet/);
});
