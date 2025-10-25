import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SkillVerification.css';
import BlueButton from '../../components/BlueButton/BlueButton';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';

const SkillVerification = () => {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState('UX/UI Design');
  const [description, setDescription] = useState(
    "I'm a Product Designer based in Melbourne, Australia. I enjoy working on product design, design systems, and Webflow projects, but I don't take myself too seriously."
  );
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  const skills = [
    'UX/UI Design',
    'Product Design',
    'Graphic Design',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Project Management',
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Submitting skill verification:', {
      skill: selectedSkill,
      description,
      file: uploadedFile,
    });
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

  return (
    <>
      <div className="newTitle">
        <div className="titleTop">
          <div className="goBack" onClick={() => navigate(-1)}>
            <img className="goBackImage" src="/back.svg" alt="Back Button" />
          </div>  
          <div className="titleText">molliehall2504</div>
        </div>
        <div className="titleBottom">
          <p>0xDEAF...fB8B</p>
          <img 
            src="/copy.svg" 
            className="copyImage" 
            onClick={() => handleCopyToClipboard("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}
          />
        </div>
      </div>
      <div className="skill-verification-page-container">
        <div className="skill-verification-card">
          <div className="skill-verification-card-section">
            <h3 className="skill-verification-card-title">Skill Verification</h3>
          </div>

          <div className="skill-verification-scrollable-content">
            <div className="form-section">
              {/* Skill Dropdown */}
              <div className="form-field">
                <button
                  className="dropdown-button"
                  onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                >
                  <span>{selectedSkill}</span>
                  <img
                    src="/chevron-down.svg"
                    alt="Dropdown"
                    className={`dropdown-icon ${isSkillDropdownOpen ? 'open' : ''}`}
                  />
                </button>
                {isSkillDropdownOpen && (
                  <div className="dropdown-menu">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedSkill(skill);
                          setIsSkillDropdownOpen(false);
                        }}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description Field */}
              <div className="form-field">
                <textarea
                  className="description-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your experience with this skill..."
                  rows={5}
                />
              </div>

              {/* File Upload */}
              <div className="form-field">
                <label htmlFor="file-upload" className="file-upload-area">
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <div className="upload-content">
                    <img
                      src="/upload-icon.svg"
                      alt="Upload"
                      className="upload-icon"
                    />
                    <span className="upload-text">
                      {uploadedFile
                        ? uploadedFile.name
                        : 'Click here to upload proof'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="skill-verification-actions">
              <BlueButton
                label="Submit Application"
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillVerification;
