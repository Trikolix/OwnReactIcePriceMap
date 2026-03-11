import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import { EVENT_PAYMENT_CONTACT_EMAIL, EVENT_PAYMENT_PAYPAL_ADDRESS, EVENT_PAYMENT_PAYPAL_URL, EVENT_START_FINISH, getClothingLabel, getRouteLabel } from "./eventConfig";

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
const PayPalLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0070ba;
  color: #fff;
  border-radius: 6px;
  padding: 0.7em 1.1em;
  font-size: 0.98rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: 0.7rem;
`;

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

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
    if (!registrationId || !API_BASE) return;
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
        if (!cancelled) setSummary(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unbekannter Fehler");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [API_BASE, authToken, registrationId, summaryToken]);

  const accountCreatedInFlow = Boolean(stateData?.account_created_in_flow);
  const verificationMailSent = stateData?.account_verification_mail_sent;
  const purchasedVouchers = summary?.gift_vouchers || [];
  const voucherRedemption = stateData?.voucher_redemption || null;

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Anmeldung erfolgreich</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Du erhältst eine E-Mail mit Zahlungsanleitung und Referenzcode. Gekaufte Gutschein-Codes werden erst nach bestätigter Zahlung freigeschaltet.
          </p>
          <p style={{ margin: "0.55rem 0 0", color: "#7c4f00" }}>
            Start und Ziel sind bei <strong>{EVENT_START_FINISH.name}</strong>, {EVENT_START_FINISH.fullAddress}.
          </p>
        </Card>

        {accountCreatedInFlow && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Account bestätigen</h2>
            <p style={{ margin: 0, color: "#7c4f00", lineHeight: 1.5 }}>
              Für diese Anmeldung wurde ein neuer Ice-App Account erstellt. Die Bestätigung erfolgt ausschließlich über den Link in deiner E-Mail.
            </p>
            <p style={{ margin: "0.7rem 0 0", color: "#7c4f00" }}>
              {verificationMailSent ? "Der Bestätigungslink wurde per E-Mail verschickt." : "Bitte prüfe dein Postfach."}
            </p>
          </Card>
        )}

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {summary && (
          <>
            <Card>
              <h2 style={{ marginTop: 0 }}>Zahlungsübersicht</h2>
              <p>Referenzcode: <strong>{summary.registration.payment_reference_code}</strong></p>
              <p>Zahlungsstatus: <Badge>{summary.registration.payment_status}</Badge></p>
              <p>Eigene Startgebühr: <strong>{formatEuro(summary.registration.entry_fee_amount)}</strong></p>
              {Number(summary.registration.gift_voucher_purchase_amount || 0) > 0 && (
                <p>Geschenk-Codes: <strong>{formatEuro(summary.registration.gift_voucher_purchase_amount)}</strong></p>
              )}
              {Number(summary.registration.voucher_discount_amount || 0) > 0 && (
                <p>Gutschein-Abzug: <strong>-{formatEuro(summary.registration.voucher_discount_amount)}</strong></p>
              )}
              {Number(summary.registration.donation_amount || 0) > 0 && (
                <p>Zusätzlicher Betrag: <strong>{formatEuro(summary.registration.donation_amount)}</strong></p>
              )}
              <p>Betrag gesamt: <strong>{formatEuro(summary.payment?.expected_amount)}</strong></p>
              <p style={{ marginBottom: 0 }}>
                Bitte wenn möglich per PayPal Freunde an <strong><a href={EVENT_PAYMENT_PAYPAL_URL} target="_blank" rel="noreferrer">
                  {EVENT_PAYMENT_PAYPAL_ADDRESS}
                </a></strong> senden. Falls du kein PayPal hast, sende eine Mail an <a href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}`}>{EVENT_PAYMENT_CONTACT_EMAIL}</a> und wir finden eine andere Lösung.
              </p>
              <PayPalLinkButton href={EVENT_PAYMENT_PAYPAL_URL} target="_blank" rel="noreferrer">
                Direkt per PayPal zahlen
              </PayPalLinkButton>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Starterplatz</h2>
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

            {voucherRedemption && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Eingelöster Gutschein</h2>
                <p style={{ marginBottom: 0 }}>
                  Der Gutschein-Code <strong>{voucherRedemption.code}</strong> wurde erfolgreich eingelöst und hat <strong>{formatEuro(voucherRedemption.discount_amount)}</strong> Startgebühr abgedeckt.
                </p>
              </Card>
            )}

            {Number(summary.registration.gift_voucher_quantity || 0) > 0 && purchasedVouchers.length === 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Geschenk-Codes</h2>
                <p style={{ marginBottom: 0 }}>
                  Du hast <strong>{summary.registration.gift_voucher_quantity}</strong> Geschenk-Code{Number(summary.registration.gift_voucher_quantity) === 1 ? "" : "s"} gekauft. Die konkreten Codes werden nach bestätigter Zahlung freigeschaltet und erscheinen dann in `Meine Anmeldung`.
                </p>
              </Card>
            )}

            {purchasedVouchers.length > 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Deine Geschenk-Codes</h2>
                {purchasedVouchers.map((voucher) => (
                  <div key={voucher.id} style={{ marginBottom: 8 }}>
                    <strong>{voucher.code}</strong>
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
