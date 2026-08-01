'use strict';

const { getChainIdFromJobId } = require('./chain-utils');

const ARBITRUM_ONE_CHAIN_ID = 42161;
const INDEXED_DYNAMIC_VALUE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Classify a decoded PaymentReleased jobId before the global recovery listener
 * attempts a relay.
 *
 * Solidity stores an indexed string as keccak256(string), so an unfiltered
 * getPastEvents() scan cannot recover the original job ID from the log.  A
 * job-specific monitor can still filter by the known ID, and database recovery
 * already has the original ID.  Never pass the topic hash into the CCTP flow.
 */
function classifyPaymentReleasedJobId(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return { shouldProcess: false, reason: 'missing_job_id' };
  }

  if (INDEXED_DYNAMIC_VALUE.test(value)) {
    return { shouldProcess: false, reason: 'indexed_job_id_hash', topicHash: value };
  }

  let chainId;
  try {
    chainId = getChainIdFromJobId(value);
  } catch (error) {
    return { shouldProcess: false, reason: 'invalid_job_id', error: error.message };
  }

  if (chainId === ARBITRUM_ONE_CHAIN_ID) {
    return { shouldProcess: false, reason: 'native_arbitrum_payment', jobId: value, chainId };
  }

  return { shouldProcess: true, jobId: value, chainId };
}

module.exports = {
  classifyPaymentReleasedJobId,
};
