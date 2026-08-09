# XDC Native-USDC Test Funding — 10 August 2026

This record documents the user-approved XSwap V2 conversion used to fund a
minimal OpenWork XDC job test. It records one XDC mainnet transaction only. No
OpenWork contract call, LayerZero message, CCTP transfer or ETH transaction was
submitted as part of this conversion.

## Approved scope and cap

| Field | Value |
|---|---|
| Signer / recipient | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Chain | XDC mainnet (`50`) |
| Router | XSwap V2 `0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9` |
| Call | `swapExactETHForTokens` |
| Input | Exactly `4 XDC` |
| Path | WXDC `0x951857744785E80e2De051c32EE7b25f9c458C42` → native USDC `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1` |
| Final quote | `107,487` raw USDC units (`0.107487 USDC`) |
| Minimum output | `106,412` raw USDC units (`0.106412 USDC`, 1% slippage protection) |
| Gas estimate / limit | `142,978` / `178,723` |
| Submitted gas price | `15 gwei` legacy |
| Approved maximum cumulative debit | `4.003 XDC` |
| Approved transaction count | One |

Before submission, chain ID `50`, router bytecode, six-decimal native USDC,
signer balance, token balance and nonce were read back. The encrypted Foundry
account `openwork-deployer` derived the exact approved signer address. Latest
and pending nonces both equalled `49`, so no nonce gap was present. The maximum
possible debit at the fixed gas limit and gas price was `4.002680845 XDC`, below
the approved cap.

## Receipt

| Field | Value |
|---|---|
| Transaction | [`0x269c8307c5cbb906be6059c97ae4029b06bd800386da2b077813e1427919f957`](https://xdcscan.com/tx/0x269c8307c5cbb906be6059c97ae4029b06bd800386da2b077813e1427919f957) |
| Status | Success (`1`) |
| Block | `105,910,725` |
| Block time | `2026-08-10 00:47:18 IST` |
| Sender nonce | `49` |
| Router | `0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9` |
| XDC input | `4.000000000000000000 XDC` |
| Native USDC output | `107,487` raw units (`0.107487 USDC`) |
| Gas used | `117,582` |
| Effective gas price | `15 gwei` |
| Actual gas cost | `0.001763730 XDC` |
| Actual total XDC debit | `4.001763730 XDC` |
| Cap headroom | `0.001236270 XDC` |

The canonical native-USDC `Transfer` log moved exactly `107,487` units from
XSwap pair `0xf490b8574a7d7063027b5e77b721b8418c62784a` to the signer.

## Balance reconciliation

| Asset / state | Before | After |
|---|---:|---:|
| Native XDC | `30.187435007663122227` | `26.185671277663122227` |
| Native XDC-USDC | `0.017407` | `0.124894` |
| Account nonce | `49` | `50` |

The final USDC balance is sufficient for a proven `0.10 USDC` OpenWork test
milestone. Applicant gas funding and every OpenWork job transaction remain
separate scopes. The temporary owner-only keystore-password file was deleted
immediately after the receipt and was absent before post-state verification.
