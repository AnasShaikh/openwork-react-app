// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title OpenworkVotingPowerCheckpoints
/// @notice Timestamp-based historical voting power for one Openwork DAO proxy.
/// @dev Kept separate because the deployed DAO implementations are close to EIP-170.
contract OpenworkVotingPowerCheckpoints is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using Checkpoints for Checkpoints.Trace208;
    using SafeCast for uint256;

    address public dao;
    mapping(address => Checkpoints.Trace208) private _stakeCheckpoints;
    mapping(address => Checkpoints.Trace208) private _rewardCheckpoints;

    event DAOUpdated(address indexed oldDAO, address indexed newDAO);
    event VotingPowerCheckpointed(
        address indexed account, uint48 indexed timepoint, uint256 stakePower, uint256 rewardPower
    );

    error OnlyDAO();
    error InvalidDAO();

    modifier onlyDAO() {
        if (msg.sender != dao) revert OnlyDAO();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_, address dao_) external initializer {
        if (dao_ == address(0)) revert InvalidDAO();
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        dao = dao_;
        emit DAOUpdated(address(0), dao_);
    }

    function setDAO(address newDAO) external onlyOwner {
        if (newDAO == address(0)) revert InvalidDAO();
        address oldDAO = dao;
        dao = newDAO;
        emit DAOUpdated(oldDAO, newDAO);
    }

    function checkpoint(address account, uint256 stakePower, uint256 rewardPower) external onlyDAO {
        uint48 timepoint = uint48(block.timestamp);
        _stakeCheckpoints[account].push(timepoint, stakePower.toUint208());
        _rewardCheckpoints[account].push(timepoint, rewardPower.toUint208());
        emit VotingPowerCheckpointed(account, timepoint, stakePower, rewardPower);
    }

    function getVotes(address account, uint256 timepoint) external view returns (uint256) {
        uint48 key = timepoint.toUint48();
        return _stakeCheckpoints[account].upperLookupRecent(key) + _rewardCheckpoints[account].upperLookupRecent(key);
    }

    function getVotingComponents(address account, uint256 timepoint)
        external
        view
        returns (uint256 stakePower, uint256 rewardPower)
    {
        uint48 key = timepoint.toUint48();
        return (_stakeCheckpoints[account].upperLookupRecent(key), _rewardCheckpoints[account].upperLookupRecent(key));
    }

    function latestVotes(address account) external view returns (uint256) {
        return _stakeCheckpoints[account].latest() + _rewardCheckpoints[account].latest();
    }

    function latestVotingComponents(address account) external view returns (uint256 stakePower, uint256 rewardPower) {
        return (_stakeCheckpoints[account].latest(), _rewardCheckpoints[account].latest());
    }

    function numCheckpoints(address account) external view returns (uint256) {
        return _stakeCheckpoints[account].length();
    }

    function checkpointAt(address account, uint32 index)
        external
        view
        returns (uint48 timepoint, uint208 stakePower, uint208 rewardPower)
    {
        Checkpoints.Checkpoint208 memory stakeItem = _stakeCheckpoints[account].at(index);
        Checkpoints.Checkpoint208 memory rewardItem = _rewardCheckpoints[account].at(index);
        return (stakeItem._key, stakeItem._value, rewardItem._value);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
