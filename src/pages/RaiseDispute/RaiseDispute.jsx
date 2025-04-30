import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom"; // Import useNavigate
import Web3 from "web3";
import JobContractABI from "../../JobContractABI.json";
import L1ABI from "../../L1ABI.json";
import "./RaiseDispute.css";
import { useWalletConnection } from "../../functions/useWalletConnection"; // Manages wallet connection logic
import { formatWalletAddress } from "../../functions/formatWalletAddress"; // Utility function to format wallet address

import BackButton from "../../components/BackButton/BackButton";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import BlueButton from "../../components/BlueButton/BlueButton";

const SKILLOPTIONS = [
  'UX/UI Skill Oracle','Full Stack development','UX/UI Skill Oracle',
]


const contractAddress = "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d";

function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file)); // For preview display
  };

  const handleImageUpload = async () => {
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // Replace 'your-api-endpoint' with the actual upload URL
      const response = await fetch('api-endpoint', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Image uploaded successfully!');
      } else {
        alert('Upload failed.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('An error occurred while uploading.');
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
      {preview && <img src={preview} alt="Image preview" width="100" />}
      {/* <button style={{display: 'none'}} onClick={handleImageUpload} disabled={!selectedImage}>
        Upload Image
      </button> */}
    </div>
  );
}

export default function RaiseDispute() {
//   const { walletAddress, connectWallet, disconnectWallet } = useWalletConnection();
const { jobId } = useParams();
const [job, setJob] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobTaker, setJobTaker] = useState("");
  const [amount, setAmount] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loadingT, setLoadingT] = useState("");
  const [loading, setLoading] = useState(true); // Initialize loading state

  const navigate = useNavigate(); // Initialize useNavigate

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
        const web3 = new Web3("https://erpc.xinfin.network"); // Using the specified RPC endpoint
        const contractAddress = "0x00844673a088cBC4d4B4D0d63a24a175A2e2E637";
        const contract = new web3.eth.Contract(L1ABI, contractAddress);

        // Fetch job details
        const jobDetails = await contract.methods.getJobDetails(jobId).call();
        const ipfsHash = jobDetails.jobDetailHash;
        const ipfsData = await fetchFromIPFS(ipfsHash);

        // Fetch proposed amount using getApplicationProposedAmount
        const proposedAmountWei = await contract.methods
          .getApplicationProposedAmount(jobId)
          .call();

        // Fetch escrow amount using getJobEscrowAmount
        const escrowAmountWei = await contract.methods
          .getJobEscrowAmount(jobId)
          .call();

        // Convert amounts from wei to ether
        const proposedAmount = web3.utils.fromWei(proposedAmountWei, "ether");
        const currentEscrowAmount = web3.utils.fromWei(escrowAmountWei, "ether");

        const amountReleased = proposedAmount - currentEscrowAmount;

        setJob({
          jobId,
          employer: jobDetails.employer,
          escrowAmount: currentEscrowAmount,
          isJobOpen: jobDetails.isOpen,
          totalEscrowAmount: proposedAmount,
          amountLocked: currentEscrowAmount,
          amountReleased: amountReleased,
          ...ipfsData,
        });

        setLoading(false); // Stop loading animation after fetching data
      } catch (error) {
        console.error("Error fetching job details:", error);
        setLoading(false); // Ensure loading stops even if there is an error
      }
    }

    fetchJobDetails();
  }, [jobId]);


  const fetchFromIPFS = async (hash) => {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching data from IPFS:", error);
      return {};
    }
  };

  const handleNavigation = () => {
    window.open("https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view", "_blank");
  };

  const formatAmount = (amount) => {
    if (parseFloat(amount) === 0) return "0"; // Handle zero value without decimal
    const roundedAmount = parseFloat(amount).toFixed(2); // Rounds to 2 decimal places
    return roundedAmount.length > 5 ? roundedAmount.slice(0, 8) : roundedAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (window.ethereum) {
      try {
        setLoadingT(true); // Start loader

        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        const fromAddress = accounts[0];

        const jobDetails = {
          title: jobTitle,
          description: jobDescription,
          type: jobType,
          jobTaker: jobTaker,
          amount: amount,
          jobGiver: fromAddress,
        };

        const response = await pinJobDetailsToIPFS(jobDetails);

        if (response && response.IpfsHash) {
          const jobDetailHash = response.IpfsHash;
          console.log("IPFS Hash:", jobDetailHash);

          const contract = new web3.eth.Contract(
            JobContractABI,
            contractAddress,
          );
          const amountInWei = web3.utils.toWei(amount, "ether");

          contract.methods
            .enterDirectContract(jobDetailHash, jobTaker)
            .send({
              from: fromAddress,
              value: amountInWei,
              gasPrice: await web3.eth.getGasPrice(),
            })
            .on("receipt", function (receipt) {
              const events = receipt.events.ContractEntered;
              if (events && events.returnValues) {
                const jobId = events.returnValues.jobId;
                console.log("Job ID from event:", jobId);

                navigate(`/job-details/${jobId}`);
              }
            })
            .on("error", function (error) {
              console.error("Error sending transaction:", error);
            })
            .finally(() => {
              setLoadingT(false); // Stop loader when done
            });
        } else {
          console.error("Failed to pin job details to IPFS");
          setLoadingT(false); // Stop loader on error
        }
      } catch (error) {
        console.error("Error sending transaction:", error);
        setLoadingT(false); // Stop loader on error
      }
    } else {
      console.error("MetaMask not detected");
      setLoadingT(false); // Stop loader if MetaMask is not detected
    }
  };

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
            <div className="titleText">{job.title}</div>
            <Link className="goBack" to={`/job-details/${jobId}`} style={{visibility:'hidden'}}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
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
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="form-groupDC">
              
              <textarea
                placeholder="Dispute Explanation"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="form-groupDC amountDC">
              
              <input
                id="amountInput"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="form-groupDC ">
              
              <input
                type="text"
                placeholder="Enter Wallet ID of the disputed fund receiver"
                value={jobTaker}
                onChange={(e) => setJobTaker(e.target.value)}
              />
              <div className="dispute-description">
                <img src="/dispute-description.svg" alt="" />
                <span>When the dispute is resolved, the above entered wallet would receive the funds </span>
              </div>
            </div>
            <div className="form-groupDC">
              <ImageUpload />
            </div>
            <div className="form-groupDC form-platformFee">
              <div className="platform-fee">
                <span>DISPUTE WILL BE RESOLVED BY</span>
                <img src="/fee.svg" alt="" />
              </div>
              <span className="dispute-skill">UX/UI Skill Oracle</span>
            </div>
            <div className="form-groupDC compensation">
                <span>COMPEENSATION FOR RESOLUTION</span>
                <div className="amountDC">
                    <input
                        id="amountInput"
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div className="dispute-description">
                    <img src="/dispute-description.svg" alt="" />
                    <span>This is the compensation that you’re willing to pay to members of the Skill Oracle for their efforts in helping you resolve this dispute</span>
                </div>
            </div>
            <BlueButton label="Submit" style={{width: '100%', justifyContent: 'center'}}/>
          </form>
        </div>
      </div>
    </>
  );
}
