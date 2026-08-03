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
| NativeBridge | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |
| ProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` |
| ProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` |
| OracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` |
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |

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
- at least one IPFS strategy: `PINATA_JWT` or `IPFS_API_URL` + `IPFS_PROXY_SECRET`
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
| Weekly IPFS snapshots failing since 19 July | Fixed and deployed — policy `ENABLED`, validation snapshot completed |
| Production running pre-fix code | Deployed — `prod-90ebc3a-20260802234539` |
| `HEALTH_SECRET` / `OPS_API_TOKEN` unset | Configured |
| Landing site has two deploy sources | Repointed to `landing/` via `.github/workflows/landing.yml` |

The landing site now serves JS and CSS pre-compressed. CloudFront's automatic
compression is enabled on distribution `E1ANKLS7O4YGAE` but demonstrably does not
run — a verified cache miss with `Accept-Encoding: gzip` returned the full
313,600-byte bundle with no `Content-Encoding`, and CSS and HTML behaved
identically, so it is not content-type specific. Nothing in the readable
configuration explains it. `.github/workflows/landing.yml` therefore uploads
gzipped bytes under the plain keys with `Content-Encoding: gzip` rather than
depending on edge behaviour. JS and CSS went from 442 KB to 115 KB on the wire,
verified in a browser with no console errors. If someone later diagnoses the
CloudFront behaviour, that workflow step can be simplified.

Verified independently on 3 August 2026: App Runner runs
`prod-90ebc3a-20260802234539` and that commit contains the RPC fallbacks; DLM
policy `policy-032c9d33e1f0e9598` is `ENABLED` with a completed snapshot;
`HEALTH_SECRET` and `OPS_API_TOKEN` are present; `LIGHTHOUSE_API_KEY` is gone and
`PINATA_JWT` retained; `POST /api/v0/repo/stat` returns 401 rather than 404.

**The IPFS disk circuit breaker is now active.** `repo/stat` is proxied, so it
reads real usage and refuses uploads above 85% of the cap. It was inert until
that change.

**Signature enforcement is still off.** `IPFS_REQUIRE_SIGNATURE` and
`RELAY_REQUIRE_SIGNATURE` both default to false. Signatures are verified and
metered when present, but an unsigned request still succeeds, so uploads and
relay calls remain effectively anonymous. This is the last protection that is
built but not switched on. Do not describe uploads as authenticated until then.

To turn them on safely, first confirm real traffic is signing. The backend logs
`Wallet signature rejected (not enforced)` when a signature is present but
invalid, and sets no wallet address when none is sent, so:

```
aws logs filter-log-events --region us-east-1 \
  --log-group-name /aws/apprunner/openwork-react-app-prod/94e9a6cf2c054eac98cb4eb0a68445e6/application \
  --filter-pattern '"Wallet signature rejected"'
```

An empty result over a period with real uploads means signing is working and the
flags can be set to `true`. Any hits mean a client is sending malformed
signatures, and enforcing would break that path.

## Remaining before launch

1. **Fund the relay wallet `0x93514040f43aB16D52faAe7A3f380c4089D844F9`.** Optimism
   is nearly dry after 58 transactions and XDC has never transacted. If it stalls
   mid-flow, a user's funds have already moved on-chain and the job does not
   complete.
2. **Fund the CCTP transceivers** to restore third-party relaying, which worked
   for months and stopped silently when they emptied. On XDC, raise
   `maxRewardAmount` first: the cap is `1e15` wei, which on XDC is 0.001 XDC while
   a relay costs about 0.00297 XDC, so the bounty pays less than the keeper's own
   gas and no one will take it.
3. **Turn on signature enforcement** once the log check above is clean.
4. **Commission is 0 on-chain.** A deliberate business decision, not a defect, but
   the revenue mechanism is deployed and disabled — decide before anyone audits it.
5. **Commission an external Solidity audit.** Access control, CCTP replay
   protection and the cross-chain payment guards were spot-checked and are sound,
   but dispute settlement maths and milestone accounting were not reviewed in
   depth, and NOWJC has no reentrancy guards at all.

Two items were examined and deliberately not changed: the remaining React Router
advisories are SSR-specific and this is a client-only SPA with no non-major fix
available, and the nine duplicate filenames across `references/` and
`contracts/references/` are byte-identical but the root copies are the ones that
resolve from the repository root, so deleting them would break working links to
tidy a cosmetic one.

## Open items carried over from the 3 August 2026 consolidation

These are known, deliberate loose ends. They are recorded here so nobody has to
rediscover them. Full background: [docs/repository-consolidation-2026-08-03.md](docs/repository-consolidation-2026-08-03.md).

Resolved on 3 August 2026: item 1, the landing deployment source. The production
landing site is now built from `landing/` in this repository and published by
`.github/workflows/landing.yml`. The first build was byte-identical to the prior
production artefacts. The former `krishnaprasath-k/openwork-landing` repository is
no longer a deploy source; archiving it remains an owner-admin housekeeping action
because the current GitHub credential has read-only access there.

| # | Item | Risk if ignored | Owner action |
|---|---|---|---|
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
| `krishnaprasath-k/openwork-landing` | Merged into `landing/` and retired as the deploy source on 3 August 2026. It should be archived by an owner; the current operator credential has read-only access. |

## External items that still require verification or operator action

- Confirm the production environment contains the correct CORS origin list. The operator and health tokens were added and verified on 3 August 2026.
- Confirm an IPFS upload provider is funded and active; an expired credential was removed from this repository.
- Run a controlled end-to-end job cycle after IPFS is available: post, apply, accept, submit work, release payment.
- Contract source fixes do not affect deployed proxies until separately reviewed, deployed, and upgraded through the authorized release process.

## Deployment discipline

1. Start from a clean, up-to-date `main`.
2. Require a green CI run.
3. Record the deployed commit and immutable image digest/tag.
4. Do not enable mainnet smoke routes as a substitute for a controlled release test.
5. Never perform a proxy upgrade solely because source code changed in GitHub.
