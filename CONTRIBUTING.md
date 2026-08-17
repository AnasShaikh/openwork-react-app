# Contributing to OpenWork

OpenWork is a production monorepo. The application, backend, landing site, and live
contract sources are reviewed together but released through separate boundaries.

## Prerequisites

- Git with submodule support
- Node.js 22.12 or newer and npm
- Foundry for contract work
- A personal GitHub account; never use another contributor's token or session
- AWS CLI with an individual federated profile only if release-operator access has been
  granted separately

Clone and install the parts you need:

```sh
git clone --recurse-submodules https://github.com/AnasShaikh/openwork-react-app.git
cd openwork-react-app
npm ci
(cd backend && npm ci)
(cd landing && npm ci)
```

## Branch and pull-request workflow

1. Start from an up-to-date `main`.
2. Create a focused branch such as `feat/oppy-history`, `fix/xdc-release-status`, or
   `docs/repository-map`.
3. Keep unrelated application, landing, backend, infrastructure, and contract changes
   out of the same pull request unless they are one coordinated release.
4. Run the checks for every changed area.
5. Open a pull request and complete the repository checklist.
6. Resolve review comments and wait for required checks and approvals.
7. Merge through GitHub. Do not force-push or push directly to `main`.

Commit messages should be short, imperative, and scoped where helpful, for example:

```text
feat(oppy): retain selected job context
fix(landing): preserve mobile navigation spacing
docs(contracts): link XDC V3 deployment evidence
```

## What reaches production

| Change | After merge to `main` |
|---|---|
| `landing/**` | The landing workflow builds and publishes `www.openwork.technology` through AWS OIDC |
| `src/**`, `backend/**`, root image files | CI runs, but production changes only after an explicit immutable App Runner release |
| `contracts/**` | Foundry CI runs; no on-chain transaction is sent |
| Documentation only | No runtime deployment unless the file is packaged into the public application image |

Production releases require separate authority. Repository write access alone does not
grant AWS release, secret, or wallet authority.

## Required checks

### Application and shared documentation

```sh
npm test
VITE_NETWORK_MODE=mainnet npm run build
git diff --check
```

### Backend

```sh
cd backend
npm test
npm audit --audit-level=high
find . -path './node_modules' -prune -o -name '*.js' -print0 | xargs -0 -n1 node --check
```

### Landing

```sh
cd landing
npm run build
```

### Contracts

Read `contracts/skills/openwork-contracts/SKILL.md` before contract work. The maintained
CI boundary is:

```sh
git submodule update --init --recursive
cd contracts
forge fmt --check test
forge build script/DeployConfirmedUpgradeArtifacts19Jul2026.s.sol --skip test
forge test \
  --contracts src/suites/current-mainnet \
  --match-path 'test/CurrentMainnet*.t.sol' \
  --no-match-path 'test/CurrentMainnetApplicantMilestoneBridges.t.sol'
FOUNDRY_PROFILE=layerzero_harness forge test
```

A contract PR must identify the exact live or new source, storage-layout impact,
deployment/configuration script, tests, registry changes, runtime address consumers, and
verification plan. A passing test does not authorize a mainnet write.

## Address and deployment documentation

To trace a live address, start at the canonical registry:

`contracts/references/logs/imp/live-contract-registry-19-mar-2026.md`

Every live row must identify the chain, role, proxy/address, implementation where
applicable, version, exact source file, and verification state. Changes must also update:

- `docs/mainnet-contracts.json`;
- `src/config/chainConfig.js` where the frontend consumes the role;
- `backend/config.js` where the backend consumes the role;
- the verification tracker;
- a dated execution/evidence log;
- the current release pointer when application production changes.

Do not create independent address summaries. Historical deployment files remain evidence
and should not be rewritten to match later state.

## Repository hygiene

- Do not commit dependencies, `dist/`, Foundry output, fork caches, editor state, logs,
  database files, screenshots without evidentiary value, or temporary scripts.
- Public-chain receipts may be committed only when they materially prove a documented
  deployment and contain no signing material or unnecessary sensitive context.
- Use lowercase kebab-case for new Markdown filenames. Dated evidence uses
  `topic-YYYY-MM-DD.md`; current pointers use stable names and are updated in place.
- Use relative links within the repository and verify them before review.
- Put reusable operational rules in the relevant README or skill; put one-time execution
  facts in a dated log.
- Update `.env.example` with placeholders when configuration shape changes. Never put
  real values in examples.

## Security and production authority

Read [SECURITY.md](SECURITY.md). In particular:

- do not share credentials or the deployer wallet;
- do not place secrets in `VITE_*` variables;
- do not deploy an unmerged branch or mutable image tag;
- do not run paid contract calls without an approved plan and cumulative spend cap;
- treat production release access as access to production data and secrets, even if the
  IAM policy does not explicitly permit reading secret values.
