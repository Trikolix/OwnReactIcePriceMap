import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Bike, Flag, Gift, HeartHandshake, ShieldAlert, Shirt, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import LiabilityWaiver from "./LiabilityWaiver";
import JerseyInfoDialog from "./JerseyInfoDialog";
import { useUser } from "../../context/UserContext";
import "../../styles/eventTheme.css";
import { getApiBaseUrl } from "../../shared/api/client";
import {
  BIB_SIZES,
  CLOTHING_OPTIONS,
  EVENT_COMMUNITY_RIDE_CLAIM,
  EVENT_ENTRY_FEE,
  EVENT_ENTRY_FEE_NOTICE,
  EVENT_DATE,
  EVENT_ORGANIZER_COUNTRY,
  EVENT_ORGANIZER_NAME,
  EVENT_ORGANIZER_POSTAL_CITY,
  EVENT_ORGANIZER_STREET,
  EVENT_PAYMENT_CONTACT_EMAIL,
  EVENT_PAYMENT_METHOD_PREFERENCE,
  EVENT_PAYMENT_PROVIDER_NAME,
  EVENT_START_FINISH,
  EVENT_WITHDRAWAL_NOTICE,
  KIT_DISPLAY_PRICE,
  PACE_OPTIONS,
  routeSupportsPace,
  ROUTE_OPTIONS,
  TSHIRT_SIZES,
  JERSEY_DISPLAY_PRICE,
} from "./eventConfig";

const createParticipant = () => ({
  name: "",
  email: "",
  routeKey: "classic_3",
  paceGroup: "24_27",
  womenWaveOptIn: false,
  publicNameConsent: true,
});

const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: var(--event-bg);
  min-height: 100vh;
`;
const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1140px;
  margin: 0 auto;
  @media (min-width: 1000px) {
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  }
`;
const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 2rem;
  margin: 1rem 0rem;
`;
const CardTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
`;
const Label = styled.label`
  font-weight: 500;
  margin-bottom: 0.3rem;
  display: block;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.55em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
  box-sizing: border-box;
`;
const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
  min-height: 90px;
  resize: vertical;
  box-sizing: border-box;
`;
const Select = styled.select`
  width: 100%;
  padding: 0.55em 0.8em;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  background: #fff;
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--event-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6em 1.2em;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  &:disabled {
    background: #ffe6a1;
    color: #b48a2c;
    cursor: not-allowed;
  }
`;
const Summary = styled.div`
  max-height: fit-content;
  @media (min-width: 1000px) {
    position: sticky;
    top: 11rem;
  }
`;
const Flex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;
const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.97rem;
  margin-bottom: 0.6rem;
`;
const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  @media (min-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const CompactInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;
const InlineFieldLabel = styled.label`
  color: #5d3d00;
  font-weight: 700;
  white-space: nowrap;
`;
const SmallNumberInput = styled(Input)`
  width: 5.5rem;
  margin-bottom: 0;
`;
const PriceHint = styled.div`
  color: #7c4f00;
  font-size: 0.95rem;
  font-weight: 700;
`;
const StatusBanner = styled.div`
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: ${({ tone }) => (tone === "danger" ? "#fee2e2" : tone === "success" ? "#ecfdf3" : "#fff7e5")};
  border: 1px solid ${({ tone }) => (tone === "danger" ? "#fecaca" : tone === "success" ? "#86efac" : "#ffd77a")};
  color: ${({ tone }) => (tone === "danger" ? "#9f1239" : tone === "success" ? "#166534" : "#8a5700")};
`;
const ErrorOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(39, 21, 0, 0.44);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 1200;
`;
const ErrorDialog = styled.div`
  width: min(100%, 32rem);
  background: #fffdfa;
  border: 1px solid #fecaca;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(39, 21, 0, 0.22);
  padding: 1.25rem 1.25rem 1rem;
`;
const ErrorTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: #9f1239;
`;
const ErrorText = styled.p`
  margin: 0;
  color: #6b102f;
  line-height: 1.5;
`;
const ErrorActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;
const RouteGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
`;
const RouteCard = styled.label`
  border: 1px solid ${({ selected, $border }) => (selected ? $border || "#ffb522" : "#f0d79a")};
  background: ${({ selected, $bg }) => (selected ? $bg || "#fff7e5" : "#fffdfa")};
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: block;
  cursor: pointer;
  box-shadow: ${({ selected, $glow }) => (selected ? `0 10px 24px ${$glow || "rgba(255, 181, 34, 0.12)"}` : "none")};
`;
const Muted = styled.div`
  color: #7c4f00;
  font-size: 0.92rem;
  line-height: 1.45;
`;
const RoutePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.24rem 0.62rem;
  border-radius: 999px;
  border: 1px solid ${({ $border }) => $border};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-weight: 800;
  font-size: 0.8rem;
`;
const SummaryDivider = styled.div`
  border-top: 1px solid #ffd77a;
  margin: 1rem 0;
`;
const LegalPanel = styled.div`
  border: 1px solid #f0d79a;
  background: #fff7e5;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  color: #7c4f00;
  line-height: 1.5;
`;
const LegalHeadline = styled.div`
  font-weight: 800;
  color: #5d3d00;
  margin-bottom: 0.45rem;
`;
const LegalList = styled.ul`
  margin: 0.55rem 0;
  padding-left: 1.1rem;
`;
const LegalSmall = styled.p`
  margin: 0.5rem 0 0;
  color: #7c4f00;
  font-size: 0.9rem;
  line-height: 1.45;
`;

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function parseNumberInput(value, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  if (value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(min, parsed));
}

function getRouteSummary(routeKey) {
  return ROUTE_OPTIONS.find((route) => route.key === routeKey) || ROUTE_OPTIONS[0];
}

export default function EventRegistration() {
  const { username, isLoggedIn, logout, authToken } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = getApiBaseUrl();
  const invitedTeamName = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("team") || "").trim();
  }, [location.search]);

  const [participant, setParticipant] = useState(createParticipant());
  const [teamName, setTeamName] = useState("");
  const [teamNameSuggestions, setTeamNameSuggestions] = useState([]);
  const [registrationNote, setRegistrationNote] = useState("");
  const [donationAmount, setDonationAmount] = useState("0");
  const [giftVoucherQuantity, setGiftVoucherQuantity] = useState("0");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLookup, setVoucherLookup] = useState(null);
  const [newsletter, setNewsletter] = useState(false);
  const [acceptWaiver, setAcceptWaiver] = useState(false);
  const [acceptAccountTerms, setAcceptAccountTerms] = useState(false);
  const [clothingInterest, setClothingInterest] = useState("none");
  const [jerseySize, setJerseySize] = useState("");
  const [bibSize, setBibSize] = useState("");
  const [addonVoucherQuantity, setAddonVoucherQuantity] = useState("0");
  const [addonNote, setAddonNote] = useState("");
  const [newAccount, setNewAccount] = useState({ username: "", email: "", password: "" });

  const [eventMeta, setEventMeta] = useState(null);
  const [legal, setLegal] = useState(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [existingRegistration, setExistingRegistration] = useState(null);
  const [addonPurchases, setAddonPurchases] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingClothing, setIsSavingClothing] = useState(false);
  const [isSubmittingAddon, setIsSubmittingAddon] = useState(false);
  const [activeAddonCheckoutId, setActiveAddonCheckoutId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let aborted = false;
    const loadMeta = async () => {
      if (!API_BASE) return;
      setLoadingMeta(true);
      try {
        const res = await fetch(`${API_BASE}/event2026/registrations.php`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        const data = await res.json();
        if (aborted) return;
        if (data.status !== "success") {
          throw new Error(data.message || "Eventdaten konnten nicht geladen werden.");
        }
        setEventMeta(data.event);
        setLegal(data.legal);
        setAccountEmail(data.account?.email || "");
        setExistingRegistration(data.existing_registration || null);
        setTeamNameSuggestions(Array.isArray(data.team_name_suggestions) ? data.team_name_suggestions : []);
        if (data.existing_registration) {
          setClothingInterest(data.existing_registration.clothing_interest || "none");
          setJerseySize(data.existing_registration.jersey_size || "");
          setBibSize(data.existing_registration.bib_size || "");
        }
      } catch (err) {
        if (!aborted) setError(err.message || "Eventdaten konnten nicht geladen werden.");
      } finally {
        if (!aborted) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => {
      aborted = true;
    };
  }, [API_BASE, authToken]);

  useEffect(() => {
    if (!existingRegistration || !API_BASE || !authToken) return;
    let cancelled = false;
    fetch(`${API_BASE}/event2026/post_registration_purchase.php`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") throw new Error(json.message || "Zusatzbestellungen konnten nicht geladen werden.");
        if (!cancelled) setAddonPurchases(json.addon_purchases || []);
      })
      .catch(() => {
        if (!cancelled) setAddonPurchases([]);
      });
    return () => {
      cancelled = true;
    };
  }, [API_BASE, authToken, existingRegistration]);

  useEffect(() => {
    if (!isLoggedIn || !accountEmail || existingRegistration) return;
    setParticipant((prev) => ({ ...prev, email: prev.email.trim() ? prev.email : accountEmail }));
  }, [accountEmail, isLoggedIn, existingRegistration]);

  useEffect(() => {
    if (existingRegistration) {
      localStorage.setItem("event2026_has_registration", "1");
    }
  }, [existingRegistration]);

  useEffect(() => {
    if (!invitedTeamName || existingRegistration) return;
    setTeamName((prev) => (prev.trim() ? prev : invitedTeamName));
  }, [existingRegistration, invitedTeamName]);

  useEffect(() => {
    if (isLoggedIn || !newAccount.email || existingRegistration) return;
    setParticipant((prev) => ({ ...prev, email: newAccount.email }));
  }, [isLoggedIn, newAccount.email, existingRegistration]);

  useEffect(() => {
    if (clothingInterest === "none") {
      setJerseySize("");
      setBibSize("");
    } else if (clothingInterest === "jersey_interest") {
      setBibSize("");
    }
  }, [clothingInterest]);

  const lookupVoucher = async () => {
    if (!voucherCode.trim() || !API_BASE) {
      setVoucherLookup(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/event2026/voucher_lookup.php?code=${encodeURIComponent(voucherCode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== "success") throw new Error(data.message || "Gutschein konnte nicht geprüft werden.");
      setVoucherLookup(data.voucher);
    } catch (err) {
      setVoucherLookup({ valid: false, state: "invalid", message: err.message || "Gutschein konnte nicht geprüft werden." });
    }
  };

  const normalizedDonationAmount = parseNumberInput(donationAmount, { min: 0 });
  const normalizedGiftVoucherQuantity = parseNumberInput(giftVoucherQuantity, { min: 0, max: 20 });
  const normalizedAddonVoucherQuantity = parseNumberInput(addonVoucherQuantity, { min: 0, max: 20 });

  const totalCost = useMemo(() => {
    const voucherDiscount = voucherLookup?.valid ? EVENT_ENTRY_FEE : 0;
    return Math.max(0, EVENT_ENTRY_FEE + normalizedGiftVoucherQuantity * EVENT_ENTRY_FEE + normalizedDonationAmount - voucherDiscount);
  }, [normalizedDonationAmount, normalizedGiftVoucherQuantity, voucherLookup]);

  const handleParticipantChange = (field, value) => {
    setParticipant((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "routeKey") {
        if (!routeSupportsPace(value)) {
          next.paceGroup = "family";
          next.womenWaveOptIn = false;
        } else if (prev.paceGroup === "family") {
          next.paceGroup = "24_27";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!API_BASE || existingRegistration) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      participant,
      teamName,
      registrationNote,
      donationAmount: normalizedDonationAmount,
      giftVoucherQuantity: normalizedGiftVoucherQuantity,
      voucherCode: voucherCode.trim(),
      clothingInterest,
      jerseySize,
      bibSize,
      newsletter,
      paymentMethodPreference: EVENT_PAYMENT_METHOD_PREFERENCE,
      acceptLegal: acceptWaiver,
      legalVersion: legal?.version ?? null,
      account: !isLoggedIn
        ? { username: newAccount.username, email: newAccount.email, password: newAccount.password, acceptedTerms: acceptAccountTerms }
        : null,
    };

    try {
      const response = await fetch(`${API_BASE}/event2026/registrations.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        if (result.status === "sold_out") throw new Error("Event ist ausgebucht oder es sind nicht genug freie Plätze verfügbar.");
        throw new Error(result.message || "Fehler beim Speichern");
      }
      localStorage.setItem("event2026_has_registration", "1");
      const summaryToken = result.registration_summary_access_token ? `&summaryToken=${encodeURIComponent(result.registration_summary_access_token)}` : "";
      navigate(`/event-registration-summary?registrationId=${result.registration_id}${summaryToken}`, { state: { registrationResult: result } });
    } catch (err) {
      setError(err.message || "Anmeldung konnte nicht gespeichert werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClothing = async () => {
    if (!API_BASE || !authToken || !existingRegistration) return;
    setIsSavingClothing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/event2026/update_clothing_interest.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ clothingInterest, jerseySize, bibSize }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") throw new Error(result.message || "Bekleidungsinteresse konnte nicht gespeichert werden.");
      setSuccess(result.message);
      setExistingRegistration((prev) => ({ ...prev, ...result.clothing }));
    } catch (err) {
      setError(err.message || "Bekleidungsinteresse konnte nicht gespeichert werden.");
    } finally {
      setIsSavingClothing(false);
    }
  };

  const handleAddonPurchase = async () => {
    if (!API_BASE || !authToken || !existingRegistration) return;
    setIsSubmittingAddon(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/event2026/post_registration_purchase.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ giftVoucherQuantity: normalizedAddonVoucherQuantity, paymentMethodPreference: EVENT_PAYMENT_METHOD_PREFERENCE, notes: addonNote }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") throw new Error(result.message || "Zusatzbestellung konnte nicht gespeichert werden.");
      setSuccess(result.message);
      setAddonVoucherQuantity("0");
      setAddonNote("");
      setAddonPurchases((prev) => [result.addon_purchase, ...prev]);
    } catch (err) {
      setError(err.message || "Zusatzbestellung konnte nicht gespeichert werden.");
    } finally {
      setIsSubmittingAddon(false);
    }
  };

  const startAddonStripeCheckout = async (addonPurchaseId) => {
    if (!API_BASE || !authToken || !addonPurchaseId) return;
    setActiveAddonCheckoutId(addonPurchaseId);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/event2026/stripe_checkout_session.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ addon_purchase_id: addonPurchaseId }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success" || !result.checkout_url) {
        throw new Error(result.message || "Stripe-Checkout konnte nicht gestartet werden.");
      }
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err.message || "Stripe-Checkout konnte nicht gestartet werden.");
      setActiveAddonCheckoutId(null);
    }
  };

  const availableSlots = eventMeta?.available_slots ?? 0;
  const isSoldOut = eventMeta?.event_status === "cancelled" || availableSlots <= 0;
  const registrationMode = !existingRegistration;
  const selectedRoute = getRouteSummary(participant.routeKey);
  const registrationSubmitLabel = isSubmitting ? "Speichern..." : "Verbindlich anmelden und Teilnahmebeitrag zahlen";
  const addonSubmitLabel = isSubmittingAddon ? "Speichern..." : "Zusätzliche Startplätze verbindlich reservieren";

  return (
    <PageWrapper>
      {error && (
        <ErrorOverlay role="presentation" onClick={() => setError(null)}>
          <ErrorDialog role="alertdialog" aria-modal="true" aria-labelledby="event-registration-error-title" onClick={(event) => event.stopPropagation()}>
            <ErrorTitle id="event-registration-error-title">Registrierung nicht möglich</ErrorTitle>
            <ErrorText>{error}</ErrorText>
            <ErrorActions>
              <Button type="button" onClick={() => setError(null)} style={{ marginTop: 0 }}>
                Schließen
              </Button>
            </ErrorActions>
          </ErrorDialog>
        </ErrorOverlay>
      )}
      <Header />
      <form onSubmit={handleSubmit}>
        <MainGrid>
          <div>
            {loadingMeta && <StatusBanner>Eventdaten werden geladen...</StatusBanner>}
            {success && <StatusBanner tone="success">{success}</StatusBanner>}

            {eventMeta && (
              <Card>
                <CardTitle><Flag size={20} /> Eventstatus</CardTitle>
                <Flex>
                  <span>Verfügbare Startplätze</span>
                  <span>noch <strong>{eventMeta.available_slots} / {eventMeta.max_participants}</strong></span>
                </Flex>
                {existingRegistration && (
                  <StatusBanner style={{ marginTop: 12, marginBottom: 0 }}>
                    <strong>Du bist bereits registriert.</strong>
                    <div style={{ marginTop: 6 }}>Status: <strong>{existingRegistration.payment_status}</strong></div>
                    <div>Referenzcode: <strong>{existingRegistration.payment_reference_code}</strong></div>
                  </StatusBanner>
                )}
              </Card>
            )}

            {registrationMode ? (
              <>
                <Card>
                  <CardTitle><Users /> Anmeldung</CardTitle>
                  {isLoggedIn ? (
                    <StatusBanner style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <span>Angemeldet als <strong>{username}</strong>.</span>
                      <Button type="button" onClick={logout} style={{ marginTop: 0, background: "#ef4444" }}>Abmelden</Button>
                    </StatusBanner>
                  ) : (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <Muted style={{ marginBottom: "0.8rem" }}>Für Anmeldung, digitale Stempelkarte und Check-ins wird ein Ice-App Account benötigt.</Muted>
                      <Muted style={{ marginBottom: "0.8rem" }}>{EVENT_COMMUNITY_RIDE_CLAIM}</Muted>
                      <GridRow>
                        <div>
                          <Label>Benutzername (neu)</Label>
                          <Input value={newAccount.username} onChange={(e) => setNewAccount((prev) => ({ ...prev, username: e.target.value }))} required />
                        </div>
                        <div>
                          <Label>E-Mail (Account)</Label>
                          <Input value={newAccount.email} type="email" onChange={(e) => setNewAccount((prev) => ({ ...prev, email: e.target.value }))} required />
                        </div>
                      </GridRow>
                      <Label>Passwort (mind. 6 Zeichen)</Label>
                      <Input value={newAccount.password} type="password" onChange={(e) => setNewAccount((prev) => ({ ...prev, password: e.target.value }))} required />
                      <CheckboxLabel>
                        <input type="checkbox" checked={acceptAccountTerms} onChange={(e) => setAcceptAccountTerms(e.target.checked)} />
                        <span>Ich akzeptiere die <a href="/#/agb" target="_blank" rel="noreferrer">AGB</a>, <a href="/#/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> und <a href="/#/community" target="_blank" rel="noreferrer">Community-Richtlinien</a>.</span>
                      </CheckboxLabel>
                    </div>
                  )}

                  <Label>Vollständiger Name (Echtname)</Label>
                  <Input value={participant.name} onChange={(e) => handleParticipantChange("name", e.target.value)} required />
                  <Label>E-Mail-Adresse</Label>
                  <Input value={participant.email} type="email" onChange={(e) => handleParticipantChange("email", e.target.value)} required />
                  <Label>Route</Label>
                  <RouteGrid>
                    {ROUTE_OPTIONS.map((route) => (
                      <RouteCard
                        key={route.key}
                        selected={participant.routeKey === route.key}
                        $border={route.badgeTone.border}
                        $bg={route.badgeTone.background}
                        $glow={route.badgeTone.glow}
                      >
                        <input type="radio" name="route" checked={participant.routeKey === route.key} onChange={() => handleParticipantChange("routeKey", route.key)} style={{ marginRight: 10 }} />
                        <RoutePill $bg={route.badgeTone.background} $border={route.badgeTone.border} $color={route.badgeTone.text}>
                          {route.shortLabel}
                        </RoutePill>
                        <strong style={{ display: "block", marginTop: 8 }}>{route.label}</strong>
                        <div style={{ marginTop: 4 }}>{route.teaser}</div>
                        <Muted>{route.description}</Muted>
                      </RouteCard>
                    ))}
                  </RouteGrid>
                  {routeSupportsPace(participant.routeKey) ? (
                    <GridRow>
                      <div>
                        <Label>Dein geplantes Tempo</Label>
                        <Select value={participant.paceGroup} onChange={(e) => handleParticipantChange("paceGroup", e.target.value)}>
                          {PACE_OPTIONS.map((pace) => <option key={pace.value} value={pace.value}>{pace.label}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label>Startmodus</Label>
                        <Input value="Gruppeneinteilung nach Strecke und Tempo" disabled />
                      </div>
                    </GridRow>
                  ) : (
                    <StatusBanner>Diese Route bekommt ein eigenes Startfenster ohne sportliche Tempogruppe.</StatusBanner>
                  )}
                  {routeSupportsPace(participant.routeKey) && (
                    <CheckboxLabel>
                      <input type="checkbox" checked={participant.womenWaveOptIn} onChange={(e) => handleParticipantChange("womenWaveOptIn", e.target.checked)} />
                      <span>Wunsch: separate Frauen-Startwelle (bei ausreichender Anzahl)</span>
                    </CheckboxLabel>
                  )}
                  <CheckboxLabel>
                    <input type="checkbox" checked={participant.publicNameConsent} onChange={(e) => handleParticipantChange("publicNameConsent", e.target.checked)} />
                    <span>Ich stimme zu, dass Name und Checkpoint-Zeiten auf der öffentlichen Live-Karte sichtbar sind.</span>
                  </CheckboxLabel>
                  <Label>Verein / Team (optional)</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    list={teamNameSuggestions.length > 0 ? "event-team-name-suggestions" : undefined}
                    placeholder="z. B. Ice Riders Chemnitz"
                  />
                  {teamNameSuggestions.length > 0 && (
                    <datalist id="event-team-name-suggestions">
                      {teamNameSuggestions.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  )}
                  {(invitedTeamName || teamNameSuggestions.length > 0) && (
                    <Muted style={{ marginBottom: "0.55rem" }}>
                      {invitedTeamName
                        ? `Dieser Link hat dein Team bereits vorbelegt: ${invitedTeamName}.`
                        : "Beim Ausfüllen werden passende Teamnamen aus bisherigen Registrierungen vorgeschlagen."}
                    </Muted>
                  )}
                  <Label>Bemerkung an das Orga-Team (optional)</Label>
                  <Textarea value={registrationNote} onChange={(e) => setRegistrationNote(e.target.value)} maxLength={220} />
                </Card>

                <Card>
                  <CardTitle><Gift /> Startplätze für Freunde / Sammelanmeldung</CardTitle>
                  <Muted style={{ marginBottom: 10 }}>
                    Hier kannst du zusammen mit deiner Anmeldung zusätzliche Startplätze für Freunde, Bekannte oder Vereinskollegen mitkaufen.
                  </Muted>
                  <Muted style={{ marginBottom: 10 }}>
                    Nach bestätigter Zahlung werden dafür Geschenk-Codes freigeschaltet. Diese kannst du danach verteilen, damit sich jede Person selbst mit ihrem Code anmeldet.
                  </Muted>
                  <Muted style={{ marginBottom: 10 }}>
                    Das eignet sich auch für Sammelanmeldungen: Eine Person bezahlt gesammelt, verteilt anschließend die Codes und jeder Teilnehmer registriert sich später selbst.
                  </Muted>
                  <CompactInputRow>
                    <InlineFieldLabel htmlFor="gift-voucher-quantity">Anzahl zusätzlicher Startplätze</InlineFieldLabel>
                    <SmallNumberInput
                      id="gift-voucher-quantity"
                      type="number"
                      min="0"
                      max="20"
                      value={giftVoucherQuantity}
                      onFocus={(e) => {
                        if (e.target.value === "0") setGiftVoucherQuantity("");
                      }}
                      onBlur={() => {
                        if (giftVoucherQuantity === "") setGiftVoucherQuantity("0");
                      }}
                      onChange={(e) => setGiftVoucherQuantity(e.target.value)}
                    />
                    <PriceHint>je {formatEuro(EVENT_ENTRY_FEE)}</PriceHint>
                  </CompactInputRow>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardTitle><Users /> Bereits registriert</CardTitle>
                  <Muted>Du kannst hier keine zweite Event-Anmeldung anlegen. Zusätzliche Startplätze zum Verschenken oder für Sammelanmeldungen sowie Bekleidungsinteresse sind aber weiterhin möglich.</Muted>
                  <div style={{ marginTop: 12 }}>
                    <div>Status: <strong>{existingRegistration.payment_status}</strong></div>
                    <div>Referenzcode: <strong>{existingRegistration.payment_reference_code}</strong></div>
                    <div>Offener Teilnahmebeitrag: <strong>{formatEuro((existingRegistration.expected_amount || 0) - (existingRegistration.paid_amount || 0))}</strong></div>
                  </div>
                </Card>

                <Card>
                  <CardTitle><Gift /> Zusätzliche Startplätze für Freunde / Sammelanmeldung</CardTitle>
                  <Muted style={{ marginBottom: 10 }}>Hier kannst du nachträglich weitere Startplätze für Freunde, Bekannte oder eine Sammelanmeldung reservieren.</Muted>
                  <Muted style={{ marginBottom: 10 }}>
                    Die Zusatzreservierung wird erst nach bestätigter Zahlung wirksam. Danach erscheinen die Geschenk-Codes in `Meine Anmeldung` und können einzeln verteilt werden.
                  </Muted>
                  <Muted style={{ marginBottom: 10 }}>
                    So kann eine Person gesammelt bezahlen und die Teilnehmer melden sich später jeweils selbst mit ihrem Code an.
                  </Muted>
                  <CompactInputRow>
                    <InlineFieldLabel htmlFor="addon-voucher-quantity">Anzahl zusätzlicher Startplätze</InlineFieldLabel>
                    <SmallNumberInput
                      id="addon-voucher-quantity"
                      type="number"
                      min="0"
                      max="20"
                      value={addonVoucherQuantity}
                      onFocus={(e) => {
                        if (e.target.value === "0") setAddonVoucherQuantity("");
                      }}
                      onBlur={() => {
                        if (addonVoucherQuantity === "") setAddonVoucherQuantity("0");
                      }}
                      onChange={(e) => setAddonVoucherQuantity(e.target.value)}
                    />
                    <PriceHint>je {formatEuro(EVENT_ENTRY_FEE)}</PriceHint>
                  </CompactInputRow>
                  <Label>Notiz (optional)</Label>
                  <Textarea value={addonNote} onChange={(e) => setAddonNote(e.target.value)} maxLength={220} />
                  <LegalPanel style={{ marginTop: "0.5rem" }}>
                    <LegalHeadline>Pflichtinformationen zur Zusatzreservierung</LegalHeadline>
                    <LegalList>
                      <li>Leistung: zusätzliche Startplätze der Ice-Tour 2026 inklusive später verteilbarer Geschenk-Codes</li>
                      <li>Teilnahmebeitrag pro zusätzlichem Startplatz: {formatEuro(EVENT_ENTRY_FEE)}</li>
                      <li>Zahlungsart: {EVENT_PAYMENT_PROVIDER_NAME}</li>
                    </LegalList>
                    <LegalSmall>
                      Anbieter: {EVENT_ORGANIZER_NAME}, {EVENT_ORGANIZER_STREET}, {EVENT_ORGANIZER_POSTAL_CITY}, {EVENT_ORGANIZER_COUNTRY}. Kontakt: {EVENT_PAYMENT_CONTACT_EMAIL}.
                    </LegalSmall>
                    <LegalSmall>
                      {EVENT_ENTRY_FEE_NOTICE}
                    </LegalSmall>
                    <LegalSmall>
                      Mit Klick auf den Button gibst du eine verbindliche, zahlungspflichtige Zusatzreservierung ab.
                    </LegalSmall>
                  </LegalPanel>
                  <Button type="button" onClick={handleAddonPurchase} disabled={isSubmittingAddon || normalizedAddonVoucherQuantity < 1}>
                    {addonSubmitLabel}
                  </Button>
                  {addonPurchases.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      {addonPurchases.map((purchase) => (
                        <div key={purchase.id} style={{ padding: "0.55rem 0", borderBottom: "1px solid #f3e5bd" }}>
                          <strong>{purchase.payment_reference_code}</strong> - {purchase.gift_voucher_quantity} Codes - <strong>{purchase.status}</strong>
                          {purchase.status !== "paid" && (
                            <div style={{ marginTop: 8 }}>
                              <Button
                                type="button"
                                onClick={() => startAddonStripeCheckout(purchase.id)}
                                disabled={activeAddonCheckoutId === purchase.id}
                              >
                                {activeAddonCheckoutId === purchase.id ? "Weiterleitung..." : `Mit ${EVENT_PAYMENT_PROVIDER_NAME} zahlen`}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            <Card>
              <CardTitle><Shirt /> Bekleidung</CardTitle>
              <Muted style={{ marginBottom: "0.6em" }}>Bekleidungsinteresse wird nur gesammelt. Finale Auswahl und Zahlung für Trikot oder Set laufen später separat.</Muted>
              <JerseyInfoDialog linkOnly={true} />
              <div style={{ border: "1px solid #ffd77a", borderRadius: 8, padding: 12, marginTop: 14, background: "#fffaf0" }}>
                <Label>Bekleidungsinteresse</Label>
                <Select value={clothingInterest} onChange={(e) => setClothingInterest(e.target.value)}>
                  {CLOTHING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}{option.displayPrice ? ` (Richtpreis ${formatEuro(option.displayPrice)})` : ""}</option>
                  ))}
                </Select>
                <Muted>Trikot ca. {formatEuro(JERSEY_DISPLAY_PRICE)}, Set aus Trikot + Hose ca. {formatEuro(KIT_DISPLAY_PRICE)}.</Muted>
                {clothingInterest !== "none" && (
                  <GridRow style={{ marginTop: 12 }}>
                    <div>
                      <Label>Trikotgröße</Label>
                      <Select value={jerseySize} onChange={(e) => setJerseySize(e.target.value)} required={clothingInterest !== "none"}>
                        <option value="">Bitte wählen</option>
                        {TSHIRT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                      </Select>
                    </div>
                    {clothingInterest === "kit_interest" && (
                      <div>
                        <Label>Hosengröße</Label>
                        <Select value={bibSize} onChange={(e) => setBibSize(e.target.value)} required={clothingInterest === "kit_interest"}>
                          <option value="">Bitte wählen</option>
                          {BIB_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                        </Select>
                      </div>
                    )}
                  </GridRow>
                )}
                {existingRegistration && (
                  <Button type="button" onClick={handleUpdateClothing} disabled={isSavingClothing}>
                    {isSavingClothing ? "Speichern..." : "Bekleidungsinteresse aktualisieren"}
                  </Button>
                )}
              </div>
            </Card>

            {registrationMode && (
              <>
                <Card>
                  <CardTitle><HeartHandshake /> Zusätzliche Spende</CardTitle>
                  <Muted style={{ marginBottom: "0.8rem" }}>
                    Dieser Betrag geht zu 100% an den Elternverein krebskranker Kinder e.V.
                  </Muted>
                  <Label>Zusätzlicher Betrag (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={donationAmount}
                    onFocus={(e) => {
                      if (e.target.value === "0") setDonationAmount("");
                    }}
                    onBlur={() => {
                      if (donationAmount === "") setDonationAmount("0");
                    }}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                </Card>
                <Card>
                  <CardTitle><Gift /> Gutschein-Code einlösen</CardTitle>
                  <Muted style={{ marginBottom: "0.8rem" }}>
                    Wenn du bereits einen Gutschein-Code erhalten hast, kannst du ihn hier einlösen. Der Code reduziert deinen eigenen Teilnahmebeitrag.
                  </Muted>
                  <Label>Gutschein-Code (optional)</Label>
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    onBlur={lookupVoucher}
                    placeholder="AB12-CD34-EF56"
                  />
                  {voucherLookup && <StatusBanner tone={voucherLookup.valid ? "success" : "danger"}>{voucherLookup.message}</StatusBanner>}
                </Card>
                <Card>
                  <CardTitle><ShieldAlert /> Teilnahmebedingungen & Newsletter</CardTitle>
                  <CheckboxLabel>
                    <input type="checkbox" checked={acceptWaiver} onChange={(e) => setAcceptWaiver(e.target.checked)} required />
                    <span>Ich habe die <LiabilityWaiver /> gelesen und akzeptiere die Teilnahmebedingungen in der aktuellen Version.</span>
                  </CheckboxLabel>
                  <CheckboxLabel>
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
                    <span>Ja, ich möchte den Newsletter mit Infos zu zukünftigen Events erhalten.</span>
                  </CheckboxLabel>
                </Card>
              </>
            )}
          </div>

          <Summary>
            <Card>
              <CardTitle><Bike /> Preisübersicht</CardTitle>
              {registrationMode ? (
                <>
                  <Flex><span>Eigener Teilnahmebeitrag</span><span>{formatEuro(EVENT_ENTRY_FEE)}</span></Flex>
                    {normalizedGiftVoucherQuantity > 0 && <Flex><span>Zusätzliche Startplätze ({normalizedGiftVoucherQuantity})</span><span>{formatEuro(normalizedGiftVoucherQuantity * EVENT_ENTRY_FEE)}</span></Flex>}
                  {voucherLookup?.valid && <Flex><span>Gutschein-Abzug</span><span>-{formatEuro(EVENT_ENTRY_FEE)}</span></Flex>}
                  {normalizedDonationAmount > 0 && <Flex><span>Zusätzliche Spende</span><span>{formatEuro(normalizedDonationAmount)}</span></Flex>}
                  <SummaryDivider />
                  <Flex style={{ fontWeight: 700, fontSize: 18 }}><span>Gesamtbetrag</span><span>{formatEuro(totalCost)}</span></Flex>
                </>
              ) : (
                <>
                  <Flex><span>Status deiner Anmeldung</span><span>{existingRegistration?.payment_status || "-"}</span></Flex>
                  <Flex><span>Teilnahmebeitrag pro zusätzlichem Startplatz</span><span>{formatEuro(EVENT_ENTRY_FEE)}</span></Flex>
                  {normalizedAddonVoucherQuantity > 0 && <Flex><span>Zusatzreservierung ({normalizedAddonVoucherQuantity})</span><span>{formatEuro(normalizedAddonVoucherQuantity * EVENT_ENTRY_FEE)}</span></Flex>}
                  <SummaryDivider />
                  <Flex style={{ fontWeight: 700, fontSize: 18 }}><span>Zusatzreservierung gesamt</span><span>{formatEuro(normalizedAddonVoucherQuantity * EVENT_ENTRY_FEE)}</span></Flex>
                </>
              )}
            </Card>

            <Card>
              <CardTitle>Pflichtinformationen vor Abgabe</CardTitle>
              {registrationMode ? (
                <LegalPanel>
                  <LegalHeadline>Deine Anmeldung</LegalHeadline>
                  <LegalList>
                    <li>Leistung: Teilnahme an der Ice-Tour 2026 auf der Route {selectedRoute.label} ({selectedRoute.teaser})</li>
                    <li>Termin: {EVENT_DATE}</li>
                    <li>Start und Ziel: {EVENT_START_FINISH.name}, {EVENT_START_FINISH.fullAddress}</li>
                    <li>Zahlungsart: {EVENT_PAYMENT_PROVIDER_NAME}</li>
                    <li>{EVENT_COMMUNITY_RIDE_CLAIM}</li>
                    <li>{EVENT_ENTRY_FEE_NOTICE}</li>
                    {normalizedGiftVoucherQuantity > 0 && <li>Zusatzposition: {normalizedGiftVoucherQuantity} zusätzliche Startplatz{normalizedGiftVoucherQuantity === 1 ? "" : "e"} zum späteren Verschenken oder Verteilen per Code</li>}
                    {voucherLookup?.valid && <li>Eingelöster Gutschein-Code reduziert deinen Teilnahmebeitrag um {formatEuro(EVENT_ENTRY_FEE)}</li>}
                  </LegalList>
                  <LegalSmall>
                    Anbieter: {EVENT_ORGANIZER_NAME}, {EVENT_ORGANIZER_STREET}, {EVENT_ORGANIZER_POSTAL_CITY}, {EVENT_ORGANIZER_COUNTRY}. Kontakt: {EVENT_PAYMENT_CONTACT_EMAIL}.
                  </LegalSmall>
                  <LegalSmall>
                    Weitere Informationen: <a href="/#/impressum" target="_blank" rel="noreferrer">Impressum</a>, <a href="/#/agb" target="_blank" rel="noreferrer">AGB</a>, <a href="/#/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>.
                  </LegalSmall>
                  <LegalSmall>{EVENT_WITHDRAWAL_NOTICE}</LegalSmall>
                  <LegalSmall>
                    Mit Klick auf „Verbindlich anmelden und Teilnahmebeitrag zahlen“ gibst du eine verbindliche, zahlungspflichtige Anmeldung ab.
                  </LegalSmall>
                </LegalPanel>
              ) : (
                <LegalPanel>
                  <LegalHeadline>Deine Zusatzreservierung</LegalHeadline>
                  <LegalList>
                    <li>Leistung: zusätzliche Startplätze der Ice-Tour 2026 inklusive später verteilbarer Geschenk-Codes</li>
                    <li>Zahlungsart: {EVENT_PAYMENT_PROVIDER_NAME}</li>
                    <li>Teilnahmebeitrag pro zusätzlichem Startplatz: {formatEuro(EVENT_ENTRY_FEE)}</li>
                    <li>{EVENT_ENTRY_FEE_NOTICE}</li>
                  </LegalList>
                  <LegalSmall>
                    Anbieter: {EVENT_ORGANIZER_NAME}, {EVENT_ORGANIZER_STREET}, {EVENT_ORGANIZER_POSTAL_CITY}, {EVENT_ORGANIZER_COUNTRY}. Kontakt: {EVENT_PAYMENT_CONTACT_EMAIL}.
                  </LegalSmall>
                  <LegalSmall>
                    Weitere Informationen: <a href="/#/impressum" target="_blank" rel="noreferrer">Impressum</a>, <a href="/#/agb" target="_blank" rel="noreferrer">AGB</a>, <a href="/#/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>.
                  </LegalSmall>
                  <LegalSmall>
                    Mit Klick auf „Zusätzliche Startplätze verbindlich reservieren“ gibst du eine verbindliche, zahlungspflichtige Zusatzreservierung ab.
                  </LegalSmall>
                </LegalPanel>
              )}
            </Card>

            <Card>
              <CardTitle>Was danach passiert</CardTitle>
              <Muted>
                {registrationMode ? (
                  <>
                    1. Deine verbindliche Anmeldung wird gespeichert.
                    <br />
                    2. Danach zahlst du den Teilnahmebeitrag über {EVENT_PAYMENT_PROVIDER_NAME} oder später mit deinem Referenzcode.
                    <br />
                    3. Reservierte Zusatz-Startplätze werden nach bestätigter Zahlung als Geschenk-Codes freigeschaltet.
                    <br />
                    4. Anschließend findest du alle Details in `Meine Anmeldung`.
                  </>
                ) : (
                  <>
                    1. Die Zusatzreservierung wird mit eigenem Referenzcode angelegt.
                    <br />
                    2. Nach bestätigter Zahlung werden die Geschenk-Codes für die zusätzlichen Startplätze freigeschaltet.
                    <br />
                    3. Bekleidungsinteresse wird unabhängig davon direkt an deiner Anmeldung aktualisiert.
                  </>
                )}
              </Muted>
              {registrationMode && (
                <Button type="submit" disabled={isSubmitting || isSoldOut}>{registrationSubmitLabel}</Button>
              )}
            </Card>
          </Summary>
        </MainGrid>
      </form>
      <Footer />
    </PageWrapper>
  );
}
