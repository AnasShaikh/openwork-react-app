# Contract Upgrade Audit Ledger — July 18, 2026

This ledger records the frontend, release-process, and deployed-contract findings discussed during the July 2026 audit. It distinguishes deployed behavior from corrections already committed to `main`; a source correction is not live until the relevant proxy is upgraded and the upgrade is verified on-chain.

## Repository and release baseline

- Contract repository: `AnasShaikh/openwork-contracts-final`
- Working branch: `main`; local `main` and `origin/main` are both at `3b413b9` as of this note.
- No audit branch was created. The unrelated untracked `fundraising/` directory was left untouched.
- Lifecycle corrections are primarily in `068e6f7` (`Harden current mainnet contract lifecycles`).
- Native Athena ABI and dispute validation corrections are in `3b413b9` (`Validate canonical Native Athena disputes`).
- “Present on `main`” does not mean “deployed.” Every proxy upgrade still needs exact bytecode-size, storage-layout, test, ownership, deployment, and explorer-verification checks.

## Frontend and release-process findings

### 1. Arbitrum writes originally targeted core contracts instead of adapters

**Verified behavior:** The production frontend configuration used NOWJC and NativeAthena as Arbitrum write targets. Arbitrum requires the ArbLOWJC and ArbAthenaClient adapters, whose ABIs and control flow differ from the LayerZero-based local-chain contracts.

**Risk:** Calls used incompatible selectors, LayerZero options, and fee quoting. Merely replacing addresses was insufficient.

**Correction discussed:** Route Arbitrum writes through:

- ArbLOWJC: `0x5727cA7326032a8644a49dECECB8388BEF122bef`
- ArbAthenaClient: `0xB5d3F406089236ef9d4aB13306187aFCCA81f099`

Use native adapter ABIs and no-LayerZero paths for Arbitrum. This frontend correction was consolidated into the app's `main` and deployed earlier in the audit session.

### 2. Production source was ahead of the app's default branch

**Verified behavior:** The original claim that XDC existed on no GitHub branch was incorrect; XDC configuration existed in the pushed `fix/remove-setCoreHovered` history and PR #4. However, public `main` was stale while production used newer source.

**Risk:** Normal CI, rollback, reproduction, and auditing did not follow the same source history as production.

**Correction discussed:** Consolidate the deployed source into `main` and use a release commit/tag that maps directly to the production image.

## Deployed contract findings

### 3. Native Athena dispute input and Genesis ABI validation

**Problem discussed:** Native Athena's Genesis `Job` interface must exactly match the deployed Genesis tuple. Dispute creation also needs canonical job validation: job exists, is in progress, raiser is the job giver or selected applicant, and both fee and disputed amount are positive.

**Correction on `main`:** `3b413b9` adds the exact `Job`/`MilestonePayment` ABI and the dispute checks.

**Deployment note:** The Native Athena proxy currently points to implementation `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31`. Its exact source was not available from Blockscout or Sourcify during the latest check, so its runtime must be matched or verified before proposing the final upgrade transaction.

### 4. Deployed ArbLOWJC lifecycle and authorization defects

**Verified deployed implementation:** ArbLOWJC proxy `0x5727cA7326032a8644a49dECECB8388BEF122bef`, implementation `0x309f02301c641627A114D4E5Fb840bAA5C2809D3`.

**Problems discussed:**

- Jobs started at milestone `0` instead of milestone `1`.
- Applicant-proposed milestones could be selected but the original job milestones were still copied/used.
- Work submission lacked selected-applicant, status, and milestone authorization checks.
- Escrow progression and next-milestone handling could diverge from the canonical NOWJC schedule.

**Correction on `main`:** ArbLOWJC v4 initializes milestone `1`, selects the correct final milestone schedule, validates work submission, and hardens release/lock progression.

### 5. Native NOWJC marks any native payment as final

**Verified deployed implementation:** NOWJC proxy `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99`, implementation `0x95036F8Ad9Dd3c7Fe28744E42D24EfDB15c21528`.

**Problem:** Deployed `releasePayment` transfers the supplied amount and unconditionally marks the job `Completed`, even when more milestones remain.

**Correction on `main`:** Validate the current canonical milestone and amount, pay the selected applicant on their recorded chain, and complete only when the final milestone is paid.

### 6. Applicant milestone schedule can diverge from XDC escrow

**Verified deployed XDC implementation:** Local LOWJC proxy `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7`, implementation `0x20Fa268106A3C532cF9F733005Ab48624105c42F`.

**Problem:** XDC forwards `_useAppMilestones` to the native chain but immediately locks funds using the employer's original local `milestoneAmounts`. If applicant-proposed milestones are selected, the canonical native schedule and local escrow schedule can differ.

**Correction discussed:** Use a two-step start flow. NOWJC validates the selected application and returns the canonical final milestone amounts; the local LOWJC stores those returned amounts and only then locks milestone 1. This requires a coordinated local LOWJC, native handler/bridge, and frontend change.

### 7. Cross-chain payment destination is not bound to the selected applicant

**Problem:** The deployed local path lets the job giver provide a target recipient and CCTP domain. Deployed NOWJC validates the job and amount but does not require that the supplied job giver, recipient, and domain match canonical job/application data.

**Risk:** A cross-chain payout can be redirected while the job is still recorded as paid or completed.

**Correction on `main`:** Require:

- `_jobGiver == job.jobGiver`
- `_targetRecipient == job.selectedApplicant`
- `_targetChainDomain == jobApplicantChainDomain[_jobId][job.selectedApplicant]`

Then execute CCTP and finalize payment.

### 8. A job can start with a nonexistent application

**Problem:** The local lite contract cannot validate application records and forwards the supplied application ID. Deployed NOWJC does not require the application to exist, the job to remain open, or `_jobGiver` to match the recorded job giver before mutating state.

**Risk:** Funds can cross to NOWJC before a job becomes stuck in progress with no valid selected applicant.

**Correction on `main`:** In `startJob`, require the recorded job giver, `Open` status, and a nonzero application applicant before any state mutation.

### 9. Combined release-and-lock trusts unvalidated payment data

**Problem:** Deployed NOWJC `releasePaymentAndLockNext` only checks that its caller is an authorized contract and that a selected applicant exists. It does not verify the job giver, `InProgress` status, current milestone, released amount against the current canonical milestone, or locked amount against the next canonical milestone. The locked amount is otherwise used only in the event.

**Risk:** A mismatched local/native schedule or malformed trusted payload can pay the wrong amount and still advance the canonical milestone.

**Correction on `main`:** Run the released amount through `_validateAndCalculatePayment`, require the recorded job giver and an actual next milestone, validate `_lockedAmount` against that next milestone, and only then transfer and increment. This correction is included in the measured 23,722-byte NOWJC build.

## Mandatory bytecode-size release gate

The EIP-170 runtime limit is **24,576 bytes**.

Measured with Solidity `0.8.23`, optimizer enabled, 200 runs, and `via_ir = true`:

| NOWJC implementation | Runtime size | Remaining margin |
|---|---:|---:|
| Currently deployed | 22,957 bytes | 1,619 bytes |
| Corrected `main` | 23,722 bytes | 854 bytes |

The current combined NOWJC corrections fit, but the margin is small. Before every implementation or upgrade:

1. Compile with the exact intended production toolchain and run the size report.
2. Confirm deployed runtime is below 24,576 bytes, not merely that compilation succeeds.
3. Compare storage layout against the live implementation.
4. Run unit, lifecycle, fork, and upgrade rehearsal tests.
5. If size is exceeded, use custom errors, remove duplication, or split functionality behind a deliberately designed contract boundary. Do not omit security validation to save bytecode.
6. Verify the new implementation source and record proxy, implementation, transaction, compiler settings, and commit.

## Status summary

| Finding | Source correction | Live status |
|---|---|---|
| Arbitrum frontend adapter/ABI routing | Consolidated in app `main` | Deployed earlier in session |
| App source/default-branch divergence | Consolidated | Resolved for current app baseline |
| Native Athena ABI/dispute validation | Contract `main` | Proxy upgrade/re-verification pending |
| ArbLOWJC lifecycle/auth checks | Contract `main` | Proxy upgrade pending |
| NOWJC premature completion | Contract `main` | Proxy upgrade pending |
| XDC applicant milestone escrow mismatch | Design agreed; coordinated implementation still needed | Pending |
| Cross-chain payout destination binding | Contract `main` | NOWJC proxy upgrade pending |
| Invalid application start | Contract `main` | NOWJC proxy upgrade pending |
| Combined release-and-lock validation | Contract `main` | NOWJC proxy upgrade pending |
