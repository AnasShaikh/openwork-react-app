'use strict';

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const { BEDROCK_TRANSACTION_TOOLS, validateToolUse } = require('./chat-tools');

const DEFAULT_MODEL_ID = 'us.anthropic.claude-sonnet-4-6';
const DEFAULT_REGION = 'us-east-1';
const MAX_HISTORY_ITEMS = 24;

let sharedClient;

const INTERNAL_TRACE_PATTERNS = [
  /<tool_call\b[^>]*>[\s\S]*?<\/tool_call>/gi,
  /<tool_response\b[^>]*>[\s\S]*?<\/tool_response>/gi,
  /<function_call\b[^>]*>[\s\S]*?<\/function_call>/gi,
  /<function_response\b[^>]*>[\s\S]*?<\/function_response>/gi,
  /<tool\b[^>]*>[\s\S]*?<\/tool>/gi,
];

function sanitizeAssistantText(value) {
  let text = typeof value === 'string' ? value : '';
  for (const pattern of INTERNAL_TRACE_PATTERNS) text = text.replace(pattern, '');
  text = text
    .replace(/<\/?(?:tool|tool_call|tool_response|function_call|function_response)\b[^>]*>/gi, '')
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
  const text = sanitizeAssistantText(content
    .filter((block) => typeof block?.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n\n'));
  const toolBlock = allowTools ? content.find((block) => block?.toolUse) : null;
  const validatedTool = toolBlock ? validateToolUse(toolBlock.toolUse) : null;
  const allowedNames = Array.isArray(allowedToolNames) && allowedToolNames.length
    ? new Set(allowedToolNames)
    : null;
  const acceptedTool = validatedTool && (!allowedNames || allowedNames.has(validatedTool.name))
    ? validatedTool
    : null;
  return {
    text: text || (acceptedTool ? 'Review the proposed action below before continuing.' : 'Sorry, I could not generate a response.'),
    tool: acceptedTool,
  };
}

async function converse({ message, history, systemPrompt, allowTools = false, allowedToolNames, client = getClient() }) {
  const modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;
  const messages = normalizeHistory(history);
  const previous = messages[messages.length - 1];
  if (previous?.role === 'user') {
    previous.content[0].text = `${previous.content[0].text}\n\n${message}`.slice(-4000);
  } else {
    messages.push({ role: 'user', content: [{ text: message }] });
  }

  const commandInput = {
    modelId,
    messages,
    system: [{ text: systemPrompt }],
    inferenceConfig: {
      temperature: 0.2,
      maxTokens: Number(process.env.BEDROCK_MAX_TOKENS || 1400),
    },
  };
  if (allowTools) {
    const allowedNames = Array.isArray(allowedToolNames) && allowedToolNames.length
      ? new Set(allowedToolNames)
      : null;
    const tools = allowedNames
      ? BEDROCK_TRANSACTION_TOOLS.filter((entry) => allowedNames.has(entry.toolSpec.name))
      : BEDROCK_TRANSACTION_TOOLS;
    if (tools.length) commandInput.toolConfig = { tools };
  }

  const response = await client.send(new ConverseCommand(commandInput));
  const extracted = extractResponse(response.output?.message, allowTools, allowedToolNames);
  return {
    ...extracted,
    modelId,
    usage: response.usage ? {
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      totalTokens: response.usage.totalTokens,
    } : undefined,
  };
}

module.exports = {
  DEFAULT_MODEL_ID,
  MAX_HISTORY_ITEMS,
  converse,
  extractResponse,
  normalizeHistory,
  sanitizeAssistantText,
};
