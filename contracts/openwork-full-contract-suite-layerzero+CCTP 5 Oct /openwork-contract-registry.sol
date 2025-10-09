// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OpenworkContractRegistry {
    struct ContractInfo {
        string name;
        address contractAddress;
        string chain;
        address deployer;
    }

    address public owner;
    mapping(string => ContractInfo) private contracts;
    string[] private contractNames;

    event ContractAdded(string indexed name, address indexed contractAddress, string chain, address indexed deployer);
    event ContractUpdated(string indexed name, address indexed contractAddress, string chain, address indexed deployer);
    event ContractRemoved(string indexed name);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier contractExists(string memory name) {
        require(bytes(contracts[name].name).length > 0, "Contract does not exist");
        _;
    }

    modifier contractNotExists(string memory name) {
        require(bytes(contracts[name].name).length == 0, "Contract already exists");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addContract(
        string memory name,
        address contractAddress,
        string memory chain,
        address deployer
    ) external onlyOwner contractNotExists(name) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(contractAddress != address(0), "Invalid contract address");
        require(bytes(chain).length > 0, "Chain cannot be empty");
        require(deployer != address(0), "Invalid deployer address");

        contracts[name] = ContractInfo({
            name: name,
            contractAddress: contractAddress,
            chain: chain,
            deployer: deployer
        });
        
        contractNames.push(name);
        
        emit ContractAdded(name, contractAddress, chain, deployer);
    }

    function updateContract(
        string memory name,
        address newContractAddress,
        string memory newChain,
        address newDeployer
    ) external onlyOwner contractExists(name) {
        require(newContractAddress != address(0), "Invalid contract address");
        require(bytes(newChain).length > 0, "Chain cannot be empty");
        require(newDeployer != address(0), "Invalid deployer address");

        contracts[name].contractAddress = newContractAddress;
        contracts[name].chain = newChain;
        contracts[name].deployer = newDeployer;
        
        emit ContractUpdated(name, newContractAddress, newChain, newDeployer);
    }

    function removeContract(string memory name) external onlyOwner contractExists(name) {
        delete contracts[name];
        
        for (uint256 i = 0; i < contractNames.length; i++) {
            if (keccak256(bytes(contractNames[i])) == keccak256(bytes(name))) {
                contractNames[i] = contractNames[contractNames.length - 1];
                contractNames.pop();
                break;
            }
        }
        
        emit ContractRemoved(name);
    }

    function getContract(string memory name) external view contractExists(name) returns (ContractInfo memory) {
        return contracts[name];
    }

    function getAllContracts() external view returns (ContractInfo[] memory) {
        ContractInfo[] memory allContracts = new ContractInfo[](contractNames.length);
        
        for (uint256 i = 0; i < contractNames.length; i++) {
            allContracts[i] = contracts[contractNames[i]];
        }
        
        return allContracts;
    }

    function getContractCount() external view returns (uint256) {
        return contractNames.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != owner, "New owner cannot be the same as current owner");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}