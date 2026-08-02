import assert from 'node:assert/strict';
import test from 'node:test';
import { notify, subscribeToasts } from '../src/services/notify.js';

function currentToasts() {
  let seen = [];
  const unsubscribe = subscribeToasts((list) => { seen = list; });
  unsubscribe();
  return seen;
}

test('success wording is classified as success', () => {
  const id = notify('✅ Documentation saved successfully!');
  const toast = currentToasts().find((t) => t.id === id);
  assert.equal(toast.variant, 'success');
  notify.dismiss(id);
});

test('failure wording is classified as an error', () => {
  const id = notify('Failed to switch network: user rejected');
  const toast = currentToasts().find((t) => t.id === id);
  assert.equal(toast.variant, 'error');
  notify.dismiss(id);
});

test('neutral wording falls back to info', () => {
  const id = notify('Open MetaMask and approve the pending request');
  const toast = currentToasts().find((t) => t.id === id);
  assert.equal(toast.variant, 'info');
  notify.dismiss(id);
});

test('an explicit variant overrides the heuristic', () => {
  // "saved" would otherwise infer success.
  const id = notify('Draft saved but the upload failed', 'error');
  assert.equal(currentToasts().find((t) => t.id === id).variant, 'error');
  notify.dismiss(id);
});

test('identical messages collapse instead of stacking', () => {
  // A retry loop must not paper the screen with the same toast.
  const first = notify('Network request already pending');
  const second = notify('Network request already pending');
  assert.equal(first, second);
  assert.equal(currentToasts().filter((t) => t.id === first).length, 1);
  notify.dismiss(first);
});

test('empty messages are ignored', () => {
  assert.equal(notify(''), null);
  assert.equal(notify(null), null);
});
