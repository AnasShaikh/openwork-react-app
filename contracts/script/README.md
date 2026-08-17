# Contract Script Classification

Scripts in this directory are retained for reproducibility and evidence. A script's presence does not mean it is safe or current for production execution.

| Script | Classification | Notes |
| --- | --- | --- |
| `DeployConfirmedUpgradeArtifacts19Jul2026.s.sol` | Dated deployment artifact | Deploys the July 2026 successor implementations; it does not perform proxy upgrades or configuration. Use only with the matching approved deployment plan. |
| `generate-confirmed-upgrade-calldata-19-jul-2026.sh` | Read-only utility | Generates calldata for the confirmed July upgrades. Review output against the canonical registry before use. |
| `UpgradeNativeAthenaXdcDomain12Jul2026.s.sol` | Superseded deployment artifact | July V8 upgrade path; superseded by the active V9 implementation recorded in the registry. |
| `DeployXdcLocal12Jul2026.s.sol` | Historical deployment artifact | Initial XDC stack deployment; later production configuration and implementations supersede parts of it. |
| `ConnectXdcArbitrum12Jul2026.s.sol` | Historical configuration artifact | References bridge peers that are no longer the canonical active route. |
| `ConnectXdcEthereum12Jul2026.s.sol` | Historical configuration artifact | Retained for evidence; XDC-to-Ethereum is not an intended active route in the current registry. |
| `test-options-builder.s.sol` | Test/experimental | Testnet-era options and payment checks. It is not a maintained mainnet deployment tool. |

Before any contract transaction:

1. Read [`../references/logs/imp/live-contract-registry-19-mar-2026.md`](../references/logs/imp/live-contract-registry-19-mar-2026.md).
2. Confirm the exact chain, proxy, implementation, peer, token, and signer role independently.
3. Simulate or generate calldata without broadcasting.
4. Obtain explicit approval for the exact transaction and value.
5. Record the receipt, verification status, runtime configuration, and registry update together.

Do not run a script solely because its name resembles the requested action.
