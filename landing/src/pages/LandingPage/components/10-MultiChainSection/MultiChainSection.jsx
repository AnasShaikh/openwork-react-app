import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MultiChainSection.css';

const MultiChainSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
      useEffect(() => {
        const handleResize = () => {
          setIsMobile(window.innerWidth <= 480);
        };
    
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);
  const navigate = useNavigate();

  return (
    <section id="lp-10-section" className="lp-section lp-10-section">
      <div className="lp-10-container">
        <div className="lp-10-content">
          <div className="text-content">
            <h1 className="lp-10-heading">Work on any chain you are comfortable with.</h1>
          <p className="lp-10-description">
              {isMobile
                ? "OpenWork is compatible with all blockchains via its bridging architecture."
                : "OpenWork is compatible with all blockchains via its bridging architecture. Whether you're comfortable with Arbitrum, Optimism, Solana, Polygon—you name it, we can integrate it and you can use the network you trust."
              }
            </p>
          </div>

         <button 
            className={isMobile?"lp-blue-button-1 section-action-button":"lp-blue-button section-action-button"}
            onClick={() => window.open('https://app.openwork.technology/docs', '_blank')}
          >
            View Documentation
            <img src="/assets/lp7-arrow-icon.svg" alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-10-circle-container">
          <div className="lp-10-chain-circle-group">
            {/* Radiant Glow */}
            <div className="lp-10-radiant-glow"></div>

            {/* Core Circle */}
            <div className="lp-10-core-circle">
              <img src="/assets/lp7-core-circle.svg" alt="" className="lp-10-core-bg" />
            </div>

            {/* Center Label */}
            <div className="lp-10-center-label">
              <span className="lp-10-compatible-text">COMPATIBLE WITH</span>
            </div>

            {/* Outer Chain Image */}
            <img src="/assets/Frame 2147261901.png" alt="Chain Networks" className="lp-10-outer-chain-image" />

            {/* Center Chain Icons (static) */}
            <div className="lp-10-chain-icon lp-10-chain-xdc">
              <img src="/assets/Shape_1_2_.svg" alt="XDC" />
            </div>

            <div className="lp-10-chain-icon lp-10-chain-arbitrum-center">
              <img src="/assets/lp10-arbitrum.svg" alt="Arbitrum" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultiChainSection;
