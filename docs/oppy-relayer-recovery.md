# Oppy relayer readiness and Circle recovery

This document defines the application boundary for OpenWork transactions that depend on a backend-funded Circle CCTP receive. It covers the preflight, live status model and the non-custodial fallback that lets a user finish a stalled receive with their connected wallet.

## What is checked

Before a relayer-dependent action, the backend derives the public service-wallet address from `WALL2_PRIVATE_KEY` and checks the destination chain through redundant RPCs:

- the service wallet is configured;
- the destination receiver contract has deployed bytecode;
- native gas balance is at least the larger of the chain floor and a gas-price-derived allowance;
- the RPC can return balance, gas price and contract code.

Oppy checks before any USDC approval and the shared write service checks again immediately before the source action. Legacy pages without an in-page recovery control stop before their first signature when automatic delivery is unavailable. Oppy may continue only for actions with a validated wallet-recovery path and tells the user this before signing.

These checks do not invoke Bedrock or another model. They use short-lived in-process caching and read-only chain/API calls, so routine polling does not consume generative-AI credits.

| Action | Automatic destination receive | Oppy wallet fallback |
|---|---:|---:|
| `startDirectContract` from Optimism/XDC | Arbitrum | Yes |
| `releasePayment` from Optimism/XDC to Optimism/XDC | Payment destination | Yes |
| `startJob` from Optimism/XDC | Arbitrum | Not yet; preflight blocks when unavailable |
| `lockNextMilestone` from Optimism/XDC | Arbitrum | Not yet; preflight blocks when unavailable |
| `settleDispute` to Optimism/XDC | Payment destination | Not yet; preflight blocks when unavailable |
| Native/no-CCTP writes | None | Not applicable |

The thresholds can be overridden with `RELAYER_ARB_MIN_WEI`, `RELAYER_OP_MIN_WEI` and `RELAYER_XDC_MIN_WEI`. Defaults intentionally include operational headroom rather than estimating only one transaction.

## Status stages

The transaction card polls transaction-scoped evidence and never infers completion from a generic job status:

1. source transaction confirmation;
2. LayerZero destination delivery;
3. canonical OpenWork job/payment state;
4. Circle attestation availability;
5. Circle destination nonce consumption;
6. destination relayer readiness when the nonce remains unused.

RPC or provider failures are `unavailable`, LayerZero reverts are `failed`, and a completed Circle attestation plus an unused nonce plus unavailable relayer is `requires-action`. The latter state replaces the indefinite spinner with a reason and a `Complete with my wallet` control. Once an attestation is ready, the same race-safe control is also available while automatic delivery is healthy, so a user can choose to finish immediately instead of depending on a background worker.

## Wallet-assisted receive

`POST /api/oppy/cctp-recovery` returns a transaction plan only after the server:

- resolves the Circle source transaction from the original OpenWork action;
- proves that a direct-contract source transaction called the configured OpenWork contract and emitted the requested job ID;
- obtains a complete Circle attestation;
- verifies the expected destination domain;
- verifies that direct-contract funding mints to the configured NOWJC escrow;
- proves that the destination nonce is unused;
- fixes the transaction target to the configured MessageTransmitter or CCTP transceiver.

The browser switches to the destination chain and refetches the recovery plan before it performs a static call, estimates gas, checks the user's native-token balance and asks the selected wallet to sign the one-time destination receive. EIP-1559 destinations use a ceiling derived from the latest block base fee with five-times headroom; the same ceiling is used for the affordability check. Legacy destinations use a padded live gas price. After any send error, Oppy reads the plan again so a relayer race becomes `already completed`, not a duplicate. A fee-cap rejection proven to have happened before broadcast is explicitly safe to retry; unknown outcomes remain retry-protected. No private key, arbitrary destination or arbitrary calldata is accepted from the browser.

The source OpenWork transaction must never be replayed during this recovery. The user pays only destination gas; Circle delivers the already-burned USDC. No new USDC approval is required.

## Existing stalled transactions

Oppy persists confirmed source receipts separately from ephemeral transaction cards. After a reload or deployment it restores an incomplete direct-contract or release tracker only when it belongs to the active job above the composer. Completing the active job never exposes an unrelated older tracker. Therefore an attested, unconsumed transaction can be resumed in the same wallet-scoped chat without recreating the job, while historical unresolved work remains available through an explicit job request.

## Operator runbook

1. Open the job in Oppy and select **Check now**.
2. If the status is **Needs attention**, inspect the displayed chain and relayer reason.
3. Fund the displayed service wallet for automatic recovery, or select **Complete with my wallet**.
4. Use the destination chain requested by Oppy and confirm the receive transaction.
5. Wait for the card to refresh to its completed state. Never submit the original job/direct-contract/release action again.

For investigation, compare the source explorer, LayerZero, Circle status and destination explorer links on the same card. A consumed Circle nonce is authoritative proof that another relayer or user already executed the receive.

## Limitations

- A wallet completion cannot be prepared until Circle publishes a complete attestation.
- The user's wallet needs enough destination-chain native currency for one receive transaction.
- Wallet recovery currently covers direct-contract funding and release payouts tracked by Oppy; unsupported CCTP actions fail before signing when the service wallet is unavailable.
- Public RPC and Circle/LayerZero APIs remain external dependencies. Redundant RPCs reduce outages but cannot eliminate them; unavailable reads never become false success.
