# Function Testing Log - 8-Jan Contract Suite

**Date:** January 9, 2026
**Network:** Arbitrum Sepolia (Native Chain)
**Suite:** `src/suites/openwork-all-contracts-8-Jan-version/`

---

## Contract Addresses

| Contract | Proxy Address |
|----------|---------------|
| NativeOpenworkGenesis | `0x00Fad82208A77232510cE16CBB63c475A914C95a` |
| NativeProfileGenesis | `0x45468344678D2Af5353fb4b5E825A21b186Fa57a` |
| NativeProfileManager | `0xbf26f05A4e14f1Cb410424AA5242993eF121c2F7` |
| NativeRewardsContract | `0xf2E8462b4c541fe0b9db42B97990301308D7D027` |
| NativeOpenWorkJobContract (NOWJC) | `0x39158a9F92faB84561205B05223929eFF131455e` |
| NativeAthenaOracleManager | `0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce` |
| NativeAthenaActivityTracker | `0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755` |
| NativeAthena | `0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f` |
| NativeOpenworkDAO | `0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113` |
| NativeLZOpenworkBridge | `0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502` |
| CCTPTransceiver | `0x959d0fc6dD8efCf764BD3B0bbaC191F2D7Dd03f1` |

---

## Testing Priority Notes

**IMPORTANT:** Thoroughly test the **admin feature** - it has been recently added to contracts:
- NOWJC admin functions
- NativeAthena admin functions
- NativeDAO admin functions
- All `setAdmin(address,bool)` patterns

---

## Pre-Test Configuration

### Additional Authorizations for Testing

**Authorize NativeDAO on OracleManager:**
```bash
cast send 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce "setAuthorizedCaller(address,bool)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 true
```
TX: `0x2ba8a8b55fb145651afea7f2b283627e9177a1ec4f622e45bc387ab8d993286f`

**Authorize NativeDAO on NOWJC:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "addAuthorizedContract(address)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113
```
TX: `0xe689a924a4bc4d9d43869d3aa89ff65b0a8b169192d08474a1d7225e998a0591`

---

## Test 1: Team Token Allocation

**Objective:** Allocate team tokens to WALL2 so it has voting power for DAO proposals

**Proposal Threshold:** 100 tokens (100e18)

### Step 1.1: Check Current Voting Power



### Step 1.2: Allocate Team Tokens



---

## Test 2: Create "General" Oracle (No Members)

**Objective:** Create a General oracle through DAO governance with empty member list

**Oracle Specs:**
- Name: "General"
- Members: [] (empty)
- Description: "General Oracle for dispute resolution"
- Hash: "QmGeneralOracleHash"
- Skill Verified: [] (empty)

### Step 2.1: Create DAO Proposal



### Step 2.2: Vote on Proposal



### Step 2.3: Execute Proposal



### Step 2.4: Verify Oracle Created



---

## Test 3: Job Cycle - Job ID 40231-111

**Objective:** Complete a mock job lifecycle iteration

### Step 3.1: Create Profile (if needed)



### Step 3.2: Post Job



### Step 3.3: Apply to Job



### Step 3.4: Start Job



### Step 3.5: Submit Work



### Step 3.6: Approve Milestone



---

## Test 4: Admin Feature Testing (PRIORITY)

**Objective:** Thoroughly test all admin functions

### Step 4.1: NOWJC Admin Functions



### Step 4.2: NativeAthena Admin Functions



### Step 4.3: NativeDAO Admin Functions



---

## Issues & Resolutions

| # | Issue | Root Cause | Resolution | Status |
|---|-------|------------|------------|--------|
| 1 | "Cannot propose" on DAO | No voting power - need team tokens | Allocate team tokens | In Progress |

---

*Log Started: January 9, 2026*
