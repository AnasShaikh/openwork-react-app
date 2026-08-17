# OpenWork security policy

OpenWork is a public monorepo containing browser code, backend services, infrastructure
configuration, and the source and evidence for live smart contracts. Treat every commit
as public before it is pushed.

## Report a security issue

Do not open a public issue containing an unpatched vulnerability, credential, private
key, exploitable transaction sequence, or customer data. Contact the repository owner
privately with:

- the affected component and production surface;
- a minimal reproduction with secrets removed;
- the likely impact and whether exploitation has been observed;
- any transaction hashes or log timestamps that are already public.

Do not perform a mainnet transaction to demonstrate a report without explicit approval.

## Credentials and identities

- Never commit `.env` files, API keys, passwords, access tokens, database URLs, seed
  phrases, private keys, signed transactions, or cloud access keys.
- Every person uses an individual GitHub and cloud identity. Do not share root accounts,
  IAM users, personal access tokens, SSH keys, or browser sessions.
- Human AWS access should use federation, short-lived credentials, MFA, and scoped
  permission sets. Application workloads use IAM roles.
- Production backend secrets belong in the deployment platform's secret mapping. They
  must not appear in Docker build arguments, GitHub Actions logs, or repository files.
- Every `VITE_*` value is public because Vite embeds it in the browser bundle. Never put
  a secret in a `VITE_*` variable.
- Never share the OpenWork deployer-wallet key. Contract authority must be exercised by
  an explicitly approved signer; migration to multisig control is tracked in
  [PROJECT_STATUS.md](PROJECT_STATUS.md#accepted-risk-privileged-control-is-a-single-externally-owned-account).

## Historical credential exposure

The repository history contains revoked credentials from earlier development. Their
presence is recorded in [PROJECT_STATUS.md](PROJECT_STATUS.md); it does not make them
valid production configuration. Treat any credential ever committed as permanently
compromised, rotate it at the provider, and remove it from every active deployment.

Do not rewrite shared Git history or force-push as an ad hoc cleanup. History rewriting
requires a coordinated incident plan because it invalidates clones, branches, release
pointers, and audit references.

## Changes with production impact

- Protect `main`; production work enters through reviewed pull requests and passing CI.
- Require owner review for `.github/`, `infra/`, `contracts/`, release manifests,
  address configuration, and `CODEOWNERS`.
- A landing change merged to `main` can publish `www.openwork.technology`.
- An application commit is not a release. App Runner must receive a unique immutable
  image and pass the release checks in `docs/production-release-current.md`.
- Contract CI never authorizes an on-chain write. Deployments, upgrades, configuration
  calls, funding, bridging, and swaps require a separately approved scope and cap.
- Preserve the source file of every deployed contract implementation. Changed behavior
  belongs in a new versioned source file.

## Before every pull request

1. Inspect all changed and untracked files.
2. Search the diff for credentials, private endpoints, raw authorization headers, and
   accidental customer or wallet data.
3. Confirm `.env.example` contains placeholders only.
4. Run the checks listed in [CONTRIBUTING.md](CONTRIBUTING.md).
5. Record production-impacting changes in the correct current pointer or dated evidence
   log; never create a competing address catalog.

If a credential may have escaped, stop publishing, revoke or rotate it first, inspect
provider and chain activity, and only then repair configuration and documentation.
