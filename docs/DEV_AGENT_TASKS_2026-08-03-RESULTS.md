# Dev agent task results — 3 August 2026

Execution account: AWS account `256309399568`, IAM user `armand_account`.
No decrypted SSM value or generated token is included in this report.

Repeated status-poll commands are condensed to their final response. Commands that
retrieved a secret placed it directly into a shell variable and printed only a
sanitised response.

## Task 1 — Restore IPFS backups

### Commands and raw output

The first whole-template deployment exposed an unrelated latent update: the public
"latest Amazon Linux" SSM parameter had advanced, so CloudFormation attempted to
replace the stateful instance and then collided with its retained EBS attachment.
CloudFormation rolled back without detaching or replacing the live node.

```sh
aws cloudformation describe-stack-events --region us-east-1 \
  --stack-name openwork-ipfs-prod \
  --query "StackEvents[?ResourceStatus=='UPDATE_FAILED'].{Time:Timestamp,Resource:LogicalResourceId,Type:ResourceType,Status:ResourceStatus,Reason:ResourceStatusReason}" \
  --output json
```

```json
[
  {
    "Time": "2026-08-02T23:04:34.350000+00:00",
    "Resource": "IpfsElasticIpAssociation",
    "Type": "AWS::EC2::EIPAssociation",
    "Status": "UPDATE_FAILED",
    "Reason": "Resource update cancelled"
  },
  {
    "Time": "2026-08-02T23:04:32.638000+00:00",
    "Resource": "IpfsDataVolumeAttachment",
    "Type": "AWS::EC2::VolumeAttachment",
    "Status": "UPDATE_FAILED",
    "Reason": "Resource handler returned message: \"vol-07f77be2393f5e36a is already attached to an instance (Service: Ec2, Status Code: 400, Request ID: b69cb9ed-e520-4ca4-abd0-bcd4160bce45) (SDK Attempt Count: 1)\" (RequestToken: 4a885800-3324-dd22-45a5-cb502bb5789f, HandlerErrorCode: AlreadyExists)"
  }
]
```

The running instance AMI was pinned in a non-secret SSM parameter, and a replacement
change set was inspected before execution.

```sh
aws ssm put-parameter --region us-east-1 \
  --name /openwork/ipfs/prod/AMI_ID_PINNED \
  --type String --value ami-02e447f4c654c7179 \
  --description 'AMI pinned to the running OpenWork IPFS node so CloudFormation infrastructure-only updates do not replace the stateful host'

aws cloudformation describe-change-set --region us-east-1 \
  --stack-name openwork-ipfs-prod \
  --change-set-name dlm-fix-20260803-safe \
  --query '{Status:Status,ExecutionStatus:ExecutionStatus,Reason:StatusReason,Changes:Changes[].ResourceChange.{Action:Action,LogicalResourceId:LogicalResourceId,ResourceType:ResourceType,Replacement:Replacement}}' \
  --output json
```

```json
{
  "Version": 1,
  "Tier": "Standard"
}
{
  "Status": "CREATE_COMPLETE",
  "ExecutionStatus": "AVAILABLE",
  "Reason": null,
  "Changes": [
    {
      "Action": "Modify",
      "LogicalResourceId": "IpfsSnapshotPolicy",
      "ResourceType": "AWS::DLM::LifecyclePolicy",
      "Replacement": "Conditional"
    }
  ]
}
```

```sh
aws cloudformation execute-change-set --region us-east-1 \
  --stack-name openwork-ipfs-prod \
  --change-set-name dlm-fix-20260803-safe
aws cloudformation wait stack-update-complete --region us-east-1 \
  --stack-name openwork-ipfs-prod
aws cloudformation describe-stacks --region us-east-1 \
  --stack-name openwork-ipfs-prod \
  --query 'Stacks[0].{Status:StackStatus,LastUpdated:LastUpdatedTime,AmiParameter:Parameters[?ParameterKey==`AmiId`]|[0]}' \
  --output json
```

```json
{
  "Status": "UPDATE_COMPLETE",
  "LastUpdated": "2026-08-02T23:08:58.069000+00:00",
  "AmiParameter": {
    "ParameterKey": "AmiId",
    "ParameterValue": "/openwork/ipfs/prod/AMI_ID_PINNED",
    "ResolvedValue": "ami-02e447f4c654c7179"
  }
}
```

```sh
aws dlm get-lifecycle-policy --region us-east-1 \
  --policy-id policy-032c9d33e1f0e9598 \
  --query 'Policy.{State:State,StatusMessage:StatusMessage,ManagedByTags:PolicyDetails.Schedules[0].TagsToAdd[?Key==`ManagedBy`]}' \
  --output json
```

```json
{
  "State": "ENABLED",
  "StatusMessage": "ENABLED",
  "ManagedByTags": []
}
```

AWS returns the literal status message `ENABLED` rather than an empty message. The
policy has left `ERROR`, and the duplicate tag is absent.

A manual validation snapshot was created and allowed to finish.

```sh
aws ec2 describe-snapshots --region us-east-1 \
  --snapshot-ids snap-01cfa56e2bc181417 \
  --query 'Snapshots[0].{SnapshotId:SnapshotId,State:State,Progress:Progress,StartTime:StartTime,VolumeSizeGiB:VolumeSize,Encrypted:Encrypted}' \
  --output json
```

```json
{
  "SnapshotId": "snap-01cfa56e2bc181417",
  "State": "completed",
  "Progress": "100%",
  "StartTime": "2026-08-02T23:09:43.578000+00:00",
  "VolumeSizeGiB": 30,
  "Encrypted": true
}
```

### Resulting state

- Stack: `UPDATE_COMPLETE`.
- DLM policy: `ENABLED`, with no duplicate `ManagedBy` entry.
- Existing instance and retained data volume: unchanged and attached.
- New encrypted snapshot: `snap-01cfa56e2bc181417`, completed.

## Task 2 — Deploy current `main` to production

`main` advanced while the first build was deploying, so the release was rebuilt a
second time after the concurrent changes and infrastructure records merged. The final
application source commit is `90ebc3a6e693a11108d6be56263b832367cceee1`.
The later `e8415c1` commit changes only this release record.

### Commands and raw output

```sh
gh run watch 30772925645 --repo AnasShaikh/openwork-react-app --exit-status
```

```text
✓ main CI AnasShaikh/openwork-react-app#3 · 30772925645
✓ frontend in 29s
✓ backend in 22s
```

The CI log reported `51/51` frontend tests and `37/37` backend tests, with the backend
audit, parse check, and frontend build passing.

```sh
git archive --format=zip \
  --output /tmp/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip \
  90ebc3a6e693a11108d6be56263b832367cceee1
shasum -a 256 /tmp/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip
aws s3 cp /tmp/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip \
  s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip \
  --region us-east-1 --only-show-errors
```

```text
62faad244b16f96713044a385882b75560981ec035e8cc114966c35afb91a0d1  /tmp/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip
```

```sh
aws codebuild start-build --region us-east-1 \
  --project-name openwork-react-app-prod-build \
  --source-location-override openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip \
  --environment-variables-override name=IMAGE_TAG,value=prod-90ebc3a-20260802234539,type=PLAINTEXT
```

```json
{
  "Id": "openwork-react-app-prod-build:24084ed1-b5a5-4b36-856a-32a70f07893f",
  "Status": "IN_PROGRESS",
  "Source": "openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-90ebc3a6e693a11108d6be56263b832367cceee1.zip",
  "ImageTag": "prod-90ebc3a-20260802234539",
  "StartTime": "2026-08-03T05:17:55.738000+05:30"
}
```

```sh
aws codebuild batch-get-builds --region us-east-1 \
  --ids openwork-react-app-prod-build:24084ed1-b5a5-4b36-856a-32a70f07893f \
  --query 'builds[0].{Status:buildStatus,CurrentPhase:currentPhase,StartTime:startTime,EndTime:endTime}' \
  --output json
```

```json
{
  "Status": "SUCCEEDED",
  "CurrentPhase": "COMPLETED",
  "StartTime": "2026-08-03T05:17:55.738000+05:30",
  "EndTime": "2026-08-03T05:19:09.615000+05:30"
}
```

```sh
aws ecr describe-images --region us-east-1 --repository-name openwork-app \
  --image-ids imageTag=prod-90ebc3a-20260802234539 \
  --query 'imageDetails[0].{Tags:imageTags,Digest:imageDigest,PushedAt:imagePushedAt,SizeBytes:imageSizeInBytes}' \
  --output json
```

```json
{
  "Tags": ["prod-90ebc3a-20260802234539"],
  "Digest": "sha256:038e11f1ebb2752a16a57d1f007ae5d77a997a31ac061acca3a7c802082c6349",
  "PushedAt": "2026-08-03T05:19:08.686000+05:30",
  "SizeBytes": 131975471
}
```

App Runner was updated by copying its complete current source configuration and
changing only `ImageIdentifier`.

```json
{
  "OperationId": "6605c2c395be429bbf73588a05d2342b",
  "Status": "OPERATION_IN_PROGRESS",
  "Image": "256309399568.dkr.ecr.us-east-1.amazonaws.com/openwork-app:prod-90ebc3a-20260802234539",
  "RelevantSecrets": {
    "HEALTH_SECRET": "arn:aws:ssm:us-east-1:256309399568:parameter/openwork/react-app/prod/HEALTH_SECRET",
    "OPS_API_TOKEN": "arn:aws:ssm:us-east-1:256309399568:parameter/openwork/react-app/prod/OPS_API_TOKEN",
    "LIGHTHOUSE_API_KEY": null,
    "PINATA_JWT": "arn:aws:ssm:us-east-1:256309399568:parameter/openwork/react-app/prod/PINATA_API_KEY"
  }
}
```

```sh
aws apprunner list-operations --region us-east-1 \
  --service-arn arn:aws:apprunner:us-east-1:256309399568:service/openwork-react-app-prod/94e9a6cf2c054eac98cb4eb0a68445e6 \
  --query "OperationSummaryList[?Id=='6605c2c395be429bbf73588a05d2342b']|[0].{Id:Id,Status:Status,StartedAt:StartedAt,EndedAt:EndedAt}" \
  --output json
```

```json
{
  "Id": "6605c2c395be429bbf73588a05d2342b",
  "Status": "SUCCEEDED",
  "StartedAt": "2026-08-03T05:19:28+05:30",
  "EndedAt": "2026-08-03T05:23:04+05:30"
}
```

```sh
aws logs tail /aws/apprunner/openwork-react-app-prod/94e9a6cf2c054eac98cb4eb0a68445e6/application \
  --region us-east-1 --since 10m --format short | rg 'Arbitrum RPC' | tail -1
```

```text
2026-08-02T23:50:16    - Arbitrum RPC: https://arb-mainnet.g.alchemy.com/*** (mainnet)
```

```text
https://app.openwork.technology/ -> HTTP 200 (text/html; charset=UTF-8)
https://app.openwork.technology/health -> HTTP 200 (text/html; charset=UTF-8)
https://app.openwork.technology/healthz -> HTTP 200 (application/json; charset=utf-8)
https://app.openwork.technology/docs -> HTTP 200 (text/html; charset=UTF-8)
https://app.openwork.technology/documentation -> HTTP 200 (text/html; charset=UTF-8)
https://app.openwork.technology/api/docs -> HTTP 200 (application/json; charset=utf-8)
Deployed JS asset: /assets/index-BG-Kua3N.js
67a9bed6d74754f06c789607f4c7b023736b59f35b99dfb2b589cbb19c4d9341  -
```

### Resulting state

- App Runner: `RUNNING` on the exact final image tag.
- Startup selected the Alchemy host; the public fallback did not engage.
- All requested read-only routes returned HTTP 200.
- No wallet transaction or on-chain write was submitted.
- The canonical release pointer is updated in `docs/production-release-current.md`.

## Task 3 — Configure the two missing tokens

### Commands and raw output

Two independent 384-bit random values were generated in shell variables and written
directly to SSM. The values were immediately unset and were never printed.

```sh
health_secret=$(openssl rand -hex 48)
ops_token=$(openssl rand -hex 48)
aws ssm put-parameter --region us-east-1 \
  --name /openwork/react-app/prod/HEALTH_SECRET \
  --type SecureString --value "$health_secret"
aws ssm put-parameter --region us-east-1 \
  --name /openwork/react-app/prod/OPS_API_TOKEN \
  --type SecureString --value "$ops_token"
unset health_secret ops_token
```

```json
{
  "Version": 1,
  "Tier": "Standard"
}
{
  "Version": 1,
  "Tier": "Standard"
}
```

The App Runner secret map was extended without changing the image or any existing
mapping. Deployment operation `a8cf2fd41e144d059613119947cf6f76` succeeded.

```text
Authenticated GET /api/health -> HTTP 200
```

```json
{
  "overall": "red",
  "elapsed_ms": 120,
  "ipfs_status": "green",
  "contracts_status": "green",
  "rpc_statuses": {
    "arb": "green",
    "op": "green"
  },
  "wallet_statuses": {
    "arb_eth": "red",
    "op_eth": "red"
  },
  "relayer_status": "grey"
}
```

```text
Unauthenticated GET /api/health -> HTTP 401
```

```sh
curl -sS https://app.openwork.technology/healthz | jq .
```

```json
{
  "status": "ok"
}
```

### Resulting state

- Both SSM parameters exist as version-1 `SecureString` values.
- App Runner maps both parameter ARNs.
- Authenticated deep health works; RPC, contract, and IPFS checks are green.
- The `overall: red` result is genuine: both relay-wallet gas balances are critical,
  and relay history is grey because there is no external database.
- `/healthz` already supplies the shallow unauthenticated liveness endpoint.

## Task 4 — Remove the retired Lighthouse secret

### Commands and raw output

The App Runner mapping was removed first. Operation
`cd1cd359b4dd42729648a3c6c495d814` then completed successfully.

```json
{
  "Id": "cd1cd359b4dd42729648a3c6c495d814",
  "Status": "SUCCEEDED",
  "StartedAt": "2026-08-03T04:57:28+05:30",
  "EndedAt": "2026-08-03T05:01:22+05:30"
}
```

```sh
aws ssm delete-parameter --region us-east-1 \
  --name /openwork/react-app/prod/LIGHTHOUSE_API_KEY
aws ssm get-parameters --region us-east-1 \
  --names /openwork/react-app/prod/LIGHTHOUSE_API_KEY \
  --query '{Parameters:Parameters[].Name,InvalidParameters:InvalidParameters}' \
  --output json
```

```json
{
  "Parameters": [],
  "InvalidParameters": [
    "/openwork/react-app/prod/LIGHTHOUSE_API_KEY"
  ]
}
```

```json
{
  "Status": "RUNNING",
  "Image": "256309399568.dkr.ecr.us-east-1.amazonaws.com/openwork-app:prod-90ebc3a-20260802234539",
  "LighthouseMapping": null,
  "PinataMapping": "arn:aws:ssm:us-east-1:256309399568:parameter/openwork/react-app/prod/PINATA_API_KEY",
  "MainnetTestRoutes": null
}
```

### Resulting state

- `LIGHTHOUSE_API_KEY` is absent from App Runner and SSM.
- `PINATA_JWT` remains as the fallback upload provider.
- `/api/e2e-test/ipfs-debug` is deliberately not mounted because
  `ENABLE_MAINNET_TEST_ROUTES` is unset; the environment mapping is the authoritative
  proof that `retired_lighthouse_key_still_set` would be false.

## Task 5 — Give the landing site one source of truth

### Commands and raw output

The monorepo build was compared byte-for-byte with the live S3 objects before the
cutover.

```text
index.html local: 10b406cce58d38c0785faf230f7845db4c7ba6a367f4412b1785484b572d5b06
index.html live:  10b406cce58d38c0785faf230f7845db4c7ba6a367f4412b1785484b572d5b06
assets/index-D93FVCTK.js local: f874cd6d046ba85d2537ede37cc00a4a2149317b981ab1231556bd7a0b173753
assets/index-D93FVCTK.js live:  f874cd6d046ba85d2537ede37cc00a4a2149317b981ab1231556bd7a0b173753
assets/index-Dc0ogmOU.css local: eb1a69d72f45e42a24a6446747c6dbb032d6b71f40116cd82caf3aef1f312fdf
assets/index-Dc0ogmOU.css live:  eb1a69d72f45e42a24a6446747c6dbb032d6b71f40116cd82caf3aef1f312fdf
```

An IAM role named `OpenWorkLandingGitHubDeployRole` was created. Its trust policy is
limited to GitHub OIDC subject
`repo:AnasShaikh/openwork-react-app:ref:refs/heads/main`; its inline policy is limited
to the landing bucket and CloudFront distribution `E1ANKLS7O4YGAE`.

PR `#8` merged the deployment workflow and documentation changes as commit
`e4deaf2b8dcacc34f81e9093e29a23cbddc326a6`.

```sh
gh run view 30772660120 --repo AnasShaikh/openwork-react-app \
  --json status,conclusion,headSha,url
```

```json
{
  "conclusion": "success",
  "headSha": "e4deaf2b8dcacc34f81e9093e29a23cbddc326a6",
  "status": "completed",
  "url": "https://github.com/AnasShaikh/openwork-react-app/actions/runs/30772660120"
}
```

```text
Landing site  Configure AWS credentials  Assuming role with OIDC
Landing site  Publish landing site  upload: dist/assets/index-D93FVCTK.js to s3://openwork-technology-landing-prod-256309399568/assets/index-D93FVCTK.js
Landing site  Publish landing site  upload: dist/assets/index-Dc0ogmOU.css to s3://openwork-technology-landing-prod-256309399568/assets/index-Dc0ogmOU.css
Landing site  Publish landing site  upload: dist/index.html to s3://openwork-technology-landing-prod-256309399568/index.html
```

```text
https://www.openwork.technology/ -> HTTP 200 (text/html)
https://openwork.technology/ -> HTTP 301 (text/html; charset=utf-8)
```

The post-deploy hashes remained identical to the values above.

The archive operation was attempted with the available GitHub credential.

```sh
gh api --method PATCH repos/krishnaprasath-k/openwork-landing \
  -F archived=true
```

```text
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#update-a-repository","status":"404"}
gh: Not Found (HTTP 404)
```

```json
{
  "isArchived": false,
  "url": "https://github.com/krishnaprasath-k/openwork-landing",
  "viewerPermission": "READ"
}
```

### Resulting state

- `landing/` in this monorepo is the production source of truth.
- Pushes to `main` that affect `landing/` build, publish to the existing bucket, and
  invalidate CloudFront using short-lived OIDC credentials.
- The first monorepo deployment was byte-identical to the previous site.
- The README warning is removed, and `PROJECT_STATUS.md` marks the source-of-truth
  problem resolved.
- Remaining blocker: an owner/admin of `krishnaprasath-k/openwork-landing` must archive
  it. The current credential has only `READ` permission.

The landing dependency install also reported 14 existing audit findings (1 low,
2 moderate, 11 high). They did not block this byte-identical infrastructure cutover.

## Task 6 — Report IPFS disk headroom

### Commands and raw output

```sh
aws ssm send-command --region us-east-1 \
  --instance-ids i-06c86f1fe68ead8e7 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["df -h /var/lib/openwork-ipfs","sudo docker exec openwork-ipfs ipfs repo stat --human","sudo docker exec openwork-ipfs ipfs repo stat","sudo docker exec openwork-ipfs ipfs pin ls --type=recursive | wc -l"]'
```

```json
{
  "Status": "Success",
  "ResponseCode": 0,
  "ExecutionElapsedTime": "PT1.316S",
  "StandardOutputContent": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme1n1     30G  2.9G   25G  11% /var/lib/openwork-ipfs\nNumObjects: 99\nRepoSize:   3.1 GB\nStorageMax: 20 GB\nRepoPath:   /data/ipfs\nVersion:    fs-repo@18\nNumObjects: 99\nRepoSize:   3084837478\nStorageMax: 20000000000\nRepoPath:   /data/ipfs\nVersion:    fs-repo@18\n33\n",
  "StandardErrorContent": ""
}
```

The later authenticated public readback, after enabling the route, was:

```json
{
  "RepoSize": 3522976568,
  "StorageMax": 20000000000,
  "NumObjects": 99,
  "RepoPath": "/data/ipfs",
  "Version": "fs-repo@18"
}
```

Current usage at that readback was 17.61% of the cap, leaving
`16,477,023,432` bytes of headroom. Recursive pin count: `33`.

The CloudWatch Agent server policy was attached to `OpenWorkIpfsNodeRole`, agent
version `1.300067.1` was installed, and the agent reported:

```json
{
  "status": "running",
  "starttime": "2026-08-02T23:41:32+00:00",
  "configstatus": "configured",
  "version": "1.300067.1"
}
```

The alarm uses the custom `OpenWork/IPFS` `disk_used` metric and fires at
`16,000,000,000` bytes, 80% of the Kubo cap and before the application's 85%
circuit breaker.

```sh
aws cloudwatch describe-alarms --region us-east-1 \
  --alarm-names OpenWork-IPFS-DataVolume-Used-80PctOfRepoCap \
  --query 'MetricAlarms[0].{StateValue:StateValue,StateReason:StateReason,Threshold:Threshold,AlarmActions:AlarmActions}' \
  --output json
```

```json
{
  "StateValue": "OK",
  "StateReason": "Threshold Crossed: 1 out of the last 1 datapoints [3.088453632E9 (02/08/26 23:43:00)] was not greater than or equal to the threshold (1.6E10) (minimum 1 datapoint for ALARM -> OK transition).",
  "Threshold": 16000000000.0,
  "AlarmActions": []
}
```

No suitable OpenWork SNS notification topic exists; the only account topic is for
an unrelated Lancy billing alert. The alarm therefore has no notification action.

The live nginx file was patched without displaying it or its bearer secret. Nginx
validated and reloaded successfully:

```json
{
  "Status": "Success",
  "ResponseCode": 0,
  "ExecutionElapsedTime": "PT1.113S",
  "StandardOutputContent": "active\nrepo/stat route present\n",
  "StandardErrorContent": "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n"
}
```

```text
Unauthenticated POST /api/v0/repo/stat -> HTTP 401
Unauthenticated POST /api/v0/add -> HTTP 401
```

The durable CloudFormation source change was merged in PR `#9` as commit
`90ebc3a6e693a11108d6be56263b832367cceee1`.

### Resulting state

- Disk usage and pin count are known.
- CloudWatch Agent is running and the 16 GB alarm is `OK` on real data.
- Authenticated `repo/stat` is live; unauthenticated access fails with HTTP 401.
- The application disk circuit breaker can now measure the Kubo repository.
- The nginx route persists in the CloudFormation source.

## Task 7 — IPFS gateway TLS minimum assessment

### Command and raw output

```sh
aws cloudfront get-distribution --id ER37VLKFH3TGU \
  --query 'Distribution.{Id:Id,Status:Status,DomainName:DomainName,LastModifiedTime:LastModifiedTime,Enabled:DistributionConfig.Enabled,Aliases:DistributionConfig.Aliases,ViewerCertificate:DistributionConfig.ViewerCertificate,Origins:DistributionConfig.Origins.Items[].{Id:Id,DomainName:DomainName,OriginProtocolPolicy:CustomOriginConfig.OriginProtocolPolicy}}' \
  --output json
```

```json
{
  "Id": "ER37VLKFH3TGU",
  "Status": "Deployed",
  "DomainName": "d3srbkj28cvt4z.cloudfront.net",
  "LastModifiedTime": "2026-07-19T15:10:17.716000+00:00",
  "Enabled": true,
  "Aliases": {
    "Quantity": 0
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "SSLSupportMethod": "vip",
    "MinimumProtocolVersion": "TLSv1",
    "CertificateSource": "cloudfront"
  },
  "Origins": [
    {
      "Id": "openwork-ipfs-ec2",
      "DomainName": "ec2-3-227-29-148.compute-1.amazonaws.com",
      "OriginProtocolPolicy": "http-only"
    }
  ]
}
```

The existing ACM certificate covers only `openwork.technology` and
`www.openwork.technology`; it cannot be reused for `ipfs.openwork.technology`.
There is no Route 53 hosted zone in this AWS account, so DNS would also require the
external DNS provider.

### Resulting state

- No TLS or production endpoint change was made.
- Recommendation: defer until a custom IPFS hostname is wanted or policy requires it.
- Raising the floor still requires a new certificate, external DNS change, CloudFront
  alias/certificate update, `IPFS_API_URL` change, and App Runner deployment.

## Final repository and production pointers

- Repository head after recording the release: `e8415c1ac4eb806c96afe4f1bf7e1335d76d480a`.
- Deployed application source: `90ebc3a6e693a11108d6be56263b832367cceee1`.
- Release record PR: `#10`.
- Landing cutover PR: `#8`.
- IPFS proxy-source PR: `#9`.
