# OpenWork

Monorepo for the OpenWork multichain protocol: the production web application, its
managed backend, and the canonical Solidity sources and deployment records for the
contracts those clients transact against.

The contracts previously lived in a separate `openwork-contracts-final` repository.
They were merged in on 3 August 2026 with their full history so that a contract change
and the frontend configuration that depends on it can be reviewed, audited, and
released as one unit. See
[the consolidation record](docs/repository-consolidation-2026-08-03.md) for what moved,
why, and what to watch for.

## Layout

| Path | Contents |
|---|---|
| `src/` | React application. `src/config/chainConfig.js` is the runtime address manifest. |
| `backend/` | Managed Node backend, tested and deployed separately from the frontend. |
| `contracts/` | Foundry project: Solidity sources, tests, deploy scripts, broadcast receipts, and the deployment reference library under `contracts/references/`. |
| `docs/` | Application-side records: production releases, dated integration and audit notes, and `mainnet-contracts.json`. |
| `public/`, `tests/`, `scripts/`, `infra/` | Static assets, frontend tests, operational scripts, and infrastructure definitions. |

## Source of truth

- `main` is the consolidated production branch. There is no separate contracts branch.
- Live on-chain state outranks every document in this repository.
- [The live contract registry](contracts/references/logs/imp/live-contract-registry-19-mar-2026.md)
  is the canonical address, implementation, and verification record. Its filename keeps
  its original March date for link stability; read its `Last audited` field rather than
  assuming it is stale.
- [Current production release](docs/production-release-current.md) records the exact source commit, immutable image, deployment operation, verification, and rollback target.
- [Chain configuration](src/config/chainConfig.js) is the frontend runtime manifest for Arbitrum, Optimism, XDC, and supported test networks.

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
