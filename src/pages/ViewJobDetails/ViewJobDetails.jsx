import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json"; // Import the L1 contract ABI
import "./ViewJobDetails.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import Milestone from "../../components/Milestone/Milestone";
import Button from "../../components/Button/Button";
import BlueButton from "../../components/BlueButton/BlueButton";
import BackButton from "../../components/BackButton/BackButton";

function FileUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file)); // For preview display
  };

  return (
    <div style={{width: '100%'}}>
      <label htmlFor="image">
        <div className="form-fileUpload">
          <img src="/upload.svg" alt="" />
          <span>Click here to upload or drop files here</span>
        </div>
      </label>
      <input id="image" type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
      {preview && <img src={preview} alt="Image preview" width="100" />}
    </div>
  );
}

function ATTACHMENTS({title}) {
  return (
    <div className="attachment-form">
      <img src="/attachments.svg" alt="" />
      <span>{title}</span>
    </div>
  )
}

export default function ViewJobDetails() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <>
      <div className="info-container">
        <div className="info-content">
          <div className="info-cardJ">
            <div className="sectionTitle">
                <div onClick={handleBack} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <img src="/back.svg" alt="Back" style={{width: '24px', height: '24px'}} />
                  <span style={{fontSize: '18px', fontWeight: '600'}}>UI for OpenWork</span>
                </div>
            </div>
            <div className="sectionBody">
              <div className="detail-row">
                <span className="detail-label">POSTED BY</span>
                <div className="detail-profile">
                  <span className="detail-value-address">
                    <img src="/user.png" alt="JobGiver" className="Job" />
                    <p>Mollie Hall</p>
                  </span>
                  <a href="/profile" className="view-profile">
                    <span>View Profile</span>
                    <img src="/view_profile.svg" alt="" />
                  </a>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">BUDGET</span>
                <span className="detail-value" style={{ height: "47px" }}>
                  {/* {job.escrowAmount}{" "} */}
                  762.14
                  <img src="/xdc.svg" alt="Info" className="infoIcon" />
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">REQUIREMENT(S)</span>
                <div className="detail-value description-value">
                  <p>Here's a list of things I need:</p>
                  <ul className="description-list requirements-list">
                    <span> • Basic chat and emil support</span>
                    <span> • Up to 10 individuals users</span>
                    <span> • Basic reporting and analytics</span>
                  </ul>
                </div>
              </div>
              <div className="category">
                <span>SKILL</span>
                <div className="category-box">
                  <SkillBox title="UX Design" />
                </div>
              </div>
              <div className="form-groupDC" style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:0, marginTop:8}}>
                <Button label='Refer someone' buttonCss={'verified-button'}/>
                <BlueButton label='Apply Now' style={{width: '-webkit-fill-available', justifyContent:'center', padding: '12px 16px'}}/>
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
