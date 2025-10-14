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
  const [walletAddress, setWalletAddress] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true); // Initialize loading state
  const [transactionStatus, setTransactionStatus] = useState("Click to release milestone payment");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [currentMilestoneNumber, setCurrentMilestoneNumber] = useState(1);

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
        alert("Address copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  // Check if user is already connected to MetaMask
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

  function formatWalletAddress(address) {
    if (!address) return "";
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        setAccount(accounts[0]); // Set account when wallet is connected
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  };

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
        console.log("🔍 Fetching job details for jobId:", jobId);
        
        // Use NOWJC contract on Arbitrum Sepolia
        const ARBITRUM_SEPOLIA_RPC = import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL;
        const CONTRACT_ADDRESS = import.meta.env.VITE_NOWJC_CONTRACT_ADDRESS || "0x9E39B37275854449782F1a2a4524405cE79d6C1e";
        
        const web3 = new Web3(ARBITRUM_SEPOLIA_RPC);
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

        // Fetch job details from NOWJC contract
        const jobData = await contract.methods.getJob(jobId).call();
        console.log("📋 Job data from NOWJC:", jobData);

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

        // For release payment, we need to check current milestone status
        // This is a simplified version - you may need to add more logic based on milestone completion
        const currentMilestone = jobData.currentMilestone ? Number(jobData.currentMilestone) : 0;
        const releasableAmount = currentMilestone < jobData.milestonePayments.length 
          ? (parseFloat(jobData.milestonePayments[currentMilestone]?.amount || 0) / 1000000).toFixed(2)
          : "0.00";

        setJob({
          jobId,
          jobGiver: jobData.jobGiver,
          selectedApplicant: jobData.selectedApplicant,
          jobStatus: jobData.status,
          totalBudget: totalBudgetUSDC,
          currentMilestone,
          releasableAmount,
          milestonePayments: jobData.milestonePayments,
          currentLockedAmount: jobData.currentLockedAmount || 0,
          totalReleased: jobData.totalReleased || 0,
          ...jobDetails,
        });

        console.log("✅ Job details loaded successfully");
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

    try {
      setIsProcessing(true);
      setTransactionStatus("🔄 Step 1/2: Releasing payment on OP Sepolia...");
      
      const OP_SEPOLIA_RPC = import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL;
      const LOWJC_CONTRACT_ADDRESS = import.meta.env.VITE_LOWJC_CONTRACT_ADDRESS || "0x896a3Bc6ED01f549Fe20bD1F25067951913b793C";
      const web3 = new Web3(window.ethereum);
      
      // Ensure user is on OP Sepolia
      const chainId = await web3.eth.getChainId();
      const opSepoliaChainId = 11155420;
      
      if (chainId !== opSepoliaChainId) {
        setTransactionStatus("🔗 Switching to OP Sepolia network...");
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa37dc' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa37dc',
                chainName: 'OP Sepolia',
                rpcUrls: [OP_SEPOLIA_RPC],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const lowjcContract = new web3.eth.Contract(lowjcABI, LOWJC_CONTRACT_ADDRESS);
      
      // Get the amount to release (convert BigInt to string for web3.js)
      const amount = (job.currentLockedAmount || 0).toString();
      
      // Get LayerZero fee quote
      setTransactionStatus("💰 Getting LayerZero fee quote...");
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
      const nativeOptions = "0x0003010011010000000000000000000000000007a120";
      
      // Encode payload for releasePaymentCrossChain (must match LOWJC's encoding)
      const payload = web3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'uint256', 'uint32', 'address'],
        ['releasePaymentCrossChain', walletAddress, jobId, amount, 2, job.selectedApplicant]
      );
      
      const quotedFee = await bridgeContract.methods.quoteNativeChain(payload, nativeOptions).call();
      console.log("💰 LayerZero quoted fee:", web3.utils.fromWei(quotedFee, 'ether'), "ETH");
      
      setTransactionStatus("💰 Releasing payment - Please confirm in MetaMask");
      
      const releasePaymentTx = await lowjcContract.methods.releasePaymentCrossChain(
        jobId,
        2,
        job.selectedApplicant,
        nativeOptions
      ).send({
        from: walletAddress,
        value: quotedFee // Use quoted fee
      });

      console.log("✅ Payment release initiated:", releasePaymentTx.transactionHash);
      
      // Step 2: Send to backend for CCTP processing
      setTransactionStatus("🔄 Step 2/2: Backend processing CCTP transfer...");
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/release-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId,
          opSepoliaTxHash: releasePaymentTx.transactionHash
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTransactionStatus("✅ Backend is processing payment! You can close this window.");
        
        // Optional: Poll for status updates
        pollPaymentStatus(jobId, backendUrl);
      } else {
        throw new Error(result.error || 'Backend failed to start processing');
      }

    } catch (error) {
      console.error("❌ Error releasing payment:", error);
      
      let errorMessage = error.message;
      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (error.message.includes("network")) {
        errorMessage = "Network switching failed - please switch to OP Sepolia manually";
      }
      
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  // Optional: Poll backend for status updates
  const pollPaymentStatus = async (jobId, backendUrl, maxAttempts = 60) => {
    let attempts = 0;
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setTransactionStatus("⏱️ Still processing... Check back later");
        setIsProcessing(false);
        return;
      }
      
      try {
        const response = await fetch(`${backendUrl}/api/release-payment-status/${jobId}`);
        const status = await response.json();
        
        if (status.success) {
          if (status.status === 'completed') {
            setTransactionStatus("🎉 Milestone payment released! You can now lock the next milestone.");
            setIsProcessing(false);
            return;
          } else if (status.status === 'failed') {
            setTransactionStatus(`❌ Payment failed: ${status.error || status.message}`);
            setIsProcessing(false);
            return;
          } else {
            // Still processing
            setTransactionStatus(`🔄 ${status.message || 'Processing...'}`);
            attempts++;
            setTimeout(checkStatus, 5000); // Check every 5 seconds
          }
        }
      } catch (error) {
        console.warn("Status check failed:", error);
        attempts++;
        setTimeout(checkStatus, 5000);
      }
    };
    
    setTimeout(checkStatus, 5000); // Start checking after 5 seconds
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

    try {
      setIsLocking(true);
      setTransactionStatus(`🔒 Locking Milestone ${currentMilestoneNumber + 1}...`);
      
      const OP_SEPOLIA_RPC = import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL;
      const LOWJC_CONTRACT_ADDRESS = import.meta.env.VITE_LOWJC_CONTRACT_ADDRESS || "0x896a3Bc6ED01f549Fe20bD1F25067951913b793C";
      const USDC_ADDRESS = "0x5fd84259d66Cd46123540766Be93DFE6d43130D7"; // OP Sepolia USDC
      const web3 = new Web3(window.ethereum);
      
      // Ensure user is on OP Sepolia
      const chainId = await web3.eth.getChainId();
      const opSepoliaChainId = 11155420;
      
      if (chainId !== opSepoliaChainId) {
        setTransactionStatus("🔗 Switching to OP Sepolia network...");
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa37dc' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa37dc',
                chainName: 'OP Sepolia',
                rpcUrls: [OP_SEPOLIA_RPC],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get next milestone amount from job data
      const nextMilestoneIndex = currentMilestoneNumber; // 0-indexed
      if (nextMilestoneIndex >= job.milestonePayments.length) {
        setTransactionStatus("❌ No more milestones to lock");
        setIsLocking(false);
        return;
      }

      const nextMilestoneAmount = job.milestonePayments[nextMilestoneIndex].amount;
      
      // Approve USDC spending
      setTransactionStatus("💰 Approving USDC spending - Please confirm in MetaMask");
      const usdcContract = new web3.eth.Contract(
        [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
        USDC_ADDRESS
      );
      
      await usdcContract.methods.approve(LOWJC_CONTRACT_ADDRESS, nextMilestoneAmount).send({
        from: walletAddress
      });

      console.log("✅ USDC approval successful");
      
      // Get LayerZero fee quote for lockNextMilestone
      setTransactionStatus("🔒 Getting LayerZero fee quote...");
      const lowjcContract = new web3.eth.Contract(lowjcABI, LOWJC_CONTRACT_ADDRESS);
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
      const nativeOptions = "0x0003010011010000000000000000000000000007a120";
      
      // Encode payload for lockNextMilestone
      const payload = web3.eth.abi.encodeParameters(
        ['string', 'address', 'string', 'uint256'],
        ['lockNextMilestone', walletAddress, jobId, nextMilestoneAmount]
      );
      
      const quotedFee = await bridgeContract.methods.quoteNativeChain(payload, nativeOptions).call();
      console.log("💰 LayerZero quoted fee:", web3.utils.fromWei(quotedFee, 'ether'), "ETH");
      
      setTransactionStatus("🔒 Locking milestone - Please confirm in MetaMask");
      
      const lockTx = await lowjcContract.methods.lockNextMilestone(
        jobId,
        nativeOptions
      ).send({
        from: walletAddress,
        value: quotedFee // Use quoted fee
      });

      console.log("✅ Milestone locked:", lockTx.transactionHash);
      
      setTransactionStatus(`✅ Milestone ${currentMilestoneNumber + 1} locked successfully! You can now release it.`);
      setCurrentMilestoneNumber(currentMilestoneNumber + 1);
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
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="newTitle">
         <div className="titleTop">
          <Link className="goBack" to={`/job-details/${jobId}`}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
          <div className="titleText" style={{fontWeight:'550'}}>{job.title}</div>
         </div>
         <div className="titleBottom"><p>  Contract ID:{" "}
         {formatWalletAddress("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}
         </p><img src="/copy.svg" className="copyImage" onClick={() =>
                 handleCopyToClipboard(
                   "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d"
                 )
               }
               /></div>
       </div>

      <div className="release-payment-container">
        <div className="form-container-release">
          <div className="sectionTitle">
            <span id="rel-title">Release Payment</span>
          </div>
          <div className="release-payment-body">
            <div className="form-groupDC job-body">
              <div className="job-detail-sectionR">
                <JobdetailItem 
                  title={`CURRENT MILESTONE #${currentMilestoneNumber}`} 
                  amount={job.milestonePayments[currentMilestoneNumber - 1] ? formatAmount(safeNumber(job.milestonePayments[currentMilestoneNumber - 1].amount) / 1000000) : '0'}
                />
                <JobdetailItem 
                  title="TOTAL MILESTONES" 
                  amount={job.milestonePayments.length}
                />
                <JobdetailItem 
                  title="AMOUNT RELEASED" 
                  amount={formatAmount(safeNumber(job.totalReleased || 0) / 1000000)}
                />
                <JobdetailItem 
                  title="AMOUNT LOCKED" 
                  amount={formatAmount(safeNumber(job.currentLockedAmount || 0) / 1000000)}
                />
              </div>
            </div>
            <div className="form-groupDC">
              <DropDown label={OPTIONS[0]} options={OPTIONS} customCSS="form-dropdown" width={true}/>
            </div>
            <div className="form-groupDC job-body">
              <div className="job-detail-sectionR">
                <JobdetailItem title="MILESTONE 3 AMOUNT" icon={true} amount={250}/>
                <JobdetailItem title="NEXT MILESTONE AMOUNT" icon={true} amount={250}/>
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
                amount={job.milestonePayments[currentMilestoneNumber - 1] ? formatAmount(safeNumber(job.milestonePayments[currentMilestoneNumber - 1].amount) / 1000000) : '0'} 
                style={{
                  width: '242px', 
                  justifyContent:'center', 
                  padding: '8px 16px', 
                  borderRadius: '12px',
                  opacity: isProcessing ? 0.7 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleReleasePayment}
                disabled={isProcessing}
              />
              <BlueButton 
                label={isLocking ? 'Locking...' : 'Lock Next'} 
                amount={job.milestonePayments[currentMilestoneNumber] ? formatAmount(safeNumber(job.milestonePayments[currentMilestoneNumber].amount) / 1000000) : '0'} 
                style={{
                  width: '198px', 
                  justifyContent:'center', 
                  padding: '8px 16px', 
                  borderRadius: '12px',
                  opacity: isLocking ? 0.7 : 1,
                  cursor: isLocking ? 'not-allowed' : 'pointer'
                }}
                onClick={handleLockNextMilestone}
                disabled={isLocking}
              />
            </div>
            <div className="warning-form">
              <Warning content={transactionStatus} />
            </div>
          </div>
        </div>
        {/* <PaymentItem title="Payment 2" />
        <PaymentItem title="Payment 1" /> */}
        <div className="milestone-section-body">
            <Milestone amount={25} title="Milestone 1" date="7 May, 2024" content={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} editable={true}/>
            <Milestone amount={25} title="Milestone 2" date="2 May, 2024" content={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} editable={true}/>
        </div>
      </div>
    </>
  );
}
