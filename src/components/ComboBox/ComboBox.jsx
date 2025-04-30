import React, { useState } from "react";
import './ComboBox.css';

const ComboBox = ({ label = "Member Name" }) => {
  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => setIsChecked(!isChecked);

  return (
    <div
      className="combobox"
      onClick={toggleCheckbox}
    >
      {/* Custom Checkbox */}
      <div
      className="check"
        style={{
          backgroundColor: isChecked ? "#0047FF" : "#FFFFFF",
          border: isChecked ? "1px solid #0047FF" : "1px solid #CCCCCC",
        }}
      >
        {isChecked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20"
            width="20"
            fill="#FFFFFF"
            viewBox="0 0 24 24"
          >
            <path d="M20.285 4.625l-11.66 12.305-4.911-5.183-1.523 1.496 6.434 6.804 13.183-13.972z" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span className="check-label">
        {label}
      </span>
    </div>
  );
};

export default ComboBox;
