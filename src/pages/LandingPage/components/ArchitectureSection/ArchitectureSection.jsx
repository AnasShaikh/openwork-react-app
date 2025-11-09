import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ArchitectureSection.css';

const ArchitectureSection = () => {
  const navigate = useNavigate();

  return (
    <section className="lp-11-section">
      <div className="lp-11-container">
        <div className="lp-11-content">
          <h2 className="lp-11-heading">The OpenWork Architecture</h2>
          <p className="lp-11-description">
            OpenWork's chain-agnostic architecture lets users operate on their preferred chains, like Arbitrum, while all data is securely stored on the OpenWork Chain. This OP-Stack based L2 on Ethereum supports oracles for dispute resolution and key DAO decisions through OpenWork's DAO contracts.
          </p>
          <button 
            className="lp-blue-button"
            onClick={() => navigate('/documentation')}
          >
            View Documentation
            <img src="/assets/lp8-arrow-icon.svg" alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-11-diagram-container">
          {/* Architecture diagram - complex SVG structure in main CSS */}
          <div className="lp-11-architecture-diagram">
            <div className="lp-11-connector lp-11-connector-1"></div>
            <div className="lp-11-connector lp-11-connector-2"></div>
            <div className="lp-11-connector lp-11-connector-3"></div>

            {/* Simplified diagram - full structure in original */}
            <div className="lp-11-layer lp-11-layer-top">
              <div className="lp-11-layer-label">
                <span className="lp-11-label-text">Local Chains</span>
              </div>
            </div>

            <div className="lp-11-layer lp-11-layer-middle">
              <div className="lp-11-layer-label">
                <span className="lp-11-label-text">OpenWork Chain</span>
              </div>
            </div>

            <div className="lp-11-layer lp-11-layer-bottom">
              <div className="lp-11-layer-label">
                <span className="lp-11-label-text">Ethereum Mainnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
