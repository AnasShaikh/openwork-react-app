import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const source = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');

test('Oppy is available in docs, full-screen docs chat, and public job chat', () => {
  const app = source('src/App.jsx');
  const docs = source('src/pages/PublicDocs/PublicDocs.jsx');
  const panel = source('src/pages/PublicDocs/OppyPanel.jsx');
  const standalone = source('src/pages/AgentOppy/AgentOppy.jsx');

  assert.match(app, /path="\/chat" element=\{<OppyChat\/>\}/);
  assert.match(app, /path="\/oppy" element=\{<AgentOppy\s*\/>\}/);
  assert.match(docs, /<OppyPanel registry=\{registry\}/);
  assert.match(panel, /to="\/oppy"/);
  assert.match(panel, /to="\/chat"/);
  assert.match(panel, /mode: 'docs'/);
  assert.match(standalone, /mode: 'docs'/);
});

test('transaction chat is constrained to Arbitrum, Optimism and XDC', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  assert.match(chat, /chainId: 42161, hex: '0xa4b1'/);
  assert.match(chat, /chainId: 10, hex: '0xa'/);
  assert.match(chat, /chainId: 50, hex: '0x32'/);
  assert.doesNotMatch(chat, /chainId: 8453/);
  assert.doesNotMatch(chat, /chainId: 1, hex:/);
  assert.match(chat, /mode: 'transactions'/);
});

test('job posting never approves or transfers USDC and application amounts fail closed', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  assert.doesNotMatch(chat, /ensureUSDCApproval/);
  assert.doesNotMatch(chat, /methods\.approve/);
  assert.doesNotMatch(chat, /1 USDC fallback/);
  assert.match(chat, /Never invent a payment amount if the read fails/);
  assert.match(chat, /Posting does not approve or transfer USDC/);
  assert.match(chat, /for \(let i = 1; i <= appCount; i\+\+\)/);
});

test('complex value-moving actions use canonical review screens', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  assert.match(chat, /`\/release-payment\/\$\{encodeURIComponent\(tool\.params\.jobId\)\}`/);
  assert.match(chat, /`\/raise-dispute\/\$\{encodeURIComponent\(tool\.params\.jobId\)\}`/);
  assert.match(chat, /`\/view-received-application\?\$\{startParams\.toString\(\)\}`/);
  assert.match(chat, /`\/direct-contract\?\$\{dcParams\.toString\(\)\}`/);
});

test('App Runner Bedrock permissions are Sonnet 4.6 only and contain no static credentials', () => {
  const policy = JSON.parse(source('infra/app-runner/bedrock-sonnet-4-6-policy.json'));
  const resources = policy.Statement.flatMap((statement) => statement.Resource);
  assert.ok(resources.includes(
    'arn:aws:bedrock:us-east-1:256309399568:inference-profile/us.anthropic.claude-sonnet-4-6',
  ));
  assert.ok(resources.every((resource) => resource.includes('anthropic.claude-sonnet-4-6')));
  assert.equal(resources.some((resource) => resource.includes('*')), false);
  assert.doesNotMatch(source('backend/services/bedrock-chat.js'), /accessKeyId|secretAccessKey/);
});
