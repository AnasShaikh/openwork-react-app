# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 1 August 2026 UTC (1 August IST) |
| Git branch | `main` |
| Git commit | `9b2c112a0578de3aaf146dae80d48a4fefbdb04b` |
| GitHub CI | No workflow run is configured for this branch; local frontend/backend gates and CodeBuild passed |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-9b2c112a0578de3aaf146dae80d48a4fefbdb04b.zip` |
| Source archive SHA-256 | `8aeb9407f3c87bc7f62a5818aa6540712e5cfe43e6c889827c702702a98d42e8` |
| CodeBuild | `openwork-react-app-prod-build:935cf2c9-2d9c-40d4-ab98-f44ec8961716` — succeeded |
| ECR image | `openwork-app:prod-9b2c112-20260801174632` |
| ECR digest | `sha256:4721fa2d466510d373b13b8ab9509d1adcbb6c044414a81586a500c399fd987b` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `9f173e90c86f4a5684a40f766934efe2` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-NQdqMeIj.js` |

## Verification

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

## IPFS infrastructure

Production uploads no longer depend on the unhealthy Lighthouse and Pinata accounts. The frugal AWS provider uses one `t4g.small`, an encrypted retained 30 GiB data volume, CloudFront TLS and four weekly incremental snapshots. Its verified fixed estimate is approximately `$18.95/month` before AWS credits, plus small usage-based transfer and snapshot charges. The complete record is `docs/ipfs-aws-production-2026-07-19.md`.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-6426381-20260801160952` |
| ECR digest | `sha256:a0d2f88c41fb970aad3e83f3c7630dd3983a358e13abbce1bde1df4cb33c0d74` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
