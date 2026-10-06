import styled from 'styled-components';
import { SlidersHorizontal } from 'lucide-react';
import DropdownSelect from './DropdownSelect';

export default function MapToolbar({ options, value, onChange, activeFilterCount, onOpenFilters }) {
  return (
    <Toolbar aria-label="Kartensteuerung">
      <Content>
        <DropdownSelect options={options} value={value} onChange={onChange} />
        <FilterButton type="button" onClick={onOpenFilters}
          aria-label={activeFilterCount > 0 ? `Filter, ${activeFilterCount} aktiv` : 'Filter'}>
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>Filter</span>
          {activeFilterCount > 0 && <FilterBadge aria-hidden="true">{activeFilterCount}</FilterBadge>}
        </FilterButton>
      </Content>
    </Toolbar>
  );
}

const Toolbar = styled.div`
  flex: 0 0 auto;
  background: #fff8ea;
  border-bottom: 1px solid #e6ddc9;
  color: #2f2100;
  min-width: 0;
`;
const Content = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1440px;
  min-width: 0;
  min-height: 52px;
  margin: 0 auto;
  padding: 4px max(12px, env(safe-area-inset-right)) 4px max(12px, env(safe-area-inset-left));
  box-sizing: border-box;
  @media (min-width: 768px) { padding-left: max(24px, env(safe-area-inset-left)); padding-right: max(24px, env(safe-area-inset-right)); }
`;
const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e6ddc9;
  border-radius: 10px;
  background: #fffdf7;
  color: inherit;
  font: inherit;
  font-size: 16px;
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
