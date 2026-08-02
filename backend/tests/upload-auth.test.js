'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { Web3 } = require('web3');

const { verifyWalletSignature, buildAuthMessage } = require('../middleware/wallet-auth');
const { consume, budgetFor, diskHeadroom } = require('../middleware/upload-budget');

const web3 = new Web3();

function requestFor(headers) {
  return { get: (name) => headers[name.toLowerCase()] };
}

function signedHeaders(account, { timestamp = Date.now(), address } = {}) {
  const claimed = address || account.address;
  const signature = account.sign(buildAuthMessage(claimed, timestamp)).signature;
  return {
    'x-wallet-address': claimed,
    'x-wallet-timestamp': String(timestamp),
    'x-wallet-signature': signature,
  };
}

test('a correctly signed request is accepted and yields the signer address', () => {
  const account = web3.eth.accounts.create();
  const result = verifyWalletSignature(requestFor(signedHeaders(account)));
  assert.equal(result.ok, true);
  assert.equal(result.address, account.address.toLowerCase());
});

test('a signature from a different wallet is rejected', () => {
  const signer = web3.eth.accounts.create();
  const victim = web3.eth.accounts.create();
  // Claim the victim's address while signing with the attacker's key.
  const headers = signedHeaders(signer, { address: victim.address });
  const result = verifyWalletSignature(requestFor(headers));
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test('an expired signature is rejected', () => {
  const account = web3.eth.accounts.create();
  const headers = signedHeaders(account, { timestamp: Date.now() - 10 * 60 * 1000 });
  const result = verifyWalletSignature(requestFor(headers));
  assert.equal(result.ok, false);
  assert.match(result.error, /expired/);
});

test('a future-dated signature is rejected', () => {
  // Without a symmetric check, a far-future timestamp would never expire.
  const account = web3.eth.accounts.create();
  const headers = signedHeaders(account, { timestamp: Date.now() + 60 * 60 * 1000 });
  assert.equal(verifyWalletSignature(requestFor(headers)).ok, false);
});

test('missing headers are rejected without throwing', () => {
  const result = verifyWalletSignature(requestFor({}));
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test('a garbage signature is rejected rather than crashing', () => {
  const account = web3.eth.accounts.create();
  const headers = signedHeaders(account);
  headers['x-wallet-signature'] = '0xdeadbeef';
  assert.equal(verifyWalletSignature(requestFor(headers)).ok, false);
});

test('the daily budget stops an address once it is exhausted', () => {
  const address = web3.eth.accounts.create().address;
  const limit = budgetFor(address);
  assert.equal(consume(address, limit - 1).allowed, true);
  const denied = consume(address, 1024);
  assert.equal(denied.allowed, false);
  assert.ok(denied.resetsInMinutes > 0);
});

test('an allowlisted address gets the larger budget', () => {
  const address = '0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C';
  const previous = process.env.IPFS_UPLOAD_ALLOWLIST;
  process.env.IPFS_UPLOAD_ALLOWLIST = address;
  try {
    assert.ok(budgetFor(address) > budgetFor(web3.eth.accounts.create().address));
    // Case-insensitive: the allowlist is compared lowercased.
    assert.equal(budgetFor(address.toLowerCase()), budgetFor(address));
  } finally {
    if (previous === undefined) delete process.env.IPFS_UPLOAD_ALLOWLIST;
    else process.env.IPFS_UPLOAD_ALLOWLIST = previous;
  }
});

test('disk headroom degrades to unknown when repo/stat is not proxied', async () => {
  // The node's nginx currently 404s /api/v0/repo/stat. The breaker must report
  // unknown rather than block every upload.
  const result = await diskHeadroom({
    env: { IPFS_API_URL: 'https://ipfs.example', IPFS_PROXY_SECRET: 'secret' },
    logger: { warn() {} },
    fetch: async () => ({ ok: false, status: 404 }),
  });
  assert.equal(result.known, false);
  assert.match(result.reason, /404/);
});

test('disk headroom reports the used fraction when repo/stat is available', async () => {
  const result = await diskHeadroom({
    env: { IPFS_API_URL: 'https://ipfs.example', IPFS_PROXY_SECRET: 'secret' },
    logger: { warn() {} },
    fetch: async () => ({ ok: true, json: async () => ({ RepoSize: 18, StorageMax: 20 }) }),
  });
  assert.equal(result.known, true);
  assert.equal(result.fraction, 0.9);
});
