const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Compile a Solidity contract using Foundry
 * @param {string} contractName - Name of the contract (e.g., 'VotingToken')
 * @returns {Promise<{abi: Array, bytecode: string}>}
 */
async function compileContract(contractName) {
  try {
    console.log(`📦 Compiling contract: ${contractName}...`);
    
    // Path to contracts directory
    const contractsDir = path.join(__dirname, '../../contracts');
    
    // Map contract names to their actual file names and paths
    const contractMapping = {
      'MainDAO': {
        fileName: 'main-dao.sol',
        className: 'MainDAO',
        subDir: 'openwork-full-contract-suite-layerzero+CCTP 2 Nov'
      },
      'UUPSProxy': {
        fileName: 'proxy.sol',
        className: 'UUPSProxy',
        subDir: 'openwork-full-contract-suite-layerzero+CCTP 2 Nov'
      },
      'VotingToken': {
        fileName: 'VotingToken.sol',
        className: 'VotingToken',
        subDir: null // Regular Foundry structure
      }
    };
    
    const mapping = contractMapping[contractName];
    if (!mapping) {
      throw new Error(`Unknown contract: ${contractName}. Add mapping in compiler.js`);
    }
    
    // Run forge build
    execSync('forge build', { 
      cwd: contractsDir,
      stdio: 'pipe'
    });
    
    console.log('✅ Compilation successful');
    
    // Determine artifact path based on mapping
    let artifactPath;
    if (mapping.subDir) {
      // For contracts in subdirectories like main-dao.sol
      artifactPath = path.join(
        contractsDir,
        'out',
        mapping.fileName,
        `${mapping.className}.json`
      );
    } else {
      // For regular Foundry structure
      artifactPath = path.join(
        contractsDir,
        'out',
        `${contractName}.sol`,
        `${contractName}.json`
      );
    }
    
    console.log(`📂 Looking for artifact at: ${artifactPath}`);
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found: ${artifactPath}`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Extract ABI and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode.object;
    
    if (!bytecode || bytecode === '0x') {
      throw new Error('No bytecode generated. Contract may be abstract or have errors.');
    }
    
    console.log(`✅ Extracted ABI (${abi.length} items) and bytecode (${bytecode.length} chars)`);
    
    return {
      abi,
      bytecode
    };
    
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
    throw error;
  }
}

module.exports = {
  compileContract
};
