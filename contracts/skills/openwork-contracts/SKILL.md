---
name: openwork-contracts
description: Safely build, audit, deploy, upgrade, verify, configure, and document the Openwork smart-contract system across Arbitrum, Optimism, Ethereum, XDC, and additional EVM chains. Use for Openwork contract addresses and source mapping, Foundry deployments, UUPS upgrades, LayerZero peer/DVN/executor configuration, Circle CCTP routing, chain registration, mainnet transaction planning, spending caps, post-deployment audits, cross-chain job tests, verification status, and live-contract registry maintenance.
---

# Openwork Contracts

Use this skill as the operating procedure for Openwork contract work. Treat every mainnet write as real-money production work and every live address as untrusted until confirmed from both the repository and the chain.

## Start Here

These contracts live in the OpenWork monorepo alongside the web application and its
backend. Work from the repository root; the contract tree is `contracts/` and all
Foundry commands run from there. Paths below are written from the repository root.

The contracts were a standalone `openwork-contracts-final` repository, checked out at
`/Users/anas/openwork-manual`, until 3 August 2026. That repository is retired. If you
find that checkout on disk, do not work in it and do not treat it as current — see
`docs/repository-consolidation-2026-08-03.md`.

Read these repository sources before proposing or executing changes:

1. `contracts/references/logs/imp/live-contract-registry-19-mar-2026.md` — canonical live address, implementation, source-file, peer, and verification registry.
2. `contracts/references/logs/imp/mainnet-verification-tracker.md` — verification history and explorer links.
3. The newest relevant dated log in `contracts/references/logs/`.
4. The exact current source under `contracts/src/suites/current-mainnet/` and any related deployment script or broadcast receipt.

Do not use older address summaries, snapshots, or historical logs as the live source of truth merely because their filenames look relevant.

Because the application ships its own copies of the addresses, an address change is not
complete until `src/config/chainConfig.js`, `docs/mainnet-contracts.json`, and
`backend/config.js` all agree with the live registry.

Load the references in this skill according to the task:

- Repository orientation or address questions: `references/repository-map.md`.
- Any deployment or paid configuration: `references/deployment-runbook.md`.
- LayerZero, CCTP, peers, DVNs, executors, or chain registration: `references/cross-chain-configuration.md`.
- Proxy upgrade or post-upgrade integrity check: `references/upgrade-and-audit.md`.
- Explorer verification, live registry, logs, or publishing: `references/documentation-and-verification.md`.
- XDC continuation or status: `references/live-xdc-mainnet-13-jul-2026.md` plus the repository's two XDC logs.

## Non-Negotiable Safety Rules

### Protect keys

- Never ask the user to paste a private key into chat.
- Accept a private key only through a terminal environment variable or an encrypted Foundry keystore.
- Never print, echo, log, serialize, commit, or interpolate the key into documentation.
- Disable shell tracing before sourcing secrets. Inspect commands for accidental expansion.
- A MetaMask EVM account uses one private key across EVM networks; chain labels do not create separate keys.
- Normalize a missing `0x` prefix only in memory if the tool requires it.
- Derive and compare the signer address before any transaction without exposing the key.

### Protect deployed source history

- Never modify the source file corresponding to an already deployed implementation.
- If behavior must change, copy the latest deployed source to a clearly named, dated file and change only the copy.
- Give the new Solidity contract class a unique version/date name where verification would otherwise be ambiguous.
- Preserve the old source, address, implementation, and verification record.
- An unchanged contract may be deployed from the same source; the copy rule applies when changing it.

### Protect funds

- Before writes, state the exact contracts, calls, target chains, native values, expected transaction count, and conservative maximum spend in plain English.
- Obtain explicit approval for the plan and cumulative cap.
- Treat the cap as cumulative across deployment, configuration, testing, and LayerZero message fees—not only gas.
- Requote immediately before sending. Stop before any transaction that could make cumulative spend exceed the cap.
- If scope, chain, call data, value, security configuration, or cap changes, pause and obtain fresh approval.
- Once a grouped sprint is approved, continue within that exact scope and cap without repeatedly asking for each transaction.
- Do not bridge or swap funds unless separately authorized. Prefer existing balances when sufficient.

## Execution Workflow

Follow this sequence:

1. **Establish truth.** Confirm branch/worktree, live registry, latest log, explorer status, chain IDs, LayerZero EIDs, CCTP domains, endpoints, tokens, owners, admins, proxy implementations, nonces, and balances.
2. **Map the change.** List reused contracts, dated copies, new implementations, proxies, initializer arguments, configuration writes, reciprocal writes, verification targets, and application changes.
3. **Check compatibility.** Compile with the exact compiler/EVM/optimizer settings; compare ABIs; test changed behavior; check runtime size; and compare upgrade storage layouts.
4. **Rehearse.** Run unit tests and simulate on forks or a disposable chain. Rehearse against live state for upgrades and configuration calls.
5. **Price and approve.** Estimate all paid calls and cross-chain fees with a safety margin. Present the plain-English plan and cap.
6. **Execute in checkpoints.** Use the cycle `deploy -> receipt/state audit -> document -> verify -> document`. Stop at user-requested boundaries.
7. **Wire both directions.** Configure peers, authorizations, LayerZero send/receive security stacks, and CCTP domain routing. Read every effective value back.
8. **Audit upgrades.** Recheck implementation slot and all critical configurations; do not assume proxy storage survived just because the upgrade succeeded.
9. **Prove delivery.** Quote first, then send the smallest meaningful cross-chain test. Verify source receipt, LayerZero GUID/status, destination receipt, and destination application state.
10. **Publish evidence.** Update the live registry, verification tracker, dated execution log, source/script/tests, and application configuration if that repository is in scope. Commit only reviewed files and finish with a clean worktree.

## Decision Rules

- A reciprocal `setPeer` is necessary but not sufficient for LayerZero readiness. Check effective send library, receive library, executor, confirmations, required/optional DVNs, ordering, and both directions.
- A successful source-chain receipt is not proof of cross-chain success. Require destination delivery and application-state readback.
- An upgrade receipt is not proof of preserved configuration. Compare important values before and after.
- A verified implementation is not the same as a linked and verified proxy. Record both.
- The on-chain `NativeContractRegistry` is not automatically authoritative. Use it only when current logs and live state prove it is maintained.
- XDC addresses may use `xdc...` display format, but Foundry and Solidity use the equivalent `0x...` EVM address.
- XDC supports Circle Standard Transfer as a source path in this deployment, not Fast Transfer. Preserve the legacy ABI only where application compatibility requires it.
- If the next required write is on another chain and the user asked to stop there, stop after documenting the boundary.

## Expected Output

For status or planning, report:

- what is live and verified;
- what is connected versus merely peered;
- exact remaining paid calls;
- expected spend and cap headroom;
- any external application or infrastructure work still required.

For completed work, report:

- addresses and transaction hashes;
- verification and proxy-link status;
- cumulative per-chain spend;
- test/delivery evidence;
- documentation and commit/push status;
- explicit remaining limitations.
