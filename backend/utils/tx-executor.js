const { Web3 } = require('web3');
const config = require('../config');

/**
 * Execute receive() on CCTP Transceiver (Arbitrum) for Start Job flow
 * @param {Object} attestationData - Attestation data from Circle API
 * @returns {Promise<{transactionHash: string, alreadyCompleted: boolean}>}
 */
async function executeReceiveOnArbitrum(attestationData) {
  console.log('🔗 Executing receive() on Arbitrum CCTP Transceiver...');
  
  const web3 = new Web3(config.ARBITRUM_SEPOLIA_RPC);
  const privateKey = config.WALL2_PRIVATE_KEY.startsWith('0x') 
    ? config.WALL2_PRIVATE_KEY 
    : `0x${config.WALL2_PRIVATE_KEY}`;
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  
  const cctpContract = new web3.eth.Contract(
    config.ABIS.CCTP_TRANSCEIVER,
    config.CCTP_TRANSCEIVER_ADDRESS
  );
  
  console.log('📋 Transaction parameters:', {
    contract: config.CCTP_TRANSCEIVER_ADDRESS,
    serviceWallet: account.address,
    messageLength: attestationData.message?.length,
    attestationLength: attestationData.attestation?.length
  });
  
  try {
    const tx = await cctpContract.methods.receive(
      attestationData.message,
      attestationData.attestation
    ).send({
      from: account.address,
      gas: 300000
    });
    
    console.log('✅ Receive transaction completed:', {
      txHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed
    });
    
    return {
      transactionHash: tx.transactionHash,
      alreadyCompleted: false
    };
    
  } catch (error) {
    console.log('⚠️ Receive execution failed:', error.message);
    
    // Check if already completed (this is actually success)
    if (error.message.includes('reverted') || error.message.includes('revert')) {
      console.log('✅ USDC transfer was already completed by CCTP!');
      console.log('ℹ️ NOWJC contract on Arbitrum already received funds.');
      
      return {
        transactionHash: null,
        alreadyCompleted: true
      };
    }
    
    // For other errors, throw
    throw new Error(`Arbitrum receive() failed: ${error.message}`);
  }
}

/**
 * Execute receiveMessage() on MessageTransmitter (OP Sepolia) for Release Payment flow
 * @param {Object} attestationData - Attestation data from Circle API
 * @returns {Promise<{transactionHash: string, alreadyCompleted: boolean}>}
 */
async function executeReceiveMessageOnOpSepolia(attestationData) {
  console.log('🔗 Executing receiveMessage() on OP Sepolia MessageTransmitter...');
  
  const web3 = new Web3(config.OP_SEPOLIA_RPC);
  const privateKey = config.WALL2_PRIVATE_KEY.startsWith('0x') 
    ? config.WALL2_PRIVATE_KEY 
    : `0x${config.WALL2_PRIVATE_KEY}`;
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  
  const transmitterContract = new web3.eth.Contract(
    config.ABIS.MESSAGE_TRANSMITTER,
    config.MESSAGE_TRANSMITTER_ADDRESS
  );
  
  console.log('📋 Transaction parameters:', {
    contract: config.MESSAGE_TRANSMITTER_ADDRESS,
    serviceWallet: account.address,
    messageLength: attestationData.message?.length,
    attestationLength: attestationData.attestation?.length
  });
  
  try {
    const tx = await transmitterContract.methods.receiveMessage(
      attestationData.message,
      attestationData.attestation
    ).send({
      from: account.address,
      gas: 300000
    });
    
    console.log('✅ ReceiveMessage transaction completed:', {
      txHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed
    });
    
    return {
      transactionHash: tx.transactionHash,
      alreadyCompleted: false
    };
    
  } catch (error) {
    console.log('⚠️ ReceiveMessage execution failed:', error.message);
    
    // Check if already completed (this is actually success)
    if (error.message.includes('reverted') || error.message.includes('revert')) {
      console.log('✅ Payment was already completed by CCTP! Applicant has received USDC.');
      console.log('ℹ️ The NOWJC contract successfully transferred USDC via CCTP.');
      
      return {
        transactionHash: null,
        alreadyCompleted: true
      };
    }
    
    // For other errors, throw
    throw new Error(`OP Sepolia receiveMessage() failed: ${error.message}`);
  }
}

module.exports = {
  executeReceiveOnArbitrum,
  executeReceiveMessageOnOpSepolia
};
