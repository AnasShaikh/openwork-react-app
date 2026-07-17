import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Web3 from "web3";
import contractABI from "../../ABIs/nowjc_ABI.json";
import athenaClientABI from "../../ABIs/athena-client_ABI.json";
import genesisABI from "../../ABIs/genesis_ABI.json";
import nativeAthenaABI from "../../ABIs/native-athena_ABI.json";
import "./RaiseDispute.css";
import { formatWalletAddress } from "../../functions/formatWalletAddress";
import BackButton from "../../components/BackButton/BackButton";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import BlueButton from "../../components/BlueButton/BlueButton";
import Warning from "../../components/Warning/Warning";
import CrossChainStatus, { buildPaymentSteps } from "../../components/CrossChainStatus/CrossChainStatus";
import { useChainDetection, useWalletAddress } from "../../hooks/useChainDetection";
import { getChainConfig, getNativeChain } from "../../config/chainConfig";
import { getAthenaClientContract, isNativeArbChain } from "../../services/localChainService";
import {
  ATHENA_OPERATIONS,
  buildEstimatedWriteSendOptions,
  createAthenaWrite,
} from "../../services/contractWriteRouter";
import { monitorLZMessage, monitorCCTPTransfer, STATUS, explorerTxUrl } from "../../utils/crossChainMonitor";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const SKILLOPTIONS = [
  'UX/UI Skill Oracle','Full Stack development','UX/UI Skill Oracle',
]

// USDC ERC20 ABI (minimal required functions)
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Minimal Native Athena ABI for checking dispute sync
const NATIVE_ATHENA_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "disputeId", "type": "string"}],
    "name": "getDisputeInfo",
    "outputs": [
      {"internalType": "uint256", "name": "totalFees", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVotingPowerFor", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVotingPowerAgainst", "type": "uint256"},
      {"internalType": "bool", "name": "winningSide", "type": "bool"},
      {"internalType": "bool", "name": "isFinalized", "type": "bool"},
      {"internalType": "uint256", "name": "voteCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "", "type": "string"}],
    "name": "jobDisputeCounters",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

function ImageUpload({ onFileSelected, selectedFile }) {
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelected(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <label htmlFor="image">
        <div className="form-fileUpload">
          <img src="/upload.svg" alt="" />
          <span>Click here to upload or drop files here</span>
        </div>
      </label>
      <input id="image" type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
      {preview && (
        <div style={{ marginTop: '10px' }}>
          <img src={preview} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {selectedFile?.name}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RaiseDispute() {
  const { jobId } = useParams();
  
  // Multi-chain hooks
  const { chainId, chainConfig, isAllowed, error: chainError } = useChainDetection();
  const { address: walletAddress, connect: connectWallet } = useWalletAddress();
  const [job, setJob] = useState(null);
  const [disputeTitle, setDisputeTitle] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeAmount, setDisputeAmount] = useState("");
  const [receiverWallet, setReceiverWallet] = useState("");
  const [compensation, setCompensation] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingT, setLoadingT] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState("Raise dispute requires USDC approval and blockchain transaction fees");
  const [crossChainSteps, setCrossChainSteps] = useState(null);
  
  // Oracle selection state
  const [oracles, setOracles] = useState([]);
  const [selectedOracle, setSelectedOracle] = useState("");
  const [isOracleDropdownOpen, setIsOracleDropdownOpen] = useState(false);
  const [oraclesLoading, setOraclesLoading] = useState(true);

  const navigate = useNavigate();

  const handleCopyToClipboard = (address) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        void 0 /* clipboard copy acknowledged */;
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  // Fetch available oracles from blockchain
  useEffect(() => {
    async function fetchOracles() {
      try {
        setOraclesLoading(true);

        // Get native chain config (Arbitrum) dynamically based on network mode
        const nativeChain = getNativeChain();
        if (!nativeChain) {
          console.error("Native chain not configured");
          setOraclesLoading(false);
          return;
        }

        const web3 = new Web3(nativeChain.rpcUrl);
        const genesisContract = new web3.eth.Contract(genesisABI, nativeChain.contracts.genesis);
        const nativeAthenaContract = new web3.eth.Contract(nativeAthenaABI, nativeChain.contracts.nativeAthena);

        // Get all oracle names
        const oracleNames = await genesisContract.methods.getAllOracleNames().call();

        // Fetch member count + active status for each oracle
        const oracleDataPromises = oracleNames.map(async (name) => {
          const [isActive, members] = await Promise.all([
            nativeAthenaContract.methods.isOracleActive(name).call(),
            genesisContract.methods.getOracleMembers(name).call()
          ]);
          return {
            name,
            isActive,
            memberCount: members.length
          };
        });

        const oracleData = await Promise.all(oracleDataPromises);

        setOracles(oracleData);

        // Auto-select first oracle with members (fall back to first if none)
        const firstWithMembers = oracleData.find(o => o.memberCount > 0) || oracleData[0];
        if (firstWithMembers) {
          setSelectedOracle(firstWithMembers.name);
        }

        setOraclesLoading(false);
      } catch (error) {
        console.error("Error fetching oracles:", error);
        setOraclesLoading(false);
      }
    }

    fetchOracles();
  }, []);

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setLoading(true);

        // Get native chain config (Arbitrum) dynamically
        const nativeChain = getNativeChain();
        if (!nativeChain) {
          console.error("Native chain not configured");
          setLoading(false);
          return;
        }

        const web3 = new Web3(nativeChain.rpcUrl);
        const contract = new web3.eth.Contract(contractABI, nativeChain.contracts.nowjc);

        const jobData = await contract.methods.getJob(jobId).call();

        let jobDetails = {};
        try {
          if (jobData.jobDetailHash) {
            const gateways = [
              `https://gateway.lighthouse.storage/ipfs/${jobData.jobDetailHash}`,
              `/api/ipfs/content/${jobData.jobDetailHash}`,
              `https://ipfs.io/ipfs/${jobData.jobDetailHash}`,
              `https://cloudflare-ipfs.com/ipfs/${jobData.jobDetailHash}`,
              `https://dweb.link/ipfs/${jobData.jobDetailHash}`
            ];
            
            let ipfsResponse = null;
            for (const gateway of gateways) {
              try {
                ipfsResponse = await fetch(gateway);
                if (ipfsResponse.ok) {
                  break;
                }
              } catch (e) {
                continue;
              }
            }
            if (ipfsResponse && ipfsResponse.ok) {
              jobDetails = await ipfsResponse.json();
            }
          }
        } catch (ipfsError) {
          console.warn("Failed to fetch IPFS data:", ipfsError);
        }

        const totalBudget = jobData.milestonePayments.reduce(
          (sum, milestone) => sum + parseFloat(milestone.amount),
          0,
        );

        const totalPaidAmount = parseFloat(jobData.totalPaid);
        const currentMilestone = parseInt(jobData.currentMilestone);

        let lockedAmount = 0;
        if (currentMilestone <= jobData.finalMilestones.length) {
          for (
            let i = currentMilestone - 1;
            i < jobData.finalMilestones.length;
            i++
          ) {
            if (jobData.finalMilestones[i]) {
              lockedAmount += parseFloat(jobData.finalMilestones[i].amount);
            }
          }
        }

        const formattedTotalBudget = (totalBudget / 1000000).toFixed(2);
        const formattedAmountPaid = (totalPaidAmount / 1000000).toFixed(2);
        const formattedLockedAmount = (lockedAmount / 1000000).toFixed(2);

        setJob({
          jobId: jobData.id,
          title: jobDetails.title || "Untitled Job",
          description: jobDetails.description || "",
          skills: jobDetails.skills || [],
          jobGiver: jobData.jobGiver,
          selectedApplicant: jobData.selectedApplicant,
          status: jobData.status,
          milestones: jobData.finalMilestones,
          currentMilestone: currentMilestone,
          totalMilestones: jobData.milestonePayments.length,
          totalBudget: formattedTotalBudget,
          amountPaid: formattedAmountPaid,
          amountLocked: formattedLockedAmount,
          contractId: nativeChain.contracts.nowjc,
          ...jobDetails,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching job details:", error);
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // Upload dispute evidence to IPFS
  const uploadDisputeToIPFS = async () => {
    try {
      const disputeData = {
        jobId: jobId,
        title: disputeTitle,
        description: disputeDescription,
        disputedAmount: disputeAmount,
        receiverWallet: receiverWallet,
        compensation: compensation,
        timestamp: new Date().toISOString(),
        file: selectedFile ? {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        } : null
      };

      // If there's a file, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const fileResponse = await fetch(
          `${BACKEND_URL}/api/ipfs/upload-file`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          disputeData.fileIpfsHash = fileData.IpfsHash;
        }
      }

      // Upload dispute data
      const response = await fetch(
        `${BACKEND_URL}/api/ipfs/upload-json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataContent: disputeData,
            pinataMetadata: {
              name: `dispute-${jobId}-${Date.now()}`,
              keyvalues: {
                jobId: jobId,
                type: "dispute",
              },
            },
          }),
        },
      );

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  };

  // Read current jobDisputeCounters[jobId] on Arbitrum before tx fires
  const getDisputeCounterOnArbitrum = async (jobId) => {
    try {
      const nativeChain = getNativeChain();
      if (!nativeChain) return 0;
      const arbitrumWeb3 = new Web3(nativeChain.rpcUrl);
      const nativeAthenaContract = new arbitrumWeb3.eth.Contract(
        NATIVE_ATHENA_ABI,
        nativeChain.contracts.nativeAthena
      );
      const count = await nativeAthenaContract.methods.jobDisputeCounters(jobId).call();
      return Number(count);
    } catch {
      return 0;
    }
  };

  // Poll for dispute sync — waits for counter to exceed baseCount, then redirects
  // to /review-dispute/${jobId}-${newCount}
  const pollForDisputeSync = (jobId, baseCount) => {
    setTransactionStatus("✅ Dispute raised! Cross-chain sync in progress...");
    let attempt = 0;
    const maxAttempts = 60;

    const poll = async () => {
      if (attempt >= maxAttempts) {
        // Fallback: best-guess with baseCount+1
        const disputeId = `${jobId}-${baseCount + 1}`;
        setTransactionStatus("Dispute raised. Sync taking longer than expected — check dispute details in a few minutes.");
        setTimeout(() => navigate(`/review-dispute/${disputeId}`), 3000);
        return;
      }
      try {
        const nativeChain = getNativeChain();
        const arbitrumWeb3 = new Web3(nativeChain.rpcUrl);
        const nativeAthenaContract = new arbitrumWeb3.eth.Contract(
          NATIVE_ATHENA_ABI,
          nativeChain.contracts.nativeAthena
        );
        const currentCount = Number(
          await nativeAthenaContract.methods.jobDisputeCounters(jobId).call()
        );
        if (currentCount > baseCount) {
          // disputeId = "${jobId}-${newCount}" per native-athena.sol line 559
          const disputeId = `${jobId}-${currentCount}`;
          setTransactionStatus("🎉 Dispute synced to Arbitrum! Redirecting...");
          setTimeout(() => navigate(`/review-dispute/${disputeId}`), 1500);
          return;
        }
      } catch (e) {
        console.warn('[dispute poll] attempt', attempt + 1, e.message);
      }
      attempt++;
      setTimeout(poll, 10000);
    };

    setTimeout(poll, 8000);
  };

  const formatAmount = (amount) => {
    if (parseFloat(amount) === 0) return "0";
    const roundedAmount = parseFloat(amount).toFixed(2);
    return roundedAmount.length > 5 ? roundedAmount.slice(0, 8) : roundedAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!walletAddress) {
      setTransactionStatus("❌ Please connect your wallet first");
      return;
    }
    
    if (!isAllowed) {
      setTransactionStatus(chainConfig?.reason || "Transactions not allowed on this network. Please switch to OP Sepolia or Ethereum Sepolia.");
      return;
    }
    
    if (!disputeTitle.trim()) {
      setTransactionStatus("❌ Please enter a dispute title");
      return;
    }
    if (!disputeDescription.trim()) {
      setTransactionStatus("❌ Please enter a dispute explanation");
      return;
    }
    if (!disputeAmount || parseFloat(disputeAmount) <= 0) {
      setTransactionStatus("❌ Please enter a valid disputed amount");
      return;
    }
    if (!compensation || parseFloat(compensation) <= 0) {
      setTransactionStatus("❌ Please enter a valid compensation amount");
      return;
    }
    if (!selectedOracle) {
      setTransactionStatus("❌ Please select an oracle for dispute resolution");
      return;
    }

    try {
      setLoadingT(true);
      setTransactionStatus(`🔄 Validating requirements on ${chainConfig?.name}...`);

      const web3 = new Web3(window.ethereum);
      const compensationAmount = Math.floor(parseFloat(compensation) * 1000000);
      const disputedAmountUnits = Math.floor(parseFloat(disputeAmount) * 1000000);

      // Get chain-specific contract addresses
      const usdcAddress = chainConfig.contracts.usdc;
      const athenaClientAddress = chainConfig.contracts.athenaClient;

      if (!usdcAddress || !athenaClientAddress) {
        throw new Error(`Contracts not configured for ${chainConfig.name}`);
      }

      // Initialize USDC contract
      const usdcContract = new web3.eth.Contract(ERC20_ABI, usdcAddress);

      // ============ CHECK USDC BALANCE ============
      setTransactionStatus("🔍 Checking USDC balance...");
      const userBalance = await usdcContract.methods.balanceOf(walletAddress).call();
      const balanceInUSDC = parseFloat(userBalance) / 1000000;

      if (parseFloat(userBalance) < compensationAmount) {
        throw new Error(`Insufficient USDC balance. Required: ${compensation} USDC, Available: ${balanceInUSDC.toFixed(2)} USDC`);
      }


      // ============ STEP 1: CHECK ALLOWANCE & APPROVE IF NEEDED ============
      setTransactionStatus("🔍 Checking USDC allowance...");
      const currentAllowance = await usdcContract.methods.allowance(walletAddress, athenaClientAddress).call();

      if (BigInt(currentAllowance) < BigInt(compensationAmount)) {
        setTransactionStatus(`💰 Step 1/3: Approving ${compensation} USDC spending - Please confirm in MetaMask`);

        const approveTx = await usdcContract.methods.approve(
          athenaClientAddress,
          compensationAmount.toString()
        ).send({ from: walletAddress });

        if (!approveTx || !approveTx.transactionHash) {
          throw new Error("Approval transaction failed");
        }

        setTransactionStatus(`✅ Step 1/3: USDC approval confirmed`);

        // Wait for transaction to be properly mined
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        setTransactionStatus(`✅ Step 1/3: USDC allowance already sufficient`);
      }

      // ============ STEP 2: UPLOAD DISPUTE EVIDENCE TO IPFS ============
      setTransactionStatus("📤 Step 2/3: Uploading dispute evidence to IPFS...");
      const disputeHash = await uploadDisputeToIPFS();
      setTransactionStatus(`✅ Step 2/3: Evidence uploaded to IPFS`);

      // ============ STEP 3: RAISE DISPUTE ON CHAIN ============
      setTransactionStatus(`🔧 Step 3/3: Raising dispute on ${chainConfig.name} — Please confirm in MetaMask`);
      const athenaContract = await getAthenaClientContract(chainId);
      const isNativeArbitrum = isNativeArbChain(chainId);
      const lzOptions = isNativeArbitrum ? null : chainConfig.layerzero.options;
      const gasPrice = await web3.eth.getGasPrice();

      // Snapshot current counter so poll can detect the new dispute
      const baseDisputeCount = await getDisputeCounterOnArbitrum(jobId);

      let layerZeroFee;
      if (!isNativeArbitrum) {
        // Quote the exact payload used by AthenaClient. This is important on XDC,
        // where the native fee is denominated in XDC rather than ETH.
        setTransactionStatus(`🔧 Step 3/3: Getting LayerZero fee quote on ${chainConfig.name}...`);
        const payload = web3.eth.abi.encodeParameters(
          ['string', 'string', 'string', 'string', 'uint256', 'uint256', 'address'],
          ['raiseDispute', jobId, disputeHash, selectedOracle, compensationAmount, disputedAmountUnits, walletAddress]
        );
        layerZeroFee = (await athenaContract.methods
          .quoteSingleChain('raiseDispute', payload, lzOptions)
          .call()).toString();
      }

      // ── Event-based tx: CrossChainStatus appears immediately on sign ──────
      const disputeMethod = createAthenaWrite(
        athenaContract,
        chainConfig,
        ATHENA_OPERATIONS.RAISE_DISPUTE,
        [jobId, disputeHash, selectedOracle, compensationAmount, disputedAmountUnits],
        lzOptions
      );
      const sendOptions = await buildEstimatedWriteSendOptions(disputeMethod, chainConfig, {
        from: walletAddress,
        value: layerZeroFee,
        maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
        maxFeePerGas: gasPrice
      });
      disputeMethod.send(sendOptions)
      .on('transactionHash', (srcTxHash) => {
        if (isNativeArbitrum) {
          setLoadingT(false);
          setCrossChainSteps(null);
          setTransactionStatus(`✅ Arbitrum dispute transaction submitted: ${srcTxHash}`);
          return;
        }
        const lzLink     = `https://layerzeroscan.com/tx/${srcTxHash}`;
        const circleLink = `https://iris-api.circle.com/v2/messages/${chainConfig?.cctpDomain ?? 2}?transactionHash=${srcTxHash}`;

        setLoadingT(false);
        setTransactionStatus(`✅ Dispute tx submitted! Tracking cross-chain progress...`);

        // Show CrossChainStatus immediately
        setCrossChainSteps(buildPaymentSteps({
          sourceChainId: chainId,
          usdcApproved: true,
          sourceTxHash: srcTxHash,
          lzStatus: 'active',
          lzLink,
          circleLink,
        }));

        // CCTP burn happened on OP at source tx time — monitor srcTxHash, not dst
        monitorCCTPTransfer(srcTxHash, chainConfig?.cctpDomain ?? 2,
          (cu) => {
            setCrossChainSteps(prev => buildPaymentSteps({
              sourceChainId: chainId, usdcApproved: true, sourceTxHash: srcTxHash,
              lzStatus: prev?.[2]?.status === 'complete' ? 'delivered' : 'active',
              lzLink, circleLink,
              cctpBurnTxHash: srcTxHash, cctpSourceDomain: chainConfig?.cctpDomain ?? 2,
              cctpAttestationStatus: cu.status === STATUS.SUCCESS ? 'complete'
                                   : cu.message?.includes('slow') ? 'slow' : 'pending',
            }));
          },
          () => {
            setCrossChainSteps(prev => buildPaymentSteps({
              sourceChainId: chainId, usdcApproved: true, sourceTxHash: srcTxHash,
              lzStatus: prev?.[2]?.status === 'complete' ? 'delivered' : 'active',
              lzLink, circleLink,
              cctpBurnTxHash: srcTxHash, cctpSourceDomain: chainConfig?.cctpDomain ?? 2,
              cctpAttestationStatus: 'complete',
            }));
          }
        );

        monitorLZMessage(srcTxHash, (lzUpdate) => {
          setCrossChainSteps(prev => {
            const cctpStatus = prev?.find(s => s.label?.toLowerCase().includes('circle') || s.label?.toLowerCase().includes('cctp'))?.status;
            return buildPaymentSteps({
              sourceChainId: chainId,
              usdcApproved: true,
              sourceTxHash: srcTxHash,
              lzStatus:     lzUpdate.status === STATUS.SUCCESS ? 'delivered'
                          : lzUpdate.status === STATUS.FAILED  ? 'failed' : 'active',
              lzLink:       lzUpdate.lzLink || lzLink,
              lzDstTxHash:  lzUpdate.dstTxHash,
              lzDstChainId: 42161,
              cctpBurnTxHash: srcTxHash,
              cctpSourceDomain: chainConfig?.cctpDomain ?? 2,
              cctpAttestationStatus: cctpStatus === 'complete' ? 'complete' : 'pending',
              circleLink,
            });
          });
        });

        // On-chain ground truth: poll NativeAthena jobDisputeCounters > baseCount
        pollForDisputeSync(jobId, baseDisputeCount);
      })
      .on('receipt', () => {
        if (isNativeArbitrum) {
          setTransactionStatus(`✅ Dispute confirmed directly on Arbitrum.`);
          setLoadingT(false);
          pollForDisputeSync(jobId, baseDisputeCount);
        } else {
          setTransactionStatus(`✅ Dispute confirmed on ${chainConfig.name}. Waiting for cross-chain delivery...`);
        }
      })
      .on('error', (error) => {
        let msg = error.message;
        if (error.code === 4001) msg = 'Transaction cancelled by user';
        else if (msg.includes('insufficient funds')) msg = 'Insufficient ETH for gas fees';
        else if (msg.includes('execution reverted')) msg = 'Transaction failed — contract requirements not met';
        setTransactionStatus(`❌ Error: ${msg}`);
        setLoadingT(false);
      })
      .catch((error) => {
        setTransactionStatus(`❌ Transaction rejected: ${error.message}`);
        setLoadingT(false);
      });
      // ──────────────────────────────────────────────────────────────────────

    } catch (error) {
      // Pre-tx errors: balance, allowance, IPFS upload, LZ quote
      console.error("❌ Dispute error:", error);
      let errorMessage = error.message;
      if (error.code === 4001) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient ETH for gas fees";
      else if (error.message?.includes("execution reverted")) errorMessage = "Transaction failed — contract requirements not met";
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setLoadingT(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-containerT">
        <div className="loading-icon">
          <img src="/OWIcon.svg" alt="Loading..." />
        </div>
        <div className="loading-message">
          <h1 id="txText">Loading Job Details...</h1>
          <p id="txSubtext">
            Fetching job information from the blockchain. Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="loading-containerT">
        <div className="loading-message">
          <h1 id="txText">Job Not Found</h1>
          <p id="txSubtext">
            The requested job could not be found.
          </p>
          <Link to="/browse-jobs" style={{ marginTop: "20px", color: "#007bff" }}>
            Back to Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="newTitle">
        <div className="titleTop">
          <Link className="goBack" to={`/job-details/${jobId}`}>
            <img className="goBackImage" src="/back.svg" alt="Back Button" />
          </Link>  
          <div className="titleText">{job.title}</div>
          <Link className="goBack" to={`/job-details/${jobId}`} style={{visibility:'hidden'}}>
            <img className="goBackImage" src="/back.svg" alt="Back Button" />
          </Link>  
        </div>
        <div className="titleBottom">
          <p>Contract ID: {formatWalletAddress(job.contractId)}</p>
          <img 
            src="/copy.svg" 
            className="copyImage" 
            onClick={() => handleCopyToClipboard(job.contractId)}
          />
        </div>
      </div>
      <div className="form-containerDC" style={{marginTop: '48px'}}>
        <div className="sectionTitle raiseTitle">
          <span id="rel-title">Raise Dispute</span>
        </div>
        <div className="form-body raiseBody">
          <span id="pDC2">
            If you need to receive some or all of the locked amount in your address due to a dispute, please raise it here. Incentivise the oracle with a fee you pay them to give a fair judgement.
          </span>
          <form onSubmit={handleSubmit}>
            <div className="form-groupDC">
              <input
                type="text"
                placeholder="Dispute Title"
                value={disputeTitle}
                onChange={(e) => setDisputeTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-groupDC">
              <textarea
                placeholder="Dispute Explanation"
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="form-groupDC amountDC">
              <input
                id="amountInput"
                type="number"
                step="0.01"
                placeholder="Disputed Amount"
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-groupDC ">
              <input
                type="text"
                placeholder="Enter Wallet ID of the disputed fund receiver"
                value={receiverWallet}
                onChange={(e) => setReceiverWallet(e.target.value)}
              />
              <div className="dispute-description">
                <img src="/dispute-description.svg" alt="" />
                <span>When the dispute is resolved, the above entered wallet would receive the funds</span>
              </div>
            </div>
            <div className="form-groupDC">
              <ImageUpload onFileSelected={setSelectedFile} selectedFile={selectedFile} />
            </div>
            <div className="form-groupDC" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="platform-fee">
                <span>SELECT ORACLE FOR DISPUTE RESOLUTION</span>
                <img src="/fee.svg" alt="" />
              </div>
              <div className="oracle-dropdown-container" style={{ marginTop: 0 }}>
                <div 
                  className="oracle-dropdown-button"
                  onClick={() => setIsOracleDropdownOpen(!isOracleDropdownOpen)}
                >
                  <span>
                    {oraclesLoading ? "Loading oracles..." : selectedOracle || "Select an oracle"}
                  </span>
                  <img 
                    src="/chevron-down.svg" 
                    alt="Dropdown" 
                    className={`oracle-dropdown-icon ${isOracleDropdownOpen ? 'open' : ''}`}
                  />
                </div>
                {isOracleDropdownOpen && oracles.length > 0 && (
                  <div className="oracle-dropdown-menu">
                    {oracles.map((oracle, index) => (
                      <div
                        key={index}
                        className={`oracle-dropdown-item ${!oracle.isActive ? 'inactive' : ''}`}
                        onClick={() => {
                          if (oracle.isActive) {
                            setSelectedOracle(oracle.name);
                            setIsOracleDropdownOpen(false);
                          }
                        }}
                        style={{
                          opacity: oracle.isActive ? 1 : 0.4,
                          cursor: oracle.isActive ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <span>{oracle.name}</span>
                        <span style={{ fontSize: '12px', color: oracle.isActive ? '#767676' : '#999' }}>
                          {oracle.memberCount} member{oracle.memberCount !== 1 ? 's' : ''}
                          {!oracle.isActive && ' · inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-groupDC compensation">
              <span>COMPENSATION FOR RESOLUTION (USDC)</span>
              <div className="amountDC">
                <input
                  id="amountInput"
                  type="number"
                  step="0.01"
                  placeholder="Amount to Pay Dispute Voters"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  required
                />
              </div>
              <div className="dispute-description">
                <img src="/dispute-description.svg" alt="" />
                <span>This is the compensation that you're willing to pay to members of the Skill Oracle for their efforts in helping you resolve this dispute</span>
              </div>
            </div>
            {chainError && (
              <div className="warning-form">
                <Warning content={chainError} icon="/triangle_warning.svg" />
              </div>
            )}
            {!isAllowed && chainConfig?.reason && (
              <div className="warning-form">
                <Warning content={chainConfig.reason} icon="/triangle_warning.svg" />
              </div>
            )}
            {chainConfig && isAllowed && (
              <div className="warning-form" style={{ marginBottom: '16px' }}>
                <Warning content={`Connected to ${chainConfig.name}`} icon="/info.svg" />
              </div>
            )}
            
            <BlueButton 
              label={loadingT ? "Submitting..." : "Raise Dispute"}
              disabled={!walletAddress || !isAllowed || loadingT}
              style={{width: '100%', justifyContent: 'center'}}
              onClick={handleSubmit}
            />
            <div className="warning-form" style={{ marginTop: '16px' }}>
              <Warning content={transactionStatus} />
            </div>
            {crossChainSteps && (
              <div style={{ marginTop: '24px' }}>
                <CrossChainStatus steps={crossChainSteps} />
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
