'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { createPresignedTranscriptionSession } = require('../services/transcribe-session');

const router = express.Router();
const configuredRateLimit = Number(process.env.TRANSCRIBE_SESSIONS_PER_MINUTE);
const sessionsPerMinute = Number.isSafeInteger(configuredRateLimit) && configuredRateLimit > 0
  ? configuredRateLimit
  : 6;

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: sessionsPerMinute,
  message: 'Too many voice transcription sessions. Please wait a moment and try again.',
}));

router.post('/session', async (_req, res) => {
  try {
    const session = await createPresignedTranscriptionSession();
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, ...session });
  } catch (error) {
    console.error('[transcription] session creation failed', {
      name: error?.name,
      message: error?.message,
    });
    return res.status(503).json({
      success: false,
      error: 'Voice transcription is temporarily unavailable. Please try again.',
    });
  }
});

module.exports = router;
