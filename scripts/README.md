# Root Script Archive

Most scripts in this directory are dated testnet, smoke-test, debugging, or historical deployment utilities. Result JSON files are preserved evidence from those runs. These are not the production release entrypoint and should not be treated as current merely because a filename contains `mainnet`, `real`, or `proper`.

Use the current documentation before running anything:

- [`../docs/README.md`](../docs/README.md) — documentation index.
- [`../docs/production-release-current.md`](../docs/production-release-current.md) — current application release record.
- [`../contracts/references/logs/imp/live-contract-registry-19-mar-2026.md`](../contracts/references/logs/imp/live-contract-registry-19-mar-2026.md) — canonical contract registry.
- [`../contracts/script/README.md`](../contracts/script/README.md) — contract-specific script classification and transaction safeguards.

For any script that can sign or broadcast:

1. Inspect the full source and all imported address/configuration files.
2. Verify the chain ID and every address against the current registry/runtime configuration.
3. Use a read-only or simulated mode first.
4. Obtain explicit approval for the exact transaction and value.
5. Never place a private key in a tracked file or command history.

New maintained automation should live beside its owning package, expose a documented package command, and have a test or dry-run path.
