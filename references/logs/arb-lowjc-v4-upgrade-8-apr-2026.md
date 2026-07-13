# ArbLOWJC v3→v4 Upgrade — April 8, 2026

## Problem

After the Mar 19, 2026 redeployment, the ArbLOWJC proxy (`0x5727cA7326032a8644a49dECECB8388BEF122bef`) had its `jobCounter` reset to `0`. The old ArbLOWJC (`0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587`) had posted 4 jobs (`42161-1` through `42161-4`) to NOWJC Genesis. Any call to `postJob()` on the new proxy would attempt `42161-1`, which Genesis rejects with `"Job exists"`.

## Root Cause

UUPS proxy redeployment resets all storage. The v3 contract had no `setJobCounter()` admin function to resync.

## Diagnosis

```bash
# Check current counter on new proxy — returned 0
cast call 0x5727cA7326032a8644a49dECECB8388BEF122bef "getJobCount()(uint256)" --rpc-url https://arb1.arbitrum.io/rpc

# Check old proxy counter — returned 4
cast call 0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587 "getJobCount()(uint256)" --rpc-url https://arb1.arbitrum.io/rpc

# Confirm which job IDs exist in Genesis (0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294)
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-1" --rpc-url https://arb1.arbitrum.io/rpc  # true
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-4" --rpc-url https://arb1.arbitrum.io/rpc  # true
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-5" --rpc-url https://arb1.arbitrum.io/rpc  # false
```

Jobs `42161-1` through `42161-4` exist. Counter needs to be set to `4` so next job is `42161-5`.

## Fix

Created v4 — identical to v3 with one addition:

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
| Compiler | Solidity 0.8.29, optimizer 200 runs, via-ir |

## Commands & Transactions

### 1. Deploy v4 implementation

```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY --etherscan-api-key $ARBSCAN_API_KEY "src/suites/current-mainnet/native/native-arb-lowjc-v4.sol:NativeArbOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x309f02301c641627A114D4E5Fb840bAA5C2809D3
Transaction hash: 0x8e257588e869fd7796cc05a63c09230056e3079d91a9f57683264336369f4eb5
```

**Arbiscan:** https://arbiscan.io/address/0x309f02301c641627A114D4E5Fb840bAA5C2809D3

### 2. Upgrade proxy to v4

```bash
source .env && cast send 0x5727cA7326032a8644a49dECECB8388BEF122bef "upgradeToAndCall(address,bytes)" 0x309f02301c641627A114D4E5Fb840bAA5C2809D3 0x --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Status:** Success

### 3. Set jobCounter to 4

```bash
source .env && cast send 0x5727cA7326032a8644a49dECECB8388BEF122bef "setJobCounter(uint256)" 4 --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Status:** Success

### 4. Verify implementation on Arbiscan

```bash
source .env && forge verify-contract 0x309f02301c641627A114D4E5Fb840bAA5C2809D3 \
  "src/suites/current-mainnet/native/native-arb-lowjc-v4.sol:NativeArbOpenWorkJobContract" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.29 \
  --num-of-optimizations 200 \
  --via-ir
```

**Note:** Compiler version is `0.8.29` (not `0.8.22`). Check artifact with:
```bash
cat out/native-arb-lowjc-v4.sol/NativeArbOpenWorkJobContract.json | python3 -c "import sys,json; d=json.load(sys.stdin); m=json.loads(d.get('rawMetadata','{}')); print(m.get('compiler',{}).get('version','not found'))"
```

## Post-Upgrade Verification

```bash
# Confirm jobCounter
cast call 0x5727cA7326032a8644a49dECECB8388BEF122bef "getJobCount()(uint256)" --rpc-url https://arb1.arbitrum.io/rpc
# Result: 4

# Confirm implementation slot matches new impl
cast storage 0x5727cA7326032a8644a49dECECB8388BEF122bef 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url https://arb1.arbitrum.io/rpc
# Result: 0x000000000000000000000000309f02301c641627a114d4e5fb840baa5c2809d3
```

## Test: postJob

```bash
source .env && cast send 0x5727cA7326032a8644a49dECECB8388BEF122bef \
  "postJob(string,string[],uint256[])" \
  "test-job-detail-hash" \
  "[test-milestone-1]" \
  "[1000000]" \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Result:** Success — 2 test jobs posted (`42161-5` and `42161-6`). Both confirmed in Genesis:

```bash
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-5" --rpc-url https://arb1.arbitrum.io/rpc  # true
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-6" --rpc-url https://arb1.arbitrum.io/rpc  # true
```

Final `getJobCount()` → `6`

## Test: startDirectContract

### 1. Approve USDC for ArbLOWJC

```bash
source .env && cast send 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 "approve(address,uint256)" 0x5727cA7326032a8644a49dECECB8388BEF122bef 210160 --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Status:** Success

### 2. Start direct contract (100 raw USDC, job taker on Arb domain 3)

```bash
source .env && cast send 0x5727cA7326032a8644a49dECECB8388BEF122bef \
  "startDirectContract(address,string,string[],uint256[],uint32)" \
  0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724 \
  "test-direct-contract-hash" \
  "[test-milestone-1]" \
  "[100]" \
  3 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** Success — created job `42161-7`

### 3. Verification

```bash
# Job exists in Genesis
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "42161-7" --rpc-url https://arb1.arbitrum.io/rpc
# Result: true

# Job counter incremented
cast call 0x5727cA7326032a8644a49dECECB8388BEF122bef "getJobCount()(uint256)" --rpc-url https://arb1.arbitrum.io/rpc
# Result: 7

# USDC transferred from deployer to NOWJC
cast call 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 "balanceOf(address)(uint256)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C --rpc-url https://arb1.arbitrum.io/rpc
# Result: 210060 (was 210160 — down 100)

cast call 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 "balanceOf(address)(uint256)" 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 --rpc-url https://arb1.arbitrum.io/rpc
# Result: 7117581 (NOWJC holds ~7.12 USDC including the 100 from this job)
```

**Note:** USDC approve must be run before `startDirectContract` or `startJob` — these functions call `safeTransferFrom` to lock milestone USDC into NOWJC.

---

## Summary

| Check | Before | After |
|-------|--------|-------|
| `getJobCount()` | `0` | `7` (4 synced + 2 postJob + 1 directContract) |
| `postJob()` | Reverts `"Job exists"` | Creates `42161-5`, `42161-6` |
| `startDirectContract()` | N/A | Creates `42161-7`, locks 100 USDC |
| Implementation | `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` (v3) | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` (v4) |
| Deployer USDC | `210,160` | `210,060` |

## Environment Setup

Before running any commands:

```bash
# Set deployer private key (not stored in .env for security)
export PROD_DEPLOYER_KEY=<your-private-key>

# Source .env for RPC URLs and API keys
source .env
# Provides: $ARBITRUM_MAINNET_RPC_URL, $ARBSCAN_API_KEY, $ETHERSCAN_API_KEY
```

## Key Addresses

| Contract | Address |
|----------|---------|
| ArbLOWJC Proxy | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| ArbLOWJC v4 Impl | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` |
| ArbLOWJC v3 Impl (old) | `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` |
| ArbLOWJC Old Proxy (abandoned) | `0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587` |
| NOWJC Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| Genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| Deployer | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
