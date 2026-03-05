import React, { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { Bike, Heart, Shirt, ShieldAlert, Users, PlusCircle, Trash2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LiabilityWaiver from "./LiabilityWaiver";
import JerseyInfoDialog from "./JerseyInfoDialog";
import { useUser } from "../../context/UserContext";
import jerseyImage from "./jersey.png";
import "../../styles/eventTheme.css";
import { getApiBaseUrl } from "../../shared/api/client";

const ENTRY_FEE = 15;
const TSHIRT_SIZES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14"];
const DISTANCE_OPTIONS = [
  { value: 140, label: "140 km / 1.600 hm (3 Eis-Stopps)" },
  { value: 175, label: "175 km / 1.950 hm (4 Eis-Stopps)" },
];
const PACE_OPTIONS = [
  { value: "unter_24", label: "unter 24 km/h" },
  { value: "24_27", label: "24-27 km/h" },
  { value: "27_30", label: "27-30 km/h" },
  { value: "ueber_30", label: "über 30 km/h" },
];

const createParticipant = () => ({
  name: "",
  email: "",
  distance: 140,
  paceGroup: "24_27",
  womenWaveOptIn: false,
  publicNameConsent: true,
  jerseyInterest: false,
  jerseySize: "",
});

const formatLegalContent = (content) =>
  (content || "")
    .replace(/^##\s*/gm, "")
    .replace(/^- /gm, "• ");

const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: var(--event-bg);
  min-height: 100vh;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  @media (min-width: 1000px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 2rem;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const FieldGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 0.3rem;
  display: block;
`;

const Input = styled.input`
  width: 95%;
  padding: 0.5em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
`;

const Textarea = styled.textarea`
  width: 95%;
  padding: 0.6em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
  min-height: 90px;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--event-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6em 1.2em;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #ffcb47;
  }

  &:disabled {
    background: #ffe6a1;
    color: #b48a2c;
    cursor: not-allowed;
  }
`;

const RemoveBtn = styled(Button)`
  background: #fff3c2;
  color: #b48a2c;
  border: 1px solid #ffd77a;

  &:hover {
    background: #ffe6a1;
    color: #b48a2c;
  }
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid #ffd77a;
  margin: 1.5rem 0;
`;

const Summary = styled.div`
  max-height: fit-content;
  @media (min-width: 1000px) {
    position: sticky;
    top: 11rem;
  }
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.97rem;
  margin-bottom: 0.6rem;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const StatusBanner = styled.div`
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: ${({ tone }) => (tone === "danger" ? "#fee2e2" : "#fff7e5")};
  border: 1px solid ${({ tone }) => (tone === "danger" ? "#fecaca" : "#ffd77a")};
  color: ${({ tone }) => (tone === "danger" ? "#9f1239" : "#8a5700")};
`;

function JerseyImageModal() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <img
        src={jerseyImage}
        alt="Radtrikot"
        style={{ maxWidth: 120, cursor: "pointer", marginBottom: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.10)", borderRadius: 10 }}
        onClick={() => setShowModal(true)}
        title="Bild vergrößern"
      />
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fffdfa",
              borderRadius: 12,
              padding: 0,
              maxWidth: 600,
              width: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={jerseyImage}
              alt="Radtrikot groß"
              style={{ width: "100%", height: "auto", maxHeight: "80vh", borderRadius: 12, display: "block" }}
            />
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#ffb522",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "0.4em 1em",
                fontSize: 18,
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function EventRegistration() {
  const { username, isLoggedIn, logout, authToken } = useUser();
  const navigate = useNavigate();
  const API_BASE = getApiBaseUrl();

  const [participants, setParticipants] = useState([createParticipant()]);
  const [teamName, setTeamName] = useState("");
  const [registrationNote, setRegistrationNote] = useState("");
  const [donation, setDonation] = useState(0);
  const [newsletter, setNewsletter] = useState(false);
  const [acceptWaiver, setAcceptWaiver] = useState(false);
  const [acceptEventLegal, setAcceptEventLegal] = useState(false);
  const [acceptAccountTerms, setAcceptAccountTerms] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [eventMeta, setEventMeta] = useState(null);
  const [legal, setLegal] = useState(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let aborted = false;

    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const res = await fetch(`${API_BASE}/event2026/registrations.php`);
        const data = await res.json();
        if (aborted) {
          return;
        }
        if (data.status !== "success") {
          throw new Error(data.message || "Eventdaten konnten nicht geladen werden.");
        }
        setEventMeta(data.event);
        setLegal(data.legal);
        setAccountEmail(data.account?.email || "");
      } catch (err) {
        if (!aborted) {
          setError(err.message || "Eventdaten konnten nicht geladen werden.");
        }
      } finally {
        if (!aborted) {
          setLoadingMeta(false);
        }
      }
    };

    loadMeta();
    return () => {
      aborted = true;
    };
  }, [API_BASE]);

  useEffect(() => {
    if (!isLoggedIn || !accountEmail) {
      return;
    }
    setParticipants((prev) =>
      prev.map((item, idx) => {
        if (idx !== 0) return item;
        if (item.email && item.email.trim() !== "") return item;
        return { ...item, email: accountEmail };
      })
    );
  }, [accountEmail, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn || !newAccount.email) {
      return;
    }
    setParticipants((prev) =>
      prev.map((item, idx) => (idx === 0 ? { ...item, email: newAccount.email } : item))
    );
  }, [isLoggedIn, newAccount.email]);

  const handleParticipantChange = (idx, field, value) => {
    setParticipants((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const next = { ...p, [field]: value };
        if (field === "jerseyInterest" && !value) {
          next.jerseySize = "";
        }
        return next;
      })
    );
  };

  const addParticipant = () => setParticipants((prev) => [...prev, createParticipant()]);
  const removeParticipant = (idx) => setParticipants((prev) => prev.filter((_, i) => i !== idx));

  const totalCost = useMemo(() => participants.length * ENTRY_FEE + Number(donation || 0), [participants.length, donation]);

  const availableSlots = eventMeta?.available_slots ?? 0;
  const isSoldOut = eventMeta?.event_status === "cancelled" || availableSlots <= 0;
  const hasCapacityForCurrentSelection = availableSlots >= participants.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      participants,
      teamName,
      newsletter,
      paymentMethodPreference: "paypal_friends",
      registrationNote,
      acceptWaiver,
      acceptLegal: acceptEventLegal,
      legalVersion: legal?.version ?? null,
      account: !isLoggedIn
        ? {
          username: newAccount.username,
          email: newAccount.email,
          password: newAccount.password,
          acceptedTerms: acceptAccountTerms,
        }
        : null,
    };

    try {
      const response = await fetch(`${API_BASE}/event2026/registrations.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        if (result.status === "sold_out") {
          throw new Error("Event ist ausgebucht oder es sind nicht genug freie Plätze verfügbar.");
        }
        throw new Error(result.message || "Fehler beim Speichern");
      }

      setSuccess(result);

      localStorage.setItem("event2026_has_registration", "1");
      const summaryToken = result.registration_summary_access_token
        ? `&summaryToken=${encodeURIComponent(result.registration_summary_access_token)}`
        : "";
      navigate(`/event-registration-summary?registrationId=${result.registration_id}${summaryToken}`, {
        state: { registrationResult: result },
      });

      const refreshRes = await fetch(`${API_BASE}/event2026/registrations.php`);
      const refreshData = await refreshRes.json();
      if (refreshData.status === "success") {
        setEventMeta(refreshData.event);
        setLegal(refreshData.legal);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <Header />
      <form onSubmit={handleSubmit}>
        <MainGrid>
          <div>
            {loadingMeta && <StatusBanner>Eventdaten werden geladen…</StatusBanner>}

            {error && (
              <StatusBanner tone="danger">
                ⚠️ {error}
              </StatusBanner>
            )}

            {success && (
              <StatusBanner>
                <strong>Anmeldung gespeichert.</strong>
                <div style={{ marginTop: 6 }}>
                  Referenzcode für Zahlung: <strong>{success.payment_reference_code}</strong>
                </div>
                <div style={{ marginTop: 4 }}>{success.payment_instruction}</div>
                {Array.isArray(success.participant_slots) && success.participant_slots.some((slot) => slot.claim_token_status?.token) && (
                  <div style={{ marginTop: 10 }}>
                    <strong>Invite-Links für weitere Teilnehmer:</strong>
                    {success.participant_slots
                      .filter((slot) => slot.claim_token_status?.token)
                      .map((slot) => (
                        <div key={slot.slot_id} style={{ marginTop: 6 }}>
                          {slot.full_name}:{" "}
                          <a
                            href={`/#/event-invite/${slot.claim_token_status.token}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#8a5700" }}
                          >
                            /#/event-invite/{slot.claim_token_status.token}
                          </a>
                        </div>
                      ))}
                  </div>
                )}
              </StatusBanner>
            )}

            {eventMeta && (
              <Card>
                <CardTitle>
                  <Flag size={20} /> Eventstatus
                </CardTitle>
                <Flex>
                  <span>Verfügbare Startplätze</span>
                  <span>noch <strong>
                    {eventMeta.max_participants - eventMeta.reserved_slots} / {eventMeta.max_participants}
                  </strong> verfügbar</span>
                </Flex>
                <div style={{ marginTop: 6, color: "#8a5700", fontSize: 14 }}>
                  Maximal 150 Teilnehmer. Bei zu geringer Teilnehmerzahl behalten wir uns eine Absage vor.
                </div>
                {eventMeta.event_status === "cancelled" && (
                  <StatusBanner tone="danger" style={{ marginTop: 12, marginBottom: 0 }}>
                    Das Event wurde abgesagt.
                  </StatusBanner>
                )}
                {!isSoldOut && !hasCapacityForCurrentSelection && (
                  <StatusBanner tone="danger" style={{ marginTop: 12, marginBottom: 0 }}>
                    Für deine aktuelle Teilnehmeranzahl sind nicht genug freie Plätze verfügbar.
                  </StatusBanner>
                )}
              </Card>
            )}

            <Card>
              <CardTitle>
                <Users /> Teilnehmer & Team
              </CardTitle>

              {isLoggedIn ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Angemeldet als <strong>{username}</strong>.
                  </span>
                  <Button
                    type="button"
                    onClick={logout}
                    style={{ background: "#ef4444", fontSize: "0.8rem", padding: "0.4rem 0.8rem", marginTop: 0 }}
                  >
                    Abmelden / Anderer Account
                  </Button>
                </div>
              ) : (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ marginBottom: "0.8rem", fontSize: "0.9rem", color: "#64748b" }}>
                    Mit der Registrierung erstellst du ein Ice-App Account. Dieser wird benötigt um die Checkins bei den Eisdielen / Checkpunkten zu registrieren.
                    <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#7c4f00" }}>
                      Du bist bereits bei der Ice-App registriert? <a href="/#/login" style={{ color: "#ffb522" }}>Hier einloggen</a>.
                    </div>
                  </div>
                  <GridRow>
                    <div>
                      <Label>Benutzername (neu)</Label>
                      <Input
                        value={newAccount.username}
                        onChange={(e) => setNewAccount((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="z. B. EisRider"
                        required={!isLoggedIn}
                      />
                    </div>
                    <div>
                      <Label>E-Mail (Account)</Label>
                      <Input
                        value={newAccount.email}
                        onChange={(e) => setNewAccount((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="du@example.com"
                        type="email"
                        required={!isLoggedIn}
                      />
                    </div>
                  </GridRow>
                  <Label>Passwort (mind. 6 Zeichen)</Label>
                  <Input
                    value={newAccount.password}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="******"
                    type="password"
                    required={!isLoggedIn}
                  />
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={acceptAccountTerms}
                      onChange={(e) => setAcceptAccountTerms(e.target.checked)}
                    />
                    <span>
                      Ich akzeptiere die <a href="/#/agb" target="_blank" rel="noreferrer">AGB</a>,{" "}
                      <a href="/#/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> und{" "}
                      <a href="/#/community" target="_blank" rel="noreferrer">Community-Richtlinien</a>.
                    </span>
                  </CheckboxLabel>
                </div>
              )}

              {participants.map((p, idx) => (
                <FieldGroup key={idx} style={{ position: "relative", border: "1px solid #ffd77a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Teilnehmer {idx + 1}</div>

                  <Label>Vollständiger Name (Echtname)</Label>
                  <Input
                    value={p.name}
                    onChange={(e) => handleParticipantChange(idx, "name", e.target.value)}
                    placeholder="Max Mustermann"
                    required
                  />

                  <Label>E-Mail-Adresse</Label>
                  <Input
                    value={p.email}
                    onChange={(e) => handleParticipantChange(idx, "email", e.target.value)}
                    placeholder="max@example.com"
                    type="email"
                    required
                  />

                  <GridRow>
                    <div>
                      <Label>Strecke</Label>
                      <Select
                        value={p.distance}
                        onChange={(e) => handleParticipantChange(idx, "distance", Number(e.target.value))}
                      >
                        {DISTANCE_OPTIONS.map((distance) => (
                          <option key={distance.value} value={distance.value}>
                            {distance.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Selbsteinschätzung</Label>
                      <Select
                        value={p.paceGroup}
                        onChange={(e) => handleParticipantChange(idx, "paceGroup", e.target.value)}
                      >
                        {PACE_OPTIONS.map((pace) => (
                          <option key={pace.value} value={pace.value}>
                            {pace.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </GridRow>

                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={p.womenWaveOptIn}
                      onChange={(e) => handleParticipantChange(idx, "womenWaveOptIn", e.target.checked)}
                    />
                    <span>Wunsch: separate Frauen-Startwelle (bei ausreichender Anzahl)</span>
                  </CheckboxLabel>

                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={p.publicNameConsent}
                      onChange={(e) => handleParticipantChange(idx, "publicNameConsent", e.target.checked)}
                    />
                    <span>Ich stimme zu, dass Name und Checkpoint-Zeiten auf der Event-Live-Karte sichtbar sind.</span>
                  </CheckboxLabel>

                  <div
                    style={{
                      border: "1px solid #ffd77a",
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 8,
                      background: "#fffaf0",
                    }}
                  >
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={p.jerseyInterest}
                        onChange={(e) => handleParticipantChange(idx, "jerseyInterest", e.target.checked)}
                      />
                      <span>
                        Verbindliches Interesse am Event-Trikot (Richtpreis 75€, ggf. günstiger bei größerer Menge)
                      </span>
                    </CheckboxLabel>

                    {p.jerseyInterest && (
                      <div style={{ marginTop: 8 }}>
                        <Label>Trikotgröße</Label>
                        <Select
                          value={p.jerseySize}
                          onChange={(e) => handleParticipantChange(idx, "jerseySize", e.target.value)}
                          required={p.jerseyInterest}
                        >
                          <option value="">Bitte wählen</option>
                          {TSHIRT_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>

                  {idx > 0 && (
                    <RemoveBtn
                      type="button"
                      style={{ position: "absolute", top: 8, right: 8, marginTop: 0 }}
                      onClick={() => removeParticipant(idx)}
                    >
                      <Trash2 size={16} />
                    </RemoveBtn>
                  )}
                </FieldGroup>
              ))}

              <Button type="button" onClick={addParticipant} disabled={isSoldOut}>
                <PlusCircle size={18} /> Weiteren Teilnehmer hinzufügen
              </Button>

              <Separator />
              <Label>Verein / Team (optional)</Label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Eislover" />
              <Label>Bemerkung an das Orga-Team (optional)</Label>
              <Textarea
                value={registrationNote}
                onChange={(e) => setRegistrationNote(e.target.value)}
                maxLength={220}
                placeholder="z. B. Besonderheiten zur Anmeldung, Teamhinweise, Rückfragen"
              />
              <div style={{ fontSize: 12, color: "#8a5700" }}>
                {registrationNote.length} / 220 Zeichen
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CardTitle>
                    <Shirt /> Trikot-Interesse
                  </CardTitle>
                  <div style={{ marginBottom: "0.6em", color: "#8a5700", fontSize: "0.95rem" }}>
                    Keine direkte Trikot-Bestellung in der Anmeldung. Wir sammeln verbindliches Interesse und melden uns später zur finalen Bestellung.
                  </div>
                  <JerseyInfoDialog linkOnly={true} />
                </div>
                <div style={{ flex: "0 0 auto", textAlign: "right", marginTop: "20px" }}>
                  <JerseyImageModal />
                </div>
              </div>

              <Separator />
              <Label>
                <Heart style={{ color: "#ffb522" }} /> Zusätzlich spenden
              </Label>
              <Input type="number" min="0" value={donation} onChange={(e) => setDonation(Number(e.target.value) || 0)} placeholder="0" />
              <div style={{ fontSize: 13, color: "#b48a2c", marginBottom: 8 }}>
                100% deiner Spende geht an den Elternverein krebskranker Kinder e.V. Chemnitz.
              </div>
            </Card>

            <Card>
              <CardTitle>
                <ShieldAlert /> Haftung, Regeln & Newsletter
              </CardTitle>

              <div
                style={{
                  background: "#fff7e5",
                  border: "1px solid #ffd77a",
                  borderRadius: 8,
                  padding: "0.8rem",
                  marginBottom: "0.9rem",
                  color: "#7c4f00",
                }}
              >
                <strong>Wichtige Regeln:</strong>
                <div style={{ marginTop: 6, lineHeight: 1.45 }}>
                  Teilnahme auf eigene Gefahr und Kosten. StVO ist einzuhalten. Dies ist kein Rennen/keine Zeitfahrveranstaltung.
                  Maximal 150 Teilnehmer. Bei zu geringer Teilnehmerzahl behalten wir uns eine Absage vor.
                </div>
              </div>

              {legal && (
                <div
                  style={{
                    background: "#fffdf7",
                    border: "1px solid #ffe3a2",
                    borderRadius: 8,
                    padding: "0.8rem",
                    marginBottom: "0.9rem",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Rechtstextversion {legal.version}</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.45 }}>{formatLegalContent(legal.content_md)}</div>
                </div>
              )}

              <CheckboxLabel>
                <input type="checkbox" checked={acceptWaiver} onChange={(e) => setAcceptWaiver(e.target.checked)} required />
                <span>
                  Ich habe die <LiabilityWaiver /> gelesen und akzeptiere die Bedingungen.
                </span>
              </CheckboxLabel>

              <CheckboxLabel>
                <input type="checkbox" checked={acceptEventLegal} onChange={(e) => setAcceptEventLegal(e.target.checked)} required />
                <span>Ich akzeptiere die oben angezeigten Teilnahmebedingungen in der aktuellen Version.</span>
              </CheckboxLabel>

              <CheckboxLabel>
                <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                <span>Ja, ich möchte den Newsletter mit Infos zu zukünftigen Events erhalten.</span>
              </CheckboxLabel>
            </Card>
          </div>

          <Summary>
            <Card>
              <CardTitle>
                <Bike /> Zusammenfassung
              </CardTitle>
              <Flex>
                <span>Teilnehmer ({participants.length})</span>
                <span>€{participants.length * ENTRY_FEE}</span>
              </Flex>
              {donation > 0 && (
                <Flex>
                  <span>Spende</span>
                  <span>€{donation}</span>
                </Flex>
              )}
              <Separator />
              <Flex style={{ fontWeight: 700, fontSize: 18 }}>
                <span>Gesamtsumme</span>
                <span>€{totalCost}</span>
              </Flex>
              <div style={{ fontSize: 13, color: "#8a5700", marginTop: 8 }}>
                Die Trikot-Anfrage ist nicht Teil dieser Zahlung.
              </div>
              <Button
                type="submit"
                style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
                disabled={
                  !acceptWaiver
                  || !acceptEventLegal
                  || isSubmitting
                  || isSoldOut
                  || !hasCapacityForCurrentSelection
                  || (!isLoggedIn && (!newAccount.username || !newAccount.email || !newAccount.password || !acceptAccountTerms))
                }
              >
                {isSubmitting ? "Wird verarbeitet..." : "Kostenpflichtig anmelden"}
              </Button>
              {!isLoggedIn && (
                <div style={{ color: "#9f1239", marginTop: 10, fontSize: 14 }}>
                  Für die Anmeldung muss ein Ice-App Account verwendet werden.
                </div>
              )}
            </Card>
          </Summary>
        </MainGrid>
      </form>
      <Footer />
    </PageWrapper>
  );
}
