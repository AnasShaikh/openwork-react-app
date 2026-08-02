// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script} from "forge-std/Script.sol";

interface INativeBridgeXdcConnection12Jul2026 {
    function owner() external view returns (address);
    function setPeer(uint32 eid, bytes32 peer) external;
    function addLocalChain(uint32 eid) external;
}

/// @notice Adds XDC as a local chain and reciprocal LayerZero peer on Arbitrum.
/// @dev Exactly two paid Arbitrum transactions.
contract ConnectXdcArbitrum12Jul2026 is Script {
    uint32 internal constant XDC_EID = 30365;
    address internal constant EXPECTED_DEPLOYER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;
    address internal constant NATIVE_BRIDGE = 0x1bC57d93eC9F9214EDe2e81281A26Ac0E01A9A5F;
    address internal constant EXPECTED_XDC_BRIDGE = 0x74566644782e98c87a12E8Fc6f7c4c72e2908a36;

    function run() external {
        require(block.chainid == 42161, "Arbitrum mainnet only");

        address owner = vm.envAddress("ARBITRUM_OWNER");
        address xdcBridge = vm.envAddress("XDC_BRIDGE");
        require(owner == EXPECTED_DEPLOYER, "Unexpected deployer");
        require(xdcBridge == EXPECTED_XDC_BRIDGE, "Unexpected XDC bridge");

        INativeBridgeXdcConnection12Jul2026 bridge = INativeBridgeXdcConnection12Jul2026(NATIVE_BRIDGE);
        require(bridge.owner() == owner, "Owner mismatch");

        vm.startBroadcast();

        bridge.setPeer(XDC_EID, bytes32(uint256(uint160(xdcBridge))));
        bridge.addLocalChain(XDC_EID);

        vm.stopBroadcast();
    }
}
