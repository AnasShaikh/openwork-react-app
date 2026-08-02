# Full Job Cycle Testing - 8-Jan Contract Suite

**Date:** January 9, 2026
**Network:** Testnet (Arbitrum Sepolia, Optimism Sepolia)

---

## Contract Addresses

### Arbitrum Sepolia (Native Chain - EID: 40231)
| Contract | Address |
|----------|---------|
| NOWJC | `0x39158a9F92faB84561205B05223929eFF131455e` |
| NativeBridge | `0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502` |
| CCTPTransceiver | `0x959d0fc6dD8efCf764BD3B0bbaC191F2D7Dd03f1` |
| USDC | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |

### Optimism Sepolia (Local Chain - EID: 40232)
| Contract | Address |
|----------|---------|
| LOWJC | `0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db` |
| LocalBridge | `0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b` |
| CCTPTransceiver | `0x3c820FE16F7B85BA193527E5ca64dd3193F6ABB3` |
| USDC | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |

---

## Test Wallets

| Wallet | Address | Role |
|--------|---------|------|
| WALL2 | `0xfD08836eeE6242092a9c869237a8d122275b024A` | Job Giver (ARB) / Job Taker (OP) |

---

## Initial Balances (Before Testing)

| Wallet | ARB ETH | OP ETH | ARB USDC | OP USDC |
|--------|---------|--------|----------|---------|
| WALL2 | 0.033 | 0.095 | 29.27 | 12.27 |
| NOWJC Escrow | - | - | TBD | - |

---

## Test Job Details

- **Job ID:** `40231-JAN9-001`
- **Job Giver:** WALL2 (on ARB Sepolia)
- **Total Budget:** 10 USDC
- **Milestones:**
  - Milestone 1: 4 USDC (4,000,000 units)
  - Milestone 2: 6 USDC (6,000,000 units)

---

## Job Cycle Steps

### Step 1: Post Job (Direct on NOWJC - ARB)

**Command:**
```bash
source .env && cast send 0x39158a9F92faB84561205B05223929eFF131455e "postJob(string,address,string,string[],uint256[])" "40231-JAN9-001" 0xfD08836eeE6242092a9c869237a8d122275b024A "QmJobDetails9Jan2026" '["Milestone 1: Design","Milestone 2: Implementation"]' '[4000000,6000000]' --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

**Result:** TBD

---

### Step 2: Apply to Job (Cross-Chain from OP)

**Note:** Self-application prevention is active. Need different wallet or apply from different context.

**LZ Options (900k gas):** `0x000301001101000000000000000000000000000DBBA0`

**Command:** TBD

---

### Step 3: Start Job + USDC Escrow

**Flow:** Job Giver approves USDC → LOWJC/NOWJC → CCTP → Escrow on destination

---

### Step 4: Submit Work

---

### Step 5: Approve Milestone

---

### Step 6: Complete Job

---

## Fund Tracking

| Step | From | To | Amount | TX Hash |
|------|------|----|--------|---------|
| Initial | - | - | - | - |

---
