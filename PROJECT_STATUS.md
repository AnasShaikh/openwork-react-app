# OpenWork — Project Status and Source of Truth

_Last code audit update: 2026-07-18_

## Canonical source

| Item | Canonical value |
|---|---|
| App repository | `https://github.com/AnasShaikh/openwork-react-app` |
| App release branch | `main` |
| Contract repository | `https://github.com/AnasShaikh/openwork-contracts-final` |
| Contract release branch | `main` |
| App URL | `https://app.openwork.technology` |
| Backend | `https://openwork-823072243332.us-central1.run.app` |

Production had previously moved ahead of the default branch. That history is now consolidated on `main`. Do not deploy an unmerged branch or an untagged local commit.

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
