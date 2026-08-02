# Job 30111-9 Full Lifecycle Test - January 24, 2026

## Objective

Complete cross-chain job cycle test on mainnet with all transactions logged.

---

## Contracts

| Contract | Chain | Address |
|----------|-------|---------|
| LOWJC V4 | Optimism | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` |
| NOWJC | Arbitrum | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| CCTPTransceiver V2 | Optimism | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` |
| CCTPTransceiver | Arbitrum | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |
| MessageTransmitterV2 | All Chains | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |
| USDC | Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| USDC | Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |

## Wallets

| Role | Address |
|------|---------|
| Job Giver (Deployer) | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Applicant | `0x93514040f43aB16D52faAe7A3f380c4089D844F9` |

---

## Step 1: postJob

**Chain:** Optimism
**TX Hash:** `0x91e88e41e2639fcf790160adbdde62f64ccbda2d70551a9a74d9d9b44974da1b`
**Block:** 146797351

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmJobDetailHashHere" \
  "[\"QmMilestone1Hash\"]" \
  "[10000]" \
  "0x000301001101000000000000000000000000000F4240" \
  --value 0.00006ether \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Result:**
- Job ID: `30111-9`
- Amount: 10000 (0.01 USDC)
- LayerZero: DELIVERED ✅

---

## Step 2: applyToJob

**Chain:** Optimism
**TX Hash:** `0xceeaef8df05f48b9ee362e8034923c20b8cae4dd43f1774c91c8d341f8d1f57b`
**Block:** 146797409

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "applyToJob(string,string,string[],uint256[],uint32,bytes)" \
  "30111-9" \
  "QmApplicationHash" \
  "[\"QmMilestone1Hash\"]" \
  "[10000]" \
  2 \
  "0x000301001101000000000000000000000000000F4240" \
  --value 0.00006ether \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $applicant
```

**Result:**
- Application ID: `1`
- Applicant: `0x93514040f43aB16D52faAe7A3f380c4089D844F9`
- Preferred Chain Domain: `2` (Optimism)
- LayerZero: DELIVERED ✅

---

## Step 3: Approve USDC

**Chain:** Optimism
**TX Hash:** `0xa791305ca24f8681b00c9466232f91255b3fd4ff9a0dbeff7e0755d8b1d8ef81`
**Block:** 146797446

**Command:**
```bash
source .env && cast send 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  "approve(address,uint256)" \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  10000 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Result:** ✅ Approved

---

## Step 4: startJob

**Chain:** Optimism
**TX Hash:** `0x18dc4c232b132b3e1c66f91590ddd84549dce2c01cb5fb7b8c043d8e6229ab52`
**Block:** 146797450

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "startJob(string,uint256,bool,bytes)" \
  "30111-9" \
  1 \
  false \
  "0x000301001101000000000000000000000000000F4240" \
  --value 0.00006ether \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**CCTP Transfer (Optimism → Arbitrum):**

| Field | Value |
|-------|-------|
| Source Domain | 2 (Optimism) |
| Destination Domain | 3 (Arbitrum) |
| Amount | 10000 |
| Max Fee | 1000 |
| Mint Recipient | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (NOWJC) |

**Result:** LayerZero DELIVERED ✅

---

## Step 5: Complete CCTP on Arbitrum

**Chain:** Arbitrum
**TX Hash:** `0x70647c529668129be9d94778b2d475cc0d86c003f0608f76f82a41fac641cc32`
**Block:** 424469528

**Command:**
```bash
source .env && cast send 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 \
  "receiveMessage(bytes,bytes)" \
  "MESSAGE_BYTES" \
  "ATTESTATION_BYTES" \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Result:**
- NOWJC received: 9999 USDC (10000 - 1 fee)
- Status: ✅ Complete

---

## Step 6: releasePaymentCrossChain

**Chain:** Optimism
**TX Hash:** `0xf5b7614615f034e7dafea8905a309e6fecf29cfce8d4fe497065ed270320228c`
**Block:** 146797540

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "releasePaymentCrossChain(string,uint32,address,bytes)" \
  "30111-9" \
  2 \
  0x93514040f43aB16D52faAe7A3f380c4089D844F9 \
  "0x000301001101000000000000000000000000000F4240" \
  --value 0.00006ether \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**LayerZero Status:**
- Source: SUCCEEDED
- Destination: SUCCEEDED
- Overall: DELIVERED ✅
- Destination TX: `0x2d14ec2c7460123fdb7db371024d9fe7e1bfc56b147d0ff56c279c89929c2aac`

---

## Step 7: Complete CCTP on Optimism (Applicant Payment)

**Chain:** Optimism
**TX Hash:** `0x139eb03e7b4e47b6cf36cb4caebe6d16ff75da4d27fc87d2eab58b7f8f05d26b`
**Block:** 146798030

**CCTP Attestation Check:**
```bash
curl "https://iris-api.circle.com/v2/messages/3?transactionHash=0x2d14ec2c7460123fdb7db371024d9fe7e1bfc56b147d0ff56c279c89929c2aac"
```

**Command:**
```bash
source .env && cast send 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 \
  "receiveMessage(bytes,bytes)" \
  "MESSAGE_BYTES" \
  "ATTESTATION_BYTES" \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**CCTP Transfer (Arbitrum → Optimism):**

| Field | Value |
|-------|-------|
| Source Domain | 3 (Arbitrum) |
| Destination Domain | 2 (Optimism) |
| Amount | 9999 |
| Fee Executed | 1000 |
| Net to Applicant | 8999 |
| Mint Recipient | `0x93514040f43aB16D52faAe7A3f380c4089D844F9` |

**Result:** ✅ Complete

---

## Step 8: Verify Applicant Balance

**Command:**
```bash
source .env && cast call 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  "balanceOf(address)(uint256)" \
  0x93514040f43aB16D52faAe7A3f380c4089D844F9 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL
```

**Result:**
- Pre-release balance: 17,998 USDC
- Post-release balance: 26,997 USDC
- Increase: **8,999 USDC** ✅

---

## Summary

| Step | Chain | TX Hash | Status |
|------|-------|---------|--------|
| postJob | Optimism | `0x91e88e41...` | ✅ |
| applyToJob | Optimism | `0xceeaef8d...` | ✅ |
| approve USDC | Optimism | `0xa791305c...` | ✅ |
| startJob | Optimism | `0x18dc4c23...` | ✅ |
| CCTP (Arbitrum) | Arbitrum | `0x70647c52...` | ✅ |
| releasePayment | Optimism | `0xf5b76146...` | ✅ |
| LZ Delivery | Arbitrum | `0x2d14ec2c...` | ✅ |
| CCTP (Optimism) | Optimism | `0x139eb03e...` | ✅ |

---

## Flow Diagram

```
[Optimism]                              [Arbitrum]
    |                                       |
    | 1. postJob -----------------------> NOWJC (LZ)
    |                                       |
    | 2. applyToJob --------------------> NOWJC (LZ)
    |                                       |
    | 3. approve USDC                       |
    |                                       |
    | 4. startJob                           |
    |    - USDC burned on OP                |
    |    - CCTP message sent -------------> |
    |    - LZ message sent ---------------> NOWJC
    |                                       |
    |                           5. receiveMessage (CCTP)
    |                              - USDC minted to NOWJC
    |                                       |
    | 6. releasePaymentCrossChain           |
    |    - LZ message sent ---------------> NOWJC
    |                                       |
    |                           7. handleReleasePayment
    |                              - processJobPayment
    |                              - USDC burned
    |                              - CCTP message sent
    |                                       |
    | 8. receiveMessage (CCTP) <----------- |
    |    - USDC minted to Applicant         |
    |                                       |
```

---

## Key Learnings

1. **CCTP V2 MessageTransmitterV2** address is the same across all mainnet chains: `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`

2. **CCTP Fee Structure:**
   - startJob: Amount 10000, Fee 1 → NOWJC receives 9999
   - releasePayment: Amount 9999, Fee 1000 → Applicant receives 8999
   - Total fees: 1001 (0.001001 USDC)

3. **LZ Gas Options:** `0x000301001101000000000000000000000000000F4240` = 1M gas, sufficient for all operations

4. **Value for LZ:** 0.00006 ETH is sufficient for cross-chain messages

---

**Date:** January 24, 2026
**Status:** ✅ **COMPLETE**
