# XDC Mainnet Cross-Chain Job Test — 13 July 2026

**Status:** PASS — job `30365-1` delivered from XDC to Arbitrum and stored in Genesis

**Deployer / job giver:** `0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C`

**Approved XDC cap:** `4 XDC`

## LayerZero pathway configuration

The XDC/Arbitrum pathway initially inherited LayerZero's unusable `LZDeadDVN` defaults. The pathway was configured to match Openwork's existing production pattern: 20 confirmations and four required independent DVNs.

| Provider | XDC DVN | Arbitrum DVN |
|---|---|---|
| Nethermind | `0x1294e3347ec64fd63e1d0594dc1294247cd237c7` | `0xa7b5189bca84cd304d8553977c7c614329750d99` |
| Canary | `0x307d81ef09c72730f57667bf1e9b62db4904053f` | `0xf2e380c90e6c09721297526dbc74f870e114dfcb` |
| LayerZero Labs | `0x6788f52439aca6bff597d3eec2dc9a44b8fee842` | `0x2f55c492897526677c5b68fb199ea31e2c126416` |
| Horizen | `0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b` | `0x19670df5e16bea2ba9b9e68b48c054c5baea06b8` |

DVNs were encoded in ascending address order on each chain, as required by LayerZero.

| Chain | Direction | Transaction | Gas | Cost |
|---|---|---|---:|---:|
| XDC | Send to Arbitrum | `0x8e986ce72e71176c4254d347fcbdf54aaad21ddc9a411ce472f73210c3571908` | 193,088 | `0.00289677255 XDC` |
| XDC | Receive from Arbitrum | `0xf318a149e22700919cda993ed902f25a6d986d490931840850cdada3ee993c51` | 192,912 | `0.00289390606875 XDC` |
| Arbitrum | Send to XDC | `0x92715af4b3b4ccdaf9c613415aac6eaf2c04bb9fe29645b2d6d72fac69771741` | 187,056 | `0.00000374112 ETH` |
| Arbitrum | Receive from XDC | `0x1756cbdad52d1c245ad6195fd6e1df314bd4932c6d79dacd741466861444d1e1` | 186,835 | `0.00000375799919 ETH` |

All four effective configs were read back from the LayerZero endpoints and matched the intended encoded configuration exactly.

## Test job

| Field | Value |
|---|---|
| Job ID | `30365-1` |
| Detail hash/label | `openwork-xdc-mainnet-connectivity-test-2026-07-13` |
| Milestone description | `XDC mainnet cross-chain job posting test` |
| Milestone amount | `1,000,000` units (`1 USDC` nominal; no USDC transferred during posting) |
| Destination execution gas option | `500,000` |
| LayerZero GUID | `0xc8a64f1d2bfa3da302459ffa3f2c2a248b468019852ced4ddbb9f03b11db1055` |
| XDC source transaction | `0xdd20ddebcf87ff3757cbea0c6670d5550abbded96c31d72ad2f10340fa455806` |
| Arbitrum destination transaction | `0x36c8d34d4ae92f091a936dadaff5d1fe0282eceb770c9af800974f6b347c42bf` |
| LayerZero final status | `DELIVERED` |

## Cost and verification

- LayerZero message fee: `3.769052664403434867 XDC`
- Source job transaction gas: `508,642` gas / `0.01271605 XDC`
- XDC DVN configuration gas: `0.00579067861875 XDC`
- **Total approved-scope XDC spend:** `3.787559393022184867 XDC`
- **Unused approved cap:** `0.212440606977815133 XDC`
- Arbitrum DVN configuration spend: `0.00000749911919 ETH`
- XDC final deployer nonce: `18`
- XDC final deployer balance: `55.187160237477815133 XDC`

Final Arbitrum Genesis readback:

- `jobExists("30365-1") == true`
- Job giver matches the deployer wallet
- Status is `Open` (`0`)
- Detail label, milestone description, and amount match the source payload
- `getJobsByPoster(deployer)` includes `30365-1`

## Remaining work

- Configure a matching non-dead LayerZero DVN stack for the direct XDC/Ethereum pathway if that pathway will be used.
- Add XDC chain/contracts to the separate live application configuration.
