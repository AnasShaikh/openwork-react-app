import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/Button/Button';
import './LandingHeader.css';

const LandingHeader = ({ onLaunchApp }) => {
  
  const navigate = useNavigate();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show icons after scrolling past hero section (approximately viewport height)
      const heroHeight = window.innerHeight;
      setPastHero(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLaunchApp = () => {
    window.open('https://app.openwork.technology', '_blank');
  };

  const handleBotClick = () => {
    window.open('https://app.openwork.technology/oppy', '_blank');
  };

  const handleLogoClick = () => {
    // Notify other components (HeroSection) to collapse/act like Home was clicked
    window.dispatchEvent(new CustomEvent('openwork-home'));

    // Ensure any expanded sidebar is collapsed
    document.body.classList.remove('sidebar-expanded');

    // Scroll to hero section (same offset as sidebar)
    const hero = document.getElementById('lp-1-section');
    if (hero) {
      const target = Math.max(hero.offsetTop - 80, 0);
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      // Fallback: scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="landing-header">
      <div
        className="logo-wrapper"
        role="button"
        tabIndex="0"
        aria-label="Go to Home"
        onClick={handleLogoClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleLogoClick(); e.preventDefault(); } }}
      >
        <img src="/assets/Logo.jpg" alt="OpenWork" className="logo logo-desktop" />
        <img src="/assets/openwork-logo/logo.svg" alt="OpenWork" className="logo logo-mobile" />
      </div>
      
      <div className="header-actions">
        <Button 
          icon="/assets/f424bb301166452f1d2aae2badd19051c2788323.svg"
          buttonCss={`header-icon-btn mobile-scroll-icon ${pastHero ? 'show' : ''}`}
          onClick={handleBotClick}

        />
        <Button 
          icon="/assets/203519ed928f5759c5c5434e7d71de7598f55b96.svg"
          buttonCss={`header-icon-btn mobile-scroll-icon ${pastHero ? 'show' : ''}`}
          onClick={() => window.open('https://drive.google.com/file/d/1tdpuAM3UqiiP_TKJMa5bFtxOG4bU_6ts/view', '_blank')}
        />
        <Button 
          icon="/assets/141ae2395558d7fc65c358b46cf1beaa163ad655.svg"
          buttonCss="header-icon-btn"
          onClick={() => window.open('https://app.openwork.technology/docs', '_blank')}
        />
        <button 
          className="lp-blue-button"
          onClick={handleLaunchApp}
        >
          Launch App
          <img
            src="/assets/b16a6ff87b2913f8bdc303dda7816c024bd687cb.svg"
            alt=""
            className="lp-button-icon lp-launch-arrow"
          />
        </button>
      </div>
    </header>
  );
};

export default LandingHeader;
