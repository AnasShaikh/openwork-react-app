import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Web3 from "web3";
import "./DirectContractForm.css";
import { useWalletConnection } from "../../functions/useWalletConnection";
import { formatWalletAddress } from "../../functions/formatWalletAddress";

import BackButton from "../../components/BackButton/BackButton";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import BlueButton from "../../components/BlueButton/BlueButton";
import Milestone from "../../components/Milestone/Milestone";
import RadioButton from "../../components/RadioButton/RadioButton";
import Warning from "../../components/Warning/Warning";
import { getLocalChains, getChainConfig, getNativeChain } from "../../config/chainConfig";
import {
  estimateLayerZeroFee,
  getLOWJCContract,
  getReadOnlyLOWJCContract,
  getReadOnlyWeb3,
  isNativeArbChain,
} from "../../services/localChainService";
import {
  LOWJC_OPERATIONS,
  buildEstimatedWriteSendOptions,
  createLOWJCWrite,
} from "../../services/contractWriteRouter";
import {
  resolveDirectContractJobId,
  saveDirectContractProgress,
} from "../../utils/directContractReceipt";

const SKILLOPTIONS = [
  'UX/UI Skill Oracle','Full Stack development','UX/UI Skill Oracle',
]

// Backend URL for secure API calls
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const INITIAL_TRANSACTION_STATE = {
  phase: "idle",
  message: "Direct contract creation requires blockchain transaction fees",
  variant: "warning",
};

const TRANSACTION_BUTTON_LABELS = {
  idle: "Enter Contract",
  error: "Try Again",
  preparing: "Preparing Contract…",
  approval: "Confirm USDC Approval…",
  quoting: "Getting Network Quote…",
  "contract-signature": "Confirm Contract…",
  submitted: "Confirming Transaction…",
  "source-confirmed": "Opening Progress…",
  success: "Contract Created",
  "confirmed-unresolved": "Transaction Confirmed",
};

const USDC_BASE_UNITS = 1_000_000n;
const USDC_ABI = [
  {
    inputs: [{ type: "address", name: "account" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" },
    ],
    name: "approve",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

function formatUsdcBaseUnits(value) {
  const amount = BigInt(value);
  const whole = amount / USDC_BASE_UNITS;
  const fractional = (amount % USDC_BASE_UNITS)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole.toString();
}

function FileUpload({ onFilesUploaded, uploadedFiles }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesUploaded(newFiles);
  };

  const uploadFilesToIPFS = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const newUploadedFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress(prev => ({ ...prev, [i]: 'Uploading...' }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
        const response = await fetch(
          `${BACKEND_URL}/api/ipfs/upload-file`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          newUploadedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            ipfsHash: data.IpfsHash,
            timestamp: new Date().toISOString(),
          });
          setUploadProgress(prev => ({ ...prev, [i]: 'Done ✓' }));
        } else {
          setUploadProgress(prev => ({ ...prev, [i]: 'Failed ✗' }));
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [i]: 'Failed ✗' }));
      }
    }

    onFilesUploaded([...uploadedFiles, ...newUploadedFiles]);
    setSelectedFiles([]);
    setUploadProgress({});
    setUploading(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ width: '100%' }}>
      <label htmlFor="files">
        <div className="form-fileUpload" style={{ cursor: 'pointer' }}>
          <img src="/upload.svg" alt="" />
          <span>Click here to upload or drop files here</span>
        </div>
      </label>
      <input
        id="files"
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Selected files (not yet uploaded) */}
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Selected Files ({selectedFiles.length})</strong>
            <button
              onClick={uploadFilesToIPFS}
              disabled={uploading}
              style={{
                background: uploading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload to IPFS'}
            </button>
          </div>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '4px',
                fontSize: '13px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{file.name}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>
                  {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                </div>
              </div>
              {uploadProgress[index] && (
                <span style={{ marginRight: '10px', fontSize: '11px', color: '#666' }}>
                  {uploadProgress[index]}
                </span>
              )}
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '0 8px'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files (on IPFS) */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong>Uploaded Files ({uploadedFiles.length})</strong>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                background: '#e8f5e9',
                borderRadius: '4px',
                marginTop: '4px',
                fontSize: '13px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>✓ {file.name}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>
                  {formatFileSize(file.size)} • IPFS: {file.ipfsHash.substring(0, 10)}...
                </div>
              </div>
              <button
                onClick={() => removeUploadedFile(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DirectContractForm() {
  const { walletAddress, connectWallet, disconnectWallet } = useWalletConnection();
  const [searchParams] = useSearchParams();
  const [jobTitle, setJobTitle] = useState(searchParams.get('title') || "");
  const [jobDescription, setJobDescription] = useState(searchParams.get('description') || "");
  const [jobType, setJobType] = useState("");
  const [jobTaker, setJobTaker] = useState(searchParams.get('taker') || "");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Single Milestone');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [transactionState, setTransactionState] = useState(INITIAL_TRANSACTION_STATE);
  const [platformFee, setPlatformFee] = useState(null);
  const [milestones, setMilestones] = useState(() => {
    const budgetParam = searchParams.get('budget');
    return [{
      title: "Milestone 1",
      content: "",
      amount: budgetParam ? Number(budgetParam) : 1,
    }];
  });

  const navigate = useNavigate();
  const submissionLockRef = useRef(false);
  const transactionInProgress = !["idle", "error"].includes(transactionState.phase);

  const selectMilestoneType = (option) => {
    setSelectedOption(option);
    setMilestones((currentMilestones) => {
      const firstMilestone = currentMilestones[0] || {
        title: "Milestone 1",
        content: "",
        amount: 1,
      };

      if (option === "Single Milestone") {
        return [firstMilestone];
      }

      if (currentMilestones.length > 1) {
        return currentMilestones;
      }

      return [
        firstMilestone,
        {
          title: "Milestone 2",
          content: "",
          amount: 1,
        },
      ];
    });
  };

  // Fetch platform fee from NOWJC contract on Arbitrum
  useEffect(() => {
    async function fetchCommission() {
      try {
        const nativeChain = getNativeChain();
        if (!nativeChain) return;
        const web3 = new Web3(nativeChain.rpcUrl);
        const nowjcABI = [{
          "inputs": [],
          "name": "commissionPercentage",
          "outputs": [{"type": "uint256", "name": ""}],
          "stateMutability": "view",
          "type": "function"
        }];
        const nowjcContract = new web3.eth.Contract(nowjcABI, nativeChain.contracts.nowjc);
        const basisPoints = await nowjcContract.methods.commissionPercentage().call();
        setPlatformFee(Number(basisPoints) / 100); // basis points to percentage
      } catch (err) {
        console.warn("Could not fetch commission rate:", err.message);
      }
    }
    fetchCommission();
  }, []);

  // Calculate total compensation
  const totalCompensation = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

  const handleMilestoneUpdate = (index, field, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index][field] = value;
    setMilestones(updatedMilestones);
  };

  const handleAddMilestone = () => {
    const newMilestoneNumber = milestones.length + 1;
    const newMilestone = {
      title: `Milestone ${newMilestoneNumber}`,
      content: "",
      amount: 1,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleDeleteMilestone = (index) => {
    if (selectedOption === "Multiple Milestones" && milestones.length <= 1) {
      alert("You must have at least one milestone");
      return;
    }
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    const renumberedMilestones = updatedMilestones.map((milestone, idx) => ({
      ...milestone,
      title: `Milestone ${idx + 1}`,
    }));
    setMilestones(renumberedMilestones);
  };

 
  const handleNavigation = () => {
    window.open(  "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
    );
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Function to pin individual milestone to IPFS
  const pinMilestoneToIPFS = async (milestone, index) => {
    try {
      const milestoneData = {
        title: milestone.title,
        content: milestone.content,
        amount: milestone.amount,
        index: index,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(
        `${BACKEND_URL}/api/ipfs/upload-json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataContent: milestoneData,
            pinataMetadata: {
              name: `milestone-${index}-${Date.now()}`,
              keyvalues: {
                milestoneTitle: milestone.title,
                milestoneIndex: index.toString(),
                type: "milestone",
              },
            },
          }),
        },
      );

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error(`Error pinning milestone ${index} to IPFS:`, error);
      return null;
    }
  };

  const pinJobDetailsToIPFS = async (jobDetails) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/ipfs/upload-json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataContent: jobDetails,
            pinataMetadata: {
              name: `direct-contract-job-${Date.now()}`,
              keyvalues: {
                type: "direct-contract-job",
                jobTitle: jobDetails.title,
                timestamp: new Date().toISOString(),
              },
            },
          }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error pinning job details to IPFS:', error);
      return null;
    }
  };

  const handleDirectContractSubmit = async (event) => {
    event?.preventDefault();

    if (submissionLockRef.current) {
      return;
    }

    if (!jobTitle.trim()) {
      alert("Please enter a job title");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please enter job requirements");
      return;
    }

    if (!Web3.utils.isAddress(jobTaker.trim())) {
      alert("Please enter a valid job taker address");
      return;
    }

    const toMicroUsdc = (amount) => {
      const scaledAmount = Math.round(Number(amount) * 1_000_000);
      if (!Number.isSafeInteger(scaledAmount) || scaledAmount <= 0) {
        throw new Error("Every milestone needs a valid amount greater than zero.");
      }
      return String(scaledAmount);
    };

    submissionLockRef.current = true;
    setTransactionState({
      phase: "preparing",
      message: "Preparing contract details and uploading them securely…",
      variant: "info",
    });

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask was not detected. Install or enable it to continue.");
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const chainId = Number(await web3.eth.getChainId());
      const localChains = getLocalChains();
      const currentChainConfig = getChainConfig(chainId);

      if (!localChains.some((chain) => chain.chainId === chainId)) {
        throw new Error(
          `Please switch to ${localChains.map((chain) => chain.name).join(" or ")}.`,
        );
      }

      const [fromAddress] = await web3.eth.getAccounts();
      if (!fromAddress) {
        throw new Error("Connect a wallet to continue.");
      }

      const milestoneHashes = [];
      const milestoneAmounts = milestones.map((milestone) => toMicroUsdc(milestone.amount));
      const firstMilestoneAmount = BigInt(milestoneAmounts[0]);
      const contractAddress = currentChainConfig.contracts.lowjc;
      const readOnlyWeb3 = getReadOnlyWeb3(chainId);
      const readOnlyUsdcContract = new readOnlyWeb3.eth.Contract(
        USDC_ABI,
        currentChainConfig.contracts.usdc,
      );

      setTransactionState({
        phase: "preparing",
        message: "Checking your USDC balance and existing approval…",
        variant: "info",
      });

      const [userUsdcBalance, currentAllowance] = await Promise.all([
        readOnlyUsdcContract.methods.balanceOf(fromAddress).call(),
        readOnlyUsdcContract.methods.allowance(fromAddress, contractAddress).call(),
      ]);

      if (BigInt(userUsdcBalance) < firstMilestoneAmount) {
        throw new Error(
          `Insufficient USDC balance. The first milestone requires ${formatUsdcBaseUnits(firstMilestoneAmount)} USDC, but this wallet has ${formatUsdcBaseUnits(userUsdcBalance)} USDC. Add USDC on ${currentChainConfig.name} before trying again.`,
        );
      }

      for (let index = 0; index < milestones.length; index += 1) {
        const milestoneHash = await pinMilestoneToIPFS(milestones[index], index);
        if (!milestoneHash) {
          throw new Error(`Milestone ${index + 1} could not be uploaded. Please try again.`);
        }
        milestoneHashes.push(milestoneHash);
      }

      const jobResponse = await pinJobDetailsToIPFS({
        title: jobTitle,
        description: jobDescription,
        milestoneType: selectedOption,
        milestones,
        milestoneHashes,
        attachments: uploadedFiles,
        totalCompensation,
        jobGiver: fromAddress,
        jobTaker: jobTaker.trim(),
        timestamp: new Date().toISOString(),
      });

      if (!jobResponse?.IpfsHash) {
        throw new Error("The contract details could not be uploaded. Please try again.");
      }

      const contract = await getLOWJCContract(chainId);
      const readOnlyContract = await getReadOnlyLOWJCContract(chainId);
      const isNativeArbitrum = isNativeArbChain(chainId);
      const jobTakerChainDomain = currentChainConfig.cctpDomain;

      if (BigInt(currentAllowance) < firstMilestoneAmount) {
        setTransactionState({
          phase: "approval",
          message: "Confirm the USDC approval in MetaMask. This is required before the contract can be created.",
          variant: "warning",
        });

        const walletUsdcContract = new web3.eth.Contract(
          USDC_ABI,
          currentChainConfig.contracts.usdc,
        );
        await walletUsdcContract.methods
          .approve(contractAddress, firstMilestoneAmount.toString())
          .send({ from: fromAddress, gas: 100000 });
      } else {
        setTransactionState({
          phase: "preparing",
          message: "Your existing USDC approval is sufficient. Preparing the contract…",
          variant: "info",
        });
      }

      const counterBefore = await readOnlyContract.methods.getJobCount().call();
      const jobIdPrefix = isNativeArbitrum
        ? chainId
        : currentChainConfig.layerzero.eid;
      const predictedJobId = `${jobIdPrefix}-${BigInt(counterBefore) + 1n}`;
      const directContractOptions = isNativeArbitrum
        ? null
        : "0x00030100110100000000000000000000000000186A00";

      let layerZeroFee;
      if (!isNativeArbitrum) {
        setTransactionState({
          phase: "quoting",
          message: "Getting the cross-chain network quote…",
          variant: "info",
        });

        const quotePayload = readOnlyWeb3.eth.abi.encodeParameters(
          ["string", "address", "address", "string", "string", "string[]", "uint256[]", "uint32"],
          [
            "startDirectContract",
            fromAddress,
            jobTaker.trim(),
            predictedJobId,
            jobResponse.IpfsHash,
            milestoneHashes,
            milestoneAmounts,
            jobTakerChainDomain,
          ],
        );
        layerZeroFee = await estimateLayerZeroFee(chainId, "START_DIRECT_CONTRACT", {
          encodedPayload: quotePayload,
          nativeOptions: directContractOptions,
        });
      }

      setTransactionState({
        phase: "contract-signature",
        message: "Confirm the direct contract transaction in MetaMask.",
        variant: "warning",
      });

      const directContractMethod = createLOWJCWrite(
        contract,
        currentChainConfig,
        LOWJC_OPERATIONS.START_DIRECT_CONTRACT,
        [
          jobTaker.trim(),
          jobResponse.IpfsHash,
          milestoneHashes,
          milestoneAmounts,
          jobTakerChainDomain,
        ],
        directContractOptions,
      );
      const readOnlyDirectContractMethod = createLOWJCWrite(
        readOnlyContract,
        currentChainConfig,
        LOWJC_OPERATIONS.START_DIRECT_CONTRACT,
        [
          jobTaker.trim(),
          jobResponse.IpfsHash,
          milestoneHashes,
          milestoneAmounts,
          jobTakerChainDomain,
        ],
        directContractOptions,
      );
      const preflightOptions = isNativeArbitrum
        ? { from: fromAddress }
        : {
            from: fromAddress,
            value: layerZeroFee,
            gasPrice: String(await readOnlyWeb3.eth.getGasPrice()),
          };
      const sendOptions = await buildEstimatedWriteSendOptions(
        readOnlyDirectContractMethod,
        currentChainConfig,
        preflightOptions,
      );

      let sourceTxHash = null;
      const pendingTransaction = directContractMethod.send(sendOptions);
      pendingTransaction.on("transactionHash", (hash) => {
        sourceTxHash = hash;
        setTransactionState({
          phase: "submitted",
          message: `Transaction submitted (${hash.slice(0, 10)}…). Waiting for confirmation.`,
          variant: "info",
        });
      });

      const receipt = await pendingTransaction;
      sourceTxHash = receipt.transactionHash || sourceTxHash;
      setTransactionState({
        phase: "source-confirmed",
        message: "Transaction confirmed. Resolving the contract ID…",
        variant: "success",
      });

      const jobId = await resolveDirectContractJobId({
        receipt,
        contract: readOnlyContract,
        jobIdPrefix,
        counterBefore,
      });

      if (!jobId) {
        setTransactionState({
          phase: "confirmed-unresolved",
          message: `The transaction was confirmed${sourceTxHash ? ` (${sourceTxHash.slice(0, 10)}…)` : ""}, but its contract ID could not be resolved. Do not submit again; check your transaction history or Browse Jobs.`,
          variant: "warning",
        });
        return;
      }

      fetch(`${BACKEND_URL}/api/jobs/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "startDirectContract",
          txHash: sourceTxHash,
          jobId,
          chainId,
          walletAddress: fromAddress,
        }),
      }).catch(() => {});

      if (isNativeArbitrum) {
        setTransactionState({
          phase: "success",
          message: "Direct contract created successfully. Opening it now…",
          variant: "success",
        });
        navigate(`/job-details/${jobId}`);
        return;
      }

      const progress = {
        jobId,
        sourceTxHash,
        sourceChainId: chainId,
        sourceDomain: currentChainConfig.cctpDomain,
        createdAt: Date.now(),
      };
      saveDirectContractProgress(progress);
      navigate(`/direct-contract-status/${jobId}`, { state: { progress } });
    } catch (error) {
      console.error("Direct contract submission failed:", error);
      submissionLockRef.current = false;
      setTransactionState({
        phase: "error",
        message: error?.message || "The transaction could not be completed. Please try again.",
        variant: "error",
      });
    }
  };

  // Helper function to calculate LayerZero gas based on milestone count
  const calculateLayerZeroGas = (milestoneCount) => {
    // Base gas for function call overhead and basic operations
    const BASE_GAS = 500000;
    
    // Per-milestone gas cost (storage operations, array processing, events)
    // DirectContract has extra parameters (jobTaker address, chainDomain) so needs more gas per milestone
    const GAS_PER_MILESTONE = 300000;
    
    // Calculate total gas needed
    const totalGas = BASE_GAS + (milestoneCount * GAS_PER_MILESTONE);
    
    // Add 20% buffer for safety margin
    const gasWithBuffer = Math.floor(totalGas * 1.2);
    
    
    return gasWithBuffer;
  };

  // Helper function to build LayerZero options with custom gas limit
  const buildLayerZeroOptions = (gasLimit) => {
    // Convert gas limit to hex and pad to 24 characters (12 bytes)
    const gasHex = gasLimit.toString(16).padStart(24, '0');
    
    // Construct the full options value
    // 0x0003 = options type/version
    // 01001101 = configuration flags
    // gasHex = custom gas limit
    const optionsValue = '0x000301001101' + gasHex;
    
    
    return optionsValue;
  };


  return (
    <>
      <div className="form-containerDC">
        <div className="form-header">
          <BackButton to="/work" title="Create a Direct Contract"  style={{gap: '20px', fontSize: '20px'}}/>
        </div>
        <div className="form-body">
          <span id="pDC2">
            Enter in a contract directly with someone you know here. This gives
            access to OpenWork's dispute resolution and helps build profile
            strength for both parties.
          </span>
          <div style={{ marginTop: "12px" }}>
            <div className="form-groupDC">
              <input
                type="text"
                placeholder="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="form-groupDC">
              <input
                type="text"
                placeholder="Job Taker Address (0x...)"
                value={jobTaker}
                onChange={(e) => setJobTaker(e.target.value)}
              />
            </div>
            <div className="form-groupDC">
              <textarea
                placeholder="Job Requirements"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="form-groupDC skill-box">
              {selectedSkills.map((skill, index) => (
                <SkillBox 
                  key={index} 
                  title={skill} 
                  onRemove={() => {
                    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
                  }}
                />
              ))}
              <input
                type="text"
                placeholder="Add skills (press Enter to add)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmedSkill = skillInput.trim();
                    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
                      setSelectedSkills([...selectedSkills, trimmedSkill]);
                      setSkillInput("");
                    }
                  } else if (e.key === 'Backspace' && skillInput === '' && selectedSkills.length > 0) {
                    e.preventDefault();
                    setSelectedSkills(selectedSkills.slice(0, -1));
                  }
                }}
              />
            </div>
            <div className="form-groupDC">
              <FileUpload 
                onFilesUploaded={setUploadedFiles}
                uploadedFiles={uploadedFiles}
              />
            </div>
            <div className="lineDC form-groupDC"></div>
            <div className="form-groupDC">
              <RadioButton
                label="Single Milestone"
                isSelected={selectedOption === 'Single Milestone'}
                onChange={() => selectMilestoneType('Single Milestone')}
              />
              <RadioButton
                label="Multiple Milestones"
                isSelected={selectedOption === 'Multiple Milestones'}
                onChange={() => selectMilestoneType('Multiple Milestones')}
              />
            </div>
            <div className="form-groupDC milestone-section">
                <div className="milestone-section-header">
                    <span>MILESTONES</span>
                </div>
                <div className="milestone-section-body">
                    {milestones.map((milestone, index) => (
                      <Milestone
                        key={index}
                        amount={milestone.amount}
                        title={milestone.title}
                        content={milestone.content}
                        editable={true}
                        onUpdate={(field, value) => handleMilestoneUpdate(index, field, value)}
                        onDelete={() => handleDeleteMilestone(index)}
                      />
                    ))}
                </div>
                {selectedOption === 'Multiple Milestones' && (
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      marginTop: "12px",
                      background: "transparent",
                      border: "2px dashed #007bff",
                      borderRadius: "8px",
                      color: "#007bff",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 123, 255, 0.05)";
                      e.target.style.borderColor = "#0056b3";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderColor = "#007bff";
                    }}
                  >
                    <span style={{ fontSize: "20px", lineHeight: "1" }}>+</span>
                    Add Another Milestone
                  </button>
                )}
            </div>
            <div className="form-groupDC form-platformFee">
              <div className="platform-fee">
                <span>total compensation</span>
                <img src="/fee.svg" alt="" />
              </div>
              <div className="compensation-amount">
                <span>{totalCompensation}</span>
                <img src="/xdc.svg" alt="USDC" className="usdc-iconJD" />
              </div>
            </div>
            <div className="form-groupDC form-platformFee">
              <div className="platform-fee">
                <span>platform fees</span>
                <img src="/fee.svg" alt="" />
              </div>
              <span>{platformFee !== null ? `${platformFee}%` : '...'}</span>
            </div>
            <BlueButton 
              label={TRANSACTION_BUTTON_LABELS[transactionState.phase] || "Enter Contract"}
              style={{width: '100%', justifyContent: 'center'}}
              onClick={handleDirectContractSubmit}
              disabled={transactionInProgress}
            />
            <div className="warning-form">
              <Warning
                content={transactionState.message}
                variant={transactionState.variant}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
