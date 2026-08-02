# Upgrade and Post-Deployment Audit

## Before a UUPS upgrade

Capture at a specific pre-upgrade block:

- ERC-1967 implementation slot;
- owner and relevant admins;
- initialized version if readable;
- bridge, USDC, CCTP sender/recipient, chain EIDs/domains;
- peers, authorization mappings, and registry links;
- application counters and critical mappings;
- proxy native/token balances;
- source implementation and storage layout.

Do not rely on a handful of getters if the contract has other operational configuration.

## Storage compatibility

Compare compiler storage-layout output for the exact old and new implementations.

Safe changes normally append state or consume a reserved gap correctly. Flag:

- changed inheritance order;
- reordered or removed variables;
- changed types or packing;
- renamed variables when tooling cannot establish equivalence;
- altered gap size without accounting;
- constructor behavior expected to initialize proxy state;
- new immutable values that alter proxy execution assumptions.

A change with no new state still requires the comparison.

## Upgrade rehearsal

On a live-state fork:

1. Impersonate or use the real authorized signer.
2. Deploy the candidate implementation.
3. Check runtime size and UUPS UUID.
4. Call `upgradeToAndCall` with the exact intended calldata.
5. Repeat the critical pre-upgrade reads.
6. Exercise the changed behavior and at least one unchanged critical path.

If owner/admin checks differ between direct calls and bridge/governance upgrades, rehearse the intended authorization path.

## After a successful upgrade

Verify immediately:

- receipt success and expected `Upgraded` event;
- implementation slot equals the new address;
- proxy owner/admins match pre-upgrade values;
- every captured configuration value matches unless intentionally changed;
- balances and counters are preserved;
- new behavior works;
- old critical behavior still works;
- implementation source is verified;
- proxy explorer link points to the new implementation;
- registry and verification tracker name the new version and dated source.

The upgrade is not complete until this comparison is recorded.

## Cross-contract integrity audit

After deployment or upgrade, audit relationships in both directions:

- bridge points to LOWJC/Athena and authorizes them;
- LOWJC and Athena point back to the expected bridge;
- LOWJC points to Athena and correct CCTP mint recipient;
- Athena points to LOWJC, NativeAthena recipient, and correct CCTP domain;
- NativeAthena recognizes new job-ID EID/domain routing;
- reciprocal peers match exact bridge addresses;
- NativeBridge authorizes the local EID;
- effective LayerZero configurations are non-dead;
- CCTP route and mint-recipient semantics align with application flow.

When the user asks whether two contracts “recognize each other,” translate that into every relevant getter/mapping rather than checking only one address.

## Audit record format

Record a table:

| Check | Before | Expected after | Actual after | Result | Evidence |
|---|---|---|---|---|---|

Use transaction hashes for writes and block-tagged calls for reads where possible. State whether a value was preserved, intentionally changed, or unavailable.
