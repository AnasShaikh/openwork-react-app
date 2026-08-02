# XDC Mainnet Deployment Preparation — 12 July 2026

**Status:** XDC/ARBITRUM PATHWAY OPERATIONAL — TEST JOB DELIVERED; DIRECT XDC/ETHEREUM DVN CONFIGURATION PENDING

**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

## Immutable-source policy

No deployed source file was edited.

- XDC CCTP source: `src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol`
  - Dated copy of `src/suites/current-mainnet/utilities/cctp-transceiver.sol`
  - Contract: `CCTPTransceiverXdcStandard12Jul2026`
  - Retains the legacy `sendFast(...)` ABI used by LOWJC and LocalAthena
  - Uses CCTP Standard Transfer finality threshold `2000`, because XDC does not support Fast Transfer as a source chain
- NativeAthena source: `src/suites/current-mainnet/native/native-athena-v8-xdc-domain-12-jul-2026.sol`
  - Dated copy of the verified live V7 source `native-athena-v5.sol`
  - Contract: `NativeAthenaV8XdcDomain12Jul2026`
  - Adds only `XDC EID 30365 -> CCTP domain 18`
  - Storage layout: identical to V7 (19 entries; contract-name metadata excluded)

## Network constants

| Item | Value |
|---|---|
| XDC chain ID | `50` |
| XDC LayerZero EID | `30365` |
| XDC CCTP domain | `18` |
| XDC LayerZero endpoint | `0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa` |
| XDC USDC | `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1` |
| XDC TokenMessenger V2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| XDC MessageTransmitter V2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |

## Predicted XDC addresses

All six contracts were deployed at nonces `0` through `5`, matching every predicted address. Nine required configuration transactions used nonces `6` through `14`; the final XDC deployer nonce is `15`.

| Nonce | Contract | Predicted address | Verification |
|---:|---|---|---|
| 0 | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Deployed and verified |
| 1 | CCTPTransceiverXdcStandard12Jul2026 | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Deployed and verified |
| 2 | LOWJC implementation | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Deployed and verified |
| 3 | LocalAthena implementation | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Deployed and verified |
| 4 | LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Deployed, initialized, verified, and linked |
| 5 | LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Deployed, initialized, verified, and linked |

## Paid transaction sequence

The original cross-chain plan contained **20 paid transactions**. All 20 are complete: 15 on XDC, 4 on Arbitrum, and 1 on Ethereum. Every call had native value `0`; only gas was spent. A later end-to-end `postJob` rehearsal discovered that LayerZero's new XDC pathways still require explicit DVN configuration before messaging can operate.

### Arbitrum — NativeAthena V8 upgrade (2, complete)

Script: `script/UpgradeNativeAthenaXdcDomain12Jul2026.s.sol`

1. Deploy `NativeAthenaV8XdcDomain12Jul2026`
2. Call Athena proxy `upgradeToAndCall(newImplementation, 0x)`

### XDC — deploy and configure local stack (15 paid transactions)

Script: `script/DeployXdcLocal12Jul2026.s.sol`

1. Deploy LocalLZOpenworkBridge
2. Deploy XDC Standard CCTP transceiver
3. Deploy LOWJC implementation
4. Deploy LocalAthena implementation
5. Deploy and atomically initialize LOWJC proxy
6. Deploy and atomically initialize LocalAthena proxy
7. `bridge.setLowjcContract(LOWJC_PROXY)`
8. `bridge.setAthenaClientContract(ATHENA_PROXY)`
9. `bridge.authorizeContract(LOWJC_PROXY, true)`
10. `bridge.authorizeContract(ATHENA_PROXY, true)`
11. `LOWJC.setAthenaClientContract(ATHENA_PROXY)`
12. `LOWJC.setCCTPMintRecipient(ARBITRUM_NOWJC)`
13. `Athena.setJobContract(LOWJC_PROXY)`
14. `Athena.setNativeChainDomain(3)` — no transaction required; initializer already set and live audit confirmed `3`
15. `bridge.setPeer(30110, ARBITRUM_NATIVE_BRIDGE)`
16. `bridge.setPeer(30101, ETHEREUM_MAIN_BRIDGE)`

### Arbitrum — reciprocal connection (2, complete)

Script: `script/ConnectXdcArbitrum12Jul2026.s.sol`

1. `NativeBridge.setPeer(30365, XDC_BRIDGE)`
2. `NativeBridge.addLocalChain(30365)`

### Ethereum — reciprocal connection (1, complete)

Script: `script/ConnectXdcEthereum12Jul2026.s.sol`

1. `EthereumBridge.setPeer(30365, XDC_BRIDGE)`

## Build and rehearsal evidence

- Compiler: Solidity `0.8.23`
- EVM target: `shanghai`
- Focused unit tests: **4 passed, 0 failed**
- CCTP compatibility tests:
  - Legacy `sendFast(...)` submits finality threshold `2000`
  - Explicit `sendStandard(...)` submits finality threshold `2000`
- NativeAthena tests:
  - `30365-*` job IDs map to CCTP domain `18`
  - Unknown EIDs still revert
- Runtime sizes:
  - XDC CCTP: `5,943` bytes
  - XDC bridge: `9,552` bytes
  - LOWJC: `14,078` bytes
  - LocalAthena: `12,634` bytes
  - NativeAthena V8: `23,996` bytes (`580` bytes below the EVM runtime limit)

### Rehearsed paid calls

| Chain | Transactions | Rehearsal | Actual gas used | Result |
|---|---:|---|---:|---|
| XDC disposable chain | 16 | Full deployment + configuration | `10,731,716` | Passed; all addresses and state checks matched |
| Arbitrum live-state fork | 2 | NativeAthena deploy + proxy upgrade | `5,329,004` | Passed; critical proxy storage values preserved |
| Arbitrum live-state fork | 2 | Peer + local-chain authorization | `104,971` | Passed |
| Ethereum live-state fork | 1 | Reciprocal peer | `47,525` | Passed |

XDC Foundry safety estimate: `14,009,813` gas. Actual XDC execution used `13,055,397` gas and `0.1762478595 XDC`. User-approved cumulative cap: `2 XDC`.

## Registry decision

The deployed Arbitrum `NativeContractRegistry` at `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` currently reports `getContractCount() == 0`. It is not the maintained live source of truth. No paid registry calls will be made.

After real receipts exist, update:

- `references/logs/imp/live-contract-registry-19-mar-2026.md`
- the verification tracker/status
- the application chain configuration in the separate live-app repository

Do not place predicted addresses into the live registry as deployed contracts.

## Launch gates

- [x] Deployer key derives the expected wallet without printing the key
- [x] XDC balance available
- [x] Initial XDC nonce was `0`; final XDC nonce is `15`
- [x] Dated replacement sources created; deployed sources untouched
- [x] Solidity 0.8.23 / Shanghai compilation passed
- [x] Unit tests passed
- [x] NativeAthena storage layout checked
- [x] XDC full sequence rehearsed
- [x] Arbitrum upgrade and reciprocal connection rehearsed on a live-state fork
- [x] Ethereum reciprocal connection rehearsed on a live-state fork
- [x] Existing Arbitrum ETH balance passed live cost preflight; no bridge/top-up required
- [x] Rechecked XDC balances, nonces, owners, implementations, gas prices, and addresses before and after broadcast
- [x] Explicit approval received with cumulative `2 XDC` cap
- [x] XDC transactions broadcast in stages; every receipt and resulting state validated
- [x] All six XDC contracts verified; both proxies linked to implementations
- [x] NativeAthena V8 deployed and source verified on Arbiscan
- [x] NativeAthena proxy upgraded; owner/admin state preserved
- [x] Arbitrum reciprocal XDC peer and local-chain authorization configured
- [x] Ethereum reciprocal XDC peer configured and read back
- [x] Configure and read back four-DVN LayerZero security stack for XDC/Arbitrum
- [x] Post and verify cross-chain test job `30365-1` within the separately approved `4 XDC` cap
- [x] Live Markdown registry updated with confirmed addresses and verification status
- [ ] Update application configuration in the separate live-app repository

## Live deployment execution

### Transaction 1 — XDC LocalLZOpenworkBridge

- **Date:** 12 July 2026
- **Status:** Success
- **Contract:** `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- **Transaction:** `0x1d583b0813703364485b6817d3d7a90874343cd28dbe0107fcb4321f99fc84fb`
- **Gas used:** `2,734,545`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.0369163575 XDC`
- **Runtime code:** `9,552` bytes
- **Owner:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- **LayerZero endpoint:** `0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa`
- **Native EID:** `30110`
- **Main EID:** `30101`
- **Local XDC EID:** `30365`
- **Source verification:** Verified on XDCScan
- **Verification GUID:** `1unultgmfdufjemu7gw6j5vdwsa5uu14j3ubpu3nwq7mugfdtg`
- **Verified compiler:** `v0.8.23+commit.f704f362`
- **Verified settings:** optimizer enabled, `200` runs, `viaIR: true`, EVM `shanghai`, MIT license
- **Post-transaction deployer nonce:** `1`
- **Remaining XDC balance:** `59.1140511325 XDC`

The deployment cycle stopped after this transaction and resumed on 13 July 2026 for transaction 2.

### Transaction 2 — XDC Standard CCTP Transceiver

- **Date:** 13 July 2026
- **Status:** Success
- **Contract:** `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`
- **Contract class:** `CCTPTransceiverXdcStandard12Jul2026`
- **Transaction:** `0xb90c9322f6588a9faf0024f7e1cb6100e2af11634136190cff059185e38bbd7a`
- **Gas used:** `1,790,192`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.024167592 XDC`
- **Owner:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- **TokenMessenger V2:** `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d`
- **MessageTransmitter V2:** `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`
- **USDC:** `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`
- **Standard finality threshold:** `2000`
- **Runtime code:** `5,943` bytes
- **Source verification:** Verified on XDCScan
- **Verification GUID:** `yvqrlvpayksbsmcrvgkc6eegcvx9jfbwdev6eshycdwivixkj4`
- **Verified compiler:** `v0.8.23+commit.f704f362`
- **Verified settings:** optimizer enabled, `200` runs, `viaIR: true`, EVM `shanghai`, MIT license
- **Post-transaction deployer nonce:** `2`
- **Remaining XDC balance:** `59.0898835405 XDC`

The deployment cycle stopped after this transaction and later resumed under the cumulative `2 XDC` authorization.

### Transaction 2 verification/documentation audit

- Etherscan V2 chain `50` verification result: `Pass - Verified`
- Published contract name: `CCTPTransceiverXdcStandard12Jul2026`
- Published source bundle: `19,602` bytes
- Published ABI: `10,865` bytes
- Published constructor arguments: `192` hex characters
- Published runtime code: `5,943` bytes
- Documentation address, transaction, owner, Circle dependencies, finality threshold, gas, nonce, and balance rechecked against XDC mainnet and published metadata

### Transaction 3 — LOWJC implementation

- **Date:** 13 July 2026
- **Status:** Success
- **Contract:** `0x20Fa268106A3C532cF9F733005Ab48624105c42F`
- **Contract class:** `LocalOpenWorkJobContractLite`
- **Transaction:** `0xfa45735c777aac18375b6a09179b5733819e26262857d278058d819c476948a4`
- **Gas used:** `3,858,816`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.052094016 XDC`
- **UUPS UUID:** `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
- **Runtime code:** `14,078` bytes
- **Source verification:** Verified on XDCScan
- **Verification GUID:** `lzifbjhifryesi9vzngxl3zmzs9vkjydrfwcenubnvds1xmla1`
- **Verified compiler/settings:** `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT
- **Post-transaction deployer nonce:** `3`
- **Remaining XDC balance:** `59.0377895245 XDC`

### Transaction 3 verification/documentation audit

- Etherscan V2 chain `50` verification result: `Pass - Verified`
- Published contract name: `LocalOpenWorkJobContractLite`
- Published source bundle: `183,753` bytes
- Published ABI: `13,528` bytes
- Published runtime code: `14,078` bytes
- Receipt, address, UUPS UUID, compiler settings, and documentation rechecked

### Transaction 4 — LocalAthena implementation

- **Date:** 13 July 2026
- **Status:** Success
- **Contract:** `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
- **Contract class:** `LocalAthena`
- **Transaction:** `0x05aa98127d827bb6784b39b816e3617f8a6d6fd4ec0bc09622332b1b01be7972`
- **Gas used:** `3,468,729`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.0468278415 XDC`
- **UUPS UUID:** `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
- **Runtime code:** `12,634` bytes
- **Source verification:** Verified on XDCScan
- **Verification GUID:** `k94dii1wfiamyvtkplewhbk6iqrym36nmkapacnmch8a1txhzf`
- **Verified compiler/settings:** `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT
- **Post-transaction deployer nonce:** `4`
- **Remaining XDC balance:** `58.990961683 XDC`

### Transaction 4 verification/documentation audit

- Etherscan V2 chain `50` verification result: `Pass - Verified`
- Published contract name: `LocalAthena`
- Published source bundle: `92,760` bytes
- Published ABI: `14,026` bytes
- Published runtime code: `12,634` bytes
- Receipt, address, UUPS UUID, compiler settings, and documentation rechecked

### Transaction 5 — LOWJC proxy with atomic initialization

- **Date:** 13 July 2026
- **Status:** Success
- **Proxy:** `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7`
- **Implementation:** `0x20Fa268106A3C532cF9F733005Ab48624105c42F`
- **Transaction:** `0x8a1ba7425272ea890ea62ce4fc0a0470725ed9639e0ef7f49a1513e49cbe58e9`
- **Gas used:** `380,012`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.005130162 XDC`
- **Owner:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- **USDC:** `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`
- **Chain EID:** `30365`
- **Bridge:** `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- **CCTP sender:** `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`
- **Athena client before post-deploy configuration:** zero address
- **Runtime code:** `267` bytes
- **Source verification:** Verified on XDCScan
- **Verification GUID:** `91ydjznywthtadcn1dm4lcqska4a5gsizhu6pj211bivwk7vxd`
- **Proxy link GUID:** `tkkwuxc7t9vdtdazttj7ygbm3auww1t8crp8pwnpwirtwphwkw`
- **Verified implementation link:** `0x20Fa268106A3C532cF9F733005Ab48624105c42F`
- **Verified compiler/settings:** `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT
- **Post-transaction deployer nonce:** `5`
- **Remaining XDC balance:** `58.985831521 XDC`

### Transaction 5 verification/documentation audit

- Source verification result: `Pass - Verified`
- XDCScan proxy flag: `1`
- XDCScan linked implementation: `0x20Fa268106A3C532cF9F733005Ab48624105c42F`
- Published source bundle: `34,955` bytes
- Published ABI: `1,076` bytes
- Published constructor arguments: `576` hex characters
- Published runtime code: `267` bytes
- Receipt, atomic initializer state, implementation slot, and documentation rechecked

### Transaction 6 — LocalAthena proxy with atomic initialization

- **Date:** 13 July 2026
- **Status:** Success
- **Proxy:** `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d`
- **Implementation:** `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
- **Transaction:** `0x74adc7146d62b3f04ed8893889a5ff8726269a9cb692c5436be7d54c97ffc172`
- **Gas used:** `403,342`
- **Effective gas price:** `13.5 gwei`
- **Cost:** `0.005445117 XDC`
- **Owner:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- **USDC:** `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`
- **Chain EID:** `30365`
- **Bridge:** `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`
- **CCTP sender:** `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`
- **NativeAthena recipient:** `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf`
- **Native CCTP domain:** `3`
- **Job contract before post-deploy configuration:** zero address
- **Runtime code:** `267` bytes
- **Source verification:** XDCScan `Already Verified` via identical UUPSProxy source match
- **Verification submission GUID:** `hebrfbzzsjc7asgnr3qsby6vdfrisftr91jexmcdap34lnzyc7`
- **Proxy link GUID:** `xf5tki9gd1kf7mgcx99sq5rlsmv2aggt7kinkfgr6r8ctjhgnz`
- **Verified implementation link:** `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
- **Verified compiler/settings:** `v0.8.23+commit.f704f362`, optimizer 200, viaIR, Shanghai EVM, MIT
- **Post-transaction deployer nonce:** `6`
- **Remaining XDC balance:** `58.980386404 XDC`

### Transaction 6 verification/documentation audit

- Source verification result: `Already Verified` through identical UUPSProxy runtime match
- XDCScan proxy flag: `1`
- XDCScan linked implementation: `0xF78B688846673C3f6b93184BeC230d982c0db0c9`
- Published source bundle: `34,955` bytes
- Published ABI: `1,076` bytes
- Published runtime code: `267` bytes
- Exact atomic constructor initializer is recorded above and each initialized value was checked live
- Receipt, implementation slot, proxy link, initialized state, and documentation rechecked

## XDC post-deployment configuration — transactions 7 through 15

Native domain `3` was already set by LocalAthena's atomic initializer and verified live, so no redundant transaction was sent.

| Tx | Nonce | Call | Transaction | Gas | Cost (XDC) |
|---:|---:|---|---|---:|---:|
| 7 | 6 | `bridge.setLowjcContract(LOWJC_PROXY)` | `0x8cffaf50dac442ba127bc4d87c2c6b006a0d8eea59d74c39758b1fce4bbebb13` | 32,085 | 0.0004331475 |
| 8 | 7 | `bridge.setAthenaClientContract(ATHENA_PROXY)` | `0xb76c3aab5de437af418b3a4a48147589e2c15a30e226214f3563a9b87b4a31ec` | 49,339 | 0.0006660765 |
| 9 | 8 | `bridge.authorizeContract(LOWJC_PROXY, true)` | `0x44ab2dd78e8486bee2d902d890360469530a003305339d0c95b1a96a9dbaaf84` | 49,244 | 0.0006647940 |
| 10 | 9 | `bridge.authorizeContract(ATHENA_PROXY, true)` | `0xdd0b2eaf6129606cb4a08dc7909beb46605a22ed55efcd1b683cbec92089779a` | 49,244 | 0.0006647940 |
| 11 | 10 | `LOWJC.setAthenaClientContract(ATHENA_PROXY)` | `0xd49889f2209c56cf7850287ee25cd5f8760e7624ab8a303c18137c8ad79fc8b5` | 52,905 | 0.0007142175 |
| 12 | 11 | `LOWJC.setCCTPMintRecipient(ARBITRUM_NOWJC)` | `0x9527b6cb429db872391fe9c62848486bd91bb4a4be460c664d1501fbad7d17f4` | 35,101 | 0.0004738635 |
| 13 | 12 | `Athena.setJobContract(LOWJC_PROXY)` | `0xa4290d23648d581a70d62b48f1a8d037105e170cca95aae4b61cc05c00a23dab` | 54,105 | 0.0007304175 |
| 14 | 13 | `bridge.setPeer(30110, ARBITRUM_NATIVE_BRIDGE)` | `0x790bfe001836a75554a8dba88ae0835c0b419e3f74cf5faa05cb074136ed133b` | 48,869 | 0.0006597315 |
| 15 | 14 | `bridge.setPeer(30101, ETHEREUM_MAIN_BRIDGE)` | `0xad47f22f955b427bed85e835a03ef2d391f4e051f62b76d03aca4605ae10b33f` | 48,869 | 0.0006597315 |

Configuration gas: `419,761`. Configuration cost: `0.0056667735 XDC`.

## XDC cumulative cap result

- **Starting balance before transaction 1:** `59.15096749 XDC`
- **Final balance after transaction 15:** `58.9747196305 XDC`
- **Total XDC spent:** `0.1762478595 XDC`
- **Approved cap:** `2 XDC`
- **Unused cap:** `1.8237521405 XDC`
- **Cap result:** Passed

## Arbitrum execution — 13 July 2026

Starting deployer state: nonce `185`, balance `0.000393074455959726 ETH`. All four transactions succeeded.

| Tx | Nonce | Action | Address / transaction | Gas | Cost (ETH) |
|---:|---:|---|---|---:|---:|
| 16 | 185 | Deploy `NativeAthenaV8XdcDomain12Jul2026` | `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` / `0xf8b94f98904f0e6402a8be0a889f681c38ea832ad213b658707c388b1bff2d77` | 5,303,433 | 0.000106323224784 |
| 17 | 186 | `NativeAthena.upgradeToAndCall(newImplementation, 0x)` | `0xd36e34f6081ce39013347e7aaa213d3059eac596589ec3de9afbe096299accbb` | 38,635 | 0.000000775636260 |
| 18 | 187 | `NativeBridge.setPeer(30365, XDC_BRIDGE)` | `0xfd419581f306a0ed64a1324ea05d35a223856ac3dd094d6d399c235f8ef453ee` | 47,684 | 0.000000955301256 |
| 19 | 188 | `NativeBridge.addLocalChain(30365)` | `0x41d03c8b7d86971d0c5a066f4ec3853519a22a5334313c72c1163c6cbbcbb151` | 57,588 | 0.000001155445632 |

- **Total Arbitrum gas:** `5,447,340`
- **Total Arbitrum spend:** `0.000109209607932 ETH`
- **Final deployer nonce:** `189`
- **Final deployer balance:** `0.000283864848027726 ETH`
- **NativeAthena implementation:** `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31`
- **Runtime size:** `23,996` bytes
- **UUPS UUID:** `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
- **Source verification:** Arbiscan `Pass - Verified`
- **Verification GUID:** `lkdszcc4wdhenvxmmziezuwm8s95jnd5l4uhf1tlqcebt6e9ft`
- **Owner after upgrade:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- **Deployer remains admin:** `true`

## Ethereum execution — 13 July 2026

- **Action:** `ETHLZOpenworkBridge.setPeer(30365, XDC_BRIDGE)`
- **Transaction:** `0x577440be6043ba3546409a4bd1a6aa9f6f63ce71ed206e2bed6761d1ab2ca002`
- **Nonce:** `39`
- **Gas used:** `47,525`
- **Cost:** `0.000006624955106775 ETH`
- **Final deployer balance:** `0.000433662498556807 ETH`
- **Readback:** peer `30365` equals XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`

## LayerZero pathway and test-job execution

The first live fee quote reverted with `Please set your OApp's DVNs and/or Executor`. On-chain inspection confirmed that the new XDC pathway was inheriting LayerZero's unusable `LZDeadDVN` defaults.

A local XDC-mainnet fork then rehearsed the production security pattern already used by Openwork's Optimism/Arbitrum pathway:

- 20 confirmations
- four required independent DVNs: LayerZero Labs, Nethermind, Horizen, and Canary
- XDC send/receive configuration transactions: PASS (`0x8e986c...71908`, `0xf318a1...93c51`)
- Arbitrum send/receive configuration transactions: PASS (`0x92715a...71741`, `0x1756cb...4d1e1`)
- minimal `postJob` source transaction for `30365-1`: PASS (`0xdd20dd...55806`)
- Arbitrum delivery transaction: PASS (`0x36c8d3...c42bf`)
- LayerZero final status: `DELIVERED`
- local job counter advanced from `0` to `1`: PASS
- Arbitrum Genesis stored the expected job giver, detail label, open status, milestone description, and amount: PASS
- **Total approved-scope XDC spend:** `3.787559393022184867 XDC` of `4 XDC`
- Dedicated test log: `references/logs/xdc-mainnet-job-post-test-13-jul-2026.md`

## Final three-chain audit and stop boundary

- All 15 XDC transactions indexed with nonces `0` through `14`: PASS
- All 15 transaction receipts successful: PASS
- All six contract sources verified on XDCScan: PASS
- Both UUPS proxies linked to their correct implementations: PASS
- Full XDC bridge, CCTP, LOWJC, and LocalAthena live state: PASS
- Deployment log transaction coverage: PASS
- Live registry address/configuration coverage: PASS
- Verification tracker updated: PASS
- Arbitrum NativeAthena implementation slot is `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31`: PASS
- Arbitrum peer `30365` is XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`: PASS
- Arbitrum `authorizedLocalChains(30365)` is `true`: PASS
- XDC peer `30110` is Arbitrum bridge `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F`: PASS
- Ethereum peer `30365` is XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`: PASS
- XDC peer `30101` is Ethereum bridge `0x20Fa268106A3C532cF9F733005Ab48624105c42F`: PASS
- LayerZero XDC/Arbitrum four-DVN configuration: PASS
- Test job `30365-1` exists on Arbitrum mainnet: PASS
- Direct XDC/Ethereum DVN configuration remains unset; peers exist but that direct message pathway is not yet operational
- **Next external step:** update the separate live application configuration

### Verification/documentation audit

- Etherscan V2 chain `50` verification result: `Pass - Verified`
- Published contract name: `LocalLZOpenworkBridge`
- Published source bundle: `74,631` bytes across Standard JSON input
- Published ABI: `13,097` bytes
- Published constructor arguments: `320` hex characters
- Live runtime code: `9,552` bytes
- Documentation address, transaction, owner, endpoint, EIDs, gas, nonce, and balance rechecked against XDC mainnet
