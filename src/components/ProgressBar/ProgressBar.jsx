import React from "react";
import "./ProgressBar.css"; // Assume you style it here

const ProgressBar = ({ percent, width }) => {
  let backgroundColor;

  if (percent < 50) {
    backgroundColor = "#B42318";
  } else if (percent < 90) {
    backgroundColor = "#F8C45D";
  } else {
    backgroundColor = "#17B26A";
  }

  return (
    <div className="progress-bar-container" style={{width:width}}>
        <div className="progress-bar-percent">
        <div
            className="progress-bar"
            style={{
            width: `${percent}%`,
            backgroundColor: backgroundColor,
            height: "8px",
            borderRadius: "4px",
            transition: "width 0.3s ease, background-color 0.3s ease",
            }}
        ></div>
        </div>
        <span className="progress-label">
            {percent}%
        </span>
    </div>
  );
};

export default ProgressBar;
