import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import {
  EVENT_COMMUNITY_RIDE_CLAIM,
  EVENT_ENTRY_FEE_NOTICE,
  EVENT_ORGANIZER_COUNTRY,
  EVENT_ORGANIZER_FULL_ADDRESS,
  EVENT_ORGANIZER_NAME,
  EVENT_PAYMENT_CONTACT_EMAIL,
  EVENT_PAYMENT_PROVIDER_NAME,
  EVENT_START_FINISH,
  EVENT_WITHDRAWAL_NOTICE,
  getClothingLabel,
  getRouteLabel,
  getRouteTheme,
} from "./eventConfig";

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
const PaymentLinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0070ba;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.7em 1.1em;
  font-size: 0.98rem;
  font-weight: 600;
  margin-top: 0.7rem;
  cursor: pointer;
`;
const RoutePill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  border: 1px solid ${({ $border }) => $border};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-weight: 800;
  font-size: 0.8rem;
  margin-right: 0.45rem;
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const startStripeCheckout = async () => {
    if (!API_BASE || !registrationId) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/event2026/stripe_checkout_session.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          registration_id: registrationId,
          ...(summaryToken ? { summary_token: summaryToken } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok || json.status !== "success" || !json.checkout_url) {
        throw new Error(json.message || "Stripe-Checkout konnte nicht gestartet werden.");
      }
      window.location.href = json.checkout_url;
    } catch (err) {
      setError(err.message || "Stripe-Checkout konnte nicht gestartet werden.");
      setCheckoutLoading(false);
    }
  };

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Verbindliche Anmeldung erfolgreich gespeichert</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Deine Anmeldung wurde verbindlich erfasst. Du erhältst eine E-Mail mit Referenzcode, Übersicht zum Teilnahmebeitrag und Hinweisen zur Zahlung über {EVENT_PAYMENT_PROVIDER_NAME}.
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
              <p>Eigener Teilnahmebeitrag: <strong>{formatEuro(summary.registration.entry_fee_amount)}</strong></p>
              {Number(summary.registration.gift_voucher_purchase_amount || 0) > 0 && (
                <p>Zusätzliche Gutschein-Codes: <strong>{formatEuro(summary.registration.gift_voucher_purchase_amount)}</strong></p>
              )}
              {Number(summary.registration.voucher_discount_amount || 0) > 0 && (
                <p>Gutschein-Abzug: <strong>-{formatEuro(summary.registration.voucher_discount_amount)}</strong></p>
              )}
              {Number(summary.registration.donation_amount || 0) > 0 && (
                <p>Zusätzlicher Betrag: <strong>{formatEuro(summary.registration.donation_amount)}</strong></p>
              )}
              <p>Betrag gesamt: <strong>{formatEuro(summary.payment?.expected_amount)}</strong></p>
              <p>
                Bitte den Teilnahmebeitrag über <strong>{EVENT_PAYMENT_PROVIDER_NAME}</strong> mit deinem Referenzcode zahlen. Falls es Probleme gibt, sende eine Mail an <a href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}`}>{EVENT_PAYMENT_CONTACT_EMAIL}</a>.
              </p>
              <p style={{ color: "#7c4f00" }}>{EVENT_COMMUNITY_RIDE_CLAIM} {EVENT_ENTRY_FEE_NOTICE}</p>
              <p style={{ marginBottom: 0, color: "#7c4f00" }}>
                Anbieter: <strong>{EVENT_ORGANIZER_NAME}</strong>, {EVENT_ORGANIZER_FULL_ADDRESS}, {EVENT_ORGANIZER_COUNTRY}. {EVENT_WITHDRAWAL_NOTICE}
              </p>
              <PaymentLinkButton type="button" onClick={startStripeCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? "Weiterleitung..." : `Direkt mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
              </PaymentLinkButton>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Teilnahmeplatz</h2>
              {summary.slots.map((slot) => (
                <div key={slot.id} style={{ padding: "0.45rem 0", borderBottom: "1px solid #f3e5bd" }}>
                  <strong>{slot.full_name}</strong>{" "}
                  <RoutePill
                    $bg={getRouteTheme(slot.route_key).background}
                    $border={getRouteTheme(slot.route_key).border}
                    $color={getRouteTheme(slot.route_key).text}
                  >
                    {slot.route_name || getRouteLabel(slot.route_key)}
                  </RoutePill>
                  ({slot.distance_km} km) - <Badge>{slot.license_status}</Badge>
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
                  Der Gutschein-Code <strong>{voucherRedemption.code}</strong> wurde erfolgreich eingelöst und hat <strong>{formatEuro(voucherRedemption.discount_amount)}</strong> Teilnahmebeitrag abgedeckt.
                </p>
              </Card>
            )}

            {Number(summary.registration.gift_voucher_quantity || 0) > 0 && purchasedVouchers.length === 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Zusätzliche Gutschein-Codes</h2>
                <p style={{ marginBottom: 0 }}>
                  Du hast <strong>{summary.registration.gift_voucher_quantity}</strong> zusätzliche Gutschein-Code{Number(summary.registration.gift_voucher_quantity) === 1 ? "" : "s"} mitbestellt. Die konkreten Codes werden nach bestätigter Zahlung freigeschaltet und erscheinen dann in `Meine Anmeldung`.
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
