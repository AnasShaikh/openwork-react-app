// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ETHOpenworkDAO} from "../src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol";

contract MockEthDaoCheckpoints {
    function checkpoint(address, uint256, uint256) external {}
}

contract MockEthDaoMessaging {
    function sendStakeUpdate(address, uint256, uint256, uint256, bool, bytes calldata, address) external payable {}
}

contract ConfigurableReturnToken {
    bool internal transferFromResult = true;
    bool internal transferResult = true;

    function setTransferFromResult(bool result) external {
        transferFromResult = result;
    }

    function setTransferResult(bool result) external {
        transferResult = result;
    }

    function transferFrom(address, address, uint256) external view returns (bool) {
        return transferFromResult;
    }

    function transfer(address, uint256) external view returns (bool) {
        return transferResult;
    }

    function balanceOf(address) external pure returns (uint256) {
        return type(uint256).max;
    }
}

contract CurrentMainnetEthDaoTest is Test {
    ETHOpenworkDAO internal dao;
    ConfigurableReturnToken internal token;
    address internal staker = makeAddr("staker");

    function setUp() public {
        token = new ConfigurableReturnToken();
        address daoAddress = makeAddr("eth-dao");
        vm.etch(daoAddress, vm.getDeployedCode("src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol:ETHOpenworkDAO"));
        dao = ETHOpenworkDAO(payable(daoAddress));
        dao.initialize(address(this), address(token), 1, address(0));
        dao.initializeV3(address(new MockEthDaoCheckpoints()), address(new MockEthDaoMessaging()));
    }

    function testStakeRejectsFailedTokenTransfer() public {
        token.setTransferFromResult(false);

        vm.prank(staker);
        vm.expectRevert(bytes("Token transfer failed"));
        dao.stake(100 ether, 1, bytes(""));

        (uint256 amount,,) = dao.stakes(staker);
        assertEq(amount, 0);
    }

    function testUnstakeRejectsFailedTokenTransferWithoutDeletingStake() public {
        vm.prank(staker);
        dao.stake(100 ether, 1, bytes(""));

        vm.warp(block.timestamp + 365 days);
        vm.prank(staker);
        dao.unstake(bytes(""));

        vm.warp(block.timestamp + 24 hours);
        token.setTransferResult(false);

        vm.prank(staker);
        vm.expectRevert(bytes("Token transfer failed"));
        dao.unstake(bytes(""));

        (uint256 amount,,) = dao.stakes(staker);
        assertEq(amount, 100 ether);
    }
}
