# Contract Reference Directory

This directory contains production evidence, design context, and historical records for the OpenWork contract system. It is not an independent address catalog.

Use these sources in order:

1. [`logs/imp/live-contract-registry-19-mar-2026.md`](logs/imp/live-contract-registry-19-mar-2026.md) — canonical live-role registry, source mapping, implementation status, and explorer verification.
2. [`../src/suites/current-mainnet/`](../src/suites/current-mainnet/) — exact source files for the active implementations named by the registry.
3. [`deployments/confirmed-upgrades-mainnet-19-jul-2026.md`](deployments/confirmed-upgrades-mainnet-19-jul-2026.md) — confirmed July upgrade transaction ledger.
4. Dated files under [`deployments/`](deployments/) — deployment, configuration, funding, and end-to-end transaction evidence.

Directory classification:

| Path | Purpose | Authority |
| --- | --- | --- |
| `logs/imp/` | Canonical registry and verification tracker | Current production reference |
| `deployments/` | Dated on-chain evidence and receipts | Evidence for the event/date named |
| `deployments/evidence/` | Screenshots and visual proof | Supporting evidence only |
| `deployments/older/` | Superseded deployment records | Historical only |
| `context/` | Architecture and implementation context | Explanatory; verify against registry/source |
| `context/older/` | Superseded design and incident context | Historical only |
| `main-net-deployment/` | Earlier deployment planning/checklists | Planning archive; not a current runbook |
| `notes/`, `tasks/`, `UI Integration docs/` | Working notes and integration guidance | Non-authoritative unless a current document links to them |

Rules:

- Never infer the live address from a filename containing `latest`, `final`, or a recent-looking date.
- Never edit a source file that represents a deployed implementation. Add a new versioned source file and update the registry/evidence after an approved deployment.
- Every production address change must update the canonical registry, verification tracker, a dated transaction log, and the affected runtime configuration.
- Never commit private keys, seed phrases, raw signed transactions, RPC secrets, or cloud credentials.
