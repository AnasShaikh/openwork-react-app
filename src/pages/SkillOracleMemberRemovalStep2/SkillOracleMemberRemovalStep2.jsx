import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton/BackButton';
import './SkillOracleMemberRemovalStep2.css';

const SkillOracleMemberRemovalStep2 = () => {
  const navigate = useNavigate();
  const [selectedOracle, setSelectedOracle] = useState('General Skill Oracle');
  const [selectedMember, setSelectedMember] = useState('');
  const [reason, setReason] = useState('');
  const [isOracleDropdownOpen, setIsOracleDropdownOpen] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  const handleSubmit = () => {
    // Handle form submission
    console.log({ selectedOracle, selectedMember, reason });
  };

  return (
    <div className="skill-oracle-member-removal-step2-container">
      <div className="skill-oracle-member-removal-step2-card">
        <div className="skill-oracle-member-removal-step2-header">
          <BackButton to="/skill-oracle-member-proposal" title="Skill Oracle Member Removal Proposal" />
        </div>

        <div className="skill-oracle-member-removal-step2-content">
          <div className="skill-oracle-member-removal-step2-dropdown-section">
            <button 
              className="skill-oracle-member-removal-step2-dropdown-button"
              onClick={() => setIsOracleDropdownOpen(!isOracleDropdownOpen)}
            >
              <span>{selectedOracle}</span>
              <img 
                src="/chevron-down.svg" 
                alt="" 
                className={`skill-oracle-member-removal-step2-chevron ${isOracleDropdownOpen ? 'open' : ''}`}
              />
            </button>

            <div className="skill-oracle-member-removal-step2-info-box">
              <p className="skill-oracle-member-removal-step2-info-label">CURRENT MEMBER COUNT</p>
              <p className="skill-oracle-member-removal-step2-info-value">
                <span className="value-main">10 </span>
                <span className="value-secondary">/ 20</span>
              </p>
            </div>
          </div>

          <div className="skill-oracle-member-removal-step2-warning-badge">
            <img src="/warning-icon.svg" alt="" className="warning-icon" />
            <p className="warning-text">
              Members of the DAO can only propose member removals for Skill Oracles with less than 20 members
            </p>
          </div>

          <button 
            className="skill-oracle-member-removal-step2-member-dropdown"
            onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
          >
            <div className="member-dropdown-content">
              <div className="member-avatar"></div>
              <span>0xDEAF...fB8B</span>
            </div>
            <img 
              src="/chevron-down.svg" 
              alt="" 
              className={`skill-oracle-member-removal-step2-member-chevron ${isMemberDropdownOpen ? 'open' : ''}`}
            />
          </button>

          <textarea
            className="skill-oracle-member-removal-step2-textarea"
            placeholder="Reason explaining why this person should be removed from the Skill Oracle"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="skill-oracle-member-removal-step2-actions">
            <button 
              className="skill-oracle-member-removal-step2-submit"
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

export default SkillOracleMemberRemovalStep2;
