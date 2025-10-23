import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';
import './ContractUpdateProposelStep3.css';

const ContractUpdateProposelStep3 = () => {
  const navigate = useNavigate();
  const [currentValue] = useState('20%');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    // Handle proposal submission
    console.log('Contract Update Proposal:', { currentValue, proposedValue, reason });
  };

  return (
    <div className="contract-update-step3-container">
      {/* Header Section with Back Button and Title */}
      <div className="proposalHeaderSection">
        <div className="back">
          <BackButtonProposal onClick={() => navigate(-1)} />
          <div className="proposalMainTitleWrapper">
            <h1 className="proposalMainTitle">OpenWork DAO Smart Contract</h1>
          </div>
        </div>
      </div>

      {/* View Contract Link */}
      <div className="viewContractLink" onClick={() => window.open('/contract-link', '_blank')}>
        <span>View contract</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 11L11 5M11 5H7M11 5V9" stroke="#1246FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="contract-update-step3-card">
        <div className="contract-update-step3-card-section">
            <h3 className="contract-update-step3-card-title">Contract Details</h3>
        </div>
          <p className="contract-update-step3-description">
            You can propose a new value for the field shown below and state your reason as to why it should be changed
          </p>

          <div className="contract-update-step3-field-section">
            <p className="contract-update-step3-field-label">No. of votes required to pass a proposal</p>
            
            <div className="contract-update-step3-values-row">
              <div className="contract-update-step3-value-field">
                <label className="contract-update-step3-input-label">CURRENT VALUE</label>
                <div className="contract-update-step3-input-readonly">
                  <span>{currentValue}</span>
                </div>
              </div>

              <div className="contract-update-step3-value-field">
                <label className="contract-update-step3-input-label">PROPOSED VALUE</label>
                <input
                  type="text"
                  className="contract-update-step3-input"
                  placeholder="80%"
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                />
              </div>
            </div>
          </div>

          <textarea
            className="contract-update-step3-textarea"
            placeholder="Reasons explaining why these changes should be made to the contract go here"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="contract-update-step3-actions">
            <button className="contract-update-step3-submit" onClick={handleSubmit}>
              Submit Proposal
            </button>
          </div>
      </div>
    </div>
  );
};

export default ContractUpdateProposelStep3;
