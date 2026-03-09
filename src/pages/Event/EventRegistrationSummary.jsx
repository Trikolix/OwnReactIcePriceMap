import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import { getClothingLabel, getRouteLabel } from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 980px);
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
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

export default function EventRegistrationSummary() {
  const API_BASE = getApiBaseUrl();
  const { authToken } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const stateData = useMemo(() => location.state?.registrationResult || null, [location.state]);
  const registrationId = Number(searchParams.get("registrationId") || stateData?.registration_id || 0);
  const summaryToken = searchParams.get("summaryToken") || stateData?.registration_summary_access_token || "";

  useEffect(() => {
    if (!registrationId || !API_BASE) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const query = new URLSearchParams({
      registration_id: String(registrationId),
      ...(summaryToken ? { summary_token: summaryToken } : {}),
    });

    fetch(`${API_BASE}/event2026/registration_summary.php?${query.toString()}`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Zusammenfassung konnte nicht geladen werden.");
        }
        if (!cancelled) {
          setSummary(json);
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
  }, [API_BASE, authToken, registrationId, summaryToken]);

  const inviteSlots = stateData?.participant_slots?.filter((slot) => slot.claim_token_status?.token) || [];

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Anmeldung erfolgreich</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Du erhältst eine E-Mail mit allen weiteren Anweisungen zur Zahlung und den Invite-Links.
          </p>
        </Card>

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {summary && (
          <>
            <Card>
              <h2 style={{ marginTop: 0 }}>Zahlungsübersicht</h2>
              <p>
                Referenzcode: <strong>{summary.registration.payment_reference_code}</strong>
              </p>
              <p>
                Zahlungsstatus: <Badge>{summary.registration.payment_status}</Badge>
              </p>
              <p>
                Betrag: <strong>{Number(summary.payment?.expected_amount || 0).toFixed(2)} EUR</strong>
              </p>
              <p style={{ marginBottom: 0 }}>
                Methode: <strong>{summary.payment?.method || "-"}</strong>
              </p>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Teilnehmer</h2>
              {summary.slots.map((slot) => (
                <div key={slot.id} style={{ padding: "0.45rem 0", borderBottom: "1px solid #f3e5bd" }}>
                  <strong>{slot.full_name}</strong> ({slot.route_name || getRouteLabel(slot.route_key)} / {slot.distance_km} km) - <Badge>{slot.license_status}</Badge>
                  <div style={{ color: "#7c4f00", fontSize: 14, marginTop: 4 }}>
                    Bekleidung: {slot.clothing_interest_label || getClothingLabel(slot.clothing_interest)}
                    {slot.jersey_size ? `, Trikot ${slot.jersey_size}` : ""}
                    {slot.bib_size ? `, Hose ${slot.bib_size}` : ""}
                  </div>
                </div>
              ))}
            </Card>

            {inviteSlots.length > 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Invite-Links für dein Team</h2>
                {inviteSlots.map((slot) => (
                  <div key={slot.slot_id} style={{ marginBottom: 8 }}>
                    <strong>{slot.full_name}</strong>: <a href={`/#/event-invite/${slot.claim_token_status.token}`}>/#/event-invite/{slot.claim_token_status.token}</a>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        <Card>
          <button onClick={() => navigate("/event-me")}>Zu meiner Event-Übersicht</button>
        </Card>
      </Container>
      <Footer />
    </Page>
  );
}
