# OpenWork Smart Contract System — Complete Reference

**Last Updated:** February 11, 2026

---

## Table of Contents

1. [Cross-Chain Architecture Overview](#1-cross-chain-architecture-overview)
2. [Contract Registry & Addresses](#2-contract-registry--addresses)
3. [Job Creation & Management](#3-job-creation--management)
4. [Direct Contracts](#4-direct-contracts)
5. [Payment System](#5-payment-system)
6. [Membership & Governance (DAO)](#6-membership--governance-dao)
7. [Oracle & Skill Verification (Athena)](#7-oracle--skill-verification-athena)
8. [Rewards System](#8-rewards-system)
9. [Profile Management](#9-profile-management)
10. [Cross-Chain Messaging (LayerZero)](#10-cross-chain-messaging-layerzero)
11. [Cross-Chain USDC Transfers (CCTP)](#11-cross-chain-usdc-transfers-cctp)
12. [Contract Upgrade Process (UUPS)](#12-contract-upgrade-process-uups)
13. [Key Constants & Configuration](#13-key-constants--configuration)
14. [Error Reference](#14-error-reference)

---

## 1. Cross-Chain Architecture Overview

OpenWork operates across three chains with distinct roles:

| Chain | Role | What Lives Here |
|-------|------|----------------|
| **Arbitrum One** | Native chain (source of truth) | NOWJC, Genesis, Rewards, Athena, Profiles, DAO mirror |
| **Optimism** | Local chain (user-facing, gas-optimized) | LOWJC Lite, LocalAthena, user transactions |
| **Ethereum** | Main chain (governance + token) | ETHOpenworkDAO, ETHRewardsContract, OWORK token |

### Data Flow Pattern

```
User on Optimism
  → LOWJC (minimal local state)
    → LayerZero message → NativeBridge on Arbitrum
      → NOWJC (full state in Genesis)
        → CCTP USDC transfer (if payment involved)
```

All business logic and state storage happens on Arbitrum. Optimism stores only what's needed for authorization checks (job giver, status, locked amounts). Ethereum handles governance and token distribution.

### Chain Identifiers

| Chain | Chain ID | LZ EID | CCTP Domain |
|-------|----------|--------|-------------|
| Arbitrum One | 42161 | 30110 | 3 |
| Optimism | 10 | 30111 | 2 |
| Ethereum | 1 | 30101 | 0 |
| Arbitrum Sepolia | 421614 | 40231 | 3 |
| Optimism Sepolia | 11155420 | 40232 | 2 |
| Ethereum Sepolia | 11155111 | 40161 | 0 |

---

## 2. Contract Registry & Addresses

### Mainnet — Arbitrum One (Native Chain)

| Contract | Proxy | Implementation | Version |
|----------|-------|----------------|---------|
| NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Jan 18 |
| NativeOpenWorkJobContract (NOWJC) | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0xe86eD7b58702f55020c8d473f7b9EA7c59bc479A` | V3 |
| NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Jan 18 |
| NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0x45747a4A5c78F8D480203d1E81b4c9c7AbaDE018` | V3 |
| NativeProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | Jan 22 |
| NativeAthenaActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | Jan 22 |
| NativeAthenaOracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | Jan 22 |
| NativeProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0xf82D59Cf9339D500C1b35C87D02dE422223812f6` | Jan 22 |

| Contract (Non-Upgradeable) | Address | Version |
|---------------------------|---------|---------|
| NativeLZOpenworkBridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | V2 |
| NativeRewardsContract | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | V2 |
| CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Jan 18 |
| NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | Jan 22 |
| NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | Jan 22 |

### Mainnet — Optimism (Local Chain)

| Contract | Proxy | Implementation | Version |
|----------|-------|----------------|---------|
| LocalOpenWorkJobContract Lite (LOWJC) | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x8255A7fa5409194bbC0c85c2Eaa71Cf2f5763Fd3` | Lite V5 |

| Contract (Non-Upgradeable) | Address | Version |
|---------------------------|---------|---------|
| LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Jan 18 |
| CCTPTransceiver | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | V2 |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` (proxy) | Jan 18 |

### Mainnet — Ethereum (Main Chain)

| Contract | Address | Type |
|----------|---------|------|
| ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` (proxy) | UUPS Proxy |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Non-Upgradeable |
| OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ERC20 |
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Non-Upgradeable |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Non-Upgradeable |

### External Dependencies

| Contract | Arbitrum | Optimism | Ethereum |
|----------|----------|----------|----------|
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | — |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` | `0x1a44076050125825900e736c501f859c50fE728c` | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` (V2) | `0xBd3fa81B58Ba92a82136038B25aDec7066af3155` |
| MessageTransmitterV2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` | `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` | `0x0a992d191deec32afe36203ad87d7d289a738f81` |

---

## 3. Job Creation & Management

### Overview

Jobs are created on the Local chain (Optimism) via LOWJC, which sends a LayerZero message to NOWJC on Arbitrum. NOWJC stores full job state in NativeOpenworkGenesis. LOWJC only stores minimal security-critical fields.

### LOWJC Job Struct (Optimism — minimal)

```solidity
struct Job {
    address jobGiver;
    JobStatus status;           // Open, InProgress, Completed, Cancelled
    uint256 currentMilestone;
    uint256 currentLockedAmount;
    uint256 totalEscrowed;
    uint256 totalReleased;
    uint256[] milestoneAmounts;
}
```

### Genesis Job Struct (Arbitrum — full state)

```solidity
struct Job {
    string id;
    address jobGiver;
    address[] applicants;
    string jobDetailHash;          // IPFS hash
    JobStatus status;
    string[] workSubmissions;
    MilestonePayment[] milestonePayments;    // Original milestones
    MilestonePayment[] finalMilestones;      // Accepted milestones
    uint256 totalPaid;
    uint256 currentMilestone;
    address selectedApplicant;
    uint256 selectedApplicationId;
    uint32 paymentTargetChainDomain;
    address paymentTargetAddress;
}
```

### Job Lifecycle

#### Step 1: Post Job (Optimism → Arbitrum)

**User calls on LOWJC (Optimism):**
```solidity
function postJob(
    string memory _jobDetailHash,      // IPFS hash of job details
    string[] memory _descriptions,      // Milestone description hashes
    uint256[] memory _amounts,          // Milestone amounts in USDC (6 decimals)
    bytes calldata _nativeOptions       // LZ gas options
) external payable
```

- Generates job ID: `"{chainId}-{++jobCounter}"` → e.g. `"30111-44"`
- Stores minimal local state (jobGiver, status=Open, milestoneAmounts)
- Sends LZ message to NOWJC with full job data
- **Cost:** ~0.0005 ETH for LZ fee (`msg.value`)

**NOWJC receives and stores in Genesis:**
```solidity
function postJob(
    string memory _jobId,
    address _jobGiver,
    string memory _jobDetailHash,
    string[] memory _descriptions,
    uint256[] memory _amounts
) external  // onlyAuthorized (bridge)
```

#### Step 2: Apply to Job (Optimism → Arbitrum)

**User calls on LOWJC:**
```solidity
function applyToJob(
    string calldata _jobId,
    string calldata _applicationHash,     // IPFS hash of application
    string[] calldata _descriptions,       // Proposed milestone descriptions
    uint256[] calldata _amounts,           // Proposed milestone amounts
    uint32 _preferredPaymentChainDomain,   // CCTP domain (2=OP, 3=Arb)
    address _preferredPaymentAddress,      // Where to receive payment
    bytes calldata _nativeOptions
) external payable
```

- Pure forwarding — no local state change
- NOWJC creates Application in Genesis, assigns applicationId

#### Step 3: Start Job (Optimism → Arbitrum)

**Job giver calls on LOWJC:**
```solidity
function startJob(
    string memory _jobId,
    uint256 _applicationId,
    bool _useApplicantMilestones,    // true = use applicant's proposed milestones
    bytes calldata _nativeOptions
) external payable nonReentrant
```

- Requires USDC approval for first milestone amount
- Calls `_sendFunds()` — transfers USDC from job giver, sends via CCTP to NOWJC on Arbitrum
- Sets `currentMilestone = 1`, `currentLockedAmount = firstMilestoneAmount`
- Sends LZ message to NOWJC which selects applicant and sets status to InProgress

#### Step 4: Submit Work (Optimism → Arbitrum)

```solidity
function submitWork(
    string calldata _jobId,
    string calldata _submissionHash,    // IPFS hash of work
    bytes calldata _nativeOptions
) external payable
```

- Pure forwarding — NOWJC stores submission in Genesis

#### Step 5: Release Payment (see Payment System section)

#### Step 6: Rate (Optimism → Arbitrum)

```solidity
function rate(
    string calldata _jobId,
    address _userToRate,
    uint256 _rating,                    // 1-5
    bytes calldata _nativeOptions
) external payable
```

---

## 4. Direct Contracts

### Overview

Direct contracts skip the posting/application/selection flow. The job giver directly creates a contract with a specific job taker, auto-starts the job, and auto-releases the first milestone.

### Function Signature (LOWJC — Optimism)

```solidity
function startDirectContract(
    address _jobTaker,
    string memory _jobDetailHash,
    string[] memory _descriptions,
    uint256[] memory _amounts,
    uint32 _jobTakerChainDomain,      // CCTP domain where taker wants payment
    bytes calldata _nativeOptions
) external payable nonReentrant
```

### Flow

1. **LOWJC on Optimism:**
   - Generates job ID (`30111-{counter}`)
   - Stores minimal local state (jobGiver, InProgress, milestoneAmounts)
   - Sets `currentMilestone = 1`
   - Calls `_sendFunds()` — sends USDC for first milestone via CCTP to NOWJC on Arbitrum
   - Sets `currentLockedAmount = firstAmount`
   - Sends LZ message with full job details + `startDirectContract` function name

2. **NOWJC on Arbitrum (via bridge):**
   - `handleStartDirectContract()` creates job in Genesis
   - Auto-creates application (applicationId = 1)
   - Selects applicant, sets status to InProgress
   - **Auto-releases milestone 1** — immediately sends USDC via CCTP to job taker's preferred chain
   - If single milestone: job is marked Completed

3. **CCTP completion:**
   - Two CCTP transfers happen:
     - OP → Arb: escrow funds (needs manual `receive()` on Arb CCTPTransceiver)
     - Arb → OP (or wherever taker wants): milestone 1 payment (needs manual `receive()` on destination)

### Multi-Milestone Direct Contract Flow

For a 2-milestone direct contract with amounts [100000, 100000]:

| Step | Action | Chain | Who |
|------|--------|-------|-----|
| 1 | `startDirectContract()` | OP | Job giver |
| 2 | CCTP receive (escrow) | Arb | Anyone |
| 3 | Auto-release milestone 1 via CCTP | Arb→OP | Automatic |
| 4 | CCTP receive (milestone 1 payment) | OP | Anyone |
| 5 | `lockNextMilestone()` | OP | Job giver |
| 6 | CCTP receive (milestone 2 escrow) | Arb | Anyone |
| 7 | `releasePaymentCrossChain()` | OP | Job giver |
| 8 | CCTP receive (milestone 2 payment) | OP/Arb | Anyone |

---

## 5. Payment System

### USDC Escrow Flow

All USDC flows through CCTP (Circle Cross-Chain Transfer Protocol V2):

1. **Lock funds:** Job giver approves USDC on Optimism, LOWJC transfers it and sends via CCTP to NOWJC on Arbitrum
2. **Hold in escrow:** NOWJC holds USDC on Arbitrum
3. **Release payment:** NOWJC sends USDC via CCTP to the job taker's preferred chain

### Internal `_sendFunds` (LOWJC)

```solidity
function _sendFunds(string memory _jobId, uint256 _amount) internal {
    usdcToken.transferFrom(msg.sender, address(this), _amount);
    bytes32 mintRecipient = bytes32(uint256(uint160(cctpMintRecipient)));
    usdcToken.approve(address(cctpSender), _amount);
    (bool success, ) = address(cctpSender).call(
        abi.encodeWithSignature(
            "sendFast(uint256,uint32,bytes32,uint256)",
            _amount, 3, mintRecipient, 1000  // maxFee=1000
        )
    );
    require(success, "CCTP send failed");
}
```

- `cctpMintRecipient` = NOWJC proxy on Arbitrum (`0x8EfbF240240613803B9c9e716d4b5AD1388aFd99`)
- `maxFee = 1000` (0.001 USDC) — may cause slow transfers if insufficient for fast path

### Lock Next Milestone (LOWJC)

```solidity
function lockNextMilestone(
    string memory _jobId,
    bytes calldata _nativeOptions
) external payable nonReentrant
```

- Requires `currentLockedAmount == 0` (previous milestone released)
- Requires USDC approval for next milestone amount
- Increments `currentMilestone`
- Calls `_sendFunds()` — CCTP to Arb
- Sends LZ message to NOWJC

### Release Payment Cross-Chain (LOWJC)

```solidity
function releasePaymentCrossChain(
    string memory _jobId,
    uint32 _targetChainDomain,
    address _targetRecipient,
    bytes calldata _nativeOptions
) external payable nonReentrant
```

- Only job giver can call
- Clears `currentLockedAmount`
- If all milestones done → status = Completed
- Sends LZ message to NOWJC which triggers CCTP transfer to recipient

### NOWJC Payment Processing (Arbitrum)

```solidity
// Internal — called when bridge delivers releasePaymentCrossChain
function releasePaymentCrossChain(
    address _jobGiver,
    string memory _jobId,
    uint256 _amount,
    uint32 _targetChainDomain,
    address _targetRecipient
) internal
```

**CCTP Fee Tolerance (V3 fix):**
```solidity
uint256 actualBalance = usdcToken.balanceOf(address(this));
if (actualBalance < _amount) {
    require(actualBalance >= (_amount * 9999) / 10000, "Insufficient balance after CCTP fees");
    effectiveAmount = actualBalance;  // Use what's available
}
```

### Commission

```solidity
uint256 public commissionPercentage = 100;  // 1% in basis points (100/10000)
uint256 public minCommission = 100;          // 0.0001 USDC minimum

function calculateCommission(uint256 amount) public view returns (uint256) {
    uint256 percentCommission = (amount * commissionPercentage) / 10000;
    return percentCommission > minCommission ? percentCommission : minCommission;
}
```

- 1% commission deducted on every payment release
- Commission accumulated in `accumulatedCommission` on NOWJC
- Withdrawable by admin to treasury

### Release Payment And Lock Next (Combined)

```solidity
// On NOWJC — releases current milestone and locks next
function releasePaymentAndLockNext(
    address _jobGiver,
    string memory _jobId,
    uint256 _releasedAmount,
    uint256 _lockedAmount
) external  // onlyAuthorized
```

- Handles both release + lock in one cross-chain operation
- If applicant's preferred chain is domain 3 (Arbitrum): direct USDC transfer
- Otherwise: sends via CCTP to applicant's preferred chain

### Dispute Resolution

```solidity
function releaseDisputedFunds(
    address _recipient,
    uint256 _amount,
    uint32 _targetChainDomain
) external  // Only Athena or DAO
```

---

## 6. Membership & Governance (DAO)

### Overview

The ETHOpenworkDAO on Ethereum implements OpenZeppelin Governor with staking-based voting power. Cross-chain voting power is synced from Arbitrum via LayerZero.

### Staking

```solidity
function stake(
    uint256 amount,
    uint256 durationYears,      // 1, 2, or 3
    bytes calldata _options      // LZ options for cross-chain sync
) external payable nonReentrant
```

| Parameter | Constraint |
|-----------|-----------|
| MIN_STAKE | 100 OWORK (100 * 10^18) |
| Duration | 1-3 years |
| Lock period | `durationYears * 365 days` |
| Voting power multiplier | `amount * durationYears` |
| One stake per user | Cannot stake again while staking |

**Unstaking (two-step):**
```solidity
function unstake(bytes calldata _options) external payable nonReentrant
```
1. First call after lock expires → sets `unstakeRequestTime`
2. Second call after `unstakeDelay` (24 hours) → returns tokens

**Slashing (governance only):**
```solidity
function removeStake(address staker, uint256 removeAmount, bytes calldata _options) external payable onlyGovernance
```

### Voting Power Sources

Total voting power = `stakeAmount * durationYears` + `userTotalRewards` (synced from Arbitrum) + `delegatedVotingPower`

### Proposals

```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
) public override returns (uint256)
```

| Parameter | Value |
|-----------|-------|
| Proposal threshold | 100 OWORK |
| Voting threshold | 50 OWORK |
| Voting delay | 1 day (production) |
| Voting period | 7 days (production) |
| Quorum | 50 OWORK |

### Delegation

```solidity
function delegate(address delegatee) external
```

- Delegator's voting power added to delegatee
- Only works if delegator has an active stake

### Cross-Chain Governance Actions

When a user proposes or votes, the DAO sends a LZ message to Arbitrum:
```
ETHOpenworkDAO → ETHLZOpenworkBridge → [LZ] → NativeBridge → NOWJC.incrementGovernanceAction(user)
```
This increments the user's governance action count, which unlocks earned OWORK tokens.

---

## 7. Oracle & Skill Verification (Athena)

### Overview

NativeAthena on Arbitrum is the core oracle system. It manages:
- Skill verification applications
- Job disputes
- "Ask Athena" general queries
- Fee collection and distribution

LocalAthena on Optimism is a lightweight client that forwards requests and receives finalized results.

### NativeAthena Key Functions

```solidity
// Dispute management
function raiseDispute(address _disputeRaiser, string memory _jobId, string memory _disputeHash, uint256 _disputeFee) external

function voteOnDispute(
    address _voter,
    string memory _disputeId,
    bool _voteFor,
    address _claimAddress,
    uint32 _claimChainDomain
) external

function finalizeDispute(string memory _disputeId) external

// Skill verification
function submitSkillVerification(address _applicant, string memory _applicationHash, uint256 _feeAmount, string memory _targetOracleName) external

function voteOnSkillVerification(address _voter, uint256 _applicationId, bool _voteFor, address _claimAddress, uint32 _claimChainDomain) external

function finalizeSkillVerification(uint256 _applicationId) external

// Ask Athena
function askAthena(address _applicant, string memory _description, string memory _hash, string memory _targetOracle, string memory _fees) external

function voteOnAskAthena(address _voter, uint256 _athenaId, bool _voteFor, address _claimAddress, uint32 _claimChainDomain) external

function finalizeAskAthena(uint256 _athenaId) external
```

### Voting Eligibility

```solidity
function canVote(address _voter) public view returns (bool)
```
Returns true if voter has:
- Reward-based voting power > 0 (from NativeRewardsContract), OR
- Active stake (from NativeDAO via Genesis), OR
- Team token allocation > 0

### Dispute Flow

1. User calls `raiseDispute()` on LocalAthena (OP) — pays USDC fee
2. Fee sent via CCTP to NativeAthena on Arb
3. Oracle members vote (`voteOnDispute()`)
4. After voting period, anyone calls `finalizeDispute()`
5. Result sent back to LocalAthena via LZ (`finalizeDisputeWithVotes`)
6. Winner receives disputed funds via NOWJC's `releaseDisputedFunds()`

### Oracle Management (NativeAthenaOracleManager)

```solidity
function addSingleOracle(
    string memory _name,
    address[] memory _members,
    string memory _shortDescription,
    string memory _hashOfDetails,
    address[] memory _skillVerifiedAddresses
) external

function addMembers(address[] memory _members, string memory _oracleName) external
function removeMemberFromOracle(string memory _oracleName, address _memberToRemove) external
```

### Activity Tracking (NativeAthenaActivityTracker)

- Tracks `memberLastActivity` timestamps
- 90-day activity threshold for oracle active status
- Activity updated when members vote or perform oracle actions

---

## 8. Rewards System

### Overview

NativeRewardsContract on Arbitrum tracks OWORK token earnings. Tokens are earned through job payments and unlocked through governance participation. Actual OWORK tokens live on Ethereum and are claimed via ETHRewardsContract.

### Band-Based Earning

20 reward bands, doubling in range:

| Band | Platform Revenue Range | OW per USDC | OW per Gov Action |
|------|----------------------|-------------|-------------------|
| 0 | $0 - $100K | 300 | 10,000 |
| 1 | $100K - $200K | 300 | 5,000 |
| 2 | $200K - $400K | 150 | 2,500 |
| ... | ... (halving) | ... | ... |
| 19 | ~$26B - $52B | minimal | minimal |

### Earning Flow

```
Job payment on NOWJC
  → NOWJC._processRewardsForPayment(jobGiver, jobId, netAmount)
    → rewardsContract.processJobPayment(jobGiver, jobTaker, amount, newPlatformTotal)
      → Calculates tokens for job giver, job taker
      → 10% referrer bonus (each side's referrer)
      → Stores in userBandRewards[]
```

### Token Unlocking

Earned tokens are NOT immediately claimable. They unlock through governance actions:

```
User votes on DAO proposal
  → ETHOpenworkDAO → LZ message → NOWJC.incrementGovernanceAction(user)
    → rewardsContract.recordGovernanceAction(user)
      → Unlocks tokensPerGovernanceAction per band
```

Claimable = min(tokensEarned, tokensUnlockedByGovernance) - tokensClaimed

### Claiming Flow

1. User syncs rewards: `NOWJC.syncRewardsData()` → LZ → `ETHRewardsContract.handleSyncClaimableRewards()`
2. User claims on Ethereum: `ETHRewardsContract.claimRewards()`
3. Claim confirmation sent back: LZ → `NOWJC.handleUpdateUserClaimData()`

### Voting Power

```solidity
function getRewardBasedVotingPower(address user) external view returns (uint256)
// Returns: userTotalTokensEarned + teamTokensAllocated
```

Synced to ETH DAO via: `syncVotingPower()` → LZ → `ETHOpenworkDAO.handleSyncVotingPower()`

### Team Tokens

- 150M OWORK pool for team members
- Allocated by owner/DAO: `allocateTeamTokens(members[], amounts[])`
- Unlock rate: 150K tokens per governance action (default)
- Team allocation counts toward voting power immediately

### OWORK Token (Ethereum)

```solidity
// ERC20 + ERC20Permit + ERC20Votes + Ownable
string name = "OpenWorkToken"
string symbol = "OWORK"
uint256 INITIAL_SUPPLY = 1_000_000_000 * 10**18  // 1 billion
```

Distribution: 750M (75%) to ETHRewardsContract, 250M (25%) to ETHOpenworkDAO

---

## 9. Profile Management

### Overview

Profiles are created on the Local chain (Optimism) and stored on Arbitrum in NativeProfileGenesis. The NativeProfileManager handles logic; NativeProfileGenesis is pure storage.

### Create Profile (LOWJC — Optimism)

```solidity
function createProfile(
    string calldata _ipfsHash,
    address _referrerAddress,
    bytes calldata _nativeOptions
) external payable
```

Flow: LOWJC → LZ → NativeBridge → NativeProfileManager → NativeProfileGenesis

### Profile Data Structure

```solidity
struct Profile {
    address userAddress;
    string ipfsHash;           // IPFS hash of profile data
    address referrerAddress;
    string[] portfolioHashes;
}
```

### Other Profile Functions

```solidity
function updateProfile(string calldata _newIpfsHash, bytes calldata _nativeOptions) external payable
function addPortfolio(string calldata _portfolioHash, bytes calldata _nativeOptions) external payable
```

### Rating System

```solidity
// On NativeProfileManager
function rate(address _rater, string memory _jobId, address _userToRate, uint256 _rating) external
// _rating must be 1-5
// Only job giver can rate applicant and vice versa
```

---

## 10. Cross-Chain Messaging (LayerZero)

### Bridge Contracts

| Chain | Bridge | Address |
|-------|--------|---------|
| Arbitrum | NativeLZOpenworkBridge V2 | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Optimism | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| Ethereum | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |

### Message Types (Local → Native)

| Function Name | Source | Destination Handler |
|--------------|--------|-------------------|
| `postJob` | LOWJC | NOWJC.postJob() |
| `applyToJob` | LOWJC | NOWJC.applyToJob() |
| `startJob` | LOWJC | NOWJC.startJob() |
| `submitWork` | LOWJC | NOWJC.submitWork() |
| `releasePaymentCrossChain` | LOWJC | NOWJC.handleReleasePaymentCrossChain() |
| `lockNextMilestone` | LOWJC | NOWJC.lockNextMilestone() |
| `releaseAndLockNext` | LOWJC | NOWJC.releasePaymentAndLockNext() |
| `startDirectContract` | LOWJC | NOWJC.handleStartDirectContract() |
| `createProfile` | LOWJC | ProfileManager.createProfile() |
| `raiseDispute` | LocalAthena | NativeAthena.raiseDispute() |

### Message Types (Native → Local)

| Function Name | Source | Destination Handler |
|--------------|--------|-------------------|
| `finalizeDisputeWithVotes` | NativeAthena | LocalAthena.handleFinalizeDisputeWithVotes() |
| `upgradeFromDAO` | ETH DAO (via ETHBridge) | target.upgradeFromDAO() |

### Message Types (Native ↔ ETH)

| Direction | Function | Purpose |
|-----------|----------|---------|
| Arb → ETH | `syncVotingPower` | Sync user voting power to DAO |
| Arb → ETH | `syncClaimableRewards` | Sync claimable balance |
| ETH → Arb | `incrementGovernanceAction` | Record DAO votes/proposals |
| ETH → Arb | `updateUserClaimData` | Mark tokens as claimed |
| ETH → Arb | `updateStakeData` | Sync stake info |
| ETH → Any | `upgradeFromDAO` | Cross-chain contract upgrade |

### LZ Options Format

The `_nativeOptions` parameter encodes gas for destination execution:
```
0x0003010011010000000000000000000000000007a120
```
This encodes 500,000 gas (`0x07a120` = 500000).

### Fee Estimation

```solidity
// On LocalBridge
function quoteNativeChain(bytes calldata _payload, bytes calldata _options) external view returns (uint256 fee)
```

Typical LZ fee: ~0.0003-0.0005 ETH.

### Peer Configuration

Bridges must have peers configured on each end:
```solidity
function setPeer(uint32 _eid, bytes32 _peer) external onlyOwner
// _peer = bytes32(uint256(uint160(bridgeAddressOnRemoteChain)))
```

---

## 11. Cross-Chain USDC Transfers (CCTP)

### CCTPTransceiver

Deployed on each chain that sends/receives USDC cross-chain.

### Sending (sendFast)

```solidity
function sendFast(
    uint256 amount,
    uint32 destinationDomain,    // 0=ETH, 2=OP, 3=Arb
    bytes32 mintRecipient,       // bytes32(uint256(uint160(address)))
    uint256 maxFee               // Max fee willing to pay (in USDC units)
) external
```

1. Transfers USDC from caller via `transferFrom`
2. Approves TokenMessengerV2
3. Calls `depositForBurn()` with `minFinalityThreshold = 1000`

### Receiving

```solidity
function receive(
    bytes calldata message,       // CCTP message from source chain
    bytes calldata attestation    // Circle's attestation signature
) external nonReentrant
```

- Message and attestation obtained from Circle's API
- Replay-protected via `processedMessages` mapping

### Circle Attestation API

```
GET https://iris-api.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}
```

- Domain 2 = Optimism, Domain 3 = Arbitrum
- Status progression: `pending_confirmations` → `complete`
- `delayReason: "insufficient_fee"` means maxFee too low for fast transfer

### maxFee Considerations

- Current contracts hardcode `maxFee = 1000` (0.001 USDC)
- Fast transfers require sufficient fee for market makers
- If fee insufficient: falls back to standard finality (~15-20 min)
- Actual fees observed: ~13 units on 100,000 USDC transfer

### CCTP Fee Tolerance (NOWJC V3)

When NOWJC receives funds via CCTP, the actual balance may be slightly less than expected due to fees:
```solidity
require(actualBalance >= (_amount * 9999) / 10000, "Insufficient balance after CCTP fees");
effectiveAmount = min(actualBalance, _amount);
```
Tolerance: 0.01% (1 basis point).

---

## 12. Contract Upgrade Process (UUPS)

### Pattern

All upgradeable contracts use OpenZeppelin's UUPS proxy pattern:
- State lives in the proxy contract
- Logic lives in the implementation contract
- Implementation slot: `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`

### Upgrade Command

```solidity
// On the proxy address
function upgradeToAndCall(address newImplementation, bytes memory data) external
// data = 0x for no re-initialization
```

### Remote Upgrade (DAO-controlled)

```solidity
// On ETH DAO
function upgradeContract(
    uint32 targetChainId,          // LZ EID of target chain
    address targetProxy,
    address newImplementation,
    bytes calldata _options
) external payable  // admins only
```

Sends LZ message: `upgradeFromDAO(targetProxy, newImplementation)` to destination bridge.

### Verify Current Implementation

```bash
cast storage <PROXY_ADDRESS> 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url <RPC_URL>
```

### Critical Deployment Notes

- **Always use atomic initialization** when deploying proxies:
  ```bash
  forge create UUPSProxy --constructor-args <IMPL> $(cast calldata "initialize(...)" args...)
  ```
- Deploying with `0x` as init data can cause implementation slot corruption
- After upgrade, verify the implementation slot matches expected address

---

## 13. Key Constants & Configuration

### Commission

| Parameter | Value | Location |
|-----------|-------|----------|
| Commission percentage | 100 (1%) | NOWJC |
| Min commission | 100 (0.0001 USDC) | NOWJC |
| Max commission | 1000 (10%) | NOWJC `setCommissionPercentage` cap |

### CCTP

| Parameter | Value |
|-----------|-------|
| maxFee (hardcoded) | 1000 (0.001 USDC) |
| minFinalityThreshold | 1000 |
| Fee tolerance | 0.01% (9999/10000) |

### Governance (ETHOpenworkDAO)

| Parameter | Test Value | Production Value |
|-----------|-----------|-----------------|
| Voting delay | 1 minute | 1 day |
| Voting period | 5 minutes | 7 days |
| Unstake delay | 24 hours | 7 days |
| Stake duration | 1-3 minutes | 1-3 years |
| MIN_STAKE | 100 OWORK | 100 OWORK |
| Proposal threshold | 100 OWORK | 100 OWORK |
| Voting threshold | 50 OWORK | 50 OWORK |
| Quorum | 50 OWORK | 50 OWORK |

### Rewards

| Parameter | Value |
|-----------|-------|
| Reward bands | 20 |
| Band 0 rate | 300 OW per USDC |
| Band 0 gov unlock | 10,000 OW per action |
| Team token pool | 150,000,000 OWORK |
| Team tokens per gov action | 150,000 OWORK |
| Referrer bonus | 10% of earned tokens |

### Token Supply

| Allocation | Amount |
|-----------|--------|
| ETHRewardsContract | 750,000,000 OWORK (75%) |
| ETHOpenworkDAO | 250,000,000 OWORK (25%) |
| Total supply | 1,000,000,000 OWORK |

### LayerZero Gas Options

| Operation | Recommended Gas | Options Hex |
|-----------|----------------|-------------|
| Standard job operation | 500,000 | `0x0003010011010000000000000000000000000007a120` |
| Typical LZ fee | ~0.0003-0.0005 ETH | — |

### Deployer Address

All contracts deployed by: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

---

## 14. Error Reference

### LOWJC (Optimism)

| Error | Cause |
|-------|-------|
| "Not job giver" | Caller is not the job's creator |
| "Not in progress" | Job status is not InProgress |
| "No funds locked" | currentLockedAmount is 0 |
| "Previous not released" | Must release before locking next |
| "All complete" | All milestones already done |
| "CCTP send failed" | CCTPTransceiver.sendFast() failed |

### NOWJC (Arbitrum)

| Error | Cause |
|-------|-------|
| "Auth" | Caller not in authorizedContracts |
| "Insufficient balance after CCTP fees" | USDC balance < 99.99% of expected |
| "Transceiver not set" | cctpTransceiver address is zero |
| "Invalid recipient" | Target recipient is zero address |
| "No applicant" | Job has no selected applicant |
| "Job not in progress" | Job status != InProgress |
| "Amount insufficient for commission" | Payment too small to cover commission |
| "Invalid milestone" | currentMilestone out of range |
| "All completed" | No more milestones to lock |

### ETHOpenworkDAO (Ethereum)

| Error | Cause |
|-------|-------|
| "Minimum stake is 100 tokens" | Stake amount < 100 OWORK |
| "Already staking" | User already has active stake |
| "Stake still locked" | Lock period hasn't elapsed |
| "Unstake delay not met" | 24h delay not passed |
| "No stake found" | User has no stake |
| "Already delegated to this address" | Redundant delegation |

### CCTP

| Status | Meaning |
|--------|---------|
| `pending_confirmations` | Waiting for source chain finality |
| `complete` | Attestation ready, can call receive() |
| `delayReason: "insufficient_fee"` | maxFee too low for fast path, using slow path |

---

## Appendix: Common Agent Operations

### Check CCTP Transfer Status

```bash
curl -s "https://iris-api.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}" | jq '.'
# sourceDomain: 2=Optimism, 3=Arbitrum
```

### Complete CCTP Receive

```bash
cast send <CCTPTransceiver> "receive(bytes,bytes)" <message> <attestation> --rpc-url <RPC> --private-key <KEY>
```

### Check Job State on LOWJC

```bash
cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 "jobCounter()(uint256)" --rpc-url $OPTIMISM_MAINNET_RPC_URL
```

### Check NOWJC USDC Balance

```bash
cast call 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 "balanceOf(address)(uint256)" 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

### Check LZ Delivery Status

```bash
curl -s "https://scan.layerzero-api.com/v1/messages/tx/{txHash}" | jq '.'
```

### Verify Proxy Implementation

```bash
cast storage <PROXY> 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url <RPC>
```
