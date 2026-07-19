# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 19 July 2026 |
| Git branch | `main` |
| Git commit | `43956d7223813c279c21cec19fbb781f3a09d2f9` |
| GitHub CI | `29675227881` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-43956d7223813c279c21cec19fbb781f3a09d2f9.zip` |
| Source archive SHA-256 | `0009b1531be3d3d416120f9548487ce3300f592a757638c285b600678d8fce1b` |
| CodeBuild | `openwork-react-app-prod-build:9795a0c0-4945-46f9-ba14-3a33fc422657` — succeeded |
| ECR image | `openwork-app:prod-43956d7-20260719054533` |
| ECR digest | `sha256:91eaae9d8855c7f69864a87b966e51376869c4d4545633d9ec6e92c97249b16f` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `6277e917d1364298be84c5d978ef7ad9` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-COP-yjtZ.js` |

## Verification

- GitHub CI, the focused configuration/write-router tests and the production Vite build passed for the exact source commit.
- App Runner HTTP health checks passed, the rollout operation succeeded and the service returned to `RUNNING`.
- The production root, health dashboard, `/browse-jobs`, `/job-details/30365-2` and `/docs` returned HTTP 200.
- The deployed bundle contains Native bridge `0x9A0950594A699f5fb7decd7069F935100d39D9bF`, XDC Local bridge `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` and the two Arbitrum write adapters. It contains no occurrence of the retired Native bridge address.
- XDC `postJob` was simulated successfully against the live LOWJC/bridge/LayerZero path on two independent RPC providers. Both returned the same quote and the live job counter remained `2`.
- Arbitrum direct `postJob` was simulated successfully against the live ArbLOWJC/NOWJC path on two independent RPC providers. The live job counter remained `21`.
- Both job-posting checks used `eth_call`; no blockchain transaction was submitted and no native currency or USDC was spent.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-4961c45-20260717225439` |
| ECR digest | `sha256:bba58369a4575ba89fef23def4dcb8207e2c894c9bebfbdb3c62905d67d0e800` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
