import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';
import './DissolveOracleProposalView.css';

const DissolveOracleProposalView = () => {
  const navigate = useNavigate();

  return (
    <div className="dissolveOracleProposalViewContainer">
      <BackButtonProposal to="/dao" />

      <div className="headerSection">
        <h1 className="mainTitle">
          OpenWork DAO Smart Contract Proposal
          <div className="statusBadge">Open</div>
        </h1>
        <div className="viewContractLink">
          <span>View contract</span>
          <img src="/arrow-up-right.svg" alt="External link" />
        </div>
      </div>

      <div className="proposalCard">
        <div className="proposalDetailsHeaderSection">
          <h2 className="proposalDetailsHeading">Proposal Details</h2>
          <span className="timeRemaining">2 days left</span>
        </div>

        {/* Proposer Section */}
        <div className="proposerSection">
          <span className="sectionLabel">PROPOSED BY</span>
          <div className="proposerInfo">
            <div className="proposerProfile">
              <img src="/avatar-profile.png" alt="Proposer" className="proposerAvatar" />
              <span className="proposerName">Mollie Hall</span>
            </div>
            <button className="viewProfileButton">
              <span>View Profile</span>
              <img src="/arrow-up-right.svg" alt="Arrow" />
            </button>
          </div>
        </div>

        {/* Proposal Details Section */}
        <div className="detailsSection">
          <span className="sectionLabel">PROPOSAL DETAILS</span>
          
          <div className="detailField">
            <div className="fieldButton">General Skill Oracle</div>
          </div>

          <div className="reasonBox">
            <p className="reasonText">
              Reason explaining why this skill oracle should exist
            </p>
          </div>
        </div>

        {/* Voting Section */}
        <div className="votingSection">
          <div className="tokenCounts">
            <div className="tokenCount">
              <span className="tokenLabel">TOKENS IN FAVOUR</span>
              <div className="tokenValue">
                <span className="tokenNumber">1M</span>
                <div className="tokenIcon">
                  <img src="/openwork-token.svg" alt="Token" />
                </div>
              </div>
            </div>
            <div className="tokenCount">
              <span className="tokenLabel">TOKENS AGAINST</span>
              <div className="tokenValue">
                <span className="tokenNumber">250K</span>
                <div className="tokenIcon">
                  <img src="/openwork-token.svg" alt="Token" />
                </div>
              </div>
            </div>
          </div>

          <div className="progressBarSection">
            <div className="progressLabels">
              <span className="thresholdLabel">MIN. THRESHOLD 75%</span>
            </div>
            <div className="progressBarContainer">
              <div className="progressBar favor">
                <div className="progressBarFill"></div>
              </div>
              <div className="progressBar against">
                <div className="progressBarFill"></div>
              </div>
              <div className="thresholdLine"></div>
            </div>
            <div className="progressLegend">
              <span className="legendLabel">0.25M TOTAL VOTES</span>
              <div className="legendItems">
                <div className="legendItem">
                  <img src="/ellipse-green.svg" alt="In Favor" />
                  <span>0.25M IN FAVOUR</span>
                </div>
                <div className="legendItem">
                  <img src="/ellipse-red.svg" alt="Against" />
                  <span>0 AGAINST</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Section */}
        <div className="conditionsSection">
          <span className="conditionsLabel">CONDITIONS TO BE MET BEFORE TIME LOCK PERIOD</span>
          <div className="conditionsText">
            <ul className="conditionsList">
              <li>1M minimum votes  <span className="conditionsSubtext">(Current: 0.25M votes)</span></li>
              <li>75% minimum approval percentage  <span className="conditionsSubtext">(Current: 40%)</span></li>
            </ul>
          </div>
          <button className="voteHistoryButton">
            <span>Vote History</span>
            <img src="/chevron-right.svg" alt="Arrow" className="voteHistoryArrow" />
          </button>
        </div>

        {/* Vote Buttons */}
        <div className="voteButtons">
          <button className="voteButton downvote">
            <span>Downvote</span>
            <img src="/downvote-icon.svg" alt="Downvote" />
          </button>
          <button className="voteButton upvote">
            <span>Upvote</span>
            <img src="/upvote-icon.svg" alt="Upvote" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DissolveOracleProposalView;
