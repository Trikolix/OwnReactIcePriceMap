import styled from 'styled-components';
import { SlidersHorizontal } from 'lucide-react';
import DropdownSelect from './DropdownSelect';

export default function MapToolbar({ options, value, onChange, activeFilterCount, onOpenFilters, filtersOpen = false }) {
  return (
    <Toolbar aria-label="Kartensteuerung">
      <DropdownSelect options={options} value={value} onChange={onChange} embedded />
      <Divider aria-hidden="true" />
      <FilterButton type="button" onClick={onOpenFilters}
        aria-haspopup="dialog" aria-expanded={filtersOpen}
        aria-label={activeFilterCount > 0 ? `Filter, ${activeFilterCount} aktiv` : 'Filter'}>
        <SlidersHorizontal size={18} aria-hidden="true" />
        <span>Filter</span>
        {activeFilterCount > 0 && <FilterBadge aria-hidden="true">{activeFilterCount}</FilterBadge>}
      </FilterButton>
    </Toolbar>
  );
}

const Toolbar = styled.div`
  position: absolute;
  top: 12px;
  left: max(12px, env(safe-area-inset-left));
  z-index: 1050;
  display: flex;
  align-items: center;
  width: max-content;
  max-width: calc(100% - max(12px, env(safe-area-inset-left)) - max(56px, env(safe-area-inset-right)));
  min-width: 0;
  padding: 3px;
  border: 1px solid #e6ddc9;
  border-radius: 14px;
  background: #ffffff;
  color: #2f2100;
  box-shadow: 0 4px 16px #2f21001f, 0 1px 3px #2f21000d;
  box-sizing: border-box;
  @media (min-width: 768px) {
    top: 16px;
    left: max(16px, env(safe-area-inset-left));
    max-width: calc(100% - max(16px, env(safe-area-inset-left)) - max(56px, env(safe-area-inset-right)));
  }
`;
const Divider = styled.span`width: 1px; height: 24px; margin: 0 3px; flex-shrink: 0; background: #e6ddc9;`;
const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #fff0c6; }
  &:focus-visible { outline: 2px solid #633e14; outline-offset: 2px; }
`;
const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  padding: 0 4px;
  background: #ffb522;
  color: #2f2100;
  font-size: 12px;
  box-sizing: border-box;
`;
