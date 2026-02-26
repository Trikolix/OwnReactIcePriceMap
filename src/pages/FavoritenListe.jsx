import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";

const SORT_OPTIONS = [
  { value: "favorit_desc", label: "Zuletzt hinzugefuegt" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "open_first", label: "Geoeffnet zuerst" },
  { value: "distance_asc", label: "Entfernung" },
  { value: "kugel_preis_asc", label: "Kugelpreis" },
  { value: "score_desc", label: "Bester Score" },
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm) {
  if (distanceKm == null || Number.isNaN(distanceKm)) return "Keine Distanz";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function formatPrice(value, currencySymbol) {
  if (value == null || value === "") return "Keine Angabe";
  const number = Number(value);
  if (Number.isNaN(number)) return "Keine Angabe";
  return `${number.toFixed(2)} ${currencySymbol || "EUR"}`;
}

function formatPriceCompact(value, currencySymbol) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  return `${number.toFixed(2)} ${currencySymbol || "EUR"}`;
}

function formatScore(value) {
  if (value == null || value === "") return "Keine Daten";
  const number = Number(value);
  if (Number.isNaN(number)) return "Keine Daten";
  return number.toFixed(2);
}

function getBestScore(shop) {
  const scores = [
    Number(shop.finaler_kugel_score),
    Number(shop.finaler_softeis_score),
    Number(shop.finaler_eisbecher_score),
  ].filter((value) => !Number.isNaN(value));
  return scores.length ? Math.max(...scores) : null;
}

function getDisplayOpeningLines(shop) {
  const structured = hydrateOpeningHours(
    shop.openingHoursStructured,
    shop.opening_hours_note || ""
  );
  let lines = formatOpeningHoursLines(structured);
  if (!lines.length && shop.openingHours) {
    lines = shop.openingHours.split(";").map((part) => part.trim()).filter(Boolean);
  }
  return lines;
}

function compareNullableNumbers(a, b, direction = "asc") {
  const aMissing = a == null || Number.isNaN(a);
  const bMissing = b == null || Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === "asc" ? a - b : b - a;
}

function FavoritenListe() {
  const [favoriten, setFavoriten] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("favorit_desc");
  const [openOnly, setOpenOnly] = useState(false);
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [visitedFilter, setVisitedFilter] = useState("all");

  const { userId, isLoggedIn, userPosition } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) {
      setFavoriten([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    fetch(`${apiUrl}/favoriten_liste.php?nutzer_id=${userId}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error(data?.error || "Ungueltige Antwort vom Server");
        }
        if (!isCancelled) {
          setFavoriten(data);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (!isCancelled) {
          console.error("Fehler beim Laden der Favoriten:", err);
          setError("Favoriten konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [userId, isLoggedIn, apiUrl]);

  const enrichedFavoriten = useMemo(() => {
    return favoriten.map((shop) => {
      const lat = Number(shop.latitude);
      const lon = Number(shop.longitude);
      const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);
      const distanceKm =
        userPosition && hasCoords
          ? calculateDistanceKm(userPosition[0], userPosition[1], lat, lon)
          : null;
      const bestScore = getBestScore(shop);
      const hasPrice =
        shop.kugel_preis != null ||
        shop.softeis_preis != null ||
        shop.kugel_preis_eur != null ||
        shop.softeis_preis_eur != null;

      return {
        ...shop,
        distanceKm,
        bestScore,
        hasPrice,
      };
    });
  }, [favoriten, userPosition]);

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = enrichedFavoriten.filter((shop) => {
      if (openOnly && shop.is_open_now !== true) return false;
      if (withPriceOnly && !shop.hasPrice) return false;

      if (visitedFilter === "visited" && Number(shop.has_visited) !== 1) return false;
      if (visitedFilter === "not_visited" && Number(shop.has_visited) === 1) return false;

      if (!term) return true;
      const haystack = [shop.name, shop.adresse, shop.stadt, shop.bundesland]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "", "de");
        case "open_first":
          if (a.is_open_now === b.is_open_now) {
            return (a.name || "").localeCompare(b.name || "", "de");
          }
          return a.is_open_now ? -1 : 1;
        case "distance_asc":
          return compareNullableNumbers(a.distanceKm, b.distanceKm, "asc");
        case "kugel_preis_asc":
          return compareNullableNumbers(
            Number(a.kugel_preis_eur ?? a.kugel_preis),
            Number(b.kugel_preis_eur ?? b.kugel_preis),
            "asc"
          );
        case "score_desc":
          return compareNullableNumbers(a.bestScore, b.bestScore, "desc");
        case "favorit_desc":
        default:
          return new Date(b.favorit_seit).getTime() - new Date(a.favorit_seit).getTime();
      }
    });

    return filtered;
  }, [enrichedFavoriten, openOnly, withPriceOnly, visitedFilter, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const total = enrichedFavoriten.length;
    const openCount = enrichedFavoriten.filter((shop) => shop.is_open_now === true).length;
    const visitedCount = enrichedFavoriten.filter((shop) => Number(shop.has_visited) === 1).length;
    const priceCount = enrichedFavoriten.filter((shop) => shop.hasPrice).length;
    return { total, openCount, visitedCount, priceCount };
  }, [enrichedFavoriten]);

  const handleRemoveFavorite = async (shopId) => {
    if (!apiUrl || !userId) return;
    try {
      const res = await fetch(`${apiUrl}/favoriten_toggle.php?nutzer_id=${userId}&eisdiele_id=${shopId}`);
      const data = await res.json();
      if (data.status === "removed" || data.status === "added") {
        setFavoriten((prev) => prev.filter((shop) => Number(shop.id) !== Number(shopId)));
      }
    } catch (err) {
      console.error("Favorit konnte nicht entfernt werden:", err);
    }
  };

  return (
    <PageShell>
      <Header />
      <Content>
        <TopBar>
          <TitleBlock>
            <Title>Deine Favoriten</Title>
            <Subtitle>
              Schneller Zugriff auf gespeicherte Eisdielen mit Status, Preisen und Scores.
            </Subtitle>
          </TitleBlock>
          {isLoggedIn && (
            <StatsRow>
              <StatCard>
                <StatValue>{stats.total}</StatValue>
                <StatLabel>Gesamt</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.openCount}</StatValue>
                <StatLabel>Jetzt offen</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.visitedCount}</StatValue>
                <StatLabel>Besucht</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.priceCount}</StatValue>
                <StatLabel>Mit Preisen</StatLabel>
              </StatCard>
            </StatsRow>
          )}
        </TopBar>

        {!isLoggedIn ? (
          <StateCard>
            <StateTitle>Login erforderlich</StateTitle>
            <StateText>Bitte melde dich an, um deine Favoritenliste zu sehen.</StateText>
            <StateActions>
              <PrimaryLink to="/map">Zur Karte</PrimaryLink>
            </StateActions>
          </StateCard>
        ) : (
          <>
            <ControlsPanel>
              <SearchInput
                type="search"
                placeholder="Nach Name oder Adresse suchen"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sortierung"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <ChipRow>
                <FilterChipButton
                  type="button"
                  $active={openOnly}
                  onClick={() => setOpenOnly((prev) => !prev)}
                >
                  Jetzt offen
                </FilterChipButton>
                <FilterChipButton
                  type="button"
                  $active={withPriceOnly}
                  onClick={() => setWithPriceOnly((prev) => !prev)}
                >
                  Nur mit Preisen
                </FilterChipButton>
                <SegmentGroup>
                  <SegmentButton
                    type="button"
                    $active={visitedFilter === "all"}
                    onClick={() => setVisitedFilter("all")}
                  >
                    Alle
                  </SegmentButton>
                  <SegmentButton
                    type="button"
                    $active={visitedFilter === "visited"}
                    onClick={() => setVisitedFilter("visited")}
                  >
                    Besucht
                  </SegmentButton>
                  <SegmentButton
                    type="button"
                    $active={visitedFilter === "not_visited"}
                    onClick={() => setVisitedFilter("not_visited")}
                  >
                    Offen für Besuch
                  </SegmentButton>
                </SegmentGroup>
              </ChipRow>
            </ControlsPanel>

            {loading ? (
              <CardsGrid aria-live="polite">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index}>
                    <SkeletonLine style={{ width: "55%", height: 22 }} />
                    <SkeletonLine style={{ width: "90%" }} />
                    <SkeletonLine style={{ width: "72%" }} />
                    <SkeletonChipRow>
                      <SkeletonChip />
                      <SkeletonChip />
                      <SkeletonChip />
                    </SkeletonChipRow>
                  </SkeletonCard>
                ))}
              </CardsGrid>
            ) : error ? (
              <StateCard>
                <StateTitle>Fehler beim Laden</StateTitle>
                <StateText>{error}</StateText>
                <StateActions>
                  <RetryButton type="button" onClick={() => window.location.reload()}>
                    Erneut laden
                  </RetryButton>
                </StateActions>
              </StateCard>
            ) : filteredAndSorted.length === 0 ? (
              <StateCard>
                <StateTitle>
                  {favoriten.length === 0 ? "Keine Favoriten vorhanden" : "Keine Treffer"}
                </StateTitle>
                <StateText>
                  {favoriten.length === 0
                    ? "Du hast noch keine Eisdiele als Favorit gespeichert."
                    : "Passe Suche oder Filter an, um wieder Ergebnisse zu sehen."}
                </StateText>
                <StateActions>
                  <PrimaryLink to="/map">Zur Karte</PrimaryLink>
                  {favoriten.length > 0 && (
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setOpenOnly(false);
                        setWithPriceOnly(false);
                        setVisitedFilter("all");
                      }}
                    >
                      Filter zuruecksetzen
                    </SecondaryButton>
                  )}
                </StateActions>
              </StateCard>
            ) : (
              <CardsGrid>
                {filteredAndSorted.map((shop) => {
                  const openingLines = getDisplayOpeningLines(shop);
                  const hasCoords =
                    !Number.isNaN(Number(shop.latitude)) && !Number.isNaN(Number(shop.longitude));
                  const mapsQuery = hasCoords
                    ? `${shop.latitude},${shop.longitude}`
                    : encodeURIComponent(shop.adresse || shop.name || "");

                  return (
                    <Card key={shop.id}>
                      <CardHeader>
                        <div>
                          <ShopName>
                            <ShopLink to={`/map/activeShop/${shop.id}`}>{shop.name}</ShopLink>
                          </ShopName>
                          <MetaLine>
                            <OpenBadge $open={shop.is_open_now === true}>
                              {shop.is_open_now === true ? "Jetzt geoeffnet" : "Geschlossen"}
                            </OpenBadge>
                            {Number(shop.has_visited) === 1 && <MetaChip>Besucht</MetaChip>}
                            {Number(shop.has_active_challenge) === 1 && (
                              <MetaChip $highlight>Challenge aktiv</MetaChip>
                            )}
                            {shop.distanceKm != null && <MetaChip>{formatDistance(shop.distanceKm)}</MetaChip>}
                          </MetaLine>
                        </div>
                        <CardActionsInline>
                          <SmallButton
                            type="button"
                            onClick={() => handleRemoveFavorite(shop.id)}
                            title="Aus Favoriten entfernen"
                          >
                            Entfernen
                          </SmallButton>
                        </CardActionsInline>
                      </CardHeader>

                      <Address>{shop.adresse || "Keine Adresse"}</Address>

                      <MetricsGrid>
                        <MetricBox>
                          <MetricLabel>Kugelpreis</MetricLabel>
                          <MetricValue>
                            {formatPriceCompact(shop.kugel_preis, shop.kugel_waehrung) || "Keine Angabe"}
                          </MetricValue>
                        </MetricBox>
                        <MetricBox>
                          <MetricLabel>Softeispreis</MetricLabel>
                          <MetricValue>
                            {formatPriceCompact(shop.softeis_preis, shop.softeis_waehrung) || "Keine Angabe"}
                          </MetricValue>
                        </MetricBox>
                        <MetricBox>
                          <MetricLabel>Bester Score</MetricLabel>
                          <MetricValue>{shop.bestScore != null ? formatScore(shop.bestScore) : "Keine Daten"}</MetricValue>
                        </MetricBox>
                        <MetricBox>
                          <MetricLabel>Check-ins</MetricLabel>
                          <MetricValue>{Number(shop.checkin_count_total || 0)}</MetricValue>
                        </MetricBox>
                      </MetricsGrid>

                      <DetailsList>
                        <DetailRow>
                          <DetailLabel>Preis-Info</DetailLabel>
                          <DetailText>
                            Kugel: {formatPrice(shop.kugel_preis, shop.kugel_waehrung)} | Softeis:{" "}
                            {formatPrice(shop.softeis_preis, shop.softeis_waehrung)}
                          </DetailText>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>Scores</DetailLabel>
                          <DetailText>
                            Kugel {formatScore(shop.finaler_kugel_score)} | Softeis{" "}
                            {formatScore(shop.finaler_softeis_score)} | Eisbecher{" "}
                            {formatScore(shop.finaler_eisbecher_score)}
                          </DetailText>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>Community</DetailLabel>
                          <DetailText>
                            {Number(shop.review_count_total || 0)} Reviews,{" "}
                            {Number(shop.checkin_count_total || 0)} Check-ins, du selbst{" "}
                            {Number(shop.own_checkin_count || 0)}x
                          </DetailText>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>Öffnungszeiten</DetailLabel>
                          <DetailText>
                            {openingLines.length ? (
                              <OpeningLines>
                                {openingLines.slice(0, 3).map((part, index) => (
                                  <div key={index}>{part}</div>
                                ))}
                                {openingLines.length > 3 && (
                                  <OpeningHint>+{openingLines.length - 3} weitere Zeilen</OpeningHint>
                                )}
                                {shop.opening_hours_note && (
                                  <OpeningHint>Hinweis: {shop.opening_hours_note}</OpeningHint>
                                )}
                              </OpeningLines>
                            ) : (
                              "Keine Angaben"
                            )}
                          </DetailText>
                        </DetailRow>
                        <DetailRow>
                          <DetailLabel>Favorit seit</DetailLabel>
                          <DetailText>
                            {shop.favorit_seit
                              ? new Date(shop.favorit_seit).toLocaleString("de-DE", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Unbekannt"}
                          </DetailText>
                        </DetailRow>
                      </DetailsList>

                      <ActionRow>
                        <PrimaryLink to={`/map/activeShop/${shop.id}`}>Öffnen</PrimaryLink>
                        <SecondaryLinkButton to={`/map/activeShop/${shop.id}`}>Auf Karte</SecondaryLinkButton>
                        <GhostAnchor
                          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Navigation
                        </GhostAnchor>
                      </ActionRow>
                    </Card>
                  );
                })}
              </CardsGrid>
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
  background:
    radial-gradient(circle at top right, rgba(255, 232, 170, 0.55), transparent 45%),
    linear-gradient(180deg, #ffb522 0 120px, #fff8ea 120px 100%);
`;

const Content = styled.main`
  width: min(1200px, calc(100vw - 20px));
  margin: 0 auto;
  padding: 0.75rem 0 2rem;
  display: grid;
  gap: 0.9rem;

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.5rem 0.75rem 1.25rem;
  }
`;

const TopBar = styled.section`
  display: grid;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(47, 33, 0, 0.08);
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  color: #231900;
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.75);
  font-size: 0.92rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatCard = styled.div`
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 248, 230, 0.95);
  border: 1px solid rgba(255, 181, 34, 0.28);
`;

const StatValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: #2f2100;
`;

const StatLabel = styled.div`
  font-size: 0.78rem;
  color: rgba(47, 33, 0, 0.72);
`;

const ControlsPanel = styled.section`
  display: grid;
  gap: 0.65rem;
  padding: 0.8rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(47, 33, 0, 0.1);
  box-shadow: 0 8px 20px rgba(47, 33, 0, 0.08);
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid rgba(47, 33, 0, 0.15);
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  background: #fff;
  color: #231900;
  font-size: 0.95rem;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid rgba(47, 33, 0, 0.15);
  border-radius: 12px;
  padding: 0.65rem 0.8rem;
  background: #fff;
  color: #231900;
  font-size: 0.94rem;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const FilterChipButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.8)" : "rgba(47, 33, 0, 0.12)")};
  background: ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.22)" : "#fff")};
  color: #2f2100;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const SegmentGroup = styled.div`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  overflow: hidden;
  background: #fff;
`;

const SegmentButton = styled.button`
  border: none;
  background: ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.22)" : "transparent")};
  color: #2f2100;
  padding: 0.45rem 0.7rem;
  font-weight: 700;
  cursor: pointer;

  @media (max-width: 480px) {
    padding: 0.45rem 0.55rem;
    font-size: 0.82rem;
  }
`;

const CardsGrid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.li`
  display: grid;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  box-shadow: 0 10px 26px rgba(47, 33, 0, 0.08);
  padding: 0.95rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
`;

const ShopName = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.2;
  color: #231900;
`;

const ShopLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

const MetaLine = styled.div`
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const OpenBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ $open }) => ($open ? "#0f5132" : "#6c757d")};
  background: ${({ $open }) => ($open ? "rgba(63, 177, 117, 0.18)" : "rgba(108, 117, 125, 0.16)")};
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ $highlight }) => ($highlight ? "#7c2d12" : "#4b3a12")};
  background: ${({ $highlight }) =>
    $highlight ? "rgba(255, 181, 34, 0.28)" : "rgba(47, 33, 0, 0.06)"};
`;

const CardActionsInline = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const SmallButton = styled.button`
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: #fff;
  color: #2f2100;
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #fff8e6;
  }
`;

const Address = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.8);
  font-size: 0.9rem;
  line-height: 1.35;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MetricBox = styled.div`
  background: rgba(255, 248, 230, 0.8);
  border: 1px solid rgba(255, 181, 34, 0.22);
  border-radius: 12px;
  padding: 0.55rem 0.6rem;
`;

const MetricLabel = styled.div`
  font-size: 0.72rem;
  color: rgba(47, 33, 0, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 700;
`;

const MetricValue = styled.div`
  margin-top: 0.15rem;
  font-size: 0.88rem;
  color: #231900;
  font-weight: 800;
`;

const DetailsList = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem;
  align-items: flex-start;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
`;

const DetailLabel = styled.div`
  color: rgba(47, 33, 0, 0.66);
  font-weight: 700;
  font-size: 0.82rem;
`;

const DetailText = styled.div`
  color: #2f2100;
  font-size: 0.88rem;
  line-height: 1.35;
  min-width: 0;
  word-break: break-word;
`;

const OpeningLines = styled.div`
  display: grid;
  gap: 0.12rem;
`;

const OpeningHint = styled.div`
  color: rgba(47, 33, 0, 0.65);
  font-size: 0.78rem;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const buttonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
`;

const PrimaryLink = styled(Link)`
  ${buttonBase}
  background: #ffb522;
  color: #2f2100;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.35);
`;

const SecondaryLinkButton = styled(Link)`
  ${buttonBase}
  background: #fff;
  color: #2f2100;
  border-color: rgba(47, 33, 0, 0.12);
`;

const GhostAnchor = styled.a`
  ${buttonBase}
  background: rgba(47, 33, 0, 0.04);
  color: #2f2100;
  border-color: rgba(47, 33, 0, 0.08);
`;

const StateCard = styled.section`
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  box-shadow: 0 10px 26px rgba(47, 33, 0, 0.08);
  padding: 1.1rem;
  display: grid;
  gap: 0.55rem;
`;

const StateTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: #231900;
`;

const StateText = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.78);
`;

const StateActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.2rem;
`;

const RetryButton = styled.button`
  ${buttonBase}
  background: #ffb522;
  color: #2f2100;
`;

const SecondaryButton = styled.button`
  ${buttonBase}
  background: #fff;
  color: #2f2100;
  border-color: rgba(47, 33, 0, 0.12);
`;

const SkeletonCard = styled.li`
  list-style: none;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  padding: 0.95rem;
  display: grid;
  gap: 0.55rem;
`;

const shimmer = `
  background: linear-gradient(
    90deg,
    rgba(47, 33, 0, 0.05) 0%,
    rgba(47, 33, 0, 0.09) 50%,
    rgba(47, 33, 0, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: favShimmer 1.2s linear infinite;
  @keyframes favShimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
`;

const SkeletonLine = styled.div`
  ${shimmer}
  height: 14px;
  border-radius: 8px;
`;

const SkeletonChipRow = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-top: 0.15rem;
`;

const SkeletonChip = styled.div`
  ${shimmer}
  width: 72px;
  height: 24px;
  border-radius: 999px;
`;
