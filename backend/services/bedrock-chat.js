'use strict';

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const {
  BEDROCK_TRANSACTION_TOOLS,
  validateReadToolUse,
  validateToolUse,
} = require('./chat-tools');

const DEFAULT_MODEL_ID = 'us.anthropic.claude-sonnet-4-6';
const DEFAULT_REGION = 'us-east-1';
const MAX_HISTORY_ITEMS = 12;
const DEFAULT_MAX_READ_TOOL_ROUNDS = 1;
const DEFAULT_MAX_MODEL_CALLS = 2;
const MAX_TOOL_RESULT_BYTES = 20 * 1024;

let sharedClient;

const INTERNAL_TRACE_PATTERNS = [
  /<(?:function_calls?|tool_calls?)\b[^>]*>[\s\S]*?<\/(?:function_calls?|tool_calls?)>/gi,
  /<invoke\b[^>]*>[\s\S]*?<\/invoke>/gi,
  /<tool_call\b[^>]*>[\s\S]*?<\/tool_call>/gi,
  /<tool_response\b[^>]*>[\s\S]*?<\/tool_response>/gi,
  /<function_call\b[^>]*>[\s\S]*?<\/function_call>/gi,
  /<function_response\b[^>]*>[\s\S]*?<\/function_response>/gi,
  /<tool\b[^>]*>[\s\S]*?<\/tool>/gi,
];
const INTERNAL_TRACE_MARKER = /<\/?(?:tool|tool_calls?|tool_response|function_calls?|function_response|invoke|parameter)\b/i;
const MALFORMED_ACTION_RESPONSE = "I couldn't prepare that review card. Please try the action again.";
const ACTION_REVIEW_RESPONSE = 'Review the proposed action below before continuing.';

function sanitizeAssistantText(value) {
  let text = typeof value === 'string' ? value : '';
  for (const pattern of INTERNAL_TRACE_PATTERNS) text = text.replace(pattern, '');
  text = text
    .replace(/<(?:function_calls?|tool_calls?|invoke)\b[^>]*>[\s\S]*$/gi, '')
    .replace(/<\/?(?:tool|tool_calls?|tool_response|function_calls?|function_response|invoke|parameter)\b[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

function getClient() {
  if (!sharedClient) {
    sharedClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || DEFAULT_REGION,
    });
  }
  return sharedClient;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const sanitized = history.slice(-MAX_HISTORY_ITEMS).flatMap((entry) => {
    const role = entry?.role === 'user'
      ? 'user'
      : (entry?.role === 'oppy' || entry?.role === 'bot' || entry?.role === 'assistant' ? 'assistant' : null);
    const text = sanitizeAssistantText(entry?.text).slice(0, 2000);
    return role && text ? [{ role, content: [{ text }] }] : [];
  });

  // Bedrock conversations must start with a user and alternate roles. Collapse
  // malformed same-role client history instead of forwarding invalid messages.
  const normalized = [];
  for (const entry of sanitized) {
    if (!normalized.length && entry.role === 'assistant') continue;
    const previous = normalized[normalized.length - 1];
    if (previous?.role === entry.role) {
      previous.content[0].text = `${previous.content[0].text}\n\n${entry.content[0].text}`.slice(-4000);
    } else {
      normalized.push(entry);
    }
  }
  return normalized;
}

function extractResponse(message, allowTools, allowedToolNames) {
  const content = Array.isArray(message?.content) ? message.content : [];
  const rawText = content
    .filter((block) => typeof block?.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n\n');
  const text = sanitizeAssistantText(rawText);
  const toolBlock = allowTools ? content.find((block) => block?.toolUse) : null;
  const validatedTool = toolBlock ? validateToolUse(toolBlock.toolUse) : null;
  const allowedNames = Array.isArray(allowedToolNames) && allowedToolNames.length
    ? new Set(allowedToolNames)
    : null;
  const acceptedTool = validatedTool && (!allowedNames || allowedNames.has(validatedTool.name))
    ? validatedTool
    : null;
  return {
    text: acceptedTool
      ? ACTION_REVIEW_RESPONSE
      : (INTERNAL_TRACE_MARKER.test(rawText)
        ? MALFORMED_ACTION_RESPONSE
        : (text || 'Sorry, I could not generate a response.')),
    tool: acceptedTool,
  };
}

function aggregateUsage(current = {}, next = {}) {
  const keys = [
    'inputTokens',
    'outputTokens',
    'totalTokens',
    'cacheReadInputTokens',
    'cacheWriteInputTokens',
  ];
  return keys.reduce((usage, key) => {
    const value = Number(current[key] || 0) + Number(next[key] || 0);
    if (value || current[key] !== undefined || next[key] !== undefined) usage[key] = value;
    return usage;
  }, {});
}

function transactionTools(allowTools, allowedToolNames) {
  if (!allowTools) return [];
  const allowedNames = Array.isArray(allowedToolNames) && allowedToolNames.length
    ? new Set(allowedToolNames)
    : null;
  return allowedNames
    ? BEDROCK_TRANSACTION_TOOLS.filter((entry) => allowedNames.has(entry.toolSpec.name))
    : BEDROCK_TRANSACTION_TOOLS;
}

function boundedToolResult(value) {
  try {
    const serialized = JSON.stringify(value ?? null);
    if (serialized.length <= MAX_TOOL_RESULT_BYTES) return JSON.parse(serialized);
    return {
      available: false,
      truncated: true,
      explanation: 'The read returned more detail than Oppy can safely place in one model turn. Ask for a narrower job or transaction.',
    };
  } catch {
    return { available: false, explanation: 'The read result could not be normalized safely.' };
  }
}

function validatedTransactionUses(content, allowedToolNames) {
  const allowed = Array.isArray(allowedToolNames) && allowedToolNames.length
    ? new Set(allowedToolNames)
    : null;
  return content.flatMap((block) => {
    const tool = block?.toolUse ? validateToolUse(block.toolUse) : null;
    return tool && (!allowed || allowed.has(tool.name)) ? [tool] : [];
  });
}

function validatedReadUses(content, readToolNames) {
  const allowed = new Set(readToolNames || []);
  return content.flatMap((block) => {
    const tool = block?.toolUse ? validateReadToolUse(block.toolUse) : null;
    return tool && allowed.has(tool.name) && tool.id ? [tool] : [];
  });
}

async function converse({
  message,
  history,
  systemPrompt,
  allowTools = false,
  allowedToolNames,
  forceToolName,
  readTools = [],
  executeReadTool,
  maxReadToolRounds = Number(process.env.OPPY_AGENT_MAX_READ_TOOL_ROUNDS || DEFAULT_MAX_READ_TOOL_ROUNDS),
  maxModelCalls = Number(process.env.OPPY_AGENT_MAX_MODEL_CALLS || DEFAULT_MAX_MODEL_CALLS),
  maxTokens = Number(process.env.BEDROCK_MAX_TOKENS || 1400),
  client = getClient(),
}) {
  const modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;
  const messages = normalizeHistory(history);
  const previous = messages[messages.length - 1];
  if (previous?.role === 'user') {
    previous.content[0].text = `${previous.content[0].text}\n\n${message}`.slice(-4000);
  } else {
    messages.push({ role: 'user', content: [{ text: message }] });
  }

  const writeTools = transactionTools(allowTools, allowedToolNames);
  const boundedCalls = Math.max(1, Math.min(3, Number(maxModelCalls) || DEFAULT_MAX_MODEL_CALLS));
  const boundedReadRounds = Math.max(0, Math.min(boundedCalls - 1, Number(maxReadToolRounds) || 0));
  let readRounds = 0;
  let usage = {};
  const readToolNamesUsed = [];

  for (let callIndex = 0; callIndex < boundedCalls; callIndex += 1) {
    const activeReadTools = readRounds < boundedReadRounds ? readTools : [];
    const tools = [...writeTools, ...activeReadTools];
    const commandInput = {
      modelId,
      messages,
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        temperature: 0.2,
        maxTokens,
      },
    };
    if (tools.length) {
      commandInput.toolConfig = { tools };
      if (forceToolName && tools.some((entry) => entry.toolSpec.name === forceToolName)) {
        commandInput.toolConfig.toolChoice = { tool: { name: forceToolName } };
      }
    }

    const response = await client.send(new ConverseCommand(commandInput));
    usage = aggregateUsage(usage, response.usage);
    const outputMessage = response.output?.message || { role: 'assistant', content: [] };
    const content = Array.isArray(outputMessage.content) ? outputMessage.content : [];
    const writeUses = validatedTransactionUses(content, allowedToolNames);
    if (writeUses.length === 1) {
      return {
        text: ACTION_REVIEW_RESPONSE,
        tool: writeUses[0],
        modelId,
        usage,
        agent: { modelCalls: callIndex + 1, readToolCalls: readToolNamesUsed.length, readToolNames: readToolNamesUsed },
      };
    }
    if (writeUses.length > 1) {
      return {
        text: 'I found more than one possible wallet action. Tell me which one you want to do first.',
        tool: null,
        modelId,
        usage,
        agent: { modelCalls: callIndex + 1, readToolCalls: readToolNamesUsed.length, readToolNames: readToolNamesUsed },
      };
    }

    const readUses = validatedReadUses(content, activeReadTools.map((entry) => entry.toolSpec.name));
    if (readUses.length && typeof executeReadTool === 'function' && readRounds < boundedReadRounds) {
      const results = await Promise.all(readUses.map(async (toolUse) => {
        readToolNamesUsed.push(toolUse.name);
        try {
          return {
            toolUseId: toolUse.id,
            status: 'success',
            content: [{ json: boundedToolResult(await executeReadTool(toolUse)) }],
          };
        } catch (error) {
          return {
            toolUseId: toolUse.id,
            status: 'error',
            content: [{ json: { available: false, error: String(error?.message || 'Read-only tool failed').slice(0, 500) } }],
          };
        }
      }));
      messages.push({ role: 'assistant', content });
      messages.push({ role: 'user', content: results.map((toolResult) => ({ toolResult })) });
      readRounds += 1;
      continue;
    }

    const extracted = extractResponse(outputMessage, false, allowedToolNames);
    return {
      ...extracted,
      modelId,
      usage,
      agent: { modelCalls: callIndex + 1, readToolCalls: readToolNamesUsed.length, readToolNames: readToolNamesUsed },
    };
  }

  return {
    text: 'I could not finish the live check within this request. No transaction was submitted; please ask me to check the status again.',
    tool: null,
    modelId,
    usage,
    agent: { modelCalls: boundedCalls, readToolCalls: readToolNamesUsed.length, readToolNames: readToolNamesUsed },
  };
}

module.exports = {
  ACTION_REVIEW_RESPONSE,
  DEFAULT_MAX_MODEL_CALLS,
  DEFAULT_MAX_READ_TOOL_ROUNDS,
  DEFAULT_MODEL_ID,
  MALFORMED_ACTION_RESPONSE,
  MAX_HISTORY_ITEMS,
  aggregateUsage,
  boundedToolResult,
  converse,
  extractResponse,
  normalizeHistory,
  sanitizeAssistantText,
};
