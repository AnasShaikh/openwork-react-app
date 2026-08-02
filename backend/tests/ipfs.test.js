'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getReadGateways, uploadToIPFS } = require('../routes/ipfs');
const { checkIPFS } = require('../routes/health');

const silentLogger = { warn() {} };

test('IPFS upload falls back from the self-hosted proxy to Pinata', async () => {
  let requestedUrl;
  const result = await uploadToIPFS(Buffer.from('{"ok":true}'), 'test.json', {
    env: {
      IPFS_API_URL: 'https://ipfs-proxy.example/',
      IPFS_PROXY_SECRET: 'configured-proxy-token',
      PINATA_JWT: 'configured-pinata-token',
    },
    logger: silentLogger,
    fetch: async (url) => {
      requestedUrl = url;
      if (url.endsWith('/api/v0/add')) {
        return { ok: false, status: 503, text: async () => 'temporarily unavailable' };
      }
      return { ok: true, json: async () => ({ IpfsHash: 'QmPinataFallback', PinSize: 11 }) };
    },
  });

  assert.equal(requestedUrl, 'https://api.pinata.cloud/pinning/pinFileToIPFS');
  assert.deepEqual(result, { IpfsHash: 'QmPinataFallback', PinSize: 11 });
});

test('a retired Lighthouse key is ignored entirely', async () => {
  // Lighthouse was removed as an upload provider. A key left set in a deployed
  // environment must not resurrect it as a silent fallback.
  await assert.rejects(
    uploadToIPFS(Buffer.from('payload'), 'test.txt', {
      env: { LIGHTHOUSE_API_KEY: 'configured-lighthouse-key' },
      logger: silentLogger,
      uploadLighthouse: async () => assert.fail('Lighthouse must never be called'),
      fetch: async () => assert.fail('no provider is configured'),
    }),
    /No IPFS provider configured/,
  );
});

test('IPFS upload prefers the self-hosted proxy over commercial providers', async () => {
  const requestedUrls = [];
  const result = await uploadToIPFS(Buffer.from('payload'), 'test.txt', {
    env: {
      PINATA_JWT: 'configured-pinata-token',
      IPFS_API_URL: 'https://ipfs-proxy.example',
      IPFS_PROXY_SECRET: 'configured-proxy-token',
    },
    logger: silentLogger,
    fetch: async (url) => {
      requestedUrls.push(url);
      return {
        ok: true,
        json: async () => ({ Hash: 'QmProxyFallback', Size: '7' }),
      };
    },
  });

  assert.deepEqual(requestedUrls, [
    'https://ipfs-proxy.example/api/v0/add',
  ]);
  assert.deepEqual(result, { IpfsHash: 'QmProxyFallback', PinSize: 7 });
});

test('IPFS upload reports all configured provider failures', async () => {
  await assert.rejects(
    uploadToIPFS(Buffer.from('payload'), 'test.txt', {
      env: {
        IPFS_API_URL: 'https://ipfs-proxy.example/',
        IPFS_PROXY_SECRET: 'configured-proxy-token',
        PINATA_JWT: 'configured-pinata-token',
      },
      logger: silentLogger,
      fetch: async () => ({ ok: false, status: 403, text: async () => 'plan usage limit' }),
    }),
    /All configured IPFS providers failed \(IPFS proxy: HTTP 403: plan usage limit; Pinata: HTTP 403: plan usage limit\)/,
  );
});

test('self-hosted reads are authenticated and tried before public gateways', () => {
  const gateways = getReadGateways('QmContent', {
    IPFS_API_URL: 'https://ipfs-proxy.example/',
    IPFS_PROXY_SECRET: 'configured-proxy-token',
  });

  assert.deepEqual(gateways[0], {
    url: 'https://ipfs-proxy.example/ipfs/QmContent',
    headers: { Authorization: 'Bearer configured-proxy-token' },
  });
  assert.match(gateways[1].url, /gateway\.lighthouse\.storage/);
});

test('health reports the AWS IPFS node as the active healthy provider', async () => {
  const result = await checkIPFS({
    env: {
      IPFS_API_URL: 'https://ipfs-proxy.example/',
      IPFS_PROXY_SECRET: 'configured-proxy-token',
      PINATA_JWT: 'configured-pinata-token',
    },
    fetch: async (url) => {
      assert.equal(url, 'https://ipfs-proxy.example/health');
      return { ok: true, status: 200 };
    },
  });

  assert.equal(result.status, 'green');
  assert.equal(result.message, 'AWS IPFS node reachable');
});
