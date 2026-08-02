const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { createRateLimiter } = require('../middleware/security');
const { walletSignature } = require('../middleware/wallet-auth');
const { uploadBudget } = require('../middleware/upload-budget');

// Configure multer for memory storage
const MAX_IPFS_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IPFS_BYTES, files: 1 },
});
const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many IPFS uploads',
});

function receiveSingleFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File exceeds the 10 MB limit' });
    }
    if (error) return next(error);
    return next();
  });
}

/**
 * Upload a file to IPFS.
 *
 * Strategy (in priority order):
 *   1. Self-hosted IPFS proxy  — if IPFS_API_URL + IPFS_PROXY_SECRET are set
 *   2. Pinata REST API         — if PINATA_JWT is set (fallback only)
 *   3. Error                   — nothing configured
 *
 * Lighthouse was removed when storage moved to the self-hosted AWS node.
 * `gateway.lighthouse.storage` remains in the *read* gateway list below; that is
 * a public IPFS gateway that can resolve any CID and implies no account there.
 *
 * Response format: { success: true, IpfsHash: "Qm...", PinSize: 12345, Timestamp: "..." }
 */
async function uploadToIPFS(buffer, filename, dependencies = {}) {
  const env = dependencies.env || process.env;
  const request = dependencies.fetch || fetch;
  const logger = dependencies.logger || console;
  const PINATA_JWT     = env.PINATA_JWT;
  const IPFS_API_URL   = env.IPFS_API_URL;
  const IPFS_SECRET    = env.IPFS_PROXY_SECRET;
  const failures = [];

  function recordFailure(provider, error) {
    failures.push(`${provider}: ${error.message}`);
    logger.warn(`IPFS ${provider} upload failed; trying next provider:`, error.message);
  }

  // ── Strategy 1: Self-hosted IPFS proxy ───────────────────────────────────
  if (IPFS_API_URL && IPFS_SECRET) {
    try {
      const form = new FormData();
      form.append('file', buffer, { filename: filename || 'upload' });
      const baseUrl = IPFS_API_URL.replace(/\/+$/, '');
      const resp = await request(`${baseUrl}/api/v0/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${IPFS_SECRET}`, ...form.getHeaders() },
        body: form
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text}`);
      }
      const data = await resp.json();
      if (!data.Hash) throw new Error('response did not contain a content hash');
      return { IpfsHash: data.Hash, PinSize: parseInt(data.Size) || 0 };
    } catch (error) {
      recordFailure('IPFS proxy', error);
    }
  }

  // Lighthouse was removed as a provider when storage moved to the self-hosted
  // AWS IPFS node. It previously sat here as strategy 2, which meant a proxy
  // outage silently routed uploads to a retired provider. If LIGHTHOUSE_API_KEY
  // is still set in any deployed environment, unset it — nothing reads it now.

  // ── Strategy 2: Pinata REST API ───────────────────────────────────────────
  if (PINATA_JWT && !PINATA_JWT.startsWith('dummy')) {
    try {
      const form = new FormData();
      form.append('file', buffer, { filename: filename || 'upload' });
      const resp = await request('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PINATA_JWT}`, ...form.getHeaders() },
        body: form
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text}`);
      }
      const data = await resp.json();
      if (!data.IpfsHash) throw new Error('response did not contain a content hash');
      return { IpfsHash: data.IpfsHash, PinSize: data.PinSize || 0 };
    } catch (error) {
      recordFailure('Pinata', error);
    }
  }

  if (failures.length) {
    throw new Error(`All configured IPFS providers failed (${failures.join('; ')})`);
  }
  throw new Error('No IPFS provider configured (set IPFS_API_URL+IPFS_PROXY_SECRET, or PINATA_JWT as fallback)');
}

async function uploadTextToIPFS(content, name) {
  const buf = Buffer.from(typeof content === 'string' ? content : JSON.stringify(content));
  return uploadToIPFS(buf, name || `json-${Date.now()}.json`);
}

function getReadGateways(hash, env = process.env) {
  const gateways = [];
  if (env.IPFS_API_URL && env.IPFS_PROXY_SECRET) {
    const baseUrl = env.IPFS_API_URL.replace(/\/+$/, '');
    gateways.push({
      url: `${baseUrl}/ipfs/${hash}`,
      headers: { 'Authorization': `Bearer ${env.IPFS_PROXY_SECRET}` },
    });
  }
  gateways.push(
    { url: `https://gateway.lighthouse.storage/ipfs/${hash}` },
    { url: `https://ipfs.io/ipfs/${hash}` },
    { url: `https://cloudflare-ipfs.com/ipfs/${hash}` },
    { url: `https://dweb.link/ipfs/${hash}` },
  );
  return gateways;
}

// ── POST /api/ipfs/upload-file ────────────────────────────────────────────────
router.post('/upload-file', uploadRateLimit, walletSignature(), uploadBudget(), receiveSingleFile, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
    const result = await uploadToIPFS(req.file.buffer, req.file.originalname);
    res.json({ success: true, ...result, Timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('IPFS upload-file error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /api/ipfs/upload-json ────────────────────────────────────────────────
// Accepts Pinata-format body for backwards compatibility
router.post('/upload-json', uploadRateLimit, walletSignature(), uploadBudget(), async (req, res) => {
  try {
    const content  = req.body.pinataContent || req.body;
    const metadata = req.body.pinataMetadata || {};
    const name     = (metadata.name || `json-${Date.now()}`) + '.json';
    const result   = await uploadTextToIPFS(JSON.stringify(content), name);
    res.json({ success: true, ...result, Timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('IPFS upload-json error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── GET /api/ipfs/content/:hash ───────────────────────────────────────────────
// Proxy IPFS reads through the local node. Returns 404 cleanly if not found.
router.get('/content/:hash', async (req, res) => {
  const { hash } = req.params;
  if (!hash || !/^[A-Za-z0-9]{10,100}$/.test(hash)) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  const gateways = getReadGateways(hash);

  for (const gateway of gateways) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(gateway.url, {
        headers: gateway.headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const ct = response.headers.get('content-type') || 'application/json';
        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > MAX_IPFS_BYTES) continue;
        const content = await response.buffer();
        if (content.length > MAX_IPFS_BYTES) continue;
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(content);
      }
    } catch (e) { /* try next */ }
  }
  res.status(404).json({ error: 'Content not found on IPFS', hash });
});

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('IPFS route error:', error.message);
  return res.status(500).json({ success: false, error: 'IPFS request failed' });
});

module.exports = router;
module.exports.uploadToIPFS = uploadToIPFS;
module.exports.getReadGateways = getReadGateways;
