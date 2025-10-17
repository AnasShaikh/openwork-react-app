import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton/BackButton';
import './SkillOracleRecruitmentStep2.css';

const SkillOracleRecruitmentStep2 = () => {
  const navigate = useNavigate();
  const [selectedOracle, setSelectedOracle] = useState('General Skill Oracle');
  const [walletAddress, setWalletAddress] = useState('');
  const [emailOrTelegram, setEmailOrTelegram] = useState('');
  const [reason, setReason] = useState('');
  const [isOracleDropdownOpen, setIsOracleDropdownOpen] = useState(false);

  const handleSubmit = () => {
    // Handle form submission
    console.log({ selectedOracle, walletAddress, emailOrTelegram, reason });
  };

  return (
    <div className="skill-oracle-recruitment-step2-container">
      <div className="skill-oracle-recruitment-step2-card">
        <div className="skill-oracle-recruitment-step2-header">
          <BackButton to="/skill-oracle-member-proposal" title="Skill Oracle Recruitment Proposal" />
        </div>

        <div className="skill-oracle-recruitment-step2-content">
          <div className="skill-oracle-recruitment-step2-dropdown-section">
            <button 
              className="skill-oracle-recruitment-step2-dropdown-button"
              onClick={() => setIsOracleDropdownOpen(!isOracleDropdownOpen)}
            >
              <span>{selectedOracle}</span>
              <img 
                src="/chevron-down.svg" 
                alt="" 
                className={`skill-oracle-recruitment-step2-chevron ${isOracleDropdownOpen ? 'open' : ''}`}
              />
            </button>

            <div className="skill-oracle-recruitment-step2-info-box">
              <p className="skill-oracle-recruitment-step2-info-label">CURRENT MEMBER COUNT</p>
              <p className="skill-oracle-recruitment-step2-info-value">
                <span className="value-main">10 </span>
                <span className="value-secondary">/ 20</span>
              </p>
            </div>
          </div>

          <div className="skill-oracle-recruitment-step2-warning-badge">
            <img src="/warning-icon.svg" alt="" className="warning-icon" />
            <p className="warning-text">
              Members of the DAO can only propose recruitments for Skill Oracles with less than 20 members
            </p>
          </div>

          <input
            type="text"
            className="skill-oracle-recruitment-step2-input"
            placeholder="0xDEAF...fB8B"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />

          <input
            type="text"
            className="skill-oracle-recruitment-step2-input"
            placeholder="Email ID / Telegram ID of this person"
            value={emailOrTelegram}
            onChange={(e) => setEmailOrTelegram(e.target.value)}
          />

          <textarea
            className="skill-oracle-recruitment-step2-textarea"
            placeholder="Reason explaining why this person should be recruited"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="skill-oracle-recruitment-step2-actions">
            <button 
              className="skill-oracle-recruitment-step2-submit"
              onClick={handleSubmit}
            >
              Submit Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillOracleRecruitmentStep2;
