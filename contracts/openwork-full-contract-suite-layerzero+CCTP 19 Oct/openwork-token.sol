// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotingToken
 * @dev ERC-20 token with voting capabilities compatible with OpenZeppelin Governor
 * 
 * Features:
 * - Standard ERC-20 functionality
 * - ERC20Permit for gasless approvals
 * - ERC20Votes for governance voting (checkpoints, delegation)
 * - Ownable for administrative functions
 */
contract VotingToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    // Initial supply of tokens (adjust as needed)
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    /**
     * @dev Constructor that sets up the token with initial parameters
     * @param initialOwner Address that will own the contract
     */
    constructor(address initialOwner) 
        ERC20("OpenWorkToken", "OWORK")
        ERC20Permit("DAOToken")
        Ownable(initialOwner)
    {
        // Mint initial supply to the owner
        _mint(initialOwner, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens (only owner can call this)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }
    
    /**
     * @dev Burn tokens from specified account (requires allowance)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public {
        _spendAllowance(from, _msgSender(), amount);
        _burn(from, amount);
    }
    
    // The following functions are overrides required by Solidity due to multiple inheritance
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
