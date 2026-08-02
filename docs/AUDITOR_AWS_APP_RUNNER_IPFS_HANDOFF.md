# Auditor handoff: AWS, App Runner, build pipeline, and IPFS

This handoff is for an auditor agent running as the same macOS user on the same Mac as the OpenWork operator. The AWS CLI is already configured locally. Use the CLI session; do not ask anyone to paste AWS credentials, API keys, SSM values, or tokens into chat.

## Scope and safety boundary

This is a **read-only audit**. Do not run any of the following without a separate, explicit change request:

- `aws ssm put-parameter`
- `aws apprunner update-service`
- `aws apprunner start-deployment`
- `aws cloudformation deploy`, `update-stack`, or `delete-stack`
- ECR pushes or image deletion
- EC2 stop, start, reboot, terminate, volume detach, or snapshot deletion
- IPFS uploads or pin changes
- CodeBuild `start-build`

Never print a decrypted SSM value. Do not enable shell tracing. If a secret must be used for a read-only request, keep it in a shell variable, print only the result, then `unset` it.

Work from:

```bash
cd /Users/anas/openwork-react-app/openwork-react-app
set +x
```

## Production topology

There is no AWS service called “CodeRunner” in this stack. The relevant services are:

| Layer | Production resource |
|---|---|
| Application runtime | AWS App Runner service `openwork-react-app-prod` |
| Container build | AWS CodeBuild project `openwork-react-app-prod-build` |
| Container registry | Amazon ECR repository `openwork-app` |
| Application URL | `https://app.openwork.technology` |
| App secrets | SSM parameters referenced by App Runner |
| IPFS infrastructure | CloudFormation stack `openwork-ipfs-prod` |
| IPFS node | EC2/Kubo, administered through AWS Systems Manager, not SSH |
| IPFS TLS ingress | CloudFront |
| IPFS durable storage | Encrypted, retained EBS volume plus weekly snapshots |

The backend’s IPFS provider selection is:

1. `IPFS_API_URL` + `IPFS_PROXY_SECRET`: the AWS-hosted Kubo proxy, preferred.
2. `PINATA_JWT`: upload fallback.
3. Public gateways: read fallbacks.

`LIGHTHOUSE_API_KEY` is still present in production configuration, but the current upload implementation does not use it. Treat that as a possible stale-secret/configuration cleanup item, not as proof Lighthouse is an active upload fallback.

Canonical implementation and deployment records:

- `backend/routes/ipfs.js`
- `infra/ipfs/cloudformation.yaml`
- `infra/ipfs/app-runner-instance-policy.json`
- `docs/ipfs-aws-production-2026-07-19.md`

## 1. Confirm AWS identity and discover resources

Do not hard-code a profile or account. Confirm the existing CLI session and discover the service ARN:

```bash
set +x
audit_region='us-east-1'
audit_service_name='openwork-react-app-prod'

aws sts get-caller-identity --query '{Arn:Arn,Account:Account}' --output json

audit_service_arn="$(
  aws apprunner list-services \
    --region "$audit_region" \
    --query "ServiceSummaryList[?ServiceName=='$audit_service_name'].ServiceArn | [0]" \
    --output text
)"

if [ -z "$audit_service_arn" ] || [ "$audit_service_arn" = 'None' ]; then
  echo 'App Runner service was not found' >&2
  exit 1
fi

printf 'service=%s\n' "$audit_service_name"
printf 'region=%s\n' "$audit_region"
```

If the identity call fails, stop. Do not search local credential files or ask for secrets. Ask the operator to restore the existing AWS CLI session.

## 2. Inspect App Runner without exposing environment values

Show runtime status, the deployed ECR image, IAM roles, non-secret IPFS endpoint, and environment **names only**:

```bash
aws apprunner describe-service \
  --region "$audit_region" \
  --service-arn "$audit_service_arn" \
  --output json |
jq '{
  name: .Service.ServiceName,
  status: .Service.Status,
  service_url: .Service.ServiceUrl,
  image: .Service.SourceConfiguration.ImageRepository.ImageIdentifier,
  auto_deploy: .Service.SourceConfiguration.AutoDeploymentsEnabled,
  access_role: .Service.SourceConfiguration.AuthenticationConfiguration.AccessRoleArn,
  instance_role: .Service.InstanceConfiguration.InstanceRoleArn,
  ipfs_api_url: .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables.IPFS_API_URL,
  environment_variable_names: (
    .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables // {} | keys
  ),
  secret_variable_names: (
    .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets // {} | keys
  )
}'
```

Show only the SSM resource references for relevant variables, never their decrypted values:

```bash
aws apprunner describe-service \
  --region "$audit_region" \
  --service-arn "$audit_service_arn" \
  --output json |
jq '
  .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets
  | with_entries(select(.key | test("RPC_URL|IPFS|PINATA|LIGHTHOUSE|HEALTH")))
  | with_entries(.value |= sub("^arn:aws:(ssm|secretsmanager):[^:]+:[^:]+:"; ""))
'
```

Confirm there is no browser-bundled RPC or Alchemy secret:

```bash
aws apprunner describe-service \
  --region "$audit_region" \
  --service-arn "$audit_service_arn" \
  --output json |
jq '[
  .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables,
  .Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets
] | map(. // {}) | add | keys | map(select(startswith("VITE_") and test("RPC|ALCHEMY")))'
```

Expected result: `[]`.

## 3. Inspect deployment operations and the ECR image

```bash
aws apprunner list-operations \
  --region "$audit_region" \
  --service-arn "$audit_service_arn" \
  --query 'OperationSummaryList[0:10].{Id:Id,Type:Type,Status:Status,StartedAt:StartedAt,EndedAt:EndedAt}' \
  --output table

audit_image_id="$(
  aws apprunner describe-service \
    --region "$audit_region" \
    --service-arn "$audit_service_arn" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' \
    --output text
)"
audit_image_tag="${audit_image_id##*:}"

aws ecr describe-images \
  --region "$audit_region" \
  --repository-name openwork-app \
  --image-ids imageTag="$audit_image_tag" \
  --query 'imageDetails[0].{Tags:imageTags,Digest:imageDigest,PushedAt:imagePushedAt,SizeBytes:imageSizeInBytes}' \
  --output json
```

The Alchemy rotation deployment operation is `0e4843390dba49d5b4f3eb17b5913b70`; it completed successfully on August 3, 2026 at approximately 02:30 IST. Do not rely solely on this record—confirm it with `list-operations`.

## 4. Inspect CodeBuild history and logs

```bash
audit_build_project='openwork-react-app-prod-build'

aws codebuild batch-get-projects \
  --region "$audit_region" \
  --names "$audit_build_project" \
  --query 'projects[0].{Name:name,Source:{Type:source.type,Location:source.location,Buildspec:source.buildspec},Environment:{Type:environment.type,Image:environment.image,ComputeType:environment.computeType,PrivilegedMode:environment.privilegedMode,EnvironmentVariableNames:environment.environmentVariables[].name},ServiceRole:serviceRole,Artifacts:{Type:artifacts.type,Location:artifacts.location}}' \
  --output json

audit_build_ids="$(
  aws codebuild list-builds-for-project \
    --region "$audit_region" \
    --project-name "$audit_build_project" \
    --sort-order DESCENDING \
    --query 'ids[0:10]' \
    --output text
)"

if [ -n "$audit_build_ids" ]; then
  aws codebuild batch-get-builds \
    --region "$audit_region" \
    --ids ${(z)audit_build_ids} \
    --query 'builds[].{Id:id,Status:buildStatus,SourceVersion:sourceVersion,ResolvedSourceVersion:resolvedSourceVersion,Start:startTime,End:endTime,LogGroup:logs.groupName,LogStream:logs.streamName}' \
    --output table
fi
```

The `${(z)...}` expansion above is for zsh, which is the shell on this Mac. Inspect log streams with `aws logs get-log-events`; redact credentials or URLs before emitting any messages.

## 5. Verify the Alchemy rotation without revealing the key

The replacement key is in the local backend `.env`. Compare it to the SSM-backed production URLs in memory and print only hostnames and equality booleans:

```bash
set +x
audit_local_env='/Users/anas/openwork-react-app/openwork-react-app/backend/.env'
audit_alchemy_key="$(
  grep -m1 '^ARBITRUM_MAINNET_RPC_URL=' "$audit_local_env" |
  sed 's|.*/v2/||' |
  tr -d '\n'
)"

if [ "${#audit_alchemy_key}" -ne 26 ]; then
  echo 'Unexpected replacement-key length; stopping without printing it' >&2
  exit 1
fi

for audit_parameter_name in \
  ETHEREUM_MAINNET_RPC_URL \
  OPTIMISM_MAINNET_RPC_URL \
  ARBITRUM_MAINNET_RPC_URL \
  ETHEREUM_SEPOLIA_RPC_URL \
  OPTIMISM_SEPOLIA_RPC_URL \
  OP_SEPOLIA_RPC_URL \
  ARBITRUM_SEPOLIA_RPC_URL \
  BASE_SEPOLIA_RPC_URL \
  XDC_MAINNET_RPC_URL
do
  audit_parameter_value="$(
    aws ssm get-parameter \
      --region "$audit_region" \
      --name "/openwork/react-app/prod/$audit_parameter_name" \
      --with-decryption \
      --query 'Parameter.Value' \
      --output text
  )"
  audit_rpc_host="$(printf '%s' "$audit_parameter_value" | sed -E 's#^[a-z]+://([^/]+).*#\1#')"
  audit_parameter_key="$(printf '%s' "$audit_parameter_value" | sed -nE 's#^.*/v2/([^/?]+).*$#\1#p')"

  if [ -n "$audit_parameter_key" ] && [ "$audit_parameter_key" = "$audit_alchemy_key" ]; then
    audit_same_key='yes'
  else
    audit_same_key='no'
  fi

  printf '%-30s host=%-38s same_as_replacement=%s\n' \
    "$audit_parameter_name" "$audit_rpc_host" "$audit_same_key"
done

unset audit_alchemy_key audit_parameter_value audit_parameter_key
```

Expected:

- All eight Alchemy-backed values say `same_as_replacement=yes` and show the intended Alchemy hostname.
- `XDC_MAINNET_RPC_URL` shows `rpc.xdc.network` and `same_as_replacement=no`.

## 6. Inspect post-deployment App Runner logs

Derive the application log group from the service ARN:

```bash
audit_service_id="${audit_service_arn##*/}"
audit_app_log_group="/aws/apprunner/$audit_service_name/$audit_service_id/application"

aws logs describe-log-streams \
  --region "$audit_region" \
  --log-group-name "$audit_app_log_group" \
  --order-by LastEventTime \
  --descending \
  --max-items 10 \
  --query 'logStreams[].{Name:logStreamName,LastEvent:lastEventTimestamp}' \
  --output table
```

The application already redacts RPC URLs, but apply a second redaction before displaying log messages:

```bash
aws logs tail "$audit_app_log_group" \
  --region "$audit_region" \
  --since 24h \
  --format short 2>/dev/null |
sed -E 's#(alchemy\.com)(/v2)?/[^[:space:]]+#\1/***#g; s#(Bearer )[A-Za-z0-9._~+/-]+#\1<redacted>#g' |
rg -i 'Arbitrum RPC|Optimism RPC|401|unauthorized|fallback|RPC error|Server ready'
```

Required evidence after the latest successful deployment:

- `Arbitrum RPC` uses `arb-mainnet.g.alchemy.com` and reports `(mainnet)`.
- No HTTP 401s.
- No fallback message.
- No `arb1.arbitrum.io` or `mainnet.optimism.io` host.

Use CloudWatch timestamps to exclude logs from before the deployment.

## 7. Inspect the AWS IPFS stack

```bash
audit_ipfs_stack='openwork-ipfs-prod'

aws cloudformation describe-stacks \
  --region "$audit_region" \
  --stack-name "$audit_ipfs_stack" \
  --query 'Stacks[0].{Status:StackStatus,Created:CreationTime,Updated:LastUpdatedTime,Outputs:Outputs,Tags:Tags}' \
  --output json

aws cloudformation list-stack-resources \
  --region "$audit_region" \
  --stack-name "$audit_ipfs_stack" \
  --query 'StackResourceSummaries[].{LogicalId:LogicalResourceId,Type:ResourceType,PhysicalId:PhysicalResourceId,Status:ResourceStatus}' \
  --output table
```

Discover the live instance, retained data volume, CloudFront distribution, and snapshot policy from stack outputs rather than copying old identifiers:

```bash
audit_ipfs_instance_id="$(
  aws cloudformation describe-stacks --region "$audit_region" --stack-name "$audit_ipfs_stack" \
    --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue | [0]" --output text
)"
audit_ipfs_volume_id="$(
  aws cloudformation describe-stacks --region "$audit_region" --stack-name "$audit_ipfs_stack" \
    --query "Stacks[0].Outputs[?OutputKey=='DataVolumeId'].OutputValue | [0]" --output text
)"
audit_ipfs_distribution_id="$(
  aws cloudformation describe-stacks --region "$audit_region" --stack-name "$audit_ipfs_stack" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue | [0]" --output text
)"
audit_ipfs_snapshot_policy_id="$(
  aws cloudformation describe-stacks --region "$audit_region" --stack-name "$audit_ipfs_stack" \
    --query "Stacks[0].Outputs[?OutputKey=='SnapshotPolicyId'].OutputValue | [0]" --output text
)"

aws ec2 describe-instances \
  --region "$audit_region" \
  --instance-ids "$audit_ipfs_instance_id" \
  --query 'Reservations[0].Instances[0].{Id:InstanceId,State:State.Name,Type:InstanceType,AZ:Placement.AvailabilityZone,ImageId:ImageId,IamProfile:IamInstanceProfile.Arn,Metadata:MetadataOptions,SecurityGroups:SecurityGroups,Volumes:BlockDeviceMappings[].Ebs.VolumeId,Tags:Tags}' \
  --output json

aws ec2 describe-volumes \
  --region "$audit_region" \
  --volume-ids "$audit_ipfs_volume_id" \
  --query 'Volumes[0].{Id:VolumeId,State:State,Encrypted:Encrypted,SizeGiB:Size,Type:VolumeType,Attachments:Attachments,Tags:Tags}' \
  --output json

aws cloudfront get-distribution \
  --id "$audit_ipfs_distribution_id" \
  --query 'Distribution.{Id:Id,Status:Status,Enabled:DistributionConfig.Enabled,DomainName:DomainName,Origins:DistributionConfig.Origins.Items,PriceClass:DistributionConfig.PriceClass}' \
  --output json

aws dlm get-lifecycle-policy \
  --region "$audit_region" \
  --policy-id "$audit_ipfs_snapshot_policy_id" \
  --query 'Policy.{Id:PolicyId,State:State,Description:Description,Details:PolicyDetails,Tags:Tags}' \
  --output json
```

Confirm that the EC2 instance is managed by Systems Manager and no SSH path is required:

```bash
aws ssm describe-instance-information \
  --region "$audit_region" \
  --filters "Key=InstanceIds,Values=$audit_ipfs_instance_id" \
  --query 'InstanceInformationList[].{Id:InstanceId,Ping:PingStatus,Platform:PlatformName,Agent:AgentVersion,LastPing:LastPingDateTime}' \
  --output json
```

## 8. Verify IPFS boundaries without writing data

Get the live endpoint from CloudFormation:

```bash
audit_ipfs_api_url="$(
  aws cloudformation describe-stacks \
    --region "$audit_region" \
    --stack-name "$audit_ipfs_stack" \
    --query "Stacks[0].Outputs[?OutputKey=='IpfsApiUrl'].OutputValue | [0]" \
    --output text
)"

printf 'ipfs_api_host=%s\n' "$(printf '%s' "$audit_ipfs_api_url" | sed -E 's#^[a-z]+://([^/]+).*#\1#')"
```

Read-only boundary checks:

```bash
curl --silent --show-error --fail "$audit_ipfs_api_url/health" | jq .

printf 'unauthenticated_add_http='
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  --request POST "$audit_ipfs_api_url/api/v0/add"

audit_known_cid='QmZDiKDQPb7SHas6ysYoogojJfeinVbpCR75LXPGQCU6CB'

printf 'unauthenticated_direct_read_http='
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  "$audit_ipfs_api_url/ipfs/$audit_known_cid"

printf 'application_read_http='
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  "https://app.openwork.technology/api/ipfs/content/$audit_known_cid"

printf 'public_gateway_read_http='
curl --silent --show-error --location --output /dev/null --write-out '%{http_code}\n' \
  "https://dweb.link/ipfs/$audit_known_cid"
```

Expected:

- `/health`: HTTP 200 with the OpenWork IPFS service identity.
- Direct unauthenticated add: HTTP 401.
- Direct unauthenticated CID read: HTTP 401.
- Application CID read: HTTP 200.
- Public gateway CID read: HTTP 200.

Do not test `POST /api/ipfs/upload-json` or `/upload-file` during a read-only audit. Those operations create and pin new content.

## 9. Confirm App Runner and the IPFS node use the same secret reference

This requires no decryption:

```bash
audit_app_ipfs_secret_ref="$(
  aws apprunner describe-service \
    --region "$audit_region" \
    --service-arn "$audit_service_arn" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets.IPFS_PROXY_SECRET' \
    --output text
)"

printf '%s\n' "$audit_app_ipfs_secret_ref" |
sed -E 's#(arn:aws:ssm:[^:]+:)[0-9]{12}:#\1<account>:#'

aws ssm describe-parameters \
  --region "$audit_region" \
  --parameter-filters 'Key=Name,Values=/openwork/ipfs/prod/PROXY_SECRET' \
  --query 'Parameters[].{Name:Name,Type:Type,KeyId:KeyId,Version:Version,LastModified:LastModifiedDate}' \
  --output json
```

Expected App Runner reference: `parameter/openwork/ipfs/prod/PROXY_SECRET`.

## 10. Optional host-level inspection through SSM

Routine AWS and boundary verification does not require a shell on the EC2 node. Enter a Systems Manager session only if the operator explicitly requests host-level inspection:

```bash
aws ssm start-session \
  --region "$audit_region" \
  --target "$audit_ipfs_instance_id"
```

Inside the session, keep the inspection read-only:

```bash
sudo systemctl is-active docker nginx amazon-ssm-agent
sudo docker ps --filter name=openwork-ipfs --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
sudo docker stats openwork-ipfs --no-stream
df -h /var/lib/openwork-ipfs
sudo docker exec openwork-ipfs ipfs repo stat --human
sudo docker exec openwork-ipfs ipfs pin ls --type=recursive | wc -l
sudo nginx -t
```

Do not display `/etc/nginx/conf.d/openwork-ipfs.conf`; it contains the proxy bearer secret. Do not print container environment variables or retrieve the SSM secret on the host.

## 11. Health endpoint limitation

At the time of this handoff, `HEALTH_SECRET` is absent from both the App Runner environment map and the relevant SSM parameter inventory. Therefore:

```bash
curl --silent --show-error \
  --write-out '\nHTTP %{http_code}\n' \
  https://app.openwork.technology/api/health
```

returns HTTP 503 with `HEALTH_SECRET is not configured`.

Do not create a token as part of the audit. Record this as a production observability/configuration finding. If the operator later authorizes remediation, configure a new SecureString, add it to App Runner as a server-side secret, deploy, and test it via the `x-health-token` header without ever printing the token.

## Required audit output

Report:

1. AWS identity used and region, without credential material.
2. App Runner status, current ECR tag/digest, latest deployment operation, and CodeBuild source revision.
3. Environment and secret **names**, plus sanitized SSM resource paths.
4. Alchemy host and same-key booleans; never the key or complete URLs.
5. Post-deployment counts for 401s, fallbacks, and public RPC hosts.
6. CloudFormation drift/status, EC2/SSM health, encrypted retained volume status, CloudFront status, and DLM snapshot policy state.
7. IPFS boundary-test HTTP statuses and known-CID readback results.
8. The missing `HEALTH_SECRET` limitation.
9. Any mismatch between live AWS state, current code, and `docs/ipfs-aws-production-2026-07-19.md`.

Do not change production while collecting this evidence.
