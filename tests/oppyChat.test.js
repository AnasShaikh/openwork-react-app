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

test('the embedded docs assistant renders readable structured conversation UI', () => {
  const panel = source('src/pages/PublicDocs/OppyPanel.jsx');
  const styles = source('src/pages/PublicDocs/PublicDocs.css');

  assert.match(panel, /import ReactMarkdown from 'react-markdown'/);
  assert.match(panel, /<ReactMarkdown>\{entry\.text\}<\/ReactMarkdown>/);
  assert.match(panel, /<textarea/);
  assert.match(styles, /\.public-docs-oppy__bubble \{[\s\S]*?font-size: 16px;/);
  assert.match(styles, /\.public-docs-oppy__form textarea \{[\s\S]*?font-size: 16px;/);
  assert.match(styles, /\.public-docs-oppy__suggestion-list button \{[\s\S]*?font-size: 14px;/);
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

test('Oppy uploads metadata through the canonical IPFS JSON route and renders structured parameters', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const styles = source('src/pages/OppyChat/OppyChat.css');

  assert.match(chat, /`\$\{BACKEND_URL\}\/api\/ipfs\/upload-json`/);
  assert.doesNotMatch(chat, /`\$\{BACKEND_URL\}\/api\/ipfs\/upload`/);
  assert.match(chat, /json\?\.error \|\| `IPFS upload failed \(HTTP \$\{res\.status\}\)`/);
  assert.match(chat, /formatToolParamValue\(v\)/);
  assert.doesNotMatch(chat, /\{String\(v\)\}/);
  assert.match(styles, /\.tx-param-value \{[^}]*white-space: pre-wrap;/);
});

test('complex value-moving actions use canonical review screens', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  assert.match(chat, /`\/release-payment\/\$\{encodeURIComponent\(tool\.params\.jobId\)\}`/);
  assert.match(chat, /`\/raise-dispute\/\$\{encodeURIComponent\(tool\.params\.jobId\)\}`/);
  assert.match(chat, /`\/view-received-application\?\$\{startParams\.toString\(\)\}`/);
  assert.match(chat, /`\/direct-contract\?\$\{dcParams\.toString\(\)\}`/);
});

test('transaction chat persists conversation, active job and confirmed source receipts', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const service = source('src/services/localChainService.js');
  const backend = source('backend/services/oppy-job-context.js');
  const dockerfile = source('Dockerfile');

  assert.match(chat, /loadOppyMemory\(memoryScope/);
  assert.match(chat, /saveOppyMemory\(memoryScope/);
  assert.match(chat, /activeJobFromMessage\(userMsg, activeJob\)/);
  assert.match(chat, /recentTransactions/);
  assert.match(chat, /result\.jobId \|\| tool\.params\?\.jobId/);
  assert.match(service, /await resolvePostedJobId\(\{/);
  assert.match(service, /saveTxHash\('postJob', tx\.transactionHash, jobId/);
  assert.match(backend, /getJobsByStatus/);
  assert.match(backend, /sourceDeliveryPending/);
  assert.match(dockerfile, /COPY src\/ABIs\/genesis_ABI\.json src\/ABIs\/genesis_helper_ABI\.json src\/ABIs\/profile-genesis_ABI\.json \/app\/src\/ABIs\//);
});

test('Oppy renders deterministic wallet, platform, search and job deep-dive cards', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const styles = source('src/pages/OppyChat/OppyChat.css');
  const memory = source('src/services/oppyMemory.js');

  assert.match(chat, /What needs my attention\?/);
  assert.match(chat, /function ExplorerCard/);
  assert.match(chat, /wallet-dashboard/);
  assert.match(chat, /platform-overview/);
  assert.match(chat, /job-search/);
  assert.match(chat, /job-deep-dive/);
  assert.match(chat, /isDataCard: true/);
  assert.match(styles, /\.oppy-data-card \{/);
  assert.match(styles, /\.oppy-data-metrics \{/);
  assert.match(memory, /message\.isDataCard/);
});

test('cross-chain posts show a live source, LayerZero and Arbitrum Genesis tracker', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const tracker = source('src/components/CrossChainSyncStatus/CrossChainSyncStatus.jsx');
  const service = source('src/services/crossChainSyncService.js');

  assert.match(chat, /<CrossChainSyncStatus activeJob=\{activeJob\} \/>/);
  assert.match(chat, /Cross-chain sync tracking is active below/);
  assert.match(tracker, /LayerZero delivery/);
  assert.match(tracker, /Arbitrum Genesis/);
  assert.match(tracker, /Canonical job available/);
  assert.match(service, /jobExists\(activeJob\.jobId\)\.call\(\)/);
  assert.match(service, /layerzeroscan\.com\/tx/);
});

test('mobile Oppy review cards cannot inherit the legacy 1200px page minimum', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const styles = source('src/pages/OppyChat/OppyChat.css');

  assert.match(styles, /\.oppy-chat-page \.view-jobs-container \{[\s\S]*?min-width: 0 !important;/);
  assert.match(styles, /\.tx-card \{[\s\S]*?max-width: 100%;[\s\S]*?min-width: 0;[\s\S]*?width: 100%;/);
  assert.match(chat, /const mobVjc\s*=.*minWidth:0/);
});

test('public job chat overrides legacy jobs spacing and centers its header', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const styles = source('src/pages/OppyChat/OppyChat.css');

  assert.match(styles, /\.oppy-chat-page \.view-jobs-container \{[\s\S]*?top: 0 !important;/);
  assert.match(styles, /\.oppy-chat-page \.title-section \{[\s\S]*?justify-content: center;/);
  assert.match(styles, /\.oppy-chat-page \.backButtonV \{[\s\S]*?height: 48px;[\s\S]*?position: absolute;[\s\S]*?width: 48px;/);
  assert.match(chat, /<button[\s\S]*?className="backButtonV"[\s\S]*?aria-label="Go back"/);
  assert.doesNotMatch(chat, /scrollIntoView/);
  assert.match(chat, /focus\(\{ preventScroll: true \}\)/);
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
