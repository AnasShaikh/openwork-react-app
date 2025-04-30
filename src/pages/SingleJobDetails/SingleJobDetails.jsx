import React, { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json"; // Import the L1 contract ABI
import "./SingleJobDetails.css";
import MenuItem from "../../components/MenuItem";
import ToolTipContent from "../../components/ToolTipContent/ToolTipContent";
import ToolTipMilestone from "../../components/ToolTipMilestone/ToolTipMilestone";

const MILESTONETOOLTIPITEMS = [
  {
    title: "MILESTONE 1",
    amount: "25",
  },
  {
    title: "MILESTONE 2",
    amount: "25",
  },
  {
    title: "MILESTONE 3",
    amount: "25",
  },
  {
    title: "PLATFORM FEES",
    amount: "5",
  },
  {
    title: "TOTAL COMPENSATION",
    amount: "75",
  },
];

export default function SingleJobDetails() {
  const [buttonFlex2, setButtonFlex2] = useState(false);
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true); // State for loading animation
  const [amountPaid, setAmountPaid] = useState(0); // State for amount paid
  const [amountReceived, setAmountReceived] = useState(0); // State for amount received
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [hovered, setHovered] = useState(false); // State to track hover
  const [payHover, setPayHover] = useState(false);
  const [receiveHover, SetReceiveHover] = useState(false);
  const coreRef = useRef(null); // Create a ref for the element
  const [isElementReady, setIsElementReady] = useState(false); // State to track element readiness

  function formatWalletAddressH(address) {
    if (!address) return "";
    const start = address.substring(0, 4);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  useEffect(() => {
    if (buttonFlex2) {
      console.log("buttonFlex2 is now true");
    }
  }, [buttonFlex2]);

  useEffect(() => {
    if (!isElementReady) return; // Exit if element is not ready

    const coreHome = coreRef.current;

    const handleMouseEnter = () => {
      setButtonFlex2(true);
    };

    const handleMouseLeave = () => {};

    if (coreHome) {
      coreHome.addEventListener("mouseenter", handleMouseEnter);
      coreHome.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (coreHome) {
        coreHome.removeEventListener("mouseenter", handleMouseEnter);
        coreHome.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isElementReady]);

  const formatAmount = (amount) => {
    if (parseFloat(amount) === 0) return "0"; // Handle zero value without decimal
    const roundedAmount = parseFloat(amount).toFixed(2); // Rounds to 2 decimal places
    return roundedAmount.length > 5 ? roundedAmount.slice(0, 8) : roundedAmount;
  };

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

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const web3 = new Web3("https://erpc.xinfin.network"); // Using the RPC URL
        const contractAddress = "0x00844673a088cBC4d4B4D0d63a24a175A2e2E637"; // Address of the OpenWorkL1 contract
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

        // Log the raw wei values
        console.log("Proposed Amount (raw wei):", proposedAmountWei);
        console.log("Escrow Amount (raw wei):", escrowAmountWei);

        // Convert amounts from wei to ether
        const proposedAmount = web3.utils.fromWei(proposedAmountWei, "ether");
        const currentEscrowAmount = web3.utils.fromWei(
          escrowAmountWei,
          "ether"
        );

        const receivedAmount = proposedAmount - currentEscrowAmount;

        setJob({
          jobId,
          employer: jobDetails.employer,
          jobTaker: jobDetails.jobTaker,
          escrowAmount: currentEscrowAmount,
          isJobOpen: jobDetails.isOpen,
          ...ipfsData,
        });

        setAmountPaid(proposedAmount);
        setAmountReceived(receivedAmount);

        setLoading(false); // Stop loading animation after fetching data
        setIsElementReady(true);
        console.log("elements ready!!!!");
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

  const handleNavigation = () => {
    window.open(
      "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank"
    );
  };

  function formatWalletAddress(address) {
    if (!address) return "";
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/OWIcon.svg" alt="Loading..." className="loading-icon" />
      </div>
    );
  }

  if (!job) {
    return <div></div>; // Blank div while loading
  }

  return (
    <main className="container">
      <div className="single-job-details">
        <div className="newTitle">
          <div className="titleTop">
            <Link className="goBack" to="/browse-jobs">
              <img className="goBackImage" src="/back.svg" alt="Back Button" />
            </Link>
            <div className="titleText">{job.title}</div>
            <Link className="goBack" to="/browse-jobs" style={{visibility:'hidden'}}>
              <img className="goBackImage" src="/back.svg" alt="Back Button" />
            </Link>
          </div>
          <div className="titleBottom">
            <p>
              {" "}
              Contract ID:{" "}
              {formatWalletAddress(
                "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d"
              )}
            </p>
            <img
              src="/copy.svg"
              className="copyImage"
              onClick={() =>
                handleCopyToClipboard(
                  "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d"
                )
              }
            />
          </div>
          <div className="feeContent" style={{fontWeight: '400 !important'}}>
            {hovered ? (
              <>
                <span>Fees:</span>
                <span>5</span>
                <img src="/xdc.svg" alt="" />
              </>
            ) : (
              <div className="titleBottom">2 / 3 Milestones Completed</div>
            )}
            <img src="/warning.svg" alt="" data-tooltip-id="mileston-tooltip" />
            <Tooltip
              id="mileston-tooltip"
              place="right"
              className="custom-tooltip"
              classNameArrow="custom-tooltip-arrow"
            >
              <div className="tooltip-form" style={{ gap: "8px" }}>
                {MILESTONETOOLTIPITEMS.map((item, index) => (
                  <ToolTipMilestone
                    key={index}
                    title={item.title}
                    address={item.address}
                    amount={item.amount}
                  />
                ))}
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="radialMenu" id="radialMenu">
          <img src="/RadiantGlow.png" alt="Radiant Glow" id="radiantGlow" />

          {/* Display Amount Paid */}
          <div
            className="buttonLeftInfo"
            style={{
              opacity: hovered ? "0" : "1",
              pointerEvents: hovered ? "none" : "auto",
            }}
          >
            <div className="amountInfo">
              {100} {/* Displaying the amount paid */}
              <img src="/xdc.svg" alt="USDC Icon" className="usdcIcon" />
            </div>
            <div id="amountLabelLeft" className="amountLabel">
              AMOUNT PAID
            </div>
            <div
              id="addressLeft"
              className="address"
              style={{ cursor: "pointer" }}
              title="Click to copy"
              onClick={() => handleCopyToClipboard(job.employer)}
            >
              {formatWalletAddress(job.employer)}
            </div>
          </div>
          <div
            id="buttonLeftS"
            className={`buttonContainerS-primary ${
              buttonsVisible || hovered ? "hidden-button" : "visible-button"
            }`}
            style={{
              pointerEvents: hovered ? "none" : "auto",
            }}
            onMouseEnter={() => setPayHover(true)}
            onMouseLeave={() => setPayHover(false)}
            data-tooltip-id="left-tooltip"
          >
            <img
              src="/radial-button.svg"
              alt="Button Left"
              className="buttonImageS"
            />
            <img
              src={`/${payHover ? "user1.png" : "user1.png"}`}
              alt="Person Icon"
              className="buttonIconPS"
            />
          </div>
          {/* tooltip for buttonlefts */}
          <Tooltip
            id="left-tooltip"
            place="left"
            className="custom-tooltip"
            classNameArrow="custom-tooltip-arrow"
          >
            <ToolTipContent
              name="Jollie Hall"
              role="Giver"
              content="I'm a Product Designer based in Melbourne, Australia. I enjoy working on product design, design systems, and Webflow..."
            />
          </Tooltip>
          {/* Display Amount Received */}
          <div
            className="buttonRightInfo"
            style={{
              opacity: hovered ? "0" : "1",
              pointerEvents: hovered ? "none" : "auto",
            }}
          >
            <div className="amountInfo">
              {50}{" "}
              {/* Displaying the amount received */}
              <img src="/xdc.svg" alt="USDC Icon" className="usdcIcon" />
            </div>
            <div id="amountLabelRight" className="amountLabel">
              AMOUNT RECEIVED
            </div>
            <div
              id="addressRight"
              className="address"
              style={{ cursor: "pointer" }}
              title="Click to copy"
              onClick={() => handleCopyToClipboard(job.jobTaker)}
            >
              {formatWalletAddress(job.jobTaker)}
            </div>
          </div>
          <div
            id="buttonRightS"
            className={`buttonContainerS-primary ${
              buttonsVisible || hovered ? "hidden-button" : "visible-button"
            }`}
            style={{
              pointerEvents: hovered ? "none" : "auto",
            }}
            onMouseEnter={() => SetReceiveHover(true)}
            onMouseLeave={() => SetReceiveHover(false)}
            data-tooltip-id="right-tooltip"
          >
            <img
              src="/radial-button.svg"
              alt="Button Right"
              className="buttonImageS"
            />
            <img
              src={`/${receiveHover ? "user.png" : "user.png"}`}
              alt="Person Icon"
              className="buttonIconPS"
            />
          </div>
          {/* tooltip for buttonrights */}
          <Tooltip
            id="right-tooltip"
            place="right"
            className="custom-tooltip"
            classNameArrow="custom-tooltip-arrow"
          >
            <ToolTipContent
              name="Jollie Hall"
              point="4.9"
              role="Taker"
              content="I'm a Product Designer based in Melbourne, Australia. I enjoy working on product design, design systems, and Webflow..."
            />
          </Tooltip>
          {/* Links with hover effect */}
          <Link
            to={`/job-deep-view/${job.jobId}`}
            id="buttonTopS"
            className={`buttonContainerS ${hovered ? "visible-home" : ""}`}
            style={{ display: buttonFlex2 ? "flex" : "none" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src="/radial-button.svg"
              alt="Button Top"
              className="buttonImageS"
            />
            <img src="/info.svg" alt="Pay Icon" className="buttonIconHover" />
            <span className="buttonText">Job Details</span>
          </Link>
          <Link
            to={`/release-payment/${job.jobId}`}
            id="buttonBottomS"
            className={`buttonContainerS ${hovered ? "visible-home" : ""}`}
            style={{ display: buttonFlex2 ? "flex" : "none" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src="/radial-button.svg"
              alt="Button Top"
              className="buttonImageS"
            />
            <img src="/pay.svg" alt="Pay Icon" className="buttonIconHover" />
            <span className="buttonText">Pay Now</span>
          </Link>
          <Link
            to={`/job-update/${job.jobId}`}
            id="buttonBottomLeftS"
            className={`buttonContainerS ${hovered ? "visible-home" : ""}`}
            style={{ display: buttonFlex2 ? "flex" : "none" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src="/radial-button.svg"
              alt="Button Bottom Left"
              className="buttonImageS"
            />
            <img
              src="/update.svg"
              alt="Info Icon"
              className="buttonIconHover"
            />
            <span className="buttonText">Job Update</span>
          </Link>
          <Link
            to={`/raise-dispute/${job.jobId}`}
            id="buttonBottomRightS"
            className={`buttonContainerS ${hovered ? "visible-home" : ""}`}
            style={{ display: buttonFlex2 ? "flex" : "none" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src="/radial-button.svg"
              alt="Button Bottom Right"
              className="buttonImageS"
            />
            <img
              src="/dispute.svg"
              alt="Disoute Icon"
              className="buttonIconHover"
            />
            <span className="buttonText">Raise Dispute</span>
          </Link>
          <div
            id="core"
            className="coreContainer"
            ref={coreRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img src="/core.svg" alt="Core" className="coreImage" />
            <span className="coreText">
              {50}{" "}
              <img
                src="/xdc.svg"
                alt="USDC Icon"
                className="usdcIcon"
                id="usdc"
              />
              <br />
              <p id="amount-locked">AMOUNT LOCKED</p>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
