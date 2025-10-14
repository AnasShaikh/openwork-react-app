const { waitForNOWJCEvent } = require('../utils/event-monitor');
const { pollCCTPAttestation } = require('../utils/cctp-poller');
const { executeReceiveMessageOnOpSepolia } = require('../utils/tx-executor');
const config = require('../config');

/**
 * Process Release Payment flow: Arbitrum → OP Sepolia
 * Triggered when user releases payment which causes NOWJC to emit PaymentReleased
 * @param {string} jobId - Job ID from the transaction
 */
async function processReleasePayment(jobId) {
  console.log('\n💰 ========== RELEASE PAYMENT FLOW INITIATED ==========');
  console.log(`Job ID: ${jobId}`);
  
  try {
    // STEP 1: Monitor NOWJC for PaymentReleased event
    console.log('\n📍 STEP 1/3: Monitoring for PaymentReleased event on Arbitrum...');
    const nowjcTxHash = await waitForNOWJCEvent('PaymentReleased', jobId);
    console.log(`✅ PaymentReleased detected: ${nowjcTxHash}`);
    
    // STEP 2: Poll Circle API for CCTP attestation
    console.log('\n📍 STEP 2/3: Polling Circle API for CCTP attestation...');
    const attestation = await pollCCTPAttestation(
      nowjcTxHash, 
      config.DOMAINS.ARBITRUM_SEPOLIA // Domain 3
    );
    console.log('✅ Attestation received');
    
    // STEP 3: Execute receiveMessage() on OP Sepolia
    console.log('\n📍 STEP 3/3: Executing receiveMessage() on OP Sepolia...');
    const result = await executeReceiveMessageOnOpSepolia(attestation);
    
    if (result.alreadyCompleted) {
      console.log('✅ Payment already completed to applicant (completed by CCTP)');
    } else {
      console.log(`✅ Payment completed to applicant: ${result.transactionHash}`);
    }
    
    console.log('\n🎉 ========== RELEASE PAYMENT FLOW COMPLETED ==========\n');
    return {
      success: true,
      jobId,
      nowjcTxHash,
      completionTxHash: result.transactionHash,
      alreadyCompleted: result.alreadyCompleted
    };
    
  } catch (error) {
    console.error('\n❌ ========== RELEASE PAYMENT FLOW FAILED ==========');
    console.error(`Job ID: ${jobId}`);
    console.error(`Error: ${error.message}`);
    console.error('====================================================\n');
    
    throw error;
  }
}

module.exports = {
  processReleasePayment
};
