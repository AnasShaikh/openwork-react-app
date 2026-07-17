// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {
    NativeArbAthenaClient,
    ILocalOpenWorkJobContract,
    INativeAthena
} from "../src/suites/current-mainnet/native/native-arb-athena-client.sol";

contract MockNativeAthena is INativeAthena {
    function handleRaiseDispute(string memory, string memory, string memory, uint256, uint256, address) external {}
    function handleSubmitSkillVerification(address, string memory, uint256, string memory) external {}
    function handleAskAthena(address, string memory, string memory, string memory, string memory) external {}
}

contract MockAthenaJobContract is ILocalOpenWorkJobContract {
    address internal giver;
    address internal applicant;
    JobStatus internal status;

    function setJob(address _giver, address _applicant, JobStatus _status) external {
        giver = _giver;
        applicant = _applicant;
        status = _status;
    }

    function getJob(string memory _jobId) external view returns (Job memory job) {
        job.id = _jobId;
        job.jobGiver = giver;
        job.applicants = new address[](0);
        job.status = status;
        job.workSubmissions = new string[](0);
        job.milestonePayments = new MilestonePayment[](0);
        job.finalMilestones = new MilestonePayment[](0);
        job.currentMilestone = 1;
        job.selectedApplicant = applicant;
    }

    function resolveDispute(string memory, bool) external {}
}

contract CurrentMainnetAthenaTest is Test {
    ERC20Mock internal usdc;
    MockNativeAthena internal nativeAthena;
    MockAthenaJobContract internal jobContract;
    NativeArbAthenaClient internal client;

    address internal giver = makeAddr("giver");
    address internal applicant = makeAddr("applicant");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        usdc = new ERC20Mock();
        nativeAthena = new MockNativeAthena();
        jobContract = new MockAthenaJobContract();

        NativeArbAthenaClient implementation = new NativeArbAthenaClient();
        client = NativeArbAthenaClient(
            address(
                new ERC1967Proxy(
                    address(implementation),
                    abi.encodeCall(
                        NativeArbAthenaClient.initialize,
                        (address(this), address(usdc), address(nativeAthena), address(jobContract))
                    )
                )
            )
        );

        jobContract.setJob(giver, applicant, ILocalOpenWorkJobContract.JobStatus.InProgress);
        usdc.mint(giver, 200_000_000);
        vm.prank(giver);
        usdc.approve(address(client), type(uint256).max);
    }

    function testDisputeRequiresMinimumFeeAndJobParty() public {
        vm.prank(giver);
        vm.expectRevert(bytes("Fee below minimum"));
        client.raiseDispute("job-1", "dispute", "oracle", 49_999_999, 100_000_000);

        vm.prank(attacker);
        vm.expectRevert(bytes("Not a job party"));
        client.raiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000);
    }

    function testDisputeCannotBeRaisedTwice() public {
        vm.prank(giver);
        client.raiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000);

        assertTrue(client.jobDisputeExists("job-1"));
        assertEq(usdc.balanceOf(address(nativeAthena)), 50_000_000);

        vm.prank(giver);
        vm.expectRevert(bytes("Dispute already exists"));
        client.raiseDispute("job-1", "second", "oracle", 50_000_000, 100_000_000);
    }

    function testDisputeRequiresInProgressJob() public {
        jobContract.setJob(giver, applicant, ILocalOpenWorkJobContract.JobStatus.Completed);

        vm.prank(giver);
        vm.expectRevert(bytes("Job not in progress"));
        client.raiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000);
    }
}
