import { useState } from "react";
import "./ToggleSwitch.css";

const ToggleSwitch = ({ options, onChange }) => {
    const [activeIndex, setActiveIndex] = useState(2);
  
    const handleClick = (index) => {
      setActiveIndex(index);
      onChange && onChange(options[index]); // Falls eine externe Funktion genutzt wird
    };
  
    return (
        <div className="toggle-switch">
      {options.map((option, index) => (
        <button
          key={option}
          className={`toggle-button ${index === activeIndex ? "active" : ""} ${index === 0 ? "first" : ""} ${index === options.length - 1 ? "last" : ""}`}
          onClick={() => handleClick(index)}
        >
          {option}
        </button>
      ))}
    </div>
    );
  };

  export default ToggleSwitch;