import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './EarnTokenSection.css';

// SVG imports
import EllipseBgSVG from '/assets/lp8-ellipse-bg.svg';
import CoreCircleSVG from '/assets/lp8-core-circle.svg';
import ArrowIcon from '/assets/lp8-arrow-icon.svg';
import OworkTokenSVG from '/assets/lp8-owork-token.svg';

// PNG imports
import OpenworkCoin from '/assets/lp8-openwork-coin.png';
import UsdcIcon from '/assets/lp8-usdc-icon.png';
import User1 from '/assets/lp8-user-1.png';
import User2 from '/assets/lp8-user-2.png';

const EarnTokenSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize description text
  const descriptionText = useMemo(() => 
    isMobile
      ? "With a total of 1 billion tokens minted in 20 batches. Initial rewards are high but will halve as transaction volume doubles, capping at $200M."
      : "100% of OWORK tokens are earned by completing jobs on the platform. No pre-sale. No investors. Just proof of work.",
    [isMobile]
  );

  return (
    <section id="lp-8-section" className="lp-section lp-8-section">
      <div className="lp-8-container">
        <div className="lp-8-content">
          <div className="text-content">
            <h1 className="lp-8-heading">Earn OWORK Tokens. Only Through Work.</h1>
            <p className="lp-8-description">{descriptionText}</p>
          </div>
          <button 
            className={isMobile ? "lp-blue-button-1 section-action-button" : "lp-blue-button section-action-button"}
            onClick={() => window.open('https://app.openwork.technology/refer-earn', '_blank')}
          >
            Earn OWORK Token
            <img src={ArrowIcon} alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-8-circle-container">
          <div className="lp-8-token-circle-group">
            {/* Ellipse Background */}
            <img src={EllipseBgSVG} alt="" className="lp-8-ellipse-bg" />

            {/* Radiant Glow */}
            <div className="lp-8-radiant-glow"></div>

            {/* Core Circle */}
            <div className="lp-8-core-circle">
              <img src={CoreCircleSVG} alt="" className="lp-8-core-bg" />
            </div>

            {/* Center Token */}
            <div className="lp-8-center-token">
              <img src={OpenworkCoin} alt="OWORK Token" className="lp-8-token-image" />
            </div>

            {/* Left User Avatar */}
            <div className="lp-8-user-avatar lp-8-user-left">
              <div className="lp-8-user-label lp-8-spend-label">
                <span className="lp-8-label-text">SPEND</span>
                <div className="lp-8-amount-display">
                  <img src={UsdcIcon} alt="USDC" className="lp-8-currency-icon" />
                  <span className="lp-8-amount-text">$10K</span>
                </div>
              </div>
              <div className="lp-8-user-button">
                <img src={User1} alt="User" className="lp-8-user-img" />
              </div>
              <div className="lp-8-user-label lp-8-earn-label">
                <span className="lp-8-label-text lp-8-earn-text">EARN</span>
                <div className="lp-8-amount-display">
                  <div className="lp-8-token-icon">
                    <img src={OworkTokenSVG} alt="OWORK" className="lp-8-token-icon-img" />
                  </div>
                  <span className="lp-8-token-amount">50K</span>
                </div>
              </div>
            </div>

            {/* Right User Avatar */}
            <div className="lp-8-user-avatar lp-8-user-right">
              <div className="lp-8-user-label lp-8-earn-label-alt">
                <span className="lp-8-label-text">EARN</span>
                <div className="lp-8-amount-display">
                  <img src={UsdcIcon} alt="USDC" className="lp-8-currency-icon" />
                  <span className="lp-8-amount-text">$10K</span>
                </div>
              </div>
              <div className="lp-8-user-button">
                <img src={User2} alt="User" className="lp-8-user-img" />
              </div>
              <div className="lp-8-user-label lp-8-earn-label">
                <span className="lp-8-label-text lp-8-earn-text">EARN</span>
                <div className="lp-8-amount-display">
                  <div className="lp-8-token-icon">
                    <img src={OworkTokenSVG} alt="OWORK" className="lp-8-token-icon-img" />
                  </div>
                  <span className="lp-8-token-amount">50K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EarnTokenSection;