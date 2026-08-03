# Arbitrum Relay Wallet Funding — 2 August 2026

## Scope

One approval-gated Arbitrum One native-ETH transfer funded the OpenWork relay wallet. No contract call, CCTP receive, bridge operation, token transfer, proxy change, or configuration write was included.

| Field | Value |
|---|---|
| Chain | Arbitrum One (`42161`) |
| Signer | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Recipient | `0x93514040f43aB16D52faAe7A3f380c4089D844F9` |
| Value | `0.0005 ETH` (`500,000,000,000,000 wei`) |
| Approved cumulative cap | `0.000503 ETH` |
| Transaction | `0x2c0fb66b2ecc585741473a9d43d7c85fd9e622f4b52b4dc4f89e82041f391d61` |
| Block | `490,274,056` (`0x1d38fd08`) |
| Timestamp | `2026-08-02 08:48:10 UTC` / `14:18:10 IST` |
| Receipt status | Success (`1`) |
| Gas used | `21,072` |
| Effective gas price | `20,000,000 wei` |
| Actual fee | `0.00000042144 ETH` |
| Total spend | `0.00050042144 ETH` |

## Post-transaction readback

- Signer nonce advanced exactly once from `254` to `255`.
- Signer balance is `0.001474224775417726 ETH`.
- Relay balance increased from `0.0000002717649591 ETH` to `0.0005002717649591 ETH`.
- The outstanding Circle destination nonce `0x797f935601d2a4885a20c1c154dd977f2154ef91ad3452c86e27db8e7c870bf1` remains unused on Arbitrum (`usedNonces = 0`). Funding did not execute the separate `receiveMessage` call.

## Boundary

The approved action ended after the funding receipt and state readback. Completing the pending CCTP mint is a separate mainnet write and requires its own reviewed call plan and approval.
