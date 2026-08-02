import { uploadAuthHeaders } from '../../services/uploadAuth';
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import "./AddUpdate.css";
import { formatWalletAddress } from "../../functions/formatWalletAddress";
import { useWalletConnection } from "../../functions/useWalletConnection";
import { useMobileDetection } from "../../functions/useMobileDetection";
import BackButton from "../../components/BackButton/BackButton";
import BlueButton from "../../components/BlueButton/BlueButton";
import Warning from "../../components/Warning/Warning";
import FileUpload from "../../components/FileUpload/FileUpload";
import { useChainDetection, useWalletAddress } from "../../hooks/useChainDetection";
import {
  DESTINATION_GAS_ESTIMATES,
  buildLzOptions,
  getChainConfig,
  extractChainIdFromJobId,
  getNativeChain,
} from "../../config/chainConfig";
import { switchToChain } from "../../utils/switchNetwork";
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
import CrossChainStatus, { buildLZSteps } from "../../components/CrossChainStatus/CrossChainStatus";
import { monitorLZMessage, STATUS } from "../../utils/crossChainMonitor";
import genesisABI from "../../ABIs/genesis_ABI.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Maps LayerZero EIDs to EVM chain IDs (mirrors EID_TO_CHAIN_ID in chainConfig)
const LZ_EID_TO_CHAIN_ID = {
  40232: 11155420, // OP Sepolia
  40161: 11155111, // ETH Sepolia
  40231: 421614,   // ARB Sepolia
  40245: 84532,    // Base Sepolia
  30111: 10,       // OP Mainnet
  30110: 42161,    // ARB Mainnet
  30101: 1,        // ETH Mainnet
  30184: 8453,     // Base Mainnet
  30365: 50,       // XDC Mainnet
};

export default function AddUpdate() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [updateText, setUpdateText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [account, setAccount] = useState(null);
  const [loadingT, setLoadingT] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [crossChainSteps, setCrossChainSteps] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [applierOriginChainId, setApplierOriginChainId] = useState(null);
  
  // Multi-chain hooks
  const { chainId: userChainId, chainConfig: userChainConfig } = useChainDetection();
  const { walletAddress, connectWallet } = useWalletConnection();
  
  // Get job posting chain
  const jobChainId = jobId ? extractChainIdFromJobId(jobId) : null;
  const requiredChainId = applierOriginChainId || jobChainId;
  const requiredChainConfig = requiredChainId ? getChainConfig(requiredChainId) : null;
  const isMobile = useMobileDetection();

  const isActiveJob = Number(job?.status) === 1;
  const isSelectedApplicant = Boolean(
    walletAddress
    && job?.selectedApplicant
    && walletAddress.toLowerCase() === job.selectedApplicant.toLowerCase()
  );
  const canAttemptSubmission = Boolean(walletAddress && job && isActiveJob && isSelectedApplicant);

  const [copiedAddress, setCopiedAddress] = useState(null);

  function formatWalletAddressH(address) {
    if (!address) return "";
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

 
  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleCopyToClipboard = (address) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }).catch(err => console.error("Failed to copy:", err));
  };

  const handleUpdateChange = (e) => {
    setUpdateText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setTransactionStatus("❌ Please connect your wallet first");
      return;
    }

    if (!updateText.trim()) {
      setTransactionStatus("❌ Please provide an update description");
      return;
    }

    if (!job) {
      setTransactionStatus("❌ Job data is still loading. Please try again in a moment.");
      return;
    }

    if (!isActiveJob) {
      setTransactionStatus("❌ Work can only be submitted while this job is in progress.");
      return;
    }

    if (!isSelectedApplicant) {
      setTransactionStatus("❌ Only the selected applicant can submit work for this job.");
      return;
    }

    // Determine the chain for work submission:
    // Prefer the applier's origin chain (stored in Genesis contract) if known.
    // Fall back to the job's posting chain.
    if (!requiredChainId || !requiredChainConfig) {
      setTransactionStatus("❌ Could not determine required chain for work submission");
      return;
    }

    // Validate user is on required chain
    if (userChainId !== requiredChainId) {
      setTransactionStatus(`⚠️ Please switch to ${requiredChainConfig.name} to submit work. SubmitWork should be called from your application chain.`);
      try {
        await switchToChain(requiredChainId);
        setTransactionStatus(`Switched to ${requiredChainConfig.name}. Please try again.`);
      } catch (switchError) {
        setTransactionStatus(`❌ Failed to switch to ${requiredChainConfig.name}: ${switchError.message}`);
      }
      return;
    }

    try {
      setLoadingT(true);
      setTransactionStatus(`📝 Preparing work submission on ${requiredChainConfig.name}...`);
      
      const updateDetails = {
        jobId,
        jobTaker: walletAddress,
        jobUpdate: updateText,
        title: jobTitle,
        submittedFromChain: requiredChainConfig.name,
        submittedFromChainId: requiredChainId,
        date: new Date().toISOString(),
        description: 'Completed work deliverable for milestone approval',
        attachments: uploadedFiles
      };

      // Upload to IPFS via backend
      setTransactionStatus("📤 Uploading work details to IPFS...");
      const ipfsResponse = await fetch(`${BACKEND_URL}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: {
            ...(await uploadAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinataContent: updateDetails,
          pinataMetadata: {
            name: `work-submission-${jobId}-${Date.now()}`,
            keyvalues: {
              jobId: jobId,
              submitter: walletAddress,
              type: 'work_submission'
            }
          }
        })
      });

      const ipfsData = await ipfsResponse.json();
      if (!ipfsData.IpfsHash) {
        throw new Error("Failed to upload to IPFS");
      }

      const submissionHash = ipfsData.IpfsHash;

      const lowjcContract = await getLOWJCContract(requiredChainId);
      const readOnlyLowjcContract = await getReadOnlyLOWJCContract(requiredChainId);
      const readOnlyWeb3 = getReadOnlyWeb3(requiredChainId);
      const isNativeArbitrum = isNativeArbChain(requiredChainId);
      let quotedFee;
      
      const lzOptions = isNativeArbitrum
        ? null
        : buildLzOptions(DESTINATION_GAS_ESTIMATES.SUBMIT_WORK);
      if (!isNativeArbitrum) {
        setTransactionStatus(`💰 Getting LayerZero fee quote on ${requiredChainConfig.name}...`);
        const payload = readOnlyWeb3.eth.abi.encodeParameters(
          ['string', 'address', 'string', 'string'],
          ['submitWork', walletAddress, jobId, submissionHash]
        );
        quotedFee = await estimateLayerZeroFee(requiredChainId, "SUBMIT_WORK", {
          encodedPayload: payload,
          nativeOptions: lzOptions,
        });
      }

      // Submit work
      setTransactionStatus(`📝 Submitting work on ${requiredChainConfig.name} - Please confirm in MetaMask`);
      
      const writeMethod = createLOWJCWrite(
        lowjcContract,
        requiredChainConfig,
        LOWJC_OPERATIONS.SUBMIT_WORK,
        [jobId, submissionHash],
        lzOptions
      );
      const readOnlyWriteMethod = createLOWJCWrite(
        readOnlyLowjcContract,
        requiredChainConfig,
        LOWJC_OPERATIONS.SUBMIT_WORK,
        [jobId, submissionHash],
        lzOptions
      );
      const sendOptions = await buildEstimatedWriteSendOptions(readOnlyWriteMethod, requiredChainConfig, {
        from: walletAddress,
        value: quotedFee,
      });
      const tx = await writeMethod.send(sendOptions);

      if (isNativeArbitrum) {
        setCrossChainSteps(null);
        setTransactionStatus(`✅ Work submitted directly on Arbitrum! Redirecting...`);
        setTimeout(() => navigate(`/job-update/${jobId}`), 1500);
        return;
      }

      setTransactionStatus(`✅ Work submitted! Tracking sync to Arbitrum...`);

      // Client-side LZ monitoring
      const srcTxHash = tx.transactionHash;
      const lzLink    = `https://layerzeroscan.com/tx/${srcTxHash}`;
      setCrossChainSteps(buildLZSteps({ sourceTxHash: srcTxHash, sourceChainId: requiredChainConfig?.chainId, lzStatus: 'active', lzLink }));
      monitorLZMessage(srcTxHash, (update) => {
        setCrossChainSteps(buildLZSteps({
          sourceTxHash: srcTxHash,
          sourceChainId: requiredChainConfig?.chainId,
          lzStatus:  update.status === STATUS.SUCCESS ? 'delivered' : update.status === STATUS.FAILED ? 'failed' : 'active',
          lzLink:    update.lzLink || lzLink,
          dstTxHash: update.dstTxHash,
          dstChainId: 42161,
        }));
        if (update.status === STATUS.SUCCESS) {
          setTransactionStatus('✅ Work synced to Arbitrum! Redirecting...');
          setTimeout(() => navigate(`/job-update/${jobId}`), 1500);
        }
      });

      // Fallback redirect if LZ monitor doesn't fire in time
      setTimeout(() => navigate(`/job-update/${jobId}`), 30000);
      
    } catch (error) {
      console.error("❌ Error submitting work:", error);
      
      let errorMessage = error.message;
      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      }
      
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setLoadingT(false);
    }
  };

  const handleNavigation = () => {
    window.open(
      "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
    );
  };

  useEffect(() => {
    async function fetchJobDetails() {
      if (!jobId) return;
      
      try {
        // Job lifecycle data lives in Genesis on the active native network.
        const nativeChain = getNativeChain();
        if (!nativeChain?.rpcUrl || !nativeChain?.contracts?.genesis) {
          throw new Error("Native chain Genesis configuration is incomplete");
        }
        const web3 = new Web3(nativeChain.rpcUrl);
        const contract = new web3.eth.Contract(genesisABI, nativeChain.contracts.genesis);

        const jobData = await contract.methods.getJob(jobId).call();

        // Extract the applier's origin chain from the job data (set when job is started)
        // applierOriginChainDomain is a LayerZero EID — convert to EVM chain ID
        if (jobData.applierOriginChainDomain && Number(jobData.applierOriginChainDomain) !== 0) {
          const lzEid = Number(jobData.applierOriginChainDomain);
          const mappedChainId = LZ_EID_TO_CHAIN_ID[lzEid];
          if (mappedChainId) {
            setApplierOriginChainId(mappedChainId);
          }
        }
        
        // Fetch job details from IPFS
        let jobDetails = {};
        if (jobData.jobDetailHash) {
          try {
            const response = await fetch(`/api/ipfs/content/${jobData.jobDetailHash}`);
            jobDetails = await response.json();
          } catch (error) {
            console.warn("Failed to fetch job details from IPFS:", error);
          }
        }

        setJob({
          jobId,
          jobGiver: jobData.jobGiver,
          selectedApplicant: jobData.selectedApplicant,
          status: jobData.status,
          title: jobDetails.title || `Job ${jobId}`,
          ...jobDetails
        });
        
      } catch (error) {
        console.error("Error fetching job details:", error);
      }
    }

    fetchJobDetails();
  }, [jobId]);

  if (loadingT) {
    return (
      <div className="loading-containerT">
        <div className="loading-icon">
          <img src="/OWIcon.svg" alt="Loading..." />
        </div>
        <div className="loading-message">
          <h1 id="txText">Transaction in Progress</h1>
          <p id="txSubtext">
            If the transaction goes through, we'll redirect you to your contract
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {job && (
        <div className="newTitle">
          <div className="titleTop">
            <Link className="goBack" to={`/job-update/${jobId}`}>
              <img className="goBackImage" src="/back.svg" alt="Back Button" />
            </Link>
            <div className="titleText">{job.title}</div>
            <Link className="goBack" to={`/job-update/${jobId}`} style={{visibility:'hidden'}}>
              <img className="goBackImage" src="/back.svg" alt="Back Button" />
            </Link>
          </div>
          <div className="titleBottom">
            <p>
              {" "}
              Contract ID:{" "}
              {formatWalletAddress(
                walletAddress,
              )}
            </p>
            <img
              src="/copy.svg"
              className="copyImage"
              onClick={() =>
                handleCopyToClipboard(
                  walletAddress,
                )
              }
            />
            {copiedAddress === walletAddress && (
              <span style={{ fontSize: '12px', color: '#38a169', marginLeft: '4px' }}>Copied!</span>
            )}
          </div>
        </div>
      )}

      <div className="form-containerDC form-post">
        <div className="form-header">
          <BackButton to={`/job-update/${jobId}`} style={{gap: '20px'}} title="Add New Update"/>
        </div>
        <div className="form-body">
          <form onSubmit={handleSubmit}>
            {transactionStatus && (
              <div className="form-groupDC warning-form">
                <Warning content={transactionStatus} icon="/info.svg" />
              </div>
            )}

            {job && !isActiveJob && (
              <div className="form-groupDC warning-form">
                <Warning
                  content="This job is not in progress, so new work submissions are disabled."
                  variant="warning"
                />
              </div>
            )}

            {job && walletAddress && isActiveJob && !isSelectedApplicant && (
              <div className="form-groupDC warning-form">
                <Warning
                  content="Only the selected applicant wallet can submit work for this job."
                  variant="error"
                />
              </div>
            )}
            {crossChainSteps && (
              <CrossChainStatus title="Work submission cross-chain status" steps={crossChainSteps} />
            )}
            
            {userChainId && requiredChainId && userChainId !== requiredChainId && (
              <div className="form-groupDC warning-form">
                <Warning 
                  content={`Submit Work must be called from ${requiredChainConfig?.name || 'the applicant chain'}. You are on ${userChainConfig?.name || 'an unsupported chain'}. Select Submit Work to switch networks.`}
                  icon="/triangle_warning.svg"
                />
              </div>
            )}
            
            <div className="form-groupDC">
              <FileUpload
                onFilesUploaded={setUploadedFiles}
                uploadedFiles={uploadedFiles}
              />
            </div>
            <div className="form-groupDC">
              <input
                type="text"
                placeholder="Update Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="form-groupDC">
              <textarea
                placeholder="Work Description / Deliverables"
                value={updateText}
                onChange={handleUpdateChange}
              ></textarea>
            </div>
            <BlueButton 
              label={userChainId && requiredChainId && userChainId !== requiredChainId
                ? `Switch to ${requiredChainConfig?.name || 'Required Network'}`
                : 'Submit Work'}
              disabled={!canAttemptSubmission}
              style={{padding: '8px 16px', width: '100%', justifyContent: 'center'}}
            />
          </form>
        </div>
      </div>
    </>
  );
}
