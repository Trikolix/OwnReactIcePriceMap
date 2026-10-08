import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import RouteCard from "../components/RouteCard";
import SubmitRouteForm from "../SubmitRouteModal";
import Seo from "../components/Seo";

const ROUTE_TYPES = ["Rennrad", "MTB", "Gravel", "Wanderung", "Sonstiges"];
const DIFFICULTIES = ["Leicht", "Mittel", "Schwer"];
const SORT_OPTIONS = [
  { value: "newest", label: "Neueste zuerst" }, { value: "oldest", label: "Älteste zuerst" },
  { value: "length_desc", label: "Längste Strecke" }, { value: "length_asc", label: "Kürzeste Strecke" },
  { value: "elevation_desc", label: "Meiste Höhenmeter" }, { value: "elevation_asc", label: "Wenigste Höhenmeter" },
  { value: "shops_desc", label: "Meiste Eis-Stopps" }, { value: "shops_asc", label: "Wenigste Eis-Stopps" },
];

const initialFilters = { search: "", types: [], difficulties: [], minLength: "", maxLength: "", minElevation: "", maxElevation: "", minShops: "", maxShops: "" };

const RoutesPage = () => {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [sortOption, setSortOption] = useState("newest");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showRouteForm, setShowRouteForm] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (userId) params.set("nutzer_id", userId);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.types.length) params.set("typ", filters.types.join(","));
    if (filters.difficulties.length) params.set("schwierigkeit", filters.difficulties.join(","));
    if (filters.minLength) params.set("min_length", filters.minLength);
    if (filters.maxLength) params.set("max_length", filters.maxLength);
    if (filters.minElevation) params.set("min_elevation", filters.minElevation);
    if (filters.maxElevation) params.set("max_elevation", filters.maxElevation);
    if (filters.minShops) params.set("min_shops", filters.minShops);
    if (filters.maxShops) params.set("max_shops", filters.maxShops);
    return params.toString() ? `?${params.toString()}` : "";
  }, [debouncedSearch, filters, userId]);

  useEffect(() => {
    if (!apiUrl) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${apiUrl}/routen/listRoutes.php${queryString}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Routen konnten nicht geladen werden.");
        return response.json();
      })
      .then((payload) => {
        if (payload.status !== "success" || !Array.isArray(payload.data)) throw new Error(payload.message || "Unbekannte Antwort vom Server.");
        setRoutes(payload.data);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [apiUrl, queryString, refreshToken]);

  const activeFilterCount = useMemo(() => Object.entries(filters).reduce((sum, [key, value]) => {
    if (key === "search") return sum;
    return sum + (Array.isArray(value) ? value.length : Number(value !== ""));
  }, 0), [filters]);
  const hasActiveFilters = activeFilterCount > 0 || filters.search !== "";

  const sortedRoutes = useMemo(() => {
    const getNumber = (route, field) => {
      const value = Number(route[field]);
      return Number.isNaN(value) ? null : value;
    };
    const compare = (first, second, direction = "desc") => {
      if (first === null && second === null) return 0;
      if (first === null) return 1;
      if (second === null) return -1;
      return direction === "asc" ? first - second : second - first;
    };
    return [...routes].sort((first, second) => {
      switch (sortOption) {
        case "oldest": return new Date(first.erstellt_am) - new Date(second.erstellt_am);
        case "length_desc": return compare(getNumber(first, "laenge_km"), getNumber(second, "laenge_km"));
        case "length_asc": return compare(getNumber(first, "laenge_km"), getNumber(second, "laenge_km"), "asc");
        case "elevation_desc": return compare(getNumber(first, "hoehenmeter"), getNumber(second, "hoehenmeter"));
        case "elevation_asc": return compare(getNumber(first, "hoehenmeter"), getNumber(second, "hoehenmeter"), "asc");
        case "shops_desc": return compare(Number(first.eisdielen_count) || 0, Number(second.eisdielen_count) || 0);
        case "shops_asc": return compare(Number(first.eisdielen_count) || 0, Number(second.eisdielen_count) || 0, "asc");
        default: return new Date(second.erstellt_am) - new Date(first.erstellt_am);
      }
    });
  }, [routes, sortOption]);

  const toggleFilterValue = (field, value) => setFilters((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((entry) => entry !== value) : [...current[field], value] }));
  const updateInput = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));
  const resetFilters = () => setFilters(initialFilters);
  const handleRouteUpdated = useCallback(() => setRefreshToken((token) => token + 1), []);
  const openRouteForm = () => {
    if (isLoggedIn) setShowRouteForm(true);
    else window.dispatchEvent(new Event("auth:open-login"));
  };

  return (
    <PageWrapper>
      <Seo title="Eis-Routen und Touren entdecken | Ice-App" description="Entdecke öffentliche Eis-Routen, Radtouren und Strecken mit Eisdielen in der Ice-App. Filtere nach Typ, Schwierigkeit und Länge." keywords={["Eis Routen", "Eisdielen Touren", "Ice-App Routen", "Radtour Eisdielen", "Eis Touren Deutschland"]} canonical="/routes" />
      <Header />
      <Content>
        <Hero>
          <div><Eyebrow>Touren mit Eis-Stopps</Eyebrow><h1>Routen entdecken</h1><p>Finde eine Tour, die zu deinem Tag passt – und entdecke unterwegs neue Eisdielen.</p></div>
          <SubmitRouteButton type="button" onClick={openRouteForm}><Plus size={19} />Route einreichen</SubmitRouteButton>
        </Hero>

        <DiscoveryToolbar>
          <SearchField>
            <Search size={19} aria-hidden="true" />
            <input id="routes-search" type="search" placeholder="Routen durchsuchen" value={filters.search} onChange={updateInput("search")} aria-label="Routen nach Name oder Beschreibung durchsuchen" />
            {filters.search && <ClearSearch type="button" onClick={() => setFilters((current) => ({ ...current, search: "" }))} aria-label="Suche löschen"><X size={17} /></ClearSearch>}
          </SearchField>
          <ToolbarActions>
            <FilterButton type="button" onClick={() => setFiltersExpanded((expanded) => !expanded)} aria-expanded={filtersExpanded} aria-controls="routes-filters"><SlidersHorizontal size={18} />Filter{activeFilterCount > 0 && <ActiveFiltersBadge>{activeFilterCount}</ActiveFiltersBadge>}</FilterButton>
            <SortControl><label htmlFor="routes-sort">Sortieren</label><select id="routes-sort" value={sortOption} onChange={(event) => setSortOption(event.target.value)}>{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></SortControl>
          </ToolbarActions>
        </DiscoveryToolbar>

        {filtersExpanded && <FiltersPanel id="routes-filters" aria-label="Routen filtern">
          <FilterGroup><FilterLabel>Routentyp</FilterLabel><FilterChips>{ROUTE_TYPES.map((type) => <FilterChip key={type} type="button" $active={filters.types.includes(type)} aria-pressed={filters.types.includes(type)} onClick={() => toggleFilterValue("types", type)}>{type}</FilterChip>)}</FilterChips></FilterGroup>
          <FilterGroup><FilterLabel>Schwierigkeit</FilterLabel><FilterChips>{DIFFICULTIES.map((level) => <FilterChip key={level} type="button" $active={filters.difficulties.includes(level)} aria-pressed={filters.difficulties.includes(level)} onClick={() => toggleFilterValue("difficulties", level)}>{level}</FilterChip>)}</FilterChips></FilterGroup>
          <FilterGroup><FilterLabel>Länge in km</FilterLabel><RangeInputs><input type="number" min="0" placeholder="Min" value={filters.minLength} onChange={updateInput("minLength")} aria-label="Minimale Länge in Kilometern" /><input type="number" min="0" placeholder="Max" value={filters.maxLength} onChange={updateInput("maxLength")} aria-label="Maximale Länge in Kilometern" /></RangeInputs></FilterGroup>
          <FilterGroup><FilterLabel>Höhenmeter</FilterLabel><RangeInputs><input type="number" min="0" placeholder="Min" value={filters.minElevation} onChange={updateInput("minElevation")} aria-label="Minimale Höhenmeter" /><input type="number" min="0" placeholder="Max" value={filters.maxElevation} onChange={updateInput("maxElevation")} aria-label="Maximale Höhenmeter" /></RangeInputs></FilterGroup>
          <FilterGroup><FilterLabel>Eis-Stopps</FilterLabel><RangeInputs><input type="number" min="0" placeholder="Min" value={filters.minShops} onChange={updateInput("minShops")} aria-label="Minimale Anzahl Eis-Stopps" /><input type="number" min="0" placeholder="Max" value={filters.maxShops} onChange={updateInput("maxShops")} aria-label="Maximale Anzahl Eis-Stopps" /></RangeInputs></FilterGroup>
          <ResetButton type="button" disabled={!hasActiveFilters} onClick={resetFilters}>Filter zurücksetzen</ResetButton>
        </FiltersPanel>}

        <ResultsBar aria-live="polite">
          {loading ? "Routen werden geladen …" : error ? <ErrorText>{error}</ErrorText> : `${routes.length} Route${routes.length === 1 ? "" : "n"} gefunden`}
          {hasActiveFilters && <ResetTextButton type="button" onClick={resetFilters}>Alles zurücksetzen</ResetTextButton>}
        </ResultsBar>

        <RoutesList>
          {!loading && !error && routes.length === 0 && <EmptyState><strong>Keine Routen gefunden</strong><p>Ändere die Suche oder lockere deine Filter.</p><button type="button" onClick={resetFilters}>Filter zurücksetzen</button></EmptyState>}
          {sortedRoutes.map((route) => <RouteCard key={route.id} route={route} onSuccess={handleRouteUpdated} showComments={false} />)}
        </RoutesList>
      </Content>
      {showRouteForm && <SubmitRouteForm showForm={showRouteForm} setShowForm={setShowRouteForm} onSuccess={handleRouteUpdated} />}
    </PageWrapper>
  );
};

export default RoutesPage;

const PageWrapper = styled.div`min-height: 100vh; background: radial-gradient(circle at top right, rgba(255,218,140,.32), transparent 42%), linear-gradient(180deg, #fff9ef, #fff4da);`;
const Content = styled.main`width: min(96%, 1200px); margin: 0 auto; padding: clamp(.8rem, 2vw, 1.5rem) 0 2rem;`;
const Hero = styled.header`display: flex; justify-content: space-between; align-items: end; gap: 1rem; padding: .5rem .15rem 1.25rem; h1 { margin: .15rem 0 .3rem; color: #2f2100; font-size: clamp(1.7rem, 3vw, 2.25rem); } p { margin: 0; color: rgba(47,33,0,.68); } @media (max-width: 600px) { align-items: stretch; flex-direction: column; p { font-size: .9rem; } }`;
const Eyebrow = styled.span`color: #8a5700; font-size: .78rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;`;
const SubmitRouteButton = styled.button`display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 44px; flex: 0 0 auto; border: 1px solid rgba(255,181,34,.75); border-radius: 11px; background: #ffb522; color: #2f2100; padding: .7rem 1rem; font: inherit; font-size: .9rem; font-weight: 800; cursor: pointer; &:hover { background: #ffc34a; } &:focus-visible { outline: 3px solid rgba(255,181,34,.4); outline-offset: 2px; }`;
const DiscoveryToolbar = styled.div`display: flex; align-items: center; gap: .7rem; padding: .7rem; border: 1px solid rgba(47,33,0,.09); border-radius: 16px; background: rgba(255,255,255,.72); @media (max-width: 720px) { align-items: stretch; flex-direction: column; }`;
const SearchField = styled.div`display: flex; align-items: center; gap: .5rem; min-width: 0; flex: 1; padding: 0 .7rem; border: 1px solid rgba(47,33,0,.14); border-radius: 11px; background: #fff; color: #8a5700; &:focus-within { border-color: #ffb522; box-shadow: 0 0 0 3px rgba(255,181,34,.2); } input { width: 100%; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: #2f2100; font: inherit; }`;
const ClearSearch = styled.button`display: inline-flex; border: 0; border-radius: 6px; background: transparent; color: #6b4a00; padding: .2rem; cursor: pointer; &:hover { background: #fff3da; } &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const ToolbarActions = styled.div`display: flex; gap: .6rem; align-items: center; @media (max-width: 480px) { display: grid; grid-template-columns: 1fr 1fr; }`;
const FilterButton = styled.button`display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 42px; border: 1px solid rgba(47,33,0,.14); border-radius: 11px; background: #fff; color: #2f2100; padding: .55rem .75rem; font: inherit; font-size: .88rem; font-weight: 800; cursor: pointer; &:hover { background: #fff8e8; } &:focus-visible { outline: 3px solid rgba(255,181,34,.35); outline-offset: 2px; }`;
const ActiveFiltersBadge = styled.span`display: inline-grid; place-items: center; min-width: 1.25rem; height: 1.25rem; padding: 0 .15rem; border-radius: 999px; background: #ffb522; color: #2f2100; font-size: .72rem;`;
const SortControl = styled.div`display: flex; align-items: center; gap: .35rem; label { color: #5f4a25; font-size: .76rem; font-weight: 700; } select { min-height: 42px; max-width: 170px; border: 1px solid rgba(47,33,0,.14); border-radius: 11px; background: #fff; padding: 0 .55rem; color: #2f2100; font: inherit; font-size: .86rem; &:focus-visible { outline: 3px solid rgba(255,181,34,.35); } } @media (max-width: 480px) { flex-direction: column; align-items: stretch; select { max-width: none; } }`;
const FiltersPanel = styled.section`display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-top: .65rem; padding: 1rem; border: 1px solid rgba(47,33,0,.1); border-radius: 16px; background: rgba(255,255,255,.86);`;
const FilterGroup = styled.div`display: flex; flex-direction: column; gap: .5rem;`;
const FilterLabel = styled.span`color: #5f3f00; font-size: .82rem; font-weight: 800;`;
const FilterChips = styled.div`display: flex; flex-wrap: wrap; gap: .4rem;`;
const FilterChip = styled.button`border: 1px solid ${({ $active }) => $active ? "rgba(255,181,34,.75)" : "rgba(47,33,0,.13)"}; border-radius: 999px; background: ${({ $active }) => $active ? "#fff3da" : "#fff"}; color: ${({ $active }) => $active ? "#8a5700" : "#5f4a25"}; padding: .35rem .65rem; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; &:hover { border-color: #ffb522; } &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const RangeInputs = styled.div`display: flex; gap: .45rem; input { width: 100%; min-width: 0; min-height: 38px; box-sizing: border-box; border: 1px solid rgba(47,33,0,.14); border-radius: 9px; padding: .4rem .5rem; font: inherit; &:focus { outline: 3px solid rgba(255,181,34,.25); border-color: #ffb522; } }`;
const ResetButton = styled.button`align-self: end; min-height: 40px; border: 1px solid rgba(47,33,0,.14); border-radius: 10px; background: #fff; color: #6b4a00; font: inherit; font-size: .85rem; font-weight: 800; cursor: pointer; &:not(:disabled):hover { background: #fff8e8; } &:disabled { color: rgba(47,33,0,.4); cursor: not-allowed; } &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const ResultsBar = styled.div`display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin: .9rem .15rem .65rem; color: rgba(47,33,0,.72); font-size: .9rem; font-weight: 700;`;
const ResetTextButton = styled.button`border: 0; background: transparent; color: #8a5700; padding: .2rem; font: inherit; font-size: .83rem; font-weight: 800; cursor: pointer; text-decoration: underline; &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const ErrorText = styled.span`color: #b91c1c;`;
const RoutesList = styled.div`display: flex; flex-direction: column; gap: .85rem;`;
const EmptyState = styled.div`padding: 3.5rem 1.5rem; border: 1px solid rgba(47,33,0,.09); border-radius: 18px; background: rgba(255,255,255,.86); text-align: center; color: #2f2100; strong { display: block; font-size: 1.1rem; } p { margin: .45rem 0 1rem; color: rgba(47,33,0,.65); } button { border: 1px solid rgba(255,181,34,.7); border-radius: 9px; background: #fff3da; padding: .55rem .8rem; color: #6b4a00; font: inherit; font-weight: 800; cursor: pointer; }`;
