# AWS IPFS Production Deployment — July 19, 2026

This is the immutable deployment and verification record for OpenWork's AWS-hosted IPFS pinning provider. It resolves the production upload outage caused by an invalid Lighthouse credential and a Pinata account at its plan limit.

## Result

Status: **live and verified**.

- Public browser uploads continue to use the existing OpenWork backend routes.
- The backend now uses the secured AWS node first, with Lighthouse and Pinata retained as later fallbacks.
- Production JSON upload, authenticated node upload, application readback, direct node readback and public IPFS gateway retrieval all succeeded.
- Missing proxy credentials return HTTP 401 for both uploads and reads.
- A recursively pinned production CID remained pinned and readable after the Kubo container was restarted.
- OpenWork application and IPFS spend is separated from other AWS workloads with active cost-allocation tags.
- No blockchain transaction or crypto expenditure was involved.

## Capacity and estimated recurring cost

| Resource | Provisioned capacity | Estimated fixed monthly cost before credits |
|---|---:|---:|
| EC2 `t4g.small` | 2 vCPU, 2 GiB RAM | `~$12.26` |
| Encrypted gp3 root | 8 GiB | `~$0.64` |
| Encrypted retained gp3 data | 30 GiB | `~$2.40` |
| Attached public IPv4 | One | `~$3.65` |
| CloudFront | Price Class 100, uncached authenticated API | Usage-based; expected cents at current volume |
| Weekly EBS snapshots | Four retained, incremental changed blocks only | Usage-based; expected well below `$1` initially |

Expected fixed total: approximately **$18.95/month**, plus small CloudFront, data-transfer and changed-block snapshot usage. No load balancer, NAT gateway, database, cluster, paid DNS zone or second server was created.

The node's Kubo repository is capped at 20 GB on a 30 GB retained data volume. This is enough for 300 jobs at an average of roughly 50 MiB of aggregate job, application and submission content, with several GiB of operating headroom. The application still enforces a 10 MiB per-file upload limit.

## Cost isolation

All billable resources dedicated to this workload use these active AWS cost-allocation tags:

| Tag | Value | Purpose |
|---|---|---|
| `CostCenter` | `OpenWorkReactApp` | Isolates the entire OpenWork application, including App Runner, builds and IPFS |
| `Component` | `IPFS` | Narrows the OpenWork application total to this IPFS service only |
| `Environment` | `production` | Excludes future development or staging resources |
| `Project` | `OpenWorkReactApp` | Matches the existing production web-app resource convention |

In AWS Billing and Cost Management, open Cost Explorer and filter by `Tag: CostCenter = OpenWorkReactApp` for the whole application's attributable usage. Add `Tag: Component = IPFS` for the IPFS-only amount. AWS can take up to 24 hours to expose newly tagged usage in cost reports; tags do not apply retroactively to charges incurred before they were attached.

The EC2 instance, both EBS volumes, Elastic IP, CloudFront distribution, completed baseline snapshot, weekly snapshot policy, security group and proxy-secret parameter were verified with `CostCenter=OpenWorkReactApp`, `Component=IPFS` and `Environment=production`. Future automated snapshots copy the same allocation tags. The landing site remains separately tagged `CostCenter=OpenWorkLanding`.

## Infrastructure registry

| Role | Immutable identifier |
|---|---|
| AWS account | `256309399568` |
| Region | `us-east-1` |
| CloudFormation stack | `openwork-ipfs-prod` |
| Stack ID | `arn:aws:cloudformation:us-east-1:256309399568:stack/openwork-ipfs-prod/c1e4d240-837f-11f1-9e92-12215df59a75` |
| EC2 instance | `i-06c86f1fe68ead8e7`, `t4g.small`, Amazon Linux 2023 ARM64 |
| Persistent data volume | `vol-07f77be2393f5e36a`, encrypted gp3, 30 GiB, deletion retained |
| Static public IPv4 | `3.227.29.148` |
| CloudFront distribution | `ER37VLKFH3TGU` |
| Private application endpoint | `https://d3srbkj28cvt4z.cloudfront.net` |
| Kubo image | `ipfs/kubo:v0.40.1`, pulled digest `sha256:9c70a3dba0b5f362bf99317a02384a194f5c91cf5388abdb8fe7d64d83dd20bb` |
| IPFS peer ID | `12D3KooWAnAQxuguhZi93eKuB6TSXwYQ2qUghu7J5TDD4Y5eajhQ` |
| SSM proxy secret | `/openwork/ipfs/prod/PROXY_SECRET` — value never recorded |
| Snapshot lifecycle policy | `policy-032c9d33e1f0e9598` — Sundays 03:00 UTC, retain four |
| Initial baseline snapshot | `snap-0c46969dd7fdcb029` — completed, 100% |

The endpoint is called private because clients need the bearer secret, not because it uses a private network address. The public application never receives this secret.

## Security boundaries

- Kubo API port 5001 and gateway port 8080 bind only to EC2 loopback addresses.
- Nginx exposes only exact health, add and CID-read paths; it does not expose the Kubo admin API.
- Port 8080 accepts network traffic only from the AWS-managed CloudFront origin-facing prefix list.
- CloudFront provides public TLS and forwards the backend's authorization header.
- The proxy rejects unauthenticated upload and read requests with HTTP 401.
- There is no inbound SSH rule and no EC2 key pair. Administration uses the SSM-managed instance role.
- The App Runner instance role can read the existing app-secret path and the one exact IPFS proxy secret.
- Instance metadata requires IMDSv2.
- IPFS swarm TCP/QUIC port 4001 is public so other IPFS nodes can retrieve announced content.
- Docker memory and log limits prevent the node from consuming the whole host or disk through unbounded logs.

## Deployment source and application release

| Field | Value |
|---|---|
| Branch | `main` |
| Application/source commit | `42190192279fef0a6a6efd013ff74b26de6ef8f6` |
| GitHub CI | `29691602100` — succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-42190192279fef0a6a6efd013ff74b26de6ef8f6.zip` |
| Archive SHA-256 | `e37d12f8311369d0f982c9a937aee0cc0d371b9d07a215cf1af6877532e0fd4f` |
| CodeBuild | `openwork-react-app-prod-build:341f6548-1bbd-41ac-ac9a-d0488b3e3f0e` — succeeded |
| ECR image | `openwork-app:prod-4219019-20260719145043` |
| ECR digest | `sha256:03871f13755ef9eaecce1747c8439cb6c452f4237aa77c0f1a31ed5a141c2b29` |
| App Runner operation | `b0d403b8d4944b57a9b866f66bbd49fd` — succeeded |
| CloudFormation template | `infra/ipfs/cloudformation.yaml` |
| App Runner role policy | `infra/ipfs/app-runner-instance-policy.json` |

## Verification evidence

### Boundary tests

- CloudFront `/health`: HTTP 200.
- CloudFront upload without bearer token: HTTP 401.
- CloudFront CID read without bearer token: HTTP 401.
- Authenticated CloudFront upload/read CID: `QmR6UM3QD8iXWLMk2auyFLHjaWqCKfsuYbU8nREm3grQMP`.
- Authenticated node-local pin/read CID: `QmTsNpMjjwNZPB6nvELzs5iCEaxZFVH8tsdDBw1ytW3khS`.

### Production application test

- `POST https://app.openwork.technology/api/ipfs/upload-json`: HTTP 200.
- Production CID: `QmZDiKDQPb7SHas6ysYoogojJfeinVbpCR75LXPGQCU6CB`.
- Returned pin size: 100 bytes.
- `GET https://app.openwork.technology/api/ipfs/content/<CID>`: HTTP 200 with exact JSON.
- Direct `dweb.link` retrieval: HTTP 200.
- Direct `ipfs.io` retrieval: HTTP 200.
- Recursive pin check before and after Kubo restart: passed.

### Live capacity snapshot

- IPFS repository: 695,148 bytes used against 20,000,000,000-byte configured maximum.
- Data filesystem: 28 GiB available; 1% used.
- Kubo container memory: approximately 116 MiB against a 1.367 GiB limit.
- Host available memory: approximately 1.27 GiB; 1 GiB swap configured and unused.

## Backup and recovery

- The data volume is a separate CloudFormation resource with both deletion and replacement retention.
- A baseline snapshot was taken after live production verification.
- Data Lifecycle Manager takes an incremental snapshot each Sunday at 03:00 UTC and retains four.
- Kubo automatically restarts after container or host restart and uses the mounted retained volume.
- The stable Elastic IP is explicitly announced over IPFS TCP and QUIC.
- If the application release regresses, roll App Runner back to `openwork-app:prod-f4b2818-20260719140650`; the independent IPFS node and pinned data remain unchanged.

Do not delete `vol-07f77be2393f5e36a` or the snapshots during an instance replacement. Restore or attach the volume at `/var/lib/openwork-ipfs` before starting Kubo.
