# XDC Mainnet Handoff — 13 July 2026

Use this as a quick handoff, then confirm against the repository XDC logs and live chain before writes.

## Status

- Six XDC contracts are deployed, configured, and verified.
- Arbitrum NativeAthena is V8 with XDC EID `30365` mapped to CCTP domain `18`.
- XDC and Arbitrum peers, authorization, and matching four-DVN LayerZero pathway are configured.
- Contract test job `30365-1` and production-webapp job `30365-2` were delivered and stored in Arbitrum Genesis.
- XDC and Ethereum reciprocal peers exist, but their direct DVN/executor pathway is not configured and must not be called operational.
- The production webapp is configured for XDC and passed job posting through the supported XDC → Arbitrum route.

## Public addresses

Deployer: `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

### XDC

| Contract | Address |
|---|---|
| LocalLZ bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` |
| Standard CCTP transceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` |
| LOWJC implementation | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |
| LocalAthena implementation | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` |
| LOWJC proxy | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` |
| LocalAthena proxy | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` |

### Arbitrum/Ethereum dependencies

| Contract | Address |
|---|---|
| Arbitrum NativeLZ bridge | `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` |
| Arbitrum NativeAthena proxy | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` |
| NativeAthena V8 implementation | `0xd9eFCA708f027ff813f03aDF73f8264a28BDAf31` |
| Arbitrum NOWJC | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` |
| Arbitrum Genesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` |
| Ethereum ETHLZ bridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` |

## Network constants

| Item | Value |
|---|---|
| Chain ID | `50` |
| LayerZero EID | `30365` |
| CCTP domain | `18` |
| LayerZero endpoint | `0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa` |
| USDC | `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1` |
| TokenMessenger V2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| MessageTransmitter V2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |

## XDC/Arbitrum security stack

- Confirmations: `20`.
- Required DVNs: LayerZero Labs, Nethermind, Horizen, and Canary.
- XDC send tx: `0x8e986ce72e71176c4254d347fcbdf54aaad21ddc9a411ce472f73210c3571908`.
- XDC receive tx: `0xf318a149e22700919cda993ed902f25a6d986d490931840850cdada3ee993c51`.
- Arbitrum send tx: `0x92715af4b3b4ccdaf9c613415aac6eaf2c04bb9fe29645b2d6d72fac69771741`.
- Arbitrum receive tx: `0x1756cbdad52d1c245ad6195fd6e1df314bd4932c6d79dacd741466861444d1e1`.

## Delivery proof and spend

- Job: `30365-1`.
- LayerZero GUID: `0xc8a64f1d2bfa3da302459ffa3f2c2a248b468019852ced4ddbb9f03b11db1055`.
- XDC source tx: `0xdd20ddebcf87ff3757cbea0c6670d5550abbded96c31d72ad2f10340fa455806`.
- Arbitrum destination tx: `0x36c8d34d4ae92f091a936dadaff5d1fe0282eceb770c9af800974f6b347c42bf`.
- LayerZero status at completion: `DELIVERED`.
- Approved-scope XDC spend: `3.787559393022184867 XDC` of `4 XDC`.
- Final recorded XDC nonce: `18`.
- Final recorded XDC balance: `55.187160237477815133 XDC`.

### Production webapp proof

- Job: `30365-2`.
- LayerZero GUID: `0x6e75481de82c9527faab41f47b5899058906ab1ddd3d05594968b3ac6299aeff`.
- XDC source tx: `0xf9b88e09488de62bbb92572492c74268dccf445bea6279d672fc458963a57d09`.
- Arbitrum destination tx: `0xcf5f406e94942db276958e2828c8e5ce9f8271d32209a84610fc24e1202ad6a0`.
- LayerZero status: `DELIVERED`.
- Genesis status: job exists with the correct wallet, IPFS hashes, `500,000` milestone units, and `Open` status.
- Total wallet spend: `4.803234084721259807 XDC` including source gas.
- Final recorded XDC balance: `50.383926152756555326 XDC`.

## Canonical detailed evidence

- `references/logs/xdc-mainnet-deployment-preparation-12-jul-2026.md`
- `references/logs/xdc-mainnet-job-post-test-13-jul-2026.md`
- `references/logs/xdc-mainnet-webapp-job-post-test-13-jul-2026.md`
- `references/logs/imp/live-contract-registry-19-mar-2026.md`
- `references/logs/imp/mainnet-verification-tracker.md`
