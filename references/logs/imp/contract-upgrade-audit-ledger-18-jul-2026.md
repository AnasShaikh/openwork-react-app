# Contract Upgrade Audit Ledger — July 18, 2026

This ledger records the frontend, release-process, and deployed-contract findings discussed during the July 2026 audit. It distinguishes deployed behavior from corrections already committed to `main`; a source correction is not live until the relevant proxy is upgraded and the upgrade is verified on-chain.

## Repository and release baseline

- Contract repository: `AnasShaikh/openwork-contracts-final`
- Working branch: `main`; audit changes are committed and pushed directly to `origin/main` in recoverable intermediate states.
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

**Correction on `main` — July 19, 2026:** The coordinated two-step flow is implemented only in versioned successors: Local LOWJC V3 (copied from V2), NOWJC V5 (copied from V4), LocalLZOpenworkBridge V2 (copied from V1), and the already-versioned NativeLZOpenworkBridge V2; all original baselines remain untouched. Applicant-milestone starts leave the local job `Open`, record the pending application, and send no USDC. NOWJC validates the exact application, starts the canonical job with the applicant schedule, and returns the canonical amounts through a native-to-local LayerZero callback. Local V3 authenticates the callback, replaces its schedule, and only then pulls/sends milestone 1. Insufficient allowance reverts the callback without changing local state so LayerZero delivery can be retried. Employer-milestone starts retain the immediate existing path. The native bridge requires configured per-local-chain callback options and a funded native-fee reserve; an empty reserve rolls back the native handler mutation. Six proxy-upgrade/lifecycle tests pass under the production Solidity 0.8.23 via-IR pipeline. Three LayerZero round-trip/authentication/reserve tests pass under Solidity 0.8.29 because LayerZero's bundled Foundry helper triggers a compiler-internal Yul stack exception under 0.8.23; the production bridge artifacts themselves compile and are size-measured under 0.8.23 via-IR.

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

**Correction on `main` — July 19, 2026:** `native-profile-manager-v3.sol` is an exact-copy successor to the deployed-source `native-profile-manager-v2.sol`, and `native-profile-genesis-v2.sol` is an exact-copy successor to deployed-source `native-profile-genesis.sol`; the original files remain untouched. Manager v3 adds a separately configured canonical job-Genesis dependency, requires an existing completed job, requires the rater/rated pair to be exactly job giver/selected applicant in either direction, and rejects duplicate ratings before storage. ProfileGenesis v2 independently rejects empty IDs, zero users, out-of-range values, and overwrites. The new dependency consumes one reserved ProfileManager gap slot (slot 7); all prior slots are unchanged. Eight proxy-upgrade and rating-path tests pass, including old-state preservation and independent one-time ratings in both directions.

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

**Correction on `main` — July 19, 2026:** Versioned ETH DAO V3 and Native DAO V2 successors count an active stake either for its owner or its delegatee, reject self-delegation, and checkpoint both affected accounts on delegation changes. Historical originals remain untouched. The voting checkpoint logic is isolated in `openwork-voting-power-checkpoints-v1.sol` because both DAO implementations are close to EIP-170.

### 19. DAO voting power ignores proposal snapshots

**Verified deployed path:** Both deployed DAOs advertise an ERC-6372 timestamp clock, but their `_getVotes(address, uint256, bytes)` implementations ignore the supplied `timepoint`. They instead read the account's current stake, delegated power, and reward power.

**Risk:** Voting power gained or moved after a proposal's snapshot can still count on that proposal. Proposal voting and quorum can therefore be calculated from mutable current state instead of the fixed historical state Governor expects.

**Correction on `main`:** Both versioned DAOs use an external, DAO-bound timestamp checkpoint module and return historical power at the Governor timepoint. Permissionless migration/sync functions seed current accounts after upgrade. At the July 19 read-only check, neither DAO had an active proposal, so no pre-upgrade proposal snapshot needs retroactive voting power. This must be rechecked immediately before deployment.

### 20. Delegated voting power survives stake reduction or withdrawal

**Verified deployed path:** In ETHOpenworkDAO, both full `unstake` and governance `removeStake` reduce or delete the delegator's stake without reducing `delegatedVotingPower` or clearing `delegates`. On the native DAO, `updateStakeData` replaces the synced stake in Genesis without reconciling an existing delegation. Genesis likewise changes the stake record independently of its delegated-power aggregate.

**Risk:** A delegatee can retain voting power backed by stake that has been withdrawn, deleted, or reduced. A later redelegation can also calculate adjustments from the new stake rather than the amount originally delegated, leaving the aggregate inconsistent.

**Correction on `main`:** ETH DAO V3 reconciles delegated power before stake reduction, clears full-withdrawal delegation, and checkpoints the delegator and delegatee. `native-dao-stake-sync-v1.sol` applies monotonically versioned Ethereum stake updates, adjusts the old and new delegated amounts atomically in Genesis, rejects stale/replayed versions, clears delegation on full withdrawal, and synchronizes affected checkpoints.

### 21. Native DAO blocks delegated-only voters

**Verified deployed path:** NativeOpenworkDAO `_getVotes` includes `genesis.getDelegatedVotingPower(account)`, but `canVote` checks only the account's own active stake or reward power. `_castVote` rejects the vote unless `canVote(account)` succeeds. This was reproduced on a local Arbitrum mainnet fork against proxy `0x24af98d763724362DC920507b351cC99170a5aa4` and its live implementation `0x20Fa268106A3C532cF9F733005Ab48624105c42F`: a test delegatee had 100 OW of delegated Governor voting power, zero own stake, zero reward power, and `canVote == false`. No live transaction was sent.

**Risk:** Delegated voting power becomes unusable unless the delegatee independently satisfies the personal stake or reward threshold, contradicting the effective power reported to Governor.

**Correction on `main`:** Native DAO V2 evaluates eligibility from the same checkpointed stake/reward components used by Governor, so delegated-only power is usable when it meets the configured threshold.

### 22. Ethereum DAO does not enforce its configured voting threshold

**Verified deployed path:** ETHOpenworkDAO proxy `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` uses implementation `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` and currently exposes `votingThresholdAmount = 50e18`. Its `_castVote` does not check that threshold. The value is used by the eligibility view but not by the Governor vote-acceptance path.

**Risk:** Voting power below the configured minimum can still be recorded and counted, while the frontend eligibility result can disagree with the contract's actual behavior.

**Correction on `main`:** ETH DAO V3 requires effective power at the proposal snapshot to meet `votingThresholdAmount` before accepting a vote.

### 23. Ethereum governance notifications can be duplicated or bypassed

**Verified deployed path:** The custom payable `castVote(uint256,uint8,bytes)` sends a governance notification and then calls the overridden `_castVote`, which attempts another notification whenever `msg.value > 0`. If the DAO has enough balance, the same governance action can be sent twice. Conversely, inherited standard Governor entry points do not consistently use the custom payable notification and proposal-list tracking paths.

**Risk:** A single governance action can increment cross-chain activity twice, or a valid action can omit the expected notification or local proposal-list entry depending on which ABI entry point is used.

**Correction on `main`:** ETH DAO V3 preserves the standard Governor/Tally entry points and records each proposal/vote notification once in the separate `eth-dao-messaging-v1.sol` module. Notification sending is idempotent and permissionless after recording, and a second send reverts. Stake updates and governance notifications each use one bridge send path.

### 24. Cross-chain stake synchronization fails silently

**Verified deployed path:** ETHOpenworkDAO's `_sendStakeDataCrossChain` returns when fee quotation fails and silently catches LayerZero send failures. The surrounding `stake`, completed `unstake`, and governance `removeStake` operations still succeed locally. The January test log also records a stake transaction that succeeded without producing the expected LayerZero stake message.

**Risk:** Native DAO can miss a new stake or, more seriously, retain stake and voting power after the Ethereum stake was reduced or withdrawn. Local and native governance state can diverge without an actionable pending record.

**Correction on `main`:** The selected behavior is fail-closed at the Ethereum boundary: stake/unstake/removeStake reverts if the LayerZero quote or send cannot be accepted, so local state cannot silently diverge. `ETHDAOMessaging` assigns monotonically increasing per-staker versions, and `NativeDAOStakeSync` rejects stale/replayed deliveries and applies delegation reconciliation before checkpointing.

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
| V3 applicant-milestone synchronization | 16,286 bytes | 8,290 bytes |

The coordinated callback artifacts were measured with the same production settings:

| Applicant-milestone callback artifact | Runtime size | Remaining margin |
|---|---:|---:|
| NOWJC V5 | 23,898 bytes | 678 bytes |
| NativeLZOpenworkBridge V2 | 20,448 bytes | 4,128 bytes |
| LocalLZOpenworkBridge V2 | 10,079 bytes | 14,497 bytes |

The DAO correction and its separated modules were measured with the same production settings:

| DAO artifact | Runtime size | Remaining margin |
|---|---:|---:|
| ETHOpenworkDAO V3 | 24,264 bytes | 312 bytes |
| NativeOpenworkDAO V2 | 23,918 bytes | 658 bytes |
| OpenworkVotingPowerCheckpoints V1 | 4,557 bytes | 20,019 bytes |
| ETHDAOMessaging V1 | 5,781 bytes | 18,795 bytes |
| NativeDAOStakeSync V1 | 4,073 bytes | 20,503 bytes |

NativeAthena V5 is **24,516 bytes**, leaving only **60 bytes**. It fits the limit but is effectively closed to further inline changes; any edit requires a new versioned successor and a repeated exact-toolchain size check.

Current deployed headroom for the rating correction is ample, but corrected artifacts must still be measured:

| Rating-path implementation | Runtime size | Remaining margin |
|---|---:|---:|
| NativeProfileManager (deployed V2) | 8,683 bytes | 15,893 bytes |
| NativeProfileManager V3 correction | 10,696 bytes | 13,880 bytes |
| NativeProfileGenesis (deployed V1) | 7,466 bytes | 17,110 bytes |
| NativeProfileGenesis V2 correction | 7,799 bytes | 16,777 bytes |

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
| XDC applicant milestone escrow mismatch | Coordinated versioned implementation on `main`; 9 upgrade/lifecycle/LayerZero tests pass | Local/NOWJC upgrades, two bridge deployments, callback options/reserve configuration, and UI state handling pending |
| Cross-chain payout destination binding | Contract `main` | NOWJC proxy upgrade pending |
| Invalid application start | Contract `main` | NOWJC proxy upgrade pending |
| Combined release-and-lock validation | Contract `main` | NOWJC proxy upgrade pending |
| Standalone next-milestone lock validation | Contract `main` | NOWJC proxy upgrade pending |
| Empty/zero-value milestone validation | Contract `main` | Local LOWJC and NOWJC proxy upgrades pending |
| Application job existence/status validation | Contract `main` | NOWJC proxy upgrade pending |
| Canonical rating authorization and duplicate prevention | Versioned ProfileManager V3/ProfileGenesis V2 corrections on `main`; 8 upgrade/lifecycle tests pass | ProfileManager/ProfileGenesis upgrades and canonical job-Genesis initialization pending |
| Job-bound disputed-fund accounting | Deliberately deferred; no implementation authorized | Owner review and final design decision required |
| Local dispute minimum enforcement | Contract `main`; intentionally deferred for testing | Revisit and configure before production |
| Multiple disputes per job | Preserved on contract `main`; incorrect local guards removed | Canonical counter-based IDs remain authoritative |
| Native-to-local dispute settlement synchronization | Retracted as a requirement | No upgrade recommended without a separate lifecycle decision |
| Legacy local finalization receiver | Dormant; no current-path correction recommended | Redesign only if local job synchronization is intentionally introduced |
| DAO delegation double-counts stake | Versioned DAO corrections on `main` | Module deployments, proxy upgrades, and migration pending |
| DAO voting power is not snapshotted | Shared checkpoint module and versioned DAO integrations on `main` | Deploy two checkpoint proxies, upgrade DAOs, seed current accounts |
| Delegated voting power survives stake reduction | ETH DAO V3 and NativeDAOStakeSync V1 on `main` | Coordinated module/bridge configuration pending |
| Native delegated-only voters are blocked | Native DAO V2 on `main` | Proxy upgrade and checkpoint migration pending |
| Ethereum voting threshold is not enforced | ETH DAO V3 on `main` | Proxy upgrade pending |
| Ethereum governance notification entry points diverge | ETHDAOMessaging V1 + ETH DAO V3 on `main` | Module deployment/configuration and proxy upgrade pending |
| Cross-chain stake synchronization fails silently | Fail-closed ETH sender plus ordered native receiver on `main` | Messaging/stake-sync deployment and bridge wiring pending |

## Explicit pre-production flags

- [ ] Choose the production dispute minimum.
- [ ] Set `minDisputeFee` consistently on Optimism and XDC.
- [ ] Confirm the deployed LocalAthena implementation enforces that configured value.
- [ ] Test below-minimum, exact-minimum, multiple-dispute, settlement, and fee-refund paths before enabling production enforcement.
- [ ] Owner to review and finalize the job-bound escrow accounting model before any implementation or upgrade proposal.
- [ ] Configure and verify native-bridge callback options for every enabled local EID.
- [ ] Fund and monitor the native bridge callback reserve; every live funding transaction remains approval-gated.
- [ ] Confirm job givers approve enough USDC for applicant milestone 1 until the retryable callback completes.

## Confirmed-finding remediation plan

1. Keep finding 14's job-bound escrow work deferred until the owner finalizes its accounting model.
2. Prepare the deployment manifest and unsigned calldata for the completed DAO, rating, lifecycle, and XDC synchronization corrections.
3. Immediately before deployment, recheck active DAO proposals and derive the complete checkpoint migration account lists from live events/state.
4. Execute no live transaction until the owner explicitly approves the displayed transaction details. After approval, deploy and configure dependency modules first, upgrade one dependency group at a time, verify source/proxy state on-chain, run post-upgrade checks, and push each deployment record to `main` before continuing.

## July 19 pre-deployment verification checkpoint

- Exact Solidity 0.8.23, optimizer 200, via-IR aggregate: 41/41 current-mainnet unit, lifecycle, authorization, proxy-upgrade, DAO, rating, and milestone tests passed.
- LayerZero endpoint harness: 3/3 round-trip, source-authentication, and callback-reserve rollback tests passed under Solidity 0.8.29; production artifacts compile and fit under 0.8.23.
- Live read-only forks: Arbitrum proxy group, Ethereum DAO plus two-account checkpoint migration, and XDC LOWJC each upgraded successfully in ephemeral state with preserved legacy slots (3/3 fork rehearsals).
- Storage layouts are compatible against the versioned predecessors: ETH V3 consumes gap slots 14–15; Native DAO V2 appends slot 11; ProfileManager V3 consumes gap slot 7; Local LOWJC V3 consumes gap slot 8; ProfileGenesis V2, NOWJC V5, ArbLOWJC V4, and NativeAthena V5 do not change their predecessor storage layouts.
- Live implementation/owner reads were refreshed at Arbitrum block 485,331,711 and later, Ethereum block 25,563,446 and later, and XDC block 105,085,240 and later. Every upgrade proxy is owned by `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`.
- No DAO proposal was active during the check. Ethereum checkpoint migration currently includes reward-bearing accounts `0x93514040f43aB16D52faAe7A3f380c4089D844F9` and `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724`; refresh the set from events immediately before deployment.

## Live-transaction authorization gate

- Repository edits, compilation, local tests, local forks, unsigned calldata, simulations, and gas estimates do not require a wallet key and may proceed without a live transaction.
- Never request or expose a raw private key in chat, logs, commits, command output, or shell history. Use an existing secure terminal signer, encrypted keystore, hardware wallet, or multisig flow when deployment is authorized.
- Before every transaction that changes live chain state or can spend native gas/token value, present the chain, signer address, target, function/calldata summary, expected state change, value, estimated gas and maximum fee, and rollback/recovery point. Wait for explicit owner confirmation for that transaction or clearly bounded batch.
- A private key does not become "exhausted"; wallet gas balance, RPC allowance, nonce state, or signer availability can. Check those without revealing the key before requesting transaction approval.
