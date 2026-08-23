'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  inferChainId,
  isNativeBalanceQuestion,
  resolveNativeBalanceAnswer,
} = require('../services/oppy-native-balance');

const WALLET = {
  connected: true,
  address: '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C',
  chainId: 50,
};

test('native balance questions are read-only intents even when they mention posting', () => {
  assert.equal(isNativeBalanceQuestion('Do I have enough XDC to post this transaction?'), true);
  assert.equal(isNativeBalanceQuestion('check my wallet balance'), true);
  assert.equal(isNativeBalanceQuestion('Do I have enough USDC?'), false);
  assert.equal(isNativeBalanceQuestion('Post a job'), false);
  assert.equal(inferChainId('check XDC', { chainId: 42161 }), 50);
});

test('Oppy returns the live XDC balance without an indexer', async () => {
  const answer = await resolveNativeBalanceAnswer(
    'Do I have enough XDC to post this transaction?',
    WALLET,
    {},
    { readBalance: async () => 289_296_832_824_877_939n },
  );

  assert.equal(answer.balanceWei, '289296832824877939');
  assert.match(answer.text, /0\.289296 XDC/);
  assert.match(answer.text, /indexer is not needed/i);
  assert.match(answer.text, /full quote plus buffered gas/i);
});

test('Oppy compares the live balance with the latest full transaction preflight', async () => {
  const answer = await resolveNativeBalanceAnswer(
    'Do I have enough XDC?',
    WALLET,
    {
      latestTransactionDiagnostic: {
        chainId: 50,
        updatedAt: '2026-08-23T08:00:00.000Z',
        checks: {
          nativeRequiredWei: '4530000000000000000',
          nativeFundingGasIncluded: true,
          nativeFundingCheckedAt: '2026-08-23T08:00:00.000Z',
        },
      },
    },
    { readBalance: async () => 289_296_832_824_877_939n },
  );

  assert.match(answer.text, /^No\./);
  assert.match(answer.text, /4\.53 XDC/);
  assert.match(answer.text, /short by at least \*\*4\.240703 XDC\*\*/);
  assert.match(answer.text, /No transaction was submitted/);
  assert.equal(answer.requirementWei, '4530000000000000000');
});

test('Oppy requests a connected wallet instead of inventing a balance', async () => {
  const answer = await resolveNativeBalanceAnswer(
    'What is my XDC balance?',
    { connected: false, address: null, chainId: 50 },
  );
  assert.equal(answer.balanceWei, null);
  assert.match(answer.text, /Connect the wallet/);
});
