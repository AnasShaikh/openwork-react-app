import React from "react";
import { Link } from "react-router-dom";

const MenuItem = ({
  to,
  id,
  buttonsVisible,
  buttonFlex,
  onMouseEnter,
  onMouseLeave,
  imgSrc,
  iconSrc,
  text
}) => (
  <Link
    to={to}
    id={id}
    className={`buttonContainer-home ${buttonsVisible ? "visible-home" : ""}`}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{ display: (buttonFlex || buttonsVisible) ? "flex" : undefined }}
  >
    <img src={imgSrc} alt="" className="buttonImage-home" />
    <img src={iconSrc} alt="" className="buttonIcon-home" />
    <span className="buttonText-home2">{text}</span>
  </Link>
);

export default MenuItem;
