'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { uploadToIPFS } = require('../routes/ipfs');

const silentLogger = { warn() {} };

test('IPFS upload falls back from Lighthouse to Pinata', async () => {
  let requestedUrl;
  const result = await uploadToIPFS(Buffer.from('{"ok":true}'), 'test.json', {
    env: {
      LIGHTHOUSE_API_KEY: 'configured-lighthouse-key',
      PINATA_JWT: 'configured-pinata-token',
    },
    logger: silentLogger,
    uploadLighthouse: async () => { throw new Error('Authentication failed'); },
    fetch: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({ IpfsHash: 'QmPinataFallback', PinSize: 11 }),
      };
    },
  });

  assert.equal(requestedUrl, 'https://api.pinata.cloud/pinning/pinFileToIPFS');
  assert.deepEqual(result, { IpfsHash: 'QmPinataFallback', PinSize: 11 });
});

test('IPFS upload falls back from an unavailable Pinata account to the proxy', async () => {
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
      if (url.includes('pinata.cloud')) {
        return { ok: false, status: 403, text: async () => 'plan usage limit' };
      }
      return {
        ok: true,
        json: async () => ({ Hash: 'QmProxyFallback', Size: '7' }),
      };
    },
  });

  assert.deepEqual(requestedUrls, [
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    'https://ipfs-proxy.example/api/v0/add',
  ]);
  assert.deepEqual(result, { IpfsHash: 'QmProxyFallback', PinSize: 7 });
});

test('IPFS upload reports all configured provider failures', async () => {
  await assert.rejects(
    uploadToIPFS(Buffer.from('payload'), 'test.txt', {
      env: {
        LIGHTHOUSE_API_KEY: 'configured-lighthouse-key',
        PINATA_JWT: 'configured-pinata-token',
      },
      logger: silentLogger,
      uploadLighthouse: async () => { throw new Error('Authentication failed'); },
      fetch: async () => ({ ok: false, status: 403, text: async () => 'plan usage limit' }),
    }),
    /All configured IPFS providers failed \(Lighthouse: Authentication failed; Pinata: HTTP 403: plan usage limit\)/,
  );
});
