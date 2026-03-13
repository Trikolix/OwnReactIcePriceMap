import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
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
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 214, 133, 0.35), transparent 34%),
    linear-gradient(180deg, #fffaf0 0%, #fff3da 100%);
`;

const Container = styled.div`
  width: min(96%, 1120px);
  margin: 0 auto;
  padding: 1rem 0 1.4rem;
`;

const HeroCard = styled.div`
  background: rgba(255, 253, 247, 0.96);
  border: 1px solid rgba(138, 87, 0, 0.15);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(63, 42, 0, 0.1);
  padding: 1.1rem 1.2rem;
  margin-bottom: 1rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #3a2600;
  font-size: clamp(1.35rem, 2.5vw, 1.9rem);
`;

const HeroSubtitle = styled.p`
  margin: 0.45rem 0 0;
  color: #7a5200;
  line-height: 1.45;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const Card = styled.section`
  background: #fffdfa;
  border-radius: 16px;
  border: 1px solid rgba(138, 87, 0, 0.12);
  box-shadow: 0 8px 22px rgba(72, 45, 0, 0.08);
  padding: 1rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.65rem;
  font-size: 1.02rem;
  color: #3a2600;
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
  line-height: 1.45;
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
  padding: 0.62rem 0.95rem;
  font-size: 0.92rem;
  font-weight: 700;
  margin-top: 0.75rem;
  text-decoration: none;
`;

const InlineList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const InlineItem = styled.div`
  border: 1px solid rgba(138, 87, 0, 0.15);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 251, 241, 0.9);
`;

const SubText = styled.div`
  color: #7a5200;
  font-size: 0.9rem;
  margin-top: 0.28rem;
  line-height: 1.35;
`;

const StateCard = styled(Card)`
  color: ${({ $error }) => ($error ? "#9f1239" : "#7a5200")};
`;

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

function formatPaymentStatus(status) {
  if (status === "paid") return "Bezahlt";
  if (status === "pending") return "Offen";
  if (status === "partially_paid") return "Teilweise bezahlt";
  if (status === "cancelled") return "Storniert";
  return status || "-";
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
  const stampCardMode = useMemo(() => {
    if (typeof window === "undefined") return "live";
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" ? "test" : "live";
  }, []);

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
        <HeroCard>
          <HeroTitle>Meine Anmeldung</HeroTitle>
          <HeroSubtitle>
            Hier findest du deinen Starterplatz, Zahlungsstatus, Geschenk-Codes und deine Event-Infos auf einen Blick.
          </HeroSubtitle>
        </HeroCard>

        {loading && <StateCard>Daten werden geladen…</StateCard>}
        {error && <StateCard $error>{error}</StateCard>}

        {data && ownSlot && (
          <CardGrid>
            <Card>
              <CardTitle>Starterplatz</CardTitle>
              <FieldList>
                <FieldRow>
                  <Label>Name</Label>
                  <Value>{ownSlot.full_name}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Zahlung</Label>
                  <Value><Badge>{ownSlot.license_status}</Badge></Value>
                </FieldRow>
                <FieldRow>
                  <Label>Route</Label>
                  <Value>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Tempo</Label>
                  <Value>{getPaceLabel(ownSlot.pace_group)}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Bekleidung</Label>
                  <Value>{ownSlot.clothing_interest_label || getClothingLabel(ownSlot.clothing_interest)}</Value>
                </FieldRow>
                {(ownSlot.jersey_size || ownSlot.bib_size) && (
                  <FieldRow>
                    <Label>Größen</Label>
                    <Value>
                      {ownSlot.jersey_size ? `Trikot ${ownSlot.jersey_size}` : ""}
                      {ownSlot.jersey_size && ownSlot.bib_size ? ", " : ""}
                      {ownSlot.bib_size ? `Hose ${ownSlot.bib_size}` : ""}
                    </Value>
                  </FieldRow>
                )}
              </FieldList>
            </Card>

            <Card>
              <CardTitle>Zahlung</CardTitle>
              <FieldList>
                <FieldRow>
                  <Label>Referenzcode</Label>
                  <Value>{data.registration.payment_reference_code}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Status</Label>
                  <Value>
                    <Badge $tone={isPaid ? "success" : undefined}>{formatPaymentStatus(paymentStatus)}</Badge>
                  </Value>
                </FieldRow>
                <FieldRow>
                  <Label>Eigene Startgebühr</Label>
                  <Value>{formatEuro(data.registration.entry_fee_amount)}</Value>
                </FieldRow>
                {Number(data.registration.gift_voucher_purchase_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Geschenk-Codes</Label>
                    <Value>{formatEuro(data.registration.gift_voucher_purchase_amount)}</Value>
                  </FieldRow>
                )}
                {Number(data.registration.voucher_discount_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Gutschein-Abzug</Label>
                    <Value>-{formatEuro(data.registration.voucher_discount_amount)}</Value>
                  </FieldRow>
                )}
                {Number(data.registration.donation_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Zusätzliche Spende</Label>
                    <Value>{formatEuro(data.registration.donation_amount)}</Value>
                  </FieldRow>
                )}
                <FieldRow>
                  <Label>Gesamt</Label>
                  <Value>{formatEuro(data.payment?.expected_amount)}</Value>
                </FieldRow>
              </FieldList>

              {!isPaid && (
                <>
                  <Notice>
                    Bitte die Zahlung über <strong>{EVENT_PAYMENT_PROVIDER_NAME}</strong> mit deinem Referenzcode ausführen. Bei Fragen zur Zahlung bitte an <strong>{EVENT_PAYMENT_CONTACT_EMAIL}</strong> schreiben.
                  </Notice>
                  <PaymentLinkButton type="button" onClick={startStripeCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? "Weiterleitung..." : `Direkt mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
                  </PaymentLinkButton>
                </>
              )}
            </Card>

            <Card>
              <CardTitle>Eventtag</CardTitle>
              <FieldList>
                <FieldRow>
                  <Label>Treffpunkt</Label>
                  <Value>{EVENT_START_FINISH.name}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Adresse</Label>
                  <Value>{EVENT_START_FINISH.fullAddress}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Route</Label>
                  <Value>{ownSlot.route_name || getRouteLabel(ownSlot.route_key)}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Startgruppe</Label>
                  <Value>{ownSlot.wave_code || "folgt"}</Value>
                </FieldRow>
              </FieldList>
            </Card>

            <Card>
              <CardTitle>Stempelkarte</CardTitle>
              <FieldList>
                <FieldRow>
                  <Label>Pflicht-Checkpoints</Label>
                  <Value>{data.progress?.mandatory_passed || 0} / {data.progress?.mandatory_total || 0}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Finisher-Status</Label>
                  <Value><Badge $tone={data.progress?.is_finisher ? "success" : undefined}>{data.progress?.is_finisher ? "Finisher" : "offen"}</Badge></Value>
                </FieldRow>
              </FieldList>
              <NavLinkButton to={`/event-stamp-card?mode=${stampCardMode}`}>
                Zur {stampCardMode === "test" ? "Test-" : ""}Stempelkarte
              </NavLinkButton>
            </Card>

            {data.gift_vouchers?.length > 0 && (
              <FullWidth>
                <Card>
                  <CardTitle>Freigeschaltete Geschenk-Codes</CardTitle>
                  <InlineList>
                    {data.gift_vouchers.map((voucher) => (
                      <InlineItem key={voucher.id}>
                        <strong>{voucher.code || `Code #${voucher.id}`}</strong> <Badge>{voucher.status}</Badge>
                        <SubText>
                          {voucher.status === "redeemed"
                            ? `Eingelöst am ${new Date(voucher.redeemed_at).toLocaleString("de-DE")}`
                            : "Noch offen und verschenkbar"}
                        </SubText>
                      </InlineItem>
                    ))}
                  </InlineList>
                </Card>
              </FullWidth>
            )}

            {Number(data.registration.gift_voucher_quantity || 0) > 0 && (!data.gift_vouchers || data.gift_vouchers.length === 0) && (
              <FullWidth>
                <Card>
                  <CardTitle>Geschenk-Codes in Vorbereitung</CardTitle>
                  <Notice>
                    Für deine Anmeldung wurden <strong>{data.registration.gift_voucher_quantity}</strong> Geschenk-Code
                    {Number(data.registration.gift_voucher_quantity) === 1 ? "" : "s"} gekauft. Die konkreten Codes erscheinen hier erst nach bestätigter Zahlung.
                  </Notice>
                </Card>
              </FullWidth>
            )}

            {data.addon_purchases?.length > 0 && (
              <FullWidth>
                <Card>
                  <CardTitle>Zusatzbestellungen</CardTitle>
                  <InlineList>
                    {data.addon_purchases.map((purchase) => (
                      <InlineItem key={purchase.id}>
                        <strong>{purchase.payment_reference_code}</strong> <Badge>{purchase.status}</Badge>
                        <SubText>
                          {purchase.gift_voucher_quantity} Gutschein-Code{purchase.gift_voucher_quantity === 1 ? "" : "s"} - {formatEuro(purchase.expected_amount)}
                        </SubText>
                        <SubText>
                          {purchase.status === "paid" ? "Bezahlt und freigeschaltet." : "Noch nicht bezahlt, Codes daher noch nicht sichtbar."}
                        </SubText>
                      </InlineItem>
                    ))}
                  </InlineList>
                </Card>
              </FullWidth>
            )}
          </CardGrid>
        )}
      </Container>
      <Footer />
    </Page>
  );
}
