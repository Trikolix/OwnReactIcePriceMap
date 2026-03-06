import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Bike, CreditCard, UserRound, MapPinned, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";

const DISTANCE_OPTIONS = [
  { value: 140, label: "140 km / 1.600 hm (3 Eis-Stopps)" },
  { value: 175, label: "175 km / 1.950 hm (4 Eis-Stopps)" },
];

const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: var(--event-bg);
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.2rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin: 0 0 0.8rem;
  font-size: clamp(1.4rem, 2vw, 1.9rem);
  color: #2f2100;
`;

const Subtle = styled.p`
  color: #7c4f00;
  margin: 0;
`;

const Badge = styled.span`
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: #fff3c2;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.85rem;
`;

const StatusBox = styled.div`
  border-radius: 10px;
  border: 1px solid #ffd77a;
  background: #fff7e5;
  color: #7c4f00;
  padding: 0.9rem;
  margin-top: 0.8rem;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

function paymentStatusLabel(value) {
  switch (value) {
    case "paid":
      return "Bezahlt";
    case "partially_paid":
      return "Teilweise bezahlt";
    case "cancelled":
      return "Storniert";
    default:
      return "Offen";
  }
}

function paymentMethodLabel(value) {
  switch (value) {
    case "paypal_friends":
      return "PayPal Freunde";
    case "bank_transfer":
      return "Überweisung";
    default:
      return "-";
  }
}

function formatEuro(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} EUR`;
}

export default function EventMyRegistration() {
  const navigate = useNavigate();
  const { isLoggedIn, authToken, userId } = useUser();
  const apiUrl = getApiBaseUrl();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distanceDraft, setDistanceDraft] = useState({});
  const [savingSlotId, setSavingSlotId] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState("");

  const loadData = async ({ silent = false } = {}) => {
    if (!isLoggedIn || !apiUrl) return;

    if (!silent) setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/event2026/me.php`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const json = await res.json();

      if (res.status === 403) {
        localStorage.removeItem("event2026_has_registration");
        navigate("/event-registration");
        return;
      }
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Daten konnten nicht geladen werden.");
      }

      setData(json);
      localStorage.setItem("event2026_has_registration", "1");
      setDistanceDraft(
        (json.slots || []).reduce((acc, slot) => {
          acc[slot.id] = Number(slot.distance_km || 140);
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiUrl, authToken, isLoggedIn]);

  const ownSlot = useMemo(() => {
    if (!data?.slots?.length) return null;
    return data.slots.find((slot) => Number(slot.user_id) === Number(userId)) || data.slots[0];
  }, [data, userId]);

  const handleInviteReissue = async (slotId) => {
    try {
      const res = await fetch(`${apiUrl}/event2026/invite_reissue.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ slot_id: slotId }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Invite-Link konnte nicht erzeugt werden.");
      }
      const fullLink = `${window.location.origin}/#/event-invite/${json.token}`;
      await navigator.clipboard.writeText(fullLink);
      alert(`Neuer Invite-Link wurde erzeugt und in die Zwischenablage kopiert:\n${fullLink}`);
    } catch (err) {
      alert(err.message || "Fehler beim Erzeugen des Invite-Links");
    }
  };

  const saveDistance = async (slotId) => {
    const newDistance = Number(distanceDraft[slotId] || 140);
    setSavingSlotId(slotId);
    setDistanceInfo("");

    try {
      const res = await fetch(`${apiUrl}/event2026/update_distance.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ slot_id: slotId, distance_km: newDistance }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Strecke konnte nicht aktualisiert werden.");
      }

      setDistanceInfo("Deine Strecke wurde aktualisiert.");
      await loadData({ silent: true });
    } catch (err) {
      setDistanceInfo(err.message || "Fehler beim Aktualisieren der Strecke.");
    } finally {
      setSavingSlotId(null);
    }
  };

  const paymentStatus = data?.registration?.payment_status || data?.payment?.status || "pending";
  const paymentOpen = paymentStatus !== "paid";

  return (
    <PageWrapper>
      <Header />
      <Container>
        <Card>
          <Title>Meine Event-Anmeldung</Title>
          <Subtle>Hier siehst du nur die Informationen, die für dich jetzt wichtig sind.</Subtle>
        </Card>

        {!isLoggedIn && (
          <Card>
            <Subtle>Bitte einloggen, um deine Anmeldung zu sehen.</Subtle>
          </Card>
        )}

        {loading && (
          <Card>
            <Subtle>Daten werden geladen…</Subtle>
          </Card>
        )}

        {error && (
          <Card>
            <Subtle style={{ color: "#9f1239" }}>⚠️ {error}</Subtle>
          </Card>
        )}

        {data?.registration && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={20} /> Zahlung & Freigabe
            </h2>
            <Row>
              <span>Referenzcode: <strong>{data.registration.payment_reference_code}</strong></span>
              <Badge>{paymentStatusLabel(paymentStatus)}</Badge>
            </Row>
            <p style={{ margin: "0.5rem 0 0.2rem" }}>
              Betrag: <strong>{formatEuro(data?.payment?.expected_amount)}</strong>
            </p>
            <p style={{ margin: "0.2rem 0" }}>
              Methode: <strong>{paymentMethodLabel(data?.payment?.method)}</strong>
            </p>
            {paymentOpen && (
              <StatusBox>
                <strong>Was du jetzt tun musst:</strong>
                <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
                  <li>Zahlung durchführen ({paymentMethodLabel(data?.payment?.method)}).</li>
                  <li>Als Verwendungszweck den Referenzcode angeben: <strong>{data.registration.payment_reference_code}</strong>.</li>
                  <li>Nach manueller Prüfung wird dein Status auf „bezahlt“ gesetzt.</li>
                </ol>
              </StatusBox>
            )}
          </Card>
        )}

        {ownSlot && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPinned size={20} /> Deine Strecke
            </h2>
            <p style={{ margin: "0 0 0.6rem" }}>
              Teilnehmer: <strong>{ownSlot.full_name}</strong>
            </p>
            <select
              value={distanceDraft[ownSlot.id] ?? Number(ownSlot.distance_km)}
              onChange={(e) => setDistanceDraft((prev) => ({ ...prev, [ownSlot.id]: Number(e.target.value) }))}
              style={{ width: "100%", maxWidth: 540, padding: "0.55rem", borderRadius: 8, border: "1px solid #ffd77a" }}
            >
              {DISTANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => saveDistance(ownSlot.id)}
                disabled={savingSlotId === ownSlot.id || Number(distanceDraft[ownSlot.id]) === Number(ownSlot.distance_km)}
              >
                {savingSlotId === ownSlot.id ? "Speichern…" : "Strecke speichern"}
              </button>
            </div>
            {distanceInfo && <p style={{ marginTop: 8, color: "#7c4f00" }}>{distanceInfo}</p>}
          </Card>
        )}

        {data?.progress && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={20} /> Fortschritt
            </h2>
            <p style={{ margin: "0 0 0.4rem" }}>
              Pflicht-Checkpoints: <strong>{data.progress.mandatory_passed} / {data.progress.mandatory_total}</strong>
            </p>
            <p style={{ margin: 0 }}>
              Finisher-Status: <Badge>{data.progress.is_finisher ? "Ja" : "Noch nicht"}</Badge>
            </p>
          </Card>
        )}

        {data?.invites?.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Bike size={20} /> Team-Invite-Links
            </h2>
            <Subtle style={{ marginBottom: 10 }}>Offene Teamplätze kannst du hier erneut als Link erzeugen.</Subtle>
            {data.invites.map((invite) => (
              <div key={invite.slot_id} style={{ padding: "0.45rem 0", borderBottom: "1px solid #f3e5bd" }}>
                <strong>{invite.full_name}</strong>{" "}
                <Badge>{Number(invite.user_id) > 0 || Number(invite.claimed) === 1 ? "geclaimt" : "offen"}</Badge>
                <div style={{ fontSize: "0.9rem", color: "#7c4f00", marginTop: 4 }}>
                  {invite.latest_expires_at ? `Aktueller Token gültig bis ${new Date(invite.latest_expires_at).toLocaleString("de-DE")}` : "Noch kein aktiver Token"}
                </div>
                {Number(invite.user_id) === 0 && (
                  <button style={{ marginTop: 6 }} onClick={() => handleInviteReissue(invite.slot_id)}>
                    Invite-Link neu erzeugen
                  </button>
                )}
              </div>
            ))}
          </Card>
        )}

        {data && (!data.slots || data.slots.length === 0) && !loading && !error && (
          <Card>
            <Subtle>Für deinen Account wurde noch keine Event-Anmeldung gefunden.</Subtle>
          </Card>
        )}
      </Container>
      <Footer />
    </PageWrapper>
  );
}
