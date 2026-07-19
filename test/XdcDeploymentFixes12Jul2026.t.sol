// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {CCTPTransceiverXdcStandard12Jul2026} from
    "../src/suites/current-mainnet/xdc/cctp-transceiver-xdc-standard-12-jul-2026.sol";
import {NativeAthenaV8XdcDomain12Jul2026} from
    "../src/suites/current-mainnet/native/native-athena-v8-xdc-domain-12-jul-2026.sol";

contract MockUsdc12Jul2026 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address account, uint256 amount) external {
        balanceOf[account] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }
}

contract MockTokenMessenger12Jul2026 {
    uint32 public lastFinalityThreshold;
    uint32 public lastDestinationDomain;
    uint256 public lastAmount;

    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32,
        address,
        bytes32,
        uint256,
        uint32 minFinalityThreshold
    ) external {
        lastAmount = amount;
        lastDestinationDomain = destinationDomain;
        lastFinalityThreshold = minFinalityThreshold;
    }
}

contract NativeAthenaXdcDomainHarness12Jul2026 is NativeAthenaV8XdcDomain12Jul2026 {
    function parseJobIdForChainDomain(string calldata jobId) external pure returns (uint32) {
        return _parseJobIdForChainDomain(jobId);
    }
}

contract XdcDeploymentFixes12Jul2026Test is Test {
    MockUsdc12Jul2026 internal usdc;
    MockTokenMessenger12Jul2026 internal messenger;
    CCTPTransceiverXdcStandard12Jul2026 internal transceiver;

    function setUp() public {
        usdc = new MockUsdc12Jul2026();
        messenger = new MockTokenMessenger12Jul2026();
        transceiver = new CCTPTransceiverXdcStandard12Jul2026(address(messenger), address(0x1234), address(usdc));
        usdc.mint(address(this), 2_000_000);
        usdc.approve(address(transceiver), type(uint256).max);
    }

    function testLegacySendFastUsesStandardFinality() public {
        transceiver.sendFast(1_000_000, 3, bytes32(uint256(uint160(address(this)))), 0);

        assertEq(messenger.lastAmount(), 1_000_000);
        assertEq(messenger.lastDestinationDomain(), 3);
        assertEq(messenger.lastFinalityThreshold(), 2000);
    }

    function testExplicitSendStandardUsesStandardFinality() public {
        transceiver.sendStandard(1_000_000, 3, bytes32(uint256(uint160(address(this)))), 0);

        assertEq(messenger.lastFinalityThreshold(), 2000);
    }

    function testNativeAthenaMapsXdcEidToCircleDomain18() public {
        NativeAthenaXdcDomainHarness12Jul2026 harness = new NativeAthenaXdcDomainHarness12Jul2026();
        assertEq(harness.parseJobIdForChainDomain("30365-1"), 18);
    }

    function testNativeAthenaStillRejectsUnknownEid() public {
        NativeAthenaXdcDomainHarness12Jul2026 harness = new NativeAthenaXdcDomainHarness12Jul2026();
        vm.expectRevert("Unknown EID");
        harness.parseJobIdForChainDomain("39999-1");
    }
}
