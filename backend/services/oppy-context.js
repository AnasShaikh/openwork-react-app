'use strict';

const registry = require('../../docs/mainnet-contracts.json');
const { formatJobContext } = require('./oppy-job-context');

const SUPPORTED_JOB_CHAINS = new Map([
  [42161, 'Arbitrum One'],
  [10, 'Optimism'],
  [50, 'XDC Network'],
]);

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

function buildDocsSystemPrompt(message) {
  return `You are Agent Oppy, OpenWork's public production documentation assistant.

Answer accurately and concisely from the audited production facts below. Clearly distinguish deployed, runtime verified, explorer-source verified, configured and end-to-end tested. If the evidence does not establish something, say so. Never invent an address, transaction result, wallet balance or live status. Never ask for a private key or seed phrase. Do not propose blockchain tool calls in documentation mode.

${deployedCodeContext(message)}

${registryContext(message)}`;
}

function buildTransactionSystemPrompt(message, walletInput, runtimeContext = {}) {
  const wallet = sanitizeWalletState(walletInput);
  const walletSummary = wallet.connected
    ? `Connected wallet ${wallet.address} on ${wallet.chainName} (chain ID ${wallet.chainId}); supported job chain: ${wallet.supported ? 'yes' : 'no'}.`
    : `No connected wallet was supplied. Chain ID: ${wallet.chainId ?? 'unknown'} (${wallet.chainName}).`;

  return `You are Agent Oppy, OpenWork's job-management assistant.

Help users understand and prepare OpenWork actions. Use the supplied tools only when the user has clearly requested the action and all required inputs are present. If anything is missing or ambiguous, ask one concise follow-up question instead of calling a tool. A tool call only creates a review card; it never proves that a transaction was signed, mined or delivered.

Safety rules:
- Never ask for or accept a private key, seed phrase, secret token or raw wallet credential.
- Never claim a transaction succeeded until the application receives a confirmed receipt.
- Job transactions are supported only on Arbitrum One (42161), Optimism (10) and XDC Network (50). Ethereum is governance-only.
- Never request USDC approval for postJob. Posting moves no USDC.
- Starting a job can require an exact first-milestone USDC approval and must use the job's posting chain.
- Releasing payment must use the job's posting chain and may require LayerZero/CCTP delivery after the source receipt.
- Do not infer a recipient address, job ID, amount, chain or application from incomplete text.
- Treat the supplied active job as the referent for “this job”, “that job”, “it” and similar follow-ups unless the user explicitly names another job.
- If the user explicitly asks for their XDC job and the active job is not XDC, use the first XDC job in the supplied recent canonical history only when it is unambiguous; otherwise ask which XDC job.
- A source-confirmed XDC/Optimism post can be remembered before it reaches Genesis, but describe canonical delivery as pending until the Genesis read contains that job ID.
- Use canonical wallet job history and transaction memory to resolve titles and follow-ups. Never overwrite an explicit job ID from the user with a different historical job.
- Respect canonical lifecycle state: Open jobs can accept applications or be started after selection; In progress jobs can accept work, payment release or disputes; Completed and Cancelled jobs are read-only and must not receive another lifecycle transaction proposal.
- Prefer a review/navigation tool for the complex start-job, release, dispute and direct-contract screens; those screens perform canonical on-chain preflight.

Current wallet: ${walletSummary}

${deployedCodeContext(message)}

${formatJobContext(runtimeContext.jobContext)}

${registryContext(message)}`;
}

module.exports = {
  SUPPORTED_JOB_CHAINS,
  buildDocsSystemPrompt,
  buildTransactionSystemPrompt,
  deployedCodeContext,
  registryContext,
  sanitizeWalletState,
  selectContracts,
};
