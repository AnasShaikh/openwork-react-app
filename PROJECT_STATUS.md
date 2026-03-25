# OpenWork — Project Status & Source of Truth
_Last updated: 2026-03-21_

---

## 1. Live Infrastructure

| Item | Value |
|------|-------|
| **App URL** | https://app.openwork.technology |
| **Backend (Cloud Run)** | https://openwork-823072243332.us-central1.run.app |
| **GCP Project** | `openwork-480320` |
| **Cloud Run service** | `openwork` (region: `us-central1`) |
| **Service Account** | `openwork-deploy-bot@openwork-480320.iam.gserviceaccount.com` |
| **GitHub repo** | https://github.com/botopenwork-ui/openwork-react-app |
| **VPS workspace** | `/data/.openclaw/workspace/openwork` (Hostinger VPS, Docker container) |

### How to deploy
```bash
cd /data/.openclaw/workspace/openwork
/home/linuxbrew/.linuxbrew/bin/gcloud run deploy openwork \
  --source . --region=us-central1 --clear-base-image
```
There is **no CI/CD pipeline**. All deployments are manual from the VPS workspace.

---

## 2. GitHub Access

- **Org:** `botopenwork-ui` (GitHub organization)
- The `OpenArmand` token (used by the agent) has **read-only** access — cannot merge PRs or manage collaborators
- **To get admin access:** Armand must log into GitHub directly at https://github.com/botopenwork-ui and either:
  - Claim ownership of the org (if it was created under a shared/bot account), OR
  - Ask Anas to add `armandp008` as an org owner
- **Open PR:** [#1 — fix: remove undefined setCoreHovered calls](https://github.com/botopenwork-ui/openwork-react-app/pull/1) — safe to merge (dead state removal, no functional change)

---

## 3. IPFS — Current Status & Options

### Current state
- **Lighthouse trial: EXPIRED** — `LIGHTHOUSE_API_KEY=ab144d81.75f7ef7ef3b44f61bb190fa8ee7bacc8` is no longer valid
- **Pinata:** was used as a temporary fallback — no active credentials in Cloud Run env
- **Result:** All file uploads currently fail (profile images, portfolio files, job attachments)

### How IPFS is architected (backend/routes/ipfs.js)
The backend has a 3-strategy fallback chain — no code changes needed, just set the right env var in Cloud Run:

| Priority | Provider | Env var required | Cost |
|----------|----------|-----------------|------|
| 1st | Lighthouse | `LIGHTHOUSE_API_KEY` | Paid (~$10/mo) |
| 2nd | Pinata REST API | `PINATA_JWT` | Paid (~$20/mo) |
| 3rd | Self-hosted IPFS node | `IPFS_API_URL` + `IPFS_PROXY_SECRET` | Free (just GCP compute) |

### Recommended approach (self-sovereign, no vendor dependency)
Run a [Kubo (go-ipfs)](https://github.com/ipfs/kubo) node on GCP — either as a Cloud Run job or a small Compute Engine VM (`e2-micro` is free tier eligible). Expose it via HTTPS, set `IPFS_API_URL` + `IPFS_PROXY_SECRET` in Cloud Run env, done.

This eliminates any paid dependency. If the node goes down, restart it — no billing surprises.

**Quickest fix right now:** Create a new free Lighthouse account at https://lighthouse.storage — free tier gives 5GB. Set the new key as `LIGHTHOUSE_API_KEY` in Cloud Run. Takes 5 minutes.

---

## 4. Contract Addresses (Mainnet — Live)

### Arbitrum One (Chain ID: 42161) — Native Chain
| Contract | Address |
|----------|---------|
| OpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| NOWJC | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| LOWJC (proxy, redeployed 19-Mar-2026) | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| AthenaClient (proxy, redeployed 19-Mar-2026) | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` |
| NativeAthena V5 | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` |
| NativeDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` |
| ProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` |
| ProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` |
| OracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` |
| NativeRewards | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| NativeBridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` |

### Optimism (Chain ID: 10) — Local Chain
| Contract | Address |
|----------|---------|
| LocalLOWJC | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` |
| LocalBridgeOP | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| AthenaClientOP | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |

### Ethereum Mainnet (Chain ID: 1) — Main Chain
| Contract | Address |
|----------|---------|
| OWORK Token | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |
| MainDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| MainBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |

### USDC Addresses (Mainnet)
| Chain | Address |
|-------|---------|
| Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |

### Verification status (as of 19-Mar-2026)
✅ 23/23 contracts verified on block explorers. Full registry: `contracts/live-contract-registry-19-mar-2026.md`

---

## 5. Service Wallet

| Item | Value |
|------|-------|
| **Address (W2)** | `0xb8dC69937e745Fd02661BC4333f3852166eF2026` |
| **Private key** | Stored ONLY in Cloud Run env as `WALL2_PRIVATE_KEY` — never in repo |
| **Alert threshold** | ETH < 0.003 on ARB or OP → notify Armand |
| **W1 (COMPROMISED)** | `0x5a79836F...` — never use |

---

## 6. CCTP Bridge Rules (never violate)

- **OP → ARB:** Call ARB `MessageTransmitter.receiveMessage()` directly
- **ARB → OP:** Call OP `CCTPTransceiver.receive()` — selector `0x7376ee1f`
- `startDirectContract` / `startJob`: minimum **1M gas**
- LayerZero fee: ~0.000066 ETH

---

## 7. UI — QA Status

**QA Sheet:** https://docs.google.com/spreadsheets/d/1vZfdKcFYJELwJDwYdjQ921Y5jdeRClkVrr9K_aMHnv8

### Fixes applied (commits 90d3f4a, dc8b611, 9d4cf1d — all deployed)

| Screen | Fix applied |
|--------|------------|
| `/` | AI chat button removed from header |
| `/profile/{address}` | "No data available" message when profile empty; username input placeholder added |
| `/profile-portfolio` | Error color fixed (#dc3545→#aaa); filter pulls real skills dynamically; grid rendered |
| `/profile/{address}/jobs` | Back button enlarged to 60×60px |
| `/browse-jobs` | Active/Completed filter fixed (BigInt comparison bug → `Number(job.status)`) |
| `/job-details` | Profile avatar placeholder → avatar-profile.svg |
| `/job-deep-view` | Profile avatar placeholder → avatar-profile.svg |
| `/post-job` | Optimism "ready to post" button removed |

### Additional fixes (commit 9d4cf1d)
- DAO: removed hardcoded '120' members fallback; better empty state for proposals
- JoinDAO: minimum staking corrected to 1,000,000 OW tokens
- SkillOracle: rewritten to show oracle rows (name, description, members, status)
- BrowseTalent: minor UI corrections

### Runtime fix (PR #1 — pending merge)
- Work.jsx, Governance.jsx, App.jsx, Profile.jsx: removed `setCoreHovered` dead state causing `ReferenceError` on hover

### Remaining QA work
1. **Merge PR #1** (requires Armand GitHub access)
2. **Deeper pages sweep** — pages not yet checked for minor UI issues; no confirmed bugs, needs one pass
3. **End-to-end job cycle test** — blocked until IPFS is restored; covers: post job → apply → accept → submit work → release payment

---

## 8. Known Issues / Blockers

| Issue | Severity | Status |
|-------|----------|--------|
| IPFS uploads broken (Lighthouse expired, no Pinata JWT) | 🔴 Critical | Blocked on new API key or self-hosted node |
| PR #1 not merged (no GitHub admin access) | 🟡 Medium | Blocked on Armand getting GitHub access |
| End-to-end job cycle not verified | 🟡 Medium | Blocked by IPFS |
| OP CCTPTransceiver Circle addresses (potential cross-chain USDC issue — see audit 19-Mar) | 🟡 Medium | Under review |

---

## 9. Audit Report (19-Mar-2026)
Full report: `openwork/audit-report-19-mar-2026.html`

Summary: 17 PASS / 0 CRITICAL (after fixes) / 3 WARNINGS
- NativeAthena.jobContract() has no public getter
- ActivityTracker.athena() has no public getter
- NativeArbLOWJC job count = 0 (expected for fresh proxy)

---

## 10. Immediate Action Items for Armand

1. **IPFS (5 min fix):** Go to https://lighthouse.storage → create free account → set `LIGHTHOUSE_API_KEY` in Cloud Run env vars for the `openwork` service
2. **GitHub access:** Log into GitHub, go to https://github.com/botopenwork-ui — take org ownership or ask Anas to add you as owner, then merge PR #1
3. **After IPFS is live:** Agent runs full end-to-end job cycle test and reports
4. **After PR #1 merged + IPFS live:** Agent does final UI sweep across all deeper pages, updates QA sheet
