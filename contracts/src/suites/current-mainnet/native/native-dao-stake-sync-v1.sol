// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface INativeDAOStakeGenesis {
    struct Stake {
        uint256 amount;
        uint256 unlockTime;
        uint256 durationMinutes;
        bool isActive;
    }

    function getStake(address staker) external view returns (Stake memory);
    function getDelegate(address delegator) external view returns (address);
    function setStake(address staker, uint256 amount, uint256 unlockTime, uint256 durationMinutes, bool isActive)
        external;
    function setDelegate(address delegator, address delegatee) external;
    function updateDelegatedVotingPower(address delegatee, uint256 powerChange, bool increase) external;
}

interface INativeDAOVotingPowerSync {
    function syncVotingPower(address account) external;
}

/// @title NativeDAOStakeSync
/// @notice Versioned, ordered Ethereum-to-native stake application and delegation reconciliation.
contract NativeDAOStakeSync is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    address public bridge;
    INativeDAOVotingPowerSync public dao;
    INativeDAOStakeGenesis public genesis;
    mapping(address => uint64) public lastAppliedVersion;

    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event DAOUpdated(address indexed oldDAO, address indexed newDAO);
    event GenesisUpdated(address indexed oldGenesis, address indexed newGenesis);
    event StakeDataApplied(address indexed staker, uint64 indexed version, uint256 amount, bool isActive);

    error OnlyBridge();
    error InvalidAddress();
    error StaleStakeSync();

    modifier onlyBridge() {
        if (msg.sender != bridge) revert OnlyBridge();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_, address bridge_, address dao_, address genesis_) external initializer {
        if (bridge_ == address(0) || dao_ == address(0) || genesis_ == address(0)) revert InvalidAddress();
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        bridge = bridge_;
        dao = INativeDAOVotingPowerSync(dao_);
        genesis = INativeDAOStakeGenesis(genesis_);
        emit BridgeUpdated(address(0), bridge_);
        emit DAOUpdated(address(0), dao_);
        emit GenesisUpdated(address(0), genesis_);
    }

    function setBridge(address newBridge) external onlyOwner {
        if (newBridge == address(0)) revert InvalidAddress();
        address oldBridge = bridge;
        bridge = newBridge;
        emit BridgeUpdated(oldBridge, newBridge);
    }

    function applyStakeData(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationMinutes,
        bool isActive,
        uint64 version
    ) external onlyBridge {
        if (version <= lastAppliedVersion[staker]) revert StaleStakeSync();
        lastAppliedVersion[staker] = version;

        INativeDAOStakeGenesis.Stake memory oldStake = genesis.getStake(staker);
        address currentDelegate = genesis.getDelegate(staker);

        if (currentDelegate != address(0)) {
            uint256 oldPower = oldStake.isActive ? oldStake.amount * oldStake.durationMinutes : 0;
            uint256 newPower = isActive ? amount * durationMinutes : 0;
            if (oldPower > 0) genesis.updateDelegatedVotingPower(currentDelegate, oldPower, false);
            if (newPower > 0) genesis.updateDelegatedVotingPower(currentDelegate, newPower, true);
            if (!isActive) genesis.setDelegate(staker, address(0));
        }

        genesis.setStake(staker, amount, unlockTime, durationMinutes, isActive);
        dao.syncVotingPower(staker);
        if (currentDelegate != address(0)) dao.syncVotingPower(currentDelegate);

        emit StakeDataApplied(staker, version, amount, isActive);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
