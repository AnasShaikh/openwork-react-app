# XDC Native-USDC Top-up — 1 August 2026

This record documents the user-approved XSwap V2 conversion performed to fund the first milestone of an OpenWork XDC Direct Contract. It records one XDC mainnet transaction only; no OpenWork contract call was executed as part of this conversion.

## Approved scope and cap

| Field | Value |
|---|---|
| Signer / recipient | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Chain | XDC mainnet (`50`) |
| Call | XSwap V2 `swapExactETHForTokens` |
| Input | `4 XDC` |
| Path | WXDC `0x951857744785E80e2De051c32EE7b25f9c458C42` → native USDC `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1` |
| Minimum output | `102,945` raw units (`0.102945 USDC`) |
| Approved total XDC debit cap | `4.002412747 XDC` |
| Approved transaction count | One |

Immediately before signing, XSwap V2 router `0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9` quoted `105,046` raw USDC units. The exact call estimated `142,978` gas. The submitted transaction retained the approved `178,722` gas limit and `13.5 gwei` gas price, so its maximum debit could not exceed the approved cap.

## Receipt

| Field | Value |
|---|---|
| Transaction | [`0x98510e78171337c586915c6febeb5ac9fedd2b3b7075ca7d59bc35fff0bccbef`](https://xdcscan.com/tx/0x98510e78171337c586915c6febeb5ac9fedd2b3b7075ca7d59bc35fff0bccbef) |
| Status | Success (`1`) |
| Block | `105,611,238` |
| Block time | `2026-08-01 18:07:36 UTC` / `23:37:36 IST` |
| Sender nonce | `43` |
| Router | `0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9` |
| XDC input | `4.000000000000000000 XDC` |
| Native USDC output | `105,046` raw units (`0.105046 USDC`) |
| Gas used | `117,582` |
| Effective gas price | `13.5 gwei` |
| Actual gas cost | `0.001587357 XDC` |
| Actual total XDC debit | `4.001587357 XDC` |
| Cap headroom | `0.000825390 XDC` |

The canonical native-USDC `Transfer` log moved exactly `105,046` units from XSwap pair `0xf490b8574a7d7063027b5e77b721b8418c62784a` to the signer. No ETH was spent.

## Post-state readback

| Field | Before | After |
|---|---:|---:|
| XDC balance | `14.408383992369856637` | `10.406796635369856637` |
| Native XDC USDC | `0.012361` | `0.117407` |
| Account nonce | `43` | `44` |
| USDC allowance to LOWJC | `0.100000` | `0.100000` |
| LOWJC job counter | `4` | `4` |

The wallet now has enough native XDC USDC for the planned `0.1 USDC` first milestone, and the existing allowance to LOWJC `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` is sufficient. Creating the Direct Contract remains a separate user-signed OpenWork transaction with its own XDC/LayerZero fee.
