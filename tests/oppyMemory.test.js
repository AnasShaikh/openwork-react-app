import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPPY_JOB_GREETING,
  activeJobFromMessage,
  historyForOppy,
  jobChainFromId,
  loadOppyMemory,
  recordOppyTransaction,
  sanitizePreparedAction,
  sanitizeOppyText,
  saveOppyMemory,
  selectPendingCrossChainTransaction,
  updateOppyTransactionDelivery,
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
      action: 'releasePayment',
      jobId: '30365-6',
      txHash: `0x${'a'.repeat(64)}`,
      chainId: 50,
      confirmed: true,
      targetDomain: 18,
      baselineTotalPaidRaw: '0',
      delivery: {
        state: 'complete',
        complete: true,
        networkState: 'delivered',
        canonicalState: 'complete',
        paymentState: 'received',
        destinationTxHash: `0x${'d'.repeat(64)}`,
        checkedAt: '2026-08-28T04:59:46.000Z',
      },
    }],
    latestTransactionDiagnostic: {
      attemptId: 'attempt-1',
      action: 'startDirectContract',
      walletName: 'MetaMask',
      chainId: 50,
      chainName: 'XDC Network',
      phase: 'wallet',
      step: 'approval',
      status: 'wallet',
      summary: 'Waiting for approval.',
      nextStep: 'Open the wallet.',
      safeToRetry: false,
      checks: {
        walletReachable: true,
        nativeBalanceWei: '289296832824877939',
        nativeRequiredWei: '4530000000000000000',
        nativeShortfallWei: '4240703167175122061',
        nativeSymbol: 'XDC',
        nativeFundingSufficient: false,
        nativeFundingGasIncluded: true,
        nativeFundingCheckedAt: '2026-08-23T08:00:00.000Z',
      },
    },
    lastPreparedAction: {
      name: 'startDirectContract',
      kind: 'transaction',
      display: 'Create a direct contract',
      params: {
        title: 'React Developer',
        budget: 0.1,
        description: 'Build the interface',
        jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
      },
    },
  }, storage);

  const loaded = loadOppyMemory(scope, [OPPY_JOB_GREETING], storage);
  assert.equal(loaded.messages.length, 3);
  assert.equal(loaded.activeJob.jobId, '30365-6');
  assert.equal(loaded.activeJob.sourceChainName, 'XDC Network');
  assert.equal(loaded.recentTransactions[0].confirmed, true);
  assert.equal(loaded.recentTransactions[0].targetDomain, 18);
  assert.equal(loaded.recentTransactions[0].baselineTotalPaidRaw, '0');
  assert.equal(loaded.recentTransactions[0].delivery.state, 'complete');
  assert.equal(loaded.recentTransactions[0].delivery.canonicalState, 'complete');
  assert.equal(loaded.recentTransactions[0].delivery.destinationTxHash, `0x${'d'.repeat(64)}`);
  assert.equal(loaded.latestTransactionDiagnostic.step, 'approval');
  assert.equal(loaded.latestTransactionDiagnostic.safeToRetry, false);
  assert.equal(loaded.latestTransactionDiagnostic.checks.nativeBalanceWei, '289296832824877939');
  assert.equal(loaded.latestTransactionDiagnostic.checks.nativeFundingSufficient, false);
  assert.equal(loaded.lastPreparedAction.name, 'startDirectContract');
  assert.equal(loaded.lastPreparedAction.params.budget, 0.1);
});

test('prepared-action memory is bounded to supported transaction tools', () => {
  assert.equal(sanitizePreparedAction({ name: 'browseJobs', params: {} }), null);
  assert.equal(sanitizePreparedAction({ name: 'startDirectContract', params: null }), null);
  assert.equal(sanitizePreparedAction({
    name: 'startDirectContract',
    params: { description: 'x'.repeat(13 * 1024) },
  }), null);
  assert.equal(sanitizePreparedAction({
    name: 'postJob',
    params: {
      title: 'Frontend Developer – Direct Contract',
      budget: 0.1,
      description: 'Job taker: 0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
    },
  }), null);
});

test('explicit job IDs replace pronoun memory while ordinary follow-ups retain it', () => {
  const sourceTxHash = `0x${'c'.repeat(64)}`;
  const xdc = activeJobFromMessage('release payment for 30365-6', {
    jobId: '30365-6',
    sourceChainId: 50,
    sourceTxHash,
    sourceReceiptConfirmed: true,
  });
  assert.equal(xdc.jobId, '30365-6');
  assert.equal(xdc.sourceChainId, 50);
  assert.equal(xdc.sourceTxHash, sourceTxHash);
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

test('live tracker updates the matching transaction and Oppy receives only the latest twelve messages', () => {
  const txHash = `0x${'e'.repeat(64)}`;
  const transactions = updateOppyTransactionDelivery([{
    action: 'startDirectContract',
    jobId: '30365-11',
    txHash,
    chainId: 50,
    confirmed: true,
  }], { sourceTxHash: txHash }, {
    state: 'complete',
    complete: true,
    checkedAt: '2026-08-28T05:00:00.000Z',
    layerZero: { state: 'delivered', destinationTxHash: `0x${'f'.repeat(64)}` },
    canonical: { state: 'complete' },
    cctp: { state: 'received', targetDomain: 18 },
  });
  assert.equal(transactions[0].delivery.state, 'complete');
  assert.equal(transactions[0].delivery.networkState, 'delivered');
  assert.equal(transactions[0].delivery.canonicalState, 'complete');
  assert.equal(transactions[0].targetDomain, 18);

  const history = historyForOppy(Array.from({ length: 20 }, (_, index) => ({
    role: index % 2 ? 'bot' : 'user',
    text: `message ${index}`,
  })));
  assert.equal(history.length, 12);
  assert.equal(history[0].text, 'message 8');
  assert.equal(history.at(-1).text, 'message 19');
});

test('restored tracking stays scoped to the active job after its recovery completes', () => {
  const oldHash = `0x${'1'.repeat(64)}`;
  const currentHash = `0x${'2'.repeat(64)}`;
  const transactions = [{
    action: 'releasePayment', jobId: '30365-9', txHash: oldHash, chainId: 50, confirmed: true,
  }, {
    action: 'startDirectContract', jobId: '30365-13', txHash: currentHash, chainId: 50, confirmed: true,
    delivery: { state: 'complete', complete: true },
  }];

  assert.equal(selectPendingCrossChainTransaction(transactions, { jobId: '30365-13' }), null);
  assert.equal(selectPendingCrossChainTransaction(transactions, null)?.jobId, '30365-9');
});

test('stored Oppy text removes internal traces and renders tables as readable bullets', () => {
  const rawTrace = `Opening that now.\n\n<tool_call>{"name":"internal"}</tool_call>\n<tool_response>{"status":"ok"}</tool_response>\n<function_calls><invoke name="open_direct_contract_screen"><parameter name="milestones">[{"amount":0.001}]</parameter></invoke></function_calls>`;
  assert.equal(
    sanitizeOppyText(rawTrace),
    "I couldn't prepare that review card. Please try the action again.",
  );

  const rawTable = `| Field | Value |\n|---|---|\n| Title | Direct Payment Task |\n| Budget | 0.001 USDC |`;
  const cleanTable = sanitizeOppyText(rawTable);
  assert.equal(cleanTable.includes('|---|'), false);
  assert.match(cleanTable, /\*\*Field:\*\* Title/);
  assert.match(cleanTable, /\*\*Value:\*\* 0\.001 USDC/);
});
