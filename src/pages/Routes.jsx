import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import RouteCard from '../components/RouteCard';

const ROUTE_TYPES = ['Rennrad', 'MTB', 'Gravel', 'Wanderung', 'Sonstiges'];
const DIFFICULTIES = ['Leicht', 'Mittel', 'Schwer'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Älteste zuerst' },
  { value: 'length_desc', label: 'Längste Strecke' },
  { value: 'length_asc', label: 'Kürzeste Strecke' },
  { value: 'elevation_desc', label: 'Meiste Höhenmeter' },
  { value: 'elevation_asc', label: 'Wenigste Höhenmeter' },
  { value: 'shops_desc', label: 'Meiste Eisdielen' },
  { value: 'shops_asc', label: 'Wenigste Eisdielen' },
];
const PAGE_BG = `
  radial-gradient(circle at top right, rgba(255, 218, 140, 0.32), transparent 42%),
  linear-gradient(180deg, #fff9ef 0%, #fff4da 100%)
`;
const CARD_BG = 'rgba(255, 252, 243, 0.96)';
const PANEL_BG = 'rgba(255, 252, 243, 0.94)';
const BORDER = 'rgba(47, 33, 0, 0.08)';
const TEXT_MUTED = 'rgba(47, 33, 0, 0.68)';
const ACCENT = '#ffb522';
const ACCENT_DARK = '#8a5700';
const ACCENT_SOFT = 'rgba(255, 181, 34, 0.14)';

const RoutesPage = () => {
  const { userId } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    types: [],
    difficulties: [],
    minLength: '',
    maxLength: '',
    minElevation: '',
    maxElevation: '',
    minShops: '',
    maxShops: '',
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (userId) {
      params.set('nutzer_id', userId);
    }
    if (filters.search.trim()) {
      params.set('search', filters.search.trim());
    }
    if (filters.types.length > 0) {
      params.set('typ', filters.types.join(','));
    }
    if (filters.difficulties.length > 0) {
      params.set('schwierigkeit', filters.difficulties.join(','));
    }
    if (filters.minLength) {
      params.set('min_length', filters.minLength);
    }
    if (filters.maxLength) {
      params.set('max_length', filters.maxLength);
    }
    if (filters.minElevation) {
      params.set('min_elevation', filters.minElevation);
    }
    if (filters.maxElevation) {
      params.set('max_elevation', filters.maxElevation);
    }
    if (filters.minShops) {
      params.set('min_shops', filters.minShops);
    }
    if (filters.maxShops) {
      params.set('max_shops', filters.maxShops);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [filters, userId]);

  useEffect(() => {
    if (!apiUrl) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${apiUrl}/routen/listRoutes.php${queryString}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Routen konnten nicht geladen werden.');
        }
        return response.json();
      })
      .then((payload) => {
        if (payload.status === 'success' && Array.isArray(payload.data)) {
          setRoutes(payload.data);
        } else {
          throw new Error(payload.message || 'Unbekannte Antwort vom Server.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [apiUrl, queryString, refreshToken]);

  const toggleFilterValue = (field, value) => {
    setFilters((prev) => {
      const current = prev[field];
      const exists = current.includes(value);
      const nextValues = exists ? current.filter((entry) => entry !== value) : [...current, value];
      return { ...prev, [field]: nextValues };
    });
  };

  const handleInputChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      types: [],
      difficulties: [],
      minLength: '',
      maxLength: '',
      minElevation: '',
      maxElevation: '',
      minShops: '',
      maxShops: '',
    });
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((sum, value) => {
      if (Array.isArray(value)) {
        return sum + value.length;
      }
      return value !== '' ? sum + 1 : sum;
    }, 0);
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const handleRouteUpdated = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const sortedRoutes = useMemo(() => {
    const copy = [...routes];

    const getLength = (route) => {
      const num = Number(route.laenge_km);
      return Number.isNaN(num) ? null : num;
    };

    const getElevation = (route) => {
      const num = Number(route.hoehenmeter);
      return Number.isNaN(num) ? null : num;
    };

    const getShopCount = (route) => {
      if (route.eisdielen_count !== undefined && route.eisdielen_count !== null) {
        return Number(route.eisdielen_count) || 0;
      }
      return Array.isArray(route.eisdielen) ? route.eisdielen.length : 0;
    };

    const compareNumbers = (a, b, direction = 'desc') => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return direction === 'asc' ? a - b : b - a;
    };

    copy.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.erstellt_am) - new Date(b.erstellt_am);
        case 'length_desc':
          return compareNumbers(getLength(a), getLength(b), 'desc');
        case 'length_asc':
          return compareNumbers(getLength(a), getLength(b), 'asc');
        case 'elevation_desc':
          return compareNumbers(getElevation(a), getElevation(b), 'desc');
        case 'elevation_asc':
          return compareNumbers(getElevation(a), getElevation(b), 'asc');
        case 'shops_desc':
          return compareNumbers(getShopCount(a), getShopCount(b), 'desc');
        case 'shops_asc':
          return compareNumbers(getShopCount(a), getShopCount(b), 'asc');
        case 'newest':
        default:
          return new Date(b.erstellt_am) - new Date(a.erstellt_am);
      }
    });

    return copy;
  }, [routes, sortOption]);

  return (
    <PageWrapper>
      <Header />
      <Content>
        <TitleSection>
          <h1>Routen entdecken</h1>
          <p>Stöbere durch alle öffentlichen Routen und deine privaten Strecken. Verfeinere die Liste mit den Filtern und finde genau die Tour, die du heute fahren möchtest.</p>
        </TitleSection>

        <FiltersToggleBar>
          <ToggleFiltersButton
            type="button"
            onClick={() => setFiltersExpanded((prev) => !prev)}
            aria-expanded={filtersExpanded}
          >
            <span>Suche & Filter</span>
            <ChevronIcon $expanded={filtersExpanded} aria-hidden="true" />
          </ToggleFiltersButton>
          <ToggleBarMeta>
            {hasActiveFilters && (
              <ActiveFiltersBadge>
                {activeFilterCount} aktiv
              </ActiveFiltersBadge>
            )}
            {!filtersExpanded && (
              <CollapsedResetButton
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Zurücksetzen
              </CollapsedResetButton>
            )}
          </ToggleBarMeta>
        </FiltersToggleBar>

        {filtersExpanded && (
          <FiltersPanel>
            <FilterColumn>
              <FilterLabel htmlFor="routes-search">Suche</FilterLabel>
              <FilterInput
                id="routes-search"
                type="text"
                placeholder="Name oder Beschreibung"
                value={filters.search}
                onChange={handleInputChange('search')}
              />
            </FilterColumn>

            <FilterColumn>
              <FilterLabel>Routentyp</FilterLabel>
              <FilterChips>
                {ROUTE_TYPES.map((type) => (
                  <FilterChip
                    key={type}
                    type="button"
                    $active={filters.types.includes(type)}
                    onClick={() => toggleFilterValue('types', type)}
                  >
                    {type}
                  </FilterChip>
                ))}
              </FilterChips>
            </FilterColumn>

            <FilterColumn>
              <FilterLabel>Schwierigkeit</FilterLabel>
              <FilterChips>
                {DIFFICULTIES.map((level) => (
                  <FilterChip
                    key={level}
                    type="button"
                    $active={filters.difficulties.includes(level)}
                    onClick={() => toggleFilterValue('difficulties', level)}
                  >
                    {level}
                  </FilterChip>
                ))}
              </FilterChips>
            </FilterColumn>

            <FilterColumn>
              <FilterLabel>Länge (km)</FilterLabel>
              <RangeInputs>
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.minLength}
                  onChange={handleInputChange('minLength')}
                />
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.maxLength}
                  onChange={handleInputChange('maxLength')}
                />
              </RangeInputs>
            </FilterColumn>

            <FilterColumn>
              <FilterLabel>Höhenmeter</FilterLabel>
              <RangeInputs>
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.minElevation}
                  onChange={handleInputChange('minElevation')}
                />
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.maxElevation}
                  onChange={handleInputChange('maxElevation')}
                />
              </RangeInputs>
            </FilterColumn>

            <FilterColumn>
              <FilterLabel>Anzahl Eisdielen</FilterLabel>
              <RangeInputs>
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.minShops}
                  onChange={handleInputChange('minShops')}
                />
                <FilterInput
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.maxShops}
                  onChange={handleInputChange('maxShops')}
                />
              </RangeInputs>
            </FilterColumn>

            <ActionsColumn>
              <ResetButton type="button" onClick={resetFilters} disabled={!hasActiveFilters}>
                Filter zurücksetzen
              </ResetButton>
            </ActionsColumn>
          </FiltersPanel>
        )}

        <ResultsBar>
          <ResultsInfo>
            {loading && <span>Routen werden geladen …</span>}
            {!loading && error && <ErrorText>{error}</ErrorText>}
            {!loading && !error && (
              <span>{routes.length} Route{routes.length === 1 ? '' : 'n'} gefunden</span>
            )}
          </ResultsInfo>
          <SortControl>
            <SortLabel htmlFor="routes-sort">Sortierung</SortLabel>
            <SortSelect
              id="routes-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SortSelect>
          </SortControl>
        </ResultsBar>

        <RoutesGrid>
          {!loading && !error && routes.length === 0 && (
            <EmptyState>
              <strong>Keine Routen gefunden</strong>
              <p>Lockere die Filter oder starte eine neue Suche.</p>
            </EmptyState>
          )}

          {sortedRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onSuccess={handleRouteUpdated}
              showComments={false}
            />
          ))}
        </RoutesGrid>
      </Content>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${PAGE_BG};
`;

const Content = styled.main`
  width: min(96%, 1200px);
  margin: 0 auto;
  padding: 1rem;
`;

const TitleSection = styled.section`
  margin-bottom: 1rem;
  background: ${CARD_BG};
  border: 1px solid ${BORDER};
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 1rem 0.9rem;

  h1 {
    margin: 0 0 0.35rem;
    font-size: clamp(1.35rem, 2vw, 1.9rem);
    color: #2f2100;
    text-align: center;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: ${TEXT_MUTED};
    text-align: center;
    font-size: 0.95rem;
  }
`;

const FiltersToggleBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.7rem;
  border-radius: 14px;
  border: 1px solid ${BORDER};
  background: rgba(255, 252, 243, 0.9);
  box-shadow: 0 6px 16px rgba(28, 20, 0, 0.04);
`;

const ToggleFiltersButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.72);
  font-weight: 700;
  color: #2f2100;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    background: rgba(255, 181, 34, 0.1);
  }

  &:focus-visible {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(255, 181, 34, 0.25);
  }
`;

const ChevronIcon = styled.span`
  border-style: solid;
  border-width: 0 2px 2px 0;
  border-color: currentColor;
  display: inline-block;
  padding: 4px;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(-135deg)' : 'rotate(45deg)')};
  transition: transform 0.2s ease;
`;

const ToggleBarMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActiveFiltersBadge = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  background: ${ACCENT_SOFT};
  color: ${ACCENT_DARK};
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid rgba(255, 181, 34, 0.3);
`;

const CollapsedResetButton = styled.button`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.08)' : 'rgba(255,181,34,0.45)')};
  background: ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.03)' : ACCENT)};
  color: ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.4)' : '#2f2100')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.85rem;
  font-weight: 700;
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &:not(:disabled):hover {
    background: #ffc34a;
    box-shadow: 0 6px 14px rgba(255, 181, 34, 0.24);
  }
`;

const FiltersPanel = styled.section`
  background: ${PANEL_BG};
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 1rem;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  border: 1px solid ${BORDER};
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const FilterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-weight: 700;
  color: #5f3f00;
  margin-bottom: 8px;
`;

const FilterInput = styled.input`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: rgba(255,255,255,0.95);
  font-size: 0.95rem;
  color: #2f2100;

  &:focus {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(255, 181, 34, 0.22);
  }
`;

const RangeInputs = styled.div`
  display: flex;
  gap: 8px;

  ${FilterInput} {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const FilterChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FilterChip = styled.button`
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255,181,34,0.55)' : 'rgba(47, 33, 0, 0.08)')};
  padding: 6px 14px;
  font-size: 0.85rem;
  background: ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.18)' : 'rgba(255,255,255,0.9)')};
  color: ${({ $active }) => ($active ? '#7a4a00' : '#5c4a25')};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;

  &:hover {
    border-color: ${ACCENT};
    color: ${({ $active }) => ($active ? '#7a4a00' : ACCENT_DARK)};
    background: rgba(255, 181, 34, 0.12);
  }
`;

const ActionsColumn = styled.div`
  display: flex;
  align-items: flex-end;
`;

const ResetButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.03)' : ACCENT)};
  color: ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.4)' : '#2f2100')};
  border: 1px solid ${({ disabled }) => (disabled ? 'rgba(47, 33, 0, 0.08)' : 'rgba(255,181,34,0.5)')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &:not(:disabled):hover {
    background: #ffc34a;
    box-shadow: 0 8px 18px rgba(255, 181, 34, 0.24);
  }
`;

const ResultsBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid ${BORDER};
  background: rgba(255, 252, 243, 0.92);
  box-shadow: 0 8px 20px rgba(28, 20, 0, 0.05);
`;

const ResultsInfo = styled.div`
  margin-bottom: 0;
  color: ${TEXT_MUTED};
  font-weight: 600;
`;

const SortControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
`;

const SortLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 700;
  color: #5f3f00;
`;

const SortSelect = styled.select`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: rgba(255,255,255,0.95);
  font-size: 0.95rem;
  color: #2f2100;

  &:focus {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(255, 181, 34, 0.22);
  }
`;

const RoutesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0.25rem 0 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: ${CARD_BG};
  border-radius: 18px;
  border: 1px solid ${BORDER};
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.06);

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 1.1rem;
    color: #2f2100;
  }

  p {
    margin: 0;
    color: ${TEXT_MUTED};
  }
`;

const ErrorText = styled.span`
  color: #d64545;
`;

export default RoutesPage;
