import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/mainnet-contracts.json'), 'utf8'));

function source(filename) {
  return fs.readFileSync(path.join(root, filename), 'utf8');
}

function chain(name) {
  return registry.chains.find((entry) => entry.name === name);
}

function contract(chainName, id) {
  return chain(chainName).contracts.find((entry) => entry.id === id);
}

test('mainnet registry reconciles active roles, artifacts and explorer status', () => {
  const contracts = registry.chains.flatMap((entry) => entry.contracts);
  const artifactCount = contracts.reduce((count, entry) => count + (entry.kind === 'proxy' ? 2 : 1), 0);
  const pendingCount = contracts.reduce((count, entry) => {
    if (entry.kind === 'proxy') {
      return count
        + Number(entry.proxySource === 'source-pending')
        + Number(entry.implementationSource === 'source-pending');
    }
    return count + Number(entry.sourceVerification === 'source-pending');
  }, 0);

  assert.equal(contracts.length, 31);
  assert.equal(artifactCount, 50);
  assert.equal(pendingCount, 19);
  assert.deepEqual(registry.summary, {
    activeNetworks: 4,
    activeContractRoles: 31,
    activeArtifacts: 50,
    explorerSourceVerifiedArtifacts: 31,
    explorerSourcePendingArtifacts: 19,
  });
});

test('active bridge cutover and live proxy implementations are explicit', () => {
  assert.equal(
    contract('Arbitrum One', 'native-lz-openwork-bridge').address,
    '0x9A0950594A699f5fb7decd7069F935100d39D9bF',
  );
  assert.equal(
    contract('XDC Network', 'xdc-local-bridge').address,
    '0xDae5036a1d9E7C6CE953604FF238E13BD2B83951',
  );

  for (const entry of registry.chains.flatMap((item) => item.contracts)) {
    assert.equal(entry.status, 'live');
    assert.match(entry.source, /^src\/suites\/current-mainnet\/.+\.sol$/);
    if (entry.kind === 'proxy') {
      assert.match(entry.implementation, /^0x[0-9a-fA-F]{40}$/);
      assert.equal(entry.proxyLink, 'proxy-linked');
    }
  }
});

test('pathway claims distinguish tested, configured and disabled routes', () => {
  assert.deepEqual(
    Object.fromEntries(registry.pathways.map(({ name, status }) => [name, status])),
    {
      // Same-chain execution: no LayerZero message, no CCTP transfer. Verified
      // end to end on 4 August 2026 with job 42161-23.
      'Arbitrum direct (same chain)': 'end-to-end-tested',
      'XDC ↔ Arbitrum': 'end-to-end-tested',
      'Optimism ↔ Arbitrum': 'configured',
      'Ethereum ↔ Arbitrum': 'configured',
      'XDC ↔ Ethereum (direct)': 'disabled',
    },
  );
  assert.match(registry.heldNotLive[0].status, /not deployed or activated/);
});

test('public page, API and production image consume the same registry', () => {
  const app = source('src/App.jsx');
  const page = source('src/pages/PublicDocs/PublicDocs.jsx');
  const api = source('backend/routes/docs.js');
  const dockerfile = source('Dockerfile');

  assert.match(app, /path="\/docs" element=\{<PublicDocs \/>\}/);
  assert.match(app, /path="\/documentation" element=\{<Navigate to="\/docs" replace \/>\}/);
  assert.match(app, /path="\/docs\/legacy" element=\{<OpenworkDocs \/>\}/);
  assert.match(page, /mainnet-contracts\.json/);
  assert.match(api, /require\('\.\.\/\.\.\/docs\/mainnet-contracts\.json'\)/);
  assert.match(dockerfile, /COPY docs\/mainnet-contracts\.json \/app\/docs\/mainnet-contracts\.json/);
  assert.match(dockerfile, /COPY openclaw-skill \/app\/openclaw-skill/);
});

test('landing-page documentation links target the live route', () => {
  for (const filename of [
    'src/pages/LandingPage/components/GovernanceSection/GovernanceSection.jsx',
    'src/pages/LandingPage/components/MultiChainSection/MultiChainSection.jsx',
    'src/pages/LandingPage/components/ArchitectureSection/ArchitectureSection.jsx',
  ]) {
    const contents = source(filename);
    assert.match(contents, /navigate\('\/docs'\)/);
    assert.doesNotMatch(contents, /\/documentation/);
  }
});
