import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPPY_JOB_GREETING,
  activeJobFromMessage,
  historyForOppy,
  jobChainFromId,
  loadOppyMemory,
  recordOppyTransaction,
  saveOppyMemory,
} from '../src/services/oppyMemory.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test('Oppy persists bounded conversation and XDC active-job memory per wallet', () => {
  const storage = memoryStorage();
  const scope = '0x7a2b7feab9b0e30a5368d3cc4cb8279c9606384c';
  saveOppyMemory(scope, {
    messages: [
      OPPY_JOB_GREETING,
      { role: 'user', text: 'Remember job 30365-6' },
      { role: 'bot', text: 'I will use 30365-6.' },
      { role: 'bot', isTxCard: true, tool: { name: 'releasePayment' } },
    ],
    activeJob: {
      jobId: '30365-6',
      title: 'Minimal XDC cycle',
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
  }, storage);

  const loaded = loadOppyMemory(scope, [OPPY_JOB_GREETING], storage);
  assert.equal(loaded.messages.length, 3);
  assert.equal(loaded.activeJob.jobId, '30365-6');
  assert.equal(loaded.activeJob.sourceChainName, 'XDC Network');
  assert.equal(loaded.recentTransactions[0].confirmed, true);
});

test('explicit job IDs replace pronoun memory while ordinary follow-ups retain it', () => {
  const xdc = activeJobFromMessage('release payment for 30365-6');
  assert.equal(xdc.jobId, '30365-6');
  assert.equal(xdc.sourceChainId, 50);
  assert.equal(activeJobFromMessage('release payment for this job', xdc).jobId, '30365-6');
  assert.equal(activeJobFromMessage('actually use 42161-27', xdc).jobId, '42161-27');
  assert.equal(jobChainFromId('30111-9').chainId, 10);
});

test('history excludes greetings and stale transaction cards and keeps recent receipts', () => {
  const history = historyForOppy([
    OPPY_JOB_GREETING,
    { role: 'user', text: 'hello' },
    { role: 'bot', text: 'hi' },
    { role: 'bot', isThinking: true, text: '' },
  ]);
  assert.deepEqual(history, [
    { role: 'user', text: 'hello' },
    { role: 'oppy', text: 'hi' },
  ]);

  const txs = recordOppyTransaction([], {
    action: 'postJob',
    jobId: '30365-6',
    txHash: `0x${'b'.repeat(64)}`,
    chainId: 50,
    confirmed: true,
  });
  assert.equal(txs[0].jobId, '30365-6');
});
