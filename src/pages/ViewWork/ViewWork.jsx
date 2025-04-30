import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import "./ViewWork.css";
import WorkSubmission from "../../components/WorkSubmission/WorkSubmission";

const WORKITMES = [
  {
    title: 'Work Submission 3',
    date: '17 May, 2024',
    content : `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
      1914 translation by H. Rackham`
  },
  {
    title: 'Work Submission 2',
    date: '17 May, 2024',
    content : `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
      1914 translation by H. Rackham`
  },
  {
    title: 'Work Submission 1',
    date: '17 May, 2024',
    content : `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
      1914 translation by H. Rackham`
  }
]

export default function ViewWork () {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [walletAddress, setWalletAddress] = useState("");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state
  
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
            <div className="newTitle">
                <div className="titleTop">
                <Link className="goBack" to={`/job-details/${jobId}`}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
                <div className="titleText">{job.title}</div>
                <Link className="goBack" to={`/job-details/${jobId}`} style={{visibility:'hidden'}}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
                </div>
                <div className="titleBottom">
                  <p>  Contract ID:{" "}
                  {formatWalletAddress("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}
                  </p><img src="/copy.svg" className="copyImage" onClick={() =>
                      handleCopyToClipboard(
                      "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d"
                      )
                  }
                /></div>
           </div>
           <div className="work-content">
            {
              WORKITMES.map((item, index) => (
                <WorkSubmission key={index} title={item.title} date={item.date} content={item.content}/>
              ))
            }
           </div>
        </>
    )
}