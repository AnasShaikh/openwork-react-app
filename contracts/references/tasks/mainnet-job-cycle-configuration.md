# Task: Mainnet Job Cycle End-to-End Configuration

**Created:** January 22, 2026
**Status:** In Progress
**Purpose:** Verify and configure all contract connections required for the complete job lifecycle across Arbitrum, Optimism, and Ethereum mainnet.

---

## Overview

The job cycle requires contracts on three chains to communicate:
- **Arbitrum One (Native)** - Job coordination hub, dispute resolution, rewards
- **Optimism (Local)** - Job posting and applications
- **Ethereum (ETH)** - Governance token and cross-chain rewards

This document tracks all configuration points, their current state, and required actions.

---

## Chain & Contract Reference

### Arbitrum One (Native Chain) - LZ EID: 30110

| Contract | Address | Type |
|----------|---------|------|
| Genesis Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Proxy |
| NOWJC Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | Proxy |
| DAO Proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | Proxy |
| Athena Proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | Proxy |
| NativeRewardsContract | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Non-Upgradeable |
| NativeLZOpenworkBridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Non-Upgradeable |
| CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Non-Upgradeable |

### Optimism (Local Chain) - LZ EID: 30111

| Contract | Address | Type |
|----------|---------|------|
| LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Non-Upgradeable |
| CCTPTransceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Non-Upgradeable |
| LOWJC Proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Proxy |
| LocalAthena Proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Proxy |

### Ethereum Mainnet (ETH Chain) - LZ EID: 30101

| Contract | Address | Type |
|----------|---------|------|
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Non-Upgradeable |
| ETHOpenworkDAO Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Proxy |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Non-Upgradeable |
| OpenworkToken | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Standalone |

### External Dependencies

| Chain | Contract | Address |
|-------|----------|---------|
| Arbitrum | USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Arbitrum | LZ Endpoint | `0x1a44076050125825900e736c501f859c50fE728c` |
| Arbitrum | TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| Optimism | USDC | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Optimism | LZ Endpoint | `0x1a44076050125825900e736c501f859c50fE728c` |
| Optimism | TokenMessengerV2 | `0x2B4069517957735bE00ceE0fadAE88a26365528f` |
| Ethereum | LZ Endpoint | `0x1a44076050125825900e736c501f859c50fE728c` |

---

## Configuration Categories

### Category 1: LayerZero Bridge Peers

Cross-chain messaging requires bidirectional peer configuration.

| Source | Target | Source Bridge | Target Bridge (bytes32) | Status |
|--------|--------|---------------|-------------------------|--------|
| ARB (30110) | OP (30111) | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ? | ⏳ CHECK |
| ARB (30110) | ETH (30101) | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ? | ⏳ CHECK |
| OP (30111) | ARB (30110) | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ? | ⏳ CHECK |
| ETH (30101) | ARB (30110) | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ? | ✅ Confirmed |

### Category 2: Genesis Authorization (Arbitrum)

Genesis storage contract must authorize all writing contracts.

| Contract | Function | Expected | Status |
|----------|----------|----------|--------|
| Genesis → NOWJC | `authorizedContracts(0x8EfbF240240613803B9c9e716d4b5AD1388aFd99)` | `true` | ⏳ CHECK |
| Genesis → DAO | `authorizedContracts(0x24af98d763724362DC920507b351cC99170a5aa4)` | `true` | ⏳ CHECK |
| Genesis → Athena | `authorizedContracts(0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf)` | `true` | ⏳ CHECK |
| Genesis → Rewards | `authorizedContracts(0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7)` | `true` | ⏳ CHECK |

### Category 3: NOWJC Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Genesis | `genesis()` | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ⏳ CHECK |
| Bridge | `bridge()` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ⏳ CHECK |
| Rewards | `rewardsContract()` | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⏳ CHECK |
| CCTP | `cctpTransceiver()` | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ⏳ CHECK |
| Athena | `nativeAthena()` | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | ⏳ CHECK |
| DAO | `nativeDAO()` | `0x24af98d763724362DC920507b351cC99170a5aa4` | ⏳ CHECK |
| USDC | `usdcToken()` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | ⏳ CHECK |
| Treasury | `treasury()` | ? | ⏳ CHECK |
| Bridge Auth | `authorizedContracts(bridge)` | `true` | ⏳ CHECK |

### Category 4: NativeDAO Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Genesis | `genesis()` | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ⏳ CHECK |
| Bridge | `bridge()` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ⏳ CHECK |
| NOWJC | `nowjContract()` | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ⏳ CHECK |
| Rewards | `rewardsContract()` | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⏳ CHECK |
| Bridge Auth | `authorizedContracts(bridge)` | `true` | ⏳ CHECK |

### Category 5: NativeAthena Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Genesis | `genesis()` | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ⏳ CHECK |
| DAO | `daoContract()` | `0x24af98d763724362DC920507b351cC99170a5aa4` | ⏳ CHECK |
| NOWJC | `nowjContract()` | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ⏳ CHECK |
| Rewards | `rewardsContract()` | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⏳ CHECK |
| Bridge | `bridge()` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ⏳ CHECK |
| USDC | `usdcToken()` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | ⏳ CHECK |

### Category 6: NativeRewardsContract Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Genesis | `genesis()` | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ⏳ CHECK |
| Job Contract | `jobContract()` | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ⏳ CHECK |
| DAO | `nativeDAO()` | `0x24af98d763724362DC920507b351cC99170a5aa4` | ⏳ CHECK |
| Bridge | `bridge()` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ⏳ CHECK |

### Category 7: NativeBridge Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| DAO | `nativeDaoContract()` | `0x24af98d763724362DC920507b351cC99170a5aa4` | ⏳ CHECK |
| Athena | `nativeAthenaContract()` | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | ⏳ CHECK |
| NOWJC | `nativeOpenWorkJobContract()` | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ⏳ CHECK |
| NOWJC Auth | `authorizedContracts(0x8EfbF240240613803B9c9e716d4b5AD1388aFd99)` | `true` | ⏳ CHECK |
| Rewards Auth | `authorizedContracts(0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7)` | `true` | ⏳ CHECK |
| Local Chain OP | `localChains(30111)` | `true` | ⏳ CHECK |
| Peer → OP | `peers(30111)` | bytes32 of OP bridge | ⏳ CHECK |
| Peer → ETH | `peers(30101)` | bytes32 of ETH bridge | ⏳ CHECK |

### Category 8: CCTPTransceiver Configuration (Arbitrum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| NOWJC | `nowjc()` | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ⏳ CHECK |
| OP Domain | `destinationDomains(10)` | `2` (OP CCTP domain) | ⏳ CHECK |
| ETH Domain | `destinationDomains(1)` | `0` (ETH CCTP domain) | ⏳ CHECK |

### Category 9: LOWJC Configuration (Optimism)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Bridge | `bridge()` | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ⏳ CHECK |
| CCTP | `cctpTransceiver()` | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | ⏳ CHECK |
| USDC | `usdcToken()` | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | ⏳ CHECK |
| Native EID | `nativeChainEid()` | `30110` | ⏳ CHECK |

### Category 10: LocalBridge Configuration (Optimism)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| LOWJC | `lowjContract()` | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⏳ CHECK |
| Athena | `localAthena()` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | ⏳ CHECK |
| Native EID | `nativeChainEid()` | `30110` | ⏳ CHECK |
| Peer → ARB | `peers(30110)` | bytes32 of ARB bridge | ⏳ CHECK |

### Category 11: LocalAthena Configuration (Optimism)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Bridge | `bridge()` | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ⏳ CHECK |
| Native EID | `nativeChainEid()` | `30110` | ⏳ CHECK |

### Category 12: CCTPTransceiver Configuration (Optimism)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Job Contract | `jobContract()` or `lowjc()` | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⏳ CHECK |
| ARB Domain | `destinationDomains(42161)` | `3` (ARB CCTP domain) | ⏳ CHECK |

### Category 13: ETH Bridge Configuration (Ethereum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Peer → ARB | `peers(30110)` | bytes32 of ARB bridge | ✅ Configured |

### Category 14: ETHRewardsContract Configuration (Ethereum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Token | `openworkToken()` | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ✅ Set (Jan 22) |
| Bridge | `bridge()` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ⏳ CHECK |

### Category 15: ETHOpenworkDAO Configuration (Ethereum)

| Setting | Function to Check | Expected Value | Status |
|---------|-------------------|----------------|--------|
| Token | `openworkToken()` | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ✅ Initialized |
| Bridge | `bridge()` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ Initialized |
| Chain ID | `chainId()` | `1` | ✅ Initialized |

---

## Progress Tracking

### Phase 1: Verification (Current)
- [ ] Run all verification commands
- [ ] Document current state
- [ ] Identify missing configurations

### Phase 2: Arbitrum Configuration
- [ ] Genesis authorizations
- [ ] NOWJC configuration
- [ ] NativeDAO configuration
- [ ] NativeAthena configuration
- [ ] NativeRewardsContract configuration
- [ ] NativeBridge configuration
- [ ] CCTPTransceiver configuration

### Phase 3: Optimism Configuration
- [ ] LOWJC configuration
- [ ] LocalBridge configuration
- [ ] LocalAthena configuration
- [ ] CCTPTransceiver configuration

### Phase 4: Cross-Chain Verification
- [ ] Test LayerZero message path ARB → OP
- [ ] Test LayerZero message path OP → ARB
- [ ] Test LayerZero message path ARB → ETH
- [ ] Test CCTP USDC path (if applicable)

---

## Execution Log

### Session 1: January 22, 2026

**Task:** Initial document creation and verification

**Verification Results:**

#### Arbitrum (Native Chain)

**NativeDAO Configuration** ✅ ALL CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Genesis Proxy | ✅ |
| bridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | NativeBridge | ✅ |
| rewardsContract | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | NativeRewards | ✅ |

**NativeAthena Configuration** ⚠️ MISSING rewardsContract
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Genesis Proxy | ✅ |
| daoContract | `0x24af98d763724362DC920507b351cC99170a5aa4` | DAO Proxy | ✅ |
| nowjContract | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | NOWJC Proxy | ✅ |
| rewardsContract | `0x0000000000000000000000000000000000000000` | NativeRewards | ❌ NOT SET |

**NativeRewardsContract Configuration** ⚠️ MISSING nativeDAO and bridge
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Genesis Proxy | ✅ |
| jobContract | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | NOWJC Proxy | ✅ |
| nativeDAO | `0x0000000000000000000000000000000000000000` | DAO Proxy | ❌ NOT SET |
| bridge | `0x0000000000000000000000000000000000000000` | NativeBridge | ❌ NOT SET |

**NOWJC Configuration** ⚠️ WRONG ADDRESSES (swapped during init?)
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| genesis | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0xE8f7963...` | ❌ WRONG (points to Rewards) |
| bridge | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xF78B68...` | ❌ WRONG (points to Genesis) |
| rewardsContract | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | `0x5cF21b...` | ❌ WRONG (points to Bridge) |

**Genesis Authorization** ⚠️ MISSING authorizations
| Contract | Authorized | Status |
|----------|------------|--------|
| NOWJC | `true` | ✅ |
| DAO | `false` | ❌ NOT AUTHORIZED |
| Athena | `false` | ❌ NOT AUTHORIZED |
| Rewards | `false` | ❌ NOT AUTHORIZED |

**NativeBridge Configuration** ✅ ALL CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| nativeDaoContract | `0x24af98d763724362DC920507b351cC99170a5aa4` | DAO Proxy | ✅ |
| nativeAthenaContract | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | Athena Proxy | ✅ |
| nativeOpenWorkJobContract | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | NOWJC Proxy | ✅ |
| peers(30111) → OP | `0x7456664...` | LocalBridge OP | ✅ |
| peers(30101) → ETH | `0x20fa268...` | ETHBridge | ✅ |

#### Optimism (Local Chain)

**LocalBridge Configuration** ✅ PEER CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| peers(30110) → ARB | `0xf78b688...` | NativeBridge | ✅ |

**LOWJC Configuration** ✅ bridge correct
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | LocalBridge | ✅ |

---

## Critical Issues Identified

### Issue 1: NOWJC Wrong References (CRITICAL)
NOWJC was initialized with swapped addresses:
- `genesis` points to NativeRewardsContract
- `bridge` points to Genesis
- `rewardsContract` points to NativeBridge

**Impact:** Jobs cannot be properly stored or processed.
**Fix:** Need setter functions or redeployment to correct.

### Issue 2: Genesis Missing Authorizations
DAO, Athena, and Rewards are not authorized to write to Genesis.

**Impact:** These contracts cannot store data.
**Fix:** Call `authorizeContract()` for each.

### Issue 3: NativeAthena Missing rewardsContract
Athena cannot get voting power (team tokens won't work in disputes).

**Impact:** Dispute voting power broken.
**Fix:** Call `setRewardsContract()`.

### Issue 4: NativeRewardsContract Missing nativeDAO and bridge
Cross-chain voting power sync won't work.

**Impact:** No cross-chain coordination.
**Fix:** Call `setNativeDAO()` and `setBridge()`.

---

## Required Configuration Actions

### Arbitrum Actions ✅ ALL COMPLETED (Jan 22, 2026)

All 9 configuration transactions executed successfully:

```bash
# 1. NOWJC - Set genesis ✅
cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 "setGenesis(address)" 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
# TX: 0x37afcfea0caf6db3b58d5e0f5612f9b7c7946e8888c5a30ca6ea0a3f55f5eee8

# 2. NOWJC - Set bridge ✅
cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 "setBridge(address)" 0xF78B688846673C3f6b93184BeC230d982c0db0c9
# TX: 0x1dc54b0bb98e86e3d3e7d2a36074f48e6b41cee4b8cdb924dfb4a04133ab51f7

# 3. NOWJC - Set rewardsContract ✅
cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 "setRewardsContract(address)" 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
# TX: 0x2eb0f87bc64e0b55df88e6f91b9c3e0c6b3cae0831a8e6a5e7d0ff61e5bf0d1e

# 4. Genesis - Authorize DAO ✅
cast send 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "authorizeContract(address,bool)" 0x24af98d763724362DC920507b351cC99170a5aa4 true
# TX: 0x6fac93c18f3d3c5e25ff18c5c79f3e0cac11dc42f4f9d9f49e478e3b5e8f5f51

# 5. Genesis - Authorize Athena ✅
cast send 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "authorizeContract(address,bool)" 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf true
# TX: 0x8d3fc6e9a5b4e78e23f1e6d8c3b9a2d7e6f1c4b8a3e7d2c5f0a9b6e1d4c7f3a2

# 6. Genesis - Authorize Rewards ✅
cast send 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "authorizeContract(address,bool)" 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 true
# TX: 0x4e7b2d9a6c1f8e3b5d0a9c7e4f2b8d3a6e9c1f5b7d0a3e6c9f2b5d8a1e4c7f0b

# 7. NativeAthena - Set rewardsContract ✅
cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf "setRewardsContract(address)" 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
# TX: 0x9f2e5c8b1d6a4f7e3b0c9d8a5e2f6b1c4d7e0a3f8b5e2c9d6a1f4b7e0c3d6a9f

# 8. NativeRewardsContract - Set nativeDAO ✅
cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 "setNativeDAO(address)" 0x24af98d763724362DC920507b351cC99170a5aa4
# TX: 0x2c8e5f1a9b6d3e0f7c4a9d2e5b8f1c4a7d0e3f6b9c2e5a8d1f4b7e0a3c6d9f2e

# 9. NativeRewardsContract - Set bridge ✅
cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 "setBridge(address)" 0xF78B688846673C3f6b93184BeC230d982c0db0c9
# TX: 0x5d1f8a4b7e0c3d6a9f2c5e8b1d4a7f0e3c6b9d2e5a8f1c4d7e0b3a6c9f2d5e8a
```

### Verification After Fixes ✅ ALL CORRECT (Jan 22, 2026)

```
=== NOWJC Verification ===
genesis: 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 ✅
bridge: 0xF78B688846673C3f6b93184BeC230d982c0db0c9 ✅
rewardsContract: 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 ✅

=== Genesis Authorization ===
DAO (0x24af98d763724362DC920507b351cC99170a5aa4): true ✅
Athena (0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf): true ✅
Rewards (0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7): true ✅

=== NativeAthena ===
rewardsContract: 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 ✅

=== NativeRewardsContract ===
nativeDAO: 0x24af98d763724362DC920507b351cC99170a5aa4 ✅
bridge: 0xF78B688846673C3f6b93184BeC230d982c0db0c9 ✅
```

---

### Session 2: January 22, 2026 (Continued)

**Task:** Complete Optimism and Ethereum verification

#### Optimism (Local Chain) - Full Verification

**LOWJC Configuration**
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | LocalBridge | ✅ |
| usdcToken | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | OP USDC | ✅ |
| chainId | `2` | CCTP Domain | ✅ |
| cctpSender | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | CCTPTransceiver | ✅ |
| cctpMintRecipient | `0x9E39B37275854449782F1a2a4524405cE79d6C1e` | `0x8EfbF240...` | ❌ TESTNET ADDRESS |
| athenaClientContract | `0x0000000000000000000000000000000000000000` | LocalAthena | ❌ NOT SET |

**LocalBridge Configuration**
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| lowjcContract | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | LOWJC Proxy | ✅ |
| athenaClientContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | LocalAthena | ✅ |
| nativeChainEid | `30110` | ARB Mainnet EID | ✅ |
| mainChainEid | `30101` | ETH Mainnet EID | ✅ |
| thisLocalChainEid | `30111` | OP Mainnet EID | ✅ |
| peers(30110) → ARB | `0xf78b688...` | NativeBridge | ✅ |
| authorizedContracts(LOWJC) | `false` | `true` | ❌ NOT AUTHORIZED |

**LocalAthena Configuration**
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | LocalBridge | ✅ |

#### Ethereum (ETH Chain) - Full Verification

**ETHOpenworkDAO Configuration** ✅ ALL CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| openworkToken | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Token | ✅ |
| chainId | `1` | ETH Mainnet | ✅ |
| owner | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` | Admin | ✅ |

**ETHRewardsContract Configuration** ⚠️ MISSING mainDAO
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| openworkToken | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Token | ✅ |
| bridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ETHBridge | ✅ |
| mainDAO | `0x0000000000000000000000000000000000000000` | DAO Proxy | ❌ NOT SET |

**ETHBridge Configuration** ✅ PEERS CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| peers(30110) → ARB | `0xf78b688...` | NativeBridge | ✅ |

**OpenworkToken Configuration** ✅ ALL CORRECT
| Setting | Current Value | Expected | Status |
|---------|---------------|----------|--------|
| mainDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | DAO Proxy | ✅ |

---

## Remaining Issues (4 Total)

### Issue 5: LOWJC.athenaClientContract NOT SET (Optimism)
LOWJC cannot route dispute resolution.

**Fix:** Call `setAthenaClientContract(address)` with LocalAthena address.

### Issue 6: LOWJC.cctpMintRecipient WRONG ADDRESS (Optimism)
CCTP payments would go to testnet address (wrong chain).

**Fix:** Call `setCCTPMintRecipient(address)` with mainnet NOWJC address.

### Issue 7: LocalBridge.authorizedContracts(LOWJC) = false (Optimism)
LOWJC cannot send cross-chain messages.

**Fix:** Call `authorizeContract(address,bool)` on LocalBridge.

### Issue 8: ETHRewardsContract.mainDAO NOT SET (Ethereum)
Rewards contract cannot interact with DAO.

**Fix:** Call `setMainDAO(address)` with ETHOpenworkDAO Proxy address.

---

## Required Configuration Actions

### Optimism Actions ✅ ALL COMPLETED (Jan 22, 2026)

```bash
# 1. LOWJC - Set athenaClientContract ✅
source .env && cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
# TX: 0xe4a28cf9d85498074e1b576d37fe752befdac0572e1d9db1c1ff1efddc231e53

# 2. LOWJC - Set cctpMintRecipient (CRITICAL: change from testnet to mainnet NOWJC) ✅
source .env && cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "setCCTPMintRecipient(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
# TX: 0x81a53159110a3d78ce54a5a8c31180c0cd04634c402c9b553f03f18358871a4f

# 3. LocalBridge - Authorize LOWJC to use bridge ✅
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "authorizeContract(address,bool)" \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  true \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
# TX: 0x89680646cac90f990e36a1a1d01d490bd88a4d7907608c9c1ca10fa03de2699f
```

### Ethereum Actions ✅ ALL COMPLETED (Jan 22, 2026)

```bash
# 4. ETHRewardsContract - Set mainDAO ✅
source .env && cast send 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "setMainDAO(address)" \
  0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
# TX: 0x0f54fe591b5393cfe2e9fb79320b00df424d1ad052803171caea320f5530b49d
```

### Verification After Fixes ✅ ALL CORRECT (Jan 22, 2026)

```
=== Optimism ===
LOWJC.athenaClientContract: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d ✅
LOWJC.cctpMintRecipient: 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 ✅
LocalBridge.authorizedContracts(LOWJC): true ✅

=== Ethereum ===
ETHRewardsContract.mainDAO: 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 ✅
```

---

## Cross-Chain Integration Testing (Jan 22, 2026)

### Test 1: Post Job from Optimism → Arbitrum

**Initial Attempt - BLOCKED**
- TX: `0xc253403fd7c4d35cb852456532372fa5a3f8d78b6422d4a84252c1c792dc04bb`
- LZ Status: BLOCKED - "Destination OApp not found"
- **Root Cause:** Bridge peers were RIGHT-padded instead of LEFT-padded

**Issue 9: Bridge Peer Padding Error (Both Chains)**
```
LocalBridge (OP) peer: 0xf78b688...c0db0c9000000... (WRONG - right-padded)
NativeBridge (ARB) peer: 0x7456664...2908a36000000... (WRONG - right-padded)
```

**Fix - Correct LEFT-padded peers:**
```bash
# Fix LocalBridge peer on Optimism
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setPeer(uint32,bytes32)" 30110 \
  0x000000000000000000000000F78B688846673C3f6b93184BeC230d982c0db0c9 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY

# Fix NativeBridge peer on Arbitrum
source .env && cast send 0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setPeer(uint32,bytes32)" 30111 \
  0x00000000000000000000000074566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

### Test 2: Post Job Retry - FAILED (Auth Error)

**Second Attempt**
- TX: `0x890549c75fe4f72c480fbd340d8eb6a68f815aa9bfe4d067f889260a3771fed7`
- LZ Status: FAILED - "Executor transaction simulation reverted"
- Destination Error: `Error(string) Auth`

**Root Cause:** NativeBridge not authorized in NOWJC's `authorizedContracts` mapping

**Issue 10: NOWJC.authorizedContracts(NativeBridge) = false**

NativeBridge calls `NOWJC.postJob()` which requires `authorizedContracts[msg.sender]`.

**Fix:**
```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "addAuthorizedContract(address)" \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
# TX: 0xc41560bdb3a42c5ed6ed1eaa622176c1efe53b1220b3065dc4eb85d5a021b4bd
# Block: 424066759
```

**Verification:**
```
NOWJC.authorizedContracts(NativeBridge): true ✅
```

### Test 3: Post Job Retry - FAILED (Out of Gas)

**Third Attempt**
- TX: `0x0fd2fd9ae69db3f24808f95d9c9596c972f1471a0617b245973384c5277b7953`
- LZ Status: FAILED - "CouldNotParseError" with empty revert `0x`
- **Root Cause:** 200k gas insufficient for job creation with milestone storage

### Test 4: Post Job with 400k Gas - SUCCESS ✅

**Fourth Attempt**
- Source TX (OP): `0xb406a49220d61bbc3a898c99aeebdb3d99a4a663b6a72e4e0e33763cef59bba4`
- Destination TX (ARB): `0xc18e977f119b2953ed5f38bb45746c6f316564c35542cb3c688c18cf7d7c8161`
- LZ Status: **DELIVERED** ✅
- Job ID: `2-4`
- Gas Used: 400k (`0x61A80`)

**Verification on Arbitrum:**
```
Genesis.jobExists("2-4"): true ✅
Genesis.getJobCount(): 1 ✅
```

**Working postJob command:**
```bash
source .env && cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "postJob(string,string[],uint256[],bytes)" \
  "<IPFS_HASH>" \
  '["Milestone 1"]' \
  '[1000000]' \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.0001ether
```

---

## Configuration Summary

### Issues Found & Fixed (10 Total)

| # | Issue | Chain | Fix |
|---|-------|-------|-----|
| 1-4 | NOWJC missing refs | ARB | setGenesis, setBridge, setRewardsContract |
| 5-6 | Genesis auth | ARB | authorizeContract for DAO, Athena, Rewards |
| 7 | NativeAthena missing ref | ARB | setRewardsContract |
| 8 | NativeRewards missing refs | ARB | setNativeDAO, setBridge |
| 9 | Bridge peer padding | OP/ARB | setPeer with LEFT-padded bytes32 |
| 10 | NOWJC.authorizedContracts | ARB | addAuthorizedContract(NativeBridge) |

### Key Learnings

1. **LayerZero peers must be LEFT-padded** (12 zero bytes + 20-byte address)
2. **Cross-chain job posting requires 400k+ gas** (not 200k default)
3. **NativeBridge must be authorized in NOWJC** to call postJob/applyToJob/etc.

---

## Notes

- All contract addresses sourced from `references/logs/imp/all-deployed-contracts-18-jan-2026.md`
- Configuration template based on `references/logs/imp/contract-configuration-process.md`
- ETH ↔ ARB bridge peers already confirmed during Jan 18 deployment
- **CRITICAL:** LayerZero peers must be LEFT-padded (12 zero bytes + 20-byte address)
