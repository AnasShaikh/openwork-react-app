import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import "./JobUpdate.css";

import JobItem from "../../components/JobItem/JobItem";
import BlueButton from "../../components/BlueButton/BlueButton";


const JOBITEMS = [
  {
      icon: 'user.png',
      inform: 'Mollie submitted an application!',
      devName: 'Mollie Hall',
      time: 20,
  },
  {
      icon: 'user.png',
      inform: 'Jollie just paid you',
      devName: 'Jollie Hall',
      time: 20,
      payAmount: 28.762
  },
  {
      icon: 'user.png',
      inform: 'Mollie submitted an application!',
      devName: 'Mollie Hall',
      time: 20,
  },
  {
      icon: 'user.png',
      inform: 'Mollie submitted an application!',
      devName: 'Mollie Hall',
      time: 20,
  }
]

export default function JobUpdate() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate()

  function formatWalletAddressH(address) {
    if (!address) return "";
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  function goAddUpdate() {
    navigate(`/add-update/${jobId}`);
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

  const toggleCardExpansion = (index) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  function formatWalletAddressH(address) {
    if (!address) return "";
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const web3 = new Web3(
          new Web3.providers.HttpProvider("https://erpc.xinfin.network"),
        );

        const contractAddress = "0x00844673a088cBC4d4B4D0d63a24a175A2e2E637";
        const contract = new web3.eth.Contract(L1ABI, contractAddress);

        const jobDetails = await contract.methods.getJobDetails(jobId).call();
        const ipfsHash = jobDetails.jobDetailHash;
        const ipfsData = await fetchFromIPFS(ipfsHash);

        setJob({
          jobId,
          employer: jobDetails.employer,
          escrowAmount: web3.utils.fromWei(jobDetails.escrowAmount, "ether"),
          isJobOpen: jobDetails.isOpen,
          title: ipfsData.title,
          jobTaker: ipfsData.jobTaker, // Fetch jobTaker from IPFS data
          ...ipfsData,
        });

        const submissionIDs = await contract.methods
          .getJobSubmissionIDs(jobId)
          .call();
        const jobUpdates = await Promise.all(
          submissionIDs.map(async (submissionID) => {
            const submission = await contract.methods
              .getWorkSubmission(submissionID)
              .call();
            const submissionHash = submission.submissionHash;
            const submissionData = await fetchFromIPFS(submissionHash);
            return {
              ...submission,
              ...submissionData,
            };
          }),
        );

        setUpdates(jobUpdates);
        setLoading(false); // Stop loading animation after fetching data
      } catch (error) {
        console.error("Error fetching job details and updates:", error);
        setLoading(false); // Ensure loading stops even if there is an error
      }
    }

    fetchJobDetails();
  }, [jobId]);

  const handleNavigation = () => {
    window.open(
      "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
    );
  };

  const fetchFromIPFS = async (hash) => {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching data from IPFS:", error);
      return {};
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/OWIcon.svg" alt="Loading..." className="loading-icon" />
      </div>
    );
  }

  return (
    <>
      {job && (
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
            <p>
              {" "}
              Contract ID:{" "}
              {formatWalletAddress(
                "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d",
              )}
            </p>
            <img
              src="/copy.svg"
              className="copyImage"
              onClick={() =>
                handleCopyToClipboard(
                  "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d",
                )
              }
            />
          </div>
        </div>
      )}

      <div className="job-update-container">
        <div className="job-update-main">
          <div className="job-update-header">
            <h1>Job Updates</h1>
            {/* {walletAddress.toLowerCase() === job?.jobTaker.toLowerCase() && ( */}
              {/* <Link to={`/add-update/${jobId}`} className="add-update-button">
                <img
                  src="/AddUpdateButton.svg"
                  alt="Add New Update"
                  className="add-update-image"
                />
              </Link> */}
              <BlueButton icon={'/plus.svg'} label={'Add New Update'} style={{padding: '8px 16px'}} onClick={goAddUpdate}/>
            {/* )} */}
          </div>

          <div className="job-update-content">
            {
                JOBITEMS.map((item, index) => (
                  <>
                      <JobItem key={index} icon={item.icon} inform={item.inform} devName={item.devName} time={item.time} payAmount={item.payAmount}/>
                      {index != JOBITEMS.length-1 && (<span className="item-line"></span>)}
                  </>
                ))
            }
          </div>
        </div>
      </div>
    </>
  );
}
