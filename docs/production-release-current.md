# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 19 July 2026 |
| Git branch | `main` |
| Git commit | `42190192279fef0a6a6efd013ff74b26de6ef8f6` |
| GitHub CI | `29691602100` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-42190192279fef0a6a6efd013ff74b26de6ef8f6.zip` |
| Source archive SHA-256 | `e37d12f8311369d0f982c9a937aee0cc0d371b9d07a215cf1af6877532e0fd4f` |
| CodeBuild | `openwork-react-app-prod-build:341f6548-1bbd-41ac-ac9a-d0488b3e3f0e` — succeeded |
| ECR image | `openwork-app:prod-4219019-20260719145043` |
| ECR digest | `sha256:03871f13755ef9eaecce1747c8439cb6c452f4237aa77c0f1a31ed5a141c2b29` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `b0d403b8d4944b57a9b866f66bbd49fd` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-COP-yjtZ.js` |

## Verification

- GitHub CI, all frontend/backend tests, the focused six-case IPFS provider-order/read/health suite and the production image build passed for the exact source commit.
- App Runner HTTP health checks passed, the rollout operation succeeded and the service returned to `RUNNING`.
- The production root, health endpoint and completed `/job-details/30365-3` route returned HTTP 200.
- The deployed bundle contains Native bridge `0x9A0950594A699f5fb7decd7069F935100d39D9bF`, XDC Local bridge `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` and the two Arbitrum write adapters. It contains no occurrence of the retired Native bridge address.
- Production XDC job `30365-3` completed the real post, application, selection/start, USDC escrow, CCTP mint, work submission, release and CCTP payout flow. Its public page shows `1 / 1 Milestones Completed`, `0.10 USDC` paid and `0.10 USDC` received.
- The AWS-hosted IPFS node is now the first upload and read provider. A production upload returned CID `QmZDiKDQPb7SHas6ysYoogojJfeinVbpCR75LXPGQCU6CB`; application readback, two independent public gateways, recursive pin verification and post-restart readback all succeeded.

## IPFS infrastructure

Production uploads no longer depend on the unhealthy Lighthouse and Pinata accounts. The frugal AWS provider uses one `t4g.small`, an encrypted retained 30 GiB data volume, CloudFront TLS and four weekly incremental snapshots. Its verified fixed estimate is approximately `$18.95/month` before AWS credits, plus small usage-based transfer and snapshot charges. The complete record is `docs/ipfs-aws-production-2026-07-19.md`.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-f4b2818-20260719140650` |
| ECR digest | `sha256:49b9e3f021e8fb50b6e9c68735b66603fe852a376f471ada37c07972ee55562c` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
