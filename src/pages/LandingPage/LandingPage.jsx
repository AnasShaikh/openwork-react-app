import React from 'react';
import './LandingPage.css';
import LandingHeader from './components/LandingHeader/LandingHeader';
import LandingSidebar from './components/LandingSidebar/LandingSidebar';
import HeroSection from './components/HeroSection/HeroSection';
import ProfileSection from './components/ProfileSection/ProfileSection';
import LedgerSection from './components/LedgerSection/LedgerSection';
import PostJobSection from './components/PostJobSection/PostJobSection';
import DirectContractSection from './components/DirectContractSection/DirectContractSection';
import JobProgressSection from './components/JobProgressSection/JobProgressSection';
import DisputeSection from './components/DisputeSection/DisputeSection';
import EarnTokenSection from './components/EarnTokenSection/EarnTokenSection';
import GovernanceSection from './components/GovernanceSection/GovernanceSection';
import MultiChainSection from './components/MultiChainSection/MultiChainSection';
import ArchitectureSection from './components/ArchitectureSection/ArchitectureSection';
import RevolutionSection from './components/RevolutionSection/RevolutionSection';
import ContactSection from './components/ContactSection/ContactSection';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <LandingSidebar />
      <LandingHeader />
      <HeroSection />
      <ProfileSection />
      <LedgerSection />
      <PostJobSection />
      <DirectContractSection />
      <JobProgressSection />
      <DisputeSection />
      <EarnTokenSection />
      <GovernanceSection />
      <MultiChainSection />
      <ArchitectureSection />
      <RevolutionSection />
      <ContactSection />
    </div>
  );
};

export default LandingPage;
