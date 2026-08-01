# Cross-Chain Architecture

OpenWork operates across four mainnet blockchains, each with a specific role. Cross-chain communication uses LayerZero V2 for messaging and Circle CCTP V2 for USDC transfers.

## Chain Roles

| Chain | Role | What Lives Here |
|-------|------|-----------------|
| **Optimism** | Local chain (user-facing) | LOWJC, LocalAthena and the Optimism bridge |
| **XDC Network** | Local chain (user-facing) | LOWJC, LocalAthena and the replacement XDC V2 bridge; application messages route through Arbitrum |
| **Arbitrum One** | Native chain (source of truth) | NOWJC, Genesis, NativeAthena, Rewards, Profiles, Native DAO, VotingPowerCheckpoints, NativeDAOStakeSync and direct Arbitrum adapters |
| **Ethereum** | Main chain (governance) | ETHOpenworkDAO, VotingPowerCheckpoints, ETHDAOMessaging, ETHRewardsContract and OWORK |

## Why Three Chains?

- **Optimism** and **XDC** provide user-facing local entry points
- **Arbitrum** is the single source of truth — all job data, profiles, and escrow live here
- **Ethereum** hosts governance and the OWORK token for maximum security and decentralization

## Data Flow Pattern

```
User on Optimism or XDC
  → LOWJC (minimal local state)
    → LayerZero message → NativeBridge V3 on Arbitrum
      → NOWJC (full state in Genesis)
        → CCTP USDC transfer (if payment involved)

User on Arbitrum
  → NativeArbOpenWorkJobContract / NativeArbAthenaClient
    → NOWJC / NativeAthena without a cross-chain application hop
```

Users interact with Optimism or XDC. The system handles the Arbitrum state synchronization automatically.

## Chain Identifiers

| Chain | Chain ID | LayerZero EID | CCTP Domain |
|-------|----------|---------------|-------------|
| Arbitrum One | 42161 | 30110 | 3 |
| Optimism | 10 | 30111 | 2 |
| XDC Network | 50 | 30365 | 18 |
| Ethereum | 1 | 30101 | 0 |

### Testnet

| Chain | Chain ID | LayerZero EID | CCTP Domain |
|-------|----------|---------------|-------------|
| Arbitrum Sepolia | 421614 | 40231 | 3 |
| Optimism Sepolia | 11155420 | 40232 | 2 |
| Ethereum Sepolia | 11155111 | 40161 | 0 |

## LayerZero Messaging

LayerZero V2 handles all cross-chain state sync. Bridge contracts on each chain route messages.

### Bridge Contracts (Mainnet)

| Chain | Bridge Contract | Address |
|-------|----------------|---------|
| Arbitrum | NativeLZOpenworkBridge V3 | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` |
| Optimism | LocalLZOpenworkBridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| XDC | LocalLZOpenworkBridge V2 | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` |
| Ethereum | ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |

The former Arbitrum bridge `0x1bC57...` is retained only for rollback/in-flight compatibility. The former XDC bridge `0x745666...` is retired on XDC; that same address remains the active Optimism bridge.

### Message Types (Local Chain → Arbitrum)

| Action | Source Function | Destination Handler |
|--------|----------------|---------------------|
| Post job | LOWJC.postJob() | NOWJC.postJob() |
| Apply to job | LOWJC.applyToJob() | NOWJC.applyToJob() |
| Start job | LOWJC.startJob() | NOWJC.startJob() |
| Submit work | LOWJC.submitWork() | NOWJC.submitWork() |
| Release payment | LOWJC.releasePaymentCrossChain() | NOWJC.handleReleasePaymentCrossChain() |
| Lock milestone | LOWJC.lockNextMilestone() | NOWJC.lockNextMilestone() |
| Direct contract | LOWJC.startDirectContract() | NOWJC.handleStartDirectContract() |
| Create profile | LOWJC.createProfile() | ProfileManager.createProfile() |
| Raise dispute | LocalAthena.raiseDispute() | NativeAthena.raiseDispute() |

### Message Types (Arbitrum → Optimism)

| Action | Source | Destination Handler |
|--------|--------|---------------------|
| Finalize dispute | NativeAthena | LocalAthena.handleFinalizeDisputeWithVotes() |

### Message Types (Arbitrum ↔ Ethereum)

| Direction | Action | Purpose |
|-----------|--------|---------|
| Arb → ETH | syncVotingPower | Sync voting-power checkpoints to Ethereum |
| Arb → ETH | syncClaimableRewards | Sync claimable OWORK balance |
| ETH → Arb | ETHDAOMessaging operations | Route governance and stake messages to NativeDAOStakeSync / native modules |
| ETH → Arb | updateUserClaimData | Mark tokens as claimed |
| ETH → Any | upgradeFromDAO | Cross-chain contract upgrade |

Voting power is now checkpointed on both Arbitrum and Ethereum. The July 2026 architecture separates Ethereum DAO messaging from stake synchronization: `ETHDAOMessaging` is the Ethereum-side sender/receiver, while `NativeDAOStakeSync` applies stake-derived state on Arbitrum.

### LZ Gas Options

Every cross-chain call requires `_nativeOptions` that encode destination execution gas. Options are operation-specific; quote with the exact payload and options used by the transaction. For example, this value encodes 500,000 gas:

```
0x0003010011010000000000000000000000000007a120
```

Do not treat that example as a universal production default.

### LZ Fee

The cost is the live bridge quote and can vary materially by source chain. XDC operations pay the quote in XDC. Do not use a fixed fallback.

To estimate fees:
```solidity
// On LocalBridge
function quoteNativeChain(bytes calldata _payload, bytes calldata _options) external view returns (uint256 fee)
```

### Checking LZ Message Status

```
GET https://scan.layerzero-api.com/v1/messages/tx/{txHash}
```

## Circle CCTP (USDC Transfers)

Circle CCTP V2 handles all USDC movement between chains.

### Flow

1. **Send**: Source chain burns USDC via TokenMessengerV2
2. **Attest**: Circle observes and creates attestation
3. **Receive**: Destination chain mints USDC via `CCTPTransceiver.receive(message, attestation)`

### CCTPTransceiver Contracts (Mainnet)

| Chain | Address |
|-------|---------|
| Arbitrum | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` |
| Optimism | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` |
| XDC | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` (Standard Transfer) |

### Checking CCTP Transfer Status

```
GET https://iris-api.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}
```

- `sourceDomain`: 2 = Optimism, 3 = Arbitrum, 18 = XDC
- Status: `pending_confirmations` → `complete`
- If `delayReason: "insufficient_fee"` — transfer uses slow path (~15-20 min)

### Completing a CCTP Transfer

Once attestation is `complete`, call `receive()` on the destination CCTPTransceiver:

```solidity
function receive(
    bytes calldata message,       // From Circle API response
    bytes calldata attestation    // From Circle API response
) external nonReentrant
```

### Important Notes

- CCTP transfers require a manual `receive()` call on the destination chain
- Current contracts use `maxFee = 1000` (0.001 USDC) — may result in slow-path transfers
- NOWJC has a 0.01% fee tolerance for received amounts
- XDC Standard Transfer attestations can take longer than fast-transfer routes
- XDC ↔ Arbitrum is configured and passed a full production job lifecycle after the 19 July 2026 bridge cutover (`30365-3`)
- Optimism ↔ Arbitrum and Ethereum ↔ Arbitrum are reciprocally configured, but no post-cutover application/governance end-to-end proof is recorded
- Direct XDC ↔ Ethereum application messaging is disabled: the Ethereum peer still names the retired XDC bridge and the direct security stack is not installed. Route through Arbitrum
