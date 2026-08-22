'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  destinationTransactionHash,
  readCrossChainActionStatus,
} = require('../services/cross-chain-action-status');

const sourceTxHash = `0x${'a'.repeat(64)}`;
const destinationTxHash = `0x${'b'.repeat(64)}`;

function releaseDependencies({ paidRaw = '100000', cctpComplete = true } = {}) {
  return {
    fetchLayerZeroMessage: async () => ({
      status: { name: 'DELIVERED' },
      destination: { tx: { txHash: destinationTxHash } },
    }),
    readCanonicalJob: async () => ({
      jobId: '30365-9',
      status: 2,
      selectedApplicant: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
      totalPaid: String(Number(paidRaw) / 1_000_000),
      totalPaidRaw: paidRaw,
      currentMilestone: 1,
    }),
    reconcileCCTPTransfer: async () => (cctpComplete
      ? {
          completed: true,
          eventNonce: `0x${'c'.repeat(64)}`,
          destinationDomain: 18,
          mintRecipient: '0xc28455b90eeea6d95b6f0cd01a0b03f9d50a7724',
          amount: '99986',
        }
      : { completed: false, reason: 'nonce_unused' }),
  };
}

function releaseInput() {
  return {
    action: 'releasePayment',
    jobId: '30365-9',
    sourceChainId: 50,
    sourceTxHash,
    targetDomain: 18,
    baselineTotalPaidRaw: '0',
  };
}

test('a release completes only after LayerZero, paid-state delta and CCTP receipt agree', async () => {
  const status = await readCrossChainActionStatus(releaseInput(), releaseDependencies());
  assert.equal(status.state, 'complete');
  assert.equal(status.complete, true);
  assert.equal(status.layerZero.destinationTxHash, destinationTxHash);
  assert.equal(status.canonical.totalPaidRaw, '100000');
  assert.equal(status.cctp.state, 'received');
  assert.equal(status.cctp.amountRaw, '99986');
});

test('an existing completed job cannot satisfy a release without a paid-state delta', async () => {
  const status = await readCrossChainActionStatus(releaseInput(), releaseDependencies({ paidRaw: '0' }));
  assert.equal(status.complete, false);
  assert.equal(status.canonical.state, 'pending');
  assert.equal(status.cctp.state, 'received');
});

test('canonical payment state cannot hide an unconsumed Circle nonce', async () => {
  const status = await readCrossChainActionStatus(releaseInput(), releaseDependencies({ cctpComplete: false }));
  assert.equal(status.complete, false);
  assert.equal(status.canonical.state, 'complete');
  assert.equal(status.cctp.state, 'pending');
  assert.equal(status.cctp.reason, 'nonce_unused');
});

test('LayerZero destination hashes are read from the current nested API shape', () => {
  assert.equal(destinationTransactionHash({ destination: { tx: { txHash: destinationTxHash } } }), destinationTxHash);
  assert.equal(destinationTransactionHash({ dstTxHash: destinationTxHash }), destinationTxHash);
  assert.equal(destinationTransactionHash({ destination: { tx: { txHash: 'invalid' } } }), null);
});
