// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console2} from "forge-std/Script.sol";

import {LocalLZOpenworkBridge} from "../src/suites/current-mainnet/local/local-lz-openwork-bridge.sol";
import {LocalOpenWorkJobContractLite} from "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v2.sol";
import {LocalAthena} from "../src/suites/current-mainnet/local/local-athena.sol";
import {CCTPTransceiverXdcStandard12Jul2026} from
    "../src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol";
import {UUPSProxy} from "../src/suites/current-mainnet/utilities/proxy.sol";

/// @notice Dated 12 Jul 2026 deployment for the OpenWork local-chain stack on XDC mainnet.
/// @dev Uses XDC Standard CCTP finality. Cross-chain peer writes are intentionally separate.
contract DeployXdcLocal12Jul2026 is Script {
    uint32 internal constant XDC_EID = 30365;
    uint32 internal constant NATIVE_EID = 30110;
    uint32 internal constant MAIN_EID = 30101;

    address internal constant XDC_LZ_ENDPOINT = 0xcb566e3B6934Fa77258d68ea18E931fa75e1aaAa;
    address internal constant XDC_USDC = 0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1;
    address internal constant XDC_TOKEN_MESSENGER_V2 = 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d;
    address internal constant XDC_MESSAGE_TRANSMITTER_V2 = 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64;

    address internal constant ARBITRUM_NATIVE_BRIDGE = 0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F;
    address internal constant ARBITRUM_NOWJC = 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99;
    address internal constant ARBITRUM_NATIVE_ATHENA = 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf;
    address internal constant ETHEREUM_MAIN_BRIDGE = 0x20Fa268106A3C532cF9F733005Ab48624105c42F;
    address internal constant EXPECTED_DEPLOYER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;

    function run() external {
        require(block.chainid == 50, "XDC mainnet only");
        address owner = vm.envAddress("XDC_OWNER");
        require(owner == EXPECTED_DEPLOYER, "Unexpected deployer");

        vm.startBroadcast();

        // Keep this deployment order stable. With a fresh deployer nonce, it makes
        // all six addresses predictable before any configuration transactions.
        LocalLZOpenworkBridge localBridge =
            new LocalLZOpenworkBridge(XDC_LZ_ENDPOINT, owner, NATIVE_EID, MAIN_EID, XDC_EID);

        CCTPTransceiverXdcStandard12Jul2026 cctp =
            new CCTPTransceiverXdcStandard12Jul2026(XDC_TOKEN_MESSENGER_V2, XDC_MESSAGE_TRANSMITTER_V2, XDC_USDC);

        LocalOpenWorkJobContractLite lowjcImplementation = new LocalOpenWorkJobContractLite();
        LocalAthena athenaImplementation = new LocalAthena();

        bytes memory lowjcInit = abi.encodeCall(
            LocalOpenWorkJobContractLite.initialize, (owner, XDC_USDC, XDC_EID, address(localBridge), address(cctp))
        );
        UUPSProxy lowjcProxy = new UUPSProxy(address(lowjcImplementation), lowjcInit);
        LocalOpenWorkJobContractLite lowjc = LocalOpenWorkJobContractLite(address(lowjcProxy));

        bytes memory athenaInit = abi.encodeCall(
            LocalAthena.initialize,
            (owner, XDC_USDC, XDC_EID, address(localBridge), address(cctp), ARBITRUM_NATIVE_ATHENA)
        );
        UUPSProxy athenaProxy = new UUPSProxy(address(athenaImplementation), athenaInit);
        LocalAthena athena = LocalAthena(address(athenaProxy));

        // Local contract routing and authorization.
        localBridge.setLowjcContract(address(lowjc));
        localBridge.setAthenaClientContract(address(athena));
        localBridge.authorizeContract(address(lowjc), true);
        localBridge.authorizeContract(address(athena), true);

        lowjc.setAthenaClientContract(address(athena));
        lowjc.setCCTPMintRecipient(ARBITRUM_NOWJC);
        athena.setJobContract(address(lowjc));
        // initialize() already sets Arbitrum's CCTP domain to 3.

        // XDC side of the LayerZero pathways. Reciprocal peer writes are made
        // separately on Arbitrum and Ethereum after these addresses are final.
        localBridge.setPeer(NATIVE_EID, bytes32(uint256(uint160(ARBITRUM_NATIVE_BRIDGE))));
        localBridge.setPeer(MAIN_EID, bytes32(uint256(uint160(ETHEREUM_MAIN_BRIDGE))));

        vm.stopBroadcast();

        console2.log("XDC LocalLZOpenworkBridge", address(localBridge));
        console2.log("XDC CCTPTransceiver", address(cctp));
        console2.log("XDC LOWJC implementation", address(lowjcImplementation));
        console2.log("XDC LocalAthena implementation", address(athenaImplementation));
        console2.log("XDC LOWJC proxy", address(lowjc));
        console2.log("XDC LocalAthena proxy", address(athena));
    }
}
