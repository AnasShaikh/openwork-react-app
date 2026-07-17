# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 18 July 2026 |
| Git branch | `main` |
| Git commit | `4961c45fee1983fe0807407d7f2e47957215072e` |
| GitHub CI | `29616077948` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-4961c45fee1983fe0807407d7f2e47957215072e.zip` |
| CodeBuild | `openwork-react-app-prod-build:3b8b7a57-6863-4743-913d-cff66738bec5` — succeeded |
| ECR image | `openwork-app:prod-4961c45-20260717225439` |
| ECR digest | `sha256:bba58369a4575ba89fef23def4dcb8207e2c894c9bebfbdb3c62905d67d0e800` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `476f3549e58e481bbee25572ab55f41e` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-BvSTUKGp.js` |

## Verification

- App Runner HTTP health check passed and the service returned to `RUNNING`.
- The production root and health dashboard returned HTTP 200.
- Browse Jobs rendered live XDC jobs `30365-2` and `30365-1` and Arbitrum jobs `42161-21` onward.
- The XDC job detail route `/job-details/30365-2` rendered the correct `0.50 USDC` remaining amount.
- Read-only browser verification produced no console errors, no `getProfile is not a function` warnings, and no malformed-IPFS retry warnings.
- No wallet was connected and no blockchain transaction was submitted during verification.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-acb676f-20260717134701` |
| ECR digest | `sha256:e64ac2f95eb02da50849b6ddb7de06d3673124e0f5a9349c732bc616150afef7` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
