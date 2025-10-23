import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./ChainSwitching.css";

const ChainSwitching = () => {
  const navigate = useNavigate();
  const [selectedChain, setSelectedChain] = useState("Arbitrum");
  const [showChainDropdown, setShowChainDropdown] = useState(false);

  const chains = [
    { name: "Arbitrum", icon: "/arbitrum-chain.png" },
    { name: "Ethereum", icon: "/ethereum-chain.png" }
  ];

  const handleChainSelect = (chainName) => {
    setSelectedChain(chainName);
    setShowChainDropdown(false);
  };

  return (
    <div className="chain-switching-container">
      {/* Chain Selector - Positioned on left side */}
      <div className="header-chain-selector">
        <div
          className="chain-selector-button"
          onClick={() => setShowChainDropdown(!showChainDropdown)}
        >
          <img
            src={chains.find(c => c.name === selectedChain)?.icon}
            alt={selectedChain}
            className="chain-icon"
          />
          <span>{selectedChain}</span>
          <img
            src="/chevron-down-small.svg"
            alt="dropdown"
            className="dropdown-icon"
          />
        </div>

        {/* Chain Dropdown Tooltip */}
        {showChainDropdown && (
          <div className="chain-dropdown-tooltip">
            <div className="tooltip-arrow"></div>
            <div className="tooltip-content">
              <p className="tooltip-title">SELECT CHAIN</p>
              <div className="chain-options">
                {chains.map((chain) => (
                  <div
                    key={chain.name}
                    className="chain-option"
                    onClick={() => handleChainSelect(chain.name)}
                  >
                    <img
                      src={selectedChain === chain.name ? "/radio-button-checked.svg" : "/radio-button-unchecked.svg"}
                      alt="radio"
                      className="radio-icon"
                    />
                    <img src={chain.icon} alt={chain.name} className="chain-icon" />
                    <span>{chain.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="chain-switching-main">
        {/* Back Button and Title */}
        <BackButton to="/" title="UI for OpenWork" imgSrc="/chevron-left.svg" />

        {/* Contract Info */}
        <div className="contract-info">
          <div className="contract-id">
            <span>Contract ID: 0xDEAF...fB8B</span>
            <img src="/copy-01.svg" alt="copy" className="copy-icon" />
          </div>
        </div>

        {/* Fees and Chain Info */}
        <div className="job-info">
          <div className="info-item">
            <span className="info-label">Fees:</span>
            <div className="info-value">
              <span>5</span>
              <img src="/ow-token-icon.png" alt="token" className="token-icon" />
            </div>
            <img src="/info.svg" alt="info" className="info-icon" />
          </div>
          <div className="info-item">
            <span className="info-label">Chain:</span>
            <div className="info-value">
              <img src="/ethereum-chain.png" alt="Ethereum" className="chain-icon" />
              <span>Ethereum</span>
            </div>
            <img src="/info.svg" alt="info" className="info-icon" />
          </div>
        </div>

        {/* Circular Milestone Visualization */}
        <div className="milestone-circle">
          {/* Radiant Glow Background */}
          <div className="radiant-glow">
            <img src="/RadiantGlow.svg" alt="glow" className="glow-layer" />
          </div>

          {/* Core Circle with Actions */}
          <div className="core-circle">
            <img src="/core.svg" alt="core" className="core-visual" />

            {/* Center Amount Locked */}
            <div className="center-amount">
              <div className="amount-value">
                <span>50</span>
                <img src="/ow-token-icon.png" alt="token" className="token-icon" />
              </div>
              <p className="amount-label">AMOUNT LOCKED</p>
            </div>
          </div>

          {/* Left Side - Amount Paid */}
          <div className="side-info side-info-left">
            <div className="side-amount">
              <div className="amount-value">
                <span>100</span>
                <img src="/ow-token-icon.png" alt="token" className="token-icon" />
              </div>
              <img src="/info.svg" alt="info" className="info-icon-small" />
            </div>
            <p className="side-label">AMOUNT PAID</p>
            <p className="side-name">Jollie Hall</p>
          </div>

          {/* Left Side Avatar */}
          <div className="side-avatar side-avatar-left">
            <img src="/avatar-profile.png" alt="Jollie Hall" className="avatar-image" />
            <img src="/person.svg" alt="icon" className="avatar-icon" />
          </div>

          {/* Right Side - Amount Received */}
          <div className="side-info side-info-right">
            <div className="side-amount">
              <div className="amount-value">
                <span>50</span>
                <img src="/ow-token-icon.png" alt="token" className="token-icon" />
              </div>
              <img src="/info.svg" alt="info" className="info-icon-small" />
            </div>
            <p className="side-label">AMOUNT RECEIVED</p>
            <p className="side-name">Mollie Hall</p>
          </div>

          {/* Right Side Avatar */}
          <div className="side-avatar side-avatar-right">
            <img src="/avatar-profile.png" alt="Mollie Hall" className="avatar-image" />
            <img src="/person.svg" alt="icon" className="avatar-icon" />
          </div>

          {/* Milestone Progress */}
          <p className="milestone-progress">1/3 MILESTONES COMPLETED</p>
        </div>

        {/* Bottom Instruction */}
        <p className="hover-instruction">Hover to get options</p>
      </div>
    </div>
  );
};

export default ChainSwitching;
