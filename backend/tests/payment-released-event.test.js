'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { classifyPaymentReleasedJobId } = require('../utils/payment-released-event');

test('global listener skips an indexed dynamic-string topic hash', () => {
  const topicHash = '0x566b0300f1760376cf2affb565ccb097042abb57f5894c268060398b50b12782';
  assert.deepEqual(classifyPaymentReleasedJobId(topicHash), {
    shouldProcess: false,
    reason: 'indexed_job_id_hash',
    topicHash,
  });
});

test('global listener skips native Arbitrum payments that need no CCTP relay', () => {
  assert.deepEqual(classifyPaymentReleasedJobId('42161-22'), {
    shouldProcess: false,
    reason: 'native_arbitrum_payment',
    jobId: '42161-22',
    chainId: 42161,
  });
});

test('global listener accepts a decoded cross-chain job ID', () => {
  assert.deepEqual(classifyPaymentReleasedJobId('30111-42'), {
    shouldProcess: true,
    jobId: '30111-42',
    chainId: 10,
  });
});

test('global listener rejects malformed IDs without starting a relay', () => {
  const result = classifyPaymentReleasedJobId('not-a-job');
  assert.equal(result.shouldProcess, false);
  assert.equal(result.reason, 'invalid_job_id');
});
