import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';

const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  background-color: #ffb522;
  color: black;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  min-width: 120px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  &:hover {
    background-color: #ffcb4c;
  }
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 110%;
  left: 0;
  width: 100%;
  background-color: #fff8e1;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
  z-index: 1001;
`;

const DropdownItem = styled.li`
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #ffe091;
  }
`;

const Arrow = styled.span`
  font-size: 0.9rem;
`;

export default function DropdownSelect({ options, onChange }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const dropDownRef = useRef(null);

  const toggleDropdown = () => setOpen(!open);

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
    onChange(option);
  };

  useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
          setOpen(false);
        }
      };
  
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open]);

  return (
    <DropdownWrapper ref={dropDownRef}>
      <DropdownButton onClick={toggleDropdown}>
        {selected}
        <Arrow>{open ? '▲' : '▼'}</Arrow>
      </DropdownButton>
      {open && (
        <DropdownList>
          {options.map((opt) => (
            <DropdownItem key={opt} onClick={() => handleSelect(opt)}>
              {opt}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </DropdownWrapper>
  );
}
