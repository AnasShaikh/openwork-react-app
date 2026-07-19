// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {NativeOpenworkGenesis} from "../src/suites/current-mainnet/native/native-openwork-genesis.sol";
import {
    LocalOpenWorkJobContractLite as LocalLOWJCV2
} from "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v2.sol";
import {
    LocalOpenWorkJobContractLite as LocalLOWJCV3
} from "../src/suites/current-mainnet/local/local-openwork-job-contract-lite-v3.sol";
import {
    NativeOpenWorkJobContract as NOWJCV4
} from "../src/suites/current-mainnet/native/native-openwork-job-contract-v4.sol";
import {
    NativeOpenWorkJobContract as NOWJCV5
} from "../src/suites/current-mainnet/native/native-openwork-job-contract-v5.sol";

interface ILocalMilestoneReceiver {
    function handleStartJobMilestones(
        address jobGiver,
        string calldata jobId,
        uint256 applicationId,
        uint256[] calldata canonicalAmounts
    ) external;
}

contract MilestoneSyncMockBridge {
    string public lastFunctionName;
    bytes public lastPayload;
    uint256 public sendCount;

    function sendToNativeChain(string calldata functionName, bytes calldata payload, bytes calldata) external payable {
        lastFunctionName = functionName;
        lastPayload = payload;
        sendCount++;
    }

    function reset() external {
        delete lastFunctionName;
        delete lastPayload;
        sendCount = 0;
    }

    function deliverStartJobMilestones(
        address receiver,
        address jobGiver,
        string calldata jobId,
        uint256 applicationId,
        uint256[] calldata canonicalAmounts
    ) external {
        ILocalMilestoneReceiver(receiver).handleStartJobMilestones(jobGiver, jobId, applicationId, canonicalAmounts);
    }
}

contract MilestoneSyncMockCCTPSender {
    IERC20 public immutable token;
    uint256 public sendCount;
    uint256 public lastAmount;

    constructor(IERC20 _token) {
        token = _token;
    }

    function sendFast(uint256 amount, uint32, bytes32, uint256) external {
        token.transferFrom(msg.sender, address(this), amount);
        sendCount++;
        lastAmount = amount;
    }
}

contract CurrentMainnetLocalApplicantMilestoneSyncUpgradeTest is Test {
    ERC20Mock internal usdc;
    MilestoneSyncMockBridge internal bridge;
    MilestoneSyncMockCCTPSender internal cctp;
    LocalLOWJCV2 internal localV2;
    LocalLOWJCV3 internal localV3;

    address internal giver = makeAddr("giver");

    function setUp() public {
        usdc = new ERC20Mock();
        bridge = new MilestoneSyncMockBridge();
        cctp = new MilestoneSyncMockCCTPSender(IERC20(address(usdc)));

        LocalLOWJCV2 implementationV2 = new LocalLOWJCV2();
        localV2 = LocalLOWJCV2(
            address(
                new ERC1967Proxy(
                    address(implementationV2),
                    abi.encodeCall(
                        LocalLOWJCV2.initialize, (address(this), address(usdc), 50, address(bridge), address(cctp))
                    )
                )
            )
        );

        vm.prank(giver);
        localV2.postJob("job-details", _strings("giver-one", "giver-two"), _amounts(100_000, 200_000), "");

        LocalLOWJCV3 implementationV3 = new LocalLOWJCV3();
        localV2.upgradeToAndCall(address(implementationV3), "");
        localV3 = LocalLOWJCV3(address(localV2));

        usdc.mint(giver, 1_000_000);
        vm.prank(giver);
        usdc.approve(address(localV3), type(uint256).max);
        bridge.reset();
    }

    function testUpgradePreservesJobAndApplicantStartWaitsForCanonicalCallback() public {
        LocalLOWJCV3.Job memory beforeStart = localV3.getJob("50-1");
        assertEq(beforeStart.jobGiver, giver);
        assertEq(beforeStart.milestoneAmounts[0], 100_000);
        assertEq(localV3.jobCounter(), 1);

        vm.prank(giver);
        localV3.startJob("50-1", 1, true, "");

        LocalLOWJCV3.Job memory pending = localV3.getJob("50-1");
        assertEq(uint256(pending.status), uint256(LocalLOWJCV3.JobStatus.Open));
        assertEq(pending.currentLockedAmount, 0);
        assertEq(localV3.pendingStartApplicationId("50-1"), 1);
        assertEq(cctp.sendCount(), 0);
        assertEq(keccak256(bytes(bridge.lastFunctionName())), keccak256(bytes("startJobWithMilestoneSync")));

        uint256[] memory canonicalAmounts = _amounts(150_000, 250_000);
        bridge.deliverStartJobMilestones(address(localV3), giver, "50-1", 1, canonicalAmounts);

        LocalLOWJCV3.Job memory started = localV3.getJob("50-1");
        assertEq(uint256(started.status), uint256(LocalLOWJCV3.JobStatus.InProgress));
        assertEq(started.currentMilestone, 1);
        assertEq(started.currentLockedAmount, 150_000);
        assertEq(started.totalEscrowed, 150_000);
        assertEq(started.milestoneAmounts.length, 2);
        assertEq(started.milestoneAmounts[0], 150_000);
        assertEq(started.milestoneAmounts[1], 250_000);
        assertEq(localV3.pendingStartApplicationId("50-1"), 0);
        assertEq(cctp.sendCount(), 1);
        assertEq(cctp.lastAmount(), 150_000);
        assertEq(usdc.balanceOf(giver), 850_000);
    }

    function testCallbackIsBridgeOnlyAndMustMatchPendingApplication() public {
        vm.prank(giver);
        localV3.startJob("50-1", 1, true, "");

        uint256[] memory canonicalAmounts = _amounts(150_000, 250_000);
        vm.expectRevert(bytes("Only bridge"));
        localV3.handleStartJobMilestones(giver, "50-1", 1, canonicalAmounts);

        vm.expectRevert(bytes("No matching start"));
        bridge.deliverStartJobMilestones(address(localV3), giver, "50-1", 2, canonicalAmounts);
    }

    function testFundingFailureKeepsPendingStateForLayerZeroRetry() public {
        vm.prank(giver);
        localV3.startJob("50-1", 1, true, "");

        vm.prank(giver);
        usdc.approve(address(localV3), 0);

        vm.expectRevert();
        bridge.deliverStartJobMilestones(address(localV3), giver, "50-1", 1, _amounts(150_000, 250_000));

        LocalLOWJCV3.Job memory job = localV3.getJob("50-1");
        assertEq(uint256(job.status), uint256(LocalLOWJCV3.JobStatus.Open));
        assertEq(job.milestoneAmounts[0], 100_000);
        assertEq(job.currentLockedAmount, 0);
        assertEq(localV3.pendingStartApplicationId("50-1"), 1);
    }

    function testEmployerMilestonesRetainImmediateEscrowPath() public {
        vm.prank(giver);
        localV3.startJob("50-1", 1, false, "");

        LocalLOWJCV3.Job memory job = localV3.getJob("50-1");
        assertEq(uint256(job.status), uint256(LocalLOWJCV3.JobStatus.InProgress));
        assertEq(job.currentLockedAmount, 100_000);
        assertEq(job.milestoneAmounts[0], 100_000);
        assertEq(localV3.pendingStartApplicationId("50-1"), 0);
        assertEq(cctp.lastAmount(), 100_000);
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

contract CurrentMainnetNOWJCApplicantMilestoneSyncUpgradeTest is Test {
    ERC20Mock internal usdc;
    NativeOpenworkGenesis internal genesis;
    NOWJCV4 internal nowjcV4;
    NOWJCV5 internal nowjcV5;

    address internal giver = makeAddr("native-giver");
    address internal applicant = makeAddr("native-applicant");

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

        NOWJCV4 implementationV4 = new NOWJCV4();
        nowjcV4 = NOWJCV4(
            address(
                new ERC1967Proxy(
                    address(implementationV4),
                    abi.encodeCall(
                        NOWJCV4.initialize,
                        (address(this), address(this), address(genesis), address(0), address(usdc), address(this))
                    )
                )
            )
        );
        genesis.authorizeContract(address(nowjcV4), true);
        nowjcV4.setAdmin(address(this), true);
        nowjcV4.addAuthorizedContract(address(this));

        nowjcV4.postJob("50-1", giver, "job-details", _strings("giver-one", "giver-two"), _amounts(100_000, 200_000));
        nowjcV4.applyToJob(
            applicant,
            "50-1",
            "application-details",
            _strings("applicant-one", "applicant-two"),
            _amounts(150_000, 250_000),
            3
        );

        NOWJCV5 implementationV5 = new NOWJCV5();
        nowjcV4.upgradeToAndCall(address(implementationV5), "");
        nowjcV5 = NOWJCV5(address(nowjcV4));
    }

    function testUpgradePreservesDependenciesAndReturnsCanonicalApplicantSchedule() public {
        assertEq(address(nowjcV5.genesis()), address(genesis));
        assertEq(address(nowjcV5.usdcToken()), address(usdc));
        assertTrue(nowjcV5.isAuthorizedContract(address(this)));

        (address selectedApplicant, uint256[] memory canonicalAmounts) = nowjcV5.startJob(giver, "50-1", 1, true);
        assertEq(selectedApplicant, applicant);
        assertEq(canonicalAmounts.length, 2);
        assertEq(canonicalAmounts[0], 150_000);
        assertEq(canonicalAmounts[1], 250_000);

        NativeOpenworkGenesis.Job memory job = genesis.getJob("50-1");
        assertEq(job.selectedApplicant, applicant);
        assertEq(job.selectedApplicationId, 1);
        assertEq(uint256(job.status), uint256(NativeOpenworkGenesis.JobStatus.InProgress));
        assertEq(job.currentMilestone, 1);
        assertEq(job.finalMilestones.length, 2);
        assertEq(job.finalMilestones[0].amount, 150_000);
        assertEq(job.finalMilestones[1].amount, 250_000);
    }

    function testRejectsUnknownApplicationBeforeCanonicalMutation() public {
        vm.expectRevert(bytes("Invalid application"));
        nowjcV5.startJob(giver, "50-1", 2, true);

        NativeOpenworkGenesis.Job memory job = genesis.getJob("50-1");
        assertEq(uint256(job.status), uint256(NativeOpenworkGenesis.JobStatus.Open));
        assertEq(job.selectedApplicant, address(0));
        assertEq(job.finalMilestones.length, 0);
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
