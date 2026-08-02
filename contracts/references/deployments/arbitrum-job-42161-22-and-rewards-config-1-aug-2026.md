# Arbitrum Job `42161-22` Release and Rewards Configuration — 1 August 2026

This record captures the production Arbitrum payment-release verification, the single owner configuration transaction used to remove the caught internal referrer-lookup reverts, and the related backend recovery correction. All addresses, transaction fields and state values below were read from Arbitrum One (chain ID `42161`).

## Result

- Job `42161-22` completed successfully through the production web-app contract path.
- Exactly `100,000` raw USDC units (`0.1 USDC`, six decimals) moved from NOWJC to the selected applicant on Arbitrum.
- The NativeRewards contract now points to the current ProfileGenesis proxy.
- The configuration transaction spent `946,592,200,000 wei` (`0.0000009465922 ETH`), below the approved `0.00001 ETH` cumulative cap.
- No payment was replayed after configuration; the already-completed job was verified read-only.

## Web-app payment release

| Field | Verified value |
|---|---|
| Transaction | [`0x94062ead40b636aa80d1cbb5ab07ebcb6de055ccd2354753f9f7627c06aba387`](https://arbiscan.io/tx/0x94062ead40b636aa80d1cbb5ab07ebcb6de055ccd2354753f9f7627c06aba387) |
| Time | 2026-08-01 21:18:51 IST |
| Block | `490030762` |
| Receipt | `status = 1` (success) |
| Signer/job giver | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Web-app target | ArbLOWJC `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| Decoded input | `releasePayment("42161-22")` |
| Native value | `0 ETH` |
| Gas | `356,564` at effective `20,000,000 wei`; fee `7,131,280,000,000 wei` (`0.00000713128 ETH`) |

The canonical USDC `Transfer` log was emitted by Arbitrum native USDC `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`:

| Field | Value |
|---|---|
| From | NOWJC `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| To | Selected applicant `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` |
| Amount | `100,000` raw units = `0.1 USDC` |

The receipt also contains the expected `PaymentReleased`, `CommissionDeducted` with zero commission, `JobStatusChanged` to `Completed`, and NativeRewards `TokensEarnedInBand` logs. The reward log credits the job giver with `30,000,000,000,000,000,000` token units (`30 OWORK`) in band `0`.

### Post-payment readback

ArbLOWJC `getJob("42161-22")` returned:

- status `2` (`Completed`)
- `totalPaid = 100000`
- `currentLockedAmount = 0`
- `currentMilestone = 1`
- selected applicant `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724`
- `totalEscrowed = 100000`
- `totalReleased = 100000`

NOWJC `getJob("42161-22")` independently returned status `2`, `totalPaid = 100000`, milestone `1`, and the same selected applicant. These state reads and the token log prove the escrow was released once to the intended recipient and is no longer locked.

## NativeRewards ProfileGenesis configuration

Before the owner write, `NativeRewardsContract.profileGenesis()` returned the zero address. Payment still completed because the rewards code catches failed legacy referrer lookups, but the transaction trace contained caught internal reverts. A fork of the exact pre-payment block (`490030761`) rehearsed the configuration plus the payment call: the release succeeded, transferred exactly `0.1 USDC`, completed the job and credited the reward without internal referrer-lookup reverts.

The approved mainnet write was:

| Field | Verified value |
|---|---|
| Transaction | [`0x16f8f091f1477a99da3b8e02a2772de7bf4fdb98d086f4e6fb55b8336df92859`](https://arbiscan.io/tx/0x16f8f091f1477a99da3b8e02a2772de7bf4fdb98d086f4e6fb55b8336df92859) |
| Time | 2026-08-01 22:49:59 IST |
| Block | `490052621` |
| Receipt | `status = 1` (success) |
| Signer | owner `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` |
| Target | NativeRewardsContract `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` |
| Call | `setProfileGenesis(0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E)` |
| Calldata | `0xa2a67a9f000000000000000000000000794809471215cba5ce56c7d9f402edd85f9eba2e` |
| Native value | `0 ETH` |
| Nonce | `253`; signer advanced exactly once to `254` |
| Enforced limit | `60,000` gas at `100,000,000 wei`, maximum `0.000006 ETH` |
| Actual charge | `46,861` gas at effective `20,200,000 wei` = `0.0000009465922 ETH` |

Post-transaction readback:

- `NativeRewardsContract.profileGenesis()` = `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E`
- ProfileGenesis `owner()` = `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`
- signer balance decreased by exactly the receipt fee, from `1,975,592,807,617,726` to `1,974,646,215,417,726 wei`

The private key was entered only through Foundry's local hidden `--interactive` prompt. It was not placed in chat, a command argument, a file, shell history or repository content.

## Backend recovery correction

Application commit `6426381b58f199511eff9a9d3919885507525574` prevents the backend listener from treating the indexed hash of the dynamic `PaymentReleased(string)` field as a decoded job ID. Native Arbitrum releases are skipped because they require no CCTP relay; decoded cross-chain IDs continue into the relay path; processing is deduplicated by transaction and marked complete only after success.

Verification and deployment:

- frontend tests `35/35`, backend tests `17/17`, and production build passed
- CodeBuild `openwork-react-app-prod-build:76b5762d-a7a6-4e22-9f69-55162854a580` succeeded
- image `openwork-app:prod-6426381-20260801160952`
- digest `sha256:a0d2f88c41fb970aad3e83f3c7630dd3983a358e13abbce1bde1df4cb33c0d74`
- App Runner operation `daf7d10193fe432aa20466d42a44bb66` succeeded
- public `/healthz`, `/`, and `/direct-contract` returned HTTP 200
- the 5,000-block startup scan completed without replaying the indexed topic hash into the CCTP flow

The managed backend still reports two pre-existing operational warnings: no external persistence database and a critically low relay-wallet ETH balance. Neither warning affects this native Arbitrum payment, which completed entirely on Arbitrum without a backend relay. Funding the relay wallet or provisioning persistence requires separate authorization.
