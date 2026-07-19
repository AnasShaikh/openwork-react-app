# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 19 July 2026 |
| Git branch | `main` |
| Git commit | `f4b2818782006ae93cacbe71aa82e004dcdc6a95` |
| GitHub CI | `29690117952` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-f4b2818782006ae93cacbe71aa82e004dcdc6a95.zip` |
| Source archive SHA-256 | `7610880e0d795f10036bb691a686c907040e776390b75066091f54095ee6c441` |
| CodeBuild | `openwork-react-app-prod-build:830ab20f-d934-41c1-a3a2-b2fdca8a8abc` — succeeded |
| ECR image | `openwork-app:prod-f4b2818-20260719140650` |
| ECR digest | `sha256:49b9e3f021e8fb50b6e9c68735b66603fe852a376f471ada37c07972ee55562c` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `68a40dcb850d48f9b808c1d9cc492ea1` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-COP-yjtZ.js` |

## Verification

- GitHub CI, all frontend/backend tests, the focused three-case IPFS provider-failover suite and the production image build passed for the exact source commit.
- App Runner HTTP health checks passed, the rollout operation succeeded and the service returned to `RUNNING`.
- The production root, health endpoint and completed `/job-details/30365-3` route returned HTTP 200.
- The deployed bundle contains Native bridge `0x9A0950594A699f5fb7decd7069F935100d39D9bF`, XDC Local bridge `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` and the two Arbitrum write adapters. It contains no occurrence of the retired Native bridge address.
- Production XDC job `30365-3` completed the real post, application, selection/start, USDC escrow, CCTP mint, work submission, release and CCTP payout flow. Its public page shows `1 / 1 Milestones Completed`, `0.10 USDC` paid and `0.10 USDC` received.
- The deployed IPFS route now catches a provider error and tries the next configured provider. A production probe proved Lighthouse was attempted before Pinata and that both failures were included in the final response.

## Active operational limitation

IPFS uploads still return HTTP 500 because neither configured account is currently usable: Lighthouse rejects its credential and Pinata reports that the account is blocked at its plan-usage limit. The failover code is working; restoring uploads now requires replacing the Lighthouse key, adding Pinata capacity, or configuring the supported self-hosted IPFS proxy. Existing IPFS reads and the completed job page remain healthy.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-43956d7-20260719054533` |
| ECR digest | `sha256:91eaae9d8855c7f69864a87b966e51376869c4d4545633d9ec6e92c97249b16f` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
