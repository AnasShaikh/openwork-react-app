const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  acceptsGzip,
  findPrecompressedAsset,
  setSpaNoCache,
} = require('../utils/frontend-static');

function withFixture(run) {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openwork-static-'));
  fs.mkdirSync(path.join(distDir, 'assets'));
  fs.writeFileSync(path.join(distDir, 'assets/app-123.js.gz'), 'compressed fixture');

  try {
    run(distDir);
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
}

test('selects Vite gzip assets only for safe hashed asset paths', () => {
  withFixture((distDir) => {
    const asset = findPrecompressedAsset(distDir, '/assets/app-123.js');
    assert.equal(asset.gzipPath, path.join(distDir, 'assets/app-123.js.gz'));
    assert.equal(asset.contentType, 'application/javascript; charset=UTF-8');
    assert.equal(findPrecompressedAsset(distDir, '/../server.js'), null);
    assert.equal(findPrecompressedAsset(distDir, '/assets/missing.js'), null);
  });
});

test('recognizes browser gzip support and disables SPA shell caching', () => {
  assert.equal(acceptsGzip({ get: () => 'br, gzip, deflate' }), true);
  assert.equal(acceptsGzip({ get: () => 'br' }), false);

  const headers = new Map();
  setSpaNoCache({ setHeader: (name, value) => headers.set(name, value) });
  assert.equal(headers.get('Cache-Control'), 'no-cache, no-store, must-revalidate');
});
