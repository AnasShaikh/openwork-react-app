## Summary

Describe the user-visible or operational outcome and why this change is needed.

## Scope

- [ ] Application (`src/`, root frontend)
- [ ] Backend / Agent Oppy (`backend/`, `openclaw-skill/`)
- [ ] Landing (`landing/`)
- [ ] Contracts (`contracts/`)
- [ ] Infrastructure / workflows
- [ ] Documentation only

## Validation

List the exact commands run and their results.

- [ ] Root tests pass
- [ ] Mainnet frontend build passes
- [ ] Backend tests/audit pass, if changed
- [ ] Landing build passes, if changed
- [ ] Contract skill checks pass, if changed
- [ ] `git diff --check` passes
- [ ] New and changed documentation links resolve

## Production and security review

- [ ] No credentials, private keys, `.env` contents, personal data, or raw authorization headers are included
- [ ] No secret is placed in a `VITE_*` variable
- [ ] The change does not modify an already deployed Solidity implementation source
- [ ] Live address changes update the canonical registry, JSON projection, runtime consumers, verification tracker, and dated evidence together
- [ ] The production surface and rollback approach are stated below
- [ ] Any mainnet transaction, cloud mutation, funding, bridge, or swap remains separately authorized

## Release notes

State one of:

- no production deployment required;
- landing deploys after approved merge;
- app/backend requires an explicit immutable App Runner release;
- contract execution requires a separately approved on-chain plan.
