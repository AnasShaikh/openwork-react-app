import React from 'react';
import './Button.css';

const Button = ({ label, onClick, icon, buttonCss = '', style }) => {
  return (
    <button className={`custom-button ${buttonCss}`} onClick={onClick} style={style}>
      {icon && <img src={icon} alt="" />}
      {label && <span>{label}</span>}
    </button>
  );
};

export default Button;
