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

Rows are marked live only after successful receipts and immutable-aware runtime verification.

| Chain | Live role | Versioned source file | Implementation address | Proxy / standalone address | Deployment tx | Runtime verified | Explorer source |
|---|---|---|---|---|---|---|---|
| Ethereum | ETH DAO | `src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol` | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | Existing `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xac4090a72d64f316eeb368f57b1b99a8b256cb7fac436dcff2179d66dc08a2b4` | Yes; patched live hash `0xe4081627893f8af8f2cd6dbd6ef9b9cd58aca6ecd2ebe1849d33136ea46969dc` | Pending |
| Ethereum | Voting checkpoints | `src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol` | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | Impl `0x3e31d04417667fc4e4cbecf795201915de37df05412d17a2473c117b6185c2f3`; proxy `0x0f557411422c70cc98c0682e6d1bedb2e2b61ff1e5245e8a7115b446ec01caa1` | Yes; impl patched hash `0x2d3edbd31d99fd4921d54a800caa18e6ba3a334b308095329cf838a76385d6b0`; proxy hash locked | Pending |
| Ethereum | DAO messaging | `src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol` | `0x532fAB0b8Ca0dD7c14ca1324e7502534E5c8b9AE` | `0xDCF7c77314E8F042C97EFB96991b7DAc5Dc79f0D` | Impl `0x6fb4f924b2ae05283d06528aef0f004428648fbd766c8d5fb4c1e13a4bb34efa`; proxy `0xe22528b9e6cefa4f372976f44bff0eeafe04648096332d0f794040cce2038356` | Yes; impl patched hash `0x48288739add349317d9ddb6cc77d90d443859e260d4cf59c5a16bd1d2e4a5613`; proxy hash locked | Pending |
| Arbitrum | Native bridge | `src/suites/current-mainnet/native/native-lz-openwork-bridge-v3.sol` | N/A | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` | `0x7b69dff407ddee87955841055460911ac7fbf789b4fc0055fbb0331404532a81` | Yes; endpoint-patched hash `0x5aa71c5a3e44163ff17c8fe69716373e3be78ebb1436ec668601144fba0bde02` | Pending |
| Arbitrum | Native DAO | `src/suites/current-mainnet/native/native-openwork-dao-v2.sol` | `0xeb1A8fB15d3Bf5E1bd1100AC2528962356c2a398` | Existing `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x06bdc55aa46881408921b43144941b8a39789715cdfb6bd940c1c40930062436` | Yes; patched hash `0x04209a700a46d556ec02e72263842cb414453b0416450763b6c34e0dc72f8ed4` | Pending |
| Arbitrum | Voting checkpoints | `src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol` | `0x78C3E094a8Dba771c434E1258738cE9D4404C19e` | `0x586cb49f19f93E5b9037CD22c539a7529b7bA1d9` | Impl `0x261e3202190e19f5da70dec6e7d4f6f2dea6c843c727d1113c3f03d77dc9886e`; proxy `0xe915c98777e48fe93678aad513f1b79c3d3d464202d2752c4f2445998dddde4c` | Yes; impl patched hash `0x6b10c72c9b40d4f8b50cf78ce03ed4d0896d5507710b7aac7d3cc41545503099`; proxy hash locked | Pending |
| Arbitrum | Stake sync | `src/suites/current-mainnet/native/native-dao-stake-sync-v1.sol` | `0xddF69B7C6a04C4972e27Dc2b3a9f88E8081bCf03` | `0xe541c372bF4E91F9FFe3Bc2A2Fa45CC38A273d2B` | Impl `0x1365a71ff342bb1f041e4147db1742e1b3911c3475678490625876a6ab63aa8f`; proxy `0x62e32713ec47c5affab468e71f6d57555d358e1e84eb72c0835a436ce07a7ba3` | Yes; impl patched hash `0x479a6a383ebf39ac142ea9ece23606980e90b25b0a26d117d0e8253191606c3d`; proxy hash locked | Pending |
| Arbitrum | NativeAthena | `src/suites/current-mainnet/native/native-athena-v9.sol` | `0xB4ea3444517B5C11DDF47f8F6E9dA6EccCD17395` | Existing `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0x0c5a1418e84f8024fe60d0f893a47579c72017344766195b24842bd19e7a363f` | Yes; patched hash `0x91da91a3d6cabfac21aa36532302efa32a6dee9cedc8865c100a3494eb7f4135` | Pending |
| Arbitrum | NOWJC | `src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol` | `0x1a406176a9f5727689035eD82f4c28CACaCeDC96` | Existing `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0xf03fdfb9b068e4e6785284fe0c27b32db901b7fe349ce41fd0222d96e75e120a` | Yes; patched hash `0x1e67c6ae96dbdd7c4d5d0cbd0bb8b5d6c58acce550ce8f3811222d9165ba6779` | Pending |
| Arbitrum | ArbLOWJC | `src/suites/current-mainnet/native/native-arb-lowjc-v5.sol` | `0xdd7BA6d8E92358AD7477b2f79fF83C78aC07F289` | Existing `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0x72be448abc4612687af90972bb884051d91b0e9f0561b5ac45e4c2fa3eeb8e14` | Yes; patched hash `0x41411dc17134f195827554e7462ab1daea8c53bd9e2f6f573fcdd4f8135998ec` | Pending |
| Arbitrum | ArbAthenaClient | `src/suites/current-mainnet/native/native-arb-athena-client-v3.sol` | `0x6DE7D58FCffF98AF2E85e1976155f3D671F6756C` | Existing `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x15ae2755581bbfc0ff039bd68d345cc4a9eba668def14126ac6824b02cd3f081` | Yes; patched hash `0x6274f7ffcc2037149a26d3359a5c4a70d3d49065013524db536b10b746ac5d10` | Pending |
| Arbitrum | ProfileGenesis | `src/suites/current-mainnet/native/native-profile-genesis-v2.sol` | `0x9E8F58839aB114BbcA8A0c24f5BEC1C841294784` | Existing `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0x3c7a0cb949f549eaa080c9c2ebc5a4fb4935a7a2ecad258c515a7dcc18579e53` | Yes; patched hash `0xa00e5d639aeb0fb642edbcfadbeb8d57cd1018c00f8c2b9afe17f1cb27fe75ca` | Pending |
| Arbitrum | ProfileManager | `src/suites/current-mainnet/native/native-profile-manager-v3.sol` | `0xd30c9f6Bf3e6563a64AC32BD4Cc76407ed0e2fFf` | Existing `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x3c1adb08219f6a1cfe62cb0896fb8d076f245d6dec51c2464d8eb5b6835aa54c` | Yes; patched hash `0x656c414d5f055c809d2ac5e046b82e667be74dda86d71e6db0ee129f40545d5b` | Pending |
| XDC | Local bridge | `src/suites/current-mainnet/local/local-lz-openwork-bridge-v2.sol` | N/A | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | `0x99b8786959993efbe647628a1d4756c077756325dc005e75af98e2446e957af6` | Yes; endpoint-patched hash `0xe24b3d98dbb590605dca4da6c3cb9dfb809cfa7e479d3f06eb06a7a5864c820a` | Pending |
| XDC | Local LOWJC | `src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol` | `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D` | Existing `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x1c6842e8d900951b4850975e808bd4ac6bbc9da990d5eb4de607936dcfc29764` | Yes; patched hash `0x3574087a4d7cbabcc521293037163343b08971fe3e97e1eb0253e5afba030fa7` | Pending |

## Transaction journal

No live transaction has been broadcast in this rollout yet.

| Seq. | Chain | Nonce | Purpose | Value | Tx hash | Receipt | Post-state verification |
|---:|---|---:|---|---:|---|---|---|
| 1 | Ethereum | 40 | Bridge deployment funding to Arbitrum | `0.003 ETH` | `0xbb3dddb45715dd5568a0fffd7653912c3da855c906c0d1467b570d9dc0b10ba7` | Success | Canonical Inbox event and exact `0.003 ETH` Arbitrum balance increase confirmed |
| 2 | Ethereum | 41 | Deploy ETH DAO V3 implementation | 0 | `0xac4090a72d64f316eeb368f57b1b99a8b256cb7fac436dcff2179d66dc08a2b4` | Success | Address and immutable-patched runtime exact |
| 3 | Ethereum | 42 | Deploy voting-checkpoints V1 implementation | 0 | `0x3e31d04417667fc4e4cbecf795201915de37df05412d17a2473c117b6185c2f3` | Success | Address and immutable-patched runtime exact |
| 4 | Ethereum | 43 | Deploy and atomically initialize voting-checkpoints proxy | 0 | `0x0f557411422c70cc98c0682e6d1bedb2e2b61ff1e5245e8a7115b446ec01caa1` | Success | Proxy runtime, owner, DAO and implementation slot exact |
| 5 | Ethereum | 44 | Deploy ETH DAO messaging V1 implementation | 0 | `0x6fb4f924b2ae05283d06528aef0f004428648fbd766c8d5fb4c1e13a4bb34efa` | Success | Address and immutable-patched runtime exact |
| 6 | Ethereum | 45 | Deploy and atomically initialize DAO-messaging proxy | 0 | `0xe22528b9e6cefa4f372976f44bff0eeafe04648096332d0f794040cce2038356` | Success | Proxy runtime, owner, DAO, bridge and implementation slot exact |
| 7 | Arbitrum | 191 | Deploy isolated Native bridge V3 | 0 | `0x7b69dff407ddee87955841055460911ac7fbf789b4fc0055fbb0331404532a81` | Success | Address, constructor state and endpoint-patched runtime exact |
| 8 | Arbitrum | 192 | Deploy Native DAO V2 implementation | 0 | `0x06bdc55aa46881408921b43144941b8a39789715cdfb6bd940c1c40930062436` | Success | Address and patched runtime exact |
| 9 | Arbitrum | 193 | Deploy voting-checkpoints V1 implementation | 0 | `0x261e3202190e19f5da70dec6e7d4f6f2dea6c843c727d1113c3f03d77dc9886e` | Success | Address and patched runtime exact |
| 10 | Arbitrum | 194 | Deploy and atomically initialize voting-checkpoints proxy | 0 | `0xe915c98777e48fe93678aad513f1b79c3d3d464202d2752c4f2445998dddde4c` | Success | Proxy runtime, owner, DAO and implementation slot exact |
| 11 | Arbitrum | 195 | Deploy stake-sync V1 implementation | 0 | `0x1365a71ff342bb1f041e4147db1742e1b3911c3475678490625876a6ab63aa8f` | Success | Address and patched runtime exact |
| 12 | Arbitrum | 196 | Deploy and atomically initialize stake-sync proxy | 0 | `0x62e32713ec47c5affab468e71f6d57555d358e1e84eb72c0835a436ce07a7ba3` | Success | Proxy runtime, owner, bridge, DAO, Genesis and implementation slot exact |
| 13 | Arbitrum | 197 | Deploy NativeAthena V9 implementation | 0 | `0x0c5a1418e84f8024fe60d0f893a47579c72017344766195b24842bd19e7a363f` | Success | Address and patched runtime exact |
| 14 | Arbitrum | 198 | Deploy NOWJC V5 implementation | 0 | `0xf03fdfb9b068e4e6785284fe0c27b32db901b7fe349ce41fd0222d96e75e120a` | Success | Address and patched runtime exact |
| 15 | Arbitrum | 199 | Deploy ArbLOWJC V5 implementation | 0 | `0x72be448abc4612687af90972bb884051d91b0e9f0561b5ac45e4c2fa3eeb8e14` | Success | Address and patched runtime exact |
| 16 | Arbitrum | 200 | Deploy ArbAthenaClient V3 implementation | 0 | `0x15ae2755581bbfc0ff039bd68d345cc4a9eba668def14126ac6824b02cd3f081` | Success | Address and patched runtime exact |
| 17 | Arbitrum | 201 | Deploy ProfileGenesis V2 implementation | 0 | `0x3c7a0cb949f549eaa080c9c2ebc5a4fb4935a7a2ecad258c515a7dcc18579e53` | Success | Address and patched runtime exact |
| 18 | Arbitrum | 202 | Deploy ProfileManager V3 implementation | 0 | `0x3c1adb08219f6a1cfe62cb0896fb8d076f245d6dec51c2464d8eb5b6835aa54c` | Success | Address and patched runtime exact |
| 19 | XDC | 19 | Deploy isolated Local bridge V2 | 0 | `0x99b8786959993efbe647628a1d4756c077756325dc005e75af98e2446e957af6` | Success | Address, constructor state and endpoint-patched runtime exact |
| 20 | XDC | 20 | Deploy Local LOWJC V3 implementation | 0 | `0x1c6842e8d900951b4850975e808bd4ac6bbc9da990d5eb4de607936dcfc29764` | Success | Address and patched runtime exact |

Ethereum artifact-deployment execution cost: `0.000417780711103748 ETH`. Post-phase signer state: nonce 46; balance `0.001511166203370404 ETH`. The existing ETH DAO proxy remains on its pre-release implementation; this phase changed no production proxy behavior.

Arbitrum artifact-deployment execution cost: `0.000666396152552000 ETH`. Post-phase signer state: nonce 203; balance `0.002609969576285726 ETH`. Existing production proxies and all current bridge pointers remain unchanged.

XDC artifact-deployment execution cost: `0.111112439250000000 XDC`. Post-phase signer state: nonce 21; balance `50.272813713506555326 XDC`. Existing production proxies and all current bridge pointers remain unchanged.

## Recovery rules

- Stop immediately on a failed receipt, nonce divergence, owner mismatch, unexpected implementation slot, runtime-hash mismatch, LayerZero config mismatch, active proposal, or unexplained in-flight message.
- Artifact deployment alone changes no live proxy behavior.
- Runtime verification accounts for compiler-declared immutables: UUPS implementations embed their own address and bridges embed their LayerZero endpoint. The artifact's zero-filled runtime-template hash is never compared directly to live code when immutable references are present.
- New bridges are configured and verified while isolated before any current contract or reciprocal peer points to them.
- Old bridges remain deployed and authorized during cutover for rollback; they are not destroyed.
- No callback reserve is funded until a fresh maximum representative quote is taken after final configuration.
- The temporary keystore-password file is deleted at the end of the deployment session.
