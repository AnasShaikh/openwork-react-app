import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import JobContractABI from "../../JobContractABI.json";
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

 
  const handleReleasePayment = async () => {
      location.pathname = '/project-complete'
    // if (window.ethereum) {
    //   try {
       
    //     setLoadingT(true); // Start loader

    //     const web3 = new Web3(window.ethereum);
    //     await window.ethereum.request({ method: "eth_requestAccounts" });
    //     const accounts = await web3.eth.getAccounts();
    //     const fromAddress = accounts[0];

    //     const jobContractAddress = "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d";
    //     const jobContract = new web3.eth.Contract(
    //       JobContractABI,
    //       jobContractAddress
    //     );

    //     const amountInWei = web3.utils.toWei(releaseAmount, "ether");

    //     jobContract.methods
    //       .releasePartialPayment(jobId, amountInWei)
    //       .send({
    //         from: fromAddress,
    //         gasPrice: await web3.eth.getGasPrice(),
    //       })
    //       .on("receipt", function (receipt) {
    //         console.log("Transaction successful:", receipt);
    //         alert("Payment released successfully!");
    //         navigate(-1);
    //       })
    //       .on("error", function (error) {
    //         console.error("Error releasing payment:", error);
    //         alert("Error releasing payment. Check the console for details.");
    //       })
    //       .finally(() => {
    //         setLoadingT(false); // Stop loader
    //       });
    //   } catch (error) {
    //     console.error("Error releasing payment:", error);
    //     alert("Error releasing payment. Check the console for details.");
    //     setLoadingT(false); // Stop loader on error
    //   }
    // } else {
    //   console.error("MetaMask not detected");
    //   alert("MetaMask is not installed. Please install it to use this app.");
    // }
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
                <JobdetailItem title="AMOUNT PAID TO ESCROW" amount={job.totalEscrowAmount}/>
                <JobdetailItem title="OTHER FEES" icon={true} amount={job.totalEscrowAmount}/>
                <JobdetailItem title="TOTAL AMOUNT LOCKED" amount={job.amountLocked}/>
                <JobdetailItem title="AMOUNT RELEASED" amount={job.amountReleased}/>
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
              <BlueButton label='Release' amount='250' style={{width: '242px', justifyContent:'center', padding: '8px 16px', borderRadius: '12px'}} onClick={handleReleasePayment}/>
              <BlueButton label='Lock' amount='250' style={{width: '198px', justifyContent:'center', padding: '8px 16px', borderRadius: '12px'}}/>
            </div>
            <div className="warning-form">
              <Warning content={"Once the first milestone is done, tokens are also to be paid for the next milestone, along with releasing the payment for the current milestone."} />
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
