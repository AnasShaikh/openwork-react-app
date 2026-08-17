# OpenWork documentation index

This index separates current sources of truth from dated operational evidence and
historical implementation notes. Start here instead of choosing a document by filename.

## Current pointers

These files describe the present system and are updated in place:

| Subject | Canonical file |
|---|---|
| Repository, launch status, risks, active addresses summary | [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) |
| Repository hierarchy and delivery boundaries | [`repository-map.md`](repository-map.md) |
| Active application release and rollback | [`production-release-current.md`](production-release-current.md) |
| Live contract addresses, implementations, source links, peers, and verification | [`../contracts/references/logs/imp/live-contract-registry-19-mar-2026.md`](../contracts/references/logs/imp/live-contract-registry-19-mar-2026.md) |
| Machine-readable public contract registry | [`mainnet-contracts.json`](mainnet-contracts.json) |
| Explorer verification tracker | [`../contracts/references/logs/imp/mainnet-verification-tracker.md`](../contracts/references/logs/imp/mainnet-verification-tracker.md) |
| Contributor workflow | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Coding-agent instructions | [`../AGENTS.md`](../AGENTS.md) |
| Security policy | [`../SECURITY.md`](../SECURITY.md) |

The live registry keeps its March filename for stable links. Its `Last audited` field,
not its filename, determines freshness.

## Operational records

| Area | Records |
|---|---|
| App Runner and current release | [`production-release-current.md`](production-release-current.md), [`../infra/app-runner/README.md`](../infra/app-runner/README.md) |
| IPFS infrastructure | [`ipfs-aws-production-2026-07-19.md`](ipfs-aws-production-2026-07-19.md), [`../infra/ipfs/README.md`](../infra/ipfs/README.md) |
| XDC application integration | [`xdc-mainnet-app-integration-2026-07-13.md`](xdc-mainnet-app-integration-2026-07-13.md) |
| Contract releases and transaction evidence | [`../contracts/references/deployments/`](../contracts/references/deployments/) |
| Contract operating procedures | [`../contracts/skills/openwork-contracts/SKILL.md`](../contracts/skills/openwork-contracts/SKILL.md) |
| Public machine-readable docs API | [`../BOT-DOCUMENTATION-ACCESS-GUIDE.md`](../BOT-DOCUMENTATION-ACCESS-GUIDE.md) |

Operational records may be dated. Use them as evidence, then reconcile their claims with
the current pointers above.

## Historical and audit material

The following are retained to explain earlier decisions and regressions. They are not
live configuration sources:

- `DEV_AGENT_TASKS_2026-08-03.md` and its results;
- `repository-consolidation-2026-08-03.md`;
- UI audits, screenshots, test plans, and wallet snapshots;
- root `references/` and `logs/` files predating the monorepo consolidation;
- `contracts/references/**/older/`, contract snapshots, old implementations, and
  testnet broadcast receipts;
- `VERSION_CONTROL_SETUP_GUIDE.md` and other feature-specific setup notes that describe
  an earlier development state.

Historical records can contain addresses or status statements that were correct at the
time and are now superseded. Do not edit them merely to make them look current; add a
current record or explicit supersession link instead.

## Documentation conventions

1. Maintain one source of truth per subject. Index documents link to it rather than
   copying full address tables.
2. Current pointers use stable filenames and include an audit or deployment timestamp.
3. One-time execution evidence uses `topic-YYYY-MM-DD.md` and records receipts, costs,
   state readbacks, verification, and remaining limitations.
4. Use relative repository links. Link a contract role directly to its exact source.
5. Distinguish `deployed`, `initialized`, `configured`, `peered`, `pathway operational`,
   `end-to-end tested`, `source verified`, and `proxy linked`.
6. Never place keys, secrets, raw signed payloads, `.env` contents, or private endpoints
   in documentation.
7. If a current claim changes, update the source of truth and every runtime projection in
   the same pull request.

## Public documentation

`https://app.openwork.technology/docs` is the customer-facing view. Its structured
contract data comes from `mainnet-contracts.json`; the backend also exposes it at
`/api/docs/contracts`. The public page is a projection, not an independent contract
registry.
