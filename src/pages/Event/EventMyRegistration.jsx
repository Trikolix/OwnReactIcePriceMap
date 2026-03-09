import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Bike, CalendarDays, CheckCircle2, CreditCard, MapPinned, QrCode, Route, Shirt, TimerReset, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { getClothingLabel, getPaceLabel, getRouteLabel } from "./eventConfig";

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
  line-height: 1.45;
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

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  border: 1px solid #f0d79a;
  border-radius: 10px;
  background: #fff7e5;
  padding: 0.85rem;
`;

const List = styled.ul`
  margin: 0.6rem 0 0;
  padding-left: 1.2rem;
  color: #7c4f00;
`;

const CheckpointGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 1fr;
  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const CheckpointCard = styled.div`
  border-radius: 10px;
  border: 1px solid ${({ passed }) => (passed ? "#86efac" : "#f0d79a")};
  background: ${({ passed }) => (passed ? "#f0fdf4" : "#fffdf7")};
  padding: 0.9rem;
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

  useEffect(() => {
    if (!isLoggedIn || !apiUrl) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${apiUrl}/event2026/me.php`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 403) {
          localStorage.removeItem("event2026_has_registration");
          navigate("/event-registration");
          return;
        }
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Daten konnten nicht geladen werden.");
        }
        if (!cancelled) {
          setData(json);
          localStorage.setItem("event2026_has_registration", "1");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unbekannter Fehler");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authToken, isLoggedIn, navigate]);

  const ownSlot = useMemo(() => {
    if (!data?.slots?.length) return null;
    return data.slots.find((slot) => Number(slot.user_id) === Number(userId)) || data.slots[0];
  }, [data, userId]);

  const paymentStatus = data?.registration?.payment_status || data?.payment?.status || "pending";
  const paymentOpen = paymentStatus !== "paid";
  const starterGuide = data?.starter_guide_assets || {};

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

  return (
    <PageWrapper>
      <Header />
      <Container>
        <Card>
          <Title>Meine Event-Anmeldung</Title>
          <Subtle>Dein geschützter Bereich für Zahlung, Starter-Guide, digitale Stempelkarte und alle Eventinfos.</Subtle>
        </Card>

        {!isLoggedIn && (
          <Card>
            <Subtle>Bitte einloggen, um deine Anmeldung zu sehen.</Subtle>
          </Card>
        )}

        {loading && (
          <Card>
            <Subtle>Daten werden geladen...</Subtle>
          </Card>
        )}

        {error && (
          <Card>
            <Subtle style={{ color: "#9f1239" }}>⚠️ {error}</Subtle>
          </Card>
        )}

        {ownSlot && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <UserRound size={20} /> Dein Status
            </h2>
            <StatGrid>
              <StatCard>
                <div style={{ fontSize: 13, color: "#8a5700" }}>Route</div>
                <strong>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</strong>
              </StatCard>
              <StatCard>
                <div style={{ fontSize: 13, color: "#8a5700" }}>Startgruppe / Startmodus</div>
                <strong>{ownSlot.wave_code || (ownSlot.route_type === "family" ? "Eigenes Startfenster" : "Wird noch zugeteilt")}</strong>
              </StatCard>
              <StatCard>
                <div style={{ fontSize: 13, color: "#8a5700" }}>Startzeit</div>
                <strong>{ownSlot.start_time ? new Date(ownSlot.start_time).toLocaleString("de-DE") : "Folgt nach Gruppenbildung"}</strong>
              </StatCard>
              <StatCard>
                <div style={{ fontSize: 13, color: "#8a5700" }}>Bekleidungsinteresse</div>
                <strong>{ownSlot.clothing_interest_label || getClothingLabel(ownSlot.clothing_interest)}</strong>
              </StatCard>
            </StatGrid>
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
            {Number(data?.registration?.donation_amount || 0) > 0 && (
              <p style={{ margin: "0.2rem 0" }}>
                Davon Spende: <strong>{formatEuro(data.registration.donation_amount)}</strong>
              </p>
            )}
            <p style={{ margin: "0.2rem 0" }}>
              Methode: <strong>{paymentMethodLabel(data?.payment?.method)}</strong>
            </p>
            {paymentOpen && (
              <StatusBox>
                <strong>Was du jetzt tun musst:</strong>
                <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
                  <li>Zahlung durchführen ({paymentMethodLabel(data?.payment?.method)}).</li>
                  <li>Den Referenzcode im Betreff oder Verwendungszweck angeben.</li>
                  <li>Nach manueller Prüfung wird deine Anmeldung freigeschaltet.</li>
                </ol>
              </StatusBox>
            )}
          </Card>
        )}

        {ownSlot && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Route size={20} /> Meine Anmeldung
            </h2>
            <List>
              <li>Teilnehmer: <strong>{ownSlot.full_name}</strong></li>
              <li>Gebuchte Route: <strong>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</strong></li>
              <li>Tempo / Startmodus: <strong>{getPaceLabel(ownSlot.pace_group)}</strong></li>
              <li>
                Bekleidungsinteresse: <strong>{ownSlot.clothing_interest_label || getClothingLabel(ownSlot.clothing_interest)}</strong>
                {ownSlot.jersey_size ? `, Trikot ${ownSlot.jersey_size}` : ""}
                {ownSlot.bib_size ? `, Hose ${ownSlot.bib_size}` : ""}
              </li>
              <li>Lizenzstatus: <strong>{ownSlot.license_status}</strong></li>
            </List>
          </Card>
        )}

        {data?.invites?.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Bike size={20} /> Invite-Links für Mitstarter
            </h2>
            <Subtle>Wenn du mehrere Startplätze gekauft hast, kannst du offene Plätze hier erneut als Link erzeugen.</Subtle>
            {data.invites.map((invite) => (
              <div key={invite.slot_id} style={{ padding: "0.55rem 0", borderBottom: "1px solid #f3e5bd" }}>
                <strong>{invite.full_name}</strong> <Badge>{Number(invite.user_id) > 0 || Number(invite.claimed) === 1 ? "geclaimt" : "offen"}</Badge>
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

        {data?.starter_guide_assets && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={20} /> Starter-Guide
            </h2>
            <Subtle>Diese Informationen sind nur für registrierte Starter sichtbar und werden vor dem Event laufend ergänzt.</Subtle>
            <List>
              <li>Roadbook: <strong>{starterGuide.roadbook_status === "placeholder" ? "folgt" : starterGuide.roadbook_status}</strong></li>
              <li>GPX-Datei: <strong>{starterGuide.gpx_status === "placeholder" ? "folgt" : starterGuide.gpx_status}</strong></li>
              <li>Anreise / Abreise: Treffpunkt und finale Hinweise kommen mit der Erinnerungsmail und stehen dann hier.</li>
              <li>Packliste: {(starterGuide.checklist || []).join(", ")}</li>
              <li>Kontakt für Rückfragen: <strong>{starterGuide.contact_email || "event@ice-app.de"}</strong></li>
            </List>
          </Card>
        )}

        {data?.checkpoints?.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <QrCode size={20} /> Digitale Stempelkarte
            </h2>
            <Subtle>
              Zeige an jedem Checkpoint deine digitale Stempelkarte, scanne den QR-Code oder führe einen Vor-Ort-Check-in in der Ice-App aus. Wenn es schnell gehen muss, kannst du den Check-in anlegen und das Foto später im Ziel nachpflegen.
            </Subtle>
            <p style={{ margin: "0.8rem 0 0.4rem" }}>
              Pflicht-Checkpoints: <strong>{data.progress?.mandatory_passed} / {data.progress?.mandatory_total}</strong>{" "}
              <Badge>{data.progress?.is_finisher ? "Finisher" : "noch offen"}</Badge>
            </p>
            <CheckpointGrid>
              {data.checkpoints.map((checkpoint) => (
                <CheckpointCard key={checkpoint.id} passed={checkpoint.passed === 1}>
                  <strong>{checkpoint.name}</strong>
                  <div style={{ marginTop: 6, color: "#7c4f00" }}>
                    {checkpoint.passed ? "Abgehakt" : "Noch offen"}
                    {checkpoint.passed_at ? ` • ${new Date(checkpoint.passed_at).toLocaleString("de-DE")}` : ""}
                  </div>
                  <div style={{ marginTop: 6, color: "#7c4f00", fontSize: 14 }}>
                    Quelle: {checkpoint.source || "Noch kein QR-Scan / Check-in"}
                  </div>
                </CheckpointCard>
              ))}
            </CheckpointGrid>
          </Card>
        )}

        <Card>
          <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <TimerReset size={20} /> Am Eventtag
          </h2>
          <List>
            <li>Ankommen, Startunterlagen bereithalten, ggf. Kaffee oder Notfall-Snack mitnehmen.</li>
            <li>Mit deiner Gruppe oder im Startfenster losfahren und die GPX-Navigation nutzen.</li>
            <li>An jedem Checkpoint Stempelkarte zeigen, QR-Code scannen oder Check-in erfassen.</li>
            <li>Im Ziel erneut QR-Code scannen oder finalen Check-in machen, damit die Runde abgeschlossen ist.</li>
          </List>
        </Card>

        <Card>
          <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <MapPinned size={20} /> Route ändern / Hilfe
          </h2>
          <Subtle>{data?.change_request_contact || "Routewechsel werden im ersten Release nur manuell durch das Orga-Team bearbeitet. Bitte nutze dafür das Kontaktformular."}</Subtle>
        </Card>

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
