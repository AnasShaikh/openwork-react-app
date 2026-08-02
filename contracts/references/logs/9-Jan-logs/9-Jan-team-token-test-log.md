# Team Token Allocation & Claiming Test Log - 8-Jan Suite

**Date Started:** January 9, 2026
**Network:** Arbitrum Sepolia (Native Chain)
**Status:** IN PROGRESS

---

## Contract Addresses

| Contract | Proxy Address |
|----------|---------------|
| NativeRewardsContract | `0xf2E8462b4c541fe0b9db42B97990301308D7D027` |
| NativeOpenWorkJobContract (NOWJC) | `0x39158a9F92faB84561205B05223929eFF131455e` |
| NativeOpenworkDAO | `0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113` |

---

## Team Token System Overview

**How Team Tokens Work:**
- Team tokens are allocated through `NativeRewardsContract.allocateTeamTokens()`
- Tokens unlock based on governance actions: `unlocked = govActions × tokensPerAction`
- Default rate: 150,000 OW per governance action
- Team tokens count towards DAO voting power (earned + teamTokens)

**Key Functions:**
- `allocateTeamTokens(address[], uint256[])` - Owner/DAO allocates tokens
- `setTeamTokensPool(uint256)` - Owner sets max pool size
- `getTeamTokensClaimable(address)` - Check claimable amount
- `getUserTotalUnlockedTokens(address)` - Total unlocked (team + rewards)

---

## Phase 1: Initial State Check

### Step 1.1: Check Team Tokens Pool Size

```bash
source .env && cast call 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "TEAM_TOKENS_POOL()" --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```
**Result:** `0x00` = 0 (Pool not initialized - proxy didn't set default)

**Note:** The contract code has `uint256 public TEAM_TOKENS_POOL = 150_000_000 * 1e18` but since deployed via proxy, the storage was not initialized with the default value.

---

## Phase 2: Set Team Tokens Pool

### Step 2.1: Set Pool Size (150M OW)

```bash
source .env && cast send 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "setTeamTokensPool(uint256)" 150000000000000000000000000 --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x6cf8875bd8c519a80306bc1c6f8b012c6b52392c6d98951af2d7a5897c7cdae8`
**Status:** SUCCESS

---

## Phase 3: Allocate Team Tokens to WALL2

### Step 3.1: Allocate 1,000,000 OW to WALL2

```bash
source .env && cast send 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "allocateTeamTokens(address[],uint256[])" '[0xfD08836eeE6242092a9c869237a8d122275b024A]' '[1000000000000000000000000]' --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x8f46fb9212ee5924501f5881d7c69bf70662278624f8ebdb133f62eca0e905b8`
**Status:** SUCCESS

### Step 3.2: Verify Allocation

```bash
source .env && cast call 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "getTeamMemberInfo(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```
**Result:**
- isMember: true
- allocated: 1,000,000 OW (0xd3c21bcecceda1000000)
- claimed: 0
- claimable: 0 (no governance actions yet)
- govActions: 0

---

## Phase 4: Verify DAO Governance Eligibility

### Step 4.1: Check if WALL2 Can Propose

```bash
source .env && cast call 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "canPropose(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```
**Result:** `0x01` = TRUE

### Step 4.2: Get Full Governance Power

```bash
source .env && cast call 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "getUserGovernancePower(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```
**Result:** [To be checked]

---

## Phase 5: Token Unlocking (Governance Actions)

Team tokens unlock based on governance actions:
- Formula: `maxUnlocked = govActions × 150,000 OW`
- Claimable: `min(maxUnlocked, allocated) - claimed`

### Governance Action Sources:
1. DAO proposal creation
2. DAO voting
3. Job-related governance actions

### Step 5.1: Check Current Governance Actions

```bash
source .env && cast call 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "userTotalGovernanceActions(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A --rpc-url $ARBITRUM_SEPOLIA_RPC_URL
```
**Result:** [PENDING]

---

## Phase 6: Cross-Chain Sync & Claiming (Future)

**Note:** Full claiming requires:
1. ETH Sepolia deployment (MainRewards + OpenworkToken)
2. Bridge configuration between chains
3. Sync rewards data to main chain
4. Claim tokens on main chain

This will be tested in Phase 9 (Payment Testing) after full deployment.

---

## Issues & Resolutions

| # | Issue | Root Cause | Resolution | Status |
|---|-------|------------|------------|--------|
| 1 | "Exceeds team tokens pool" | Pool size is 0 or too small | Set pool with setTeamTokensPool() | Pending |

---

## DAO Thresholds Reference

| Threshold | Value | Purpose |
|-----------|-------|---------|
| proposalStakeThreshold | 100e18 | Min staked tokens to propose |
| proposalRewardThreshold | 100e18 | Min earned/team tokens to propose |
| votingStakeThreshold | 100e18 | Min staked tokens to vote |
| votingRewardThreshold | 100e18 | Min earned/team tokens to vote |

---

## Test Sessions

### Session 1 - January 9, 2026
**Actions:**
- Discovered team tokens pool needs to be set first
- Created this test log

**Next Steps:**
1. Check current TEAM_TOKENS_POOL value
2. Set pool size to 150M OW
3. Allocate 1M OW to WALL2
4. Verify DAO governance eligibility

---

*Log Created: January 9, 2026*
*Last Updated: January 9, 2026*
