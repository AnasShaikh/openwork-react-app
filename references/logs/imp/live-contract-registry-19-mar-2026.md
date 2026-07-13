# Openwork Live Contract Registry

**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
**Snapshot:** `src/suites/snapshot-19-mar-2026/`
**Remote source:** `github.com/botopenwork-ui/openwork-react-app` → `contracts/src/`
**Last audited:** `13 July 2026` — XDC launch, NativeAthena V8, and production-webapp XDC/Arbitrum delivery test

This file is the canonical live address-to-source registry. Its historical filename is retained for stable links; use the last-audited date and changelog to determine freshness.

---

## Arbitrum One (Native Chain) — Chain ID: 42161 | LZ EID: 30110 | CCTP Domain: 3

### Upgradeable Contracts (UUPS Proxy)

| # | Contract | Proxy | Implementation | Version | Source | Arbiscan | Verified? |
|---|----------|-------|----------------|---------|--------|----------|-----------|
| 1 | NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | V1 (Jan 18) | [native-openwork-genesis.sol](../../../src/suites/current-mainnet/native/native-openwork-genesis.sol) | [proxy](https://arbiscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294) / [impl](https://arbiscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) | YES (impl) |
| 2 | NativeOpenWorkJobContract (NOWJC) | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528` | V5 (Mar 19) | [native-openwork-job-contract-v4.sol](../../../src/suites/current-mainnet/native/native-openwork-job-contract-v4.sol) | [proxy](https://arbiscan.io/address/0x8EfbF240240613803B9c9e716d4b5AD1388aFd99) / [impl](https://arbiscan.io/address/0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528) | YES (impl) |
| 3 | NativeArbOpenWorkJobContract | `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` | V4 (Apr 8) | [native-arb-lowjc-v4.sol](../../../src/suites/current-mainnet/native/native-arb-lowjc-v4.sol) | [proxy](https://arbiscan.io/address/0x5727cA7326032a8644a49dECECB8388BEF122bef) / [impl](https://arbiscan.io/address/0x309f02301c641627A114D4E5Fb840bAA5C2809D3) | YES (impl) |
| 4 | NativeArbAthenaClient | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x9456989F7B9Cb707451d7179Fc1FC401221DE01a` | Redeployed (Mar 19) | [native-arb-athena-client.sol](../../../src/suites/current-mainnet/native/native-arb-athena-client.sol) | [proxy](https://arbiscan.io/address/0xB5d3F406089236ef9d4aB13306187aFCCA81f099) / [impl](https://arbiscan.io/address/0x9456989F7B9Cb707451d7179Fc1FC401221DE01a) | YES (impl) |
| 5 | NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | V1 (Jan 18) | [native-openwork-dao.sol](../../../src/suites/current-mainnet/native/native-openwork-dao.sol) | [proxy](https://arbiscan.io/address/0x24af98d763724362DC920507b351cC99170a5aa4) / [impl](https://arbiscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) | YES (impl) |
| 6 | NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` | V8 (Jul 13) — XDC domain | [native-athena-v8-xdc-domain-12-jul-2026.sol](../../../src/suites/current-mainnet/native/native-athena-v8-xdc-domain-12-jul-2026.sol) | [proxy](https://arbiscan.io/address/0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf) / [impl](https://arbiscan.io/address/0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31) | YES (impl) |
| 7 | NativeProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0xae31d7be760D92807B013a71bb51f2cBB132166b` | V1 (Jan 22) | [native-profile-genesis.sol](../../../src/suites/current-mainnet/native/native-profile-genesis.sol) | [proxy](https://arbiscan.io/address/0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E) / [impl](https://arbiscan.io/address/0xae31d7be760D92807B013a71bb51f2cBB132166b) | YES (impl) |
| 8 | NativeAthenaActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | V1 (Jan 22) | [native-athena-activity-tracker.sol](../../../src/suites/current-mainnet/native/native-athena-activity-tracker.sol) | [proxy](https://arbiscan.io/address/0x8C04840c3f5b5a8c44F9187F9205ca73509690EA) / [impl](https://arbiscan.io/address/0x9588A78748a8bc82295bf44d87C4b9F924d11AE8) | YES (impl) |
| 9 | NativeAthenaOracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | V1 (Jan 22) | [native-athena-oracle-manager.sol](../../../src/suites/current-mainnet/native/native-athena-oracle-manager.sol) | [proxy](https://arbiscan.io/address/0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15) / [impl](https://arbiscan.io/address/0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59) | YES (impl) |
| 10 | NativeProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x19E4fBe10C2F2531248e5FfDF150D8c61168702f` | V2 (Feb 28) | [native-profile-manager-v2.sol](../../../src/suites/current-mainnet/native/native-profile-manager-v2.sol) | [proxy](https://arbiscan.io/address/0x51285003A01319c2f46BB2954384BCb69AfB1b45) / [impl](https://arbiscan.io/address/0x19E4fBe10C2F2531248e5FfDF150D8c61168702f) | YES (impl) |

### Non-Upgradeable Contracts

| # | Contract | Address | Version | Source | Arbiscan | Verified? |
|---|----------|---------|---------|--------|----------|-----------|
| 11 | NativeLZOpenworkBridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | V2 (Jan 24) | [native-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/native/native-lz-openwork-bridge.sol) | [link](https://arbiscan.io/address/0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F) | YES |
| 12 | NativeRewardsContract | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | V2 (Jan 23) | [native-rewards-contract.sol](../../../src/suites/current-mainnet/native/native-rewards-contract.sol) | [link](https://arbiscan.io/address/0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9) | YES |
| 13 | CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | V1 (Jan 18) | [cctp-transceiver.sol](../../../src/suites/current-mainnet/utilities/cctp-transceiver.sol) | [link](https://arbiscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87) | YES |
| 14 | NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | V1 (Jan 22) | [native-contract-registry.sol](../../../src/suites/current-mainnet/native/native-contract-registry.sol) | [link](https://arbiscan.io/address/0x29D61B1a9E2837ABC0810925429Df641CBed58c3) | YES |
| 15 | NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | V1 (Jan 22) | [native-genesis-reader.sol](../../../src/suites/current-mainnet/native/native-genesis-reader.sol) | [link](https://arbiscan.io/address/0x72ee091C288512f0ee9eB42B8C152fbB127Dc782) | YES |

### External Dependencies (Arbitrum One)

| Contract | Address |
|----------|---------|
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| MessageTransmitterV2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |

---

## Optimism (Local Chain) — Chain ID: 10 | LZ EID: 30111 | CCTP Domain: 2

### Upgradeable Contracts (UUPS Proxy)

| # | Contract | Proxy | Implementation | Version | Source | Etherscan | Verified? |
|---|----------|-------|----------------|---------|--------|-----------|-----------|
| 16 | LocalOpenWorkJobContract Lite | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x74D6e1aDA0Dae53231298B24DeAf169647fd557d` | Lite V6 (agent upgrade) | [local-openwork-job-contract-lite-v2.sol](../../../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v2.sol) | [proxy](https://optimistic.etherscan.io/address/0x620205A4Ff0E652fF03a890d2A677de878a1dB63) / [impl](https://optimistic.etherscan.io/address/0x74D6e1aDA0Dae53231298B24DeAf169647fd557d) | YES (impl) |
| 17 | LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | V1 (Jan 18) | [local-athena.sol](../../../src/suites/current-mainnet/local/local-athena.sol) | [proxy](https://optimistic.etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) / [impl](https://optimistic.etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) | YES (impl) |

### Non-Upgradeable Contracts

| # | Contract | Address | Version | Source | Etherscan | Verified? |
|---|----------|---------|---------|--------|-----------|-----------|
| 18 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | V1 (Jan 18) | [local-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/local/local-lz-openwork-bridge.sol) | [link](https://optimistic.etherscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36) | YES |
| 19 | CCTPTransceiver V2 | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | V2 (Jan 23) | [cctp-transceiver.sol](../../../src/suites/current-mainnet/utilities/cctp-transceiver.sol) | [link](https://optimistic.etherscan.io/address/0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15) | YES |

### External Dependencies (Optimism)

| Contract | Address |
|----------|---------|
| USDC | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0x2B4069517957735bE00ceE0fadAE88a26365528f` |
| MessageTransmitterV2 | `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` |

---

## Ethereum Mainnet — Chain ID: 1 | LZ EID: 30101 | CCTP Domain: 0

### Upgradeable Contracts (UUPS Proxy)

| # | Contract | Proxy | Implementation | Version | Source | Etherscan | Verified? |
|---|----------|-------|----------------|---------|--------|-----------|-----------|
| 20 | ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | V2 (Mar 19) | [eth-openwork-dao.sol](../../../src/suites/current-mainnet/eth/eth-openwork-dao.sol) | [proxy](https://etherscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294) / [impl](https://etherscan.io/address/0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59) | YES (impl) |

### Non-Upgradeable Contracts

| # | Contract | Address | Version | Source | Etherscan | Verified? |
|---|----------|---------|---------|--------|-----------|-----------|
| 21 | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | V1 (Jan 18) | [eth-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/eth/eth-lz-openwork-bridge.sol) | [link](https://etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) | YES |
| 22 | ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | V1 (Jan 22) | [eth-rewards-contract.sol](../../../src/suites/current-mainnet/eth/eth-rewards-contract.sol) | [link](https://etherscan.io/address/0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d) | YES |
| 23 | OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | V1 (Jan 22) | [openwork-token.sol](../../../src/suites/current-mainnet/utilities/openwork-token.sol) | [link](https://etherscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87) | YES |

### Token Distribution

| Holder | Amount | Percentage |
|--------|--------|------------|
| ETHRewardsContract | 750,000,000 OWORK | 75% |
| ETHOpenworkDAO Proxy | 250,000,000 OWORK | 25% |

### External Dependencies (Ethereum)

| Contract | Address |
|----------|---------|
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0xBd3fa81B58Ba92a82136038B25aDec7066af3155` |
| MessageTransmitterV2 | `0x0a992d191deec32afe36203ad87d7d289a738f81` |

---

## Cross-Chain Peer Configuration

| Source Bridge | Target EID | Target Bridge |
|---------------|------------|---------------|
| Native (Arb) `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | 30101 (ETH) | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| Native (Arb) `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | 30111 (OP) | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| ETH `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | 30110 (Arb) | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Local (OP) `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | 30110 (Arb) | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Native (Arb) `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | 30365 (XDC) | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| XDC `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | 30110 (Arb) | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| ETH `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | 30365 (XDC) | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| XDC `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | 30101 (ETH) | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |

---

## XDC Mainnet — Chain ID: 50 | LZ EID: 30365 | CCTP Domain: 18

**Status:** XDC/Arbitrum four-DVN pathway operational; contract test `30365-1` and production-webapp job `30365-2` delivered 13 July 2026; direct XDC/Ethereum DVN configuration pending

### Deployed Contracts

| Contract | Address | Version | Source | Verified? |
|---|---|---|---|---|
| LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | XDC launch (12 Jul 2026) | [local-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/local/local-lz-openwork-bridge.sol) | YES |
| CCTPTransceiverXdcStandard12Jul2026 | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | XDC Standard CCTP (13 Jul 2026) | [cctp-transceiver-xdc-standard-12-jul-2026.sol](../../../src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol) | YES |
| LOWJC implementation | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | XDC launch (13 Jul 2026) | [local-openwork-job-contract-lite-v2.sol](../../../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v2.sol) | YES |
| LocalAthena implementation | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | XDC launch (13 Jul 2026) | [local-athena.sol](../../../src/suites/current-mainnet/local/local-athena.sol) | YES |
| LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | XDC launch (13 Jul 2026) | [proxy.sol](../../../src/suites/current-mainnet/utilities/proxy.sol) | YES (linked to implementation) |
| LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | XDC launch (13 Jul 2026) | [proxy.sol](../../../src/suites/current-mainnet/utilities/proxy.sol) | YES (linked to implementation) |

**Deploy transaction:** `0x1d583b0813703364485b6817d3d7a90874343cd28dbe0107fcb4321f99fc84fb`

**Verification:** XDCScan/Etherscan V2 `Pass - Verified`; Solidity `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT.

**CCTP deploy transaction:** `0xb90c9322f6588a9faf0024f7e1cb6100e2af11634136190cff059185e38bbd7a`

**CCTP verification:** XDCScan/Etherscan V2 `Pass - Verified`; Solidity `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT.

**LOWJC implementation deploy transaction:** `0xfa45735c777aac18375b6a09179b5733819e26262857d278058d819c476948a4`

**LOWJC implementation verification:** XDCScan/Etherscan V2 `Pass - Verified`; Solidity `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT.

**LocalAthena implementation deploy transaction:** `0x05aa98127d827bb6784b39b816e3617f8a6d6fd4ec0bc09622332b1b01be7972`

**LocalAthena implementation verification:** XDCScan/Etherscan V2 `Pass - Verified`; Solidity `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT.

**LOWJC proxy deploy transaction:** `0x8a1ba7425272ea890ea62ce4fc0a0470725ed9639e0ef7f49a1513e49cbe58e9`

**LOWJC proxy verification:** XDCScan/Etherscan V2 `Pass - Verified`; proxy linked to implementation `0x20Fa268106A3C532cF9F733005Ab48624105c42F`.

**LocalAthena proxy deploy transaction:** `0x74adc7146d62b3f04ed8893889a5ff8726269a9cb692c5436be7d54c97ffc172`

**LocalAthena proxy verification:** XDCScan identical UUPSProxy source match; proxy linked to implementation `0xF78B688846673C3f6b93184BeC230d982c0db0c9`.

### XDC-side configuration

| Setting | Confirmed value | Status |
|---|---|---|
| Bridge LOWJC | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | YES |
| Bridge LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | YES |
| Bridge authorizes LOWJC | `true` | YES |
| Bridge authorizes LocalAthena | `true` | YES |
| LOWJC Athena client | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | YES |
| LOWJC CCTP mint recipient | Arbitrum NOWJC `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | YES |
| LocalAthena job contract | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | YES |
| LocalAthena native CCTP domain | `3` | YES (initializer) |
| XDC bridge peer `30110` | Arbitrum bridge `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | YES |
| XDC bridge peer `30101` | Ethereum bridge `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | YES |

### Pending pathway configuration

- Direct XDC/Ethereum LayerZero pathway still inherits `LZDeadDVN`; configure matching send/receive stacks if direct messaging will be used

---

## Verification Summary (Updated Jul 13, 2026)

| Status | Count |
|--------|-------|
| Verified on block explorer | **39** |
| Not verified | 0 |
| **Total tracked deployments** | **39** |

## On-Chain Slot Verification (ERC1967 impl slot)

All 15 live upgradeable proxy implementation slots were read on-chain via `cast storage` and match this registry. NativeAthena and both XDC proxies were rechecked on 13 July 2026; NativeAthena's live implementation slot is `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31`.

---

## Abandoned Contracts (agent wallet key lost)

| Contract | Old Proxy | Old Impl | Reason |
|----------|-----------|----------|--------|
| NativeArbAthenaClient (old) | `0xEC9446A163E74D2fBF3def75324895204415166D` | `0x0688FcF38eA366a7fACe4b056F0eC6b66E6DA06E` | Agent wallet `0xb8dC...` key lost |
| NativeArbOpenWorkJobContract (old) | `0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587` | `0xC14310DE9C057FBF54797E7118abcD5C412BFcD2` | Agent wallet `0xb8dC...` key lost |

---

## Changelog

### Jul 13, 2026 — NativeAthena V8 and XDC reciprocal connection
- **Fix:** Added `XDC EID 30365 -> CCTP domain 18` without editing the previously deployed V7 source.
- **New impl:** `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` ([deploy tx](https://arbiscan.io/tx/0xf8b94f98904f0e6402a8be0a889f681c38ea832ad213b658707c388b1bff2d77))
- **Upgrade tx:** [Arbiscan](https://arbiscan.io/tx/0xd36e34f6081ce39013347e7aaa213d3059eac596589ec3de9afbe096299accbb)
- **Source:** `native-athena-v8-xdc-domain-12-jul-2026.sol`
- **Previous impl:** `0x7D4F986b56cdD84b529d5653e4CCD851454fF1C4` (V7)
- **Bridge configuration:** Arbitrum peer `30365` points to XDC and is authorized; XDC peer `30110` points back to Arbitrum.
- **Status:** Deployed, upgraded, verified, and live-state audited

### Jul 13, 2026 — XDC/Arbitrum LayerZero pathway and job test
- **Security stack:** 20 confirmations; LayerZero Labs, Nethermind, Horizen, and Canary all required
- **Configuration:** matching send/receive ULN configs applied and read back on XDC and Arbitrum
- **Test job:** `30365-1`
- **Source tx:** `0xdd20ddebcf87ff3757cbea0c6670d5550abbded96c31d72ad2f10340fa455806`
- **Destination tx:** `0x36c8d34d4ae92f091a936dadaff5d1fe0282eceb770c9af800974f6b347c42bf`
- **LayerZero status:** `DELIVERED`
- **Status:** End-to-end XDC to Arbitrum job posting passed

### Jul 13, 2026 — Production webapp XDC job test
- **Test job:** `30365-2`
- **Source tx:** `0xf9b88e09488de62bbb92572492c74268dccf445bea6279d672fc458963a57d09`
- **LayerZero GUID:** `0x6e75481de82c9527faab41f47b5899058906ab1ddd3d05594968b3ac6299aeff`
- **Destination tx:** `0xcf5f406e94942db276958e2828c8e5ce9f8271d32209a84610fc24e1202ad6a0`
- **LayerZero status:** `DELIVERED`
- **Application state:** Arbitrum Genesis contains the correct job giver, IPFS hashes, `0.5 USDC` nominal milestone, and `Open` status
- **Wallet spend:** `4.803234084721259807 XDC` including gas
- **Evidence:** [production webapp test log](../xdc-mainnet-webapp-job-post-test-13-jul-2026.md)
- **Status:** Production app XDC job posting passed end to end

---

### Mar 26, 2026 — NativeAthena V7 (EID fix)
- **Bug:** `_parseJobIdForChainDomain` had only testnet EIDs hardcoded. Mainnet EIDs (30101/30111/30110) fell through to `return 0` (Ethereum), causing dispute funds to route to wrong chain.
- **Fix:** Added mainnet LZ EIDs, changed default from `return 0` to `revert("Unknown EID")`.
- **New impl:** `0x7D4F986b56cdD84b529d5653e4CCD851454fF1C4` ([tx](https://arbiscan.io/tx/0x44c32a7aac37179c37305146133f96ff1009bdb1b10a731cddf2c67bd4dea06c))
- **Source:** `native-athena-v5.sol` (copy of v4 with fix)
- **Previous impl:** `0x461Bd6f9C706c495781392f54C29d23c1871aC15` (V6)
- **Status:** Deployed, upgraded, verified

---

### Apr 8, 2026 — ArbLOWJC V4 (jobCounter fix)
- **Bug:** `jobCounter` was `0` after Mar 19 redeployment. `postJob()` tried `42161-1` which already exists in Genesis → revert `"Job exists"`.
- **Fix:** Added `setJobCounter()` admin function. Set counter to `4` (old ArbLOWJC had posted 4 jobs).
- **New impl:** `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` ([tx](https://arbiscan.io/tx/0x8e257588e869fd7796cc05a63c09230056e3079d91a9f57683264336369f4eb5))
- **Source:** `native-arb-lowjc-v4.sol`
- **Previous impl:** `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` (V3)
- **Status:** Deployed, upgraded, jobCounter set to 4, and verified (rechecked through explorer API on 13 July 2026)

---

## Outstanding Actions

- [x] Verify all 39 tracked deployments on block explorers — DONE
- [x] Update webapp with new ArbAthenaClient (`0xB5d3...`) and ArbLOWJC (`0x5727...`) proxy addresses
- [x] Redeploy + verify NativeAthena impl under deployer (was agent-compiled)
- [x] Redeploy + verify ETHOpenworkDAO impl under deployer (was unknown wallet)
- [ ] Revoke old abandoned proxy addresses from authorizedContracts
- [ ] Run config value audit on active development contracts
- [ ] Transfer any remaining USDC from old ArbLOWJC proxy if applicable
