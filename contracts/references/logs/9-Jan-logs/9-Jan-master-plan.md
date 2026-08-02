# OpenWork 8-Jan Contract Suite - Master Deployment Plan

**Start Date:** January 9, 2026
**Suite Version:** 8-Jan-2026
**Contract Source:** `src/suites/openwork-all-contracts-8-Jan-version/`

---

## Networks

| Chain | Role | EID | RPC Env Var |
|-------|------|-----|-------------|
| Arbitrum Sepolia | Native | 40231 | `ARBITRUM_SEPOLIA_RPC_URL` |
| Optimism Sepolia | Local | 40232 | `OPTIMISM_SEPOLIA_RPC_URL` |
| Ethereum Sepolia | Main | 40161 | `ETHEREUM_SEPOLIA_RPC_URL` |

---

## Current Status

**Current Phase:** Phase 3 - Optimism Sepolia Deployment
**Current Checkpoint:** `ARB-CONFIGURED`
**Last Updated:** January 9, 2026
**Blocking Issues:** None

---

## Phase Progress

| Phase | Description | Checkpoint ID | Status |
|-------|-------------|---------------|--------|
| 0 | Pre-Deployment Setup | `PREP-COMPLETE` | [x] Complete |
| 1 | Arbitrum Sepolia Deployment | `ARB-DEPLOYED` | [x] Complete |
| 2 | Arbitrum Configuration | `ARB-CONFIGURED` | [x] Complete |
| 3 | Optimism Sepolia Deployment | `OP-DEPLOYED` | [ ] Not Started |
| 4 | Optimism Configuration | `OP-CONFIGURED` | [ ] Not Started |
| 5 | Ethereum Sepolia Deployment | `ETH-DEPLOYED` | [ ] Not Started |
| 6 | Ethereum Configuration | `ETH-CONFIGURED` | [ ] Not Started |
| 7 | Cross-Chain Peer Setup | `PEERS-CONFIGURED` | [ ] Not Started |
| 8 | Contract Verification | `VERIFIED` | [ ] Not Started |
| 9 | Functional Testing | `TESTS-PASSED` | [ ] Not Started |
| 10 | Documentation & Registry | `DEPLOYMENT-COMPLETE` | [ ] Not Started |

---

## Phase 0: Pre-Deployment Setup

### Wallet Balances

**Deployer Address:** `0xfD08836eeE6242092a9c869237a8d122275b024A` (WALL2)

| Chain | ETH Balance | USDC Balance | Status |
|-------|-------------|--------------|--------|
| Arbitrum Sepolia | 0.035 | 29.27 | [x] OK |
| Optimism Sepolia | 0.096 | 12.27 | [x] OK |
| Ethereum Sepolia | 0.139 | 26.33 | [x] OK |

### Environment Verification

| Check | Status |
|-------|--------|
| .env file exists | [x] |
| ARBITRUM_SEPOLIA_RPC_URL set | [x] |
| OPTIMISM_SEPOLIA_RPC_URL set | [x] |
| ETHEREUM_SEPOLIA_RPC_URL set | [x] |
| WALL2_KEY set | [x] |
| ARBSCAN_API_KEY set | [x] |
| ETHERSCAN_API_KEY set | [x] |
| OPSCAN_API_KEY set | [x] |

### Compilation

| Check | Status |
|-------|--------|
| `forge build` successful | [x] |
| No compilation errors | [x] (1 warning in cctp-transceiver.sol - function naming) |

---

## Contract Address Registry

### Arbitrum Sepolia (Native Chain)

| Contract | Implementation | Proxy | Status |
|----------|---------------|-------|--------|
| NativeContractRegistry | | N/A | [ ] |
| NativeGenesisReader | | | [ ] |
| NativeOpenworkGenesis | | | [ ] |
| NativeProfileGenesis | | | [ ] |
| NativeProfileManager | | | [ ] |
| NativeRewardsContract | | | [ ] |
| NativeOpenWorkJobContract | | | [ ] |
| NativeAthenaOracleManager | | | [ ] |
| NativeAthenaActivityTracker | | | [ ] |
| NativeAthena | | | [ ] |
| NativeOpenworkDAO | | | [ ] |
| NativeLZOpenworkBridge | | N/A | [ ] |
| CCTPTransceiver | | N/A | [ ] |

### Optimism Sepolia (Local Chain)

| Contract | Implementation | Proxy | Status |
|----------|---------------|-------|--------|
| LocalOpenWorkJobContract | | | [ ] |
| LocalAthena | | | [ ] |
| LocalLZOpenworkBridge | | N/A | [ ] |
| CCTPTransceiver | | N/A | [ ] |

### Ethereum Sepolia (Main Chain)

| Contract | Implementation | Proxy | Status |
|----------|---------------|-------|--------|
| ETHRewardsContract | | | [ ] |
| ETHOpenworkDAO | | | [ ] |
| OpenworkToken | | N/A | [ ] |
| ETHLZOpenworkBridge | | N/A | [ ] |

---

## Environment Constants

```bash
# LayerZero V2 EIDs
ARB_SEPOLIA_EID=40231
OP_SEPOLIA_EID=40232
ETH_SEPOLIA_EID=40161

# LZ Endpoint (all chains)
LZ_ENDPOINT=0x6EDCE65403992e310A62460808c4b910D972f10f

# CCTP (all chains)
TOKEN_MESSENGER=0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
MESSAGE_TRANSMITTER=0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275

# USDC
USDC_ARB_SEPOLIA=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
USDC_OP_SEPOLIA=0x5fd84259d66Cd46123540766Be93DFE6D43130D7
USDC_ETH_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

---

## Payment Testing Tracker

### Critical Tests (Must Pass)

| ID | Test | Status | Log Reference |
|----|------|--------|---------------|
| P5 | Cross-chain milestone payment (LZ + CCTP) | [ ] | |
| P9 | Escrow deposit on job start (CCTP) | [ ] | |
| P12 | Raise cross-chain dispute (LZ + CCTP) | [ ] | |
| P13 | Dispute fee transfer (CCTP) | [ ] | |
| P15 | Dispute settlement funds (CCTP) | [ ] | |
| P18 | CCTP attestation retrieval | [ ] | |
| P19 | CCTP message completion | [ ] | |
| P26 | Cross-chain reward sync (LZ) | [ ] | |
| P27 | Token claim on main chain | [ ] | |

### High Priority Tests

| ID | Test | Status | Log Reference |
|----|------|--------|---------------|
| P1-P4 | Job Lifecycle (Post, Apply, Select, Start) | [ ] | |
| P6 | Same-chain milestone payment | [ ] | |
| P8 | Final milestone + job completion | [ ] | |
| P10-P11 | Escrow operations | [ ] | |
| P14 | Vote on dispute | [ ] | |
| P20 | CCTP fee calculation | [ ] | |
| P23-P25 | Rewards (band calc, earning, gov actions) | [ ] | |
| P29-P31 | Staking (stake, sync, unlock) | [ ] | |
| P37 | Team token claim flow | [ ] | |

---

## Session Log

### Session 1 - January 9, 2026

**Started:**
**Phases Completed:**
**Stopping Point:**
**Next Actions:**

---

## Issues & Resolutions

| # | Issue | Root Cause | Resolution | Status |
|---|-------|------------|------------|--------|
| | | | | |

---

## Notes

- All commands and tx hashes documented in `9-Jan-deployment-log.md`
- Payment test details in `9-Jan-payment-tests.md`
