import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import "./ProfileOwnerView.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DropDown from "../../components/DropDown/DropDown";
import Button from "../../components/Button/Button";
import BlueButton from "../../components/BlueButton/BlueButton";

const COUNTRYITEMS = [
    {
        img: '/AU.svg',
        label: 'Melbourne, Australia'
    },
    {
        img: '/AU.svg',
        label: 'Melbourne, Australia'
    },
    {
        img: '/AU.svg',
        label: 'Melbourne, Australia'
    },
]

const EXPERIENCEITEMS = [
    '4 Years','5 Years','3 Years','3 Years',
]

function ReferInfo() {
    return (
        <div className="profile-item refer-info">
            <div className="refer-info-user">
                <img src="/refer-user.svg" alt="" />
                <span>Referrer Info</span>
            </div>
            <span className="refer-line"/>
            <div className="refer-content">
            Enter the wallet address of the person who referred you to use the OpenWork Platform
            </div>
            <div className="profile-item">
            019824091ijbfouwqf-129874ig
            </div>
            <div className="refer-submit">
                <Button label={'Submit'} buttonCss={'refer-submit-button'}/>
            </div>
        </div>
    )
}


export default function ProfileOwnerView() {
    const { jobId } = useParams();
    const navigate = useNavigate();
  
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

    function goSkillVerification() {
        navigate(`/skill-verification/${jobId}`);
    }
  
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

    const SKILLITEMS = [
        {
            title: 'UX Design',
            verified: true
        },
        {
            title: 'UI Design',
            verified: false
        },
        {
            title: 'Webflow',
            verified: false
        }
    ]

    return (
        <>
            <div className="newTitle">
                <div className="titleTop">
                <Link className="goBack" to={`/profile`}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
                <div className="titleText">molliehall2504</div>
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
            <div className="form-containerDC" style={{marginTop: '0px'}}>
                <div className="form-container-release">
                    <div className="sectionTitle">
                        <span>About</span>
                    </div>
                    <div className="release-payment-body profile-owner-body">
                        <div className="profile-photo core-profile">
                            <img src="/user.png" alt=""/>
                            <Button label={"Edit picture"} icon={'/edit_picture.svg'} buttonCss={'edit_picture'}/>
                        </div>
                        <div className="profile-item">
                            <span>molliehall2504</span>
                        </div>
                        <div className="profile-name">
                            <div className="profile-item">
                                <span>Mollie</span>
                            </div>
                            <div className="profile-item">
                                <span>Hall</span>
                            </div>
                        </div>
                        <div className="profile-skill-box">
                            <div className="profile-skill">
                                {SKILLITEMS.map((item, index) => (
                                    <SkillBox key={index} title={item.title} verified={item.verified} />
                                ))}
                            </div>
                        </div>
                        <DropDown label={COUNTRYITEMS[0]} options={COUNTRYITEMS} customCSS={'form-dropdown profile-dropdown'}/>
                        <div className="profile-item">
                            <span>English, Hindi</span>
                        </div>
                        <DropDown label={EXPERIENCEITEMS[0]} options={EXPERIENCEITEMS} customCSS={'form-dropdown profile-dropdown'}/>
                        <div className="profile-item profile-description">
                        I'm a Product Designer based in Melbourne, Australia. I enjoy working on product design, design systems, and Webflow projects, but I don't take myself too seriously.
                        I’ve worked with some of the world’s most exciting companies, including Coinbase, Stripe, and Linear. I'm passionate about helping startups grow, improve their UX and customer experience, and to raise venture capital through good design.
                        </div>
                        <div className="profile-item">
                            <span>hi@jayawillis.com</span>
                        </div>
                        <div className="profile-item">
                            <span>telegram.co/molliehall</span>
                        </div>
                        <div className="profile-item">
                            <span>+91 9876493761</span>
                        </div>
                        {/* <ReferInfo/> */}
                        <div className="form-groupDC" style={{display:'flex', alignItems:'center', gap:'16px'}}>
                            <Button label='Get Skills Verified' buttonCss={'verified-button'} onClick={goSkillVerification}/>
                            <BlueButton label='Save Changes' style={{width: '-webkit-fill-available', justifyContent:'center', padding: '12px 16px'}}/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}