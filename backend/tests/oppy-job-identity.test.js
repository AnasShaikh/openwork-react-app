'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isJobIdentityQuestion,
  resolveJobIdentityAnswer,
  resolveLatestPostedJob,
} = require('../services/oppy-job-identity');

const txHash = (character) => `0x${character.repeat(64)}`;

test('job-ID requests are deterministic, including a short follow-up', () => {
  assert.equal(isJobIdentityQuestion('Do you remember the job id for the last job I posted?'), true);
  assert.equal(isJobIdentityQuestion('What job ID did you get when you checked?'), true);
  assert.equal(isJobIdentityQuestion('I dont remember, can you check?', [
    { role: 'oppy', text: 'What job ID did you get when you checked?' },
  ]), true);
  assert.equal(isJobIdentityQuestion('Can you check the payment status?'), false);
});

test('durable confirmed history replaces a stale browser active job', () => {
  const context = {
    activeJob: {
      jobId: '30365-7',
      sourceChainId: 50,
      sourceReceiptConfirmed: true,
    },
    recentTransactions: [{
      action: 'postJob',
      jobId: '30365-7',
      txHash: txHash('7'),
      chainId: 50,
      confirmed: true,
    }],
    durableTransactions: [{
      action: 'startDirectContract',
      jobId: '30365-10',
      txHash: txHash('a'),
      chainId: 50,
      confirmed: true,
      createdAt: '2026-08-23T05:38:52.000Z',
    }],
    posterJobIds: ['30365-7', '30365-10'],
    jobs: [{
      jobId: '30365-10',
      title: 'Sample Direct Contract',
      postingChainName: 'XDC Network',
      status: 1,
    }],
  };

  const job = resolveLatestPostedJob(context);
  assert.equal(job.jobId, '30365-10');
  assert.equal(job.title, 'Sample Direct Contract');

  const answer = resolveJobIdentityAnswer('I dont remember, can you check?', [
    { role: 'oppy', text: 'What job ID did you get when you checked?' },
  ], context);
  assert.equal(answer.job.jobId, '30365-10');
  assert.match(answer.text, /30365-10/);
  assert.match(answer.text, /live job history/i);
  assert.doesNotMatch(answer.text, /indexer|explorer|30365-7/i);
});

test('canonical poster order recovers the latest job when server receipt history is empty', () => {
  const answer = resolveJobIdentityAnswer('What was the last job ID I posted?', [], {
    activeJob: { jobId: '30365-7', sourceChainId: 50, sourceReceiptConfirmed: true },
    recentTransactions: [{
      action: 'postJob',
      jobId: '30365-7',
      txHash: txHash('7'),
      chainId: 50,
      confirmed: true,
    }],
    durableTransactions: [],
    posterJobIds: ['30365-7', '30365-8', '30365-9', '30365-10'],
    jobs: [],
  });

  assert.equal(answer.job.jobId, '30365-10');
  assert.match(answer.text, /30365-10/);
  assert.match(answer.text, /live job history/i);
});

test('a newer source-confirmed browser job wins while canonical delivery is pending', () => {
  const job = resolveLatestPostedJob({
    activeJob: {
      jobId: '30365-12',
      sourceChainId: 50,
      sourceReceiptConfirmed: true,
    },
    recentTransactions: [{
      action: 'postJob',
      jobId: '30365-12',
      txHash: txHash('c'),
      chainId: 50,
      confirmed: true,
    }],
    durableTransactions: [{
      action: 'postJob',
      jobId: '30365-11',
      txHash: txHash('b'),
      chainId: 50,
      confirmed: true,
    }],
    posterJobIds: ['30365-11'],
    jobs: [],
  });
  assert.equal(job.jobId, '30365-12');
  assert.equal(job.sourceReceiptConfirmed, true);
});
