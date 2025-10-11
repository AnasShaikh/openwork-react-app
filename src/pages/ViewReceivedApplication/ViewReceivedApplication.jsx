import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import Web3 from "web3";
import contractABI from "../../ABIs/lowjc_ABI.json";
import "./ViewReceivedApplication.css";
import Button from "../../components/Button/Button";
import VoteBar from "../../components/VoteBar/VoteBar";
import BackButton from "../../components/BackButton/BackButton";
import StatusButton from "../../components/StatusButton/StatusButton";
import Milestone from "../../components/Milestone/Milestone";
import Warning from "../../components/Warning/Warning";

// LOWJC Contract on OP Sepolia
const CONTRACT_ADDRESS = import.meta.env.VITE_LOWJC_CONTRACT_ADDRESS || "0x896a3Bc6ED01f549Fe20bD1F25067951913b793C";
const OP_SEPOLIA_RPC = import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL;

// Multi-gateway IPFS fetch function
const fetchFromIPFS = async (hash, timeout = 5000) => {
  const gateways = [
    `https://ipfs.io/ipfs/${hash}`,
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
    `https://dweb.link/ipfs/${hash}`
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

function JobdetailItem ({title, icon , amount, token}) {
  return (
    <div className="job-detail-item">
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <span className="job-detail-item-title">{title}</span>
        {icon && <img src="/fee.svg" alt="" />}
      </div>
      <div id="fetchedAmounts">
          {amount}{" "}
        <img src={token?"/token.svg":"/xdc.svg"} alt="USDC" className="usdc-iconJD" />
      </div>
    </div>
  )
}

function ATTACHMENTS({title}) {
    return (
      <div className="attachment-form">
        <img src="/attachments.svg" alt="" />
        <span>{title}</span>
      </div>
    )
  }

export default function ViewReceivedApplication() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const applicationId = searchParams.get('applicationId');
  
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [milestoneDetails, setMilestoneDetails] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState("Start job requires USDC approval and blockchain transaction fees");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error);
        }
      }
    };
    checkWalletConnection();
  }, []);

  // Fetch application data
  useEffect(() => {
    async function fetchApplicationData() {
      if (!jobId || !applicationId) {
        console.error("Missing jobId or applicationId in URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const web3 = new Web3(OP_SEPOLIA_RPC);
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

        // Fetch job data
        const jobData = await contract.methods.getJob(jobId).call();
        console.log("Job data:", jobData);
        setJob(jobData);

        // Fetch application data
        const appData = await contract.methods.getApplication(jobId, applicationId).call();
        console.log("Application data:", appData);
        setApplication(appData);

        // Fetch application details from IPFS
        if (appData.applicationHash) {
          try {
            const appDetails = await fetchFromIPFS(appData.applicationHash);
            setApplicationDetails(appDetails);
          } catch (error) {
            console.warn("Failed to fetch application details from IPFS:", error);
          }
        }

        // Fetch milestone details from IPFS
        if (appData.proposedMilestones && appData.proposedMilestones.length > 0) {
          const milestonePromises = appData.proposedMilestones.map(async (milestone, index) => {
            if (milestone.descriptionHash) {
              try {
                const milestoneData = await fetchFromIPFS(milestone.descriptionHash);
                return {
                  ...milestoneData,
                  amount: (parseFloat(milestone.amount) / 1000000).toFixed(2), // Convert from USDC units
                  index
                };
              } catch (error) {
                console.warn(`Failed to fetch milestone ${index} from IPFS:`, error);
                return {
                  title: `Milestone ${index + 1}`,
                  content: "Failed to load milestone details",
                  amount: (parseFloat(milestone.amount) / 1000000).toFixed(2),
                  index
                };
              }
            }
            return {
              title: `Milestone ${index + 1}`,
              content: "No description available",
              amount: (parseFloat(milestone.amount) / 1000000).toFixed(2),
              index
            };
          });

          const milestones = await Promise.all(milestonePromises);
          setMilestoneDetails(milestones);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching application data:", error);
        setLoading(false);
      }
    }

    fetchApplicationData();
  }, [jobId, applicationId]);

  const formatWalletAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const getTotalAmount = () => {
    return milestoneDetails.reduce((sum, milestone) => sum + parseFloat(milestone.amount), 0).toFixed(2);
  };

  const handleStartJob = async () => {
    // Comprehensive validation before starting
    if (!walletAddress) {
      setTransactionStatus("❌ Please connect your wallet first");
      return;
    }

    if (!jobId) {
      setTransactionStatus("❌ Job ID not found");
      return;
    }

    if (!applicationId) {
      setTransactionStatus("❌ Application ID not found");
      return;
    }

    if (!milestoneDetails || milestoneDetails.length === 0) {
      setTransactionStatus("❌ No milestone data available - cannot calculate funding amount");
      return;
    }

    // Get first milestone amount from job's original milestones (since useAppMilestones = false)
    const firstMilestoneAmount = job ? (parseFloat(job.milestonePayments[0]?.amount || 0) / 1000000) : 0;
    if (firstMilestoneAmount <= 0) {
      setTransactionStatus("❌ Invalid milestone amount - must be greater than 0");
      return;
    }

    try {
      setIsProcessing(true);
      setTransactionStatus("🔄 Preparing transactions and validating contracts...");
      
      // Initialize Web3
      const web3 = new Web3(window.ethereum);
      
      // Contract addresses and validation
      const usdcTokenAddress = "0x5fd84259d66cd46123540766be93dfe6d43130d7"; // OP Sepolia USDC
      
      // USDC ERC20 ABI (minimal required functions)
      const erc20ABI = [
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
        }
      ];
      
      // Initialize contracts
      const usdcContract = new web3.eth.Contract(erc20ABI, usdcTokenAddress);
      const lowjcContract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
      
      // Calculate amount in USDC units (6 decimals)
      const amountInUSDCUnits = Math.floor(firstMilestoneAmount * 1000000);
      
      console.log("🚀 Starting job with validated parameters:", {
        jobId,
        applicationId: parseInt(applicationId),
        firstMilestoneAmount,
        amountInUSDCUnits,
        walletAddress,
        chainId: await web3.eth.getChainId()
      });
      
      // Check user's USDC balance before approval
      setTransactionStatus("🔍 Checking USDC balance...");
      try {
        const userBalance = await usdcContract.methods.balanceOf(walletAddress).call();
        const balanceInUSDC = parseFloat(userBalance) / 1000000;
        
        if (parseFloat(userBalance) < amountInUSDCUnits) {
          throw new Error(`Insufficient USDC balance. Required: ${firstMilestoneAmount} USDC, Available: ${balanceInUSDC.toFixed(2)} USDC`);
        }
        
        console.log(`✅ USDC balance check passed: ${balanceInUSDC.toFixed(2)} USDC available`);
      } catch (balanceError) {
        throw new Error(`Balance check failed: ${balanceError.message}`);
      }
      
      // ============ TRANSACTION 1: USDC APPROVAL ============
      setTransactionStatus(`💰 Step 1/2: Approving ${firstMilestoneAmount} USDC spending - Please confirm in MetaMask`);
      
      let approveTx;
      try {
        approveTx = await usdcContract.methods.approve(
          CONTRACT_ADDRESS, 
          amountInUSDCUnits.toString()
        ).send({
          from: walletAddress
        });
        
        if (!approveTx || !approveTx.transactionHash) {
          throw new Error("Approval transaction failed - no transaction hash received");
        }
        
        console.log("✅ USDC approval confirmed:", {
          txHash: approveTx.transactionHash,
          blockNumber: approveTx.blockNumber,
          gasUsed: approveTx.gasUsed
        });
        
        setTransactionStatus(`✅ Step 1/2: USDC approval confirmed (${approveTx.transactionHash.substring(0, 8)}...)`);
        
      } catch (approvalError) {
        if (approvalError.code === 4001) {
          throw new Error("USDC approval cancelled by user");
        }
        throw new Error(`USDC approval failed: ${approvalError.message}`);
      }
      
      // Wait for transaction to be properly mined before proceeding
      setTransactionStatus("⏳ Waiting for approval confirmation...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ============ TRANSACTION 2: START JOB ============
      setTransactionStatus("🔧 Step 2/2: Starting job with selected application - Please confirm in MetaMask");
      
      let startJobTx;
      try {
        startJobTx = await lowjcContract.methods.startJob(
          jobId,
          parseInt(applicationId), 
          false, // useAppMilestones - use job giver's original milestones as per logs
          "0x0003010011010000000000000000000000000007a120" // LayerZero options from logs
        ).send({
          from: walletAddress,
          value: web3.utils.toWei("0.001", "ether") // LayerZero fee
        });
        
        if (!startJobTx || !startJobTx.transactionHash) {
          throw new Error("Start job transaction failed - no transaction hash received");
        }
        
        console.log("🎉 Job started successfully:", {
          txHash: startJobTx.transactionHash,
          blockNumber: startJobTx.blockNumber,
          gasUsed: startJobTx.gasUsed,
          jobId,
          applicationId: parseInt(applicationId)
        });
        
        setTransactionStatus(`🎉 Job started successfully! Transaction: ${startJobTx.transactionHash.substring(0, 8)}... Redirecting...`);
        
      } catch (startJobError) {
        if (startJobError.code === 4001) {
          throw new Error("Start job transaction cancelled by user");
        }
        throw new Error(`Start job failed: ${startJobError.message}`);
      }
      
      // Success! Redirect after a moment
      setTimeout(() => {
        setTransactionStatus("🚀 Redirecting to job details...");
        window.location.href = `/job-deep-view/${jobId}`;
      }, 3000);
      
    } catch (error) {
      console.error("❌ Error starting job:", error);
      
      // More detailed error messages for better UX
      let errorMessage = error.message;
      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (error.message.includes("User denied")) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Transaction failed - contract requirements not met";
      }
      
      setTransactionStatus(`❌ Failed: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-containerT">
        <div className="loading-icon">
          <img src="/OWIcon.svg" alt="Loading..." />
        </div>
        <div className="loading-message">
          <h1 id="txText">Loading Application...</h1>
          <p id="txSubtext">
            Fetching application details from the blockchain and IPFS.
          </p>
        </div>
      </div>
    );
  }

  if (!application || !job) {
    return (
      <div className="release-payment-container">
        <div className="form-container-release">
          <div className="form-header" style={{marginTop:'109px'}}>
            <BackButton to={`/job-deep-view/${jobId}`} style={{gap: '20px'}} title="Application Not Found"/>
          </div>
          <div className="form-body">
            <p>Application not found. Please check the URL parameters.</p>
            <p>Expected: /view-received-application?jobId={jobId}&applicationId={applicationId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="release-payment-container">
        <div className="form-container-release">
        <div className="form-header" style={{marginTop:'109px'}}>
          <BackButton to={`/job-deep-view/${jobId}`} style={{gap: '20px'}} title={`Application for Job ${jobId}`}/>
          <StatusButton status={'Pending'} statusCss={'pending-status'}/>
        </div>
          <div className="form-body">
            <div className="job-show-details">
                <span>{applicationDetails?.jobTitle || job?.jobDetailHash || `Job ${jobId}`}</span>
                <div className="show-details">
                    <span>Show Details</span>
                    <img src="/array.svg" alt="" />
                </div>
            </div>
            <div>
                <div className="detail-row">
                    <span className="detail-label">APPLICATION SUBMITTED BY</span>
                    <div className="detail-profile">
                    <span className="detail-value-address">
                        <img src="/person.svg" alt="Applicant" className="Job" />
                        <p>{formatWalletAddress(application.applicant)}</p>
                    </span>
                    </div>
                </div>
            </div>
            <div>
                <div className="detail-row">
                    <span className="detail-label">DESCRIPTION</span>
                    <div className="detail-value description-value">
                        <p>{applicationDetails?.description || "No description available"}</p>
                    </div>
                </div>
            </div>
            <div>
                <div className="detail-row category">
                    <span>ATTACHMENTS</span>
                    <div className="upload-content">
                        <ATTACHMENTS title={'Scope of work.pdf'}/>
                        <ATTACHMENTS title={'Reference 1.png'}/>
                    </div>
                </div>
            </div>
            <div className="milestone-section">
                <div className="milestone-section-header">
                    <span>MILESTONES</span>
                </div>
                <div className="milestone-section-body">
                    {milestoneDetails.length > 0 ? (
                      milestoneDetails.map((milestone, index) => (
                        <Milestone 
                          key={index}
                          amount={milestone.amount} 
                          title={milestone.title} 
                          content={milestone.content} 
                          editable={false}
                        />
                      ))
                    ) : (
                      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                        No milestones defined for this application
                      </div>
                    )}
                </div>
            </div>
            <div className="form-platformFee">
              <div className="platform-fee">
                <span>REVISED COST</span>
                <img src="/fee.svg" alt="" />
              </div>
              <div className="compensation-amount">
                <span>{getTotalAmount()}</span>
                <img src="/xdc.svg" alt="USDC" className="usdc-iconJD" />
              </div>
            </div>
            <div>
               <div className="vote-button-section">
                    <Button 
                      label={isProcessing ? 'Processing...' : 'Start Job with this Application'} 
                      buttonCss={'downvote-button upvote-button'}
                      onClick={handleStartJob}
                      style={{ 
                        width: '100%',
                        opacity: isProcessing ? 0.7 : 1,
                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                      }}
                      disabled={isProcessing}
                    />
               </div>
               <div className="warning-form">
                 <Warning content={transactionStatus} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
