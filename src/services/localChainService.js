/**
 * Local Chain Service
 * 
 * Handles write operations (transactions) to LOWJC and Athena Client contracts
 * on any supported local chain (Optimism on mainnet, OP Sepolia/Ethereum Sepolia on testnet).
 * 
 * Architecture:
 * - Detects user's connected chain
 * - Routes transactions to appropriate LOWJC/Athena Client contract
 * - Transactions auto-sync to Arbitrum (Native Chain) via LayerZero
 * - Job data becomes visible on Arbitrum Genesis for all users
 * 
 * Usage:
 * import { postJob, applyToJob, raiseDispute } from './localChainService';
 * await postJob(chainId, userAddress, jobData);
 */

import Web3 from "web3";
import { getChainConfig, isChainAllowed, getLocalChains, buildLzOptions, DESTINATION_GAS_ESTIMATES, CHAIN_TYPES } from "../config/chainConfig";
import LOWJC_ABI from "../ABIs/lowjc-lite_ABI.json";
import NATIVE_ARB_LOWJC_ABI from "../ABIs/native-arb-lowjc_ABI.json";
import ATHENA_CLIENT_ABI from "../ABIs/athena-client_ABI.json";
import NATIVE_ARB_ATHENA_CLIENT_ABI from "../ABIs/native-arb-athena-client_ABI.json";
import {
  ATHENA_OPERATIONS,
  LOWJC_OPERATIONS,
  buildEstimatedWriteSendOptions,
  createAthenaWrite,
  createLOWJCWrite,
} from "./contractWriteRouter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Persist a tx hash to the backend so users can always retrieve it later.
 * Fire-and-forget — never blocks the main flow.
 */
async function saveTxHash(action, txHash, jobId, chainId, walletAddress, metadata = {}) {
  try {
    await fetch(`${BACKEND_URL}/api/jobs/tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, txHash, jobId, chainId, walletAddress, metadata }),
    });
  } catch (e) {
    console.warn('[saveTxHash] failed (non-blocking):', e.message);
  }
}

// Minimal ABI for LocalBridge quoting
const BRIDGE_QUOTE_ABI = [
  {
    inputs: [
      { type: "bytes", name: "_payload" },
      { type: "bytes", name: "_options"  }
    ],
    name: "quoteNativeChain",
    outputs: [{ type: "uint256", name: "fee" }],
    stateMutability: "view",
    type: "function"
  }
];

/**
 * Returns true if this chain uses the native Arb LOWJC (no LZ, no CCTP, no msg.value).
 */
export function isNativeArbChain(chainId) {
  const config = getChainConfig(chainId);
  return config?.type === CHAIN_TYPES.LOCAL_NATIVE;
}

/**
 * Use the configured HTTP RPC for read-only calls. Some wallet-injected XDC
 * providers return an internal JSON-RPC error for nested LayerZero quote calls
 * even though the same eth_call succeeds on a public XDC endpoint.
 */
export function getReadOnlyWeb3(chainId) {
  const config = getChainConfig(chainId);
  return new Web3(config?.rpcUrl || window.ethereum);
}

/**
 * Get LOWJC contract instance for a specific chain.
 * Uses native-arb ABI for LOCAL_NATIVE chains (no _nativeOptions params).
 */
export async function getLOWJCContract(chainId) {
  if (!isChainAllowed(chainId)) {
    const config = getChainConfig(chainId);
    throw new Error(config?.reason || "Transactions not allowed on this chain");
  }

  const config = getChainConfig(chainId);
  if (!config || !config.contracts.lowjc) {
    throw new Error(`LOWJC contract not configured for chain ${chainId}`);
  }

  const web3 = new Web3(window.ethereum);
  const abi = isNativeArbChain(chainId) ? NATIVE_ARB_LOWJC_ABI : LOWJC_ABI;
  return new web3.eth.Contract(abi, config.contracts.lowjc);
}

/**
 * Get Athena Client contract instance for a specific chain
 * @param {number} chainId - Chain ID
 * @returns {object} Web3 contract instance
 */
export async function getAthenaClientContract(chainId) {
  if (!isChainAllowed(chainId)) {
    const config = getChainConfig(chainId);
    throw new Error(config?.reason || "Transactions not allowed on this chain");
  }
  
  const config = getChainConfig(chainId);
  if (!config || !config.contracts.athenaClient) {
    throw new Error(`Athena Client contract not configured for chain ${chainId}`);
  }
  
  const web3 = new Web3(window.ethereum);
  const abi = isNativeArbChain(chainId) ? NATIVE_ARB_ATHENA_CLIENT_ABI : ATHENA_CLIENT_ABI;
  return new web3.eth.Contract(abi, config.contracts.athenaClient);
}

/**
 * Estimate LayerZero fee by calling quoteNativeChain() on the LocalBridge.
 * Uses the exact on-chain quote so any excess is not stranded in LOWJC.
 *
 * @param {number} chainId       - Source chain ID
 * @param {string} operationKey  - Key from DESTINATION_GAS_ESTIMATES (e.g. "POST_JOB")
 * @param {object} quoteData - { encodedPayload, nativeOptions }
 * @returns {Promise<string>} Exact quoted fee in wei
 */
export async function estimateLayerZeroFee(chainId, operationKey, quoteData = {}) {
  // Native Arb chain — no LayerZero, no fee
  if (isNativeArbChain(chainId)) return "0";

  try {
    const config    = getChainConfig(chainId);
    const web3      = getReadOnlyWeb3(chainId);
    const contract  = new web3.eth.Contract(LOWJC_ABI, config.contracts.lowjc);

    const destGasKey = operationKey?.toUpperCase().replace(/-/g, '_');
    const destGas    = DESTINATION_GAS_ESTIMATES[destGasKey] ?? DESTINATION_GAS_ESTIMATES.DEFAULT;
    const nativeOptions = quoteData.nativeOptions || buildLzOptions(destGas);
    if (!quoteData.encodedPayload) {
      throw new Error(`Exact payload is required to quote ${operationKey}`);
    }

    const bridgeAddress = await contract.methods.bridge().call();
    const bridgeContract = new web3.eth.Contract(BRIDGE_QUOTE_ABI, bridgeAddress);
    const rawFee = await bridgeContract.methods
      .quoteNativeChain(quoteData.encodedPayload, nativeOptions)
      .call();

    const nativeSymbol = config.nativeCurrency?.symbol || "ETH";
    console.log(
      `[LZ quote] ${operationKey}: ${web3.utils.fromWei(rawFee.toString(), "ether")} ${nativeSymbol}`
    );

    return rawFee.toString();
  } catch (err) {
    throw new Error(`Unable to quote ${operationKey} on chain ${chainId}: ${err.message}`);
  }
}

// ==================== JOB OPERATIONS ====================

/**
 * Post a new job on the user's connected local chain
 * @param {number}   chainId    - Chain ID where user is connected
 * @param {string}   userAddress
 * @param {object}   jobData    - { jobDetailHash, descriptions, amounts }
 * @param {Function} [onStatus] - Optional callback(message) for UI status updates
 * @returns {Promise<object>} Transaction receipt
 */
export async function postJob(chainId, userAddress, jobData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.POST_JOB);
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const readContract = new quoteWeb3.eth.Contract(LOWJC_ABI, config.contracts.lowjc);
      const jobCounter = await readContract.methods.getJobCount().call();
      const predictedJobId = `${config.layerzero.eid}-${Number(jobCounter) + 1}`;
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'string', 'address', 'string', 'string[]', 'uint256[]'],
        ['postJob', predictedJobId, userAddress, jobData.jobDetailHash, jobData.descriptions, jobData.amounts]
      );
      lzFee = await estimateLayerZeroFee(chainId, "POST_JOB", { encodedPayload, nativeOptions });
    }

    emit(`Submitting job post on ${config.name} — confirm in wallet...`);

    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.POST_JOB,
      [jobData.jobDetailHash, jobData.descriptions, jobData.amounts],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));

    emit(`Transaction confirmed: ${tx.transactionHash}`);
    saveTxHash('postJob', tx.transactionHash, null, chainId, userAddress);
    console.log(`[postJob] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[postJob] error:", error);
    throw error;
  }
}

/**
 * Apply to a job on the user's connected local chain
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {object}   applicationData
 * @param {Function} [onStatus]
 */
export async function applyToJob(chainId, userAddress, applicationData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.APPLY_JOB);
    const preferredChainDomain = applicationData.preferredChainDomain ?? 3;
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'string', 'string[]', 'uint256[]', 'uint32'],
        ['applyToJob', userAddress, applicationData.jobId, applicationData.applicationHash,
          applicationData.descriptions, applicationData.amounts, preferredChainDomain]
      );
      lzFee = await estimateLayerZeroFee(chainId, "APPLY_JOB", { encodedPayload, nativeOptions });
    }

    emit(`Submitting application on ${config.name} — confirm in wallet...`);

    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.APPLY_TO_JOB,
      [
        applicationData.jobId,
        applicationData.applicationHash,
        applicationData.descriptions,
        applicationData.amounts,
        preferredChainDomain,
      ],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));
    emit(`Application submitted: ${tx.transactionHash}`);
    saveTxHash('applyToJob', tx.transactionHash, applicationData.jobId, chainId, userAddress);
    console.log(`[applyToJob] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[applyToJob] error:", error);
    throw error;
  }
}

/**
 * Start a job (requires prior USDC approval via approveUSDC)
 * @param {number}   chainId
 * @param {string}   userAddress  - Job giver
 * @param {object}   startData    - { jobId, applicationId, useAppMilestones }
 * @param {Function} [onStatus]
 */
export async function startJob(chainId, userAddress, startData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.START_JOB);
    const requestedApplicantMilestones = Boolean(startData.useAppMilestones);
    const useAppMilestones = native && requestedApplicantMilestones;
    if (!native && requestedApplicantMilestones) {
      emit("Applicant milestones are only available for native Arbitrum jobs; using the original job milestones.");
    }
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'uint256', 'bool'],
        ['startJob', userAddress, startData.jobId, startData.applicationId, useAppMilestones]
      );
      lzFee = await estimateLayerZeroFee(chainId, "START_JOB", { encodedPayload, nativeOptions });
    }

    emit(`Starting job on ${config.name} — confirm in wallet...`);

    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.START_JOB,
      [startData.jobId, startData.applicationId, useAppMilestones],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));
    emit(`Job started: ${tx.transactionHash}`);
    saveTxHash('startJob', tx.transactionHash, startData.jobId, chainId, userAddress);
    console.log(`[startJob] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[startJob] error:", error);
    throw error;
  }
}

/**
 * Submit work for a milestone
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {object}   workData     - { jobId, submissionHash }
 * @param {Function} [onStatus]
 */
export async function submitWork(chainId, userAddress, workData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.DEFAULT);
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'string'],
        ['submitWork', userAddress, workData.jobId, workData.submissionHash]
      );
      lzFee = await estimateLayerZeroFee(chainId, "DEFAULT", { encodedPayload, nativeOptions });
    }

    emit(`Submitting work on ${config.name} — confirm in wallet...`);

    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.SUBMIT_WORK,
      [workData.jobId, workData.submissionHash],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));
    emit(`Work submitted: ${tx.transactionHash}`);
    saveTxHash('submitWork', tx.transactionHash, workData.jobId, chainId, userAddress);
    console.log(`[submitWork] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[submitWork] error:", error);
    throw error;
  }
}

/**
 * Release payment for completed milestone
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {object}   paymentData  - { jobId, targetChainDomain, targetRecipient }
 * @param {Function} [onStatus]
 */
export async function releasePaymentCrossChain(chainId, userAddress, paymentData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.RELEASE_PAYMENT);
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      if (!paymentData.targetChainDomain || !paymentData.targetRecipient) {
        throw new Error("Target chain domain and recipient are required for a cross-chain release");
      }
      const localJob = await contract.methods.getJob(paymentData.jobId).call();
      const amount = localJob.currentLockedAmount?.toString();
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'uint256', 'uint32', 'address'],
        ['releasePaymentCrossChain', userAddress, paymentData.jobId, amount,
          paymentData.targetChainDomain, paymentData.targetRecipient]
      );
      lzFee = await estimateLayerZeroFee(chainId, "RELEASE_PAYMENT", { encodedPayload, nativeOptions });
    }

    emit(`Releasing payment on ${config.name} — confirm in wallet...`);

    // Native Arb: call unified releasePayment(jobId) — NOWJC auto-routes to applicant
    // Cross-chain: call releasePaymentCrossChain with target domain + recipient
    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.RELEASE_PAYMENT,
      [paymentData.jobId, paymentData.targetChainDomain, paymentData.targetRecipient],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));
    emit(`Payment release confirmed: ${tx.transactionHash}`);
    saveTxHash('releasePayment', tx.transactionHash, paymentData.jobId, chainId, userAddress);
    console.log(`[releasePayment] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[releasePayment] error:", error);
    throw error;
  }
}

// ==================== DISPUTE OPERATIONS ====================

/**
 * Raise a dispute on the user's connected local chain
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {object}   disputeData  - { jobId, disputeHash, oracleName, feeAmount, disputedAmount }
 * @param {Function} [onStatus]
 */
export async function raiseDispute(chainId, userAddress, disputeData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getAthenaClientContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);

    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.DEFAULT);
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'string', 'string', 'string', 'uint256', 'uint256', 'address'],
        ['raiseDispute', disputeData.jobId, disputeData.disputeHash, disputeData.oracleName,
          disputeData.feeAmount, disputeData.disputedAmount, userAddress]
      );
      const readContract = new quoteWeb3.eth.Contract(ATHENA_CLIENT_ABI, config.contracts.athenaClient);
      lzFee = (await readContract.methods
        .quoteSingleChain('raiseDispute', encodedPayload, nativeOptions)
        .call()).toString();
    }

    emit(`Raising dispute on ${config.name} — confirm in wallet...`);

    const method = createAthenaWrite(
      contract,
      config,
      ATHENA_OPERATIONS.RAISE_DISPUTE,
      [
        disputeData.jobId,
        disputeData.disputeHash,
        disputeData.oracleName,
        disputeData.feeAmount,
        disputeData.disputedAmount,
      ],
      nativeOptions
    );

    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));
    emit(`Dispute submitted: ${tx.transactionHash}`);
    saveTxHash('raiseDispute', tx.transactionHash, disputeData.jobId, chainId, userAddress);
    console.log(`[raiseDispute] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[raiseDispute] error:", error);
    throw error;
  }
}

// ==================== PROFILE OPERATIONS ====================

/**
 * Create user profile on local chain
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {object}   profileData  - { ipfsHash, referrerAddress }
 * @param {Function} [onStatus]
 */
export async function createProfile(chainId, userAddress, profileData, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);
    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.DEFAULT);
    const referrerAddress = profileData.referrerAddress || "0x0000000000000000000000000000000000000000";
    if (!profileData.ipfsHash) throw new Error("Profile IPFS hash is required");
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'address'],
        ['createProfile', userAddress, profileData.ipfsHash, referrerAddress]
      );
      lzFee = await estimateLayerZeroFee(chainId, "DEFAULT", { encodedPayload, nativeOptions });
    }

    emit(`Creating profile on ${config.name} — confirm in wallet...`);
    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.CREATE_PROFILE,
      [
        profileData.ipfsHash,
        referrerAddress,
      ],
      nativeOptions
    );
    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));

    emit(`Profile created: ${tx.transactionHash}`);
    console.log(`[createProfile] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[createProfile] error:", error);
    throw error;
  }
}

/**
 * Add portfolio item
 * @param {number}   chainId
 * @param {string}   userAddress
 * @param {string}   portfolioHash
 * @param {Function} [onStatus]
 */
export async function addPortfolio(chainId, userAddress, portfolioHash, onStatus) {
  const emit = onStatus || (() => {});
  try {
    const contract = await getLOWJCContract(chainId);
    const config   = getChainConfig(chainId);
    const native   = isNativeArbChain(chainId);
    const nativeOptions = native ? null : buildLzOptions(DESTINATION_GAS_ESTIMATES.DEFAULT);
    let lzFee = "0";
    if (!native) {
      emit("Estimating LayerZero fee...");
      const quoteWeb3 = getReadOnlyWeb3(chainId);
      const encodedPayload = quoteWeb3.eth.abi.encodeParameters(
        ['string', 'address', 'string'],
        ['addPortfolio', userAddress, portfolioHash]
      );
      lzFee = await estimateLayerZeroFee(chainId, "DEFAULT", { encodedPayload, nativeOptions });
    }

    emit(`Adding portfolio on ${config.name} — confirm in wallet...`);
    const method = createLOWJCWrite(
      contract,
      config,
      LOWJC_OPERATIONS.ADD_PORTFOLIO,
      [portfolioHash],
      nativeOptions
    );
    const tx = await method.send(await buildEstimatedWriteSendOptions(method, config, {
      from: userAddress,
      value: lzFee,
    }));

    emit(`Portfolio added: ${tx.transactionHash}`);
    console.log(`[addPortfolio] confirmed on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("[addPortfolio] error:", error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Approve USDC for contract spending
 * @param {number} chainId - Chain ID
 * @param {string} userAddress - User's address
 * @param {string} spender - Contract address to approve
 * @param {string} amount - Amount in USDC units (not wei)
 */
export async function approveUSDC(chainId, userAddress, spender, amount) {
  try {
    const config = getChainConfig(chainId);
    if (!config || !config.contracts.usdc) {
      throw new Error("USDC not configured for this chain");
    }
    
    const web3 = new Web3(window.ethereum);
    
    // Standard ERC20 ABI for approve function
    const erc20ABI = [
      {
        "inputs": [
          {"name": "spender", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    const usdcContract = new web3.eth.Contract(erc20ABI, config.contracts.usdc);
    
    const tx = await usdcContract.methods.approve(spender, amount).send({
      from: userAddress,
      gas: 100000
    });
    
    console.log(`USDC approved on ${config.name}:`, tx.transactionHash);
    return tx;
  } catch (error) {
    console.error("USDC approval error:", error);
    throw error;
  }
}

/**
 * Check if user is on a supported local chain
 * @param {number} chainId - Chain ID
 * @returns {object} { isSupported, message }
 */
export function validateChain(chainId) {
  const config = getChainConfig(chainId);
  
  if (!config) {
    const localChains = getLocalChains();
    const chainNames = localChains.map(c => c.name).join(' or ');
    return {
      isSupported: false,
      message: `This network is not supported. Please switch to ${chainNames || 'a supported network'}.`
    };
  }
  
  if (!isChainAllowed(chainId)) {
    return {
      isSupported: false,
      message: config.reason || "Transactions not allowed on this network."
    };
  }
  
  return {
    isSupported: true,
    message: `Connected to ${config.name}`
  };
}

/**
 * Get contract address for current chain
 * @param {number} chainId - Chain ID
 * @param {string} contractType - Contract type ("lowjc", "athenaClient", etc.)
 * @returns {string|null} Contract address or null
 */
export function getContractAddress(chainId, contractType) {
  const config = getChainConfig(chainId);
  return config?.contracts?.[contractType] || null;
}

export default {
  postJob,
  applyToJob,
  startJob,
  submitWork,
  releasePaymentCrossChain,
  raiseDispute,
  createProfile,
  addPortfolio,
  approveUSDC,
  validateChain,
  getContractAddress,
  getLOWJCContract,
  getAthenaClientContract
};
