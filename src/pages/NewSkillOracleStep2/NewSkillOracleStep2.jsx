import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton/BackButton';
import './NewSkillOracleStep2.css';

const NewSkillOracleStep2 = () => {
  const navigate = useNavigate();
  const [skillOracleName, setSkillOracleName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    // Handle proposal submission
    console.log('New Skill Oracle Proposal:', { skillOracleName, description, reason });
  };

  return (
    <div className="new-skill-oracle-step2-container">
      <div className="new-skill-oracle-step2-card">
        <div className="new-skill-oracle-step2-header">
          <BackButton to="/skill-oracle-proposal" title="New Skill Oracle" />
        </div>

        <div className="new-skill-oracle-step2-content">
          <div className="new-skill-oracle-step2-field">
            <input
              type="text"
              className="new-skill-oracle-step2-input"
              placeholder="General Skill Oracle"
              value={skillOracleName}
              onChange={(e) => setSkillOracleName(e.target.value)}
            />
          </div>

          <textarea
            className="new-skill-oracle-step2-textarea"
            placeholder="Description of the Skill Oracle"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <textarea
            className="new-skill-oracle-step2-textarea"
            placeholder="Reason explaining why this skill oracle should exist"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="new-skill-oracle-step2-actions">
            <button className="new-skill-oracle-step2-submit" onClick={handleSubmit}>
              Submit Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSkillOracleStep2;
