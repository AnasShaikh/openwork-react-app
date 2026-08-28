'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  formatCrossChainStatusAnswer,
  isCrossChainStatusQuestion,
  latestTrackedTransaction,
  resolveCrossChainStatusAnswer,
} = require('../services/oppy-cross-chain-answer');

const sourceTxHash = `0x${'a'.repeat(64)}`;
const destinationTxHash = `0x${'b'.repeat(64)}`;

function memory(action = 'startDirectContract') {
  return {
    activeJob: { jobId: '30365-10' },
    recentTransactions: [{
      action,
      jobId: '30365-10',
      txHash: sourceTxHash,
      chainId: 50,
      confirmed: true,
      targetDomain: action === 'releasePayment' ? 18 : null,
      baselineTotalPaidRaw: action === 'releasePayment' ? '0' : null,
    }],
  };
}

function completeStatus(action = 'startDirectContract') {
  return {
    action,
    jobId: '30365-10',
    state: 'complete',
    complete: true,
    source: { chainName: 'XDC Network' },
    layerZero: { state: 'delivered' },
    canonical: { state: 'complete', jobExists: true },
    cctp: { required: action === 'releasePayment', state: 'received', targetChainName: 'XDC Network' },
    links: { canonicalExplorerUrl: `https://arbiscan.io/tx/${destinationTxHash}` },
  };
}

test('simple completion follow-ups are recognized without hijacking new actions', () => {
  assert.equal(isCrossChainStatusQuestion('is it done?'), true);
  assert.equal(isCrossChainStatusQuestion('Has the contract synced yet?'), true);
  assert.equal(isCrossChainStatusQuestion('status for 30365-10'), true);
  assert.equal(isCrossChainStatusQuestion('is it confirmed?'), true);
  assert.equal(isCrossChainStatusQuestion('did my money thing actually happen'), false);
  assert.equal(isCrossChainStatusQuestion('release the payment'), false);
  assert.equal(isCrossChainStatusQuestion('create another direct contract'), false);
});

test('the active job selects its exact confirmed transaction and preserves release proof inputs', () => {
  const selected = latestTrackedTransaction({
    activeJob: { jobId: '30365-10' },
    recentTransactions: [
      { action: 'postJob', jobId: '30365-9', txHash: destinationTxHash, chainId: 50, confirmed: true },
      ...memory('releasePayment').recentTransactions,
    ],
  });
  assert.equal(selected.action, 'releasePayment');
  assert.equal(selected.targetDomain, 18);
  assert.equal(selected.baselineTotalPaidRaw, '0');
});

test('a completed direct contract gets an authoritative action-correct answer', async () => {
  let verifierInput = null;
  const result = await resolveCrossChainStatusAnswer('is it done?', memory(), {
    readCrossChainActionStatus: async (input) => {
      verifierInput = input;
      return completeStatus();
    },
  });
  assert.equal(verifierInput.action, 'startDirectContract');
  assert.equal(verifierInput.jobId, '30365-10');
  assert.match(result.text, /direct contract/);
  assert.match(result.text, /contract is active/);
  assert.match(result.text, /No retry is needed/);
  assert.doesNotMatch(result.text, /job post|indexer/);
});

test('release completion requires and reports destination receipt evidence', async () => {
  const result = await resolveCrossChainStatusAnswer('did it go through?', memory('releasePayment'), {
    readCrossChainActionStatus: async () => completeStatus('releasePayment'),
  });
  assert.match(result.text, /payment release/);
  assert.match(result.text, /USDC receipt is confirmed on XDC Network/);
});

test('temporary verifier unavailability never becomes a false completion or retry instruction', () => {
  const text = formatCrossChainStatusAnswer({
    action: 'startDirectContract',
    jobId: '30365-10',
    state: 'unavailable',
    complete: false,
    source: { chainName: 'XDC Network' },
  });
  assert.match(text, /cannot prove final delivery yet/);
  assert.match(text, /Do not retry/);
  assert.doesNotMatch(text, /^Yes/);
});
