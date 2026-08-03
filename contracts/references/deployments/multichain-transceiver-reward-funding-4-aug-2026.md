# Multi-chain Transceiver Reward Funding — 4 August 2026

## Result and boundary

All five user-approved mainnet transactions succeeded from deployer `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`:

1. raised the XDC transceiver maximum confirmer reward from `0.001 XDC` to `0.01 XDC`;
2. funded the XDC relay wallet with `0.22 XDC`;
3. funded the XDC transceiver reward pool with `0.30 XDC`;
4. funded the Arbitrum transceiver reward pool with `0.0004 ETH`;
5. funded the Optimism transceiver reward pool with `0.00002 ETH`.

Execution stopped after these five receipts and their state readbacks. No CCTP message was received, no USDC moved, no LayerZero or CCTP route changed, and no proxy, implementation, peer, DVN, executor, admin, owner, or application configuration changed.

## Preflight and approval

The local `XDC_DEPLOYER_KEY` derived to the intended public signer before every write. The private key was not printed or added to repository content.

| Check | Result |
|---|---|
| XDC chain ID | `50` |
| Arbitrum chain ID | `42161` |
| Optimism chain ID | `10` |
| XDC transceiver owner | deployer |
| XDC deployer admin | `true` |
| XDC maximum reward before | `1,000,000,000,000,000 wei` = `0.001 XDC` |
| Reward pools before | `0` on XDC, Arbitrum, and Optimism |
| XDC relay balance before | `0 XDC` |

The exact call and all four native transfers succeeded under `eth_call`. Live gas estimates were `31,092`, `21,000`, `21,072`, `21,738`, and `21,227` gas in transaction order.

The user explicitly approved five transactions with cumulative ceilings of:

- `0.522 XDC` on XDC;
- `0.000403 ETH` on Arbitrum;
- `0.000025 ETH` on Optimism;
- `0.000428 ETH` combined across Arbitrum and Optimism.

## Paid transaction sequence

| # | Chain | Time (IST) | Nonce | Action / value | Transaction | Gas and fee | Total debit |
|---:|---|---|---:|---|---|---|---:|
| 1 | XDC | `2026-08-04 00:23:37` | `46` | `setMaxRewardAmount(10000000000000000)` on `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510`; value `0` | [`0x2dd98a8d970d80e585bc39a73e0cb5fd042136f0ffd5ca9e10f546d6b49a23c3`](https://xdcscan.com/tx/0x2dd98a8d970d80e585bc39a73e0cb5fd042136f0ffd5ca9e10f546d6b49a23c3) | `31,092` at `13 gwei`; `0.000404196 XDC` | `0.000404196 XDC` |
| 2 | XDC | `2026-08-04 00:24:13` | `47` | send `0.22 XDC` to relay `0x93514040f43aB16D52faAe7A3f380c4089D844F9` | [`0x278b23446094e62b2db5e10bd512f1a1a05f743d98f3aba0e77e5290dc2e149c`](https://xdcscan.com/tx/0x278b23446094e62b2db5e10bd512f1a1a05f743d98f3aba0e77e5290dc2e149c) | `21,000` at `13 gwei`; `0.000273 XDC` | `0.220273 XDC` |
| 3 | XDC | `2026-08-04 00:24:23` | `48` | send `0.30 XDC` to transceiver `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | [`0x61bf0c3f56ce9f03ed2c2b19111a6aa96a1e6215298ec5f9ba7809bfa32f1a17`](https://xdcscan.com/tx/0x61bf0c3f56ce9f03ed2c2b19111a6aa96a1e6215298ec5f9ba7809bfa32f1a17) | `21,072` at `13 gwei`; `0.000273936 XDC` | `0.300273936 XDC` |
| 4 | Arbitrum | `2026-08-04 00:24:44` | `255` | send `0.0004 ETH` to transceiver `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | [`0x6b08697136a75eb895f701582af5de42346920e9eca1727e7ad26817da4d522b`](https://arbiscan.io/tx/0x6b08697136a75eb895f701582af5de42346920e9eca1727e7ad26817da4d522b) | `21,420` at `0.02 gwei`; `0.0000004284 ETH` | `0.0004004284 ETH` |
| 5 | Optimism | `2026-08-04 00:25:25` | `328` | send `0.00002 ETH` to transceiver `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | [`0x0596815287e7779721715a47b9afe9ef463397446806889241b8f104b8f7b987`](https://optimistic.etherscan.io/tx/0x0596815287e7779721715a47b9afe9ef463397446806889241b8f104b8f7b987) | L2: `21,062` at `0.01 gwei`; L1 fee `0.000000002736239051 ETH`; total fee `0.000000213356239051 ETH` | `0.000020213356239051 ETH` |

Every receipt returned status `1`. Transaction senders, nonces, targets, values, and calldata were read back from their respective chains.

## Cumulative spend

| Chain | Approved ceiling | Actual debit | Unused headroom |
|---|---:|---:|---:|
| XDC | `0.522 XDC` | `0.520951132 XDC` | `0.001048868 XDC` |
| Arbitrum | `0.000403 ETH` | `0.0004004284 ETH` | `0.0000025716 ETH` |
| Optimism | `0.000025 ETH` | `0.000020213356239051 ETH` | `0.000004786643760949 ETH` |
| Combined ETH | `0.000428 ETH` | `0.000420641756239051 ETH` | `0.000007358243760949 ETH` |

Receipt-cost calculations matched the signer balance deltas on every chain.

## Final state readback

| Chain / account | Final state |
|---|---:|
| XDC transceiver `maxRewardAmount()` | `10,000,000,000,000,000 wei` = `0.01 XDC` |
| XDC transceiver reward pool | `0.30 XDC` |
| XDC relay wallet | `0.22 XDC` |
| XDC deployer nonce / balance | `49` / `0.187435007663122227 XDC` |
| Arbitrum transceiver reward pool | `0.0004 ETH` |
| Arbitrum deployer nonce / balance | `256` / `0.001073796375417726 ETH` |
| Optimism transceiver reward pool | `0.00002 ETH` |
| Optimism deployer nonce / balance | `329` / `0.000799114351919688 ETH` |

At the final XDC verification gas context, `calculateCurrentReward()` returned `0.005 XDC`, below the new `0.01 XDC` safety cap. The actual dynamic reward remains gas-price-dependent.

All XDC results were independently reproduced through `https://rpc.xinfin.network`, Arbitrum through `https://1rpc.io/arb`, and Optimism through `https://optimism-rpc.publicnode.com`.

## Source and verification status

No source copy, compilation, deployment, upgrade, or explorer submission was required. The existing verified standalone contracts remain mapped to:

- XDC: `src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol`;
- Arbitrum and Optimism: `src/suites/current-mainnet/utilities/cctp-transceiver.sol`.

The live registry addresses and explorer verification statuses are unchanged. The verification tracker therefore requires no status change.
