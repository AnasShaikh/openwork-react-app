import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { keccak256 } from 'web3-utils';
import {
  ATHENA_OPERATIONS,
  LOWJC_OPERATIONS,
  buildEstimatedWriteSendOptions,
  buildWriteSendOptions,
  createAthenaWrite,
  createLOWJCWrite,
  getAthenaRoute,
  getLOWJCRoute,
} from '../src/services/contractWriteRouter.js';

const DIRECT = { requiresLzFee: false };
const CROSS_CHAIN = { requiresLzFee: true };
const OPTIONS = '0x0003010011010000000000000000000000000007a120';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');

function fakeContract() {
  return {
    methods: new Proxy({}, {
      get: (_, method) => (...args) => ({ method, args }),
    }),
  };
}

function selector(signature) {
  return keccak256(signature).slice(0, 10);
}

function abiSignatures(filename) {
  const abi = JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
  return new Set(
    abi
      .filter((entry) => entry.type === 'function')
      .map((entry) => `${entry.name}(${(entry.inputs || []).map((input) => input.type).join(',')})`)
  );
}

test('Arbitrum routes every LOWJC write to a non-LayerZero selector', () => {
  for (const operation of Object.values(LOWJC_OPERATIONS)) {
    const route = getLOWJCRoute(DIRECT, operation);
    assert.equal(route.appendOptions, undefined, `${operation} must not append LayerZero options`);
  }

  assert.equal(getLOWJCRoute(DIRECT, LOWJC_OPERATIONS.POST_JOB).signature, 'postJob(string,string[],uint256[])');
  assert.equal(getLOWJCRoute(DIRECT, LOWJC_OPERATIONS.RELEASE_PAYMENT).signature, 'releasePayment(string)');
  assert.equal(selector('postJob(string,string[],uint256[])'), '0x4b18d3c2');
  assert.equal(selector('postJob(string,string[],uint256[],bytes)'), '0xd3988d47');
});

test('cross-chain LOWJC routes append options and preserve native release mapping', () => {
  const contract = fakeContract();
  const direct = createLOWJCWrite(
    contract,
    DIRECT,
    LOWJC_OPERATIONS.RELEASE_PAYMENT,
    ['42161-1', 2, '0x0000000000000000000000000000000000000001'],
    null
  );
  assert.deepEqual(direct, { method: 'releasePayment', args: ['42161-1'] });

  const cross = createLOWJCWrite(
    contract,
    CROSS_CHAIN,
    LOWJC_OPERATIONS.RELEASE_PAYMENT,
    ['30111-1', 3, '0x0000000000000000000000000000000000000001'],
    OPTIONS
  );
  assert.deepEqual(cross, {
    method: 'releasePaymentCrossChain',
    args: ['30111-1', 3, '0x0000000000000000000000000000000000000001', OPTIONS],
  });
});

test('Arbitrum Athena calls use direct non-payable signatures', () => {
  const contract = fakeContract();
  const direct = createAthenaWrite(
    contract,
    DIRECT,
    ATHENA_OPERATIONS.RAISE_DISPUTE,
    ['42161-1', 'hash', 'oracle', 1000000, 5000000],
    null
  );
  assert.deepEqual(direct, {
    method: 'raiseDispute',
    args: ['42161-1', 'hash', 'oracle', 1000000, 5000000],
  });
  assert.equal(
    getAthenaRoute(DIRECT, ATHENA_OPERATIONS.ASK_ATHENA).signature,
    'askAthena(string,string,string,uint256)'
  );
});

test('direct send options never include LayerZero value', () => {
  assert.deepEqual(
    buildWriteSendOptions(DIRECT, { from: '0xabc', value: '123', gas: 500000 }),
    { from: '0xabc', gas: 500000 }
  );
  assert.deepEqual(
    buildWriteSendOptions(CROSS_CHAIN, { from: '0xabc', value: 123n, gas: 500000 }),
    { from: '0xabc', value: '123', gas: 500000 }
  );
});

test('gas estimation uses the routed call with a safety buffer', async () => {
  let receivedOptions;
  const method = {
    async estimateGas(options) {
      receivedOptions = options;
      return 647899n;
    },
  };

  const sendOptions = await buildEstimatedWriteSendOptions(method, DIRECT, {
    from: '0xabc',
    value: '999',
    gas: 1,
    gasPrice: '10',
  });

  assert.deepEqual(receivedOptions, { from: '0xabc', gasPrice: '10' });
  assert.deepEqual(sendOptions, {
    from: '0xabc',
    gasPrice: '10',
    gas: '809874',
  });
});

test('cross-chain gas estimation retains the required LayerZero fee', async () => {
  const method = {
    async estimateGas(options) {
      assert.equal(options.value, '123');
      return '100000';
    },
  };

  assert.deepEqual(
    await buildEstimatedWriteSendOptions(method, CROSS_CHAIN, {
      from: '0xabc',
      value: 123n,
    }, { bufferBps: 1000 }),
    { from: '0xabc', value: '123', gas: '110000' }
  );
});

test('native funding preflight includes LayerZero value and buffered gas', async () => {
  const checks = [];
  const method = { estimateGas: async () => 400000n };
  const chain = {
    chainId: 50,
    name: 'XDC Network',
    nativeCurrency: { symbol: 'XDC' },
    requiresLzFee: true,
    rpcUrl: 'https://example.invalid',
  };
  const value = 4_500_000_000_000_000_000n;
  const gasPrice = 12_625_000_000n;

  const sendOptions = await buildEstimatedWriteSendOptions(
    method,
    chain,
    { from: '0x0000000000000000000000000000000000000001', value },
    {
      readNativeFunding: async () => ({
        balanceWei: 5_000_000_000_000_000_000n,
        gasPriceWei: gasPrice,
      }),
      onNativeBalanceCheck: (check) => checks.push(check),
    },
  );

  const bufferedGas = 500000n;
  assert.equal(sendOptions.gas, bufferedGas.toString());
  assert.equal(checks.length, 1);
  assert.equal(checks[0].requiredWei, (value + bufferedGas * gasPrice).toString());
  assert.equal(checks[0].sufficient, true);
  assert.equal(checks[0].gasIncluded, true);
});

test('native funding preflight blocks before gas estimation when the quote exceeds balance', async () => {
  let estimated = false;
  const method = { estimateGas: async () => { estimated = true; return 400000n; } };
  const chain = {
    chainId: 50,
    name: 'XDC Network',
    nativeCurrency: { symbol: 'XDC' },
    requiresLzFee: true,
    rpcUrl: 'https://example.invalid',
  };
  const checks = [];

  await assert.rejects(
    buildEstimatedWriteSendOptions(
      method,
      chain,
      {
        from: '0x0000000000000000000000000000000000000001',
        value: 4_525_823_000_000_000_000n,
      },
      {
        readNativeFunding: async () => ({
          balanceWei: 289_296_832_824_877_939n,
          gasPriceWei: 12_625_000_000n,
        }),
        onNativeBalanceCheck: (check) => checks.push(check),
      },
    ),
    (error) => {
      assert.equal(error.code, 'NATIVE_BALANCE_TOO_LOW');
      assert.match(error.message, /4\.525823 XDC/);
      assert.match(error.message, /0\.289296 XDC/);
      assert.match(error.message, /No transaction was submitted/);
      return true;
    },
  );
  assert.equal(estimated, false);
  assert.equal(checks[0].sufficient, false);
  assert.equal(checks[0].gasIncluded, false);
});

test('native funding preflight fails closed when every read-only RPC is unavailable', async () => {
  const method = { estimateGas: async () => 400000n };
  await assert.rejects(
    buildEstimatedWriteSendOptions(
      method,
      {
        chainId: 50,
        name: 'XDC Network',
        nativeCurrency: { symbol: 'XDC' },
        requiresLzFee: true,
        rpcUrl: 'https://example.invalid',
      },
      { from: '0x0000000000000000000000000000000000000001', value: 1n },
      { readNativeFunding: async () => { throw new Error('down'); } },
    ),
    (error) => error.code === 'NATIVE_BALANCE_UNAVAILABLE' && /no wallet request was opened/i.test(error.message),
  );
});

test('native ABI files expose every routed Arbitrum selector', () => {
  const lowjc = abiSignatures('src/ABIs/native-arb-lowjc_ABI.json');
  const athena = abiSignatures('src/ABIs/native-arb-athena-client_ABI.json');

  for (const operation of Object.values(LOWJC_OPERATIONS)) {
    assert.ok(lowjc.has(getLOWJCRoute(DIRECT, operation).signature), operation);
  }
  for (const operation of Object.values(ATHENA_OPERATIONS)) {
    assert.ok(athena.has(getAthenaRoute(DIRECT, operation).signature), operation);
  }
});

test('cross-chain ABI files expose every routed selector', () => {
  const lowjc = abiSignatures('src/ABIs/lowjc-lite_ABI.json');
  const athena = abiSignatures('src/ABIs/athena-client_ABI.json');

  for (const operation of Object.values(LOWJC_OPERATIONS)) {
    assert.ok(lowjc.has(getLOWJCRoute(CROSS_CHAIN, operation).signature), operation);
  }
  for (const operation of Object.values(ATHENA_OPERATIONS)) {
    assert.ok(athena.has(getAthenaRoute(CROSS_CHAIN, operation).signature), operation);
  }
});

test('production build points at the deployed frontend adapters', () => {
  const buildspec = fs.readFileSync(path.join(root, 'buildspec.yml'), 'utf8');
  assert.match(buildspec, /VITE_NATIVE_ARB_LOWJC_ADDRESS='0x5727cA7326032a8644a49dECECB8388BEF122bef'/);
  assert.match(buildspec, /VITE_NATIVE_ARB_ATHENA_ADDRESS='0xB5d3F406089236ef9d4aB13306187aFCCA81f099'/);
  assert.doesNotMatch(buildspec, /VITE_NATIVE_ARB_LOWJC_ADDRESS='0x8EfbF240240613803B9c9e716d4b5AD1388aFd99'/);
  assert.doesNotMatch(buildspec, /VITE_NATIVE_ARB_ATHENA_ADDRESS='0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf'/);
});
