# Mainnet Deployment Runbook

## 1. Read-only preflight

Confirm:

- repository branch, HEAD, remotes, and dirty files;
- signer address derived from the secret environment variable;
- chain ID from RPC, not only from configuration text;
- signer nonce and native balance on every involved chain;
- bytecode absence at predicted new addresses;
- owners/admins and existing proxy implementations;
- endpoint, USDC, Circle TokenMessenger/MessageTransmitter, LZ EID, and CCTP domain from official sources and live contracts;
- current gas price, LayerZero fee quote, and any native `msg.value` required;
- exact compiler, optimizer, `via_ir`, and EVM settings.

Never display the secret while doing this. A key copied from MetaMask may omit `0x`; normalize it in memory if necessary and compare only the derived public address.

## 2. Source/version preparation

For each contract:

1. Map the current live address to its exact source file.
2. If unchanged, compile the existing exact source.
3. If changed, copy the live source to a descriptive dated filename such as `native-athena-v8-xdc-domain-12-jul-2026.sol`.
4. Rename the contract class when needed for unambiguous explorer verification.
5. Keep storage declaration order and inheritance stable for upgrades.
6. Record the diff against the live implementation source.

Never overwrite or “clean up” the deployed copy.

## 3. Build and test gates

Required gates:

- `forge build` succeeds with the production profile.
- Focused unit tests cover every changed behavior and failure case.
- Runtime code is below EIP-170 limits with reasonable headroom.
- Initializer calldata is decoded and reviewed.
- UUPS implementations expose the expected UUID and `_authorizeUpgrade` behavior.
- Storage layout comparison shows no unsafe reorder, removal, or type change.
- The exact deployment/configuration sequence succeeds on a fork or disposable chain.
- Live-state forks preserve owners, admins, mappings, peer state, and application configuration after upgrades.

## 4. Predict addresses and transaction plan

Calculate addresses only after reading the live pending nonce. Document predicted addresses separately from confirmed addresses.

Create a transaction table with:

| # | Chain | Target/action | Native value | Estimated gas/fee | Dependency | Stop point |
|---|---|---|---:|---:|---|---|

Count contract creations, proxy initializations, local configuration, reciprocal chain writes, LayerZero endpoint configuration, verification-link writes if any, and the end-to-end test.

## 5. Cost cap

Estimate conservatively:

```text
chain gas = sum(gas limit × max fee per gas)
cross-chain fee = quoted native fee
total cap usage = chain gas + message fees + explicit native value
```

Keep a running ledger from receipts. Do not confuse estimated gas limits with actual receipt gas. Requote cross-chain messages immediately before sending because these fees can dominate deployment gas.

If the next transaction could exceed the approved cumulative cap, do not send it.

## 6. Plain-English approval brief

Before writes, tell the user:

- what will be deployed or upgraded;
- which existing proxies or bridges will be changed;
- how chains will be connected;
- how many paid transactions occur per chain;
- whether any token or native value moves beyond gas;
- maximum cumulative spend;
- where execution will stop.

Approval applies only to that plan and cap.

## 7. Staged execution cycle

Use checkpoints:

1. Broadcast the smallest approved stage.
2. Wait for success and sufficient confirmation.
3. Verify receipt status, sender, nonce, target/created address, calldata or constructor, gas, effective price, and native value.
4. Read code and state back from the chain.
5. Update the dated log with actual values.
6. Verify source and proxy link.
7. Update verification status.
8. Continue only while the plan and cap remain valid.

This is the required `deploy -> document -> verify -> document` loop.

## 8. Deployment-specific state audit

For a local Openwork chain, normally verify:

- bridge owner, endpoint, local/native/main EIDs;
- bridge LOWJC and Athena addresses;
- bridge authorization for LOWJC and Athena;
- LOWJC owner, USDC, EID, bridge, CCTP sender, Athena, and CCTP mint recipient;
- LocalAthena owner, USDC, EID, bridge, CCTP sender, native Athena recipient, native CCTP domain, and job contract;
- each proxy implementation slot;
- reciprocal LayerZero peers and native bridge local-chain authorization.

Adapt the list to actual ABIs instead of assuming getter names.

## 9. Completion boundary

Deployment is not complete until:

- all receipts are successful and documented;
- runtime code and proxy slots match;
- configuration is read back;
- source verification and proxy linking are recorded;
- LayerZero/CCTP routes are audited;
- a minimal end-to-end test succeeds, if approved;
- the live application knows the new chain, if that repository is in scope;
- repository changes are committed, pushed, and clean.
