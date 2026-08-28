import { applyTxTimeouts, explainSendFailure, findStuckTransaction, watchPendingTransaction, verifyBroadcast, buildFeeOverrides } from '../../services/txReliability';
import { walletAuthHeaders } from '../../services/uploadAuth';
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import contractABI from "../../ABIs/nowjc_ABI.json";
import lowjcABI from "../../ABIs/lowjc_ABI.json";
import "./ReleasePayment.css";
import PaymentItem from "../../components/PaymentItem/PaymentItem";
import DropDown from "../../components/DropDown/DropDown";
import Warning from "../../components/Warning/Warning";
import Milestone from "../../components/Milestone/Milestone";
import BlueButton from "../../components/BlueButton/BlueButton";
import { useChainDetection, useWalletAddress } from "../../hooks/useChainDetection";
import { getChainConfig, extractChainIdFromJobId, getNativeChain, isMainnet, buildLzOptions, DESTINATION_GAS_ESTIMATES } from "../../config/chainConfig";
import { switchToChain } from "../../utils/switchNetwork";
import {
  getLOWJCContract,
  getReadOnlyLOWJCContract,
  isNativeArbChain,
} from "../../services/localChainService";
import {
  LOWJC_OPERATIONS,
  buildEstimatedWriteSendOptions,
  createLOWJCWrite,
} from "../../services/contractWriteRouter";
import CrossChainStatus, { buildPaymentSteps } from "../../components/CrossChainStatus/CrossChainStatus";
import { monitorLZMessage, monitorCCTPTransfer, STATUS, pollOnChainJobState, pollNowjcUSDCBalance } from "../../utils/crossChainMonitor";
import { preflightRelay } from "../../services/relayReadiness";

const OPTIONS = [
  'Milestone 1','Milestone 2','Milestone 3'
]

function JobdetailItem ({title, icon , amount}) {
  return (
    <div className="job-detail-item">
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <span className="job-detail-item-title">{title}</span>
        {icon && <img src="/fee.svg" alt="" />}
      </div>
      <div id="fetchedAmounts">
          {amount}{" "}
        <img src="/xdc.svg" alt="USDC" className="usdc-iconJD" />
      </div>
    </div>
  )
}

export default function ReleasePayment() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [note, setNote] = useState("");
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();
  const [loadingT, setLoadingT] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState("Click to release milestone payment");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [currentMilestoneNumber, setCurrentMilestoneNumber] = useState(1);
  const [cctpStatus, setCctpStatus] = useState(null);
  // Client-side cross-chain status tracking (fallback when backend is down)
  const [paymentStepState, setPaymentStepState] = useState(null);
  // Set when a send is unresolved and resending could pay twice. Drives the
  // buttons, so the UI never tells the user "do not resend" beside a live button.
  const [retryBlocked, setRetryBlocked] = useState(false);

  // Multi-chain hooks
  const { chainId: userChainId, chainConfig: userChainConfig } = useChainDetection();
  const { address: walletAddress, connect: connectWallet } = useWalletAddress();
  
  // Get job posting chain from jobId
  const jobChainId = jobId ? extractChainIdFromJobId(jobId) : null;
  const jobChainConfig = jobChainId ? getChainConfig(jobChainId) : null;

  const [copiedAddress, setCopiedAddress] = useState(null);

  function formatWalletAddressH(address) {
    if (!address) return "";
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }


  const handleCopyToClipboard = (address) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  function formatWalletAddress(address) {
    if (!address) return "";
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setDropdownVisible(false);
  };

  useEffect(() => {
    async function fetchJobDetails() {
      try {

        // Use NOWJC contract on Arbitrum (dynamic based on network mode)
        const nativeChain = getNativeChain();
        const rpcUrl = isMainnet()
          ? import.meta.env.VITE_ARBITRUM_MAINNET_RPC_URL
          : import.meta.env.VITE_ARBITRUM_MAINNET_RPC_URL || 'https://arb1.arbitrum.io/rpc';
        const contractAddress = nativeChain.contracts.nowjc;


        const web3 = new Web3(rpcUrl);
        const contract = new web3.eth.Contract(contractABI, contractAddress);

        // Fetch job details from NOWJC contract
        const jobData = await contract.methods.getJob(jobId).call();
        
        // Check if job exists (id should not be empty)
        if (!jobData.id || jobData.id === "") {
          console.warn("Job not found or not synced yet");
          setJob(null);
          setLoading(false);
          return;
        }

        // Fetch job details from IPFS
        let jobDetails = {};
        try {
          if (jobData.jobDetailHash) {
            jobDetails = await fetchFromIPFS(jobData.jobDetailHash);
          }
        } catch (ipfsError) {
          console.warn("Failed to fetch IPFS data:", ipfsError);
        }

        // Calculate amounts from milestone payments (USDC with 6 decimals)
        const totalBudget = jobData.milestonePayments.reduce((sum, milestone) => {
          return sum + parseFloat(milestone.amount);
        }, 0);
        
        const totalBudgetUSDC = (totalBudget / 1000000).toFixed(2); // Convert from USDC units

        // Get current milestone information from contract data
        const currentMilestone = jobData.currentMilestone ? Number(jobData.currentMilestone) : 0;
        const totalPaid = jobData.totalPaid || "0";
        
        // Parse milestone payments properly - use finalMilestones if applicant was selected
        const milestonePayments = jobData.finalMilestones && jobData.finalMilestones.length > 0 
          ? jobData.finalMilestones 
          : jobData.milestonePayments;
        
        // Calculate current locked amount based on milestone progress
        // The locked amount is the amount for the current milestone that hasn't been released yet
        let currentLockedAmount = "0";
        
        // Check if we have a current milestone that's been locked
        if (currentMilestone > 0 && currentMilestone <= milestonePayments.length) {
          // Calculate how much should have been paid up to the previous milestone
          const previousMilestonesTotal = milestonePayments
            .slice(0, currentMilestone - 1)
            .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
          
          // If total paid equals previous milestones total, current milestone is locked
          // If total paid is less, we might have unreleased previous milestones
          const totalPaidNum = parseFloat(totalPaid);
          if (totalPaidNum >= previousMilestonesTotal) {
            // Current milestone is locked if we haven't paid it yet
            const currentMilestoneAmount = parseFloat(milestonePayments[currentMilestone - 1].amount || 0);
            if (totalPaidNum < previousMilestonesTotal + currentMilestoneAmount) {
              currentLockedAmount = milestonePayments[currentMilestone - 1].amount;
            }
          }
        }
        
        // Calculate releasable amount - it's the currently locked amount
        const releasableAmount = (parseFloat(currentLockedAmount) / 1000000).toFixed(2);

        // Fetch the selected applicant's preferred chain domain (for CCTP payment destination)
        let applicantChainDomain = 2; // Default to Optimism
        if (jobData.selectedApplicant && jobData.selectedApplicant !== '0x0000000000000000000000000000000000000000') {
          try {
            applicantChainDomain = await contract.methods.jobApplicantChainDomain(jobId, jobData.selectedApplicant).call();
            applicantChainDomain = Number(applicantChainDomain);
          } catch (err) {
            console.warn('Could not fetch applicant chain domain, defaulting to Optimism (2):', err.message);
          }
        }

        setJob({
          jobId,
          jobGiver: jobData.jobGiver,
          selectedApplicant: jobData.selectedApplicant,
          applicantChainDomain, // Store the applicant's preferred chain domain
          jobStatus: Number(jobData.status), // Convert to number to match the status checks
          totalBudget: totalBudgetUSDC,
          currentMilestone,
          releasableAmount,
          milestonePayments,
          currentLockedAmount,
          totalReleased: totalPaid,
          title: jobDetails.title || `Job #${jobId}`,
          description: jobDetails.description || '',
          ...jobDetails,
        });

        if (Number(jobData.status) === 2) {
          setTransactionStatus('Payment release is recorded on OpenWork. No further payment action is required.');
        }
        
        // Set the current milestone number (already 1-indexed from contract, 0 means no milestone)
        setCurrentMilestoneNumber(currentMilestone);

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching job details:", error);
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // Poll CCTP status for release payment
  useEffect(() => {
    if (!jobId) return;

    const pollCCTPStatus = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const response = await fetch(`${backendUrl}/api/cctp-status/releasePayment/${jobId}`);
        const data = await response.json();
        
        if (data.found) {
          setCctpStatus(data);
        }
      } catch (error) {
        console.warn('CCTP status poll error:', error);
      }
    };

    pollCCTPStatus();
    const interval = setInterval(pollCCTPStatus, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [jobId]);

  // Multi-gateway IPFS fetch function
  const fetchFromIPFS = async (hash, timeout = 5000) => {
    const gateways = [
      `https://ipfs.io/ipfs/${hash}`,
      `/api/ipfs/content/${hash}`,
      `https://dweb.link/ipfs/${hash}`,
      `https://w3s.link/ipfs/${hash}`
    ];

    const fetchWithTimeout = (url, timeout) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    };

    for (const gateway of gateways) {
      try {
        const response = await fetchWithTimeout(gateway, timeout);
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error.message);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch ${hash} from all gateways`);
  };

  const handleNavigation = () => {
    window.open("https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view", "_blank");
  };

  const formatAmount = (amount) => {
    if (parseFloat(amount) === 0) return "0"; // Handle zero value without decimal
    const roundedAmount = parseFloat(amount).toFixed(2); // Rounds to 2 decimal places
    return roundedAmount.length > 5 ? roundedAmount.slice(0, 8) : roundedAmount;
  };

  // Helper to safely convert BigInt to Number
  const safeNumber = (value) => {
    if (typeof value === 'bigint') return Number(value);
    return parseFloat(value) || 0;
  };

 
  // Simplified payment release flow - backend handles CCTP processing
  const handleReleasePayment = async () => {
    if (!walletAddress) {
      setTransactionStatus("❌ Please connect your wallet first");
      return;
    }

    if (!job) {
      setTransactionStatus("❌ Job data not loaded");
      return;
    }

    if (
      job.jobGiver
      && walletAddress.toLowerCase() !== job.jobGiver.toLowerCase()
    ) {
      setTransactionStatus("❌ Only the job giver can release this payment. Connect the job-giver wallet and try again.");
      return;
    }

    // CRITICAL: Validate user is on POSTING chain
    if (!jobChainId || !jobChainConfig) {
      setTransactionStatus("❌ Could not determine job posting chain from job ID");
      return;
    }

    if (userChainId !== jobChainId) {
      setTransactionStatus(`⚠️ Please switch to ${jobChainConfig.name} to release payment. ReleasePayment must be called from the posting chain.`);
      try {
        await switchToChain(jobChainId);
        setTransactionStatus(`Switched to ${jobChainConfig.name}. Please try again.`);
      } catch (switchError) {
        setTransactionStatus(`❌ Failed to switch to ${jobChainConfig.name}: ${switchError.message}`);
      }
      return;
    }

    try {
      if (retryBlocked) return;
      setIsProcessing(true);
      setTransactionStatus(`🔄 Step 1/2: Releasing payment on ${jobChainConfig.name}...`);
      
      const web3 = new Web3(window.ethereum);
      // Arbitrum produces a block every ~0.25s, so web3's default block timeout
      // is roughly 12–20 seconds and the countdown starts before the user has
      // confirmed in their wallet. Without this, a healthy payment reports
      // "not mined within 80 blocks" while still in the MetaMask prompt.
      applyTxTimeouts(web3, jobChainId);

      // A queued earlier transaction is the most common reason a payment appears
      // to hang. Say so up front instead of letting it look like a failure.
      const stuck = await findStuckTransaction(web3, walletAddress);
      if (stuck.stuck) {
        setTransactionStatus(`⏳ ${stuck.message}`);
        setIsProcessing(false);
        return;
      }

      const lowjcContract = await getLOWJCContract(jobChainId);
      const isNativeArbitrum = isNativeArbChain(jobChainId);
      
      // Get the amount to release - it's the current milestone amount
      let amount = "0";
      if (job.currentMilestone > 0 && job.currentMilestone <= job.milestonePayments.length) {
        amount = job.milestonePayments[job.currentMilestone - 1].amount.toString();
      }
      
      const nativeOptions = isNativeArbitrum
        ? null
        : buildLzOptions(DESTINATION_GAS_ESTIMATES.RELEASE_PAYMENT);

      // Get the applicant's preferred chain domain (fetched from NOWJC)
      const destinationDomain = job.applicantChainDomain || 2; // Default to Optimism if not set

      const relayReadiness = await preflightRelay(
        { action: 'releasePayment', sourceChainId: jobChainId, targetDomain: destinationDomain },
        (update) => setTransactionStatus(update?.message || 'Checking automatic USDC delivery…'),
      );
      if (relayReadiness.required && !relayReadiness.ready) {
        throw new Error('Automatic USDC delivery is not ready. Open this job in Oppy Chat for wallet-assisted recovery, or try again after the relayer is funded.');
      }

      let layerZeroFee;
      if (!isNativeArbitrum) {
        setTransactionStatus("💰 Getting LayerZero quote...");
        const bridgeAddress = await lowjcContract.methods.bridge().call();
        const bridgeABI = [{
          "inputs": [
            {"type": "bytes", "name": "_payload"},
            {"type": "bytes", "name": "_options"}
          ],
          "name": "quoteNativeChain",
          "outputs": [{"type": "uint256", "name": "fee"}],
          "stateMutability": "view",
          "type": "function"
        }];
        const bridgeContract = new web3.eth.Contract(bridgeABI, bridgeAddress);
        const payload = web3.eth.abi.encodeParameters(
          ['string', 'address', 'string', 'uint256', 'uint32', 'address'],
          ['releasePaymentCrossChain', walletAddress, jobId, amount, destinationDomain, job.selectedApplicant]
        );
        layerZeroFee = (await bridgeContract.methods
          .quoteNativeChain(payload, nativeOptions)
          .call()).toString();

        const nativeSymbol = jobChainConfig.nativeCurrency?.symbol || 'ETH';
        setTransactionStatus(`💰 Network fee: ~${parseFloat(web3.utils.fromWei(layerZeroFee, 'ether')).toFixed(5)} ${nativeSymbol} — Please confirm in MetaMask`);
      } else {
        setTransactionStatus(`Releasing payment directly through Arbitrum — Please confirm in MetaMask`);
      }

      const releaseMethod = createLOWJCWrite(
        lowjcContract,
        jobChainConfig,
        LOWJC_OPERATIONS.RELEASE_PAYMENT,
        [jobId, destinationDomain, job.selectedApplicant],
        nativeOptions
      );

      let releaseSendOptions;
      if (isNativeArbitrum) {
        // Native Arbitrum writes do not need a LayerZero fee. Estimate the
        // exact call through the configured public RPC, then let MetaMask set
        // EIP-1559/legacy fee fields when it opens the confirmation screen.
        // This keeps wallet provider middleware out of the read-only preflight
        // path and avoids generic "Internal JSON-RPC error" failures.
        const readOnlyLowjcContract = await getReadOnlyLOWJCContract(jobChainId);
        const readOnlyReleaseMethod = createLOWJCWrite(
          readOnlyLowjcContract,
          jobChainConfig,
          LOWJC_OPERATIONS.RELEASE_PAYMENT,
          [jobId, destinationDomain, job.selectedApplicant],
          nativeOptions
        );
        releaseSendOptions = await buildEstimatedWriteSendOptions(
          readOnlyReleaseMethod,
          jobChainConfig,
          { from: walletAddress }
        );
        // Set the fee ceiling from the chain's live base fee rather than letting
        // the wallet pad it. On Arbitrum the wallet's default reserves roughly a
        // hundred times the real cost and then refuses the transaction for
        // insufficient funds against a balance that could pay it many times over.
        const feeOverrides = await buildFeeOverrides(
          new Web3(jobChainConfig.rpcUrl)
        );
        releaseSendOptions = { ...releaseSendOptions, ...feeOverrides };
      } else {
        const gasPrice = await web3.eth.getGasPrice();
        releaseSendOptions = await buildEstimatedWriteSendOptions(
          releaseMethod,
          jobChainConfig,
          {
            from: walletAddress,
            value: layerZeroFee,
            gasPrice: gasPrice.toString()
          }
        );
      }

      // Do not wait for send() to settle before diagnosing. A wallet that
      // cannot reach its RPC will retry internally for minutes, and the user is
      // left staring at a spinner. As soon as a hash exists, independently check
      // that the network actually received it, in parallel with the send.
      const releaseSend = releaseMethod.send(releaseSendOptions);
      releaseSend.on?.('transactionHash', (hash) => {
        setTransactionStatus(`🔄 Submitted ${String(hash).slice(0, 10)}… confirming the network received it...`);
        verifyBroadcast(web3, hash)
          .then((reachedNetwork) => {
            if (!reachedNetwork) {
              setTransactionStatus(
                `⚠️ Your wallet reported this transaction but the network never received it, so nothing was charged and nothing changed on-chain. This is usually a bad RPC endpoint in your wallet's network settings. Check it, then retry.`
              );
              setIsProcessing(false);
              setRetryBlocked(false);
            }
          })
          .catch(() => { /* inconclusive; the normal paths still apply */ });
      });

      const releasePaymentTx = await releaseSend;

      if (isNativeArbitrum) {
        setPaymentStepState(null);
        setTransactionStatus('🎉 Milestone release confirmed directly on Arbitrum! Reloading...');
        setIsProcessing(false);
        setTimeout(() => window.location.reload(), 2500);
        return;
      }


      // ── Client-side cross-chain monitoring (no backend needed) ────────────
      const srcTxHash    = releasePaymentTx.transactionHash;
      const srcChainId   = jobChainId;
      const lzLink       = `https://layerzeroscan.com/tx/${srcTxHash}`;
      const circleLink   = `https://iris-api.circle.com/v2/messages/${jobChainConfig?.cctpDomain ?? 2}?transactionHash=${srcTxHash}`;

      // ── Fetch FRESH baseline from chain (never trust stale in-memory job state) ──
      // If a previous flow (lock, release) happened without a page reload,
      // job.currentMilestone may be stale and would cause the poller to fire instantly.
      const nativeChain    = getNativeChain();
      const arbRpcUrl      = import.meta.env.VITE_ARBITRUM_MAINNET_RPC_URL || 'https://arb1.arbitrum.io/rpc';
      const nowjcAddress   = nativeChain.contracts.nowjc;
      const arbWeb3        = new Web3(arbRpcUrl);

      let baselineMilestone = job.currentMilestone || 0;
      let baselinePaid      = job.totalPaid || '0';
      try {
        const freshContract = new arbWeb3.eth.Contract(contractABI, nowjcAddress);
        const freshJob = await freshContract.methods.getJob(jobId).call();
        baselineMilestone = Number(freshJob.currentMilestone || 0);
        baselinePaid      = String(freshJob.totalPaid || '0');
      } catch (e) {
        console.warn('[release] Could not fetch fresh baseline, using in-memory job state:', e.message);
      }

      // Initialise steps immediately so the UI renders right away
      setPaymentStepState({
        sourceChainId: srcChainId,
        sourceTxHash: srcTxHash,
        lzStatus: 'active',
        lzLink,
        circleLink,
      });

      // ── Ground-truth: poll NOWJC on Arbitrum ────────────────────────────
      // When currentMilestone advances past the fresh baseline, payment is done.
      const stopOnChainPoll = pollOnChainJobState(
        arbWeb3,
        nowjcAddress,
        contractABI,
        jobId,
        { milestone: baselineMilestone, totalPaid: baselinePaid, mode: 'payment' },
        (result) => {
          // Chain confirmed — override whatever LZ/CCTP showed
          setPaymentStepState(prev => ({
            ...prev,
            lzStatus: prev.lzStatus === 'active' ? 'delivered' : prev.lzStatus,
            cctpAttestationStatus: 'complete',
          }));
          setTransactionStatus('🎉 Milestone payment confirmed on-chain! Reloading...');
          setIsProcessing(false);
          setTimeout(() => window.location.reload(), 2500);
        },
        { pollInterval: 10000, maxAttempts: 60 }
      );

      // ── LZ + CCTP visual steps (UX only — ground truth is above) ────────
      monitorLZMessage(srcTxHash, (lzUpdate) => {
        setPaymentStepState(prev => ({
          ...prev,
          lzStatus:   lzUpdate.status === STATUS.SUCCESS ? 'delivered'
                    : lzUpdate.status === STATUS.FAILED  ? 'failed'
                    : 'active',
          lzLink:     lzUpdate.lzLink || lzLink,
          lzDstTxHash: lzUpdate.dstTxHash,
          lzDstChainId: 42161,
          cctpBurnTxHash: lzUpdate.dstTxHash || prev?.cctpBurnTxHash,
          cctpSourceDomain: 3,
        }));

        // When LZ delivers, start CCTP visual monitor
        // Note: if dstTxHash is wrong/null this may not resolve — that's OK,
        // the on-chain poller above is the real completion signal.
        if (lzUpdate.status === STATUS.SUCCESS && lzUpdate.dstTxHash) {
          monitorCCTPTransfer(
            lzUpdate.dstTxHash,
            3,
            (cctpUpdate) => {
              setPaymentStepState(prev => ({
                ...prev,
                cctpAttestationStatus: cctpUpdate.status === STATUS.SUCCESS ? 'complete'
                                     : cctpUpdate.message?.includes('slow')  ? 'slow'
                                     : 'pending',
                circleLink: cctpUpdate.circleLink || circleLink,
              }));
            },
            () => {
              setPaymentStepState(prev => ({ ...prev, cctpAttestationStatus: 'complete' }));
            }
          );
        }
      });
      // ─────────────────────────────────────────────────────────────────────

      // Step 2: Also notify backend for server-side CCTP relay (belt + suspenders)
      setTransactionStatus(`🔄 Waiting for LayerZero message to reach Arbitrum...`);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      try {
        const response = await fetch(`${backendUrl}/api/release-payment`, {
          method: 'POST',
          headers: {
          ...(await walletAuthHeaders()), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            opSepoliaTxHash: srcTxHash
          })
        });
        const result = await response.json();
        if (result.success) {
          const statusKey = result.statusKey || jobId;
          pollPaymentStatus(statusKey, backendUrl);
        }
      } catch (backendErr) {
        // Backend is down — that's OK, client-side monitor is running
        console.warn('⚠️ Backend unavailable, relying on client-side monitoring:', backendErr.message);
        setTransactionStatus('⚠️ Backend offline — tracking cross-chain status directly via LayerZero & Circle APIs');
      }

    } catch (error) {
      console.error("❌ Error releasing payment:", error);
      
      const nestedErrorMessage =
        error?.data?.originalError?.message
        || error?.data?.message
        || error?.cause?.message;
      let errorMessage = nestedErrorMessage || error.message || "Wallet transaction failed";
      const normalizedErrorMessage = String(errorMessage).toLowerCase();
      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (normalizedErrorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (normalizedErrorMessage.includes("network")) {
        errorMessage = "Network switching failed - please switch to OP Sepolia manually";
      } else {
        // A block-timeout is not an outcome — it only means the app stopped
        // watching. Ask the chain what actually happened, so the user is told
        // whether their money moved and whether retrying is safe, rather than
        // "it might still be mined".
        try {
          const diagnosticWeb3 = new Web3(window.ethereum);
          applyTxTimeouts(diagnosticWeb3, jobChainId);
          const verdict = await explainSendFailure(diagnosticWeb3, error);
          if (verdict.outcome !== 'unknown') {
            const label =
              verdict.outcome === 'succeeded' ? '✅'
              : verdict.outcome === 'pending' ? '⏳'
              : '⚠️';
            setTransactionStatus(`${label} ${verdict.message}`);
            setIsProcessing(false);
            // Block the buttons whenever resending could double-pay, so the
            // warning and the controls agree.
            setRetryBlocked(!verdict.safeToRetry);

            if (verdict.outcome === 'succeeded') {
              setTimeout(() => window.location.reload(), 4000);
            } else if (verdict.outcome === 'pending' && verdict.txHash) {
              // Pending is not an outcome. Keep watching so the user is not left
              // with a "do not resend" warning after the transaction has quietly
              // been dropped and retrying has become safe again.
              watchPendingTransaction(diagnosticWeb3, verdict.txHash, (resolved) => {
                const resolvedLabel =
                  resolved.outcome === 'succeeded' ? '✅'
                  : resolved.outcome === 'pending' ? '⏳'
                  : '⚠️';
                setTransactionStatus(`${resolvedLabel} ${resolved.message}`);
                setRetryBlocked(!resolved.safeToRetry);
                if (resolved.outcome === 'succeeded') {
                  setTimeout(() => window.location.reload(), 4000);
                }
              }).catch((watchError) => {
                console.warn('Stopped watching the pending transaction:', watchError);
              });
            }
            return;
          }
        } catch (diagnosisError) {
          console.warn('Could not classify the transaction outcome:', diagnosisError);
        }
      }

      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  // Poll backend for status updates using unique statusKey per release
  const pollPaymentStatus = async (statusKey, backendUrl, maxAttempts = 60) => {
    let attempts = 0;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setTransactionStatus("⏱️ Cross-chain transfer is taking longer than expected (~5 min). The payment is being processed — check the LayerZero tracker above or refresh in a few minutes.");
          setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/release-payment-status/${statusKey}`);
        const status = await response.json();
        
        if (status.status === 'completed') {
          setTransactionStatus("🎉 Milestone payment released successfully to the applicant!");
          setIsProcessing(false);
          setTimeout(() => window.location.reload(), 3000);
          return;
        } else if (status.status === 'failed') {
          setTransactionStatus(`❌ Payment failed: ${status.error || status.message || 'Unknown error'}`);
          setIsProcessing(false);
          return;
        } else if (status.error) {
          setTransactionStatus(`❌ Error: ${status.error}`);
          setIsProcessing(false);
          return;
        } else if (status.status === 'waiting_for_event') {
          setTransactionStatus(`⏳ Waiting for LayerZero message to reach Arbitrum...`);
          attempts++;
          setTimeout(checkStatus, 5000);
        } else if (status.status === 'polling_attestation') {
          setTransactionStatus(`🔄 Polling Circle API for CCTP attestation...`);
          attempts++;
          setTimeout(checkStatus, 5000);
        } else if (status.status === 'executing_receive') {
          setTransactionStatus(`🔗 Executing CCTP transfer to recipient's chain...`);
          attempts++;
          setTimeout(checkStatus, 5000);
        } else {
          // Still processing
          setTransactionStatus(`🔄 ${status.message || 'Processing...'}`);
          attempts++;
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.warn("Status check failed:", error);
        if (attempts > 10) {
          setTransactionStatus(`⚠️ Connection issue: ${error.message}`);
        }
        attempts++;
        setTimeout(checkStatus, 5000);
      }
    };
    
    setTimeout(checkStatus, 5000); // Start checking after 5 seconds
  };

  // Poll backend for lock milestone CCTP relay status
  const pollLockMilestoneStatus = async (statusKey, sourceTxHash, backendUrl) => {
    const maxAttempts = 60; // 60 x 5s = 5 minutes
    let attempts = 0;

    return new Promise((resolve) => {
      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          setTransactionStatus(`⏱️ CCTP relay still processing. Lock TX: ${sourceTxHash}. Check back later or retry.`);
          resolve();
          return;
        }

        try {
          const response = await fetch(`${backendUrl}/api/lock-milestone-status/${statusKey}`);
          const status = await response.json();

          if (status.status === 'completed') {
            const completionHash = status.completionTxHash && status.completionTxHash !== 'already_completed'
              ? ` CCTP TX: ${status.completionTxHash.substring(0, 10)}...`
              : '';
            setTransactionStatus(`✅ Milestone ${job.currentMilestone + 1} locked and USDC delivered to NOWJC!${completionHash} Reloading...`);
            setTimeout(() => window.location.reload(), 2500);
            resolve();
            return;
          } else if (status.status === 'failed') {
              // Backend relay failed — Circle's own relayer may still deliver.
              // On-chain poller above is the real completion gate; don't scare the user.
              console.warn('[lock-milestone] Backend relay failed:', status.error);
              setTransactionStatus(`🔒 Milestone locked. USDC processing via Circle network (backend relay unavailable)...`);
              resolve();
              return;
          } else if (status.status === 'polling_attestation') {
            setTransactionStatus(`🔄 Milestone locked. Polling Circle API for CCTP attestation...`);
          } else if (status.status === 'executing_receive') {
            setTransactionStatus(`🔗 Attestation received. Executing CCTP receive on Arbitrum...`);
          } else {
            setTransactionStatus(`🔄 ${status.message || 'CCTP relay processing...'}`);
          }
        } catch (error) {
          console.warn("Lock milestone status check failed:", error.message);
        }

        attempts++;
        setTimeout(checkStatus, 5000);
      };

      setTimeout(checkStatus, 3000); // Start after 3 seconds
    });
  };

  // Lock next milestone function
  const handleLockNextMilestone = async () => {
    if (!walletAddress) {
      setTransactionStatus("❌ Please connect your wallet first");
      return;
    }

    if (!job) {
      setTransactionStatus("❌ Job data not loaded");
      return;
    }

    // CRITICAL: Validate user is on POSTING chain
    if (!jobChainId || !jobChainConfig) {
      setTransactionStatus("❌ Could not determine job posting chain from job ID");
      return;
    }

    if (userChainId !== jobChainId) {
      setTransactionStatus(`⚠️ Please switch to ${jobChainConfig.name} to lock milestone. LockNextMilestone must be called from the posting chain.`);
      try {
        await switchToChain(jobChainId);
        setTransactionStatus(`Switched to ${jobChainConfig.name}. Please try again.`);
      } catch (switchError) {
        setTransactionStatus(`❌ Failed to switch to ${jobChainConfig.name}: ${switchError.message}`);
      }
      return;
    }

    try {
      setIsLocking(true);
      setTransactionStatus(`🔒 Locking Milestone ${job.currentMilestone + 1} on ${jobChainConfig.name}...`);
      
      const USDC_ADDRESS = jobChainConfig.contracts.usdc;
      const LOWJC_ADDRESS = jobChainConfig.contracts.lowjc;
      const web3 = new Web3(window.ethereum);
      // Same short-block-timeout problem as the release path above.
      applyTxTimeouts(web3, jobChainId);
      const isNativeArbitrum = isNativeArbChain(jobChainId);

      // Get next milestone amount from job data
      const nextMilestoneIndex = job.currentMilestone; // Already 0-indexed from contract
      if (nextMilestoneIndex >= job.milestonePayments.length) {
        setTransactionStatus("❌ No more milestones to lock");
        setIsLocking(false);
        return;
      }

      const nextMilestoneAmount = job.milestonePayments[nextMilestoneIndex].amount;

      await preflightRelay(
        { action: 'lockNextMilestone', sourceChainId: jobChainId, targetDomain: 3 },
        (update) => setTransactionStatus(update?.message || 'Checking automatic USDC delivery…'),
      );
      
      // Approve USDC spending
      setTransactionStatus("💰 Approving USDC spending - Please confirm in MetaMask");
      const usdcContract = new web3.eth.Contract(
        [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
        USDC_ADDRESS
      );
      
      await usdcContract.methods.approve(LOWJC_ADDRESS, nextMilestoneAmount).send({
        from: walletAddress,
        gas: 100000 // Set reasonable gas limit for approve
      });

      
      const lowjcContract = await getLOWJCContract(jobChainId);

      const nativeOptions = isNativeArbitrum
        ? null
        : buildLzOptions(DESTINATION_GAS_ESTIMATES.LOCK_MILESTONE);
      let layerZeroFee;
      if (!isNativeArbitrum) {
        setTransactionStatus("🔒 Getting LayerZero quote...");
        const bridgeAddressLock = await lowjcContract.methods.bridge().call();
        const bridgeABILock = [{
          "inputs": [
            {"type": "bytes", "name": "_payload"},
            {"type": "bytes", "name": "_options"}
          ],
          "name": "quoteNativeChain",
          "outputs": [{"type": "uint256", "name": "fee"}],
          "stateMutability": "view",
          "type": "function"
        }];
        const bridgeContractLock = new web3.eth.Contract(bridgeABILock, bridgeAddressLock);
        const payloadLock = web3.eth.abi.encodeParameters(
          ['string', 'address', 'string', 'uint256'],
          ['lockNextMilestone', walletAddress, jobId, nextMilestoneAmount]
        );
        layerZeroFee = (await bridgeContractLock.methods
          .quoteNativeChain(payloadLock, nativeOptions)
          .call()).toString();
      }

      setTransactionStatus("🔒 Locking milestone - Please confirm in MetaMask");

      // Get current gas price from network
      const gasPriceLock = await web3.eth.getGasPrice();

      const lockMethod = createLOWJCWrite(
        lowjcContract,
        jobChainConfig,
        LOWJC_OPERATIONS.LOCK_NEXT_MILESTONE,
        [jobId],
        nativeOptions
      );
      const lockTx = await lockMethod.send(await buildEstimatedWriteSendOptions(lockMethod, jobChainConfig, {
        from: walletAddress,
        value: layerZeroFee,
        gasPrice: gasPriceLock.toString()
      }));

      if (isNativeArbitrum) {
        setPaymentStepState(null);
        setTransactionStatus(`🔒 Milestone ${job.currentMilestone + 1} locked directly on Arbitrum! Reloading...`);
        setIsLocking(false);
        setTimeout(() => window.location.reload(), 2500);
        return;
      }


      // ── Client-side monitoring for lock milestone ─────────────────────────
      const lockTxHash = lockTx.transactionHash;
      const lockLzLink = `https://layerzeroscan.com/tx/${lockTxHash}`;
      setPaymentStepState({
        sourceChainId: jobChainId,
        usdcApproved: true,
        sourceTxHash: lockTxHash,
        lzStatus: 'active',
        lzLink: lockLzLink,
        circleLink: `https://iris-api.circle.com/v2/messages/${jobChainConfig?.cctpDomain ?? 2}?transactionHash=${lockTxHash}`,
      });

      // ── Ground-truth: poll NOWJC USDC balance on Arbitrum ────────────────
      // lockNextMilestone deposits USDC into NOWJC via CCTP.
      // When NOWJC's USDC balance increases, the lock is confirmed — regardless
      // of which relay path delivered it.
      const nativeChainLock  = getNativeChain();
      const arbRpcUrlLock    = import.meta.env.VITE_ARBITRUM_MAINNET_RPC_URL || 'https://arb1.arbitrum.io/rpc';
      const nowjcAddressLock = nativeChainLock.contracts.nowjc;
      const usdcAddressLock  = nativeChainLock.contracts.usdc;
      const arbWeb3Lock      = new Web3(arbRpcUrlLock);

      // Snapshot NOWJC USDC balance before the lock lands
      let baselineUSDCBalance = '0';
      try {
        const erc20 = new arbWeb3Lock.eth.Contract(
          [{ "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
          usdcAddressLock
        );
        baselineUSDCBalance = String(await erc20.methods.balanceOf(nowjcAddressLock).call());
      } catch (e) {
        console.warn('[lock] Could not snapshot NOWJC USDC balance:', e.message);
      }

      pollNowjcUSDCBalance(
        arbWeb3Lock,
        usdcAddressLock,
        nowjcAddressLock,
        baselineUSDCBalance,
        (result) => {
          setPaymentStepState(prev => ({
            ...prev,
            lzStatus: prev.lzStatus === 'active' ? 'delivered' : prev.lzStatus,
            cctpAttestationStatus: 'complete',
          }));
          setTransactionStatus(`🔒 Milestone ${job.currentMilestone + 1} locked and confirmed on-chain! Reloading...`);
          setIsLocking(false);
          setTimeout(() => window.location.reload(), 2500);
        },
        { pollInterval: 10000, maxAttempts: 60 }
      );

      // ── LZ + CCTP visual steps (UX only) ─────────────────────────────────
      monitorLZMessage(lockTxHash, (lzUpdate) => {
        setPaymentStepState(prev => ({
          ...prev,
          lzStatus:     lzUpdate.status === STATUS.SUCCESS ? 'delivered'
                      : lzUpdate.status === STATUS.FAILED  ? 'failed'
                      : 'active',
          lzDstTxHash:  lzUpdate.dstTxHash,
          lzDstChainId: 42161,
          cctpBurnTxHash: lzUpdate.dstTxHash || prev?.cctpBurnTxHash,
          cctpSourceDomain: 3,
        }));
        if (lzUpdate.status === STATUS.SUCCESS && lzUpdate.dstTxHash) {
          monitorCCTPTransfer(lzUpdate.dstTxHash, 3,
            (cctpUpdate) => {
              setPaymentStepState(prev => ({
                ...prev,
                cctpAttestationStatus: cctpUpdate.status === STATUS.SUCCESS ? 'complete'
                                     : cctpUpdate.message?.includes('slow')  ? 'slow'
                                     : 'pending',
              }));
            },
            () => setPaymentStepState(prev => ({ ...prev, cctpAttestationStatus: 'complete' }))
          );
        }
      });
      // ─────────────────────────────────────────────────────────────────────

      // Also trigger backend relay (belt + suspenders)
      setTransactionStatus(`🔒 Milestone locked. Monitoring CCTP relay to Arbitrum...`);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      let lockStatusKey = null;

      try {
        const relayRes = await fetch(`${backendUrl}/api/lock-milestone`, {
          method: 'POST',
          headers: {
          ...(await walletAuthHeaders()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, txHash: lockTxHash })
        });
        const relayResult = await relayRes.json();
        lockStatusKey = relayResult.statusKey;
      } catch (err) {
        console.warn("⚠️ Backend CCTP relay request failed:", err.message);
        // Client-side monitor is still running — don't block the user
      }

      if (lockStatusKey) {
        await pollLockMilestoneStatus(lockStatusKey, lockTxHash, backendUrl);
      } else {
        setTransactionStatus(`🔒 Lock confirmed (${lockTxHash.substring(0,10)}...). Tracking cross-chain progress below.`);
      }
      setIsLocking(false);
      
    } catch (error) {
      console.error("❌ Error locking milestone:", error);
      
      let errorMessage = error.message;
      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds (need USDC + ETH for gas)";
      } else if (error.message.includes("network")) {
        errorMessage = "Network switching failed - please switch to OP Sepolia manually";
      }
      
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setIsLocking(false);
    }
  };

  // Loading states
  if (loadingT) {
    return (
      <div className="loading-containerT">
        <div className="loading-icon"><img src="/OWIcon.svg" alt="Loading..."/></div>
        <div className="loading-message">
          <h1 id="txText">Transaction in Progress</h1>
          <p id="txSubtext">If the transaction goes through, we'll redirect you to your contract</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/OWIcon.svg" alt="Loading..." className="loading-icon" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="loading-container">
        <div style={{textAlign: 'center'}}>
          <img src="/OWIcon.svg" alt="OpenWork" className="loading-icon" style={{marginBottom: '20px'}} />
          <h2>Job Not Found</h2>
          <p>Job {jobId} is not available or hasn't synced to Arbitrum yet.</p>
          <p>Please wait a moment for cross-chain sync to complete.</p>
          <Link to="/browse-jobs" style={{color: '#007bff', textDecoration: 'none', marginTop: '20px', display: 'inline-block'}}>
            Browse Jobs →
          </Link>
        </div>
      </div>
    );
  }

  const hasNextMilestone = (
    job.jobStatus !== 2 &&
    job.currentMilestone < job.milestonePayments.length
  );
  const hasPaymentAction = job.jobStatus !== 2 && (
    job.currentLockedAmount !== '0' || hasNextMilestone
  );

  return (
    <>
      <div className="newTitle">
         <div className="titleTop">
          <Link className="goBack" to={`/job-details/${jobId}`}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
          <div className="titleText" style={{fontWeight:'550'}}>{job.title || `Job #${jobId}`}</div>
         </div>
         <div className="titleBottom"><p>  Job ID:{" "}
         {jobId}
         </p><img src="/copy.svg" className="copyImage" onClick={() =>
                 handleCopyToClipboard(
                   jobId
                 )
               }
               />
               {copiedAddress === jobId && (
                 <span style={{ fontSize: '12px', color: '#38a169', marginLeft: '4px' }}>Copied!</span>
               )}
               </div>
       </div>

      <div className="release-payment-container">
        <div className="form-container-release">
          <div className="sectionTitle">
            <span id="rel-title">Release Payment</span>
          </div>
          <div className="release-payment-body">
            {/* Job Participants Section */}
            <div className="form-groupDC job-body">
              <div className="job-detail-sectionR">
                <div className="job-detail-item">
                  <span className="job-detail-item-title">JOB GIVER</span>
                  <div>{formatWalletAddressH(job.jobGiver)}</div>
                </div>
                <div className="job-detail-item">
                  <span className="job-detail-item-title">SELECTED APPLICANT</span>
                  <div>{job.selectedApplicant !== '0x0000000000000000000000000000000000000000' 
                    ? formatWalletAddressH(job.selectedApplicant) 
                    : 'Not Selected'}
                  </div>
                </div>
                <div className="job-detail-item">
                  <span className="job-detail-item-title">JOB STATUS</span>
                  <div>{job.jobStatus === 0 ? 'Open' : 
                        job.jobStatus === 1 ? 'In Progress' : 
                        job.jobStatus === 2 ? 'Completed' : 
                        job.jobStatus === 3 ? 'Cancelled' : 
                        `Unknown (${job.jobStatus})`}</div>
                </div>
                <div className="job-detail-item">
                  <span className="job-detail-item-title">POSTING CHAIN</span>
                  <div>{jobChainConfig?.name || 'Unknown'}</div>
                </div>
              </div>
            </div>
            {/* Budget Information */}
            <div className="form-groupDC job-body">
              <div className="job-detail-sectionR">
                <JobdetailItem 
                  title="TOTAL BUDGET" 
                  amount={job.totalBudget}
                />
                <JobdetailItem 
                  title="AMOUNT RELEASED" 
                  amount={formatAmount(safeNumber(job.totalReleased) / 1000000)}
                />
                <JobdetailItem 
                  title="AMOUNT LOCKED (RELEASABLE)" 
                  amount={job.currentLockedAmount && job.currentLockedAmount !== '0' 
                    ? formatAmount(safeNumber(job.currentLockedAmount) / 1000000) 
                    : '0'}
                />
                <JobdetailItem 
                  title={`CURRENT MILESTONE${job.currentMilestone > 0 ? ` (#${job.currentMilestone} of ${job.milestonePayments.length})` : ' (None Locked)'}`} 
                  amount={job.currentMilestone > 0 && job.currentMilestone <= job.milestonePayments.length 
                    ? formatAmount(safeNumber(job.milestonePayments[job.currentMilestone - 1].amount) / 1000000) 
                    : job.currentMilestone === 0 ? 'None' : 'Complete'}
                />
              </div>
            </div>
            <div className="form-groupDC">
              <DropDown 
                label={job.currentMilestone > 0 ? `Milestone ${job.currentMilestone}` : 'Select Milestone'} 
                options={job.milestonePayments.map((_, idx) => `Milestone ${idx + 1}`)} 
                customCSS="form-dropdown" 
                width={true}
              />
            </div>
            <div className="form-groupDC job-body">
              <div className="job-detail-sectionR">
                <JobdetailItem 
                  title={job.currentMilestone > 0 ? `MILESTONE ${job.currentMilestone} AMOUNT` : 'NO MILESTONE LOCKED'} 
                  icon={true} 
                  amount={job.currentMilestone > 0 && job.currentMilestone <= job.milestonePayments.length 
                    ? formatAmount(safeNumber(job.milestonePayments[job.currentMilestone - 1].amount) / 1000000) 
                    : '0'}
                />
                <JobdetailItem 
                  title="NEXT MILESTONE AMOUNT" 
                  icon={true} 
                  amount={job.currentMilestone < job.milestonePayments.length 
                    ? formatAmount(safeNumber(job.milestonePayments[job.currentMilestone].amount) / 1000000) 
                    : 'N/A'}
                />
              </div>
            </div>
            <div className="form-groupDC">
              
              <textarea
                placeholder="Add a note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {/* <button
              type="button"
              className="release-button"
              onClick={handleReleasePayment}
            >
              Release {releaseAmount}
              <img src="/xdc.svg" alt="USDC" className="usdc-icon" />
            </button> */}
            <div className="form-groupDC" style={{display:'flex', alignItems:'center', gap:'16px'}}>
              <BlueButton 
                label={isProcessing ? 'Processing...' : 'Release'} 
                amount={formatAmount(safeNumber(job.currentLockedAmount) / 1000000)} 
                style={{
                  width: '242px', 
                  justifyContent:'center', 
                  padding: '8px 16px', 
                  borderRadius: '12px',
                  opacity: (isProcessing || retryBlocked || job.jobStatus === 2 || job.currentLockedAmount === '0') ? 0.7 : 1,
                  cursor: (isProcessing || retryBlocked || job.jobStatus === 2 || job.currentLockedAmount === '0') ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleReleasePayment}
                disabled={isProcessing || job.jobStatus === 2 || job.currentLockedAmount === '0'}
              />
              <BlueButton 
                label={isLocking ? 'Locking...' : 'Lock Next'} 
                amount={hasNextMilestone ? formatAmount(safeNumber(job.milestonePayments[job.currentMilestone].amount) / 1000000) : '0'}
                style={{
                  width: '198px', 
                  justifyContent:'center', 
                  padding: '8px 16px', 
                  borderRadius: '12px',
                  opacity: (isLocking || retryBlocked || !hasNextMilestone) ? 0.7 : 1,
                  cursor: (isLocking || retryBlocked || !hasNextMilestone) ? 'not-allowed' : 'pointer'
                }}
                onClick={handleLockNextMilestone}
                disabled={isLocking || !hasNextMilestone}
              />
            </div>
            <div className="warning-form">
              <Warning content={transactionStatus} variant={job.jobStatus === 2 ? 'success' : 'warning'} />
            </div>
            
            {/* Permission Check */}
            {job.jobStatus !== 2 && walletAddress && job.jobGiver && walletAddress.toLowerCase() !== job.jobGiver.toLowerCase() && (
              <div className="warning-form">
                <Warning 
                  content="⚠️ Only the job giver can release payments. You are not the job giver for this job."
                  icon="/orange-warning.svg"
                />
              </div>
            )}
            
            {/* CCTP Status Warnings */}
            {cctpStatus?.status === 'pending' && (
              <div className="warning-form">
                <Warning 
                  content={`Cross-chain delivery is being verified (${cctpStatus.step || 'waiting for event'}). Do not submit another payment.`}
                  variant="info"
                />
              </div>
            )}

            {cctpStatus?.status === 'completed' && (
              <div className="warning-form">
                <Warning
                  content="Payment delivery confirmed on the destination chain."
                  variant="success"
                />
              </div>
            )}
            
            {cctpStatus?.status === 'failed' && (
              <div className="warning-form">
                <Warning
                  content={`Delivery verification is delayed. We will keep checking the destination chain automatically; do not submit another payment. ${cctpStatus.lastError || 'No additional details are available yet.'}`}
                  variant="warning"
                />
              </div>
            )}
            
            {hasPaymentAction && jobChainConfig && userChainId !== jobChainId && (
              <div className="warning-form">
                <Warning 
                  content={`⚠️ Payment operations require ${jobChainConfig.name}. You are on ${userChainConfig?.name || 'unknown chain'}. Please switch networks.`} 
                  icon="/triangle_warning.svg"
                />
              </div>
            )}

            {/* Client-side cross-chain progress tracker */}
            {paymentStepState && (
              <CrossChainStatus
                title="Payment cross-chain status"
                steps={buildPaymentSteps(paymentStepState)}
              />
            )}
          </div>
        </div>
        {/* <PaymentItem title="Payment 2" />
        <PaymentItem title="Payment 1" /> */}
        <div className="milestone-section-body">
            {job.milestonePayments.map((milestone, index) => (
              <Milestone 
                key={index}
                amount={formatAmount(safeNumber(milestone.amount) / 1000000)} 
                title={`Milestone ${index + 1}`} 
                date={milestone.dueDate || 'No due date'} 
                content={milestone.description || `Milestone ${index + 1} deliverables`} 
                editable={false}
                completed={index < job.currentMilestone}
                current={index === job.currentMilestone}
              />
            ))}
        </div>
      </div>
    </>
  );
}
