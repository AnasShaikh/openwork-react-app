'use strict';

const express = require('express');
const { createRateLimiter } = require('../middleware/security');
const { ACTION_REVIEW_RESPONSE, converse } = require('../services/bedrock-chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  extractEvmAddressFacts,
  resolveTransactionToolIntent,
  sanitizeWalletState,
} = require('../services/oppy-context');
const {
  getWalletJobIdentityContext,
  getWalletJobContext,
  sanitizeConversationMemory,
} = require('../services/oppy-job-context');
const {
  detectDataIntent,
  formatExplorerContext,
  runExplorerIntent,
} = require('../services/oppy-explorer');
const { resolveCrossChainStatusAnswer } = require('../services/oppy-cross-chain-answer');
const { isJobIdentityQuestion, resolveJobIdentityAnswer } = require('../services/oppy-job-identity');
const { resolveNativeBalanceAnswer } = require('../services/oppy-native-balance');
const {
  executeOppyReadTool,
  isJobCreationProvenanceQuestion,
  resolveJobCreationProvenanceAnswer,
} = require('../services/oppy-agent-tools');
const { BEDROCK_READ_TOOLS, BEDROCK_TRANSACTION_TOOLS, TOOL_RULES } = require('../services/chat-tools');

const router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 12;
const MAX_CONCURRENT_REQUESTS = Number(process.env.CHAT_MAX_CONCURRENT_REQUESTS || 20);
const EXPLORER_TOOL_NAMES = new Set(['browseJobs', 'openMyJobs', 'openJob', 'viewApplications']);
let inFlightRequests = 0;

function modelToolName(toolIntent) {
  return toolIntent?.name && !EXPLORER_TOOL_NAMES.has(toolIntent.name)
    ? toolIntent.name
    : null;
}

const NATURAL_TRANSACTION_TOOL_NAMES = BEDROCK_TRANSACTION_TOOLS
  .map((entry) => entry.toolSpec.name)
  .filter((name) => TOOL_RULES[name]?.kind === 'transaction');

function resolveSafeReplayTool(toolIntent, memory, allowedToolName) {
  return toolIntent?.source === 'safe-retry'
    && memory?.lastPreparedAction?.name === allowedToolName
    ? memory.lastPreparedAction
    : null;
}

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
    // Balance questions are read-only questions even when they mention the
    // action being funded (for example, "enough XDC to post a job?"). Resolve
    // them before action-intent detection so wording like "post a job" cannot
    // accidentally create a transaction card.
    const nativeBalanceAnswer = transactionMode
      ? await resolveNativeBalanceAnswer(request.message, request.wallet, request.memory)
      : null;
    if (nativeBalanceAnswer) {
      console.info('[chat] answered from live native balance', {
        chainId: nativeBalanceAnswer.chainId,
        balanceAvailable: nativeBalanceAnswer.balanceWei !== null,
      });
      return res.json({
        success: true,
        response: nativeBalanceAnswer.text,
        tool: null,
        explorer: null,
        nativeBalance: {
          chainId: nativeBalanceAnswer.chainId,
          chainName: nativeBalanceAnswer.chainName || null,
          symbol: nativeBalanceAnswer.symbol || null,
          balanceWei: nativeBalanceAnswer.balanceWei,
          requirementWei: nativeBalanceAnswer.requirementWei || null,
        },
        model: 'deterministic-native-balance',
        context: {
          activeJob: request.memory.activeJob || null,
          canonicalJobHistoryAvailable: false,
          canonicalJobCount: 0,
        },
      });
    }
    const toolIntent = transactionMode
      ? resolveTransactionToolIntent(request.message, request.history, request.memory)
      : null;
    const explicitToolName = toolIntent?.name || null;
    const allowedToolName = modelToolName(toolIntent);
    const replayTool = resolveSafeReplayTool(toolIntent, request.memory, allowedToolName);
    if (replayTool) {
      console.info('[chat] replayed verified safe action', {
        mode: request.mode,
        tool: replayTool.name,
      });
      return res.json({
        success: true,
        response: ACTION_REVIEW_RESPONSE,
        tool: replayTool,
        explorer: null,
        model: 'deterministic-safe-retry',
        context: {
          activeJob: request.memory.activeJob || null,
          canonicalJobHistoryAvailable: false,
          canonicalJobCount: 0,
        },
      });
    }
    const crossChainAnswer = transactionMode && !allowedToolName
      ? await resolveCrossChainStatusAnswer(request.message, request.memory)
      : null;
    if (crossChainAnswer) {
      console.info('[chat] answered from transaction-scoped cross-chain evidence', {
        action: crossChainAnswer.transaction.action,
        jobId: crossChainAnswer.transaction.jobId,
        state: crossChainAnswer.status.state,
      });
      return res.json({
        success: true,
        response: crossChainAnswer.text,
        tool: null,
        explorer: null,
        crossChainStatus: crossChainAnswer.status,
        model: 'deterministic-cross-chain-status',
        context: {
          activeJob: request.memory.activeJob || null,
          canonicalJobHistoryAvailable: crossChainAnswer.status.canonical?.state !== 'unavailable',
          canonicalJobCount: crossChainAnswer.status.canonical?.jobExists ? 1 : 0,
        },
      });
    }
    const explorerIntent = transactionMode ? detectDataIntent(request.message, explicitToolName) : null;
    const jobIdentityRequested = transactionMode
      && !allowedToolName
      && isJobIdentityQuestion(request.message, request.history);
    if (jobIdentityRequested) {
      const identityContext = await getWalletJobIdentityContext(
        request.wallet.address,
        request.memory,
      );
      const jobIdentityAnswer = resolveJobIdentityAnswer(
        request.message,
        request.history,
        identityContext,
      );
      const recoveredJob = jobIdentityAnswer.job || identityContext.activeJob || null;
      console.info('[chat] answered from verified job identity', {
        jobId: recoveredJob?.jobId || null,
        evidence: recoveredJob?.evidence || null,
      });
      return res.json({
        success: true,
        response: jobIdentityAnswer.text,
        tool: null,
        explorer: null,
        model: 'deterministic-job-identity',
        context: {
          activeJob: recoveredJob,
          canonicalJobHistoryAvailable: identityContext.available === true,
          canonicalJobCount: identityContext.posterJobIds?.length || 0,
        },
      });
    }
    const jobContext = transactionMode && request.wallet.connected
      ? await getWalletJobContext(request.wallet.address, request.memory)
      : {
          available: false,
          reason: 'wallet not connected',
          activeJob: request.memory.activeJob,
          jobs: [],
          recentTransactions: request.memory.recentTransactions,
          latestTransactionDiagnostic: request.memory.latestTransactionDiagnostic,
          lastPreparedAction: request.memory.lastPreparedAction,
        };
    const creationProvenanceAnswer = transactionMode
      && !allowedToolName
      && isJobCreationProvenanceQuestion(request.message)
      ? await resolveJobCreationProvenanceAnswer(request.message, {
          memory: request.memory,
          jobContext,
        })
      : null;
    if (creationProvenanceAnswer) {
      console.info('[chat] answered from deterministic job-creation provenance', {
        jobId: creationProvenanceAnswer.jobId,
        type: creationProvenanceAnswer.creation.type,
        evidenceSource: creationProvenanceAnswer.creation.evidenceSource,
      });
      return res.json({
        success: true,
        response: creationProvenanceAnswer.text,
        tool: null,
        explorer: null,
        creationProvenance: creationProvenanceAnswer.creation,
        model: 'deterministic-job-creation-provenance',
        context: {
          activeJob: jobContext.activeJob || request.memory.activeJob || null,
          canonicalJobHistoryAvailable: jobContext.available === true,
          canonicalJobCount: jobContext.jobs?.length || 0,
        },
      });
    }
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
          toolIntent: allowedToolName ? toolIntent : null,
          validatedAddresses: extractEvmAddressFacts(request.message, request.history),
        })
      : buildDocsSystemPrompt(request.message);
    const systemPrompt = `${baseSystemPrompt}${explorer ? `\n\n${formatExplorerContext(explorer)}` : ''}`;

    // Explicit actions retain the narrow one-tool boundary. When no keyword
    // router recognized the wording, the model may still understand a clear
    // layman request by choosing from every review-only transaction tool. Read
    // tools are always available in transaction mode and never request a
    // signature or submit a write.
    const naturalActionDiscovery = transactionMode && !explicitToolName && !explorerIntent;
    const allowedTransactionToolNames = allowedToolName
      ? [allowedToolName]
      : (naturalActionDiscovery ? NATURAL_TRANSACTION_TOOL_NAMES : []);

    const result = await converse({
      message: request.message,
      history: request.history,
      systemPrompt,
      allowTools: allowedTransactionToolNames.length > 0,
      allowedToolNames: allowedTransactionToolNames,
      forceToolName: toolIntent?.source === 'safe-retry' ? allowedToolName : undefined,
      readTools: transactionMode ? BEDROCK_READ_TOOLS : [],
      executeReadTool: transactionMode
        ? (tool) => executeOppyReadTool(tool, {
            message: request.message,
            history: request.history,
            wallet: request.wallet,
            memory: request.memory,
            jobContext,
          })
        : undefined,
      maxTokens: transactionMode
        ? Number(process.env.OPPY_AGENT_MAX_OUTPUT_TOKENS || 1000)
        : Number(process.env.BEDROCK_MAX_TOKENS || 1400),
    });

    console.info('[chat] completed', {
      mode: request.mode,
      modelId: result.modelId,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      cacheReadInputTokens: result.usage?.cacheReadInputTokens,
      cacheWriteInputTokens: result.usage?.cacheWriteInputTokens,
      modelCalls: result.agent?.modelCalls || 1,
      readToolCalls: result.agent?.readToolCalls || 0,
      readToolNames: result.agent?.readToolNames || [],
      tool: result.tool?.name || null,
    });

    return res.json({
      success: true,
      response: result.text,
      tool: result.tool || null,
      explorer,
      model: result.modelId,
      agent: result.agent || { modelCalls: 1, readToolCalls: 0, readToolNames: [] },
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
module.exports.modelToolName = modelToolName;
module.exports.NATURAL_TRANSACTION_TOOL_NAMES = NATURAL_TRANSACTION_TOOL_NAMES;
module.exports.resolveSafeReplayTool = resolveSafeReplayTool;
