import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyTransactionError,
  createTransactionDiagnostic,
  diagnosticTechnicalRows,
  inspectTransactionDiagnostic,
  updateTransactionDiagnostic,
} from '../src/services/transactionDiagnostics.js';

const ADDRESS = '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C';
const HASH = `0x${'a'.repeat(64)}`;

function walletProvider({ chainId = '0x32', accounts = [ADDRESS] } = {}) {
  return {
    async request({ method }) {
      if (method === 'eth_accounts') return accounts;
      if (method === 'eth_chainId') return chainId;
      throw new Error(`Unexpected method ${method}`);
    },
  };
}

function web3Factory({ receipt = null, transaction = null, latest = 7, pending = 7 } = {}) {
  return () => ({
    eth: {
      getBlockNumber: async () => 12345n,
      getBalance: async () => 42n,
      getTransactionCount: async (_address, block) => (block === 'pending' ? pending : latest),
      getTransactionReceipt: async () => receipt,
      getTransaction: async () => transaction,
    },
  });
}

function attempt() {
  return createTransactionDiagnostic({
    action: 'startDirectContract',
    jobId: '30365-8',
    walletName: 'MetaMask',
    walletAddress: ADDRESS,
    chainId: 50,
    chainName: 'XDC Network',
  });
}

test('wallet cancellation is explicitly retry-safe because nothing was broadcast', () => {
  const result = classifyTransactionError({ code: 4001, message: 'User rejected the request.' });
  assert.equal(result.status, 'cancelled');
  assert.equal(result.safeToRetry, true);
  assert.match(result.nextStep, /Nothing was submitted/i);
});

test('a network failure before any write call is explicitly retry-safe', () => {
  const original = attempt();
  const failed = updateTransactionDiagnostic(original, {
    phase: 'error',
    error: new Error('RPC endpoint not found or unavailable.'),
    outcome: 'failed',
    safeToRetry: true,
    summary: 'The action stopped before any transaction was submitted.',
    nextStep: 'Correct the wallet network, then retry.',
    category: 'pre_broadcast',
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.safeToRetry, true);
  assert.equal(failed.error.category, 'pre_broadcast');
  assert.match(failed.summary, /before any transaction was submitted/);
});

test('unknown RPC failures protect retry until a read-only check resolves the outcome', () => {
  const result = classifyTransactionError({ message: 'RPC endpoint not found or unavailable.' });
  assert.equal(result.status, 'unknown');
  assert.equal(result.safeToRetry, false);
});

test('a missing wallet is retry-safe because no signing provider existed', () => {
  const result = classifyTransactionError({
    message: 'Enable Brave Wallet, MetaMask, or another EVM wallet extension to continue.',
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.safeToRetry, true);
  assert.match(result.summary, /No signing wallet/i);
  assert.match(result.nextStep, /Nothing was submitted/i);
});

test('a live check does not downgrade a definitive pre-broadcast failure', async () => {
  const missing = classifyTransactionError({
    message: 'Enable Brave Wallet, MetaMask, or another EVM wallet extension to continue.',
  });
  const diagnostic = updateTransactionDiagnostic(attempt(), { phase: 'error', error: new Error(missing.message) });
  const inspected = await inspectTransactionDiagnostic(diagnostic, {
    walletProvider: null,
    rpcUrl: null,
  });
  assert.equal(inspected.status, 'failed');
  assert.equal(inspected.safeToRetry, true);
});

test('approval and action hashes are tracked as separate substeps', () => {
  let diagnostic = attempt();
  diagnostic = updateTransactionDiagnostic(diagnostic, { phase: 'broadcast', step: 'approval', txHash: HASH });
  assert.equal(diagnostic.approvalTxHash, HASH);
  assert.equal(diagnostic.txHash, null);
  diagnostic = updateTransactionDiagnostic(diagnostic, { phase: 'preparing', step: 'action', message: 'Preparing action' });
  assert.equal(diagnostic.step, 'action');
});

test('a live transaction is pending and retry remains protected', async () => {
  const broadcast = updateTransactionDiagnostic(attempt(), { phase: 'broadcast', txHash: HASH });
  const inspected = await inspectTransactionDiagnostic(broadcast, {
    walletProvider: walletProvider(),
    rpcUrl: 'https://xdc.invalid',
    web3Factory: web3Factory({ transaction: { hash: HASH }, latest: 7, pending: 8 }),
  });
  assert.equal(inspected.status, 'pending');
  assert.equal(inspected.safeToRetry, false);
  assert.equal(inspected.checks.pendingNonceGap, 1);
  assert.match(inspected.nextStep, /unconfirmed transaction/i);
});

test('a confirmed receipt closes the attempt without a retry', async () => {
  const broadcast = updateTransactionDiagnostic(attempt(), { phase: 'broadcast', txHash: HASH });
  const inspected = await inspectTransactionDiagnostic(broadcast, {
    walletProvider: walletProvider(),
    rpcUrl: 'https://xdc.invalid',
    web3Factory: web3Factory({ receipt: { status: true, transactionHash: HASH } }),
  });
  assert.equal(inspected.status, 'confirmed');
  assert.equal(inspected.safeToRetry, false);
});

test('a transaction is called dropped only after time and repeated misses', async () => {
  let diagnostic = {
    ...updateTransactionDiagnostic(attempt(), { phase: 'broadcast', txHash: HASH }),
    broadcastAt: new Date(Date.now() - 60_000).toISOString(),
  };
  for (let index = 0; index < 3; index += 1) {
    diagnostic = await inspectTransactionDiagnostic(diagnostic, {
      walletProvider: walletProvider(),
      rpcUrl: 'https://xdc.invalid',
      web3Factory: web3Factory(),
    });
  }
  assert.equal(diagnostic.status, 'dropped');
  assert.equal(diagnostic.safeToRetry, true);
});

test('technical rows expose observability without wallet secrets', () => {
  const diagnostic = {
    ...attempt(),
    checks: { blockNumber: 123, rpcReachable: true, walletReachable: true, pendingNonceGap: 0 },
  };
  const text = diagnosticTechnicalRows(diagnostic).flat().join(' ');
  assert.match(text, /Latest block 123/);
  assert.match(text, /Read-only RPC Reachable/);
  assert.doesNotMatch(text, /private key|seed phrase/i);
});
