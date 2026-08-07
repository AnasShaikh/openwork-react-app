# Openwork Live Contract Registry

**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

**Current source tree:** `src/suites/current-mainnet/`

**Last audited:** `7 August 2026`

**Current release ledger:** [confirmed-upgrades-mainnet-19-jul-2026.md](../../deployments/confirmed-upgrades-mainnet-19-jul-2026.md)

**Latest configuration record:** [multichain-transceiver-reward-funding-4-aug-2026.md](../../deployments/multichain-transceiver-reward-funding-4-aug-2026.md)

**Latest production execution proof:** [arbitrum-direct-contract-job-42161-24-7-aug-2026.md](../../deployments/arbitrum-direct-contract-job-42161-24-7-aug-2026.md)

**Relayer and keeper-bounty funding:** [multichain-transceiver-reward-funding-4-aug-2026.md](../../deployments/multichain-transceiver-reward-funding-4-aug-2026.md), preceded by [arbitrum-relay-wallet-funding-2-aug-2026.md](../../deployments/arbitrum-relay-wallet-funding-2-aug-2026.md). Relaying a CCTP message is permissionless, and each transceiver pays the caller a gas-based bounty, so third parties relay these transfers whenever it is profitable. When the transceivers emptied, that stopped silently — nothing errored. On XDC the reward was additionally capped below the keeper's own gas cost until `maxRewardAmount` was raised to `1e16` on 4 August. Treat transceiver balances as operational state worth monitoring, not a one-off setup step.

This historical filename is retained for stable links. This file is the canonical production address-to-source registry. “Runtime verified” means the live bytecode, proxy slot, pointers or configuration were read back successfully. “Source verified” means source is published on the relevant block explorer. Those are separate claims.

## Audit snapshot

| Chain | Audit block |
|---|---:|
| Ethereum Mainnet | `25702915` |
| Arbitrum One | `492040533` |
| Optimism | `155252419` |
| XDC Network | `105824712` |

| Metric | Count |
|---|---:|
| Active contract roles | 31 |
| Active artifacts, counting proxies and implementations separately | 50 |
| Explorer source verified | 31 |
| Explorer source pending | 19 |

All 19 active proxy ERC-1967 implementation slots match this registry. The 19 artifacts deployed on 19 July are live and runtime-verified but still pending explorer source publication. Do not describe production as “fully explorer verified” until those submissions succeed.

The 7 August read-only refresh confirmed non-empty runtime code for all 31 active roles, all 19 proxy implementation slots, the six reciprocal production LayerZero peers, NOWJC's live zero commission values, NativeRewards' current ProfileGenesis pointer, and the three CCTP reward caps and pools. Production job `42161-24` separately reconfirmed the complete same-chain ArbLOWJC → NOWJC → Genesis escrow and release path without LayerZero or CCTP. That execution changed no contract address, implementation, configuration or explorer status.

## Arbitrum One

Chain ID `42161` · LayerZero EID `30110` · CCTP domain `3`

### Upgradeable roles

| Role | Proxy | Implementation | Version | Exact source | Explorer source |
|---|---|---|---|---|---|
| NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | V1 | [native-openwork-genesis.sol](../../../src/suites/current-mainnet/native/native-openwork-genesis.sol) | proxy + impl verified |
| NativeOpenWorkJobContract (NOWJC) | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x1a406176a9f5727689035eD82f4c28CACaCeDC96` | V5 | [native-openwork-job-contract-v5.sol](../../../src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol) | proxy verified; impl pending |
| NativeArbOpenWorkJobContract | `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0xdd7BA6d8E92358AD7477b2f79fF83C78aC07F289` | V5 | [native-arb-lowjc-v5.sol](../../../src/suites/current-mainnet/native/native-arb-lowjc-v5.sol) | proxy verified; impl pending |
| NativeArbAthenaClient | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x6DE7D58FCffF98AF2E85e1976155f3D671F6756C` | V3 | [native-arb-athena-client-v3.sol](../../../src/suites/current-mainnet/native/native-arb-athena-client-v3.sol) | proxy verified; impl pending |
| NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0xeb1A8fB15d3Bf5E1bd1100AC2528962356c2a398` | V2 | [native-openwork-dao-v2.sol](../../../src/suites/current-mainnet/native/native-openwork-dao-v2.sol) | proxy verified; impl pending |
| NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0xB4ea3444517B5C11DDF47f8F6E9dA6EccCD17395` | V9 | [native-athena-v9.sol](../../../src/suites/current-mainnet/native/native-athena-v9.sol) | proxy verified; impl pending |
| NativeProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0x9E8F58839aB114BbcA8A0c24f5BEC1C841294784` | V2 | [native-profile-genesis-v2.sol](../../../src/suites/current-mainnet/native/native-profile-genesis-v2.sol) | proxy verified; impl pending |
| NativeAthenaActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | V1 | [native-athena-activity-tracker.sol](../../../src/suites/current-mainnet/native/native-athena-activity-tracker.sol) | proxy + impl verified |
| NativeAthenaOracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | V1 | [native-athena-oracle-manager.sol](../../../src/suites/current-mainnet/native/native-athena-oracle-manager.sol) | proxy + impl verified |
| NativeProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0xd30c9f6Bf3e6563a64AC32BD4Cc76407ed0e2fFf` | V3 | [native-profile-manager-v3.sol](../../../src/suites/current-mainnet/native/native-profile-manager-v3.sol) | proxy verified; impl pending |
| OpenworkVotingPowerCheckpoints | `0x586cb49f19f93E5b9037CD22c539a7529b7bA1d9` | `0x78C3E094a8Dba771c434E1258738cE9D4404C19e` | V1 | [openwork-voting-power-checkpoints-v1.sol](../../../src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol) | proxy + impl pending |
| NativeDAOStakeSync | `0xe541c372bF4E91F9FFe3Bc2A2Fa45CC38A273d2B` | `0xddF69B7C6a04C4972e27Dc2b3a9f88E8081bCf03` | V1 | [native-dao-stake-sync-v1.sol](../../../src/suites/current-mainnet/native/native-dao-stake-sync-v1.sol) | proxy + impl pending |

### Standalone roles

| Role | Address | Version | Exact source | Explorer source |
|---|---|---|---|---|
| NativeLZOpenworkBridge | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` | V3 | [native-lz-openwork-bridge-v3.sol](../../../src/suites/current-mainnet/native/native-lz-openwork-bridge-v3.sol) | pending |
| NativeRewardsContract | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | V2 | [native-rewards-contract.sol](../../../src/suites/current-mainnet/native/native-rewards-contract.sol) | verified |
| CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | V1 | [cctp-transceiver.sol](../../../src/suites/current-mainnet/utilities/cctp-transceiver.sol) | verified |
| NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | V1 | [native-contract-registry.sol](../../../src/suites/current-mainnet/native/native-contract-registry.sol) | verified |
| NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | V1 | [native-genesis-reader.sol](../../../src/suites/current-mainnet/native/native-genesis-reader.sol) | verified |

Native USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.

### Live NOWJC commission configuration

Read back from the proxy on 1 August 2026:

| Setting | Live value |
|---|---:|
| `commissionPercentage()` | `0` basis points |
| `minCommission()` | `0` USDC units |
| `calculateCommission(500000)` | `0` USDC units |

The V5 implementation source declares 100 basis points and 1 USDC as initial field values, but the upgrade did not overwrite existing proxy storage. Public documentation must use the live proxy values, not the source initializers.

## Optimism

Chain ID `10` · LayerZero EID `30111` · CCTP domain `2`

| Role | Proxy / address | Implementation | Version | Exact source | Explorer source |
|---|---|---|---|---|---|
| LocalOpenWorkJobContract Lite | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x74D6e1aDA0Dae53231298B24DeAf169647fd557d` | Lite V6 | [local-openwork-job-contract-lite-v2.sol](../../../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v2.sol) | proxy + impl verified |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | V1 | [local-athena.sol](../../../src/suites/current-mainnet/local/local-athena.sol) | proxy + impl verified |
| LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | — | V1 | [local-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/local/local-lz-openwork-bridge.sol) | verified |
| CCTPTransceiver | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | — | V2 | [cctp-transceiver.sol](../../../src/suites/current-mainnet/utilities/cctp-transceiver.sol) | verified |

Native USDC: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`.

## XDC Network

Chain ID `50` · LayerZero EID `30365` · CCTP domain `18`

| Role | Proxy / address | Implementation | Version | Exact source | Explorer source |
|---|---|---|---|---|---|
| LocalOpenWorkJobContract Lite | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D` | V3 | [local-openwork-job-contract-lite-v3.sol](../../../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol) | proxy verified; impl pending |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | V1 | [local-athena.sol](../../../src/suites/current-mainnet/local/local-athena.sol) | proxy + impl verified |
| LocalLZOpenworkBridge | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | — | V2 | [local-lz-openwork-bridge-v2.sol](../../../src/suites/current-mainnet/local/local-lz-openwork-bridge-v2.sol) | pending |
| CCTPTransceiverXdcStandard12Jul2026 | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | — | XDC standard | [cctp-transceiver-xdc-standard-12-jul-2026.sol](../../../src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol) | verified |

Native USDC: `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`.

## Ethereum Mainnet

Chain ID `1` · LayerZero EID `30101` · CCTP domain `0`

| Role | Proxy / address | Implementation | Version | Exact source | Explorer source |
|---|---|---|---|---|---|
| ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | V3 | [eth-openwork-dao-v3.sol](../../../src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol) | proxy verified; impl pending |
| OpenworkVotingPowerCheckpoints | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | V1 | [openwork-voting-power-checkpoints-v1.sol](../../../src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol) | proxy + impl pending |
| ETHDAOMessaging | `0xDCF7c77314E8F042C97EFB96991b7DAc5Dc79f0D` | `0x532fAB0b8Ca0dD7c14ca1324e7502534E5c8b9AE` | V1 | [eth-dao-messaging-v1.sol](../../../src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol) | proxy + impl pending |
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | — | V1 | [eth-lz-openwork-bridge.sol](../../../src/suites/current-mainnet/eth/eth-lz-openwork-bridge.sol) | verified |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | — | V1 | [eth-rewards-contract.sol](../../../src/suites/current-mainnet/eth/eth-rewards-contract.sol) | verified |
| OpenworkToken (OWORK) | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | — | V1 | [openwork-token.sol](../../../src/suites/current-mainnet/utilities/openwork-token.sol) | verified |

## Active peer and pathway status

| Pathway | Status | Evidence / limitation |
|---|---|---|
| XDC ↔ Arbitrum | End-to-end tested | Reciprocal peers and explicit four-DVN security configuration; production job `30365-3` completed after the 19 July cutover |
| Optimism ↔ Arbitrum | Configured | Reciprocal peers and Native V3 security stack read back; no recorded post-cutover application delivery test |
| Ethereum ↔ Arbitrum | Configured | Reciprocal peers and Native V3 security stack read back; no recorded post-cutover governance delivery test |

Active peer values:

| Source | Target | Peer |
|---|---|---|
| Arbitrum V3 bridge | Ethereum `30101` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| Arbitrum V3 bridge | Optimism `30111` | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| Arbitrum V3 bridge | XDC `30365` | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` |
| Optimism bridge | Arbitrum `30110` | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |
| Ethereum bridge | Arbitrum `30110` | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |
| XDC V2 bridge | Arbitrum `30110` | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |

## Legacy and held artifacts

- Old Arbitrum bridge `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` remains deployed for rollback/in-flight compatibility but is not the active pointer.
- Old XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` is retired on XDC. The same address remains active on Optimism. Ethereum retains a historical peer value for this retired XDC address; it is legacy configuration, not an intended active pathway.
- `LocalAthena V2` exists in source but is intentionally not deployed pending a production dispute-minimum decision.

## Architecture changes in the 19 July rollout

- Added historical voting-power checkpoints on both Arbitrum and Ethereum.
- Added `ETHDAOMessaging` on Ethereum and `NativeDAOStakeSync` on Arbitrum to separate DAO messaging from native stake-state application.
- Replaced the Arbitrum and XDC bridge deployments and cut all active application pointers to them.
- Upgraded NOWJC, NativeArb LOWJC, NativeArb Athena, Native DAO, NativeAthena, ProfileGenesis, ProfileManager, Ethereum DAO and XDC LOWJC.
- Configured NativeRewards `profileGenesis` on 1 August; this was a configuration write, not a new contract deployment.

## Outstanding actions

- Publish and verify source for the 19 new artifacts on the relevant explorers.
- Run post-cutover application delivery proof for Optimism ↔ Arbitrum.
- Run post-cutover governance delivery proof for Ethereum ↔ Arbitrum.
- Decide the production dispute minimum before deploying LocalAthena V2.
