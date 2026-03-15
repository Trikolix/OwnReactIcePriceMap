import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import JerseyInfoDialog from "./JerseyInfoDialog";
import {
  BIB_SIZES,
  CLOTHING_OPTIONS,
  EVENT_COMMUNITY_RIDE_CLAIM,
  EVENT_ENTRY_FEE_NOTICE,
  EVENT_PAYMENT_CONTACT_EMAIL,
  EVENT_PAYMENT_PROVIDER_NAME,
  EVENT_START_FINISH,
  KIT_DISPLAY_PRICE,
  TSHIRT_SIZES,
  JERSEY_DISPLAY_PRICE,
  getClothingLabel,
  getPaceLabel,
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

const SectionStack = styled.div`
  display: grid;
  gap: 0.8rem;
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

const ValueCluster = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
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

const SecondaryButton = styled.button`
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
  cursor: pointer;

  &:disabled {
    opacity: 0.75;
    cursor: wait;
  }
`;

const InlineLinkButton = styled.button`
  background: none;
  border: none;
  color: #8a5700;
  text-decoration: underline;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
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

const FormLabel = styled.label`
  display: block;
  color: #7a5200;
  font-weight: 700;
  margin-bottom: 0.35rem;
`;

const SelectField = styled.select`
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(138, 87, 0, 0.2);
  background: #fff;
  color: #2d1d00;
  box-sizing: border-box;
`;

const GridRow = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const LinkField = styled.input`
  width: 100%;
  border: 1px solid rgba(138, 87, 0, 0.18);
  border-radius: 10px;
  padding: 0.68rem 0.8rem;
  background: #fff;
  color: #2d1d00;
  font-size: 0.95rem;
  box-sizing: border-box;
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff3c2;
  color: #7a5200;
  border: 1px solid #efcf84;
  border-radius: 10px;
  padding: 0.62rem 0.95rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
`;

const StateCard = styled(Card)`
  color: ${({ $error }) => ($error ? "#9f1239" : "#7a5200")};
`;
const RoutePill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  border: 1px solid ${({ $border }) => $border};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-weight: 800;
  font-size: 0.8rem;
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

export default function EventMyRegistration() {
  const apiUrl = getApiBaseUrl();
  const { authToken } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [isSavingClothing, setIsSavingClothing] = useState(false);
  const [activeAddonCheckoutId, setActiveAddonCheckoutId] = useState(null);
  const [showClothingEditor, setShowClothingEditor] = useState(false);
  const [clothingInterest, setClothingInterest] = useState("none");
  const [jerseySize, setJerseySize] = useState("");
  const [bibSize, setBibSize] = useState("");

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
  const teamInviteLink = useMemo(() => {
    const teamName = (data?.registration?.team_name || "").trim();
    if (!teamName) return "";
    if (typeof window === "undefined") {
      return `https://ice-app.de/#/event-registration?team=${encodeURIComponent(teamName)}`;
    }
    return `${window.location.origin}/#/event-registration?team=${encodeURIComponent(teamName)}`;
  }, [data?.registration?.team_name]);

  const copyTeamInviteLink = async () => {
    if (!teamInviteLink) return;
    try {
      await navigator.clipboard.writeText(teamInviteLink);
      setCopyStatus("Link kopiert.");
    } catch (err) {
      setCopyStatus("Kopieren fehlgeschlagen.");
    }
  };

  useEffect(() => {
    if (!copyStatus) return undefined;
    const timeoutId = window.setTimeout(() => setCopyStatus(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = window.setTimeout(() => setSuccess(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  useEffect(() => {
    if (!ownSlot) return;
    setClothingInterest(ownSlot.clothing_interest || "none");
    setJerseySize(ownSlot.jersey_size || "");
    setBibSize(ownSlot.bib_size || "");
  }, [ownSlot]);

  useEffect(() => {
    if (clothingInterest === "none") {
      setJerseySize("");
      setBibSize("");
    } else if (clothingInterest === "jersey_interest") {
      setBibSize("");
    }
  }, [clothingInterest]);

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

  const startAddonStripeCheckout = async (addonPurchaseId) => {
    if (!apiUrl || !addonPurchaseId) return;
    setActiveAddonCheckoutId(addonPurchaseId);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/event2026/stripe_checkout_session.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ addon_purchase_id: addonPurchaseId }),
      });
      const json = await response.json();
      if (!response.ok || json.status !== "success" || !json.checkout_url) {
        throw new Error(json.message || "Stripe-Checkout konnte nicht gestartet werden.");
      }
      window.location.href = json.checkout_url;
    } catch (err) {
      setError(err.message || "Stripe-Checkout konnte nicht gestartet werden.");
      setActiveAddonCheckoutId(null);
    }
  };

  const handleUpdateClothing = async () => {
    if (!apiUrl || !authToken || !ownSlot) return;
    setIsSavingClothing(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiUrl}/event2026/update_clothing_interest.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ clothingInterest, jerseySize, bibSize }),
      });
      const json = await response.json();
      if (!response.ok || json.status !== "success") {
        throw new Error(json.message || "Bekleidungsinteresse konnte nicht gespeichert werden.");
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slots: (prev.slots || []).map((slot, index) => (index === 0 ? { ...slot, ...json.clothing } : slot)),
        };
      });
      setShowClothingEditor(false);
      setSuccess(json.message || "Bekleidungsinteresse aktualisiert.");
    } catch (err) {
      setError(err.message || "Bekleidungsinteresse konnte nicht gespeichert werden.");
    } finally {
      setIsSavingClothing(false);
    }
  };

  return (
    <Page>
      <Header />
      <Container>
        <HeroCard>
          <HeroTitle>Meine Anmeldung</HeroTitle>
          <HeroSubtitle>
            Hier findest du deinen Teilnahmeplatz, Zahlungsstatus, Geschenk-Codes und deine Event-Infos auf einen Blick. {EVENT_COMMUNITY_RIDE_CLAIM}
          </HeroSubtitle>
        </HeroCard>

        {loading && <StateCard>Daten werden geladen…</StateCard>}
        {error && <StateCard $error>{error}</StateCard>}
        {success && <StateCard>{success}</StateCard>}

        {data && ownSlot && (
          <CardGrid>
            <Card>
              <CardTitle>Mein Startplatz</CardTitle>
              <SectionStack>
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
                    <Value as="span">
                      <RoutePill
                        $bg={getRouteTheme(ownSlot.route_key).background}
                        $border={getRouteTheme(ownSlot.route_key).border}
                        $color={getRouteTheme(ownSlot.route_key).text}
                      >
                        {ownSlot.route_name || getRouteLabel(ownSlot.route_key)}
                      </RoutePill>
                    </Value>
                  </FieldRow>
                  <FieldRow>
                    <Label>Tempo</Label>
                    <Value>{getPaceLabel(ownSlot.pace_group)}</Value>
                  </FieldRow>
                  <FieldRow>
                    <Label>Team / Verein</Label>
                    <Value>{data.registration.team_name || "-"}</Value>
                  </FieldRow>
                  <FieldRow>
                    <Label>Bekleidung</Label>
                    <Value as="div">
                      <ValueCluster>
                        <span>{ownSlot.clothing_interest_label || getClothingLabel(ownSlot.clothing_interest)}</span>
                        <InlineLinkButton type="button" onClick={() => setShowClothingEditor((prev) => !prev)}>
                          {showClothingEditor ? "Schließen" : "Ändern"}
                        </InlineLinkButton>
                      </ValueCluster>
                    </Value>
                  </FieldRow>
                  <FieldRow>
                    <Label>Größen</Label>
                    <Value>
                      {ownSlot.jersey_size ? `Trikot ${ownSlot.jersey_size}` : ""}
                      {ownSlot.jersey_size && ownSlot.bib_size ? ", " : ""}
                      {ownSlot.bib_size ? `Hose ${ownSlot.bib_size}` : ""}
                      {!ownSlot.jersey_size && !ownSlot.bib_size ? "-" : ""}
                    </Value>
                  </FieldRow>
                </FieldList>

                {showClothingEditor && (
                  <div style={{ border: "1px solid rgba(138, 87, 0, 0.15)", borderRadius: 12, padding: "0.9rem" }}>
                    <CardTitle style={{ marginBottom: "0.7rem" }}>Bekleidungsinteresse bearbeiten</CardTitle>
                    <JerseyInfoDialog linkOnly={true} />
                    <div style={{ marginTop: "0.8rem" }}>
                      <FormLabel htmlFor="event-me-clothing-interest">Bekleidungsinteresse</FormLabel>
                      <SelectField id="event-me-clothing-interest" value={clothingInterest} onChange={(event) => setClothingInterest(event.target.value)}>
                        {CLOTHING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}{option.displayPrice ? ` (Richtpreis ${formatEuro(option.displayPrice)})` : ""}
                          </option>
                        ))}
                      </SelectField>
                      <SubText>Trikot ca. {formatEuro(JERSEY_DISPLAY_PRICE)}, Set aus Trikot + Hose ca. {formatEuro(KIT_DISPLAY_PRICE)}.</SubText>
                    </div>
                    {clothingInterest !== "none" && (
                      <GridRow style={{ marginTop: "0.8rem" }}>
                        <div>
                          <FormLabel htmlFor="event-me-jersey-size">Trikotgröße</FormLabel>
                          <SelectField id="event-me-jersey-size" value={jerseySize} onChange={(event) => setJerseySize(event.target.value)}>
                            <option value="">Bitte wählen</option>
                            {TSHIRT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                          </SelectField>
                        </div>
                        {clothingInterest === "kit_interest" && (
                          <div>
                            <FormLabel htmlFor="event-me-bib-size">Hosengröße</FormLabel>
                            <SelectField id="event-me-bib-size" value={bibSize} onChange={(event) => setBibSize(event.target.value)}>
                              <option value="">Bitte wählen</option>
                              {BIB_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                            </SelectField>
                          </div>
                        )}
                      </GridRow>
                    )}
                    <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                      <SecondaryButton type="button" onClick={handleUpdateClothing} disabled={isSavingClothing}>
                        {isSavingClothing ? "Speichern..." : "Speichern"}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setShowClothingEditor(false);
                          setClothingInterest(ownSlot.clothing_interest || "none");
                          setJerseySize(ownSlot.jersey_size || "");
                          setBibSize(ownSlot.bib_size || "");
                        }}
                        disabled={isSavingClothing}
                      >
                        Abbrechen
                      </SecondaryButton>
                    </div>
                  </div>
                )}
              </SectionStack>
            </Card>

            {data.registration.notes && (
              <Card>
                <CardTitle>Bemerkung an das Orga-Team</CardTitle>
                <Notice style={{ marginTop: 0 }}>{data.registration.notes}</Notice>
              </Card>
            )}

            {teamInviteLink && (
              <Card>
                <CardTitle>Team-Einladung</CardTitle>
                <Notice style={{ marginTop: 0 }}>
                  Teile diesen Link mit weiteren Fahrern. Auf der Registrierungsseite ist das Feld Team / Verein dann bereits mit <strong>{data.registration.team_name}</strong> ausgefüllt.
                </Notice>
                <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.8rem" }}>
                  <LinkField value={teamInviteLink} readOnly />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "center" }}>
                    <CopyButton type="button" onClick={copyTeamInviteLink}>Link kopieren</CopyButton>
                    {copyStatus && <SubText style={{ marginTop: 0 }}>{copyStatus}</SubText>}
                  </div>
                </div>
              </Card>
            )}

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
                  <Label>Eigener Teilnahmebeitrag</Label>
                  <Value>{formatEuro(data.registration.entry_fee_amount)}</Value>
                </FieldRow>
                {Number(data.registration.gift_voucher_purchase_amount || 0) > 0 && (
                  <FieldRow>
                    <Label>Zusätzliche Gutschein-Codes</Label>
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
              <Notice>{EVENT_ENTRY_FEE_NOTICE}</Notice>

              {!isPaid && (
                <>
                  <Notice>
                    Bitte den Teilnahmebeitrag über <strong>{EVENT_PAYMENT_PROVIDER_NAME}</strong> mit deinem Referenzcode zahlen. Bei Fragen zur Zahlung oder zu zusätzlichen Gutschein-Codes bitte an <strong>{EVENT_PAYMENT_CONTACT_EMAIL}</strong> schreiben.
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
                  <Value as="span">
                    <RoutePill
                      $bg={getRouteTheme(ownSlot.route_key).background}
                      $border={getRouteTheme(ownSlot.route_key).border}
                      $color={getRouteTheme(ownSlot.route_key).text}
                    >
                      {ownSlot.route_name || getRouteLabel(ownSlot.route_key)}
                    </RoutePill>
                  </Value>
                </FieldRow>
                <FieldRow>
                  <Label>Startgruppe</Label>
                  <Value>{ownSlot.wave_code || "folgt"}</Value>
                </FieldRow>
                <FieldRow>
                  <Label>Uhrzeit</Label>
                  <Value>folgt</Value>
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
                        {purchase.status !== "paid" && (
                          <div style={{ marginTop: "0.7rem" }}>
                            <PaymentLinkButton
                              type="button"
                              onClick={() => startAddonStripeCheckout(purchase.id)}
                              disabled={activeAddonCheckoutId === purchase.id}
                            >
                              {activeAddonCheckoutId === purchase.id ? "Weiterleitung..." : `Zusatzbestellung mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
                            </PaymentLinkButton>
                          </div>
                        )}
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
