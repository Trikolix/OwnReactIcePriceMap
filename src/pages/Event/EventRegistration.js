import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Bike, Heart, Shirt, ShoppingCart, ShieldAlert, Ticket, Trash2, Users, PlusCircle } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import LiabilityWaiver from "./LiabilityWaiver";
import JerseyInfoDialog from "./JerseyInfoDialog";
import { useUser } from "../../context/UserContext";

const ENTRY_FEE = 15;
const JERSEY_PRICE = 69;
const TSHIRT_SIZES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14"];

const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: #f8fafc;
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
  box-shadow: 0 2px 8px rgba(255,181,34,0.08);
  padding: 2rem;
  margin-bottom: 1.5rem;
`;
const CardTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;
const FieldGroup = styled.div`
  margin-bottom: 1.5rem;
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
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffb522;
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
    top: 5rem;
  }
`;
const Flex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  & > * {
    flex-shrink: 0;
  }
  span:last-child {
    margin-left: auto;
    text-align: right;
    min-width: 60px;
    display: inline-block;
  }
`;
const JerseySelect = styled.select`
  max-width: 120px;
  min-width: 80px;
  flex: 1 1 100px;
  width: auto;
  padding: 0.5em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
`;
const JerseyInput = styled.input`
  width: 80px;
  flex: 0 0 80px;
  margin-bottom: 0;
  padding: 0.5em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
`;
const JerseyRemoveBtn = styled(Button)`
  flex: 0 0 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-top: 0;
`;
const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

export default function EventRegistration() {
  const { userId, username, isLoggedIn, logout, authToken } = useUser();
  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  const [participants, setParticipants] = useState([{ name: "", email: "" }]);
  const [teamName, setTeamName] = useState("");
  const [jerseyOrder, setJerseyOrder] = useState(false);
  const [jerseyOrders, setJerseyOrders] = useState([]);
  const [donation, setDonation] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [acceptWaiver, setAcceptWaiver] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Status für Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoggedIn && username) {
      setParticipants(prev => {
        const newParticipants = [...prev];
        // Wir nehmen an, dass der erste Teilnehmer der eingeloggte User ist
        newParticipants[0] = {
          name: "",
          email: "Eingeloggt (Profil-Email wird genutzt)", // Backend findet Email via userId
          isAutoFilled: true
        };
        return newParticipants;
      });
    } else {
      // Wenn nicht eingeloggt oder ausgeloggt: Ersten Teilnehmer leeren
      setParticipants(prev => {
        const newParticipants = [...prev];
        if (newParticipants[0]?.isAutoFilled) {
          newParticipants[0] = { name: "", email: "", isAutoFilled: false };
        }
        return newParticipants;
      });
    }
  }, [isLoggedIn, username]);

  useEffect(() => {
    let jerseyTotal = jerseyOrders.reduce(
      (sum, order) => sum + (order.quantity || 0) * JERSEY_PRICE,
      0
    );
    setTotalCost(participants.length * ENTRY_FEE + jerseyTotal + Number(donation || 0));
  }, [participants, jerseyOrders, donation]);

  const handleParticipantChange = (idx, field, value) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };
  const addParticipant = () => setParticipants([...participants, { name: "", email: "" }]);
  const removeParticipant = (idx) => setParticipants(participants.filter((_, i) => i !== idx));

  const handleJerseyOrderChange = (idx, field, value) => {
    setJerseyOrders((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o))
    );
  };
  const addJerseyOrder = () => setJerseyOrders([...jerseyOrders, { size: "5", quantity: 1 }]);
  const removeJerseyOrder = (idx) => setJerseyOrders(jerseyOrders.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Payload für das PHP Backend zusammenbauen
    const payload = {
      isLoggedIn,
      registeredByUserId: userId,
      participants,
      teamName,
      jerseyOrders: jerseyOrder ? jerseyOrders : [],
      donation,
      totalCost,
      newsletter
    };

    try {
      const response = await fetch(`${API_BASE}/event/submit_registration.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Falls dein Backend JWT nutzt, Token mitschicken:
          ...(authToken && { "Authorization": `Bearer ${authToken}` })
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === "success") {
        // Hier erfolgt die Weiterleitung zur Zahlung (z.B. PayPal)
        // oder eine Erfolgsmeldung
        console.log("Erfolg:", result.payment_session_id);
        alert("Anmeldung gespeichert! Du wirst nun zur Zahlung weitergeleitet.");
        // window.location.href = `payment_gateway.php?session_id=${result.payment_session_id}`;
      } else {
        throw new Error(result.message || "Fehler beim Speichern");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalJerseyQuantity = jerseyOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

  return (
    <PageWrapper>
      <Header />
      <form onSubmit={handleSubmit}>
        <MainGrid>
          <div>
            {error && (
              <div style={{ color: "red", background: "#fee2e2", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                ⚠️ {error}
              </div>
            )}

            <Card>
              <CardTitle><Users /> Teilnehmer & Team</CardTitle>

              {isLoggedIn ? (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>
                    Angemeldet als <strong>{username}</strong>. Du meldest dich selbst als Teilnehmer 1 an.
                  </span>
                  <Button
                    type="button"
                    onClick={logout}
                    style={{ background: "#ef4444", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                  >
                    Abmelden / Anderer Account
                  </Button>
                </div>
              ) : (
                <div style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                  Bereits einen Account? <a href="/login" style={{ color: "#ffb522" }}>Jetzt einloggen</a>, um deine Daten zu übernehmen.
                </div>
              )}
              {participants.map((p, idx) => (
                <FieldGroup key={idx} style={{ position: "relative", border: "1px solid #ffd77a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Teilnehmer {idx + 1}</div>
                  <Label>Vollständiger Name</Label>
                  <Input value={p.name} onChange={e => handleParticipantChange(idx, "name", e.target.value)} placeholder="Max Mustermann" required />
                  <Label>E-Mail Adresse</Label>
                  <Input value={p.email} onChange={e => handleParticipantChange(idx, "email", e.target.value)} placeholder="max@example.com" type="email" required disabled={p.isAutoFilled} />
                  {idx > 0 && (
                    <RemoveBtn type="button" style={{ position: "absolute", top: 8, right: 8 }} onClick={() => removeParticipant(idx)}>
                      <Trash2 size={16} />
                    </RemoveBtn>
                  )}
                </FieldGroup>
              ))}
              <Button type="button" onClick={addParticipant}><PlusCircle size={18} /> Weiteren Teilnehmer hinzufügen</Button>
              <Separator />
              <Label>Verein / Team (optional)</Label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team Eislover" />
            </Card>

            <Card>
              <CardTitle><Shirt /> Extras</CardTitle>
              <CheckboxLabel>
                <input type="checkbox" checked={jerseyOrder} onChange={e => { setJerseyOrder(e.target.checked); if (e.target.checked && jerseyOrders.length === 0) addJerseyOrder(); }} />
                <JerseyInfoDialog />
              </CheckboxLabel>
              {jerseyOrder && (
                <div style={{ marginLeft: 24 }}>
                  {jerseyOrders.map((order, idx) => (
                    <Flex key={idx} style={{ marginBottom: 8 }}>
                      <JerseySelect
                        value={order.size}
                        onChange={e => handleJerseyOrderChange(idx, "size", e.target.value)}
                      >
                        {TSHIRT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                      </JerseySelect>
                      <JerseyInput
                        type="number"
                        min="1"
                        value={order.quantity}
                        onChange={e => handleJerseyOrderChange(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <JerseyRemoveBtn
                        type="button"
                        onClick={() => removeJerseyOrder(idx)}
                        aria-label="Größe entfernen"
                      >
                        <Trash2 size={16} />
                      </JerseyRemoveBtn>
                    </Flex>
                  ))}
                  <Button type="button" onClick={addJerseyOrder}><PlusCircle size={16} /> Größe hinzufügen</Button>
                </div>
              )}
              <Separator />
              <Label><Heart style={{ color: '#ffb522' }} /> Zusätzlich spenden</Label>
              <Input type="number" min="0" value={donation} onChange={e => setDonation(Number(e.target.value) || 0)} placeholder="0" />
              <div style={{ fontSize: 13, color: '#b48a2c', marginBottom: 8 }}>100% deiner Spende geht an den Verein für krebskranke Kinder e.V.</div>
              <Separator />
              <Label><Ticket style={{ color: '#ffb522' }} /> Gutschein- / Rabattcode</Label>
              <Input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} />
            </Card>

            <Card>
              <CardTitle><ShieldAlert /> Wichtiger Hinweis & Newsletter</CardTitle>
              <CheckboxLabel>
                <input type="checkbox" checked={acceptWaiver} onChange={e => setAcceptWaiver(e.target.checked)} required />
                Ich habe die <LiabilityWaiver />  gelesen und akzeptiere die Bedingungen.
              </CheckboxLabel>
              <CheckboxLabel>
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
                Ja, ich möchte den Newsletter mit Infos zu zukünftigen Events erhalten.
              </CheckboxLabel>
            </Card>
          </div>

          <Summary>
            <Card>
              <CardTitle><ShoppingCart /> Zusammenfassung</CardTitle>
              <Flex>
                <span>Teilnehmer ({participants.length})</span>
                <span>€{participants.length * ENTRY_FEE}</span>
              </Flex>
              {jerseyOrder && totalJerseyQuantity > 0 && (
                <Flex>
                  <span>Trikots ({totalJerseyQuantity})</span>
                  <span>€{totalJerseyQuantity * JERSEY_PRICE}</span>
                </Flex>
              )}
              {jerseyOrder && jerseyOrders.map((order, idx) => (
                order.quantity > 0 &&
                <Flex key={idx} style={{ fontSize: 14, marginLeft: 12 }}>
                  <span>{order.quantity} x Größe {order.size}</span>
                  <span>€{order.quantity * JERSEY_PRICE}</span>
                </Flex>
              ))}
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
              <Button
                type="submit"
                style={{ width: "100%", marginTop: 16 }}
                disabled={!acceptWaiver || isSubmitting}
              >
                {isSubmitting ? "Wird verarbeitet..." : <><Bike style={{ marginRight: 8 }} /> Kostenpflichtig anmelden</>}
              </Button>
            </Card>
          </Summary>
        </MainGrid>
      </form>
      <Footer />
    </PageWrapper>
  );
}
