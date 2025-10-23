import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContractUpgradeProposalStep2.css';
import BackButtonProposal from '../../components/BackButtonProposal/BackButtonProposal';

const ContractUpgradeProposalStep2 = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    // Handle proposal submission
    console.log('Submitting proposal with reason:', reason);
  };

  return (
    <div className="upgradeProposalStep2Container">
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

      <div className="upgradeProposalStep2Card">
        <div className="cardHeader">
          <h2 className="cardHeaderTitle">Contract Details</h2>
        </div>

        <div className="cardContent">
          <p className="contentLabel">Suggest how you'd want this contract to be upgraded</p>

          <div className="codeSnippetSection">
            <div className="codeSnippetBox">
              <div className="codeSnippetSidebar">
                <div className="lineNumbers">
                  <p>1</p>
                  <p>2</p>
                  <p>3</p>
                  <p>4</p>
                  <p>5</p>
                  <p>6</p>
                  <p>7</p>
                  <p>8</p>
                  <p>9</p>
                  <p>10</p>
                  <p>11</p>
                  <p>12</p>
                  <p>13</p>
                  <p>14</p>
                  <p>15</p>
                  <p>16</p>
                  <p>17</p>
                  <p>18</p>
                  <p>19</p>
                  <p>20</p>
                  <p>21</p>
                </div>
              </div>
              <div className="codeSnippetContent">
                <p className="codeComment">// Imports</p>
                <p><span className="codeKeyword">import</span> <span className="codeProperty">mongoose</span>{`, { `}<span className="codeProperty">Schema</span>{` } `}<span className="codeKeyword">from</span>{` 'untitled'`}</p>
                <p>&nbsp;</p>
                <p className="codeComment">// Collection name</p>
                <p><span className="codeKeyword">export const</span> <span className="codeProperty">collection</span>{` = 'Design'|`}</p>
                <p>&nbsp;</p>
                <p className="codeComment">// Schema</p>
                <p><span className="codeKeyword">const</span> <span className="codeProperty">schema</span>{` = `}<span className="codeKeyword">new</span>{` Schema({`}</p>
                <p className="codeIndent">  <span className="codeProperty">name</span>{`: {`}</p>
                <p className="codeIndent">    <span className="codeProperty">type</span>: String,</p>
                <p className="codeIndent">    <span className="codeProperty">required</span>: true</p>
                <p className="codeIndent">{`  },`}</p>
                <p>&nbsp;</p>
                <p className="codeIndent">  <span className="codeProperty">description</span>{`: {`}</p>
                <p className="codeIndent">    <span className="codeProperty">type</span>: String</p>
                <p className="codeIndent">{`  }`}</p>
                <p><span>{`}, {`}</span><span className="codeProperty">timestamps</span><span>{`: true})`}</span></p>
                <p>&nbsp;</p>
                <p className="codeComment">// Model</p>
                <p><span className="codeKeyword">export default</span><span>{` untitled.model(`}</span><span className="codeProperty">collection</span><span>{`, `}</span><span className="codeProperty">schema</span><span>{`, `}</span><span className="codeProperty">collection</span>)</p>
                <p>&nbsp;</p>
              </div>
            </div>
          </div>

          <div className="reasonTextArea">
            <textarea
              className="reasonInput"
              placeholder="Reasons explaining how and why this contract could be upgraded go here"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <button className="submitProposalButton" onClick={handleSubmit}>
          Submit Proposal
        </button>
      </div>
    </div>
  );
};

export default ContractUpgradeProposalStep2;
