/**
 * Layout and relationships for the /docs architecture diagram.
 *
 * Only the editorial parts live here — which contracts sit in which zone, and
 * which of them talk to each other for a given user action. Everything factual
 * (address, implementation, explorer link, verification status) is read from
 * docs/mainnet-contracts.json at render time via `contractId`, so this file can
 * never drift from the deployed truth.
 *
 * Replaces openwork-complete-architecture.html, which had a fixed pixel canvas
 * and three stale claims: it labelled governance "Main Chain (Base)" when it is
 * Ethereum, omitted XDC entirely, and predated the Arbitrum direct adapters that
 * are now the verified path for same-chain jobs.
 */

export const CHAIN_LAYOUT = [
  {
    chainKey: 'optimism',
    shortRole: 'Local execution',
    groups: [
      { label: 'User entry', contracts: ['optimism-lowjc', 'optimism-local-athena'] },
      { label: 'Transport', contracts: ['optimism-local-bridge', 'optimism-cctp-transceiver'] },
    ],
  },
  {
    chainKey: 'arbitrum',
    shortRole: 'Canonical hub',
    groups: [
      { label: 'Direct entry & transport', contracts: ['native-arb-lowjc', 'native-arb-athena-client', 'native-lz-openwork-bridge', 'arbitrum-cctp-transceiver'] },
      { label: 'Core protocol', contracts: ['nowjc', 'native-athena', 'native-openwork-dao', 'native-rewards'] },
      { label: 'Governance sync', contracts: ['native-voting-power-checkpoints', 'native-dao-stake-sync'] },
      { label: 'Profiles, oracles & storage', contracts: ['native-openwork-genesis', 'native-profile-genesis', 'native-profile-manager', 'native-athena-oracle-manager', 'native-athena-activity-tracker', 'native-contract-registry', 'native-genesis-reader'] },
    ],
  },
  {
    chainKey: 'xdc',
    shortRole: 'Local execution',
    groups: [
      { label: 'User entry', contracts: ['xdc-lowjc', 'xdc-local-athena'] },
      { label: 'Transport', contracts: ['xdc-local-bridge', 'xdc-cctp-transceiver'] },
    ],
  },
  {
    chainKey: 'ethereum',
    shortRole: 'Governance & token',
    groups: [
      { label: 'Governance', contracts: ['eth-openwork-dao', 'eth-voting-power-checkpoints', 'eth-dao-messaging'] },
      { label: 'Messaging & claims', contracts: ['eth-lz-openwork-bridge', 'eth-rewards', 'openwork-token'] },
    ],
  },
];

export const CONTRACT_PRESENTATION = {
  'optimism-lowjc': { label: 'LOWJC', role: 'Jobs & profiles', icon: 'jobs.svg', related: ['optimism-local-athena', 'optimism-local-bridge', 'optimism-cctp-transceiver', 'nowjc'] },
  'optimism-local-athena': { label: 'LocalAthena', role: 'Disputes & oracles', icon: 'dispute.svg', related: ['optimism-lowjc', 'optimism-local-bridge', 'optimism-cctp-transceiver', 'native-athena'] },
  'optimism-local-bridge': { label: 'LZ Bridge', role: 'Application messages', icon: 'connect.svg', related: ['optimism-lowjc', 'optimism-local-athena', 'native-lz-openwork-bridge'] },
  'optimism-cctp-transceiver': { label: 'CCTP', role: 'Native USDC', icon: 'usdc.svg', related: ['optimism-lowjc', 'optimism-local-athena', 'arbitrum-cctp-transceiver'] },

  'native-arb-lowjc': { label: 'ArbLOWJC V5', role: 'Direct jobs', icon: 'jobs.svg', related: ['nowjc', 'native-openwork-genesis', 'native-rewards'] },
  'native-arb-athena-client': { label: 'ArbAthenaClient', role: 'Direct disputes', icon: 'dispute.svg', related: ['native-athena', 'native-openwork-genesis'] },
  'native-lz-openwork-bridge': { label: 'Native Bridge V3', role: 'LayerZero hub', icon: 'connect.svg', related: ['optimism-local-bridge', 'xdc-local-bridge', 'eth-lz-openwork-bridge', 'nowjc', 'native-athena', 'native-openwork-dao', 'native-profile-manager', 'native-rewards'] },
  'arbitrum-cctp-transceiver': { label: 'CCTP', role: 'Native USDC hub', icon: 'usdc.svg', related: ['optimism-cctp-transceiver', 'xdc-cctp-transceiver', 'nowjc', 'native-athena'] },
  nowjc: { label: 'NOWJC V5', role: 'Jobs, escrow & payouts', icon: 'jobs.svg', related: ['native-arb-lowjc', 'native-lz-openwork-bridge', 'arbitrum-cctp-transceiver', 'native-openwork-genesis', 'native-athena', 'native-rewards'] },
  'native-athena': { label: 'NativeAthena V9', role: 'Dispute resolution', icon: 'dispute.svg', related: ['native-arb-athena-client', 'native-lz-openwork-bridge', 'arbitrum-cctp-transceiver', 'native-openwork-genesis', 'native-athena-oracle-manager', 'native-athena-activity-tracker', 'nowjc'] },
  'native-openwork-dao': { label: 'NativeDAO V2', role: 'Arbitrum governance', icon: 'dao.svg', related: ['native-voting-power-checkpoints', 'native-dao-stake-sync', 'native-lz-openwork-bridge', 'native-openwork-genesis', 'native-rewards'] },
  'native-rewards': { label: 'NativeRewards', role: 'Reward accrual', icon: 'OWToken.svg', related: ['nowjc', 'native-profile-genesis', 'native-lz-openwork-bridge', 'eth-rewards'] },
  'native-voting-power-checkpoints': { label: 'Voting checkpoints', role: 'Historical power', icon: 'file-icon.svg', related: ['native-openwork-dao', 'native-dao-stake-sync', 'eth-voting-power-checkpoints'] },
  'native-dao-stake-sync': { label: 'DAO Stake Sync', role: 'Ordered stake state', icon: 'connect.svg', related: ['native-openwork-dao', 'native-voting-power-checkpoints', 'native-lz-openwork-bridge', 'eth-dao-messaging'] },
  'native-openwork-genesis': { label: 'Genesis', role: 'Canonical job state', icon: 'file-icon.svg', related: ['nowjc', 'native-athena', 'native-profile-manager', 'native-genesis-reader'] },
  'native-profile-genesis': { label: 'ProfileGenesis V2', role: 'Profiles & ratings', icon: 'profile.svg', related: ['native-profile-manager', 'native-rewards'] },
  'native-profile-manager': { label: 'ProfileManager V3', role: 'Profile writes', icon: 'profile.svg', related: ['native-profile-genesis', 'native-openwork-genesis', 'native-lz-openwork-bridge'] },
  'native-athena-oracle-manager': { label: 'OracleManager', role: 'Skill-oracle lifecycle', icon: 'create-skill-oracle-icon.svg', related: ['native-athena', 'native-athena-activity-tracker'] },
  'native-athena-activity-tracker': { label: 'ActivityTracker', role: 'Member activity', icon: 'file-icon.svg', related: ['native-athena', 'native-athena-oracle-manager', 'native-openwork-dao'] },
  'native-contract-registry': { label: 'ContractRegistry', role: 'Lookup helper', icon: 'file-05.svg', related: ['native-lz-openwork-bridge'] },
  'native-genesis-reader': { label: 'GenesisReader', role: 'Batch reads', icon: 'file-05.svg', related: ['native-openwork-genesis'] },

  'xdc-lowjc': { label: 'LOWJC V3', role: 'Jobs & profiles', icon: 'jobs.svg', related: ['xdc-local-athena', 'xdc-local-bridge', 'xdc-cctp-transceiver', 'nowjc'] },
  'xdc-local-athena': { label: 'LocalAthena', role: 'Disputes & oracles', icon: 'dispute.svg', related: ['xdc-lowjc', 'xdc-local-bridge', 'xdc-cctp-transceiver', 'native-athena'] },
  'xdc-local-bridge': { label: 'LZ Bridge V2', role: 'Application messages', icon: 'connect.svg', related: ['xdc-lowjc', 'xdc-local-athena', 'native-lz-openwork-bridge'] },
  'xdc-cctp-transceiver': { label: 'CCTP Standard', role: 'Native USDC', icon: 'usdc.svg', related: ['xdc-lowjc', 'xdc-local-athena', 'arbitrum-cctp-transceiver'] },

  'eth-openwork-dao': { label: 'ETH DAO V3', role: 'Staking & governance', icon: 'dao.svg', related: ['eth-voting-power-checkpoints', 'eth-dao-messaging', 'openwork-token'] },
  'eth-voting-power-checkpoints': { label: 'Voting checkpoints', role: 'Historical power', icon: 'file-icon.svg', related: ['eth-openwork-dao', 'native-voting-power-checkpoints'] },
  'eth-dao-messaging': { label: 'DAO Messaging', role: 'Retryable notifications', icon: 'connect.svg', related: ['eth-openwork-dao', 'eth-lz-openwork-bridge', 'native-dao-stake-sync'] },
  'eth-lz-openwork-bridge': { label: 'ETH LZ Bridge', role: 'Governance messages', icon: 'connect.svg', related: ['eth-dao-messaging', 'eth-rewards', 'native-lz-openwork-bridge'] },
  'eth-rewards': { label: 'ETHRewards', role: 'OWORK claims', icon: 'OWToken.svg', related: ['eth-lz-openwork-bridge', 'openwork-token', 'native-rewards'] },
  'openwork-token': { label: 'OWORK', role: 'ERC-20 token', icon: 'OWToken.svg', related: ['eth-openwork-dao', 'eth-rewards'] },
};

export const ZONES = [
  {
    id: 'local',
    label: 'Local execution chains',
    note: 'Entry points. Users post, apply, fund and dispute here.',
    columns: [
      {
        id: 'optimism',
        chainKey: 'optimism',
        label: 'Optimism',
        nodes: ['lowjcOP', 'athenaOP', 'bridgeOP', 'cctpOP'],
      },
      {
        id: 'xdc',
        chainKey: 'xdc',
        label: 'XDC Network',
        nodes: ['lowjcXDC', 'athenaXDC', 'bridgeXDC', 'cctpXDC'],
      },
    ],
  },
  {
    id: 'native',
    label: 'Arbitrum One — canonical hub',
    note: 'Holds all job state and USDC escrow. Same-chain jobs skip both transports.',
    columns: [
      {
        id: 'arb-transport',
        chainKey: 'arbitrum',
        label: 'Transport and direct entry',
        nodes: ['nativeBridge', 'cctpNative', 'arbLowjc', 'arbAthena'],
      },
      {
        id: 'arb-core',
        chainKey: 'arbitrum',
        label: 'Core protocol',
        nodes: ['nowjc', 'nativeAthena', 'nativeDAO', 'nativeRewards'],
      },
      {
        id: 'arb-support',
        chainKey: 'arbitrum',
        label: 'Profiles, oracles and storage',
        nodes: ['profileMgr', 'oracleMgr', 'activityTracker', 'genesis', 'profileGen', 'genesisReader'],
      },
    ],
  },
  {
    id: 'governance',
    label: 'Ethereum — governance and token',
    note: 'Staking, voting power and the OWORK token. No job traffic.',
    columns: [
      {
        id: 'eth',
        chainKey: 'ethereum',
        label: 'Ethereum mainnet',
        nodes: ['ethDAO', 'ethMessaging', 'ethBridge', 'ethRewards', 'owToken', 'ethCheckpoints'],
      },
    ],
  },
];

/**
 * `contractId` keys into docs/mainnet-contracts.json. A node without one is not
 * a deployed contract and renders without an address or explorer link.
 */
export const NODES = {
  lowjcOP: { label: 'LOWJC', role: 'Jobs', icon: 'jobs.svg', contractId: 'optimism-lowjc' },
  athenaOP: { label: 'LocalAthena', role: 'Disputes', icon: 'dispute.svg', contractId: 'optimism-local-athena' },
  bridgeOP: { label: 'LZ Bridge', role: 'Messages', icon: 'connect.svg', contractId: 'optimism-local-bridge' },
  cctpOP: { label: 'CCTP', role: 'USDC', icon: 'usdc.svg', contractId: 'optimism-cctp-transceiver' },

  lowjcXDC: { label: 'LOWJC V3', role: 'Jobs', icon: 'jobs.svg', contractId: 'xdc-lowjc' },
  athenaXDC: { label: 'LocalAthena', role: 'Disputes', icon: 'dispute.svg', contractId: 'xdc-local-athena' },
  bridgeXDC: { label: 'LZ Bridge V2', role: 'Messages', icon: 'connect.svg', contractId: 'xdc-local-bridge' },
  cctpXDC: { label: 'CCTP', role: 'USDC', icon: 'usdc.svg', contractId: 'xdc-cctp-transceiver' },

  nativeBridge: { label: 'Native Bridge V3', role: 'Messages', icon: 'connect.svg', contractId: 'native-lz-openwork-bridge' },
  cctpNative: { label: 'CCTP', role: 'USDC', icon: 'usdc.svg', contractId: 'arbitrum-cctp-transceiver' },
  arbLowjc: { label: 'ArbLOWJC V5', role: 'Direct jobs', icon: 'jobs.svg', contractId: 'native-arb-lowjc' },
  arbAthena: { label: 'ArbAthenaClient', role: 'Direct disputes', icon: 'dispute.svg', contractId: 'native-arb-athena-client' },

  nowjc: { label: 'NOWJC V5', role: 'Job hub and escrow', icon: 'jobs.svg', contractId: 'nowjc', emphasis: true },
  nativeAthena: { label: 'NativeAthena V9', role: 'Dispute resolution', icon: 'dispute.svg', contractId: 'native-athena' },
  nativeDAO: { label: 'NativeDAO V2', role: 'Governance', icon: 'dao.svg', contractId: 'native-openwork-dao' },
  nativeRewards: { label: 'NativeRewards', role: 'Reward accrual', icon: 'OWToken.svg', contractId: 'native-rewards' },

  profileMgr: { label: 'ProfileManager V3', role: 'Profiles', icon: 'profile.svg', contractId: 'native-profile-manager' },
  oracleMgr: { label: 'OracleManager', role: 'Skill oracles', icon: 'create-skill-oracle-icon.svg', contractId: 'native-athena-oracle-manager' },
  activityTracker: { label: 'ActivityTracker', role: 'Voter activity', icon: 'file-icon.svg', contractId: 'native-athena-activity-tracker' },
  genesis: { label: 'Genesis', role: 'Canonical storage', icon: 'file-icon.svg', contractId: 'native-openwork-genesis', emphasis: true },
  profileGen: { label: 'ProfileGenesis V2', role: 'Profile storage', icon: 'profile.svg', contractId: 'native-profile-genesis' },
  genesisReader: { label: 'GenesisReader', role: 'Batch reads', icon: 'file-05.svg', contractId: 'native-genesis-reader' },

  ethDAO: { label: 'ETHOpenworkDAO V3', role: 'Staking and voting', icon: 'dao.svg', contractId: 'eth-openwork-dao' },
  ethMessaging: { label: 'ETHDAOMessaging', role: 'Outbound governance', icon: 'connect.svg', contractId: 'eth-dao-messaging' },
  ethBridge: { label: 'ETH LZ Bridge', role: 'Messages', icon: 'connect.svg', contractId: 'eth-lz-openwork-bridge' },
  ethRewards: { label: 'ETHRewards', role: 'Claims', icon: 'OWToken.svg', contractId: 'eth-rewards' },
  owToken: { label: 'OWORK', role: 'ERC-20', icon: 'OWToken.svg', contractId: 'openwork-token' },
  ethCheckpoints: { label: 'VotingPowerCheckpoints', role: 'Historical power', icon: 'file-icon.svg', contractId: 'eth-voting-power-checkpoints' },
};

/** Edge transports. `usdc` edges are Circle CCTP; `message` edges are LayerZero. */
export const TRANSPORT = { MESSAGE: 'message', USDC: 'usdc', LOCAL: 'local' };

export const FLOWS = [
  {
    id: 'overview',
    label: 'System overview',
    summary:
      'Every deployed contract. Application messages travel by LayerZero, USDC by Circle CCTP, and the two are reconciled on Arbitrum.',
    nodes: Object.keys(NODES),
    edges: [
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'lowjcXDC', to: 'bridgeXDC', transport: TRANSPORT.LOCAL },
      { from: 'bridgeXDC', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'cctpOP', to: 'cctpNative', transport: TRANSPORT.USDC },
      { from: 'cctpXDC', to: 'cctpNative', transport: TRANSPORT.USDC },
      { from: 'nativeBridge', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'arbLowjc', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
      { from: 'nativeBridge', to: 'ethBridge', transport: TRANSPORT.MESSAGE },
    ],
  },
  {
    id: 'direct',
    label: 'Arbitrum direct job',
    badge: 'Verified',
    summary:
      'A job posted and settled entirely on Arbitrum. No LayerZero message and no CCTP transfer, so there is nothing to relay and nothing to reconcile. Reconfirmed end to end on 7 August 2026 with production job 42161-24.',
    nodes: ['arbLowjc', 'nowjc', 'genesis', 'nativeRewards'],
    edges: [
      { from: 'arbLowjc', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'nativeRewards', transport: TRANSPORT.LOCAL },
    ],
    steps: [
      'User calls ArbLOWJC directly',
      'NOWJC holds USDC escrow',
      'Genesis records job state',
      'Rewards accrue on release',
    ],
  },
  {
    id: 'profile',
    label: 'Create profile',
    summary: 'A profile created on a local chain is stored canonically on Arbitrum.',
    nodes: ['lowjcOP', 'bridgeOP', 'nativeBridge', 'profileMgr', 'profileGen'],
    edges: [
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'profileMgr', transport: TRANSPORT.LOCAL },
      { from: 'profileMgr', to: 'profileGen', transport: TRANSPORT.LOCAL },
    ],
    steps: ['createProfile on LOWJC', 'LayerZero message', 'ProfileManager validates', 'ProfileGenesis stores'],
  },
  {
    id: 'post',
    label: 'Post job',
    summary: 'Job metadata travels by LayerZero and is recorded in Genesis. No USDC moves yet.',
    nodes: ['lowjcOP', 'bridgeOP', 'nativeBridge', 'nowjc', 'genesis'],
    edges: [
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
    ],
    steps: ['postJob on LOWJC', 'LayerZero message', 'NOWJC receives', 'Genesis stores'],
  },
  {
    id: 'apply',
    label: 'Apply to job',
    summary: 'An application carries the applicant milestones and their CCTP domain, so payout can later route home.',
    nodes: ['lowjcOP', 'bridgeOP', 'nativeBridge', 'nowjc', 'genesis'],
    edges: [
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
    ],
    steps: ['applyToJob on LOWJC', 'LayerZero message', 'NOWJC records applicant domain', 'Genesis stores'],
  },
  {
    id: 'start',
    label: 'Start job',
    badge: 'Two transports',
    summary:
      'The only step where both transports run at once. USDC is burned and minted through CCTP while the instruction travels by LayerZero. They arrive independently and Arbitrum reconciles them.',
    nodes: ['lowjcOP', 'cctpOP', 'cctpNative', 'bridgeOP', 'nativeBridge', 'nowjc'],
    edges: [
      { from: 'lowjcOP', to: 'cctpOP', transport: TRANSPORT.USDC },
      { from: 'cctpOP', to: 'cctpNative', transport: TRANSPORT.USDC },
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nowjc', transport: TRANSPORT.LOCAL },
    ],
    steps: ['Escrow burned via CCTP', 'Instruction via LayerZero', 'NOWJC mints and reconciles'],
  },
  {
    id: 'submit',
    label: 'Submit work',
    summary: 'Only the selected applicant on an in-progress job can submit.',
    nodes: ['lowjcOP', 'bridgeOP', 'nativeBridge', 'nowjc', 'genesis'],
    edges: [
      { from: 'lowjcOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nowjc', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
    ],
    steps: ['submitWork on LOWJC', 'LayerZero message', 'NOWJC validates', 'Genesis stores'],
  },
  {
    id: 'release',
    label: 'Release payment',
    summary:
      'Escrowed USDC leaves Arbitrum by CCTP to the applicant on their own chain. Relaying the CCTP message is permissionless, and each transceiver pays the caller a gas-based bounty, so third parties often complete it.',
    nodes: ['nowjc', 'cctpNative', 'cctpOP', 'nativeRewards', 'genesis'],
    edges: [
      { from: 'nowjc', to: 'cctpNative', transport: TRANSPORT.USDC },
      { from: 'cctpNative', to: 'cctpOP', transport: TRANSPORT.USDC },
      { from: 'nowjc', to: 'nativeRewards', transport: TRANSPORT.LOCAL },
      { from: 'nowjc', to: 'genesis', transport: TRANSPORT.LOCAL },
    ],
    steps: ['NOWJC releases milestone', 'USDC burned and minted via CCTP', 'Rewards accrue', 'Genesis updated'],
  },
  {
    id: 'dispute',
    label: 'Raise a dispute',
    badge: 'Two transports',
    summary: 'The dispute fee moves as USDC while the dispute data travels as a message. NativeAthena resolves and records the outcome.',
    nodes: ['athenaOP', 'cctpOP', 'cctpNative', 'bridgeOP', 'nativeBridge', 'nativeAthena', 'oracleMgr', 'activityTracker', 'genesis'],
    edges: [
      { from: 'athenaOP', to: 'cctpOP', transport: TRANSPORT.USDC },
      { from: 'cctpOP', to: 'cctpNative', transport: TRANSPORT.USDC },
      { from: 'athenaOP', to: 'bridgeOP', transport: TRANSPORT.LOCAL },
      { from: 'bridgeOP', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nativeAthena', transport: TRANSPORT.LOCAL },
      { from: 'nativeAthena', to: 'oracleMgr', transport: TRANSPORT.LOCAL },
      { from: 'nativeAthena', to: 'activityTracker', transport: TRANSPORT.LOCAL },
      { from: 'nativeAthena', to: 'genesis', transport: TRANSPORT.LOCAL },
    ],
    steps: ['Fee via CCTP', 'Dispute data via LayerZero', 'Oracle members vote', 'Outcome written to Genesis'],
  },
  {
    id: 'governance',
    label: 'Stake and vote',
    summary:
      'Staking happens on Ethereum. Voting power is checkpointed on both chains and synchronised to Arbitrum in order, failing closed rather than losing an update.',
    nodes: ['ethDAO', 'ethCheckpoints', 'ethMessaging', 'ethBridge', 'nativeBridge', 'nativeDAO'],
    edges: [
      { from: 'ethDAO', to: 'ethCheckpoints', transport: TRANSPORT.LOCAL },
      { from: 'ethDAO', to: 'ethMessaging', transport: TRANSPORT.LOCAL },
      { from: 'ethMessaging', to: 'ethBridge', transport: TRANSPORT.LOCAL },
      { from: 'ethBridge', to: 'nativeBridge', transport: TRANSPORT.MESSAGE },
      { from: 'nativeBridge', to: 'nativeDAO', transport: TRANSPORT.LOCAL },
    ],
    steps: ['Stake OWORK on Ethereum', 'Power checkpointed', 'Ordered sync via LayerZero', 'NativeDAO applies it'],
  },
  {
    id: 'rewards',
    label: 'Rewards and claims',
    summary: 'Reward accrual is tracked on Arbitrum as jobs complete, then synchronised to Ethereum where OWORK is claimed.',
    nodes: ['nowjc', 'nativeRewards', 'nativeBridge', 'ethBridge', 'ethRewards', 'owToken'],
    edges: [
      { from: 'nowjc', to: 'nativeRewards', transport: TRANSPORT.LOCAL },
      { from: 'nativeRewards', to: 'nativeBridge', transport: TRANSPORT.LOCAL },
      { from: 'nativeBridge', to: 'ethBridge', transport: TRANSPORT.MESSAGE },
      { from: 'ethBridge', to: 'ethRewards', transport: TRANSPORT.LOCAL },
      { from: 'ethRewards', to: 'owToken', transport: TRANSPORT.LOCAL },
    ],
    steps: ['Accrual on payment release', 'Synchronised to Ethereum', 'ETHRewards credits the claim', 'OWORK transferred'],
  },
];

/** Flat index of every contract in the registry JSON, keyed by its id. */
export function indexContracts(registry) {
  const index = {};
  for (const chain of registry?.chains ?? []) {
    for (const contract of chain.contracts ?? []) {
      index[contract.id] = { ...contract, chainKey: chain.key, explorer: chain.explorer, chainName: chain.name };
    }
  }
  return index;
}
