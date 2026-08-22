'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { readCrossChainActionStatus, SUPPORTED_ACTIONS } = require('../services/cross-chain-action-status');

const router = express.Router();
const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.OPPY_CROSS_CHAIN_STATUS_REQUESTS_PER_MINUTE || 60),
  message: 'Too many cross-chain status requests. Please wait a moment and try again.',
}));

function optionalInteger(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

router.get('/', async (req, res) => {
  const action = String(req.query.action || '');
  const jobId = String(req.query.jobId || '');
  const sourceTxHash = String(req.query.sourceTxHash || '');
  const sourceChainId = optionalInteger(req.query.sourceChainId);
  const targetDomain = optionalInteger(req.query.targetDomain);
  const baselineTotalPaidRaw = req.query.baselineTotalPaidRaw === undefined
    ? null
    : String(req.query.baselineTotalPaidRaw);

  if (!SUPPORTED_ACTIONS.has(action)) {
    return res.status(400).json({ success: false, error: 'A supported action is required' });
  }
  if (!VALID_JOB_ID.test(jobId)) {
    return res.status(400).json({ success: false, error: 'A valid OpenWork job ID is required' });
  }
  if (!VALID_TX_HASH.test(sourceTxHash)) {
    return res.status(400).json({ success: false, error: 'A valid source transaction hash is required' });
  }
  if (![10, 50].includes(sourceChainId)) {
    return res.status(400).json({ success: false, error: 'A supported source chain is required' });
  }
  const expectedPrefix = sourceChainId === 50 ? '30365-' : '30111-';
  if (!jobId.startsWith(expectedPrefix)) {
    return res.status(400).json({ success: false, error: 'The job ID does not belong to the source chain' });
  }
  if (targetDomain !== null && ![2, 3, 18].includes(targetDomain)) {
    return res.status(400).json({ success: false, error: 'A supported payment destination is required' });
  }
  if (baselineTotalPaidRaw !== null && !/^\d{1,78}$/.test(baselineTotalPaidRaw)) {
    return res.status(400).json({ success: false, error: 'The payment baseline is invalid' });
  }

  try {
    const status = await readCrossChainActionStatus({
      action,
      jobId,
      sourceTxHash,
      sourceChainId,
      targetDomain,
      baselineTotalPaidRaw,
    });
    return res.json({ success: true, status });
  } catch (error) {
    console.warn('[oppy-cross-chain-status] check failed:', error.message);
    return res.status(503).json({
      success: false,
      error: 'Cross-chain status is temporarily unavailable. The source transaction remains safe to inspect.',
    });
  }
});

module.exports = router;
