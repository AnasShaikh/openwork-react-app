import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  blockTimeoutForChain,
  applyTxTimeouts,
  explainSendFailure,
  findStuckTransaction,
} from '../src/services/txReliability.js';

const TIMEOUT_ERROR = (hash) => ({
  message: `Transaction started at 490777013 but was not mined within 80 blocks. Please make sure your transaction was properly sent. Transaction Hash: ${hash}`,
});

const HASH = '0x62892cc2b63bf5b70506746bbffa5a5d4ecc4e9f511a6071758b1d189789cd77';

function fakeWeb3({ receipt = null, transaction = null, latest = 5, pending = 5 } = {}) {
  return {
    eth: {
      getTransactionReceipt: async () => receipt,
      getTransaction: async () => transaction,
      getTransactionCount: async (_a, block) => (block === 'pending' ? pending : latest),
    },
  };
}

test('Arbitrum gets a far larger block budget than Ethereum', () => {
  // The whole bug: 80 blocks is ~20s on Arbitrum. Budget must be in wall-clock.
  const arb = blockTimeoutForChain(42161);
  const eth = blockTimeoutForChain(1);
  assert.ok(arb >= 2400, `Arbitrum budget too small: ${arb}`);
  assert.ok(arb > eth * 10, 'Arbitrum needs far more blocks than Ethereum for equal time');
});

test('an unknown chain still gets a usable budget', () => {
  assert.ok(blockTimeoutForChain(999999) >= 50);
});

test('applyTxTimeouts sets the properties and never throws on a frozen object', () => {
  const w = {};
  applyTxTimeouts(w, 42161);
  assert.equal(w.transactionBlockTimeout, blockTimeoutForChain(42161));
  assert.equal(w.transactionConfirmationBlocks, 1);
  assert.doesNotThrow(() => applyTxTimeouts(Object.freeze({}), 42161));
});

test('a timed-out transaction that actually succeeded is reported as success, not retryable', async () => {
  const v = await explainSendFailure(fakeWeb3({ receipt: { status: true } }), TIMEOUT_ERROR(HASH));
  assert.equal(v.outcome, 'succeeded');
  assert.equal(v.safeToRetry, false);
  assert.match(v.message, /Do not send it again/i);
});

test('a mined-but-reverted transaction is retryable and states no funds moved', async () => {
  const v = await explainSendFailure(fakeWeb3({ receipt: { status: false } }), TIMEOUT_ERROR(HASH));
  assert.equal(v.outcome, 'reverted');
  assert.equal(v.safeToRetry, true);
  assert.match(v.message, /no funds moved/i);
});

test('a still-pending transaction warns against resubmitting', async () => {
  // The dangerous case: retrying here can pay twice.
  const v = await explainSendFailure(
    fakeWeb3({ receipt: null, transaction: { hash: HASH } }),
    TIMEOUT_ERROR(HASH),
  );
  assert.equal(v.outcome, 'pending');
  assert.equal(v.safeToRetry, false);
  assert.match(v.message, /do NOT send it again/i);
});

test('a dropped transaction is identified as safe to retry — the 42161-23 case', async () => {
  const v = await explainSendFailure(
    fakeWeb3({ receipt: null, transaction: null }),
    TIMEOUT_ERROR(HASH),
  );
  assert.equal(v.outcome, 'dropped');
  assert.equal(v.safeToRetry, true);
  assert.match(v.message, /never reached the network/i);
  assert.equal(v.txHash, HASH);
});

test('a non-timeout error is passed through unchanged', async () => {
  const v = await explainSendFailure(fakeWeb3(), { message: 'user rejected the request' });
  assert.equal(v.outcome, 'unknown');
  assert.match(v.message, /user rejected/);
});

test('a timeout with no recoverable hash does not claim to know the outcome', async () => {
  const v = await explainSendFailure(fakeWeb3(), { message: 'was not mined within 80 blocks' });
  assert.equal(v.outcome, 'unknown');
  assert.equal(v.txHash, null);
});

test('a nonce gap is reported as a queued transaction', async () => {
  const s = await findStuckTransaction(fakeWeb3({ latest: 258, pending: 260 }), '0xabc');
  assert.equal(s.stuck, true);
  assert.equal(s.gap, 2);
  assert.match(s.message, /2 unconfirmed transactions/);
});

test('no nonce gap reports clear', async () => {
  const s = await findStuckTransaction(fakeWeb3({ latest: 258, pending: 258 }), '0xabc');
  assert.equal(s.stuck, false);
});

test('a provider that cannot answer the pending count never blocks a payment', async () => {
  const broken = { eth: { getTransactionCount: async () => { throw new Error('unsupported'); } } };
  const s = await findStuckTransaction(broken, '0xabc');
  assert.equal(s.stuck, false);
});

test('a pending transaction that later confirms is reported as success', async () => {
  const { watchPendingTransaction } = await import('../src/services/txReliability.js');
  let calls = 0;
  const web3 = {
    eth: {
      getTransactionReceipt: async () => (++calls >= 2 ? { status: true } : null),
      getTransaction: async () => ({ hash: HASH }),
    },
  };
  const updates = [];
  const v = await watchPendingTransaction(web3, HASH, (u) => updates.push(u), { intervalMs: 1 });
  assert.equal(v.outcome, 'succeeded');
  assert.equal(v.safeToRetry, false);
  assert.equal(updates.length, 1);
});

test('a pending transaction that is later dropped becomes safe to retry', async () => {
  // The production gap: the user was told "do not resend", the transaction was
  // then dropped, and nothing ever told them retrying had become safe.
  const web3 = {
    eth: {
      getTransactionReceipt: async () => null,
      getTransaction: async () => null,
    },
  };
  const { watchPendingTransaction } = await import('../src/services/txReliability.js');
  const v = await watchPendingTransaction(web3, HASH, () => {}, { intervalMs: 1 });
  assert.equal(v.outcome, 'dropped');
  assert.equal(v.safeToRetry, true);
});

test('a single missed poll does not declare a live transaction dropped', async () => {
  let n = 0;
  const web3 = {
    eth: {
      getTransactionReceipt: async () => (n > 4 ? { status: true } : null),
      // Missing once, then present again — a node blip, not a drop.
      getTransaction: async () => (++n === 1 ? null : { hash: HASH }),
    },
  };
  const { watchPendingTransaction } = await import('../src/services/txReliability.js');
  const v = await watchPendingTransaction(web3, HASH, () => {}, { intervalMs: 1 });
  assert.equal(v.outcome, 'succeeded');
});

test('wallet-backed contract getters tune the instance they return', () => {
  // Regression guard. The first version of this fix applied applyTxTimeouts to a
  // Web3 instance created in the page, while getLOWJCContract builds its own
  // internally — so the tuning never reached the object that sends, and the fix
  // was inert in production. Assert the tuning happens where the contract is made.
  const source = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/services/localChainService.js'),
    'utf8',
  );

  for (const getter of ['getLOWJCContract', 'getAthenaClientContract']) {
    const start = source.indexOf(`export async function ${getter}`);
    assert.ok(start > -1, `${getter} not found`);
    const body = source.slice(start, source.indexOf('\n}', start));
    assert.ok(
      /new web3\.eth\.Contract\(/.test(body),
      `${getter} should build a contract`,
    );
    assert.ok(
      /applyTxTimeouts\(contract,/.test(body),
      `${getter} must call applyTxTimeouts on the contract it returns, not on a caller's Web3`,
    );
  }
});

test('verifyBroadcast confirms a transaction the network holds', async () => {
  const { verifyBroadcast } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getTransaction: async () => ({ hash: HASH }), getTransactionReceipt: async () => null } };
  assert.equal(await verifyBroadcast(web3, HASH, { windowMs: 50, intervalMs: 1 }), true);
});

test('verifyBroadcast reports a hash the network never received', async () => {
  // The 42161-23 case: the wallet returned a hash, the network never had it.
  const { verifyBroadcast } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getTransaction: async () => null, getTransactionReceipt: async () => null } };
  assert.equal(await verifyBroadcast(web3, HASH, { windowMs: 30, intervalMs: 1 }), false);
});

test('verifyBroadcast accepts an already-mined transaction', async () => {
  const { verifyBroadcast } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getTransaction: async () => null, getTransactionReceipt: async () => ({ status: true }) } };
  assert.equal(await verifyBroadcast(web3, HASH, { windowMs: 50, intervalMs: 1 }), true);
});

test('verifyBroadcast survives an RPC that throws', async () => {
  const { verifyBroadcast } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getTransaction: async () => { throw new Error('rpc down'); }, getTransactionReceipt: async () => { throw new Error('rpc down'); } } };
  assert.equal(await verifyBroadcast(web3, HASH, { windowMs: 20, intervalMs: 1 }), false);
});

test('fee overrides are derived from the live base fee, not a wallet default', async () => {
  const { buildFeeOverrides } = await import('../src/services/txReliability.js');
  // Arbitrum-like: 0.02 gwei base fee.
  const web3 = { eth: { getBlock: async () => ({ baseFeePerGas: 20000000n }) } };
  const f = await buildFeeOverrides(web3);
  assert.equal(f.maxFeePerGas, String(20000000n * 5n)); // 0.1 gwei
  assert.equal(f.maxPriorityFeePerGas, '0');
  // Must be far below the ~2 gwei a wallet would otherwise reserve.
  assert.ok(BigInt(f.maxFeePerGas) < 2000000000n / 10n);
});

test('fee overrides never fall below the floor on a near-zero base fee', async () => {
  const { buildFeeOverrides } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getBlock: async () => ({ baseFeePerGas: 1n }) } };
  const f = await buildFeeOverrides(web3);
  assert.equal(BigInt(f.maxFeePerGas), 10000000n);
});

test('a chain without EIP-1559 yields no overrides, so the wallet decides', async () => {
  const { buildFeeOverrides } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getBlock: async () => ({}) } };
  assert.deepEqual(await buildFeeOverrides(web3), {});
});

test('an RPC failure yields no overrides rather than blocking the transaction', async () => {
  const { buildFeeOverrides } = await import('../src/services/txReliability.js');
  const web3 = { eth: { getBlock: async () => { throw new Error('rpc down'); } } };
  assert.deepEqual(await buildFeeOverrides(web3), {});
});

test('tracked sends expose the hash before the final receipt', async () => {
  const { sendTrackedContractMethod } = await import('../src/services/txReliability.js');
  const receipt = { status: true, transactionHash: HASH };
  const events = [];
  const promiEvent = Promise.resolve(receipt);
  promiEvent.on = (name, handler) => {
    if (name === 'transactionHash') handler(HASH);
    if (name === 'receipt') handler(receipt);
    return promiEvent;
  };
  const method = { send: () => promiEvent };
  const result = await sendTrackedContractMethod(method, { from: '0xabc' }, (event) => events.push(event));
  assert.equal(result, receipt);
  assert.equal(events[0].phase, 'broadcast');
  assert.equal(events[0].txHash, HASH);
  assert.equal(events[1].phase, 'confirmed');
});

test('the shared builder derives a fee ceiling with real headroom', async () => {
  const { deriveFeeCeiling } = await import('../src/services/contractWriteRouter.js');
  const f = await deriveFeeCeiling(
    { rpcUrl: 'https://example.invalid' },
    { readBaseFee: async () => 20000000n },   // Arbitrum's 0.02 gwei
  );
  // The previous code set maxFeePerGas = eth_gasPrice, which equals the base fee
  // on Arbitrum — zero headroom, so any rise stalled the transaction.
  assert.ok(BigInt(f.maxFeePerGas) > 20000000n, 'ceiling must exceed the base fee');
  assert.equal(f.maxFeePerGas, String(20000000n * 5n));
  assert.equal(f.maxPriorityFeePerGas, '0');
});

test('the shared builder yields nothing without an RPC or base fee', async () => {
  const { deriveFeeCeiling } = await import('../src/services/contractWriteRouter.js');
  assert.deepEqual(await deriveFeeCeiling({}), {});
  assert.deepEqual(
    await deriveFeeCeiling({ rpcUrl: 'x' }, { readBaseFee: async () => null }),
    {},
  );
  assert.deepEqual(
    await deriveFeeCeiling({ rpcUrl: 'x' }, { readBaseFee: async () => { throw new Error('down'); } }),
    {},
  );
});

test('post job, apply and start job no longer pin the ceiling to the base fee', () => {
  // Regression guard for the three paths audited on 4 August.
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = [
    'src/pages/PostJob/PostJob.jsx',
    'src/pages/ApplyJob/ApplyJob.jsx',
    'src/pages/ViewReceivedApplication/ViewReceivedApplication.jsx',
  ];
  for (const file of files) {
    // Strip line comments; the fix is documented in prose that mentions the old code.
    const source = fs.readFileSync(path.join(root, file), 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    assert.ok(
      !/maxFeePerGas:\s*gasPrice/.test(source),
      `${file} must not pin maxFeePerGas to eth_gasPrice`,
    );
    assert.ok(
      !/gasPrice:\s*await\s+\w+\.eth\.getGasPrice\(\)/.test(source),
      `${file} must not pass a zero-headroom legacy gasPrice`,
    );
  }
});
