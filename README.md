# OpenWork

Monorepo for the OpenWork multichain protocol: the production web application, its
managed backend, and the canonical Solidity sources and deployment records for the
contracts those clients transact against.

## Start here

| If you are... | Read first |
|---|---|
| A developer or reviewer | [CONTRIBUTING.md](CONTRIBUTING.md) and [the repository map](docs/repository-map.md) |
| An AI coding agent | [AGENTS.md](AGENTS.md), then [the documentation index](docs/README.md) |
| Looking for a live contract | [The canonical live contract registry](contracts/references/logs/imp/live-contract-registry-19-mar-2026.md) |
| Releasing the app or landing site | [The delivery map](docs/repository-map.md#production-delivery-boundaries) and the relevant infrastructure README |
| Changing or deploying contracts | [The OpenWork contracts skill](contracts/skills/openwork-contracts/SKILL.md) |

Do not start from a sibling checkout or one of the historical repositories named in
older logs. `AnasShaikh/openwork-react-app` on `main` is the canonical repository.

The contracts previously lived in a separate `openwork-contracts-final` repository.
They were merged in on 3 August 2026 with their full history so that a contract change
and the frontend configuration that depends on it can be reviewed, audited, and
released as one unit. See
[the consolidation record](docs/repository-consolidation-2026-08-03.md) for what moved,
why, and what to watch for.

## Layout

| Path | Contents |
|---|---|
| `src/` | React application served at `app.openwork.technology`. `src/config/chainConfig.js` is the runtime address manifest. |
| `backend/` | Managed Node backend, tested and deployed separately from the frontend. |
| `contracts/` | Foundry project: Solidity sources, tests, deploy scripts, broadcast receipts, and the deployment reference library under `contracts/references/`. |
| `landing/` | Marketing site served at `www.openwork.technology`. Its own Vite project with its own lockfile. |
| `docs/` | Application-side records: production releases, dated integration and audit notes, and `mainnet-contracts.json`. |
| `public/`, `tests/`, `scripts/`, `infra/` | Static assets, frontend tests, operational scripts, and infrastructure definitions. |

Three deployables live here and they do **not** share a pipeline:

| Deployable | Host | Delivery |
|---|---|---|
| App + backend | `app.openwork.technology` | Explicit immutable CodeBuild → ECR → App Runner release |
| Landing site | `www.openwork.technology` | A merged `landing/**` change on `main` runs GitHub Actions → AWS OIDC → S3 → CloudFront |
| Contracts | Arbitrum, Optimism, XDC, Ethereum | Explicitly approved Foundry transactions, followed by registry and evidence updates |

A commit here does not deploy everything. Each target has its own trigger.

The landing pipeline is now sourced from `landing/` through
[`.github/workflows/landing.yml`](.github/workflows/landing.yml). The former
`krishnaprasath-k/openwork-landing` repository is historical and must not receive new
production work. The older `openwork-landing-page` variant was never merged or deployed.

## Source of truth

- `main` is the consolidated production branch. There is no separate contracts branch.
- Live on-chain state outranks every document in this repository.
- [The live contract registry](contracts/references/logs/imp/live-contract-registry-19-mar-2026.md)
  is the canonical address, implementation, and verification record. Its filename keeps
  its original March date for link stability; read its `Last audited` field rather than
  assuming it is stale.
- [Current production release](docs/production-release-current.md) records the exact source commit, immutable image, deployment operation, verification, and rollback target.
- [Chain configuration](src/config/chainConfig.js) is the frontend runtime manifest for Arbitrum, Optimism, XDC, and supported test networks.
- [The documentation index](docs/README.md) classifies current pointers, operational records, and historical evidence so dated notes are not mistaken for live configuration.

**Addresses are recorded in more than one place.** The live registry is canonical, but
`src/config/chainConfig.js`, `docs/mainnet-contracts.json`, and `backend/config.js` each
restate addresses for their own runtime. A deployment or upgrade is not finished until
every one of them agrees with the registry. Keeping these in one repository is the
reason the merge happened; it does not make them update themselves.

## Local verification

```sh
npm ci
npm test
VITE_NETWORK_MODE=mainnet npm run build
npm run preview
```

The backend is verified separately:

```sh
cd backend
npm ci
npm test
```

The contracts are a Foundry project and must be driven from `contracts/`:

```sh
git submodule update --init --recursive
cd contracts
forge build
forge test --contracts src/suites/current-mainnet --match-path 'test/CurrentMainnet*.t.sol'
```

The landing site is a separate Vite project with its own lockfile:

```sh
cd landing
npm ci
npm run build
```

`contracts/skills/openwork-contracts/` holds the working procedures for contract
deployment, upgrades, cross-chain configuration, and explorer verification. Start from
its `references/repository-map.md` for orientation and source-of-truth rules.

Copy the relevant example environment files for local development. Never place service credentials, private keys, or backend secrets in `VITE_*` variables because Vite embeds those values in the browser bundle.

## Production delivery

Production uses an immutable CodeBuild → ECR → App Runner release flow. Each release must:

1. Build a specific commit from `main`.
2. Push a unique image tag to the `openwork-app` ECR repository.
3. Update the existing `openwork-react-app-prod` App Runner service to that exact tag.
4. Wait for the App Runner operation and `/health` check to succeed.
5. Verify the public application without submitting wallet transactions.
6. Update [the current release manifest](docs/production-release-current.md), preserving the previous image as the rollback target.

Landing changes deploy only after they reach `main` and pass the dedicated workflow.
Contract changes never deploy from CI. A repository push is not authorization for a
wallet transaction, upgrade, configuration call, token transfer, bridge, or swap.
