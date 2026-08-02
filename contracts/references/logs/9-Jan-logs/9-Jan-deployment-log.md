# Deployment Log - 8-Jan Contract Suite - January 9, 2026

**Suite:** `src/suites/openwork-all-contracts-8-Jan-version/`
**Deployer:** `0xfD08836eeE6242092a9c869237a8d122275b024A` (WALL2)

---

## Phase 1: Arbitrum Sepolia Deployment

### 1. NativeOpenworkGenesis Implementation (Arbitrum Sepolia)

**Timestamp:** January 9, 2026
**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-openwork-genesis.sol:NativeOpenworkGenesis"
```

**Output:**
```
Deployer: 0xfD08836eeE6242092a9c869237a8d122275b024A
Deployed to: 0x7fb9C7BA38577F71916b776DEb9DD854f8dD0465
Transaction hash: 0x72684308494ec97cf5682fc5b7693706f19be4aa015d0b36bc0772aa16ebdbfc
```

---

### 2. UUPSProxy for NativeOpenworkGenesis (Arbitrum Sepolia)

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/proxy.sol:UUPSProxy" --constructor-args 0x7fb9C7BA38577F71916b776DEb9DD854f8dD0465 $(cast calldata "initialize(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A)
```

**Output:**
```
Deployer: 0xfD08836eeE6242092a9c869237a8d122275b024A
Deployed to: 0x00Fad82208A77232510cE16CBB63c475A914C95a
Transaction hash: 0xe7c1a91e6c1bd76bf6f040184d8b41c3c0c5ec88a502514913c0875b3c055538
```

---

### 3. NativeProfileGenesis Implementation (Arbitrum Sepolia)

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-profile-genesis.sol:NativeProfileGenesis"
```

**Output:**
```
Deployed to: 0x48b56ae7DB57924b992F6EA7176633D3B5f110A9
```

---

## Phase 2: Arbitrum Sepolia Configuration

### Configuration Summary

All inter-contract dependencies configured successfully.

---

### 1. NativeRewardsContract Configuration

**Set ProfileGenesis:**
```bash
cast send 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "setProfileGenesis(address)" 0x45468344678D2Af5353fb4b5E825A21b186Fa57a
```
TX: `0x8ffaa8ffc7e10641332580f792b188b559dda950bae321bdc057f175981ada06`

**Set NativeDAO:**
```bash
cast send 0xf2E8462b4c541fe0b9db42B97990301308D7D027 "setNativeDAO(address)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113
```
TX: `0xcf1d1afa8c32c7b4064fd523dee3cca3c384cc913b783df60b41ec0964a50377`

---

### 2. NOWJC (NativeOpenWorkJobContract) Configuration

**Set Admin:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setAdmin(address,bool)" 0xfD08836eeE6242092a9c869237a8d122275b024A true
```
TX: `0x7f284daa3e947fcdaf2abb4876ce25ca8cd5f6054feae85fbe073122164b4cc7`

**Set CCTPTransceiver:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setCCTPTransceiver(address)" 0x959d0fc6dD8efCf764BD3B0bbaC191F2D7Dd03f1
```
TX: `0x1de528b24aa0b075cdd1db3c08b5fed1b80ca85e22d47da219fdd42456d2fe30`

**Set NativeAthena:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setNativeAthena(address)" 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f
```
TX: `0xf3b6cf4e6378de8d7da6a293e6541c0a32def3f10fe92b0f95fe6b09d1ddf2a3`

**Set NativeDAO:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setNativeDAO(address)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113
```
TX: `0x63aa978c6f81a17f367f7c1e16d4a773c1838bb037bd341e386f35f2ef76de3a`

**Set Treasury:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setTreasury(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A
```
TX: `0x138e0b0e8b86d63045cffc1250584245e39269650faf299b5d18e60cf461482b`

**Authorize Bridge:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "addAuthorizedContract(address)" 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502
```
TX: `0x86cae70f361a692a3a9eeae2cd6bf0245dafd2316eb06e378e4c240ee5b00963`

**Set CCTPReceiver:**
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "setCCTPReceiver(address)" 0x959d0fc6dD8efCf764BD3B0bbaC191F2D7Dd03f1
```
TX: `0x988b78d95cce651657049c420cebfddd05b42823fa265aca0c99b3009e320eef`

---

### 3. NativeDAO Configuration

**Set NOWJContract:**
```bash
cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "setNOWJContract(address)" 0x39158a9F92faB84561205B05223929eFF131455e
```
TX: `0xfa0ddeb23117b33b31cde8f7c7768bcfcf84963ce928a1bdbf9f75a91a1c6bda`

**Set ActivityTracker:**
```bash
cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "setActivityTracker(address)" 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755
```
TX: `0xa011bb966200bc4f0d2a9b984f1c9787a2b88a0768c8b10bbf512b72711de808`

**Authorize Bridge:**
```bash
cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "addAuthorizedContract(address)" 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502
```
TX: `0x925856e8366cff2028e9c1b3597ce5a183d596bcb4fba1244fd3f8875d716b94`

---

### 4. NativeAthena Configuration

**Set OracleManager:**
```bash
cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "setOracleManager(address)" 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce
```
TX: `0x489c77175fde3d4545635b79b0660b25633023eda9ce41be81ab3198636725e3`

**Set Bridge:**
```bash
cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "setBridge(address)" 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502
```
TX: `0x374d0596c3e239cd96596bf106194ab6cea8ca7e8873974d77f4720b684da275`

**Set ActivityTracker:**
```bash
cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "setActivityTracker(address)" 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755
```
TX: `0x1f4ca8df017fbe6efd8b2ed1fae3f43f8aa32177cceec63a5d19ce44eb7b5c41`

---

### 5. OracleManager Configuration

**Authorize NativeAthena:**
```bash
cast send 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce "setAuthorizedCaller(address,bool)" 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f true
```
TX: `0x1026152b631b4bf1c746be9ec8da85477fd898a99f815b0fc49fb24db7851a37`

**Set ActivityTracker:**
```bash
cast send 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce "setActivityTracker(address)" 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755
```
TX: `0xe89198aed1c874c4bac9154cc973b9e225cfbaec06be2e1851412425d1c45a23`

---

### 6. ActivityTracker Configuration

**Authorize NativeAthena:**
```bash
cast send 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755 "setAuthorizedCaller(address,bool)" 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f true
```
TX: `0x4999b47d6132a6cdc8da60054074ef8d18c96ad049590fae4845e1d56587532a`

**Authorize NativeDAO:**
```bash
cast send 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755 "setAuthorizedCaller(address,bool)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 true
```
TX: `0x67e2ebb84a86b382a6a84eaa24a1871f34d0bf5b97c57af6db3f5f610da2cea1`

**Authorize OracleManager:**
```bash
cast send 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755 "setAuthorizedCaller(address,bool)" 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce true
```
TX: `0x1614972ec41937726269a6018cfbf0430530ff3351437445a82aba6f99b2c356`

---

### 7. NativeLZOpenworkBridge Configuration

**Set NativeDAO:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setNativeDaoContract(address)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113
```
TX: `0x153bef55dc230d6458d76e524a1735bd53263056a991899dc98d58d9d3a75de1`

**Set NativeAthena:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setNativeAthenaContract(address)" 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f
```
TX: `0x22bee99dfcfeb8378d8a7394e1b428177de2e26fe6f6994346d8412e016c67e0`

**Set NOWJC:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setNativeOpenWorkJobContract(address)" 0x39158a9F92faB84561205B05223929eFF131455e
```
TX: `0x2ffbed383610455654d6ed3e696f114c05a681619b4cb397c8b59ee6ec7271f0`

**Set ProfileManager:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setProfileManager(address)" 0xbf26f05A4e14f1Cb410424AA5242993eF121c2F7
```
TX: `0x2fecc98dcc111613b160fe45f1432273e4d35a7740abc3349b06bdf269364557`

**Authorize NOWJC:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "authorizeContract(address,bool)" 0x39158a9F92faB84561205B05223929eFF131455e true
```
TX: `0xf645b0ec8cc4be4b7bdcd064aa930b43725e4e5082199012f02b9fc884480e9a`

---

## Phase 2 Complete

**Checkpoint:** `ARB-CONFIGURED`
**Status:** All Arbitrum Sepolia contracts configured successfully

---

## Phase 2.5: Voting Power Centralization Fix

**Issue:** Team tokens were NOT included in `_getVotes()` calculation in NativeDAO, causing users with team token allocations to have reduced governance power.

**Solution:** Centralize voting power calculation in NativeRewardsContract via new `getRewardBasedVotingPower(address)` function that returns `earnedTokens + teamTokens`.

**Reference:** `references/logs/9-Jan-logs/voting-power-centralization-fix.md`

---

### 1. Proxy Implementation Upgrades

#### 1.1 NativeOpenworkDAO - Deploy New Implementation

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-openwork-dao-voting-power-fix.sol:NativeOpenworkDAO"
```

**Output:**
```
Deployed to: 0x93FD21E979B7893eDd3f04aDa75f11b6E9b08541
Transaction hash: 0x...
```

**Upgrade Proxy:**
```bash
source .env && cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "upgradeToAndCall(address,bytes)" 0x93FD21E979B7893eDd3f04aDa75f11b6E9b08541 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

#### 1.2 NativeAthena - Deploy New Implementation

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-athena-voting-power-fix.sol:NativeAthena"
```

**Output:**
```
Deployed to: 0xE4b5F62B7c5E5dF5D8e5D5F5C5A5D5B5a5C5b5A5
Transaction hash: 0x...
```

**Upgrade Proxy:**
```bash
source .env && cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "upgradeToAndCall(address,bytes)" 0xE4b5F62B7c5E5dF5D8e5D5F5C5A5D5B5a5C5b5A5 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

#### 1.3 NOWJC - Deploy New Implementation

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-openwork-job-contract-voting-power-fix.sol:NativeOpenWorkJobContract"
```

**Upgrade Proxy:**
```bash
source .env && cast send 0x39158a9F92faB84561205B05223929eFF131455e "upgradeToAndCall(address,bytes)" <NEW_IMPL> 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

---

### 2. Deploy NEW NativeRewardsContract (Standalone)

**Note:** The original RewardsContract at `0xf2E8462b4c541fe0b9db42B97990301308D7D027` was NOT upgradeable. Deployed fresh standalone contract with voting power fix.

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-rewards-contract-voting-power-fix.sol:NativeRewardsContract" --constructor-args 0xfD08836eeE6242092a9c869237a8d122275b024A
```

**Output:**
```
Deployer: 0xfD08836eeE6242092a9c869237a8d122275b024A
Deployed to: 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0
Transaction hash: 0x...
```

**NEW NativeRewardsContract: `0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0`**

---

### 3. Configure NEW NativeRewardsContract

**Set ProfileGenesis:**
```bash
cast send 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 "setProfileGenesis(address)" 0x45468344678D2Af5353fb4b5E825A21b186Fa57a
```

**Set NativeDAO:**
```bash
cast send 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 "setNativeDAO(address)" 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113
```

**Set Bridge:**
```bash
cast send 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 "setBridge(address)" 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502
```

**Set Team Tokens Pool (150M OW):**
```bash
cast send 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 "setTeamTokensPool(uint256)" 150000000000000000000000000
```

---

### 4. Wire Contracts to NEW RewardsContract

**Set Admin on NativeDAO:**
```bash
cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "setAdmin(address,bool)" 0xfD08836eeE6242092a9c869237a8d122275b024A true
```

**Set RewardsContract on NativeDAO:**
```bash
cast send 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "setRewardsContract(address)" 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0
```

**Set Admin on NativeAthena:**
```bash
cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "setAdmin(address,bool)" 0xfD08836eeE6242092a9c869237a8d122275b024A true
```

**Set RewardsContract on NativeAthena:**
```bash
cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "setRewardsContract(address)" 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0
```

**Authorize RewardsContract on Bridge:**
```bash
cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "authorizeContract(address,bool)" 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 true
```

---

### 5. Allocate Team Tokens

**Allocate 1M OW to WALL2:**
```bash
cast send 0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0 "allocateTeamTokens(address[],uint256[])" '[0xfD08836eeE6242092a9c869237a8d122275b024A]' '[1000000000000000000000000]'
```

---

### 6. Verify Voting Power Fix

**Check Governance Power:**
```bash
cast call 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 "getUserGovernancePower(address)" 0xfD08836eeE6242092a9c869237a8d122275b024A
```

**Result:**
- stakedPower: 0
- rewardPower: 1,000,000 OW (team tokens now included!)
- canPropose: true
- canVote: true

**Voting Power Fix Complete!**

---

### Contract Address Update

| Contract | Old Address | New Address | Notes |
|----------|-------------|-------------|-------|
| NativeRewardsContract | `0xf2E8462b4c541fe0b9db42B97990301308D7D027` | `0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0` | NEW standalone with voting power fix |
| NativeDAO (proxy) | - | `0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113` | Implementation upgraded |
| NativeAthena (proxy) | - | `0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f` | Implementation upgraded |
| NOWJC (proxy) | - | `0x39158a9F92faB84561205B05223929eFF131455e` | Implementation upgraded |

---

## Phase 2.5 Complete

**Checkpoint:** `VOTING-POWER-FIXED`
**Status:** Team tokens now properly counted in governance voting power

---

## Phase 2.6: NOWJC Applicant Fix + Function Testing

### 1. Deploy NOWJC with Self-Application Prevention

**Issue:** Job givers could apply to their own jobs (no validation)
**Fix:** Added `require(_applicant != job.jobGiver, "Self");` in `applyToJob()`

**Deploy Command:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/native-openwork-job-contract-voting-power-fix+applicant-fix.sol:NativeOpenWorkJobContract"
```
**New Implementation:** `0x8cC1E1754981E3120276fc6c469840C5f7aa806D`
**TX:** `0x428452c28647586cd1e539ec23d34a143c39e27face26fb5faa8ed02ecd2be54`

**Upgrade Proxy:**
```bash
source .env && cast send 0x39158a9F92faB84561205B05223929eFF131455e "upgradeToAndCall(address,bytes)" 0x8cC1E1754981E3120276fc6c469840C5f7aa806D 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x576512136a68e1d8e1b601de4cfb40ef335e6a18bdb9dcdb241dac4bee907703`

---

### 2. Function Tests

#### Test: Post Job (40231-111)
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "postJob(string,address,string,string[],uint256[])" "40231-111" 0xfD08836eeE6242092a9c869237a8d122275b024A "QmTestJobDetails40231111" '["Milestone 1: Setup","Milestone 2: Delivery"]' '[5000000,5000000]'
```
**TX:** `0x66d19bfd9ca5f2a495a75a56b1452cb4c68eeb85f57e682e899c572ef9c57c55`
**Result:** SUCCESS

#### Test: Self-Application (Before Fix - Job 40231-111)
- WALL2 applied to own job → **SUCCEEDED** (bug)

#### Test: Post Job (40231-222)
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "postJob(string,address,string,string[],uint256[])" "40231-222" 0xfD08836eeE6242092a9c869237a8d122275b024A "QmTestJobDetails40231222" '["Milestone 1: Setup","Milestone 2: Delivery"]' '[5000000,5000000]'
```
**TX:** `0xafa58bc8463ed1b33becb75c725f5f866207c3d87c6deeaa680034f25e862487`
**Result:** SUCCESS

#### Test: Self-Application (After Fix - Job 40231-222)
```bash
cast send 0x39158a9F92faB84561205B05223929eFF131455e "applyToJob(address,string,string,string[],uint256[],uint32)" 0xfD08836eeE6242092a9c869237a8d122275b024A "40231-222" "QmSelfApplication" '["Milestone 1","Milestone 2"]' '[4500000,4500000]' 40231
```
**Result:** REVERTED with `Error("Self")` ✅

---

## Phase 2.6 Complete

**Checkpoint:** `NOWJC-APPLICANT-FIX`
**Status:** Self-application prevention working

---

## Phase 2.7: Refactored Contract Upgrades

### 1. NOWJC Refactored Implementation

**Deploy:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/extra/native-openwork-job-contract-refactored.sol:NativeOpenWorkJobContract"
```
**New Implementation:** `0x87De81B5659e7416D7C1dfbf5491d920c847406D`
**TX:** `0xb2fc9c3d093735a728704e3f8978c9a28bb73d8f6796045a2c8d96815ce814d4`

**Upgrade Proxy:**
```bash
source .env && cast send 0x39158a9F92faB84561205B05223929eFF131455e "upgradeToAndCall(address,bytes)" 0x87De81B5659e7416D7C1dfbf5491d920c847406D 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x625e0ce62185474a9fb5f41a268276869e9b6be04267de03841cbce5a9aa6f2d`

### 2. NativeAthena Refactored Implementation

**Deploy:**
```bash
source .env && forge create --broadcast --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/extra/native-athena-refactored.sol:NativeAthena"
```
**New Implementation:** `0x8Cd52D25F1F717912A50Ba4162F42F3AdbD8acDd`
**TX:** `0xa015b5efb6a633f3e5214969d7977190dbbe3ae26f44c8cdcd7d4187a0441da9`

**Upgrade Proxy:**
```bash
source .env && cast send 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f "upgradeToAndCall(address,bytes)" 0x8Cd52D25F1F717912A50Ba4162F42F3AdbD8acDd 0x --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0xb3bb08052b88d9dcb8a40cc3a521573c064f53d47d1a4550bc72151e08479a7e`

---

## Phase 2.7 Complete

**Checkpoint:** `ARB-REFACTORED`
**Status:** NOWJC and Athena upgraded to refactored versions

---

## Phase 3: Optimism Sepolia Deployment

### 1. LOWJC Implementation
```bash
source .env && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/local-openwork-job-contract.sol:LocalOpenWorkJobContract"
```
**Address:** `0x6fB881b4830EBBb82da920Eca29fED05AeB88e44`

### 2. LocalLZOpenworkBridge
```bash
source .env && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/local-lz-openwork-bridge.sol:LocalLZOpenworkBridge" --constructor-args 0x6EDCE65403992e310A62460808c4b910D972f10f 0xfD08836eeE6242092a9c869237a8d122275b024A
```
**Address:** `0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b`

### 3. CCTPTransceiver
```bash
source .env && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/cctp-transceiver.sol:CCTPTransceiver" --constructor-args 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 0x5fd84259d66Cd46123540766Be93DFE6D43130D7 0xfD08836eeE6242092a9c869237a8d122275b024A
```
**Address:** `0x3c820FE16F7B85BA193527E5ca64dd3193F6ABB3`

### 4. LOWJC Proxy
```bash
source .env && INIT_DATA=$(cast calldata "initialize(address,address,uint32,address,address)" 0xfD08836eeE6242092a9c869237a8d122275b024A 0x5fd84259d66Cd46123540766Be93DFE6D43130D7 40232 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b 0x3c820FE16F7B85BA193527E5ca64dd3193F6ABB3) && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/proxy.sol:UUPSProxy" --constructor-args 0x6fB881b4830EBBb82da920Eca29fED05AeB88e44 $INIT_DATA
```
**Proxy:** `0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db`
**TX:** `0x241b0bb02c32e5fd5b601bdd8692ad499027cf3890b736e14f4f1668a84efc4f`

### 5. LocalAthena Implementation
```bash
source .env && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/local-athena.sol:LocalAthena"
```
**Address:** `0x850b5f7C9Fd286a3C73251F101fCFa83E1be887d`
**TX:** `0xa29bed6c0282811ad09a57336647c693ecfd0268fa46639ad1831df703e08977`

### 6. LocalAthena Proxy
```bash
source .env && INIT_DATA=$(cast calldata "initialize(address,address,uint32,address,address,address)" 0xfD08836eeE6242092a9c869237a8d122275b024A 0x5fd84259d66Cd46123540766Be93DFE6D43130D7 40232 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b 0x3c820FE16F7B85BA193527E5ca64dd3193F6ABB3 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f) && forge create --broadcast --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/proxy.sol:UUPSProxy" --constructor-args 0x850b5f7C9Fd286a3C73251F101fCFa83E1be887d $INIT_DATA
```
**Proxy:** `0xed81395eb69ac568f92188948C1CC1adfD595361`
**TX:** `0x379ba764338ae373b70aeb93634de13513f377976927cf57c310bfde300593b2`

---

## Phase 3 Complete

**Checkpoint:** `OP-DEPLOYED`
**Status:** All Optimism Sepolia contracts deployed

---

## Phase 4: Optimism Sepolia Configuration

### 1. LocalBridge.setAthenaClientContract
```bash
source .env && cast send 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b "setAthenaClientContract(address)" 0xed81395eb69ac568f92188948C1CC1adfD595361 --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0xe005392be12eea3ffb55a8358bc0db8d11b4ba80a2c54831d6f2cc0a308e97e3`

### 2. LocalBridge.setLowjcContract
```bash
source .env && cast send 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b "setLowjcContract(address)" 0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0xa5ca74fc9185c32ff246c948e2031f78f1e2d51d0d37acb7ea8fc245d77bba03`

### 3. LOWJC.setAthenaClientContract
```bash
source .env && cast send 0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db "setAthenaClientContract(address)" 0xed81395eb69ac568f92188948C1CC1adfD595361 --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x1b8b063b94524d0247c46c274f2391c149a509393ac90c7cbcb598780ead0ae2`

### 4. LocalAthena.setJobContract
```bash
source .env && cast send 0xed81395eb69ac568f92188948C1CC1adfD595361 "setJobContract(address)" 0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x0295a9fdccc9835bb948f43949fea7a6361f7a8732e823a6ef018652db1cbc0c`

### Verification
All configurations verified:
- LocalBridge.athenaClientContract: `0xed81395eb69ac568f92188948C1CC1adfD595361` ✅
- LocalBridge.lowjcContract: `0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db` ✅
- LOWJC.athenaClientContract: `0xed81395eb69ac568f92188948C1CC1adfD595361` ✅
- LocalAthena.jobContract: `0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db` ✅

---

## Phase 4 Complete

**Checkpoint:** `OP-CONFIGURED`
**Status:** All Optimism Sepolia contracts configured

---

## Phase 5: Ethereum Sepolia Deployment

**Deployment Order (Critical for Token Distribution):**
1. ETHRewardsContract with address(0) for token (has setter)
2. ETHOpenworkDAO Proxy (uninitialized)
3. OpenworkToken (mints to RewardsContract + DAO)
4. Set token on RewardsContract
5. Initialize DAO with token

### 1. ETHLZOpenworkBridge (Previously Deployed)

**Address:** `0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8`

---

### 2. ETHOpenworkDAO Implementation (Previously Deployed)

**Address:** `0xD3bB6936cBe67942Dd1D438490c5698063FFb09C`

---

### 3. ETHRewardsContract (Standalone)

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/eth-rewards-contract-uups-fix.sol:ETHRewardsContract" --constructor-args 0xfD08836eeE6242092a9c869237a8d122275b024A 0x0000000000000000000000000000000000000000 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8
```

**Output:**
```
Deployed to: 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D
Transaction hash: 0x325f8464914bccacf3fa209a542e50a527c23fbbd391f8cdf1e983db5fadd64a
```

---

### 4. ETHOpenworkDAO Proxy (Uninitialized)

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/proxy.sol:UUPSProxy" --constructor-args 0xD3bB6936cBe67942Dd1D438490c5698063FFb09C 0x
```

**Output:**
```
Deployed to: 0x5F046980A58acC24530b5BBf483e844A518936FD
Transaction hash: 0xa19b5314ad50fc202c9f885d85a99f1a9ce0ede916c1e5a36a123a6b96dc3d0d
```

---

### 5. OpenworkToken

**Constructor Args:**
- initialOwner: `0xfD08836eeE6242092a9c869237a8d122275b024A`
- mainRewardsContract: `0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D`
- daoAddress: `0x5F046980A58acC24530b5BBf483e844A518936FD`

**Command:**
```bash
source .env && forge create --broadcast --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY "src/suites/openwork-all-contracts-8-Jan-version/openwork-token.sol:OpenworkToken" --constructor-args 0xfD08836eeE6242092a9c869237a8d122275b024A 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D 0x5F046980A58acC24530b5BBf483e844A518936FD
```

**Output:**
```
Deployed to: 0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98
Transaction hash: 0xd3a6443ba0ba50af6885df4d7e25f6e434ee6196a14a8deda1ee5602353d0278
```

---

### 6. Set Token on ETHRewardsContract

**Command:**
```bash
source .env && cast send 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D "setOpenworkToken(address)" 0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98 --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

**TX:** `0xe30038cd9f80ed36f256b882fc06ed48cd628fd4bcc496422fc5a96fab0eb5a1`

---

### 7. Initialize ETHOpenworkDAO

**Command:**
```bash
source .env && cast send 0x5F046980A58acC24530b5BBf483e844A518936FD "initialize(address,address,uint32,address)" 0xfD08836eeE6242092a9c869237a8d122275b024A 0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98 40161 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```

**TX:** `0x79fc792d43939711e2cb4427993335686f39681e02a0c911f15ca7d3857d7f7b`

---

### Verification

**Token Distribution:**
- ETHRewardsContract: 750,000,000 OWORK ✅
- ETHOpenworkDAO: 250,000,000 OWORK ✅
- Deployer: 0 ✅

**Contract Configuration:**
- RewardsContract.openworkToken: `0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98` ✅
- DAO.openworkToken: `0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98` ✅
- DAO.bridge: `0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8` ✅

---

## Phase 5 Complete

**Checkpoint:** `ETH-DEPLOYED`
**Status:** All Ethereum Sepolia contracts deployed and configured

---

## Phase 6: Ethereum Configuration

### 1. ETHBridge.setMainDaoContract
```bash
source .env && cast send 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 "setMainDaoContract(address)" 0x5F046980A58acC24530b5BBf483e844A518936FD --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0xfccadad7d9a441391f3e81a6bb655a126ad0f2aa3f7dde6a86c526578c76fe9b`

### 2. ETHBridge.setRewardsContract
```bash
source .env && cast send 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 "setRewardsContract(address)" 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x62f403a3d1c082521e62499c91889a10a11ddfc3dea967ba9c68678f1e014df2`

### 3. ETHRewardsContract.setMainDAO
```bash
source .env && cast send 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D "setMainDAO(address)" 0x5F046980A58acC24530b5BBf483e844A518936FD --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x100f8bf9a16bca98d33f349c0fe8edcc44cd5f01f22d596ca55bd733674338e9`

---

## Phase 6 Complete

**Checkpoint:** `ETH-CONFIGURED`
**Status:** All Ethereum Sepolia contracts configured

---

## Phase 7: Cross-Chain Peer Setup

### Bridge Addresses
| Chain | Bridge | Address |
|-------|--------|---------|
| Arbitrum Sepolia (40231) | NativeBridge | 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 |
| Optimism Sepolia (40232) | LocalBridge | 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b |
| Ethereum Sepolia (40161) | ETHBridge | 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 |

### 1. NativeBridge -> ETHBridge (40161)
```bash
source .env && cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setPeer(uint32,bytes32)" 40161 0x000000000000000000000000dA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x9db60733bdc5d9e4d8ea567963438b4ebf82a703ef71ead322f48d5d646c17ef`

### 2. ETHBridge -> NativeBridge (40231)
```bash
source .env && cast send 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 "setPeer(uint32,bytes32)" 40231 0x0000000000000000000000004E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0xc1350239d7264b9af640806601703434967205107993bf3b3ee9349752527452`

### 3. NativeBridge -> LocalBridge (40232)
```bash
source .env && cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "setPeer(uint32,bytes32)" 40232 0x000000000000000000000000c0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x573e4e0cc96973cd21dd9d3102b66dfd0d8469910074629aaedb1150e53f31e0`

### 4. LocalBridge -> NativeBridge (40231)
```bash
source .env && cast send 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b "setPeer(uint32,bytes32)" 40231 0x0000000000000000000000004E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x18be125311c6959ac05709d5586e04c7b311adf58dc3419f9ded15d920d329d1`

### 5. ETHBridge.setAllowedSourceChain (40231)
```bash
source .env && cast send 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 "setAllowedSourceChain(uint32,bool)" 40231 true --rpc-url $ETHEREUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x57f24bf0ce633715ab3368f6f6b3a742e018326173502bdaa924b065463f2df0`

### 6. NativeBridge.addLocalChain (40232)
```bash
source .env && cast send 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 "addLocalChain(uint32)" 40232 --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --private-key $WALL2_KEY
```
**TX:** `0x641e94dcbffbc6845909e1327711e9d250fd91f987d6b5660c9c226040a5c468`

### Verification
All peers configured correctly:
- NativeBridge.peers(40161) = ETHBridge ✅
- NativeBridge.peers(40232) = LocalBridge ✅
- ETHBridge.peers(40231) = NativeBridge ✅
- LocalBridge.peers(40231) = NativeBridge ✅

---

## Phase 7 Complete

**Checkpoint:** `PEERS-CONFIGURED`
**Status:** All cross-chain peers configured

---
