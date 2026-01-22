# Cross-Chain Integration Test Log - January 22, 2026

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

| Contract | Chain | Address |
|----------|-------|---------|
| LOWJC Proxy | Optimism | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| LocalBridge | Optimism | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| NativeBridge | Arbitrum | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` |
| NOWJC Proxy | Arbitrum | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| Genesis Proxy | Arbitrum | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
