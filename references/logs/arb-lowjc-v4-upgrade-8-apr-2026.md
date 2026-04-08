# ArbLOWJC v3→v4 Upgrade — April 8, 2026

## Problem

After the Mar 19, 2026 redeployment, the ArbLOWJC proxy (`0x5727cA7326032a8644a49dECECB8388BEF122bef`) had its `jobCounter` reset to `0`. The old ArbLOWJC (`0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587`) had posted 4 jobs (`42161-1` through `42161-4`) to NOWJC Genesis. Any call to `postJob()` on the new proxy would attempt `42161-1`, which Genesis rejects with `"Job exists"`.

## Root Cause

UUPS proxy redeployment resets all storage. The v3 contract had no `setJobCounter()` admin function to resync.

## Fix

Upgraded to v4 — identical to v3 with one addition:

```solidity
function setJobCounter(uint256 _counter) external onlyOwner {
    jobCounter = _counter;
}
```

Storage layout is unchanged (no new state variables), so the UUPS upgrade is safe.

## Source Files

| Version | Path |
|---------|------|
| v3 (previous) | `src/suites/current-mainnet/native/native-arb-lowjc-v3.sol` |
| v4 (current)  | `src/suites/current-mainnet/native/native-arb-lowjc-v4.sol` |

## Contract Details

| Field | Value |
|-------|-------|
| Proxy | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| Old Implementation (v3) | `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` |
| New Implementation (v4) | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` |
| Chain | Arbitrum One (42161) |
| Caller | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` (deployer) |

## Steps

1. Deploy new v4 implementation
2. Call `upgradeToAndCall()` on proxy to point to new impl
3. Call `setJobCounter(4)` to skip past existing Genesis jobs
4. Verify `getJobCount()` returns `4`
5. Test `postJob()` — should create `42161-5`

## Transactions

### 1. Deploy v4 implementation

```
Deployed to: 0x309f02301c641627A114D4E5Fb840bAA5C2809D3
Transaction hash: 0x8e257588e869fd7796cc05a63c09230056e3079d91a9f57683264336369f4eb5
```

### 2. upgradeToAndCall on proxy

```
upgradeToAndCall(0x309f02301c641627A114D4E5Fb840bAA5C2809D3, 0x)
```

### 3. setJobCounter(4)

```
setJobCounter(4)
```

## Verification

| Check | Before | After |
|-------|--------|-------|
| `getJobCount()` | `0` | `4` |
| `postJob()` | Reverts `"Job exists"` | Creates `42161-5` |
| Implementation | `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` |
