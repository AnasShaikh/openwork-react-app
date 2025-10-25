import React, { useState } from "react";
import "./ChainSelector.css";

const ChainSelector = () => {
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
    <div className="chain-selector-wrapper">
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
  );
};

export default ChainSelector;
