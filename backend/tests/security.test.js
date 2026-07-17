'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createCorsOptions,
  createRateLimiter,
  requireConfiguredToken,
  safeEqual,
} = require('../middleware/security');
const {
  isAdminAuthConfigured,
  verifyAdminCredentials,
} = require('../utils/auth');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; },
  };
}

test('constant-time comparison rejects missing and different tokens', () => {
  assert.equal(safeEqual('same-token', 'same-token'), true);
  assert.equal(safeEqual('same-token', 'other-token'), false);
  assert.equal(safeEqual(undefined, 'same-token'), false);
});

test('CORS allows configured origins and rejects arbitrary origins', async () => {
  const options = createCorsOptions('https://app.example.com,http://localhost:5173');

  await new Promise((resolve, reject) => {
    options.origin('https://app.example.com', (error, allowed) => {
      try {
        assert.ifError(error);
        assert.equal(allowed, true);
        resolve();
      } catch (assertionError) { reject(assertionError); }
    });
  });

  await new Promise((resolve, reject) => {
    options.origin('https://attacker.example', (error) => {
      try {
        assert.match(error.message, /not allowed/);
        resolve();
      } catch (assertionError) { reject(assertionError); }
    });
  });
});

test('operator token middleware fails closed when the secret is absent', () => {
  const previous = process.env.TEST_OPS_TOKEN;
  delete process.env.TEST_OPS_TOKEN;
  const middleware = requireConfiguredToken({
    envName: 'TEST_OPS_TOKEN',
    headerName: 'x-test-token',
  });
  const res = responseRecorder();
  middleware({ get: () => undefined }, res, () => assert.fail('must not continue'));
  assert.equal(res.statusCode, 503);
  if (previous === undefined) delete process.env.TEST_OPS_TOKEN;
  else process.env.TEST_OPS_TOKEN = previous;
});

test('operator token middleware accepts only the configured header value', () => {
  const previous = process.env.TEST_OPS_TOKEN;
  process.env.TEST_OPS_TOKEN = 'configured-secret';
  const middleware = requireConfiguredToken({
    envName: 'TEST_OPS_TOKEN',
    headerName: 'x-test-token',
  });

  let continued = false;
  middleware({ get: () => 'configured-secret' }, responseRecorder(), () => { continued = true; });
  assert.equal(continued, true);

  const rejected = responseRecorder();
  middleware({ get: () => 'wrong-secret' }, rejected, () => assert.fail('must not continue'));
  assert.equal(rejected.statusCode, 401);
  if (previous === undefined) delete process.env.TEST_OPS_TOKEN;
  else process.env.TEST_OPS_TOKEN = previous;
});

test('rate limiter returns 429 and Retry-After after the configured maximum', () => {
  const middleware = createRateLimiter({ windowMs: 60_000, max: 1 });
  const req = { ip: '203.0.113.8' };
  middleware(req, responseRecorder(), () => {});

  const limited = responseRecorder();
  middleware(req, limited, () => assert.fail('must not continue'));
  assert.equal(limited.statusCode, 429);
  assert.ok(Number(limited.headers['Retry-After']) > 0);
});

test('admin authentication has no built-in credentials or JWT secret', () => {
  const names = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];

  assert.equal(isAdminAuthConfigured(), false);
  assert.equal(verifyAdminCredentials('openwork', 'openwork123'), false);

  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

test('production-key test routes are disabled by default and token protected when enabled', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(serverSource, /ENABLE_MAINNET_TEST_ROUTES === 'true'/);
  assert.match(serverSource, /app\.use\('\/api\/e2e-test', requireOpsToken/);
  assert.match(serverSource, /app\.use\('\/api\/arb-smoke', requireOpsToken/);
});
