import React, { useState, useEffect } from "react";
import "./ApplyNow.css";

import BackButton from "../../components/BackButton/BackButton";
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
          <span>Click here to upload relevant work</span>
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

export default function ApplyNow() {
  const [jobDescription, setJobDescription] = useState("");


  return (
    <>
      <div className="form-containerDC">
        <div className="form-header">
          <BackButton to="/skill-oracles" title="Skill Oracle Application"/>
        </div>
        <div className="form-body">
          <span id="pDC2">
            Skill Oracle description, what you would have to do if you’re a part etc. goes here
          </span>
            <DropDown label={SKILLOPTIONS[0]} options={SKILLOPTIONS} customCSS='form-dropdown skill-oracle-dropdown'/>
            <div className="form-groupDC" style={{marginBottom:0}}>
              
              <textarea                
                placeholder="Here’s the reason(s) explaining why I deserve to be hired in this particular Skill Oracle"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>
            <div>
              <ImageUpload />
            </div>
            <BlueButton label="Submit Application" style={{width: '100%', justifyContent: 'center', marginTop:'16px'}}/>
        </div>
      </div>
    </>
  );
}
