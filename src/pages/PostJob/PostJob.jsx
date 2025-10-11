import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import JobContractABI from "../../ABIs/lowjc_ABI.json";
import BrowseJobsABI from "../../ABIs/nowjc_ABI.json";
import "./PostJob.css";
import { useWalletConnection } from "../../functions/useWalletConnection";
import { formatWalletAddress } from "../../functions/formatWalletAddress";

import BackButton from "../../components/BackButton/BackButton";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import BlueButton from "../../components/BlueButton/BlueButton";
import RadioButton from "../../components/RadioButton/RadioButton";
import Milestone from "../../components/Milestone/Milestone";
import Warning from "../../components/Warning/Warning";

const SKILLOPTIONS = [
  "UX/UI Skill Oracle",
  "Full Stack development",
  "UX/UI Skill Oracle",
];

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const LAYERZERO_OPTIONS_VALUE = import.meta.env.VITE_LAYERZERO_OPTIONS_VALUE;

// Browse Jobs contract (NOWJC on Arbitrum Sepolia)
const BROWSE_JOBS_CONTRACT = import.meta.env.VITE_NOWJC_CONTRACT_ADDRESS;
const ARBITRUM_SEPOLIA_RPC = import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL;

function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const response = await fetch("api-endpoint", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        alert("Image uploaded successfully!");
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("An error occurred while uploading.");
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
      <input
        id="image"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />
      {preview && <img src={preview} alt="Image preview" width="100" />}
    </div>
  );
}

export default function PostJob() {
  const { walletAddress, connectWallet, disconnectWallet } =
    useWalletConnection();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobTaker, setJobTaker] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loadingT, setLoadingT] = useState("");
  const [selectedOption, setSelectedOption] = useState("Single Milestone");
  const [selectedSkillOracle, setSelectedSkillOracle] = useState(
    SKILLOPTIONS[0],
  );
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("Job posting requires blockchain transaction fees");
  const [milestones, setMilestones] = useState([
    {
      title: "Milestone 1",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      amount: 25,
    },
  ]);

  const navigate = useNavigate();

  // Function to extract job ID from LayerZero logs
  const extractJobIdFromLayerZeroLogs = (receipt) => {
    try {
      console.log("🔍 Searching for LayerZero logs in transaction...");
      
      // LayerZero event signature from the documentation
      const layerZeroSignature = "0x1ab700d4ced0c005b164c0f789fd09fcbb0156d4c2041b8a3bfbcd961cd1567f";
      
      // Find LayerZero message log
      const layerZeroLog = receipt.logs.find(log => 
        log.topics && log.topics[0] === layerZeroSignature
      );
      
      if (!layerZeroLog) {
        console.log("❌ LayerZero message log not found");
        console.log("📋 Available logs:", receipt.logs);
        return null;
      }
      
      console.log("✅ Found LayerZero log:", layerZeroLog);
      
      // Extract job ID from the log data
      const logData = layerZeroLog.data;
      console.log("📊 LayerZero log data:", logData);
      
      // Parse the hex data to find job ID pattern (40232-XXX)
      const dataStr = logData.slice(2); // Remove 0x prefix
      const chunks = dataStr.match(/.{1,64}/g) || []; // Split into 32-byte chunks
      
      for (const chunk of chunks) {
        try {
          // Clean chunk (remove trailing zeros)
          const cleanChunk = chunk.replace(/00+$/, "");
          if (cleanChunk.length > 0) {
            const decoded = Web3.utils.hexToUtf8("0x" + cleanChunk);
            console.log("🔤 Decoded chunk:", decoded);
            
            // Check if it matches job ID pattern (numbers-numbers)
            if (decoded.match(/^\d+-\d+$/)) {
              console.log("🎯 Found job ID:", decoded);
              return decoded;
            }
          }
        } catch (e) {
          // Skip invalid UTF8 sequences
          continue;
        }
      }
      
      // Alternative method: Look for specific hex pattern for job IDs starting with 40232
      // "40232-" in hex is "34303233322d"
      const jobIdMatch = dataStr.match(/34303233322d[\da-f]+/i);
      if (jobIdMatch) {
        try {
          const decoded = Web3.utils.hexToUtf8("0x" + jobIdMatch[0]);
          console.log("🎯 Found job ID (pattern match):", decoded);
          
          // Extract just the job ID part (40232-XXX) from the decoded string
          const cleanJobId = decoded.match(/^\d+-\d+/);
          if (cleanJobId) {
            console.log("✨ Cleaned job ID:", cleanJobId[0]);
            return cleanJobId[0];
          }
          
          return decoded;
        } catch (e) {
          console.log("❌ Failed to decode pattern match");
        }
      }
      
      console.log("❌ Job ID not found in LayerZero data");
      return null;
      
    } catch (error) {
      console.error("❌ Error extracting job ID from LayerZero logs:", error);
      return null;
    }
  };

  // Function to check if job exists on Arbitrum Sepolia (browse jobs)
  const checkJobExistsOnArbitrum = async (jobId) => {
    try {
      console.log("🔍 Polling for job ID:", jobId);
      console.log("📍 Checking contract:", BROWSE_JOBS_CONTRACT);
      console.log("🌐 Using RPC:", ARBITRUM_SEPOLIA_RPC);
      
      const arbitrumWeb3 = new Web3(ARBITRUM_SEPOLIA_RPC);
      const browseJobsContract = new arbitrumWeb3.eth.Contract(BrowseJobsABI, BROWSE_JOBS_CONTRACT);
      
      // Try to get the job data
      const jobData = await browseJobsContract.methods.getJob(jobId).call();
      console.log("📋 Job data received:", jobData);
      
      // If job exists and has valid data, return true
      const jobExists = jobData && jobData.id && jobData.id === jobId;
      console.log("✅ Job exists on Arbitrum:", jobExists);
      return jobExists;
    } catch (error) {
      console.log("❌ Job not yet synced:", error.message);
      return false;
    }
  };

  // Function to poll for job sync completion
  const pollForJobSync = async (jobId) => {
    setTransactionStatus("Job posted successfully! Cross-chain sync will take 15-30 seconds...");
    
    // Wait 10 seconds before starting to poll
    await new Promise(resolve => setTimeout(resolve, 10000));
    setTransactionStatus("Checking for cross-chain sync...");
    
    const maxAttempts = 8; // 8 attempts over 35 seconds (after initial 10s wait)
    const pollInterval = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt}/${maxAttempts} for job ${jobId}`);
      
      const jobExists = await checkJobExistsOnArbitrum(jobId);
      
      if (jobExists) {
        setTransactionStatus("Job synced! Redirecting...");
        setTimeout(() => navigate(`/job-details/${jobId}`), 1500);
        return;
      }
      
      // Update status with estimated time remaining
      const timeRemaining = Math.max(0, 45 - (10 + (attempt * 5))); // Total time - elapsed time
      setTransactionStatus(`Syncing job across chains... (~${timeRemaining}s remaining)`);
      
      // Wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // If we get here, polling timed out
    setTransactionStatus("Job posted but sync taking longer than expected. Check browse jobs in a few minutes.");
  };


  // Update milestones based on selected option
  useEffect(() => {
    if (selectedOption === "Single Milestone") {
      setMilestones([
        {
          title: "Milestone 1",
          content:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          amount: 25,
        },
      ]);
    } else {
      setMilestones([
        {
          title: "Milestone 1",
          content:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          amount: 25,
        },
        {
          title: "Milestone 2",
          content:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          amount: 25,
        },
      ]);
    }
  }, [selectedOption]);

  // Calculate total compensation
  const totalCompensation = milestones.reduce(
    (sum, milestone) => sum + milestone.amount,
    0,
  );

  const handleNavigation = () => {
    window.open(
      "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
    );
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleMilestoneUpdate = (index, field, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index][field] = value;
    setMilestones(updatedMilestones);
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
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_API_KEY}`,
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
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_API_KEY}`,
          },
          body: JSON.stringify({
            pinataContent: jobDetails,
            pinataMetadata: {
              name: `job-${Date.now()}`,
              keyvalues: {
                jobTitle: jobDetails.title,
                jobGiver: jobDetails.jobGiver,
                type: "job",
              },
            },
          }),
        },
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error pinning to IPFS:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (window.ethereum) {
      try {
        setLoadingT(true);
        setTransactionStatus("Preparing transaction...");

        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // Check if user is connected to OP Sepolia
        const chainId = await web3.eth.getChainId();
        const OP_SEPOLIA_CHAIN_ID = 11155420;
        
        if (Number(chainId) !== OP_SEPOLIA_CHAIN_ID) {
          alert(`Please switch to OP Sepolia network. Current chain ID: ${chainId}, Required: ${OP_SEPOLIA_CHAIN_ID}`);
          setLoadingT(false);
          setTransactionStatus("❌ Wrong network - please switch to OP Sepolia");
          return;
        }
        
        const accounts = await web3.eth.getAccounts();
        const fromAddress = accounts[0];

        console.log("=== STARTING MILESTONE HASHING ===");
        setTransactionStatus("Uploading milestone data to IPFS...");

        // Step 1: Create hashes for each milestone
        const milestoneHashes = [];
        const milestoneAmounts = [];

        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          console.log(`Hashing milestone ${i}:`, milestone);

          const milestoneHash = await pinMilestoneToIPFS(milestone, i);
          if (!milestoneHash) {
            throw new Error(`Failed to hash milestone ${i}`);
          }

          milestoneHashes.push(milestoneHash);
          milestoneAmounts.push(milestone.amount * 1000000); // Convert to USDT units (6 decimals)

          console.log(`Milestone ${i} hash:`, milestoneHash);
        }

        console.log("All milestone hashes:", milestoneHashes);
        console.log("All milestone amounts:", milestoneAmounts);

        // Step 2: Create comprehensive job details object (including milestone hashes)
        console.log("📝 Creating job details object with:");
        console.log("📋 Job Title:", jobTitle);
        console.log("📄 Job Description:", jobDescription);
        console.log("🎯 Selected Skills:", selectedSkills);
        console.log("🏆 Selected Skill Oracle:", selectedSkillOracle);
        console.log("📊 Selected Option:", selectedOption);
        console.log("🎯 Milestones:", milestones);
        console.log("💰 Total Compensation:", totalCompensation);
        
        const jobDetails = {
          title: jobTitle,
          description: jobDescription,
          skills: selectedSkills,
          skillOracle: selectedSkillOracle,
          milestoneType: selectedOption,
          milestones: milestones, // Original milestone data
          milestoneHashes: milestoneHashes, // IPFS hashes of milestones
          totalCompensation: totalCompensation,
          jobGiver: fromAddress,
          timestamp: new Date().toISOString(),
        };
        
        console.log("📦 Complete jobDetails object:", jobDetails);

        // Step 3: Pin comprehensive job details to IPFS
        setTransactionStatus("Uploading job details to IPFS...");
        const jobResponse = await pinJobDetailsToIPFS(jobDetails);
        console.log("Job IPFS Response:", jobResponse);

        if (jobResponse && jobResponse.IpfsHash) {
          const jobDetailHash = jobResponse.IpfsHash;
          console.log("Job IPFS Hash:", jobDetailHash);

          // Step 4: Prepare contract parameters
          const contract = new web3.eth.Contract(
            JobContractABI,
            contractAddress,
          );

          // DEBUG: Log all transaction data
          console.log("=== TRANSACTION DEBUG ===");
          console.log("Contract Address:", contractAddress);
          console.log("Job Detail Hash:", jobDetailHash);
          console.log("Milestone Hashes (descriptions):", milestoneHashes);
          console.log("Milestone Amounts:", milestoneAmounts);
          console.log("LayerZero Options Value:", LAYERZERO_OPTIONS_VALUE);
          console.log("From Address:", fromAddress);
          console.log(
            "Transaction Value:",
            web3.utils.toWei("0.001", "ether"),
          );
          console.log("Job Details Object:", jobDetails);
          console.log("========================");

          // Step 5: Call postJob function with milestone hashes as descriptions
          setTransactionStatus("Sending transaction to blockchain...");
          contract.methods
            .postJob(
              jobDetailHash,
              milestoneHashes,
              milestoneAmounts,
              LAYERZERO_OPTIONS_VALUE,
            )
            .send({
              from: fromAddress,
              value: web3.utils.toWei("0.001", "ether"),
              gasPrice: await web3.eth.getGasPrice(),
            })
            .on("receipt", function (receipt) {
              console.log("📄 Full transaction receipt:", receipt);
              
              // Extract job ID from LayerZero logs
              const jobId = extractJobIdFromLayerZeroLogs(receipt);
              
              if (jobId) {
                console.log("✅ Extracted Job ID from LayerZero:", jobId);
                setTransactionStatus("✅ Job posted successfully!");
                setLoadingT(false);
                
                // Start polling for cross-chain sync
                pollForJobSync(jobId);
              } else {
                console.log("❌ Could not extract job ID from LayerZero logs");
                setTransactionStatus("✅ Transaction confirmed but job ID extraction failed");
                setLoadingT(false);
              }
            })
            .on("error", function (error) {
              console.error("Error sending transaction:", error);
              setTransactionStatus(`❌ Transaction failed: ${error.message}`);
              setLoadingT(false);
            })
            .on("transactionHash", function (hash) {
              console.log("Transaction hash:", hash);
              setTransactionStatus(`Transaction sent! Hash: ${hash.substring(0, 10)}...`);
            })
            .catch(function (error) {
              console.error("Transaction was rejected:", error);
              setTransactionStatus(`❌ Transaction rejected: ${error.message}`);
              setLoadingT(false);
            });
        } else {
          console.error("Failed to pin job details to IPFS");
          setTransactionStatus("❌ Failed to upload job details to IPFS");
          setLoadingT(false);
        }
      } catch (error) {
        console.error("Error in handleSubmit:", error);
        setLoadingT(false);
      }
    } else {
      console.error("MetaMask not detected");
      setLoadingT(false);
    }
  };

  if (loadingT) {
    return (
      <div className="loading-containerT">
        <div className="loading-icon">
          <img src="/OWIcon.svg" alt="Loading..." />
        </div>
        <div className="loading-message">
          <h1 id="txText">Posting Job...</h1>
          <p id="txSubtext">
            Your job is being posted to the blockchain. Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="form-containerDC form-post">
        <div className="form-header">
          <BackButton to="/work" title="Create a Job" />
          
          {/* Simple Wallet Connection Status */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '20px'
          }}>
            {!walletAddress ? (
              <button
                onClick={connectWallet}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Connect Wallet
              </button>
            ) : (
              <div style={{
                background: '#28a745',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ✓ {formatWalletAddress(walletAddress)}
              </div>
            )}
          </div>
        </div>
        <div className="form-body">
          <div
            onSubmit={handleSubmit}
            style={{
              marginTop: "12px",
            }}
          >
            <div className="form-groupDC">
              <input
                type="text"
                placeholder="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
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
              <ImageUpload />
            </div>
            <div className="form-groupDC skill-dropdown">
              <span>CHOOSE A SKILL ORACLE FOR DISPUTE RESOLUTION</span>
              <DropDown
                label={selectedSkillOracle}
                options={SKILLOPTIONS}
                customCSS="form-dropdown"
                onSelect={setSelectedSkillOracle}
              />
            </div>
            <div className="lineDC form-groupDC"></div>
            <div className="form-groupDC">
              <RadioButton
                label="Single Milestone"
                isSelected={selectedOption === "Single Milestone"}
                onChange={() => setSelectedOption("Single Milestone")}
              />
              <RadioButton
                label="Multiple Milestones"
                isSelected={selectedOption === "Multiple Milestones"}
                onChange={() => setSelectedOption("Multiple Milestones")}
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
                    onUpdate={(field, value) =>
                      handleMilestoneUpdate(index, field, value)
                    }
                  />
                ))}
              </div>
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
            <BlueButton
              label="Post Job"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleSubmit}
            />
            <div className="warning-form">
              <Warning content={transactionStatus} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
