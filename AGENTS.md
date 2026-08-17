# OpenWork agent operating guide

This file applies to the entire repository. It is the first instruction file for coding
agents working in the OpenWork monorepo.

## Establish context before editing

1. Work from this repository root. The canonical remote is
   `https://github.com/AnasShaikh/openwork-react-app` and the release branch is `main`.
2. Read [README.md](README.md), [PROJECT_STATUS.md](PROJECT_STATUS.md),
   [docs/README.md](docs/README.md), and [CONTRIBUTING.md](CONTRIBUTING.md).
3. Inspect `git status`, the current branch, and the exact files already modified. Never
   discard or overwrite unrelated work.
4. Use [docs/repository-map.md](docs/repository-map.md) to identify the deployable and
   its release boundary before changing code.
5. For any contract address, Solidity source, ABI, deployment, upgrade, cross-chain
   configuration, or paid mainnet test, read
   [contracts/skills/openwork-contracts/SKILL.md](contracts/skills/openwork-contracts/SKILL.md)
   and every task-specific reference it requires.

Do not work from the retired `openwork-contracts-final`, `openwork-landing`,
`openwork-landing-page`, `openwork-react-app-vercel`, or `botopenwork-ui` repositories.
Older documents may name them for historical accuracy; they are not production sources.

## Repository boundaries

| Area | Primary paths | Production boundary |
|---|---|---|
| Application | `src/`, `public/`, `tests/` | Immutable image released through CodeBuild, ECR, and App Runner |
| Backend and Oppy | `backend/`, `openclaw-skill/` | Same production App Runner release as the application |
| Landing site | `landing/` | Dedicated GitHub Actions workflow publishes S3 and invalidates CloudFront |
| Smart contracts | `contracts/` | Explicitly approved wallet transactions; CI never deploys |
| Infrastructure | `infra/`, `buildspec.yml`, `Dockerfile`, `.github/workflows/` | Review as production-sensitive configuration |
| Current records | `PROJECT_STATUS.md`, `docs/production-release-current.md`, contract live registry | Update in place only when evidence changes |

## Source-of-truth rules

- Live on-chain state and successful receipts outrank repository documents.
- The only canonical address-to-source catalog is
  `contracts/references/logs/imp/live-contract-registry-19-mar-2026.md`.
- `docs/mainnet-contracts.json` is the machine-readable/public projection of that
  registry. Runtime consumers in `src/config/chainConfig.js` and `backend/config.js`
  must be reconciled when an address changes.
- `docs/production-release-current.md` identifies the active App Runner image, source
  commit, verification evidence, and rollback target.
- Dated logs are evidence of what happened at that time. They do not override a newer
  current pointer.
- Historical filenames are retained for stable links. Read the document's audit date
  and status instead of inferring freshness from its filename.

## Editing and safety rules

- Never commit or print credentials, `.env` contents, private keys, seed phrases,
  database URLs, raw authorization headers, or signed transactions.
- Every `VITE_*` value is public browser data.
- Never modify a Solidity file that corresponds to an already deployed implementation.
  Copy it to a new versioned file before changing behavior.
- Do not create another "latest contract addresses" document. Update the live registry,
  its JSON projection, runtime consumers, and a dated evidence log together.
- Do not claim a contract is deployed, verified, peered, configured, operational, or
  end-to-end tested unless the evidence satisfies the definitions in the contract skill.
- A code-change request does not authorize a deploy, cloud mutation, wallet request,
  contract transaction, token transfer, bridge, swap, funding action, or secret change.
- Preserve historical evidence. Classify stale documents in the documentation index
  instead of silently rewriting history to look current.

## Validation by scope

| Changed area | Minimum local checks |
|---|---|
| Root frontend or shared docs | `npm test` and `VITE_NETWORK_MODE=mainnet npm run build` |
| Backend | `cd backend && npm test && npm audit --audit-level=high` |
| Landing | `cd landing && npm run build` |
| Contracts | Follow the contract skill; at minimum run the maintained Foundry build and focused tests from `contracts/` |
| Workflows/infrastructure | Validate syntax, inspect permissions, and verify the intended production target without deploying |

Finish by reviewing `git diff`, running `git diff --check`, listing untracked files, and
reporting exactly what was changed, tested, committed, pushed, deployed, and left open.
