# Redeployment: NativeArbAthenaClient + NativeArbOpenWorkJobContract — March 19, 2026

**Reason:** Agent wallet `0xb8dC69937e745Fd02661BC4333f3852166eF2026` lost private key. Both proxies were owned by agent — no one can upgrade or configure them. Fresh deploy under main deployer.

**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

---

## Old Contracts (ABANDONED — agent wallet key lost)

| Contract | Old Proxy | Old Impl | Owner |
|----------|-----------|----------|-------|
| NativeArbAthenaClient | `0xEC9446A163E74D2fBF3def75324895204415166D` | `0x0688FcF38eA366a7fACe4b056F0eC6b66E6DA06E` | `0xb8dC...` (agent, key lost) |
| NativeArbOpenWorkJobContract | `0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587` | `0xC14310DE9C057FBF54797E7118abcD5C412BFcD2` | `0xb8dC...` (agent, key lost) |

---

## 94. NativeArbAthenaClient Implementation (Arbitrum Mainnet)

**Source:** `src/suites/current-mainnet/native/native-arb-athena-client.sol`

**Command:**
```bash
forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY src/suites/current-mainnet/native/native-arb-athena-client.sol:NativeArbAthenaClient
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x9456989F7B9Cb707451d7179Fc1FC401221DE01a
Transaction hash: 0xd71e3a6803d26a32db6c06c123dc669d0c9abbcf36971a4c92e716751498832f
```

**Arbiscan:** https://arbiscan.io/address/0x9456989F7B9Cb707451d7179Fc1FC401221DE01a

---

## 95. NativeArbOpenWorkJobContract Implementation (Arbitrum Mainnet)

**Source:** `src/suites/current-mainnet/native/native-arb-lowjc-v3.sol`

**Command:**
```bash
forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY src/suites/current-mainnet/native/native-arb-lowjc-v3.sol:NativeArbOpenWorkJobContract
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7
Transaction hash: 0x0c419a8116424b23fe0227e389a79f29c6b02c88769441654787b4f761c47cc3
```

**Arbiscan:** https://arbiscan.io/address/0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7

---

## 96. NativeArbAthenaClient Proxy (Arbitrum Mainnet)

**Init params:** owner=deployer, usdcToken=USDC, nativeAthena=NativeAthena proxy, jobContract=old ArbLOWJC proxy (updated in step 98)

**Command:**
```bash
forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY src/suites/current-mainnet/utilities/proxy.sol:UUPSProxy --constructor-args 0x9456989F7B9Cb707451d7179Fc1FC401221DE01a $(cast calldata "initialize(address,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf 0xEE57ee10cCAB26f5642d4EbDC15B3881Bb0B5587)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0xB5d3F406089236ef9d4aB13306187aFCCA81f099
Transaction hash: 0x72cbe3d229cd114b50ecf53ff050ebda77157960b1a12c52c0e2f1f7d7967ae6
```

**Arbiscan:** https://arbiscan.io/address/0xB5d3F406089236ef9d4aB13306187aFCCA81f099

---

## 97. NativeArbOpenWorkJobContract Proxy (Arbitrum Mainnet)

**Init params:** owner=deployer, usdcToken=USDC, nowjc=NOWJC proxy

**Command:**
```bash
forge create --broadcast --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY src/suites/current-mainnet/utilities/proxy.sol:UUPSProxy --constructor-args 0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7 $(cast calldata "initialize(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99)
```

**Output:**
```
Deployer: 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C
Deployed to: 0x5727cA7326032a8644a49dECECB8388BEF122bef
Transaction hash: 0x9ec6486b1b039b4b5a9039b84f94a5c58d93493ef4ddeb0871ec20312640c38c
```

**Arbiscan:** https://arbiscan.io/address/0x5727cA7326032a8644a49dECECB8388BEF122bef

---

## 98. ArbAthenaClient → setJobContract (point to new ArbLOWJC proxy)

**Command:**
```bash
cast send 0xB5d3F406089236ef9d4aB13306187aFCCA81f099 "setJobContract(address)" 0x5727cA7326032a8644a49dECECB8388BEF122bef --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0x6cdbf1f43259c6fce325199f5cded1726d4f33af18eb1d1a8c21e64d012d2d54`

**Status:** ✅ Success

---

## 99. ArbLOWJC → setProfileManager

**Command:**
```bash
cast send 0x5727cA7326032a8644a49dECECB8388BEF122bef "setProfileManager(address)" 0x51285003A01319c2f46BB2954384BCb69AfB1b45 --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0x1bb2523a770b94608811761a43a8c59be2d1dad9d2dd30e396c72298a1f7d7a0`

**Status:** ✅ Success

---

## 100. NativeAthena → setLocalLOWJC (point to new ArbLOWJC proxy)

**Command:**
```bash
cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf "setLocalLOWJC(address)" 0x5727cA7326032a8644a49dECECB8388BEF122bef --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0xa5c1baa8a06bad189f5964c950356be133147cfbd2378dac7dece9ee15416193`

**Status:** ✅ Success

---

## 101. NativeAthena → addAuthorizedContract (new ArbAthenaClient)

**Command:**
```bash
cast send 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf "addAuthorizedContract(address,bool)" 0xB5d3F406089236ef9d4aB13306187aFCCA81f099 true --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0x75a4876329bb86a439c4181141a579885db8d87e577eda0ca302197592626490`

**Status:** ✅ Success

---

## 102. ProfileManager → addAuthorizedContract (new ArbLOWJC)

**Command:**
```bash
cast send 0x51285003A01319c2f46BB2954384BCb69AfB1b45 "addAuthorizedContract(address,bool)" 0x5727cA7326032a8644a49dECECB8388BEF122bef true --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0x7ed76c29703ef423405dc40fa2d4fb0c98559f3b92192deaaaf5baacc496c223`

**Status:** ✅ Success

---

## 103. NOWJC → addAuthorizedContract (new ArbLOWJC)

**Note:** NOWJC uses `addAuthorizedContract(address)` (no bool) and requires `admins[msg.sender]`.

**Command:**
```bash
cast send 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 "addAuthorizedContract(address)" 0x5727cA7326032a8644a49dECECB8388BEF122bef --rpc-url $ARBITRUM_MAINNET_RPC_URL --private-key $PROD_DEPLOYER_KEY
```

**Transaction hash:** `0x3842978f7fb5e980fdecbc145554b5d5ab23213945f0058fe919dcef6f7f3fc0`

**Status:** ✅ Success

---

## New Contract Summary

| Contract | New Proxy | New Implementation | Owner |
|----------|-----------|-------------------|-------|
| NativeArbAthenaClient | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x9456989F7B9Cb707451d7179Fc1FC401221DE01a` | `0x7a2B...` (deployer) ✅ |
| NativeArbOpenWorkJobContract | `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0x79CE037946B44EDF4f8B2c2EA51C610C2AA6a0f7` | `0x7a2B...` (deployer) ✅ |

## Contracts That Reference New Addresses

| Contract | Setter | New Value | Tx |
|----------|--------|-----------|-----|
| ArbAthenaClient | `setJobContract` | `0x5727...bef` (new ArbLOWJC) | `0x6cdb...` |
| ArbLOWJC | `setProfileManager` | `0x5128...b45` (ProfileManager) | `0x1bb2...` |
| NativeAthena | `setLocalLOWJC` | `0x5727...bef` (new ArbLOWJC) | `0xa5c1...` |
| NativeAthena | `addAuthorizedContract` | `0xB5d3...099` (new ArbAthenaClient) | `0x75a4...` |
| ProfileManager | `addAuthorizedContract` | `0x5727...bef` (new ArbLOWJC) | `0x7ed7...` |
| NOWJC | `addAuthorizedContract` | `0x5727...bef` (new ArbLOWJC) | `0x3842...` |

## TODO

- [ ] Update webapp to use new proxy addresses
- [ ] Revoke old proxy addresses from authorizedContracts (NativeAthena, ProfileManager, NOWJC)
- [ ] Verify new implementations on Arbiscan
- [ ] Update main contracts registry (`all-deployed-contracts-18-jan-2026.md`)
