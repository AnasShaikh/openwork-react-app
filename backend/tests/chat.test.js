'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  NATURAL_TRANSACTION_TOOL_NAMES,
  modelToolName,
  resolveSafeReplayTool,
  validateRequest,
} = require('../routes/chat');
const {
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  detectExplicitToolIntent,
  extractEvmAddressFacts,
  isSafeActionRetryRequest,
  resolveTransactionToolIntent,
  sanitizeWalletState,
} = require('../services/oppy-context');
const { sanitizeConversationMemory } = require('../services/oppy-job-context');
const {
  BEDROCK_READ_TOOLS,
  validateReadToolUse,
  validateToolUse,
} = require('../services/chat-tools');
const {
  ACTION_REVIEW_RESPONSE,
  DEFAULT_MODEL_ID,
  MALFORMED_ACTION_RESPONSE,
  converse,
  extractResponse,
  normalizeHistory,
  sanitizeAssistantText,
} = require('../services/bedrock-chat');

test('natural-language discovery exposes every review-only write action and no navigation action', () => {
  assert.ok(NATURAL_TRANSACTION_TOOL_NAMES.includes('startDirectContract'));
  assert.ok(NATURAL_TRANSACTION_TOOL_NAMES.includes('releasePayment'));
  assert.equal(NATURAL_TRANSACTION_TOOL_NAMES.includes('openJob'), false);
  assert.equal(NATURAL_TRANSACTION_TOOL_NAMES.includes('browseJobs'), false);
});

test('read tools accept bounded live-check inputs and never request a wallet signature', () => {
  const hash = `0x${'a'.repeat(64)}`;
  const valid = validateReadToolUse({
    toolUseId: 'read-1',
    name: 'inspectTransaction',
    input: { transactionHash: hash, chainId: 50, action: 'releasePayment' },
  });
  assert.deepEqual(valid, {
    id: 'read-1',
    name: 'inspectTransaction',
    kind: 'read',
    params: { transactionHash: hash, chainId: 50, action: 'releasePayment' },
    requiresWalletSignature: false,
  });
  assert.equal(validateReadToolUse({
    toolUseId: 'read-2',
    name: 'inspectTransaction',
    input: { chainId: 1 },
  }), null);
  assert.equal(validateReadToolUse({
    toolUseId: 'read-3',
    name: 'inspectTransaction',
    input: { action: 'browseJobs' },
  }), null);
});

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
      latestTransactionDiagnostic: null,
      lastPreparedAction: null,
    },
  });
  assert.match(validateRequest({ message: 'x'.repeat(2001) }).error, /2000/);
  assert.equal(validateRequest({ message: ' ' }).error, 'Message is required');
});

test('read-only navigation is resolved by the deterministic explorer, not Bedrock tools', () => {
  assert.equal(modelToolName({ name: 'browseJobs', source: 'current' }), null);
  assert.equal(modelToolName({ name: 'openMyJobs', source: 'current' }), null);
  assert.equal(modelToolName({ name: 'openJob', source: 'current' }), null);
  assert.equal(modelToolName({ name: 'viewApplications', source: 'current' }), null);
  assert.equal(modelToolName({ name: 'releasePayment', source: 'current' }), 'releasePayment');
});

test('a sanitized safe retry replays the exact previous card without model discretion', () => {
  const action = {
    name: 'startDirectContract',
    params: {
      title: 'React Developer',
      budget: 0.1,
      description: 'Build the interface',
      jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
    },
  };
  assert.equal(
    resolveSafeReplayTool({ name: 'startDirectContract', source: 'safe-retry' }, { lastPreparedAction: action }, 'startDirectContract'),
    action,
  );
  assert.equal(
    resolveSafeReplayTool({ name: 'startDirectContract', source: 'current' }, { lastPreparedAction: action }, 'startDirectContract'),
    null,
  );
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

test('a direct answer resumes only the action behind the latest assistant question', () => {
  const directHistory = [
    {
      role: 'user',
      text: 'Create a direct contract with 0x91Bc6bf270fa5434D6fA4934ab66059D636fb351',
    },
    {
      role: 'oppy',
      text: 'Is 1 milestone of $0.001 USDC correct, or would you like multiple milestones?',
    },
  ];
  assert.deepEqual(
    resolveTransactionToolIntent('yes, just 1 milestone', directHistory),
    { name: 'startDirectContract', source: 'continuation' },
  );
  assert.equal(
    resolveTransactionToolIntent('what are the fees?', directHistory),
    null,
  );
  assert.equal(
    resolveTransactionToolIntent('yes', [
      directHistory[0],
      { role: 'oppy', text: 'The direct contract screen is open.' },
    ]),
    null,
  );

  const prompt = buildTransactionSystemPrompt('yes, just 1 milestone', { chainId: 50 }, {
    toolIntent: { name: 'startDirectContract', source: 'continuation' },
  });
  assert.match(prompt, /direct answer to your latest question/);
  assert.match(prompt, /Only the native `startDirectContract` tool can open the review card/);
});

test('safe natural-language retries replay the previous action instead of promising a card', () => {
  const memory = {
    latestTransactionDiagnostic: {
      action: 'startDirectContract',
      status: 'failed',
      safeToRetry: true,
    },
  };
  assert.equal(isSafeActionRetryRequest('have updated RPC lets try again'), true);
  assert.equal(isSafeActionRetryRequest('can you retry it now?'), true);
  assert.equal(isSafeActionRetryRequest('Prepared?'), true);
  assert.equal(isSafeActionRetryRequest('is it safe to retry?'), false);
  assert.equal(isSafeActionRetryRequest("don't retry it"), false);
  assert.deepEqual(
    resolveTransactionToolIntent('have updated RPC lets try again', [], memory),
    { name: 'startDirectContract', source: 'safe-retry' },
  );
  assert.deepEqual(
    resolveTransactionToolIntent('Prepared?', [], memory),
    { name: 'startDirectContract', source: 'safe-retry' },
  );
  assert.equal(resolveTransactionToolIntent('try again', [], {
    latestTransactionDiagnostic: { ...memory.latestTransactionDiagnostic, safeToRetry: false },
  }), null);
  assert.deepEqual(
    resolveTransactionToolIntent('release payment for 30365-8', [], memory),
    { name: 'releasePayment', source: 'current' },
  );

  const prompt = buildTransactionSystemPrompt('try again', { chainId: 50 }, {
    toolIntent: { name: 'startDirectContract', source: 'safe-retry' },
  });
  assert.match(prompt, /SERVER-VERIFIED SAFE ACTION RETRY/);
  assert.match(prompt, /Do not promise to prepare it later/);
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
      action: 'releasePayment',
      jobId: '30365-6',
      txHash: `0x${'b'.repeat(64)}`,
      chainId: 50,
      confirmed: true,
      targetDomain: 18,
      baselineTotalPaidRaw: '250000',
    }],
    latestTransactionDiagnostic: {
      attemptId: 'attempt-1',
      action: 'startDirectContract',
      walletName: 'MetaMask',
      chainId: 50,
      chainName: 'XDC Network',
      phase: 'wallet',
      step: 'approval',
      status: 'wallet',
      summary: 'Waiting for approval.',
      nextStep: 'Open the wallet.',
      safeToRetry: false,
      checks: {
        walletReachable: true,
        nativeBalanceWei: '289296832824877939',
        nativeRequiredWei: '4530000000000000000',
        nativeShortfallWei: '4240703167175122061',
        nativeSymbol: 'XDC',
        nativeFundingSufficient: false,
        nativeFundingGasIncluded: true,
        nativeFundingCheckedAt: '2026-08-23T08:00:00.000Z',
      },
    },
    lastPreparedAction: {
      name: 'startDirectContract',
      params: {
        title: 'React Developer',
        budget: 0.1,
        description: 'Build the interface',
        jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
      },
    },
  });
  assert.equal(memory.activeJob.jobId, '30365-6');
  assert.equal(memory.activeJob.title, 'XDC test');
  assert.equal(memory.recentTransactions[0].confirmed, true);
  assert.equal(memory.recentTransactions[0].targetDomain, 18);
  assert.equal(memory.recentTransactions[0].baselineTotalPaidRaw, '250000');
  assert.equal(memory.latestTransactionDiagnostic.step, 'approval');
  assert.equal(memory.latestTransactionDiagnostic.checks.walletReachable, true);
  assert.equal(memory.latestTransactionDiagnostic.checks.nativeBalanceWei, '289296832824877939');
  assert.equal(memory.latestTransactionDiagnostic.checks.nativeRequiredWei, '4530000000000000000');
  assert.equal(memory.latestTransactionDiagnostic.checks.nativeFundingSufficient, false);
  assert.equal(memory.lastPreparedAction.name, 'startDirectContract');
  assert.equal(memory.lastPreparedAction.params.title, 'React Developer');
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
  assert.equal(validDirectContract.kind, 'transaction');
  assert.equal(validDirectContract.requiresWalletSignature, true);
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
  assert.equal(extracted.kind, 'transaction');
  assert.equal(extracted.requiresWalletSignature, true);
  assert.deepEqual(extracted.params, { jobId: '42161-24' });
  assert.equal(extractResponse(message, true).text, ACTION_REVIEW_RESPONSE);
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

test('assistant output never exposes internal tool traces', () => {
  const traced = `Opening that now.\n\n<tool_call>{"name":"navigate_to_direct_contract"}</tool_call>\n<tool_response>{"status":"ok"}</tool_response>\n\nYour details are ready.`;
  assert.equal(sanitizeAssistantText(traced), 'Opening that now.\n\nYour details are ready.');
  assert.equal(extractResponse({ content: [{ text: traced }] }, false).text, MALFORMED_ACTION_RESPONSE);
  assert.equal(normalizeHistory([{ role: 'user', text: traced }])[0].content[0].text, 'Opening that now.\n\nYour details are ready.');

  const armandTrace = `Let me pull up the direct contract screen for you right away!\n\n<function_calls> <invoke name="open_direct_contract_screen"> <parameter name="jobTitle">Direct Payment Task</parameter> <parameter name="jobDescription">A simple direct contract for a small USDC payment.</parameter> <parameter name="jobTaker">0x91Bc6bf270fa5434D6fA4934ab66059D636fb351</parameter> <parameter name="chain">XDC Network</parameter> <parameter name="milestones">[{"amount": 0.001}]</parameter> </invoke> </function_calls>\n\nThe direct contract screen is now open.`;
  assert.equal(
    sanitizeAssistantText(armandTrace),
    'Let me pull up the direct contract screen for you right away!\n\nThe direct contract screen is now open.',
  );
  assert.equal(
    extractResponse({ content: [{ text: armandTrace }] }, false).text,
    MALFORMED_ACTION_RESPONSE,
  );
  assert.equal(sanitizeAssistantText('<function_calls><invoke name="x">unfinished'), '');
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

test('Bedrock can require the verified retry tool instead of allowing prose-only output', async () => {
  let commandInput;
  const client = {
    async send(command) {
      commandInput = command.input;
      return {
        output: {
          message: {
            content: [{ toolUse: {
              name: 'startDirectContract',
              input: {
                title: 'React Developer',
                budget: 0.1,
                description: 'Build the interface',
                jobTaker: '0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724',
              },
            } }],
          },
        },
      };
    },
  };

  const result = await converse({
    message: 'try again',
    history: [],
    systemPrompt: 'Retry the verified safe action.',
    allowTools: true,
    allowedToolNames: ['startDirectContract'],
    forceToolName: 'startDirectContract',
    client,
  });

  assert.deepEqual(commandInput.toolConfig.toolChoice, { tool: { name: 'startDirectContract' } });
  assert.equal(result.tool.name, 'startDirectContract');
});

test('Bedrock runs one parallel read round and returns the grounded natural-language answer', async () => {
  const commands = [];
  const executed = [];
  const client = {
    async send(command) {
      commands.push(command.input);
      if (commands.length === 1) {
        return {
          output: {
            message: {
              role: 'assistant',
              content: [
                { toolUse: { toolUseId: 'read-tx', name: 'inspectTransaction', input: {} } },
                { toolUse: { toolUseId: 'read-wallet', name: 'inspectWalletFunding', input: { chainId: 50 } } },
              ],
            },
          },
          usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 },
        };
      }
      return {
        output: { message: { role: 'assistant', content: [{ text: 'It is still syncing. Do not retry yet.' }] } },
        usage: { inputTokens: 80, outputTokens: 10, totalTokens: 90 },
      };
    },
  };

  const result = await converse({
    message: 'Why is my money thing still hanging?',
    history: [],
    systemPrompt: 'Use live evidence.',
    allowTools: false,
    readTools: BEDROCK_READ_TOOLS,
    executeReadTool: async (tool) => {
      executed.push(tool.name);
      return tool.name === 'inspectTransaction'
        ? { state: 'in-progress', safeToRetry: false }
        : { native: { balance: '5', sufficient: true } };
    },
    client,
  });

  assert.equal(commands.length, 2);
  assert.deepEqual(executed.sort(), ['inspectTransaction', 'inspectWalletFunding']);
  assert.equal(commands[1].messages.at(-2).role, 'assistant');
  assert.equal(commands[1].messages.at(-1).role, 'user');
  assert.equal(commands[1].messages.at(-1).content.length, 2);
  assert.equal(commands[1].toolConfig, undefined);
  assert.equal(result.text, 'It is still syncing. Do not retry yet.');
  assert.deepEqual(result.usage, { inputTokens: 180, outputTokens: 30, totalTokens: 210 });
  assert.deepEqual(result.agent, {
    modelCalls: 2,
    readToolCalls: 2,
    readToolNames: ['inspectTransaction', 'inspectWalletFunding'],
  });
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
