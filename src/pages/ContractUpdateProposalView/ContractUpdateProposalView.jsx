import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';
import './ContractUpdateProposalView.css';

function ContractUpdateProposalView() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dao');
  };

  const handleViewContract = () => {
    // Handle view contract
  };

  const handleViewProfile = () => {
    // Handle view profile
  };

  const handleVoteHistory = () => {
    // Handle vote history
  };

  const handleDownvote = () => {
    // Handle downvote
  };

  const handleUpvote = () => {
    // Handle upvote
  };

  return (
    <div className="proposalViewContainer">
      {/* Back Button - Outside, aligned left */}
      <BackButtonProposal to="/dao" />

      {/* Main Title - Outside, Centered */}
      <div className="proposalMainTitleWrapper">
        <h1 className="proposalMainTitle">OpenWork DAO Smart Contract Proposal</h1>
        <div className="proposalStatusBadge">Open</div>
      </div>

      {/* View Contract Link - Outside, Centered */}
      <div className="viewContractLink" onClick={handleViewContract}>
        <span>View contract</span>
        <img src="/arrow-up-right.svg" alt="View" />
      </div>

      {/* Card starts from Proposal Details */}
      <div className="proposalViewCard">
        {/* Proposal Details Header with Line */}
        <div className="proposalDetailsHeaderSection">
          <div className="proposalDetailsHeader">
            <h2 className="proposalSectionTitle">Proposal Details</h2>
            <span className="timeLeft">2 days left</span>
          </div>
        </div>

        {/* Proposed By */}
        <div className="proposedBySection">
          <p className="sectionLabel">PROPOSED BY</p>
          <div className="proposerInfo">
            <div className="proposerLeft">
              <img src="/avatar-profile.png" alt="Proposer" className="proposerAvatar" />
              <span className="proposerName">Mollie Hall</span>
            </div>
            <button className="viewProfileButton" onClick={handleViewProfile}>
              <span>View Profile</span>
              <img src="/arrow-up-right.svg" alt="View" />
            </button>
          </div>
        </div>

        {/* Proposal Content */}
        <div className="proposalContent">
          <p className="sectionLabel">PROPOSAL DETAILS</p>
          
          <div className="contractDetailsBox">
            <p className="contractParameter">No. of votes required to pass a proposal</p>
            
            <div className="valuesRow">
              <div className="valueColumn">
                <p className="valueLabel">CURRENT VALUE</p>
                <div className="currentValueBox">20%</div>
              </div>
              <div className="valueColumn">
                <p className="valueLabel">PROPOSED VALUE</p>
                <div className="proposedValueBox">80%</div>
              </div>
            </div>
          </div>

          <div className="reasonBox">
            <p>Reasons explaining why these changes should be made to the contract go here</p>
          </div>
        </div>

        {/* Voting Section */}
        <div className="votingSection">
          <div className="tokensRow">
            <div className="tokensBox">
              <p className="tokensLabel">TOKENS IN FAVOUR</p>
              <div className="tokensValue">
                <span>1M</span>
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
              </div>
            </div>
            <div className="tokensBox">
              <p className="tokensLabel">TOKENS AGAINST</p>
              <div className="tokensValue">
                <span>250K</span>
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progressSection">
            <div className="progressHeader">
              <span className="thresholdLabel">MIN. THRESHOLD 75%</span>
            </div>
            <div className="progressBarContainer">
              <div className="progressBarGreen"></div>
              <div className="progressBarRed"></div>
              <div className="thresholdLine"></div>
            </div>
          </div>

          <div className="voteStats">
            <span className="totalVotes">0.25M TOTAL VOTES</span>
            <div className="voteLegend">
              <div className="legendItem">
                <img src="/ellipse-green.svg" alt="" />
                <span>0.25M IN FAVOUR</span>
              </div>
              <div className="legendItem">
                <img src="/ellipse-red.svg" alt="" />
                <span>0 AGAINST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="conditionsBox">
          <p className="conditionsTitle">CONDITIONS TO BE MET BEFORE TIME LOCK PERIOD</p>
          <div className="conditionsList">
            <p>• 1M minimum votes <span className="conditionCurrent">(Current: 0.25M votes)</span></p>
            <p>• 75% minimum approval percentage <span className="conditionCurrent">(Current: 40%)</span></p>
          </div>
          <button className="voteHistoryButton" onClick={handleVoteHistory}>
            <span>Vote History</span>
            <img src="/chevron-up.svg" alt="" className="chevronRotated" />
          </button>
        </div>

        {/* Vote Buttons */}
        <div className="voteButtonsRow">
          <button className="downvoteButton" onClick={handleDownvote}>
            <span>Downvote</span>
            <img src="/downvote-icon.svg" alt="Downvote" />
          </button>
          <button className="upvoteButton" onClick={handleUpvote}>
            <span>Upvote</span>
            <img src="/upvote-icon.svg" alt="Upvote" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContractUpdateProposalView;
