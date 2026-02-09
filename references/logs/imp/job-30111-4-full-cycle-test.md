# Job 30111-4 Full Lifecycle Test - January 23, 2026

## Objective

Complete clean job cycle test without errors or workarounds as definitive proof that the job lifecycle works.

**Contracts:**
- LOWJC V4 (Optimism): `0x620205A4Ff0E652fF03a890d2A677de878a1dB63`
- NOWJC (Arbitrum): `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99`
- CCTPTransceiver V2 (Optimism): `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15`

**Wallets:**
- Job Giver (Deployer): `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- Applicant: `0x93514040f43aB16D52faAe7A3f380c4089D844F9`

---

## Step 1: postJob

**TX Hash:** `0x23f3d2435de912dac6d90f376451bb45430869bb9630a9b4ef2e253cd7a77b6c`

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "postJob(string,string[],uint256[],bytes)" \
  "QmJob30111-4" \
  '["Milestone 1"]' \
  '[10000]' \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00005ether
```

**Result:**
- Job ID: `30111-4`
- Amount: 10000 (0.01 USDC)
- LayerZero: DELIVERED ✅

---

## Step 2: applyToJob

**TX Hash:** `0xb03d23f571b3247a3a014b29dde3228bf997787bc4070ff1547ae241cf24a8e9`

**Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "applyToJob(string,string,string[],uint256[],uint32,bytes)" \
  "30111-4" \
  "QmApplicationHash30111-4" \
  '["Milestone 1"]' \
  '[10000]' \
  2 \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $applicant \
  --value 0.00005ether
```

**Result:**
- Application ID: `1`
- Applicant: `0x93514040f43aB16D52faAe7A3f380c4089D844F9`
- Preferred Chain Domain: `2` (Optimism)
- LayerZero: DELIVERED ✅
- Destination TX: `0x8d068af6949ea238bf0dd6f74ae5c7ab1912e128ae76103b6b69f9a80289bb4d`

---

## Step 3: Approve USDC + startJob

**startJob TX Hash:** `0x22114443f3beb8ae790e8f2d5dc660498a7cb3713d3654d70fe8ee5192cc2195`

**Approve USDC Command:**
```bash
source .env && cast send 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  "approve(address,uint256)" \
  0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  10000 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**startJob Command:**
```bash
source .env && cast send 0x620205A4Ff0E652fF03a890d2A677de878a1dB63 \
  "startJob(string,uint256,bool,bytes)" \
  "30111-4" \
  1 \
  false \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00005ether
```

**CCTP Transfer:**
| Field | Value |
|-------|-------|
| Source | Optimism (Domain 2) |
| Destination | Arbitrum (Domain 3) |
| Amount | 10000 |
| Fee | 1 |
| Mint Recipient | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (NOWJC) |

**Result:** LayerZero DELIVERED ✅

---

## Step 4: Complete CCTP on Arbitrum

**NOWJC USDC Balance:**
- Pre-CCTP: 0
- Post-CCTP: 9999 ✅

**Result:** CCTP completed ✅

---

## Step 5: releasePaymentCrossChain

**TX Hash:** (pending)

**Command:**
```bash
source .env && cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "releasePaymentCrossChain(string,uint256,uint32,bytes)" \
  "30111-4" \
  0 \
  2 \
  '0x00030100110100000000000000000000000000061A80' \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY \
  --value 0.00005ether
```

**Note:** Domain `2` = Optimism (applicant's preferred chain)

**Result:** (pending)

---

## Step 6: Complete CCTP on Optimism (Applicant Payment)

**TX Hash:** (pending)

**Check Attestation:**
```bash
curl "https://iris-api.circle.com/v2/messages/3?transactionHash=RELEASE_TX_HASH"
```

**Complete CCTP Command:**
```bash
source .env && cast send 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 \
  "receiveMessage(bytes,bytes)" \
  "MESSAGE_FROM_API" \
  "ATTESTATION_FROM_API" \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

**Result:** (pending)

---

## Step 7: Verify Applicant Balance

**Check Applicant USDC Balance (Optimism):**
```bash
source .env && cast call 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 \
  "balanceOf(address)(uint256)" \
  0x93514040f43aB16D52faAe7A3f380c4089D844F9 \
  --rpc-url $OPTIMISM_MAINNET_RPC_URL
```

**Result:** (pending)

---

## Summary

| Step | Status | TX Hash |
|------|--------|---------|
| postJob | ✅ | `0x23f3d2435de912dac6d90f376451bb45430869bb9630a9b4ef2e253cd7a77b6c` |
| applyToJob | ✅ | `0xb03d23f571b3247a3a014b29dde3228bf997787bc4070ff1547ae241cf24a8e9` |
| startJob | pending | |
| CCTP (Arbitrum) | pending | |
| releasePayment | pending | |
| CCTP (Optimism) | pending | |
| Verify Payment | pending | |
