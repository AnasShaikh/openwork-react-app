# Arbitrum Direct Contract Job `42161-24` — 7 August 2026

## Result and scope

Production job `42161-24` completed a one-milestone Direct Contract cycle entirely
on Arbitrum One. The job giver approved and escrowed `0.10 USDC`; the release call
then transferred the same `0.10 USDC` from NOWJC to the selected applicant. Both
job stores report `Completed`, no USDC remains locked for this job, and the public
Release Payment page renders the contract-recorded final state with both payment
buttons disabled.

This was a user-authorized production application test. It did not deploy, upgrade
or configure a contract, and it did not use LayerZero, CCTP or the relay wallet.

## Live contracts and actors

| Role | Address / value |
|---|---|
| Chain | Arbitrum One (`42161`) |
| NativeArbOpenWorkJobContract proxy | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| NativeOpenWorkJobContract (NOWJC) proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| NativeOpenworkGenesis proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| Native Arbitrum USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Job giver | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Selected applicant | `0x921858bf1B4c03952D911eAbf7f33061e93b5A73` |
| Applicant payment domain | `3` (Arbitrum) |
| Job metadata CID | `QmWnSe2heNxvndLfvUzyZ7Kd5ixdB7NZhDhp7HH6D36a29` |
| Milestone metadata CID | `QmYcNk1J2Y32BGyK5JR27vgm9Za7JqrPyPZzH5SHQbW5CE` |
| Milestone amount | `100000` raw USDC = `0.10 USDC` |

## Confirmed transaction sequence

All three receipts returned status `1`.

| Step | Time (IST) | Block | Transaction | Gas used | Effective gas price | Fee |
|---|---|---:|---|---:|---:|---:|
| Approve `100000` USDC to ArbLOWJC | 17:09:10 | `492037079` | [`0xeb22e70eb05c58bee69213617a863f11a8302a626ae50521745f1062d499200a`](https://arbiscan.io/tx/0xeb22e70eb05c58bee69213617a863f11a8302a626ae50521745f1062d499200a) | `55,870` | `0.020056 gwei` | `0.000001120528720 ETH` |
| Start Direct Contract and escrow milestone 1 | 17:09:19 | `492037114` | [`0x849928f9b1d14a59f4ec5dcf4c00f898d6e0580697b3312db30356a7a13c6ab3`](https://arbiscan.io/tx/0x849928f9b1d14a59f4ec5dcf4c00f898d6e0580697b3312db30356a7a13c6ab3) | `1,694,931` | `0.020022 gwei` | `0.000033935908482 ETH` |
| Release milestone 1 | 17:09:42 | `492037207` | [`0x3b5bd9f729dd7d247cc4cfa8a26892ab17e4f28a5967c543d1f132144ee5c444`](https://arbiscan.io/tx/0x3b5bd9f729dd7d247cc4cfa8a26892ab17e4f28a5967c543d1f132144ee5c444) | `361,343` | `0.020024 gwei` | `0.000007235532232 ETH` |

Total gas debit for approval, creation and release was
`0.000042291969434 ETH`. The Direct Contract start confirmed nine seconds after
approval, and payment release confirmed 23 seconds after the start transaction.

## Token-transfer proof

The start receipt contains the canonical Arbitrum USDC `Transfer` event:

```text
from   0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
to     0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
amount 100000
```

The release receipt contains the corresponding payout:

```text
from   0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
to     0x921858bf1B4c03952D911eAbf7f33061e93b5A73
amount 100000
```

The recipient's aggregate USDC balance after the release was `200000` raw units.
That balance can include other payments; the release receipt's job-specific
`100000`-unit transfer is the authoritative proof for `42161-24`.

## Final contract state

ArbLOWJC `getJob("42161-24")` returned:

```text
status                2 (Completed)
totalPaid             100000
currentLockedAmount   0
currentMilestone      1
selectedApplicant     0x921858bf1B4c03952D911eAbf7f33061e93b5A73
selectedApplicationId 1
totalEscrowed         100000
totalReleased         100000
```

Genesis independently returned status `2`, total paid `100000`, current milestone
`1`, application `1`, and the same selected applicant. NOWJC returned applicant
payment domain `3`, so the release correctly used the same-chain USDC transfer
path rather than LayerZero or CCTP.

## Public UI evidence

- Page: `https://app.openwork.technology/release-payment/42161-24`
- Screenshot: `contracts/references/deployments/evidence/arbitrum-job-42161-24-release-ui-7-aug-2026.png`
- Screenshot SHA-256: `bd6b25ffe2704247b4558d8c037b24856935ce28ae79a17073e16cbc6fd8d8ca`
- Capture time: 17:09:59 IST, 17 seconds after the release receipt.

The page visibly reports `0.10 USDC` total budget, `0.10 USDC` released, `0`
locked, and the notice: `Payment release is recorded on OpenWork. No further
payment action is required.` Both Release and Lock Next render disabled at zero.

## Boundary and interpretation

- This record proves the current native-Arbitrum Direct Contract and release path.
- The payment itself completed on-chain in 23 seconds from contract start; there
  was no long-running bridge or relay stage.
- This job is separate from the dropped wallet-broadcast attempts recorded for
  job `42161-23`; no transaction hash from that incident is reused here.
- No live address, implementation, peer, DVN, executor, owner, commission setting
  or explorer-verification status changed, so the live contract registry and
  verification tracker require no address/status update.
