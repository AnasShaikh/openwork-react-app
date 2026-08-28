'use strict';

const registry = require('../../docs/mainnet-contracts.json');
const { formatJobContext } = require('./oppy-job-context');
const { TOOL_RULES } = require('./chat-tools');

const SUPPORTED_JOB_CHAINS = new Map([
  [42161, 'Arbitrum One'],
  [10, 'Optimism'],
  [50, 'XDC Network'],
]);

const EVM_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g;
const DIRECT_CONTRACT_MARKER = /\b(?:direct\s+(?:job|contract)|job\s*taker)\b/i;
const ACTION_REQUEST_VERB = /\b(?:post|create|make|start|open|set\s+up|hire|engage|publish)\b/i;
const FRESH_ACTION_REQUEST = /\b(?:post|create|make|start|open|set\s+up|hire|engage|publish|release|pay\s+out|apply|submit|raise)\b[\s\S]{0,160}\b(?:job|contract|payment|milestone|work|dispute|profile|applicant)\b/i;
const READ_ONLY_QUESTION_LEAD = /^(?:what|why|how|when|where|who|which|is|are|was|were|did|does|do|can\s+you\s+check|could\s+you\s+check|would\s+you\s+check|check|tell\s+me|explain)\b/i;
const READ_ONLY_STATE_LANGUAGE = /\b(?:balance|enough|afford|fee|fees|gas|cost|status|state|confirm(?:ed|ation)?|sync(?:ed|ing)?|done|complete(?:d)?|work(?:ed|ing)?|succeed(?:ed)?|successful|fail(?:ed|ure)?|stuck|pending|happened|safe\s+to\s+retry|retry\s+safe|signed|broadcast)\b/i;
const MULTIPLE_CREATION_ACTIONS = /\b(?:post|create|publish)\b[\s\S]{0,100}\bjob\b[\s\S]{0,80}\b(?:and(?:\s+then)?|then|also)\b[\s\S]{0,100}\b(?:post|create|make|start|open|set\s+up|hire|engage|publish)\b[\s\S]{0,100}\bdirect\s+(?:job|contract)\b|\b(?:post|create|make|start|open|set\s+up|hire|engage|publish)\b[\s\S]{0,100}\bdirect\s+(?:job|contract)\b[\s\S]{0,80}\b(?:and(?:\s+then)?|then|also)\b[\s\S]{0,100}\b(?:post|create|publish)\b[\s\S]{0,100}\bjob\b/i;

const EXPLICIT_TOOL_INTENT_RULES = [
  {
    name: 'releasePayment',
    pattern: /\b(?:release|pay out)\b[\s\S]{0,40}\b(?:payment|milestone|job)\b|\b(?:payment|milestone)\b[\s\S]{0,40}\brelease\b/i,
  },
  {
    name: 'startDirectContract',
    // Direct-contract intent often contains a 42-character recipient between
    // the action verb and the words "direct contract". Do not use a short
    // distance window here: it caused an explicit direct hire to fall through
    // to stale conversation history and become a marketplace post.
    pattern: /\b(?:post|create|make|start|open|set\s+up|hire|engage|publish)\b[\s\S]{0,320}\b(?:direct\s+(?:job|contract)|job\s*taker)\b|\b(?:direct\s+(?:job|contract)|job\s*taker)\b[\s\S]{0,160}\b(?:post|create|make|start|open|set\s+up|hire|engage|publish)\b|\bhire\b[\s\S]{0,80}\bdirectly\b/i,
  },
  { name: 'postJob', pattern: /\b(?:post|create|publish)\s+(?:(?:a|the|another|new)\s+)?(?:(?:marketplace|public|regular)\s+)?job\b/i },
  { name: 'applyToJob', pattern: /\bapply\s+(?:to|for)\s+(?:(?:(?:a|the)\s+)?job(?:\s+\d+-\d+)?|\d+-\d+)\b/i },
  { name: 'submitWork', pattern: /\bsubmit\s+(?:the\s+)?work\b/i },
  { name: 'raiseDispute', pattern: /\b(?:raise|open|start)\s+(?:a\s+|the\s+)?dispute\b/i },
  { name: 'createProfile', pattern: /\b(?:create|set\s+up|make)\s+(?:a\s+|my\s+)?(?:freelancer\s+)?profile\b/i },
  { name: 'startJob', pattern: /\bstart\s+(?:the\s+)?job\b|\bhire\s+(?:the\s+)?applicant\b/i },
  { name: 'viewApplications', pattern: /\b(?:view|show|open)\s+(?:the\s+)?applications\b/i },
  { name: 'openMyJobs', pattern: /\b(?:check|show|open|view)\s+my\s+jobs\b/i },
  { name: 'browseJobs', pattern: /\b(?:browse|find|show)\s+(?:available\s+|open\s+)?jobs\b/i },
  { name: 'openJob', pattern: /\b(?:open|show|view)\s+(?:job\s+)?\d+-\d+\b/i },
];

const TOOL_CONTINUATION_HINTS = {
  releasePayment: /\b(?:release|payment|milestone|job\s+id)\b/i,
  startDirectContract: /\b(?:direct\s+(?:contract|job)|job\s+taker|recipient|freelancer|budget|milestone|title|description)\b/i,
  postJob: /\b(?:post(?:ing)?|job\s+title|budget|milestone|description|skills?)\b/i,
  applyToJob: /\b(?:apply|application|proposal|proposed\s+amount|job\s+id)\b/i,
  submitWork: /\b(?:submit|work\s+details|deliverable|job\s+id)\b/i,
  raiseDispute: /\b(?:dispute|reason|evidence|job\s+id)\b/i,
  createProfile: /\b(?:profile|name|skills?|hourly\s+rate)\b/i,
  startJob: /\b(?:start|hire|applicant|milestone|job\s+id)\b/i,
  viewApplications: /\b(?:applications?|job\s+id)\b/i,
  openMyJobs: /\b(?:my\s+jobs?|job\s+history)\b/i,
  browseJobs: /\b(?:browse|available\s+jobs?|open\s+jobs?|marketplace)\b/i,
  openJob: /\b(?:job\s+id|which\s+job)\b/i,
};

const QUESTION_OR_NEW_REQUEST = /^(?:what|why|how|when|where|who|which|can|could|would|should|is|are|do|does|did|tell\s+me|explain|show\s+me|find|search|browse|check)\b/i;
const ACTION_RETRY_REQUEST = /\b(?:try\s+(?:it\s+|that\s+)?again|retry(?:\s+(?:it|that|the\s+action))?|go\s+ahead|do\s+it(?:\s+now)?|proceed|continue\s+(?:the\s+action|with\s+it)|prepare\s+(?:it|the\s+(?:transaction\s+)?card)|post\s+the\s+(?:transaction\s+)?card)\b/i;
const NEGATED_ACTION_RETRY = /\b(?:do\s+not|don't|dont|never|stop|cancel)\b[\s\S]{0,30}\b(?:retry|try|proceed|continue|prepare|post)\b/i;
const RETRY_SAFETY_QUESTION = /\b(?:can|could|should|may)\s+(?:i|we)\s+(?:retry|try\s+again)\b|\bis\s+it\s+safe\s+to\s+(?:retry|try\s+again)\b/i;

const contractRows = registry.chains.flatMap((chain) => (
  chain.contracts.map((contract) => ({ ...contract, chain }))
));

const categoryIds = {
  job: ['nowjc', 'native-arb-lowjc', 'optimism-lowjc', 'xdc-lowjc', 'native-openwork-genesis'],
  dispute: ['native-athena', 'native-arb-athena-client', 'optimism-local-athena', 'xdc-local-athena'],
  profile: ['native-profile-manager', 'native-profile-genesis'],
  payment: ['nowjc', 'arbitrum-cctp-transceiver', 'optimism-cctp-transceiver', 'xdc-cctp-transceiver'],
  bridge: ['native-lz-openwork-bridge', 'optimism-local-bridge', 'xdc-local-bridge', 'eth-lz-openwork-bridge'],
  governance: ['eth-openwork-dao', 'eth-dao-messaging', 'native-dao-stake-sync', 'native-openwork-dao', 'openwork-token'],
};

function sourceStatus(contract) {
  if (contract.kind === 'proxy') {
    return contract.proxySource === 'source-pending' || contract.implementationSource === 'source-pending'
      ? 'source pending'
      : 'source verified';
  }
  return contract.sourceVerification === 'source-pending' ? 'source pending' : 'source verified';
}

function contractLine(contract) {
  return `- ${contract.chain.name}: ${contract.name} (${contract.version}) at ${contract.address}`
    + `${contract.implementation ? `; implementation ${contract.implementation}` : ''}`
    + `; exact deployed source ${contract.source}; ${sourceStatus(contract)}; ${contract.purpose}`;
}

function deployedCodeContext(message) {
  const query = String(message || '').toLowerCase();
  const asksForCode = /code|source|solidity|function|method|implementation|abi|contract|how.*work/.test(query);
  const detail = asksForCode
    ? `
- NativeArbOpenWorkJobContract V5 \`postJob\` creates \`42161-N\`, stores local milestone state and calls NOWJC directly. It uses no LayerZero and moves no USDC while posting.
- XDC LocalOpenWorkJobContract Lite V3 \`postJob\` creates \`30365-N\`, stores security-critical local state, and sends the full job payload through the active XDC V2 LayerZero bridge to Arbitrum.
- Optimism LocalOpenWorkJobContract Lite creates \`30111-N\` and follows the same local-entry/canonical-Arbitrum architecture.
- NativeOpenworkGenesis is the canonical job ledger. Its \`getJobsByPoster\`, \`getJob\`, status and application reads are authoritative after cross-chain delivery.
- Dynamic string job IDs are indexed in events, so a receipt topic contains \`keccak256(jobId)\`, not decodable plaintext. The browser must preserve or verify the generated ID instead of trying to decode the topic as text.
- Starting a job locks the selected first milestone; release and lock-next actions use the posting-chain adapter, while NOWJC decides same-chain versus CCTP payout routing from canonical applicant payment preferences.`
    : '';

  return `## DEPLOYED CODE MODEL
- Canonical production registry: ${registry.canonicalSource}; registry audit date: ${registry.lastAudited}. Exact deployed source paths are included with relevant contract rows below.
- Job IDs identify their source: \`42161-*\` Arbitrum direct, \`30111-*\` Optimism, \`30365-*\` XDC.
- Arbitrum Genesis/NOWJC hold canonical job and payment state. XDC and Optimism adapters retain local escrow/security state and deliver application messages to Arbitrum through LayerZero.
- Circle CCTP transports native USDC separately from LayerZero application messages.${detail}`;
}

function selectContracts(message) {
  const query = message.toLowerCase();
  const selected = new Set();

  for (const contract of contractRows) {
    const searchable = `${contract.id} ${contract.name} ${contract.purpose} ${contract.chain.name}`.toLowerCase();
    if (query.split(/\s+/).some((word) => word.length >= 5 && searchable.includes(word))) {
      selected.add(contract.id);
    }
  }

  if (/job|work|milestone|escrow|apply|hire/.test(query)) categoryIds.job.forEach((id) => selected.add(id));
  if (/dispute|athena|oracle/.test(query)) categoryIds.dispute.forEach((id) => selected.add(id));
  if (/profile|portfolio|rating/.test(query)) categoryIds.profile.forEach((id) => selected.add(id));
  if (/payment|release|usdc|cctp|reward|relay/.test(query)) categoryIds.payment.forEach((id) => selected.add(id));
  if (/bridge|layerzero|peer|dvn|route/.test(query)) categoryIds.bridge.forEach((id) => selected.add(id));
  if (/govern|vote|stake|dao|owork/.test(query)) categoryIds.governance.forEach((id) => selected.add(id));

  const wantsCompleteRegistry = /all contracts|every contract|complete registry|list contracts|all addresses/.test(query);
  return (wantsCompleteRegistry ? contractRows : contractRows.filter((contract) => selected.has(contract.id))).slice(0, 31);
}

function registryContext(message) {
  const selected = selectContracts(message);
  const chainSummary = registry.chains.map((chain) => (
    `- ${chain.name}: chain ID ${chain.chainId}, LayerZero EID ${chain.lzEid}, CCTP domain ${chain.cctpDomain}`
  )).join('\n');
  const pathways = registry.pathways.map((pathway) => (
    `- ${pathway.name}: ${pathway.status}. ${pathway.detail}`
  )).join('\n');
  const limitations = registry.limitations.map((limitation) => `- ${limitation}`).join('\n');
  const selectedContracts = selected.length
    ? `\n\n## RELEVANT LIVE CONTRACTS\n${selected.map(contractLine).join('\n')}`
    : '';

  return `## AUDITED PRODUCTION FACTS
- Registry audited: ${registry.lastAudited}
- ${registry.summary.activeContractRoles} active contract roles across ${registry.summary.activeNetworks} networks.
- ${registry.summary.activeArtifacts} active proxy/implementation artifacts: ${registry.summary.explorerSourceVerifiedArtifacts} explorer-source verified and ${registry.summary.explorerSourcePendingArtifacts} source pending.
- Arbitrum is the canonical job, escrow, profile, dispute and reward hub, and also supports direct same-chain job writes.
- Optimism and XDC are local job-entry chains. LayerZero carries application messages; Circle CCTP carries native USDC independently.
- Ethereum is the governance/staking/token chain, not a job-transaction chain.
- Posting a job records nominal milestone amounts but does not approve, lock or transfer USDC.
- NOWJC live commission and minimum are both zero. Do not substitute source initializer defaults.

## NETWORK IDENTIFIERS
${chainSummary}

## PATHWAY EVIDENCE
${pathways}

## KNOWN LIMITATIONS
${limitations}${selectedContracts}`;
}

function sanitizeWalletState(wallet = {}) {
  const rawChainId = Number(wallet.chainId);
  const chainName = SUPPORTED_JOB_CHAINS.get(rawChainId) || 'unsupported network';
  const address = typeof wallet.address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(wallet.address)
    ? wallet.address
    : null;

  return {
    connected: wallet.connected === true && Boolean(address),
    address,
    chainId: Number.isInteger(rawChainId) ? rawChainId : null,
    chainName,
    supported: SUPPORTED_JOB_CHAINS.has(rawChainId),
  };
}

function extractEvmAddressFacts(message, history = []) {
  const userTexts = Array.isArray(history)
    ? history
      .filter((entry) => entry?.role === 'user')
      .map((entry) => (typeof entry?.text === 'string' ? entry.text : ''))
    : [];
  const candidates = [String(message || ''), ...userTexts]
    .flatMap((text) => text.match(EVM_ADDRESS_PATTERN) || []);
  const seen = new Set();

  return candidates.filter((address) => {
    const key = address.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isReadOnlyActionQuestion(message) {
  const text = String(message || '').trim();
  if (!text) return false;
  if (/\b(?:do|will|would|can|could|should)\s+(?:i|we)\s+(?:have\s+)?enough\b/i.test(text)) return true;
  return READ_ONLY_QUESTION_LEAD.test(text) && READ_ONLY_STATE_LANGUAGE.test(text);
}

function explicitToolIntentMatches(message) {
  const text = String(message || '').trim();
  if (!text || isReadOnlyActionQuestion(text)) return [];
  const matches = EXPLICIT_TOOL_INTENT_RULES
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.name);

  // A direct contract is a specialized creation action. Natural phrasing such
  // as "post a job as a direct contract" legitimately matches both rules, so
  // the specialized action must win rather than turning the request ambiguous.
  if (
    matches.includes('startDirectContract')
    && matches.includes('postJob')
    && !MULTIPLE_CREATION_ACTIONS.test(text)
  ) {
    return matches.filter((name) => name !== 'postJob');
  }
  return matches;
}

function isDirectContractActionRequest(message) {
  const text = String(message || '').trim();
  return !isReadOnlyActionQuestion(text)
    && DIRECT_CONTRACT_MARKER.test(text)
    && ACTION_REQUEST_VERB.test(text);
}

function detectExplicitToolIntent(message) {
  const matches = explicitToolIntentMatches(message);
  return matches.length === 1 ? matches[0] : null;
}

function isActionContinuation(message, assistantMessage, toolName) {
  const reply = String(message || '').trim();
  const prompt = String(assistantMessage || '').trim();
  if (!reply || reply.length > 500 || reply.includes('?') || QUESTION_OR_NEW_REQUEST.test(reply)) return false;
  // A fresh action request is never an answer to an older prompt, even when it
  // begins conversationally ("okay, let's post another..."). Let the current
  // turn resolve on its own instead of inheriting a stale transaction type.
  if (detectExplicitToolIntent(reply) || FRESH_ACTION_REQUEST.test(reply)) return false;
  if (!prompt || !prompt.includes('?')) return false;
  return Boolean(TOOL_CONTINUATION_HINTS[toolName]?.test(prompt));
}

function isSafeActionRetryRequest(message) {
  const reply = String(message || '').trim();
  if (!reply || reply.length > 500 || NEGATED_ACTION_RETRY.test(reply) || RETRY_SAFETY_QUESTION.test(reply)) return false;
  if (/^(?:prepared|ready)\s*\?*$/i.test(reply)) return true;
  if (/\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:retry|try\s+(?:it\s+|that\s+)?again|do\s+it|proceed|prepare\s+it)\b/i.test(reply)) return true;
  if (QUESTION_OR_NEW_REQUEST.test(reply)) return false;
  return ACTION_RETRY_REQUEST.test(reply);
}

function resolveTransactionToolIntent(message, history = [], memory = {}) {
  const currentMatches = explicitToolIntentMatches(message);
  if (currentMatches.length === 1) return { name: currentMatches[0], source: 'current' };
  if (currentMatches.length > 1 || !Array.isArray(history)) return null;

  const diagnostic = memory?.latestTransactionDiagnostic;
  if (diagnostic?.safeToRetry === true
    && TOOL_RULES[diagnostic.action]?.kind === 'transaction'
    && isSafeActionRetryRequest(message)) {
    return { name: diagnostic.action, source: 'safe-retry' };
  }

  const recent = history.slice(-12);
  const lastAssistant = recent.at(-1);
  const previousUser = recent.at(-2);
  const lastAssistantText = lastAssistant
    && ['oppy', 'bot', 'assistant'].includes(lastAssistant.role)
    && typeof lastAssistant.text === 'string'
    ? lastAssistant.text
    : '';
  if (!lastAssistantText || previousUser?.role !== 'user' || typeof previousUser.text !== 'string') return null;

  // Continuation is deliberately adjacent-only. Searching arbitrarily far
  // back can bind a new action to an unrelated balance/status question.
  const toolName = detectExplicitToolIntent(previousUser.text);
  return toolName && isActionContinuation(message, lastAssistantText, toolName)
    ? { name: toolName, source: 'continuation' }
    : null;
}

function explicitToolIntentContext(toolIntent) {
  if (!toolIntent?.name) return '';
  const toolName = toolIntent.name;
  if (toolIntent.source === 'continuation') {
    return `\n\n## SERVER-RESOLVED ACTION CONTINUATION
The user's current reply is a direct answer to your latest question while preparing \`${toolName}\`. Continue only \`${toolName}\`, using the relevant facts already supplied in this conversation, or ask one concise question if a required input is still missing. Never emit XML, a textual function call or a claim that a screen opened. Only the native \`${toolName}\` tool can open the review card.`;
  }
  if (toolIntent.source === 'safe-retry') {
    return `\n\n## SERVER-VERIFIED SAFE ACTION RETRY
The client proved that retrying the previous \`${toolName}\` attempt will not duplicate a live transaction and marked retry safe. Recreate exactly that validated review action now from the supplied previous action or recent conversation. Do not promise to prepare it later and do not answer with prose alone. Only the native \`${toolName}\` tool can render the review card.`;
  }
  return `\n\n## SERVER-DETECTED CURRENT ACTION
The user's current message explicitly requests \`${toolName}\`. This current-turn intent overrides any different action discussed earlier. You may call only \`${toolName}\` for this turn, or ask one concise question if a required input is genuinely missing. Never continue, reopen or substitute a tool from an older conversation turn.`;
}

function addressFactsContext(addresses = []) {
  if (!addresses.length) return '';

  return `\n\n## SERVER-VALIDATED EVM ADDRESS FACTS
The application validated these addresses with an exact structural check before invoking you:
${addresses.map((address) => `- \`${address}\` is a valid EVM address: exactly 42 characters total, consisting of \`0x\` followed by exactly 40 hexadecimal characters.`).join('\n')}

These facts are authoritative. Preserve each listed address verbatim. Do not recount it, reject it for length, claim it has 41 hexadecimal characters, or suggest removing a character. If the user is preparing a direct contract, use the applicable listed address as the \`jobTaker\` and ask only for other genuinely missing inputs.`;
}

function buildDocsSystemPrompt(message) {
  return `You are Agent Oppy, OpenWork's public production documentation assistant.

Answer accurately and concisely from the audited production facts below. Clearly distinguish deployed, runtime verified, explorer-source verified, configured and end-to-end tested. If the evidence does not establish something, say so. Never invent an address, transaction result, wallet balance or live status. Never ask for a private key or seed phrase. Do not propose blockchain tool calls in documentation mode.

${deployedCodeContext(message)}

${registryContext(message)}`;
}

function buildTransactionSystemPrompt(message, walletInput, runtimeContext = {}) {
  const wallet = sanitizeWalletState(walletInput);
  const toolIntent = runtimeContext.toolIntent
    || (runtimeContext.explicitToolName
      ? { name: runtimeContext.explicitToolName, source: 'current' }
      : resolveTransactionToolIntent(message));
  const validatedAddresses = Array.isArray(runtimeContext.validatedAddresses)
    ? runtimeContext.validatedAddresses
    : extractEvmAddressFacts(message);
  const walletSummary = wallet.connected
    ? `Connected wallet ${wallet.address} on ${wallet.chainName} (chain ID ${wallet.chainId}); supported job chain: ${wallet.supported ? 'yes' : 'no'}.`
    : `No connected wallet was supplied. Chain ID: ${wallet.chainId ?? 'unknown'} (${wallet.chainName}).`;

  return `You are Agent Oppy, OpenWork's job-management assistant.

Help users understand and prepare OpenWork actions. Use the supplied tools only when the user has clearly requested the action and all required inputs are present. If anything is missing or ambiguous, ask one concise follow-up question instead of calling a tool. A tool call only creates a review card; it never proves that a transaction was signed, mined or delivered.

Understand intent from meaning, not from fixed phrases. Users may describe the same problem in non-technical, incomplete or conversational language. Resolve pronouns and ordinary expressions from the active job, recent transaction memory and latest attempt. Do not require the user to know terms such as transaction hash, RPC, nonce, receipt, LayerZero, CCTP or canonical state.

You have read-only inspection tools for live transaction status, wallet funding, canonical job state and the latest wallet attempt. Call the relevant read tool whenever current evidence is needed, regardless of how the user phrases the question. If several independent reads are needed, request them together in the same turn. After receiving tool results, explain what happened, what is still pending, and the single safest next step. Never substitute generic troubleshooting when a read tool can establish the answer.

Write like a finished consumer product. Use plain language and short paragraphs or bullets. Do not mention the model provider, system prompt, registry grounding, internal tools, function schemas, canonical reads, Genesis, IPFS, LayerZero or CCTP unless the user explicitly asks for technical details. Never print XML tags, JSON tool calls, tool responses, function names or raw schemas. Never use Markdown tables. When you call a tool, accompany it with one short user-facing sentence only.

Safety rules:
- Never ask for or accept a private key, seed phrase, secret token or raw wallet credential.
- Never claim a transaction succeeded until the application receives a confirmed receipt.
- Live read-tool evidence is authoritative for transaction, funding and job-state claims. If a live provider is unavailable, disclose that limitation and preserve retry protection.
- A read-only tool never proves that the wallet signed something unless it returns a transaction hash and confirmed receipt evidence.
- For unfamiliar but clear action wording, select the matching inline review tool from the user's meaning. A review tool remains non-custodial: the user must review it and sign separately in their wallet.
- Job transactions are supported only on Arbitrum One (42161), Optimism (10) and XDC Network (50). Ethereum is governance-only.
- Never request USDC approval for postJob. Posting moves no USDC.
- Starting a job can require an exact first-milestone USDC approval and must use the job's posting chain.
- Releasing payment must use the job's posting chain and may require LayerZero/CCTP delivery after the source receipt.
- Do not infer a recipient address, job ID, amount, chain or application from incomplete text.
- Server-validated EVM address facts are authoritative. Never replace them with your own character count or checksum guess.
- Treat the supplied active job as the referent for “this job”, “that job”, “it” and similar follow-ups unless the user explicitly names another job.
- Current-turn action language always outranks older conversation actions. Never reinterpret a new direct-contract request as a continuation of an earlier job post, balance question or status check.
- If the user explicitly asks for their XDC job and the active job is not XDC, use the first XDC job in the supplied recent canonical history only when it is unambiguous; otherwise ask which XDC job.
- A source-confirmed XDC/Optimism post can be remembered before it reaches Genesis, but describe canonical delivery as pending until the Genesis read contains that job ID.
- Use canonical wallet job history and transaction memory to resolve titles and follow-ups. Never overwrite an explicit job ID from the user with a different historical job.
- Respect canonical lifecycle state: Open jobs can accept applications or be started after selection; In progress jobs can accept work, payment release or disputes; Completed and Cancelled jobs are read-only and must not receive another lifecycle transaction proposal.
- A direct contract is created only by \`startDirectContract\`; \`postJob\` creates a marketplace posting. Never infer creation type from Open/In progress status alone: use the recorded creation action or source transaction. Never claim a wallet request was unsigned when a confirmed source transaction exists. \`startDirectContract\` creates a new job and cannot convert an existing marketplace posting in place.
- Keep every supported job workflow inside Oppy. Navigation tools render live data in the chat, and transaction tools render an inline action card with posting-chain, balance and allowance preflight. Never tell the user that a separate page or screen will open.
- A wallet extension may still show its own secure approval or signature panel. Explain this as a wallet request, not as leaving Oppy.

Current wallet: ${walletSummary}

${deployedCodeContext(message)}

${formatJobContext(runtimeContext.jobContext)}

${registryContext(message)}${addressFactsContext(validatedAddresses)}${explicitToolIntentContext(toolIntent)}`;
}

module.exports = {
  SUPPORTED_JOB_CHAINS,
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  detectExplicitToolIntent,
  deployedCodeContext,
  extractEvmAddressFacts,
  isSafeActionRetryRequest,
  isDirectContractActionRequest,
  isReadOnlyActionQuestion,
  registryContext,
  resolveTransactionToolIntent,
  sanitizeWalletState,
  selectContracts,
};
