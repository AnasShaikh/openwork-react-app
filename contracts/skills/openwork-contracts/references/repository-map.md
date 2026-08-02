# Repository Map and Source-of-Truth Rules

## Canonical hierarchy

Use this hierarchy, from strongest to weakest:

1. Live on-chain state and successful receipts.
2. `references/logs/imp/live-contract-registry-19-mar-2026.md`.
3. `references/logs/imp/mainnet-verification-tracker.md` and explorer-published source.
4. The newest dated deployment or upgrade log.
5. `src/suites/current-mainnet/` source files.
6. Foundry scripts, tests, and broadcast artifacts.
7. Snapshots, historical deployment summaries, archived sources, and `Old Things/`.

Resolve disagreements explicitly. Never silently choose an older document over live state.

## Important paths

| Purpose | Path |
|---|---|
| Canonical live registry | `references/logs/imp/live-contract-registry-19-mar-2026.md` |
| Verification tracker | `references/logs/imp/mainnet-verification-tracker.md` |
| Current production source | `src/suites/current-mainnet/` |
| Historical snapshot | `src/suites/snapshot-19-mar-2026/` |
| Deployment/config scripts | `script/` |
| Focused tests | `test/` |
| Foundry receipts | `broadcast/` |
| Deployment/upgrade narratives | `references/logs/` |
| Broad deployment guides | `references/main-net-deployment/` |

The live registry filename retains its original March date for link stability; inspect its `Last audited` field and changelog rather than assuming it is stale.

## Contract families

- **Native chain (Arbitrum):** NativeOpenworkGenesis, NOWJC, NativeArb LOWJC, NativeArbAthenaClient, NativeOpenworkDAO, NativeAthena, profiles, rewards, registry, reader, and NativeLZ bridge.
- **Local chains (Optimism, XDC, future EVM locals):** LocalLZ bridge, local LOWJC, LocalAthena, CCTP transceiver, and UUPS proxies where applicable.
- **Main chain (Ethereum):** ETHOpenworkDAO, ETHLZ bridge, rewards, and OWORK token.

Understand whether an address is an implementation, proxy, non-upgradeable contract, external dependency, or peer before using it.

## Discovery commands

Prefer narrow searches:

```bash
rg -n "<address>|<contract name>" references/logs/imp references/logs src/suites/current-mainnet script
rg --files src/suites/current-mainnet script test references/logs | sort
```

For a proxy, read the ERC-1967 implementation slot:

```bash
cast storage <proxy> \
  0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc \
  --rpc-url "$RPC_URL"
```

Then compare the normalized address to the live registry and explorer proxy link.

## Status vocabulary

Use precise labels:

- **Deployed:** successful creation receipt and non-empty runtime code.
- **Initialized:** proxy/application initializer values read back.
- **Configured:** all required local writes read back.
- **Peered:** reciprocal OApp peers exist.
- **Pathway operational:** LayerZero libraries/security configs are usable in both directions and a quote succeeds.
- **End-to-end tested:** destination application state proves message delivery.
- **Verified:** explorer source publication succeeded.
- **Proxy linked:** explorer identifies the correct live implementation.

Do not collapse these into a single “done” state.
