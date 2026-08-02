// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console2} from "forge-std/Script.sol";

import {NativeAthenaV8XdcDomain12Jul2026} from
    "../src/suites/current-mainnet/native/native-athena-v8-xdc-domain-12-jul-2026.sol";

interface INativeAthenaUUPS12Jul2026 {
    function owner() external view returns (address);
    function admins(address account) external view returns (bool);
    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable;
}

/// @notice Deploys NativeAthena V8 and upgrades the live Arbitrum proxy.
/// @dev Exactly two paid transactions: implementation deployment, then UUPS upgrade.
contract UpgradeNativeAthenaXdcDomain12Jul2026 is Script {
    address internal constant EXPECTED_DEPLOYER = 0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C;
    address internal constant NATIVE_ATHENA_PROXY = 0xE6B9d996b56162cD7eDec3a83aE72943ee7C46Bf;

    function run() external {
        require(block.chainid == 42161, "Arbitrum mainnet only");

        address owner = vm.envAddress("ARBITRUM_OWNER");
        require(owner == EXPECTED_DEPLOYER, "Unexpected deployer");

        INativeAthenaUUPS12Jul2026 proxy = INativeAthenaUUPS12Jul2026(NATIVE_ATHENA_PROXY);
        require(proxy.owner() == owner, "Owner mismatch");
        require(proxy.admins(owner), "Deployer is not Athena admin");

        vm.startBroadcast();

        NativeAthenaV8XdcDomain12Jul2026 implementation = new NativeAthenaV8XdcDomain12Jul2026();
        proxy.upgradeToAndCall(address(implementation), bytes(""));

        vm.stopBroadcast();

        console2.log("NativeAthena V8 implementation", address(implementation));
        console2.log("NativeAthena proxy", NATIVE_ATHENA_PROXY);
    }
}
