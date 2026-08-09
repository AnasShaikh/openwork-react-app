'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { converse } = require('../services/bedrock-chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  sanitizeWalletState,
} = require('../services/oppy-context');
const {
  getWalletJobContext,
  sanitizeConversationMemory,
} = require('../services/oppy-job-context');

const router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 24;
const MAX_CONCURRENT_REQUESTS = Number(process.env.CHAT_MAX_CONCURRENT_REQUESTS || 20);
let inFlightRequests = 0;

router.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.CHAT_REQUESTS_PER_MINUTE || 12),
  message: 'Too many Agent Oppy requests. Please wait a moment and try again.',
}));

function validateRequest(body = {}) {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return { error: 'Message is required' };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` };
  }

  const mode = body.mode === 'transactions' ? 'transactions' : 'docs';
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ITEMS) : [];
  const wallet = sanitizeWalletState(body.wallet);
  const memory = sanitizeConversationMemory(body.memory);
  return { message, mode, history, wallet, memory };
}

router.post('/', async (req, res) => {
  const request = validateRequest(req.body);
  if (request.error) return res.status(400).json({ success: false, error: request.error });

  if (inFlightRequests >= MAX_CONCURRENT_REQUESTS) {
    res.set('Retry-After', '5');
    return res.status(503).json({
      success: false,
      error: 'Agent Oppy is busy. Please try again shortly.',
    });
  }

  inFlightRequests += 1;
  try {
    const transactionMode = request.mode === 'transactions';
    const jobContext = transactionMode && request.wallet.connected
      ? await getWalletJobContext(request.wallet.address, request.memory)
      : {
          available: false,
          reason: 'wallet not connected',
          activeJob: request.memory.activeJob,
          jobs: [],
          recentTransactions: request.memory.recentTransactions,
        };
    const systemPrompt = transactionMode
      ? buildTransactionSystemPrompt(request.message, request.wallet, { jobContext })
      : buildDocsSystemPrompt(request.message);

    const result = await converse({
      message: request.message,
      history: request.history,
      systemPrompt,
      allowTools: transactionMode,
    });

    console.info('[chat] completed', {
      mode: request.mode,
      modelId: result.modelId,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      tool: result.tool?.name || null,
    });

    return res.json({
      success: true,
      response: result.text,
      tool: result.tool || null,
      model: result.modelId,
      context: transactionMode ? {
        activeJob: jobContext.activeJob || null,
        canonicalJobHistoryAvailable: jobContext.available === true,
        canonicalJobCount: jobContext.jobs?.length || 0,
      } : undefined,
    });
  } catch (error) {
    console.error('[chat] Bedrock request failed', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return res.status(503).json({
      success: false,
      error: 'Agent Oppy is temporarily unavailable. Please try again.',
    });
  } finally {
    inFlightRequests -= 1;
  }
});

module.exports = router;
module.exports.validateRequest = validateRequest;
