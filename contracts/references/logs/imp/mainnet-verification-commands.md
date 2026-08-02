# Mainnet Contract Verification Commands

**Date:** January 22, 2026

**Prerequisites:**
```bash
# Ensure you have ETHERSCAN_API_KEY set (multichain API key)
source .env
foundryup  # Update foundry to latest
```

**Compiler Settings:**
- Solidity: ^0.8.22
- Optimizer: enabled, 200 runs
- Via IR: enabled

---

# ARBITRUM ONE (Chain ID: 42161)

## 1. Implementations (UUPS)

### 1.1 NativeOpenWorkJobContract Implementation
```bash
source .env && forge verify-contract 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "src/suites/mainnet-ready/native/native-openwork-job-contract.sol:NativeOpenWorkJobContract" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

### 1.2 NativeAthena Implementation
```bash
source .env && forge verify-contract 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 \
  "src/suites/mainnet-ready/native/native-athena.sol:NativeAthena" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

### 1.3 NativeOpenworkDAO Implementation
```bash
source .env && forge verify-contract 0x20Fa268106A3C532cF9F733005Ab48624105c42F \
  "src/suites/mainnet-ready/native/native-openwork-dao.sol:NativeOpenworkDAO" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

### 1.4 NativeOpenworkGenesis Implementation
```bash
source .env && forge verify-contract 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "src/suites/mainnet-ready/native/native-openwork-genesis.sol:NativeOpenworkGenesis" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

## 2. Proxies (UUPSProxy)

### 2.1 Genesis Proxy
```bash
source .env && forge verify-contract 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d $(cast calldata "initialize(address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C))
```

### 2.2 NOWJC Proxy
```bash
source .env && forge verify-contract 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 $(cast calldata "initialize(address,address,address,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 0xaf88d065e77c8cC2239327C5EDb3A432268e5831))
```

### 2.3 DAO Proxy
```bash
source .env && forge verify-contract 0x24af98d763724362DC920507b351cC99170a5aa4 \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0x20Fa268106A3C532cF9F733005Ab48624105c42F $(cast calldata "initialize(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294))
```

### 2.4 Athena Proxy
```bash
source .env && forge verify-contract 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 $(cast calldata "initialize(address,address,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x24af98d763724362DC920507b351cC99170a5aa4 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99 0xaf88d065e77c8cC2239327C5EDb3A432268e5831))
```

## 3. Non-Upgradeable Contracts

### 3.1 NativeLZOpenworkBridge
```bash
source .env && forge verify-contract 0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "src/suites/mainnet-ready/native/native-lz-openwork-bridge.sol:NativeLZOpenworkBridge" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,uint32)" 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110)
```

### 3.2 NativeRewardsContract
```bash
source .env && forge verify-contract 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "src/suites/mainnet-ready/native/native-rewards-contract.sol:NativeRewardsContract" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0000000000000000000000000000000000000000 0x0000000000000000000000000000000000000000)
```

### 3.3 CCTPTransceiver (Arbitrum)
```bash
source .env && forge verify-contract 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 \
  "src/suites/mainnet-ready/utilities/cctp-transceiver.sol:CCTPTransceiver" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 0xaf88d065e77c8cC2239327C5EDb3A432268e5831)
```

### 3.4 NativeContractRegistry
```bash
source .env && forge verify-contract 0x29D61B1a9E2837ABC0810925429Df641CBed58c3 \
  "src/suites/mainnet-ready/native/native-contract-registry.sol:NativeContractRegistry" \
  --chain arbitrum \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

---

# OPTIMISM (Chain ID: 10)

## 4. Implementations (UUPS)

### 4.1 LocalOpenWorkJobContract (LOWJC) Implementation
```bash
source .env && forge verify-contract 0x20Fa268106A3C532cF9F733005Ab48624105c42F \
  "src/suites/mainnet-ready/local/local-openwork-job-contract.sol:LocalOpenWorkJobContract" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

### 4.2 LocalAthena Implementation
```bash
source .env && forge verify-contract 0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "src/suites/mainnet-ready/local/local-athena.sol:LocalAthena" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

## 5. Proxies (UUPSProxy)

### 5.1 LOWJC Proxy
```bash
source .env && forge verify-contract 0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7 \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0x20Fa268106A3C532cF9F733005Ab48624105c42F $(cast calldata "initialize(address,address,uint32,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 2 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510))
```

### 5.2 LocalAthena Proxy
```bash
source .env && forge verify-contract 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "src/suites/mainnet-ready/utilities/proxy.sol:UUPSProxy" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0xF78B688846673C3f6b93184BeC230d982c0db0c9 $(cast calldata "initialize(address,address,uint32,address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 2 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf))
```

## 6. Non-Upgradeable Contracts

### 6.1 LocalLZOpenworkBridge
```bash
source .env && forge verify-contract 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36 \
  "src/suites/mainnet-ready/local/local-lz-openwork-bridge.sol:LocalLZOpenworkBridge" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,uint32,uint32,uint32)" 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110 30101 30111)
```

### 6.2 CCTPTransceiver (Optimism)
```bash
source .env && forge verify-contract 0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510 \
  "src/suites/mainnet-ready/utilities/cctp-transceiver.sol:CCTPTransceiver" \
  --chain optimism \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" 0x2B4069517957735bE00ceE0fadAE88a26365528f 0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85)
```

---

# ETHEREUM MAINNET (Chain ID: 1)

## 7. Implementation (UUPS)

### 7.1 ETHOpenworkDAO Implementation
```bash
source .env && forge verify-contract 0xF78B688846673C3f6b93184BeC230d982c0db0c9 \
  "src/suites/mainnet-ready/eth/eth-openwork-dao.sol:ETHOpenworkDAO" \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir
```

## 8. Proxy (UUPSProxy)

### 8.1 ETHOpenworkDAO Proxy
```bash
source .env && forge verify-contract 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294 \
  "src/suites/mainnet-production/utilities/proxy.sol:UUPSProxy" \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,bytes)" 0xF78B688846673C3f6b93184BeC230d982c0db0c9 0x)
```

## 9. Non-Upgradeable Contracts

### 9.1 ETHLZOpenworkBridge
```bash
source .env && forge verify-contract 0x20Fa268106A3C532cF9F733005Ab48624105c42F \
  "src/suites/mainnet-ready/eth/eth-lz-openwork-bridge.sol:ETHLZOpenworkBridge" \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,uint32)" 0x1a44076050125825900e736c501f859c50fE728c 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 30110)
```

### 9.2 ETHRewardsContract
```bash
source .env && forge verify-contract 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d \
  "src/suites/mainnet-production/eth/eth-rewards-contract.sol:ETHRewardsContract" \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x0000000000000000000000000000000000000000 0x20Fa268106A3C532cF9F733005Ab48624105c42F)
```

### 9.3 OpenworkToken (OWORK)
```bash
source .env && forge verify-contract 0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87 \
  "src/suites/mainnet-production/utilities/openwork-token.sol:OpenworkToken" \
  --chain mainnet \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version 0.8.22 \
  --num-of-optimizations 200 \
  --via-ir \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C 0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d 0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294)
```

---

# Verification Summary

## Arbitrum One (12 contracts)
| # | Contract | Address | Type |
|---|----------|---------|------|
| 1 | NOWJC Impl | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Implementation |
| 2 | Athena Impl | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Implementation |
| 3 | DAO Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Implementation |
| 4 | Genesis Impl | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Implementation |
| 5 | Genesis Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Proxy |
| 6 | NOWJC Proxy | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | Proxy |
| 7 | DAO Proxy | `0x24af98d763724362DC920507b351cC99170a5aa4` | Proxy |
| 8 | Athena Proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | Proxy |
| 9 | Bridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Non-Upgradeable |
| 10 | Rewards | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Non-Upgradeable |
| 11 | CCTP | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Non-Upgradeable |
| 12 | Registry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | Non-Upgradeable |

## Optimism (6 contracts)
| # | Contract | Address | Type |
|---|----------|---------|------|
| 1 | LOWJC Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Implementation |
| 2 | LocalAthena Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Implementation |
| 3 | LOWJC Proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Proxy |
| 4 | LocalAthena Proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Proxy |
| 5 | Bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Non-Upgradeable |
| 6 | CCTP | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Non-Upgradeable |

## Ethereum Mainnet (5 contracts)
| # | Contract | Address | Type |
|---|----------|---------|------|
| 1 | DAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Implementation |
| 2 | DAO Proxy | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | Proxy |
| 3 | Bridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Non-Upgradeable |
| 4 | Rewards | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | Non-Upgradeable |
| 5 | Token | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Non-Upgradeable |

**Total: 23 contracts**

---

# Check Verification Status

```bash
# Check if contract is verified
source .env && forge verify-check [GUID] --chain [CHAIN] --etherscan-api-key $ETHERSCAN_API_KEY

# Example chains: arbitrum, optimism, mainnet
```

# Troubleshooting

If verification fails with "bytecode mismatch":
1. Try compiler version `0.8.29` instead of `0.8.22`
2. Check if via-ir was used during deployment
3. Verify constructor args are exactly as used in deployment

If "Invalid API Key":
- Use multichain Etherscan API key from https://etherscan.io/myapikey
