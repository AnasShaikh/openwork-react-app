import React, { useState, useEffect } from 'react';
import './LandingSidebar.css';

const LandingSidebar = () => {
  const [activeSection, setActiveSection] = useState('discoverable');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const sidebarItems = [
    { id: 1, icon: '/assets/sidebar-icon-1.svg', label: 'Discoverable', section: 'discoverable' },
    { id: 2, icon: '/assets/sidebar-icon-2.svg', label: 'Job/Contract', section: 'job-contract' },
    { id: 3, icon: '/assets/sidebar-icon-3.svg', label: 'Direct Contract', section: 'direct-contract' },
    { id: 4, icon: '/assets/sidebar-icon-4.svg', label: 'Job In Progress', section: 'job-progress' },
    { id: 5, icon: '/assets/sidebar-icon-5.svg', label: 'Raise Dispute', section: 'raise-dispute' },
    { id: 6, icon: '/assets/sidebar-icon-6.svg', label: 'Earn & Govern', section: 'earn-govern' },
    { id: 7, icon: '/assets/sidebar-icon-7.svg', label: 'DAO', section: 'dao' },
    { id: 8, icon: '/assets/sidebar-icon-8.svg', label: 'Local Network', section: 'local-network' },
    { id: 9, icon: '/assets/sidebar-icon-9.svg', label: 'Openwork Arch', section: 'openwork-arch' },
    { id: 10, icon: '/assets/sidebar-icon-10.svg', label: 'Work Revolution', section: 'work-revolution' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      // Check if profile section (discoverable) is reached
      const profileSection = document.getElementById('discoverable');
      if (profileSection) {
        const profileTop = profileSection.offsetTop;
        setSidebarVisible(window.scrollY >= profileTop - 200);
      }

      // Find which section is currently in view
      for (let i = sidebarItems.length - 1; i >= 0; i--) {
        const section = document.getElementById(sidebarItems[i].section);
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(sidebarItems[i].section);
            break;
          }
        }
      }
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get the index of the active section
  const activeIndex = sidebarItems.findIndex(item => item.section === activeSection);

  return (
    <aside className={`landing-sidebar ${sidebarVisible ? 'visible' : ''}`}>
      {/* Vertical gradient line */}
      <div className="sidebar-line"></div>

      {/* Navigation icons */}
      <nav className="sidebar-nav">
        {sidebarItems.map((item, index) => {
          const isActive = activeSection === item.section;
          
          // Calculate position relative to active item (active should be at center/middle)
          let opacity = 1;
          let translateY = 0;
          let scale = 1;
          
          if (activeIndex !== -1) {
            const distanceFromActive = index - activeIndex;
            
            if (distanceFromActive < 0) {
              // Icons before active section - move up and fade out
              translateY = distanceFromActive * 64;
              opacity = Math.max(0, 1 + (distanceFromActive * 0.3));
              scale = Math.max(0.5, 1 + (distanceFromActive * 0.15));
            } else if (distanceFromActive === 0) {
              // Active icon - stays in center
              scale = 1.1;
            } else {
              // Icons after active - positioned below
              translateY = distanceFromActive * 64;
            }
          }
          
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleScrollToSection(item.section)}
              aria-label={item.label}
              title={item.label}
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity: opacity,
                zIndex: isActive ? 10 : 1,
                pointerEvents: opacity < 0.2 ? 'none' : 'auto',
              }}
            >
              <img src={item.icon} alt={item.label} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default LandingSidebar;
