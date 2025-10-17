import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';
import './ContractUpgradeProposalView.css';

const ContractUpgradeProposalView = () => {
  const navigate = useNavigate();

  return (
    <div className="contractUpgradeProposalViewContainer">
      <BackButtonProposal to="/dao" />

      <h1 className="mainTitle">Contract Upgrade Proposal</h1>
      <div className="statusBadge">Active</div>

      <div className="viewContractLink">
        <span>View Contract</span>
        <img src="/arrow-up-right.svg" alt="External link" />
      </div>

      <div className="proposalCard">
        <div className="proposalDetailsHeaderSection">
          <h2 className="proposalDetailsHeading">Proposal Details</h2>
        </div>

        {/* Proposer Section */}
        <div className="proposerSection">
          <span className="sectionLabel">Proposer</span>
          <div className="proposerInfo">
            <div className="proposerProfile">
              <img src="/avatar-profile.png" alt="Proposer" className="proposerAvatar" />
              <span className="proposerName">Brijesh Pandey</span>
            </div>
            <button className="viewProfileButton">
              <span>View Profile</span>
              <img src="/arrow-up-right.svg" alt="Arrow" />
            </button>
          </div>
        </div>

        {/* Contract Code Section */}
        <div className="contractCodeSection">
          <span className="sectionLabel">Contract Code</span>
          <div className="codeSnippet">
            <pre>
              <code>{`pragma solidity ^0.8.0;

contract UpgradedContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}`}</code>
            </pre>
          </div>
          <div className="reasonBox">
            <p className="reasonText">
              The upgraded contract implements optimized storage patterns and includes additional security checks to prevent unauthorized access.
            </p>
          </div>
        </div>

        {/* Voting Section */}
        <div className="votingSection">
          <div className="tokenCounts">
            <div className="tokenCount">
              <span className="tokenLabel">Tokens in Favor</span>
              <div className="tokenValue">
                <span className="tokenNumber">1M</span>
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
              </div>
            </div>
            <div className="tokenCount">
              <span className="tokenLabel">Tokens Against</span>
              <div className="tokenValue">
                <span className="tokenNumber">250K</span>
                <img src="/openwork-token.svg" alt="Token" className="tokenIcon" />
              </div>
            </div>
          </div>

          <div className="progressBarSection">
            <div className="progressLabels">
              <span className="thresholdLabel">Quorum Threshold: 75%</span>
            </div>
            <div className="progressBarContainer">
              <div className="progressBar">
                <div className="progressBarFill favor"></div>
                <div className="progressBarFill against"></div>
              </div>
              <div className="thresholdLine"></div>
            </div>
            <div className="progressLegend">
              <span className="timeLeft">Ends in: 5 days 20 hours</span>
              <div className="legendItems">
                <div className="legendItem">
                  <img src="/ellipse-green.svg" alt="In Favor" />
                  <span>Tokens in Favor</span>
                </div>
                <div className="legendItem">
                  <img src="/ellipse-red.svg" alt="Against" />
                  <span>Against</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Section */}
        <div className="conditionsSection">
          <div className="conditionsHeader">
            <span className="conditionsLabel">Conditions for Proposal Approval</span>
            <div className="conditionsText">
              <p>The approval threshold is 75% of the tokens.</p>
              <p>Upon approval, the job contract will be updated automatically.</p>
            </div>
          </div>
          <button className="voteHistoryButton">
            <span>View Vote History</span>
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

export default ContractUpgradeProposalView;
