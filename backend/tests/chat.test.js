'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { validateRequest } = require('../routes/chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  detectExplicitToolIntent,
  extractEvmAddressFacts,
  sanitizeWalletState,
} = require('../services/oppy-context');
const { sanitizeConversationMemory } = require('../services/oppy-job-context');
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
    memory: {
      activeJob: null,
      recentTransactions: [],
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
  const txPrompt = buildTransactionSystemPrompt('Release payment for this job', { chainId: 50 }, {
    jobContext: {
      available: true,
      activeJob: {
        jobId: '30365-6',
        title: 'XDC test',
        postingChainName: 'XDC Network',
        canonicalStateAvailable: true,
        status: 1,
      },
      jobs: [],
      recentTransactions: [],
    },
  });
  assert.match(docsPrompt, /Registry audited: 2026-08-07/);
  assert.match(docsPrompt, /XDC Network/);
  assert.match(txPrompt, /Never request USDC approval for postJob/);
  assert.match(txPrompt, /Posting moves no USDC/);
  assert.match(txPrompt, /review card; it never proves/);
  assert.match(txPrompt, /Active job: 30365-6/);
  assert.match(txPrompt, /exact deployed source/);
  assert.match(txPrompt, /“this job”, “that job”, “it”/);
});

test('server validates exact EVM addresses before Oppy interprets them', () => {
  const address = '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724';
  const addresses = extractEvmAddressFacts(`Let's post a direct job with ${address}`, [
    { role: 'oppy', text: `${address} is invalid` },
    { role: 'user', text: `Use ${address}` },
  ]);
  assert.deepEqual(addresses, [address]);

  const prompt = buildTransactionSystemPrompt(
    `Let's post a direct job with ${address}`,
    { chainId: 50 },
    { validatedAddresses: addresses },
  );
  assert.match(prompt, new RegExp(address));
  assert.match(prompt, /exactly 42 characters total/);
  assert.match(prompt, /Do not recount it, reject it for length/);
  assert.match(prompt, /use the applicable listed address as the `jobTaker`/);

  assert.deepEqual(
    extractEvmAddressFacts(`Invalid: ${address}f`),
    [],
  );
});

test('the current explicit transaction intent overrides stale conversation actions', () => {
  assert.equal(detectExplicitToolIntent('release payment for 30365-8'), 'releasePayment');
  assert.equal(
    detectExplicitToolIntent('Lets post a direct job with 0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724'),
    'startDirectContract',
  );
  assert.equal(detectExplicitToolIntent('post a job and then release payment'), null);

  const prompt = buildTransactionSystemPrompt('release payment for 30365-8', { chainId: 50 });
  assert.match(prompt, /explicitly requests `releasePayment`/);
  assert.match(prompt, /overrides any different action discussed earlier/);
  assert.match(prompt, /Never continue, reopen or substitute a tool from an older conversation turn/);
});

test('conversation memory keeps only bounded job and receipt context', () => {
  const memory = sanitizeConversationMemory({
    activeJob: {
      jobId: '30365-6',
      title: '  XDC test  ',
      sourceChainId: 50,
      sourceTxHash: `0x${'a'.repeat(64)}`,
      sourceReceiptConfirmed: true,
    },
    recentTransactions: [{
      action: 'postJob',
      jobId: '30365-6',
      txHash: `0x${'b'.repeat(64)}`,
      chainId: 50,
      confirmed: true,
    }],
  });
  assert.equal(memory.activeJob.jobId, '30365-6');
  assert.equal(memory.activeJob.title, 'XDC test');
  assert.equal(memory.recentTransactions[0].confirmed, true);
  assert.equal(sanitizeConversationMemory({ activeJob: { jobId: '../bad' } }).activeJob, null);
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
  const validDirectContract = validateToolUse({
    name: 'startDirectContract',
    input: {
      title: 'Audit',
      budget: 0.25,
      description: 'Review the application',
      jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
    },
  });
  assert.equal(validDirectContract.name, 'startDirectContract');
  assert.equal(validDirectContract.params.jobTaker, '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724');
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
  assert.equal(extractResponse({
    content: [{ toolUse: {
      name: 'startDirectContract',
      input: {
        title: 'Stale action',
        budget: 1,
        description: 'Must not be accepted',
        jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
      },
    } }],
  }, true, ['releasePayment']).tool, null);
});

test('Bedrock receives only the tool matching an explicit current-turn action', async () => {
  let commandInput;
  const client = {
    async send(command) {
      commandInput = command.input;
      return {
        output: {
          message: {
            content: [{ toolUse: { name: 'releasePayment', input: { jobId: '30365-8' } } }],
          },
        },
      };
    },
  };

  const result = await converse({
    message: 'release payment for 30365-8',
    history: [
      { role: 'user', text: 'Lets post a direct job' },
      { role: 'oppy', text: 'I can open the direct contract form.' },
    ],
    systemPrompt: 'Current action is releasePayment.',
    allowTools: true,
    allowedToolNames: ['releasePayment'],
    client,
  });

  assert.deepEqual(commandInput.toolConfig.tools.map((entry) => entry.toolSpec.name), ['releasePayment']);
  assert.equal(result.tool.name, 'releasePayment');
  assert.deepEqual(result.tool.params, { jobId: '30365-8' });
});

test('Bedrock uses the callable Sonnet 4.6 inference profile and the default AWS credential chain', async () => {
  let commandInput;
  const history = Array.from({ length: 40 }, (_, index) => ({
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
  assert.equal(commandInput.messages.length, 25);
  assert.equal(commandInput.system[0].text, 'Grounded prompt');
  assert.equal(commandInput.inferenceConfig.temperature, 0.2);
  assert.equal(commandInput.inferenceConfig.topP, undefined);
  assert.ok(commandInput.toolConfig.tools.length >= 10);
  assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 2, totalTokens: 12 });
  assert.equal(normalizeHistory(history).length, 24);

  const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'bedrock-chat.js'), 'utf8');
  assert.doesNotMatch(source, /accessKeyId|secretAccessKey|AWS_ACCESS_KEY_ID/);
});
