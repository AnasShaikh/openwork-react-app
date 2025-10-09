// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMainDAO {
    function handleUpdateStakeDataFromRewards(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationMinutes,
        bool isActive
    ) external;
}

interface IThirdChainBridge {
    function sendToNativeChain(
        string memory _functionName,
        bytes memory _payload,
        bytes calldata _options
    ) external payable;
    
    function quoteNativeChain(
        bytes calldata _payload,
        bytes calldata _options
    ) external view returns (uint256 fee);
}

contract CrossChainRewardsContract is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    IERC20 public openworkToken;
    IMainDAO public mainDAO;
    IThirdChainBridge public bridge;
    
    // User referrer mapping
    mapping(address => address) public userReferrers;
    
    // Simplified rewards tracking - just claimable balances
    mapping(address => uint256) public userClaimableBalance;
    mapping(address => uint256) public userTotalClaimed;
    
    // Cross-chain tracking
    mapping(uint32 => bool) public authorizedChains;
    mapping(uint32 => string) public chainNames;
    
    // Events
    event ProfileCreated(address indexed user, address indexed referrer, uint32 indexed sourceChain);
    event ClaimableBalanceUpdated(address indexed user, uint256 newBalance, uint32 indexed sourceChain);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ContractUpdated(string contractType, address newAddress);
    event AuthorizedChainUpdated(uint32 indexed chainEid, bool authorized, string chainName);
    event StakeDataForwarded(address indexed staker, bool isActive);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _owner, address _openworkToken, address _bridge) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        openworkToken = IERC20(_openworkToken);
        bridge = IThirdChainBridge(_bridge);
        _initializeAuthorizedChains();
    }
    
    function _authorizeUpgrade(address /* newImplementation */) internal view override {
        require(owner() == _msgSender() || address(bridge) == _msgSender() || address(mainDAO) == _msgSender(), "Unauthorized upgrade");
    }

    function upgradeFromDAO(address newImplementation) external {
        require(msg.sender == address(mainDAO), "Only DAO can upgrade");
        upgradeToAndCall(newImplementation, "");
    }

    // ==================== MESSAGE HANDLERS ====================
    
    function handleCreateProfile(address user, address referrer, uint32 sourceChain) external {
        require(msg.sender == address(bridge), "Only bridge can call this function");
        _createProfile(user, referrer, sourceChain);
    }
    
    function handleStakeDataUpdate(address staker, uint256 amount, uint256 unlockTime, uint256 durationMinutes, bool isActive, uint32 /* sourceChain */) external {
        require(msg.sender == address(bridge), "Only bridge can call this function");
        
        // Forward to Main DAO locally
        if (address(mainDAO) != address(0)) {
            try mainDAO.handleUpdateStakeDataFromRewards(staker, amount, unlockTime, durationMinutes, isActive) {
                emit StakeDataForwarded(staker, isActive);
            } catch {
                // Log error but don't revert to avoid blocking other messages
            }
        }
    }

    /**
     * @dev Handle sync of claimable rewards from native chain
     * Called by bridge when user syncs their rewards data
     */
    function handleSyncClaimableRewards(
        address user,
        uint256 claimableAmount,
        uint32 sourceChain
    ) external {
        require(msg.sender == address(bridge), "Only bridge can call this function");
        
        // Update user's claimable balance (overwrites previous value)
        userClaimableBalance[user] = claimableAmount;
        
        emit ClaimableBalanceUpdated(user, claimableAmount, sourceChain);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function setBridge(address _bridge) external onlyOwner {
        address oldBridge = address(bridge);
        bridge = IThirdChainBridge(_bridge);
        emit BridgeUpdated(oldBridge, _bridge);
    }
    
    function setOpenworkToken(address _token) external onlyOwner {
        openworkToken = IERC20(_token);
        emit ContractUpdated("OpenworkToken", _token);
    }
    
    function setMainDAO(address _mainDAO) external onlyOwner {
        mainDAO = IMainDAO(_mainDAO);
        emit ContractUpdated("MainDAO", _mainDAO);
    }
    
    // ==================== CROSS-CHAIN SETUP FUNCTIONS ====================
    
    function _initializeAuthorizedChains() private {
        // Authorize common testnets by default
        authorizedChains[40161] = true; // ETH Sepolia
        authorizedChains[40232] = true; // OP Sepolia  
        authorizedChains[40231] = true; // Arbitrum Sepolia
        
        chainNames[40161] = "Ethereum Sepolia";
        chainNames[40232] = "Optimism Sepolia";
        chainNames[40231] = "Arbitrum Sepolia";
    }
    
    function updateAuthorizedChain(uint32 _chainEid, bool _authorized, string memory _chainName) external onlyOwner {
        authorizedChains[_chainEid] = _authorized;
        if (_authorized && bytes(_chainName).length > 0) {
            chainNames[_chainEid] = _chainName;
        }
        emit AuthorizedChainUpdated(_chainEid, _authorized, _chainName);
    }
    
    // ==================== INTERNAL CORE FUNCTIONS ====================
    
    function _createProfile(address user, address referrer, uint32 sourceChain) internal {
        require(user != address(0), "Invalid user address");
        
        if (referrer != address(0) && referrer != user) {
            userReferrers[user] = referrer;
        }
        
        emit ProfileCreated(user, referrer, sourceChain);
    }
    
    // ==================== REWARDS CLAIMING FUNCTIONS ====================
    
    /**
     * @dev Claim available rewards tokens
     * Users can claim their full claimable balance
     */
    function claimRewards(bytes calldata _options) external payable nonReentrant {
        uint256 claimableAmount = userClaimableBalance[msg.sender];
        require(claimableAmount > 0, "No rewards to claim");
        
        // Check contract has enough tokens
        require(openworkToken.balanceOf(address(this)) >= claimableAmount, "Insufficient contract balance");
        
        // Reset user's claimable balance
        userClaimableBalance[msg.sender] = 0;
        
        // Update claimed amount
        userTotalClaimed[msg.sender] += claimableAmount;
        
        // Transfer tokens to user
        require(openworkToken.transfer(msg.sender, claimableAmount), "Token transfer failed");

        // Notify native chain of successful claim
        if (address(bridge) != address(0)) {
            bytes memory payload = abi.encode(
                "updateUserClaimData",
                msg.sender,
                claimableAmount
            );
            
            bridge.sendToNativeChain{value: msg.value}(
                "updateUserClaimData", 
                payload, 
                _options
            );
        }
        
        emit RewardsClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Get user's current claimable balance
     */
    function getClaimableRewards(address user) public view returns (uint256) {
        return userClaimableBalance[user];
    }

    // ==================== CROSS-CHAIN STAKE UPDATE FUNCTIONS ====================
    
    function sendStakeUpdateCrossChain(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationMinutes,
        bool isActive,
        bytes calldata _options
    ) external payable {
        require(msg.sender == address(mainDAO), "Only Main DAO can send stake updates");
        require(address(bridge) != address(0), "Bridge not set");
        
        bytes memory payload = abi.encode(
            "updateStakeData",
            staker,
            amount,
            unlockTime,
            durationMinutes,
            isActive
        );
        
        bridge.sendToNativeChain{value: msg.value}("updateStakeData", payload, _options);
    }
    
    function quoteStakeUpdate(
        address staker,
        uint256 amount,
        uint256 unlockTime,
        uint256 durationMinutes,
        bool isActive,
        bytes calldata _options
    ) external view returns (uint256 fee) {
        if (address(bridge) == address(0)) return 0;
        
        bytes memory payload = abi.encode(
            "updateStakeData",
            staker,
            amount,
            unlockTime,
            durationMinutes,
            isActive
        );
        return bridge.quoteNativeChain(payload, _options);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getUserRewardInfo(address user) external view returns (
        uint256 claimableAmount,
        uint256 totalClaimed
    ) {
        claimableAmount = userClaimableBalance[user];
        totalClaimed = userTotalClaimed[user];
    }
    
    function getUserReferrer(address user) external view returns (address) {
        return userReferrers[user];
    }
    
    // Cross-chain info functions
    function getAuthorizedChains() external view returns (uint32[] memory chains, bool[] memory authorized, string[] memory names) {
        // Get common testnet chains
        uint32[] memory commonChains = new uint32[](3);
        commonChains[0] = 40161; // ETH Sepolia
        commonChains[1] = 40232; // OP Sepolia
        commonChains[2] = 40231; // Arbitrum Sepolia
        
        chains = new uint32[](commonChains.length);
        authorized = new bool[](commonChains.length);
        names = new string[](commonChains.length);
        
        for (uint256 i = 0; i < commonChains.length; i++) {
            chains[i] = commonChains[i];
            authorized[i] = authorizedChains[commonChains[i]];
            names[i] = chainNames[commonChains[i]];
        }
    }

    function quoteClaimSync(
        address user,
        uint256 claimAmount,
        bytes calldata _options
    ) external view returns (uint256 fee) {
        if (address(bridge) == address(0)) return 0;
        
        bytes memory payload = abi.encode(
            "updateUserClaimData",
            user,
            claimAmount
        );
        return bridge.quoteNativeChain(payload, _options);
    }
    
    function isChainAuthorized(uint32 chainEid) external view returns (bool) {
        return authorizedChains[chainEid];
    }
    
    function getChainName(uint32 chainEid) external view returns (string memory) {
        return chainNames[chainEid];
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function emergencyUpdateUserBalance(address user, uint256 newBalance) external onlyOwner {
        userClaimableBalance[user] = newBalance;
        emit ClaimableBalanceUpdated(user, newBalance, 0);
    }
    
    // Emergency token withdrawal
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(openworkToken.transfer(owner(), amount), "Token transfer failed");
    }

    // Allow contract to receive ETH for paying LayerZero fees
    receive() external payable {}
}