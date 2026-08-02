import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./JobProgressSection.css";
import MobileSVG from "/assets/jobprogress/svg-mob-opt.svg";
import DesktopSVG from "/assets/jobprogress/svgimg.svg";
import ButtonIcon from "/assets/b16a6ff87b2913f8bdc303dda7816c024bd687cb.svg";

const JobProgressSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleViewJobs = () => {
    window.open("https://app.openwork.technology/browse-jobs", "_blank");
  };

  // Memoize the image source
  const imageSrc = useMemo(
    () => (isMobile ? MobileSVG : DesktopSVG),
    [isMobile],
  );

  return (
    <section id="lp-6-section" className="lp-section lp-6-section">
      <div className="lp-6-container">
        {/* Left Content */}
        <div className="lp-6-content">
          <div className="text-content">
            <h1 className="lp-6-heading">Job in Progress</h1>
            <p className="lp-6-description">
              Work gets done in milestones. Submit deliverables, leave reviews,
              and manage everything transparently in real-time.
            </p>
          </div>
          <button
            className={
              isMobile
                ? "lp-blue-button-1 section-action-button"
                : "lp-blue-button section-action-button"
            }
            onClick={handleViewJobs}
          >
            View Jobs
            <img src={ButtonIcon} alt="" className="lp-button-icon" />
          </button>
        </div>

        {/* Right Content - Job Details Card */}
        <div
          className={
            isMobile
              ? "lp-6-job-card-container-mobile"
              : "lp-6-job-card-container"
          }
        >
          <img
            src={imageSrc}
            alt="Job Details"
            className={
              isMobile ? "lp-6-job-card-image-mobile" : "lp-6-job-card-image"
            }
          />
        </div>
      </div>
    </section>
  );
};

export default JobProgressSection;
