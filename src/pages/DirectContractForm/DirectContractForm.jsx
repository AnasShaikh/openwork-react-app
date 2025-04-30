import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import Web3 from "web3";
import JobContractABI from "../../JobContractABI.json";
import "./DirectContractForm.css";
import { useWalletConnection } from "../../functions/useWalletConnection"; // Manages wallet connection logic
import { formatWalletAddress } from "../../functions/formatWalletAddress"; // Utility function to format wallet address

import BackButton from "../../components/BackButton/BackButton";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import BlueButton from "../../components/BlueButton/BlueButton";
import Milestone from "../../components/Milestone/Milestone";
import RadioButton from "../../components/RadioButton/RadioButton";

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

export default function DirectContractForm() {
  const { walletAddress, connectWallet, disconnectWallet } = useWalletConnection();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobTaker, setJobTaker] = useState("");
  const [amount, setAmount] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loadingT, setLoadingT] = useState("");
  const [selectedOption, setSelectedOption] = useState('Single Milestone');

  const navigate = useNavigate(); // Initialize useNavigate

 
  const handleNavigation = () => {
    window.open(  "https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view",
      "_blank",
    );
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
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

  const pinJobDetailsToIPFS = async (jobDetails) => {
    try {
      const response = await fetch('https://open-work-server-armandpoonawal1.replit.app/api/pinata/pinJobDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobDetails),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error pinning to IPFS:', error);
      return null;
    }
  };


  return (
    <>
      <div className="form-containerDC">
        <div className="form-header">
          <BackButton to="/work" title="Create a Direct Contract"  style={{gap: '20px', fontSize: '20px'}}/>
        </div>
        <div className="form-body">
          <span id="pDC2">
            Enter in a contract directly with someone you know here. This gives
            access to OpenWork's dispute resolution and helps build profile
            strength for both parties.
          </span>
          <form onSubmit={handleSubmit}>
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
            <div className="form-groupDC skill-box" style={{padding: '20px'}}>
              <SkillBox title='UX Design' />            
              <SkillBox title='Webflow' />   
            </div>
            <div className="form-groupDC">
              <ImageUpload />
            </div>
            <div className="form-groupDC skill-dropdown">
              <span>CHOOSE A SKILL ORACLE FOR DISPUTE REQOLUTION</span>
              <DropDown label={SKILLOPTIONS[0]} options={SKILLOPTIONS} customCSS='form-dropdown'/>
            </div>
            <div className="lineDC form-groupDC"></div>
            <div className="form-groupDC">
              <RadioButton
                label="Single Milestone"
                isSelected={selectedOption === 'Single Milestone'}
                onChange={() => setSelectedOption('Single Milestone')}
              />
              <RadioButton
                label="Multiple Milestones"
                isSelected={selectedOption === 'Multiple Milestones'}
                onChange={() => setSelectedOption('Multiple Milestones')}
              />
            </div>
            <div className="form-groupDC milestone-section">
                <div className="milestone-section-header">
                    <span>MILESTONES</span>
                </div>
                <div className="milestone-section-body">
                    <Milestone amount={25} title="Milestone 1" content={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} editable={true}/>
                    {selectedOption == 'Multiple Milestones' && <Milestone amount={25} title="Milestone 2" content={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} editable={true}/>}
                </div>
            </div>
            <div className="form-groupDC form-platformFee">
              <div className="platform-fee">
                <span>total compensation</span>
                <img src="/fee.svg" alt="" />
              </div>
              <div className="compensation-amount">
                <span>50</span>
                <img src="/xdc.svg" alt="USDC" className="usdc-iconJD" />
              </div>
            </div>
            <div className="form-groupDC form-platformFee">
              <div className="platform-fee">
                <span>platform fees</span>
                <img src="/fee.svg" alt="" />
              </div>
              <span>5%</span>
            </div>
            <BlueButton label="Enter Contract" style={{width: '100%', justifyContent: 'center'}}/>
          </form>
        </div>
      </div>
    </>
  );
}
