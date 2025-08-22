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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Container>
        <Title>Challenges</Title>
        <Explanation>
          Challenges sind zufällige Eisdielen, die du in einem bestimmten Umkreis
          besuchen musst. Für den erfolgreichen Check-In erhältst du Extra-EP und Awards.
          Je schwieriger die Challenge (weiter entfernte Eisdiele), desto mehr Punkte kannst du sammeln.
          Wichtig: der Check-In muss <b>vor Ort (maximal 300m Distanz zur Eisdiele)</b> erfolgen!
        </Explanation>

        {!isLoggedIn ? (
          <p>Bitte melde dich an, um deine Favoriten zu sehen.</p>
        ) : (
          <>
            {loading && <p>Lade Challenges...</p>}
            {error && <ErrorBox>{error}</ErrorBox>}
            {challenges.length === 0 && !loading && <p>Noch keine Challenges aktiv.</p>}

            {challenges.length === 0 ? (
              <NoChallenges>Du hast aktuell keine aktiven Challenges.</NoChallenges>
            ) : (
              challenges.map((ch) => (
                <ChallengeCard key={ch.id} color={getDifficultyColor(ch.difficulty)}>
                  <h3><CleanLink to={`/map/activeShop/${ch.shop_id}`}>{ch.shop_name}</CleanLink></h3>
                  <p>{ch.shop_address}</p>
                  <DifficultyLabel>{ch.difficulty.toUpperCase()} – {ch.type === "daily" ? "Daily" : "Weekly"}</DifficultyLabel>
                  <Countdown>Verbleibende Zeit: {formatCountdown(ch.valid_until)}</Countdown>
                </ChallengeCard>
              ))
            )}

            <h3>Neue Challenge generieren</h3>
            <p>
              Wähle eine Schwierigkeit und Art der Challenge aus und starte eine neue Aufgabe.
              Anhand deines aktuellen Standorts wird eine zufällige Eisdiele in der Nähe ausgewählt, welches es gilt am heutigen Tag oder der aktuellen Woche zu besuchen.
              Daily-Challenges laufen bis Mitternacht, Weekly-Challenges bis Sonntag 23:59 Uhr.<br></br>
              Falls eine Daily-Challange nach 18 Uhr genereriert wird, gilt diese für den nächsten Tag.<br></br>
              Falls eine Weekly-Challange an einem Sonntag generiert wird, gilt diese für die nächste Woche.<br></br>
              Sollte eine Challenge nicht innerhalb der Zeitspanne abgeschlossen werden, verfällt diese und du kannst eine neue generieren.
            </p>

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
  height: 100vh;
  max-width: 800px;
  align-self: center;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
`;

const Explanation = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 15px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
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
  padding-bottom: 30px;
`;

const SelectBox = styled.select`
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background: #f8f9fa;
  cursor: pointer;
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
`;


const ErrorBox = styled.div`
  color: red;
  margin-bottom: 10px;
`;