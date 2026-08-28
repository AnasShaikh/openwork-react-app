'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { readRelayerReadiness } = require('../services/relayer-readiness');

const router = express.Router();
const ACTIONS = new Set([
  'postJob', 'applyToJob', 'startDirectContract', 'startJob', 'submitWork',
  'releasePayment', 'lockNextMilestone', 'raiseDispute', 'settleDispute',
]);

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.OPPY_RELAY_READINESS_REQUESTS_PER_MINUTE || 90),
  message: 'Too many relay readiness checks. Please wait a moment and try again.',
}));

router.post('/', async (req, res) => {
  const action = String(req.body?.action || '');
  const sourceChainId = Number(req.body?.sourceChainId);
  const targetDomain = req.body?.targetDomain === null || req.body?.targetDomain === undefined
    ? null
    : Number(req.body.targetDomain);
  if (!ACTIONS.has(action)) return res.status(400).json({ success: false, error: 'A supported action is required' });
  if (![10, 50, 42161, 11155420, 11155111, 421614].includes(sourceChainId)) {
    return res.status(400).json({ success: false, error: 'A supported source chain is required' });
  }
  if (targetDomain !== null && ![2, 3, 18].includes(targetDomain)) {
    return res.status(400).json({ success: false, error: 'A supported destination is required' });
  }
  try {
    const readiness = await readRelayerReadiness({ action, sourceChainId, targetDomain });
    return res.json({ success: true, readiness });
  } catch (error) {
    return res.status(503).json({ success: false, error: error.message || 'Relay readiness is unavailable' });
  }
});

module.exports = router;
