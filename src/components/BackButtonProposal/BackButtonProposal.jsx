import React from "react";
import { Link } from "react-router-dom";
import "./BackButtonProposal.css";

const BackButtonProposal = ({ to = "/dao", title = "Back", imgSrc = "/button.svg", style }) => (
  <div className="form-navigationProposal" style={style}>
    <Link to={to} className="backButtonProposal">
      <img
        src={imgSrc}
        alt="Back"
        className="backIconProposal"
      />
    </Link>
    <div className="formTitleProposal">{title}</div>
    <Link to={to} className="backButtonProposal" style={{visibility: 'hidden'}}>
      <img
        src={imgSrc}
        alt="Back"
        className="backIconProposal"
      />
    </Link>
  </div>
);

export default BackButtonProposal;
