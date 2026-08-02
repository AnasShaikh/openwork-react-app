# Openwork Mainnet Contracts Registry

**Last Updated:** January 18, 2026
**Deployer:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

---

## Network Reference

| Network | Chain ID | LZ EID | CCTP Domain | Role |
|---------|----------|--------|-------------|------|
| Arbitrum One | 42161 | 30110 | 3 | Native Chain |
| Optimism | 10 | 30111 | 2 | Local Chain |
| Ethereum | 1 | 30101 | 0 | ETH Chain |

---

## Arbitrum One (Native Chain)

### Core Contracts (User-Facing Proxies)

| Contract | Address | Explorer |
|----------|---------|----------|
| Genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | [Arbiscan](https://arbiscan.io/address/0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294) |
| NOWJC | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | [Arbiscan](https://arbiscan.io/address/0x8EfbF240240613803B9c9e716d4b5AD1388aFd99) |
| DAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | [Arbiscan](https://arbiscan.io/address/0x24af98d763724362DC920507b351cC99170a5aa4) |
| Athena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | [Arbiscan](https://arbiscan.io/address/0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf) |

### Infrastructure Contracts

| Contract | Address | Type | Explorer |
|----------|---------|------|----------|
| Bridge | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | Non-Upgradeable | [Arbiscan](https://arbiscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) |
| Rewards | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | Non-Upgradeable | [Arbiscan](https://arbiscan.io/address/0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7) |
| CCTP | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | Non-Upgradeable | [Arbiscan](https://arbiscan.io/address/0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87) |
| ContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | Non-Upgradeable | [Arbiscan](https://arbiscan.io/address/0x29D61B1a9E2837ABC0810925429Df641CBed58c3) |

### Implementation Contracts

| Contract | Address |
|----------|---------|
| Genesis Impl | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |
| NOWJC Impl | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| DAO Impl | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| Athena Impl | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` |

### External Dependencies

| Contract | Address |
|----------|---------|
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| MessageTransmitterV2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |

---

## Optimism (Local Chain)

### Infrastructure Contracts

| Contract | Address | Type | Explorer |
|----------|---------|------|----------|
| Bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | Non-Upgradeable | [OP Etherscan](https://optimistic.etherscan.io/address/0x74566644782e98c87a12E8Fc6f7c4c72e2908a36) |
| CCTP | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | Non-Upgradeable | [OP Etherscan](https://optimistic.etherscan.io/address/0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510) |

### Core Contracts (Proxies)

| Contract | Address | Status |
|----------|---------|--------|
| LOWJC | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | ✅ Deployed |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | ✅ Deployed |

### External Dependencies

| Contract | Address |
|----------|---------|
| USDC | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0x2B4069517957735bE00ceE0fadAE88a26365528f` |
| MessageTransmitterV2 | `0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8` |

---

## Ethereum Mainnet (ETH Chain)

**Status:** Partial (Token pending)

### Infrastructure Contracts

| Contract | Address | Type | Explorer |
|----------|---------|------|----------|
| Bridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | Non-Upgradeable | [Etherscan](https://etherscan.io/address/0x20Fa268106A3C532cF9F733005Ab48624105c42F) |

### Implementations

| Contract | Address | Explorer |
|----------|---------|----------|
| ETHOpenworkDAO Impl | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | [Etherscan](https://etherscan.io/address/0xF78B688846673C3f6b93184BeC230d982c0db0c9) |

### Pending (Waiting for Token)

| Contract | Address | Status |
|----------|---------|--------|
| OWORK Token | TBD | ⏸️ Pending |
| ETHOpenworkDAO Proxy | TBD | ⏸️ Pending |
| ETHRewardsContract | TBD | ⏸️ Pending |

### External Dependencies

| Contract | Address |
|----------|---------|
| LZ Endpoint V2 | `0x1a44076050125825900e736c501f859c50fE728c` |
| TokenMessengerV2 | `0xBd3fa81B58Ba92a82136038B25aDec7066af3155` |
| MessageTransmitterV2 | `0x0a992d191deec32afe36203ad87d7d289a738f81` |

---

## Cross-Chain Peer Configuration

### LayerZero Peers

| Source | Target | Peer Address | Status |
|--------|--------|--------------|--------|
| Arbitrum (30110) | Optimism (30111) | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | ✅ |
| Arbitrum (30110) | Ethereum (30101) | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | ✅ |
| Optimism (30111) | Arbitrum (30110) | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ |
| Ethereum (30101) | Arbitrum (30110) | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | ✅ |

---

## Quick Reference

**For Frontend/Backend Integration:**
```
ARBITRUM_GENESIS=0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294
ARBITRUM_NOWJC=0x8EfbF240240613803B9c9e716d4b5AD1388aFd99
ARBITRUM_DAO=0x24af98d763724362DC920507b351cC99170a5aa4
ARBITRUM_ATHENA=0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf
ARBITRUM_BRIDGE=0xF78B688846673C3f6b93184BeC230d982c0db0c9
ARBITRUM_REWARDS=0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
ARBITRUM_CCTP=0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87
ARBITRUM_REGISTRY=0x29D61B1a9E2837ABC0810925429Df641CBed58c3
ARBITRUM_USDC=0xaf88d065e77c8cC2239327C5EDb3A432268e5831

OPTIMISM_BRIDGE=0x74566644782e98c87a12E8Fc6f7c4c72e2908a36
OPTIMISM_CCTP=0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510
OPTIMISM_LOWJC=0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7
OPTIMISM_ATHENA=0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d
OPTIMISM_USDC=0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85

ETHEREUM_BRIDGE=0x20Fa268106A3C532cF9F733005Ab48624105c42F
ETHEREUM_DAO_IMPL=0xF78B688846673C3f6b93184BeC230d982c0db0c9
# ETHEREUM_TOKEN=TBD (pending)
# ETHEREUM_DAO=TBD (pending)
# ETHEREUM_REWARDS=TBD (pending)
```
