import React from 'react';
import './VoteBar.css'; // Add custom styling here

const VoteBar = ({ totalVotes, votesInFavor, votesAgainst, threshold }) => {
  const inFavorPercentage = (votesInFavor / totalVotes) * 100;
  const inAgainstPercentage = (votesAgainst / totalVotes) * 100;
  const thresholdPosition = threshold; // Assuming it's a percentage

  return (
    <div className="vote-bar">
      <div className='min-threshold' style={{ left: `calc(${thresholdPosition}% - 63px)` }}>
        <span>MIN. THRESHOLD {threshold}%</span>
      </div>

      <div className="progress-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-in-favor"
            style={{ width: `${inFavorPercentage}%` }}
          />
          <div
            className="progress-in-against"
            style={{ width: `${inAgainstPercentage}%` }}
          />
        </div>

        {/* Threshold Marker */}
        <div
          className="threshold-marker"
          style={{ left: `${thresholdPosition}%` }}
        >
        </div>
        {inAgainstPercentage == 0 && <span className='dot red-dot'/>}
      </div>

      {/* Labels */}
      <div className="labels">
        <span>{totalVotes+"M"} TOTAL VOTES</span>
        <span className="in-favor">
          <span className="dot green-dot" /> {votesInFavor+"M"} IN FAVOUR
        </span>
        <span>
          <span className="dot red-dot" /> {votesAgainst+"M"} AGAINST
        </span>
      </div>
    </div>
  );
};

export default VoteBar;
