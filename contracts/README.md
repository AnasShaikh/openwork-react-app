# Openwork Contracts

Foundry workspace and operational record for Openwork's live multichain contracts.

## Start with the live sources of truth

- [Live contract registry](references/logs/imp/live-contract-registry-19-mar-2026.md) — current addresses, proxy implementations, exact source files, peers, and verification status.
- [Mainnet verification tracker](references/logs/imp/mainnet-verification-tracker.md) — explorer verification and proxy-link status.
- [Current release ledger](references/deployments/confirmed-upgrades-mainnet-19-jul-2026.md) — the active proxy/implementation rollout and configuration receipts.
- [Latest production contract proof](references/deployments/arbitrum-direct-contract-job-42161-24-7-aug-2026.md) — direct Arbitrum escrow and release evidence.
- [Latest cross-chain proof](references/deployments/xdc-mainnet-job-cycle-30365-3-19-jul-2026.md) — post-cutover XDC ↔ Arbitrum delivery evidence.
- [Openwork contracts Codex skill](skills/openwork-contracts/SKILL.md) — reusable safe deployment, upgrade, cross-chain, verification, and documentation workflow.

Current production sources live under `src/suites/current-mainnet/`. Historical snapshots and older deployment documents are context only; do not use them as the live address source without reconciling them against the registry and on-chain state.

## Trace a deployed contract

1. Find the role and chain in the live registry.
2. Follow the row's exact source link under `src/suites/current-mainnet/`.
3. Follow the registry header to the current release ledger or newest configuration log.
4. Inspect the referenced script under `script/` and any public receipt under
   `broadcast/`. A broadcast filename alone is not proof that it belongs to the active
   mainnet deployment.
5. For proxies, confirm the ERC-1967 implementation slot and explorer proxy link.
6. Reconcile application consumers in `../src/config/chainConfig.js`,
   `../backend/config.js`, and `../docs/mainnet-contracts.json`.

The registry is the only maintained address-to-source catalog. Do not create another
"latest addresses" document. Dated deployment records are evidence, not replacements
for the registry.

## Source preservation

Never edit a Solidity source file that corresponds to an already deployed
implementation. Copy it to a new, uniquely named version, make the change in that copy,
and retain the old source and deployment record. Follow
[`skills/openwork-contracts/SKILL.md`](skills/openwork-contracts/SKILL.md) before any
deployment, upgrade, cross-chain configuration, or paid mainnet test.

## External links

- [Openwork documentation](https://openwork.gitbook.io/openwork)
- [Openwork website](https://openwork.technology/)
