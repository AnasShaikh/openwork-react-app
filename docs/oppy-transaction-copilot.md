# Oppy transaction copilot

## Purpose

Oppy's transaction copilot keeps wallet and OpenWork transaction recovery inside
`/chat`. It gives a non-technical user a short explanation and next step, while an
expandable technical view exposes the observed wallet, chain, phase, transaction hash,
RPC reachability, latest block and nonce queue.

The copilot is an observer and coordinator. It never signs, switches networks,
approves tokens or sends a transaction during diagnosis. Every write still requires an
explicit click in Oppy followed by the selected wallet's secure confirmation.

## Architecture

The lifecycle crosses five deliberately small boundaries:

1. `src/services/txReliability.js` wraps each Web3 `PromiEvent` and reports
   `transactionHash` and `receipt` events before the awaited send completes.
2. `src/services/localChainService.js` uses that wrapper for every write exposed by
   Oppy. `src/services/oppyActionService.js` uses the same wrapper for USDC approval.
3. `src/services/transactionDiagnostics.js` creates a sanitized attempt record,
   classifies provider failures and performs read-only wallet/RPC/receipt/nonce checks.
4. `TransactionCard` in `src/pages/OppyChat/OppyChat.jsx` renders the simple diagnosis,
   protected retry state, live check control and expandable technical detail.
5. `src/services/oppyMemory.js` stores the latest sanitized attempt per connected
   wallet together with the exact last validated action that produced it. `/api/chat`
   validates both records so questions such as “what happened?” are answered from
   observed state and safe retry commands can recreate the same review card.

No private key, seed phrase, signature, raw calldata or browser-extension console log
is collected. The record is bounded and contains only action metadata, public wallet
state, public transaction identifiers, sanitized error text and read-only checks.

## State and retry rules

| Observed state | Meaning | Retry |
|---|---|---|
| `preparing` | Local/IPFS/preflight work is running | Protected |
| `failed` before any write adapter is entered | Wallet connection, chain switch, metadata or other preparation stopped before submission | Allowed; nothing was broadcast |
| `wallet` | The selected wallet has not returned a hash | Protected while the request is open |
| `pending` | The network knows the transaction | Protected; wait or use the wallet's speed-up flow |
| `confirmed` | A successful receipt exists | Never retry |
| `reverted` | A failed receipt exists | Allowed after the user fixes the cause |
| `cancelled` | The wallet returned an explicit user rejection | Allowed; nothing was broadcast |
| `dropped` | A known hash is absent after at least 30 seconds and three independent checks | Allowed |
| `unknown` | Wallet/RPC evidence is incomplete or contradictory | Protected; check again |

Approval and OpenWork action hashes are separate substeps. This is important for
funded workflows: an approval may confirm while the contract action fails or is still
waiting. A retry reruns the authoritative allowance read, so an already sufficient
approval is reused instead of requested again.

The UI never unlocks retry merely because a timer elapsed. A timer starts a read-only
check; only an explicit cancellation, reverted receipt or sufficiently verified drop
can make retry safe.

## Native balance and full-cost preflight

Every write routed through `buildEstimatedWriteSendOptions` now fails closed before
the injected wallet opens. The shared preflight reads the sender's native balance and
gas price from the configured read-only RPC (with public XDC, Optimism and Arbitrum
fallbacks), then compares it with:

```text
required native funds = payable LayerZero quote + buffered gas limit × fee ceiling
```

This distinction is essential on XDC. The source-chain gas charge may be small, but a
LayerZero message can require several XDC as `msg.value`. Copy such as “1–2 XDC should
be enough” is therefore prohibited unless a fresh exact quote proves it. If the live
balance is below `msg.value`, Oppy stops even before gas estimation. If every read-only
RPC is unavailable, the check also stops rather than opening a wallet request with an
unknown outcome.

`localChainService` emits the sanitized funding snapshot before the wallet phase:
balance, total requirement, message value, buffered gas cost, shortfall, symbol and
timestamp. `transactionDiagnostics` persists those public fields in bounded wallet
memory. A later balance question is answered deterministically by
`backend/services/oppy-native-balance.js`, which refreshes the public on-chain balance
without using the canonical job indexer. If the latest action has a funding snapshot,
Oppy can give an exact yes/no comparison; otherwise it reports the live balance and
states that the current action must first receive its dynamic quote.

The wallet prompt is created only after quote, balance and gas preflight succeed. A
`NATIVE_BALANCE_TOO_LOW` or `NATIVE_BALANCE_UNAVAILABLE` error is proven
pre-broadcast, records that no transaction was submitted and permits a safe retry
after the user tops up or RPC connectivity returns.

When the client has explicitly marked an attempt safe, natural-language commands such
as “try again”, “retry it”, “go ahead” and “can you retry?” recreate the exact previous
validated review card. This path is deterministic and does not depend on the model
choosing to call a tool. A safety question such as “is it safe to retry?” remains
read-only. If the previous outcome is pending or unknown, Oppy keeps retry protected
and does not recreate an executable card.

## What Oppy can diagnose

- Whether the selected injected wallet is reachable and connected.
- Whether the wallet is still on the action's network and account.
- Whether the configured public RPC is returning current blocks.
- Whether a transaction is confirmed, reverted, pending or repeatedly absent.
- Whether the wallet's pending nonce is ahead of its confirmed nonce, indicating a
  queue that can make later writes appear stuck.
- Whether failure copy indicates cancellation, insufficient native gas, USDC funding,
  a contract revert, wallet/RPC failure or an unresolved outcome.
- The live native-token balance and, after an action quote, whether it covers the full
  payable value plus buffered source-chain gas.
- Which substep is active: USDC approval or the OpenWork contract action.

Oppy automatically checks a wallet phase after 12 seconds and a broadcast phase after
8 seconds. The user can run `Check live status` at any time. The latest result is also
available to the assistant on the next chat message.

## Hard limitations

- Browser wallets do not expose their private confirmation UI or internal extension
  queue. Before a hash exists, Oppy can verify connection and network but cannot know
  whether the user is reading, ignoring or unable to see a wallet prompt.
- An RPC can briefly omit a valid mempool transaction. Oppy therefore requires
  repeated misses and time before declaring a hash dropped.
- A pending transaction cannot be safely replaced by the application without wallet
  support and the user's signature. Oppy directs the user to the wallet's speed-up or
  cancel controls instead.
- A revert reason is not guaranteed to be available from a mined receipt. Sanitized
  wallet/provider detail is shown when present; otherwise the user must review job
  state and inputs.
- Cross-chain source confirmation is not destination delivery. Existing
  `CrossChainSyncStatus` continues tracking LayerZero/CCTP/canonical state separately.
- Oppy cannot recover from an unavailable wallet extension, chain-wide RPC outage or
  missing native gas without an external state change by the user or provider.

## Maintenance and extension

When adding a new Oppy write:

1. Route the contract call through `sendTrackedContractMethod`.
2. Emit `step: 'approval'` for prerequisite token approval and `step: 'action'` for
   the OpenWork write.
3. Never classify a generic provider error as retry-safe if a broadcast outcome is
   unknown. Track whether the write adapter was entered so connection and network-
   switch failures can be distinguished from errors after a submission attempt.
4. Add the action to the bounded backend sanitizer only if new public diagnostic fields
   are required; never forward arbitrary client objects into the model prompt.
5. Keep the write on `buildEstimatedWriteSendOptions`; bypassing it also bypasses the
   native-funding guard. Emit the wallet phase only after the builder succeeds.
6. Add tests for pending, confirmed, reverted, cancelled, dropped and RPC-unavailable
   behavior as applicable.

## Verification

Run:

```bash
npm test
npm --prefix backend test
npm run build
git diff --check
```

Primary coverage lives in `tests/transactionDiagnostics.test.js`,
`tests/txReliability.test.js`, `tests/oppyMemory.test.js`,
`tests/contractWriteRouter.test.js`, `backend/tests/chat.test.js`,
`backend/tests/oppy-native-balance.test.js` and
`backend/tests/oppy-job-context.test.js`.

Browser QA must exercise simple and expanded technical states at desktop and 390 px,
confirm no horizontal overflow and verify that an unsafe failure disables `Retry
safely`. Use mocks or a rejected wallet request; production QA must not approve USDC,
sign a write or move funds.
