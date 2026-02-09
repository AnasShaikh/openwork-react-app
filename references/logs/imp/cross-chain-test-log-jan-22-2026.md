# Cross-Chain Integration Test Log - January 22-23, 2026

## LOWJC V2 Redeployment & Reconfiguration (January 23, 2026)

### Issue: Wrong chainId Initialization

**Problem:** LOWJC Proxy V1 was initialized with `chainId=2` (CCTP domain) instead of `chainId=30111` (LayerZero EID).

**Solution:** Redeploy LOWJC with correct chainId and reconfigure all references.

### New Contract Addresses

| Contract | Address | Status |
|----------|---------|--------|
| LOWJC Proxy V2 | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | ✅ Active |
| LOWJC Impl V2 | `0xfab6Eb4858f1c9C2445787Ff142582DE291F0dEC` | ✅ Active |
| LOWJC Proxy V1 | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⚠️ DEPRECATED |

### Configuration Commands Executed

```bash
# 1. Set bridge on new LOWJC V2
source .env && cast send 0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  "setBridge(address)" \
  0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY

# 2. Set athenaClientContract on new LOWJC V2
source .env && cast send 0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  "setAthenaClientContract(address)" \
  0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY

# 3. Set cctpMintRecipient on new LOWJC V2 (to mainnet NOWJC on Arbitrum)
source .env && cast send 0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  "setCCTPMintRecipient(address)" \
  0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY

# 4. Update LocalBridge to point to new LOWJC V2
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setLowjcContract(address)" \
  0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY

# 5. Authorize new LOWJC V2 in LocalBridge
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "authorizeContract(address,bool)" \
  0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 \
  true \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

### Verification Results ✅ ALL CORRECT

```
LOWJC V2 bridge: 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 ✅
LOWJC V2 athenaClientContract: 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d ✅
LOWJC V2 cctpMintRecipient: 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 ✅
LocalBridge lowjcContract: 0xDae5036a1d9E7C6CE953604FF238E13BD2B83951 ✅
LocalBridge authorizedContracts(LOWJC V2): true ✅
```

---

## Test: Post Job from Optimism (LOWJC) to Arbitrum (NOWJC)

### Configuration Fixes Applied Before Testing

#### Fix 1: Bridge Peer Padding (Both Chains)

**Issue:** Peers were RIGHT-padded instead of LEFT-padded

```bash
# Fix LocalBridge peer on Optimism (for Arbitrum 30110)
source .env && cast send 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "setPeer(uint32,bytes32)" \
  30110 \
  0x000000000000000000000000F78B688846673C3f6b93184BeC230d982c0db0c9 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

```bash
# Fix NativeBridge peer on Arbitrum (for Optimism 30111)
source .env && cast send 0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "setPeer(uint32,bytes32)" \
  30111 \
  0x00000000000000000000000074566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Verification:**
```bash
source .env && cast call 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 "peers(uint32)(bytes32)" 30110 --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Output: 0x000000000000000000000000f78b688846673c3f6b93184bec230d982c0db0c9

source .env && cast call 0xF78B688846673C3f6b93184BeC230d982c0db0c9 "peers(uint32)(bytes32)" 30111 --rpc-url $ARBITRUM_MAINNET_RPC_URL
# Output: 0x00000000000000000000000074566644782e98c87a12e8fc6f7c4c72e2908a36
```

#### Fix 2: NOWJC Authorization for NativeBridge

**Issue:** NativeBridge not in NOWJC.authorizedContracts

```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "addAuthorizedContract(address)" \
  0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Output:**
```
blockHash            0x168ff7787d9bd9da27ff091e305c072c88ff0ec733b4263cbd79c0dc8473cec1
blockNumber          424066759
status               1 (success)
transactionHash      0xc41560bdb3a42c5ed6ed1eaa622176c1efe53b1220b3065dc4eb85d5a021b4bd
```

---

### Test Execution

#### Successful Test: Post Job with 400k Gas

```bash
source .env && cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmTestJobDetailHashABC" \
  '["Milestone 1"]' \
  '[1000000]' \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.0001ether
```

**Source Transaction Output (Optimism):**
```
blockHash            0x2b7df255d1ccc0a07c89fc55d9e26f1f184e56763b99c2f2179b78456081d744
blockNumber          146747375
contractAddress
cumulativeGasUsed    17623633
effectiveGasPrice    5982
from                 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
gasUsed              456772
status               1 (success)
transactionHash      0xb406a49220d61bbc3a898c99aeebdb3d99a4a663b6a72e4e0e33763cef59bba4
to                   0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
```

**LayerZero Message Status:**
```bash
curl -s "https://scan.layerzero-api.com/v1/messages/tx/0xb406a49220d61bbc3a898c99aeebdb3d99a4a663b6a72e4e0e33763cef59bba4" | jq '.data[0].status, .data[0].destination'
```

**Output:**
```json
{
  "name": "DELIVERED",
  "message": "Executor transaction confirmed"
}
{
  "nativeDrop": {
    "status": "N/A"
  },
  "lzCompose": {
    "status": "N/A"
  },
  "tx": {
    "txHash": "0xc18e977f119b2953ed5f38bb45746c6f316564c35542cb3c688c18cf7d7c8161",
    "blockHash": "0x910ada39a02512f46ee25d2fe92002f8138adbfe5525c5fc1f93b6f8695204ac",
    "blockNumber": 424068463,
    "blockTimestamp": 1769093572
  },
  "status": "SUCCEEDED"
}
```

**Destination Verification (Arbitrum):**
```bash
source .env && cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "jobExists(string)(bool)" "2-4" --rpc-url $ARBITRUM_MAINNET_RPC_URL
# Output: true

source .env && cast call 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 "getJobCount()(uint256)" --rpc-url $ARBITRUM_MAINNET_RPC_URL
# Output: 1
```

---

### Failed Test Attempts (For Reference)

#### Test 1: BLOCKED - Wrong Peer Padding

```bash
source .env && cast send 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmTestJobDetailHash123" \
  '["Milestone 1"]' \
  '[1000000]' \
  '0x00030100110100000000000000000000000000030d40' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00004ether
```

**TX:** `0xc253403fd7c4d35cb852456532372fa5a3f8d78b6422d4a84252c1c792dc04bb`
**LZ Status:** BLOCKED - "Destination OApp not found"
**Root Cause:** Bridge peers were RIGHT-padded instead of LEFT-padded

#### Test 2: FAILED - Auth Error

**TX:** `0x890549c75fe4f72c480fbd340d8eb6a68f815aa9bfe4d067f889260a3771fed7`
**LZ Status:** FAILED - `Error(string) Auth`
**Root Cause:** NativeBridge not authorized in NOWJC.authorizedContracts

#### Test 3: FAILED - Out of Gas

**TX:** `0x0fd2fd9ae69db3f24808f95d9c9596c972f1471a0617b245973384c5277b7953`
**LZ Status:** FAILED - "CouldNotParseError" with empty revert `0x`
**Root Cause:** 200k gas insufficient for job creation with milestone storage

---

## Summary

### Transaction Flow

```
Optimism (LOWJC.postJob)
    ↓
LocalBridge.sendToNativeChain
    ↓ LayerZero V2 (DVNs: LayerZero Labs + Google)
    ↓
NativeBridge._lzReceive
    ↓
NativeBridge._handleJobMessages
    ↓
NOWJC.postJob
    ↓
Genesis.setJob
    ↓
Job "2-4" created on Arbitrum ✅
```

### Key Parameters

| Parameter | Value |
|-----------|-------|
| Source Chain | Optimism (EID: 30111) |
| Destination Chain | Arbitrum (EID: 30110) |
| Gas Limit | 400,000 (0x61A80) |
| LZ Options | `0x00030100110100000000000000000000000000061A80` |
| LZ Fee | ~0.0001 ETH |
| Job ID Format | `{cctpChainId}-{jobCounter}` = "2-4" |

### Contract Addresses

| Contract | Chain | Address | Status |
|----------|-------|---------|--------|
| LOWJC Proxy V4 | Optimism | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | ✅ Active |
| LOWJC Proxy V3 | Optimism | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | ⚠️ DEPRECATED |
| LOWJC Proxy V2 | Optimism | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | ⚠️ DEPRECATED |
| LOWJC Proxy V1 | Optimism | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ⚠️ DEPRECATED |
| LocalBridge | Optimism | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ✅ Active |
| NativeBridge | Arbitrum | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ Active |
| NOWJC Proxy | Arbitrum | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | ✅ Active |
| Genesis Proxy | Arbitrum | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | ✅ Active |

---

# LOWJC V3 Cross-Chain Tests - January 23, 2026

## Test: Post Job from LOWJC V3 (Optimism) to NOWJC (Arbitrum)

### Test 1: Post Job with 0.01 USDC

**Command:**
```bash
source .env && cast send 0x9588A78748a8bc82295bf44d87C4b9F924d11AE8 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmTestJobV3Hash123" \
  '["Milestone 1"]' \
  '[10000]' \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00005ether
```

**Source Transaction (Optimism):**
```
status               1 (success)
transactionHash      0xd901f0a4a1c83c27feca4779bae8462dd926fb7f361fd23a3151b0644755ecae
```

**LayerZero Status:**
```
status: DELIVERED
destination.status: SUCCEEDED
destination.txHash: 0xeb17c2a4c57ca517dad88e820b100679ffd2aa1241d0deba9ad18d9cc031f3d8
blockNumber: 424345521
```

**Result:** Job "30111-2" created on Arbitrum ✅

### Key Parameters (V3)

| Parameter | Value |
|-----------|-------|
| Source Chain | Optimism (EID: 30111) |
| Destination Chain | Arbitrum (EID: 30110) |
| Gas Limit | 400,000 (0x61A80) |
| LZ Options | `0x00030100110100000000000000000000000000061A80` |
| LZ Fee | ~0.00005 ETH |
| Job ID Format | `{chainId}-{jobCounter}` = "30111-2" |
| Milestone Payment | 10000 (0.01 USDC) |

---

# LOWJC V4 Cross-Chain Tests - January 23, 2026

## Background

LOWJC V3 Proxy had implementation mismatch due to deploying with `0x` as init data. The proxy stored wrong implementation address, causing "Delegatecall failed" errors on function calls.

**Solution:** Deploy V4 with atomic initialization - full init calldata embedded in proxy constructor.

## V4 Deployment

| Contract | Address |
|----------|---------|
| LOWJC Impl | `0xcC09C58e654D92CBaa5184E000275500b32b2117` (reused from V3) |
| LOWJC Proxy V4 | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` |

**Implementation Verified:**
```bash
cast storage 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url $OPTIMISM_MAINNET_RPC_URL
# Result: 0x000000000000000000000000cC09C58e654D92CBaa5184E000275500b32b2117 ✅
```

---

## Test: Post Job from LOWJC V4 (Optimism) to NOWJC (Arbitrum)

### Test 1: Job "30111-1" (FAILED - Destination)

**Source TX:** `0x375af0574bb25a78ad41098cffcb398eac32fbd1895ba96ef9a9f51735efdc0b`

**LayerZero Status:** FAILED on destination
- Source: SUCCEEDED
- Destination: FAILED - "Job exists"

**Root Cause:** Job "30111-1" already exists on Arbitrum (created earlier during V3 testing)

---

### Test 2: Job "30111-2" (FAILED - Destination)

**Source TX:** `0xf61ff1dc9f3c1128d099882228a1558c251c3a9ac4fd8faf036bbcc0076be4bd`

**LayerZero Status:** FAILED on destination
- Source: SUCCEEDED
- Destination: FAILED - "Job exists"

**Root Cause:** Job "30111-2" already exists on Arbitrum

---

### Test 3: Job "30111-3" (SUCCESS) ✅

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmSkipJob2" \
  '["Milestone 1"]' \
  '[10000]' \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00005ether
```

**Source Transaction (Optimism):**
```
transactionHash      0x6430e160b5843b7ca5474c2e5582b3216ebb984dce0ace40fa9d3819ac9ca5d7
blockNumber          146789028
status               1 (success)
```

**LayerZero Status:**
```json
{
  "status": {
    "name": "DELIVERED",
    "message": "Executor transaction confirmed"
  }
}
```

**Destination Details:**
| Field | Value |
|-------|-------|
| Source EID | 30111 (Optimism) |
| Destination EID | 30110 (Arbitrum) |
| Nonce | 12 |
| Source Status | SUCCEEDED |
| Destination Status | **SUCCEEDED** ✅ |
| Job ID | 30111-3 |
| Destination TX | `0x0de20bc81375566301e2201e60750f0811fb353e34b19f98019c1ab27a685db1` |

**Result:** Job "30111-3" created on Arbitrum ✅

---

## V4 Connection Verification

```bash
# All verified on-chain
LocalBridge.lowjcContract(): 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 ✅
LocalBridge.authorizedContracts(V4): true ✅
LOWJC V4.cctpMintRecipient(): 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 ✅
LOWJC V4.athenaClientContract(): 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d ✅
LocalAthena.jobContract(): 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 ✅
```

---

## LOWJC Version History

| Version | Proxy | Implementation | chainId | Issue | Status |
|---------|-------|----------------|---------|-------|--------|
| V1 | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x20Fa...` | 2 ❌ | Wrong chainId (CCTP vs LZ) | DEPRECATED |
| V2 | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | `0xfab6Eb...` | 30111 ✅ | Upgrade mechanism broken | DEPRECATED |
| V3 | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | `0xcC09C5...` | 30111 ✅ | Implementation mismatch (wrong impl stored) | DEPRECATED |
| V4 | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0xcC09C5...` | 30111 ✅ | None - atomic init | ✅ ACTIVE |

---

## Key Lesson Learned

**Problem:** Deploying UUPS proxy with `0x` (empty bytes) as init data caused ERC1967 implementation slot to store wrong address.

**Solution:** Always use atomic initialization:
```bash
# WRONG:
forge create ... UUPSProxy --constructor-args 0xIMPL 0x
# Then: cast send PROXY "initialize(...)"

# CORRECT:
forge create ... UUPSProxy --constructor-args 0xIMPL $(cast calldata "initialize(...)" arg1 arg2)
```

---

## Next Steps

1. ✅ Job "30111-3" created successfully via V4
2. Test `applyToJob` from second wallet (TEST_WALLET_KEY)
3. Test full job lifecycle: apply → start → complete milestone → approve
4. ✅ Test USDC transfer flow (CCTP integration)

---

# startJob + CCTP Test - January 23, 2026

## Test: startJob with CCTP USDC Transfer (Job 30111-3)

### Prerequisites Completed

1. **CCTPTransceiver V2 deployed:** `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15`
2. **LOWJC V4 updated:** `setCCTPSender` pointed to CCTPTransceiver V2
3. **USDC approved:** 10000 (0.01 USDC) to LOWJC V4

### startJob Transaction

**Source TX (Optimism):** `0x879245f389719ecb80675e8a1cf0fdb0f5ba7d0a5a35d672fdb643cec45cc00d`

**Parameters:**
- Job ID: `30111-3`
- Application ID: `1`
- Use Applicant Milestones: `false`
- LZ Options: `0x00030100110100000000000000000000000000061A80` (400k gas)

### CCTP Transfer Results

| Field | Value |
|-------|-------|
| Source Chain | Optimism (Domain 2) |
| Destination Chain | Arbitrum (Domain 3) |
| Amount | 10000 (0.01 USDC) |
| Fee Executed | 1 |
| Amount Received | 9999 |
| Mint Recipient | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (NOWJC) |
| Status | **COMPLETE** ✅ |

**NOWJC USDC Balance:**
- Pre-transfer: 0
- Post-transfer: 9999 ✅

### LayerZero Message Results

| Field | Value |
|-------|-------|
| Source EID | 30111 (Optimism) |
| Destination EID | 30110 (Arbitrum) |
| Status | **DELIVERED** ✅ |
| Destination TX | `0x80ecadd417b7508ebab7943d95767f0386170df17c92873868a1395c11dd3b19` |

### Summary

**Full startJob flow verified:**
1. ✅ USDC transferred from job giver → LOWJC V4
2. ✅ LOWJC V4 → CCTPTransceiver V2 (USDC approved + sendFast called)
3. ✅ CCTPTransceiver V2 → Circle TokenMessengerV2 (depositForBurn)
4. ✅ CCTP attestation received (status: complete)
5. ✅ MessageTransmitterV2 on Arbitrum → receiveMessage → USDC minted to NOWJC
6. ✅ LayerZero message delivered → job status updated on Arbitrum

**CCTP V2 integration working on mainnet** ✅
