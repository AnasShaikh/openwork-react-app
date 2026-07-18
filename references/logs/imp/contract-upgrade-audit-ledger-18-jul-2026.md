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

### 10. Standalone next-milestone locking trusts the adapter payload

**Problem:** Deployed NOWJC `lockNextMilestone` ignores its `_caller` argument and does not check that the job is `InProgress` or that `_lockedAmount` matches the next canonical milestone. It only checks that another milestone exists, increments the milestone, and emits the supplied amount.

**Risk:** A malformed or inconsistent authorized-adapter payload can advance the canonical job without the correct next-milestone funding.

**Correction on `main`:** Require `_caller == job.jobGiver`, require `InProgress` status, validate `_lockedAmount` against the next canonical milestone amount, and increment only after every check passes. This correction is included in the measured 23,722-byte NOWJC build.

### 11. Empty or zero-value milestone schedules are accepted

**Problem:** The deployed XDC local LOWJC permits posting jobs with empty milestone arrays or zero-value milestones, and deployed NOWJC only checks that milestone description and amount array lengths match. An empty schedule therefore passes the canonical boundary.

**Risk:** A user can pay the cross-chain message fee and create an unusable job that can never start because the local start path later accesses milestone zero. Zero-value schedules can also create invalid payment lifecycles.

**Correction on `main`:** At both the local entry point and NOWJC canonical boundary, require at least one milestone, equal description/amount lengths, and every milestone amount greater than zero. Apply the same checks to applications and direct contracts.

### 12. Applications are accepted for nonexistent or closed jobs

**Problem:** Deployed NOWJC `applyToJob` does not require the job to exist or have `Open` status. Because local lite contracts do not store the canonical application state, they forward the request and rely on NOWJC for this validation.

**Risk:** Users can pay cross-chain fees to create application records for invalid, in-progress, completed, or cancelled jobs, corrupting canonical application data and producing an unusable experience.

**Correction on `main`:** Require a nonzero applicant, an existing job ID, and `Open` job status before duplicate checks or any Genesis mutation. This correction is included in the measured 23,722-byte NOWJC build.

### 13. Cross-chain ratings are not authorized against the job

**Verified deployed path:** The local LOWJC forwards any caller-supplied rating. NativeProfileManager validates only that the call came through an authorized bridge and that the rating is 1–5; it does not validate job existence/status or the relationship between rater and rated user. NativeProfileGenesis overwrites `jobRatings[jobId][user]` and appends every submission to `userRatings` without a duplicate guard.

**Risk:** Any local-chain user can rate arbitrary addresses for arbitrary job IDs and can submit repeatedly, corrupting reputation data.

**Correction discussed:** Validate canonically in NativeProfileManager that the job exists and is completed, and that the rater/rated pair is exactly job giver/selected applicant in either direction. Reject an existing rating before writing. Add a defense-in-depth no-overwrite check in NativeProfileGenesis. This correction is not yet implemented on `main` and needs its own tests and final size measurement.

### 14. Disputed-fund releases are not bound to a job escrow

**Verified deployed behavior:** NOWJC `releaseDisputedFunds` accepts only recipient, amount, and target domain. It receives no job or dispute ID, transfers from NOWJC's shared USDC balance, and emits the literal ID `"dispute"` for every release. The current `main` source has the same behavior.

**Risk:** NOWJC cannot prove that the released funds belong to the disputed job, constrain the payout to that job's escrow, or produce job-specific payout accounting. One job's settlement can consume liquidity deposited for another job if the shared balance is otherwise sufficient.

**Correction discussed:** Pass the canonical job/dispute ID into the payout path, maintain and decrement a per-job escrow ledger, and validate the finalized winner, recipient, domain, and amount against canonical dispute/job state before transfer. Because corrected NOWJC has only 854 bytes of EIP-170 margin, this likely needs a deliberately separated escrow/payout module plus a small NOWJC integration rather than a large inline addition. This correction is not yet implemented.

**Decision — July 19, 2026:** Defer implementation pending owner review and further discussion. The escrow ownership model, treatment of partial and multiple disputes, interaction with milestone payments/refunds, migration of existing pooled funds, and the trust/upgrade boundary of any separate escrow module must be finalized before code or an upgrade proposal is prepared. No implementation is authorized until that review is complete.

### 15. LocalAthena dispute minimum and preservation of multiple disputes

**Verified deployed behavior:** Optimism and XDC LocalAthena proxies both use implementation `0xF78B688846673C3f6b93184BeC230d982c0db0c9` and have `minDisputeFee = 50,000,000` (50 USDC). Deployed `raiseDispute` nevertheless accepts any positive fee. Multiple disputes for one job are intentional: NativeAthena creates a separate canonical dispute ID for each one by appending the per-job counter.

**Identifier clarification:** A canonical dispute ID and a job ID are different identifiers. The local `disputeFees[jobId]` and `jobDisputeExists[jobId]` values are remnants of the old local fee-settlement path; overwriting that local record does not overwrite the distinct canonical dispute records stored by NativeAthena/Genesis.

**Correction on `main`:** Minimum-fee enforcement remains in source, subject to the testing decision below. The one-dispute-per-job guards added during this audit were incorrect and have been removed from both LocalAthena and ArbAthenaClient. Job-party and status validation remains in ArbAthenaClient and at the canonical NativeAthena boundary; those checks do not prevent multiple distinct disputes by valid job parties.

**Decision — July 18, 2026:** Keep the effective minimum dispute fee low during end-to-end testing. Do not activate the current `main` minimum-fee enforcement while the proxies still hold a 50 USDC configured minimum unless `minDisputeFee` is first deliberately lowered. Production fee selection and enforcement are deferred and must be revisited before release. Any limit on aggregate disputed value belongs in canonical per-job escrow accounting, not in a local boolean that prohibits multiple dispute IDs.

### 16. Retracted — native-to-local settlement callback requirement

**Clarification:** Appending the final numeric counter, for example converting job `30365-1` into dispute `30365-1-1`, is intentional and correct. It permits multiple canonical disputes for one job. The counter must not be removed from the canonical dispute record.

**Verified deployed path:** The live NativeAthena proxy points to implementation `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31`. Its settlement path finalizes the canonical dispute, handles the native payout and fee outcome, and emits `DisputeFinalized`, but does not dispatch `finalizeDisputeWithVotes` through the configured native bridge. The live runtime also does not contain the native bridge's `sendToLocalChain(string,string,bytes,bytes)` selector.

**Reassessment — July 19, 2026:** The absence of this callback is not, by itself, an error. Under the current CCTP architecture, NativeAthena/Genesis is authoritative for each dispute, NativeAthena holds and distributes dispute fees, and NOWJC sends the disputed payout directly to the winning chain. A local LayerZero callback is not required to complete that financial settlement. Automatically completing the base job after settling one dispute would also conflict with the deliberate multiple-dispute model.

**Conclusion:** Do not add the previously proposed callback without a separate, explicit product decision that a dispute outcome must transition replicated job state. The actual release-blocking concern is job-bound disputed-fund accounting in finding 14.

### 17. Dormant legacy finalization handler

**Verified code path:** The deployed local bridge and LocalAthena still contain the older `finalizeDisputeWithVotes` receiver. It is not called by the normal current NativeAthena settlement path. If invoked, it passes a dispute ID into state and functions keyed as jobs and attempts to route fees that were already routed to NativeAthena when the dispute was raised.

**Conclusion:** Treat this as dormant legacy code, not as evidence that dispute IDs should be converted into job IDs. Do not repair it by stripping the dispute counter. If a future synchronization feature needs both identities, its payload and storage must carry the canonical dispute ID and job ID as separate explicit fields with separately defined effects.

**Live status:** No upgrade is recommended solely for this dormant path. Remove or redesign it only as part of a deliberate dispute/job lifecycle change.

### 18. DAO delegation counts the same stake twice

**Verified deployed path:** NativeOpenworkDAO proxy `0x24af98d763724362DC920507b351cC99170a5aa4` uses implementation `0x20Fa268106A3C532cF9F733005Ab48624105c42F`; ETHOpenworkDAO proxy `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` uses implementation `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59`. In both implementations, `delegate` adds the staker's power to the delegatee, while `_getVotes` continues counting the same stake as the delegator's own power. Self-delegation is also not rejected or treated as a no-op.

**Risk:** One stake can produce voting power for both its owner and delegatee; self-delegation can directly double the owner's displayed and usable voting power. Governance quorum and proposal outcomes can therefore be calculated from duplicated voting units.

**Correction discussed:** Count each stake exactly once: either with its owner or with its current delegatee, never both. The robust implementation should use checkpointed delegation so Governor reads the ownership/delegation state at the proposal snapshot. The deployed NativeOpenworkDAO runtime is 24,217 bytes (359-byte EIP-170 margin), and ETHOpenworkDAO V2 is 23,730 bytes (846-byte margin), so the exact correction must be compiled and size-checked before an upgrade is selected. No correction has been implemented yet.

## Mandatory bytecode-size release gate

The EIP-170 runtime limit is **24,576 bytes**.

Measured with Solidity `0.8.23`, optimizer enabled, 200 runs, and `via_ir = true`:

| NOWJC implementation | Runtime size | Remaining margin |
|---|---:|---:|
| Currently deployed | 22,957 bytes | 1,619 bytes |
| Corrected `main` | 23,722 bytes | 854 bytes |

The XDC local LOWJC size was also checked with the same production compiler settings:

| XDC local LOWJC implementation | Runtime size | Remaining margin |
|---|---:|---:|
| Currently deployed | 14,078 bytes | 10,498 bytes |
| Corrected `main` | 14,484 bytes | 10,092 bytes |

Current deployed headroom for the rating correction is ample, but corrected artifacts must still be measured:

| Rating-path implementation | Runtime size | Remaining margin |
|---|---:|---:|
| NativeProfileManager | 8,683 bytes | 15,893 bytes |
| NativeProfileGenesis | 7,466 bytes | 17,110 bytes |

LocalAthena was measured separately with Solidity 0.8.23 and the production optimizer settings:

| LocalAthena implementation | Runtime size | Remaining margin |
|---|---:|---:|
| Deployed on Optimism and XDC | 12,872 bytes | 11,704 bytes |
| Current `main` with multiple disputes preserved | 12,690 bytes | 11,886 bytes |

The current `main` ArbAthenaClient runtime is 7,213 bytes with 17,363 bytes of margin under the same Solidity 0.8.23 production settings.

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
| Standalone next-milestone lock validation | Contract `main` | NOWJC proxy upgrade pending |
| Empty/zero-value milestone validation | Contract `main` | Local LOWJC and NOWJC proxy upgrades pending |
| Application job existence/status validation | Contract `main` | NOWJC proxy upgrade pending |
| Canonical rating authorization and duplicate prevention | Not yet implemented | ProfileManager/ProfileGenesis upgrades pending |
| Job-bound disputed-fund accounting | Deliberately deferred; no implementation authorized | Owner review and final design decision required |
| Local dispute minimum enforcement | Contract `main`; intentionally deferred for testing | Revisit and configure before production |
| Multiple disputes per job | Preserved on contract `main`; incorrect local guards removed | Canonical counter-based IDs remain authoritative |
| Native-to-local dispute settlement synchronization | Retracted as a requirement | No upgrade recommended without a separate lifecycle decision |
| Legacy local finalization receiver | Dormant; no current-path correction recommended | Redesign only if local job synchronization is intentionally introduced |
| DAO delegation double-counts stake | Not yet implemented | Native and Ethereum DAO upgrade design pending; strict size limits apply |

## Explicit pre-production flags

- [ ] Choose the production dispute minimum.
- [ ] Set `minDisputeFee` consistently on Optimism and XDC.
- [ ] Confirm the deployed LocalAthena implementation enforces that configured value.
- [ ] Test below-minimum, exact-minimum, multiple-dispute, settlement, and fee-refund paths before enabling production enforcement.
- [ ] Owner to review and finalize the job-bound escrow accounting model before any implementation or upgrade proposal.
