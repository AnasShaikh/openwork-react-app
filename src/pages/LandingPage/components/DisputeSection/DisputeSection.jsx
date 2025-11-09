import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DisputeSection.css';

const DisputeSection = () => {
  const navigate = useNavigate();

  return (
    <section id="lp-7-section" className="lp-section lp-7-section">
      <div className="lp-7-container">
        <div className="lp-7-content">
          <h1 className="lp-7-heading">Dispute Resolution with Skill Oracles</h1>
          <p className="lp-7-description">
            Disagreements? Let verified experts in the field decide. Skill-based oracles resolve disputes through decentralized token-based voting.
          </p>
          <button 
            className="lp-blue-button"
            onClick={() => navigate('/browse-jobs')}
          >
            See Disputes
            <img src="/assets/lp7-arrow-icon.svg" alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-7-circle-container">
          <div className="lp-7-oracle-circle-group">
            {/* Complex dispute visualization - keeping original structure */}
            <div className="lp-7-radiant-glow">
              <img src="/assets/lp7-glow-1.svg" alt="" className="lp-7-glow-layer-1" />
              <img src="/assets/lp7-glow-2.svg" alt="" className="lp-7-glow-layer-2" />
            </div>

            <div className="lp-7-core-circle">
              <img src="/assets/lp7-core-circle.svg" alt="" className="lp-7-core-bg" />
            </div>

            <img src="/assets/outer-circle-dispute.svg" alt="" className="lp-7-ellipse-bg" />

            <div className="lp-7-center-athena">
              <div className="lp-7-athena-container">
                <img src="/assets/Athena.svg" alt="Athena" className="lp-7-athena-image" />
                <img src="/assets/lp7-rectangle-bg.svg" alt="" className="lp-7-athena-bg" />
              </div>
            </div>

            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className={`lp-7-oracle-avatar lp-7-oracle-${['top', 'left', 'bottom-left', 'bottom-right', 'right'][num-1]}`}>
                <div className="lp-7-oracle-button">
                  <img src={`/assets/lp7-oracle-${num}.png`} alt="Oracle" className="lp-7-oracle-img" />
                </div>
                <img src={`/assets/lp7-status-${num === 4 || num === 5 ? 'green' : 'red-green'}.svg`} alt="" className="lp-7-oracle-status" />
                <div className="lp-7-oracle-coins">
                  <img src="/assets/lp7-openwork-coin.png" alt="" className="lp-7-coin-stack" />
                </div>
              </div>
            ))}

            <div className="lp-7-center-question">
              <button className="lp-7-question-button">IS THE JOB DONE?</button>
              <div className="lp-7-vote-options">
                <img src="/assets/lp7-vote-red.svg" alt="No" className="lp-7-vote-btn" />
                <span className="lp-7-or-text">OR</span>
                <img src="/assets/lp7-vote-green.svg" alt="Yes" className="lp-7-vote-btn" />
              </div>
            </div>

            <p className="lp-7-bottom-text">MAJORITY OF STAKERS SAYS THAT THE JOB WAS DONE</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DisputeSection;
