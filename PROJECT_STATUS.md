# OpenWork — Project Status and Source of Truth

_Last code audit update: 2026-07-18_

## Canonical source

| Item | Canonical value |
|---|---|
| Repository | `https://github.com/AnasShaikh/openwork-react-app` |
| Release branch | `main` |
| Application source | `src/`, `backend/` |
| Contract source | `contracts/` |
| Live contract registry | `contracts/references/logs/imp/live-contract-registry-19-mar-2026.md` |
| App URL | `https://app.openwork.technology` |
| Backend | `https://app.openwork.technology` |

Production had previously moved ahead of the default branch. That history is now consolidated on `main`. Do not deploy an unmerged branch or an untagged local commit.

The contracts were a separate `openwork-contracts-final` repository until 3 August 2026, when they were merged into `contracts/` with full history. That repository is retired: it is a historical archive, not a source of truth, and it must not receive new commits. Links to it in dated records below are preserved deliberately because they describe what was true when those records were written.

## Current chain roles

| Chain | Chain ID | Product role | Writes |
|---|---:|---|---|
| Arbitrum One | 42161 | Native data hub and local job chain | Direct native adapters |
| Optimism | 10 | Local job chain | LayerZero/CCTP adapter |
| XDC | 50 | Local job chain | LayerZero/CCTP adapter |
| Ethereum | 1 | Governance/main chain | Governance only |

### Arbitrum One contracts

| Contract | Address |
|---|---|
| Genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| NOWJC | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| ArbLOWJC frontend adapter | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| ArbAthenaClient frontend adapter | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` |
| NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` |
| NativeDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` |
| NativeRewards | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` |
| NativeBridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| ProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` |
| ProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` |
| OracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` |
| USDC | `0xaf88d065e77c8c2239327c5edb3a432268e5831` |

The two frontend adapter addresses are required for Arbitrum writes. NOWJC and NativeAthena expose different function signatures and must not be substituted for them.

### Other active contracts

| Chain | Contract | Address |
|---|---|---|
| Optimism | LOWJC | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` |
| Optimism | AthenaClient | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |
| Optimism | LocalBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| XDC | LOWJC | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| XDC | AthenaClient | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |
| XDC | LocalBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| Ethereum | OWORK | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |
| Ethereum | MainDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |

## Release safeguards now on `main`

- Arbitrum writes route through native-specific ABIs and no-LayerZero selectors.
- Contract writes estimate gas for the exact call and add a safety buffer.
- Legacy reads use the active native-chain configuration rather than mixing a mainnet address with an Arbitrum Sepolia RPC.
- Mainnet smoke routes are disabled by default and require an operator token when enabled.
- Admin authentication has no built-in credentials or JWT secret.
- Health/operator endpoints fail closed; CORS, request bodies, relay calls, and IPFS uploads are bounded.
- Frontend and backend tests/builds run in GitHub Actions on every push to `main` and on pull requests.

## Required production secrets

All secrets belong in the deployment platform, never in `VITE_*` variables or committed files.

- `WALL2_PRIVATE_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`
- `OPS_API_TOKEN`, `HEALTH_SECRET`
- at least one IPFS strategy: `LIGHTHOUSE_API_KEY`, `PINATA_JWT`, or `IPFS_API_URL` + `IPFS_PROXY_SECRET`
- database credentials
- optional AI provider credentials

`ENABLE_MAINNET_TEST_ROUTES` must remain `false` in normal production operation.

## Launch readiness — 3 August 2026

Application-code findings from the launch-readiness audit are closed. What
remains needs AWS access and is tracked in
[docs/DEV_AGENT_TASKS_2026-08-03.md](docs/DEV_AGENT_TASKS_2026-08-03.md).

| Finding | State |
|---|---|
| Escrow rendered `0` when the balance read failed | Fixed — renders `—`, failure logged |
| No React error boundary; any throw blanked the app | Fixed |
| `alert()` used for 40 user-facing messages | Fixed — in-page toasts |
| Anonymous, unmetered IPFS uploads | Fixed — wallet signature, per-address quota, disk breaker |
| Unbounded concurrent relay watchers | Fixed — ceiling on in-flight flows |
| Anonymous relay calls | Fixed — same signature, off by default pending rollout |
| `localhost` allow-listed in production CORS | Fixed |
| Bridge role mismatches in `backend/config.js` | Fixed |
| Two high dependency advisories | Fixed; production bundle hash unchanged |
| Lighthouse live as a silent upload fallback | Removed |
| Weekly IPFS snapshots failing since 19 July | Template fixed; **needs a stack deploy** |
| Production running pre-fix code | **Needs a build and deploy** |
| `HEALTH_SECRET` / `OPS_API_TOKEN` unset | **Needs configuring** |
| Landing site has two deploy sources | **Needs the pipeline repointed** |

Two protections are deployed but inert until acted on, and should not be
described as active:

- **IPFS and relay signature enforcement** are behind `IPFS_REQUIRE_SIGNATURE`
  and `RELAY_REQUIRE_SIGNATURE`, both defaulting to false. Signatures are
  verified and metered when present, but an unsigned request still succeeds.
  Turn them on after confirming signing works in production.
- **The IPFS disk circuit breaker** reads Kubo's `/api/v0/repo/stat`, which the
  node's nginx does not proxy. It logs `IPFS disk headroom unknown` and allows
  the upload until that path is exposed.

Two items were examined and deliberately not changed: the remaining React Router
advisories are SSR-specific and this is a client-only SPA with no non-major fix
available, and the nine duplicate filenames across `references/` and
`contracts/references/` are byte-identical but the root copies are the ones that
resolve from the repository root, so deleting them would break working links to
tidy a cosmetic one.

## Open items carried over from the 3 August 2026 consolidation

These are known, deliberate loose ends. They are recorded here so nobody has to
rediscover them. Full background: [docs/repository-consolidation-2026-08-03.md](docs/repository-consolidation-2026-08-03.md).

| # | Item | Risk if ignored | Owner action |
|---|---|---|---|
| 1 | **The landing deploy still builds from `krishnaprasath-k/openwork-landing`, not from `landing/` here.** It publishes to S3 `openwork-technology-landing-prod-256309399568` behind CloudFront `E1ANKLS7O4YGAE`. | Two live copies of the marketing site. Edits made here never reach production, and edits made there silently diverge from this repository. This is worse than before the merge, when there was one source. | Repoint the pipeline at `landing/`, or archive the original repository. Until then, treat the original as canonical for the landing site. |
| 2 | **The Alchemy key rotation may be incomplete on App Runner.** The previous key leaked publicly and is revoked; it now returns HTTP 401. | Backend RPC for Ethereum, Optimism and Arbitrum fails against the dead key. | Update `ETHEREUM_MAINNET_RPC_URL`, `OPTIMISM_MAINNET_RPC_URL` and `ARBITRUM_MAINNET_RPC_URL` on the `openwork-react-app-prod` service. |
| 3 | **`OPTIMISM_MAINNET_RPC_URL` was defined twice in `backend/.env`**, and dotenv used the second definition, which held a different already-dead key. Fixed locally on 3 August. | Optimism RPC was silently broken and would stay broken after a key rotation, because the rotation replaces only the leaked value. | Confirm the App Runner service defines each RPC variable exactly once and that Optimism uses the same key as Ethereum and Arbitrum. |
| 4 | **This repository is public and its history contains the revoked Alchemy and Infura credentials.** Redaction removed them from the working tree only. | Anyone reading history finds them. They are revoked, so exposure is historical rather than active. | No action if both remain revoked. Never restore either value. |
| 5 | `backend/config.js` still carries stale mainnet addresses for `NATIVE_BRIDGE` and `LOCAL_BRIDGE_XDC`. Neither key is read at runtime. | A future reader may treat them as live. | Reconcile against the live registry and delete or correct them. |
| 6 | Root `references/` and `contracts/references/` share nine duplicate filenames. | Ambiguity about which copy is authoritative. | Collapse to one copy. |
| 7 | Nothing enforces agreement between the live registry, `src/config/chainConfig.js`, `docs/mainnet-contracts.json` and `backend/config.js`. | The drift that motivated the merge can recur. | Add a CI check comparing all four. |

## Accepted risk: privileged control is a single externally-owned account

This is a deliberate transitional decision, recorded so that a reviewer finds a
stated position rather than an apparent oversight.

Verified on Arbitrum at block `490463122`:

| Check | Result |
|---|---|
| `NOWJC.owner()` (`0x8EfbF240…`) | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| `Genesis.owner()` (`0xE8f7963f…`) | same address |
| `cast code` on that address | `0x` — externally-owned account, not a multisig |

That single key can transfer any USDC held by NOWJC through
[`emergencyWithdrawUSDC`](contracts/src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol:466)
with no timelock, and can replace the implementation through
[`_authorizeUpgrade`](contracts/src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol:312),
which also accepts the bridge as a second upgrade path.

Do not describe the protocol as having multisig or timelock protection. It does
not. The accurate statement is that privileged control is currently a single key,
accepted while balances are small, with multisig ownership planned. Attach the
target date here when it is agreed.

| Repository | Status |
|---|---|
| `AnasShaikh/openwork-contracts-final` | Absorbed into `contracts/` on 3 August 2026. Historical archive only. A local checkout may still exist at `/Users/anas/openwork-manual`; it is not current. |
| `krishnaprasath-k/openwork-landing-page` | Older variant of the marketing site, last touched November 2025, deployed nowhere. Deliberately not merged. |
| `krishnaprasath-k/openwork-landing` | Merged into `landing/`, but **still the live deploy source** until item 1 above is resolved. Not yet safe to archive. |

## External items that still require verification or operator action

- Confirm the production environment contains the new operator/health tokens and the correct CORS origin list before deploying the backend hardening commit.
- Confirm an IPFS upload provider is funded and active; an expired credential was removed from this repository.
- Run a controlled end-to-end job cycle after IPFS is available: post, apply, accept, submit work, release payment.
- Contract source fixes do not affect deployed proxies until separately reviewed, deployed, and upgraded through the authorized release process.

## Deployment discipline

1. Start from a clean, up-to-date `main`.
2. Require a green CI run.
3. Record the deployed commit and immutable image digest/tag.
4. Do not enable mainnet smoke routes as a substitute for a controlled release test.
5. Never perform a proxy upgrade solely because source code changed in GitHub.
