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

## Phase 3 — isolated replacement-bridge configuration

Status: **complete**. The old production bridges, reciprocal peers, proxies, and core bridge pointers were not changed in this phase.

### Arbitrum bridge-local transactions

| Nonce | Operation | Transaction hash |
|---:|---|---|
| 203 | Route Native DAO | `0xa59195ee90c28f092113dc2348e6490a480aa66630a332fa013ccce28d93e87b` |
| 204 | Route stake sync | `0x366cd293cfc89763446ecb439fc284886ecdd9bf9da7e18c6fad36915acd44bb` |
| 205 | Route NativeAthena | `0x0935931ae14b41ada6ba043c50cf22e89bf50596e21600e26e824fefd980e26b` |
| 206 | Route NOWJC | `0x37b8bef2a6373038acf93d85368bdea18e758c601201d13a18e69a43392026b8` |
| 207 | Route ProfileManager | `0x74e9f3250b207890d33fb64c25e7cfff2b631c5ed60aca88102c8d3e04bbe126` |
| 208 | Add Optimism EID 30111 | `0x220cdd07f2a9484849636c568176baa70dba1ae346aceefc29e2ab7d863ffb8d` |
| 209 | Add XDC EID 30365 | `0xf1bf6821131c8d7cdf409cf5abbf321334c528ef8e711b09f06005ac77a34f16` |
| 210 | Set XDC callback options | `0x7d97e02a82b275350262fd667065a8bf56a3cfc2081f3d3d2073fdbdafc3de53` |
| 211 | Set Ethereum peer | `0x4c8ca8b7d2606dab33d89bffc2d83a2bfe3ddd3c844cbef79809263f03cb4083` |
| 212 | Set Optimism peer | `0x9e61fadca7fd06e3e474eb77b4326b2cb5ad7e1f029e8206b23ddeecbb33f5c0` |
| 213 | Set XDC peer | `0xd9b029728b59e1f848ca524302b53f254ef720409cb3f911eef1e88affa79b18` |
| 214 | Authorize Native DAO | `0x73bec3397a7c9f524121de86ad88e2f4e86bcff73a658cd783a76008b3cb3e5f` |
| 215 | Authorize NOWJC | `0x4f71472ba87ffd4166e6e2cb30f1f29505b89480a9165cf87e78e3f7c624c8f9` |
| 216 | Authorize NativeAthena | `0x876289040713ee1daa8bca4ab5e1b8d8b7480ab7d370ee8793b9430b3c861c11` |
| 217 | Authorize Rewards | `0x53aca6765030e7629fc00d6dfa8879ff6db6886f9c9ce2accb20e7fcd03dc1ea` |

Readback confirmed the exact owner, routes, EIDs, callback bytes, peers and authorizations. `nativeDAO` admin authority and `directContractManager` remain zero as required.

### Arbitrum LayerZero endpoint transactions

| Nonce | Operation | Transaction hash |
|---:|---|---|
| 218 | Set Ethereum send library | `0x3769c44e7456df92a5a2981da841208bec5c8ebc55407f4822f635a6b05eee8a` |
| 219 | Set Ethereum receive library | `0x1a0e2a7d42f18ccc10e6da9b7edcb9a31cad1f26eb53793717525d2c47d9d107` |
| 220 | Set Ethereum send configs | `0xa62fa1ef475befe262ebe8b5ee312eabede10c17daa522a1dad23c1315fd21c5` |
| 221 | Set Ethereum receive config | `0xd1ebb4980a84f536f4fe004450b9bd259238febf5e619ecb6cb1bf6e5e55799b` |
| 222 | Set Optimism send library | `0x85c8d5a641f0f8f4a0d2883d64abc5f2e5c6a8a1fa9d4b73157bccd2c20dcd07` |
| 223 | Set Optimism receive library | `0xacbd244373f9886d0a5df956c944408f3e502672824af08af5563f590dcbdde7` |
| 224 | Set Optimism send configs | `0xd29b9373c56200c324c43787a1ba80c97d62a5ff5727b9ba6702da3f5b586b5b` |
| 225 | Set Optimism receive config | `0x740ac30983d457eab119aed32c3f4bfe1cb306783e92b6b759e58edf87cc1e3d` |
| 226 | Set XDC send library | `0x5a7dea698310f3d494f4f75f66982575bea5842a7a316d9d9ac2bf66e2ff9517` |
| 227 | Set XDC receive library | `0xb71c85b4615b6eb96babac532d63aa112bd89c270eb7872a92295a359fc4f086` |
| 228 | Set XDC send configs | `0xdf3e0549d4efb2af0bd45bef30b6342a531e8330140fcd000c03aafd713bf166` |
| 229 | Set XDC receive config | `0xb0f7a045fb02747dbd05e0c813a4f840a6902d89da05d222a8d6363bb7dbde45` |

For EIDs 30101, 30111 and 30365, endpoint readback byte-matched the locked send/receive libraries, executor config, send ULN and receive ULN. Ethereum uses 15 receive confirmations; Optimism and XDC use 20. Each uses the four locked required DVNs and no optional DVNs.

Arbitrum isolated-configuration execution cost: `0.000046645852760000 ETH`. Post-phase signer state: nonce 230; balance `0.002563323723525726 ETH`.

### XDC bridge-local and LayerZero transactions

| Nonce | Operation | Transaction hash |
|---:|---|---|
| 21 | Route LOWJC | `0x98449dec668e47901edb8e4b694603ae69e9d275e472f2b130cb2cdff2fc99e6` |
| 22 | Route Athena | `0xd5c9137e611a6621f14a8f80669758bd8f4c05f8fc110cf660db20d9b6c310c1` |
| 23 | Authorize LOWJC | `0xbf97ca0abe30916ba0a2b02515bdddb2c1685d9819bedd9f8c1784936be604a5` |
| 24 | Authorize Athena | `0x7b2f57b20357bebd3ce31ee8894b086f59731ad9f40d5da26d254459b100ca71` |
| 25 | Set Arbitrum peer | `0x91793d382a4ddaa507ae75d884667be413349b454d32918333330d59e3012501` |
| 26 | Set Ethereum peer; security path remains disabled | `0x285ae179ac33cbad62c187336b174758a69259ccaf719ed7c2034ce7c4baa552` |
| 27 | Set Arbitrum send library | `0x50ce565622c6f7d59c0a3e055c76890c273978ed869940c793f27d591cf9f63c` |
| 28 | Set Arbitrum receive library | `0x77fd5e8c96bbd57f5dce837980151d954398310f770e832bb1cdeb8ef09c89e2` |
| 29 | Set Arbitrum send configs | `0x511240ab000b00ded8f4a7875240af63d8eea23b85cad5d22b6c575a5dbb10e4` |
| 30 | Set Arbitrum receive config | `0x14807626400014a9881ee0a1b8520364b9d78b0906aa983baad10eade72cb4a1` |

Readback confirmed the exact LOWJC/Athena routes and authorizations, Arbitrum/Ethereum peers, send/receive libraries, executor bytes and four-DVN ULN bytes. No Ethereum security config was installed, so that direct path remains disabled.

XDC isolated-configuration execution cost: `0.011533889759698118 XDC`. Post-phase signer state: nonce 31; balance `50.261279823746857208 XDC`.

## Phase 4 — independent Arbitrum proxy upgrades

Status: **complete**.

| Nonce | Proxy upgrade | New implementation | Transaction hash |
|---:|---|---|---|
| 230 | NativeAthena to V9 | `0xB4ea3444517B5C11DDF47f8F6E9dA6EccCD17395` | `0x5aa766c9947ecb3a809212d4c4b09f13a472edc4d5864384e186c3a9c531fe2f` |
| 231 | ArbLOWJC to V5 | `0xdd7BA6d8E92358AD7477b2f79fF83C78aC07F289` | `0x43b7f3210c20c28ea1e7fddeaac87d64bd9c54cbe17df337a4767cd660c28512` |
| 232 | ArbAthenaClient to V3 | `0x6DE7D58FCffF98AF2E85e1976155f3D671F6756C` | `0x92fea61d63567b65f4b84b5591e81f3ff1015abc2c4f71826f44ccb0e69580ee` |
| 233 | ProfileGenesis to V2 | `0x9E8F58839aB114BbcA8A0c24f5BEC1C841294784` | `0x83a1bc36324ffe5bc72e0661af432a343efdc54c30693720cd5e6e3cdabcdd83` |
| 234 | ProfileManager to V3 plus atomic Job Genesis initializer | `0xd30c9f6Bf3e6563a64AC32BD4Cc76407ed0e2fFf` | `0x709f3e4560b794317964bc31593ef091d770740ef7b7dd10cff9e69c3d55ca2a` |

Every receipt succeeded and every ERC-1967 implementation slot matched. Owner/dependency smoke checks passed. NativeAthena and ProfileManager still pointed to the old bridge after this phase. ProfileManager's `jobGenesis` is `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294`. ArbLOWJC's job counter remained 21. ArbAthenaClient's stored minimum remained `50,000,000` units; V3 retains the selected testing-any-positive-fee behavior.

Execution cost: `0.000004434826742000 ETH`. Post-phase Arbitrum signer state: nonce 235; balance `0.002558888896783726 ETH`.

## Phase 5 — DAO modules, atomic upgrades and checkpoint migration

Status: **complete**. Immediately before each DAO upgrade, `getActiveProposalIds()` returned empty IDs and states.

| Chain | Nonce | Operation | Transaction hash |
|---|---:|---|---|
| Ethereum | 46 | Authorize DAO-messaging proxy on existing ETH bridge | `0x63710b582ec4d85c088b5a4a1718507b9c0be6c57766dc598542469e0d014203` |
| Arbitrum | 235 | Authorize stake-sync proxy on Job Genesis | `0x261445b2c4a7f7a201f7c637493bac2f8b151f3a036f7d2f2090e8eec4ed354d` |
| Ethereum | 47 | Upgrade ETH DAO to V3 and atomically initialize checkpoint/messaging modules | `0xe81a86418ce3b72bee0d15e491d5d5855ff573bb48fcdc2518ecfc49f969ec0b` |
| Arbitrum | 236 | Upgrade Native DAO to V2 and atomically initialize checkpoint module | `0x6f3c00a751b72cce327892cda5d8321f4372dbde0efd8db9357a86bbcb1cd990` |
| Ethereum | 48 | Seed two audited Ethereum voting accounts | `0x7964459976ca3f6772585a2f0e44f6d9362bd18180d9532501e67f464d351fde` |
| Arbitrum | 237 | Seed 12 audited native voting accounts | `0x7d5ceb2e9147d499381124c7e477955c564f98d39aba93c9f4c89cde61e6b216` |

Both implementation slots and atomic module addresses matched. Ethereum owner, token, existing bridge, chain ID, proposal/voting thresholds and unstake delay were unchanged. Arbitrum owner, NOWJC, existing bridge, Genesis, activity tracker, Rewards and all four thresholds were unchanged. Each migration account has exactly one checkpoint; its latest stake and reward components exactly match the DAO's current components.

Ethereum phase cost: `0.000017506812487457 ETH`; post-phase nonce 49 and balance `0.001493659390882947 ETH`.

Arbitrum phase cost: `0.000031970169118000 ETH`; post-phase nonce 238 and balance `0.002526918727665726 ETH`.

## Phases 6–9 — maintenance, canonical job flow, reciprocal cutover and callback reserve

Status: **complete**.

Maintenance inspection found no old-bridge events in the inspected Arbitrum, Optimism or XDC windows. Ethereum had only this rollout's module-authorization event and no message traffic. Before cutover, Ethereum, Optimism and the old XDC bridge all still peered with the old Native bridge.

### Arbitrum preparation and core cutover

| Nonce | Operation | Transaction hash |
|---:|---|---|
| 238 | Upgrade NOWJC to V5 | `0x66b67a2c6bf5951ca5f1370962c8bf05e991db38c8f4aa1967093cb5267d12ad` |
| 239 | Authorize new bridge on NOWJC | `0x7b0a41415df3c31f65f7ad4a8be00277d8440069b2eb02d0c66204dfa544fa49` |
| 240 | Authorize new bridge on NativeAthena | `0xa6e50b3c41dd5a52bad036fa1623fed8bcd711b21345a01352b5294f16a26ea7` |
| 241 | Preserve old bridge authorization on NativeAthena for rollback/in-flight compatibility | `0xcccdb34d0b3bbd0c25a3d1cb761c1b45d19b5a96c2af632600fbdb1d2f0485eb` |
| 242 | Point Native DAO to new bridge | `0xa4b6e3e9034bc41ab5b043eb786c4d8c9bb9655fceb21a2aca76a1d228fa66c0` |
| 243 | Point NativeAthena to new bridge | `0x2e69892ae68bf9603d888a79bb83cf43c74ba037fbb1197832717cf7ca032f58` |
| 244 | Point NOWJC to new bridge | `0xdcf801e4c37cb94ab7d686fb0b08920400ff9e5c88093bd05259feb8e093deb7` |
| 245 | Point ProfileManager to new bridge | `0x88a8b0a81c7ff537c1a69e02c3f26744eb56fa952fbc033337c385680e675629` |
| 246 | Point Rewards to new bridge | `0x9191ae8585cb0b303c927fd119f0a3b9f4587d19fecd0ab0be084214ac1cf4b2` |
| 247 | Fund recoverable callback reserve | `0x60b7ee6a0ac1a799828afa8a39fb26f6f1766a6bbc74f9ac89d5e49a1d9d671e` |

NOWJC V5 retained owner, Genesis, Rewards, USDC, NativeAthena, Native DAO, treasury, old bridge and the live zero commission/minimum settings. Both old and new bridges remain authorized on NOWJC and NativeAthena. All five core `bridge()` pointers now return `0x9A0950594A699f5fb7decd7069F935100d39D9bF`.

### Reciprocal local-chain cutover

| Chain | Nonce | Operation | Transaction hash |
|---|---:|---|---|
| XDC | 31 | Upgrade LOWJC to V3 | `0x1544c47b9ca7b2663729258b30ccd027beefe3e115963a74b9c2a6fb8da01d8f` |
| XDC | 32 | Point LOWJC to new XDC bridge | `0xe941b8e3757a44f37d6376bd9bb8352b8611a1390a9e901e53d4a175ba59aaee` |
| XDC | 33 | Point LocalAthena to new XDC bridge | `0xa22f5f2dc2d820a04f58422a7880ea2f129c5be56fb2ed02408219952bbb3b16` |
| Ethereum | 49 | Change Arbitrum peer to new Native bridge | `0xb4889ae93a4a58b88af0e01eccbbc911ccfba39ff51f138464934db1dcc2db4e` |
| Optimism | 327 | Change Arbitrum peer to new Native bridge | `0x1982ca18b9a70e3092379caba29ab86d725db8e39a419595077a0bdd57032e71` |

XDC LOWJC V3 retained owner, job counter 2, USDC, EID, CCTP endpoints, Athena and pre-cutover bridge until the explicit pointer transaction. Both XDC LOWJC and LocalAthena now point to `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951`; the testing minimum remains `50,000,000` units. Ethereum and Optimism peer EID 30110 now contain the new Native bridge as bytes32.

### Callback quote and reserve

- Representative payload: 512-byte ABI encoding of `startJobMilestones` with a long XDC job ID and five canonical milestone amounts.
- Payload keccak256: `0x712abb2ece72995dbae374add81e0bba69736e3cc61ccb04dc494ed874adc96a`.
- Quote matched on two Arbitrum RPCs: `11,441,372,830,583 wei` (`0.000011441372830583 ETH`).
- Reserve funded: `0.0005 ETH`, enough for 43 such callbacks at the quoted fee before fee changes.
- Reserve is held by the owner-controlled bridge and recoverable through its owner-only withdrawal function.

### Phase cost and final topology snapshot

- Ethereum cutover gas: `0.000001458266203475 ETH`.
- Arbitrum gas: `0.000007942780428000 ETH`, plus the separate recoverable `0.0005 ETH` callback reserve.
- Optimism cutover gas: `0.000000000732122220 ETH`.
- XDC upgrade/cutover gas: `0.001453188621500000 XDC`.
- Post-phase signer balances: Ethereum `0.001492201124679472 ETH`; Arbitrum `0.002018975947237726 ETH`; Optimism `0.000819327708158739 ETH`; XDC `50.259826635125357208 XDC`.
- Full four-chain structural audit: **pass**. All implementations, module addresses, core pointers, reciprocal peers, authorizations, active-proposal gates and reserve balance matched.

## Recovery rules

- Stop immediately on a failed receipt, nonce divergence, owner mismatch, unexpected implementation slot, runtime-hash mismatch, LayerZero config mismatch, active proposal, or unexplained in-flight message.
- Artifact deployment alone changes no live proxy behavior.
- Runtime verification accounts for compiler-declared immutables: UUPS implementations embed their own address and bridges embed their LayerZero endpoint. The artifact's zero-filled runtime-template hash is never compared directly to live code when immutable references are present.
- New bridges are configured and verified while isolated before any current contract or reciprocal peer points to them.
- Old bridges remain deployed and authorized during cutover for rollback; they are not destroyed.
- No callback reserve is funded until a fresh maximum representative quote is taken after final configuration.
- The temporary keystore-password file is deleted at the end of the deployment session.
