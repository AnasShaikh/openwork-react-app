'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const {
  runExplorerIntent,
} = require('../services/oppy-explorer');

const router = express.Router();

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.OPPY_EXPLORER_REQUESTS_PER_MINUTE || 30),
  message: 'Too many Oppy explorer requests. Please wait a moment and try again.',
}));

function validAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function validJobId(value) {
  return typeof value === 'string' && /^\d+-\d+$/.test(value);
}

function sendError(res, error) {
  const message = error?.message || 'Live OpenWork data is temporarily unavailable';
  const notFound = /not available in canonical Genesis/.test(message);
  return res.status(notFound ? 404 : 503).json({
    success: false,
    error: notFound ? message : 'Live OpenWork data is temporarily unavailable. Please retry shortly.',
  });
}

router.get('/wallet/:address', async (req, res) => {
  if (!validAddress(req.params.address)) {
    return res.status(400).json({ success: false, error: 'A valid EVM wallet address is required' });
  }
  try {
    return res.json({ success: true, explorer: await runExplorerIntent({ type: 'wallet' }, req.params.address) });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/platform', async (_req, res) => {
  try {
    return res.json({ success: true, explorer: await runExplorerIntent({ type: 'platform' }, null) });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/jobs/:jobId', async (req, res) => {
  if (!validJobId(req.params.jobId)) {
    return res.status(400).json({ success: false, error: 'A valid OpenWork job ID is required' });
  }
  const wallet = validAddress(req.query.wallet) ? req.query.wallet : null;
  try {
    return res.json({ success: true, explorer: await runExplorerIntent({ type: 'job', jobId: req.params.jobId }, wallet) });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : '';
  if (!query && !req.query.status && !req.query.chain) {
    return res.status(400).json({ success: false, error: 'A search query or filter is required' });
  }
  try {
    const explorer = await runExplorerIntent({
      type: 'search',
      query,
      filters: {
        status: typeof req.query.status === 'string' ? req.query.status : '',
        chain: typeof req.query.chain === 'string' ? req.query.chain : '',
      },
    }, null);
    return res.json({ success: true, explorer });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
