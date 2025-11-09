import React from 'react';
import Button from '../../../../components/Button/Button';
import './HeroSection.css';

const HeroSection = () => {
  const handleLearnMore = () => {
    document.getElementById('lp-2-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const handleSetProfile = () => {
    document.getElementById('lp-2-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <section className="lp-section lp-1-section">
      <main className="landing-main">
        {/* Background Circle Group */}
        <div className="circle-group">
          {/* Radiant Glow Background */}
          <div className="radiant-glow-container">
            <img 
              src="/assets/e497ce42e79911156d2ac01b9b492722d31c5347.svg" 
              alt="" 
              className="glow-layer-1"
            />
            <img 
              src="/assets/7dd35a3b5143b478d7e0d882fc32060b2307086c.svg" 
              alt="" 
              className="glow-layer-2"
            />
          </div>
          
          {/* Main Circle */}
          <img 
            src="/assets/f0a5bddf438bec766e653cd0886722bed6ea4ee3.svg" 
            alt="" 
            className="main-circle-bg"
          />
        </div>

        {/* Floating Icon Buttons */}
        <div className="floating-icons">
          <Button 
            icon="/assets/62526e6f62a12cd8f3ecb86db19a495650068ad0.svg"
            buttonCss="icon-btn icon-discoverable"
            label="Discoverable"
          />
          <Button 
            icon="/assets/48d7e8cd65b4036c787ad29a2bdce07c13f29021.svg"
            buttonCss="icon-btn icon-direct-contract"
            label="Direct Contract"
          />
          <Button 
            icon="/assets/7fbdaad122c8922623aaea9b99c9cdd6cc503c6f.svg"
            buttonCss="icon-btn icon-job-progress"
            label="Job In Progress"
          />
          <Button 
            icon="/assets/5993be528342167da5598a847635eb201549dae4.svg"
            buttonCss="icon-btn icon-post-job"
            label="Post Job"
          />
          <Button 
            icon="/assets/0db7d9f3333eba0f15f08e07625cd29728a834ec.svg"
            buttonCss="icon-btn icon-raise-dispute"
            label="Raise Dispute"
          />
          <Button 
            icon="/assets/141af504612ac4760b6ff60cc6346fee9cea46cc.svg"
            buttonCss="icon-btn icon-dao"
            label="DAO"
          />
          <Button 
            icon="/assets/3d388d45b23ed4826566c6c199aff49f93e7acec.svg"
            buttonCss="icon-btn icon-set-profile"
            label="Set Profile"
            onClick={handleSetProfile}
          />
        </div>

        {/* Center Content */}
        <div className="center-content">
          <div className="text-content">
            <h1 className="main-heading">The future of work is decentralised.</h1>
            <p className="main-description">
              OpenWork is a decentralised work protocol, allowing people to work 
              directly with each other using blockchain technology, with decentralised governance.
            </p>
          </div>
          
          <button 
            className="lp-blue-button"
            onClick={handleLearnMore}
          >
            Learn More
            <img src="/assets/b16a6ff87b2913f8bdc303dda7816c024bd687cb.svg" alt="" className="lp-button-icon" />
          </button>
        </div>
      </main>
    </section>
  );
};

export default HeroSection;
