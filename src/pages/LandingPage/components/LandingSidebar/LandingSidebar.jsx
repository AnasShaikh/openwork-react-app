import React from 'react';
import './LandingSidebar.css';

const LandingSidebar = () => {
  const sidebarIcons = [
    { id: 1, src: '/assets/sidebar-icon-1.svg', alt: 'Discoverable' },
    { id: 2, src: '/assets/sidebar-icon-2.svg', alt: 'Job/Contract' },
    { id: 3, src: '/assets/sidebar-icon-3.svg', alt: 'Direct Contract' },
    { id: 4, src: '/assets/sidebar-icon-4.svg', alt: 'Job In Progress' },
    { id: 5, src: '/assets/sidebar-icon-5.svg', alt: 'Raise Dispute' },
    { id: 6, src: '/assets/sidebar-icon-6.svg', alt: 'Earn & Govern' },
    { id: 7, src: '/assets/sidebar-icon-7.svg', alt: 'DAO' },
    { id: 8, src: '/assets/sidebar-icon-8.svg', alt: 'Local Network' },
    { id: 9, src: '/assets/sidebar-icon-9.svg', alt: 'Openwork Arch' },
    { id: 10, src: '/assets/sidebar-icon-10.svg', alt: 'Work Revolution' },
  ];

  return (
    <aside className="landing-sidebar">
      {/* Top floating button */}
      <div className="sidebar-top-button">
        <img src="/assets/sidebar-top-icon.svg" alt="" />
      </div>

      {/* Vertical gradient line */}
      <div className="sidebar-line"></div>

      {/* Navigation icons */}
      <div className="sidebar-icons">
        {sidebarIcons.map((icon) => (
          <button key={icon.id} className="sidebar-icon-btn">
            <img src={icon.src} alt={icon.alt} />
          </button>
        ))}
      </div>
    </aside>
  );
};

export default LandingSidebar;
