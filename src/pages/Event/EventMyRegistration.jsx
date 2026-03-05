import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Bike, FileText, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";

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

function formatPace(value) {
  switch (value) {
    case "unter_24":
      return "unter 24 km/h";
    case "24_27":
      return "24-27 km/h";
    case "27_30":
      return "27-30 km/h";
    case "ueber_30":
      return "über 30 km/h";
    default:
      return value || "-";
  }
}

export default function EventMyRegistration() {
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();
  const apiUrl = getApiBaseUrl();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !apiUrl) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${apiUrl}/event2026/me.php`)
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
          setError(err.message);
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
  }, [apiUrl, isLoggedIn, navigate]);

  const handleInviteReissue = async (slotId) => {
    try {
      const res = await fetch(`${apiUrl}/event2026/invite_reissue.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          <Subtle>Status, Teilnehmerplätze und akzeptierte Rechtstextversionen für die Eis-Tour 2026.</Subtle>
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
              <Bike size={20} /> Registrierung
            </h2>
            <p style={{ margin: "0 0 0.4rem" }}>
              Referenzcode: <strong>{data.registration.payment_reference_code}</strong>
            </p>
            <p style={{ margin: "0 0 0.4rem" }}>
              Zahlungsstatus: <Badge>{data.registration.payment_status}</Badge>
            </p>
            <p style={{ margin: 0 }}>Team: <strong>{data.registration.team_name || "-"}</strong></p>
          </Card>
        )}

        {data && data.slots && data.slots.length > 0 && (
          <>
            {data.slots.map((slot) => (
              <Card key={slot.id}>
                <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <UserRound size={18} /> {slot.full_name}
                </h3>
                <p style={{ margin: "0 0 0.4rem" }}>E-Mail: <strong>{slot.email}</strong></p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Lizenzstatus: <Badge>{slot.license_status}</Badge>
                </p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Strecke: <strong>{slot.distance_km} km</strong>, Selbsteinschätzung: <strong>{formatPace(slot.pace_group)}</strong>
                </p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Frauen-Startwelle: <strong>{Number(slot.women_wave_opt_in) === 1 ? "gewünscht" : "nicht gewählt"}</strong>
                </p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Live-Karte Name sichtbar: <strong>{Number(slot.public_name_consent) === 1 ? "Ja" : "Nein"}</strong>
                </p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Trikot-Interesse: <strong>{Number(slot.jersey_interest) === 1 ? `Ja (${slot.jersey_size || "ohne Größe"})` : "Nein"}</strong>
                </p>
                <p style={{ margin: "0 0 0.4rem" }}>
                  Startwelle: <strong>{slot.wave_code || "-"}</strong>
                </p>
                {slot.start_time && (
                  <p style={{ margin: "0 0 0.4rem" }}>
                    Startzeit: <strong>{new Date(slot.start_time).toLocaleString("de-DE")}</strong>
                  </p>
                )}
                <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={16} />
                  Rechtstextversion: <strong>{slot.legal_version}</strong> (akzeptiert am {new Date(slot.legal_accepted_at).toLocaleString("de-DE")})
                </p>
              </Card>
            ))}
          </>
        )}

        {data?.progress && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Checkpoint-Fortschritt</h2>
            <p style={{ margin: "0 0 0.4rem" }}>
              Pflicht-Checkpoints: <strong>{data.progress.mandatory_passed} / {data.progress.mandatory_total}</strong>
            </p>
            <p style={{ margin: 0 }}>
              Finisher: <Badge>{data.progress.is_finisher ? "Ja" : "Nein"}</Badge>
            </p>
          </Card>
        )}

        {data?.invites?.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Invite-Status meiner Team-Slots</h2>
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

        {data?.checkpoints?.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Meine Checkpoints</h2>
            {data.checkpoints.map((cp) => (
              <div key={cp.id} style={{ padding: "0.45rem 0", borderBottom: "1px solid #f3e5bd" }}>
                <strong>{cp.name}</strong>{" "}
                <Badge>{Number(cp.passed) === 1 ? "erfasst" : "offen"}</Badge>
                <div style={{ fontSize: "0.9rem", color: "#7c4f00" }}>
                  {cp.passed_at ? `${new Date(cp.passed_at).toLocaleString("de-DE")} (${cp.source})` : "Noch keine Passage"}
                </div>
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
