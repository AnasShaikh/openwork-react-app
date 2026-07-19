# OpenWork AWS IPFS node

This directory defines the low-volume production IPFS pinning service used by the OpenWork application when commercial pinning providers are unavailable.

## Capacity and recurring cost

- Compute: one on-demand `t4g.small` instance, 2 vCPU and 2 GiB RAM.
- Persistent content: a separate encrypted 30 GiB gp3 volume retained if the stack or instance is deleted.
- OS: encrypted 8 GiB gp3 root volume.
- Ingress: CloudFront default HTTPS hostname; no load balancer or paid DNS zone.
- Network exposure: the Kubo API and gateway bind only to loopback. Port 8080 accepts traffic only from the AWS-managed CloudFront origin prefix list. No SSH port is open; administration uses SSM Session Manager.
- IPFS swarm: TCP and QUIC port 4001 are public so other IPFS nodes can retrieve announced content.

At the verified July 19, 2026 us-east-1 rates, the fixed monthly estimate is approximately USD 18.95 before credits and traffic: USD 12.26 compute, USD 3.04 EBS and USD 3.65 public IPv4. CloudFront and data-transfer usage should be small for hundreds of jobs and are variable.

The 30 GiB data volume is intentionally larger than the initial requirement. It supports 300 jobs with an average of roughly 50 MiB of pinned job/application/submission content while retaining several GiB of headroom. The upload route still enforces a 10 MiB per-file limit.

## Cost isolation

The stack applies `CostCenter=OpenWorkReactApp`, `Component=IPFS`, `Environment=production` and `Project=OpenWorkReactApp` to its cost-bearing resources. These keys are active AWS cost-allocation tags. In Cost Explorer, filter by `CostCenter=OpenWorkReactApp` for the complete application or add `Component=IPFS` for only this service. Existing production web-app infrastructure uses the same cost center, while the OpenWork landing site uses its own `OpenWorkLanding` cost center.

## Secret and application integration

- Proxy secret parameter: `/openwork/ipfs/prod/PROXY_SECRET` as SSM `SecureString`.
- App Runner environment variable: `IPFS_API_URL`, set to the stack's `IpfsApiUrl` output.
- App Runner secret environment variable: `IPFS_PROXY_SECRET`, mapped to the SSM parameter.

The public application never receives the proxy secret. Browser uploads continue to go through `/api/ipfs/upload-json` and `/api/ipfs/upload-file` on the existing backend.

The App Runner instance role's `OpenWorkAppRunnerSSMParameterPolicy` is recorded in `app-runner-instance-policy.json`. It preserves the existing application-secret path and adds read access only to the one IPFS proxy secret.

## Recovery properties

- Docker restarts Kubo automatically after a process failure or host reboot.
- Kubo content lives on the retained EBS data volume, not in the container or root disk.
- EC2 access uses SSM; no SSH key or inbound SSH rule exists.
- Container logs rotate at three 10 MiB files.
- Kubo's repository limit is 20 GiB and pinned content is protected from garbage collection.
- The exact Kubo image is pinned to `ipfs/kubo:v0.40.1` rather than an unversioned latest tag.
- Data Lifecycle Manager takes one incremental EBS snapshot each Sunday and retains only the latest four. Snapshot billing follows changed blocks, not the empty provisioned capacity.

Do not delete the retained data volume during instance replacement. Attach and mount it at `/var/lib/openwork-ipfs` before starting Kubo.
