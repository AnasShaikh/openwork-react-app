# Test-to-Production Values Checklist

**Created:** February 9, 2026
**Updated:** February 9, 2026
**Scope:** All files in `src/suites/current-mainnet/`
**Purpose:** Track every test/testnet value that needs updating before production redeployment

---

## Category A: Functional Code Changes (Require Redeployment)

These are actual runtime values that affect contract behavior. Changing these in code only takes effect upon deploying a new implementation.

| ID | Status | File | Line | Current (Test) | Required (Production) |
|----|--------|------|------|----------------|----------------------|
| A1 | [ ] | `eth/eth-openwork-dao.sol` | 118 | `1 minutes` (votingDelay) | `1 days` |
| A2 | [ ] | `eth/eth-openwork-dao.sol` | 119 | `5 minutes` (votingPeriod) | `7 days` |
| A3 | [ ] | `eth/eth-openwork-dao.sol` | 258 | `durationMinutes >= 1 && durationMinutes <= 3` (stake 1-3 min) | `durationMinutes >= 525600 && durationMinutes <= 1576800` (1-3 years) |
| A4 | [ ] | `eth/eth-rewards-contract.sol` | 346-350 | `getAuthorizedChains()` returns testnet EIDs (40161, 40232, 40231) | Should return mainnet EIDs (30101, 30111, 30110) |

### A1-A2: ETHOpenworkDAO Voting Settings

**File:** `src/suites/current-mainnet/eth/eth-openwork-dao.sol`
**Lines:** 117-121

```solidity
// CURRENT (TEST):
__GovernorSettings_init(
    1 minutes,      // votingDelay  <- A1
    5 minutes,      // votingPeriod <- A2
    100 * 10**18
);

// REQUIRED (PRODUCTION):
__GovernorSettings_init(
    1 days,         // votingDelay  (86400 seconds)
    7 days,         // votingPeriod (604800 seconds)
    100 * 10**18
);
```

### A3: ETHOpenworkDAO Stake Duration Validation

**File:** `src/suites/current-mainnet/eth/eth-openwork-dao.sol`
**Line:** 258

```solidity
// CURRENT (TEST):
require(durationMinutes >= 1 && durationMinutes <= 3, "Duration must be 1-3 minutes");

// REQUIRED (PRODUCTION):
require(durationMinutes >= 525600 && durationMinutes <= 1576800, "Duration must be 1-3 years");
// 525600 = 1 year in minutes, 1576800 = 3 years in minutes
```

### A4: ETHRewardsContract getAuthorizedChains() View Function

**File:** `src/suites/current-mainnet/eth/eth-rewards-contract.sol`
**Lines:** 346-350

Note: `_initializeAuthorizedChains()` (lines 177-186) is already correct with mainnet EIDs. Only the `getAuthorizedChains()` view function has stale testnet values.

```solidity
// CURRENT (TEST):
uint32[] memory commonChains = new uint32[](3);
commonChains[0] = 40161; // ETH Sepolia
commonChains[1] = 40232; // OP Sepolia
commonChains[2] = 40231; // Arbitrum Sepolia

// REQUIRED (PRODUCTION):
uint32[] memory commonChains = new uint32[](3);
commonChains[0] = 30101; // Ethereum Mainnet
commonChains[1] = 30111; // Optimism Mainnet
commonChains[2] = 30110; // Arbitrum One
```

---

## Category B: On-Chain Updates (Admin/Governance Calls)

These values are configurable on already-deployed contracts. No code change or redeployment needed - just call the function on the live contract.

| ID | Status | Contract | Chain | Function Call | Who |
|----|--------|----------|-------|---------------|-----|
| B1 | [ ] | NativeAthena `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | Arbitrum | `updateVotingPeriod(10080)` | Admin (deployer wallet) |
| B2 | [ ] | NativeOpenworkDAO `0x24af98d763724362DC920507b351cC99170a5aa4` | Arbitrum | `setVotingDelay(86400)` | DAO Proposal required |
| B3 | [ ] | NativeOpenworkDAO `0x24af98d763724362DC920507b351cC99170a5aa4` | Arbitrum | `setVotingPeriod(604800)` | DAO Proposal required |

### B1: NativeAthena Voting Period (Admin Call - Can Execute Now)

```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "updateVotingPeriod(uint256)" 10080 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

- Current value: `60` (1 hour)
- Production value: `10080` (7 days in minutes)
- Access: `admins[msg.sender]` - deployer wallet is admin

### B2-B3: NativeOpenworkDAO Voting Settings (DAO Proposal Required)

These are protected by `onlyGovernance` modifier (inherited from GovernorSettingsUpgradeable). Requires creating a governance proposal, voting, and executing.

- `setVotingDelay(86400)` - Set to 1 day (in seconds)
- `setVotingPeriod(604800)` - Set to 7 days (in seconds)
- Current deploy values: 1 minute delay, 5 minute period

**Related source file for reference:** `src/suites/current-mainnet/native/native-openwork-dao.sol` lines 162-163

---

## Category C: Comment/NatSpec Updates (Cosmetic)

These are comments/documentation strings that still reference "Sepolia" testnet names. They do not affect runtime behavior but should be corrected for accuracy. Updating in code only takes effect upon redeployment.

| ID | Status | File | Line | Current Text | Correct Text |
|----|--------|------|------|-------------|--------------|
| C1 | [ ] | `eth/eth-openwork-dao.sol` | 44 | `"ETH Sepolia"` | `"Ethereum Mainnet"` |
| C2 | [ ] | `eth/eth-lz-openwork-bridge.sol` | 19 | `"ETH Sepolia"` | `"Ethereum Mainnet"` |
| C3 | [ ] | `eth/eth-rewards-contract.sol` | 346 | `"testnet chains"` | `"mainnet chains"` |
| C4 | [ ] | `eth/eth-rewards-contract.sol` | 348 | `"ETH Sepolia"` | `"Ethereum Mainnet"` |
| C5 | [ ] | `eth/eth-rewards-contract.sol` | 349 | `"OP Sepolia"` | `"Optimism Mainnet"` |
| C6 | [ ] | `eth/eth-rewards-contract.sol` | 350 | `"Arbitrum Sepolia"` | `"Arbitrum One"` |
| C7 | [ ] | `local/local-lz-openwork-bridge.sol` | 29 | `"OP Sepolia"` | `"Optimism Mainnet"` |
| C8 | [ ] | `local/local-lz-openwork-bridge.sol` | 211 | `"ETH Sepolia"` | `"Ethereum Mainnet"` |
| C9 | [ ] | `local/local-athena.sol` | 59 | `"OP Sepolia"` | `"Optimism Mainnet"` |
| C10 | [ ] | `local/local-athena.sol` | 78 | `"Arbitrum Sepolia"` | `"Arbitrum One"` |
| C11 | [ ] | `local/local-athena.sol` | 149 | `"Arbitrum Sepolia"` | `"Arbitrum One"` |
| C12 | [ ] | `native/native-lz-openwork-bridge.sol` | 499 | `"ETH Sepolia"` | `"Ethereum Mainnet"` |
| C13 | [ ] | `native/native-athena.sol` | 1047 | `"Arbitrum Sepolia"` | `"Arbitrum One"` |

**Note:** `native/native-athena-(depr.).sol` line 1040 also has "Arbitrum Sepolia" but is a deprecated file - skip.

---

## Category D: Already Correct (No Changes Needed)

| Item | File | Lines | Value | Status |
|------|------|-------|-------|--------|
| NativeOpenworkDAO votingDelay/Period | `native/native-openwork-dao.sol` | 162-163 | `1 minutes` / `5 minutes` | Correct in code; will be overridden by B2/B3 governance calls on live contract |
| NativeAthena votingPeriodMinutes | `native/native-athena.sol` | 343 | `60` | Correct in code; will be overridden by B1 admin call on live contract |
| ETHRewardsContract _initializeAuthorizedChains() | `eth/eth-rewards-contract.sol` | 177-186 | Mainnet EIDs (30101, 30111, 30110) | Already correct |
| All LayerZero EIDs in bridge contracts | Various | Various | Configured via setPeer() at deployment | Not hardcoded in init |

**Note on NativeOpenworkDAO (D1):** The code still has test values (1 min / 5 min), but since the contract is already deployed on Arbitrum, the init values don't matter anymore. The live values will be updated via governance calls (B2/B3). If the impl is ever redeployed for another reason, updating these in code would be good practice but not functionally required.

---

## Execution Priority

| Priority | IDs | Reason |
|----------|-----|--------|
| 1 (Immediate) | B1 | Admin call, no proposal needed, can execute right now |
| 2 (Code fixes) | A1, A2, A3 | Must fix before ETHOpenworkDAO proxy deployment |
| 3 (Code fix) | A4 | Fix getAuthorizedChains() before ETHRewardsContract redeployment (if needed) |
| 4 (Governance) | B2, B3 | Requires DAO proposal - schedule when ready |
| 5 (Cosmetic) | C1-C13 | Comment updates, lowest priority, batch with any redeployment |

---

## Reference: Time Constants

| Duration | Minutes | Seconds |
|----------|---------|---------|
| 1 minute | 1 | 60 |
| 1 hour | 60 | 3,600 |
| 1 day | 1,440 | 86,400 |
| 7 days | 10,080 | 604,800 |
| 1 year | 525,600 | 31,536,000 |
| 3 years | 1,576,800 | 94,608,000 |

## Reference: LayerZero EIDs

| Network | Testnet EID | Mainnet EID |
|---------|-------------|-------------|
| Ethereum | 40161 | 30101 |
| Optimism | 40232 | 30111 |
| Arbitrum | 40231 | 30110 |

---

*This checklist was generated by scanning all 22 .sol files in `src/suites/current-mainnet/`.*
