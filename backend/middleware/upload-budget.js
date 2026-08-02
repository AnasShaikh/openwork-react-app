'use strict';

const MB = 1024 * 1024;
const GB = 1024 * MB;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_DAILY_BYTES = Number(process.env.IPFS_DAILY_BYTES_PER_ADDRESS) || 50 * MB;
const ALLOWLIST_DAILY_BYTES = Number(process.env.IPFS_ALLOWLIST_DAILY_BYTES) || 5 * GB;

// Fraction of the node's storage cap above which uploads are refused, leaving
// headroom for the operator to intervene before the node stops accepting writes.
const DISK_STOP_FRACTION = Number(process.env.IPFS_DISK_STOP_FRACTION) || 0.85;

function allowlist() {
  return new Set(
    String(process.env.IPFS_UPLOAD_ALLOWLIST || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Per-address rolling daily byte budget.
 *
 * LIMITATION, deliberately recorded: this counter is in-memory. It resets when
 * the service restarts and is not shared between App Runner instances, so the
 * effective ceiling is per-instance. It still removes the anonymous-unbounded
 * case, which is the failure that matters — an attacker now needs a fresh funded
 * wallet per bucket rather than a fresh IP address, and wallets can be
 * blocklisted permanently. Move this to the database when upload volume makes
 * per-instance drift material.
 */
const buckets = new Map();

function pruneExpired(now) {
  for (const [address, bucket] of buckets) {
    if (now - bucket.windowStart >= DAY_MS) buckets.delete(address);
  }
}

function budgetFor(address) {
  return allowlist().has(String(address).toLowerCase())
    ? ALLOWLIST_DAILY_BYTES
    : DEFAULT_DAILY_BYTES;
}

function consume(address, bytes, now = Date.now()) {
  const key = String(address).toLowerCase();
  const limit = budgetFor(key);

  if (buckets.size > 5000) pruneExpired(now);

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= DAY_MS) {
    bucket = { bytes: 0, windowStart: now };
    buckets.set(key, bucket);
  }

  if (bucket.bytes + bytes > limit) {
    const resetsInMs = DAY_MS - (now - bucket.windowStart);
    return {
      allowed: false,
      used: bucket.bytes,
      limit,
      resetsInMinutes: Math.ceil(resetsInMs / 60000),
    };
  }

  bucket.bytes += bytes;
  return { allowed: true, used: bucket.bytes, limit };
}

/**
 * Refuses uploads when the IPFS node is close to full.
 *
 * Uploaded content is pinned, and pinned content is exempt from Kubo's garbage
 * collection, so the repository only grows. Without this, an upload flood fills
 * the 20 GiB cap permanently and users can no longer post jobs, because posting
 * requires uploading job metadata first.
 *
 * The check needs Kubo's `/api/v0/repo/stat`. That path is not currently exposed
 * by the node's nginx proxy — it returns 404 while `/api/v0/add` returns 401 — so
 * this degrades to a logged warning rather than blocking every upload. It starts
 * enforcing automatically once the proxy allows the endpoint.
 */
async function diskHeadroom(dependencies = {}) {
  const env = dependencies.env || process.env;
  const request = dependencies.fetch || require('node-fetch');
  const logger = dependencies.logger || console;

  const apiUrl = env.IPFS_API_URL;
  const secret = env.IPFS_PROXY_SECRET;
  if (!apiUrl || !secret) return { known: false, reason: 'proxy not configured' };

  try {
    const resp = await request(`${apiUrl.replace(/\/+$/, '')}/api/v0/repo/stat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!resp.ok) {
      return { known: false, reason: `repo/stat returned HTTP ${resp.status}` };
    }
    const stat = await resp.json();
    const used = Number(stat.RepoSize);
    const max = Number(stat.StorageMax);
    if (!Number.isFinite(used) || !Number.isFinite(max) || max <= 0) {
      return { known: false, reason: 'repo/stat did not report usable figures' };
    }
    return { known: true, used, max, fraction: used / max };
  } catch (error) {
    logger.warn('IPFS repo/stat check failed:', error.message);
    return { known: false, reason: error.message };
  }
}

function uploadBudget() {
  return async (req, res, next) => {
    const headroom = await diskHeadroom();
    if (headroom.known && headroom.fraction >= DISK_STOP_FRACTION) {
      return res.status(507).json({
        success: false,
        error: 'IPFS storage is nearly full; uploads are temporarily refused',
      });
    }
    if (!headroom.known) {
      // Visible, not silent: the protection is inactive and someone should know.
      console.warn(`IPFS disk headroom unknown (${headroom.reason}); upload allowed`);
    }

    // Without an identified caller there is nothing to charge. Enforcement of
    // identity itself is the signature middleware's job.
    if (!req.walletAddress) return next();

    const declared = Number(req.get('content-length')) || 0;
    const verdict = consume(req.walletAddress, declared);
    if (!verdict.allowed) {
      return res.status(429).json({
        success: false,
        error: `Daily upload limit reached (${Math.round(verdict.limit / MB)} MB). Resets in ${verdict.resetsInMinutes} minutes.`,
      });
    }
    return next();
  };
}

module.exports = {
  uploadBudget,
  consume,
  budgetFor,
  diskHeadroom,
  DEFAULT_DAILY_BYTES,
  ALLOWLIST_DAILY_BYTES,
};
