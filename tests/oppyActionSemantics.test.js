import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertOppyActionSemantics,
  getOppyActionSemanticConflict,
} from '../src/services/oppyActionSemantics.js';

const recipient = '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724';

test('the browser blocks a direct hire encoded as postJob before opening a wallet', () => {
  const wrongTool = {
    name: 'postJob',
    params: {
      title: 'Frontend Developer – Direct Contract',
      description: `Build the interface. Job Taker: ${recipient}`,
      budget: 0.1,
    },
  };
  assert.match(getOppyActionSemanticConflict(wrongTool), /named direct-contract recipient/);
  assert.throws(() => assertOppyActionSemantics(wrongTool), /No wallet request was opened/);
  assert.match(getOppyActionSemanticConflict({
    name: 'postJob',
    params: {
      title: 'Generic title',
      description: 'Generic description',
      budget: 0.1,
      jobTaker: recipient,
    },
  }), /named direct-contract recipient/);
});

test('valid marketplace posts and direct contracts cross the semantic guard', () => {
  const post = { name: 'postJob', params: { title: 'Frontend Developer', description: 'Applications welcome.', budget: 0.1 } };
  const direct = { name: 'startDirectContract', params: { title: 'Direct Contract', description: 'Build the interface.', budget: 0.1, jobTaker: recipient } };
  assert.equal(getOppyActionSemanticConflict(post), null);
  assert.equal(getOppyActionSemanticConflict(direct), null);
  assert.equal(assertOppyActionSemantics(post), post);
  assert.equal(assertOppyActionSemantics(direct), direct);
});
