import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ProfilePortfolio.css";

export default function ProfilePortfolio() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("All Skills");

  const skillOptions = [
    "All Skills",
    "UX Design",
    "Web Development",
    "Shopify"
  ];

  const handleCopyToClipboard = (address) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        alert("Address copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  function formatWalletAddress(address) {
    if (!address) return "";
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}....${end}`;
  }

  // Sample portfolio items - replace with real data
  const portfolioItems = [
    {
      id: 1,
      title: "Branding work for Cordial",
      image: "/assets/portfolio-image.png",
      skills: ["UX Design", "+2 More"],
      hasPackage: true,
    },
    {
      id: 2,
      title: "Branding work for Cordial",
      image: "/assets/portfolio-image.png",
      skills: ["UX Design", "+2 More"],
      hasPackage: true,
    },
    {
      id: 3,
      title: "Branding work for Cordial",
      image: null, // Empty card with document icon
      skills: ["UX Design", "+2 More"],
      hasPackage: true,
    },
    {
      id: 4,
      title: "Branding work for Cordial",
      image: "/assets/portfolio-image.png",
      skills: ["UX Design", "+2 More"],
      hasPackage: true,
    },
  ];

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="newTitle">
        <div className="titleTop">
          <Link className="goBack" to={`/profile`}>
            <img className="goBackImage" src="/back.svg" alt="Back Button" />
          </Link>  
          <div className="titleText">molliehall2504</div>
        </div>
        <div className="titleBottom">
          <p>Contract ID: {formatWalletAddress("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}</p>
          <img 
            src="/copy.svg" 
            className="copyImage" 
            onClick={() => handleCopyToClipboard("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}
          />
        </div>
      </div>
      
      <div className="portfolio-page-wrapper">
        <div className="portfolio-content">

        <div className="portfolio-header-bar">
          <h2 className="portfolio-title">Portfolio</h2>
          
          <div className="filter-dropdown">
            <button 
              className="filter-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{selectedSkill}</span>
              <img src="/array.svg" alt="Filter" />
            </button>
            {isDropdownOpen && (
              <ul className="filter-dropdown-menu">
                {skillOptions.map((skill, index) => (
                  <React.Fragment key={index}>
                    <li
                      className="filter-dropdown-item"
                      onClick={() => {
                        setSelectedSkill(skill);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {skill}
                    </li>
                    {index !== skillOptions.length - 1 && (
                      <span className="filter-dropdown-line" />
                    )}
                  </React.Fragment>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="portfolio-grid">
          {portfolioItems.map((item) => (
            <div key={item.id} className="portfolio-card">
              <div className="portfolio-card-image">
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <div className="portfolio-card-image-placeholder">
                    <img src="/assets/document-icon.svg" alt="No image" />
                  </div>
                )}
              </div>
              
              <div className="portfolio-card-content">
                <div className="portfolio-card-info">
                  <h3 className="portfolio-card-title">{item.title}</h3>
                  
                  <div className="portfolio-card-badges">
                    {item.skills.map((skill, index) => (
                      <span key={index} className="portfolio-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {item.hasPackage && (
                  <button className="portfolio-package-link">
                    <span>View linked Package</span>
                    <img src="/assets/arrow-up-right.svg" alt="Arrow" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="portfolio-pagination">
          <button className="portfolio-pagination-button prev">
            <img src="/back.svg" alt="Previous" />
          </button>
          <span className="portfolio-page-info">Page 1 of 10</span>
          <button className="portfolio-pagination-button next">
            <img src="/front.svg" alt="Next" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
