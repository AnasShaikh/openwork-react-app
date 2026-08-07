# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 7 August 2026 18:36 IST |
| Git branch | `main` |
| Git commit | `96a9c0869577e56b51ff5fea5b0773b08ecbc772` |
| GitHub CI | frontend tests (`81/81`), backend tests (`37/37`) and mainnet frontend build passed |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-96a9c08.zip` |
| Source archive SHA-256 | `2333f6af5be8246fffd900d715ae61055fa741218e2bdccd3daa9582c2a5bbc0` |
| CodeBuild | `openwork-react-app-prod-build:4f209660-5385-4891-8cc0-24743a820b9e` — succeeded |
| ECR image | `openwork-app:prod-96a9c08-20260807182758` |
| ECR digest | `sha256:840f71ed3185518e43cfe5b0611323afb9fa2e6b266b0760755b6ff05daa6509` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `ce0ccdb893da462d8d32b7a249e5f858` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-BAQIx_6N.js` |
| Rollback target | `openwork-app:prod-3ce9916-20260807180255` |

## Compact audited contract documentation release

The production `/docs` page now opens with a compact four-chain network overview
instead of a long document stack. Its 31 active contract functions are grouped by
chain and function, and the page explicitly explains that those functions are backed
by 50 deployed addresses. Every tile opens a polished detail drawer containing the
live address, current implementation, explorer-source status, configuration evidence
and connected contracts. Function flows, Agent Oppy and status/change evidence remain
one click away without competing with the initial network view.

The transport strip uses bounded, separate two-way lanes for LayerZero messages and
Circle CCTP USDC, with distinct Arbitrum hub ports and no overlapping arrowheads. At
mobile widths it becomes a complete compact route list rather than a horizontally
panned fragment. It shows only the three active Arbitrum-hub message pathways and the
two active CCTP pathways.

The registry was re-audited against the current deployment ledgers and live readbacks
on 7 August 2026. It distinguishes runtime verification, explorer source publication
and configuration status rather than collapsing them into one ambiguous label. The
status view records direct Arbitrum production job `42161-24`, current NOWJC zero-fee
storage, LayerZero peer/security state, CCTP keeper configuration, disabled routes and
known evidence gaps. The public `/api/docs/contracts` projection exposes the same
status definitions, 31 per-contract configurations, live configuration, recent changes
and limitations consumed by the page.

Deployment and verification changed application and documentation code only. No
smart-contract deployment, upgrade, wallet transaction, token transfer or other
on-chain write was submitted.

## What this release fixes

Payment screens previously reported a healthy transaction as failed. Job `42161-23`
showed a release payment as "not mined within 80 blocks… might still be mined" when
the transaction did not exist at all — neither mined nor in the mempool — so nothing
had moved, but the user had no way to know that and retrying appeared to risk paying
twice.

- web3 counts its block timeout in blocks, and Arbitrum produces one every ~0.25s, so
  80 blocks was 20 seconds, with the countdown starting at `send()` before the wallet
  prompt was answered. The budget is now wall-clock and converted per chain: 2400
  blocks on Arbitrum against 50 on Ethereum.
- A timeout is no longer treated as an outcome. The failure path queries the chain and
  distinguishes already-succeeded, mined-but-reverted, still-pending and dropped,
  telling the user in each case whether funds moved and whether retrying is safe.
- Sending is now preceded by a check for unconfirmed transactions from the same
  wallet, since a queued nonce is the most likely way to reach the timeout at all.

Applied to both the release and lock-milestone paths.

Three follow-up corrections after review, all in this release:

- The first version of the timeout fix was **inert**. It tuned a `Web3` created in
  the page, but `getLOWJCContract` builds its own internally and returns a contract
  from that one, so the sending object kept the default. The tuning now happens
  inside `getLOWJCContract` and `getAthenaClientContract`, and a source-level test
  fails if either getter stops doing it.
- The buttons now follow the verdict. Previously the warning said "do NOT send it
  again" beside a live Release button, so the interface contradicted itself.
- Nothing diagnosed anything until `send()` settled, so a wallet retrying against
  an unreachable RPC left the user on a spinner for minutes. `verifyBroadcast` now
  runs as soon as a hash exists, in parallel with the send, and reports within 30
  seconds if the network never received the transaction.

Twenty-one tests cover this area, including the dropped, pending-then-dropped and
hash-without-broadcast cases observed on job 42161-23.

### Fee ceiling, now set in one place

Two opposite defects produced the same symptom, a transaction that never mines.

Release payment set no ceiling at all, so the wallet padded maxFeePerGas into the
low gwei range and reserved roughly a hundred times the real cost, then refused
the transaction for insufficient funds against a balance that could pay it many
times over.

Post job, apply to job and start job set `maxFeePerGas` to `eth_gasPrice`. On
Arbitrum `eth_gasPrice` equals `baseFeePerGas` exactly — both measured at
20000000 wei — so the ceiling sat on the base fee with no headroom, and any rise
between estimate and inclusion left the transaction unmineable until it dropped.

`buildEstimatedWriteSendOptions` now derives the ceiling from the chain's live
base fee with a 5x multiplier and a 0.01 gwei floor, sets no priority fee because
Arbitrum's sequencer orders by arrival, and applies it only when the caller
expressed no fee preference so deliberate legacy `gasPrice` on cross-chain paths
is untouched. Thirteen files and twenty-three call sites route through that
function, so they are fixed together rather than one page at a time. The
per-page fee fields were removed from the three audited paths, and a regression
test fails if any of them pins the ceiling to `eth_gasPrice` again.

### Public documentation rebuilt around a relationship diagram

`/docs` previously showed what exists — chain cards and a contract table — but not
what talks to what. It now leads with an interactive diagram: selecting one of
eleven flows dims the uninvolved contracts and draws the path between the rest,
coloured by transport, so the difference between a job that crosses a bridge, one
that runs both transports at once, and one that crosses nothing is visible rather
than described.

Nodes carry a contract id into `docs/mainnet-contracts.json`, so address, explorer
link and verification status come from the registry and cannot drift from
deployment. Verified on the deployed page: 11 flows, 28 nodes, 28 explorer links
with none malformed, and the release-payment flow drawing 4 wires of which 2 are
the CCTP legs.

It replaces `openwork-complete-architecture.html`, correcting three claims that
file carried: governance labelled "Main Chain (Base)" when it is Ethereum, XDC
omitted entirely, and no Arbitrum direct adapters. Arrows are measured from
rendered node positions rather than hardcoded on a fixed canvas, so the layout
reflows; below 720px the wires are hidden and uninvolved contracts are removed,
because curves computed for a wide layout do not survive a single-column reflow.

`lastAudited` moves to 4 August and the page now records the Arbitrum direct cycle
verified with job 42161-23, the permissionless bounty-incentivised nature of CCTP
relaying, and the XDC reward-cap correction.

### Page length halved

Measured at 1440x900 the documentation page ran to 11,634px, about thirteen
screens, of which the contract tables were 6,006px and the stacked architecture
zones a further 2,222px. Each chain registry now collapses, costing 782px closed,
and above 1100px the zones lay out as columns rather than stacking, taking the
diagram to 1,406px. Total is 5,595px, 6.2 screens, verified on the deployed page
with no horizontal overflow at either 1440px or 375px and no degenerate or
out-of-bounds arrows in either layout.

## Verification

- A user-authorized live follow-up on 7 August completed native-Arbitrum Direct
  Contract job `42161-24`: exact approval and escrow of `0.10 USDC`, followed by
  a same-chain `0.10 USDC` release to the selected applicant 23 seconds after
  contract start. ArbLOWJC and Genesis both report `Completed`; the local adapter
  reports `0` locked and `0.10 USDC` released, and the production page displays
  the definitive final-state notice with both payment buttons disabled. This was
  a user wallet test after deployment, not an automatic deployment write. The
  full evidence record is
  `contracts/references/deployments/arbitrum-direct-contract-job-42161-24-7-aug-2026.md`.
- The exact consolidated `main` source at `90ebc3a` passed `51/51` frontend tests, `37/37` backend tests, the backend dependency audit and parse checks, the frontend build and CodeBuild before the immutable image was deployed.
- App Runner's HTTP health gate passed, and read-only production checks returned HTTP 200 for `/`, `/health`, `/healthz`, `/docs`, `/documentation` and `/api/docs`. No wallet transaction or other on-chain write was submitted.
- The deployed backend startup log selected the masked Alchemy Arbitrum host (`arb-mainnet.g.alchemy.com/***`). The public `arb1.arbitrum.io` fallback did not engage, confirming that the production RPC secret reaches the newly deployed fallback-capable code.
- The release includes wallet-attributed IPFS upload metering, bounded relay waiters, in-page toast errors and the disk-headroom circuit breaker. Signature enforcement remains controlled by `IPFS_REQUIRE_SIGNATURE`; the node-side authenticated `repo/stat` route is live and preserved in the IPFS CloudFormation source.
- Frontend tests (`45/45`), backend tests (`21/21`), the mainnet frontend build, CodeBuild and the production image build passed for the exact source commit.
- MetaMask connection is now provider-authoritative after reload or disconnect, handles delayed extension injection, and renders rejected, pending and missing-extension errors in the page instead of leaving an inert wallet choice.
- Job metadata now retries the managed same-origin IPFS gateway before a public fallback, never settles on `Untitled Job`, and exposes a safe display-only retry. Production browser verification loaded job `42161-22` as `Arb Dev` without a metadata warning.
- Completed jobs no longer expose release-payment or dispute actions. Work submission is limited to an in-progress job and its selected applicant, and its LayerZero quote plus exact gas preflight use the configured chain RPC before the final user-signed MetaMask write.
- Switching Direct Contract between single and multiple milestones preserves the amount already entered instead of silently resetting compensation. Production browser verification passed `/connect-wallet`, `/direct-contract`, `/job-details/42161-22`, `/add-update/42161-22` and `/release-payment/42161-22`; every HTTP gate returned `200`.
- This release changed application code only. It sent no smart-contract transaction and changed no contract, wallet, token balance or on-chain state.
- CCTP receive execution now reconciles generic provider or duplicate-relay errors against Circle's destination `usedNonces(bytes32)` state. A consumed nonce is recorded as delivered instead of a false failure; an unused nonce is never presented as success.
- Release Payment and Start Job no longer expose protected operator retry endpoints in the browser or interpolate missing backend fields into `undefined` error messages. Job `30365-5` now renders its contract-recorded final state: `Completed`, `0.10 USDC` released, `0` locked, both payment buttons disabled and a definitive success notice.
- Production browser verification of `/release-payment/30365-5` found no console warnings or errors. The deployed bundle contains the final-state message and contains neither browser CCTP retry endpoint nor the obsolete retry-attempt text.
- The current relay status store remains process-local because production has no usable external database configured. On-chain destination-nonce reconciliation prevents false failures within a running process, while durable historical relay status across restarts still requires a real external database.
- This repair deployed application/backend code only. It sent no chain transaction and changed no smart contract, wallet, token balance or on-chain state.
- Post-deploy checks returned HTTP 200 for `/`, `/health`, `/healthz`, `/docs`, `/documentation` and every documentation API endpoint. Browser verification confirmed the production title and subtitle, registry summary, contract rows and client-side `/documentation` redirect on the deployed bundle.
- The public documentation route is now `/docs`; `/documentation` redirects to it and the former documentation explorer remains available at `/docs/legacy` with a legacy notice.
- The published registry documents 31 production roles represented by 50 deployed artifacts across Arbitrum, Optimism, Ethereum and XDC. It distinguishes role status from explorer source-verification status and links each deployment to its chain explorer.
- The documentation API exposes the canonical skill, references, contract registry and combined bundle through `/api/docs`, `/api/docs/skill`, `/api/docs/references`, `/api/docs/contracts` and `/api/docs/full`.
- The architecture overview now reflects the active Arbitrum and XDC bridge deployments, CCTP pathways, LayerZero peers, the direct-contract modules and the intentionally disabled or held routes without claiming unverified end-to-end evidence.
- This release changed the public application and repository documentation only. It performed no smart-contract deployment or upgrade and changed no wallet, token balance or on-chain state.
- Frontend tests (`36/36`), backend tests (`17/17`), the mainnet frontend build and the production image build passed for the exact source commit. The backend dependency lock continues to resolve the disclosed high-severity `brace-expansion` and `fast-uri` advisories with zero audit findings.
- App Runner HTTP health checks passed. The production root and `/healthz` returned HTTP 200, and browser smoke checks passed for `/direct-contract` and the durable `/direct-contract-status/:transactionHash` fallback.
- XDC Direct Contract creation now checks the connected wallet's native XDC USDC balance before uploading metadata or requesting approval, reports the exact required and available amounts, and reuses a sufficient existing allowance instead of charging for another approval. Counter reads, LayerZero quotes and exact gas estimation now use the configured browser-safe XDC HTTP RPC; only the final signed write is sent through MetaMask.
- The reported XDC attempt was reproduced read-only against live state. Wallet `0x7a2B...6384C` had approved `100,000` raw USDC units to LOWJC but held only `12,361`; an exact `eth_call` reverted with `ERC20: transfer amount exceeds balance`. Approval transaction `0x18fb958c5f5582fd7173c5de5af37f06c038edb6b11cf619bd7a9c3e5c6484b1` succeeded, but no Direct Contract transaction or outgoing USDC `Transfer` was present, so the intended `0.1 USDC` did not move.
- Live XDC reads confirmed chain ID `50`, LOWJC implementation `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D`, bridge `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951`, CCTP sender `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` and native XDC USDC `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`.
- The backend now treats the indexed `PaymentReleased(string)` topic as an opaque hash instead of a decoded job ID, ignores native Arbitrum releases that require no cross-chain relay, accepts genuinely decoded cross-chain IDs, deduplicates by transaction and only marks processing complete after success. A 5,000-block production startup scan completed without replaying the malformed topic hash into the CCTP flow.
- Native Arbitrum payment release now estimates the exact routed call through the configured Arbitrum HTTP RPC instead of the injected wallet provider. MetaMask receives only the signed write request and manages its own fee fields, avoiding the pre-confirmation `Internal JSON-RPC error` observed on job `42161-22`.
- The Release Payment page now rejects a connected account that is not the recorded job giver before requesting any wallet transaction. Nested wallet/RPC errors are surfaced when providers return useful underlying details.
- The exact production payment path was rehearsed on an Arbitrum fork at live state: `releasePayment("42161-22")` used `356,211` gas, moved exactly `100,000` raw USDC units from NOWJC to `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724`, cleared the locked balance and completed the job. The fork was stopped and mainnet was read back unchanged afterward.
- The production Arbitrum RPC secret was rotated from the exhausted Alchemy endpoint to `https://arb1.arbitrum.io/rpc`, the canonical public Arbitrum endpoint already used by the frontend build. App Runner was recycled so its backend event listener and service-wallet health checks load the replacement endpoint.
- The refreshed health check exposed that relay wallet `0x93514040f43aB16D52faAe7A3f380c4089D844F9` has `0 ETH` on Arbitrum. Automatic relay transactions that require this signer remain blocked until a separately authorized gas-funding transaction is completed; no funds were moved during this release.
- Direct Contract now scopes placeholder styling to actual placeholders, makes the displayed milestone amount directly editable, renders progress states in orange instead of error red, prevents duplicate submission once a receipt is confirmed, and persists a transaction-hash progress route that can be revisited safely.
- The wallet-provider `deceptive request` warning is not emitted by OpenWork application code and is unchanged in this application release; it requires separate wallet/security-provider reputation remediation.
- No smart contract, wallet, token balance or on-chain state changed during this application release or its verification.
- The live ledger decodes `30365-*` job IDs as XDC Network and now loads `/xdc-chain.svg`, while USDC budget amounts continue to use the separate `/xdc.svg` token icon. The deployed XDC asset SHA-256 exactly matched the reviewed source asset.
- The ledger still preserves Genesis creation order and reverses it so newest jobs render first. During IPFS enrichment it now shows `Loading job details…` instead of temporarily presenting a raw job ID as the title.
- After a Post Job wallet confirmation produces a transaction hash, the form dismisses its loading overlay and smoothly reveals the transaction and cross-chain status region at the bottom of the form.
- The deployed bundle contains the browser-compatible XDC RPC `https://rpc.xinfin.network` and no occurrence of the CORS-incompatible `https://erpc.xinfin.network` default.
- A browser-origin preflight and JSON-RPC `eth_chainId` request to the replacement RPC returned CORS headers and chain ID `50`; live LOWJC reads and an exact `quoteNativeChain` call also succeeded through it.
- The Post Job page now derives Type-3 LayerZero options from `DESTINATION_GAS_ESTIMATES.POST_JOB` (`800,000` destination gas), matching the validated production transaction path instead of reusing the stale `500,000` static chain option.
- Production XDC job `30365-3` completed the real post, application, selection/start, USDC escrow, CCTP mint, work submission, release and CCTP payout flow. Its public page shows `1 / 1 Milestones Completed`, `0.10 USDC` paid and `0.10 USDC` received.
- The AWS-hosted IPFS provider remained healthy after deployment. A post-deploy production upload returned CID `QmTr7iGdvFAt3RQy7QnMEe3TxMY8o579N8fvRDmWDVSfoW` with HTTP 200.

## Public production documentation release

Commit `8f98a50535468208ab5a6ad86ac8e78d74c5b183` replaces the stale public documentation landing route with a production-focused reference for OpenWork's architecture, deployed contracts, cross-chain pathways and verification state. The page is responsive at laptop and mobile widths, uses compact copyable addresses, and keeps historical or incomplete verification claims visibly separate from active deployment status.

The release registry is derived from the contract repository's canonical live registry and deployment ledgers. Its audit date is 1 August 2026. Source verification is confirmed for 31 artifacts and remains pending for 19 artifacts; pending explorer publication is not presented as a deployment failure. Optimism and Ethereum pathway proof remains explicitly incomplete, and LocalAthena V2 remains held rather than live.

## XDC browser quote correction

The previous production bundle failed before opening MetaMask when Post Job constructed a read-only Web3 client for `https://erpc.xinfin.network`. The endpoint served XDC RPC responses but omitted `Access-Control-Allow-Origin`, so Brave blocked its preflight request and the UI displayed `Failed to fetch`. The same browser flow also selected the chain's stale static `500,000`-gas option instead of the operation-specific `800,000` post-job estimate.

Commit `7bbe46529cadaaa25f65faa282d54b602b7c6884` corrects both defects. It changes the release build argument and fallback to the official, CORS-compatible `https://rpc.xinfin.network` endpoint and makes the Post Job page call `buildLzOptions(DESTINATION_GAS_ESTIMATES.POST_JOB)`. No contract, wallet, token balance or on-chain state changed during this repair or deployment.

## Job ledger experience correction

Commit `835098412e76ec580c91092969e123934f38d399` separates the XDC Network chain mark from the USDC payment-token icon, removes the confusing raw-ID metadata-loading flash and reveals the Post Job transaction status immediately after wallet confirmation. The XDC mark comes from the official XDC Foundation brand asset package and remains distinct from all budget icons. This was an application-only release: no smart contract, wallet, token balance or on-chain state changed.

## Direct Contract transaction experience correction

Commit `7f9c01deba2624fd308c3436b3fdc44d8e318791` implements the four application-owned experience corrections reported on 31 July 2026. Commit `8f1b2503da38f288fd92453c649bf86ee1ca8eec` refreshes only the backend dependency lock so the same source release passes the production audit gate. Receipt-confirmed transactions now leave the submission form and continue on a durable status route; retrying the wallet transaction is no longer the recovery path.

## Native Arbitrum payment release preflight correction

Commit `ffa05619c3771121acbc04881bc2aaf4d0d3b9bf` fixes the production Release Payment path after MetaMask returned a generic `Internal JSON-RPC error` before opening its confirmation screen. Native Arbitrum gas estimation now uses the configured browser-safe RPC and omits application-specified fee fields, while the actual write remains entirely user-signed through the connected wallet. The change is application-only; it performs no automatic wallet, token or contract write.

## PaymentReleased recovery correction

Commit `6426381b58f199511eff9a9d3919885507525574` prevents the backend listener from interpreting the indexed hash of a dynamic `string` event field as a literal OpenWork job ID. Native Arbitrum payments remain final on Arbitrum and are not queued for CCTP; decoded cross-chain IDs still enter the relay path. The correction is covered by four focused classifier tests and the existing backend suite. Deployment and startup recovery performed no wallet, token or contract write.

## XDC Direct Contract preflight correction

Commit `9b2c112a0578de3aaf146dae80d48a4fefbdb04b` corrects the production XDC Direct Contract path after MetaMask surfaced a generic `Internal JSON-RPC error` for an on-chain insufficient-USDC revert. The application now fails early with the exact balance shortfall, skips redundant approval when allowance is already sufficient and performs all read-only preflight through the configured XDC RPC. The deployment itself performed no wallet, token or smart-contract write.

## CCTP destination-delivery reconciliation

Commits `7655f91702345832ffb515b94b6e7ac150dccce3`, `b48281fd4c679f8babc5b62a3d80015e288d7d13` and `fec743f07cbc56659bb623830208fed82d38929d` correct the misleading failed/incomplete state observed after XDC job `30365-5` paid its applicant successfully. The backend now treats the destination Circle MessageTransmitter nonce as the delivery authority, including before a service-wallet write and after a generic provider error. The user-facing pages no longer call protected operator-retry routes, and a contract-completed job is rendered as final with no further payment action available.

The verified release path burned `0.1 USDC` on Arbitrum in transaction `0x45985996d8bbd0ad39d36db06a4238cb3b6d8b636498f1e8b460d34a74f34f17`; XDC transaction `0x28ce7065d9190d3a016126a31676cb6207cf65a4ad5de8fa4187f9f6ff1a9518` consumed the Circle message and delivered `99,986` raw USDC units to applicant `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` after the 14-unit protocol fee. This release only corrected application interpretation and UI state; it did not replay or alter those transactions.

## IPFS infrastructure

Production uploads no longer depend on the unhealthy Lighthouse and Pinata accounts. The frugal AWS provider uses one `t4g.small`, an encrypted retained 30 GiB data volume, CloudFront TLS and four weekly incremental snapshots. Its verified fixed estimate is approximately `$18.95/month` before AWS credits, plus small usage-based transfer and snapshot charges. The complete record is `docs/ipfs-aws-production-2026-07-19.md`.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-3ce9916-20260807180255` |
| ECR digest | `sha256:a6d3649d63cfab399e795ae5aca04dc47d5fea5c9aa04d4ffaefb2db3715990c` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
