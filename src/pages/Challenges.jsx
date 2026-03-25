import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Trophy as TrophyGlyph } from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";

import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icons for each difficulty
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DIFFICULTIES = ["leicht", "mittel", "schwer"];
const CHALLENGE_TYPES = ["daily", "weekly"];
const difficultyOrder = { leicht: 0, mittel: 1, schwer: 2 };

const toNumberOrNull = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sortChallenges = (challengeList) =>
  [...challengeList].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "daily" ? -1 : 1;
    }
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

  if (!res.ok) {
    throw new Error(getApiMessage(data, `HTTP ${res.status}`));
  }

  return data;
}

function Challenges() {
  const [selectedTrophy, setSelectedTrophy] = useState(null);
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdownNowTs(Date.now());
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);
  useEffect(() => {
    switch (difficulty) {
      case "leicht":
        setMapZoom(11);
        break;
      case "mittel":
        setMapZoom(10);
        break;
      case "schwer":
        setMapZoom(8);
        break;
      default:
        setMapZoom(11);
    }
  }, [difficulty]);

  // Hilfs-Komponente, um den Zoom dynamisch zu setzen
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
      map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.8,
      });
    }, [target, map]);
    return null;
  }

  useEffect(() => {
    let watchId;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      setLoadingLocation(false);
      setLocationNotice({
        type: "error",
        message: "Dein Browser unterstützt keinen Standortzugriff. Challenges können ohne Standort nicht generiert werden.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLoadingLocation(false);
        setLocationNotice(null);
      },
      (err) => {
        console.warn("Geolocation initial failed:", err);
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
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocationNotice(null);
      },
      (err) => {
        console.warn("watchPosition error:", err);
      },
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
        if (!Array.isArray(data)) {
          throw new Error(getApiMessage(data, "Ungültige Antwort beim Laden der Challenges."));
        }
        if (isCancelled) return;
        setChallenges(sortChallenges(data.map(normalizeChallenge).filter(Boolean)));
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Fehler beim Laden der Challenges:", err);
        if (!isCancelled) {
          setLoadError(err.message || "Challenges konnten nicht geladen werden.");
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

  useEffect(() => {
    if (showNewChallengeModal) {
      newChallengeModalButtonRef.current?.focus();
    }
  }, [showNewChallengeModal]);

  useEffect(() => {
    if (selectedTrophy) {
      trophyModalButtonRef.current?.focus();
    }
  }, [selectedTrophy]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (selectedTrophy) {
        setSelectedTrophy(null);
        return;
      }
      if (showNewChallengeModal) {
        setShowNewChallengeModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTrophy, showNewChallengeModal]);

  const setMapFocusToChallenge = (challenge) => {
    if (challenge?.shop_lat == null || challenge?.shop_lon == null) return;
    setMapFocusTarget({
      lat: challenge.shop_lat,
      lon: challenge.shop_lon,
      key: `${challenge.id}-${Date.now()}`,
    });
  };

  const setActionMessage = (type, message, details = []) => {
    setActionNotice({ type, message, details: Array.isArray(details) ? details : [] });
  };

  const buildChallengeRequest = async ({ requestedDifficulty, requestedType, existingChallengeId = null }) => {
    if (!location) {
      throw new Error("Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff.");
    }
    if (!userId || !apiUrl) {
      throw new Error("Nutzer oder API-Konfiguration fehlt.");
    }

    const form = new FormData();
    form.append("nutzer_id", String(userId));
    form.append("lat", String(location.lat));
    form.append("lon", String(location.lon));
    form.append("difficulty", requestedDifficulty);
    form.append("type", requestedType);
    if (existingChallengeId != null) {
      form.append("challenge_id", String(existingChallengeId));
    }

    const res = await fetch(`${apiUrl}/api/challenge_generate.php`, {
      method: "POST",
      body: form,
    });

    const data = await readJsonResponse(res);
    if (data.status !== "success") {
      throw new Error(getApiMessage(data, "Challenge konnte nicht erstellt werden."));
    }

    const normalized = normalizeChallenge(data);
    if (!normalized || normalized.id == null) {
      throw new Error("Challenge wurde erstellt, aber die Server-Antwort ist unvollständig.");
    }

    return { data, challenge: normalized };
  };

  const handleGenerateChallenge = async () => {
    if (!location) {
      setActionMessage(
        "error",
        "Standort konnte nicht ermittelt werden. Für die Generierung einer Challenge wird dein Standort benötigt."
      );
      return;
    }

    setGenerating(true);
    setActionNotice(null);

    try {
      const { challenge } = await buildChallengeRequest({
        requestedDifficulty: difficulty,
        requestedType: challengeType,
      });

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
      setActionMessage(
        "error",
        "Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff, um Challenges zu generieren."
      );
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
          const { challenge } = await buildChallengeRequest({
            requestedDifficulty: combo.difficulty,
            requestedType: combo.type,
          });
          createdChallenges.push(challenge);
        } catch (error) {
          failedMessages.push(`${combo.difficulty}/${combo.type}: ${error.message || "Unbekannter Fehler"}`);
        }
      }

      if (createdChallenges.length > 0) {
        setChallenges((prev) =>
          createdChallenges.reduce((acc, challenge) => upsertChallenge(acc, challenge), prev)
        );
        setMapFocusToChallenge(createdChallenges[createdChallenges.length - 1]);
      }

      if (createdChallenges.length > 0 && failedMessages.length === 0) {
        setActionMessage("success", `${createdChallenges.length} Challenge(s) erfolgreich erstellt.`);
      } else if (createdChallenges.length > 0 && failedMessages.length > 0) {
        setActionMessage(
          "info",
          `${createdChallenges.length} Challenge(s) erstellt, ${failedMessages.length} fehlgeschlagen.`,
          failedMessages
        );
      } else {
        setActionMessage("error", "Keine Challenge konnte erstellt werden.", failedMessages);
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleRecreateChallenge = async (challengeId, difficulty, type) => {
    if (!location) {
      setActionMessage(
        "error",
        "Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff für einen Neuversuch."
      );
      return;
    }

    setRecreatingChallengeId(challengeId);
    setActionNotice(null);

    try {
      const { challenge } = await buildChallengeRequest({
        requestedDifficulty: difficulty,
        requestedType: type,
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
      <NoticeBox
        key={`${keyPrefix}-${notice.type}-${notice.message}`}
        $type={notice.type || "info"}
        role={notice.type === "error" ? "alert" : "status"}
        aria-live={notice.type === "error" ? "assertive" : "polite"}
      >
        <NoticeMessage>{notice.message}</NoticeMessage>
        {Array.isArray(notice.details) && notice.details.length > 0 && (
          <NoticeList>
            {notice.details.map((line, index) => (
              <li key={`${keyPrefix}-detail-${index}`}>{line}</li>
            ))}
          </NoticeList>
        )}
      </NoticeBox>
    );
  };


  const getDifficultyColor = (difficultyValue) => {
    switch (difficultyValue) {
      case "leicht":
        return "#4caf50";
      case "mittel":
        return "#ff9800";
      case "schwer":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
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

  const activeChallenges = useMemo(
    () => sortChallenges(challenges.filter((challenge) => !challenge.completed)),
    [challenges]
  );

  const completedChallenges = useMemo(
    () =>
      challenges
        .filter((challenge) => challenge.completed)
        .sort((a, b) => {
          const dateA = new Date(a.completed_at || 0);
          const dateB = new Date(b.completed_at || 0);
          return dateB - dateA;
        }),
    [challenges]
  );

  const missingCombinations = useMemo(() => {
    const existing = new Set(activeChallenges.map((challenge) => `${challenge.difficulty}|${challenge.type}`));
    const missing = [];
    for (const d of DIFFICULTIES) {
      for (const t of CHALLENGE_TYPES) {
        if (!existing.has(`${d}|${t}`)) {
          missing.push({ difficulty: d, type: t });
        }
      }
    }
    return missing;
  }, [activeChallenges]);

  const selectedCombinationExists = activeChallenges.some(
    (challenge) => challenge.difficulty === difficulty && challenge.type === challengeType
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container>
        <Title>Challenges</Title>

        {showNewChallengeModal && newChallenge && (
          <ModalOverlay onClick={() => setShowNewChallengeModal(false)}>
            <ModalBox
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-challenge-modal-title"
            >
              <h2 id="new-challenge-modal-title">Neue Challenge generiert!</h2>
              <ChallengeCard color={getDifficultyColor(newChallenge.difficulty)} style={{ marginBottom: 0 }}>
                <h3>
                  <CleanLink to={`/map/activeShop/${newChallenge.shop_id}`}>{newChallenge.shop_name}</CleanLink>
                </h3>
                <p>{newChallenge.shop_address}</p>
                <DifficultyLabel>
                  {String(newChallenge.difficulty || "").toUpperCase()} - {newChallenge.type === "daily" ? "Daily" : "Weekly"}
                </DifficultyLabel>
                <Countdown>Verbleibende Zeit: {formatCountdown(newChallenge.valid_until)}</Countdown>
                {newChallenge.shop_lat != null && newChallenge.shop_lon != null && (
                  <Countdown>Marker wurde direkt auf der Karte aktualisiert.</Countdown>
                )}
              </ChallengeCard>
              <ModalButton ref={newChallengeModalButtonRef} onClick={() => setShowNewChallengeModal(false)}>
                OK
              </ModalButton>
            </ModalBox>
          </ModalOverlay>
        )}

        {!isLoggedIn ? (
          <p>Bitte melde dich an, um deine Challenges zu sehen, oder neue zu erhalten.</p>
        ) : (
          <>
            <h3>Aktive Challenges</h3>
            {loadError && renderNotice({ type: "error", message: loadError }, "load-error")}
            {loading ? (
              <p>Lade Challenges...</p>
            ) : activeChallenges.length === 0 ? (
              <NoChallenges>Du hast aktuell keine aktiven Challenges.</NoChallenges>
            ) : (
              activeChallenges.map((ch) => {
                const isExpired = new Date(ch.valid_until) <= new Date();
                const canRecreate = !ch.recreated && !isExpired;
                const isRecreatingThis =
                  recreatingChallengeId != null && String(recreatingChallengeId) === String(ch.id);

                return (
                  <ChallengeCard key={ch.id} color={getDifficultyColor(ch.difficulty)}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <DifficultyLabel style={{ color: getDifficultyColor(ch.difficulty) }}>
                        {ch.type === "daily" ? "Täglich" : "Wöchentlich"} - {ch.difficulty}
                      </DifficultyLabel>
                      {isRecreatingThis && <UsedBadge>Wird neu generiert...</UsedBadge>}
                    </div>

                    <h3 style={{ margin: "10px 0 5px 0" }}>
                      <CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink>
                    </h3>
                    <p style={{ color: "#666", fontSize: "0.9rem" }}>{ch.shop_address}</p>

                    <hr style={{ border: "none", borderBottom: "1px solid #eee", margin: "15px 0" }} />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Countdown>{formatCountdown(ch.valid_until)}</Countdown>
                      {canRecreate ? (
                        <RecreateButton
                          onClick={() => handleRecreateChallenge(ch.id, ch.difficulty, ch.type)}
                          title="Challenge unmöglich? Einmalig neu generieren."
                          disabled={isRecreatingThis || generating || bulkGenerating || !location}
                        >
                          {isRecreatingThis ? "Erstelle neu..." : "Neu generieren"}
                        </RecreateButton>
                      ) : (
                        <UsedBadge>{ch.recreated ? "Bereits neu generiert" : "Nicht mehr verfügbar"}</UsedBadge>
                      )}
                    </div>
                  </ChallengeCard>
                );
              })
            )}

            <h3>Neue Challenge generieren</h3>
            {renderNotice(locationNotice, "location")}
            {renderNotice(actionNotice, "action")}

            {location && (
              <>
                <LegendContainer>
                  <LegendItem>
                    <ColorDot className="green" />
                    <span>Leicht 0-5 km (Gruen)</span>
                  </LegendItem>
                  <LegendItem>
                    <ColorDot className="yellow" />
                    <span>Mittel 5-15 km (Gelb)</span>
                  </LegendItem>
                  <LegendItem>
                    <ColorDot className="orange" />
                    <span>Schwer 15-45 km (Orange)</span>
                  </LegendItem>
                </LegendContainer>
                <div style={{ marginBottom: 20 }}>
                  <MapContainer
                    center={[location.lat, location.lon]}
                    zoom={mapZoom}
                    style={{ height: "300px", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <SetMapZoom zoom={mapZoom} />
                    <FlyToMapTarget target={mapFocusTarget} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[location.lat, location.lon]}>
                      <Popup>Dein Standort</Popup>
                    </Marker>
                    <Circle
                      center={[location.lat, location.lon]}
                      radius={5000}
                      pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.2 }}
                    />
                    <Circle
                      center={[location.lat, location.lon]}
                      radius={15000}
                      pathOptions={{ color: "#eab308", fillColor: "#eab308", fillOpacity: 0.15 }}
                    />
                    <Circle
                      center={[location.lat, location.lon]}
                      radius={45000}
                      pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.1 }}
                    />
                    {activeChallenges.map((ch, idx) => {
                      const lat = toNumberOrNull(
                        ch.shop_lat ?? ch.shop?.lat ?? ch.shop?.shop_lat ?? ch.shop?.latitude
                      );
                      const lon = toNumberOrNull(
                        ch.shop_lon ?? ch.shop?.lon ?? ch.shop?.shop_lon ?? ch.shop?.longitude
                      );
                      let icon = greenIcon;
                      if (ch.difficulty === "mittel") icon = yellowIcon;
                      else if (ch.difficulty === "schwer") icon = orangeIcon;
                      if (lat == null || lon == null) return null;
                      return (
                        <Marker key={ch.id || idx} position={[lat, lon]} icon={icon}>
                          <Popup>
                            <b>{ch.shop_name}</b><br />
                            {ch.shop_address}
                            <br />{ch.difficulty} - {ch.type === "daily" ? "Daily" : "Weekly"}
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </>
            )}

            <SelectionWrapper>
              <SelectBox value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="leicht">Leicht (0-5 km)</option>
                <option value="mittel">Mittel (5-15 km)</option>
                <option value="schwer">Schwer (15-45 km)</option>
              </SelectBox>

              <SelectBox value={challengeType} onChange={(e) => setChallengeType(e.target.value)}>
                <option value="daily">Daily Challenge</option>
                <option value="weekly">Weekly Challenge</option>
              </SelectBox>
              {loadingLocation ? (
                <p>Standort wird geladen...</p>
              ) : (
                <>
                  <GenerateButton
                    onClick={handleGenerateChallenge}
                    disabled={generating || bulkGenerating || selectedCombinationExists || !location}
                    title={!location ? "Standortzugriff erforderlich" : undefined}
                  >
                    {generating
                      ? "Erstelle..."
                      : !location
                        ? "Standort erforderlich"
                        : selectedCombinationExists
                          ? "Du hast bereits eine solche Challenge"
                          : "Neue Challenge generieren"}
                  </GenerateButton>
                  <GenerateButton
                    onClick={handleGenerateAllMissing}
                    disabled={generating || bulkGenerating || !location || missingCombinations.length === 0}
                    title="Generiert alle noch fehlenden Kombinationen aus Schwierigkeit und Typ"
                  >
                    {bulkGenerating
                      ? "Generiere..."
                      : !location
                        ? "Standort erforderlich"
                        : missingCombinations.length === 0
                          ? "Alle Kombinationen sind bereits aktiv"
                          : "Alle fehlenden Challenges generieren"}
                  </GenerateButton>
                </>
              )}
            </SelectionWrapper>
            <p>
              Wähle eine Schwierigkeit und Art der Challenge aus und starte eine neue Aufgabe.
              Anhand deines aktuellen Standorts wird eine zufällige Eisdiele in der Nähe ausgewählt, welches es gilt am heutigen Tag oder der aktuellen Woche zu besuchen.
              Daily-Challenges laufen bis Mitternacht, Weekly-Challenges bis Sonntag 23:59 Uhr.<br />
              Falls eine Daily-Challenge nach 18 Uhr generiert wird, gilt diese für den nächsten Tag.<br />
              Falls eine Weekly-Challenge an einem Sonntag generiert wird, gilt diese für die nächste Woche.<br />
              Sollte eine Challenge nicht innerhalb der Zeitspanne abgeschlossen werden, verfaellt diese und du kannst eine neue generieren.
            </p>

            <Explanation>
              Challenges sind zufällige Eisdielen, die du in einem bestimmten Umkreis besuchen musst.
              Für den erfolgreichen Check-In erhältst du Extra-EP und Awards.
              Je schwieriger die Challenge (weiter entfernte Eisdiele), desto mehr Punkte kannst du sammeln.
              Wichtig: der Check-In muss <b>vor Ort (maximal 300m Distanz zur Eisdiele)</b> erfolgen!
            </Explanation>

            {completedChallenges.length > 0 && (
              <>
                <Title>Deine Erfolge</Title>
                <TrophyGrid>
                  {completedChallenges.map((ch) => (
                    <TrophyCard
                      key={ch.id}
                      onClick={() => setSelectedTrophy(ch)}
                      onKeyDown={(event) => handleTrophyKeyDown(event, ch)}
                      tabIndex={0}
                      role="button"
                      title="Mehr Infos anzeigen"
                    >
                      <TrophyIcon>
                        <TrophyGlyph aria-hidden="true" />
                      </TrophyIcon>
                      <TrophyName>{ch.shop_name}</TrophyName>
                      <TrophyDate>{new Date(ch.completed_at).toLocaleDateString()}</TrophyDate>
                      <TrophyType color={getDifficultyColor(ch.difficulty)}>
                        {ch.difficulty}
                      </TrophyType>
                    </TrophyCard>
                  ))}
                </TrophyGrid>
                {selectedTrophy && (
                  <ModalOverlay onClick={() => setSelectedTrophy(null)}>
                    <ModalBox
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="trophy-modal-title"
                    >
                      <h2 id="trophy-modal-title">Challenge-Details</h2>
                      <TrophyIcon style={{ fontSize: "3rem" }}>
                        <TrophyGlyph aria-hidden="true" />
                      </TrophyIcon>
                      <h3 style={{ margin: "10px 0 5px 0" }}>{selectedTrophy.shop_name}</h3>
                      <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: 8 }}>{selectedTrophy.shop_address}</p>
                      <TrophyType color={getDifficultyColor(selectedTrophy.difficulty)}>
                        {String(selectedTrophy.difficulty || "").toUpperCase()} - {selectedTrophy.type === "daily" ? "Daily" : "Weekly"}
                      </TrophyType>
                      <TrophyDate>Abgeschlossen am: {selectedTrophy.completed_at ? new Date(selectedTrophy.completed_at).toLocaleString() : "-"}</TrophyDate>
                      <ModalButton ref={trophyModalButtonRef} onClick={() => setSelectedTrophy(null)} style={{ marginTop: 18 }}>
                        Schliessen
                      </ModalButton>
                    </ModalBox>
                  </ModalOverlay>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

export default Challenges;

const NoticeBox = styled.div`
  margin-bottom: 10px;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid transparent;
  background: ${({ $type }) =>
    $type === "error"
      ? "#ffe9e9"
      : $type === "success"
        ? "#e8f7ec"
        : "#eef5ff"};
  border-color: ${({ $type }) =>
    $type === "error"
      ? "#f5b5b5"
      : $type === "success"
        ? "#b9e0c3"
        : "#bfd6ff"};
  color: ${({ $type }) =>
    $type === "error"
      ? "#8b1e1e"
      : $type === "success"
        ? "#185c2b"
        : "#1e3f7a"};
`;

const NoticeMessage = styled.div`
  font-size: 0.95rem;
  line-height: 1.35;
`;

const NoticeList = styled.ul`
  margin: 6px 0 0 18px;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1.3;
`;
// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px 24px 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  min-width: 320px;
  max-width: 90vw;
  text-align: center;
`;

const ModalButton = styled.button`
  margin-top: 18px;
  padding: 10px 28px;
  background: #ffb522;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #ffcb4c; }
`;

const UsedBadge = styled.span`
  font-size: 0.7rem;
  color: #ccc;
  font-style: italic;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;


const Container = styled.div`
  padding: 1rem;
  background-color: white;
  min-height: 100vh;
  max-width: 800px;  /* Desktop: breite Mitte */
  margin: 0 auto;    /* zentriert das Ganze */

  @media (max-width: 600px) {
    max-width: 95%;   /* Text läuft nicht bis zum Rand */
    padding: 0.8rem;  /* kleineres Padding für Handy */
  }
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;

  @media (max-width: 600px) {
    font-size: 1.25rem;
  }
`;

const Explanation = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.4;
  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const NoChallenges = styled.div`
  font-size: 16px;
  color: #555;
  text-align: center;
  margin-top: 20px;
`;

const ChallengeCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid #eee;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);

  /* Der farbige Akzent als dezenter Glow oben */
  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: ${props => props.color};
  }
`;

const DifficultyLabel = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
`;

const Countdown = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 5px;
`;

const SelectionWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
`;

const SelectBox = styled.select`
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background: #f8f9fa;
  cursor: pointer;

  @media (max-width: 600px) {
    font-size: 0.9rem;
    padding: 8px 12px;
  }

  &:focus {
    outline: none;
    border-color: #339af0;
    box-shadow: 0 0 0 2px rgba(51, 154, 240, 0.25);
  }
`;

const GenerateButton = styled.button`
  background-color: #ffb522;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.15s ease, opacity 0.15s;
  &:hover:enabled {
    background-color: #ffcb4c;
  }
  &:disabled {
    opacity: 0.55;
    background-color: #ffb522;
    color: #fff;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (max-width: 600px) {
    width: 100%;
    font-size: 0.95rem;
    padding: 10px;
  }
`;


// Trophäen-Gitter für abgeschlossene Challenges
const TrophyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding-bottom: 15px;
`;

const TrophyCard = styled.div`
  background: #fafafa;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: transform 0.13s, box-shadow 0.13s, border-color 0.13s;
  outline: none;
  &:hover, &:focus {
    transform: scale(1.045) translateY(-2px);
    box-shadow: 0 6px 24px rgba(255,181,34,0.18), 0 2px 8px rgba(0,0,0,0.08);
    border-color: #ffb522;
    z-index: 2;
  }
`;

const TrophyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 5px;
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

const TrophyName = styled.div`
  font-size: 0.85rem;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrophyDate = styled.div`
  font-size: 0.7rem;
  color: #999;
`;

const TrophyType = styled.div`
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 800;
  color: ${props => props.color};
  margin-top: 4px;
`;

const RecreateButton = styled.button`
  padding: 6px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: #ffb522;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  &:hover:enabled {
    background: #a37416ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ColorDot = styled.div`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  opacity: 0.7;
  
  &.green {
    background-color: #22c55e;
  }
  
  &.yellow {
    background-color: #eab308;
  }
  
  &.orange {
    background-color: #f97316;
  }
`;
