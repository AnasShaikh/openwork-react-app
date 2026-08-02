'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { boundInFlight } = require('../middleware/relay-guard');

function responseSpy() {
  return {
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

test('a relay request passes while below the ceiling', () => {
  const res = responseSpy();
  let called = false;
  boundInFlight(() => 3, { max: 10 })({}, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test('a relay request is refused at the ceiling', () => {
  const res = responseSpy();
  let called = false;
  boundInFlight(() => 10, { max: 10 })({}, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 503);
  assert.match(res.payload.error, /Too many relay operations/);
});

test('the ceiling is read per request, not captured once', () => {
  // The count comes from a live structure that changes as flows start and
  // finish, so the guard must re-read it rather than close over a snapshot.
  let inFlight = 0;
  const guard = boundInFlight(() => inFlight, { max: 2 });

  let allowed = 0;
  const attempt = () => {
    const res = responseSpy();
    guard({}, res, () => { allowed += 1; });
    return res.statusCode;
  };

  assert.equal(attempt(), null);
  inFlight = 2;
  assert.equal(attempt(), 503);
  inFlight = 1;
  assert.equal(attempt(), null);
  assert.equal(allowed, 2);
});
