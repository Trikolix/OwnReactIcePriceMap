import styled from 'styled-components';
import { useState, useRef, useEffect, useMemo } from 'react';

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

  @media (max-width: 768px) {
    font-size: 0.9rem;
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

export default function DropdownSelect({ options, onChange, value }) {
  const [open, setOpen] = useState(false);
  const dropDownRef = useRef(null);
  const normalizedOptions = useMemo(
    () => options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt)),
    [options]
  );
  const [internalValue, setInternalValue] = useState(normalizedOptions[0]?.value);
  useEffect(() => {
    if (value === undefined && normalizedOptions.length > 0) {
      if (internalValue === undefined || !normalizedOptions.some((opt) => opt.value === internalValue)) {
        setInternalValue(normalizedOptions[0].value);
      }
    }
  }, [normalizedOptions, value, internalValue]);
  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption =
    normalizedOptions.find((opt) => opt.value === selectedValue) ?? normalizedOptions[0] ?? { value: '', label: '' };

  const toggleDropdown = () => setOpen(!open);

  const handleSelect = (option) => {
    if (!option) {
      return;
    }
    if (value === undefined) {
      setInternalValue(option.value);
    }
    setOpen(false);
    onChange?.(option.value);
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
        {selectedOption?.label ?? ''}
        <Arrow>{open ? '▲' : '▼'}</Arrow>
      </DropdownButton>
      {open && (
        <DropdownList>
          {normalizedOptions.map((opt) => (
            <DropdownItem key={opt.value} onClick={() => handleSelect(opt)}>
              {opt.label}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </DropdownWrapper>
  );
}
