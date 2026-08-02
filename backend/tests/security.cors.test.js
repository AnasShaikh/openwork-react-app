'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  PRODUCTION_ALLOWED_ORIGINS,
  DEVELOPMENT_ALLOWED_ORIGINS,
  createCorsOptions,
} = require('../middleware/security');

test('no localhost origin is ever in the production allowlist', () => {
  // A deployed service accepting localhost lets a page served from a victim's
  // own machine talk to production.
  for (const origin of PRODUCTION_ALLOWED_ORIGINS) {
    assert.ok(!/localhost|127\.0\.0\.1/.test(origin), `${origin} must not be a production origin`);
  }
  assert.ok(DEVELOPMENT_ALLOWED_ORIGINS.every((o) => /localhost|127\.0\.0\.1/.test(o)));
});

test('an unlisted origin is rejected', () => {
  const { origin: check } = createCorsOptions('https://app.openwork.technology');
  check('https://evil.example', (err, allowed) => {
    assert.ok(err, 'an unknown origin must be refused');
    assert.notEqual(allowed, true);
  });
});

test('a listed origin is accepted', () => {
  const { origin: check } = createCorsOptions('https://app.openwork.technology');
  check('https://app.openwork.technology', (err, allowed) => {
    assert.equal(err, null);
    assert.equal(allowed, true);
  });
});
