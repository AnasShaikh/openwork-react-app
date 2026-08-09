'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { validateRequest } = require('../routes/chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  sanitizeWalletState,
} = require('../services/oppy-context');
const { validateToolUse } = require('../services/chat-tools');
const {
  DEFAULT_MODEL_ID,
  converse,
  extractResponse,
  normalizeHistory,
} = require('../services/bedrock-chat');

test('chat requests are bounded and default to documentation mode', () => {
  assert.deepEqual(validateRequest({ message: '  hello  ' }), {
    message: 'hello',
    mode: 'docs',
    history: [],
    wallet: {
      connected: false,
      address: null,
      chainId: null,
      chainName: 'unsupported network',
      supported: false,
    },
  });
  assert.match(validateRequest({ message: 'x'.repeat(2001) }).error, /2000/);
  assert.equal(validateRequest({ message: ' ' }).error, 'Message is required');
});

test('wallet context supports only the three production job chains', () => {
  const xdc = sanitizeWalletState({
    connected: true,
    address: '0x93514040f43aB16D52faAe7A3f380c4089D844F9',
    chainId: 50,
  });
  assert.equal(xdc.connected, true);
  assert.equal(xdc.supported, true);
  assert.equal(xdc.chainName, 'XDC Network');

  const ethereum = sanitizeWalletState({ connected: true, address: xdc.address, chainId: 1 });
  assert.equal(ethereum.supported, false);
  assert.equal(ethereum.chainName, 'unsupported network');
});

test('server prompts are registry grounded and preserve transaction safety rules', () => {
  const docsPrompt = buildDocsSystemPrompt('How does XDC payment work?');
  const txPrompt = buildTransactionSystemPrompt('Post a job', { chainId: 42161 });
  assert.match(docsPrompt, /Registry audited: 2026-08-07/);
  assert.match(docsPrompt, /XDC Network/);
  assert.match(txPrompt, /Never request USDC approval for postJob/);
  assert.match(txPrompt, /Posting moves no USDC/);
  assert.match(txPrompt, /review card; it never proves/);
});

test('native Bedrock tool calls are strictly validated', () => {
  const valid = validateToolUse({
    name: 'postJob',
    input: { title: 'Audit', budget: 10, description: 'Review the contracts' },
  });
  assert.equal(valid.name, 'postJob');
  assert.equal(valid.kind, 'transaction');

  assert.equal(validateToolUse({
    name: 'postJob',
    input: {
      title: 'Audit',
      budget: 10,
      description: 'Review',
      milestones: [{ description: 'Phase one', amount: 9 }],
    },
  }), null);

  assert.equal(validateToolUse({
    name: 'startDirectContract',
    input: { title: 'Audit', budget: 10, description: 'Review', jobTaker: 'not-an-address' },
  }), null);
  assert.equal(validateToolUse({
    name: 'releasePayment',
    input: { jobId: '../unsafe' },
  }), null);
});

test('Bedrock response extraction exposes only validated native tools', () => {
  const message = {
    content: [
      { text: 'Review this action.' },
      { toolUse: { name: 'releasePayment', input: { jobId: '42161-24' } } },
    ],
  };
  assert.equal(extractResponse(message, false).tool, null);
  const extracted = extractResponse(message, true).tool;
  assert.equal(extracted.name, 'releasePayment');
  assert.equal(extracted.kind, 'review');
  assert.equal(extracted.requiresWalletSignature, false);
  assert.deepEqual(extracted.params, { jobId: '42161-24' });
});

test('Bedrock uses the callable Sonnet 4.6 inference profile and the default AWS credential chain', async () => {
  let commandInput;
  const history = Array.from({ length: 20 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'oppy',
    text: `message ${index}`,
  }));
  const client = {
    async send(command) {
      commandInput = command.input;
      return {
        output: { message: { content: [{ text: 'Ready.' }] } },
        usage: { inputTokens: 10, outputTokens: 2, totalTokens: 12 },
      };
    },
  };

  const result = await converse({
    message: 'Manage a job',
    history,
    systemPrompt: 'Grounded prompt',
    allowTools: true,
    client,
  });

  assert.equal(DEFAULT_MODEL_ID, 'us.anthropic.claude-sonnet-4-6');
  assert.equal(commandInput.modelId, DEFAULT_MODEL_ID);
  assert.equal(commandInput.messages.length, 13);
  assert.equal(commandInput.system[0].text, 'Grounded prompt');
  assert.equal(commandInput.inferenceConfig.temperature, 0.2);
  assert.equal(commandInput.inferenceConfig.topP, undefined);
  assert.ok(commandInput.toolConfig.tools.length >= 10);
  assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 2, totalTokens: 12 });
  assert.equal(normalizeHistory(history).length, 12);

  const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'bedrock-chat.js'), 'utf8');
  assert.doesNotMatch(source, /accessKeyId|secretAccessKey|AWS_ACCESS_KEY_ID/);
});
