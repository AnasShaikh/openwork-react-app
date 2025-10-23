import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReferEarn.css";
import BackButtonProposal from "../../components/BackButtonProposal/BackButtonProposal";

export default function ReferEarn() {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const referralLink = "https://openwork.com/019824091ijbfouwqf-129874ig";
  const walletAddress = "0xDEAFkqjfh0q8701fB8B";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="refer-earn-container">
      {/* Main Card */}
      <div className="refer-earn-card">
        {/* Card Header */}
        <div className="refer-earn-card-header">
          <div className="refer-earn-header-content">
            <BackButtonProposal onClick={() => navigate(-1)} />
            <h2 className="refer-earn-card-title">Refer & Earn</h2>
          </div>
        </div>

        {/* Content */}
        <div className="refer-earn-content">
          {/* Icon */}
          <div className="refer-earn-icon-wrapper">
            <img 
              src="/assets/refer-earn-icon.svg" 
              alt="Refer & Earn" 
              className="refer-earn-icon"
            />
          </div>

          {/* Main Content */}
          <div className="refer-earn-main-content">
            {/* Message */}
            <div className="refer-earn-message-section">
              <p className="refer-earn-message">
                Since you're part of the DAO or have at least 1 skill verified, you are 
                eligible to refer job givers or takers to OpenWork. For every job either 
                given or taken up by this profile in the future, 1% of the payment will 
                come to you.
              </p>
            </div>

            {/* Link Sections */}
            <div className="refer-earn-links-section">
              {/* Copy Link Section */}
              <div className="refer-earn-link-group">
                <p className="refer-earn-link-label">COPY AND SHARE THIS LINK</p>
                <div className="refer-earn-link-button">
                  <span className="refer-earn-link-text">{referralLink}</span>
                  <img 
                    src="/assets/copy-icon.svg" 
                    alt="Copy" 
                    className="copy-icon"
                    onClick={handleCopyLink}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Copy Address Section */}
              <div className="refer-earn-link-group">
                <p className="refer-earn-link-label">OR THEY CAN ENTER YOUR ADDRESS ON THEIR PROFILE</p>
                <div className="refer-earn-link-button">
                  <span className="refer-earn-link-text">{walletAddress}</span>
                  <img 
                    src="/assets/copy-icon.svg" 
                    alt="Copy" 
                    className="copy-icon"
                    onClick={handleCopyAddress}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Earnings Display */}
            <div className="refer-earn-earnings-card">
              <div className="refer-earn-earnings-content">
                <p className="refer-earn-earnings-label">YOUR TOTAL REFERRAL EARNINGS</p>
                <div className="refer-earn-earnings-amount">
                  <span className="earnings-value">100</span>
                  <div className="openwork-token">
                    <img 
                      src="/assets/openwork-token.svg" 
                      alt="OpenWork Token" 
                      className="token-icon"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Tokens Button */}
            <div className="refer-earn-actions">
              <button className="claim-tokens-button">
                Claim Tokens
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History Card */}
      <div className="referral-history-card">
        {/* History Header */}
        <div className="referral-history-header">
          <h3 className="referral-history-title">Your Referral History</h3>
        </div>

        {/* History Items */}
        <div className="referral-history-content">
          {/* History Item 1 */}
          <div className="referral-history-item">
            <div className="referral-avatar">
              <img src="/assets/avatar-placeholder.png" alt="User" />
            </div>
            <div className="referral-history-details">
              <div className="referral-history-text">
                <span className="history-text-normal">You earned</span>
                <span className="history-amount">28.762</span>
                <div className="history-token-icon">
                  <img 
                    src="/assets/openwork-token.svg" 
                    alt="Token" 
                    className="token-icon"
                  />
                </div>
                <span className="history-text-normal">because Mollie Hall joined using your link</span>
              </div>
              <div className="referral-history-meta">
                <span className="referrer-name">Jollie Hall</span>
                <span className="referral-time">• 20 min ago</span>
              </div>
            </div>
          </div>

          <div className="history-divider"></div>

          {/* History Item 2 */}
          <div className="referral-history-item">
            <div className="referral-avatar">
              <img src="/assets/avatar-placeholder.png" alt="User" />
            </div>
            <div className="referral-history-details">
              <div className="referral-history-text">
                <span className="history-text-normal">You earned</span>
                <span className="history-amount">28.762</span>
                <div className="history-token-icon">
                  <img 
                    src="/assets/openwork-token.svg" 
                    alt="Token" 
                    className="token-icon"
                  />
                </div>
                <span className="history-text-normal">because Mollie Hall joined using your link</span>
              </div>
              <div className="referral-history-meta">
                <span className="referrer-name">Jollie Hall</span>
                <span className="referral-time">• 20 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
