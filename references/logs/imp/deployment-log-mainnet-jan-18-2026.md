# Deployment Log - Arbitrum Mainnet - January 18, 2026

## Overview

**Purpose:** Deploy mainnet-ready contracts with January 2026 security fixes:
- Voting power centralization (all voting power via RewardsContract, includes team tokens)
- Self-employment prevention (job giver cannot be applicant)
- Non-upgradeable Rewards Contracts

**Source Folder:** `src/suites/mainnet-ready/`

**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

**Network:** Arbitrum One (Mainnet)
- Chain ID: 42161
- LayerZero EID: 30110

---

## 1. NativeOpenWorkJobContract (NOWJC) Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-openwork-job-contract.sol:NativeOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36
Transaction hash: 0xc741bad71de22798305f38d3f39240ec8d4c74eb1b5b4d67e1fac25a4e9f62fa
```

**Arbiscan:** https://arbiscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36

**Key Features in this version:**
- Self-employment check: `require(_applicant != job.jobGiver, "Self")`
- Refactored modular code structure
- Voting power functions removed (centralized in RewardsContract)

---

## 2. NativeAthena Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-athena.sol:NativeAthena"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510
Transaction hash: 0x71e9e00e28f184d1889afd3ba49813427a6aa0af768aa364a70bba71ff2840b0
```

**Arbiscan:** https://arbiscan.io/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510

**Key Features:**
- Centralized voting power via `rewardsContract.getRewardBasedVotingPower()`
- Dispute resolution with oracle voting
- Cross-chain dispute handling

---

## 3. NativeOpenworkDAO Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-openwork-dao.sol:NativeOpenworkDAO"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x20Fa268106A3C532cF9F733005Ab48624105c42F
Transaction hash: 0x51de1b9c0390e6689612feb6129e04b1c59f280c71e00be4b64b2e82295cfce7
```

**Arbiscan:** https://arbiscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F

**Key Features:**
- Governance proposals and voting
- Centralized voting power via `rewardsContract.getRewardBasedVotingPower()`
- Cross-chain stake data handling

---

## 4. NativeLZOpenworkBridge (Arbitrum Mainnet) - Non-Upgradeable

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-lz-openwork-bridge.sol:NativeLZOpenworkBridge" \
  --constructor-args 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110
```

**Constructor Args:**
- `_endpoint`: `0x1a44076050125825900e736c501f859c50fE728c` (LayerZero V2 Endpoint - Arbitrum One)
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_mainChainEid`: `30110` (Arbitrum One EID)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xF78B688846673C3f6b93184BeC230d982c0db0c9
Transaction hash: 0xe5576bbf39a7e3ae0273c161c6d66ecf27ddcb89d5b5b74c57c0fe76470019b4
```

**Arbiscan:** https://arbiscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9

**Key Features:**
- LayerZero V2 OApp for cross-chain messaging
- Modular message handlers (refactored version)
- Peer management for multi-chain communication

---

## 5. NativeRewardsContract (Non-Upgradeable) (Arbitrum Mainnet)

**Note:** This is a NON-UPGRADEABLE contract. It uses `Ownable` + constructor pattern, not UUPS proxy.

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-rewards-contract.sol:NativeRewardsContract" \
  --constructor-args 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0000000000000000000000000000000000000000 0x0000000000000000000000000000000000000000
```

**Constructor Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_jobContract`: `0x0` (will configure via `setJobContract()`)
- `_genesis`: `0x0` (will configure via `setGenesis()`)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
Transaction hash: 0x5a1982ecf56b6d26619e38b055950468ab5e5477995b1856c12b6073ae87dd64
```

**Arbiscan:** https://arbiscan.io/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7

**Key Features:**
- Non-upgradeable for security
- `getRewardBasedVotingPower()` - centralized voting power calculation
- Team token allocation and voting power
- Configurable via setter functions
- `syncVotingPower()` - includes team tokens in voting power
- Team token multiplier support

---

---

## 6. NativeOpenworkGenesis Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-openwork-genesis.sol:NativeOpenworkGenesis"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
Transaction hash: 0x6f7bcca3ed417410577ddea8a5be6cf5d764ae4d60d729df6a23bfccfdf76304
```

**Arbiscan:** https://arbiscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d

---

## 7. UUPSProxy for NativeOpenworkGenesis (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d $(cast calldata "initialize(address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C)
```

**Constructor Args:**
- Implementation: `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` (Genesis Impl)
- Init data: `initialize(0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C)`

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
Transaction hash: 0xfe49b8cb11a8755403b6b2f26191c496fb0970d8199d2dedb35f9771f1e08002
```

**Arbiscan:** https://arbiscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294

---

## 8. CCTPTransceiver (Non-Upgradeable) (Arbitrum Mainnet)

**Note:** This is a NON-UPGRADEABLE contract for USDC cross-chain transfers via Circle CCTP V2.

**Constructor Arg Sources (Verified Jan 18, 2026):**
- USDC Address: https://developers.circle.com/stablecoins/usdc-contract-addresses
- CCTP V2 Contracts: https://developers.circle.com/cctp/references/contract-addresses

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/cctp-transceiver.sol:CCTPTransceiver" \
  --constructor-args 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

**Constructor Args:**
- `_tokenMessenger`: `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` (Circle CCTP V2 TokenMessengerV2 - Domain 3)
- `_messageTransmitter`: `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` (Circle CCTP V2 MessageTransmitterV2 - Domain 3)
- `_usdc`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (Circle USDC on Arbitrum)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87
Transaction hash: 0x18243336929ca7016a1a9baa8775bfbaf88e85f1ec3b811adb2e71652e6a7541
```

**Arbiscan:** https://arbiscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87

**Key Features:**
- USDC cross-chain transfers via Circle CCTP V2
- Domain-based routing (Arbitrum = Domain 3)
- Non-upgradeable for security

---

## 9. UUPSProxy for NativeOpenWorkJobContract (NOWJC) (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 $(cast calldata "initialize(address,address,address,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 0xaf88d065e77c8cC2239327C5EDb3A432268e5831)
```

**Constructor Args:**
- Implementation: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` (NOWJC Impl)
- Init data: `initialize(owner, genesis, rewards, bridge, cctp, usdc)`
  - `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
  - `_genesis`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`
  - `_rewardsContract`: `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7`
  - `_bridge`: `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
  - `_cctpTransceiver`: `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87`
  - `_usdc`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
Transaction hash: 0xceb77d9ec74dc9a45b36fe73bcefc7a3deef6e65fd65977a603df480fb6efe11
```

**Arbiscan:** https://arbiscan.io/address/0x8EfbF240240613803B9c9e716d4b5AD1388aFd99

---

## 10. UUPSProxy for NativeOpenworkDAO (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x20Fa268106A3C532cF9F733005Ab48624105c42F $(cast calldata "initialize(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294)
```

**Constructor Args:**
- Implementation: `0x20Fa268106A3C532cF9F733005Ab48624105c42F` (DAO Impl)
- Init data: `initialize(owner, bridge, genesis)`
  - `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
  - `_bridge`: `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
  - `_genesis`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x24af98d763724362DC920507b351cC99170a5aa4
Transaction hash: 0x00dc7f56621d689d55571bdb6018601009093184adb8781b7e89bde53debb5b0
```

**Arbiscan:** https://arbiscan.io/address/0x24af98d763724362DC920507b351cC99170a5aa4

---

## 11. UUPSProxy for NativeAthena (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 $(cast calldata "initialize(address,address,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x24af98d763724362DC920507b351cC99170a5aa4 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 0xaf88d065e77c8cC2239327C5EDb3A432268e5831)
```

**Constructor Args:**
- Implementation: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` (Athena Impl)
- Init data: `initialize(owner, dao, genesis, nowjc, usdc)`
  - `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
  - `_daoContract`: `0x24af98d763724362DC920507b351cC99170a5aa4`
  - `_genesis`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`
  - `_nowjContract`: `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99`
  - `_usdcToken`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf
Transaction hash: 0x910fbcd36437c8fdb52082d819654685ced56f9aa1b02f84c08dcc6db2204a8c
```

**Arbiscan:** https://arbiscan.io/address/0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf

---

## Deployment Order & Dependencies

### Phase 1: Deploy Implementations (No dependencies)
1. ✅ NOWJC Implementation
2. ⏳ Athena Implementation
3. ⏳ DAO Implementation
4. ⏳ Bridge Implementation

### Phase 2: Deploy Proxies & Initialize
5. Genesis Proxy (if not existing)
6. NOWJC Proxy → Initialize
7. DAO Proxy → Initialize
8. Athena Proxy → Initialize

### Phase 3: Deploy Non-Upgradeable Contracts
9. NativeRewardsContract (needs proxy addresses)

### Phase 4: Configuration
10. Set authorized contracts on Genesis
11. Set RewardsContract on Athena
12. Set peer connections on Bridge
13. Verify all contracts on Arbiscan

---

## Contract Address Summary

| Contract | Type | Address | Status |
|----------|------|---------|--------|
| NOWJC Implementation | UUPS Impl | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ✅ Deployed |
| Athena Implementation | UUPS Impl | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | ✅ Deployed |
| DAO Implementation | UUPS Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ Deployed |
| Bridge | Non-Upgradeable | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ Deployed |
| NativeRewardsContract | Non-Upgradeable | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ✅ Deployed |
| Genesis Implementation | UUPS Impl | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | ✅ Deployed |
| Genesis Proxy | Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ✅ Deployed |
| CCTPTransceiver | Non-Upgradeable | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ✅ Deployed |
| NOWJC Proxy | Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ✅ Deployed |
| DAO Proxy | Proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | ✅ Deployed |
| Athena Proxy | Proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | ✅ Deployed |

---

## 12. Configuration Phase (Arbitrum Mainnet)

### 12.1 Genesis: Authorize NOWJC ✅

```bash
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  "authorizeContract(address,bool)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 true
```

**TX:** `0x70a02a2bbed29a6511ec23bf697d1c769f8d992efe6994b1ab2c2527c7926564`

### 12.2 RewardsContract: Set JobContract and Genesis ✅

```bash
# Set JobContract
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "setJobContract(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99

# Set Genesis
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "setGenesis(address)" \
  0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
```

**TX (setJobContract):** `0x937c2772eaf7cefc1a8a5da55023d146ff779f352e88613fae0d1082f848859f`
**TX (setGenesis):** `0x7e69bdac74bd35671c183355de62c101e19f5d70ab834701f6c2e48a7a109653`

### 12.3 DAO: Set RewardsContract ✅

```bash
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x24af98d763724362DC920507b351cC99170a5aa4 \
  "setRewardsContract(address)" \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
```

**TX:** `0xf42bafa8a14e9db984235e96f83485bf68f44ca63bd9591f80e3a2ae0081a72e`

### 12.4 Athena: Set RewardsContract ✅

```bash
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "setRewardsContract(address)" \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
```

**TX:** Completed (see Arbiscan)

### 12.5 NOWJC: Add Admin and Set Athena ✅

```bash
# First add deployer as admin (required for admin-only functions)
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "setAdmin(address,bool)" \
  0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C true

# Then set Athena
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "setNativeAthena(address)" \
  0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf
```

**TX (setAdmin):** `0xda366fb54dc752247f311c758de8dfd19c60fee70feea61d9c59677ebc6463ad`
**TX (setNativeAthena):** `0xc1402333b4ee12e2508215c0a5427e12d45bc62b33cc6ae0734993d891a18709`

### 12.6 Bridge: Set Contract References ✅

```bash
# Set DAO
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setNativeDaoContract(address)" \
  0x24af98d763724362DC920507b351cC99170a5aa4

# Set Athena
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setNativeAthenaContract(address)" \
  0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf

# Set NOWJC
source .env && cast send --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setNativeOpenWorkJobContract(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
```

**TX (setNativeDaoContract):** `0x2bcadd7c937c437a2ad8b031ddc53ae1e4ea516e4ea4f219827306d411dec3e2`
**TX (setNativeAthenaContract):** `0x7c7f5ea376813dc927811f2edfbe66eece5116ff043e8f0f57157171864a378b`
**TX (setNativeOpenWorkJobContract):** `0x50d7bd21b06d09b8eb7ea2a13bc228291d8ce1416c5686bd2ee3a2550b34ba8f`

---

## Configuration Complete ✅

All Arbitrum One (Native Chain) contracts are deployed and configured:
- Genesis ↔ NOWJC authorized
- RewardsContract ↔ NOWJC, Genesis linked
- DAO ↔ RewardsContract linked
- Athena ↔ RewardsContract linked
- NOWJC ↔ Athena linked (admin added)
- Bridge ↔ DAO, Athena, NOWJC linked

**Remaining for full cross-chain:**
- Deploy Optimism (Local Chain) contracts
- Deploy Ethereum Mainnet (ETH Chain) contracts
- Configure LayerZero peer connections between chains

---

# OPTIMISM MAINNET (LOCAL CHAIN) DEPLOYMENT

## Network Info

- **Chain ID:** 10
- **LayerZero EID:** 30111
- **CCTP Domain:** 2

## External Dependencies (Optimism Mainnet)

| Contract | Address | Source |
|----------|---------|--------|
| USDC | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | Circle |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` | LayerZero |
| TokenMessengerV2 | `0x2B4069517957735bE00ceE0fadAE88a26365528f` | Circle CCTP V2 (Domain 2) |
| MessageTransmitterV2 | `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` | Circle CCTP V2 (Domain 2) |

---

## 13. LocalLZOpenworkBridge (Optimism Mainnet) - Non-Upgradeable ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/local/local-lz-openwork-bridge.sol:LocalLZOpenworkBridge" \
  --constructor-args 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110 30101 30111
```

**Constructor Args:**
- `_endpoint`: `0x1a44076050125825900e736c501f859c50fE728c` (LayerZero V2 Endpoint - Optimism)
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_nativeChainEid`: `30110` (Arbitrum One)
- `_mainChainEid`: `30101` (Ethereum Mainnet)
- `_thisLocalChainEid`: `30111` (Optimism)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36
Transaction hash: 0xf2b48bc20137b2d1eaa097510ce2e35eac15ca95bc4200f514ab6f7c960dac50
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36

---

## 14. CCTPTransceiver (Optimism Mainnet) - Non-Upgradeable ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/cctp-transceiver.sol:CCTPTransceiver" \
  --constructor-args 0x2B4069517957735bE00ceE0fadAE88a26365528f 0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85
```

**Constructor Args:**
- `_tokenMessenger`: `0x2B4069517957735bE00ceE0fadAE88a26365528f` (Circle CCTP V2 - Domain 2)
- `_messageTransmitter`: `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` (Circle CCTP V2 - Domain 2)
- `_usdc`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` (Circle USDC on Optimism)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510
Transaction hash: 0x18429b4d65013d16daeb4c400adf38c6ef12a6c0f73b33ad070786786b3bb349
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510

---

## 15. LocalOpenWorkJobContract (LOWJC) Implementation (Optimism Mainnet) ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/local/local-openwork-job-contract.sol:LocalOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x20Fa268106A3C532cF9F733005Ab48624105c42F
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F

---

## 16. LocalAthena Implementation (Optimism Mainnet) ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/local/local-athena.sol:LocalAthena"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xF78B688846673C3f6b93184BeC230d982c0db0c9
Transaction hash: 0x63a795185880b3ddef3b57d31d4cf445c41dcb1059521553b71f7b4d90434cf6
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9

---

## 17. LOWJC Proxy (Optimism Mainnet) ✅

**Initialize Parameters:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_usdcToken`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- `_chainId`: `2` (CCTP Domain for Optimism)
- `_bridge`: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- `_cctpSender`: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x20Fa268106A3C532cF9F733005Ab48624105c42F $(cast calldata "initialize(address,address,uint32,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 2 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
Transaction hash: 0xdbd39ad404f5c813f20befc20b638b6c3619f6c1804977ad0d0b0c3687ecbc18
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7

---

## 18. LocalAthena Proxy (Optimism Mainnet) ✅

**Initialize Parameters:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_usdcToken`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- `_chainId`: `2` (CCTP Domain for Optimism)
- `_bridge`: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- `_cctpSender`: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`
- `_nativeAthenaRecipient`: `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` (Athena on Arbitrum)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xF78B688846673C3f6b93184BeC230d982c0db0c9 $(cast calldata "initialize(address,address,uint32,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 2 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
Transaction hash: 0xd69e2d708040fe5ffa787185a7dd98f88bb8cf21123ff79d0ad755c310505286
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d

---

## Optimism Deployment Complete ✅

All 6 Optimism (Local Chain) contracts deployed:

| Contract | Address | Type |
|----------|---------|------|
| LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Non-Upgradeable |
| CCTPTransceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Non-Upgradeable |
| LOWJC Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Implementation |
| LocalAthena Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Implementation |
| LOWJC Proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Proxy |
| LocalAthena Proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Proxy |

---

## 19. Optimism Configuration

### 19.1 Bridge: Set Contract References ✅

```bash
# Set LOWJC
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setLowjcContract(address)" \
  0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7

# Set LocalAthena
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
```

**TX (setLowjcContract):** `0x48ba12cd3dd496920c60525d49cacff4ed18fbca1bd44d9a00629af7c0065227`
**TX (setAthenaClientContract):** `0xa1833781b856b6524869f9c8b653e2cb1ff32555d1353650f57965dbace35300`

### 19.2 LayerZero Peer Configuration (Optimism → Arbitrum) ✅

```bash
# Set peer on Optimism Bridge pointing to Arbitrum Bridge
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setPeer(uint32,bytes32)" \
  30110 \
  $(cast --to-bytes32 0xF78B688846673C3f6b93184BeC230d982c0db0c9)
```

**TX:** `0xf617b4a305cdb357ad6af1eed4db8a07a115cbc63a0d8d35c0173604298ace92`

### 19.3 LayerZero Peer Configuration (Arbitrum → Optimism) ✅

```bash
# Set peer on Arbitrum Bridge pointing to Optimism Bridge
source .env && cast send --rpc-url "https://arb1.arbitrum.io/rpc" --private-key $PROD_DEPLOYER_KEY \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setPeer(uint32,bytes32)" \
  30111 \
  $(cast --to-bytes32 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36)
```

**TX:** `0x5e26c3f00b115c832e57541084ff496191732fe5df6110f1eb0c98c750d46e84`

---

## Optimism Configuration Complete ✅

Cross-chain peer connections established:
- Optimism Bridge → Arbitrum Bridge (EID 30110)
- Arbitrum Bridge → Optimism Bridge (EID 30111)

---

## Notes

- Using `PROD_DEPLOYER_KEY` environment variable (not committed to repo)
- All contracts from `src/suites/mainnet-ready/` folder
- Rewards contracts are intentionally non-upgradeable for security
- CCTPTransceiver is permissionless (anyone can relay USDC transfers)
- Bridge peer configuration needed when deploying to other chains (Optimism, Ethereum)

---

# ETHEREUM MAINNET (ETH CHAIN) DEPLOYMENT

## Network Info

- **Chain ID:** 1
- **LayerZero EID:** 30101
- **CCTP Domain:** 0

## External Dependencies (Ethereum Mainnet)

| Contract | Address | Source |
|----------|---------|--------|
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` | LayerZero |

---

## 20. ETHLZOpenworkBridge (Ethereum Mainnet) - Non-Upgradeable ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/eth/eth-lz-openwork-bridge.sol:ETHLZOpenworkBridge" \
  --constructor-args 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110
```

**Constructor Args:**
- `_endpoint`: `0x1a44076050125825900e736c501f859c50fE728c` (LayerZero V2 Endpoint - Ethereum)
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_nativeChainEid`: `30110` (Arbitrum One)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x20Fa268106A3C532cF9F733005Ab48624105c42F
Transaction hash: 0x1c6675bcc2ec7ba7145d2b2b8f0df7baa49821be90e27e17e7a03328b84898c1
```

**Etherscan:** https://etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F

---

## 21. ETHOpenworkDAO Implementation (Ethereum Mainnet) ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/eth/eth-openwork-dao.sol:ETHOpenworkDAO"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xF78B688846673C3f6b93184BeC230d982c0db0c9
Transaction hash: 0x92c401c5eb4dc48282fe907b9e49aea3c3d46a8107319b489f42351f47df38eb
```

**Etherscan:** https://etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9

---

## 22. LayerZero Peer Configuration

### 22.1 ETH Bridge → Arbitrum Bridge ✅

```bash
source .env && cast send --rpc-url $ETHEREUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x20Fa268106A3C532cF9F733005Ab48624105c42F \
  "setPeer(uint32,bytes32)" \
  30110 \
  $(cast --to-bytes32 0xF78B688846673C3f6b93184BeC230d982c0db0c9)
```

**TX:** `0x6e20501b67e40e612b71e142d2ee399a1fe84d8fdc6a3f099501d051adb2e91c`

### 22.2 Arbitrum Bridge → ETH Bridge ✅

```bash
source .env && cast send --rpc-url "https://arb1.arbitrum.io/rpc" --private-key $PROD_DEPLOYER_KEY \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setPeer(uint32,bytes32)" \
  30101 \
  $(cast --to-bytes32 0x20Fa268106A3C532cF9F733005Ab48624105c42F)
```

**TX:** `0x25b524f4365882e0c1149e64ccd456c014958095445f0f66f7058db271cb19e5`

---

## Ethereum Partial Deployment Complete ✅

**Deployed (No Token Dependency):**
| Contract | Address | Type |
|----------|---------|------|
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Non-Upgradeable |
| ETHOpenworkDAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Implementation |

**Cross-Chain Peers Configured:**
- ETH Bridge → Arbitrum Bridge (EID 30110) ✅
- Arbitrum Bridge → ETH Bridge (EID 30101) ✅

**Pending (Waiting for Token):**
- ETHOpenworkDAO Proxy
- ETHRewardsContract
- OpenworkToken
- All contract configuration

---

## 23. NativeContractRegistry (Arbitrum Mainnet) - Non-Upgradeable ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-contract-registry.sol:NativeContractRegistry"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x29D61B1a9E2837ABC0810925429Df641CBed58c3
Transaction hash: 0xb534cdf97a75ca70fbb254ebb49e7f89b3dbf41c581dafa99b50edd55bd0f047
```

**Arbiscan:** https://arbiscan.io/address/0x29D61B1a9E2837ABC0810925429Df641CBed58c3

**Key Features:**
- On-chain registry for all deployed contracts
- Admin-controlled via owner/DAO
- Tracks contract name, address, chain, and deployer

---

# ETHEREUM MAINNET - REMAINING DEPLOYMENT PLAN

**Date:** January 22, 2026

## Already Deployed

| Contract | Address | Status |
|----------|---------|--------|
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ |
| ETHOpenworkDAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ |
| LZ Peers (ETH↔Arb) | Configured | ✅ |

## Deployment Order (Solving Circular Dependency)

The Token needs RewardsContract + DAO addresses to mint tokens. DAO needs Token to initialize. Solution: Deploy proxies uninitialized first.

| Step | Contract | Action |
|------|----------|--------|
| 1 | ETHRewardsContract | Deploy with `_openworkToken = 0x0` (has setter) |
| 2 | ETHOpenworkDAO Proxy | Deploy with empty init (`0x`) |
| 3 | OpenworkToken | Deploy with RewardsContract + DAO Proxy addresses |
| 4 | ETHOpenworkDAO Proxy | Call `initialize()` with real token |
| 5 | ETHRewardsContract | Call `setOpenworkToken()` |
| 6 | Configuration | Set bridges, peers, admin references |

## Constructor/Init Args Reference

**ETHRewardsContract:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_openworkToken`: `0x0000000000000000000000000000000000000000` (set later)
- `_bridge`: `0x20Fa268106A3C532cF9F733005Ab48624105c42F`

**ETHOpenworkDAO Proxy (initialize):**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_openworkToken`: Token address (after deployment)
- `_chainId`: `1` (Ethereum Mainnet)
- `_bridge`: `0x20Fa268106A3C532cF9F733005Ab48624105c42F`

**OpenworkToken:**
- `initialOwner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `mainRewardsContract`: ETHRewardsContract address
- `daoAddress`: ETHOpenworkDAO Proxy address

---

## 24. ETHRewardsContract (Ethereum Mainnet) - Non-Upgradeable ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-production/eth/eth-rewards-contract.sol:ETHRewardsContract" \
  --constructor-args 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0000000000000000000000000000000000000000 0x20Fa268106A3C532cF9F733005Ab48624105c42F
```

**Constructor Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_openworkToken`: `0x0000000000000000000000000000000000000000` (placeholder - will set via `setOpenworkToken()`)
- `_bridge`: `0x20Fa268106A3C532cF9F733005Ab48624105c42F` (ETHLZOpenworkBridge)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
Transaction hash: 0xfd581bf934e8b24501bcac7e78b2477d90fde5dc94845ce477337a8082e0f577
```

**Etherscan:** https://etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d

**Note:** Deployed with token=0x0. Will call `setOpenworkToken()` after token deployment.

---

## 25. ETHOpenworkDAO Proxy (Ethereum Mainnet) - UNINITIALIZED ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-production/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0x
```

**Constructor Args:**
- Implementation: `0xF78B688846673C3f6b93184BeC230d982c0db0c9` (ETHOpenworkDAO Impl - deployed in section 21)
- Init data: `0x` (empty - will initialize after token deployment)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
Transaction hash: 0xfdea9c0b4f3e8db088877a871fbdcf3532dc4a935031d94728ccf5a3939399d7
```

**Etherscan:** https://etherscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294

**Note:** Proxy deployed but NOT initialized. Will call `initialize()` in Step 4 after token deployment.

---

## 26. OpenworkToken (OWORK) - Ethereum Mainnet ✅

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-production/utilities/openwork-token.sol:OpenworkToken" \
  --constructor-args 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
```

**Constructor Args:**
- `initialOwner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` (Admin wallet)
- `mainRewardsContract`: `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` (ETHRewardsContract)
- `daoAddress`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` (ETHOpenworkDAO Proxy)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87
Transaction hash: 0x42ebb9beaa632613622454adfacebf8e15a8feff38545e38822fcd9116c07ae4
```

**Etherscan:** https://etherscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87

**Token Distribution (automatic at deployment):**
| Recipient | Amount | Percentage |
|-----------|--------|------------|
| ETHRewardsContract (`0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d`) | 750,000,000 OWORK | 75% |
| ETHOpenworkDAO Proxy (`0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`) | 250,000,000 OWORK | 25% |
| Owner wallet | 0 OWORK | 0% (legal compliance) |

---

## 27. ETHOpenworkDAO Proxy Initialization ✅

**Command:**
```bash
source .env && cast send 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  "initialize(address,address,uint32,address)" \
  0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C \
  0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 \
  1 \
  0x20Fa268106A3C532cF9F733005Ab48624105c42F \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Initialize Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_openworkToken`: `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87`
- `_chainId`: `1` (Ethereum Mainnet)
- `_bridge`: `0x20Fa268106A3C532cF9F733005Ab48624105c42F`

**Output:**
```
status               1 (success)
transactionHash      0x89811343240046316db9daf5c7b2ee450b54b1b9879cb581dcd23f49454d3367
blockNumber          24290185
gasUsed              246143
```

**Etherscan:** https://etherscan.io/tx/0x89811343240046316db9daf5c7b2ee450b54b1b9879cb581dcd23f49454d3367

---

## 28. ETHRewardsContract - Set Token ✅

**Command:**
```bash
source .env && cast send 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "setOpenworkToken(address)" \
  0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Output:**
```
status               1 (success)
transactionHash      0x010427289f1da3d218dd0919b5d9d48ea68d78c394172e3d57ec6c689ed90951
blockNumber          24290190
gasUsed              48195
```

**Etherscan:** https://etherscan.io/tx/0x010427289f1da3d218dd0919b5d9d48ea68d78c394172e3d57ec6c689ed90951

**Note:** ETHRewardsContract now has token address set to `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87`

---

## 29. OpenworkToken - Set mainDAO ✅

**Command:**
```bash
source .env && cast send 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 \
  "setMainDAO(address)" \
  0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Output:**
```
status               1 (success)
transactionHash      0xbd6d583542be57044823650ac18e88693fb02fd9aaf12cce1bea745c83638bfb
blockNumber          24290200
gasUsed              48057
```

**Etherscan:** https://etherscan.io/tx/0xbd6d583542be57044823650ac18e88693fb02fd9aaf12cce1bea745c83638bfb

**Note:** ETHOpenworkDAO Proxy (`0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`) is now authorized to mint tokens.

---

# ETHEREUM MAINNET DEPLOYMENT COMPLETE ✅

**Date Completed:** January 22, 2026

## Final Contract Summary

| Contract | Address | Status |
|----------|---------|--------|
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ |
| ETHOpenworkDAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ |
| ETHOpenworkDAO Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ✅ Initialized |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | ✅ Token set |
| OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | ✅ mainDAO set |

## Token Distribution
- ETHRewardsContract: 750,000,000 OWORK (75%)
- ETHOpenworkDAO: 250,000,000 OWORK (25%)

## Cross-Chain Peers
- ETH Bridge ↔ Arbitrum Bridge: ✅ Configured

## Token Balance Verification (Jan 22, 2026)

```bash
# ETHRewardsContract balance
cast call 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 "balanceOf(address)(uint256)" 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
# Result: 750000000000000000000000000 (750M OWORK) ✅

# ETHOpenworkDAO balance
cast call 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 "balanceOf(address)(uint256)" 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
# Result: 250000000000000000000000000 (250M OWORK) ✅

# Total supply
cast call 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 "totalSupply()(uint256)"
# Result: 1000000000000000000000000000 (1B OWORK) ✅
```

| Holder | Balance | Expected | Status |
|--------|---------|----------|--------|
| ETHRewardsContract | 750,000,000 OWORK | 750M | ✅ |
| ETHOpenworkDAO Proxy | 250,000,000 OWORK | 250M | ✅ |
| **Total Supply** | **1,000,000,000 OWORK** | 1B | ✅ |

---

# ADDITIONAL ARBITRUM MAINNET DEPLOYMENTS - January 22, 2026

## 30. NativeProfileGenesis Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-profile-genesis.sol:NativeProfileGenesis"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xae31d7be760D92807B013a71bb51f2cBB132166b
Transaction hash: 0xec8112a606f38cbcadd44739b68ddc76c03f292916c680532bea18b7fc2e7d63
```

**Arbiscan:** https://arbiscan.io/address/0xae31d7be760D92807B013a71bb51f2cBB132166b

---

## 31. NativeAthenaActivityTracker Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-athena-activity-tracker.sol:NativeAthenaActivityTracker"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8
Transaction hash: 0x07fccd9302d6f218968643d59227147fbd397a69387f3076ed6f4836d8fb90ca
```

**Arbiscan:** https://arbiscan.io/address/0x9588A78748a8bc82295bf44d87C4b9F924d11AE8

---

## 32. NativeAthenaOracleManager Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-athena-oracle-manager.sol:NativeAthenaOracleManager"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59
Transaction hash: 0x51fca945cd93c3c420550b2adae9ded83c9e787e85aee6ad790dbe01c2ab3e6f
```

**Arbiscan:** https://arbiscan.io/address/0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59

---

## 33. NativeProfileManager Implementation (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-profile-manager.sol:NativeProfileManager"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xf82D59Cf9339D500C1b35C87D02dE422223812f6
Transaction hash: 0xae5553e0c308261d91bab3e69d3b60cdcc1ffcc40ebfbd5f39188c77479f12c4
```

**Arbiscan:** https://arbiscan.io/address/0xf82D59Cf9339D500C1b35C87D02dE422223812f6

---

## Implementation Summary (Jan 22)

| Contract | Implementation Address |
|----------|----------------------|
| NativeProfileGenesis | `0xae31d7be760D92807B013a71bb51f2cBB132166b` |
| NativeAthenaActivityTracker | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` |
| NativeAthenaOracleManager | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` |
| NativeProfileManager | `0xf82D59Cf9339D500C1b35C87D02dE422223812f6` |

---

## 34. ProfileGenesis Proxy (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xae31d7be760D92807B013a71bb51f2cBB132166b $(cast calldata "initialize(address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E
Transaction hash: 0x200d7044ecf6d4ec4e81ff9e19e3e0b3956f04f977113c4363efa8ea3bb6c9a7
```

**Arbiscan:** https://arbiscan.io/address/0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E

---

## 35. ActivityTracker Proxy (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 $(cast calldata "initialize(address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x8C04840c3f5b5a8c44F9187F9205ca73509690EA
Transaction hash: 0xdc20e232fbadef0dfae415a124ff65cb35b897bfeeac39e83dac4a517a45239c
```

**Arbiscan:** https://arbiscan.io/address/0x8C04840c3f5b5a8c44F9187F9205ca73509690EA

---

## 36. OracleManager Proxy (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59 $(cast calldata "initialize(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15
Transaction hash: 0x7ea7608de783e06c648e2aeaa114a9f45cd22a47ce9259a396d4e9887c97f9d2
```

**Arbiscan:** https://arbiscan.io/address/0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15

---

## 37. ProfileManager Proxy (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xf82D59Cf9339D500C1b35C87D02dE422223812f6 $(cast calldata "initialize(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x51285003A01319c2f46BB2954384BCb69AfB1b45
Transaction hash: 0x816d1b51bc00a86b5b979aa2802d77ff16135c6ced07df1cf9bb56a5a6d4257c
```

**Arbiscan:** https://arbiscan.io/address/0x51285003A01319c2f46BB2954384BCb69AfB1b45

---

## Full Summary (Jan 22 Deployments)

| Contract | Implementation | Proxy |
|----------|---------------|-------|
| NativeProfileGenesis | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` |
| NativeAthenaActivityTracker | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` |
| NativeAthenaOracleManager | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` |
| NativeProfileManager | `0xf82D59Cf9339D500C1b35C87D02dE422223812f6` | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` |

---

## 38. NativeGenesisReader (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-genesis-reader.sol:NativeGenesisReader" \
  --constructor-args 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x72ee091C288512f0ee9eB42B8C152fbB127Dc782
Transaction hash: 0xa16a1bd67acbc00bb74cc0311107e65895eb066b8ce2ebe56383dea4e8ec41ca
```

**Arbiscan:** https://arbiscan.io/address/0x72ee091C288512f0ee9eB42B8C152fbB127Dc782

**Constructor Args:**
- `_genesis`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` (Genesis Proxy)

---

# OPTIMISM LOWJC REDEPLOYMENT - January 23, 2026

## Issue

The original LOWJC Proxy (section 17) was initialized with `_chainId: 2` (CCTP Domain) instead of `30111` (LayerZero EID). This caused job IDs to start with "2-" instead of "30111-".

## 39. LocalOpenWorkJobContract Implementation V2 (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/local/local-openwork-job-contract.sol:LocalOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC
Transaction hash: 0x81594312de2b9d6517f47ab08c335c3185005929750757cb1103ebe61a4696af
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC

---

## 40. LOWJC Proxy V2 (Optimism Mainnet) - UNINITIALIZED

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC 0x
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xDae5036a1d9E7C6CE953604FF238E13BD2B83951
Transaction hash: 0xdbfe3c489f5a63cc530b3725e7ed502a790b17db4ffe394be9f0efbb9ea7add3
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0xDae5036a1d9E7C6CE953604FF238E13BD2B83951

---

## 41. LOWJC Proxy V2 Initialization

**Command:**
```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  "initialize(address,address,uint32,address,address)" \
  0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C \
  0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  30111 \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510
```

**Initialize Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_usdcToken`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- `_chainId`: `30111` (LayerZero EID - **CORRECT**)
- `_bridge`: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- `_cctpSender`: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`

**Output:**
```
status               1 (success)
transactionHash      0xbd9ddc1465086766fe9a9a124136941815f2cae65a83cae51206b418ddcf8ee2
blockNumber          146755157
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/tx/0xbd9ddc1465086766fe9a9a124136941815f2cae65a83cae51206b418ddcf8ee2

---

## 42. Bridge Configuration - Update LOWJC Reference

**Command:**
```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setLowjcContract(address)" \
  0xDae5036a1d9E7C6CE953604FF238E13BD2B83951
```

**Output:**
```
status               1 (success)
transactionHash      0xd36608dee120245d111c612950a8eb21d1b65af519574145e7c5bc5762389086
blockNumber          146755187
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/tx/0xd36608dee120245d111c612950a8eb21d1b65af519574145e7c5bc5762389086

**Note:** LocalLZOpenworkBridge now points to new LOWJC Proxy V2 (`0xDae5036a1d9E7C6CE953604FF238E13BD2B83951`) with correct chainId=30111.

---

## LOWJC Redeployment Summary (V2)

| Contract | Old Address | New Address |
|----------|-------------|-------------|
| LOWJC Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | `0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC` |
| LOWJC Proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` (chainId=2 ❌) | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` (chainId=30111 ✅) |

**V1 is DEPRECATED** - wrong chainId.

---

# OPTIMISM LOWJC V3 REDEPLOYMENT - January 23, 2026

## Issue

LOWJC Proxy V2 (`0xDae5036a1d9E7C6CE953604FF238E13BD2B83951`) had a broken upgrade mechanism - `upgradeToAndCall` transactions succeeded but implementation never changed. Root cause unknown.

**Solution:** Deploy fresh proxy with new implementation.

---

## 43. LocalOpenWorkJobContract Implementation V3 (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/local/local-openwork-job-contract.sol:LocalOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xcC09C58e654D92CBaa5184E000275500b32b2117
Transaction hash: 0x02701d9f1a58277de90a552533663417d298d9d82765de938d92eefd54ba99d5
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0xcC09C58e654D92CBaa5184E000275500b32b2117

---

## 44. LOWJC Proxy V3 (Optimism Mainnet) - UNINITIALIZED

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xcC09C58e654D92CBaa5184E000275500b32b2117 0x
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8
Transaction hash: 0xc76895e18cf0021aee4325100ffc6602c2c3a14e81b67f5a4a303628af732b2a
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x9588A78748a8bc82295bf44d87C4b9F924d11AE8

---

## 45. LOWJC Proxy V3 Initialization

**Command:**
```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  "initialize(address,address,uint32,address,address)" \
  0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C \
  0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  30111 \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510
```

**Initialize Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_usdcToken`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- `_chainId`: `30111` (LayerZero EID - **CORRECT**)
- `_bridge`: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- `_cctpSender`: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`

**Output:**
```
status               1 (success)
transactionHash      0x5a1a424ec902fdf1de90b6f2777c39c2d459f1b27aab96b255740d4a2d9c5998
blockNumber          146781735
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/tx/0x5a1a424ec902fdf1de90b6f2777c39c2d459f1b27aab96b255740d4a2d9c5998

---

## 46. LOWJC V3 ↔ LocalAthena Connection

### 46a. LOWJC V3 → setAthenaClientContract

**Command:**
```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
```

**Output:**
```
status               1 (success)
transactionHash      0xba77eed426d27996b85677bf24c11143decd1a0a9df05304f90c914280f9b056
blockNumber          146781752
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/tx/0xba77eed426d27996b85677bf24c11143decd1a0a9df05304f90c914280f9b056

### 46b. LocalAthena → setJobContract

**Command:**
```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "setJobContract(address)" \
  0x9588A78748a8bc82295bf44d87C4b9F924d11AE8
```

**Output:**
```
status               1 (success)
transactionHash      0x6251fea7d63bf8cb06589e14963431c8d5b4fdc88a52ab2121239b1cf33a5ea9
blockNumber          146781755
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/tx/0x6251fea7d63bf8cb06589e14963431c8d5b4fdc88a52ab2121239b1cf33a5ea9

---

## 47. LOWJC V3 ↔ LocalBridge Connection

### 47a. LocalBridge → setLowjcContract to V3

**Command:**
```bash
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setLowjcContract(address)" \
  0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Verified on-chain

### 47b. LocalBridge → authorizeContract for V3

**Command:**
```bash
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "authorizeContract(address,bool)" \
  0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  true \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Verified on-chain

### 47c. LOWJC V3 → setCCTPMintRecipient

**Command:**
```bash
source .env && cast send 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  "setCCTPMintRecipient(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Verified on-chain

### Verification Results

```
LocalBridge.lowjcContract(): 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 ✅
LocalBridge.authorizedContracts(V3): true ✅
LOWJC V3.cctpMintRecipient(): 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 ✅
```

---

## LOWJC Version Summary

| Version | Proxy Address | Implementation | chainId | Status |
|---------|---------------|----------------|---------|--------|
| V1 | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | 2 ❌ | DEPRECATED |
| V2 | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | `0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC` | 30111 ✅ | DEPRECATED (upgrade broken) |
| V3 | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | `0xcC09C58e654D92CBaa5184E000275500b32b2117` | 30111 ✅ | DEPRECATED (impl mismatch) |
| V4 | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0xcC09C58e654D92CBaa5184E000275500b32b2117` | 30111 ✅ | ✅ ACTIVE |

---

# OPTIMISM LOWJC V4 DEPLOYMENT - January 23, 2026

## Issue

LOWJC V3 Proxy (`0x9588A78748a8bc82295bf44d87C4b9F924d11AE8`) was deployed with `0x` as init data, causing proxy implementation slot mismatch. The proxy stored wrong implementation address (`0x6eb0caa8050652f12a827f8db8fafbbf917c7388`) instead of the correct one (`0xcC09C58e654D92CBaa5184E000275500b32b2117`).

**Root Cause:** Passing `0x` (empty bytes) to ERC1967Proxy constructor caused unexpected behavior.

**Solution:** Deploy proxy with atomic initialization - pass full init calldata directly in constructor args.

---

## 48. LOWJC Proxy V4 (Optimism Mainnet) - ATOMIC INITIALIZATION

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --constructor-args 0xcC09C58e654D92CBaa5184E000275500b32b2117 $(cast calldata "initialize(address,address,uint32,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 30111 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510)
```

**Constructor Args:**
- Implementation: `0xcC09C58e654D92CBaa5184E000275500b32b2117` (LOWJC Impl V3 - reused)
- Init data: `initialize(owner, usdc, chainId, bridge, cctp)` - passed directly for atomic init

**Initialize Args (embedded in constructor):**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_usdcToken`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- `_chainId`: `30111` (LayerZero EID)
- `_bridge`: `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- `_cctpSender`: `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x620205A4Ff0E652fF03a890d2A677de878a1dB63
Transaction hash: [deployment tx]
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x620205A4Ff0E652fF03a890d2A677de878a1dB63

**Implementation Verification:**
```bash
cast storage 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x000000000000000000000000cC09C58e654D92CBaa5184E000275500b32b2117 ✅
```

---

## 49. LOWJC V4 Configuration

### 49a. LOWJC V4 → setAthenaClientContract

```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
```

**Status:** ✅ Verified

### 49b. LocalAthena → setJobContract to V4

```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "setJobContract(address)" \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63
```

**Status:** ✅ Verified

### 49c. LocalBridge → setLowjcContract to V4

```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setLowjcContract(address)" \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63
```

**Status:** ✅ Verified

### 49d. LocalBridge → authorizeContract for V4

```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "authorizeContract(address,bool)" \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  true
```

**Status:** ✅ Verified

### 49e. LOWJC V4 → setCCTPMintRecipient

```bash
source .env && cast send --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPMintRecipient(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
```

**Status:** ✅ Verified

---

## 50. LOWJC V4 Connection Verification

```bash
# Verify all connections
cast call 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 "lowjcContract()(address)" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 ✅

cast call 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 "authorizedContracts(address)(bool)" 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: true ✅

cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 "cctpMintRecipient()(address)" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 ✅

cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 "athenaClientContract()(address)" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d ✅

cast call 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d "jobContract()(address)" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 ✅
```

All connections verified ✅

---

## 51. LOWJC V4 Cross-Chain Test - Job "30111-3"

**Date:** January 23, 2026

### postJob Transaction

**Source TX (Optimism):** `0x6430e160b5843b7ca5474c2e5582b3216ebb984dce0ace40fa9d3819ac9ca5d7`

**LayerZero Status:** DELIVERED ✅

| Field | Value |
|-------|-------|
| Source EID | 30111 (Optimism) |
| Destination EID | 30110 (Arbitrum) |
| Nonce | 12 |
| Source Status | SUCCEEDED |
| Destination Status | **SUCCEEDED** ✅ |
| Job ID | 30111-3 |
| Destination TX | `0x0de20bc81375566301e2201e60750f0811fb353e34b19f98019c1ab27a685db1` |

**Job Details:**
- Job ID: `30111-3`
- CID: `QmSkipJob2`
- Milestones: 1 ("Milestone 1")
- Amount: 10000 (0.01 USDC)
- Job Giver: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

**Result:** Cross-chain job posting working correctly with V4 proxy ✅

---

## Key Lesson Learned

**Problem:** Deploying UUPS proxy with `0x` as init data (for separate initialization) caused implementation slot corruption.

**Solution:** Always use atomic initialization - embed full init calldata in proxy constructor:
```bash
# WRONG (causes implementation mismatch):
forge create ... UUPSProxy --constructor-args 0xIMPL 0x

# CORRECT (atomic initialization):
forge create ... UUPSProxy --constructor-args 0xIMPL $(cast calldata "initialize(...)" arg1 arg2 ...)
```

---

# OPTIMISM CCTPTransceiver V2 DEPLOYMENT - January 23, 2026

## Issue

CCTPTransceiver V1 (`0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`) was deployed with **CCTP V1 addresses**, but our contract uses **CCTP V2 function signatures** (depositForBurn with 7 parameters).

**Root Cause:** Wrong Circle CCTP contract addresses used during initial deployment.

| Version | TokenMessenger | MessageTransmitter | Issue |
|---------|---------------|-------------------|-------|
| V1 (Wrong) | `0x2B4069517957735bE00ceE0fadAE88a26365528f` | `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` | CCTP V1 contracts |
| V2 (Correct) | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` | CCTP V2 contracts |

---

## 52. CCTPTransceiver V2 (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/utilities/cctp-transceiver.sol:CCTPTransceiver" \
  --constructor-args \
  0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d \
  0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 \
  0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85
```

**Constructor Args:**
- `_tokenMessenger`: `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` (TokenMessengerV2)
- `_messageTransmitter`: `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` (MessageTransmitterV2)
- `_usdc`: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` (Optimism USDC)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15

---

## CCTPTransceiver Version Summary

| Version | Address | TokenMessenger | Status |
|---------|---------|----------------|--------|
| V1 | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | V1 (wrong) | ⚠️ DEPRECATED |
| V2 | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | V2 (correct) | ✅ ACTIVE |

---

## 53. LOWJC V4 → setCCTPSender to V2

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPSender(address)" \
  0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Updated

---

## 54. startJob Test - Job "30111-3" with CCTP

**Date:** January 23, 2026

### Transaction

**Source TX (Optimism):** `0x879245f389719ecb80675e8a1cf0fdb0f5ba7d0a5a35d672fdb643cec45cc00d`

**Parameters:**
- Job ID: `30111-3`
- Application ID: `1`
- Amount: 10000 (0.01 USDC)

### CCTP Results

| Field | Value |
|-------|-------|
| Source | Optimism (Domain 2) |
| Destination | Arbitrum (Domain 3) |
| Amount Sent | 10000 |
| Fee | 1 |
| Amount Received | 9999 |
| Mint Recipient | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (NOWJC) |
| Attestation Status | **COMPLETE** ✅ |

**CCTP Completion TX (Arbitrum):**
```bash
cast send 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 \
  "receiveMessage(bytes,bytes)" \
  "MESSAGE" "ATTESTATION" \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

### LayerZero Results

| Field | Value |
|-------|-------|
| Status | **DELIVERED** ✅ |
| Destination TX | `0x80ecadd417b7508ebab7943d95767f0386170df17c92873868a1395c11dd3b19` |

### Verification

**NOWJC USDC Balance (Arbitrum):**
```bash
cast call 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 "balanceOf(address)(uint256)" 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 --rpc-url $ARBITRUM_MAINNET_RPC_URL
# Result: 9999 ✅
```

**Result:** Full startJob + CCTP V2 integration working on mainnet ✅

---

# NATIVE REWARDS CONTRACT V2 - January 23, 2026

## Issue

NativeRewardsContract V1 (`0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7`) reverts in `processJobPayment` when users don't have a profile in ProfileGenesis. The `getUserReferrer()` call reverts instead of returning address(0).

**Root Cause:** Direct call to `profileGenesis.getUserReferrer(user)` without try/catch.

**Fix:** Wrap referrer lookups in try/catch to gracefully handle missing profiles.

---

## 55. NativeRewardsContract V2 (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-rewards-contract-graceful-referrer-fix.sol:NativeRewardsContract" \
  --constructor-args 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
```

**Constructor Args:**
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- `_jobContract`: `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (NOWJC Proxy)
- `_genesis`: `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` (Genesis Proxy)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9
Transaction hash: 0x1185676d513f6d0ced9d119e9774c3581e806a1dcee546c4daed2ff41a353933
```

**Arbiscan:** https://arbiscan.io/address/0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9

**Source:** `src/suites/mainnet-ready/native/native-rewards-contract-graceful-referrer-fix.sol`

---

## 56. Configuration - Update References to V2

### 56a. NOWJC → setRewardsContract

```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "setRewardsContract(address)" \
  0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 \
  --private-key $PROD_DEPLOYER_KEY \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

**Status:** ⏳ Pending

### 56b. DAO → setRewardsContract

```bash
source .env && cast send 0x24af98d763724362DC920507b351cC99170a5aa4 \
  "setRewardsContract(address)" \
  0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 \
  --private-key $PROD_DEPLOYER_KEY \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

**Status:** ⏳ Pending

### 56c. Athena → setRewardsContract

```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "setRewardsContract(address)" \
  0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 \
  --private-key $PROD_DEPLOYER_KEY \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

**Status:** ⏳ Pending

---

## NativeRewardsContract Version Summary

| Version | Address | Status | Issue |
|---------|---------|--------|-------|
| V1 | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⚠️ DEPRECATED | Reverts on missing profile |
| V2 | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | ✅ **ACTIVE** | Graceful referrer handling |

---

# NATIVE LZ OPENWORK BRIDGE V2 - January 24, 2026

## Issue

NativeLZOpenworkBridge V1 (`0xF78B688846673C3f6b93184BeC230d982c0db0c9`) uses `msg.sender` as the LayerZero refund address in `sendSyncVotingPower()`. When called via NativeRewardsContract, the refund goes to NativeRewardsContract which has no `receive()` function, causing `Transfer_NativeFailed` error.

**Root Cause:** `payable(msg.sender)` used as refund address instead of the actual user.

**Fix:** Use `payable(user)` parameter as refund address so excess ETH returns to the caller's wallet.

---

## 57. NativeLZOpenworkBridge V2 (Arbitrum Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-lz-openwork-bridge-v2-refund-fix.sol:NativeLZOpenworkBridgeV2" \
  --constructor-args \
  0x1a44076050125825900e736c501f859c50fE728c \
  0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C \
  30101
```

**Constructor Args:**
- `_endpoint`: `0x1a44076050125825900e736c501f859c50fE728c` (LZ Endpoint V2 on Arbitrum)
- `_owner`: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` (Deployer)
- `_mainChainEid`: `30101` (Ethereum Mainnet)

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F
Transaction hash: 0x6fc89c5f586154d4d8c448667bd796e52aa3a6cf70fd2ff903e15aa2b1731e96
```

**Arbiscan:** https://arbiscan.io/address/0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F

**Source:** `src/suites/mainnet-ready/native/native-lz-openwork-bridge-v2-refund-fix.sol`

---

## 58. Configuration - Bridge V2 Setup (All Complete ✅)

### Peers Configured

| Bridge V2 Peer | EID | Address | Status |
|----------------|-----|---------|--------|
| ETH Bridge | 30101 | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ |
| Local Bridge (Optimism) | 30111 | `0x74566644782e98c87a12e8fc6f7c4c72e2908a36` | ✅ |

### Authorized Contracts in Bridge V2

| Contract | Address | Status |
|----------|---------|--------|
| NativeRewardsContract V2 | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | ✅ |
| NOWJC Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ✅ |
| DAO Proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | ✅ |
| Athena Proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | ✅ |

### Native Contracts → Bridge V2

| Contract | setBridge to V2 | Status |
|----------|-----------------|--------|
| NativeRewardsContract V2 | ✅ | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| NOWJC Proxy | ✅ | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| DAO Proxy | ✅ | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Athena Proxy | ✅ | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |

### Remote Chain → Bridge V2

| Chain | Contract | Peer Set to V2 | Status |
|-------|----------|----------------|--------|
| ETH | ETHLZOpenworkBridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | ✅ |
| Optimism | LocalLZOpenworkBridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | ✅ |

---

## 59. syncVotingPower Test - January 24, 2026 ✅

**Test:** Sync Anas wallet voting power from Arbitrum → ETH

| Step | Details |
|------|---------|
| Wallet | `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` |
| Voting Power | 30,000,000 OW (team tokens) |
| LZ Fee | ~0.000216 ETH |
| Result | ✅ Synced to ETH DAO |

**Verification:**
```bash
cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "userTotalRewards(address)" 0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724 --rpc-url $ETHEREUM_MAINNET_RPC_URL
# Result: 30,000,000 OW ✅
```

---

## NativeLZOpenworkBridge Version Summary

| Version | Address | Status | Issue |
|---------|---------|--------|-------|
| V1 | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ⚠️ DEPRECATED | Refund to non-payable contract |
| V2 | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | ✅ **ACTIVE** | User refund address fix |

---

---

# LOWJC LITE - Gas Optimization Upgrade - January 26, 2026

## Background & Rationale

### Problem
The original `LocalOpenWorkJobContract` (LOWJC) stored redundant data that already exists on the native chain (Arbitrum) in NOWJC/Genesis. This caused unnecessarily high gas costs for users on remote chains (Optimism, Base, etc.).

### Analysis
We conducted a rigorous gas analysis and found that functions like `applyToJob` were storing:
- Full `Application` struct (~276k gas) - **REDUNDANT**
- `jobApplicationCounter` mapping - **REDUNDANT**
- Milestone descriptions (strings) - **REDUNDANT** (only amounts needed locally)

Since NOWJC/Genesis is the source of truth, LOWJC only needs to store:
1. `job.jobGiver` - For authorization checks
2. `job.status` - For state validation
3. `job.currentLockedAmount` - For double-spend prevention
4. `job.milestoneAmounts[]` - For payment tracking (amounts only, no descriptions)

### Gas Savings Summary

| Function | Original Gas | Lite Gas | Savings |
|----------|-------------|----------|---------|
| `postJob` | ~310,000 | ~136,400 | **56%** |
| `applyToJob` | ~301,000 | ~16,800 | **94%** |
| `startJob` | ~340,000 | ~126,600 | **63%** |
| `submitWork` | ~62,000 | ~17,900 | **71%** |
| `rate` | ~66,600 | ~14,500 | **78%** |

**Full job lifecycle: ~68% gas reduction (~1.5M gas saved per job)**

---

## 60. LOWJC Lite Implementation (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol:LocalOpenWorkJobContractLite
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x912818b95BF846e0278869a06253F934673EB747
Transaction hash: 0x32b149dd8a7642ab211bfeca9cf4aec994194534484be17e85fbe14e0b84544f
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x912818b95BF846e0278869a06253F934673EB747

**Source:** `src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol`

**Key Changes from Original LOWJC:**
- Removed `profiles` mapping (use Genesis directly)
- Removed `hasProfile` mapping
- Removed `jobApplications` mapping (applications stored only on native chain)
- Removed `jobApplicationCounter`
- Removed `jobRatings` and `userRatings` mappings
- Simplified `Job` struct to security-critical fields only
- Removed string storage for milestone descriptions (only amounts stored locally)

---

## 61. LOWJC V4 Proxy Upgrade to Lite

**Command:**
```bash
source .env && cast send \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "upgradeToAndCall(address,bytes)" \
  0x912818b95BF846e0278869a06253F934673EB747 \
  0x
```

**Output:**
```
transactionHash: 0xde3150beab4f387e9b60121531bcccf78704018999f2a2a09c1c5e2643b657a9
status: 1 (success)
gasUsed: 37800
```

**Verification:**
```bash
cast storage 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x000000000000000000000000912818b95bf846e0278869a06253f934673eb747 ✅
```

---

## LOWJC Version Summary (Optimism)

| Version | Implementation | Proxy | Status | Notes |
|---------|----------------|-------|--------|-------|
| V1-V3 | Various | Various | ❌ DEPRECATED | Initialization/upgrade issues |
| V4 | `0xcC09C58e654D92CBaa5184E000275500b32b2117` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | Full storage version |
| Lite | `0x912818b95BF846e0278869a06253F934673EB747` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | 68% gas reduction |

*See "LOWJC Lite Version Summary (Updated)" at end of document for current active version.*

---

## Breaking Changes in Lite Version

1. **`getApplication()` removed** - Query Genesis on Arbitrum instead
2. **`getProfile()` removed** - Query Genesis on Arbitrum instead
3. **`getRating()` removed** - Query Genesis on Arbitrum instead
4. **Event changes** - `JobApplication` event no longer includes `applicationId` (assigned by NOWJC)
5. ~~**`releaseAndLockNext`** now requires `_targetChainDomain` and `_targetRecipient` params~~ **Fixed in Lite V4** - params removed (payment goes to applicant's stored preferred chain)

---

## 62. LOWJC Lite Verification (Optimism Mainnet)

**Command:**
```bash
source .env && forge verify-contract 0x912818b95BF846e0278869a06253F934673EB747 \
  "src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol:LocalOpenWorkJobContractLite" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.29 \
  --optimizer-runs 200 \
  --via-ir
```

**Output:**
```
GUID: g1s7jxhnqnfc1e7axktdbfy8eb3rhqe2xuztzxp27hrxgpaxsz
Status: Pass - Verified ✅
```

**Optimistic Etherscan (Verified):** https://optimistic.etherscan.io/address/0x912818b95bf846e0278869a06253f934673eb747#code

---

# LOWJC LITE V2 - Additional Gas Optimizations - January 26, 2026

## Background

After deploying LOWJC Lite (section 60-62), further gas optimizations were identified for pure forwarding functions that don't modify local state.

## Optimizations Applied

### 1. Removed `nonReentrant` from Pure Forwarding Functions

Functions that only call `bridge.sendToNativeChain` don't need reentrancy protection:
- `createProfile`
- `updateProfile`
- `addPortfolio`
- `applyToJob`
- `submitWork`
- `rate`

**Gas Savings:** ~5,100 gas per call

### 2. Changed `memory` to `calldata` for Pure Forwards

All string/array parameters in pure forwarding functions now use `calldata`:
```solidity
// Before
function applyToJob(string memory _jobId, string memory _appHash, ...)

// After
function applyToJob(string calldata _jobId, string calldata _appHash, ...)
```

**Gas Savings:** ~200-600 gas per string parameter

### 3. Simplified Events (No String Parameters)

Removed redundant string parameters from events since data already exists on native chain:

| Event | Before | After |
|-------|--------|-------|
| `ProfileCreated` | `(user, ipfsHash, referrer)` | `(user)` |
| `JobPosted` | `(jobId, jobGiver, detailHash)` | `(jobId, jobGiver)` |
| `JobApplication` | `(jobId, applicant, appHash)` | `(jobId, applicant)` |
| `JobStarted` | `(jobId, selectedApplicant)` | `(jobId)` |
| `WorkSubmitted` | `(jobId, applicant, hash, milestone)` | `(jobId, applicant)` |
| `PaymentReleased` | `(jobId, giver, recipient, amount, milestone)` | `(jobId, amount, milestone)` |

**Gas Savings:** ~2,000-8,000 gas per event

### 4. Removed Validation from `rate()`

Validation (`job exists`, `rating 1-5`) now happens on native chain only.

**Gas Savings:** ~2,100 gas

## Total Gas Savings for `applyToJob`

| Component | Gas Saved |
|-----------|-----------|
| Removed `nonReentrant` | ~5,100 |
| `calldata` vs `memory` (6 params) | ~2,000 |
| Simplified event | ~3,000 |
| **Total** | **~10,000 gas** |

---

## 63. LOWJC Lite V2 Implementation (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol:LocalOpenWorkJobContractLite
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea
Transaction hash: 0x3d4a3b58ac35bd5c7708c6f25073186cd8c082447632970ef9abf54ec692749d
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea

---

## 64. LOWJC Proxy Upgrade to Lite V2

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "upgradeToAndCall(address,bytes)" \
  0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea \
  0x \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Upgraded

---

## 65. LOWJC Lite V2 Configuration

```bash
# Set Bridge
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setBridge(address)" 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY

# Set CCTP Sender (V2)
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPSender(address)" 0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY

# Set CCTP Mint Recipient (NOWJC on Arbitrum)
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPMintRecipient(address)" 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY

# Set USDC Token
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setUsdcToken(address)" 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY

# Set Athena Client
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setAthenaClientContract(address)" 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ All configured

---

## 66. LOWJC Lite V2 Verification

**Command:**
```bash
source .env && forge verify-contract 0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol:LocalOpenWorkJobContractLite \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Status:** ✅ Verified

**Optimistic Etherscan (Verified):** https://optimistic.etherscan.io/address/0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea#code

---

## LOWJC Version Summary (Updated)

| Version | Implementation | Proxy | Status | Notes |
|---------|----------------|-------|--------|-------|
| V1-V3 | Various | Various | ❌ DEPRECATED | Initialization/upgrade issues |
| V4 | `0xcC09C58e654D92CBaa5184E000275500b32b2117` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | Full storage version |
| Lite V1 | `0x912818b95BF846e0278869a06253F934673EB747` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | 68% gas reduction |
| Lite V2 | `0x53Fd9F3C7816f34e5205519011F0b14a001Ba8Ea` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | Additional ~10k gas savings on pure forwards |
| **Lite V3** | `0xa53d782A082D8c0BAeaF76933dE9668A7E4F41a3` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ✅ **ACTIVE** | Added setChainId function |

---

# LOWJC LITE V3 - setChainId Fix - January 27, 2026

## Issue

After upgrading to Lite V2, the `chainId` storage variable returned `0` instead of `30111`. This was caused by a storage layout incompatibility between the original LOWJC implementation and the Lite version.

**Root Cause:** Storage slot mismatch during UUPS upgrade - the Lite version has a different storage layout.

**Fix:** Added `setChainId(uint32)` function to allow owner to set the chainId post-upgrade.

---

## 67. LOWJC Lite V3 Implementation (Optimism Mainnet)

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite.sol:LocalOpenWorkJobContractLite
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xa53d782A082D8c0BAeaF76933dE9668A7E4F41a3
Transaction hash: 0x731b1de09600f8f6bed4babbec33e0f1ae4c0a7701efd888eb15b57913f77122
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0xa53d782A082D8c0BAeaF76933dE9668A7E4F41a3

**New Function Added:**
```solidity
function setChainId(uint32 _chainId) external onlyOwner {
    require(_chainId != 0, "Zero chainId");
    chainId = _chainId;
}
```

---

## 68. LOWJC Lite V3 - Set Chain ID

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setChainId(uint32)" 30111 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Verification:**
```bash
source .env && cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "chainId()(uint32)" \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL
```

**Result:** `30111` ✅

**Status:** ✅ Chain ID set to Optimism LZ EID (30111)

---

## 69. LOWJC Lite V4 Implementation - releaseAndLockNext Fix (Optimism Mainnet)

**Date:** January 27, 2026

**Issue:** The Lite version's `releaseAndLockNext` function accepted `_targetChainDomain` and `_targetRecipient` parameters that were ignored by the Bridge (which only decoded 5 values). This was a misleading API - payments always went to the applicant's stored preferred chain domain regardless of these parameters.

**Fix:** Removed the unused `_targetChainDomain` and `_targetRecipient` parameters from `releaseAndLockNext` to match the non-Lite version behavior.

**Source:** `src/suites/mainnet-ready/local/local-openwork-job-contract-lite-release-and-lock-fix.sol`

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite-release-and-lock-fix.sol:LocalOpenWorkJobContractLite
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x6D4352406613841AD188D99757B0F0e1027b2B07
Transaction hash: 0xb1aa783db54b634bdb75ef739109a2f8101f54fbda33c454209346d6e4b7418b
```

**Optimistic Etherscan:** https://optimistic.etherscan.io/address/0x6D4352406613841AD188D99757B0F0e1027b2B07

---

## 70. LOWJC Lite V4 Proxy Upgrade

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "upgradeToAndCall(address,bytes)" \
  0x6D4352406613841AD188D99757B0F0e1027b2B07 \
  0x \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Output:**
```
status               1 (success)
transactionHash      [executed]
```

**Verification:**
```bash
cast storage 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x0000000000000000000000006d4352406613841ad188d99757b0f0e1027b2b07 ✅
```

**Status:** ✅ Complete

---

## 71. LOWJC Lite V4 Verification

**Command:**
```bash
source .env && forge verify-contract 0x6D4352406613841AD188D99757B0F0e1027b2B07 \
  src/suites/mainnet-ready/local/local-openwork-job-contract-lite-release-and-lock-fix.sol:LocalOpenWorkJobContractLite \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Status:** ⏳ Pending

---

## 72. LOWJC Lite V4 Configuration (Post-Upgrade)

**Date:** January 27, 2026

**Note:** After each LOWJC proxy upgrade, all configuration must be re-applied since UUPS upgrades can reset storage slots.

### 72a. setChainId

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setChainId(uint32)" \
  30111 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### 72b. setBridge

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setBridge(address)" \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### 72c. setCCTPSender

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPSender(address)" \
  0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### 72d. setCCTPMintRecipient

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setCCTPMintRecipient(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### 72e. setUsdcToken

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setUsdcToken(address)" \
  0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### 72f. setAthenaClientContract

```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Complete

### Verification

```bash
# Chain ID
cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 "chainId()" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 30111 ✅

# Bridge
cast call 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 "bridge()" --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 ✅
```

### Configuration Summary

| Setting | Address/Value | Status |
|---------|---------------|--------|
| chainId | `30111` (Optimism LZ EID) | ✅ |
| bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ✅ |
| cctpSender | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | ✅ |
| cctpMintRecipient | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ✅ |
| usdcToken | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | ✅ |
| athenaClientContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | ✅ |

---

## LOWJC Lite Version Summary (Updated)

| Version | Implementation | Proxy | Status | Notes |
|---------|----------------|-------|--------|-------|
| V1-V3 | Various | Various | ❌ DEPRECATED | Initialization/upgrade issues |
| V4 (Original) | `0xcC09C58e654D92CBaa5184E000275500b32b2117` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | Full storage version |
| Lite V1 | `0x912818b95BF846e0278869a06253F934673EB747` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | 68% gas reduction |
| Lite V2 | `0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | calldata optimization |
| Lite V3 | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | chainId fix |
| Lite V4 | `0x6D4352406613841AD188D99757B0F0e1027b2B07` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ❌ UPGRADED | releaseAndLockNext fix |
| **Lite V5** | `0x8255A7fa5409194bbC0c85c2Eaa71Cf2f5763Fd3` | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ✅ **ACTIVE** | setJobCounter added |

---

# NOWJC Balance Fix - January 27, 2026

## Issue

The `releasePaymentCrossChain` function in NOWJC had a critical bug:
- It checked and used the **total USDC balance** of the contract instead of the per-job amount
- With multiple concurrent jobs, this caused "Unexpected balance - possible concurrent job conflict" errors
- If the check had passed, it would have sent ALL escrowed funds to one recipient

## Fix

Changed `releasePaymentCrossChain` to trust the `_amount` parameter from LOWJC (which correctly tracks per-job escrow) instead of using total contract balance.

**Source:** `src/suites/mainnet-ready/native/native-openwork-job-contract-balance-fix.sol`

---

## 73. NOWJC Implementation V2 - Balance Fix (Arbitrum Mainnet)

**Date:** January 27, 2026

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  src/suites/mainnet-ready/native/native-openwork-job-contract-balance-fix.sol:NativeOpenWorkJobContract
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x8F7f3E9376963691CE568843afad7E1977730fBA
Transaction hash: 0xde96366798ac3d6e3d96f8a0909227408dd89b4eca23feafbf84d270bd7a2b1b
```

**Arbiscan:** https://arbiscan.io/address/0x8F7f3E9376963691CE568843afad7E1977730fBA

---

## 74. NOWJC Proxy Upgrade to V2

**Command:**
```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "upgradeToAndCall(address,bytes)" \
  0x8F7f3E9376963691CE568843afad7E1977730fBA \
  0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ⏳ Pending

---

## 75. NativeAthena V3 - Dynamic EID Mapping + Fee Fix (Arbitrum Mainnet)

**Source:** `src/suites/mainnet-ready/native/native-athena-dynamic-eid-mapping-fee-fix.sol`

**Changes:**
- Dynamic EID-to-CCTP domain mapping (replaces hardcoded testnet-only EIDs)
- Admin functions: `mapEid()`, `mapEids()` for adding chain mappings
- Fee distribution fix: try/catch on USDC transfer to handle CCTP fee deduction
- Bytecode optimization: internal `_auth()` function replaces 15 inline admin checks

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-ready/native/native-athena-dynamic-eid-mapping-fee-fix.sol:NativeAthena"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x45747a4A5c78F8D480203d1E81b4c9c7AbaDE018
Transaction hash: 0x7bc5b3ed1c79cf8c2f2964d60a34bbaf575fef17c873216acb5374b3ba18f6c9
```

**Arbiscan:** https://arbiscan.io/address/0x45747a4A5c78F8D480203d1E81b4c9c7AbaDE018

---

## 76. NativeAthena Proxy Upgrade to V3

**Command:**
```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "upgradeToAndCall(address,bytes)" \
  0x45747a4A5c78F8D480203d1E81b4c9c7AbaDE018 \
  0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Confirmed - Implementation updated to `0x45747a4A5c78F8D480203d1E81b4c9c7AbaDE018`

---

## 77. ETHOpenworkDAO Implementation V2 - Production Values (Ethereum Mainnet)

**Date:** February 9, 2026

**Purpose:** Deploy production-ready ETHOpenworkDAO implementation with all test values corrected:
- Voting delay: `1 days` (was `1 minutes`)
- Voting period: `7 days` (was `5 minutes`)
- Unstake delay: `7 days` (was `24 hours`)
- Stake duration: `1-3 years` (was `1-3 minutes`)
- Unlock time: `durationYears * 365 days` (was `durationMinutes * 60`)

**Source:** `src/suites/mainnet-production/eth/eth-openwork-dao.sol`

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/mainnet-production/eth/eth-openwork-dao.sol:ETHOpenworkDAO"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x5854Ab94639aF8D6f524419470d8d0435AD76aFB
```

**Etherscan:** https://etherscan.io/address/0x5854Ab94639aF8D6f524419470d8d0435AD76aFB

**Next Step:** Upgrade proxy `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` to point to this new implementation:
```bash
source .env && cast send 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  "upgradeToAndCall(address,bytes)" \
  0x5854Ab94639aF8D6f524419470d8d0435AD76aFB \
  0x \
  --rpc-url $ETHEREUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ⏳ Implementation deployed, proxy upgrade pending (checking unstake function first)

**Note:** Proxy storage still has old init values (60s votingDelay, 300s votingPeriod, 24hr unstakeDelay). The `initialize()` won't re-run on upgrade. Governance calls needed post-upgrade to update stored voting settings.

---

# NOWJC V3 - CCTP Fee Tolerance + Double Commission Fix - February 11, 2026

## Issue

Two bugs identified during direct contract testing (job `30111-27`):

1. **CCTP fee tolerance**: `releasePaymentCrossChain` used strict `require(actualBalance >= _amount)` which fails when CCTP fast transfer fee (e.g., 13 units on 100,000) reduces the received amount below the locked amount.
2. **Double commission**: `accumulatedCommission += commission` was called both in `releasePaymentCrossChain` (line 894) AND in `_finalizePayment` (line 963), double-counting commission.
3. **Missing balance check**: `releasePaymentAndLockNext` had no balance validation at all.

## Fix

- `releasePaymentCrossChain`: Replaced strict balance check with 0.01% CCTP fee tolerance. Uses `effectiveAmount = min(actualBalance, _amount)` when balance is slightly short. Removed duplicate `accumulatedCommission` (now only in `_finalizePayment`).
- `releasePaymentAndLockNext`: Added same CCTP fee tolerance check with `effectiveAmount`.

**Source:** `src/suites/current-mainnet/native/native-openwork-job-contract-v2.sol`

---

## 78. NOWJC Implementation V3 - CCTP Fee Tolerance (Arbitrum Mainnet)

**Date:** February 11, 2026

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/current-mainnet/native/native-openwork-job-contract-v2.sol:NativeOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xe86eD7b58702f55020c8d473f7b9EA7c59bc479A
Transaction hash: 0x25c099856c7c2d00ec45e2c0754b0249249583f15c2933f633cb87e11fbd5449
```

**Arbiscan:** https://arbiscan.io/address/0xe86eD7b58702f55020c8d473f7b9EA7c59bc479A

---

## 79. NOWJC Proxy Upgrade to V3

**Command:**
```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "upgradeToAndCall(address,bytes)" \
  0xe86eD7b58702f55020c8d473f7b9EA7c59bc479A \
  0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Upgraded

---

---

# NOWJC V4 - Native Arb Support (releasePayment, NativeArbLOWJC integration) - February 27, 2026

## Changes

- Added `releasePayment(string jobId)` — single-param payment release, auto-reads milestone amount from Genesis and routes same-chain or cross-chain via CCTP based on `jobApplicantChainDomain`
- Removed `createProfile` — profile management offloaded to ProfileManager
- Added `batchAddAuthorizedContracts` for registering native-arb contracts in one call
- Fixes to support `NativeArbOpenWorkJobContract` as an authorized caller

**Source:** `src/suites/current-mainnet/native/native-openwork-job-contract-v3.sol`

---

## 80. NOWJC Implementation V4 - Native Arb Support (Arbitrum Mainnet)

**Date:** February 27, 2026

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/current-mainnet/native/native-openwork-job-contract-v3.sol:NativeOpenWorkJobContract"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x3BA6d1889753b611CA62f859ec3230d2Feb831cb
Transaction hash: 0x5e5207a1bca50322a9d72b4fae93296ac22bad06283c0498b50e2282b6f1df84
```

**Arbiscan:** https://arbiscan.io/address/0x3BA6d1889753b611CA62f859ec3230d2Feb831cb

---

## 81. NOWJC Proxy Upgrade to V4

**Command:**
```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "upgradeToAndCall(address,bytes)" \
  0x3BA6d1889753b611CA62f859ec3230d2Feb831cb \
  0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Status:** ✅ Upgraded

---

---

# NativeAthena V4 + ProfileManager V2 - authorizedContracts Pattern - February 28, 2026

## Changes

**NativeAthena V4:**
- Added `authorizedContracts` mapping — all three handle* functions now accept `bridge || authorizedContracts[msg.sender]`
- Added `activityTracker` and `rewardsContract` state variables
- Enables `NativeArbAthenaClient` to call disputes/skill verification directly without going through bridge
- Note: storage layout collision on upgrade — `admins` mapping shifted; fixed via `setAdmin` + manual re-config

**ProfileManager V2:**
- Added `authorizedContracts` mapping with `_isAuthorized()` internal gate
- All write functions now accept `bridge || authorizedContracts[msg.sender]`
- Enables `NativeArbLOWJC` to call profile functions directly

---

## 82. NativeAthena V4 Implementation (Arbitrum Mainnet)

**Date:** February 28, 2026

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/current-mainnet/native/native-athena-v4.sol:NativeAthena"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x42908Bc0a5f9e22a25e2D48BbA7D03e0bD091246
Transaction hash: 0x29788faefe57f403e54f79a42a94c8fe2603f19aaec957ac68e5c35bf50ec943
```

**Arbiscan:** https://arbiscan.io/address/0x42908Bc0a5f9e22a25e2D48BbA7D03e0bD091246

---

## 83. NativeAthena Proxy Upgrade to V4

**Command:**
```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "upgradeToAndCall(address,bytes)" \
  0x42908Bc0a5f9e22a25e2D48BbA7D03e0bD091246 0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Post-upgrade config:**
- `setAdmin(deployer, true)` — required due to storage layout shift
- `setActivityTracker(0x8C04840c3f5b5a8c44F9187F9205ca73509690EA)`
- `setRewardsContract(0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9)`
- `addAuthorizedContract(0xEC9446A163E74D2fBF3def75324895204415166D, true)` — NativeArbAthenaClient

**Status:** ✅ Upgraded and configured

---

## 84. NativeProfileManager V2 Implementation (Arbitrum Mainnet)

**Date:** February 28, 2026

**Command:**
```bash
source .env && forge create --broadcast \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  "src/suites/current-mainnet/native/native-profile-manager-v2.sol:NativeProfileManager"
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x19E4fBe10C2F2531248e5FfDF150D8c61168702f
Transaction hash: 0x8e277c669e2ba1397efba00ff8eb139bbccfaa2b9f8ea59627fbf125a9f19b82
```

**Arbiscan:** https://arbiscan.io/address/0x19E4fBe10C2F2531248e5FfDF150D8c61168702f

---

## 85. NativeProfileManager Proxy Upgrade to V2

**Command:**
```bash
source .env && cast send 0x51285003A01319c2f46BB2954384BCb69AfB1b45 \
  "upgradeToAndCall(address,bytes)" \
  0x19E4fBe10C2F2531248e5FfDF150D8c61168702f 0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Post-upgrade config:**
- `addAuthorizedContract(0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587, true)` — NativeArbLOWJC

**Status:** ✅ Upgraded and configured

---

---

# NativeArbLOWJC V2 - profileManager support - February 28, 2026

## Changes
- Added `profileManager` state variable and `setProfileManager()` setter
- `createProfile`, `updateProfile`, `addPortfolio` now route to ProfileManager instead of NOWJC stub

**Source:** `src/suites/current-mainnet/native/native-arb-lowjc-v2.sol` (agent's updated version)

---

## 86. NativeArbLOWJC V2 Implementation (Arbitrum Mainnet)

**Date:** February 28, 2026

**Deployed by:** Agent (service wallet `0xb8dC69937e745Fd02661BC4333f3852166eF2026`)

```
Deployed to: 0xC36052F40A02663f114f2e0aFfc6A53D82721139
Transaction hash: 0x33837527c2204a59874f43fa5882554aae789d726ea2a4f72ef98dd361a362d8
```

**Arbiscan:** https://arbiscan.io/address/0xC36052F40A02663f114f2e0aFfc6A53D82721139

---

## 87. NativeArbLOWJC Proxy Upgrade to V2

```
Transaction hash: 0xf4c1b96d65d9ac980a1b6c57e0d8e4cb30a02089c67d8d0573df48549caf3330
```

---

## 88. NativeArbLOWJC setProfileManager

```
setProfileManager(0x51285003A01319c2f46BB2954384BCb69AfB1b45)
Transaction hash: 0xc6daea6ab251a0756eafb3cebcef6108cbc19bb8a6e4d432e02c6b25974b6408
```

**Status:** ✅ Upgraded and configured

---

---

# NativeArbLOWJC V3 + NativeAthena V5 - Dispute Fixes - February 28, 2026

## Changes

**NativeArbLOWJC V3:**
- `startJob` now validates application exists before locking funds
- Added `emergencyWithdrawUSDC(address,uint256)` to recover stuck USDC

**NativeAthena V5:**
- Added `localLOWJC` state variable + `setLocalLOWJC(address)` setter
- `settleDispute` now calls `localLOWJC.resolveDispute(jobId, winningSide)` to keep LOWJC job state in sync

---

## 89. NativeArbLOWJC V3 Implementation (Arbitrum Mainnet)

**Date:** February 28, 2026

**Deployed by:** Agent (service wallet `0xb8dC...`)

```
Deployed to: 0xC14310DE9C057FBF54797E7118abcD5C412BFcD2
```

**Arbiscan:** https://arbiscan.io/address/0xC14310DE9C057FBF54797E7118abcD5C412BFcD2

**Status:** ✅ Proxy upgraded + nativeAthena set by agent

---

## 90. NativeAthena V5 Implementation (Arbitrum Mainnet)

**Date:** February 28, 2026

**Deployed by:** Agent

```
Deployed to: 0x80AA520dB868dc234ea852fC23Fa7c03e217Dad2
```

**Arbiscan:** https://arbiscan.io/address/0x80AA520dB868dc234ea852fC23Fa7c03e217Dad2

---

## 91. NativeAthena Proxy Upgrade to V5

```bash
source .env && cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "upgradeToAndCall(address,bytes)" \
  0x80AA520dB868dc234ea852fC23Fa7c03e217Dad2 0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Post-upgrade:**
- `setLocalLOWJC(0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587)`

**Status:** ✅ Upgraded and configured

---

## 92. NOWJC V5 Implementation - balanceOf Fix + emergencyWithdraw (Arbitrum Mainnet)

**Date:** February 28, 2026

**Changes:**
- **CRITICAL FIX:** `_validateAndCalculatePayment` now takes explicit `_amount` parameter instead of using `balanceOf(address(this))`
  - Validates `_amount` against expected milestone (with 0.01% CCTP fee tolerance)
  - Uses `balanceOf` only as sufficiency check (`contractBalance >= _amount`)
  - Commission calculated on explicit `_amount`, not total contract balance
- Added `emergencyWithdrawUSDC(address,uint256)` — `onlyOwner` gated, to recover stuck USDC
- Fixed `_finalizePayment` parameter naming: `actualBalance` → `grossAmount`

**Source:** `src/suites/current-mainnet/native/native-openwork-job-contract-v4.sol`

**Command:**
```bash
forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY src/suites/current-mainnet/native/native-openwork-job-contract-v4.sol:NativeOpenWorkJobContract
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528
Transaction hash: 0xbde15e2af8fc93459ea5cf1d97b63d261cfb432bcaed1312a993714b629191ce
```

**Arbiscan:** https://arbiscan.io/address/0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528

---

## 93. NOWJC Proxy Upgrade to V5

**Command:**
```bash
cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "upgradeToAndCall(address,bytes)" \
  0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528 0x \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Post-upgrade TODO:**
- `emergencyWithdrawUSDC(deployer, 7210000)` — recover 7.21 USDC stuck from test jobs

**Status:** ⏳ Pending upgrade tx confirmation

---
