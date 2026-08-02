// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {NativeOpenworkGenesis} from "../src/suites/current-mainnet/native/native-openwork-genesis.sol";
import {NativeOpenWorkJobContract} from "../src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol";
import {NativeArbOpenWorkJobContractV5} from "../src/suites/current-mainnet/native/native-arb-lowjc-v5.sol";

contract MockProfileManager {
    function hasProfile(address) external pure returns (bool) {
        return true;
    }
}

contract CurrentMainnetJobLifecycleTest is Test {
    ERC20Mock internal usdc;
    NativeOpenworkGenesis internal genesis;
    NativeOpenWorkJobContract internal nowjc;
    NativeArbOpenWorkJobContractV5 internal adapter;

    address internal giver = makeAddr("giver");
    address internal applicant = makeAddr("applicant");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        usdc = new ERC20Mock();

        NativeOpenworkGenesis genesisImplementation = new NativeOpenworkGenesis();
        genesis = NativeOpenworkGenesis(
            address(
                new ERC1967Proxy(
                    address(genesisImplementation), abi.encodeCall(NativeOpenworkGenesis.initialize, (address(this)))
                )
            )
        );

        NativeOpenWorkJobContract nowjcImplementation = new NativeOpenWorkJobContract();
        nowjc = NativeOpenWorkJobContract(
            address(
                new ERC1967Proxy(
                    address(nowjcImplementation),
                    abi.encodeCall(
                        NativeOpenWorkJobContract.initialize,
                        (address(this), address(this), address(genesis), address(0), address(usdc), address(this))
                    )
                )
            )
        );

        NativeArbOpenWorkJobContractV5 adapterImplementation = new NativeArbOpenWorkJobContractV5();
        adapter = NativeArbOpenWorkJobContractV5(
            address(
                new ERC1967Proxy(
                    address(adapterImplementation),
                    abi.encodeCall(
                        NativeArbOpenWorkJobContractV5.initialize, (address(this), address(usdc), address(nowjc))
                    )
                )
            )
        );

        genesis.authorizeContract(address(nowjc), true);
        nowjc.setAdmin(address(this), true);
        nowjc.addAuthorizedContract(address(adapter));
        nowjc.addAuthorizedContract(address(this));
        nowjc.setCommissionPercentage(0);
        nowjc.setMinCommission(0);
        adapter.setProfileManager(address(new MockProfileManager()));

        usdc.mint(giver, 1_000_000);
        vm.prank(giver);
        usdc.approve(address(adapter), type(uint256).max);
    }

    function testApplicantMilestonesDriveEscrowAndCompleteOnlyAfterFinalRelease() public {
        string[] memory giverDescriptions = _strings("giver-one", "giver-two");
        uint256[] memory giverAmounts = _amounts(100_000, 200_000);

        vm.prank(giver);
        adapter.postJob("job-details", giverDescriptions, giverAmounts);

        string memory jobId = string.concat(vm.toString(block.chainid), "-1");
        string[] memory applicantDescriptions = _strings("applicant-one", "applicant-two");
        uint256[] memory applicantAmounts = _amounts(150_000, 250_000);

        vm.prank(applicant);
        adapter.applyToJob(jobId, "application", applicantDescriptions, applicantAmounts, 3);

        vm.prank(giver);
        adapter.startJob(jobId, 1, true);

        NativeArbOpenWorkJobContractV5.Job memory localJob = adapter.getJob(jobId);
        assertEq(localJob.currentMilestone, 1);
        assertEq(localJob.currentLockedAmount, 150_000);
        assertEq(localJob.finalMilestones[0].amount, 150_000);
        assertEq(localJob.finalMilestones[1].amount, 250_000);

        NativeOpenworkGenesis.Job memory nativeJob = genesis.getJob(jobId);
        assertEq(nativeJob.currentMilestone, 1);
        assertEq(nativeJob.selectedApplicant, applicant);
        assertEq(uint256(nativeJob.status), uint256(NativeOpenworkGenesis.JobStatus.InProgress));
        assertEq(nativeJob.finalMilestones[0].amount, 150_000);

        vm.prank(attacker);
        vm.expectRevert(bytes("Only selected applicant"));
        adapter.submitWork(jobId, "malicious-submission");

        vm.expectRevert(bytes("Only selected applicant"));
        nowjc.submitWork(attacker, jobId, "forged-bridge-submission");

        vm.prank(applicant);
        adapter.submitWork(jobId, "milestone-one-complete");

        vm.prank(giver);
        adapter.releaseAndLockNext(jobId);

        assertEq(usdc.balanceOf(applicant), 150_000);
        localJob = adapter.getJob(jobId);
        assertEq(localJob.currentMilestone, 2);
        assertEq(localJob.currentLockedAmount, 250_000);
        assertEq(uint256(localJob.status), uint256(NativeArbOpenWorkJobContractV5.JobStatus.InProgress));

        nativeJob = genesis.getJob(jobId);
        assertEq(nativeJob.currentMilestone, 2);
        assertEq(uint256(nativeJob.status), uint256(NativeOpenworkGenesis.JobStatus.InProgress));

        vm.prank(giver);
        vm.expectRevert(bytes("No next milestone"));
        adapter.releaseAndLockNext(jobId);

        vm.prank(giver);
        adapter.releasePayment(jobId);

        assertEq(usdc.balanceOf(applicant), 400_000);
        localJob = adapter.getJob(jobId);
        assertEq(localJob.currentLockedAmount, 0);
        assertEq(uint256(localJob.status), uint256(NativeArbOpenWorkJobContractV5.JobStatus.Completed));

        nativeJob = genesis.getJob(jobId);
        assertEq(nativeJob.totalPaid, 400_000);
        assertEq(uint256(nativeJob.status), uint256(NativeOpenworkGenesis.JobStatus.Completed));
    }

    function testDirectContractStartsAtMilestoneOne() public {
        vm.prank(giver);
        adapter.startDirectContract(applicant, "direct-details", _strings("one", "two"), _amounts(100_000, 200_000), 3);

        string memory jobId = string.concat(vm.toString(block.chainid), "-1");
        assertEq(adapter.getJob(jobId).currentMilestone, 1);
        assertEq(genesis.getJob(jobId).currentMilestone, 1);
    }

    function testRejectsZeroMilestonesAndInvalidApplications() public {
        vm.startPrank(giver);
        vm.expectRevert(bytes("Milestone amount must be > 0"));
        adapter.postJob("invalid", _strings("one", "two"), _amounts(100_000, 0));

        adapter.postJob("valid", _strings("one", "two"), _amounts(100_000, 200_000));
        vm.stopPrank();

        string memory jobId = string.concat(vm.toString(block.chainid), "-1");

        vm.prank(giver);
        vm.expectRevert(bytes("Cannot apply to own job"));
        adapter.applyToJob(jobId, "self", _strings("one", "two"), _amounts(100_000, 200_000), 3);

        vm.prank(applicant);
        vm.expectRevert(bytes("Job does not exist"));
        adapter.applyToJob("missing", "missing", _strings("one", "two"), _amounts(100_000, 200_000), 3);
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
}
