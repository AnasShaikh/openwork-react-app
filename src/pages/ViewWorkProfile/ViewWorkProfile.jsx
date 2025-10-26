import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ViewWorkProfile.css";

export default function ViewWorkProfile() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

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

  // Sample work data - replace with real data
  const workData = {
    title: "Webflow Development for QIGO",
    userName: "molliehall2504",
    packageType: "Webflow Package",
    skills: ["UX Design", "+2 More"],
    images: [
      "/assets/portfolio-image.png",
      "/assets/portfolio-image.png",
      "/assets/portfolio-image.png",
      "/assets/portfolio-image.png",
      "/assets/portfolio-image.png",
    ],
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, ea...`,
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="newTitle">
        <div className="titleTop">
          <button className="goBack" onClick={handleBack}>
            <img className="goBackImage" src="/back.svg" alt="Back Button" />
          </button>
          <div className="titleText">{workData.title}</div>
        </div>
        <div className="titleBottom">
          <div className="user-info">
            <img src="/avatar.png" alt="User" className="user-avatar" />
            <div className="user-details">
              <span className="user-name">{workData.userName}</span>
              <span className="user-separator">•</span>
              <span className="user-package">{workData.packageType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="viewwork-page-wrapper">
        <div className="viewwork-content">
          {/* Header with badges */}
          <div className="viewwork-header-bar">
            <div className="viewwork-badges">
              {workData.skills.map((skill, index) => (
                <span key={index} className="viewwork-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Main Image Display */}
          <div className="viewwork-main-image">
            <img
              src={workData.images[selectedImage]}
              alt="Work preview"
              className="main-image"
            />
          </div>

          {/* Image Gallery Thumbnails */}
          <div className="viewwork-image-gallery">
            {workData.images.map((image, index) => (
              <div
                key={index}
                className={`gallery-thumbnail ${selectedImage === index ? "active" : ""}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="viewwork-description">
            <p>{workData.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
