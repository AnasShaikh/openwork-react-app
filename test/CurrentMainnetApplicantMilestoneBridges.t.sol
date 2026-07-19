// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {TestHelperOz5} from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import {Origin} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import {LocalLZOpenworkBridgeV2} from "../src/suites/current-mainnet/local/local-lz-openwork-bridge-v2.sol";
import {NativeLZOpenworkBridgeV3} from "../src/suites/current-mainnet/native/native-lz-openwork-bridge-v3.sol";

interface IBridgeTestLocalMilestoneReceiver {
    function handleStartJobMilestones(
        address jobGiver,
        string calldata jobId,
        uint256 applicationId,
        uint256[] calldata canonicalAmounts
    ) external;
}

contract BridgeTestMockNOWJC {
    uint256 public startCount;

    function startJob(address, string memory, uint256, bool)
        external
        returns (address selectedApplicant, uint256[] memory canonicalAmounts)
    {
        startCount++;
        canonicalAmounts = new uint256[](2);
        canonicalAmounts[0] = 150_000;
        canonicalAmounts[1] = 250_000;
        return (address(0xA11CE), canonicalAmounts);
    }
}

contract BridgeTestMockLocalReceiver is IBridgeTestLocalMilestoneReceiver {
    address public jobGiver;
    string public jobId;
    uint256 public applicationId;
    uint256[] public amounts;

    function handleStartJobMilestones(
        address _jobGiver,
        string calldata _jobId,
        uint256 _applicationId,
        uint256[] calldata _canonicalAmounts
    ) external {
        jobGiver = _jobGiver;
        jobId = _jobId;
        applicationId = _applicationId;
        amounts = _canonicalAmounts;
    }
}

contract CurrentMainnetApplicantMilestoneBridgeTest is TestHelperOz5 {
    using OptionsBuilder for bytes;

    uint32 internal constant LOCAL_EID = 1;
    uint32 internal constant NATIVE_EID = 2;

    LocalLZOpenworkBridgeV2 internal localBridge;
    NativeLZOpenworkBridgeV3 internal nativeBridge;
    BridgeTestMockNOWJC internal nowjc;
    BridgeTestMockLocalReceiver internal localReceiver;
    bytes internal options;

    function setUp() public override {
        super.setUp();
        setUpEndpoints(2, LibraryType.UltraLightNode);
        vm.deal(address(this), 100 ether);

        localBridge =
            new LocalLZOpenworkBridgeV2(address(endpoints[LOCAL_EID]), address(this), NATIVE_EID, 3, LOCAL_EID);
        nativeBridge = new NativeLZOpenworkBridgeV3(address(endpoints[NATIVE_EID]), address(this), 3);
        nowjc = new BridgeTestMockNOWJC();
        localReceiver = new BridgeTestMockLocalReceiver();

        address[] memory oapps = new address[](2);
        oapps[0] = address(localBridge);
        oapps[1] = address(nativeBridge);
        this.wireOApps(oapps);

        options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(1_500_000, 0);
        localBridge.authorizeContract(address(this), true);
        localBridge.setLowjcContract(address(localReceiver));
        nativeBridge.addLocalChain(LOCAL_EID);
        nativeBridge.setLocalCallbackOptions(LOCAL_EID, options);
        nativeBridge.setNativeOpenWorkJobContract(address(nowjc));
    }

    function testLayerZeroRoundTripUsesReserveAndAuthenticatesCallback() public {
        bytes memory request = abi.encode("startJobWithMilestoneSync", address(this), "1-1", uint256(1));
        uint256 requestFee = localBridge.quoteNativeChain(request, options);

        bytes memory expectedCallback =
            abi.encode("startJobMilestones", address(this), "1-1", uint256(1), _amounts(150_000, 250_000));
        uint256 callbackFee = nativeBridge.quoteLocalCallback(LOCAL_EID, expectedCallback);
        vm.deal(address(nativeBridge), callbackFee);

        localBridge.sendToNativeChain{value: requestFee}("startJobWithMilestoneSync", request, options);
        verifyPackets(NATIVE_EID, addressToBytes32(address(nativeBridge)));

        assertEq(nowjc.startCount(), 1);
        assertEq(address(nativeBridge).balance, 0);

        verifyPackets(LOCAL_EID, addressToBytes32(address(localBridge)));
        assertEq(localReceiver.jobGiver(), address(this));
        assertEq(localReceiver.jobId(), "1-1");
        assertEq(localReceiver.applicationId(), 1);
        assertEq(localReceiver.amounts(0), 150_000);
        assertEq(localReceiver.amounts(1), 250_000);
    }

    function testEmptyCallbackReserveRollsBackNativeHandlerMutation() public {
        bytes memory request = abi.encode("startJobWithMilestoneSync", address(this), "1-1", uint256(1));
        uint256 requestFee = localBridge.quoteNativeChain(request, options);
        localBridge.sendToNativeChain{value: requestFee}("startJobWithMilestoneSync", request, options);

        assertEq(address(nativeBridge).balance, 0);
        bytes32 nativeBridgeAddress = addressToBytes32(address(nativeBridge));
        vm.expectRevert(bytes("Callback reserve too low"));
        this.verifyPackets(NATIVE_EID, nativeBridgeAddress);
        assertEq(nowjc.startCount(), 0);
        assertEq(localReceiver.applicationId(), 0);
    }

    function testLocalCallbackRejectsNonNativeSourceEvenWhenPeerMatches() public {
        uint32 unauthorizedEid = 99;
        bytes32 unauthorizedPeer = bytes32(uint256(uint160(address(0xBEEF))));
        localBridge.setPeer(unauthorizedEid, unauthorizedPeer);
        Origin memory origin = Origin(unauthorizedEid, unauthorizedPeer, 1);
        bytes memory callbackPayload =
            abi.encode("startJobMilestones", address(this), "1-1", uint256(1), _amounts(150_000, 250_000));

        vm.prank(address(endpoints[LOCAL_EID]));
        vm.expectRevert(bytes("Only native chain"));
        localBridge.lzReceive(origin, bytes32(uint256(1)), callbackPayload, address(this), "");
    }

    function _amounts(uint256 first, uint256 second) internal pure returns (uint256[] memory values) {
        values = new uint256[](2);
        values[0] = first;
        values[1] = second;
    }
}
