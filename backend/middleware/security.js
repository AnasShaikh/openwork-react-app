'use strict';

const crypto = require('crypto');

const DEFAULT_ALLOWED_ORIGINS = [
  'https://openwork.technology',
  'https://www.openwork.technology',
  'https://app.openwork.technology',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function configuredOrigins(value = process.env.ALLOWED_ORIGINS) {
  const origins = value
    ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;

  return new Set(origins.filter((origin) => {
    try {
      const protocol = new URL(origin).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }));
}

function createCorsOptions(value = process.env.ALLOWED_ORIGINS) {
  const allowedOrigins = configuredOrigins(value);
  return {
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin(origin, callback) {
      // Non-browser clients and same-origin server calls may omit Origin.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
  };
}

function requireConfiguredToken({ envName, headerName }) {
  return (req, res, next) => {
    const expectedToken = process.env[envName];
    if (!expectedToken) {
      return res.status(503).json({
        success: false,
        error: `${envName} is not configured`,
      });
    }

    const suppliedToken = req.get(headerName);
    if (!safeEqual(suppliedToken, expectedToken)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    return next();
  };
}

function createRateLimiter({ windowMs, max, message = 'Too many requests' }) {
  const clients = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let entry = clients.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, error: message });
    }

    entry.count += 1;
    clients.set(key, entry);

    // Bound memory use without a background timer that complicates shutdown.
    if (clients.size > 10000) {
      for (const [clientKey, clientEntry] of clients) {
        if (now >= clientEntry.resetAt || clients.size > 9000) clients.delete(clientKey);
        if (clients.size <= 9000) break;
      }
    }

    return next();
  };
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  configuredOrigins,
  createCorsOptions,
  createRateLimiter,
  requireConfiguredToken,
  safeEqual,
};
