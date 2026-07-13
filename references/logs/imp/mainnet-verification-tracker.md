# Mainnet Contract Verification Tracker

**Started:** January 22, 2026
**Completed:** January 22, 2026
**Updated:** July 13, 2026 — XDC Mainnet and NativeAthena V8
**Commands Reference:** [mainnet-verification-commands.md](mainnet-verification-commands.md)

---

## Progress Summary

| Chain | Total | Verified | Pending | Status |
|-------|-------|----------|---------|--------|
| Arbitrum One | 22 | 22 | 0 | Complete |
| Optimism | 6 | 6 | 0 | Complete |
| Ethereum Mainnet | 5 | 5 | 0 | Complete |
| XDC Mainnet | 6 | 6 | 0 | Complete |
| **TOTAL** | **39** | **39** | **0** | **100%** |

---

# ARBITRUM ONE (Chain ID: 42161)

## Implementations (5)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 1 | NativeOpenWorkJobContract Impl | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36) |
| 2 | NativeAthena Impl | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510) |
| 3 | NativeOpenworkDAO Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) |
| 4 | NativeOpenworkGenesis Impl | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) |
| 5 | NativeAthena V8 XDC Domain Impl | `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31) |

## Proxies (4)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 5 | Genesis Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294) |
| 6 | NOWJC Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x8EfbF240240613803B9c9e716d4b5AD1388aFd99) |
| 7 | DAO Proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x24af98d763724362DC920507b351cC99170a5aa4) |
| 8 | Athena Proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf) |

## Non-Upgradeable (4)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 9 | NativeLZOpenworkBridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) |
| 10 | NativeRewardsContract | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7) |
| 11 | CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87) |
| 12 | NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | [x] Verified | [Arbiscan](https://arbiscan.io/address/0x29D61B1a9E2837ABC0810925429Df641CBed58c3) |

## Supporting Contracts - Jan 22 (9)

| # | Contract | Implementation | Proxy | Status |
|---|----------|---------------|-------|--------|
| 13 | NativeProfileGenesis | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | [x] Verified |
| 14 | NativeAthenaActivityTracker | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | [x] Verified |
| 15 | NativeAthenaOracleManager | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | [x] Verified |
| 16 | NativeProfileManager | `0xf82D59Cf9339D500C1b35C87D02dE422223812f6` | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | [x] Verified |
| 17 | NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | N/A (Non-Upgradeable) | [x] Verified |

**Arbiscan Links (Jan 22):**
- [ProfileGenesis Impl](https://arbiscan.io/address/0xae31d7be760D92807B013a71bb51f2cBB132166b) | [Proxy](https://arbiscan.io/address/0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E)
- [ActivityTracker Impl](https://arbiscan.io/address/0x9588A78748a8bc82295bf44d87C4b9F924d11AE8) | [Proxy](https://arbiscan.io/address/0x8C04840c3f5b5a8c44F9187F9205ca73509690EA)
- [OracleManager Impl](https://arbiscan.io/address/0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59) | [Proxy](https://arbiscan.io/address/0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15)
- [ProfileManager Impl](https://arbiscan.io/address/0xf82D59Cf9339D500C1b35C87D02dE422223812f6) | [Proxy](https://arbiscan.io/address/0x51285003A01319c2f46BB2954384BCb69AfB1b45)
- [GenesisReader](https://arbiscan.io/address/0x72ee091C288512f0ee9eB42B8C152fbB127Dc782)

---

# OPTIMISM (Chain ID: 10)

## Implementations (2)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 1 | LocalOpenWorkJobContract Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) |
| 2 | LocalAthena Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) |

## Proxies (2)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 3 | LOWJC Proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7) |
| 4 | LocalAthena Proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) |

## Non-Upgradeable (2)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 5 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36) |
| 6 | CCTPTransceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | [x] Verified | [OP Etherscan](https://optimistic.etherscan.io/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510) |

---

# ETHEREUM MAINNET (Chain ID: 1)

## Implementation (1)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 1 | ETHOpenworkDAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | [x] Verified | [Etherscan](https://etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) |

## Proxy (1)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 2 | ETHOpenworkDAO Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | [x] Verified | [Etherscan](https://etherscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294) |

## Non-Upgradeable (3)

| # | Contract | Address | Status | Link |
|---|----------|---------|--------|------|
| 3 | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | [x] Verified | [Etherscan](https://etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) |
| 4 | ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | [x] Verified | [Etherscan](https://etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) |
| 5 | OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | [x] Verified | [Etherscan](https://etherscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87) |

---

# XDC MAINNET (Chain ID: 50)

| # | Contract | Address | Status | Link |
|---|---|---|---|---|
| 1 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | [x] Verified | [XDCScan](https://xdcscan.com/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36#code) |
| 2 | CCTPTransceiverXdcStandard12Jul2026 | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | [x] Verified | [XDCScan](https://xdcscan.com/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510#code) |
| 3 | LOWJC implementation | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | [x] Verified | [XDCScan](https://xdcscan.com/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F#code) |
| 4 | LocalAthena implementation | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | [x] Verified | [XDCScan](https://xdcscan.com/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9#code) |
| 5 | LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | [x] Verified + linked | [XDCScan](https://xdcscan.com/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7#code) |
| 6 | LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | [x] Verified + linked | [XDCScan](https://xdcscan.com/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d#code) |

---

# Verification Log

## Session 2 - July 13, 2026

| Action | Result |
|---|---|
| XDC non-upgradeable contracts (2) | Verified |
| XDC implementations (2) | Verified |
| XDC proxies (2) | Verified and linked to implementations |
| Published compiler settings | Solidity 0.8.23, optimizer 200, viaIR, Shanghai EVM |

## Session 1 - January 22, 2026

| Time | Action | Result |
|------|--------|--------|
| -- | Arbitrum Implementations (4) | All submitted successfully |
| -- | Arbitrum Non-Upgradeable (4) | All submitted successfully |
| -- | Arbitrum Proxies (4) | Already verified |
| -- | Optimism Implementations (2) | All submitted successfully |
| -- | Optimism Non-Upgradeable (2) | All submitted successfully |
| -- | Optimism Proxies (2) | Already verified |
| -- | ETH Mainnet Implementation (1) | Submitted successfully |
| -- | ETH Mainnet Non-Upgradeable (3) | All submitted successfully |
| -- | ETH Mainnet Proxy (1) | Submitted successfully |

**Note:** Proxies on Arbitrum and Optimism were already verified from a previous session.

---

# Verification GUIDs (for status checks)

## Arbitrum
- NativeAthena V8 XDC Domain Impl: `lkdszcc4wdhenvxmmziezuwm8s95jnd5l4uhf1tlqcebt6e9ft`
- NOWJC Impl: `ticqbvyzvs6rrb7iskgnrteqderbwduve4jjdeguhwnddt227k`
- Athena Impl: `bhldtrfldwexvhyacnrnwd4mfw5rdkdqwasdk2bifs2kfks6f4`
- DAO Impl: `geajqydzxymfztintkqlqbcy84cixv3za94qfbjuak4dxrszst`
- Genesis Impl: `h6fwdv2dbmmku2wm5qqu9h2nc57aaibdr5ewkfwyn21ygeh3hc`
- Bridge: `kt9yj15ti8qt4tb9uqpzcqusx7hugxn5sxpiwjldrrnn8vyywy`
- Rewards: `lteh1vzh1cjbdmkka75tfadk8k3gjc9jy9burbxtjdizuge2tn`
- CCTP: `kru4tbfuzftiyq4z44arvqadasr5rs71dvhhgwgafxchzrfuvu`
- Registry: `das2tvhqtskb3h9s6d7ljanalpmt5kmxawfy9c3marbpqwuvzg`

## Optimism
- LOWJC Impl: `nfeqarfzxh6ngyygztpqhflyskykn9ahnvnb5vjxa1c9cgxnsp`
- LocalAthena Impl: `3dq3v9tgxftucn8pskambu9segtclbnauz7wtkaeipy4egpq2p`
- Bridge: `fld6dz5xnfggwmsi1chcm6av4nv5eyr4bpw3xpnyrwxky2jlcv`
- CCTP: `fchp29bh2fd1jppdf6qqbcqamrzqp24auiifmmnmspm7uqlixv`

## Ethereum Mainnet
- DAO Impl: `n2y1mlducxrdmkwb8aejbbw7avmz4c8lifwqqb6qjxgcks9ee3`
- Bridge: `x968bcxsqrreqzp6vgq7mx5pafkinjmhv2fzfa5hiqkgr57gnf`
- Rewards: `jcznnez4kqrs66bjakurczqa1s17tf4ev6n1cp5n21i3xfhfet`
- Token: `7mdjdjv8skraqszivpkdaey8nkrvg7yav4zmvuayqgc7a28mhb`
- DAO Proxy: `vtpygz4gyvsd46dijpkqrvbynwdqpwz5vhpjtpkfvq3ar5ke3h`

---

# Post-Verification Checklist

- [x] All 39 tracked contracts verified
- [x] Arbitrum: 22/22 contracts verified
- [x] Optimism: 6/6 contracts verified
- [x] Ethereum: 5/5 contracts verified
- [x] Verification tracker updated with links
- [x] Spot checked ArbLOWJC V4, NativeAthena V8, and all six XDC contracts through the explorer API on July 13, 2026
