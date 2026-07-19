// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {NativeOpenworkGenesis} from "../src/suites/current-mainnet/native/native-openwork-genesis.sol";
import {
    NativeProfileGenesis as NativeProfileGenesisV1
} from "../src/suites/current-mainnet/native/native-profile-genesis.sol";
import {
    NativeProfileGenesis as NativeProfileGenesisV2
} from "../src/suites/current-mainnet/native/native-profile-genesis-v2.sol";
import {
    NativeProfileManager as NativeProfileManagerV2
} from "../src/suites/current-mainnet/native/native-profile-manager-v2.sol";
import {
    NativeProfileManager as NativeProfileManagerV3
} from "../src/suites/current-mainnet/native/native-profile-manager-v3.sol";

contract CurrentMainnetProfileRatingUpgradesTest is Test {
    NativeOpenworkGenesis internal jobGenesis;
    NativeProfileGenesisV1 internal profileGenesisV1;
    NativeProfileManagerV2 internal profileManagerV2;

    NativeProfileGenesisV2 internal profileGenesisV2;
    NativeProfileManagerV3 internal profileManagerV3;

    address internal giver = makeAddr("giver");
    address internal applicant = makeAddr("applicant");
    address internal attacker = makeAddr("attacker");
    address internal legacyUser = makeAddr("legacyUser");
    address internal authorizedAdapter = makeAddr("authorizedAdapter");

    function setUp() public {
        NativeOpenworkGenesis jobGenesisImplementation = new NativeOpenworkGenesis();
        jobGenesis = NativeOpenworkGenesis(
            address(
                new ERC1967Proxy(
                    address(jobGenesisImplementation), abi.encodeCall(NativeOpenworkGenesis.initialize, (address(this)))
                )
            )
        );

        NativeProfileGenesisV1 profileGenesisImplementationV1 = new NativeProfileGenesisV1();
        profileGenesisV1 = NativeProfileGenesisV1(
            address(
                new ERC1967Proxy(
                    address(profileGenesisImplementationV1),
                    abi.encodeCall(NativeProfileGenesisV1.initialize, (address(this)))
                )
            )
        );

        NativeProfileManagerV2 profileManagerImplementationV2 = new NativeProfileManagerV2();
        profileManagerV2 = NativeProfileManagerV2(
            address(
                new ERC1967Proxy(
                    address(profileManagerImplementationV2),
                    abi.encodeCall(
                        NativeProfileManagerV2.initialize, (address(this), address(this), address(profileGenesisV1))
                    )
                )
            )
        );

        profileGenesisV1.authorizeContract(address(profileManagerV2), true);
        profileManagerV2.addAuthorizedContract(authorizedAdapter, true);
        profileManagerV2.createProfile(giver, "giver-profile", address(0));
        profileManagerV2.createProfile(applicant, "applicant-profile", giver);

        // Seed old state to prove the upgrade does not disturb it.
        profileGenesisV1.setJobRating("legacy-job", legacyUser, 4);

        NativeProfileGenesisV2 profileGenesisImplementationV2 = new NativeProfileGenesisV2();
        profileGenesisV1.upgradeToAndCall(address(profileGenesisImplementationV2), "");
        profileGenesisV2 = NativeProfileGenesisV2(address(profileGenesisV1));

        NativeProfileManagerV3 profileManagerImplementationV3 = new NativeProfileManagerV3();
        profileManagerV2.upgradeToAndCall(
            address(profileManagerImplementationV3),
            abi.encodeCall(NativeProfileManagerV3.initializeV3, (address(jobGenesis)))
        );
        profileManagerV3 = NativeProfileManagerV3(address(profileManagerV2));

        _createJob("completed-job", NativeOpenworkGenesis.JobStatus.Completed);
        _createJob("open-job", NativeOpenworkGenesis.JobStatus.Open);
    }

    function testUpgradePreservesStateAndConfiguresCanonicalJobGenesis() public view {
        assertEq(address(profileManagerV3.genesis()), address(profileGenesisV2));
        assertEq(address(profileManagerV3.jobGenesis()), address(jobGenesis));
        assertEq(profileManagerV3.getProfileCount(), 2);
        assertTrue(profileManagerV3.authorizedContracts(authorizedAdapter));
        assertEq(profileGenesisV2.getJobRating("legacy-job", legacyUser), 4);
        assertEq(profileGenesisV2.getUserRatings(legacyUser).length, 1);
        assertTrue(profileGenesisV2.hasProfile(giver));
        assertTrue(profileGenesisV2.hasProfile(applicant));
    }

    function testBothJobPartiesCanRateOnceInOppositeDirections() public {
        profileManagerV3.rate(giver, "completed-job", applicant, 5);
        profileManagerV3.rate(applicant, "completed-job", giver, 4);

        assertEq(profileGenesisV2.getJobRating("completed-job", applicant), 5);
        assertEq(profileGenesisV2.getJobRating("completed-job", giver), 4);
        assertEq(profileGenesisV2.getUserRatings(applicant).length, 1);
        assertEq(profileGenesisV2.getUserRatings(giver).length, 1);
    }

    function testManagerRejectsDuplicateRating() public {
        profileManagerV3.rate(giver, "completed-job", applicant, 5);

        vm.expectRevert(bytes("Rating already submitted"));
        profileManagerV3.rate(giver, "completed-job", applicant, 1);
    }

    function testManagerRejectsUntrustedCaller() public {
        vm.prank(attacker);
        vm.expectRevert(bytes("Not authorized"));
        profileManagerV3.rate(giver, "completed-job", applicant, 5);
    }

    function testManagerRejectsNonParty() public {
        vm.expectRevert(bytes("Not a job party"));
        profileManagerV3.rate(attacker, "completed-job", applicant, 5);
    }

    function testManagerRejectsIncompleteAndUnknownJobs() public {
        vm.expectRevert(bytes("Job not completed"));
        profileManagerV3.rate(giver, "open-job", applicant, 5);

        vm.expectRevert(bytes("Job does not exist"));
        profileManagerV3.rate(giver, "missing-job", applicant, 5);
    }

    function testManagerRejectsSelfRatingAndInvalidRange() public {
        vm.expectRevert(bytes("Cannot rate self"));
        profileManagerV3.rate(giver, "completed-job", giver, 5);

        vm.expectRevert(bytes("Rating must be 1-5"));
        profileManagerV3.rate(giver, "completed-job", applicant, 6);
    }

    function testProfileGenesisDefenseInDepthRejectsOverwrite() public {
        profileGenesisV2.setJobRating("direct-job", applicant, 3);

        vm.expectRevert(bytes("Rating already submitted"));
        profileGenesisV2.setJobRating("direct-job", applicant, 5);
    }

    function _createJob(string memory jobId, NativeOpenworkGenesis.JobStatus status) internal {
        string[] memory descriptions = new string[](1);
        descriptions[0] = "milestone";
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1e6;

        jobGenesis.setJob(jobId, giver, "job-details", descriptions, amounts);
        jobGenesis.setJobSelectedApplicant(jobId, applicant, 1);
        if (status != NativeOpenworkGenesis.JobStatus.Open) {
            jobGenesis.updateJobStatus(jobId, status);
        }
    }
}
