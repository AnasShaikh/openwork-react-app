import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import LandingHeader from './components/LandingHeader/LandingHeader';
import LandingSidebar from './components/LandingSidebar/LandingSidebar';
import HeroSection from './components/01-HeroSection/HeroSection';
import ProfileSection from './components/02-ProfileSection/ProfileSection';
import LedgerSection from './components/03-LedgerSection/LedgerSection';
import PostJobSection from './components/04-PostJobSection/PostJobSection';
import DirectContractSection from './components/05-DirectContractSection/DirectContractSection';
import JobProgressSection from './components/06-JobProgressSection/JobProgressSection';
import DisputeSection from './components/07-DisputeSection/DisputeSection';
import EarnTokenSection from './components/08-EarnTokenSection/EarnTokenSection';
import GovernanceSection from './components/09-GovernanceSection/GovernanceSection';
import MultiChainSection from './components/10-MultiChainSection/MultiChainSection';
import ArchitectureSection from './components/11-ArchitectureSection/ArchitectureSection';
import RevolutionSection from './components/12-RevolutionSection/RevolutionSection';
import ContactSection from './components/13-ContactSection/ContactSection';

const LandingPage = () => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="landing-page">
      {/* Radiant Glow - Fixed position, visible when sidebar expanded */}
      <div className="page-radiant-glow"></div>
      <LandingSidebar />
      <LandingHeader />
      <HeroSection />
      
      {/* Render sections below hero only for mobile/tablet (<=1024px) */}
      {isMobileOrTablet && (
        <>
          <div id="discoverable">
            <ProfileSection />
          </div>
          <div id="job-contract">
            <LedgerSection />
          </div>
          <div id="direct-contract">
            <PostJobSection />
          </div>
          <div id="job-progress">
            <DirectContractSection />
          </div>
          <div id="raise-dispute">
            <JobProgressSection />
          </div>
          <div id="earn-govern">
            <DisputeSection />
          </div>
          <div id="dao">
            <EarnTokenSection />
          </div>
          <div id="local-network">
            <GovernanceSection />
          </div>
          <div id="openwork-arch">
            <MultiChainSection />
          </div>
          <div id="work-revolution">
            <ArchitectureSection />
            <RevolutionSection />
            <ContactSection />
          </div>
        </>
      )}
    </div>
  );
};

export default LandingPage;
