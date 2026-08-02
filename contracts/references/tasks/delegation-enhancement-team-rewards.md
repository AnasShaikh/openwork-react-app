# Task: Enable Delegation for Team Tokens and Reward Tokens

**Created:** January 19, 2026
**Priority:** Enhancement
**Approach:** Independent delegation per chain (no cross-chain sync)

---

## Problem Statement

Currently, only **staked tokens** can delegate voting power. Users with voting power from team token allocations or earned rewards cannot delegate.

---

## Changes Required

### Contract 1: NativeOpenworkDAO (Arbitrum)

**File:** `src/suites/mainnet-production/native/native-openwork-dao.sol`

#### 1.1 Add Storage Variable (before `__gap`)

```solidity
// Track power delegated away by each user
mapping(address => uint256) public powerDelegatedAway;
```

#### 1.2 Add Helper Functions

```solidity
function _getStakePower(address account) internal view returns (uint256) {
    IOpenworkGenesis.Stake memory userStake = genesis.getStake(account);
    if (userStake.isActive && userStake.amount > 0) {
        return userStake.amount * userStake.durationMinutes;
    }
    return 0;
}

function _getRewardPower(address account) internal view returns (uint256) {
    if (address(rewardsContract) != address(0)) {
        return rewardsContract.getRewardBasedVotingPower(account);
    }
    return 0;
}

function _getOwnPower(address account) internal view returns (uint256) {
    return _getStakePower(account) + _getRewardPower(account);
}
```

#### 1.3 Replace `delegate()` Function (lines 367-386)

```solidity
function delegate(address delegatee) external {
    address currentDelegate = genesis.getDelegate(msg.sender);
    require(delegatee != currentDelegate, "Already delegated");

    uint256 totalOwnPower = _getOwnPower(msg.sender);
    require(totalOwnPower > 0 || currentDelegate != address(0), "No voting power");

    uint256 previouslyDelegated = powerDelegatedAway[msg.sender];

    // Remove from previous delegate
    if (currentDelegate != address(0) && previouslyDelegated > 0) {
        genesis.updateDelegatedVotingPower(currentDelegate, previouslyDelegated, false);
    }

    // Add to new delegate
    if (delegatee != address(0) && totalOwnPower > 0) {
        genesis.updateDelegatedVotingPower(delegatee, totalOwnPower, true);
        powerDelegatedAway[msg.sender] = totalOwnPower;
    } else {
        powerDelegatedAway[msg.sender] = 0;
    }

    genesis.setDelegate(msg.sender, delegatee);
    emit DelegateChanged(msg.sender, currentDelegate, delegatee);
}
```

#### 1.4 Replace `_getVotes()` Function (lines 455-470)

```solidity
function _getVotes(address account, uint256, bytes memory) internal view override returns (uint256) {
    uint256 ownPower = _getOwnPower(account);
    uint256 delegatedToMe = genesis.getDelegatedVotingPower(account);
    uint256 delegatedAway = powerDelegatedAway[account];

    uint256 netOwn = ownPower > delegatedAway ? ownPower - delegatedAway : 0;
    return netOwn + delegatedToMe;
}
```

#### 1.5 Add `undelegate()` Convenience Function

```solidity
function undelegate() external {
    delegate(address(0));
}
```

---

### Contract 2: ETHOpenworkDAO (Ethereum)

**File:** `src/suites/mainnet-production/eth/eth-openwork-dao.sol`

#### 2.1 Add Storage Variable (before `__gap`, after line ~86)

```solidity
mapping(address => uint256) public powerDelegatedAway;
```

#### 2.2 Add Helper Functions

```solidity
function _getStakePower(address account) internal view returns (uint256) {
    Stake memory userStake = stakes[account];
    return userStake.amount > 0 ? userStake.amount * userStake.durationYears : 0;
}

function _getRewardPower(address account) internal view returns (uint256) {
    return userTotalRewards[account];
}

function _getOwnPower(address account) internal view returns (uint256) {
    return _getStakePower(account) + _getRewardPower(account);
}
```

#### 2.3 Replace `delegate()` Function (lines 341-359)

```solidity
function delegate(address delegatee) external {
    address currentDelegate = delegates[msg.sender];
    require(delegatee != currentDelegate, "Already delegated");

    uint256 totalOwnPower = _getOwnPower(msg.sender);
    require(totalOwnPower > 0 || currentDelegate != address(0), "No voting power");

    uint256 previouslyDelegated = powerDelegatedAway[msg.sender];

    if (currentDelegate != address(0) && previouslyDelegated > 0) {
        delegatedVotingPower[currentDelegate] -= previouslyDelegated;
    }

    if (delegatee != address(0) && totalOwnPower > 0) {
        delegatedVotingPower[delegatee] += totalOwnPower;
        powerDelegatedAway[msg.sender] = totalOwnPower;
    } else {
        powerDelegatedAway[msg.sender] = 0;
    }

    delegates[msg.sender] = delegatee;
    emit DelegateChanged(msg.sender, currentDelegate, delegatee);
}
```

#### 2.4 Replace `_getVotes()` Function (lines 435-447)

```solidity
function _getVotes(address account, uint256, bytes memory) internal view override returns (uint256) {
    uint256 ownPower = _getOwnPower(account);
    uint256 delegatedToMe = delegatedVotingPower[account];
    uint256 delegatedAway = powerDelegatedAway[account];

    uint256 netOwn = ownPower > delegatedAway ? ownPower - delegatedAway : 0;
    return netOwn + delegatedToMe;
}
```

#### 2.5 Add `undelegate()` Function

```solidity
function undelegate() external {
    delegate(address(0));
}
```

---

## Summary

| Contract | Changes |
|----------|---------|
| NativeOpenworkDAO | Add `powerDelegatedAway` + helpers + rewrite `delegate()` + fix `_getVotes()` |
| ETHOpenworkDAO | Add `powerDelegatedAway` + helpers + rewrite `delegate()` + fix `_getVotes()` |
| OpenworkGenesis | ❌ No changes |
| NativeRewardsContract | ❌ No changes |

---

## Deployment

1. Deploy new NativeOpenworkDAO implementation → DAO proposal to upgrade
2. Deploy new ETHOpenworkDAO implementation → Owner upgrades (proxy not live yet)

---

## Notes

- Delegation is **independent per chain** (no cross-chain sync)
- User must delegate separately on each chain where they have voting power
- Fixes existing bug where delegated power was duplicated
