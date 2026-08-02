// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script} from "forge-std/Script.sol";

interface IEthereumBridgeXdcConnection12Jul2026 {
    function owner() external view returns (address);
    function setPeer(uint32 eid, bytes32 peer) external;
}

/// @notice Adds the reciprocal XDC LayerZero peer on Ethereum mainnet.
/// @dev Exactly one paid Ethereum transaction.
contract ConnectXdcEthereum12Jul2026 is Script {
    uint32 internal constant XDC_EID = 30365;
    address internal constant EXPECTED_DEPLOYER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;
    address internal constant ETHEREUM_BRIDGE = 0x20Fa268106A3C532cF9F733005Ab48624105c42F;
    address internal constant EXPECTED_XDC_BRIDGE = 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36;

    function run() external {
        require(block.chainid == 1, "Ethereum mainnet only");

        address owner = vm.envAddress("ETHEREUM_OWNER");
        address xdcBridge = vm.envAddress("XDC_BRIDGE");
        require(owner == EXPECTED_DEPLOYER, "Unexpected deployer");
        require(xdcBridge == EXPECTED_XDC_BRIDGE, "Unexpected XDC bridge");

        IEthereumBridgeXdcConnection12Jul2026 bridge = IEthereumBridgeXdcConnection12Jul2026(ETHEREUM_BRIDGE);
        require(bridge.owner() == owner, "Owner mismatch");

        vm.startBroadcast();
        bridge.setPeer(XDC_EID, bytes32(uint256(uint160(xdcBridge))));
        vm.stopBroadcast();
    }
}
