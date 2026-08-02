# Contract Addresses - 8-Jan Suite Deployment

**Deployer:** `0xfD08836eeE6242092a9c869237a8d122275b024A` (WALL2)

---

## Arbitrum Sepolia (Native Chain - EID: 40231)

| Contract | Implementation | Proxy |
|----------|---------------|-------|
| NativeOpenworkGenesis | 0x7fb9C7BA38577F71916b776DEb9DD854f8dD0465 | 0x00Fad82208A77232510cE16CBB63c475A914C95a |
| NativeProfileGenesis | 0x48b56ae7DB57924b992F6EA7176633D3B5f110A9 | 0x45468344678D2Af5353fb4b5E825A21b186Fa57a |
| NativeProfileManager | 0x09c8e4a39A279E759BB092748e42e7BE04FdA8F2 | 0xbf26f05A4e14f1Cb410424AA5242993eF121c2F7 |
| NativeRewardsContract | N/A (standalone) | **0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0** |
| NativeOpenWorkJobContract | 0x87De81B5659e7416D7C1dfbf5491d920c847406D (refactored) | 0x39158a9F92faB84561205B05223929eFF131455e |
| NativeAthenaOracleManager | 0xEee43057E050fea31F98fEeA128B56Db3937648C | 0x24BB11ffA6b68a007297A0132e6D9f71638bA2ce |
| NativeAthenaActivityTracker | 0xb85A9c772aC6D0370C5ddB084E2925a70cEAb784 | 0x7b2cBA5368d5F02Cb86CEbB11a4A4e071545A755 |
| NativeAthena | 0x8Cd52D25F1F717912A50Ba4162F42F3AdbD8acDd (refactored) | 0x2d9C882C450B5e992C1F5bE5f0594654ae4B4f1f |
| NativeOpenworkDAO | 0x0d8C4176D180a36739aDB0bb8A16b73C369C8319 (upgraded) | 0x3e0C062DbbC61ec6D7ac8Ab14d9B05F31484C113 |
| NativeLZOpenworkBridge | N/A | 0x4E8A3Cb25BbE74C44fD9b731e214e6A5c5CAF502 |
| CCTPTransceiver | N/A | 0x959d0fc6dD8efCf764BD3B0bbaC191F2D7Dd03f1 |

**Notes:**
- NativeRewardsContract replaced: Old proxy `0xf2E8462b4c541fe0b9db42B97990301308D7D027` → NEW standalone `0xaf2661D3430311b5372fda7ef60d099C1CdaFaf0`
- DAO, Athena, NOWJC implementations upgraded for voting power centralization fix
- NOWJC & Athena upgraded to refactored versions (Phase 2.7)

---

## Optimism Sepolia (Local Chain - EID: 40232)

| Contract | Implementation | Proxy |
|----------|---------------|-------|
| LocalOpenWorkJobContract | 0x6fB881b4830EBBb82da920Eca29fED05AeB88e44 | 0x36aAEAbF2C04F1BecD520CF34Ef62783a9A446Db |
| LocalAthena | 0x850b5f7C9Fd286a3C73251F101fCFa83E1be887d | 0xed81395eb69ac568f92188948C1CC1adfD595361 |
| LocalLZOpenworkBridge | N/A | 0xc0a7B2a893Be5Fd4E4Fee8485744bF7AA321F28b |
| CCTPTransceiver | N/A | 0x3c820FE16F7B85BA193527E5ca64dd3193F6ABB3 |

---

## Ethereum Sepolia (Main Chain - EID: 40161)

| Contract | Implementation | Proxy |
|----------|---------------|-------|
| ETHRewardsContract | N/A (standalone) | 0x5081183C6812C8066D6Ec6cCdc974e6Ce830596D |
| ETHOpenworkDAO | 0xD3bB6936cBe67942Dd1D438490c5698063FFb09C | 0x5F046980A58acC24530b5BBf483e844A518936FD |
| OpenworkToken | N/A | 0xd8Ba6A37Ba9ee222593e6CbF005273897dd06c98 |
| ETHLZOpenworkBridge | N/A | 0xdA4f8BE0A233972eDcdC43eaf39ED828B75C89e8 |

**Token Distribution:**
- ETHRewardsContract: 750M OWORK (earned + team locked)
- ETHOpenworkDAO: 250M OWORK (preseed + treasury + team free)
