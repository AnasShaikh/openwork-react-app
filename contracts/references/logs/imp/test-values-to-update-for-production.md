# Test Values to Update for Production

**Created:** January 19, 2026
**Updated:** January 19, 2026
**Purpose:** Track all hardcoded test values that need production values before mainnet deployment

---

## Quick Status Overview

### ✅ Code Changes Complete (in `mainnet-production/` folder)
All production code is ready in `src/suites/mainnet-production/`

### ⏳ On-Chain Updates Still Pending

| Contract | Chain | Action | Who | Status |
|----------|-------|--------|-----|--------|
| NativeAthena | Arbitrum | `updateVotingPeriod(10080)` | 👤 You (admin) | ⏳ PENDING |
| NativeOpenworkDAO | Arbitrum | `setVotingDelay(86400)` | 🗳️ DAO Proposal | ⏳ PENDING |
| NativeOpenworkDAO | Arbitrum | `setVotingPeriod(604800)` | 🗳️ DAO Proposal | ⏳ PENDING |

---

## Full Parameter Tracking

| Contract | Parameter | Test Value | Production Value | Code Change | On-Chain Update |
|----------|-----------|------------|------------------|-------------|-----------------|
| NativeOpenworkDAO | votingDelay | 1 min | 1 day (86400 sec) | ✅ Done | ⏳ DAO Proposal |
| NativeOpenworkDAO | votingPeriod | 5 min | 7 days (604800 sec) | ✅ Done | ⏳ DAO Proposal |
| ETHOpenworkDAO | votingDelay | 1 min | 1 day | ✅ Done | N/A (not deployed) |
| ETHOpenworkDAO | votingPeriod | 5 min | 7 days | ✅ Done | N/A (not deployed) |
| ETHOpenworkDAO | unstakeDelay | 24 hrs | 7 days | ✅ Done | N/A (not deployed) |
| ETHOpenworkDAO | stake duration | 1-3 min | 1-3 years | ✅ Done | N/A (not deployed) |
| NativeAthena | votingPeriodMinutes | 60 | 10080 | ✅ Done | ⏳ Admin Call |
| ETHRewardsContract | authorizedChains | Testnet | Mainnet | ✅ Done | N/A (not deployed) |

---

## Immediate Actions Required

### 1. NativeAthena - Admin Call (YOU CAN DO NOW)

**Contract:** `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` (Arbitrum)

```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "updateVotingPeriod(uint256)" 10080 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

### 2. NativeOpenworkDAO - DAO Proposal Required

**Contract:** `0x24af98d763724362DC920507b351cC99170a5aa4` (Arbitrum)

These require a governance proposal to pass:
- `setVotingDelay(86400)` - Set voting delay to 1 day
- `setVotingPeriod(604800)` - Set voting period to 7 days

---

## Update Method Legend

| Symbol | Meaning | Action Required |
|--------|---------|-----------------|
| ⚙️ Governance Call | Can update via `setVotingDelay()`/`setVotingPeriod()` governance proposal | Create & pass DAO proposal |
| ⚙️ Admin Call | Can update via admin function | Call function as owner/admin |
| 🔄 REDEPLOY IMPL | Hardcoded value - requires new implementation deployment | Deploy new impl + upgrade proxy |

---

## Detailed Changes Required

### 1. NativeOpenworkDAO (`native/native-openwork-dao.sol`)

**File:** `src/suites/mainnet-ready/native/native-openwork-dao.sol`
**Line:** 161-165

```solidity
// CURRENT (TEST):
__GovernorSettings_init(
    1 minutes,      // votingDelay - TEST VALUE
    5 minutes,      // votingPeriod - TEST VALUE
    100 * 10**18    // proposalThreshold - OK
);

// REQUIRED (PRODUCTION):
__GovernorSettings_init(
    1 days,         // votingDelay - 1 day
    7 days,         // votingPeriod - 7 days
    100 * 10**18    // proposalThreshold - OK
);
```

---

### 2. ETHOpenworkDAO (`eth/eth-openwork-dao.sol`)

**File:** `src/suites/mainnet-ready/eth/eth-openwork-dao.sol`

#### 2.1 Governor Settings (Line 117-121)

```solidity
// CURRENT (TEST):
__GovernorSettings_init(
    1 minutes,      // votingDelay - TEST VALUE
    5 minutes,      // votingPeriod - TEST VALUE
    100 * 10**18    // proposalThreshold - OK
);

// REQUIRED (PRODUCTION):
__GovernorSettings_init(
    1 days,         // votingDelay - 1 day
    7 days,         // votingPeriod - 7 days
    100 * 10**18    // proposalThreshold - OK
);
```

#### 2.2 Stake Duration Validation (Line 258)

```solidity
// CURRENT (TEST):
require(durationMinutes >= 1 && durationMinutes <= 3, "Duration must be 1-3 minutes");

// REQUIRED (PRODUCTION):
require(durationMinutes >= 525600 && durationMinutes <= 1576800, "Duration must be 1-3 years");
// Note: 1 year = 525600 minutes, 3 years = 1576800 minutes
```

#### 2.3 Stake Unlock Time (Line 265)

```solidity
// CURRENT (TEST):
unlockTime: block.timestamp + (durationMinutes * 60),

// REQUIRED (PRODUCTION):
unlockTime: block.timestamp + (durationMinutes * 60),
// This is OK as-is, just needs the duration validation fix above
```

---

### 3. NativeAthena (`native/native-athena.sol`)

**File:** `src/suites/mainnet-ready/native/native-athena.sol`
**Line:** 336

```solidity
// CURRENT (TEST):
votingPeriodMinutes = 60; // 1 hour default

// REQUIRED (PRODUCTION):
votingPeriodMinutes = 10080; // 7 days (configurable via admin)
```

---

### 4. ETHRewardsContract (`eth/eth-rewards-contract.sol`)

**File:** `src/suites/mainnet-ready/eth/eth-rewards-contract.sol`
**Line:** 177-186

```solidity
// CURRENT (TEST - Testnet EIDs):
function _initializeAuthorizedChains() private {
    authorizedChains[40161] = true; // ETH Sepolia
    authorizedChains[40232] = true; // OP Sepolia
    authorizedChains[40231] = true; // Arbitrum Sepolia

    chainNames[40161] = "Ethereum Sepolia";
    chainNames[40232] = "Optimism Sepolia";
    chainNames[40231] = "Arbitrum Sepolia";
}

// REQUIRED (PRODUCTION - Mainnet EIDs):
function _initializeAuthorizedChains() private {
    authorizedChains[30101] = true; // Ethereum Mainnet
    authorizedChains[30111] = true; // Optimism Mainnet
    authorizedChains[30110] = true; // Arbitrum One

    chainNames[30101] = "Ethereum Mainnet";
    chainNames[30111] = "Optimism Mainnet";
    chainNames[30110] = "Arbitrum One";
}
```

---

## LayerZero Endpoint IDs Reference

| Network | Testnet EID | Mainnet EID |
|---------|-------------|-------------|
| Ethereum | 40161 | 30101 |
| Optimism | 40232 | 30111 |
| Arbitrum | 40231 | 30110 |

---

## Time Constants Reference

| Duration | Minutes | Seconds |
|----------|---------|---------|
| 1 minute | 1 | 60 |
| 1 hour | 60 | 3600 |
| 1 day | 1440 | 86400 |
| 7 days | 10080 | 604800 |
| 1 year | 525600 | 31536000 |
| 2 years | 1051200 | 63072000 |
| 3 years | 1576800 | 94608000 |

---

## Action Items

### 🔄 Requires REDEPLOYMENT (Fix code before deploying)

| Contract | Chain | Status | Action |
|----------|-------|--------|--------|
| ETHOpenworkDAO | Ethereum | Impl deployed, proxy NOT deployed | Fix stake duration validation in code → Deploy NEW impl → Use new impl for proxy |

### ⚙️ Admin/Governance Calls (Post-deployment updates)

| Contract | Chain | Function | Value to Set | Who Can Call |
|----------|-------|----------|--------------|--------------|
| NativeOpenworkDAO | Arbitrum | `setVotingDelay(86400)` | 1 day in seconds | 🗳️ DAO Proposal only |
| NativeOpenworkDAO | Arbitrum | `setVotingPeriod(604800)` | 7 days in seconds | 🗳️ DAO Proposal only |
| NativeAthena | Arbitrum | `updateVotingPeriod(10080)` | 7 days in minutes | 👤 Admin (deployer wallet) |
| ETHRewardsContract | Ethereum | `updateAuthorizedChain(30110, true, "Arbitrum One")` | Mainnet EID | 👤 Owner (deployer wallet) |
| ETHRewardsContract | Ethereum | `updateAuthorizedChain(30111, true, "Optimism")` | Mainnet EID | 👤 Owner (deployer wallet) |
| ETHRewardsContract | Ethereum | `updateAuthorizedChain(30101, true, "Ethereum")` | Mainnet EID | 👤 Owner (deployer wallet) |

**Access Control Explained:**
- 🗳️ **DAO Proposal only** = `onlyGovernance` modifier - requires creating a proposal, voting, and execution via the DAO
- 👤 **Admin** = `require(admins[msg.sender])` - your deployer wallet is admin
- 👤 **Owner** = `onlyOwner` modifier - your deployer wallet is owner

### ⏸️ Not Yet Deployed (Update code before first deployment)

| Contract | Chain | Values to Fix |
|----------|-------|---------------|
| ETHOpenworkDAO Proxy | Ethereum | Will use governance calls after deployment |
| ETHRewardsContract | Ethereum | Can fix _initializeAuthorizedChains() OR use admin calls after |

---

## Deployment Strategy

### Already Deployed - Need Updates:
1. **NativeOpenworkDAO (Arbitrum)** → Governance proposal for voting settings
2. **NativeAthena (Arbitrum)** → Admin call for voting period

### Need Code Fix + Redeploy:
1. **ETHOpenworkDAO Implementation** → Fix stake duration → Deploy new impl → Point proxy to new impl

### Not Deployed Yet - Fix Code First:
1. **ETHRewardsContract** → Can fix code before deployment OR use admin calls after

---

## Important Notes

1. **OpenZeppelin Governor Inheritance:**
   - `setVotingDelay()` and `setVotingPeriod()` are inherited from `GovernorSettingsUpgradeable`
   - Protected by `onlyGovernance` modifier - requires DAO proposal to pass
   - Values are in SECONDS (not minutes)

2. **ETHOpenworkDAO Stake Duration:**
   - Line 258: `require(durationMinutes >= 1 && durationMinutes <= 3, ...)` is HARDCODED
   - This is the ONLY value that truly requires redeployment
   - Since proxy is NOT deployed yet, deploy new impl with fix before deploying proxy

3. **Admin Functions Available:**
   - `NativeAthena.updateVotingPeriod(uint256)` - owner only
   - `ETHRewardsContract.updateAuthorizedChain(uint32, bool, string)` - owner only
