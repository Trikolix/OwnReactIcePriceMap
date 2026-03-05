import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  background: #ffb522;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default function EventInviteClaim() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();
  const API_BASE = getApiBaseUrl();

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !API_BASE) return;

    let canceled = false;
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/event2026/invite_claim.php?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Invite-Status konnte nicht geladen werden.");
        }
        if (!canceled) {
          setData(json);
        }
      })
      .catch((err) => {
        if (!canceled) {
          setError(err.message || "Unbekannter Fehler");
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [API_BASE, token]);

  const doClaim = async () => {
    if (!isLoggedIn) {
      const fullName = data?.slot_preview?.full_name || "";
      navigate(`/register?eventClaimToken=${encodeURIComponent(token)}&eventFullName=${encodeURIComponent(fullName)}`);
      return;
    }

    try {
      setClaiming(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/event2026/invite_claim.php?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Claim fehlgeschlagen.");
      }

      setSuccess(json.message || "Starterplatz erfolgreich geclaimt.");
      setData((prev) =>
        prev
          ? {
              ...prev,
              token_status: {
                ...prev.token_status,
                claimed: true,
                can_claim: false,
              },
            }
          : prev
      );
    } catch (err) {
      setError(err.message || "Claim fehlgeschlagen");
    } finally {
      setClaiming(false);
    }
  };

  const canClaim = data?.token_status?.can_claim;

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Starterplatz übernehmen</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Über diesen Link kannst du einen Event-Starterplatz mit deinem Account verknüpfen.
          </p>
        </Card>

        {loading && (
          <Card>
            <p style={{ margin: 0 }}>Status wird geladen…</p>
          </Card>
        )}

        {error && (
          <Card>
            <p style={{ margin: 0, color: "#9f1239" }}>{error}</p>
          </Card>
        )}

        {data && (
          <Card>
            <p>
              Teilnehmer: <strong>{data.slot_preview?.full_name}</strong>
            </p>
            <p>
              Distanz: <strong>{data.slot_preview?.distance_km} km</strong>
            </p>
            <p>
              Zahlungsstatus: <strong>{data.slot_preview?.payment_status}</strong>
            </p>
            <p>
              Token gültig bis: <strong>{new Date(data.token_status?.expires_at).toLocaleString("de-DE")}</strong>
            </p>
            {!success && (
              <Button disabled={!canClaim || claiming} onClick={doClaim}>
                {!isLoggedIn ? "Einloggen/Registrieren und claimen" : claiming ? "Claim läuft…" : "Starterplatz claimen"}
              </Button>
            )}
            {success && <p style={{ marginTop: 10, color: "#166534" }}>{success}</p>}
          </Card>
        )}
      </Container>
      <Footer />
    </Page>
  );
}
