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

test('every product page exposes the polished Oppy launcher outside Oppy surfaces', () => {
  const app = source('src/App.jsx');
  const launcher = source('src/components/HomeChatLauncher/HomeChatLauncher.jsx');
  const styles = source('src/components/HomeChatLauncher/HomeChatLauncher.css');

  assert.match(app, /function GlobalOppyLauncher\(\)/);
  assert.match(app, /pathname === '\/chat' \|\| pathname === '\/oppy'/);
  assert.match(app, /<GlobalOppyLauncher\s*\/>/);
  assert.match(launcher, /href="\/chat"/);
  assert.match(launcher, /aria-label="Chat with Agent Oppy"/);
  assert.match(launcher, /Ask Oppy/);
  assert.match(launcher, /Open assistant/);
  assert.match(styles, /position: fixed;/);
  assert.match(styles, /background: rgba\(255, 255, 255, 0\.94\)/);
  assert.match(styles, /linear-gradient\(145deg, #0f50ff/);
  assert.match(styles, /\.home-chat-launcher:focus-visible/);
  assert.match(styles, /\.home-chat-launcher__presence/);
  assert.match(styles, /@media \(max-width: 768px\)/);
});

test('Oppy chat uses one cohesive composer and refined message hierarchy', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const styles = source('src/pages/OppyChat/OppyChat.css');

  assert.match(chat, /className="chat-input-shell"/);
  assert.match(chat, /placeholder="Ask Oppy anything…"/);
  assert.match(chat, /<ArrowUp size=\{18\}/);
  assert.match(chat, /className="chat-message-avatar"/);
  assert.match(chat, /wallet-status-bar__copy/);
  assert.match(styles, /\.chat-input-shell:focus-within/);
  assert.match(styles, /\.chat-bubble\.bot \{[\s\S]*?border-radius: 7px 18px 18px 18px;/);
  assert.match(styles, /\.chat-send-btn \{[\s\S]*?linear-gradient\(145deg, #0d4fff/);
  assert.match(styles, /\.wallet-status-bar__action:focus-visible/);
});

test('the embedded docs assistant renders readable structured conversation UI', () => {
  const panel = source('src/pages/PublicDocs/OppyPanel.jsx');
  const styles = source('src/pages/PublicDocs/PublicDocs.css');

  assert.match(panel, /import ReactMarkdown from 'react-markdown'/);
  assert.match(panel, /<ReactMarkdown>\{sanitizeOppyText\(entry\.text\)\}<\/ReactMarkdown>/);
  assert.match(panel, /<textarea/);
  assert.match(styles, /\.public-docs-oppy__bubble \{[\s\S]*?font-size: 16px;/);
  assert.match(styles, /\.public-docs-oppy__form textarea \{[\s\S]*?font-size: 16px;/);
  assert.match(styles, /\.public-docs-oppy__suggestion-list button \{[\s\S]*?font-size: 14px;/);
});

test('public Oppy screens use product language and hide implementation copy', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const panel = source('src/pages/PublicDocs/OppyPanel.jsx');
  const standalone = source('src/pages/AgentOppy/AgentOppy.jsx');
  const tracker = source('src/components/CrossChainSyncStatus/CrossChainSyncStatus.jsx');

  assert.doesNotMatch(chat, /Bedrock job management|review before signing|CANONICAL SEARCH|Canonical platform overview/);
  assert.doesNotMatch(panel, /Bedrock · registry grounded|Production-aware assistant|Local registry answer/);
  assert.doesNotMatch(standalone, /Bedrock online|Powered by Claude|Open production docs/);
  assert.doesNotMatch(tracker, /LayerZero delivery|Arbitrum Genesis|Canonical job available/);
  assert.match(chat, /Your OpenWork assistant/);
  assert.match(tracker, /Network delivery/);
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
  assert.match(chat, /Posting this job will not move any USDC/);
  assert.match(chat, /resolveSelectedApplication\(deepDive, tool\.params\.applicantAddress\)/);
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

test('all supported Oppy actions stay inside chat and reuse canonical preflight services', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const actionService = source('src/services/oppyActionService.js');
  const chainService = source('src/services/localChainService.js');
  assert.match(chat, /fetchOppyExplorer\(/);
  assert.match(chat, /appendExplorerCard\(explorer\)/);
  assert.match(chat, /await ensureUsdcFunding\(\{/);
  assert.match(chat, /await startDirectContract\(/);
  assert.match(chat, /await startJob\(/);
  assert.match(chat, /await requestStartJobRelay\(\{/);
  assert.match(chat, /asyncApplicantMilestones: useAppMilestones && usesAsyncApplicantMilestoneStart\(chainIdDecimal\)/);
  assert.match(chat, /await releasePaymentCrossChain\(/);
  assert.match(chat, /await raiseDispute\(/);
  assert.doesNotMatch(chat, /navigate\(`\/(?:direct-contract|release-payment|raise-dispute|view-received-application)/);
  assert.match(actionService, /methods\.allowance\(owner, spender\)/);
  assert.match(actionService, /Still waiting|wallet/i);
  assert.match(chainService, /export async function startDirectContract/);
});

test('semantic action conflicts are removed before a review card can reach the wallet', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const memory = source('src/services/oppyMemory.js');
  assert.match(chat, /const semanticConflict = getOppyActionSemanticConflict\(proposedCandidate\)/);
  assert.match(chat, /const proposedTool = semanticConflict \? null : proposedCandidate/);
  assert.match(chat, /assertOppyActionSemantics\(tool\)/);
  assert.match(memory, /if \(getOppyActionSemanticConflict\(value\)\) return null/);
});

test('Oppy binds every transaction to an explicit injected wallet provider', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const providerService = source('src/services/injectedWalletProviders.js');
  const actionService = source('src/services/oppyActionService.js');
  const chainService = source('src/services/localChainService.js');
  const switcher = source('src/utils/switchNetwork.js');

  assert.match(providerService, /eip6963:requestProvider/);
  assert.match(providerService, /eip6963:announceProvider/);
  assert.match(providerService, /isBraveWallet/);
  assert.match(providerService, /isMetaMask/);
  assert.match(chat, /Wallet used for transactions/);
  assert.match(chat, /walletProviderRef\.current/);
  assert.match(chat, /walletRpcErrorMessage/);
  assert.match(actionService, /new Web3\(walletProvider\)/);
  assert.match(chainService, /getLOWJCContract\(chainId, walletProvider\)/);
  assert.match(switcher, /switchToChain\(chainId, walletProvider = window\.ethereum\)/);
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
  assert.match(chat, /updateOppyTransactionDelivery/);
  assert.match(chat, /onTrackingChange=/);
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

test('cross-chain progress is action-scoped and payment completion uses independent evidence', () => {
  const chat = source('src/pages/OppyChat/OppyChat.jsx');
  const tracker = source('src/components/CrossChainSyncStatus/CrossChainSyncStatus.jsx');
  const service = source('src/services/crossChainSyncService.js');
  const localChain = source('src/services/localChainService.js');

  assert.match(chat, /key=\{`\$\{tool\.name\}:\$\{txHash\}`\}/);
  assert.match(chat, /tracking=\{tracking\}/);
  assert.doesNotMatch(chat, /<CrossChainSyncStatus activeJob=\{activeJob\}/);
  assert.match(chat, /const baselineTotalPaidRaw = usdcDecimalToBaseUnits/);
  assert.match(chat, /baselineTotalPaidRaw,/);
  assert.match(localChain, /saveTxHash\('releasePayment'[\s\S]*targetDomain: paymentData\.targetChainDomain/);
  assert.match(localChain, /baselineTotalPaidRaw: paymentData\.baselineTotalPaidRaw/);
  assert.match(chat, /live status card above shows the latest network, OpenWork and USDC delivery state/);
  assert.match(tracker, /Network delivery/);
  assert.match(tracker, /onStatusChangeRef\.current\?\.\(tracking, next\)/);
  assert.match(tracker, /OpenWork payment/);
  assert.match(tracker, /USDC received/);
  assert.match(tracker, /showSeparatePaymentTarget/);
  assert.match(tracker, /Payment received/);
  assert.match(service, /api\/oppy\/cross-chain-status/);
  assert.doesNotMatch(service, /jobExists/);
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
  assert.match(styles, /\.oppy-chat-page \.backButtonV \{[\s\S]*?height: 42px;[\s\S]*?position: absolute;[\s\S]*?width: 42px;/);
  assert.match(chat, /<button[\s\S]*?className="backButtonV"[\s\S]*?aria-label="Go back"/);
  assert.doesNotMatch(chat, /scrollIntoView/);
  assert.match(chat, /focus\(\{ preventScroll: true \}\)/);
});

test('App Runner Oppy permissions constrain Bedrock and grant only streaming transcription', () => {
  const policy = JSON.parse(source('infra/app-runner/oppy-runtime-policy.json'));
  const bedrock = policy.Statement.find((statement) => statement.Sid === 'InvokeOpenWorkSonnet46InferenceProfile');
  const transcribe = policy.Statement.find((statement) => statement.Sid === 'StartOppyStreamingTranscription');
  assert.ok(bedrock.Resource.includes(
    'arn:aws:bedrock:us-east-1:256309399568:inference-profile/us.anthropic.claude-sonnet-4-6',
  ));
  assert.ok(bedrock.Resource.every((resource) => resource.includes('anthropic.claude-sonnet-4-6')));
  assert.equal(bedrock.Resource.some((resource) => resource.includes('*')), false);
  assert.equal(transcribe.Action, 'transcribe:StartStreamTranscriptionWebSocket');
  assert.equal(transcribe.Resource, '*');
  assert.equal(policy.Statement.some((statement) => String(statement.Action).includes('StartTranscriptionJob')), false);
  assert.doesNotMatch(source('backend/services/bedrock-chat.js'), /accessKeyId|secretAccessKey/);
  assert.doesNotMatch(source('backend/services/transcribe-session.js'), /accessKeyId\s*:|secretAccessKey\s*:/);
});
