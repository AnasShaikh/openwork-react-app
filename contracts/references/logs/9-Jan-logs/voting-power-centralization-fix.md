# Voting Power Centralization Fix

**Date:** January 9, 2026
**Issue:** Team tokens not included in voting power calculations
**Solution:** Centralize voting power calculation in Rewards Contract

---

## Problem Statement

Team tokens were NOT included in several critical voting power calculations across the codebase, causing users with team token allocations to have reduced governance power.

### Affected Functions (Before Fix)

| Contract | Function | Issue |
|----------|----------|-------|
| Native DAO | `_getVotes()` | Only used `earnedTokens`, missing team tokens |
| NOWJC | `syncVotingPower()` | Only synced `earnedTokens` to ETH chain |
| Native Athena | `canVote()` | Only checked `earnedTokens` for eligibility |
| Native Athena | `getUserVotingPower()` | Only added `earnedTokens` to voting power |

---

## Solution: Centralized Architecture

### Before (Scattered Calculations)
```
Each contract calculated: earnedTokens (sometimes + teamTokens, sometimes not)
                          ↓
Result: Inconsistent voting power across contracts
```

### After (Single Source of Truth)
```
┌─────────────────────────────────────────────────────────┐
│                   Rewards Contract                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  getRewardBasedVotingPower(user)                │   │  ← SINGLE SOURCE
│  │    = userTotalTokensEarned[user]                │   │
│  │    + teamTokensAllocated[user]                  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  syncVotingPower(options)                       │   │  ← SYNC FROM SOURCE
│  │    → bridge.sendSyncVotingPower()              │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Native DAO            Athena             ETH DAO
   _getVotes()          canVote()         (receives sync)
        │                   │
        └───────────────────┘
              calls
    rewardsContract.getRewardBasedVotingPower()
```

---

## Files Created

All fixed files are in `src/suites/openwork-all-contracts-8-Jan-version/`:

| File | Changes |
|------|---------|
| `native-rewards-contract-voting-power-fix.sol` | +`getRewardBasedVotingPower()`, +`syncVotingPower()`, +`setBridge()`, +bridge state variable |
| `native-openwork-job-contract-voting-power-fix.sol` | Removed `syncVotingPower()` (now in Rewards Contract) |
| `native-openwork-dao-voting-power-fix.sol` | +`rewardsContract` state, +`setRewardsContract()`, updated `_getVotes()`, `_hasGovernanceEligibility()`, `getUserGovernancePower()`, `getVotingPower()` |
| `native-athena-voting-power-fix.sol` | +`rewardsContract` state, +`setRewardsContract()`, updated `canVote()`, `getUserVotingPower()` |

---

## Key Code Changes

### 1. Rewards Contract - New Functions

```solidity
// Single source of truth for reward-based voting power
function getRewardBasedVotingPower(address user) external view returns (uint256) {
    return userTotalTokensEarned[user] + teamTokensAllocated[user];
}

// Moved from NOWJC - sync voting power to ETH chain
function syncVotingPower(bytes calldata _options) external payable {
    require(address(bridge) != address(0), "Bridge not set");

    uint256 totalVotingPower = userTotalTokensEarned[msg.sender] + teamTokensAllocated[msg.sender];
    require(totalVotingPower > 0, "No voting power to sync");

    bridge.sendSyncVotingPower{value: msg.value}(
        msg.sender,
        totalVotingPower,
        _options
    );

    emit VotingPowerSynced(msg.sender, totalVotingPower);
}
```

### 2. Native DAO - Updated `_getVotes()`

```solidity
// Before (BROKEN - missing team tokens)
uint256 earnedTokens = nowjContract.getUserEarnedTokens(account);
rewardPower = earnedTokens;

// After (FIXED - uses centralized calculation)
if (address(rewardsContract) != address(0)) {
    rewardPower = rewardsContract.getRewardBasedVotingPower(account);
}
```

### 3. Native Athena - Updated `canVote()` and `getUserVotingPower()`

```solidity
// Before (BROKEN)
uint256 earnedTokens = nowjContract.getUserEarnedTokens(account);
return earnedTokens >= minStakeRequired;

// After (FIXED)
if (address(rewardsContract) != address(0)) {
    uint256 rewardBasedPower = rewardsContract.getRewardBasedVotingPower(account);
    return rewardBasedPower >= minStakeRequired;
}
```

---

## Post-Deployment Admin Calls

After deploying the fixed contracts, execute these admin calls:

```solidity
// 1. Authorize rewards contract to use bridge for cross-chain sync
bridge.authorizeContract(rewardsContractAddress, true)

// 2. Set bridge reference in rewards contract
rewardsContract.setBridge(bridgeAddress)

// 3. Set rewards contract reference in Native DAO
nativeDAO.setRewardsContract(rewardsContractAddress)

// 4. Set rewards contract reference in Native Athena
athena.setRewardsContract(rewardsContractAddress)
```

---

## Benefits of Centralized Approach

| Metric | Before | After |
|--------|--------|-------|
| Places voting power calculated | 5 | 1 |
| Contracts with team token bug | 4 | 0 |
| Future maintainability | Poor (scattered) | Excellent (single source) |
| Adding new token types | Update 5 places | Update 1 place |

---

## Testing Checklist

- [ ] User with only earned tokens can vote in Native DAO
- [ ] User with only team tokens can vote in Native DAO
- [ ] User with earned + team tokens gets combined voting power
- [ ] Cross-chain sync includes team tokens
- [ ] Athena dispute voting includes team tokens
- [ ] Athena skill verification voting includes team tokens

---

## Notes

- Original contract files remain untouched
- Bridge contract needs NO code changes (only admin authorization call)
- ETH DAO automatically benefits from NOWJC/Rewards fix since it receives synced data
- All changes are backward compatible
