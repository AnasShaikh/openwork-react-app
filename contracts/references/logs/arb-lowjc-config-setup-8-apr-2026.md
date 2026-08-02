# ArbLOWJC Contract Configuration — April 8, 2026

## Task

Set `athenaClientContract` and `nativeAthena` references on the redeployed ArbLOWJC proxy. Both were `0x0000...0000` after the Mar 19 redeployment, which would cause dispute resolution to revert.

## Contract

| Field | Value |
|-------|-------|
| Contract | NativeArbOpenWorkJobContract (ArbLOWJC) |
| Proxy | `0x5727cA7326032a8644a49dECECB8388BEF122bef` |
| Chain | Arbitrum One (42161) |
| Caller | `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` (deployer) |

## Transactions

### 1. setAthenaClientContract

```
setAthenaClientContract(0xB5d3F406089236ef9d4aB13306187aFCCA81f099)
```

### 2. setNativeAthena

```
setNativeAthena(0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf)
```

## Verification

| Getter | Before | After |
|--------|--------|-------|
| `athenaClientContract()` | `0x0000...0000` | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` |
| `nativeAthena()` | `0x0000...0000` | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` |

Both confirmed on-chain via `cast call`.

## Context

The ArbLOWJC was redeployed on Mar 19, 2026 due to lost agent wallet key. The new proxy was authorized on NOWJC but its internal references to AthenaClient and NativeAthena were never set, leaving dispute routing broken for Arb-native LOWJC jobs.
