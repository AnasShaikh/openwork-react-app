# Contract Registry

This is a compact agent reference for the current production topology. The complete structured registry—including every active contract role, implementation, exact source file, explorer status, audit block and legacy deployment—is available at:

- Public page: `https://app.openwork.technology/docs`
- JSON API: `https://app.openwork.technology/api/docs/contracts`
- Canonical contract-repository record: `https://github.com/AnasShaikh/openwork-contracts-final/blob/main/references/logs/imp/live-contract-registry-19-mar-2026.md`

**Last audited:** 1 August 2026.

## Production chain roles

| Chain | Chain ID | LZ EID | CCTP domain | Role |
|---|---:|---:|---:|---|
| Arbitrum One | 42161 | 30110 | 3 | Canonical job, escrow, dispute, profile and reward state; also supports direct user operations |
| Optimism | 10 | 30111 | 2 | User-facing local job and Athena entry points |
| XDC Network | 50 | 30365 | 18 | User-facing local job and Athena entry points |
| Ethereum | 1 | 30101 | 0 | OWORK token, staking, historical voting power and governance |

## Arbitrum One

| Role | Proxy / address | Current implementation | Version |
|---|---|---|---|
| NativeOpenworkGenesis | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | V1 |
| NOWJC | `0x8EfbF240240613803B9c9e716d4b5AD1388aFd99` | `0x1a406176a9f5727689035eD82f4c28CACaCeDC96` | V5 |
| NativeArb LOWJC | `0x5727cA7326032a8644a49dECECB8388BEF122bef` | `0xdd7BA6d8E92358AD7477b2f79fF83C78aC07F289` | V5 |
| NativeArb Athena Client | `0xB5d3F406089236ef9d4aB13306187aFCCA81f099` | `0x6DE7D58FCffF98AF2E85e1976155f3D671F6756C` | V3 |
| NativeOpenworkDAO | `0x24af98d763724362DC920507b351cC99170a5aa4` | `0xeb1A8fB15d3Bf5E1bd1100AC2528962356c2a398` | V2 |
| NativeAthena | `0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf` | `0xB4ea3444517B5C11DDF47f8F6E9dA6EccCD17395` | V9 |
| ProfileGenesis | `0x794809471215cBa5cE56c7d9F402eDd85F9eBa2E` | `0x9E8F58839aB114BbcA8A0c24f5BEC1C841294784` | V2 |
| ActivityTracker | `0x8C04840c3f5b5a8c44F9187F9205ca73509690EA` | `0x9588A78748a8bc82295bf44d87C4b9F924d11AE8` | V1 |
| OracleManager | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | `0xE1e1Cc40897DDaeED44a3194B0e53DFb4171ef59` | V1 |
| ProfileManager | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | `0xd30c9f6Bf3e6563a64AC32BD4Cc76407ed0e2fFf` | V3 |
| VotingPowerCheckpoints | `0x586cb49f19f93E5b9037CD22c539a7529b7bA1d9` | `0x78C3E094a8Dba771c434E1258738cE9D4404C19e` | V1 |
| NativeDAOStakeSync | `0xe541c372bF4E91F9FFe3Bc2A2Fa45CC38A273d2B` | `0xddF69B7C6a04C4972e27Dc2b3a9f88E8081bCf03` | V1 |
| Active Native Bridge | `0x9A0950594A699f5fb7decd7069F935100d39D9bF` | — | V3 standalone |
| NativeRewards | `0x5E80B57E1C465498F3E0B4360397c79A64A67Ce9` | — | V2 standalone |
| CCTPTransceiver | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | — | V1 standalone |
| NativeContractRegistry | `0x29D61B1a9E2837ABC0810925429Df641CBed58c3` | — | V1 standalone; not authoritative |
| NativeGenesisReader | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | — | V1 standalone |

Arbitrum native USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.

## Optimism

| Role | Proxy / address | Current implementation | Version |
|---|---|---|---|
| LOWJC Lite | `0x620205A4Ff0E652fF03a890d2A677de878a1dB63` | `0x74D6e1aDA0Dae53231298B24DeAf169647fd557d` | Lite V6 |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | V1 |
| Local Bridge | `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` | — | V1 standalone |
| CCTPTransceiver | `0x586C700ACFA1D129Ba2C6a6E673c55d586c32f15` | — | V2 standalone |

Optimism native USDC: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`.

## XDC Network

| Role | Proxy / address | Current implementation | Version |
|---|---|---|---|
| LOWJC Lite | `0x5cF21bFb944B6851048F9ac18a8C84F6323a8ce7` | `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D` | V3 |
| LocalAthena | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | `0xF78B688846673C3f6b93184BeC230d982c0db0c9` | V1 |
| Active Local Bridge | `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951` | — | V2 standalone |
| Standard CCTPTransceiver | `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` | — | 13 Jul 2026 standalone |

XDC native USDC: `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`.

## Ethereum Mainnet

| Role | Proxy / address | Current implementation | Version |
|---|---|---|---|
| ETHOpenworkDAO | `0xE8f7963fF3cE9f7dB129e3f619abd71cBB5Bb294` | `0xEdF3Bcf87716bE05e35E12bA7C0Fc6e1879c0f15` | V3 |
| VotingPowerCheckpoints | `0x72ee091C288512f0ee9eB42B8C152fbB127Dc782` | `0x51285003A01319c2f46BB2954384BCb69AfB1b45` | V1 |
| ETHDAOMessaging | `0xDCF7c77314E8F042C97EFB96991b7DAc5Dc79f0D` | `0x532fAB0b8Ca0dD7c14ca1324e7502534E5c8b9AE` | V1 |
| ETHLZOpenworkBridge | `0x20Fa268106A3C532cF9F733005Ab48624105c42F` | — | V1 standalone |
| ETHRewardsContract | `0x4756294bE516f73e8D1984E7a94E4ABaffA94c4d` | — | V1 standalone |
| OWORK Token | `0x765D70496Ef775F6ba1cB7465c2e0B296eB50d87` | — | V1 standalone |

## Verification status

- 31 active contract roles map to 50 live artifacts when proxy and implementation addresses are counted separately.
- 31 artifacts publish source on the relevant explorer.
- All 19 artifacts deployed on 19 July are runtime-verified but still pending explorer source publication.
- Every active proxy's ERC-1967 slot and explorer implementation link point to the implementation listed above.

Do not describe the system as “fully explorer verified” until those 19 source submissions succeed.

## Pathway status

- XDC ↔ Arbitrum: configured and end-to-end tested after the bridge cutover with production job `30365-3`.
- Optimism ↔ Arbitrum: reciprocally peered and configured; no post-cutover application delivery test is recorded.
- Ethereum ↔ Arbitrum: reciprocally peered and configured; no post-cutover governance delivery test is recorded.
- Direct XDC ↔ Ethereum: disabled. The security stack is absent and the Ethereum peer still names the retired XDC bridge.

## Legacy and held contracts

- Old Arbitrum bridge `0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F` remains deployed for rollback/in-flight compatibility but is not the active pointer.
- Old XDC bridge `0x74566644782e98c87a12E8Fc6f7c4c72e2908a36` is retired and not the active XDC pointer.
- `LocalAthena V2` exists in source but is intentionally not deployed pending a production dispute-minimum decision.

## Reading a proxy implementation

```bash
cast storage <PROXY_ADDRESS> \
  0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc \
  --rpc-url <RPC_URL>
```

The last 20 bytes of the returned value are the implementation address.
