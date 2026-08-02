// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {NativeAthenaV2} from "../src/suites/current-mainnet/native/native-athena-v2.sol";

contract CurrentMainnetNativeAthenaAuthTest is Test {
    NativeAthenaV2 internal athena;
    address internal admin = makeAddr("admin");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        address athenaAddress = makeAddr("athena");
        vm.etch(
            athenaAddress, vm.getDeployedCode("src/suites/current-mainnet/native/native-athena-v2.sol:NativeAthenaV2")
        );
        athena = NativeAthenaV2(payable(athenaAddress));
        athena.initialize(address(this), makeAddr("dao"), makeAddr("genesis"), makeAddr("nowjc"), makeAddr("usdc"));
    }

    function testOwnerAndGrantedAdminCanUseAdminFunctions() public {
        address newGenesis = makeAddr("new-genesis");
        athena.setGenesis(newGenesis);
        assertEq(address(athena.genesis()), newGenesis);

        athena.setAdmin(admin, true);
        address oracleManager = makeAddr("oracle-manager");
        vm.prank(admin);
        athena.setOracleManager(oracleManager);
        assertEq(address(athena.oracleManager()), oracleManager);
    }

    function testUnauthorizedCallerCannotUseAdminFunctions() public {
        vm.prank(attacker);
        vm.expectRevert(bytes("Auth"));
        athena.setGenesis(makeAddr("malicious-genesis"));
    }
}
