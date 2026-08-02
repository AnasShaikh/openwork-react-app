# Config Value Audit — March 19, 2026

Audited 7 actively-developed contracts on-chain via `cast call`.
Deployer: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

---

## #2 NOWJC — `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` (Arbitrum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| bridge | `0x1bC5...a5F` (NativeLZOpenworkBridge) | NativeLZOpenworkBridge | OK |
| cctpReceiver | `0xaf88...5831` (ARB USDC) | ARB USDC | OK |
| cctpTransceiver | `0x765D...eB87` (CCTPTransceiver) | CCTPTransceiver | OK |
| nativeAthena | `0xE6B9...46Bf` (NativeAthena) | NativeAthena | OK |
| nativeDAO | `0x0000...0000` | NativeOpenworkDAO `0x24af...5aa4` | ZERO |
| treasury | `0x0000...0000` | should be set | ZERO |
| commissionPercentage | 0 | 100 (1%) | ZERO |
| minCommission | 0 | 1000000 (1 USDC) | ZERO |
| accumulatedCommission | 0 | — (counter) | OK |
| admins[deployer] | true | true | OK |
| authorizedContracts[NativeAthena] | true | true | OK |
| authorizedContracts[ArbAthenaClient] | true | true | OK |
| authorizedContracts[ArbLOWJC] | true | true | OK |

**Issues:** `nativeDAO`, `treasury`, `commissionPercentage`, `minCommission` are all zero/unset.

---

## #3 NativeArbOpenWorkJobContract — `0x5727cA7326032a8644a49dECECB8388BEF122bef` (Arbitrum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| profileManager | `0x5128...1b45` (ProfileManager) | ProfileManager | OK |
| athenaClientContract | `0x0000...0000` | ArbAthenaClient `0xB5d3...f099` | ZERO |
| nativeAthena | `0x0000...0000` | NativeAthena `0xE6B9...46Bf` | ZERO |
| jobCounter | 0 | — (counter) | OK |
| totalPlatformPayments | 0 | — (counter) | OK |

**Issues:** `athenaClientContract` and `nativeAthena` are unset. Dispute flow from this contract is broken.

---

## #4 NativeArbAthenaClient — `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` (Arbitrum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| usdcToken | `0xaf88...5831` (ARB USDC) | ARB USDC | OK |
| nativeAthena | `0xE6B9...46Bf` (NativeAthena) | NativeAthena | OK |
| jobContract | `0x5727...bef` (ArbLOWJC) | ArbLOWJC | OK |
| minDisputeFee | 50000000 (50 USDC) | 50 USDC | OK |

**Issues:** None. Fully configured.

---

## #6 NativeAthena — `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` (Arbitrum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| daoContract | `0x24af...5aa4` (NativeOpenworkDAO) | NativeOpenworkDAO | OK |
| bridge | `0x1bC5...a5F` (NativeLZOpenworkBridge) | NativeLZOpenworkBridge | OK |
| nativeDAO | `0x5E80...7Ce9` (NativeRewardsContract) | NativeRewardsContract? | CHECK |
| minOracleMembers | 1 | production TBD (3-5?) | TEST VALUE |
| votingPeriodMinutes | 1 | production TBD (1440 = 1 day?) | TEST VALUE |
| minStakeRequired | 0 | production TBD (non-zero) | ZERO |
| memberActivityThresholdDays | 0 | 90 (code default) | ZERO |
| accumulatedFees | 0 | — (counter) | OK |
| authorizedContracts[ArbAthenaClient] | true | true | OK |
| authorizedContracts[ArbLOWJC] | false | true | MISSING |
| authorizedContracts[NOWJC] | false | depends on architecture | CHECK |

**Issues:** `minOracleMembers=1`, `votingPeriodMinutes=1`, `minStakeRequired=0`, `memberActivityThresholdDays=0` — all test values, not production. ArbLOWJC not authorized.

---

## #10 NativeProfileManager — `0x51285003A01319c2f46BB2954384BCb69AfB1b45` (Arbitrum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| bridge | `0x1bC5...a5F` (NativeLZOpenworkBridge) | NativeLZOpenworkBridge | OK |
| nativeDAO | `0x0000...0000` | NativeOpenworkDAO? | ZERO |
| authorizedContracts[ArbLOWJC] | true | true | OK |
| authorizedContracts[NOWJC] | false | depends on architecture | CHECK |
| authorizedContracts[NativeAthena] | false | depends on architecture | CHECK |

**Issues:** `nativeDAO` is zero.

---

## #16 LOWJC Lite — `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` (Optimism)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| chainId | 30111 (LZ OP endpoint ID) | 30111 | OK |
| cctpSender | `0x586C...f15` (OP CCTPTransceiver V2) | OP CCTPTransceiver | OK |
| cctpMintRecipient | `0x8EfbF240...fd99` (NOWJC) | NOWJC | OK |
| athenaClientContract | `0x4756...4d` (LocalAthena) | LocalAthena | OK |
| jobCounter | 96 | — (counter) | OK |

**Issues:** None. Fully configured.

---

## #20 ETHOpenworkDAO — `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` (Ethereum)

| Variable | Current Value | Expected | Status |
|----------|--------------|----------|--------|
| owner | `0x7a2B...384C` (deployer) | deployer | OK |
| openworkToken | `0x765D...eB87` (OpenworkToken) | OpenworkToken | OK |
| bridge | `0x20Fa...c42F` (ETHLZOpenworkBridge) | ETHLZOpenworkBridge | OK |
| chainId | 1 | 1 (Ethereum) | OK |
| proposalThresholdAmount | 100e18 (100 OW) | 100 OW | OK |
| votingThresholdAmount | 50e18 (50 OW) | 50 OW | OK |
| unstakeDelay | 86400 (1 day) | 1 day | OK |
| admins[deployer] | true | true | OK |
| name | "OpenWorkDAO" | "OpenWorkDAO" | OK |

**Issues:** None. Fully configured.

---

## Summary

| Contract | Status | Issues |
|----------|--------|--------|
| NOWJC | PARTIAL | nativeDAO=0, treasury=0, commission=0, minCommission=0 |
| ArbLOWJC | PARTIAL | athenaClientContract=0, nativeAthena=0 |
| ArbAthenaClient | OK | — |
| NativeAthena | PARTIAL | test values (oracle=1, voting=1min, stake=0, activity=0), ArbLOWJC not authorized |
| ProfileManager | PARTIAL | nativeDAO=0 |
| LOWJC Lite | OK | — |
| ETHOpenworkDAO | OK | — |

### Action Items

**Critical (breaks functionality):**
1. ArbLOWJC: set `athenaClientContract` to `0xB5d3F406089236ef9d4aB13306187aFCCA81f099`
2. ArbLOWJC: set `nativeAthena` to `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf`
3. NativeAthena: authorize ArbLOWJC `0x5727cA7326032a8644a49dECECB8388BEF122bef`

**Important (incomplete config):**
4. NOWJC: set `nativeDAO` to `0x24af98d763724362DC920507b351cC99170a5aa4`
5. NOWJC: set `treasury` (decide address)
6. NOWJC: set `commissionPercentage` to 100 (1%)
7. NOWJC: set `minCommission` to 1000000 (1 USDC)
8. ProfileManager: set `nativeDAO`

**Pre-production (test values need updating):**
9. NativeAthena: set `minOracleMembers` to production value (3-5)
10. NativeAthena: set `votingPeriodMinutes` to production value (1440?)
11. NativeAthena: set `minStakeRequired` to production value
12. NativeAthena: set `memberActivityThresholdDays` to 90
