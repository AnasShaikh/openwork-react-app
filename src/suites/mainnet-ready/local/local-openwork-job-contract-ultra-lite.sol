// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title LocalOpenWorkJobContract (Ultra Lite)
/// @notice Maximum gas optimization - uses calldata, minimal events, no reentrancy on pure forwards
/// @dev Only stores security-critical job state. Read-only functions query native chain.

interface ILayerZeroBridge {
    function sendToNativeChain(
        string calldata _functionName,
        bytes calldata _payload,
        bytes calldata _options
    ) external payable;
}

contract LocalOpenWorkJobContractUltraLite is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    enum JobStatus { Open, InProgress, Completed, Cancelled }

    /// @notice Minimal job struct - only security-critical fields
    struct Job {
        address jobGiver;
        JobStatus status;
        uint256 currentLockedAmount;
        uint256 currentMilestone;
        uint256[] milestoneAmounts;
        uint256 totalEscrowed;
        uint256 totalReleased;
    }

    // ==================== STATE VARIABLES ====================

    mapping(string => Job) public jobs;
    uint256 public jobCounter;

    IERC20 public usdcToken;
    uint32 public chainId;
    ILayerZeroBridge public bridge;
    address public cctpSender;
    address public cctpMintRecipient;
    address public athenaClientContract;

    mapping(address => bool) public admins;

    uint256[50] private __gap;

    // ==================== EVENTS (Minimal) ====================

    event JobPosted(string indexed jobId, address indexed jobGiver);
    event JobApplication(string indexed jobId, address indexed applicant);
    event JobStarted(string indexed jobId);
    event WorkSubmitted(string indexed jobId, address indexed applicant);
    event PaymentReleased(string indexed jobId, uint256 amount, uint256 milestone);
    event MilestoneLocked(string indexed jobId, uint256 milestone, uint256 amount);
    event JobStatusChanged(string indexed jobId, JobStatus newStatus);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _usdcToken,
        uint32 _chainId,
        address _bridge,
        address _cctpSender
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();

        admins[_owner] = true;
        usdcToken = IERC20(_usdcToken);
        chainId = _chainId;
        bridge = ILayerZeroBridge(_bridge);
        cctpSender = _cctpSender;
        cctpMintRecipient = 0x8EfbF240240613803B9c9e716d4b5AD1388aFd99;
    }

    function _authorizeUpgrade(address) internal view override {
        require(owner() == _msgSender() || address(bridge) == _msgSender(), "Unauthorized");
    }

    // ==================== ADMIN FUNCTIONS ====================

    function setAdmin(address _admin, bool _status) external onlyOwner {
        admins[_admin] = _status;
    }

    function setBridge(address _bridge) external onlyOwner {
        bridge = ILayerZeroBridge(_bridge);
    }

    function setCCTPSender(address _cctpSender) external onlyOwner {
        cctpSender = _cctpSender;
    }

    function setCCTPMintRecipient(address _mintRecipient) external onlyOwner {
        cctpMintRecipient = _mintRecipient;
    }

    function setUsdcToken(address _newToken) external onlyOwner {
        usdcToken = IERC20(_newToken);
    }

    function setAthenaClientContract(address _athenaClient) external onlyOwner {
        athenaClientContract = _athenaClient;
    }

    // ==================== INTERNAL ====================

    function _sendFunds(string memory _jobId, uint256 _amount) internal {
        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);
        usdcToken.approve(cctpSender, _amount);

        bytes32 mintRecipient = bytes32(uint256(uint160(cctpMintRecipient)));
        (bool success, ) = cctpSender.call(
            abi.encodeWithSignature("sendFast(uint256,uint32,bytes32,uint256)", _amount, 3, mintRecipient, 1000)
        );
        require(success, "CCTP failed");
    }

    // ==================== PROFILE (PURE FORWARD - NO REENTRANCY NEEDED) ====================

    /// @notice Create profile - pure forward, no state changes
    function createProfile(
        string calldata _ipfsHash,
        address _referrerAddress,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "createProfile",
            abi.encode("createProfile", msg.sender, _ipfsHash, _referrerAddress),
            _nativeOptions
        );
    }

    function updateProfile(
        string calldata _newIpfsHash,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "updateProfile",
            abi.encode("updateProfile", msg.sender, _newIpfsHash),
            _nativeOptions
        );
    }

    function addPortfolio(
        string calldata _portfolioHash,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "addPortfolio",
            abi.encode("addPortfolio", msg.sender, _portfolioHash),
            _nativeOptions
        );
    }

    // ==================== JOB POSTING ====================

    /// @notice Post job - stores minimal local state
    function postJob(
        string calldata _jobDetailHash,
        string[] calldata _descriptions,
        uint256[] calldata _amounts,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        string memory jobId = string(abi.encodePacked(Strings.toString(chainId), "-", Strings.toString(++jobCounter)));

        Job storage job = jobs[jobId];
        job.jobGiver = msg.sender;
        job.status = JobStatus.Open;

        for (uint i = 0; i < _amounts.length; i++) {
            job.milestoneAmounts.push(_amounts[i]);
        }

        bridge.sendToNativeChain{value: msg.value}(
            "postJob",
            abi.encode("postJob", jobId, msg.sender, _jobDetailHash, _descriptions, _amounts),
            _nativeOptions
        );

        emit JobPosted(jobId, msg.sender);
    }

    // ==================== APPLICATION (PURE FORWARD - MAXIMUM OPTIMIZATION) ====================

    /// @notice Apply to job - PURE FORWARD, no local state, no reentrancy guard needed
    /// @dev Gas: ~12,000-15,000 (down from ~85,000 in lite version)
    function applyToJob(
        string calldata _jobId,
        string calldata _appHash,
        string[] calldata _descriptions,
        uint256[] calldata _amounts,
        uint32 _preferredChainDomain,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "applyToJob",
            abi.encode("applyToJob", msg.sender, _jobId, _appHash, _descriptions, _amounts, _preferredChainDomain),
            _nativeOptions
        );
        emit JobApplication(_jobId, msg.sender);
    }

    /// @notice Apply without event (even cheaper)
    function applyToJobSilent(
        string calldata _jobId,
        string calldata _appHash,
        string[] calldata _descriptions,
        uint256[] calldata _amounts,
        uint32 _preferredChainDomain,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "applyToJob",
            abi.encode("applyToJob", msg.sender, _jobId, _appHash, _descriptions, _amounts, _preferredChainDomain),
            _nativeOptions
        );
    }

    // ==================== JOB START ====================

    function startDirectContract(
        address _jobTaker,
        string calldata _jobDetailHash,
        string[] calldata _descriptions,
        uint256[] calldata _amounts,
        uint32 _jobTakerChainDomain,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        string memory jobId = string(abi.encodePacked(Strings.toString(chainId), "-", Strings.toString(++jobCounter)));

        Job storage job = jobs[jobId];
        job.jobGiver = msg.sender;
        job.status = JobStatus.InProgress;
        job.currentMilestone = 1;

        for (uint i = 0; i < _amounts.length; i++) {
            job.milestoneAmounts.push(_amounts[i]);
        }

        uint256 firstAmount = _amounts[0];
        _sendFunds(jobId, firstAmount);
        job.currentLockedAmount = firstAmount;
        job.totalEscrowed = firstAmount;

        bridge.sendToNativeChain{value: msg.value}(
            "startDirectContract",
            abi.encode("startDirectContract", msg.sender, _jobTaker, jobId, _jobDetailHash, _descriptions, _amounts, _jobTakerChainDomain),
            _nativeOptions
        );

        emit JobPosted(jobId, msg.sender);
        emit JobStarted(jobId);
    }

    function startJob(
        string calldata _jobId,
        uint256 _appId,
        bool _useAppMilestones,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.jobGiver == msg.sender, "Not job giver");
        require(job.status == JobStatus.Open, "Not open");

        job.status = JobStatus.InProgress;
        job.currentMilestone = 1;

        uint256 firstAmount = job.milestoneAmounts[0];
        _sendFunds(_jobId, firstAmount);
        job.currentLockedAmount = firstAmount;
        job.totalEscrowed = firstAmount;

        bridge.sendToNativeChain{value: msg.value}(
            "startJob",
            abi.encode("startJob", msg.sender, _jobId, _appId, _useAppMilestones),
            _nativeOptions
        );

        emit JobStarted(_jobId);
    }

    // ==================== WORK SUBMISSION (PURE FORWARD) ====================

    /// @notice Submit work - pure forward
    function submitWork(
        string calldata _jobId,
        string calldata _submissionHash,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "submitWork",
            abi.encode("submitWork", msg.sender, _jobId, _submissionHash),
            _nativeOptions
        );
        emit WorkSubmitted(_jobId, msg.sender);
    }

    /// @notice Submit work silent (no event)
    function submitWorkSilent(
        string calldata _jobId,
        string calldata _submissionHash,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "submitWork",
            abi.encode("submitWork", msg.sender, _jobId, _submissionHash),
            _nativeOptions
        );
    }

    // ==================== PAYMENT FUNCTIONS ====================

    function releasePaymentCrossChain(
        string calldata _jobId,
        uint32 _targetChainDomain,
        address _targetRecipient,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.jobGiver == msg.sender, "Not job giver");
        require(job.status == JobStatus.InProgress, "Not in progress");
        require(job.currentLockedAmount > 0, "No funds locked");

        uint256 amount = job.currentLockedAmount;
        job.currentLockedAmount = 0;
        job.totalReleased += amount;

        if (job.currentMilestone >= job.milestoneAmounts.length) {
            job.status = JobStatus.Completed;
            emit JobStatusChanged(_jobId, JobStatus.Completed);
        }

        bridge.sendToNativeChain{value: msg.value}(
            "releasePaymentCrossChain",
            abi.encode("releasePaymentCrossChain", msg.sender, _jobId, amount, _targetChainDomain, _targetRecipient),
            _nativeOptions
        );

        emit PaymentReleased(_jobId, amount, job.currentMilestone);
    }

    function lockNextMilestone(
        string calldata _jobId,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.jobGiver == msg.sender, "Not job giver");
        require(job.status == JobStatus.InProgress, "Not in progress");
        require(job.currentLockedAmount == 0, "Previous not released");
        require(job.currentMilestone < job.milestoneAmounts.length, "All complete");

        job.currentMilestone++;
        uint256 nextAmount = job.milestoneAmounts[job.currentMilestone - 1];

        _sendFunds(_jobId, nextAmount);
        job.currentLockedAmount = nextAmount;
        job.totalEscrowed += nextAmount;

        bridge.sendToNativeChain{value: msg.value}(
            "lockNextMilestone",
            abi.encode("lockNextMilestone", msg.sender, _jobId, nextAmount),
            _nativeOptions
        );

        emit MilestoneLocked(_jobId, job.currentMilestone, nextAmount);
    }

    function releaseAndLockNext(
        string calldata _jobId,
        uint32 _targetChainDomain,
        address _targetRecipient,
        bytes calldata _nativeOptions
    ) external payable nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.jobGiver == msg.sender, "Not job giver");
        require(job.status == JobStatus.InProgress, "Not in progress");
        require(job.currentLockedAmount > 0, "No funds locked");

        uint256 releaseAmount = job.currentLockedAmount;
        job.totalReleased += releaseAmount;
        job.currentMilestone++;

        uint256 nextAmount = 0;
        if (job.currentMilestone <= job.milestoneAmounts.length) {
            nextAmount = job.milestoneAmounts[job.currentMilestone - 1];
            _sendFunds(_jobId, nextAmount);
            job.currentLockedAmount = nextAmount;
            job.totalEscrowed += nextAmount;
        } else {
            job.currentLockedAmount = 0;
            job.status = JobStatus.Completed;
            emit JobStatusChanged(_jobId, JobStatus.Completed);
        }

        bridge.sendToNativeChain{value: msg.value}(
            "releaseAndLockNext",
            abi.encode("releasePaymentAndLockNext", msg.sender, _jobId, releaseAmount, nextAmount, _targetChainDomain, _targetRecipient),
            _nativeOptions
        );

        emit PaymentReleased(_jobId, releaseAmount, job.currentMilestone - 1);
    }

    // ==================== RATING (PURE FORWARD) ====================

    function rate(
        string calldata _jobId,
        address _userToRate,
        uint256 _rating,
        bytes calldata _nativeOptions
    ) external payable {
        bridge.sendToNativeChain{value: msg.value}(
            "rate",
            abi.encode("rate", msg.sender, _jobId, _userToRate, _rating),
            _nativeOptions
        );
    }

    // ==================== DISPUTE RESOLUTION ====================

    function resolveDispute(string calldata _jobId, bool _jobGiverWins) external {
        require(msg.sender == athenaClientContract, "Only Athena");

        Job storage job = jobs[_jobId];
        require(job.jobGiver != address(0), "Job not found");
        require(job.status == JobStatus.InProgress, "Not in progress");
        require(job.currentLockedAmount > 0, "No funds");

        job.currentLockedAmount = 0;
        job.status = JobStatus.Completed;

        emit JobStatusChanged(_jobId, JobStatus.Completed);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getJob(string calldata _jobId) external view returns (Job memory) {
        return jobs[_jobId];
    }

    function getJobCount() external view returns (uint256) {
        return jobCounter;
    }

    function getEscrowBalance(string calldata _jobId) external view returns (
        uint256 escrowed,
        uint256 released,
        uint256 locked
    ) {
        Job storage job = jobs[_jobId];
        return (job.totalEscrowed, job.totalReleased, job.currentLockedAmount);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }
}
