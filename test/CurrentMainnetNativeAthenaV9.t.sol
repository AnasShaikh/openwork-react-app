// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {NativeAthenaV9, IOpenworkGenesis} from "../src/suites/current-mainnet/native/native-athena-v9.sol";

contract MockAthenaV9Genesis {
    address internal giver;
    address internal applicant;
    IOpenworkGenesis.JobStatus internal status;

    string public lastDisputeId;
    address public lastDisputeRaiser;

    function setJob(address _giver, address _applicant, IOpenworkGenesis.JobStatus _status) external {
        giver = _giver;
        applicant = _applicant;
        status = _status;
    }

    function getJob(string memory jobId) external view returns (IOpenworkGenesis.Job memory job) {
        job.id = jobId;
        job.jobGiver = giver;
        job.applicants = new address[](0);
        job.status = status;
        job.workSubmissions = new string[](0);
        job.milestonePayments = new IOpenworkGenesis.MilestonePayment[](0);
        job.finalMilestones = new IOpenworkGenesis.MilestonePayment[](0);
        job.currentMilestone = 1;
        job.selectedApplicant = applicant;
    }

    function getOracle(string memory name) external pure returns (IOpenworkGenesis.Oracle memory oracle) {
        oracle.name = name;
        oracle.members = new address[](3);
        oracle.members[0] = address(1);
        oracle.members[1] = address(2);
        oracle.members[2] = address(3);
        oracle.skillVerifiedAddresses = new address[](0);
    }

    function setDispute(string memory disputeId, uint256, string memory, address disputeRaiser, uint256) external {
        lastDisputeId = disputeId;
        lastDisputeRaiser = disputeRaiser;
    }
}

contract MockAthenaV9ActivityTracker {
    function oracleActiveStatus(string memory) external pure returns (bool) {
        return true;
    }
}

contract CurrentMainnetNativeAthenaV9Test is Test {
    NativeAthenaV9 internal athena;
    MockAthenaV9Genesis internal genesis;

    address internal giver = makeAddr("giver");
    address internal applicant = makeAddr("applicant");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        genesis = new MockAthenaV9Genesis();
        genesis.setJob(giver, applicant, IOpenworkGenesis.JobStatus.InProgress);

        address athenaAddress = makeAddr("athena-v9");
        vm.etch(
            athenaAddress, vm.getDeployedCode("src/suites/current-mainnet/native/native-athena-v9.sol:NativeAthenaV9")
        );
        athena = NativeAthenaV9(payable(athenaAddress));
        athena.initialize(address(this), address(0), address(genesis), address(0), address(0));
        athena.setActivityTracker(address(new MockAthenaV9ActivityTracker()));
        athena.addAuthorizedContract(address(this), true);
    }

    function testDisputeReadsCanonicalGenesisJobAndAcceptsParty() public {
        athena.handleRaiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000, giver);

        assertEq(genesis.lastDisputeId(), "job-1-1");
        assertEq(genesis.lastDisputeRaiser(), giver);
    }

    function testDisputeRejectsNonParty() public {
        vm.expectRevert(bytes("Not a job party"));
        athena.handleRaiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000, attacker);
    }

    function testDisputeRejectsCompletedJob() public {
        genesis.setJob(giver, applicant, IOpenworkGenesis.JobStatus.Completed);

        vm.expectRevert(bytes("Job not in progress"));
        athena.handleRaiseDispute("job-1", "dispute", "oracle", 50_000_000, 100_000_000, applicant);
    }

    function testDisputeRejectsInvalidAmounts() public {
        vm.expectRevert(bytes("Invalid fee"));
        athena.handleRaiseDispute("job-1", "dispute", "oracle", 0, 100_000_000, giver);

        vm.expectRevert(bytes("Invalid disputed amount"));
        athena.handleRaiseDispute("job-1", "dispute", "oracle", 50_000_000, 0, giver);
    }
}
