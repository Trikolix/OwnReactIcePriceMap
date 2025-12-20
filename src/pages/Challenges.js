import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function Challenges() {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [challenges, setChallenges] = useState([]);
  const [showNewChallengeModal, setShowNewChallengeModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [difficulty, setDifficulty] = useState("leicht");
  const [challengeType, setChallengeType] = useState("daily");
  const [generating, setGenerating] = useState(false);

  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const [mapZoom, setMapZoom] = useState(12);

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

  useEffect(() => {
    let watchId;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      setLoading(false);
      return;
    }

    // Erstversuch: getCurrentPosition mit schnellem Timeout
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLoadingLocation(false);
      },
      (err) => {
        console.warn("Geolocation initial failed:", err);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );

    // Hintergrund: watchPosition läuft weiter, falls Nutzer später Freigabe gibt
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        // optional: nur für Debug
        console.warn("watchPosition error:", err);
      },
      { enableHighAccuracy: false, maximumAge: 0 }
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Lädt die Challenges beim Betreten der Seite
  useEffect(() => {
    if (!isLoggedIn) return;

    // Abruf der Challenges für den eingeloggten User
    fetch(`${apiUrl}/api/challenge_list.php?nutzer_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setChallenges(sortChallenges(data || []));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Challenges:", err);
        setError("Challenges konnten nicht geladen werden.");
        setLoading(false);
      });
  }, [userId, isLoggedIn, apiUrl]);

  // Hilfsfunktion für Sortierung
  const sortChallenges = (challengeList) => {
    const difficultyOrder = { leicht: 0, mittel: 1, schwer: 2 };
    return [...challengeList].sort((a, b) => {
      // Daily vor Weekly
      if (a.type !== b.type) {
        return a.type === "daily" ? -1 : 1;
      }
      // Schwierigkeit leicht < mittel < schwer
      return (difficultyOrder[a.difficulty] ?? 99) - (difficultyOrder[b.difficulty] ?? 99);
    });
  };

  const handleGenerateChallenge = async () => {
    if (!location) {
      alert("Standort konnte nicht ermittelt werden! Für die Generierung einer Challenge wird der Standort benötigt.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("nutzer_id", String(userId));
      form.append("lat", String(location.lat));
      form.append("lon", String(location.lon));
      form.append("difficulty", difficulty);
      form.append("type", challengeType); // ✅ daily/weekly mitgeben

      const res = await fetch(`${apiUrl}/api/challenge_generate.php`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (data.status === "success") {
        const challengeObj = {
          id: data.challenge_id,
          type: data.type,
          difficulty: data.difficulty,
          valid_until: data.valid_until,
          shop_id: data.shop?.id,
          shop_name: data.shop?.name,
          shop_address: data.shop?.adresse || data.shop?.address || ""
        };
        setChallenges((prev) => sortChallenges([...prev, challengeObj]));
        setNewChallenge(challengeObj);
        setShowNewChallengeModal(true);
      } else {
        setError(data.message || data.error || "Challenge konnte nicht erstellt werden.");
      }
    } catch (e) {
      setError("Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRecreateChallenge = async (challengeId, difficulty, type) => {
    setError(null);
    try {
      const form = new FormData();
      form.append("nutzer_id", String(userId));
      form.append("lat", String(location.lat));
      form.append("lon", String(location.lon));
      form.append("challenge_id", String(challengeId));
      form.append("difficulty", difficulty);
      form.append("type", type);


      const res = await fetch(`${apiUrl}/api/challenge_generate.php`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (data.status === "success") {
        setChallenges((prev) => {
          // Alte Challenge rausfiltern
          const withoutOld = prev.filter((c) => c.id !== challengeId);

          if (data.recreated) {
            // Neue (aktualisierte) Challenge hinzufügen
            return sortChallenges([
              ...withoutOld,
              {
                id: data.challenge_id,
                type: data.type,
                difficulty: data.difficulty,
                valid_until: data.valid_until,
                shop_id: data.shop?.id,
                shop_name: data.shop?.name,
                shop_address: data.shop?.adresse || data.shop?.address || "",
                recreated: data.recreated
              }
            ]);
          }

          return withoutOld; // Falls keine neue zurückkommt
        });
      } else {
        setError(data.message || "Challenge konnte nicht erneuert werden.");
      }
    } catch (e) {
      setError("Standort konnte nicht ermittelt werden. Bitte erlaube den Standortzugriff.");
    }
  };


  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "leicht": return "#4caf50"; // grün
      case "mittel": return "#ff9800"; // orange
      case "schwer": return "#f44336"; // rot
      default: return "#9e9e9e";
    }
  };

  const formatCountdown = (validUntil) => {
    const end = new Date(validUntil);
    const now = new Date();
    const diffMs = end - now;

    if (diffMs <= 0) return "Abgelaufen";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}min`;
  };

  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Container>
        <Title>Challenges</Title>

        {/* Modal für neue Challenge */}
        {showNewChallengeModal && newChallenge && (
          <ModalOverlay>
            <ModalBox>
              <h2>Neue Challenge generiert!</h2>
              <ChallengeCard color={getDifficultyColor(newChallenge.difficulty)} style={{ marginBottom: 0 }}>
                <h3>
                  <CleanLink to={`/map/activeShop/${newChallenge.shop_id}`}>{newChallenge.shop_name}</CleanLink>
                </h3>
                <p>{newChallenge.shop_address}</p>
                <DifficultyLabel>
                  {newChallenge.difficulty.toUpperCase()} – {newChallenge.type === "daily" ? "Daily" : "Weekly"}
                </DifficultyLabel>
                <Countdown>
                  Verbleibende Zeit: {formatCountdown(newChallenge.valid_until)}
                </Countdown>
              </ChallengeCard>
              <ModalButton onClick={() => setShowNewChallengeModal(false)}>OK</ModalButton>
            </ModalBox>
          </ModalOverlay>
        )}

        {!isLoggedIn ? (
          <p>Bitte melde dich an, um deine Challenges zu sehen, oder neue zu erhalten.</p>
        ) : (
          <>
            <h3>Aktive Challenges</h3>
            {loading && <p>Lade Challenges...</p>}

            {activeChallenges.length === 0 ? (
              <NoChallenges>Du hast aktuell keine aktiven Challenges.</NoChallenges>
            ) : (
              activeChallenges.map((ch) => (
                <ChallengeCard key={ch.id} color={getDifficultyColor(ch.difficulty)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <DifficultyLabel style={{ color: getDifficultyColor(ch.difficulty) }}>
                      {ch.type === "daily" ? "🕒 Täglich" : "📅 Wöchentlich"} • {ch.difficulty}
                    </DifficultyLabel>
                  </div>

                  <h3 style={{ margin: '10px 0 5px 0' }}>
                    <CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink>
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>{ch.shop_address}</p>

                  <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '15px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Countdown>⏳ {formatCountdown(ch.valid_until)}</Countdown>
                    {!ch.recreated && new Date(ch.valid_until) > new Date() ? (
                      <RecreateButton onClick={() => handleRecreateChallenge(ch.id, ch.difficulty, ch.type)} title="Challenge unmöglich? Einmalig neu generieren!">
                        🔄 Neu generieren
                      </RecreateButton>
                    ) : (
                      <UsedBadge>Bereits neu generiert</UsedBadge>
                    )}
                  </div>
                </ChallengeCard>
              ))
            )}

            <h3>Neue Challenge generieren</h3>
            {error && <ErrorBox>{error}</ErrorBox>}
            {location && (<>
              <LegendContainer>
                <LegendItem>
                  <ColorDot className="green" />
                  <span>Leicht 0-5 km (Grün)</span>
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
                </MapContainer>
              </div>
            </>
            )}

            <SelectionWrapper>
              <SelectBox value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="leicht">Leicht (0–5 km)</option>
                <option value="mittel">Mittel (5–15 km)</option>
                <option value="schwer">Schwer (15–45 km)</option>
              </SelectBox>

              <SelectBox value={challengeType} onChange={(e) => setChallengeType(e.target.value)}>
                <option value="daily">Daily Challenge</option>
                <option value="weekly">Weekly Challenge</option>
              </SelectBox>
              {loadingLocation ? (
                <p>Standort wird geladen...</p>
              ) : (
                <GenerateButton onClick={handleGenerateChallenge} disabled={generating}>
                  {generating ? "Erstelle..." : "Neue Challenge generieren"}
                </GenerateButton>)
              }
            </SelectionWrapper>
            <p>
              Wähle eine Schwierigkeit und Art der Challenge aus und starte eine neue Aufgabe.
              Anhand deines aktuellen Standorts wird eine zufällige Eisdiele in der Nähe ausgewählt, welches es gilt am heutigen Tag oder der aktuellen Woche zu besuchen.
              Daily-Challenges laufen bis Mitternacht, Weekly-Challenges bis Sonntag 23:59 Uhr.<br></br>
              Falls eine Daily-Challenge nach 18 Uhr genereriert wird, gilt diese für den nächsten Tag.<br></br>
              Falls eine Weekly-Challenge an einem Sonntag generiert wird, gilt diese für die nächste Woche.<br></br>
              Sollte eine Challenge nicht innerhalb der Zeitspanne abgeschlossen werden, verfällt diese und du kannst eine neue generieren.
            </p>

            <Explanation>
              Challenges sind zufällige Eisdielen, die du in einem bestimmten Umkreis
              besuchen musst. Für den erfolgreichen Check-In erhältst du Extra-EP und Awards.
              Je schwieriger die Challenge (weiter entfernte Eisdiele), desto mehr Punkte kannst du sammeln.
              Wichtig: der Check-In muss <b>vor Ort (maximal 300m Distanz zur Eisdiele)</b> erfolgen!
            </Explanation>

            {completedChallenges.length > 0 && (
              <>
                <Title>🍦 Deine Erfolge 🍦</Title>
                <TrophyGrid>
                  {completedChallenges.map((ch) => (
                    <TrophyCard key={ch.id}>
                      <TrophyIcon>🏆</TrophyIcon>
                      <TrophyName>{ch.shop_name}</TrophyName>
                      <TrophyDate>{new Date(ch.completed_at).toLocaleDateString()}</TrophyDate>
                      <TrophyType color={getDifficultyColor(ch.difficulty)}>
                        {ch.difficulty}
                      </TrophyType>
                    </TrophyCard>
                  ))}
                </TrophyGrid>
              </>
            )}



          </>
        )}
      </Container>
    </div>
  );
}

export default Challenges;

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
  transition: background-color 0.15s ease;
  &:hover { background-color: #ffcb4c; }

  @media (max-width: 600px) {
    width: 100%;
    font-size: 0.95rem;
    padding: 10px;
  }
`;

const ErrorBox = styled.div`
  color: red;
  margin-bottom: 10px;
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
`;

const TrophyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 5px;
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

  &:hover {
    background: #a37416ff;
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