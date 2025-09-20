import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";

function Challenges() {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [difficulty, setDifficulty] = useState("leicht");
  const [challengeType, setChallengeType] = useState("daily");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Abruf der Challenges für den eingeloggten User
    fetch(`${apiUrl}/api/challenge_list.php?nutzer_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Challenges:", err);
        setError("Challenges konnten nicht geladen werden.");
        setLoading(false);
      });
  }, [userId, isLoggedIn, apiUrl]);

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("Geolocation nicht unterstützt.");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err.message)
      );
    });
  };

  const handleGenerateChallenge = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { lat, lon } = await getUserLocation();
      const form = new FormData();
      form.append("nutzer_id", String(userId));
      form.append("lat", String(lat));
      form.append("lon", String(lon));
      form.append("difficulty", difficulty);
      form.append("type", challengeType); // ✅ daily/weekly mitgeben

      const res = await fetch(`${apiUrl}/api/challenge_generate.php`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (data.status === "success") {
        // Erwartete Felder: challenge_id, type, difficulty, valid_until, shop{...}
        setChallenges((prev) => [
          ...prev,
          {
            id: data.challenge_id,
            type: data.type,
            difficulty: data.difficulty,
            valid_until: data.valid_until,
            shop_id: data.shop?.id,
            shop_name: data.shop?.name,
            shop_address: data.shop?.adresse || data.shop?.address || ""
          },
        ]);
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
      const { lat, lon } = await getUserLocation();
      const form = new FormData();
      form.append("nutzer_id", String(userId));
      form.append("lat", String(lat));
      form.append("lon", String(lon));
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
            return [
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
            ];
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
                  <h3>
                    <CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink>
                  </h3>
                  <p>{ch.shop_address}</p>
                  <DifficultyLabel>
                    {ch.difficulty.toUpperCase()} – {ch.type === "daily" ? "Daily" : "Weekly"}
                  </DifficultyLabel>
                  <Countdown>
                    Verbleibende Zeit: {formatCountdown(ch.valid_until)}
                  </Countdown>

                  {/* Recreate Button anzeigen, wenn erlaubt */}
                  {(!ch.recreated && new Date(ch.valid_until) > new Date()) ? (
                    <RecreateWrapper>
                      <span>Challenge unmöglich?</span>
                      <RecreateButton onClick={() => handleRecreateChallenge(ch.id, ch.difficulty, ch.type)}>
                        🔄 Challenge neu generieren
                      </RecreateButton>
                    </RecreateWrapper>
                  ): (<RecreateWrapper>
                      <span>Challenges können nur einmal neu erzeugt werden.</span>
                    </RecreateWrapper>)}
                </ChallengeCard>
              ))
            )}



            {completedChallenges.length > 0 && (
              <>
                <h3>Abgeschlossene Challenges</h3>
                {completedChallenges.map((ch) => (
                  <ChallengeCard key={ch.id} color={getDifficultyColor(ch.difficulty)}>
                    <CardContent>
                      <div>
                        <h3><CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink></h3>
                        <p>{ch.shop_address}</p>
                        <DifficultyLabel>{ch.difficulty.toUpperCase()} – {ch.type === "daily" ? "Daily" : "Weekly"}</DifficultyLabel>
                        <Countdown>Abgeschlossen am: {ch.completed_at ? new Date(ch.completed_at).toLocaleString() : "–"}</Countdown>
                      </div>
                      <Trophy>🏆</Trophy>
                    </CardContent>
                  </ChallengeCard>
                ))}
              </>
            )}

            <h3>Neue Challenge generieren</h3>
            {error && <ErrorBox>{error}</ErrorBox>}

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
              <GenerateButton onClick={handleGenerateChallenge} disabled={generating}>
                {generating ? "Erstelle..." : "Neue Challenge generieren"}
              </GenerateButton>

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

          </>
        )}
      </Container>
    </div>
  );
}

export default Challenges;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;


const Container = styled.div`
  padding: 1rem;
  background-color: white;
  min-height: 100vh;
  width: 100%;
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
  background: #fff;
  border-left: 8px solid ${(props) => props.color || "#ccc"};
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);

  @media (max-width: 600px) {
    padding: 12px;
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
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: #339af0;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  &:hover {
    background: #236eacff;
  }

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

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const Trophy = styled.div`
  font-size: 46px;
  margin-left: 10px;
`;

const RecreateWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: small;
  color: gray;
  gap: 8px; /* Abstand zwischen Text und Button */
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