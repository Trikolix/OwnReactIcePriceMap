import { useEffect, useMemo, useState } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import styled, { css } from 'styled-components';

export default function DropdownSelect({ options, onChange, value, embedded = false }) {
  const normalizedOptions = useMemo(
    () => options.map(option => typeof option === 'string' ? { value: option, label: option } : option),
    [options]
  );
  const [internalValue, setInternalValue] = useState(normalizedOptions[0]?.value);
  useEffect(() => {
    if (value === undefined && !normalizedOptions.some(option => option.value === internalValue)) {
      setInternalValue(normalizedOptions[0]?.value);
    }
  }, [normalizedOptions, value, internalValue]);
  const selectedValue = value === undefined ? internalValue : value;
  const selectedOption = normalizedOptions.find(option => option.value === selectedValue) ?? normalizedOptions[0];

  return (
    <Wrapper $embedded={embedded}>
      <Listbox value={selectedOption?.value ?? ''} onChange={nextValue => {
        if (value === undefined) setInternalValue(nextValue);
        onChange?.(nextValue);
      }}>
        <SelectButton $embedded={embedded} aria-label={`Kartenanzeige: ${selectedOption?.label ?? ''}`} title={selectedOption?.label}>
          {!embedded && <Prefix>Anzeige:</Prefix>}
          <SelectedText>{selectedOption?.label ?? ''}</SelectedText>
          <ChevronDown size={18} aria-hidden="true" />
        </SelectButton>
        <Options anchor="bottom start" portal aria-label="Kartenanzeige">
          {normalizedOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {({ selected }) => <><span>{option.label}</span>{selected && <Check size={18} aria-hidden="true" />}</>}
            </Option>
          ))}
        </Options>
      </Listbox>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-width: 0;
  width: 300px;
  max-width: 100%;
  ${props => props.$embedded && css`width: 180px; flex: 0 1 180px;`}
  @media (max-width: 767px) { flex: 1; width: auto; }
`;
const SelectButton = styled(ListboxButton)`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e6ddc9;
  border-radius: 10px;
  background: #fffdf7;
  color: #2f2100;
  font: inherit;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  svg { flex-shrink: 0; }
  &:hover { background: #fff4d4; }
  &:focus-visible { outline: 2px solid #633e14; outline-offset: 2px; }
  ${props => props.$embedded && css`
    border: none;
    background: transparent;
    font-size: 14px;
  `}
`;
const Prefix = styled.span`color: #77664a; flex-shrink: 0;`;
const SelectedText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
`;
const Options = styled(ListboxOptions)`
  --anchor-gap: 6px;
  --anchor-padding: 12px;
  width: max(var(--button-width), 250px);
  max-width: calc(100vw - 24px);
  max-height: min(360px, 70dvh);
  padding: 6px;
  box-sizing: border-box;
  border: 1px solid #e6ddc9;
  border-radius: 12px;
  background: #fffdf7;
  color: #2f2100;
  box-shadow: 0 12px 32px #2f210026;
  overflow-y: auto;
  z-index: 1800;
  &:focus { outline: 2px solid #633e14; }
`;
const Option = styled(ListboxOption)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 8px 10px;
  box-sizing: border-box;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  svg { flex-shrink: 0; }
  &[data-focus] { background: #fff0c6; }
  &[data-selected] { font-weight: 700; }
`;
