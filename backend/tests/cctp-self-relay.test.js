'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const config = require('../config');
const { Web3 } = require('web3');
const { buildCctpRecoveryPlan, normalizeAddress, validateDirectContractSource } = require('../services/cctp-self-relay');

const sourceTxHash = `0x${'a'.repeat(64)}`;
const nonce = `0x${'b'.repeat(64)}`;

function circleMessage(overrides = {}) {
  return {
    status: 'complete',
    message: '0x1234',
    attestation: '0xabcd',
    eventNonce: nonce,
    destinationDomain: 3,
    decodedMessage: {
      destinationDomain: 3,
      decodedMessageBody: {
        mintRecipient: `0x${'0'.repeat(24)}${config.NOWJC_ADDRESS.slice(2)}`,
        amount: '100000',
      },
    },
    ...overrides,
  };
}

test('a direct-contract Circle attestation becomes a fixed permissionless receive plan', async () => {
  const plan = await buildCctpRecoveryPlan({
    action: 'startDirectContract',
    jobId: '30365-13',
    sourceTxHash,
    sourceChainId: 50,
  }, {
    validateDirectContractSource: async () => true,
    fetchCircleMessage: async () => circleMessage(),
    isCCTPMessageConsumed: async () => false,
  });

  assert.equal(plan.ready, true);
  assert.equal(plan.alreadyCompleted, false);
  assert.equal(plan.chainId, config.isMainnet() ? 42161 : 421614);
  assert.equal(plan.to.toLowerCase(), config.MESSAGE_TRANSMITTER_ARB.toLowerCase());
  assert.equal(plan.method, 'receiveMessage');
  assert.match(plan.data, /^0x[a-fA-F0-9]+$/);
  assert.equal(plan.amountRaw, '100000');
});

test('a consumed nonce cannot produce a duplicate destination transaction', async () => {
  const plan = await buildCctpRecoveryPlan({
    action: 'startDirectContract',
    jobId: '30365-13',
    sourceTxHash,
    sourceChainId: 50,
  }, {
    validateDirectContractSource: async () => true,
    fetchCircleMessage: async () => circleMessage(),
    isCCTPMessageConsumed: async () => true,
  });
  assert.equal(plan.ready, false);
  assert.equal(plan.alreadyCompleted, true);
  assert.equal(plan.reason, 'nonce_consumed');
  assert.equal(plan.data, undefined);
});

test('a direct-contract attestation for another mint recipient is rejected', async () => {
  await assert.rejects(() => buildCctpRecoveryPlan({
    action: 'startDirectContract',
    jobId: '30365-13',
    sourceTxHash,
    sourceChainId: 50,
  }, {
    validateDirectContractSource: async () => true,
    fetchCircleMessage: async () => circleMessage({
      decodedMessage: { destinationDomain: 3, decodedMessageBody: { mintRecipient: `0x${'1'.repeat(40)}`, amount: '100000' } },
    }),
    isCCTPMessageConsumed: async () => false,
  }), /mint recipient/);
});

test('bytes32 Circle recipients normalize to their EVM address', () => {
  assert.equal(normalizeAddress(`0x${'0'.repeat(24)}${config.NOWJC_ADDRESS.slice(2)}`), config.NOWJC_ADDRESS.toLowerCase());
});

test('wallet recovery is bound to the mined direct-contract action and exact job ID', async () => {
  const sourceContract = config.LOWJC_XDC_ADDRESS;
  const createWeb3 = () => ({
    eth: {
      getTransaction: async () => ({
        to: sourceContract,
        input: `0x03edef0e${'0'.repeat(64)}`,
      }),
      getTransactionReceipt: async () => ({
        logs: [{
          topics: [
            Web3.utils.keccak256('JobPosted(string,address)'),
            Web3.utils.keccak256('30365-13'),
          ],
        }],
      }),
    },
  });

  assert.equal(await validateDirectContractSource({
    sourceChainId: 50,
    sourceTxHash,
    jobId: '30365-13',
  }, { createWeb3 }), true);

  await assert.rejects(() => validateDirectContractSource({
    sourceChainId: 50,
    sourceTxHash,
    jobId: '30365-14',
  }, { createWeb3 }), /does not prove this OpenWork job ID/);
});
