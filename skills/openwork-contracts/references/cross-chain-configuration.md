# Cross-Chain Configuration

## LayerZero model

Openwork bridge contracts are OApps. A pathway is directional: source OApp and destination EID determine effective send configuration; destination OApp and source EID determine effective receive configuration.

For each direction, record and read back:

- source and destination EIDs;
- source OApp peer for destination;
- destination OApp peer for source;
- send library and grace state;
- receive library and grace state;
- executor address and max message size;
- confirmations;
- required DVNs;
- optional DVNs and threshold;
- DVN ordering.

LayerZero configuration arrays must follow the protocol's address-ordering requirements. Build calldata from verified chain-specific addresses; do not reuse the same DVN address across chains unless official metadata confirms it.

## Readiness gates

A pathway is not operational if any of these holds:

- missing or one-sided peer;
- peer points to the wrong 32-byte address;
- unauthorized local chain on the native bridge;
- dead/default DVN configuration;
- missing executor;
- mismatched confirmations or DVN sets across expected send/receive directions;
- quote reverts;
- source transaction succeeds but destination is not delivered.

The error `Please set your OApp's DVNs and/or Executor` means peers alone are insufficient. Inspect effective endpoint configuration before spending on a message.

## Openwork peer wiring

For a new local chain, the common topology is:

1. Local bridge peers to Arbitrum NativeLZ bridge.
2. Arbitrum NativeLZ bridge peers back to local bridge.
3. Arbitrum NativeLZ bridge authorizes the local EID where the ABI requires it.
4. Local bridge may peer to Ethereum ETHLZ bridge.
5. Ethereum ETHLZ bridge peers back to local bridge.
6. Each intended direct pathway receives explicit, non-dead LayerZero send/receive security configuration.

Do not call a direct local/Ethereum route operational until its own DVN/executor pathway is configured; an operational local/Arbitrum route does not imply it.

## CCTP model

Circle uses CCTP domains, not LayerZero EIDs. Keep an explicit mapping table:

| Network | Chain ID | LZ EID | CCTP domain |
|---|---:|---:|---:|
| Ethereum | 1 | 30101 | 0 |
| Optimism | 10 | 30111 | 2 |
| Arbitrum | 42161 | 30110 | 3 |
| XDC | 50 | 30365 | 18 |

Confirm current values from Circle/LayerZero official sources before a new deployment.

Check:

- chain USDC address;
- TokenMessenger V2;
- MessageTransmitter V2;
- source-chain support for Fast versus Standard Transfer;
- destination domain;
- mint recipient encoding;
- allowance and token movement only for flows that actually transfer USDC.

For the July 2026 XDC stack, source transfers use Standard Transfer finality threshold `2000`. The dated transceiver retains a legacy `sendFast(...)` selector for compatibility but routes it through Standard Transfer behavior.

## Quote and delivery test

Before the source transaction:

1. Build the exact payload and options.
2. Quote using the deployed OApp.
3. Compare the quote to cap headroom.
4. Verify the destination gas option is adequate.
5. Send the smallest meaningful application call.

After it:

1. Capture source receipt and emitted GUID.
2. Track LayerZero status to `DELIVERED`.
3. Capture destination execution transaction.
4. Read destination application state.
5. Verify payload fields, caller identity, amount semantics, and counter changes.

Posting a job records a nominal milestone amount but need not transfer USDC. Document that distinction so a `1 USDC` milestone is not misreported as funds moved.

## Chain registration beyond contracts

After contracts are operational, locate all application consumers of chain metadata. Typical fields include:

- chain ID and display name;
- RPC and explorer URLs;
- native currency;
- LayerZero EID and CCTP domain;
- local bridge, LOWJC, LocalAthena, CCTP, and proxy addresses;
- native-chain bridge/Athena/NOWJC recipients;
- supported action flags and route selection.

Treat application configuration as a separate repository scope. If it is not available or the user requested a stop at another-chain boundary, document the exact external step instead of guessing.
