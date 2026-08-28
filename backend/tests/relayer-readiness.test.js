'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { destinationDomainForAction, readRelayerReadiness } = require('../services/relayer-readiness');

test('only actions with a destination Circle receive require the service wallet', () => {
  assert.equal(destinationDomainForAction({ action: 'postJob', sourceChainId: 50 }), null);
  assert.equal(destinationDomainForAction({ action: 'startDirectContract', sourceChainId: 50 }), 3);
  assert.equal(destinationDomainForAction({ action: 'startDirectContract', sourceChainId: 42161 }), null);
  assert.equal(destinationDomainForAction({ action: 'releasePayment', sourceChainId: 50, targetDomain: 18 }), 18);
  assert.equal(destinationDomainForAction({ action: 'releasePayment', sourceChainId: 50, targetDomain: 3 }), null);
});

test('an underfunded relayer is reported before the user source transaction', async () => {
  const readiness = await readRelayerReadiness({
    action: 'startDirectContract',
    sourceChainId: 50,
    targetDomain: 3,
  }, {
    walletAddress: '0x93514040f43aB16D52faAe7A3f380c4089D844F9',
    disableCache: true,
    readChainState: async () => ({
      balanceWei: '1',
      gasPriceWei: '1000000000',
      receiverCode: '0x6000',
    }),
  });

  assert.equal(readiness.required, true);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.reason, 'service_wallet_underfunded');
  assert.equal(readiness.recoverySupported, true);
  assert.ok(BigInt(readiness.shortfallWei) > 0n);
});

test('a missing destination contract fails closed even with a funded wallet', async () => {
  const readiness = await readRelayerReadiness({ action: 'startJob', sourceChainId: 50 }, {
    walletAddress: '0x93514040f43aB16D52faAe7A3f380c4089D844F9',
    disableCache: true,
    readChainState: async () => ({
      balanceWei: '1000000000000000000',
      gasPriceWei: '1',
      receiverCode: '0x',
    }),
  });
  assert.equal(readiness.ready, false);
  assert.equal(readiness.reason, 'destination_contract_unavailable');
  assert.equal(readiness.recoverySupported, false);
});
