import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { HeartOff, Map, Navigation, Search } from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";

const SORT_OPTIONS = [
  { value: "recommended", label: "Empfohlen" },
  { value: "recent", label: "Zuletzt gespeichert" },
  { value: "distance", label: "Entfernung" },
  { value: "score", label: "Bester Score" },
  { value: "name", label: "Name (A–Z)" },
];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDistance = toRadians(lat2 - lat1);
  const lonDistance = toRadians(lon2 - lon1);
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm) => {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m entfernt`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km entfernt`;
};

const formatPrice = (value, currency) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toFixed(2)} ${currency || "EUR"}` : "–";
};

const getBestScore = (shop) => {
  const scores = [shop.finaler_kugel_score, shop.finaler_softeis_score, shop.finaler_eisbecher_score]
    .map(Number)
    .filter(Number.isFinite);
  return scores.length ? Math.max(...scores) : null;
};

const compareNullable = (a, b, direction = "asc") => {
  const aMissing = a == null || Number.isNaN(a);
  const bMissing = b == null || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? a - b : b - a;
};

function FavoritenListe() {
  const { isLoggedIn, userPosition, authToken } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [openOnly, setOpenOnly] = useState(false);
  const [notVisitedOnly, setNotVisitedOnly] = useState(false);
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [removedFavorite, setRemovedFavorite] = useState(null);
  const [pendingShopId, setPendingShopId] = useState(null);

  const loadFavorites = async (signal) => {
    if (!apiUrl || !isLoggedIn) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/favoriten_liste.php`, {
        signal,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(payload?.error || "Ungültige Antwort vom Server");
      }
      setFavorites(payload);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        console.error("Favoriten konnten nicht geladen werden:", requestError);
        setError("Favoriten konnten nicht geladen werden.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([]);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    loadFavorites(controller.signal);
    return () => controller.abort();
  }, [apiUrl, authToken, isLoggedIn]);

  const enrichedFavorites = useMemo(() => favorites.map((shop) => {
    const latitude = Number(shop.latitude);
    const longitude = Number(shop.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const distanceKm = userPosition && hasCoordinates
      ? calculateDistanceKm(userPosition[0], userPosition[1], latitude, longitude)
      : null;
    const bestScore = getBestScore(shop);
    const hasPrice = [shop.kugel_preis, shop.softeis_preis, shop.kugel_preis_eur, shop.softeis_preis_eur]
      .some((value) => value != null && value !== "");
    return { ...shop, distanceKm, bestScore, hasPrice };
  }), [favorites, userPosition]);

  const stats = useMemo(() => ({
    total: enrichedFavorites.length,
    open: enrichedFavorites.filter((shop) => shop.is_open_now === true).length,
    notVisited: enrichedFavorites.filter((shop) => Number(shop.has_visited) !== 1).length,
  }), [enrichedFavorites]);

  const visibleFavorites = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const filtered = enrichedFavorites.filter((shop) => {
      if (openOnly && shop.is_open_now !== true) return false;
      if (notVisitedOnly && Number(shop.has_visited) === 1) return false;
      if (withPriceOnly && !shop.hasPrice) return false;
      if (!normalizedTerm) return true;
      return [shop.name, shop.adresse, shop.stadt, shop.bundesland]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedTerm);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "", "de");
      if (sortBy === "distance") return compareNullable(a.distanceKm, b.distanceKm);
      if (sortBy === "score") return compareNullable(a.bestScore, b.bestScore, "desc");
      if (sortBy === "recent") return new Date(b.favorit_seit).getTime() - new Date(a.favorit_seit).getTime();

      // Ein Vorschlag, kein versteckter Filter: offene und noch nicht besuchte Läden zuerst.
      const openDifference = Number(Boolean(b.is_open_now)) - Number(Boolean(a.is_open_now));
      if (openDifference) return openDifference;
      const visitDifference = Number(Number(a.has_visited) === 1) - Number(Number(b.has_visited) === 1);
      if (visitDifference) return visitDifference;
      const distanceDifference = compareNullable(a.distanceKm, b.distanceKm);
      if (distanceDifference) return distanceDifference;
      return new Date(b.favorit_seit).getTime() - new Date(a.favorit_seit).getTime();
    });
  }, [enrichedFavorites, notVisitedOnly, openOnly, searchTerm, sortBy, withPriceOnly]);

  const removeFavorite = async (shop) => {
    if (!apiUrl || pendingShopId) return;
    setPendingShopId(shop.id);
    try {
      const response = await fetch(`${apiUrl}/favoriten_toggle.php?eisdiele_id=${shop.id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== "removed") throw new Error(payload?.error || "Entfernen fehlgeschlagen");
      setFavorites((previous) => previous.filter((entry) => Number(entry.id) !== Number(shop.id)));
      setRemovedFavorite(shop);
    } catch (requestError) {
      console.error("Favorit konnte nicht entfernt werden:", requestError);
      setError("Der Favorit konnte nicht entfernt werden.");
    } finally {
      setPendingShopId(null);
    }
  };

  const undoRemove = async () => {
    if (!apiUrl || !removedFavorite || pendingShopId) return;
    const shop = removedFavorite;
    setPendingShopId(shop.id);
    try {
      const response = await fetch(`${apiUrl}/favoriten_toggle.php?eisdiele_id=${shop.id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== "added") throw new Error(payload?.error || "Wiederherstellen fehlgeschlagen");
      setFavorites((previous) => [shop, ...previous]);
      setRemovedFavorite(null);
    } catch (requestError) {
      console.error("Favorit konnte nicht wiederhergestellt werden:", requestError);
      setError("Der Favorit konnte nicht wiederhergestellt werden.");
    } finally {
      setPendingShopId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setOpenOnly(false);
    setNotVisitedOnly(false);
    setWithPriceOnly(false);
  };

  return (
    <PageShell>
      <Header />
      <Content>
        <PageHeader>
          <HeaderCopy>
            <Eyebrow>Deine Sammlung</Eyebrow>
            <h1>Favoriten</h1>
            {isLoggedIn && <Summary>{stats.total} gespeichert · {stats.open} jetzt offen · {stats.notVisited} noch nicht besucht</Summary>}
          </HeaderCopy>
          <MapLink to={stats.total ? "/?favorites=1" : "/"}><Map size={18} aria-hidden="true" /> Auf Karte ansehen</MapLink>
        </PageHeader>

        {!isLoggedIn ? (
          <StateCard>
            <h2>Login erforderlich</h2>
            <p>Melde dich an, um gespeicherte Eisdielen wiederzufinden und zu verwalten.</p>
            <MapLink to="/">Zur Karte</MapLink>
          </StateCard>
        ) : (
          <>
            <Controls aria-label="Favoriten filtern">
              <SearchField>
                <Search size={18} aria-hidden="true" />
                <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Eisdiele oder Ort suchen" />
              </SearchField>
              <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Favoriten sortieren">
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <FilterRow>
                <FilterChip type="button" $active={openOnly} onClick={() => setOpenOnly((value) => !value)}>Jetzt offen</FilterChip>
                <FilterChip type="button" $active={notVisitedOnly} onClick={() => setNotVisitedOnly((value) => !value)}>Noch nicht besucht</FilterChip>
                <FilterChip type="button" $active={withPriceOnly} onClick={() => setWithPriceOnly((value) => !value)}>Mit Preis</FilterChip>
              </FilterRow>
            </Controls>

            {removedFavorite && (
              <UndoNotice role="status">
                <span>{removedFavorite.name} wurde aus deinen Favoriten entfernt.</span>
                <button type="button" onClick={undoRemove} disabled={pendingShopId === removedFavorite.id}>Rückgängig</button>
                <button type="button" aria-label="Hinweis schließen" onClick={() => setRemovedFavorite(null)}>×</button>
              </UndoNotice>
            )}

            {loading ? <LoadingGrid aria-live="polite">{Array.from({ length: 5 }).map((_, index) => <LoadingCard key={index} />)}</LoadingGrid>
              : error ? <StateCard><h2>Etwas ist schiefgelaufen</h2><p>{error}</p><button type="button" onClick={() => loadFavorites()}>Erneut laden</button></StateCard>
                : visibleFavorites.length === 0 ? (
                  <StateCard>
                    <h2>{favorites.length ? "Keine passenden Favoriten" : "Noch keine Favoriten"}</h2>
                    <p>{favorites.length ? "Passe Suche oder Filter an." : "Speichere Eisdielen auf der Karte, um sie hier wiederzufinden."}</p>
                    <StateActions>
                      {favorites.length ? <button type="button" onClick={resetFilters}>Filter zurücksetzen</button> : null}
                      <MapLink to={favorites.length ? "/?favorites=1" : "/"}>Eisdielen auf Karte entdecken</MapLink>
                    </StateActions>
                  </StateCard>
                ) : (
                  <FavoritesList>
                    {visibleFavorites.map((shop) => {
                      const hasCoordinates = Number.isFinite(Number(shop.latitude)) && Number.isFinite(Number(shop.longitude));
                      const mapsQuery = hasCoordinates ? `${shop.latitude},${shop.longitude}` : encodeURIComponent(shop.adresse || shop.name || "");
                      return (
                        <FavoriteCard key={shop.id}>
                          <CardTop>
                            <div>
                              <ShopName to={`/map/activeShop/${shop.id}`}>{shop.name}</ShopName>
                              <BadgeRow>
                                <StatusBadge $open={shop.is_open_now === true}>{shop.is_open_now === true ? "Jetzt geöffnet" : "Geschlossen"}</StatusBadge>
                                {Number(shop.has_visited) === 1 ? <SubtleBadge>Besucht</SubtleBadge> : <SubtleBadge $accent>Noch nicht besucht</SubtleBadge>}
                                {formatDistance(shop.distanceKm) && <SubtleBadge>{formatDistance(shop.distanceKm)}</SubtleBadge>}
                              </BadgeRow>
                            </div>
                            <RemoveButton type="button" onClick={() => removeFavorite(shop)} disabled={pendingShopId === shop.id} aria-label={`${shop.name} aus Favoriten entfernen`} title="Aus Favoriten entfernen">
                              <HeartOff size={19} aria-hidden="true" />
                            </RemoveButton>
                          </CardTop>
                          <Address>{shop.adresse || "Keine Adresse hinterlegt"}</Address>
                          <Snapshot>
                            <SnapshotItem><span>Kugelpreis</span><strong>{formatPrice(shop.kugel_preis, shop.kugel_waehrung)}</strong></SnapshotItem>
                            <SnapshotItem><span>Bester Score</span><strong>{shop.bestScore == null ? "–" : shop.bestScore.toFixed(2)}</strong></SnapshotItem>
                            <SnapshotItem><span>Deine Besuche</span><strong>{Number(shop.own_checkin_count || 0)}</strong></SnapshotItem>
                          </Snapshot>
                          <CardActions>
                            <CardLink to={`/map/activeShop/${shop.id}`}><Map size={17} aria-hidden="true" /> Auf Karte</CardLink>
                            <NavigationLink href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer"><Navigation size={16} aria-hidden="true" /> Navigation</NavigationLink>
                          </CardActions>
                        </FavoriteCard>
                      );
                    })}
                  </FavoritesList>
                )}
          </>
        )}
      </Content>
    </PageShell>
  );
}

export default FavoritenListe;

const PageShell = styled.div`
  min-height: 100dvh;
  background: radial-gradient(circle at 90% 0, rgba(255, 213, 119, .42), transparent 31rem), #fff8ea;
`;

const Content = styled.main`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.3rem 0 3rem;
  display: grid;
  gap: 1rem;
  @media (max-width: 600px) { width: min(100% - 1rem, 1120px); padding-top: .75rem; }
`;

const PageHeader = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding: .25rem .15rem;
  @media (max-width: 600px) { align-items: start; flex-direction: column; }
`;
const HeaderCopy = styled.div`display: grid; gap: .12rem; h1 { margin: 0; color: #241900; font-size: clamp(1.55rem, 3vw, 2.1rem); line-height: 1.08; }`;
const Eyebrow = styled.span`color: #8a5d0b; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;`;
const Summary = styled.p`margin: .2rem 0 0; color: #735a32; font-size: .94rem;`;
const MapLink = styled(Link)`display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 44px; padding: 0 .9rem; border-radius: 12px; background: #ffb522; color: #2d2107; text-decoration: none; font-weight: 800; box-shadow: 0 5px 14px rgba(145, 91, 0, .13); &:hover { background: #ffa80b; }`;
const Controls = styled.section`display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: .65rem; padding: .7rem; border: 1px solid rgba(73, 51, 11, .12); border-radius: 16px; background: rgba(255,255,255,.8); @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const SearchField = styled.label`display: flex; align-items: center; gap: .5rem; min-height: 44px; padding: 0 .8rem; border: 1px solid rgba(73, 51, 11, .16); border-radius: 11px; background: #fff; color: #7a6744; input { width: 100%; min-width: 0; border: 0; outline: 0; font: inherit; color: #2d2107; background: transparent; }`;
const Select = styled.select`min-height: 44px; border: 1px solid rgba(73, 51, 11, .16); border-radius: 11px; padding: 0 .7rem; background: #fff; color: #2d2107; font: inherit;`;
const FilterRow = styled.div`grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: .45rem;`;
const FilterChip = styled.button`min-height: 38px; border: 1px solid ${({ $active }) => $active ? "#e5a01d" : "rgba(73, 51, 11, .13)"}; border-radius: 999px; padding: 0 .8rem; background: ${({ $active }) => $active ? "#fff0c9" : "#fff"}; color: #3d2b08; font-weight: 750; cursor: pointer; &:focus-visible { outline: 3px solid #1769e0; outline-offset: 2px; }`;
const FavoritesList = styled.ul`list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; @media (max-width: 780px) { grid-template-columns: 1fr; }`;
const FavoriteCard = styled.li`display: grid; gap: .72rem; padding: 1rem; border: 1px solid rgba(73, 51, 11, .11); border-radius: 16px; background: rgba(255,255,255,.92); box-shadow: 0 7px 20px rgba(70, 44, 0, .06);`;
const CardTop = styled.div`display: flex; justify-content: space-between; gap: .7rem;`;
const ShopName = styled(Link)`color: #231900; font-size: 1.08rem; font-weight: 850; line-height: 1.2; text-decoration: none; &:hover { text-decoration: underline; } &:focus-visible { outline: 3px solid #1769e0; outline-offset: 3px; }`;
const BadgeRow = styled.div`display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .42rem;`;
const StatusBadge = styled.span`padding: .2rem .5rem; border-radius: 999px; background: ${({ $open }) => $open ? "#daf2e3" : "#eceff1"}; color: ${({ $open }) => $open ? "#12613c" : "#65717b"}; font-size: .75rem; font-weight: 800;`;
const SubtleBadge = styled.span`padding: .2rem .5rem; border-radius: 999px; background: ${({ $accent }) => $accent ? "#fff0cc" : "#f4f0e8"}; color: ${({ $accent }) => $accent ? "#805100" : "#65563e"}; font-size: .75rem; font-weight: 750;`;
const RemoveButton = styled.button`display: inline-grid; place-items: center; flex: 0 0 40px; height: 40px; border: 1px solid rgba(128, 36, 36, .18); border-radius: 10px; color: #8a3131; background: #fff; cursor: pointer; &:hover:not(:disabled) { background: #fff0f0; } &:disabled { opacity: .55; cursor: wait; } &:focus-visible { outline: 3px solid #1769e0; outline-offset: 2px; }`;
const Address = styled.p`margin: 0; color: #6d5a3c; font-size: .91rem; line-height: 1.35;`;
const Snapshot = styled.dl`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .4rem; margin: 0; @media (max-width: 380px) { grid-template-columns: 1fr; }`;
const SnapshotItem = styled.div`min-width: 0; padding: .52rem .6rem; border-radius: 10px; background: #fff8e9; span, strong { display: block; } span { color: #796342; font-size: .7rem; font-weight: 750; text-transform: uppercase; letter-spacing: .025em; } strong { margin-top: .12rem; overflow: hidden; color: #281c04; font-size: .9rem; text-overflow: ellipsis; white-space: nowrap; }`;
const CardActions = styled.div`display: flex; gap: .5rem; flex-wrap: wrap; padding-top: .05rem;`;
const CardLink = styled(Link)`display: inline-flex; align-items: center; gap: .35rem; min-height: 40px; padding: 0 .75rem; border-radius: 10px; color: #2f2100; background: #ffba2b; text-decoration: none; font-weight: 800;`;
const NavigationLink = styled.a`display: inline-flex; align-items: center; gap: .35rem; min-height: 40px; padding: 0 .72rem; border: 1px solid rgba(73, 51, 11, .16); border-radius: 10px; color: #46340f; text-decoration: none; font-weight: 750;`;
const StateCard = styled.section`display: grid; gap: .55rem; justify-items: start; padding: 1.1rem; border: 1px solid rgba(73, 51, 11, .12); border-radius: 16px; background: rgba(255,255,255,.88); h2, p { margin: 0; } h2 { color: #2c2008; font-size: 1.12rem; } p { color: #6c5939; } button { min-height: 40px; padding: 0 .75rem; border: 1px solid rgba(73, 51, 11, .16); border-radius: 10px; background: #fff; color: #372705; font: inherit; font-weight: 800; cursor: pointer; }`;
const StateActions = styled.div`display: flex; flex-wrap: wrap; gap: .5rem;`;
const UndoNotice = styled.div`position: sticky; z-index: 2; bottom: .75rem; display: flex; align-items: center; gap: .6rem; width: fit-content; max-width: 100%; margin-left: auto; padding: .6rem .7rem .6rem .9rem; border-radius: 12px; background: #2e240f; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,.18); font-size: .9rem; button { min-height: 34px; border: 0; border-radius: 8px; padding: 0 .55rem; background: #ffca59; color: #2e240f; font: inherit; font-weight: 850; cursor: pointer; } button:last-child { padding: 0 .35rem; background: transparent; color: #fff; } @media (max-width: 500px) { margin-left: 0; flex-wrap: wrap; }`;
const LoadingGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; @media (max-width: 780px) { grid-template-columns: 1fr; }`;
const LoadingCard = styled.div`height: 190px; border-radius: 16px; background: linear-gradient(90deg, #fff6df 25%, #fffdf6 40%, #fff6df 55%); background-size: 200% 100%; animation: favorite-loading 1.2s infinite; @keyframes favorite-loading { to { background-position: -200% 0; } }`;
