import React from 'react';
import Button from '../../../../components/Button/Button';
import './LandingHeader.css';

const LandingHeader = ({ onLaunchApp }) => {
  return (
    <header className="landing-header">
      <div className="logo-wrapper">
        <img src="public/Logo.jpg" alt="OpenWork" className="logo" />
      </div>
      
      <div className="header-actions">
        <Button 
          icon="/assets/f424bb301166452f1d2aae2badd19051c2788323.svg"
          buttonCss="header-icon-btn"
        />
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
          onClick={onLaunchApp}
        >
          Launch App
        </button>
      </div>
    </header>
  );
};

export default LandingHeader;
