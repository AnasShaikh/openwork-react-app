import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');

function source(filename) {
  return fs.readFileSync(path.join(root, filename), 'utf8');
}

test('frontend environment example contains no browser-exposed secrets', () => {
  const envExample = source('.env.example');
  assert.doesNotMatch(envExample, /VITE_.*(?:PRIVATE|SECRET|TOKEN|API_KEY|JWT|WALL\d*_KEY)/);
  assert.match(envExample, /Every VITE_\* value is public/);
});

test('release configuration keeps the native Arbitrum adapter addresses', () => {
  for (const filename of ['.env.example', 'buildspec.yml']) {
    const contents = source(filename);
    assert.match(contents, /0x5727cA7326032a8644a49dECECB8388BEF122bef/);
    assert.match(contents, /0xB5d3F406089236ef9d4aB13306187aFCCA81f099/);
  }
});

test('coordinated bridge release enables XDC applicant milestones and current bridge addresses', () => {
  assert.match(source('.env.example'), /VITE_XDC_APPLICANT_MILESTONES_ENABLED=true/);
  assert.match(source('buildspec.yml'), /VITE_XDC_APPLICANT_MILESTONES_ENABLED='true'/);
  assert.match(source('Dockerfile'), /ARG VITE_XDC_APPLICANT_MILESTONES_ENABLED/);
  assert.match(source('src/config/chainConfig.js'), /0xDae5036a1d9E7C6CE953604FF238E13BD2B83951/);
  assert.match(source('src/config/chainConfig.js'), /0x9A0950594A699f5fb7decd7069F935100d39D9bF/);
});

test('CI verifies both frontend and backend', () => {
  const workflow = source('.github/workflows/ci.yml');
  assert.match(workflow, /frontend:/);
  assert.match(workflow, /backend:/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm audit --audit-level=high/);
});

test('backend examples use the runtime configuration names consumed by code', () => {
  const envExample = source('backend/.env.example');
  const server = source('backend/server.js');
  assert.match(envExample, /OPTIMISM_MAINNET_RPC_URL=/);
  assert.match(envExample, /XDC_MAINNET_RPC_URL=/);
  assert.doesNotMatch(envExample, /^OP_SEPOLIA_RPC_URL=/m);
  assert.match(server, /config\.CCTP_ARB_ADDRESS/);
  assert.match(server, /config\.MESSAGE_TRANSMITTER_ARB/);
  assert.doesNotMatch(server, /config\.CCTP_TRANSCEIVER_ADDRESS/);
});
