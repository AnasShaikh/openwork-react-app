// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IETHDAOLayerZeroBridge {
    function sendToNativeChain(string memory functionName, bytes memory payload, bytes calldata options)
        external
        payable;

    function quoteNativeChain(bytes calldata payload, bytes calldata options) external view returns (uint256 fee);
}

/// @title ETHDAOMessaging
/// @notice Reliable, exactly-once outbound messaging for ETHOpenworkDAO.
/// @dev Split from the DAO implementation to stay below EIP-170.
contract ETHDAOMessaging is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct PendingNotification {
        address account;
        uint8 actionType; // 1 = proposal, 2 = vote
        bool sent;
    }

    address public dao;
    IETHDAOLayerZeroBridge public bridge;
    mapping(address => uint64) public stakeSyncVersion;
    mapping(bytes32 => PendingNotification) public notifications;

    event DAOUpdated(address indexed oldDAO, address indexed newDAO);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event StakeDataSent(address indexed staker, uint64 indexed version, bool isActive, uint256 fee);
    event GovernanceNotificationPending(bytes32 indexed actionId, address indexed account, uint8 actionType);
    event GovernanceNotificationSent(bytes32 indexed actionId, address indexed account, uint8 actionType, uint256 fee);

    error OnlyDAO();
    error InvalidAddress();
    error InvalidNotification();
    error NotificationAlreadySent();
    error InsufficientMessageFee();
    error RefundFailed();

    modifier onlyDAO() {
        if (msg.sender != dao) revert OnlyDAO();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_, address dao_, address bridge_) external initializer {
        if (dao_ == address(0) || bridge_ == address(0)) revert InvalidAddress();
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        dao = dao_;
        bridge = IETHDAOLayerZeroBridge(bridge_);
        emit DAOUpdated(address(0), dao_);
        emit BridgeUpdated(address(0), bridge_);
    }

    function setDAO(address newDAO) external onlyOwner {
        if (newDAO == address(0)) revert InvalidAddress();
        address oldDAO = dao;
        dao = newDAO;
        emit DAOUpdated(oldDAO, newDAO);
    }

    function setBridge(address newBridge) external onlyOwner {
        if (newBridge == address(0)) revert InvalidAddress();
        address oldBridge = address(bridge);
        bridge = IETHDAOLayerZeroBridge(newBridge);
        emit BridgeUpdated(oldBridge, newBridge);
    }

    function sendStakeUpdate(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationYears,
        bool isActive,
        bytes calldata options,
        address refundAddress
    ) external payable onlyDAO {
        uint64 version = ++stakeSyncVersion[staker];
        bytes memory payload =
            abi.encode("updateStakeDataV2", staker, amount, unlockTime, durationYears, isActive, version);
        uint256 fee = bridge.quoteNativeChain(payload, options);
        if (msg.value < fee) revert InsufficientMessageFee();

        bridge.sendToNativeChain{value: fee}("updateStakeDataV2", payload, options);
        _refund(refundAddress, msg.value - fee);
        emit StakeDataSent(staker, version, isActive, fee);
    }

    function recordProposal(uint256 proposalId, address proposer) external onlyDAO returns (bytes32 actionId) {
        actionId = proposalNotificationId(proposalId, proposer);
        _record(actionId, proposer, 1);
    }

    function recordVote(uint256 proposalId, address voter) external onlyDAO returns (bytes32 actionId) {
        actionId = voteNotificationId(proposalId, voter);
        _record(actionId, voter, 2);
    }

    function sendNotification(bytes32 actionId, bytes calldata options, address refundAddress) external payable {
        _sendNotification(actionId, options, refundAddress);
    }

    function sendVoteNotification(uint256 proposalId, address voter, bytes calldata options, address refundAddress)
        external
        payable
    {
        _sendNotification(voteNotificationId(proposalId, voter), options, refundAddress);
    }

    function sendProposalNotification(
        uint256 proposalId,
        address proposer,
        bytes calldata options,
        address refundAddress
    ) external payable {
        _sendNotification(proposalNotificationId(proposalId, proposer), options, refundAddress);
    }

    function _sendNotification(bytes32 actionId, bytes calldata options, address refundAddress) internal {
        PendingNotification storage pending = notifications[actionId];
        if (pending.account == address(0)) revert InvalidNotification();
        if (pending.sent) revert NotificationAlreadySent();

        bytes memory payload = abi.encode("incrementGovernanceAction", pending.account);
        uint256 fee = bridge.quoteNativeChain(payload, options);
        if (msg.value < fee) revert InsufficientMessageFee();

        pending.sent = true;
        bridge.sendToNativeChain{value: fee}("incrementGovernanceAction", payload, options);
        _refund(refundAddress, msg.value - fee);
        emit GovernanceNotificationSent(actionId, pending.account, pending.actionType, fee);
    }

    function quoteStakeUpdate(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationYears,
        bool isActive,
        bytes calldata options
    ) external view returns (uint256 fee) {
        bytes memory payload = abi.encode(
            "updateStakeDataV2", staker, amount, unlockTime, durationYears, isActive, stakeSyncVersion[staker] + 1
        );
        return bridge.quoteNativeChain(payload, options);
    }

    function quoteNotification(address account, bytes calldata options) external view returns (uint256 fee) {
        return bridge.quoteNativeChain(abi.encode("incrementGovernanceAction", account), options);
    }

    function voteNotificationId(uint256 proposalId, address account) public pure returns (bytes32) {
        return keccak256(abi.encode("vote", proposalId, account));
    }

    function proposalNotificationId(uint256 proposalId, address account) public pure returns (bytes32) {
        return keccak256(abi.encode("propose", proposalId, account));
    }

    function _record(bytes32 actionId, address account, uint8 actionType) internal {
        PendingNotification storage pending = notifications[actionId];
        if (pending.account != address(0)) revert InvalidNotification();
        pending.account = account;
        pending.actionType = actionType;
        emit GovernanceNotificationPending(actionId, account, actionType);
    }

    function _refund(address recipient, uint256 amount) internal {
        if (amount == 0) return;
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert RefundFailed();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
