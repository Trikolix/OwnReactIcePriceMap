import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import {
  EVENT_PAYMENT_CONTACT_EMAIL,
  EVENT_PAYMENT_PROVIDER_NAME,
  EVENT_START_FINISH,
  getClothingLabel,
  getPaceLabel,
  getRouteLabel,
} from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;
const Container = styled.div`
  width: min(96%, 1080px);
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
  background: ${({ $tone }) => ($tone === "success" ? "#dcfce7" : "#fff3c2")};
  color: ${({ $tone }) => ($tone === "success" ? "#166534" : "#8a5700")};
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

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

export default function EventMyRegistration() {
  const apiUrl = getApiBaseUrl();
  const { authToken } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!apiUrl) return;
    setLoading(true);
    fetch(`${apiUrl}/event2026/me.php`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (res) => {
        const json = await res.json();
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
          setError(err.message || "Fehler beim Laden.");
          localStorage.removeItem("event2026_has_registration");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, authToken]);

  const ownSlot = useMemo(() => data?.slots?.[0] || null, [data]);
  const paymentStatus = data?.payment?.status || data?.registration?.payment_status || "";
  const isPaid = paymentStatus === "paid";

  const startStripeCheckout = async () => {
    if (!apiUrl || !data?.registration?.id) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/event2026/stripe_checkout_session.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ registration_id: data.registration.id }),
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
          <h1 style={{ marginTop: 0 }}>Meine Anmeldung</h1>
        </Card>

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {data && ownSlot && (
          <>
            <Card>
              <h2 style={{ marginTop: 0 }}>Starterplatz</h2>
              <p><strong>{ownSlot.full_name}</strong> <Badge>{ownSlot.license_status}</Badge></p>
              <p>Route: <strong>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</strong></p>
              <p>Tempo: <strong>{getPaceLabel(ownSlot.pace_group)}</strong></p>
              <p>Bekleidung: <strong>{ownSlot.clothing_interest_label || getClothingLabel(ownSlot.clothing_interest)}</strong></p>
              {(ownSlot.jersey_size || ownSlot.bib_size) && (
                <p style={{ marginBottom: 0 }}>
                  Größen: {ownSlot.jersey_size ? `Trikot ${ownSlot.jersey_size}` : ""}{ownSlot.jersey_size && ownSlot.bib_size ? ", " : ""}{ownSlot.bib_size ? `Hose ${ownSlot.bib_size}` : ""}
                </p>
              )}
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Zahlung</h2>
              <p>Referenzcode: <strong>{data.registration.payment_reference_code}</strong></p>
              <p>Status: <Badge $tone={isPaid ? "success" : undefined}>{paymentStatus}</Badge></p>
              <p>Eigene Startgebühr: <strong>{formatEuro(data.registration.entry_fee_amount)}</strong></p>
              {Number(data.registration.gift_voucher_purchase_amount || 0) > 0 && (
                <p>Geschenk-Codes: <strong>{formatEuro(data.registration.gift_voucher_purchase_amount)}</strong></p>
              )}
              {Number(data.registration.voucher_discount_amount || 0) > 0 && (
                <p>Gutschein-Abzug: <strong>-{formatEuro(data.registration.voucher_discount_amount)}</strong></p>
              )}
              {Number(data.registration.donation_amount || 0) > 0 && (
                <p>Zusätzlicher Betrag: <strong>{formatEuro(data.registration.donation_amount)}</strong></p>
              )}
              <p>Gesamt: <strong>{formatEuro(data.payment?.expected_amount)}</strong></p>
              {!isPaid && (
                <>
                  <p style={{ marginBottom: 0, color: "#7c4f00" }}>
                    Bitte die Zahlung über <strong>{EVENT_PAYMENT_PROVIDER_NAME}</strong> mit deinem Referenzcode ausführen. Bei Fragen zur Zahlung bitte an <strong>{EVENT_PAYMENT_CONTACT_EMAIL}</strong> schreiben.
                  </p>
                  <PaymentLinkButton type="button" onClick={startStripeCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? "Weiterleitung..." : `Direkt mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
                  </PaymentLinkButton>
                </>
              )}
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Eventtag</h2>
              <p>Treff bei <strong>{EVENT_START_FINISH.name}</strong>, {EVENT_START_FINISH.fullAddress}. Die genaue Uhrzeit wird noch bekannt gegeben.</p>
              <p>Deine gewählte Route: <strong>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</strong></p>
              <p>Startgruppe: <strong>{ownSlot.wave_code || "folgt"}</strong></p>
              <p style={{ marginBottom: 0 }}>Im Ziel kommst du wieder bei <strong>{EVENT_START_FINISH.name}</strong> an.</p>
            </Card>

            {data.gift_vouchers?.length > 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Freigeschaltete Geschenk-Codes</h2>
                {data.gift_vouchers.map((voucher) => (
                  <div key={voucher.id} style={{ padding: "0.55rem 0", borderBottom: "1px solid #f3e5bd" }}>
                    <strong>{voucher.code || `Code #${voucher.id}`}</strong> <Badge>{voucher.status}</Badge>
                    <div style={{ color: "#7c4f00", fontSize: 14 }}>
                      {voucher.status === "redeemed" ? `Eingelöst am ${new Date(voucher.redeemed_at).toLocaleString("de-DE")}` : "Noch offen und verschenkbar"}
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {Number(data.registration.gift_voucher_quantity || 0) > 0 && (!data.gift_vouchers || data.gift_vouchers.length === 0) && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Geschenk-Codes in Vorbereitung</h2>
                <p style={{ marginBottom: 0 }}>
                  Für deine Anmeldung wurden <strong>{data.registration.gift_voucher_quantity}</strong> Geschenk-Code{Number(data.registration.gift_voucher_quantity) === 1 ? "" : "s"} gekauft. Die konkreten Codes erscheinen hier erst nach bestätigter Zahlung.
                </p>
              </Card>
            )}

            {data.addon_purchases?.length > 0 && (
              <Card>
                <h2 style={{ marginTop: 0 }}>Zusatzbestellungen</h2>
                {data.addon_purchases.map((purchase) => (
                  <div key={purchase.id} style={{ padding: "0.55rem 0", borderBottom: "1px solid #f3e5bd" }}>
                    <strong>{purchase.payment_reference_code}</strong> <Badge>{purchase.status}</Badge>
                    <div style={{ color: "#7c4f00", fontSize: 14 }}>
                      {purchase.gift_voucher_quantity} Gutschein-Code{purchase.gift_voucher_quantity === 1 ? "" : "s"} - {formatEuro(purchase.expected_amount)}
                    </div>
                    <div style={{ color: "#7c4f00", fontSize: 14 }}>
                      {purchase.status === "paid" ? "Bezahlt und freigeschaltet." : "Noch nicht bezahlt, Codes daher noch nicht sichtbar."}
                    </div>
                  </div>
                ))}
              </Card>
            )}

            <Card>
              <h2 style={{ marginTop: 0 }}>Stempelkarte</h2>
              <p>
                Pflicht-Checkpoints: <strong>{data.progress?.mandatory_passed || 0} / {data.progress?.mandatory_total || 0}</strong>
              </p>
              <p style={{ marginBottom: 0 }}>
                Finisher-Status: <Badge>{data.progress?.is_finisher ? "Finisher" : "offen"}</Badge>
              </p>
            </Card>
          </>
        )}
      </Container>
      <Footer />
    </Page>
  );
}


