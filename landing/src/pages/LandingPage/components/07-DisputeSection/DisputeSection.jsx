import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DisputeSection.css";
import OuterCircleSVG from "/assets/outer-circle-dispute-opt.svg";
import CoreCircleSVG from "/assets/lp7-core-circle.svg";
import AthenaSVG from "/assets/Athena-opt.svg";
import JobTextSVG from "/assets/job-text.svg";
import ArrowIcon from "/assets/lp7-arrow-icon.svg";

const DisputeSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload the SVG in background without blocking render (for desktop shimmer effect)
  useEffect(() => {
    if (!isMobile) {
      const img = new Image();
      img.src = OuterCircleSVG;
      img.onload = () => setImageLoaded(true);
      return () => {
        img.onload = null;
      };
    }
  }, [isMobile]);

  return (
    <section id="lp-7-section" className="lp-section lp-7-section">
      <div className="lp-7-container">
        <div className="lp-7-content">
          <div className="text-content">
            <h1 className="lp-7-heading">
              Dispute Resolution with Skill Oracles
            </h1>
            <p className="lp-7-description">
              Disagreements? Let verified experts in the field decide.
              Skill-based oracles resolve disputes through decentralized
              token-based voting.
            </p>
          </div>
          <button
            className={
              isMobile
                ? "lp-blue-button-1 section-action-button"
                : "lp-blue-button section-action-button"
            }
            onClick={() =>
              window.open(
                "https://app.openwork.technology/skill-oracle-disputes",
                "_blank",
              )
            }
          >
            See Disputes
            <img src={ArrowIcon} alt="" className="lp-button-icon" />
          </button>
        </div>

        <div className="lp-7-circle-container">
          <div className="lp-7-oracle-circle-group">
            {/* Desktop: shimmer loading technique */}
            {!isMobile ? (
              <div className="lp-7-ellipse-shimmer-wrapper">
                <div
                  className={`lp-7-shimmer-placeholder ${imageLoaded ? "hidden" : ""}`}
                />
                {imageLoaded && (
                  <img
                    src={OuterCircleSVG}
                    alt=""
                    className="lp-7-ellipse-bg loaded"
                  />
                )}
              </div>
            ) : (
              /* Mobile: direct image load */
              <img
                src={OuterCircleSVG}
                alt=""
                className="lp-7-ellipse-bg"
                loading="lazy"
              />
            )}

            <div className="lp-7-core-circle">
              <img
                src={CoreCircleSVG}
                alt=""
                className="lp-7-core-bg"
                loading="lazy"
              />
            </div>

            <div className="lp-7-center-athena">
              <div className="lp-7-athena-container">
                <img
                  src={AthenaSVG}
                  alt="Athena"
                  className="lp-7-athena-image"
                  loading="lazy"
                />
              </div>
              <img src={JobTextSVG} alt="" className="lp-7-job-text" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DisputeSection;
