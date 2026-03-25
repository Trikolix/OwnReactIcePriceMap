import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { MapPinned, RefreshCcw, Sparkles, Target, Timer, Trophy as TrophyGlyph } from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import TeamChallengesPanel from "../components/TeamChallengesPanel";

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DIFFICULTIES = ["leicht", "mittel", "schwer"];
const CHALLENGE_TYPES = ["daily", "weekly"];
const difficultyOrder = { leicht: 0, mittel: 1, schwer: 2 };
const difficultyMeta = {
  leicht: { color: "#23a55a", label: "Leicht", range: "0-5 km" },
  mittel: { color: "#d97706", label: "Mittel", range: "5-15 km" },
  schwer: { color: "#dc2626", label: "Schwer", range: "15-45 km" },
};
const typeMeta = {
  daily: { label: "Daily", helper: "bis Mitternacht" },
  weekly: { label: "Weekly", helper: "bis Sonntag 23:59 Uhr" },
};

const toNumberOrNull = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sortChallenges = (challengeList) =>
  [...challengeList].sort((a, b) => {
    if (a.type !== b.type) return a.type === "daily" ? -1 : 1;
    return (difficultyOrder[a.difficulty] ?? 99) - (difficultyOrder[b.difficulty] ?? 99);
  });

const getApiMessage = (data, fallback) => data?.message || data?.error || fallback;

const normalizeChallenge = (raw) => {
  if (!raw) return null;
  const source = raw.challenge && typeof raw.challenge === "object" ? { ...raw, ...raw.challenge } : raw;
  const shop = source.shop || {};
  const normalizedId = source.id ?? source.challenge_id ?? null;
  return {
    ...source,
    id: normalizedId,
    challenge_id: normalizedId,
    completed: source.completed === true || Number(source.completed) === 1,
    recreated: source.recreated === true || Number(source.recreated) === 1,
    shop_id: source.shop_id ?? shop.id ?? null,
    shop_name: source.shop_name ?? shop.name ?? "",
    shop_address: source.shop_address ?? shop.adresse ?? shop.address ?? "",
    shop_lat: toNumberOrNull(source.shop_lat ?? shop.shop_lat ?? shop.lat ?? shop.latitude),
    shop_lon: toNumberOrNull(source.shop_lon ?? shop.shop_lon ?? shop.lon ?? shop.longitude),
  };
};

const upsertChallenge = (list, nextChallenge) => {
  const normalized = normalizeChallenge(nextChallenge);
  if (!normalized || normalized.id == null) return list;
  const filtered = list.filter((item) => String(item.id) !== String(normalized.id));
  return sortChallenges([...filtered, normalized]);
};

async function readJsonResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Ungültige Server-Antwort (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(getApiMessage(data, `HTTP ${res.status}`));
  return data;
}

function SetMapZoom({ zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setZoom(zoom);
  }, [zoom, map]);
  return null;
}

function FlyToMapTarget({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat == null || target?.lon == null) return;
    map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 13), { animate: true, duration: 0.8 });
  }, [target, map]);
  return null;
}

function Challenges() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTrophy, setSelectedTrophy] = useState(null);
  const [showTypeInfo, setShowTypeInfo] = useState(false);
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [challenges, setChallenges] = useState([]);
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);
  const [difficulty, setDifficulty] = useState("leicht");
  const [challengeType, setChallengeType] = useState("daily");
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [recreatingChallengeId, setRecreatingChallengeId] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [countdownNowTs, setCountdownNowTs] = useState(Date.now());
  const newChallengeModalButtonRef = useRef(null);
  const trophyModalButtonRef = useRef(null);
  const activeTab = searchParams.get("tab") === "team" ? "team" : "solo";
  const focusTeamChallengeId = searchParams.get("teamChallengeId");

  useEffect(() => {
    const intervalId = window.setInterval(() => setCountdownNowTs(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setMapZoom(difficulty === "schwer" ? 8 : difficulty === "mittel" ? 10 : 11);
  }, [difficulty]);

  useEffect(() => {
    let watchId;
    if (!navigator.geolocation) {
      setLoadingLocation(false);
      setLocationNotice({
        type: "error",
        message: "Dein Browser unterstützt keinen Standortzugriff. Challenges können ohne Standort nicht generiert werden.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoadingLocation(false);
        setLocationNotice(null);
      },
      () => {
        setLoadingLocation(false);
        setLocationNotice({
          type: "info",
          message: "Standort konnte noch nicht ermittelt werden. Erlaube den Standortzugriff, um Challenges zu generieren.",
        });
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationNotice(null);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 0 }
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) {
      setChallenges([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    fetch(`${apiUrl}/api/challenge_list.php?nutzer_id=${userId}`, { signal: controller.signal })
      .then(readJsonResponse)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error(getApiMessage(data, "Ungültige Antwort beim Laden der Challenges."));
        if (!isCancelled) setChallenges(sortChallenges(data.map(normalizeChallenge).filter(Boolean)));
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !isCancelled) {
          setLoadError(err.message || "Challenges konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [userId, isLoggedIn, apiUrl]);

  useEffect(() => {
    if (showNewChallengeModal) newChallengeModalButtonRef.current?.focus();
  }, [showNewChallengeModal]);

  useEffect(() => {
    if (selectedTrophy) trophyModalButtonRef.current?.focus();
  }, [selectedTrophy]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (selectedTrophy) setSelectedTrophy(null);
      else if (showNewChallengeModal) setShowNewChallengeModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTrophy, showNewChallengeModal]);

  const setMapFocusToChallenge = (challenge) => {
    if (challenge?.shop_lat == null || challenge?.shop_lon == null) return;
    setMapFocusTarget({ lat: challenge.shop_lat, lon: challenge.shop_lon, key: `${challenge.id}-${Date.now()}` });
  };

  const setActionMessage = (type, message, details = []) => {
    setActionNotice({ type, message, details: Array.isArray(details) ? details : [] });
  };

  const buildChallengeRequest = async ({ requestedDifficulty, requestedType, existingChallengeId = null }) => {
    if (!location) throw new Error("Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff.");
    if (!userId || !apiUrl) throw new Error("Nutzer oder API-Konfiguration fehlt.");
    const form = new FormData();
    form.append("nutzer_id", String(userId));
    form.append("lat", String(location.lat));
    form.append("lon", String(location.lon));
    form.append("difficulty", requestedDifficulty);
    form.append("type", requestedType);
    if (existingChallengeId != null) form.append("challenge_id", String(existingChallengeId));
    const res = await fetch(`${apiUrl}/api/challenge_generate.php`, { method: "POST", body: form });
    const data = await readJsonResponse(res);
    if (data.status !== "success") throw new Error(getApiMessage(data, "Challenge konnte nicht erstellt werden."));
    const normalized = normalizeChallenge(data);
    if (!normalized || normalized.id == null) throw new Error("Challenge wurde erstellt, aber die Server-Antwort ist unvollständig.");
    return { challenge: normalized };
  };

  const handleGenerateChallenge = async () => {
    if (!location) {
      setActionMessage("error", "Standort konnte nicht ermittelt werden. Für die Generierung einer Challenge wird dein Standort benötigt.");
      return;
    }
    setGenerating(true);
    setActionNotice(null);
    try {
      const { challenge } = await buildChallengeRequest({ requestedDifficulty: difficulty, requestedType: challengeType });
      setChallenges((prev) => upsertChallenge(prev, challenge));
      setNewChallenge(challenge);
      setShowNewChallengeModal(true);
      setMapFocusToChallenge(challenge);
      setActionMessage("success", "Challenge erfolgreich erstellt.");
    } catch (error) {
      setActionMessage("error", error.message || "Challenge konnte nicht erstellt werden.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllMissing = async () => {
    if (!location) {
      setActionMessage("error", "Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff, um Challenges zu generieren.");
      return;
    }
    if (missingCombinations.length === 0) {
      setActionMessage("info", "Alle Kombinationen aus Schwierigkeit und Typ sind bereits aktiv.");
      return;
    }

    setBulkGenerating(true);
    setActionNotice(null);
    const createdChallenges = [];
    const failedMessages = [];
    try {
      for (const combo of missingCombinations) {
        try {
          const { challenge } = await buildChallengeRequest({ requestedDifficulty: combo.difficulty, requestedType: combo.type });
          createdChallenges.push(challenge);
        } catch (error) {
          failedMessages.push(`${combo.difficulty}/${combo.type}: ${error.message || "Unbekannter Fehler"}`);
        }
      }
      if (createdChallenges.length > 0) {
        setChallenges((prev) => createdChallenges.reduce((acc, challenge) => upsertChallenge(acc, challenge), prev));
        setMapFocusToChallenge(createdChallenges[createdChallenges.length - 1]);
      }
      if (createdChallenges.length > 0 && failedMessages.length === 0) {
        setActionMessage("success", `${createdChallenges.length} Challenge(s) erfolgreich erstellt.`);
      } else if (createdChallenges.length > 0) {
        setActionMessage("info", `${createdChallenges.length} Challenge(s) erstellt, ${failedMessages.length} fehlgeschlagen.`, failedMessages);
      } else {
        setActionMessage("error", "Keine Challenge konnte erstellt werden.", failedMessages);
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleRecreateChallenge = async (challengeId, currentDifficulty, currentType) => {
    if (!location) {
      setActionMessage("error", "Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff für einen Neuversuch.");
      return;
    }
    setRecreatingChallengeId(challengeId);
    setActionNotice(null);
    try {
      const { challenge } = await buildChallengeRequest({
        requestedDifficulty: currentDifficulty,
        requestedType: currentType,
        existingChallengeId: challengeId,
      });
      setChallenges((prev) => upsertChallenge(prev, challenge));
      setNewChallenge(challenge);
      setShowNewChallengeModal(true);
      setMapFocusToChallenge(challenge);
      setActionMessage("success", "Challenge erfolgreich neu generiert.");
    } catch (error) {
      setActionMessage("error", error.message || "Challenge konnte nicht erneuert werden.");
    } finally {
      setRecreatingChallengeId(null);
    }
  };

  const handleTrophyKeyDown = (event, trophy) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedTrophy(trophy);
    }
  };

  const renderNotice = (notice, keyPrefix) => {
    if (!notice?.message) return null;
    return (
      <NoticeBox $type={notice.type || "info"} key={`${keyPrefix}-${notice.message}`}>
        <NoticeMessage>{notice.message}</NoticeMessage>
        {Array.isArray(notice.details) && notice.details.length > 0 && (
          <NoticeList>
            {notice.details.map((line, index) => (
              <li key={`${keyPrefix}-${index}`}>{line}</li>
            ))}
          </NoticeList>
        )}
      </NoticeBox>
    );
  };

  const formatCountdown = (validUntil) => {
    const end = new Date(validUntil);
    if (Number.isNaN(end.getTime())) return "-";
    const diffMs = end.getTime() - countdownNowTs;
    if (diffMs <= 0) return "Abgelaufen";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}min`;
  };

  const activeChallenges = useMemo(() => sortChallenges(challenges.filter((challenge) => !challenge.completed)), [challenges]);
  const completedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.completed).sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0)),
    [challenges]
  );
  const missingCombinations = useMemo(() => {
    const existing = new Set(activeChallenges.map((challenge) => `${challenge.difficulty}|${challenge.type}`));
    const missing = [];
    for (const d of DIFFICULTIES) {
      for (const t of CHALLENGE_TYPES) {
        if (!existing.has(`${d}|${t}`)) missing.push({ difficulty: d, type: t });
      }
    }
    return missing;
  }, [activeChallenges]);
  const selectedCombinationExists = activeChallenges.some(
    (challenge) => challenge.difficulty === difficulty && challenge.type === challengeType
  );
  const stats = useMemo(
    () => ({ active: activeChallenges.length, completed: completedChallenges.length, missing: missingCombinations.length }),
    [activeChallenges.length, completedChallenges.length, missingCombinations.length]
  );
  const handleTabChange = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "team") nextParams.set("tab", "team");
    else nextParams.delete("tab");
    if (nextTab !== "team") nextParams.delete("teamChallengeId");
    setSearchParams(nextParams, { replace: true });
  };

  const handleFocusChallengeHandled = () => {
    if (!focusTeamChallengeId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("teamChallengeId");
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <Page>
      <Seo
        title="Challenges | Ice-App"
        description="Zufällige Eisdielen-Challenges in deiner Nähe: tägliche und wöchentliche Aufgaben für mehr EP, Awards und neue Eisziele."
        canonical="/challenge"
      />
      <Header />
      <Content>
        <HeroCard>
          <HeroTitle>Challenges</HeroTitle>
          <HeroSubtitle>
            Tägliche und wöchentliche Eis-Ziele im Stil der restlichen Ice-App: klarere Struktur, bessere Statusanzeige und direktere Aktionen.
          </HeroSubtitle>
          <MetaRow>
            <MetaChip>{stats.active} aktiv</MetaChip>
            <MetaChip>{stats.completed} abgeschlossen</MetaChip>
            <MetaChip>{stats.missing} Kombinationen frei</MetaChip>
          </MetaRow>
        </HeroCard>

        <TabRow>
          <TabButton type="button" $active={activeTab === "solo"} onClick={() => handleTabChange("solo")}>
            Solo
          </TabButton>
          <TabButton type="button" $active={activeTab === "team"} onClick={() => handleTabChange("team")}>
            Team
          </TabButton>
        </TabRow>

        {showNewChallengeModal && newChallenge && (
          <ModalOverlay onClick={() => setShowNewChallengeModal(false)}>
            <ModalBox onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-challenge-modal-title">
              <ModalTitle id="new-challenge-modal-title">Neue Challenge generiert</ModalTitle>
              <ChallengeCard $accent={difficultyMeta[newChallenge.difficulty]?.color || "#9e9e9e"} style={{ marginBottom: 0 }}>
                <ChallengeTopRow>
                  <ChallengePill $accent={difficultyMeta[newChallenge.difficulty]?.color || "#9e9e9e"}>
                    {typeMeta[newChallenge.type]?.label || newChallenge.type} · {difficultyMeta[newChallenge.difficulty]?.label || newChallenge.difficulty}
                  </ChallengePill>
                </ChallengeTopRow>
                <ChallengeName>
                  <CleanLink to={`/map/activeShop/${newChallenge.shop_id}`}>{newChallenge.shop_name}</CleanLink>
                </ChallengeName>
                <ChallengeAddress>{newChallenge.shop_address}</ChallengeAddress>
                <ChallengeBottomRow>
                  <Countdown>
                    <Timer size={15} />
                    <span>{formatCountdown(newChallenge.valid_until)}</span>
                  </Countdown>
                  {newChallenge.shop_lat != null && newChallenge.shop_lon != null && <InlineHint>Marker wurde auf der Karte fokussiert.</InlineHint>}
                </ChallengeBottomRow>
              </ChallengeCard>
              <ModalButton ref={newChallengeModalButtonRef} onClick={() => setShowNewChallengeModal(false)}>
                Schließen
              </ModalButton>
            </ModalBox>
          </ModalOverlay>
        )}

        {!isLoggedIn ? (
          <SectionCard>
            <SectionTitle>Login erforderlich</SectionTitle>
            <BodyText>
              Melde dich an, um aktive Challenges zu sehen, neue Aufgaben zu generieren und abgeschlossene Challenges als Erfolge zu sammeln.
            </BodyText>
          </SectionCard>
        ) : activeTab === "team" ? (
          <TeamChallengesPanel
            userId={userId}
            apiUrl={apiUrl}
            location={location}
            loadingLocation={loadingLocation}
            locationNotice={locationNotice}
            focusChallengeId={focusTeamChallengeId}
            onFocusChallengeHandled={handleFocusChallengeHandled}
          />
        ) : (
          <LayoutGrid>
            <MainColumn>
              <SectionCard>
                <SectionHead>
                  <div>
                    <SectionTitle>Aktive Challenges</SectionTitle>
                    <SectionSubline>Deine aktuellen Aufgaben mit Ziel-Eisdiele, Restzeit und möglichem Neuversuch.</SectionSubline>
                  </div>
                  <MetaChip $muted>{activeChallenges.length} offen</MetaChip>
                </SectionHead>

                {loadError && renderNotice({ type: "error", message: loadError }, "load-error")}
                {loading ? (
                  <StateBox>Lade Challenges...</StateBox>
                ) : activeChallenges.length === 0 ? (
                  <StateBox>Du hast aktuell keine aktiven Challenges.</StateBox>
                ) : (
                  <ChallengeList>
                    {activeChallenges.map((ch) => {
                      const meta = difficultyMeta[ch.difficulty] || difficultyMeta.leicht;
                      const isExpired = new Date(ch.valid_until) <= new Date();
                      const canRecreate = !ch.recreated && !isExpired;
                      const isRecreatingThis = recreatingChallengeId != null && String(recreatingChallengeId) === String(ch.id);

                      return (
                        <ChallengeCard key={ch.id} $accent={meta.color}>
                          <ChallengeTopRow>
                            <ChallengePill $accent={meta.color}>
                              {typeMeta[ch.type]?.label || ch.type} · {meta.label}
                            </ChallengePill>
                            {isRecreatingThis && <MutedBadge>Wird neu generiert...</MutedBadge>}
                          </ChallengeTopRow>

                          <ChallengeName>
                            <CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink>
                          </ChallengeName>
                          <ChallengeAddress>{ch.shop_address}</ChallengeAddress>

                          <ChallengeTiles>
                            <InfoTile>
                              <InfoLabel>Reichweite</InfoLabel>
                              <InfoValue>{meta.range}</InfoValue>
                            </InfoTile>
                            <InfoTile>
                              <InfoLabel>Ablauf</InfoLabel>
                              <InfoValue>{typeMeta[ch.type]?.helper || "-"}</InfoValue>
                            </InfoTile>
                            <InfoTile>
                              <InfoLabel>Status</InfoLabel>
                              <InfoValue>{isExpired ? "Abgelaufen" : "Aktiv"}</InfoValue>
                            </InfoTile>
                          </ChallengeTiles>

                          <ChallengeBottomRow>
                            <Countdown>
                              <Timer size={15} />
                              <span>{formatCountdown(ch.valid_until)}</span>
                            </Countdown>
                            {canRecreate ? (
                              <RecreateButton
                                type="button"
                                onClick={() => handleRecreateChallenge(ch.id, ch.difficulty, ch.type)}
                                disabled={isRecreatingThis || generating || bulkGenerating || !location}
                              >
                                <RefreshCcw size={15} />
                                <span>{isRecreatingThis ? "Erstelle neu..." : "Neu generieren"}</span>
                              </RecreateButton>
                            ) : (
                              <MutedBadge>{ch.recreated ? "Bereits neu generiert" : "Nicht mehr verfügbar"}</MutedBadge>
                            )}
                          </ChallengeBottomRow>
                        </ChallengeCard>
                      );
                    })}
                  </ChallengeList>
                )}
              </SectionCard>

              <SectionCard>
                <SectionHead>
                  <div>
                    <SectionTitle>Neue Challenge generieren</SectionTitle>
                    <SectionSubline>Wähle Schwierigkeit und Typ und generiere eine zufällige Eisdiele in deiner Nähe.</SectionSubline>
                  </div>
                  <SelectionPill $accent={difficultyMeta[difficulty].color}>
                    {difficultyMeta[difficulty].label} · {typeMeta[challengeType].label}
                  </SelectionPill>
                </SectionHead>

                {renderNotice(locationNotice, "location")}
                {renderNotice(actionNotice, "action")}


                <SelectionSection>
                  <SelectionGroup>
                    <SelectionHeading>Schwierigkeit</SelectionHeading>
                    <SelectionCards>
                      {DIFFICULTIES.map((entry) => (
                        <SelectionCard
                          key={entry}
                          type="button"
                          $active={difficulty === entry}
                          $accent={difficultyMeta[entry].color}
                          onClick={() => setDifficulty(entry)}
                        >
                          <SummaryIcon>
                            <Target size={18} />
                          </SummaryIcon>
                          <div>
                            <SummaryValue>{difficultyMeta[entry].label}</SummaryValue>
                            <SummaryHint>{difficultyMeta[entry].range}</SummaryHint>
                          </div>
                        </SelectionCard>
                      ))}
                    </SelectionCards>
                  </SelectionGroup>

                  <SelectionGroup>
                    <SelectionHeadingRow>
                      <SelectionHeading>Typ</SelectionHeading>
                      <InfoTooltipWrap>
                        <InfoTooltipButton
                          type="button"
                          aria-label="Info zu Daily- und Weekly-Challenges"
                          aria-expanded={showTypeInfo}
                          onClick={() => setShowTypeInfo((prev) => !prev)}
                        >
                          i
                        </InfoTooltipButton>
                        <InfoTooltipBubble $visible={showTypeInfo}>
                          Daily-Challenges laufen bis Mitternacht, Weekly-Challenges bis Sonntag 23:59 Uhr. Dailys nach 18 Uhr gelten für den nächsten Tag, Weeklys am Sonntag für die nächste Woche. Läuft eine Challenge ab, kannst du wieder eine neue generieren.
                        </InfoTooltipBubble>
                      </InfoTooltipWrap>
                    </SelectionHeadingRow>
                    <SelectionCards>
                      {CHALLENGE_TYPES.map((entry) => (
                        <SelectionCard
                          key={entry}
                          type="button"
                          $active={challengeType === entry}
                          $accent="#ffb522"
                          onClick={() => setChallengeType(entry)}
                        >
                          <SummaryIcon>
                            <Sparkles size={18} />
                          </SummaryIcon>
                          <div>
                            <SummaryValue>{typeMeta[entry].label}</SummaryValue>
                            <SummaryHint>{typeMeta[entry].helper}</SummaryHint>
                          </div>
                        </SelectionCard>
                      ))}
                    </SelectionCards>
                  </SelectionGroup>

                  <SelectionGroup>
                    <SelectionHeading>Standort</SelectionHeading>
                    <StatusCard $ready={Boolean(location)}>
                      <SummaryIcon>
                        <MapPinned size={18} />
                      </SummaryIcon>
                      <div>
                        <SummaryValue>{loadingLocation ? "Wird geladen" : location ? "Bereit" : "Fehlt"}</SummaryValue>
                        <SummaryHint>{location ? "Challenge kann erzeugt werden" : "Browser-Freigabe nötig"}</SummaryHint>
                      </div>
                    </StatusCard>
                  </SelectionGroup>
                </SelectionSection>

                <ActionArea>
                  {loadingLocation && <SmallText>Standort wird geladen...</SmallText>}
                  <ButtonRow>
                    <GenerateButton
                      type="button"
                      onClick={handleGenerateChallenge}
                      disabled={generating || bulkGenerating || selectedCombinationExists || !location}
                    >
                      {generating
                        ? "Erstelle..."
                        : !location
                          ? "Standort erforderlich"
                          : selectedCombinationExists
                            ? "Bereits aktiv"
                            : "Neue Challenge generieren"}
                    </GenerateButton>
                    <SecondaryButton
                      type="button"
                      onClick={handleGenerateAllMissing}
                      disabled={generating || bulkGenerating || !location || missingCombinations.length === 0}
                    >
                      {bulkGenerating
                        ? "Generiere..."
                        : !location
                          ? "Standort erforderlich"
                          : missingCombinations.length === 0
                            ? "Alles aktiv"
                            : "Alle fehlenden generieren"}
                    </SecondaryButton>
                  </ButtonRow>
                </ActionArea>

                {location && (
                  <>
                    <LegendContainer>
                      {DIFFICULTIES.map((entry) => (
                        <LegendItem key={entry}>
                          <ColorDot style={{ backgroundColor: difficultyMeta[entry].color }} />
                          <span>{difficultyMeta[entry].label} {difficultyMeta[entry].range}</span>
                        </LegendItem>
                      ))}
                    </LegendContainer>

                    <MapWrap>
                      <MapContainer center={[location.lat, location.lon]} zoom={mapZoom} style={{ height: "320px", width: "100%" }} scrollWheelZoom={false}>
                        <SetMapZoom zoom={mapZoom} />
                        <FlyToMapTarget target={mapFocusTarget} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                        <Marker position={[location.lat, location.lon]}>
                          <Popup>Dein Standort</Popup>
                        </Marker>
                        <Circle center={[location.lat, location.lon]} radius={5000} pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.2 }} />
                        <Circle center={[location.lat, location.lon]} radius={15000} pathOptions={{ color: "#eab308", fillColor: "#eab308", fillOpacity: 0.15 }} />
                        <Circle center={[location.lat, location.lon]} radius={45000} pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.1 }} />
                        {activeChallenges.map((ch, idx) => {
                          const lat = toNumberOrNull(ch.shop_lat ?? ch.shop?.lat ?? ch.shop?.shop_lat ?? ch.shop?.latitude);
                          const lon = toNumberOrNull(ch.shop_lon ?? ch.shop?.lon ?? ch.shop?.shop_lon ?? ch.shop?.longitude);
                          let icon = greenIcon;
                          if (ch.difficulty === "mittel") icon = yellowIcon;
                          else if (ch.difficulty === "schwer") icon = orangeIcon;
                          if (lat == null || lon == null) return null;
                          return (
                            <Marker key={ch.id || idx} position={[lat, lon]} icon={icon}>
                              <Popup>
                                <strong>{ch.shop_name}</strong>
                                <br />
                                {ch.shop_address}
                                <br />
                                {difficultyMeta[ch.difficulty]?.label || ch.difficulty} · {typeMeta[ch.type]?.label || ch.type}
                              </Popup>
                            </Marker>
                          );
                        })}
                      </MapContainer>
                    </MapWrap>
                  </>
                )}
              </SectionCard>
            </MainColumn>

            <SideColumn>
              <SectionCard>
                <SectionTitle>So funktionieren Challenges</SectionTitle>
                <InfoStack>
                  <InfoRow>
                    <InfoIcon><MapPinned size={16} /></InfoIcon>
                    <span>Es wird eine zufällige Eisdiele im gewählten Umkreis ausgewählt.</span>
                  </InfoRow>
                  <InfoRow>
                    <InfoIcon><Timer size={16} /></InfoIcon>
                    <span>Je nach Typ ist die Aufgabe nur für den Tag oder die laufende Woche gültig.</span>
                  </InfoRow>
                  <InfoRow>
                    <InfoIcon><Sparkles size={16} /></InfoIcon>
                    <span>Erfolgreiche Check-ins bringen Extra-EP und können zusätzliche Awards freischalten.</span>
                  </InfoRow>
                  <InfoRow>
                    <InfoIcon><Target size={16} /></InfoIcon>
                    <span>Der Check-in muss vor Ort erfolgen, maximal 300 Meter von der Eisdiele entfernt.</span>
                  </InfoRow>
                </InfoStack>
              </SectionCard>

              <SectionCard>
                <SectionHead>
                  <div>
                    <SectionTitle>Deine Erfolge</SectionTitle>
                    <SectionSubline>Abgeschlossene Challenges als kompaktes Archiv.</SectionSubline>
                  </div>
                  <MetaChip $muted>{completedChallenges.length} gesammelt</MetaChip>
                </SectionHead>

                {completedChallenges.length === 0 ? (
                  <StateBox>Noch keine abgeschlossenen Challenges.</StateBox>
                ) : (
                  <TrophyGrid>
                    {completedChallenges.map((ch) => (
                      <TrophyCard
                        key={ch.id}
                        onClick={() => setSelectedTrophy(ch)}
                        onKeyDown={(event) => handleTrophyKeyDown(event, ch)}
                        tabIndex={0}
                        role="button"
                      >
                        <TrophyIcon>
                          <TrophyGlyph aria-hidden="true" />
                        </TrophyIcon>
                        <TrophyName>{ch.shop_name}</TrophyName>
                        <TrophyDate>{new Date(ch.completed_at).toLocaleDateString("de-DE")}</TrophyDate>
                        <TrophyType $accent={difficultyMeta[ch.difficulty]?.color || "#9e9e9e"}>
                          {difficultyMeta[ch.difficulty]?.label || ch.difficulty}
                        </TrophyType>
                      </TrophyCard>
                    ))}
                  </TrophyGrid>
                )}
              </SectionCard>
            </SideColumn>
          </LayoutGrid>
        )}

        {selectedTrophy && (
          <ModalOverlay onClick={() => setSelectedTrophy(null)}>
            <ModalBox onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="trophy-modal-title">
              <ModalTitle id="trophy-modal-title">Challenge-Details</ModalTitle>
              <CenteredTrophyIcon>
                <TrophyGlyph aria-hidden="true" />
              </CenteredTrophyIcon>
              <ChallengeName style={{ textAlign: "center" }}>{selectedTrophy.shop_name}</ChallengeName>
              <ChallengeAddress style={{ textAlign: "center" }}>{selectedTrophy.shop_address}</ChallengeAddress>
              <ChallengePill $accent={difficultyMeta[selectedTrophy.difficulty]?.color || "#9e9e9e"} style={{ margin: "0.8rem auto 0", display: "table" }}>
                {difficultyMeta[selectedTrophy.difficulty]?.label || selectedTrophy.difficulty} · {typeMeta[selectedTrophy.type]?.label || selectedTrophy.type}
              </ChallengePill>
              <TrophyDate style={{ marginTop: "0.9rem", textAlign: "center" }}>
                Abgeschlossen am: {selectedTrophy.completed_at ? new Date(selectedTrophy.completed_at).toLocaleString("de-DE") : "-"}
              </TrophyDate>
              <ModalButton ref={trophyModalButtonRef} onClick={() => setSelectedTrophy(null)}>
                Schließen
              </ModalButton>
            </ModalBox>
          </ModalOverlay>
        )}
      </Content>
    </Page>
  );
}

export default Challenges;

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
`;

const Content = styled.div`
  width: min(96%, 1440px);
  margin: 0 auto;
  padding: 0.5rem 0 1.5rem;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 1rem 0.95rem;
  margin-bottom: 1rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #2f2100;
  font-size: clamp(1.35rem, 2vw, 1.9rem);
`;

const HeroSubtitle = styled.p`
  margin: 0.4rem 0 0;
  color: rgba(47, 33, 0, 0.7);
  line-height: 1.5;
`;

const MetaRow = styled.div`
  margin-top: 0.8rem;
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const TabButton = styled.button`
  padding: 0.72rem 1rem;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.45)" : "rgba(47, 33, 0, 0.1)")};
  background: ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.16)" : "rgba(255, 252, 243, 0.8)")};
  color: #2f2100;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.68rem;
  border-radius: 999px;
  background: ${({ $muted }) => ($muted ? "rgba(47, 33, 0, 0.05)" : "rgba(255, 181, 34, 0.16)")};
  border: 1px solid ${({ $muted }) => ($muted ? "rgba(47, 33, 0, 0.08)" : "rgba(255, 181, 34, 0.28)")};
  color: #6c4500;
  font-size: 0.8rem;
  font-weight: 700;
`;

const LayoutGrid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 1080px) {
    grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.95fr);
    align-items: start;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 1rem;
`;

const SideColumn = styled.div`
  display: grid;
  gap: 1rem;
`;

const SectionCard = styled.section`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.05rem;
  font-weight: 800;
`;

const SectionSubline = styled.p`
  margin: 0.15rem 0 0;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.92rem;
  line-height: 1.45;
`;

const BodyText = styled.p`
  margin: 0.9rem 0 0;
  color: #5b4520;
  line-height: 1.55;
`;

const StateBox = styled.div`
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 1rem;
  color: #6c5830;
`;

const NoticeBox = styled.div`
  margin-bottom: 0.8rem;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  border: 1px solid transparent;
  background: ${({ $type }) => ($type === "error" ? "#ffe9e9" : $type === "success" ? "#e8f7ec" : "#eef5ff")};
  border-color: ${({ $type }) => ($type === "error" ? "#f5b5b5" : $type === "success" ? "#b9e0c3" : "#bfd6ff")};
  color: ${({ $type }) => ($type === "error" ? "#8b1e1e" : $type === "success" ? "#185c2b" : "#1e3f7a")};
`;

const NoticeMessage = styled.div`
  font-size: 0.95rem;
  line-height: 1.35;
`;

const NoticeList = styled.ul`
  margin: 0.4rem 0 0 1rem;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ChallengeList = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const ChallengeCard = styled.article`
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,239,0.95));
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
  padding: 1rem;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 5px;
    background: ${({ $accent }) => $accent};
  }
`;

const ChallengeTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const ChallengePill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  background: ${({ $accent }) => `${$accent}1a`};
  border: 1px solid ${({ $accent }) => `${$accent}40`};
  color: #5b4520;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MutedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.05);
  color: rgba(47, 33, 0, 0.6);
  font-size: 0.78rem;
  font-weight: 700;
`;

const ChallengeName = styled.h3`
  margin: 0.85rem 0 0.2rem;
  color: #2f2100;
  font-size: 1.08rem;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const ChallengeAddress = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.92rem;
  line-height: 1.45;
`;

const ChallengeTiles = styled.div`
  display: grid;
  gap: 0.6rem;
  margin-top: 0.9rem;

  @media (min-width: 720px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const InfoTile = styled.div`
  border-radius: 14px;
  padding: 0.7rem 0.8rem;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const InfoLabel = styled.div`
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoValue = styled.div`
  color: #2f2100;
  font-size: 0.92rem;
  font-weight: 800;
  margin-top: 0.2rem;
  line-height: 1.35;
`;

const ChallengeBottomRow = styled.div`
  margin-top: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const Countdown = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #5b4520;
  font-size: 0.9rem;
  font-weight: 700;
`;

const InlineHint = styled.span`
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.82rem;
`;

const RecreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.95rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #2f2100;
  background: #ffb522;
  border-radius: 10px;
  border: none;
  cursor: pointer;

  &:hover:enabled {
    background: #ffc546;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SelectionSection = styled.div`
  display: grid;
  gap: 0.9rem;
  margin-bottom: 0.9rem;
`;

const SelectionGroup = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const SelectionHeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const SelectionHeading = styled.div`
  color: #6b5327;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoTooltipWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const InfoTooltipButton = styled.button`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: rgba(255, 255, 255, 0.9);
  color: #7a4a00;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;

  &:hover {
    border-color: rgba(255, 181, 34, 0.5);
    background: #fff4dd;
  }
`;

const InfoTooltipBubble = styled.div`
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  width: min(320px, 70vw);
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  background: rgba(47, 33, 0, 0.96);
  color: #fff8eb;
  font-size: 0.8rem;
  line-height: 1.45;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.2);
  z-index: 5;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  transform: translateY(-4px);
  transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease;

  @media (max-width: 640px) {
    width: min(280px, 78vw);
    font-size: 0.76rem;
  }
`;

const SelectionCards = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 860px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    gap: 0.5rem;
  }
`;

const SelectionCard = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem;
  border-radius: 16px;
  background: ${({ $active, $accent }) =>
    $active ? `linear-gradient(180deg, ${$accent}18, rgba(255,250,239,0.96))` : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,250,239,0.92))"};
  border: 1px solid ${({ $active, $accent }) => ($active ? `${$accent}66` : "rgba(47, 33, 0, 0.08)")};
  box-shadow: ${({ $active }) => ($active ? "0 8px 20px rgba(28,20,0,0.08)" : "none")};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${({ $accent }) => `${$accent}66`};
  }

  @media (max-width: 640px) {
    gap: 0.55rem;
    padding: 0.65rem 0.75rem;
    border-radius: 14px;
  }
`;

const StatusCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,250,239,0.92));
  border: 1px solid ${({ $ready }) => ($ready ? "rgba(35,165,90,0.28)" : "rgba(47, 33, 0, 0.08)")};

  @media (max-width: 640px) {
    gap: 0.55rem;
    padding: 0.65rem 0.75rem;
    border-radius: 14px;
  }
`;

const SummaryIcon = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 181, 34, 0.16);
  color: #7a4a00;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 1.7rem;
    height: 1.7rem;

    svg {
      width: 0.95rem;
      height: 0.95rem;
    }
  }
`;

const SummaryLabel = styled.div`
  color: rgba(47, 33, 0, 0.65);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SummaryValue = styled.div`
  color: #2f2100;
  font-size: 1rem;
  font-weight: 800;
  margin-top: 0.08rem;

  @media (max-width: 640px) {
    font-size: 0.92rem;
  }
`;

const SummaryHint = styled.div`
  color: rgba(47, 33, 0, 0.65);
  font-size: 0.82rem;
  margin-top: 0.12rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.76rem;
    line-height: 1.25;
  }
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-bottom: 0.8rem;
  color: #5b4520;
  font-size: 0.88rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const ColorDot = styled.div`
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  opacity: 0.78;
`;

const MapWrap = styled.div`
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  margin-bottom: 0.9rem;
`;

const ActionArea = styled.div`
  display: grid;
  gap: 0.55rem;
  margin-bottom: 0.5rem;
`;

const SmallText = styled.div`
  color: #6b5327;
  font-size: 0.88rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;

  @media (max-width: 680px) {
    flex-direction: column;
  }
`;

const GenerateButton = styled.button`
  background-color: #ffb522;
  color: #2f2100;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.95rem;

  &:hover:enabled {
    background-color: #ffc546;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    padding: 0.7rem 0.85rem;
    font-size: 0.9rem;
  }
`;

const SecondaryButton = styled(GenerateButton)`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 181, 34, 0.35);
  color: #7a4a00;

  &:hover:enabled {
    background: #fff4dd;
  }
`;

const SelectionPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.72rem;
  border-radius: 999px;
  background: ${({ $accent }) => `${$accent}1f`};
  border: 1px solid ${({ $accent }) => `${$accent}40`};
  color: #6c4500;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 0.74rem;
    padding: 0.22rem 0.58rem;
  }
`;

const InfoStack = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
  color: #5b4520;
  line-height: 1.45;
`;

const InfoIcon = styled.div`
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 181, 34, 0.16);
  color: #7a4a00;
`;

const TrophyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 0.75rem;
`;

const TrophyCard = styled.div`
  background: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  padding: 0.85rem 0.75rem;
  text-align: center;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  cursor: pointer;
  outline: none;

  &:hover,
  &:focus {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255,181,34,0.18);
    border-color: rgba(255,181,34,0.45);
  }
`;

const TrophyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #d4a017;

  svg {
    width: 1em;
    height: 1em;
    stroke-width: 2.2;
    fill: #f4c542;
    stroke: #b8860b;
  }
`;

const CenteredTrophyIcon = styled(TrophyIcon)`
  width: 100%;
  display: flex;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 0.75rem;
`;

const TrophyName = styled.div`
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2f2100;
`;

const TrophyDate = styled.div`
  font-size: 0.75rem;
  color: rgba(47, 33, 0, 0.6);
`;

const TrophyType = styled.div`
  font-size: 0.68rem;
  text-transform: uppercase;
  font-weight: 800;
  color: ${({ $accent }) => $accent};
  margin-top: 0.28rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.4rem 1.2rem 1.2rem;
  box-shadow: 0 18px 50px rgba(0,0,0,0.18);
  width: min(520px, 100%);
  text-align: left;
`;

const ModalTitle = styled.h2`
  margin: 0 0 1rem;
  color: #2f2100;
  font-size: 1.2rem;
  text-align: center;
`;

const ModalButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: #ffb522;
  color: #2f2100;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #ffc546;
  }
`;
