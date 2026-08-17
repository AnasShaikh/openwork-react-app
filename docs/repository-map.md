# OpenWork repository and delivery map

## Canonical repository

| Item | Value |
|---|---|
| Repository | `https://github.com/AnasShaikh/openwork-react-app` |
| Release branch | `main` |
| App | `https://app.openwork.technology` |
| Landing site | `https://www.openwork.technology` |
| Contract networks | Arbitrum One, Optimism, XDC Network, Ethereum Mainnet |

Retired or secondary remotes are not sources of truth. In particular, do not publish
new work to `openwork-contracts-final`, `krishnaprasath-k/openwork-landing`,
`krishnaprasath-k/openwork-landing-page`, `openwork-react-app-vercel`, or
`botopenwork-ui/openwork-react-app`.

## Folder hierarchy

```text
openwork-react-app/
├── src/                         React application and runtime chain configuration
├── public/                      Application static assets
├── tests/                       Root frontend, reliability, and documentation tests
├── backend/                     Node backend, relayers, Oppy API, docs API, tests
├── openclaw-skill/              Public OpenWork knowledge served to agents
├── landing/                     Independent Vite marketing site
├── contracts/                   Canonical Foundry project and contract evidence
│   ├── src/suites/current-mainnet/  Current deployed and held production sources
│   ├── script/                      Maintained deployment/configuration scripts
│   ├── test/                        Maintained Foundry tests
│   ├── broadcast/                   Curated public receipts; mostly historical/testnet
│   ├── references/deployments/      Dated mainnet release and transaction evidence
│   ├── references/logs/imp/         Live registry and verification tracker
│   └── skills/openwork-contracts/   Contract operating procedure
├── docs/                        Current app release records and dated integration notes
├── infra/                       App Runner and IPFS policies/templates
├── .github/workflows/           CI and landing production delivery
├── buildspec.yml                App production image build
├── Dockerfile                   Combined app/backend production image
├── PROJECT_STATUS.md            Current project status and accepted risks
└── docs/production-release-current.md  Active immutable app release pointer
```

Legacy material remains in root `references/`, root `logs/`, contract snapshots,
`contracts/Old Things/`, and older deployment folders. It is kept for audit history, not
for current addresses or release instructions.

## Production delivery boundaries

| Surface | Source | Validation | Production action |
|---|---|---|---|
| App and backend | Root app files, `src/`, `backend/`, `openclaw-skill/` | Root and backend CI; production build | Authorized operator builds an immutable source commit, publishes a unique ECR tag, updates App Runner, verifies health/public routes, and updates the release pointer |
| Landing | `landing/` | Dedicated landing build | A change on `main` triggers `.github/workflows/landing.yml`, assumes an AWS role through OIDC, publishes S3, and invalidates CloudFront |
| Contracts | `contracts/` | Foundry build, focused tests, simulations, and audit | Separately approved signer sends bounded transactions; every receipt and live readback is documented |

The landing is the only surface that currently deploys automatically from a path-filtered
push to `main`. App CI does not update App Runner. Contract CI cannot sign transactions.

## Deployed-contract evidence chain

Use this order whenever locating or changing a live contract:

1. **Live chain and receipts.** Confirm runtime code, proxy implementation slot, owner,
   configuration, peers, and relevant balances.
2. **Canonical live registry.** Find the chain/role row in
   `contracts/references/logs/imp/live-contract-registry-19-mar-2026.md`.
3. **Machine-readable projection.** Match the role in `docs/mainnet-contracts.json`.
4. **Exact source.** Follow the registry row to
   `contracts/src/suites/current-mainnet/...`.
5. **Release/configuration evidence.** Follow the registry header or changelog into
   `contracts/references/deployments/`.
6. **Script and receipt.** Inspect `contracts/script/` and any explicitly referenced
   broadcast receipt. Do not infer mainnet provenance from `run-latest.json`.
7. **Explorer status.** Check the mainnet verification tracker and proxy link.
8. **Application consumers.** Reconcile `src/config/chainConfig.js`,
   `backend/config.js`, and `docs/mainnet-contracts.json`.

For a proxy, record both the proxy and implementation addresses. For a standalone
contract, record the deployed address and exact source. A source-verified implementation
does not imply its proxy is linked, and a successful source receipt does not prove a
cross-chain destination state change.

## Contract source lifecycle

- Deployed implementation source is immutable repository history. Do not edit it.
- Changed behavior receives a new versioned or dated Solidity file and unique contract
  class where necessary.
- Deployment/configuration scripts belong in `contracts/script/`.
- Tests belong in `contracts/test/` and must target the new source explicitly.
- Mainnet execution produces a dated record under
  `contracts/references/deployments/`, followed by live registry, verification tracker,
  JSON projection, and application configuration updates.

## Ownership and review zones

All contributions use pull requests. The following paths are production-sensitive and
require owner review:

- `.github/`, `infra/`, `buildspec.yml`, and `Dockerfile`;
- `contracts/` and every live address/configuration projection;
- `src/config/chainConfig.js` and `backend/config.js`;
- `PROJECT_STATUS.md`, `docs/production-release-current.md`, and
  `docs/mainnet-contracts.json`;
- `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `.github/CODEOWNERS`.

Repository write access permits branches and pull requests. AWS release access, secret
administration, and on-chain signer authority are separate grants and must never be
implemented by sharing credentials.
