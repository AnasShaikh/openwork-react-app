# Openwork Verified Contracts - March 19, 2026

**Method:** ERC1967 implementation slot checked on-chain via `cast storage`. Source verified via `forge verify-contract`.

---

## Arbitrum One (Native Chain)

### Upgradeable — Implementation Slot Verified On-Chain

| # | Contract | Proxy | Implementation | Slot Match |
|---|----------|-------|----------------|------------|
| 1 | NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | MATCH |
| 2 | NativeOpenWorkJobContract (NOWJC) | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528` | MATCH |
| 3 | NativeArbOpenWorkJobContract | `0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587` | `0xC14310DE9C057FBF54797E7118abcD5C412BFcD2` | MATCH |
| 4 | NativeArbAthenaClient | `0xEC9446A163E74D2fBF3def75324895204415166D` | `0x0688FcF38eA366a7fACe4b056F0eC6b66E6DA06E` | NOT IN REGISTRY |
| 5 | NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | MATCH |
| 6 | NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0x80AA520dB868dc234ea852fC23Fa7c03e217Dad2` | MATCH |
| 7 | NativeProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | MATCH |
| 8 | NativeAthenaActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | MATCH |
| 9 | NativeAthenaOracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | MATCH |
| 10 | NativeProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x19E4fBe10C2F2531248e5FfDF150D8c61168702f` | MATCH |

### Non-Upgradeable

| # | Contract | Address |
|---|----------|---------|
| 11 | NativeLZOpenworkBridge V2 | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| 12 | NativeRewardsContract V2 | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` |
| 13 | CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |
| 14 | NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` |
| 15 | NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` |

---

## Optimism (Local Chain)

### Upgradeable — Implementation Slot Verified On-Chain

| # | Contract | Proxy | Implementation | Slot Match |
|---|----------|-------|----------------|------------|
| 16 | LocalOpenWorkJobContract Lite | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x74D6e1aDA0Dae53231298B24DeAf169647fd557d` | SOURCE VERIFIED (lite-v2.sol) |
| 17 | LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | MATCH |

### Non-Upgradeable

| # | Contract | Address |
|---|----------|---------|
| 18 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| 19 | CCTPTransceiver V2 | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` |

---

## Ethereum Mainnet

### Upgradeable — Implementation Slot Verified On-Chain

| # | Contract | Proxy | Implementation | Slot Match |
|---|----------|-------|----------------|------------|
| 20 | ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xAc0D2b744E9A1a347038bEBe6984db6ef47Daa05` | NOT IN REGISTRY |

### Non-Upgradeable

| # | Contract | Address |
|---|----------|---------|
| 21 | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| 22 | ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |
| 23 | OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |

---

## Summary

| Chain | Total | Slot Verified | Registry Match | Needs Investigation |
|-------|-------|---------------|----------------|---------------------|
| Arbitrum | 15 | 10/10 proxies | 9/10 | NativeArbAthenaClient impl unknown |
| Optimism | 4 | 2/2 proxies | 1/2 | LOWJC Lite — RESOLVED (lite-v2.sol verified) |
| Ethereum | 4 | 1/1 proxy | 0/1 | ETHOpenworkDAO impl unknown |

## Resolved

- **LOWJC Lite** (`0x620205A4...`): Registry said impl was `0x8255A7fa` but on-chain is `0x74D6e1aD`. Source verified as `local-openwork-job-contract-lite-v2.sol` on Optimistic Etherscan. Agent upgraded without logging.

## Still Needs Investigation

1. **NativeArbAthenaClient** — on-chain impl `0x0688FcF3...` not in registry (registry had `—`). Agent-deployed, no local source.
2. **ETHOpenworkDAO** — on-chain impl `0xAc0D2b74...` differs from registry (`0xF78B6888...`). Likely agent upgrade not logged.

## Etherscan Verification Status

- 22/23 contracts are NOT verified on block explorers
- 1/23 verified: LOWJC Lite impl `0x74D6e1aD` on Optimistic Etherscan
