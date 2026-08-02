import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ArchitectureSection.css';
import ArchitectureDiagram from '/assets/LP-11 architectecture.svg';
import ArrowIcon from '/assets/lp8-arrow-icon.svg';

const ArchitectureSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [imageLoaded, setImageLoaded] = useState(false);
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
      ? "OpenWork's chain-agnostic architecture lets users operate on their preferred chains, like Arbitrum, while all data is securely stored on the OpenWork Chain."
      : "OpenWork's chain-agnostic architecture lets users operate on their preferred chains, like Arbitrum, while all data is securely stored on the aggregating OpenWork parent chain. This parent chain supports oracles for dispute resolution and key DAO decisions through OpenWork's DAO contracts.",
    [isMobile]
  );

  return (
    <section id="lp-11-section" className="lp-section lp-11-section">
      <div className="lp-11-container">
        <div className="lp-11-content">
          <div className="text-content">
            <h2 className="lp-11-heading">The OpenWork Architecture</h2>
            <p className="lp-11-description">{descriptionText}</p>
          </div>

          <button 
            className={isMobile ? "lp-blue-button-1 section-action-button" : "lp-blue-button section-action-button"}
            onClick={() => window.open('https://app.openwork.technology/docs', '_blank')}
          >
            View Documentation
            <img src={ArrowIcon} alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-11-diagram-container">
          {/* Architecture diagram */}
          {!imageLoaded && <div className="lp-11-shimmer" />}
          <img 
            src={ArchitectureDiagram} 
            alt="OpenWork Architecture Diagram" 
            className={`lp-11-architecture-image ${imageLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;