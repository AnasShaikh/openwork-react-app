import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');

function read(filename) {
  return fs.readFileSync(path.join(root, filename), 'utf8');
}

function assertRelativeLinksResolve(filename) {
  const contents = read(filename);
  const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of contents.matchAll(markdownLink)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '');
    if (
      rawTarget.startsWith('#')
      || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)
    ) {
      continue;
    }

    const target = decodeURIComponent(rawTarget.split('#')[0]);
    const resolved = path.resolve(root, path.dirname(filename), target);
    assert.ok(
      fs.existsSync(resolved),
      `${filename} links to missing repository path ${rawTarget}`,
    );
  }
}

test('repository onboarding entrypoints exist and link to real files', () => {
  const entrypoints = [
    'README.md',
    'AGENTS.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'docs/README.md',
    'docs/repository-map.md',
    'docs/arman-collaboration-handoff.md',
    'contracts/README.md',
    'contracts/references/README.md',
    'contracts/script/README.md',
    'contracts-documentation/README.md',
    'references/README.md',
    'logs/README.md',
    'scripts/README.md',
  ];

  for (const filename of entrypoints) {
    assert.ok(fs.existsSync(path.join(root, filename)), `missing ${filename}`);
    assertRelativeLinksResolve(filename);
  }
});

test('the current README names the monorepo landing workflow, not the retired repository', () => {
  const repositoryReadme = read('README.md');

  assert.match(repositoryReadme, /landing\/\*\*/);
  assert.match(repositoryReadme, /\.github\/workflows\/landing\.yml/);
  assert.doesNotMatch(repositoryReadme, /landing pipeline has not been repointed/i);
  assert.doesNotMatch(repositoryReadme, /repository remains canonical for the marketing site/i);
});

test('every public live contract role resolves to an exact source and canonical registry row', () => {
  const publicRegistry = JSON.parse(read('docs/mainnet-contracts.json'));
  const canonicalRegistry = read(
    'contracts/references/logs/imp/live-contract-registry-19-mar-2026.md',
  );

  for (const chain of publicRegistry.chains) {
    for (const contract of chain.contracts) {
      assert.match(contract.address, /^0x[0-9a-fA-F]{40}$/);
      assert.ok(
        fs.existsSync(path.join(root, 'contracts', contract.source)),
        `${chain.name}/${contract.id} has missing source ${contract.source}`,
      );
      assert.match(
        canonicalRegistry,
        new RegExp(contract.address, 'i'),
        `${chain.name}/${contract.id} address is absent from the canonical registry`,
      );
      assert.ok(
        canonicalRegistry.includes(path.basename(contract.source)),
        `${chain.name}/${contract.id} source is absent from the canonical registry`,
      );

      if (contract.kind === 'proxy') {
        assert.match(contract.implementation, /^0x[0-9a-fA-F]{40}$/);
        assert.match(
          canonicalRegistry,
          new RegExp(contract.implementation, 'i'),
          `${chain.name}/${contract.id} implementation is absent from the canonical registry`,
        );
      }
    }
  }
});

test('governance files identify review ownership and separate code from production authority', () => {
  const codeowners = read('.github/CODEOWNERS');
  const contributing = read('CONTRIBUTING.md');
  const agentGuide = read('AGENTS.md');

  for (const sensitivePath of [
    '/.github/',
    '/contracts/',
    '/infra/',
    '/src/config/chainConfig.js',
    '/backend/config.js',
    '/docs/mainnet-contracts.json',
  ]) {
    assert.ok(codeowners.includes(sensitivePath), `CODEOWNERS omits ${sensitivePath}`);
  }

  assert.match(
    contributing,
    /Repository write access alone does not\s+grant AWS release/,
  );
  assert.match(agentGuide, /code-change request does not authorize a deploy/i);
  assert.match(agentGuide, /Never modify a Solidity file that corresponds to an already deployed implementation/);
});
