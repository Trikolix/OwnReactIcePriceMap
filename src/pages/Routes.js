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
const PAGE_BG = '#f4f6fb';
const CARD_BG = '#ffffff';
const PANEL_BG = '#fffdfa';
const BORDER = '#ebe9f5';
const TEXT_MUTED = '#4a4a68';
const ACCENT = '#ffb522';
const ACCENT_DARK = '#e09b10';
const ACCENT_SOFT = '#fff3da';

const RoutesPage = () => {
  const { userId } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
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

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== '';
    });
  }, [filters]);

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 16px 48px;
`;

const TitleSection = styled.section`
  margin-bottom: 24px;

  h1 {
    margin: 0 0 8px;
    font-size: 2rem;
    color: #2c2c54;
  }

  p {
    margin: 0;
    color: ${TEXT_MUTED};
  }
`;

const FiltersPanel = styled.section`
  background: ${PANEL_BG};
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 15px 40px rgba(28, 30, 70, 0.08);
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
  font-weight: 600;
  color: #3c3c5a;
  margin-bottom: 8px;
`;

const FilterInput = styled.input`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid ${BORDER};
  background: ${CARD_BG};
  font-size: 0.95rem;
  color: #2a2a3f;

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
  border: 1px solid ${({ $active }) => ($active ? ACCENT : BORDER)};
  padding: 6px 14px;
  font-size: 0.85rem;
  background: ${({ $active }) => ($active ? ACCENT : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : TEXT_MUTED)};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${ACCENT};
    color: ${({ $active }) => ($active ? '#fff' : ACCENT_DARK)};
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
  background: ${({ disabled }) => (disabled ? '#f4e9d4' : ACCENT)};
  color: ${({ disabled }) => (disabled ? '#a38f6b' : '#fff')};
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: background 0.2s ease;
`;

const ResultsBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
`;

const ResultsInfo = styled.div`
  margin-bottom: 16px;
  color: ${TEXT_MUTED};
  font-weight: 500;
`;

const SortControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
`;

const SortLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${TEXT_MUTED};
`;

const SortSelect = styled.select`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid ${BORDER};
  background: ${CARD_BG};
  font-size: 0.95rem;
  color: #2a2a3f;

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
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: ${CARD_BG};
  border-radius: 18px;
  box-shadow: inset 0 0 0 1px ${BORDER};

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 1.1rem;
    color: #2a2a3f;
  }

  p {
    margin: 0;
    color: #6f6f8d;
  }
`;

const ErrorText = styled.span`
  color: #d64545;
`;

export default RoutesPage;
