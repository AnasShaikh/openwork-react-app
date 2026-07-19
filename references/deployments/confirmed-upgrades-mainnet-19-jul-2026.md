# Confirmed Upgrades Mainnet Deployment Ledger — July 19, 2026

This is the canonical, append-only operational record for the July 19, 2026 confirmed-upgrade rollout. It records approval, exact deployed source, every live address, transaction hash, verification result, and remaining action. A planned address or transaction is never described as live until its receipt and runtime code have been verified on-chain.

## Authority and release lock

- Explicit deployment and prudent-spend approval: user instruction in the deployment task on July 19, 2026.
- Authorized signer: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`.
- Repository: `AnasShaikh/openwork-contracts-final`.
- Branch: `main`; no deployment branch is used.
- Deployment package commit: `50e51ede29dd6c3f2b62eae648b544b362cd6ed7`.
- Successor-source and baseline commit: `cc4e45c6a436805dfcde67ac50bce611f39576c0`.
- Artifact/configuration manifest: `references/logs/imp/confirmed-contract-upgrade-deployment-manifest-19-jul-2026.md`.
- Compiler lock: Solidity `0.8.23+commit.f704f362`, EVM `shanghai`, optimizer 200, via IR, IPFS metadata.
- Signing method: encrypted Foundry keystore account `openwork-deployer`. No plaintext private key or password is recorded here.
- Original deployed source files remain untouched. Every corrected implementation is a named successor file.

## Approved scope

| Chain | Deployments | Later live-state operations |
|---|---:|---|
| Ethereum | 5 | Authorize messaging module, upgrade DAO atomically, seed checkpoints, cut reciprocal Arbitrum peer |
| Arbitrum | 12 | Configure isolated bridge/LZ security, 7 proxy upgrades, authorization/routes, seed checkpoints, bridge cutover |
| XDC | 2 | Configure isolated bridge/LZ security, upgrade LOWJC, routes and cutover |
| Optimism | 0 | Change only the existing bridge's Arbitrum peer |

The release excludes LocalAthena V2, the unresolved job-bound disputed-fund accounting design, any change that removes multiple disputes per job, and any new native-to-local dispute-settlement callback. The intentionally low testing dispute fee remains unchanged.

## Phase 0 — live preflight

Status: **complete; no transaction sent**.

Snapshot taken July 19, 2026 before funding bridge transaction:

| Chain | Pending signer nonce | Native balance | Active proposals / ownership gate |
|---|---:|---:|---|
| Ethereum | 40 | `0.004933662498556807 ETH` | No active DAO proposals; expected owner confirmed |
| Arbitrum | 191 | `0.000276365728837726 ETH` | No active DAO proposals; expected proxy owners confirmed |
| XDC | 19 | `50.383926152756555326 XDC` | Expected LOWJC/Athena owners confirmed |
| Optimism | 327 | `0.000819328440280959 ETH` | Expected bridge owner confirmed |

- All 19 nonce-predicted candidate addresses had empty code at preflight.
- Current implementation slots matched the deployment manifest.
- The configured Alchemy Ethereum endpoint returned a monthly-capacity `429`; it is excluded from broadcasting and verification.
- Ethereum chain ID, pending nonce, and balance matched across `ethereum-rpc.publicnode.com`, `eth.drpc.org`, `1rpc.io/eth`, and `rpc.mevblocker.io` where queried.
- Canonical Arbitrum One Inbox: `0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f`.
- Approved funding action: call `depositEth()` from the signer with `0.003 ETH`; the EOA receives the same amount on Arbitrum.
- Independently matching bridge gas estimates: `92,991` gas. Observed gas price range: `47,946,831–51,127,516 wei`, approximately `0.00000446–0.00000475 ETH` execution gas before wallet fee padding.
- Because the bridge transaction consumes Ethereum nonce 40, all Ethereum deployment candidates must be recomputed from nonces 41–45 after the bridge receipt. Arbitrum deployment candidates remain valid only while pending nonce stays 191.

## Phase 1 — Ethereum-to-Arbitrum deployment funding

Status: **complete**.

| Field | Value |
|---|---|
| Source chain | Ethereum mainnet, chain ID 1 |
| Target | Official Arbitrum One delayed Inbox `0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f` |
| Function | `depositEth()` |
| ETH value | `0.003 ETH` |
| Arbitrum recipient | Signer `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Source nonce | 40 |
| Transaction hash | `0xbb3dddb45715dd5568a0fffd7653912c3da855c906c0d1467b570d9dc0b10ba7` |
| Ethereum receipt | Success at block `25564372`; gas used `91,101`; effective gas price `51,762,155 wei`; cost `0.000004715584082655 ETH` |
| Arbitrum credit | Confirmed by two independent RPCs; balance increased exactly `0.003 ETH`, from `0.000276365728837726 ETH` to `0.003276365728837726 ETH` |

Post-receipt Ethereum signer state:

- Pending nonce: 41.
- Balance: `0.001928946914474152 ETH`.
- Recomputed deployment addresses for the helper's exact CREATE order:

| Nonce | Candidate address | Artifact |
|---:|---|---|
| 41 | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | ETH DAO V3 implementation |
| 42 | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | Checkpoints V1 implementation |
| 43 | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | Checkpoints V1 proxy |
| 44 | `0x532fAB0b8Ca0dD7c14ca1324e7502534E5c8b9AE` | ETHDAOMessaging V1 implementation |
| 45 | `0xDCF7c77314E8F042C97EFB96991b7DAc5Dc79f0D` | ETHDAOMessaging V1 proxy |

## Deployment address registry

Nothing in this table is live yet. Rows will be filled only after successful receipts and runtime-hash checks.

| Chain | Live role | Versioned source file | Implementation address | Proxy / standalone address | Deployment tx | Runtime verified | Explorer source |
|---|---|---|---|---|---|---|---|
| Ethereum | ETH DAO | `src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol` | Pending | Existing `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Pending | Pending | Pending |
| Ethereum | Voting checkpoints | `src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol` | Pending | Pending | Pending | Pending | Pending |
| Ethereum | DAO messaging | `src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol` | Pending | Pending | Pending | Pending | Pending |
| Arbitrum | Native bridge | `src/suites/current-mainnet/native/native-lz-openwork-bridge-v3.sol` | N/A | Pending | Pending | Pending | Pending |
| Arbitrum | Native DAO | `src/suites/current-mainnet/native/native-openwork-dao-v2.sol` | Pending | Existing `0x24af98d763724362DC920507b351cC99170a5aa4` | Pending | Pending | Pending |
| Arbitrum | Voting checkpoints | `src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol` | Pending | Pending | Pending | Pending | Pending |
| Arbitrum | Stake sync | `src/suites/current-mainnet/native/native-dao-stake-sync-v1.sol` | Pending | Pending | Pending | Pending | Pending |
| Arbitrum | NativeAthena | `src/suites/current-mainnet/native/native-athena-v9.sol` | Pending | Existing `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | Pending | Pending | Pending |
| Arbitrum | NOWJC | `src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol` | Pending | Existing `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | Pending | Pending | Pending |
| Arbitrum | ArbLOWJC | `src/suites/current-mainnet/native/native-arb-lowjc-v5.sol` | Pending | Existing `0x5727cA7326032a8644a49dECECB8388BEF122bef` | Pending | Pending | Pending |
| Arbitrum | ArbAthenaClient | `src/suites/current-mainnet/native/native-arb-athena-client-v3.sol` | Pending | Existing `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | Pending | Pending | Pending |
| Arbitrum | ProfileGenesis | `src/suites/current-mainnet/native/native-profile-genesis-v2.sol` | Pending | Existing `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | Pending | Pending | Pending |
| Arbitrum | ProfileManager | `src/suites/current-mainnet/native/native-profile-manager-v3.sol` | Pending | Existing `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | Pending | Pending | Pending |
| XDC | Local bridge | `src/suites/current-mainnet/local/local-lz-openwork-bridge-v2.sol` | N/A | Pending | Pending | Pending | Pending |
| XDC | Local LOWJC | `src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol` | Pending | Existing `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Pending | Pending | Pending |

## Transaction journal

No live transaction has been broadcast in this rollout yet.

| Seq. | Chain | Nonce | Purpose | Value | Tx hash | Receipt | Post-state verification |
|---:|---|---:|---|---:|---|---|---|
| 1 | Ethereum | 40 | Bridge deployment funding to Arbitrum | `0.003 ETH` | `0xbb3dddb45715dd5568a0fffd7653912c3da855c906c0d1467b570d9dc0b10ba7` | Success | Canonical Inbox event and exact `0.003 ETH` Arbitrum balance increase confirmed |

## Recovery rules

- Stop immediately on a failed receipt, nonce divergence, owner mismatch, unexpected implementation slot, runtime-hash mismatch, LayerZero config mismatch, active proposal, or unexplained in-flight message.
- Artifact deployment alone changes no live proxy behavior.
- New bridges are configured and verified while isolated before any current contract or reciprocal peer points to them.
- Old bridges remain deployed and authorized during cutover for rollback; they are not destroyed.
- No callback reserve is funded until a fresh maximum representative quote is taken after final configuration.
- The temporary keystore-password file is deleted at the end of the deployment session.
