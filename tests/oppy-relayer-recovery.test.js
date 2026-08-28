import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('Oppy checks the service relayer before approvals and again at the shared write boundary', () => {
  const chat = read('src/pages/OppyChat/OppyChat.jsx');
  const service = read('src/services/localChainService.js');
  const directForm = read('src/pages/DirectContractForm/DirectContractForm.jsx');
  const application = read('src/pages/ViewReceivedApplication/ViewReceivedApplication.jsx');
  const payment = read('src/pages/ReleasePayment/ReleasePayment.jsx');
  const dispute = read('src/pages/ReviewDispute/ReviewDispute.jsx');

  assert.match(chat, /preflightRelay\(\{ action: 'startDirectContract'/);
  assert.ok(chat.indexOf("action: 'startDirectContract'") < chat.indexOf('await ensureUsdcFunding({\n            chainId: chainIdDecimal'));
  assert.match(service, /preflightRelay\(\{ action: 'startJob'/);
  assert.match(service, /action: 'releasePayment'/);
  assert.match(directForm, /Automatic USDC delivery is not ready/);
  assert.match(application, /No approval or job-start transaction was submitted/);
  assert.match(payment, /action: 'lockNextMilestone'/);
  assert.match(dispute, /action: 'settleDispute'/);
});

test('a stalled Circle transfer is restored from Oppy memory and can be completed in-chat', () => {
  const chat = read('src/pages/OppyChat/OppyChat.jsx');
  const status = read('src/components/CrossChainSyncStatus/CrossChainSyncStatus.jsx');
  const recovery = read('src/services/cctpSelfRelay.js');

  assert.match(chat, /\[\.\.\.recentTransactions\]\.reverse\(\)\.find/);
  assert.match(chat, /onCompleteCctp=\{handleCompleteCctp\}/);
  assert.match(status, /Complete with my wallet/);
  assert.match(status, /Your source transaction is safe; do not submit it again/);
  assert.match(recovery, /Checking Circle attestation and replay protection/);
  assert.match(recovery, /web3\.eth\.call/);
  assert.match(recovery, /web3\.eth\.estimateGas/);
  assert.match(recovery, /web3\.eth\.getBalance/);
  assert.match(recovery, /readCctpRecoveryPlan\(tracking/);
});

test('the status card distinguishes Circle attestation, relayer failure, and destination execution', () => {
  const status = read('src/components/CrossChainSyncStatus/CrossChainSyncStatus.jsx');
  const backend = read('backend/services/cross-chain-action-status.js');
  assert.match(status, /Waiting for Circle attestation/);
  assert.match(status, /service_wallet_underfunded/);
  assert.match(backend, /\? 'requires-action'/);
  assert.match(backend, /selfRelayAvailable/);
  assert.match(backend, /readRelayerReadiness/);
});
