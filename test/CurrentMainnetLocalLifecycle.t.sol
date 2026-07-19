// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {
    LocalOpenWorkJobContractLite,
    ILayerZeroBridge
} from "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol";

contract MockLocalBridge is ILayerZeroBridge {
    function sendToNativeChain(string calldata, bytes calldata, bytes calldata) external payable {}
}

contract MockLocalCCTPSender {
    function sendFast(uint256, uint32, bytes32, uint256) external {}
}

contract CurrentMainnetLocalLifecycleTest is Test {
    ERC20Mock internal usdc;
    LocalOpenWorkJobContractLite internal adapter;

    address internal giver = makeAddr("giver");
    address internal applicant = makeAddr("applicant");

    function setUp() public {
        usdc = new ERC20Mock();
        MockLocalBridge bridge = new MockLocalBridge();
        MockLocalCCTPSender cctp = new MockLocalCCTPSender();

        LocalOpenWorkJobContractLite implementation = new LocalOpenWorkJobContractLite();
        adapter = LocalOpenWorkJobContractLite(
            address(
                new ERC1967Proxy(
                    address(implementation),
                    abi.encodeCall(
                        LocalOpenWorkJobContractLite.initialize,
                        (address(this), address(usdc), 50, address(bridge), address(cctp))
                    )
                )
            )
        );

        usdc.mint(giver, 1_000_000);
        vm.prank(giver);
        usdc.approve(address(adapter), type(uint256).max);
    }

    function testReleaseAndLockRequiresNextMilestoneButFinalReleaseCompletes() public {
        vm.prank(giver);
        adapter.startDirectContract(
            applicant, "details", _strings("one", "two"), _amounts(100_000, 200_000), 3, bytes("")
        );

        string memory jobId = "50-1";
        vm.prank(giver);
        adapter.releaseAndLockNext(jobId, bytes(""));

        LocalOpenWorkJobContractLite.Job memory job = adapter.getJob(jobId);
        assertEq(job.currentMilestone, 2);
        assertEq(job.currentLockedAmount, 200_000);
        assertEq(uint256(job.status), uint256(LocalOpenWorkJobContractLite.JobStatus.InProgress));

        vm.prank(giver);
        vm.expectRevert(bytes("No next milestone"));
        adapter.releaseAndLockNext(jobId, bytes(""));

        vm.prank(giver);
        adapter.releasePaymentCrossChain(jobId, 3, applicant, bytes(""));

        job = adapter.getJob(jobId);
        assertEq(job.currentLockedAmount, 0);
        assertEq(job.totalReleased, 300_000);
        assertEq(uint256(job.status), uint256(LocalOpenWorkJobContractLite.JobStatus.Completed));
    }

    function testApplicantMilestonesWaitForCanonicalScheduleBeforeEscrow() public {
        vm.prank(giver);
        adapter.postJob("details", _strings("one", "two"), _amounts(100_000, 200_000), bytes(""));

        vm.prank(giver);
        adapter.startJob("50-1", 1, true, bytes(""));

        LocalOpenWorkJobContractLite.Job memory job = adapter.getJob("50-1");
        assertEq(uint256(job.status), uint256(LocalOpenWorkJobContractLite.JobStatus.Open));
        assertEq(job.currentLockedAmount, 0);
        assertEq(adapter.pendingStartApplicationId("50-1"), 1);
    }

    function testRejectsInvalidMilestonesBeforeSendingMessage() public {
        vm.prank(giver);
        vm.expectRevert(bytes("Length mismatch"));
        adapter.postJob("invalid", _strings("one", "two"), _singleAmount(100_000), bytes(""));

        vm.prank(giver);
        vm.expectRevert(bytes("Invalid milestone amount"));
        adapter.startDirectContract(applicant, "invalid", _strings("one", "two"), _amounts(100_000, 0), 3, bytes(""));
    }

    function _strings(string memory first, string memory second) internal pure returns (string[] memory values) {
        values = new string[](2);
        values[0] = first;
        values[1] = second;
    }

    function _amounts(uint256 first, uint256 second) internal pure returns (uint256[] memory values) {
        values = new uint256[](2);
        values[0] = first;
        values[1] = second;
    }

    function _singleAmount(uint256 amount) internal pure returns (uint256[] memory values) {
        values = new uint256[](1);
        values[0] = amount;
    }
}
