import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/Button/Button';
import './LandingHeader.css';

const LandingHeader = ({ onLaunchApp }) => {
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/home');
  };

  return (
    <header className="landing-header">
      <div className="logo-wrapper">
        <img src="public/Logo.jpg" alt="OpenWork" className="logo" />
      </div>
      
      <div className="header-actions">
        <Button 
          icon="/assets/203519ed928f5759c5c5434e7d71de7598f55b96.svg"
          buttonCss="header-icon-btn"
        />
        <Button 
          icon="/assets/141ae2395558d7fc65c358b46cf1beaa163ad655.svg"
          buttonCss="header-icon-btn"
        />
        <button 
          className="lp-blue-button"
          onClick={handleLaunchApp}
        >
          Launch App
          <img src="/assets/b16a6ff87b2913f8bdc303dda7816c024bd687cb.svg" alt="" className="lp-button-icon" />
        </button>
      </div>
    </header>
  );
};

export default LandingHeader;
