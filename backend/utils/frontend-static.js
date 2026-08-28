const fs = require('fs');
const path = require('path');
const express = require('express');

const HASHED_ASSET = /^\/assets\/[A-Za-z0-9._-]+\.(?:css|js)$/;

function acceptsGzip(req) {
  return /(?:^|,)\s*gzip\s*(?:;|,|$)/i.test(req.get('accept-encoding') || '');
}

function contentTypeFor(assetPath) {
  return assetPath.endsWith('.css')
    ? 'text/css; charset=UTF-8'
    : 'application/javascript; charset=UTF-8';
}

function findPrecompressedAsset(distDir, requestPath) {
  if (!HASHED_ASSET.test(requestPath)) return null;

  const resolvedDist = path.resolve(distDir);
  const relativeAsset = requestPath.replace(/^\/+/, '');
  const gzipPath = path.resolve(resolvedDist, `${relativeAsset}.gz`);
  if (!gzipPath.startsWith(`${resolvedDist}${path.sep}`) || !fs.existsSync(gzipPath)) {
    return null;
  }

  return {
    gzipPath,
    contentType: contentTypeFor(requestPath),
  };
}

function setSpaNoCache(res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
}

/**
 * Serve Vite's precompressed assets and the SPA shell.
 *
 * vite-plugin-compression writes `asset.js.gz` and `asset.css.gz`, but
 * express.static does not select those files from Accept-Encoding. Without
 * this adapter the browser must download the multi-megabyte uncompressed entry
 * bundle before React can render anything.
 */
function mountFrontendStatic(app, { distDir }) {
  const resolvedDist = path.resolve(distDir);

  app.get(HASHED_ASSET, (req, res, next) => {
    if (!acceptsGzip(req)) return next();

    const asset = findPrecompressedAsset(resolvedDist, req.path);
    if (!asset) return next();

    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.vary('Accept-Encoding');
    return res.sendFile(asset.gzipPath);
  });

  app.use(express.static(resolvedDist, {
    immutable: true,
    maxAge: '1y',
  }));

  app.get('*', (req, res) => {
    // The HTML points at content-hashed assets and must never outlive a deploy.
    setSpaNoCache(res);
    res.sendFile(path.join(resolvedDist, 'index.html'));
  });
}

module.exports = {
  acceptsGzip,
  findPrecompressedAsset,
  mountFrontendStatic,
  setSpaNoCache,
};
