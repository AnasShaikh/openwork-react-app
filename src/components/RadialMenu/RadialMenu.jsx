import React, { useState } from 'react';
import './RadialMenu.css';

const RadialMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('radial-menu-active');
    } else {
      document.body.classList.remove('radial-menu-active');
    }
    return () => document.body.classList.remove('radial-menu-active');
  }, [isOpen]);

  const menuItems = [
    { id: 'home', label: 'Home', icon: '/menu-home-icon.svg', position: 'center-top', route: '/' },
    { id: 'profile', label: 'My Profile', icon: '/menu-profile-icon.svg', position: 'left-top', route: '/profile' },
    { id: 'jobs', label: 'Jobs', icon: '/menu-jobs-icon.svg', position: 'left-middle', route: '/browse-jobs' },
    { id: 'about', label: 'About', icon: '/menu-work-icon.svg', position: 'right-top', route: '/about' },
    { id: 'governance', label: 'Governance', icon: '/menu-governance-icon.svg', position: 'right-middle', route: '/governance' },
  ];

  const handleMenuClick = (route) => {
    setIsOpen(false);
    setTimeout(() => {
      window.location.pathname = route;
    }, 300);
  };

  return (
    <>
      <div 
        className={`radial-menu-wrapper ${isOpen ? 'menu-open' : ''}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Hover trigger area - invisible but triggers menu */}
        <div className="menu-trigger-area" />

        {/* Show menu only when hovering */}
        {isOpen && (
          <>
            {/* Large Background Circle from Figma */}
            <div className="menu-background-circle">
              <img src="/menu-circle.svg" alt="" />
            </div>

            {/* Rotating Radiant Glow - Commented out for now */}
            {/* <img src="/RadiantGlow.png" alt="Radiant Glow" className="radiant-glow-menu" /> */}

            {/* Core Circle with MENU text - Same as home page */}
            <div className="core-menu">
              <img src="/core.svg" alt="Core" className="core-image-menu" />
              <img src="/core-hovered2.svg" alt="Core Hovered" className="core-hovered-menu" />
              <span className="menu-text">MENU</span>
            </div>

            {/* Radial Menu Overlay */}
            <div className="radial-menu-overlay" />
            
            <div className="radial-menu-items">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`radial-menu-item ${item.position}`}
                  onClick={() => handleMenuClick(item.route)}
                >
                  <div className="menu-item-icon">
                    <img src={item.icon} alt={item.label} />
                  </div>
                  <div className="menu-item-label">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="hover-instruction">Hover to navigate</div>
          </>
        )}
      </div>
    </>
  );
};

export default RadialMenu;
