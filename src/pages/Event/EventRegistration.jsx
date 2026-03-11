import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Bike, Flag, HeartHandshake, PlusCircle, ShieldAlert, Shirt, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LiabilityWaiver from "./LiabilityWaiver";
import JerseyInfoDialog from "./JerseyInfoDialog";
import { useUser } from "../../context/UserContext";
import "../../styles/eventTheme.css";
import { getApiBaseUrl } from "../../shared/api/client";
import {
  CLOTHING_OPTIONS,
  BIB_SIZES,
  EVENT_ENTRY_FEE,
  KIT_DISPLAY_PRICE,
  JERSEY_DISPLAY_PRICE,
  PACE_OPTIONS,
  ROUTE_OPTIONS,
  TSHIRT_SIZES,
  getRouteByKey,
  routeSupportsPace,
} from "./eventConfig";

const createParticipant = () => ({
  name: "",
  email: "",
  routeKey: "classic_3",
  paceGroup: "24_27",
  womenWaveOptIn: false,
  publicNameConsent: true,
  clothingInterest: "none",
  jerseySize: "",
  bibSize: "",
});

const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: var(--event-bg);
  min-height: 100vh;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1140px;
  margin: 0 auto;
  @media (min-width: 1000px) {
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
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
  margin: 0 0 1.25rem;
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
  width: 100%;
  padding: 0.55em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
  min-height: 90px;
  resize: vertical;
  box-sizing: border-box;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.55em 0.8em;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

const RouteGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
`;

const RouteCard = styled.label`
  border: 1px solid ${({ selected }) => (selected ? "#ffb522" : "#f0d79a")};
  background: ${({ selected }) => (selected ? "#fff7e5" : "#fffdfa")};
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: block;
  cursor: pointer;
`;

const Muted = styled.div`
  color: #7c4f00;
  font-size: 0.92rem;
  line-height: 1.45;
`;

export default function EventRegistration() {
  const { username, isLoggedIn, logout, authToken } = useUser();
  const navigate = useNavigate();
  const API_BASE = getApiBaseUrl();

  const [participants, setParticipants] = useState([createParticipant()]);
  const [teamName, setTeamName] = useState("");
  const [registrationNote, setRegistrationNote] = useState("");
  const [donationAmount, setDonationAmount] = useState(0);
  const [newsletter, setNewsletter] = useState(false);
  const [acceptWaiver, setAcceptWaiver] = useState(false);
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
      if (!API_BASE) return;

      setLoadingMeta(true);
      try {
        const res = await fetch(`${API_BASE}/event2026/registrations.php`);
        const data = await res.json();
        if (aborted) return;
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
    if (!isLoggedIn || !accountEmail) return;
    setParticipants((prev) =>
      prev.map((item, idx) => {
        if (idx !== 0 || item.email.trim()) return item;
        return { ...item, email: accountEmail };
      })
    );
  }, [accountEmail, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn || !newAccount.email) return;
    setParticipants((prev) => prev.map((item, idx) => (idx === 0 ? { ...item, email: newAccount.email } : item)));
  }, [isLoggedIn, newAccount.email]);

  const handleParticipantChange = (idx, field, value) => {
    setParticipants((prev) =>
      prev.map((participant, participantIdx) => {
        if (participantIdx !== idx) return participant;
        const next = { ...participant, [field]: value };
        if (field === "routeKey") {
          const route = getRouteByKey(value);
          if (!route.paceEnabled) {
            next.paceGroup = "family";
            next.womenWaveOptIn = false;
          } else if (participant.paceGroup === "family") {
            next.paceGroup = "24_27";
          }
        }
        if (field === "clothingInterest" && value === "none") {
          next.jerseySize = "";
          next.bibSize = "";
        }
        if (field === "clothingInterest" && value === "jersey_interest") {
          next.bibSize = "";
        }
        return next;
      })
    );
  };

  const addParticipant = () => setParticipants((prev) => [...prev, createParticipant()]);
  const removeParticipant = (idx) => setParticipants((prev) => prev.filter((_, participantIdx) => participantIdx !== idx));

  const totalCost = useMemo(() => participants.length * EVENT_ENTRY_FEE + Number(donationAmount || 0), [participants.length, donationAmount]);

  const availableSlots = eventMeta?.available_slots ?? 0;
  const isSoldOut = eventMeta?.event_status === "cancelled" || availableSlots <= 0;
  const hasCapacityForCurrentSelection = availableSlots >= participants.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!API_BASE) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      participants,
      teamName,
      donationAmount,
      newsletter,
      paymentMethodPreference: "paypal_friends",
      registrationNote,
      acceptWaiver,
      acceptLegal: acceptWaiver,
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
    } catch (err) {
      setError(err.message || "Anmeldung konnte nicht gespeichert werden.");
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
            {loadingMeta && <StatusBanner>Eventdaten werden geladen...</StatusBanner>}
            {error && <StatusBanner tone="danger">⚠️ {error}</StatusBanner>}

            {success && (
              <StatusBanner>
                <strong>Anmeldung gespeichert.</strong>
                <div style={{ marginTop: 6 }}>
                  Referenzcode für Zahlung: <strong>{success.payment_reference_code}</strong>
                </div>
                <div style={{ marginTop: 4 }}>{success.payment_instruction}</div>
              </StatusBanner>
            )}

            {eventMeta && (
              <Card>
                <CardTitle>
                  <Flag size={20} /> Eventstatus
                </CardTitle>
                <Flex>
                  <span>Verfügbare Startplätze</span>
                  <span>
                    noch <strong>{eventMeta.available_slots} / {eventMeta.max_participants}</strong>
                  </span>
                </Flex>
                <Muted>
                  Alle drei Routen kosten gleich viel. Startgruppen und Startzeiten werden nach Zahlung und finaler Gruppeneinteilung vergeben.
                </Muted>
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
                <Users /> Registrierung
              </CardTitle>

              {isLoggedIn ? (
                <StatusBanner style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span>
                    Angemeldet als <strong>{username}</strong>.
                  </span>
                  <Button type="button" onClick={logout} style={{ marginTop: 0, background: "#ef4444" }}>
                    Abmelden
                  </Button>
                </StatusBanner>
              ) : (
                <div style={{ marginBottom: "1.5rem" }}>
                  <Muted style={{ marginBottom: "0.8rem" }}>
                    Für Anmeldung, digitale Stempelkarte und Check-ins wird ein Ice-App Account benötigt. Wenn du noch keinen hast, wird er hier direkt angelegt.
                  </Muted>
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
                    <input type="checkbox" checked={acceptAccountTerms} onChange={(e) => setAcceptAccountTerms(e.target.checked)} />
                    <span>
                      Ich akzeptiere die <a href="/#/agb" target="_blank" rel="noreferrer">AGB</a>,{" "}
                      <a href="/#/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> und{" "}
                      <a href="/#/community" target="_blank" rel="noreferrer">Community-Richtlinien</a>.
                    </span>
                  </CheckboxLabel>
                </div>
              )}

              {participants.map((participant, idx) => {
                const selectedRoute = getRouteByKey(participant.routeKey);
                return (
                  <FieldGroup
                    key={idx}
                    style={{ position: "relative", border: "1px solid #ffd77a", borderRadius: 8, padding: 16, marginBottom: 16 }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Teilnehmer {idx + 1}</div>

                    <Label>Vollständiger Name (Echtname)</Label>
                    <Input
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(idx, "name", e.target.value)}
                      placeholder="Max Mustermann"
                      required
                    />

                    <Label>E-Mail-Adresse</Label>
                    <Input
                      value={participant.email}
                      onChange={(e) => handleParticipantChange(idx, "email", e.target.value)}
                      placeholder="max@example.com"
                      type="email"
                      required
                    />

                    <Label>Route</Label>
                    <RouteGrid>
                      {ROUTE_OPTIONS.map((route) => (
                        <RouteCard key={route.key} selected={participant.routeKey === route.key}>
                          <input
                            type="radio"
                            name={`route-${idx}`}
                            checked={participant.routeKey === route.key}
                            onChange={() => handleParticipantChange(idx, "routeKey", route.key)}
                            style={{ marginRight: 10 }}
                          />
                          <strong>{route.label}</strong>
                          <div style={{ marginTop: 4 }}>{route.teaser}</div>
                          <Muted>{route.description}</Muted>
                        </RouteCard>
                      ))}
                    </RouteGrid>

                    {routeSupportsPace(participant.routeKey) ? (
                      <GridRow>
                        <div>
                          <Label>Gewünschtes Tempo</Label>
                          <Select value={participant.paceGroup} onChange={(e) => handleParticipantChange(idx, "paceGroup", e.target.value)}>
                            {PACE_OPTIONS.map((pace) => (
                              <option key={pace.value} value={pace.value}>
                                {pace.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label>Startmodus</Label>
                          <Input value="Gruppeneinteilung nach Strecke und Tempo" disabled />
                        </div>
                      </GridRow>
                    ) : (
                      <StatusBanner style={{ marginBottom: 12 }}>
                        Diese Route bekommt ein eigenes Startfenster ohne sportliche Tempogruppen.
                      </StatusBanner>
                    )}

                    {routeSupportsPace(participant.routeKey) && (
                      <CheckboxLabel>
                        <input
                          type="checkbox"
                          checked={participant.womenWaveOptIn}
                          onChange={(e) => handleParticipantChange(idx, "womenWaveOptIn", e.target.checked)}
                        />
                        <span>Wunsch: separate Frauen-Startwelle (bei ausreichender Anzahl)</span>
                      </CheckboxLabel>
                    )}

                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={participant.publicNameConsent}
                        onChange={(e) => handleParticipantChange(idx, "publicNameConsent", e.target.checked)}
                      />
                      <span>Ich stimme zu, dass Name und Checkpoint-Zeiten auf der öffentlichen Live-Karte sichtbar sind.</span>
                    </CheckboxLabel>

                    <div style={{ border: "1px solid #ffd77a", borderRadius: 8, padding: 12, marginTop: 10, background: "#fffaf0" }}>
                      <Label>Bekleidungsinteresse</Label>
                      <Select
                        value={participant.clothingInterest}
                        onChange={(e) => handleParticipantChange(idx, "clothingInterest", e.target.value)}
                      >
                        {CLOTHING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                            {option.displayPrice ? ` (Richtpreis ${option.displayPrice} EUR)` : ""}
                          </option>
                        ))}
                      </Select>
                      <Muted>
                        Trikot ca. {JERSEY_DISPLAY_PRICE} EUR, Set aus Trikot + Hose ca. {KIT_DISPLAY_PRICE} EUR. Das ist noch keine verbindliche Bestellung und wird nicht mit der Startgebühr eingezogen.
                      </Muted>
                      {participant.clothingInterest !== "none" && (
                        <GridRow style={{ marginTop: 10 }}>
                          <div>
                            <Label>{participant.clothingInterest === "kit_interest" ? "Trikotgröße" : "Trikotgröße"}</Label>
                            <Select
                              value={participant.jerseySize}
                              onChange={(e) => handleParticipantChange(idx, "jerseySize", e.target.value)}
                              required={participant.clothingInterest !== "none"}
                            >
                              <option value="">Bitte wählen</option>
                              {TSHIRT_SIZES.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </Select>
                          </div>
                          {participant.clothingInterest === "kit_interest" && (
                            <div>
                              <Label>Hosengröße</Label>
                              <Select
                                value={participant.bibSize}
                                onChange={(e) => handleParticipantChange(idx, "bibSize", e.target.value)}
                                required={participant.clothingInterest === "kit_interest"}
                              >
                                <option value="">Bitte wählen</option>
                                {BIB_SIZES.map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          )}
                        </GridRow>
                      )}
                    </div>

                    <Muted style={{ marginTop: 10 }}>
                      Routewechsel später bitte nur über das Kontaktformular bzw. das Orga-Team anfragen.
                    </Muted>

                    {idx > 0 && (
                      <RemoveBtn
                        type="button"
                        style={{ position: "absolute", top: 8, right: 8, marginTop: 0 }}
                        onClick={() => removeParticipant(idx)}
                      >
                        <Trash2 size={16} />
                      </RemoveBtn>
                    )}

                    <div style={{ marginTop: 12, fontSize: 13, color: "#8a5700" }}>
                      Gewählte Route: <strong>{selectedRoute.label}</strong>
                    </div>
                  </FieldGroup>
                );
              })}

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
                placeholder="z. B. Rückfragen, Teamhinweise oder Besonderheiten zur Anmeldung"
              />
              <div style={{ fontSize: 12, color: "#8a5700" }}>{registrationNote.length} / 220 Zeichen</div>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CardTitle>
                    <Shirt /> Bekleidung
                  </CardTitle>
                  <Muted style={{ marginBottom: "0.6em" }}>
                    Hier wird nur Interesse gesammelt. Finale Bestellung und Zahlung für Trikot oder Set laufen später separat.
                  </Muted>
                  <JerseyInfoDialog linkOnly={true} />
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle>
                <HeartHandshake /> Spenden für den Elternverein krebskranker Kinder e.V.
              </CardTitle>
              <Muted style={{ marginBottom: "0.8rem" }}>
                Wenn du magst, kannst du bei der Anmeldung direkt einen zusätzlichen Spendenbetrag für den Elternverein krebskranker Kinder e.V. Chemnitz mitgeben.
              </Muted>
              <Label>Zusätzliche Spende (optional)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <Muted>Der Zusatzbetrag wird zur Startgebühr addiert und als Spende ausgewiesen.</Muted>
            </Card>

            <Card>
              <CardTitle>
                <ShieldAlert /> Haftung, Regeln & Kommunikation
              </CardTitle>

              <StatusBanner>
                <strong>Wichtige Regeln:</strong>
                <div style={{ marginTop: 6, lineHeight: 1.45 }}>
                  Teilnahme auf eigene Gefahr und Kosten. StVO ist einzuhalten. Dies ist kein Rennen. Helmpflicht für alle Starter. Am Checkpoint gibt es je eine Kugel gratis, alles Weitere bezahlt jeder selbst.
                </div>
              </StatusBanner>

              <CheckboxLabel>
                <input type="checkbox" checked={acceptWaiver} onChange={(e) => setAcceptWaiver(e.target.checked)} required />
                <span>
                  Ich habe die <LiabilityWaiver /> gelesen und akzeptiere die Teilnahmebedingungen in der aktuellen Version.
                </span>
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
                <span>{participants.length * EVENT_ENTRY_FEE} EUR</span>
              </Flex>
              {Number(donationAmount) > 0 && (
                <Flex>
                  <span>Zusätzliche Spende</span>
                  <span>{Number(donationAmount).toFixed(2)} EUR</span>
                </Flex>
              )}
              <Separator />
              <Flex style={{ fontWeight: 700, fontSize: 18 }}>
                <span>Startgebühr gesamt</span>
                <span>{totalCost} EUR</span>
              </Flex>
              <Muted style={{ marginTop: 8 }}>
                Bekleidungsinteresse ist nicht Teil dieser Zahlung. Nach erfolgreicher Registrierung findest du alle weiteren Schritte in `Meine Anmeldung`.
              </Muted>
              <Button type="submit" disabled={isSubmitting || isSoldOut || !hasCapacityForCurrentSelection}>
                {isSubmitting ? "Speichern..." : "Kostenpflichtig anmelden"}
              </Button>
            </Card>

            <Card>
              <CardTitle>
                <HeartHandshake /> Was danach passiert
              </CardTitle>
              <Muted>
                1. Registrierung und Startgebühr
                <br />
                2. Invite-Links für zusätzliche Startplätze
                <br />
                3. Persönliches Portal mit Route, Startgruppe und Stempelkarte
                <br />
                4. Vor dem Event: Erinnerungsmail und finale Unterlagen
              </Muted>
            </Card>
          </Summary>
        </MainGrid>
      </form>
      <Footer />
    </PageWrapper>
  );
}
