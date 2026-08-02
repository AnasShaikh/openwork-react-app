# Dev agent tasks — 3 August 2026

Infrastructure work arising from the launch-readiness audit. Every item here needs
AWS access. The corresponding code changes are already committed to `main`; your
job is to deploy and configure, not to write application code.

Start by pulling `main`. Work through the tasks in order — task 1 is a data-loss
risk and task 2 blocks the value of several others.

Report for each task: the command run, the raw output, and the resulting state.
Never print a decrypted SSM value.

---

## Task 1 — Restore IPFS backups (highest priority)

**Problem.** Weekly EBS snapshots of the IPFS data volume have not run since
19 July 2026. DLM policy `policy-032c9d33e1f0e9598` is in `ERROR` with
`StatusMessage: "Duplicate tag key 'ManagedBy' specified."` Exactly one snapshot
exists (`snap-0c46969dd7fdcb029`, 19 July). Two scheduled runs were missed.

**Cause.** In `infra/ipfs/cloudformation.yaml`, the snapshot schedule sets
`CopyTags: true`, which copies the volume's `ManagedBy=CloudFormation` tag, while
`TagsToAdd` separately sets `ManagedBy=DataLifecycleManager`. AWS rejects the
duplicate key and halts the policy.

**Already fixed in code** — the duplicate tag is removed on `main`.

**Do:**
1. Deploy the updated `infra/ipfs/cloudformation.yaml` to stack `openwork-ipfs-prod`.
2. Confirm the policy leaves `ERROR`:
   ```
   aws dlm get-lifecycle-policy --region us-east-1 \
     --policy-id policy-032c9d33e1f0e9598 \
     --query 'Policy.{State:State,StatusMessage:StatusMessage}'
   ```
   Expect `State: ENABLED` and no status message.
3. Confirm a new snapshot appears after the next scheduled run (Sundays 03:00 UTC),
   or trigger one manually if you want confirmation sooner.

**Note.** The first snapshot will be larger than a normal weekly because it covers
15 days of change. Cost impact is negligible — current EBS snapshot spend is $0.00
and four retained snapshots at full 20 GiB would be roughly $1/month.

---

## Task 2 — Deploy current `main` to production

**Problem.** App Runner runs image `openwork-app:prod-0aa0f5f-20260802144804`,
built from commit `0aa0f5f` on 2 August. No newer image exists in ECR. Every fix
since then is on GitHub but not in production, including the RPC fallbacks — so a
future key failure still hands `undefined` to `new Web3()` and takes the Ethereum,
Optimism and Arbitrum paths down.

The 3 August deployment (`START_DEPLOYMENT`, operation
`0e4843390dba49d5b4f3eb17b5913b70`) redeployed the *same* image with new secrets.
It did not rebuild.

Because of this, earlier rotation evidence citing "zero fallback activations" and
"zero references to `arb1.arbitrum.io`" was vacuous — that code is not in the
running image. The valid evidence was the Alchemy host at startup and zero 401s.

**Do:**
1. Build current `main` through CodeBuild `openwork-react-app-prod-build`.
2. Push to ECR `openwork-app` with a unique tag.
3. Update App Runner service `openwork-react-app-prod` to that exact tag.
4. Wait for the operation to succeed and `/health` to return 200.
5. Verify the app without submitting wallet transactions.
6. Update `docs/production-release-current.md` with commit, image tag, image
   digest, CodeBuild id and App Runner operation id. It currently records the
   2 August release and was never updated for the 3 August deployment.

**Verify the fallbacks are actually live.** After deploying, confirm the startup log
still shows an Alchemy host, not a public endpoint:
```
aws logs filter-log-events --region us-east-1 \
  --log-group-name /aws/apprunner/openwork-react-app-prod/94e9a6cf2c054eac98cb4eb0a68445e6/application \
  --filter-pattern '"Arbitrum RPC"' --query 'events[-1].message'
```
Expect `arb-mainnet.g.alchemy.com`. Seeing `arb1.arbitrum.io` now means the
fallback engaged, i.e. the key is not reaching the service.

---

## Task 3 — Configure the two missing tokens

**Problem.** Neither `HEALTH_SECRET` nor `OPS_API_TOKEN` exists in App Runner or
SSM. Both middleware paths fail closed, so nothing is exposed, but:

- `/api/health` returns 503 and performs no chain checks. There is currently no
  monitoring of RPC health at all. This is why task 2's problem went unnoticed.
- `/api/cctp-retry`, `/api/start-listener`, `/api/stop-listener` and `/api/compile`
  return 503 and cannot be used by an operator.

**Do:**
1. Generate two independent random secrets. Do not print them.
2. Store each as an SSM `SecureString` under `/openwork/react-app/prod/`.
3. Add both to the App Runner service as secret environment variables.
4. Deploy and confirm `/api/health` returns 200 when called with the
   `x-health-token` header, without printing the token.

**Also worth adding:** a shallow unauthenticated liveness endpoint that reports
only that the process is up, with no chain calls, so an uptime monitor can watch
it. After task 2, a bad RPC key degrades to slow public endpoints instead of
crashing — better behaviour, but it makes failure invisible without monitoring.

---

## Task 4 — Remove the retired Lighthouse secret

**Problem.** `LIGHTHOUSE_API_KEY` is still configured in App Runner, backed by
`/openwork/react-app/prod/LIGHTHOUSE_API_KEY`. Lighthouse was removed as an upload
provider in commit `9f4be2d`; nothing reads that value now.

**Do:**
1. Remove `LIGHTHOUSE_API_KEY` from the App Runner environment.
2. Delete or archive the SSM parameter.
3. Confirm whether `PINATA_JWT` should stay. It is now the *only* fallback if the
   self-hosted IPFS node is unavailable, so removing it leaves no upload path when
   the node is down. Recommend keeping it unless you have a different fallback.

After removal, `GET /api/e2e-test/ipfs-debug` reports
`retired_lighthouse_key_still_set` — expect `false`.

---

## Task 5 — Give the landing site one source of truth

**Problem.** `www.openwork.technology` still builds from
`krishnaprasath-k/openwork-landing` and publishes to S3
`openwork-technology-landing-prod-256309399568` behind CloudFront
`E1ANKLS7O4YGAE`. That code now also lives in `landing/` in this monorepo, where it
rebuilds byte-identical to production. Two live copies of the same site is worse
than one, because edits in either place silently diverge.

**Do — needs Krishna's agreement first:**
1. Repoint the build at this repository's `landing/` directory.
2. Deploy once and verify the site is unchanged. The expected artefacts are
   `index-D93FVCTK.js` and `index-Dc0ogmOU.css`; a byte-identical rebuild from
   `landing/` has already been confirmed.
3. Archive `krishnaprasath-k/openwork-landing` so nobody edits it by accident.
4. Delete the "Read before editing" notice at the top of `landing/README.md`.
5. Update item 1 in `PROJECT_STATUS.md` to resolved.

Until step 3, Krishna's repository remains canonical for the landing site.

---

## Task 6 — Report IPFS disk headroom

**Problem.** Uploads are pinned, and pinned content is exempt from garbage
collection, so the Kubo repository fills monotonically and cannot self-reclaim. The
cap is 20 GiB on a 30 GiB volume. Current usage is unknown — the audit did not open
a host session, because `docs/AUDITOR_AWS_APP_RUNNER_IPFS_HANDOFF.md` gates that on
explicit operator request. When the repository fills, users cannot post jobs,
because posting requires uploading job metadata first.

**Do —** read-only host inspection via Systems Manager on instance
`i-06c86f1fe68ead8e7`:
```
df -h /var/lib/openwork-ipfs
sudo docker exec openwork-ipfs ipfs repo stat --human
sudo docker exec openwork-ipfs ipfs pin ls --type=recursive | wc -l
```
Report current bytes used against the 20 GiB cap and the pin count. Do not display
`/etc/nginx/conf.d/openwork-ipfs.conf`; it contains the proxy bearer secret.

Then add a CloudWatch alarm on the data volume so this is monitored rather than
discovered. Application-side protection — a per-address quota and a disk circuit
breaker — is being implemented separately.

---

## Task 7 — IPFS gateway TLS minimum (assess, do not rush)

**Problem.** CloudFront distribution `ER37VLKFH3TGU` reports
`MinimumProtocolVersion: TLSv1`, a deprecated protocol version.

**This is not a one-line change.** The distribution uses
`CloudFrontDefaultCertificate: true` — the shared `*.cloudfront.net` certificate.
AWS pins the minimum to `TLSv1` in that configuration and rejects any attempt to
raise it. A higher minimum is only available with a custom certificate.

**What raising it would actually require:**
1. Choose a hostname, e.g. `ipfs.openwork.technology`.
2. Request an ACM certificate for it in `us-east-1`.
3. Add `Aliases`, `AcmCertificateArn`, `SslSupportMethod: sni-only` and
   `MinimumProtocolVersion: TLSv1.2_2021` to the distribution.
4. Add the DNS record.
5. Update `IPFS_API_URL` in App Runner to the new hostname, and redeploy.

Step 5 changes a production endpoint, so this is a small project, not a config
tweak.

**Recommendation:** defer. The traffic is job metadata, not credentials, and every
modern client negotiates TLS 1.2 or better regardless of the floor. Do it when you
want a custom IPFS hostname anyway, or when a security questionnaire forces it.
Raised here so the finding is recorded with its real cost rather than appearing
trivial.

---

## Out of scope for you

These are application-code changes being handled separately: IPFS upload
authentication with a per-address quota and disk circuit breaker, relay-endpoint
authentication with idempotency and bounded waiters, and the replacement of
`alert()` error handling.
