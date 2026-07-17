# OpenWork Web App

Production web application and managed backend for the OpenWork multichain protocol.

## Source of truth

- `main` is the consolidated production branch.
- [Current production release](docs/production-release-current.md) records the exact source commit, immutable image, deployment operation, verification, and rollback target.
- [Chain configuration](src/config/chainConfig.js) is the frontend runtime manifest for Arbitrum, Optimism, XDC, and supported test networks.
- Canonical smart-contract sources and deployment records live in [`openwork-contracts-final`](https://github.com/AnasShaikh/openwork-contracts-final).

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

Copy the relevant example environment files for local development. Never place service credentials, private keys, or backend secrets in `VITE_*` variables because Vite embeds those values in the browser bundle.

## Production delivery

Production uses an immutable CodeBuild → ECR → App Runner release flow. Each release must:

1. Build a specific commit from `main`.
2. Push a unique image tag to the `openwork-app` ECR repository.
3. Update the existing `openwork-react-app-prod` App Runner service to that exact tag.
4. Wait for the App Runner operation and `/health` check to succeed.
5. Verify the public application without submitting wallet transactions.
6. Update [the current release manifest](docs/production-release-current.md), preserving the previous image as the rollback target.
