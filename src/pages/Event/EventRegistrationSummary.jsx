import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 214, 133, 0.35), transparent 34%),
    linear-gradient(180deg, #fffaf0 0%, #fff3da 100%);
`;
const Container = styled.div`
  width: min(96%, 980px);
  margin: 0 auto;
  padding: 1rem 0 1.4rem;
`;
const Card = styled.section`
  background: rgba(255, 253, 247, 0.96);
  border: 1px solid rgba(138, 87, 0, 0.12);
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(72, 45, 0, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
`;
const HeroCard = styled(Card)`
  box-shadow: 0 10px 28px rgba(63, 42, 0, 0.1);
`;
const CardTitle = styled.h2`
  margin: 0 0 0.7rem;
  color: #3a2600;
  font-size: 1.02rem;
`;
const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.24rem 0.62rem;
  background: ${({ $tone }) => ($tone === "success" ? "#dcfce7" : "#fff3c2")};
  color: ${({ $tone }) => ($tone === "success" ? "#166534" : "#8a5700")};
  font-weight: 800;
  font-size: 0.8rem;
`;
const PaymentLinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2f7cc6 0%, #0b5da0 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.72rem 1.1rem;
  font-size: 0.96rem;
  font-weight: 700;
  margin-top: 0.75rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(11, 93, 160, 0.28);

  &:disabled {
    opacity: 0.75;
    cursor: wait;
    box-shadow: none;
  }
`;
const NavLinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff6de;
  color: #6a4300;
  border: 1px solid #efcf84;
  border-radius: 10px;
  padding: 0.72rem 1rem;
  font-size: 0.94rem;
  font-weight: 700;
  text-decoration: none;
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
const FieldList = styled.div`
  display: grid;
  gap: 0.55rem;
`;
const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  border-bottom: 1px dashed rgba(138, 87, 0, 0.2);
  padding-bottom: 0.45rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;
const Label = styled.span`
  color: #7a5200;
`;
const Value = styled.span`
  color: #2d1d00;
  font-weight: 700;
  text-align: right;
`;
const Notice = styled.p`
  margin: 0.75rem 0 0;
  color: #7a5200;
  line-height: 1.5;
`;
const SuccessPanel = styled.div`
  margin-top: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
  color: #14532d;
`;
const SuccessTitle = styled.p`
  margin: 0;
  font-weight: 800;
`;
const SuccessText = styled.p`
  margin: 0.35rem 0 0;
  line-height: 1.5;
`;

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function formatPaymentStatus(status) {
  if (status === "paid") return "Bezahlt";
  if (status === "pending") return "Offen";
  if (status === "partially_paid") return "Teilweise bezahlt";
  if (status === "cancelled") return "Storniert";
  return status || "-";
}

export default function EventRegistrationSummary() {
  const API_BASE = getApiBaseUrl();
  const { authToken } = useUser();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSyncing, setPaymentSyncing] = useState(false);

  const stateData = useMemo(() => location.state?.registrationResult || null, [location.state]);
  const registrationId = Number(searchParams.get("registrationId") || stateData?.registration_id || 0);
  const summaryToken = searchParams.get("summaryToken") || stateData?.registration_summary_access_token || "";
  const checkoutState = searchParams.get("checkout") || "";
  const checkoutSessionId = searchParams.get("session_id") || "";
  const shouldFinalizeStripeCheckout = checkoutState === "success" && checkoutSessionId !== "" && registrationId > 0;

  useEffect(() => {
    if (!registrationId || !API_BASE) return;
    let cancelled = false;
    const loadSummary = async () => {
      setLoading(true);
      setError("");

      try {
        if (shouldFinalizeStripeCheckout) {
          setPaymentSyncing(true);
          const finalizeResponse = await fetch(`${API_BASE}/event2026/stripe_checkout_finalize.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              registration_id: registrationId,
              session_id: checkoutSessionId,
              ...(summaryToken ? { summary_token: summaryToken } : {}),
            }),
          });
          const finalizeJson = await finalizeResponse.json();
          if (!finalizeResponse.ok || finalizeJson.status !== "success") {
            throw new Error(finalizeJson.message || "Stripe-Zahlung konnte nicht bestätigt werden.");
          }
        }

        const query = new URLSearchParams({
          registration_id: String(registrationId),
          ...(summaryToken ? { summary_token: summaryToken } : {}),
        });
        const res = await fetch(`${API_BASE}/event2026/registration_summary.php?${query.toString()}`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Zusammenfassung konnte nicht geladen werden.");
        }
        if (!cancelled) setSummary(json);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unbekannter Fehler");
      } finally {
        if (!cancelled) {
          setPaymentSyncing(false);
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, authToken, checkoutSessionId, registrationId, shouldFinalizeStripeCheckout, summaryToken]);

  const accountCreatedInFlow = Boolean(stateData?.account_created_in_flow);
  const verificationMailSent = stateData?.account_verification_mail_sent;
  const purchasedVouchers = summary?.gift_vouchers || [];
  const voucherRedemption = stateData?.voucher_redemption || null;
  const paymentStatus = summary?.payment?.status || summary?.registration?.payment_status || "";
  const isPaid = paymentStatus === "paid";

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
        <HeroCard>
          <h1 style={{ marginTop: 0 }}>Verbindliche Anmeldung erfolgreich gespeichert</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Deine Anmeldung wurde verbindlich erfasst. Du erhältst eine E-Mail mit Referenzcode, Übersicht zum Teilnahmebeitrag und Hinweisen zur Zahlung über {EVENT_PAYMENT_PROVIDER_NAME}.
          </p>
        </HeroCard>

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

        {loading && <Card>{paymentSyncing ? "Zahlung wird mit Stripe abgeglichen…" : "Daten werden geladen…"}</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {summary && (
          <>
            <Card>
              <CardTitle>Zahlungsübersicht</CardTitle>
              <FieldList>
                <FieldRow>
                  <Label>Referenzcode</Label>
                  <Value>{summary.registration.payment_reference_code}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Zahlungsstatus</Label>
                  <Value><Badge $tone={isPaid ? "success" : undefined}>{formatPaymentStatus(paymentStatus)}</Badge></Value>
                </FieldRow>
                <FieldRow>
                  <Label>Eigener Teilnahmebeitrag</Label>
                  <Value>{formatEuro(summary.registration.entry_fee_amount)}</Value>
                </FieldRow>
                {Number(summary.registration.gift_voucher_purchase_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Zusätzliche Gutschein-Codes</Label>
                    <Value>{formatEuro(summary.registration.gift_voucher_purchase_amount)}</Value>
                  </FieldRow>
                )}
                {Number(summary.registration.voucher_discount_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Gutschein-Abzug</Label>
                    <Value>-{formatEuro(summary.registration.voucher_discount_amount)}</Value>
                  </FieldRow>
                )}
                {Number(summary.registration.donation_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Zusätzlicher Betrag</Label>
                    <Value>{formatEuro(summary.registration.donation_amount)}</Value>
                  </FieldRow>
                )}
                <FieldRow>
                  <Label>Betrag gesamt</Label>
                  <Value>{formatEuro(summary.payment?.expected_amount)}</Value>
                </FieldRow>
              </FieldList>

              {isPaid ? (
                <SuccessPanel>
                  <SuccessTitle>Zahlung erfolgreich bestätigt.</SuccessTitle>
                  <SuccessText>
                    Dein Teilnahmebeitrag wurde verbucht. Deine Anmeldung ist damit vollständig abgeschlossen.
                  </SuccessText>
                  <SuccessText>
                    Falls du zusätzliche Gutschein-Codes mitbestellt hast, werden sie unten angezeigt beziehungsweise in deiner Anmeldung freigeschaltet.
                  </SuccessText>
                </SuccessPanel>
              ) : (
                <>
                  <Notice>
                    Bitte den Teilnahmebeitrag über <strong>{EVENT_PAYMENT_PROVIDER_NAME}</strong> mit deinem Referenzcode zahlen. Falls es Probleme gibt, sende eine Mail an <a href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}`}>{EVENT_PAYMENT_CONTACT_EMAIL}</a>.
                  </Notice>
                  <Notice>{EVENT_COMMUNITY_RIDE_CLAIM} {EVENT_ENTRY_FEE_NOTICE}</Notice>
                  <Notice style={{ marginBottom: 0 }}>
                    Anbieter: <strong>{EVENT_ORGANIZER_NAME}</strong>, {EVENT_ORGANIZER_FULL_ADDRESS}, {EVENT_ORGANIZER_COUNTRY}. {EVENT_WITHDRAWAL_NOTICE}
                  </Notice>
                  <PaymentLinkButton type="button" onClick={startStripeCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? "Weiterleitung..." : `Direkt mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
                  </PaymentLinkButton>
                </>
              )}
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Teilnahmeplatz</h2>
              {summary.registration.team_name && (
                <p style={{ color: "#7c4f00", marginTop: 0 }}>
                  Team / Verein: <strong>{summary.registration.team_name}</strong>
                </p>
              )}
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

            {summary.registration.notes && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Bemerkung an das Orga-Team</h2>
                <p style={{ marginBottom: 0, color: "#7c4f00", lineHeight: 1.5 }}>
                  {summary.registration.notes}
                </p>
              </Card>
            )}

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
          <NavLinkButton to="/event-me">Zu meiner Anmeldung</NavLinkButton>
        </Card>
      </Container>
      <Footer />
    </Page>
  );
}
