import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';
import './RecruitmentProposalView.css';

const RecruitmentProposalView = () => {
  const navigate = useNavigate();

  return (
    <div className="recruitmentProposalViewContainer">
      <BackButtonProposal to="/dao" />

      <div className="headerSection">
        <h1 className="mainTitle">
          Recruitment Proposal
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

        {/* Oracle Selection Section */}
        <div className="detailsSection">
          <span className="sectionLabel">PROPOSAL DETAILS</span>
          
          <div className="detailField">
            <span className="fieldLabel">Select Skill Oracle</span>
            <div className="fieldValue">General Skill Oracle</div>
          </div>

          <div className="detailField">
            <span className="fieldLabel">Member Count</span>
            <div className="fieldValue">10/20</div>
          </div>

          <div className="detailField">
            <span className="fieldLabel">Wallet Address</span>
            <div className="fieldValue">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</div>
          </div>

          <div className="detailField">
            <span className="fieldLabel">Email/Telegram (Optional Contact Info)</span>
            <div className="fieldValue">brijesh@openwork.com</div>
          </div>

          <div className="reasonBox">
            <p className="reasonText">
              Experienced blockchain developer with 5+ years in Solidity and DeFi protocols.
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
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
              </div>
            </div>
            <div className="tokenCount">
              <span className="tokenLabel">TOKENS AGAINST</span>
              <div className="tokenValue">
                <span className="tokenNumber">250K</span>
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
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
                  <span>1M IN FAVOUR</span>
                </div>
                <div className="legendItem">
                  <img src="/ellipse-red.svg" alt="Against" />
                  <span>250K AGAINST</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Section */}
        <div className="conditionsSection">
          <span className="conditionsLabel">CONDITIONS TO BE MET BEFORE TIME LOCK PERIOD</span>
          <div className="conditionsText">
            <p>• 1M minimum votes (Current: 0.25M votes)</p>
            <p>• 75% minimum approval percentage (Current: 40%)</p>
          </div>
          <button className="voteHistoryButton">
            <span>Vote History</span>
            <img src="/arrow-up-right.svg" alt="Arrow" className="voteHistoryArrow" />
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

export default RecruitmentProposalView;
