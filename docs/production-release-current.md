# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 19 July 2026 UTC (20 July IST) |
| Git branch | `main` |
| Git commit | `7bbe46529cadaaa25f65faa282d54b602b7c6884` |
| GitHub CI | `29698873510` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-7bbe46529cadaaa25f65faa282d54b602b7c6884.zip` |
| Source archive SHA-256 | `35fd008b12e40fe5ecb05c5d5db954eeaf0ed8c3a1c8bb65c28920abb5eea1bf` |
| CodeBuild | `openwork-react-app-prod-build:7fdb851d-42e4-4581-9aca-092e054e57a5` — succeeded |
| ECR image | `openwork-app:prod-7bbe465-20260719183509` |
| ECR digest | `sha256:011f55b0408312e39522a81f95f493396b857d21096a2cd138d984c80f9a408d` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `43d4eb4d3f1a4e2dba7cb8d55efedbd1` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-BgkS1Tx2.js` |

## Verification

- GitHub CI, all 25 frontend reliability/configuration tests, backend checks and the production image build passed for the exact source commit.
- App Runner HTTP health checks passed, the rollout operation succeeded and the service returned to `RUNNING`.
- The production root, `/health` and `/post-job` returned HTTP 200.
- The deployed bundle contains the browser-compatible XDC RPC `https://rpc.xinfin.network` and no occurrence of the CORS-incompatible `https://erpc.xinfin.network` default.
- A browser-origin preflight and JSON-RPC `eth_chainId` request to the replacement RPC returned CORS headers and chain ID `50`; live LOWJC reads and an exact `quoteNativeChain` call also succeeded through it.
- The Post Job page now derives Type-3 LayerZero options from `DESTINATION_GAS_ESTIMATES.POST_JOB` (`800,000` destination gas), matching the validated production transaction path instead of reusing the stale `500,000` static chain option.
- Production XDC job `30365-3` completed the real post, application, selection/start, USDC escrow, CCTP mint, work submission, release and CCTP payout flow. Its public page shows `1 / 1 Milestones Completed`, `0.10 USDC` paid and `0.10 USDC` received.
- The AWS-hosted IPFS provider remained healthy after deployment. A post-deploy production upload returned CID `QmTr7iGdvFAt3RQy7QnMEe3TxMY8o579N8fvRDmWDVSfoW` with HTTP 200.

## XDC browser quote correction

The previous production bundle failed before opening MetaMask when Post Job constructed a read-only Web3 client for `https://erpc.xinfin.network`. The endpoint served XDC RPC responses but omitted `Access-Control-Allow-Origin`, so Brave blocked its preflight request and the UI displayed `Failed to fetch`. The same browser flow also selected the chain's stale static `500,000`-gas option instead of the operation-specific `800,000` post-job estimate.

Commit `7bbe46529cadaaa25f65faa282d54b602b7c6884` corrects both defects. It changes the release build argument and fallback to the official, CORS-compatible `https://rpc.xinfin.network` endpoint and makes the Post Job page call `buildLzOptions(DESTINATION_GAS_ESTIMATES.POST_JOB)`. No contract, wallet, token balance or on-chain state changed during this repair or deployment.

## IPFS infrastructure

Production uploads no longer depend on the unhealthy Lighthouse and Pinata accounts. The frugal AWS provider uses one `t4g.small`, an encrypted retained 30 GiB data volume, CloudFront TLS and four weekly incremental snapshots. Its verified fixed estimate is approximately `$18.95/month` before AWS credits, plus small usage-based transfer and snapshot charges. The complete record is `docs/ipfs-aws-production-2026-07-19.md`.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-4219019-20260719145043` |
| ECR digest | `sha256:03871f13755ef9eaecce1747c8439cb6c452f4237aa77c0f1a31ed5a141c2b29` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
