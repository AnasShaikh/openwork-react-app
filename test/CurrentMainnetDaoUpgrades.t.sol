// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ETHOpenworkDAO} from "../src/suites/current-mainnet/eth/eth-openwork-dao-v3.sol";
import {ETHDAOMessaging} from "../src/suites/current-mainnet/eth/eth-dao-messaging-v1.sol";
import {NativeOpenworkDAO} from "../src/suites/current-mainnet/native/native-openwork-dao-v2.sol";
import {NativeDAOStakeSync} from "../src/suites/current-mainnet/native/native-dao-stake-sync-v1.sol";
import {
    OpenworkVotingPowerCheckpoints
} from "../src/suites/current-mainnet/utilities/openwork-voting-power-checkpoints-v1.sol";

contract UpgradeTestToken {
    bool public transferFromResult = true;
    bool public transferResult = true;

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

contract UpgradeTestBridge {
    uint256 public fee;
    uint256 public sendCount;
    bool public failSend;
    bytes public lastPayload;

    function setFee(uint256 newFee) external {
        fee = newFee;
    }

    function setFailSend(bool status) external {
        failSend = status;
    }

    function resetSendCount() external {
        sendCount = 0;
    }

    function quoteNativeChain(bytes calldata, bytes calldata) external view returns (uint256) {
        return fee;
    }

    function sendToNativeChain(string memory, bytes memory payload, bytes calldata) external payable {
        require(!failSend, "bridge send failed");
        require(msg.value == fee, "wrong fee");
        sendCount++;
        lastPayload = payload;
    }
}

contract UpgradeTestGenesis {
    struct Stake {
        uint256 amount;
        uint256 unlockTime;
        uint256 durationMinutes;
        bool isActive;
    }

    struct Earner {
        address earnerAddress;
        uint256 balance;
        uint256 totalGovernanceActions;
    }

    mapping(address => Stake) internal stakes;
    mapping(address => Earner) internal earners;
    mapping(address => address) internal delegateOf;
    mapping(address => uint256) internal delegatedPower;
    address[] internal stakers;
    uint256[] internal proposals;
    mapping(address => bool) internal stakerSeen;

    function setStake(address staker, uint256 amount, uint256 unlockTime, uint256 durationMinutes, bool isActive)
        external
    {
        stakes[staker] = Stake(amount, unlockTime, durationMinutes, isActive);
        if (isActive && !stakerSeen[staker]) {
            stakerSeen[staker] = true;
            stakers.push(staker);
        }
    }

    function setEarner(address earnerAddress, uint256 balance, uint256 governanceActions) external {
        earners[earnerAddress] = Earner(earnerAddress, balance, governanceActions);
    }

    function setDelegate(address delegator, address delegatee) external {
        delegateOf[delegator] = delegatee;
    }

    function setDelegatedVotingPower(address delegatee, uint256 power) external {
        delegatedPower[delegatee] = power;
    }

    function updateDelegatedVotingPower(address delegatee, uint256 powerChange, bool increase) external {
        if (increase) delegatedPower[delegatee] += powerChange;
        else delegatedPower[delegatee] -= powerChange;
    }

    function addProposalId(uint256 proposalId) external {
        proposals.push(proposalId);
    }

    function removeStaker(address staker) external {
        stakes[staker].isActive = false;
    }

    function getStake(address staker) external view returns (Stake memory) {
        return stakes[staker];
    }

    function getStakerInfo(address staker) external view returns (uint256, uint256, uint256, bool) {
        Stake memory item = stakes[staker];
        return (item.amount, item.unlockTime, item.durationMinutes, item.isActive);
    }

    function getEarner(address earnerAddress) external view returns (Earner memory) {
        return earners[earnerAddress];
    }

    function getEarnerInfo(address earnerAddress) external view returns (address, uint256, uint256) {
        Earner memory item = earners[earnerAddress];
        return (item.earnerAddress, item.balance, item.totalGovernanceActions);
    }

    function getDelegate(address delegator) external view returns (address) {
        return delegateOf[delegator];
    }

    function getDelegatedVotingPower(address delegatee) external view returns (uint256) {
        return delegatedPower[delegatee];
    }

    function getAllStakers() external view returns (address[] memory) {
        return stakers;
    }

    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposals;
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getIsStaker(address staker) external view returns (bool) {
        return stakes[staker].isActive;
    }

    function getActiveStakersCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < stakers.length; i++) {
            if (stakes[stakers[i]].isActive) count++;
        }
    }
}

contract UpgradeTestRewards {
    mapping(address => uint256) public power;

    function setPower(address account, uint256 amount) external {
        power[account] = amount;
    }

    function getRewardBasedVotingPower(address account) external view returns (uint256) {
        return power[account];
    }
}

contract UpgradeTestActivityTracker {
    mapping(address => uint256) public updates;

    function updateMemberActivity(address account) external {
        updates[account]++;
    }
}

contract UpgradeTestNOWJ {
    mapping(address => uint256) public actions;

    function getUserEarnedTokens(address) external pure returns (uint256) {
        return 0;
    }

    function getUserRewardInfo(address) external pure returns (uint256, uint256) {
        return (0, 0);
    }

    function incrementGovernanceAction(address user) external {
        actions[user]++;
    }

    function teamTokensAllocated(address) external pure returns (uint256) {
        return 0;
    }
}

contract CurrentMainnetEthDaoV3Test is Test {
    ETHOpenworkDAO internal dao;
    ETHDAOMessaging internal messaging;
    OpenworkVotingPowerCheckpoints internal checkpoints;
    UpgradeTestToken internal token;
    UpgradeTestBridge internal bridge;

    address internal staker = makeAddr("eth-staker");
    address internal delegatee = makeAddr("eth-delegatee");
    address internal proposer = makeAddr("eth-proposer");
    address internal smallVoter = makeAddr("eth-small-voter");

    function setUp() public {
        token = new UpgradeTestToken();
        bridge = new UpgradeTestBridge();

        ETHOpenworkDAO daoImplementation = new ETHOpenworkDAO();
        ERC1967Proxy daoProxy = new ERC1967Proxy(
            address(daoImplementation),
            abi.encodeCall(ETHOpenworkDAO.initialize, (address(this), address(token), 1, address(bridge)))
        );
        dao = ETHOpenworkDAO(payable(address(daoProxy)));

        OpenworkVotingPowerCheckpoints checkpointImplementation = new OpenworkVotingPowerCheckpoints();
        checkpoints = OpenworkVotingPowerCheckpoints(
            address(
                new ERC1967Proxy(
                    address(checkpointImplementation),
                    abi.encodeCall(OpenworkVotingPowerCheckpoints.initialize, (address(dao), address(dao)))
                )
            )
        );

        ETHDAOMessaging messagingImplementation = new ETHDAOMessaging();
        messaging = ETHDAOMessaging(
            address(
                new ERC1967Proxy(
                    address(messagingImplementation),
                    abi.encodeCall(ETHDAOMessaging.initialize, (address(dao), address(dao), address(bridge)))
                )
            )
        );

        dao.initializeV3(address(checkpoints), address(messaging));
    }

    function _stake(address account, uint256 amount, uint256 durationYears) internal {
        vm.prank(account);
        dao.stake(amount, durationYears, bytes(""));
    }

    function _createProposal() internal returns (uint256 proposalId) {
        _stake(proposer, 100 ether, 1);
        vm.warp(block.timestamp + 1);

        address[] memory targets = new address[](1);
        targets[0] = address(this);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = bytes("");

        vm.prank(proposer);
        proposalId = dao.propose(targets, values, calldatas, "DAO V3 regression proposal");
    }

    function testDelegationCountsStakeOnceAndRejectsSelfDelegation() public {
        _stake(staker, 100 ether, 2);

        vm.prank(staker);
        vm.expectRevert(bytes("SELF"));
        dao.delegate(staker);

        vm.warp(block.timestamp + 1);
        vm.prank(staker);
        dao.delegate(delegatee);

        (uint256 own,,, uint256 stakerTotal) = dao.getVotingPower(staker);
        (, uint256 delegated,, uint256 delegateeTotal) = dao.getVotingPower(delegatee);
        assertEq(own, 0);
        assertEq(stakerTotal, 0);
        assertEq(delegated, 200 ether);
        assertEq(delegateeTotal, 200 ether);
        assertEq(checkpoints.latestVotes(staker), 0);
        assertEq(checkpoints.latestVotes(delegatee), 200 ether);
    }

    function testHistoricalVotingPowerDoesNotMoveAfterSnapshot() public {
        _stake(staker, 100 ether, 1);
        vm.warp(block.timestamp + 1);
        vm.prank(staker);
        dao.delegate(delegatee);

        assertEq(checkpoints.getVotes(staker, block.timestamp - 1), 100 ether);
        assertEq(checkpoints.getVotes(delegatee, block.timestamp - 1), 0);
        assertEq(checkpoints.latestVotes(staker), 0);
        assertEq(checkpoints.latestVotes(delegatee), 100 ether);
    }

    function testFullUnstakeRemovesDelegatedPower() public {
        _stake(staker, 100 ether, 1);
        vm.prank(staker);
        dao.delegate(delegatee);

        vm.warp(block.timestamp + 365 days);
        vm.prank(staker);
        dao.unstake(bytes(""));

        vm.warp(block.timestamp + 24 hours);
        vm.prank(staker);
        dao.unstake(bytes(""));

        assertEq(dao.delegates(staker), address(0));
        assertEq(dao.delegatedVotingPower(delegatee), 0);
        assertEq(checkpoints.latestVotes(delegatee), 0);
    }

    function testBelowThresholdVoteReverts() public {
        vm.prank(address(bridge));
        dao.handleSyncVotingPower(smallVoter, 49 ether, 30110);
        uint256 proposalId = _createProposal();

        vm.warp(block.timestamp + 61);
        vm.prank(smallVoter);
        vm.expectRevert(bytes("VOTE"));
        dao.castVote(proposalId, 1);
        assertFalse(dao.hasVoted(proposalId, smallVoter));
    }

    function testStandardAndPayableEntryPointsRecordAndSendExactlyOnce() public {
        uint256 proposalId = _createProposal();
        bytes32 actionId = messaging.proposalNotificationId(proposalId, proposer);
        (address account, uint8 actionType, bool sent) = messaging.notifications(actionId);
        assertEq(account, proposer);
        assertEq(actionType, 1);
        assertFalse(sent);

        bridge.setFee(1 wei);
        messaging.sendProposalNotification{value: 1 wei}(proposalId, proposer, bytes(""), address(this));
        assertEq(bridge.sendCount(), 2); // proposer stake plus this notification

        vm.expectRevert(ETHDAOMessaging.NotificationAlreadySent.selector);
        messaging.sendProposalNotification{value: 1 wei}(proposalId, proposer, bytes(""), address(this));
    }

    function testStakeRevertsInsteadOfSilentlyLosingSync() public {
        bridge.setFailSend(true);
        vm.prank(staker);
        vm.expectRevert(bytes("bridge send failed"));
        dao.stake(100 ether, 1, bytes(""));

        (uint256 amount,,) = dao.stakes(staker);
        assertEq(amount, 0);
        assertEq(messaging.stakeSyncVersion(staker), 0);
    }
}

contract CurrentMainnetNativeDaoV2Test is Test {
    NativeOpenworkDAO internal dao;
    NativeDAOStakeSync internal stakeSync;
    OpenworkVotingPowerCheckpoints internal checkpoints;
    UpgradeTestGenesis internal genesis;
    UpgradeTestRewards internal rewards;
    UpgradeTestActivityTracker internal tracker;
    UpgradeTestNOWJ internal nowj;

    address internal bridge = makeAddr("native-bridge");
    address internal staker = makeAddr("native-staker");
    address internal delegatee = makeAddr("native-delegatee");
    address internal proposer = makeAddr("native-proposer");

    function setUp() public {
        genesis = new UpgradeTestGenesis();
        rewards = new UpgradeTestRewards();
        tracker = new UpgradeTestActivityTracker();
        nowj = new UpgradeTestNOWJ();

        NativeOpenworkDAO daoImplementation = new NativeOpenworkDAO();
        ERC1967Proxy daoProxy = new ERC1967Proxy(
            address(daoImplementation),
            abi.encodeCall(NativeOpenworkDAO.initialize, (address(this), bridge, address(genesis)))
        );
        dao = NativeOpenworkDAO(payable(address(daoProxy)));

        OpenworkVotingPowerCheckpoints checkpointImplementation = new OpenworkVotingPowerCheckpoints();
        checkpoints = OpenworkVotingPowerCheckpoints(
            address(
                new ERC1967Proxy(
                    address(checkpointImplementation),
                    abi.encodeCall(OpenworkVotingPowerCheckpoints.initialize, (address(dao), address(dao)))
                )
            )
        );
        dao.initializeV2(address(checkpoints));
        dao.setRewardsContract(address(rewards));
        dao.setActivityTracker(address(tracker));
        dao.setNOWJContract(address(nowj));

        NativeDAOStakeSync stakeSyncImplementation = new NativeDAOStakeSync();
        stakeSync = NativeDAOStakeSync(
            address(
                new ERC1967Proxy(
                    address(stakeSyncImplementation),
                    abi.encodeCall(
                        NativeDAOStakeSync.initialize, (address(dao), bridge, address(dao), address(genesis))
                    )
                )
            )
        );
    }

    function _syncStake(address account, uint256 amount, uint256 duration, bool active, uint64 version) internal {
        vm.prank(bridge);
        stakeSync.applyStakeData(account, amount, block.timestamp + 365 days, duration, active, version);
    }

    function _createProposal() internal returns (uint256 proposalId) {
        _syncStake(proposer, 100 ether, 1, true, 1);
        vm.warp(block.timestamp + 1);

        address[] memory targets = new address[](1);
        targets[0] = address(this);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = bytes("");

        vm.prank(proposer);
        proposalId = dao.propose(targets, values, calldatas, "Native DAO V2 regression proposal");
    }

    function testDelegatedOnlyAccountCanVote() public {
        _syncStake(staker, 100 ether, 1, true, 1);
        vm.prank(staker);
        dao.delegate(delegatee);
        assertTrue(dao.canVote(delegatee));
        assertFalse(dao.canVote(staker));

        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + 61);

        vm.prank(delegatee);
        uint256 weight = dao.castVote(proposalId, 1);
        assertEq(weight, 100 ether);
        assertTrue(dao.hasVoted(proposalId, delegatee));
    }

    function testNativeSnapshotAndSingleCountDelegation() public {
        _syncStake(staker, 100 ether, 2, true, 1);
        vm.warp(block.timestamp + 1);
        vm.prank(staker);
        dao.delegate(delegatee);

        assertEq(checkpoints.getVotes(staker, block.timestamp - 1), 200 ether);
        assertEq(checkpoints.getVotes(delegatee, block.timestamp - 1), 0);
        assertEq(checkpoints.latestVotes(staker), 0);
        assertEq(checkpoints.latestVotes(delegatee), 200 ether);

        (uint256 own,,, uint256 total) = dao.getVotingPower(staker);
        assertEq(own, 0);
        assertEq(total, 0);
    }

    function testVersionedWithdrawalClearsDelegatedPowerAndRejectsReplay() public {
        _syncStake(staker, 100 ether, 1, true, 1);
        vm.prank(staker);
        dao.delegate(delegatee);

        _syncStake(staker, 0, 0, false, 2);
        assertEq(genesis.getDelegate(staker), address(0));
        assertEq(genesis.getDelegatedVotingPower(delegatee), 0);
        assertEq(checkpoints.latestVotes(delegatee), 0);

        vm.prank(bridge);
        vm.expectRevert(NativeDAOStakeSync.StaleStakeSync.selector);
        stakeSync.applyStakeData(staker, 100 ether, block.timestamp + 365 days, 1, true, 1);
    }

    function testNativeSelfDelegationReverts() public {
        _syncStake(staker, 100 ether, 1, true, 1);
        vm.prank(staker);
        vm.expectRevert(bytes("SELF"));
        dao.delegate(staker);
    }
}
