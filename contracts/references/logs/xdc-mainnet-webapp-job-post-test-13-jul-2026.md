# XDC Mainnet Production Webapp Job Test — 13 July 2026

**Status:** PASS — production webapp job `30365-2` was posted on XDC, delivered through LayerZero, and stored correctly in Arbitrum Genesis.

**Job giver:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

**Submission method:** The user confirmed the transaction directly in MetaMask from `app.openwork.technology`. The verification and documentation work after submission was read-only and sent no additional transaction.

## Source transaction — XDC

| Field | Value |
|---|---|
| Job ID | `30365-2` |
| Transaction | `0xf9b88e09488de62bbb92572492c74268dccf445bea6279d672fc458963a57d09` |
| Block | `104865574` |
| Timestamp | `2026-07-13 06:03:35 UTC` / `11:33:35 IST` |
| From | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| To | XDC LOWJC proxy `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| Nonce | `18` |
| Receipt | Success (`1`) |
| XDC LOWJC counter after receipt | `2` |

Decoded `postJob(...)` inputs:

| Field | Value |
|---|---|
| Job details CID | `QmX5N2bmDxcYBZbcbdRYv4FWkR1i99j4a5UfBW5J7eMUta` |
| Milestone CID | `QmX4zE4xZ5hb2RziNdSCG9esANo55vUgGrTXFkfW7mSnxd` |
| Milestone amount | `500,000` units (`0.5 USDC` nominal; no USDC moved while posting) |
| Destination execution gas | `500,000` |

Both CIDs returned HTTP `200` from the Pinata IPFS gateway. The job metadata resolves to title and description `XDC Dev`, skill `XDC`, the correct job giver, the milestone CID, and total compensation `0.5`. The milestone metadata resolves to `Milestone 1` with amount `0.5`.

## LayerZero delivery

| Field | Value |
|---|---|
| GUID | `0x6e75481de82c9527faab41f47b5899058906ab1ddd3d05594968b3ac6299aeff` |
| Pathway | XDC EID `30365` → Arbitrum EID `30110` |
| Pathway nonce | `2` |
| Sender | XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| Receiver | Arbitrum bridge `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Final status | `DELIVERED` |
| Destination transaction | `0xcf5f406e94942db276958e2828c8e5ce9f8271d32209a84610fc24e1202ad6a0` |
| Destination block | `483326609` |
| Destination receipt | Success (`1`) |
| Delivery timestamp | `2026-07-13 06:04:35 UTC` / `11:34:35 IST` |

The message delivered about 60 seconds after the XDC source block. The screenshot taken around 18 seconds after the source block therefore showed a normal in-flight state, not a failed or stuck transaction.

## Arbitrum application-state proof

Read-only checks against Genesis `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` and NOWJC `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` confirmed:

- `jobExists("30365-2") == true`;
- job ID is `30365-2`;
- job giver is the submitting wallet;
- job details and milestone CIDs exactly match the XDC payload;
- the milestone amount is `500,000`;
- job status is `Open` (`0`);
- no applicant, selected applicant, or payment target is set;
- `getJobsByPoster(jobGiver)` includes `30365-2`.

## Exact XDC spend

| Component | Cost |
|---|---:|
| LayerZero message value | `4.797152596971259807 XDC` |
| Source gas (`481,702` at `12.625 gwei`) | `0.006081487750000000 XDC` |
| **Total wallet spend** | **`4.803234084721259807 XDC`** |
| Wallet balance after receipt | `50.383926152756555326 XDC` |

The live LayerZero fee rose from the earlier read-only estimate of `3.689440924669622025 XDC` to `4.797152596971259807 XDC` by submission time. LayerZero quotes are dynamic. The wallet-confirmed transaction exceeded the earlier `2 XDC` working cap; no further XDC transaction was sent during verification.

## Explorer links

- [XDC source transaction](https://xdcscan.com/tx/0xf9b88e09488de62bbb92572492c74268dccf445bea6279d672fc458963a57d09)
- [LayerZero message](https://layerzeroscan.com/tx/0xf9b88e09488de62bbb92572492c74268dccf445bea6279d672fc458963a57d09)
- [Arbitrum destination transaction](https://arbiscan.io/tx/0xcf5f406e94942db276958e2828c8e5ce9f8271d32209a84610fc24e1202ad6a0)
