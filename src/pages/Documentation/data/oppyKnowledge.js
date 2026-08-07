// Agent Oppy's public production knowledge is generated from the same audited
// registry consumed by /docs and /api/docs/contracts. Do not reintroduce a
// second hand-maintained address list here.
import registry from '../../../../docs/mainnet-contracts.json';

const allContracts = registry.chains.flatMap((chain) => (
  chain.contracts.map((contract) => ({ ...contract, chain }))
));

const byId = Object.fromEntries(allContracts.map((contract) => [contract.id, contract]));

const STATUS_LABELS = {
  live: 'live',
  'runtime-verified': 'runtime verified',
  'source-verified': 'explorer source verified',
  'source-pending': 'explorer source pending',
  'proxy-linked': 'proxy linked',
  configured: 'configured',
  'end-to-end-tested': 'end-to-end tested',
  disabled: 'disabled',
};
const sourceStatus = (contract) => {
  if (contract.kind === 'proxy') {
    return contract.proxySource === 'source-pending' || contract.implementationSource === 'source-pending'
      ? 'source-pending'
      : 'source-verified';
  }
  return contract.sourceVerification;
};

const contractKnowledge = (contract) => {
  const configuration = registry.configurationByContract[contract.id];
  return `## ${contract.name}

- Chain: ${contract.chain.name} (chain ID ${contract.chain.chainId})
- Production role: ${contract.purpose}
- Version: ${contract.version}
- Deployment type: ${contract.kind === 'proxy' ? 'UUPS proxy' : 'standalone'}
- Live address: ${contract.address}
${contract.implementation ? `- Current implementation: ${contract.implementation}\n` : ''}- Runtime: ${STATUS_LABELS[contract.runtimeVerification]}
- Explorer publication: ${STATUS_LABELS[sourceStatus(contract)]}
${contract.kind === 'proxy' ? `- Proxy link: ${STATUS_LABELS[contract.proxyLink]}\n` : ''}- Configuration: ${STATUS_LABELS[configuration.status]} — ${configuration.detail}
- Exact source: contracts/${contract.source}
${contract.notes ? `- Live-state note: ${contract.notes}\n` : ''}`;
};

const deploymentKnowledge = () => registry.chains.map((chain) => {
  const rows = chain.contracts.map((contract) => (
    `- ${contract.name} (${contract.version}): ${contract.address}${contract.implementation ? `; implementation ${contract.implementation}` : ''}; ${STATUS_LABELS[sourceStatus(contract)]}`
  )).join('\n');
  return `### ${chain.name}
Chain ID ${chain.chainId}; LayerZero EID ${chain.lzEid}; CCTP domain ${chain.cctpDomain}.
${rows}`;
}).join('\n\n');

const pathwayKnowledge = registry.pathways.map((pathway) => (
  `- ${pathway.name}: ${STATUS_LABELS[pathway.status]} — ${pathway.detail}`
)).join('\n');

const limitationKnowledge = registry.limitations.map((limitation) => `- ${limitation}`).join('\n');

export const BASE_SYSTEM_KNOWLEDGE = `You are Agent Oppy, OpenWork's production documentation assistant.

Use only the audited facts supplied in this context. Never substitute old testnet, Base-era, legacy-explorer or source-initializer values for current production state. If the context does not prove a claim, say that it is not established. Keep these status concepts separate: deployed, runtime verified, explorer source verified, proxy linked, configured, pathway operational and end-to-end tested.

## CURRENT PRODUCTION ARCHITECTURE

OpenWork has ${registry.summary.activeContractRoles} active contract functions across ${registry.summary.activeNetworks} networks. Each function is one production responsibility, such as jobs, disputes, governance, messaging or rewards; a function may use both a proxy and an implementation address:

- Arbitrum One is the canonical job, escrow, dispute, profile and reward hub. Its direct ArbLOWJC and ArbAthenaClient adapters support same-chain use without LayerZero or CCTP.
- Optimism and XDC are user-facing local execution chains. LayerZero carries application messages to Arbitrum and Circle CCTP carries native USDC independently.
- Ethereum is the governance, staking, OWORK token and reward-claim chain. It is not a local job chain.
- IPFS stores public off-chain content such as job descriptions, applications, submissions and evidence; contracts store hashes and canonical state.

## AUDIT SNAPSHOT

- Registry audited: ${registry.lastAudited}
- Active roles: ${registry.summary.activeContractRoles}
- Active artifacts counting proxies and implementations separately: ${registry.summary.activeArtifacts}
- Explorer source verified: ${registry.summary.explorerSourceVerifiedArtifacts}
- Explorer source pending: ${registry.summary.explorerSourcePendingArtifacts}
- All ${registry.summary.activeContractRoles} roles had live runtime code at the audit blocks.
- All 19 ERC-1967 proxy implementation slots matched the registry.
- NOWJC live commissionPercentage(): ${registry.liveConfiguration.commission.commissionBasisPoints} basis points.
- NOWJC live minCommission(): ${registry.liveConfiguration.commission.minimumUsdcUnits} raw USDC units.
- Do not claim a 1% or $1 minimum production fee; those are source defaults that the live proxy did not adopt.

## PATHWAY STATUS

${pathwayKnowledge}

## KNOWN LIMITATIONS

${limitationKnowledge}`;

const WORKFLOW_KNOWLEDGE = `## PRODUCTION WORKFLOWS

- Create profile: a local LOWJC sends profile data through its local LayerZero bridge; Native bridge V3 routes it to ProfileManager, which writes ProfileGenesis.
- Post job: LOWJC sends metadata through LayerZero to Native bridge V3, NOWJC and Genesis. No USDC moves at post time.
- Apply: LOWJC sends the application and applicant milestone/payment-domain data through LayerZero to NOWJC and Genesis.
- Start a cross-chain job: the instruction travels through LayerZero while escrow USDC moves independently through CCTP; NOWJC reconciles the two on Arbitrum.
- Start a direct Arbitrum job: ArbLOWJC calls NOWJC on the same chain. No LayerZero message or CCTP transfer is involved.
- Release: NOWJC updates Genesis and rewards, then pays directly on Arbitrum or sends USDC through CCTP to the applicant's selected supported domain.
- Dispute: LocalAthena sends dispute data through LayerZero and its fee through CCTP; NativeAthena holds canonical dispute state and oracle voting. Do not state a production minimum beyond the recorded live evidence; LocalAthena V2 remains held pending that decision.
- Governance: staking and snapshot voting power live on Ethereum. ETHDAOMessaging and ETHLZOpenworkBridge send ordered updates to Native bridge V3, NativeDAOStakeSync and NativeOpenworkDAO on Arbitrum.`;

const CONFIGURATION_KNOWLEDGE = `## LIVE CONFIGURATION

Verified ${registry.liveConfiguration.verifiedAt}: ${registry.liveConfiguration.verificationScope}

- NOWJC commission: ${registry.liveConfiguration.commission.commissionBasisPoints} basis points; minimum ${registry.liveConfiguration.commission.minimumUsdcUnits} raw USDC units.
- NativeRewards ProfileGenesis: ${registry.liveConfiguration.nativeRewardsProfileGenesis.value}.
- LayerZero: ${registry.liveConfiguration.layerZeroSecurity.detail}
- CCTP keeper pools and caps are operational balances and can change as relays are paid. At the audit blocks:
${registry.liveConfiguration.cctpRewards.map((entry) => `  - ${entry.chain}: pool ${entry.poolWei} wei; cap ${entry.maxRewardWei} wei.`).join('\n')}

Active LayerZero peers:
${registry.liveConfiguration.activePeers.map((peer) => `- ${peer.source} → ${peer.target}: ${peer.peer}`).join('\n')}`;

const IPFS_KNOWLEDGE = `## IPFS

OpenWork uploads public content before the corresponding contract call. Typical IPFS objects include job descriptions and milestones, profiles and portfolios, applications, work submissions, updates and dispute evidence. Only content hashes and canonical lifecycle state belong on-chain. Never advise storing private or sensitive content in a public IPFS object.`;

const KEYWORD_GROUPS = {
  nowjc: ['nowjc', 'job hub', 'escrow', 'commission', 'platform fee'],
  'native-arb-lowjc': ['arb lowjc', 'arblowjc', 'direct job', 'same-chain job', 'same chain job'],
  'native-arb-athena-client': ['arb athena', 'direct dispute'],
  'native-athena': ['native athena', 'dispute resolution', 'oracle voting'],
  'native-openwork-dao': ['native dao', 'arbitrum dao'],
  'native-rewards': ['native rewards', 'reward accrual'],
  'native-lz-openwork-bridge': ['native bridge', 'layerzero hub'],
  'arbitrum-cctp-transceiver': ['arbitrum cctp', 'cctp hub'],
  'native-openwork-genesis': ['genesis', 'canonical job state', 'job storage'],
  'native-profile-genesis': ['profile genesis', 'rating storage'],
  'native-profile-manager': ['profile manager', 'profile write', 'rating'],
  'native-athena-oracle-manager': ['oracle manager', 'skill oracle'],
  'native-athena-activity-tracker': ['activity tracker', 'member activity'],
  'native-voting-power-checkpoints': ['native checkpoint', 'arbitrum checkpoint'],
  'native-dao-stake-sync': ['stake sync', 'ordered stake'],
  'native-contract-registry': ['contract registry', 'lookup helper'],
  'native-genesis-reader': ['genesis reader', 'batch read'],
  'optimism-lowjc': ['optimism lowjc', 'op lowjc'],
  'optimism-local-athena': ['optimism athena', 'op athena'],
  'optimism-local-bridge': ['optimism bridge', 'op bridge'],
  'optimism-cctp-transceiver': ['optimism cctp', 'op cctp'],
  'xdc-lowjc': ['xdc lowjc'],
  'xdc-local-athena': ['xdc athena'],
  'xdc-local-bridge': ['xdc bridge'],
  'xdc-cctp-transceiver': ['xdc cctp', 'standard transfer'],
  'eth-openwork-dao': ['eth dao', 'ethereum dao', 'staking'],
  'eth-voting-power-checkpoints': ['ethereum checkpoint', 'eth checkpoint'],
  'eth-dao-messaging': ['dao messaging', 'governance message'],
  'eth-lz-openwork-bridge': ['ethereum bridge', 'eth bridge'],
  'eth-rewards': ['eth rewards', 'reward claim'],
  'openwork-token': ['owork', 'ow token', 'openwork token', 'erc-20', 'erc20'],
};

function matchingContracts(query) {
  const matches = new Set();

  for (const [id, keywords] of Object.entries(KEYWORD_GROUPS)) {
    if (keywords.some((keyword) => query.includes(keyword))) matches.add(id);
  }

  for (const contract of allContracts) {
    const searchable = `${contract.id} ${contract.name} ${contract.purpose}`.toLowerCase();
    if (query.length > 3 && searchable.includes(query)) matches.add(contract.id);
  }

  if (/job|work|freelanc|escrow|milestone/.test(query)) {
    ['nowjc', 'native-arb-lowjc', 'optimism-lowjc', 'xdc-lowjc', 'native-openwork-genesis'].forEach((id) => matches.add(id));
  }
  if (/dispute|athena|oracle/.test(query)) {
    ['native-athena', 'native-arb-athena-client', 'optimism-local-athena', 'xdc-local-athena', 'native-athena-oracle-manager'].forEach((id) => matches.add(id));
  }
  if (/profile|portfolio|rating/.test(query)) {
    ['native-profile-manager', 'native-profile-genesis', 'native-openwork-genesis'].forEach((id) => matches.add(id));
  }
  if (/govern|vote|voting|stake|dao|proposal/.test(query)) {
    ['eth-openwork-dao', 'eth-voting-power-checkpoints', 'eth-dao-messaging', 'native-dao-stake-sync', 'native-openwork-dao', 'openwork-token'].forEach((id) => matches.add(id));
  }
  if (/bridge|layerzero|message|peer|dvn|executor/.test(query)) {
    ['native-lz-openwork-bridge', 'optimism-local-bridge', 'xdc-local-bridge', 'eth-lz-openwork-bridge'].forEach((id) => matches.add(id));
  }
  if (/cctp|usdc|payment|payout|reward pool|keeper|relay/.test(query)) {
    ['arbitrum-cctp-transceiver', 'optimism-cctp-transceiver', 'xdc-cctp-transceiver', 'nowjc'].forEach((id) => matches.add(id));
  }

  return Array.from(matches).slice(0, 8);
}

export const buildOppyContext = (userQuery) => {
  const query = userQuery.toLowerCase();
  let context = BASE_SYSTEM_KNOWLEDGE;
  const selected = matchingContracts(query);

  if (selected.length) {
    context += `\n\n${selected.map((id) => contractKnowledge(byId[id])).join('\n\n')}`;
  }

  if (/address|deploy|implementation|proxy|source|verified|verification|all contract|every contract|list contract|how many/.test(query)) {
    context += `\n\n## COMPLETE PRODUCTION REGISTRY\n\n${deploymentKnowledge()}`;
  }

  if (/config|peer|dvn|executor|commission|fee|reward pool|keeper|relay|route|status/.test(query)) {
    context += `\n\n${CONFIGURATION_KNOWLEDGE}`;
  }

  if (/how|workflow|flow|step|post|apply|start|submit|release|claim|stake|vote/.test(query)) {
    context += `\n\n${WORKFLOW_KNOWLEDGE}`;
  }

  if (/ipfs|upload|hash|pinata|storage/.test(query)) {
    context += `\n\n${IPFS_KNOWLEDGE}`;
  }

  return context;
};

export const FALLBACK_RESPONSES = {
  athena: 'NativeAthena V9 is the canonical Arbitrum dispute and oracle-voting contract. Optimism and XDC use LocalAthena entry adapters; Arbitrum has a direct ArbAthenaClient V3. LocalAthena V2 is prepared but intentionally not live pending a production dispute-minimum decision.',
  job: 'Jobs enter through Optimism LOWJC, XDC LOWJC V3, or the direct ArbLOWJC V5 adapter. Cross-chain metadata uses LayerZero, while USDC uses CCTP independently. NOWJC V5 reconciles canonical job state and escrow on Arbitrum; its live commission and minimum are both zero.',
  bridge: 'NativeLZOpenworkBridge V3 is the active Arbitrum message hub. It peers with the active Optimism, XDC V2 and Ethereum bridges. XDC/Arbitrum is production-tested; Optimism/Arbitrum and Ethereum/Arbitrum are configured but lack a recorded post-cutover delivery proof.',
  ipfs: 'OpenWork uses IPFS for public job descriptions, applications, submissions, profiles, portfolios and dispute evidence. Contracts store content hashes and canonical lifecycle state. Private or sensitive information should not be placed in public IPFS content.',
  deploy: `The production registry contains ${registry.summary.activeContractRoles} active contract functions backed by ${registry.summary.activeArtifacts} deployed addresses across Arbitrum, Optimism, XDC and Ethereum. A function is one production responsibility, such as jobs, disputes, governance, messaging or rewards; an upgradeable function has both a proxy and an implementation address. ${registry.summary.explorerSourceVerifiedArtifacts} addresses are explorer source verified; ${registry.summary.explorerSourcePendingArtifacts} are runtime verified but source publication is pending.`,
  token: `OWORK is the verified ERC-20 governance and rewards token on Ethereum at ${byId['openwork-token'].address}. It connects to ETHOpenworkDAO V3 for staking/governance and ETHRewards for claims.`,
  payment: 'Cross-chain job value moves as native USDC through Circle CCTP, independently from LayerZero application messages. NOWJC holds canonical escrow on Arbitrum and pays directly on Arbitrum or routes a CCTP payout to a supported domain. The live NOWJC commission and minimum are both zero.',
  commission: 'The current production NOWJC proxy reports commissionPercentage() = 0 and minCommission() = 0. The 1% and $1 values visible in source are initial defaults that the live proxy did not adopt during upgrade.',
  cctp: 'Arbitrum, Optimism and XDC each use a live CCTP transceiver with permissionless receive and gas-based keeper rewards. Reward-pool balances are operational state and may decrease as relays are paid; the documented caps and pools were read at the 7 August audit blocks.',
  profile: 'ProfileManager V3 authorizes profile and rating writes against canonical Job Genesis state, then stores profiles, portfolios and job-bound ratings in ProfileGenesis V2. NativeRewards now points to the current ProfileGenesis proxy.',
  governance: 'Governance and OWORK staking live on Ethereum through ETHOpenworkDAO V3 and its historical checkpoint proxy. ETHDAOMessaging sends ordered updates through the Ethereum bridge to Native bridge V3, NativeDAOStakeSync and NativeOpenworkDAO V2 on Arbitrum.',
  oracle: 'NativeAthenaOracleManager manages skill-oracle membership, while NativeAthenaActivityTracker records member activity. NativeAthena V9 uses these modules for canonical dispute and oracle-voting operations on Arbitrum.',
  mainnet: `Yes. OpenWork has ${registry.summary.activeContractRoles} active mainnet roles across Arbitrum One, Optimism, XDC Network and Ethereum Mainnet. The registry was last audited on ${registry.lastAudited}.`,
  default: `I can answer from the ${registry.lastAudited} audited production registry: ${registry.summary.activeContractRoles} roles, live proxy and implementation addresses, source-publication status, configuration, cross-chain pathways, workflows, IPFS and known limitations.`,
};
