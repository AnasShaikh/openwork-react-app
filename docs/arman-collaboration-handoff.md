# Arman collaboration handoff

Hi Arman — OpenWork now uses one canonical monorepo for the product application,
backend, marketing site, and smart-contract sources:

`https://github.com/AnasShaikh/openwork-react-app`

Please do not work from an older OpenWork app, contracts, landing, Vercel, or bot UI
repository. They are historical or secondary copies.

## Where to work

| Goal | Directory |
|---|---|
| Product application and Agent Oppy UI | `src/` |
| Backend, relayers, Agent Oppy API, docs API | `backend/` |
| Marketing site at `www.openwork.technology` | `landing/` |
| Smart-contract source, tests, scripts, and deployment records | `contracts/` |
| Infrastructure and release configuration | `infra/`, `.github/workflows/`, `buildspec.yml`, `Dockerfile` |

Start with `README.md`, `CONTRIBUTING.md`, `docs/repository-map.md`, and
`PROJECT_STATUS.md`. If you use a coding agent, it must read `AGENTS.md`. Contract work
also requires `contracts/skills/openwork-contracts/SKILL.md`.

## Normal contribution flow

```sh
git clone --recurse-submodules https://github.com/AnasShaikh/openwork-react-app.git
cd openwork-react-app
git switch main
git pull --ff-only
git switch -c feat/short-description
```

Make a focused change, run the checks in `CONTRIBUTING.md`, commit it, push your branch,
and open a pull request. Do not push directly to `main`, bypass failed checks, or combine
unrelated application, landing, infrastructure, and contract changes.

## What "push to live" means

- **Landing:** an approved `landing/**` pull request deploys automatically after it is
  merged to `main` and the landing workflow succeeds.
- **Application/backend:** merging does not deploy the app. An authorized release
  operator builds that exact `main` commit into a unique image, updates App Runner,
  verifies production, and records the release.
- **Contracts:** merging never deploys a contract. On-chain work needs a separately
  approved transaction plan, signer, chain, call list, spend cap, simulations, and
  post-transaction evidence.

## Access and security

- Use your own GitHub identity and SSH key or GitHub credential. Never use a shared token.
- Use an individual federated AWS login with MFA if release access is granted. Never use
  shared static AWS keys or the root account.
- Production deploy permission is highly trusted: deployed code can access the service's
  runtime capabilities even when the IAM console does not reveal secret values.
- Never request, copy, or store the OpenWork deployer-wallet private key. Smart-contract
  signer authority is separate from repository and AWS access.
- Never commit `.env` files or put secrets in `VITE_*` variables; all `VITE_*` values are
  shipped to browsers.

## Before your first change

The repository owner will:

1. invite your GitHub username with contributor access;
2. confirm that `main` requires pull requests, review, and passing checks;
3. decide whether you need development-only access or a separately scoped release role;
4. walk through one application PR and one landing PR before granting independent
   production-release responsibility.

When you are unsure which address, implementation, source file, or deployment record is
current, stop and start from the canonical live contract registry. Do not select an
address from a dated log or old summary because its filename says "latest".
