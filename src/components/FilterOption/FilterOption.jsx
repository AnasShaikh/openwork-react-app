import React, { useState } from 'react';
import './FilterOption.css';
import ComboBox from '../ComboBox/ComboBox';

const FilterOption = ({ label, options, customCSS }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(label);

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  }

  return (
    <div className="dropdown">
      <button className={`dropdown-toggle ${customCSS}`} onClick={toggleDropdown}>
        {label}
        <img src={selectedOption == 'Filter'?'/filter.svg':'/array.svg'} alt="" />
      </button>
      {isOpen && (
        <ul className="filter-dropdown-menu">
          {options.map((option, index) => (
            <>
              <li
                key={index}
                className="dropdown-item"
              >
                <ComboBox label={option} />
              </li>
              {index !=options.length-1 &&<span className='dropdown-line'/>}
            </>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilterOption;
