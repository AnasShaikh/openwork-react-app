import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Web3 from "web3";
import contractABI from "../../ABIs/nowjc_ABI.json"; // Updated to use the correct ABI
import "./JobDeepView.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import Milestone from "../../components/Milestone/Milestone";

const CONTRACT_ADDRESS = "0x3C597eae77aD652a20E3B54B5dE9D89c9c7016E3";
const OP_SEPOLIA_RPC = "https://sepolia.optimism.io";

function FileUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file)); // For preview display
  };

  return (
    <div style={{ width: "100%" }}>
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

function ATTACHMENTS({ title }) {
  return (
    <div className="attachment-form">
      <img src="/attachments.svg" alt="" />
      <span>{title}</span>
    </div>
  );
}

export default function JobInfo() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
        setLoading(true);
        const web3 = new Web3(OP_SEPOLIA_RPC);
        const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

        // Fetch job details from the contract
        const jobData = await contract.methods.getJob(jobId).call();
        console.log("Job data from contract:", jobData);

        // Fetch job details from IPFS
        let jobDetails = {};
        try {
          if (jobData.jobDetailHash) {
            const ipfsResponse = await fetch(
              `https://gateway.pinata.cloud/ipfs/${jobData.jobDetailHash}`,
            );
            if (ipfsResponse.ok) {
              jobDetails = await ipfsResponse.json();
            }
          }
        } catch (ipfsError) {
          console.warn("Failed to fetch IPFS data:", ipfsError);
        }

        // Fetch job giver and job taker profiles
        let jobGiverProfile = null;
        let jobTakerProfile = null;

        try {
          jobGiverProfile = await contract.methods
            .getProfile(jobData.jobGiver)
            .call();
        } catch (error) {
          console.warn("Job giver profile not found");
        }

        if (
          jobData.selectedApplicant &&
          jobData.selectedApplicant !==
            "0x0000000000000000000000000000000000000000"
        ) {
          try {
            jobTakerProfile = await contract.methods
              .getProfile(jobData.selectedApplicant)
              .call();
          } catch (error) {
            console.warn("Job taker profile not found");
          }
        }

        // Calculate total budget from milestones (assuming USDT with 6 decimals)
        const totalBudget = jobData.milestonePayments.reduce(
          (sum, milestone) => {
            return sum + parseFloat(milestone.amount);
          },
          0,
        );
        const formattedTotalBudget = (totalBudget / 1000000).toFixed(2);

        // Process milestones for display
        const processedMilestones = [];
        if (jobData.finalMilestones && jobData.finalMilestones.length > 0) {
          for (let i = 0; i < jobData.finalMilestones.length; i++) {
            const milestone = jobData.finalMilestones[i];
            let status = "Pending";

            if (i < jobData.currentMilestone - 1) {
              status = "Completed";
            } else if (i === jobData.currentMilestone - 1) {
              status = "In Progress";
            }

            // Try to fetch milestone details from IPFS
            let milestoneDetails = {
              title: `Milestone ${i + 1}`,
              content: "Milestone description",
            };

            try {
              if (milestone.descriptionHash) {
                const milestoneResponse = await fetch(
                  `https://gateway.pinata.cloud/ipfs/${milestone.descriptionHash}`,
                );
                if (milestoneResponse.ok) {
                  const milestoneData = await milestoneResponse.json();
                  milestoneDetails.title =
                    milestoneData.title || milestoneDetails.title;
                  milestoneDetails.content =
                    milestoneData.content || milestoneDetails.content;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch milestone ${i} IPFS data:`, error);
            }

            processedMilestones.push({
              ...milestoneDetails,
              amount: (parseFloat(milestone.amount) / 1000000).toFixed(2),
              status: status,
            });
          }
        }

        // Extract skills from job details
        const skills = jobDetails.skills || ["General"];
        const primarySkill = Array.isArray(skills) ? skills[0] : skills;
        const additionalSkillsCount =
          Array.isArray(skills) && skills.length > 1 ? skills.length - 1 : 0;

        // Set the job state
        setJob({
          jobId: jobData.id,
          title: jobDetails.title || "Untitled Job",
          description: jobDetails.description || "No description available",
          skills: skills,
          primarySkill: primarySkill,
          additionalSkillsCount: additionalSkillsCount,
          jobGiver: jobData.jobGiver,
          selectedApplicant: jobData.selectedApplicant,
          status: jobData.status,
          milestones: processedMilestones,
          currentMilestone: parseInt(jobData.currentMilestone),
          totalMilestones: jobData.finalMilestones.length,
          totalBudget: formattedTotalBudget,
          jobGiverProfile,
          jobTakerProfile,
          contractId: CONTRACT_ADDRESS,
          ...jobDetails,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching job details:", error);
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJobDetails();
    }
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
    window.open(
      "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
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
      <div className="loading-containerT">
        <div className="loading-icon">
          <img src="/OWIcon.svg" alt="Loading..." />
        </div>
        <div className="loading-message">
          <h1 id="txText">Loading Job Details...</h1>
          <p id="txSubtext">
            Fetching detailed job information from the blockchain. Please
            wait...
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="body-container">
        <div className="view-jobs-container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
              fontSize: "18px",
              color: "#666",
            }}
          >
            <p>Job not found.</p>
            <Link
              to="/browse-jobs"
              style={{
                marginTop: "20px",
                color: "#007bff",
                textDecoration: "none",
              }}
            >
              Back to Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="info-container">
        <div className="info-content">
          <div className="newTitle">
            <div className="titleTop">
              <Link className="goBack" to={`/job-details/${jobId}`}>
                <img
                  className="goBackImage"
                  src="/back.svg"
                  alt="Back Button"
                />
              </Link>
              <div className="titleText">{job.title}</div>
              <Link
                className="goBack"
                to={`/job-details/${jobId}`}
                style={{ visibility: "hidden" }}
              >
                <img
                  className="goBackImage"
                  src="/back.svg"
                  alt="Back Button"
                />
              </Link>
            </div>
            <div className="titleBottom">
              <p>Contract ID: {formatWalletAddress(job.contractId)}</p>
              <img
                src="/copy.svg"
                className="copyImage"
                onClick={() => handleCopyToClipboard(job.contractId)}
              />
            </div>
          </div>

          <div className="info-cardJ">
            <div className="sectionTitle">Job Details</div>
            <div className="sectionBody">
              <div className="detail-row">
                <span className="detail-label">FROM</span>
                <div className="detail-profile">
                  <span className="detail-value-address">
                    <img src="/user.png" alt="JobGiver" className="Job" />
                    <p>{formatWalletAddress(job.jobGiver)}</p>
                  </span>
                  <a href="/profile" className="view-profile">
                    <span>View Profile</span>
                    <img src="/view_profile.svg" alt="" />
                  </a>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">TO</span>
                <div className="detail-profile">
                  <span
                    className="detail-value-address"
                    style={{ height: "47px" }}
                  >
                    <img src="/user.png" alt="JobTaker" className="Job" />
                    <p>
                      {job.selectedApplicant &&
                      job.selectedApplicant !==
                        "0x0000000000000000000000000000000000000000"
                        ? formatWalletAddress(job.selectedApplicant)
                        : "Not Assigned"}
                    </p>
                  </span>
                  <a href="/profile" className="view-profile">
                    <span>View Profile</span>
                    <img src="/view_profile.svg" alt="" />
                  </a>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">COST</span>
                <span className="detail-value" style={{ height: "47px" }}>
                  {job.totalBudget}
                  <img src="/xdc.svg" alt="Info" className="infoIcon" />
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">DESCRIPTION</span>
                <div className="detail-value description-value">
                  <p>{job.description}</p>
                </div>
              </div>
              <div className="category">
                <span>CATEGORY</span>
                <div className="category-box">
                  <SkillBox title={job.primarySkill} />
                  {job.additionalSkillsCount > 0 && (
                    <SkillBox title={`+${job.additionalSkillsCount}`} />
                  )}
                </div>
              </div>
              <div className="category attachments">
                <span>ATTACHMENTS</span>
                <div className="upload-content">
                  <ATTACHMENTS title={"Scope of work.pdf"} />
                  <ATTACHMENTS title={"Reference 1.png"} />
                </div>
              </div>
              <div className="milestone-section">
                <div className="milestone-section-header">
                  <span>
                    MILESTONES ({job.currentMilestone} / {job.totalMilestones}{" "}
                    Completed)
                  </span>
                </div>
                <div className="milestone-section-body">
                  {job.milestones && job.milestones.length > 0 ? (
                    job.milestones.map((milestone, index) => (
                      <Milestone
                        key={index}
                        amount={milestone.amount}
                        status={milestone.status}
                        title={milestone.title}
                        content={milestone.content}
                        editable={false}
                      />
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#666",
                      }}
                    >
                      No milestones defined for this job
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
