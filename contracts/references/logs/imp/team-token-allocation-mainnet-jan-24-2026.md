# Team Token Allocation - Mainnet - January 24, 2026

## Overview

**Chain:** Arbitrum One (Mainnet)
**Contract:** NativeRewardsContract V2 (`0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9`)
**Caller:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` (Deployer)

| TX | Recipient | Amount | Block | Status |
|----|-----------|--------|-------|--------|
| `0x5792...8dda` | Armand (3 wallets) | 90M OW | 424745498 | ✅ |
| `0x610d...85de` | Anas (1 wallet) | 30M OW | 424747334 | ✅ |

---

## Allocation Summary

### Armand - 90M OW Total

**TX Hash:** `0x57920dbe8ce51d8b3b55c23dd08c8d03f22b2b38d19c449a2fa7004b97008dda`
**Block:** 424745498
**Arbiscan:** https://arbiscan.io/tx/0x57920dbe8ce51d8b3b55c23dd08c8d03f22b2b38d19c449a2fa7004b97008dda

| Wallet | Address | Amount | Status |
|--------|---------|--------|--------|
| Wallet 1 | `0xEbfb0691C113978A584B4544c28613A0B4BccB06` | 30,000,000 OW | ✅ Allocated |
| Wallet 2 | `0x117D1EC24ac547f4Ea20A5561007aE5d4Cb47F63` | 30,000,000 OW | ✅ Allocated |
| Wallet 3 | `0xf7faeD39870dF78dea45159a4Db597A94a96dB87` | 30,000,000 OW | ✅ Allocated |

---

### Anas - 30M OW Total

**TX Hash:** `0x610dcb64eeb4ac3bb228a857b3a2b95765c42ecb827c2687a5d6bd2c09a885de`
**Block:** 424747334
**Arbiscan:** https://arbiscan.io/tx/0x610dcb64eeb4ac3bb228a857b3a2b95765c42ecb827c2687a5d6bd2c09a885de

| Wallet | Address | Amount | Status |
|--------|---------|--------|--------|
| Wallet 1 | `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` | 30,000,000 OW | ✅ Allocated |

---

## Pool Status

| Metric | Value |
|--------|-------|
| TEAM_TOKENS_POOL | 150,000,000 OW |
| Total Allocated | 120,000,000 OW |
| Remaining | 30,000,000 OW |

---

## Command Used

```bash
source .env && cast send 0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 \
  "allocateTeamTokens(address[],uint256[])" \
  "[0xEbfb0691C113978A584B4544c28613A0B4BccB06,0x117D1EC24ac547f4Ea20A5561007aE5d4Cb47F63,0xf7faeD39870dF78dea45159a4Db597A94a96dB87]" \
  "[30000000000000000000000000,30000000000000000000000000,30000000000000000000000000]" \
  --rpc-url $ARBITRUM_MAINNET_RPC_URL \
  --private-key $PROD_DEPLOYER_KEY
```

---

## Verification Commands

**Check individual allocation:**
```bash
source .env && cast call 0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 "getTeamMemberInfo(address)" <WALLET_ADDRESS> --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

**Check total allocated:**
```bash
source .env && cast call 0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9 "totalTeamTokensAllocated()" --rpc-url $ARBITRUM_MAINNET_RPC_URL
```

---

## Verification Results

### Wallet 1 (0xEbfb...cB06)
- isMember: true
- allocated: 30,000,000 OW (0x18d0bf423c03d8de000000)
- claimed: 0
- claimable: 0 (requires governance actions to unlock)

### Wallet 2 (0x117D...f63)
- isMember: true
- allocated: 30,000,000 OW (0x18d0bf423c03d8de000000)
- claimed: 0
- claimable: 0

### Wallet 3 (0xf7fa...dB87)
- isMember: true
- allocated: 30,000,000 OW (0x18d0bf423c03d8de000000)
- claimed: 0
- claimable: 0

### Anas Wallet (0xC284...7724)
- isMember: true
- allocated: 30,000,000 OW (0x18d0bf423c03d8de000000)
- claimed: 0
- claimable: 0

---

## Token Unlocking Mechanism

Team tokens unlock based on governance actions:
- **Formula:** `maxUnlocked = govActions × TOKENS_PER_GOV_ACTION`
- **Default rate:** 150,000 OW per governance action
- **Claimable:** `min(maxUnlocked, allocated) - claimed`

### Governance Actions Include:
1. Creating DAO proposals
2. Voting on DAO proposals
3. Job-related governance actions

---

## Transaction Logs

```json
{
  "blockNumber": 424745498,
  "transactionHash": "0x57920dbe8ce51d8b3b55c23dd08c8d03f22b2b38d19c449a2fa7004b97008dda",
  "from": "0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C",
  "to": "0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9",
  "gasUsed": 282576,
  "status": "success",
  "events": [
    {
      "event": "TeamTokensAllocated",
      "member": "0xEbfb0691C113978A584B4544c28613A0B4BccB06",
      "amount": "30000000000000000000000000"
    },
    {
      "event": "TeamTokensAllocated",
      "member": "0x117D1EC24ac547f4Ea20A5561007aE5d4Cb47F63",
      "amount": "30000000000000000000000000"
    },
    {
      "event": "TeamTokensAllocated",
      "member": "0xf7faeD39870dF78dea45159a4Db597A94a96dB87",
      "amount": "30000000000000000000000000"
    }
  ]
}
```

---

**Date:** January 24, 2026
**Status:** ✅ COMPLETE
