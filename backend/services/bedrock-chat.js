'use strict';

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const { BEDROCK_TRANSACTION_TOOLS, validateToolUse } = require('./chat-tools');

const DEFAULT_MODEL_ID = 'us.anthropic.claude-sonnet-4-6';
const DEFAULT_REGION = 'us-east-1';

let sharedClient;

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
  const sanitized = history.slice(-12).flatMap((entry) => {
    const role = entry?.role === 'user'
      ? 'user'
      : (entry?.role === 'oppy' || entry?.role === 'bot' || entry?.role === 'assistant' ? 'assistant' : null);
    const text = typeof entry?.text === 'string' ? entry.text.trim().slice(0, 2000) : '';
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

function extractResponse(message, allowTools) {
  const content = Array.isArray(message?.content) ? message.content : [];
  const text = content
    .filter((block) => typeof block?.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n\n');
  const toolBlock = allowTools ? content.find((block) => block?.toolUse) : null;
  const validatedTool = toolBlock ? validateToolUse(toolBlock.toolUse) : null;
  return {
    text: text || (validatedTool ? 'Review the proposed action below before continuing.' : 'Sorry, I could not generate a response.'),
    tool: validatedTool,
  };
}

async function converse({ message, history, systemPrompt, allowTools = false, client = getClient() }) {
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
      topP: 0.9,
    },
  };
  if (allowTools) commandInput.toolConfig = { tools: BEDROCK_TRANSACTION_TOOLS };

  const response = await client.send(new ConverseCommand(commandInput));
  const extracted = extractResponse(response.output?.message, allowTools);
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
  converse,
  extractResponse,
  normalizeHistory,
};
