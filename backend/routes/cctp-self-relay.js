'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { buildCctpRecoveryPlan, SUPPORTED_ACTIONS } = require('../services/cctp-self-relay');

const router = express.Router();
const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.OPPY_CCTP_RECOVERY_REQUESTS_PER_MINUTE || 45),
  message: 'Too many CCTP recovery checks. Please wait a moment and try again.',
}));

router.post('/', async (req, res) => {
  const input = {
    action: String(req.body?.action || ''),
    jobId: String(req.body?.jobId || ''),
    sourceTxHash: String(req.body?.sourceTxHash || ''),
    sourceChainId: Number(req.body?.sourceChainId),
    targetDomain: req.body?.targetDomain === null || req.body?.targetDomain === undefined
      ? null
      : Number(req.body.targetDomain),
  };
  if (!SUPPORTED_ACTIONS.has(input.action)) return res.status(400).json({ success: false, error: 'This action cannot be completed manually' });
  if (!VALID_JOB_ID.test(input.jobId)) return res.status(400).json({ success: false, error: 'A valid job ID is required' });
  if (!VALID_TX_HASH.test(input.sourceTxHash)) return res.status(400).json({ success: false, error: 'A valid source transaction hash is required' });
  if (![10, 50].includes(input.sourceChainId)) return res.status(400).json({ success: false, error: 'A supported source chain is required' });
  try {
    const plan = await buildCctpRecoveryPlan(input);
    return res.json({ success: true, plan });
  } catch (error) {
    console.warn('[oppy-cctp-recovery] plan failed:', error.message);
    return res.status(409).json({ success: false, error: error.message || 'CCTP recovery is not ready' });
  }
});

module.exports = router;
