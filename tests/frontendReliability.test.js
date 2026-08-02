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

test('production preview has a default port and uses supported serve options', () => {
  const packageJson = JSON.parse(source('package.json'));
  assert.equal(packageJson.scripts.preview, 'serve -s dist -l ${PORT:-4173}');
});

test('legacy job views read from the active native-chain configuration', () => {
  for (const filename of [
    'src/pages/JobUpdate/JobUpdate.jsx',
    'src/pages/ViewWork/ViewWork.jsx',
    'src/pages/ViewJobDetails/ViewJobDetails.jsx',
    'src/pages/AddUpdate/AddUpdate.jsx',
  ]) {
    const contents = source(filename);
    assert.match(contents, /getNativeChain/);
    assert.doesNotMatch(contents, /VITE_NOWJC_CONTRACT_ADDRESS/);
    assert.doesNotMatch(contents, /VITE_ARBITRUM_SEPOLIA_RPC_URL/);
  }
});

test('job creation order is reversed without lexicographic ID sorting', () => {
  const contents = source('src/pages/BrowseJobs/BrowseJobs.jsx');
  assert.doesNotMatch(contents, /localeCompare/);
  assert.match(contents, /fallbackJobs\.reverse\(\)/);
  assert.match(contents, /enrichedJobs\.reverse\(\)/);
  assert.match(contents, /metadataPending \? "Loading job details…"/);
  assert.match(contents, /formatJob\(jobId, jobData, null, null, true\)/);
});

test('post-job submission reveals the transaction status after wallet confirmation', () => {
  const postJob = source('src/pages/PostJob/PostJob.jsx');

  assert.match(postJob, /setShouldScrollToStatus\(true\)/);
  assert.match(postJob, /statusSectionRef\.current\?\.scrollIntoView/);
  assert.match(postJob, /ref=\{statusSectionRef\}/);
  assert.match(postJob, /aria-live="polite"/);
});

test('job listings reject malformed IPFS identifiers without gateway retries', () => {
  const contents = source('src/pages/BrowseJobs/BrowseJobs.jsx');

  assert.match(contents, /isValidIPFSCid/);
  assert.match(contents, /\^Qm\[1-9A-HJ-NP-Za-km-z\]\{44\}\$/);
  assert.match(contents, /new AbortController\(\)/);
  assert.match(contents, /if \(!isValidIPFSCid\(hash\)\) \{/);
  assert.match(contents, /setJobs\(fallbackJobs\);\s*setLoading\(false\);/);
  assert.match(contents, /ipfsRequests\.has\(hash\)/);
});

test('job views read profiles from Profile Genesis, not Job Genesis', () => {
  for (const filename of [
    'src/pages/BrowseJobs/BrowseJobs.jsx',
    'src/pages/JobDeepView/JobDeepView.jsx',
    'src/pages/SingleJobDetails/SingleJobDetails.jsx',
  ]) {
    const contents = source(filename);
    assert.match(contents, /profile-genesis_ABI\.json/);
    assert.match(contents, /nativeChain\?\.contracts\?\.profileGenesis/);
    assert.match(contents, /profileContract\.methods\s*\.getProfile/);
    assert.doesNotMatch(contents, /contract\.methods\s*\.getProfile/);
  }
});

test('radial navigation cores are keyboard accessible', () => {
  for (const filename of [
    'src/App.jsx',
    'src/pages/Work/Work.jsx',
    'src/pages/Governance/Governance.jsx',
  ]) {
    const contents = source(filename);
    assert.match(contents, /tabIndex=\{0\}/);
    assert.match(contents, /aria-expanded=\{buttonsVisible\}/);
    assert.match(contents, /event\.key === "Enter"/);
  }
});

test('applicant milestones cannot produce mismatched cross-chain escrow', () => {
  const service = source('src/services/localChainService.js');
  const applicationView = source('src/pages/ViewReceivedApplication/ViewReceivedApplication.jsx');
  const chainConfig = source('src/config/chainConfig.js');
  const backend = source('backend/server.js');

  assert.match(chainConfig, /VITE_XDC_APPLICANT_MILESTONES_ENABLED === 'true'/);
  assert.match(service, /const useAppMilestones = applicantMilestonesSupported && requestedApplicantMilestones/);
  assert.match(service, /startJobWithMilestoneSync/);
  assert.match(applicationView, /effectiveUseAppMilestones = supportsApplicantMilestones && useAppMilestones/);
  assert.match(applicationView, /application\?\.proposedMilestones\?\.\[0\]\?\.amount/);
  assert.match(applicationView, /START_JOB_WITH_MILESTONE_SYNC/);
  assert.match(applicationView, /localEscrowReady = Number\(localJob\?\.status\) === 1/);
  assert.match(service, /asyncApplicantStart \? "START_JOB_WITH_MILESTONE_SYNC" : "START_JOB"/);
  assert.match(chainConfig, /START_JOB_WITH_MILESTONE_SYNC: 1500000/);
  assert.match(applicationView, /disabled=\{!supportsApplicantMilestones\}/);
  assert.match(backend, /waitForAsyncStartJobBurn/);
  assert.match(backend, /FundsSent\(string,uint256\)/);
  assert.match(backend, /completedJobs\.set\(key, Date\.now\(\)\);\s*\}\)/);
});

test('start-job reads use the canonical deployed Genesis tuples', () => {
  const applicationView = source('src/pages/ViewReceivedApplication/ViewReceivedApplication.jsx');
  assert.match(applicationView, /\{"name": "preferredPaymentChainDomain", "type": "uint32"\},\s*\{"name": "preferredPaymentAddress", "type": "address"\}\s*\]/);
  assert.doesNotMatch(applicationView, /\{"name": "preferredPaymentAddress", "type": "address"\},\s*\{"name": "status", "type": "uint8"\}/);
  assert.match(applicationView, /\{"name": "paymentTargetChainDomain", "type": "uint32"\}/);
  assert.match(applicationView, /\{"name": "applierOriginChainDomain", "type": "uint32"\}/);
  assert.doesNotMatch(applicationView, /\{"name": "currentLockedAmount", "type": "uint256"\},\s*\{"name": "currentMilestone"/);
});

test('backend recognizes canonical XDC EIDs and defensive chain-ID job prefixes', () => {
  const chainUtils = source('backend/utils/chain-utils.js');
  assert.match(chainUtils, /30365: 50/);
  assert.match(chainUtils, /EID_TO_CHAIN_ID\[eid\] \|\| \(CHAIN_NAMES\[eid\] \? eid : undefined\)/);
});

test('XDC job posting uses a browser-safe RPC and the validated destination gas', () => {
  const chainConfig = source('src/config/chainConfig.js');
  const postJob = source('src/pages/PostJob/PostJob.jsx');

  assert.match(chainConfig, /rpcUrl: import\.meta\.env\.VITE_XDC_MAINNET_RPC_URL \|\| 'https:\/\/rpc\.xinfin\.network'/);
  assert.doesNotMatch(chainConfig, /VITE_XDC_MAINNET_RPC_URL \|\| 'https:\/\/erpc\.xinfin\.network'/);
  assert.match(postJob, /buildLzOptions\(DESTINATION_GAS_ESTIMATES\.POST_JOB\)/);
  assert.doesNotMatch(postJob, /const layerzeroOptions = chainConfig\.layerzero\.options/);
});

test('the XDC chain logo is distinct from the USDC payment icon', () => {
  const chainConfig = source('src/config/chainConfig.js');

  assert.match(chainConfig, /50: '\/xdc-chain\.svg'/);
  assert.doesNotMatch(chainConfig, /50: '\/xdc\.svg'/);
  assert.match(source('public/xdc-chain.svg'), /viewBox="0 0 413\.13 382\.18"/);
});

test('direct-contract placeholders and amounts are visibly editable', () => {
  const applyNowCss = source('src/pages/ApplyNow/ApplyNow.css');
  const directContractCss = source('src/pages/DirectContractForm/DirectContractForm.css');
  const directContract = source('src/pages/DirectContractForm/DirectContractForm.jsx');
  const milestone = source('src/components/Milestone/Milestone.jsx');

  assert.match(applyNowCss, /\.apply-now-form ::placeholder/);
  assert.doesNotMatch(applyNowCss, /^::placeholder/m);
  assert.match(directContractCss, /\.form-groupDC input::placeholder,[\s\S]*font-weight: 400/);
  assert.match(milestone, /className="milestone-inline-amount"/);
  assert.match(milestone, /onUpdate\?\.\("amount", nextAmount\)/);
  assert.match(directContract, /selectMilestoneType/);
  assert.match(directContract, /const firstMilestone = currentMilestones\[0\]/);
  assert.match(directContract, /return \[firstMilestone\]/);
});

test('wallet reconnects are provider-authoritative and failures are visible', () => {
  const walletContext = source('src/context/WalletContext.jsx');
  const connectWallet = source('src/components/ConnectWallet/ConnectWallet.jsx');

  assert.doesNotMatch(walletContext, /localStorage\.getItem\("ow_wallet_address"\)/);
  assert.match(walletContext, /method: "eth_accounts"/);
  assert.match(walletContext, /ethereum#initialized/);
  assert.match(walletContext, /wallet_revokePermissions/);
  assert.match(walletContext, /walletError/);
  assert.match(connectWallet, /<button/);
  assert.match(connectWallet, /Waiting for MetaMask approval/);
  assert.doesNotMatch(connectWallet, /CoinBase Wallet|Binance Wallet/);
});

test('job details retry managed IPFS reads without an untitled final state', () => {
  const jobDetails = source('src/pages/SingleJobDetails/SingleJobDetails.jsx');

  assert.match(jobDetails, /IPFS_METADATA_RETRY_DELAYS_MS/);
  assert.match(jobDetails, /`\/api\/ipfs\/content\/\$\{hash\}`/);
  assert.match(jobDetails, /fetchJobMetadata\(jobData\.jobDetailHash\)/);
  assert.match(jobDetails, /Retry job details/);
  assert.match(jobDetails, /title: jobDetails\.title \|\| `Job \$\{jobId\}`/);
  assert.doesNotMatch(jobDetails, /Untitled Job/);
});

test('work submission is role-gated and preflights outside MetaMask', () => {
  const addUpdate = source('src/pages/AddUpdate/AddUpdate.jsx');
  const jobUpdate = source('src/pages/JobUpdate/JobUpdate.jsx');
  const jobDetails = source('src/pages/SingleJobDetails/SingleJobDetails.jsx');
  const chainConfig = source('src/config/chainConfig.js');

  assert.match(addUpdate, /Only the selected applicant can submit work/);
  assert.match(addUpdate, /Work can only be submitted while this job is in progress/);
  assert.match(addUpdate, /getReadOnlyLOWJCContract/);
  assert.match(addUpdate, /const readOnlyWriteMethod = createLOWJCWrite/);
  assert.match(addUpdate, /buildEstimatedWriteSendOptions\(readOnlyWriteMethod/);
  assert.match(addUpdate, /estimateLayerZeroFee\(requiredChainId, "SUBMIT_WORK"/);
  assert.match(addUpdate, /userChainId !== requiredChainId/);
  assert.match(chainConfig, /SUBMIT_WORK: 800000/);
  assert.match(jobUpdate, /const canAddUpdate = Boolean/);
  assert.match(jobUpdate, /Number\(job\.status\) === 1/);
  assert.match(jobDetails, /const canReleasePayment = isJobGiver && isJobInProgress/);
  assert.match(jobDetails, /const canRaiseDispute = isJobInProgress/);
});

test('transaction notices use semantic colors instead of treating progress as an error', () => {
  const warning = source('src/components/Warning/Warning.jsx');
  const warningCss = source('src/components/Warning/Warning.css');
  const directContract = source('src/pages/DirectContractForm/DirectContractForm.jsx');

  assert.match(warning, /warning-content--\$\{resolvedVariant\}/);
  assert.match(warningCss, /\.warning-content--info/);
  assert.match(warningCss, /\.warning-content--success/);
  assert.match(warningCss, /\.warning-content--error/);
  assert.match(directContract, /phase: "submitted"[\s\S]*variant: "info"/);
});

test('direct-contract confirmation is duplicate-safe and reload-safe', () => {
  const directContract = source('src/pages/DirectContractForm/DirectContractForm.jsx');
  const statusPage = source('src/pages/DirectContractStatus/DirectContractStatus.jsx');
  const app = source('src/App.jsx');

  assert.match(directContract, /submissionLockRef\.current/);
  assert.match(directContract, /resolveDirectContractJobId/);
  assert.match(directContract, /saveDirectContractProgress\(progress\)/);
  assert.match(directContract, /disabled=\{transactionInProgress\}/);
  assert.match(statusPage, /loadDirectContractProgress\(jobId\)/);
  assert.match(statusPage, /pollOnChainJobState/);
  assert.match(statusPage, /monitorLZMessage/);
  assert.match(statusPage, /monitorCCTPTransfer/);
  assert.match(statusPage, /Do not submit/);
  assert.match(app, /path="\/direct-contract-status\/:jobId"/);
});

test('native Arbitrum payment release preflights through the configured RPC', () => {
  const releasePayment = source('src/pages/ReleasePayment/ReleasePayment.jsx');
  const localChainService = source('src/services/localChainService.js');

  assert.match(releasePayment, /getReadOnlyLOWJCContract/);
  assert.match(releasePayment, /readOnlyReleaseMethod/);
  assert.match(releasePayment, /buildEstimatedWriteSendOptions\([\s\S]*readOnlyReleaseMethod/);
  assert.match(releasePayment, /\{ from: walletAddress \}/);
  assert.match(releasePayment, /Only the job giver can release this payment/);
  assert.match(localChainService, /export async function getReadOnlyLOWJCContract/);
  assert.match(localChainService, /getReadOnlyWeb3\(chainId\)/);
});

test('release-payment status is destination-confirmed and never exposes operator retry', () => {
  const releasePayment = source('src/pages/ReleasePayment/ReleasePayment.jsx');
  const startJob = source('src/pages/ViewReceivedApplication/ViewReceivedApplication.jsx');
  const backend = source('backend/server.js');

  assert.match(releasePayment, /Payment delivery confirmed on the destination chain/);
  assert.match(startJob, /Cross-chain escrow delivery confirmed on the destination chain/);
  assert.match(releasePayment, /No additional details are available yet/);
  assert.match(startJob, /No additional details are available yet/);
  assert.match(releasePayment, /do not submit another payment/);
  assert.match(startJob, /do not submit another transaction/);
  assert.doesNotMatch(releasePayment, /\/api\/cctp-retry/);
  assert.doesNotMatch(startJob, /\/api\/cctp-retry/);
  assert.doesNotMatch(releasePayment, /Retry attempts:/);
  assert.doesNotMatch(startJob, /Retry attempts:/);
  assert.match(releasePayment, /Payment release is recorded on OpenWork/);
  assert.match(releasePayment, /disabled=\{isLocking \|\| !hasNextMilestone\}/);
  assert.match(releasePayment, /variant=\{job\.jobStatus === 2 \? 'success' : 'warning'\}/);
  assert.match(releasePayment, /hasPaymentAction && jobChainConfig/);
  assert.match(backend, /reconcileStoredCCTPStatus/);
  assert.match(backend, /deliveryConfirmed: status\.status === 'completed'/);
});

test('direct-contract validates USDC and keeps XDC preflight off the injected wallet RPC', () => {
  const directContract = source('src/pages/DirectContractForm/DirectContractForm.jsx');

  assert.match(directContract, /getReadOnlyLOWJCContract/);
  assert.match(directContract, /getReadOnlyWeb3/);
  assert.match(directContract, /balanceOf\(fromAddress\)/);
  assert.match(directContract, /allowance\(fromAddress, contractAddress\)/);
  assert.match(directContract, /Insufficient USDC balance/);
  assert.match(directContract, /BigInt\(currentAllowance\) < firstMilestoneAmount/);
  assert.match(directContract, /estimateLayerZeroFee\(chainId, "START_DIRECT_CONTRACT"/);
  assert.match(directContract, /buildEstimatedWriteSendOptions\([\s\S]*readOnlyDirectContractMethod/);
  assert.match(directContract, /directContractMethod\.send\(sendOptions\)/);
});
