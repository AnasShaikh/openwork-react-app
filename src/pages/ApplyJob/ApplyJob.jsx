import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import "./ApplyJob.css";
import BlueButton from "../../components/BlueButton/BlueButton";
import Milestone from "../../components/Milestone/Milestone";
import RadioButton from "../../components/RadioButton/RadioButton";
import Warning from "../../components/Warning/Warning";

const contractAddress = "0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d";

function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file)); // For preview display
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

export default function ApplyJob() {
  const [jobDescription, setJobDescription] = useState("");
  const [loadingT, setLoadingT] = useState("");
  const [selectedOption, setSelectedOption] = useState('Single Milestone');

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

  return (
    <>
        <div className="newTitle">
            <div className="titleTop">
            <Link className="goBack" to={`/job-details/`}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
            <div className="titleText">UI for OpenWork</div>
            <Link className="goBack" to={`/job-details/`} style={{visibility:'hidden'}}><img className="goBackImage" src="/back.svg" alt="Back Button" /></Link>  
            </div>
       </div>
      <div className="form-containerDC" style={{marginTop:'60px'}}>
        <div className="sectionTitle raiseTitle">
            <span id="rel-title">Job Application</span>
        </div>
        <div className="form-body raiseBody">
          <div>
            <div className="form-groupDC warning-form">
              <Warning content={"Please make sure your OpenWork Profile is up to date!"} icon="/triangle_warning.svg"/>
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
            <div className="form-groupDC">
              
              <textarea
                placeholder="Here’s the reason(s) explaining why I deserve to be hired for this particular job"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="form-groupDC">
              <ImageUpload />
            </div>
            <div className="lineDC form-groupDC" style={{margin:'32px 0px'}}></div>
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
            <div className="warning-form">
              <Warning content={"If the Job Giver accepts your application, Milestone 1 amount will be locked"} icon="/triangle_warning.svg"/>
            </div>
            <BlueButton label="Submit Application" style={{width: '100%', justifyContent: 'center', marginTop:'20px', marginBottom:'13px', padding:'10px 14px'}}/>
          </div>
        </div>
      </div>
    </>
  );
}
