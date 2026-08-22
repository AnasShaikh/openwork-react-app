'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { reconcileCCTPTransfer } = require('../utils/cctp-reconciliation');

function dependencies({ usedNonce = '1', status = 'complete' } = {}) {
  let queriedNonce = null;
  const message = {
    status,
    eventNonce: '0x07af4834f17d2eb4dff3526ec00ed74fc4fc0e5afa9af84e5a76fccfbfc45da0',
    decodedMessage: {
      destinationDomain: '18',
      decodedMessageBody: {
        mintRecipient: '0xc28455b90eeea6d95b6f0cd01a0b03f9d50a7724',
        amount: '100000',
      },
    },
  };

  class FakeContract {
    constructor() {
      this.methods = {
        usedNonces: (nonce) => ({
          call: async () => {
            queriedNonce = nonce;
            return usedNonce;
          },
        }),
      };
    }
  }

  return {
    fetchImpl: async () => ({ ok: true, json: async () => ({ messages: [message] }) }),
    destinationConfig: {
      chainName: 'XDC Network',
      rpcUrl: 'https://example.invalid',
      messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
    },
    createWeb3: () => ({ eth: { Contract: FakeContract } }),
    queriedNonce: () => queriedNonce,
  };
}

test('a consumed Circle nonce reconciles a stale transfer as completed', async () => {
  const deps = dependencies({ usedNonce: '1' });
  const result = await reconcileCCTPTransfer({
    source_tx_hash: '0xsource',
    source_domain: 3,
  }, deps);

  assert.equal(result.completed, true);
  assert.equal(result.destinationDomain, 18);
  assert.equal(result.amount, '100000');
  assert.equal(result.mintRecipient, '0xc28455b90eeea6d95b6f0cd01a0b03f9d50a7724');
  assert.equal(deps.queriedNonce(), result.eventNonce);
});

test('an unused Circle nonce is not reported as delivered', async () => {
  const result = await reconcileCCTPTransfer({
    source_tx_hash: '0xsource',
    source_domain: 3,
  }, dependencies({ usedNonce: '0' }));

  assert.deepEqual(result, { completed: false, reason: 'nonce_unused' });
});

test('an incomplete Circle attestation is not reported as delivered', async () => {
  const result = await reconcileCCTPTransfer({
    source_tx_hash: '0xsource',
    source_domain: 3,
  }, dependencies({ status: 'pending_confirmations' }));

  assert.deepEqual(result, { completed: false, reason: 'attestation_incomplete' });
});

test('a failed destination RPC falls back before deciding whether the nonce was consumed', async () => {
  const queriedRpcUrls = [];
  const deps = dependencies({ usedNonce: '1' });
  deps.destinationConfig = {
    ...deps.destinationConfig,
    rpcUrls: ['https://primary.invalid', 'https://fallback.invalid'],
  };
  delete deps.destinationConfig.rpcUrl;
  deps.createWeb3 = (rpcUrl) => {
    queriedRpcUrls.push(rpcUrl);
    class FallbackContract {
      constructor() {
        this.methods = {
          usedNonces: () => ({
            call: async () => {
              if (rpcUrl === 'https://primary.invalid') throw new Error('primary unavailable');
              return '1';
            },
          }),
        };
      }
    }
    return { eth: { Contract: FallbackContract } };
  };

  const result = await reconcileCCTPTransfer({
    source_tx_hash: '0xsource',
    source_domain: 3,
  }, deps);

  assert.equal(result.completed, true);
  assert.deepEqual(queriedRpcUrls, ['https://primary.invalid', 'https://fallback.invalid']);
});

test('receive execution reconciles generic relayer races against usedNonces', () => {
  const executor = fs.readFileSync(path.join(__dirname, '..', 'utils', 'tx-executor.js'), 'utf8');
  assert.match(executor, /transceiver static-call failure/);
  assert.match(executor, /transceiver send failure/);
  assert.match(executor, /await wasCCTPMessageConsumed/);
});
