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
  assert.match(contents, /validJobs\.reverse\(\)/);
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

  assert.match(service, /const useAppMilestones = native && requestedApplicantMilestones/);
  assert.match(applicationView, /effectiveUseAppMilestones = supportsApplicantMilestones && useAppMilestones/);
  assert.match(applicationView, /disabled=\{!supportsApplicantMilestones\}/);
});
