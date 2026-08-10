'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { converse } = require('../services/bedrock-chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  detectExplicitToolIntent,
  extractEvmAddressFacts,
  sanitizeWalletState,
} = require('../services/oppy-context');
const {
  getWalletJobContext,
  sanitizeConversationMemory,
} = require('../services/oppy-job-context');
const {
  detectDataIntent,
  formatExplorerContext,
  runExplorerIntent,
} = require('../services/oppy-explorer');

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
    const explicitToolName = transactionMode ? detectExplicitToolIntent(request.message) : null;
    const explorerIntent = transactionMode ? detectDataIntent(request.message, explicitToolName) : null;
    const jobContext = transactionMode && request.wallet.connected
      ? await getWalletJobContext(request.wallet.address, request.memory)
      : {
          available: false,
          reason: 'wallet not connected',
          activeJob: request.memory.activeJob,
          jobs: [],
          recentTransactions: request.memory.recentTransactions,
        };
    let explorer = null;
    if (explorerIntent) {
      try {
        explorer = await runExplorerIntent(explorerIntent, request.wallet.address);
      } catch (error) {
        console.warn('[chat] explorer read degraded', {
          type: explorerIntent.type,
          message: error?.message,
        });
        explorer = {
          type: explorerIntent.type,
          available: false,
          error: 'Live canonical data could not be loaded. Please retry in a moment.',
        };
      }
    }
    const baseSystemPrompt = transactionMode
      ? buildTransactionSystemPrompt(request.message, request.wallet, {
          jobContext,
          explicitToolName,
          validatedAddresses: extractEvmAddressFacts(request.message, request.history),
        })
      : buildDocsSystemPrompt(request.message);
    const systemPrompt = `${baseSystemPrompt}${explorer ? `\n\n${formatExplorerContext(explorer)}` : ''}`;

    const result = await converse({
      message: request.message,
      history: request.history,
      systemPrompt,
      allowTools: transactionMode && Boolean(explicitToolName),
      allowedToolNames: explicitToolName ? [explicitToolName] : undefined,
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
      explorer,
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
