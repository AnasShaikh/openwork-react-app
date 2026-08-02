# Contract Verification Audit - March 19, 2026

**Purpose:** Verify all live mainnet contracts are verified on block explorers and source matches deployed bytecode.

**Result: 0/23 contracts verified on any block explorer.**

**Snapshot:** `src/suites/snapshot-19-mar-2026/`

---

## Stable Contracts (unchanged since initial deploy)

### Arbitrum One - Upgradeable

| # | Contract | Proxy | Implementation | Source File | Verified? |
|---|----------|-------|----------------|-------------|-----------|
| 1 | NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `native/native-openwork-genesis.sol` | NO |
| 2 | NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | `native/native-openwork-dao.sol` | NO |
| 3 | NativeProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | `native/native-profile-genesis.sol` | NO |
| 4 | NativeAthenaActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | `native/native-athena-activity-tracker.sol` | NO |
| 5 | NativeAthenaOracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | `native/native-athena-oracle-manager.sol` | NO |

### Arbitrum One - Non-Upgradeable

| # | Contract | Address | Source File | Verified? |
|---|----------|---------|-------------|-----------|
| 6 | NativeLZOpenworkBridge V2 | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | `native/native-lz-openwork-bridge.sol` | NO |
| 7 | NativeRewardsContract V2 | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | `native/native-rewards-contract.sol` | NO |
| 8 | CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | `utilities/cctp-transceiver.sol` | NO |
| 9 | NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | `native/native-contract-registry.sol` | NO |
| 10 | NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | `native/native-genesis-reader.sol` | NO |

### Optimism - Upgradeable

| # | Contract | Proxy | Implementation | Source File | Verified? |
|---|----------|-------|----------------|-------------|-----------|
| 11 | LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | `local/local-athena.sol` | NO |

### Optimism - Non-Upgradeable

| # | Contract | Address | Source File | Verified? |
|---|----------|---------|-------------|-----------|
| 12 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | `local/local-lz-openwork-bridge.sol` | NO |
| 13 | CCTPTransceiver (OP) | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | `utilities/cctp-transceiver.sol` | NO |

### Ethereum - Upgradeable

| # | Contract | Proxy | Implementation | Source File | Verified? |
|---|----------|-------|----------------|-------------|-----------|
| 14 | ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | `eth/eth-openwork-dao.sol` | NO |

### Ethereum - Non-Upgradeable

| # | Contract | Address | Source File | Verified? |
|---|----------|---------|-------------|-----------|
| 15 | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | `eth/eth-lz-openwork-bridge.sol` | NO |
| 16 | ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `eth/eth-rewards-contract.sol` | NO |
| 17 | OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | `utilities/openwork-token.sol` | NO |

---

## Active Development Contracts (need config audit)

| # | Contract | Proxy | Latest Impl | Source File | Version | Verified? |
|---|----------|-------|-------------|-------------|---------|-----------|
| 18 | NativeOpenWorkJobContract (NOWJC) | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528` | `native/native-openwork-job-contract-v4.sol` | V5 | NO |
| 19 | NativeArbOpenWorkJobContract | `0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587` | `0xC14310DE9C057FBF54797E7118abcD5C412BFcD2` | MISSING | V3 | NO |
| 20 | NativeArbAthenaClient | `0xEC9446A163E74D2fBF3def75324895204415166D` | -- | MISSING | V1 | NO |
| 21 | NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0x80AA520dB868dc234ea852fC23Fa7c03e217Dad2` | `native/native-athena-v4.sol` | V5 | NO |
| 22 | NativeProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x19E4fBe10C2F2531248e5FfDF150D8c61168702f` | `native/native-profile-manager-v2.sol` | V2 | NO |
| 23 | LocalOpenWorkJobContract Lite | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x8255A7fa5409194bbC0c85c2Eaa71Cf2f5763Fd3` | `local/local-openwork-job-contract-lite.sol` | V5 | NO |

---

## Summary

- **Total contracts:** 23 (across 3 chains)
- **Verified:** 0
- **Not verified:** 23
- **Missing local source:** 2 (NativeArbOpenWorkJobContract V3, NativeArbAthenaClient V1)

## Action Items

1. Verify all 23 contracts on their respective block explorers
2. Obtain and save missing source files for contracts #19 and #20
3. Run config value audit on the 6 active development contracts (#18-23)
