# XDC Mainnet Job Cycle `30365-3` — July 19, 2026

This is the immutable execution record for the first complete production job cycle after the July 19 replacement-bridge cutover. The cycle used real XDC, real native USDC, LayerZero mainnet messaging, Circle CCTP V2, the production contracts and the public application.

## Result

Status: **complete**.

- Job `30365-3` was posted on XDC and replicated to Arbitrum.
- A separate encrypted test account applied from XDC.
- The giver selected that application and escrowed `0.100000 USDC` on XDC.
- Circle minted the full `0.100000 USDC` into NOWJC on Arbitrum with no inbound CCTP fee.
- The applicant submitted work from XDC.
- The giver released the milestone from XDC.
- The Arbitrum job reached `Completed`, burned `0.100000 USDC` and routed the payment back to XDC.
- Circle charged `0.000014 USDC`; the applicant received `0.099986 USDC` on XDC.
- Every LayerZero message is independently reported as `DELIVERED`, with successful source and destination transactions.
- The public job page renders the job as `1 / 1 Milestones Completed`, `0.10 USDC` paid, `0.10 USDC` received and `0` remaining.

No contract deployment or upgrade occurred during this cycle.

## Actors and live contracts

| Role | Address |
|---|---|
| Giver / deployment signer | `0x7a2B7feAB9b0e30a5368d3cc4cb8279c9606384C` |
| Applicant test account | `0xf8D94BD30EA927c001b1f057b00BB12eD0708a80` |
| XDC LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| XDC replacement bridge | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` |
| XDC CCTP transceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` |
| XDC native USDC | `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1` |
| Arbitrum replacement bridge | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |
| Arbitrum NOWJC proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| Arbitrum Job Genesis proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| Arbitrum native USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |

The applicant exists as encrypted Foundry account `openwork-cycle-applicant`; no plaintext key is stored in the repository or this ledger.

## Job data

| Field | Value |
|---|---|
| Job ID | `30365-3` |
| Title | `OpenWork XDC End-to-End Verification — 19 July 2026` |
| Job-detail CID | `QmdzE2NrrcHWe1sGpdSN8aCipwXWF8pMP6cVGmxyRnWsy8` |
| Milestone CID | `QmY2HMkLp6J1HSF9FWJtFDW8iUePFjNhgK3WCKx1baeY6R` |
| Application CID | `QmXiuRz8X5uuyHZMGfwKz4vcLZRKuTx9vCYd3iFSksY2bo` |
| Submission CID | `QmXiuRz8X5uuyHZMGfwKz4vcLZRKuTx9vCYd3iFSksY2bo` |
| Application ID | `1` |
| Milestone | `100000` USDC units (`0.100000 USDC`) |
| Applicant CCTP preference | Domain `18`, recipient `0xf8D94BD30EA927c001b1f057b00BB12eD0708a80` |
| LayerZero execution options | Type 3, `800000` destination gas: `0x000301001101000000000000000000000000000c3500` |

The submission deliberately reuses the application CID. Both are valid public IPFS objects and the on-chain fields are opaque content hashes.

## XDC source transaction journal

| Step | Sender nonce | Value / token movement | LZ fee | Gas cost | Transaction |
|---|---:|---:|---:|---:|---|
| Swap XDC for USDC through XSwap V2 | Giver `34` | `4 XDC` -> `0.112361 USDC` | — | `0.001818207 XDC` | `0xb045c153021a87438483c2b285bc56151c418f022f1b783b27472090417fb8b3` |
| Fund applicant gas account | Giver `35` | `8.5 XDC` transferred | — | `0.000283500 XDC` | `0x94de673e3b007f663e57b87144d1fb5c5c7f1915d723e67cb5e535112d25860e` |
| Post job | Giver `36` | — | `4.085509222965958401 XDC` | `0.006142676400 XDC` | `0xa26be3d4a93ad1420dc8b3108052a11b4ecc4589dba6818587b91471db5b9d47` |
| Apply to job | Applicant `0` | — | `4.086185350279064388 XDC` | `0.005265216000 XDC` | `0x9bc941006331e287480ae955c2c3d9e12819655e4dd5574540df08a016c7ec19` |
| Approve LOWJC escrow | Giver `37` | Allowance `0.100000 USDC` | — | `0.000767353500 XDC` | `0x12f525762c00f847a966463b6a693adb16ce17d31ea2d28136ff9067e66e4d5a` |
| Start job, application `1` | Giver `38` | `0.100000 USDC` escrowed | `4.078071822521792548 XDC` | `0.008347778250 XDC` | `0x62e2e8b181ded81a440584bb4f257065cc6a90f358dd0a95775a0b14314a2397` |
| Submit work | Applicant `1` | — | `4.079424077148004521 XDC` | `0.005018868000 XDC` | `0x63b24d5406e0b17370db987c609a0bb6184348570a5f9bcb05945a7db8d437a4` |
| Release milestone | Giver `39` | `0.100000 USDC` released | `4.078747949834898535 XDC` | `0.005481634500 XDC` | `0xd6d1a2d434379c55135b05cec8e580e10dd47d9b307f331206b9a5824a990d8c` |

All eight XDC receipts succeeded. Final XDC nonces are giver `40` and applicant `2`.

## LayerZero delivery proof

| Operation | GUID | Arbitrum destination transaction | Final status |
|---|---|---|---|
| Post | `0x604322bd038429dc86991bfe4d01fb9fa80be488e2d582e34286684b04ca85a1` | `0x1a899fd8a6d93b16e6777a62959df032ecff229e675a32d785da28ef42e484ea` | `SUCCEEDED / SUCCEEDED / DELIVERED` |
| Apply | `0xe3cd4315bf503768fac5ce978f26bea97b10737a5d3e8da3db3b43270a692e0c` | `0x0197c8ec7e41328fe21d3ec2500ee97d2295fd8342880ff3b5e7e60ea1ce56fb` | `SUCCEEDED / SUCCEEDED / DELIVERED` |
| Start | `0x661cb5f84c467e8805998e595be2968406abd6cace2266718588b6df5ca6eb68` | `0xc6599e603c1e57ca59166d17bbe28e9c368e62b0fc8a9fc51fc2abb465427079` | `SUCCEEDED / SUCCEEDED / DELIVERED` |
| Submit | `0x58c780d01ea3afdf0e0941dff045d12eda95cb6d8fb247e496d45b298ea8d45f` | `0x33fac84f2667a2176b0c89deccaba61cd2978edbd45b9fd57cd15deccad78c88` | `SUCCEEDED / SUCCEEDED / DELIVERED` |
| Release | `0x6d50a39b5f5ce0ff8f4f6ed762b138eccc5c1431a772efdbbbe1789518567957` | `0xb537ffc6f4fe28db220371d3a5ac015ff75fa9b60642a5c4b51d5ede936ece01` | `SUCCEEDED / SUCCEEDED / DELIVERED` |

The release destination transaction emitted NOWJC `PaymentReleased` for the exact applicant, `100000` units and milestone `1`.

## Circle CCTP proof

### Escrow: XDC to Arbitrum

- CCTP route: domain `18` to domain `3`.
- Burn/source transaction: XDC start transaction `0x62e2e8b181ded81a440584bb4f257065cc6a90f358dd0a95775a0b14314a2397`.
- Amount: `100000` units.
- Executed fee: `0` units.
- Mint recipient: NOWJC `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99`.
- Arbitrum mint transaction: `0xf8578eed7ee5e4164554e6907c836c37dc60557a446007e3245fb958895ee614`.
- NOWJC balance changed from `8117581` to `8217581` units.

### Payment: Arbitrum to XDC

- CCTP route: domain `3` to domain `18`.
- Burn/source transaction: NOWJC release transaction `0xb537ffc6f4fe28db220371d3a5ac015ff75fa9b60642a5c4b51d5ede936ece01`.
- Amount: `100000` units.
- Executed fee: `14` units (`0.000014 USDC`).
- Mint recipient: applicant `0xf8D94BD30EA927c001b1f057b00BB12eD0708a80`.
- XDC mint transaction: `0xccdc16dbab8e7097ac00b99ea13b7b82448f0bbe053f2d549594ef4641fac9fd`.
- Applicant received: `99986` units (`0.099986 USDC`).
- NOWJC returned to its starting `8117581`-unit USDC balance.

Both CCTP messages reached Circle status `complete`. Existing automation completed both mints, so the signer did not spend Arbitrum ETH or additional XDC on manual relay transactions.

## Final state readback

XDC LOWJC `getJob("30365-3")`:

```text
giver      = 0x7a2B7feAB9b0e30a5368d3cc4cb8279c9606384C
status     = 2 (Completed)
locked     = 0
milestone  = 1
amounts    = [100000]
escrowed   = 100000
released   = 100000
```

Arbitrum Genesis `getJob("30365-3")` confirms status `2`, one applicant, application `1`, the expected job/milestone/submission CIDs, selected applicant `0xf8D94BD30EA927c001b1f057b00BB12eD0708a80`, current milestone `1` and total paid `100000`. Application `1` retains preferred CCTP domain `18` and the applicant as its payment recipient.

## Balance reconciliation

| Account / asset | Before cycle | After cycle |
|---|---:|---:|
| Giver XDC | `50.259826635125357208 XDC` | `25.494656490152707724 XDC` |
| Applicant XDC | `0 XDC` | `0.324106488572931091 XDC` |
| Combined XDC | `50.259826635125357208 XDC` | `25.818762978725638815 XDC` |
| Giver XDC-USDC | `0 USDC` | `0.012361 USDC` |
| Applicant XDC-USDC | `0 USDC` | `0.099986 USDC` |

Exact XDC reconciliation:

- `4.000000000000000000 XDC` was exchanged for `0.112361 USDC`; this is converted value, not a network fee.
- `20.407938422749718393 XDC` paid the five LayerZero messaging quotes.
- `0.033125233650000000 XDC` paid all eight XDC execution-gas charges, including the swap and applicant-funding transfer.
- Total combined XDC reduction: `24.441063656399718393 XDC`, exactly matching those three components.
- The `8.5 XDC` applicant funding is an internal transfer, not consumption; the unused `0.324106488572931091 XDC` remains recoverable in the encrypted applicant account.
- USDC conversion output was `0.112361`; final combined USDC is `0.112347`; the exact `0.000014 USDC` difference is Circle's executed return-path fee.

Other signer native balances did not change during the job cycle: Ethereum `0.001492201124679472 ETH`, Arbitrum `0.002018975947237726 ETH`, and Optimism `0.000819327708158739 ETH`.

## Public application proof

- Live page: `https://app.openwork.technology/job-details/30365-3`
- Captured evidence: `references/deployments/evidence/xdc-job-30365-3-live-ui-19-jul-2026.jpg`
- Observed title: `OpenWork XDC End-to-End Verification — 19 July 2026`.
- Observed completion: `1 / 1 Milestones Completed`.
- Observed amounts: `0.10 USDC` paid, `0.10 USDC` received, `0` to be paid.
- Observed actors: giver `0x7a2B....384C`, applicant `0xf8D9....8a80`.

## Operational finding discovered during the cycle

The production `POST /api/ipfs/upload-json` endpoint returned HTTP 500 because the configured Lighthouse credential failed authentication. The backend currently exits on the first configured provider error instead of trying its documented Pinata and self-hosted fallbacks. Direct Pinata upload produced the three public CIDs needed for this cycle before that account reached its plan-usage limit.

This is an off-chain upload-availability issue, not a contract or cross-chain lifecycle failure. Before describing UI job posting as fully reliable, the backend must catch each provider failure, continue to the next provider, and have at least one funded/healthy upload provider. Reads of the uploaded public CIDs and the public job detail page succeeded.
