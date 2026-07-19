# Confirmed Contract Upgrade Deployment Manifest — July 19, 2026

This is the approval-gated deployment plan for the confirmed corrections recorded in `contract-upgrade-audit-ledger-18-jul-2026.md`. It prepares deployment; it does **not** authorize or record any live transaction.

## Release boundary

- Repository: `AnasShaikh/openwork-contracts-final`
- Branch: `main`
- Canonical source commit: `cc4e45c6a436805dfcde67ac50bce611f39576c0`
- Release owner/signer: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- Compiler: Solidity `0.8.23+commit.f704f362`
- EVM target recorded in artifact metadata: `shanghai`
- Optimizer: enabled, 200 runs
- Via IR: enabled
- Metadata hash: IPFS
- Foundry: `1.3.5-stable`, commit `9979a41b5daa5da1572d973d7ac5a3dd2afc0221`
- Canonical focused build output: `/tmp/openwork-release-artifacts-20260719` (ephemeral; regenerate from the pinned source before broadcasting)
- Deployment-only helper: `script/DeployConfirmedUpgradeArtifacts19Jul2026.s.sol`
- Read-only unsigned-call generator: `script/generate-confirmed-upgrade-calldata-19-jul-2026.sh`

Every correction is carried by a properly named successor. The earlier/deployed source files are byte-for-byte preserved. The deployment helper imports only the successor sources and deliberately performs no proxy upgrade, configuration write, or cutover.

The calldata generator emits 61 labeled unsigned calls (Ethereum 4, Arbitrum 43, XDC 13, Optimism 1), including nested atomic initializers and exact LayerZero library/config bytes. It never signs, sends, broadcasts, or writes a file. Its default new addresses are the nonce-pinned candidates below; override/regenerate them if any pending nonce changes.

## Included, held, and deferred

### Selected for the approval-gated release

- Ethereum: ETHOpenworkDAO V3, OpenworkVotingPowerCheckpoints V1, ETHDAOMessaging V1.
- Arbitrum: NativeOpenworkDAO V2, OpenworkVotingPowerCheckpoints V1, NativeDAOStakeSync V1, NativeAthena V9, NOWJC V5, ArbLOWJC V5, ArbAthenaClient V3, NativeProfileGenesis V2, NativeProfileManager V3, and NativeLZOpenworkBridge V3.
- XDC: Local LOWJC V3 and LocalLZOpenworkBridge V2.
- Optimism: no new implementation; only the existing local bridge's Arbitrum peer changes during the coordinated bridge cutover.

### Explicitly held

- LocalAthena V2 is not selected. Its configured-minimum enforcement would make the current 50 USDC setting effective, contrary to the agreed testing-low behavior.
- ArbAthenaClient V3 is selected because it adds verified job-party/status validation while retaining any-positive-fee testing behavior.
- Production dispute-minimum selection and enforcement remain a pre-production flag.

### Explicitly deferred or not recommended

- Finding 14, job-bound disputed-fund accounting, remains owner-design-gated and is not implemented.
- Multiple disputes per job remain supported through distinct canonical dispute IDs.
- No native-to-local dispute-settlement callback is added.
- Dormant legacy local finalization logic is not changed.

## Canonical artifact lock

The hashes below are from one focused production build containing all selected targets. `Init bytes` and `Runtime bytes` include compiler metadata. EIP-170 allows at most 24,576 runtime bytes.

| Artifact | Source successor | Init bytes | Init-code keccak256 | Runtime bytes | Runtime-code keccak256 |
|---|---|---:|---|---:|---|
| ETHOpenworkDAO | `eth-openwork-dao-v3.sol` | 24,478 | `0xc531bf193406b94e707c600d0c6b48537813bc4e6c92eea4e70ca2f72b8fd6a9` | 24,264 | `0x856d69cb3f30f5cb9ca8b91c258b67f35243b3d316a360df4b429da88ed24841` |
| ETHDAOMessaging | `eth-dao-messaging-v1.sol` | 5,990 | `0x456b53db3ee9ea0d0db0d7c05e586f005e058e8898dc0759e50b995bbccbcb3a` | 5,781 | `0xf83cbd1c22080906bba45b76f784cef5f3849e2dbeac69f9db6f9ecaf775e71c` |
| OpenworkVotingPowerCheckpoints | `openwork-voting-power-checkpoints-v1.sol` | 4,766 | `0x5403aeb62cbf63cff4a8bba727f67d57c17cd9477bbc23f91ff96902dd5db525` | 4,557 | `0xe7311f8ecca20f448b5b1447ae803a483b5cf80df3ca6855f982e8be0b650455` |
| NativeOpenworkDAO | `native-openwork-dao-v2.sol` | 24,139 | `0x9ddd8e6b8a80bbd3ddf480002095635c31000ce759dde30cc5e23862a5f387f5` | 23,918 | `0x66a84b9254fe1571f1a665c55a736dfc11624bad7ee3547fc65563e525e44013` |
| NativeDAOStakeSync | `native-dao-stake-sync-v1.sol` | 4,282 | `0x351efce7d95824fd17ce534679156c12eea26778f81e50918300dd39770481c7` | 4,073 | `0x4d9499742a1b3e8ee6ca5a470684e931e34b2013eacc16177d64e82f3b77bc6a` |
| NativeAthenaV9 | `native-athena-v9.sol` | 24,757 | `0xa855c7ca30ae88d4f14cb5f074c0186b0780c4bdb5732f43694df25303feda20` | 24,531 | `0xf26fba2da4e4ecd0e6a9954a641ffd7d0b3535560dedfae6b1ab6e27b9428f61` |
| NativeOpenWorkJobContract | `native-openwork-job-contract-v5.sol` | 24,131 | `0x9e53d4e121519a1b0782044490cc98c42930701b4aa1354503c1f31bdff5f9d1` | 23,898 | `0xcc221309ee4a6705ae0837d9681301046a5dbd6951882ba9a4aefc5d6ef1fa07` |
| NativeArbOpenWorkJobContractV5 | `native-arb-lowjc-v5.sol` | 20,127 | `0x967fff7386ebd1816b2374612e2d2691d9f2e197e7e60a91f12ff6f7b9bc0203` | 19,913 | `0xf598d0dad1fcb26326413d72757593db006acaefa5694ae13cc04ca856a0d585` |
| NativeArbAthenaClientV3 | `native-arb-athena-client-v3.sol` | 7,371 | `0x4fb5255b3312fff8fe4dad92cc9bca672b8c1e673174689a46b8adc083194697` | 7,162 | `0x8600fb32f55facc233be33064f913ded92228754f5deafab9eaf0d3e3c52b158` |
| NativeProfileGenesis | `native-profile-genesis-v2.sol` | 8,008 | `0x9864318ee5bd69f6d2953ca23945712ea95d5384446f90d9a29dc4d355e1fccb` | 7,799 | `0x250855138c523a9b2135a6c57e9902f450e69b5887a4038e236db260efef7ae2` |
| NativeProfileManager | `native-profile-manager-v3.sol` | 10,912 | `0x0417c19f8ad3b488a085da66080d09148cf26437313d951138d3980edee8648d` | 10,696 | `0x72720af81018fdd85185259426256ebd6048381471518db086bbaee1731eca6f` |
| LocalOpenWorkJobContractLite | `local-openwork-job-contract-lite-v3.sol` | 16,507 | `0xe4167f25254d7b7091a8f98cecc4673693855b7ec182556f0ea59b475fca5ddf` | 16,286 | `0x8c5d7f67ce8f0bd9385ef2c2b99818779af789502b7893b6b283df9a6d9dcb1c` |
| NativeLZOpenworkBridgeV3 | `native-lz-openwork-bridge-v3.sol` | 20,907 | `0x9c19969b9145b86a4d166222a425876bf173fcd482ba0c977ccbcd533ad89e05` | 20,448 | `0x4a9309684f91eecd6e7fe4cfd340ce030add3829ac1f1118cc41097cf5f73269` |
| LocalLZOpenworkBridgeV2 | `local-lz-openwork-bridge-v2.sol` | 10,616 | `0x004b44752d97ecb390d3e0456a1690de26beeb3be075aef734c0e9a0af7ea54d` | 10,079 | `0x0ae411a3677a1930807d8057a26b02170f3bb25d2146d71bd9d31f1ef7380eab` |
| UUPSProxy | `proxy.sol` | 828 | `0xc2e210a64e46b57c1c61c8c56e78defb8102587bbf023d30e769be7f84a6f2f8` | 267 | `0x0c40e480dae5df8d18febc649e55ee1317281784b5c3c3316257d93eb80f7f73` |

NativeAthena V9 has only 45 bytes of runtime margin and is frozen unless a release-blocking correction is followed by a new canonical size/hash lock.

## Storage and test gates already satisfied

- Exact aggregate Solidity 0.8.23 suite: 44/44.
- XDC deployment/finality suite: 4/4.
- LayerZero authentication, reserve rollback, and round-trip harness: 3/3; harness compiler exception under 0.8.23 is isolated to the bundled test helper, while production artifacts above are exact 0.8.23 builds.
- Live read-only fork rehearsals passed for the Arbitrum proxy group, Ethereum DAO/checkpoint migration, and XDC LOWJC.
- Storage compatibility:
  - ETH DAO V2 to V3: prior slots 0–13 preserved; new modules consume gap slots 14–15.
  - Native DAO V1 to V2: new checkpoint dependency appended at slot 11.
  - ProfileManager V2 to V3: job Genesis consumes gap slot 7.
  - Local LOWJC V2 to V3: pending-start state consumes gap slot 8.
  - NativeAthena V8 to V9, NOWJC V4 to V5, ArbLOWJC V4 to V5, ArbAthenaClient deployed baseline to V3, and ProfileGenesis V1 to V2: normalized storage matches.

## Live targets before deployment

| Chain | Proxy/contract | Live address | Current implementation where applicable |
|---|---|---|---|
| Ethereum | ETH DAO proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` |
| Ethereum | ETH bridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | standalone |
| Arbitrum | Native DAO proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| Arbitrum | NativeAthena proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | live V8 `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` |
| Arbitrum | NOWJC proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528` |
| Arbitrum | ArbLOWJC proxy | `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0x309f02301c641627A114D4E5Fb840bAA5C2809D3` |
| Arbitrum | ArbAthenaClient proxy | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x9456989F7B9Cb707451d7179Fc1FC401221DE01a` |
| Arbitrum | Job Genesis proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | unchanged |
| Arbitrum | ProfileGenesis proxy | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0xae31d7be760D92807B013a71bb51f2cBB132166b` |
| Arbitrum | ProfileManager proxy | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0x19E4fBe10C2F2531248e5FfDF150D8c61168702f` |
| Arbitrum | Rewards | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | standalone |
| Arbitrum | Old native bridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` | standalone; retain for rollback |
| XDC | LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| XDC | LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9`; no upgrade selected |
| XDC | Old local bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | standalone; retain for rollback |
| Optimism | LOWJC proxy | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | no upgrade in this release |
| Optimism | LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | no upgrade in this release |
| Optimism | Existing local bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | only peer update |

## Nonce-pinned candidate deployment addresses

These are candidates, not live addresses. They are valid only if the owner's pending nonce is unchanged and the helper's CREATE order is used exactly. Re-read pending nonces and regenerate the whole address/calldata plan immediately before approval.

### Ethereum — snapshot pending nonce 40

| Nonce | Candidate | Artifact |
|---:|---|---|
| 40 | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | ETH DAO V3 implementation |
| 41 | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | Checkpoints V1 implementation |
| 42 | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | Checkpoints V1 proxy |
| 43 | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | ETHDAOMessaging V1 implementation |
| 44 | `0x532fAB0b8Ca0dD7c14ca1324e7502534E5c8b9AE` | ETHDAOMessaging V1 proxy |

### Arbitrum — snapshot pending nonce 191

| Nonce | Candidate | Artifact |
|---:|---|---|
| 191 | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` | Native bridge V3 |
| 192 | `0xeb1A8fB15d3Bf5E1bd1100AC2528962356c2a398` | Native DAO V2 implementation |
| 193 | `0x78C3E094a8Dba771c434E1258738cE9D4404C19e` | Checkpoints V1 implementation |
| 194 | `0x586cb49f19f93E5b9037CD22c539a7529b7bA1d9` | Checkpoints V1 proxy |
| 195 | `0xddF69B7C6a04C4972e27Dc2b3a9f88E8081bCf03` | Stake-sync V1 implementation |
| 196 | `0xe541c372bF4E91F9FFe3Bc2A2Fa45CC38A273d2B` | Stake-sync V1 proxy |
| 197 | `0xB4ea3444517B5C11DDF47f8F6E9dA6EccCD17395` | NativeAthena V9 implementation |
| 198 | `0x1a406176a9f5727689035eD82f4c28CACaCeDC96` | NOWJC V5 implementation |
| 199 | `0xdd7BA6d8E92358AD7477b2f79fF83C78aC07F289` | ArbLOWJC V5 implementation |
| 200 | `0x6DE7D58FCffF98AF2E85e1976155f3D671F6756C` | ArbAthenaClient V3 implementation |
| 201 | `0x9E8F58839aB114BbcA8A0c24f5BEC1C841294784` | ProfileGenesis V2 implementation |
| 202 | `0xd30c9f6Bf3e6563a64AC32BD4Cc76407ed0e2fFf` | ProfileManager V3 implementation |

### XDC — snapshot pending nonce 19

| Nonce | Candidate | Artifact |
|---:|---|---|
| 19 | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | Local bridge V2 |
| 20 | `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D` | Local LOWJC V3 implementation |

## Exact initialization and upgrade calls

Implementation deployments use the canonical creation code locked above. New bridge constructor arguments are:

- Arbitrum Native bridge V3: `(endpoint 0x1a44076050125825900e736c501f859c50fE728c, owner 0x7a2B..., main EID 30101)`.
- XDC Local bridge V2: `(endpoint 0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa, owner 0x7a2B..., native EID 30110, main EID 30101, local EID 30365)`.

New proxy initialization is atomic in the proxy constructor:

- Ethereum checkpoints: `initialize(owner, ETH DAO proxy)`.
- Ethereum messaging: `initialize(owner, ETH DAO proxy, ETH bridge)`.
- Arbitrum checkpoints: `initialize(owner, Native DAO proxy)`.
- Arbitrum stake sync: `initialize(owner, new Native bridge V3, Native DAO proxy, Job Genesis proxy)`.

Proxy upgrades use `upgradeToAndCall(address,bytes)`:

- ETH DAO: new V3 implementation plus `initializeV3(ETH checkpoints proxy, ETH messaging proxy)` atomically.
- Native DAO: new V2 implementation plus `initializeV2(Arbitrum checkpoints proxy)` atomically.
- ProfileManager: new V3 implementation plus `initializeV3(0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294)` atomically.
- NativeAthena, NOWJC, ArbLOWJC, ArbAthenaClient, ProfileGenesis, and XDC LOWJC: their selected implementation with empty call data.

After every upgrade, read the ERC-1967 implementation slot, compare deployed runtime keccak256 with this manifest, confirm owner/admin state, and run the contract-specific smoke calls before proceeding.

## New bridge configuration lock

### Native bridge V3 on Arbitrum

Preserve current routing and authority while adding stake sync and XDC callback support:

- `setNativeDaoContract(0x24af98d763724362DC920507b351cC99170a5aa4)`
- `setDAOStakeSync(new Arbitrum stake-sync proxy)`
- `setNativeAthenaContract(0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf)`
- `setNativeOpenWorkJobContract(0x8EfbF240240613803B9c9e716d4b5AD1388aFd99)`
- `setProfileManager(0x51285003A01319c2f46BB2954384BCb69AfB1b45)`
- Keep `directContractManager` zero, matching the live bridge.
- Keep the separate `nativeDAO` admin-authority field zero; do not expand DAO authority merely because `nativeDaoContract` is configured for routing.
- Add local EIDs 30111 (Optimism) and 30365 (XDC).
- Peer 30101: Ethereum bridge `0x20Fa268106A3C532cF9F733005Ab48624105c42F`.
- Peer 30111: existing Optimism local bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36`.
- Peer 30365: new XDC Local bridge V2.
- Authorize Native DAO, NOWJC, NativeAthena, and Rewards, matching the live bridge. Do not newly authorize ProfileManager, which is receive-only in the current design.
- Set XDC callback options to LayerZero type-3 receive options with 1,500,000 gas and zero value: `0x0003010011010000000000000000000000000016e360`.
- Do not enable the applicant-milestone callback for Optimism in this release; its local LOWJC/bridge remain on the prior non-callback flow.

### XDC Local bridge V2

- Set LOWJC to `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7`.
- Set Athena to `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d`.
- Authorize both proxies.
- Peer 30110: new Arbitrum Native bridge V3.
- Peer 30101: Ethereum bridge `0x20Fa268106A3C532cF9F733005Ab48624105c42F`; keep the direct XDC/Ethereum pathway operationally disabled by not adding a live send/receive security configuration for it.

### LayerZero security configuration cloned from live OApps

Arbitrum endpoint: `0x1a44076050125825900e736c501f859c50fE728c`.

- EIDs 30101, 30111, and 30365 send library: `0x975bcD720be66659e3EB3C0e4F1866a3020E493A`.
- EIDs 30101, 30111, and 30365 receive library: `0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6`, zero grace period.
- Executor: max message size 10,000; `0x31CAe3B7fB82d847621859fb1585353c5720660D`.
- Send ULN: 20 confirmations, 4 required DVNs, no optional DVNs.
- Receive ULN: 15 confirmations for Ethereum EID 30101; 20 for Optimism/XDC EIDs 30111/30365; 4 required DVNs; no optional DVNs.
- Required DVNs: `0x19670Df5E16bEa2ba9b9e68b48C054C5bAEa06B8`, `0x2f55C492897526677C5B68fb199ea31E2c126416`, `0xa7b5189bcA84Cd304D8553977c7C614329750d99`, `0xf2E380c90e6c09721297526dbC74f870e114dfCb`.

XDC endpoint: `0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa`.

- EID 30110 send library: `0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043`.
- EID 30110 receive library: `0x2367325334447C5E1E0f1b3a6fB947b262F58312`, zero grace period.
- Executor: max message size 10,000; `0xA20DB4fFE74A31D17Fc24BD32a7DD7555441058e`.
- Send and receive ULN: 20 confirmations, 4 required DVNs, no optional DVNs.
- Required DVNs: `0x1294e3347EC64fD63E1D0594DC1294247CD237c7`, `0x307d81eF09c72730F57667Bf1E9B62Db4904053f`, `0x6788f52439aCa6bfF597D3Eec2DC9A44B8fEe842`, `0xDd7B5E1DB4AaFD5C8ec3B764efb8eD265Aa5445B`.

Use the endpoint's `setSendLibrary`, `setReceiveLibrary`, and `setConfig` calls, then read back and byte-compare every library/config value before any peer or core-contract cutover.

## Dependency-safe execution sequence

Each numbered phase is a separate approval and recovery checkpoint. Stop on any failed invariant.

1. **Refresh and freeze the plan.** Re-read chain IDs, blocks, pending nonces, signer balances, gas/fee data, proxy owners and implementation slots, active DAO proposals, in-flight LayerZero traffic, and the complete voting migration account sets. Regenerate candidate addresses if any nonce differs.
2. **Deploy artifacts only.** Use the dated helper without any configuration or upgrade. Verify each runtime hash and explorer source. A failed deployment changes no live proxy behavior.
3. **Configure new bridges while isolated.** Set routes, authorization, peers, callback options, and cloned endpoint security configuration. Read everything back. Existing contracts still point to old bridges.
4. **Upgrade independent Arbitrum groups.** Upgrade NativeAthena V9, ArbLOWJC V5, ArbAthenaClient V3, ProfileGenesis V2, and ProfileManager V3 with its atomic Job Genesis initializer. Verify after each contract.
5. **Deploy/attach DAO modules, then upgrade DAOs atomically.** Reconfirm no active proposal. Authorize ETHDAOMessaging V1 on the existing Ethereum bridge and authorize NativeDAOStakeSync V1 on the Arbitrum Job Genesis proxy. Configure the new native bridge's stake-sync route before enabling new Ethereum stake messages. Upgrade each DAO with its initializer, then seed all current stake/delegation/reward accounts into its checkpoint proxy.
6. **Enter a short cross-chain maintenance window.** Pause affected job/stake writes and wait for or explicitly account for in-flight LayerZero messages. Do not cut peers while known messages are in transit.
7. **Prepare canonical job flow.** Upgrade NOWJC V5, add the new Native bridge as an authorized contract, and keep the old bridge authorized for rollback.
8. **Cut over reciprocal peers and core bridge pointers.** Update Ethereum and Optimism bridge peer 30110 to the new Native bridge; configure the new XDC bridge peer; upgrade XDC LOWJC V3; point XDC LOWJC and existing LocalAthena to the new XDC bridge; point Native DAO, NOWJC, NativeAthena, ProfileManager, and Rewards to the new Native bridge. Ensure NOWJC and NativeAthena separately authorize the new bridge before it receives their traffic. Keep old bridges deployed and funded at zero.
9. **Fund callback reserve only after an exact quote.** Quote a representative maximum applicant-milestone callback with the configured 1.5M options, choose an explicitly approved reserve, and transfer that value to the new Native bridge. This is a separate value-bearing approval.
10. **End-to-end verification before reopening writes.** Test employer milestones, applicant milestones with callback/retry, application and work authorization, same-chain and cross-chain payment destination binding, ratings in both directions and duplicate rejection, testing-low disputes and multiple dispute IDs, DAO snapshots/delegation, and ordered stake sync.
11. **Record and push.** For every phase, record chain, transaction hash, block, deployed address, runtime hash, proxy implementation, configuration reads, fee paid, verification URL/status, and rollback point on `main` before continuing.

## Migration data

The migration set is live data and must be refreshed immediately before deployment.

- Ethereum snapshot candidates from reward/stake events: `0x93514040f43aB16D52faAe7A3f380c4089D844F9`, `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724`.
- Native snapshot candidate union currently contains 12 accounts from reward, stake, delegation, and team-token state. Rebuild the union rather than trusting a stale list, query current voting components for every address, and call `syncVotingPowerBatch` after the V2 upgrade.
- Immediately before upgrade, fail the release gate if either DAO has an active proposal. Historical checkpoints cannot be retroactively reconstructed for an already-active proposal.

## Gas and funding preflight

Read-only snapshot:

| Chain | Block | Pending nonce | Gas price | Owner native balance |
|---|---:|---:|---:|---:|
| Ethereum | 25,563,812 | 40 | 40,670,460 wei | 433,662,498,556,807 wei |
| Arbitrum | 485,350,522 | 191 | 20,000,000 wei | 276,365,728,837,726 wei |
| XDC | 105,087,088 | 19 | 13,500,000,000 wei | 50,383,926,152,756,555,326 wei |
| Optimism | 154,414,923 | 327 | 1,000,329 wei | 819,328,440,280,959 wei |

Implementation/standalone deployment estimates at that snapshot, excluding module-proxy deployments, upgrades, configuration, L1 data fees, safety multiplier, and callback reserve:

- Ethereum: 7,783,363 gas for the three implementations.
- Arbitrum: 33,070,402 gas for ten implementations/standalone bridge.
- XDC: 7,325,166 gas for Local bridge V2 and LOWJC V3 implementation.

The current Arbitrum balance is below even the simple implementation estimate at the snapshot gas price. Ethereum is too close to treat as funded after proxies, upgrades, configuration, and fee variance. XDC is comfortably funded. Re-estimate every transaction against the finalized candidate addresses, apply a deliberate safety multiplier, include Arbitrum/Ethereum data fees, and present the exact top-up transactions separately for approval. No automated funding is authorized.

## Rollback and recovery

- Implementations and new module/bridge deployments are inert until proxies or peers point to them.
- For each UUPS proxy, rollback is a new `upgradeToAndCall` to the recorded prior implementation, provided the successor has not written state incompatible with the predecessor. Storage compatibility has been checked, but business-state rollback must still be assessed after usage.
- Bridge rollback requires restoring every reciprocal peer and every core `setBridge` pointer to the recorded old bridge addresses. Keep old bridges deployed, verified, and authorized until the release has passed the observation window.
- Do not reopen writes during a half-cutover. A peer mismatch can strand LayerZero deliveries for retry/recovery.
- Applicant-milestone callbacks may be retryable if allowance/balance is insufficient. Do not treat a pending callback as a completed local start.
- Do not roll back across already-processed ordered stake-sync versions without a specific state reconciliation plan.
- Frontend XDC applicant-milestone UI remains disabled until the full callback path and pending/retry state are live-verified.

## Mandatory approval display

Before every state-changing transaction or clearly bounded batch, display and wait for explicit approval of:

1. chain and chain ID;
2. current block and pending nonce;
3. signer address and sufficient balance;
4. target or CREATE candidate;
5. function/constructor and decoded parameters;
6. expected state change;
7. native/token value;
8. estimated gas, fee components, safety multiplier, and maximum approved fee;
9. pre-state assertions and post-state verification;
10. exact rollback/recovery point.

Never place a raw private key in chat, commands, logs, commits, or shell history. Use the existing secure signer, encrypted keystore, hardware wallet, or a reviewed multisig workflow only after approval.

## Final pre-broadcast checklist

- [ ] `main` and `origin/main` match the approved release commit.
- [ ] Worktree contains no unreviewed release-scope change; unrelated `fundraising/` remains untouched.
- [ ] Canonical artifacts are rebuilt and every hash/size above matches.
- [ ] Full tests and focused live-fork rehearsals pass at fresh blocks.
- [ ] Pending nonces match this plan or all candidates/calldata have been regenerated.
- [ ] Every live proxy owner and implementation matches the recorded pre-state.
- [ ] No active DAO proposal exists.
- [ ] Voting migration account lists are refreshed and reviewed.
- [ ] LayerZero libraries/configs are re-read and the new-OApp configuration is byte-identical.
- [ ] In-flight cross-chain messages are drained or explicitly handled.
- [ ] Required signer gas top-ups are estimated and separately approved.
- [ ] Callback reserve amount is quoted and separately approved.
- [ ] Explorer verification arguments are prepared for every artifact.
- [ ] A short maintenance window and post-cutover observation window are agreed.
- [ ] The owner has explicitly approved the displayed deployment/configuration batch.

Until every applicable box is checked, the release is prepared but **not authorized to deploy**.
