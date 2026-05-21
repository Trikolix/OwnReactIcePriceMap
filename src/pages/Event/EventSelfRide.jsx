import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { Bike, CalendarDays, CheckCircle2, Clock, Download, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import LoginModal from "../../LoginModal";
import Seo from "../../components/Seo";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_PAYMENT_PAYPAL_ADDRESS, ROUTE_OPTIONS, formatRouteLabelWithDistance, getRouteTheme } from "./eventConfig";
import { getEventAccessErrorMessage, readEventApiJson } from "./eventAuthMessages";
import { EVENT_ROUTE_RESOURCES } from "./eventParticipantInfoConfig";
import route70Gpx from "./Ice-Tour_70km.gpx?raw";
import route140Gpx from "./Ice-Tour_140km.gpx?raw";
import route180Gpx from "./Ice-Tour_180km.gpx?raw";

const ROUTE_GPX_CONTENT = {
  family_2: route70Gpx,
  classic_3: route140Gpx,
  epic_4: route180Gpx,
};

const PAYPAL_DONATION_URL = `https://www.paypal.com/donate/?business=${encodeURIComponent(EVENT_PAYMENT_PAYPAL_ADDRESS)}&currency_code=EUR`;

function getRequiredCheckins(routeKey) {
  if (routeKey === "epic_4") return 4;
  if (routeKey === "classic_3") return 3;
  return 2;
}

export default function EventSelfRide() {
  const { isLoggedIn, authToken, userId, username, login } = useUser();
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();
  const isSelfRideEnabled = true;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState(null);
  const [routeKey, setRouteKey] = useState("family_2");
  const [rideDate, setRideDate] = useState("");
  const [gpxDownloadUrl, setGpxDownloadUrl] = useState("");

  const selectedRoute = useMemo(
    () => ROUTE_OPTIONS.find((route) => route.key === routeKey) || ROUTE_OPTIONS[0],
    [routeKey]
  );
  const selectedRouteResources = EVENT_ROUTE_RESOURCES[selectedRoute.key] || {};
  const selectedRouteGpx = ROUTE_GPX_CONTENT[selectedRoute.key] || "";

  const todayRide = state?.today_ride || null;
  const plannedRides = state?.rides || [];

  const loadState = () => {
    if (!isLoggedIn || !apiBase || !isSelfRideEnabled) return;
    setLoading(true);
    setError("");
    fetch(`${apiBase}/event2026/self_ride.php`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (response) => {
        const json = await readEventApiJson(response);
        if (!response.ok || json?.status !== "success") {
          throw new Error(getEventAccessErrorMessage(response.status, json?.message || "Selbstfahrer-Seite konnte nicht geladen werden."));
        }
        setState(json);
        setRideDate((current) => current || json.date_bounds?.min || "");
        if (json.today_ride?.route_key) {
          setRouteKey(json.today_ride.route_key);
        }
      })
      .catch((err) => setError(err.message || "Selbstfahrer-Seite konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadState();
  }, [isLoggedIn, apiBase, authToken, isSelfRideEnabled]);

  useEffect(() => {
    if (todayRide?.stamping_open) {
      navigate("/event-stamp-card?mode=self_ride", { replace: true });
    }
  }, [navigate, todayRide?.stamping_open]);

  useEffect(() => {
    if (!selectedRouteGpx || typeof Blob === "undefined" || typeof URL === "undefined") {
      setGpxDownloadUrl("");
      return undefined;
    }

    const blob = new Blob([selectedRouteGpx], { type: "application/gpx+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    setGpxDownloadUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedRouteGpx]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (!isSelfRideEnabled) {
      setError("Die Selbstfahrer-Funktion ist aktuell nur für den Admin freigeschaltet.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/event2026/self_ride.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ route_key: routeKey, ride_date: rideDate }),
      });
      const json = await readEventApiJson(response);
      if (!response.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(response.status, json?.message || "Tour konnte nicht geplant werden."));
      }
      setState(json);
      if (json.today_ride?.stamping_open) {
        navigate("/event-stamp-card?mode=self_ride", { replace: true });
        return;
      }
      setMessage("Deine Ice-Tour Selbstfahrer-Strecke ist geplant.");
    } catch (err) {
      setError(err.message || "Tour konnte nicht geplant werden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <Seo
        title="Ice-Tour selbst fahren | Ice-App"
        description="Plane deine Ice-Tour Selbstfahrer-Strecke, schalte am gewählten Tag die GPS-Stempelkarte frei und sammle den passenden Ice-Tour Award."
      />
      <Header />
      <Container>
        <Hero>
          <Eyebrow><Bike size={16} /> Ice-Tour Selbstfahrer</Eyebrow>
          <h1>Fahr die Ice-Tour auf eigene Faust.</h1>
          <p>
            Wähle eine Strecke und einen Tag. Am gewählten Datum wird deine GPS-Stempelkarte freigeschaltet.
            Keine Startgebühr, keine Gratis-Kugel, keine QR-Codes vor Ort: einfach losfahren, normal Eis essen gehen
            alle Pflichtstempel plus je nach Strecke mindestens 2, 3 oder 4 Ice-App-Check-ins innerhalb von 24 Stunden sammeln.
            Durch die unterschiedlichen Öffnungszeiten der Eisdielen, kannst du deine Check-ins auch bei anderen Eisdielen auf deiner Route sammeln,
            du musst aber zumindest bei  jedem der offiziellen Stopps einmal kurz anhalten um deine Stempelkarte zu füllen.
          </p>
        </Hero>

        {!isLoggedIn ? (
          <Card>
            <SectionTitle>Login erforderlich</SectionTitle>
            <SectionText>Die Selbstfahrer-Stempelkarte ist an dein Ice-App Konto gebunden.</SectionText>
            <Button type="button" onClick={() => setShowLoginModal(true)}>Einloggen</Button>
          </Card>
        ) : !isSelfRideEnabled ? (
          <Card>
            <SectionTitle>Noch nicht freigeschaltet</SectionTitle>
            <SectionText>Die Selbstfahrer-Funktion ist aktuell nur für den Admin freigeschaltet.</SectionText>
          </Card>
        ) : (
          <>
            <Card>
              <SectionTitle>Tour planen</SectionTitle>
              <SectionText>
                Du kannst heute oder bis zu 14 Tage im Voraus planen. Es ist nur eine Ice-Tour Selbstfahrer-Strecke pro Tag möglich.
              </SectionText>
              <Form onSubmit={handleSubmit}>
                <RouteGrid>
                  {ROUTE_OPTIONS.map((route) => (
                    <RouteOption key={route.key} $selected={route.key === routeKey} $theme={route.badgeTone}>
                      <input
                        type="radio"
                        name="route"
                        checked={route.key === routeKey}
                        onChange={() => setRouteKey(route.key)}
                      />
                      <strong>{formatRouteLabelWithDistance(route.key)}</strong>
                      <span>{route.teaser}</span>
                      <small>{getRequiredCheckins(route.key)} Check-ins in 24 Stunden</small>
                    </RouteOption>
                  ))}
                </RouteGrid>

                <FieldRow>
                  <label htmlFor="ride-date"><CalendarDays size={17} /> Tourtag</label>
                  <input
                    id="ride-date"
                    type="date"
                    value={rideDate}
                    min={state?.date_bounds?.min || ""}
                    max={state?.date_bounds?.max || ""}
                    onChange={(event) => setRideDate(event.target.value)}
                    required
                  />
                </FieldRow>

                <SummaryBox $theme={getRouteTheme(selectedRoute.key)}>
                  <strong>{formatRouteLabelWithDistance(selectedRoute.key)}</strong>
                  <span>{rideDate ? new Date(`${rideDate}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Bitte Datum wählen"}</span>
                  <small>{getRequiredCheckins(selectedRoute.key)} Check-ins im 24h-Fenster für den Award</small>
                </SummaryBox>

                <RouteResourceBox>
                  <strong>Navigation für diese Strecke</strong>
                  <ResourceActions>
                    {gpxDownloadUrl && (
                      <ActionLink href={gpxDownloadUrl} download={selectedRouteResources.gpxFilename || true}>
                        <Download size={16} />
                        GPX herunterladen
                      </ActionLink>
                    )}
                    {selectedRouteResources.komootUrl && (
                      <ActionLink href={selectedRouteResources.komootUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} />
                        Komoot öffnen
                      </ActionLink>
                    )}
                  </ResourceActions>
                </RouteResourceBox>

                <Button type="submit" disabled={saving || !rideDate}>
                  {saving ? "Wird gespeichert..." : "Selbstfahrer-Tour planen"}
                </Button>
              </Form>
              {message && <MessageBox $tone="success">{message}</MessageBox>}
              {error && <MessageBox $tone="error">{error}</MessageBox>}
            </Card>

            {todayRide && (
              <HighlightCard>
                <SectionTitle>Heute fahrbereit</SectionTitle>
                <RideMeta>
                  <span><MapPin size={16} /> {todayRide.route_label} ({todayRide.distance_km} km)</span>
                  <span><Clock size={16} /> bis {new Date(todayRide.expires_at.replace(" ", "T")).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                </RideMeta>
                <SectionText>
                  Deine GPS-Stempelkarte ist heute aktiv. Die Reihenfolge ist frei, der Award wird nach allen Pflichtstempeln und deinen Ice-App-Check-ins im 24h-Fenster geprüft.
                </SectionText>
                <ResourceActions>
                  <ButtonLink to="/event-stamp-card?mode=self_ride">Stempelkarte öffnen</ButtonLink>
                  {gpxDownloadUrl && (
                    <ActionLink href={gpxDownloadUrl} download={selectedRouteResources.gpxFilename || true}>
                      <Download size={16} />
                      GPX
                    </ActionLink>
                  )}
                  {selectedRouteResources.komootUrl && (
                    <ActionLink href={selectedRouteResources.komootUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                      Komoot
                    </ActionLink>
                  )}
                </ResourceActions>
              </HighlightCard>
            )}

            {plannedRides.length > 0 && (
              <Card>
                <SectionTitle>Geplante Touren</SectionTitle>
                <RideList>
                  {plannedRides.map((ride) => (
                    <RideItem key={ride.id}>
                      <span><CheckCircle2 size={16} /> {ride.route_label} ({ride.distance_km} km)</span>
                      <strong>{new Date(`${ride.ride_date}T12:00:00`).toLocaleDateString("de-DE")}</strong>
                      {ride.stamping_open && <InlineLink to="/event-stamp-card?mode=self_ride">Öffnen</InlineLink>}
                    </RideItem>
                  ))}
                </RideList>
              </Card>
            )}

            <Card>
              <SectionTitle>Regeln</SectionTitle>
              <RuleList>
                <li><ShieldCheck size={16} /> Checkpoints zählen nur per GPS-Standort im Umkreis von 300 Metern.</li>
                <li><ShieldCheck size={16} /> Es gibt keine alternativen QR-Codes um die Stempelkarte zu füllen.</li>
                <li><ShieldCheck size={16} /> Die Reihenfolge ist egal, du kannst überall entlang der Strecke starten und enden.</li>
                <li><ShieldCheck size={16} /> Für den Award brauchst du alle Pflichtstempel deiner Strecke und zusätzlich mindestens 2, 3 bzw. 4 Check-ins je nachdem ob du die Genussrunde, die Sport-Route oder die Königsrunde fährst.</li>
                <li><ShieldCheck size={16} /> Es zählen auch Check-ins bei anderen Eisdielen auf deiner Route, falls ein offizieller Ice-Tour-Stopp nicht geöffnet hat.</li>
              </RuleList>
            </Card>

            <Card>
              <SectionTitle>Support</SectionTitle>
              <SectionText>
                Die Selbstfahrer-Variante ist kostenlos. Wenn dir die Ice-Tour gefallen hat, kannst du die Organisation freiwillig unterstützen.
              </SectionText>
              <ActionLink href={PAYPAL_DONATION_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Per PayPal spenden
              </ActionLink>
            </Card>
          </>
        )}

        {loading && <Card><SectionText>Selbstfahrer-Daten werden geladen...</SectionText></Card>}
      </Container>
      <Footer />

      {showLoginModal && (
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          setShowLoginModal={setShowLoginModal}
        />
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #fff8ed 0%, #fff5e7 42%, #fffaf5 100%);
`;

const Container = styled.main`
  width: min(100%, 980px);
  margin: 0 auto;
  padding: 1rem 0.85rem 2rem;
  box-sizing: border-box;
`;

const Hero = styled.section`
  padding: 1.2rem 0 1.4rem;

  h1 {
    margin: 0.45rem 0;
    font-size: clamp(2rem, 5vw, 4.4rem);
    line-height: 0.98;
    color: #2f2100;
  }

  p {
    max-width: 760px;
    color: #6d4a00;
    line-height: 1.6;
    font-size: 1.03rem;
  }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 900;
  color: #8a5700;
`;

const Card = styled.section`
  background: rgba(255, 253, 249, 0.98);
  border: 1px solid rgba(235, 193, 106, 0.38);
  border-radius: 18px;
  box-shadow: 0 14px 34px rgba(124, 79, 0, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const HighlightCard = styled(Card)`
  border-color: rgba(34, 197, 94, 0.34);
  background: linear-gradient(135deg, rgba(220, 252, 231, 0.72), rgba(255, 253, 249, 0.98));
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.45rem;
  color: #2f2100;
  font-size: 1.35rem;
`;

const SectionText = styled.p`
  color: #7c4f00;
  line-height: 1.55;
  margin-top: 0;
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

const RouteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const RouteOption = styled.label`
  display: grid;
  gap: 0.32rem;
  padding: 0.85rem;
  border-radius: 14px;
  border: 2px solid ${({ $selected, $theme }) => ($selected ? $theme.border : "rgba(235, 193, 106, 0.42)")};
  background: ${({ $selected, $theme }) => ($selected ? $theme.background : "#fffaf1")};
  color: #2f2100;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    margin: 0;
  }

  span,
  small {
    color: #7c4f00;
  }
`;

const FieldRow = styled.div`
  display: grid;
  gap: 0.45rem;

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #2f2100;
    font-weight: 800;
  }

  input {
    min-height: 44px;
    border-radius: 12px;
    border: 1px solid #e4c16f;
    padding: 0 0.8rem;
    font: inherit;
    color: #2f2100;
    background: #fff;
  }
`;

const SummaryBox = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-radius: 14px;
  border: 1px solid ${({ $theme }) => $theme.border};
  background: ${({ $theme }) => $theme.background};
  color: ${({ $theme }) => $theme.text};
  padding: 0.8rem;

  small {
    flex-basis: 100%;
    color: #6d4a00;
    font-weight: 800;
  }
`;

const Button = styled.button`
  border: 0;
  border-radius: 13px;
  min-height: 44px;
  padding: 0.75rem 1rem;
  background: #2f2100;
  color: #fff8ea;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }
`;

const ButtonLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 13px;
  padding: 0.75rem 1rem;
  background: #2f2100;
  color: #fff8ea;
  text-decoration: none;
  font-weight: 900;
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  border-radius: 13px;
  padding: 0.75rem 1rem;
  border: 1px solid #e4c16f;
  background: #fff8ea;
  color: #2f2100;
  text-decoration: none;
  font-weight: 900;
`;

const RouteResourceBox = styled.div`
  display: grid;
  gap: 0.6rem;
  border-radius: 14px;
  border: 1px solid rgba(235, 193, 106, 0.42);
  background: #fffaf1;
  padding: 0.8rem;
  color: #2f2100;
`;

const ResourceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
`;

const InlineLink = styled(Link)`
  color: #2f2100;
  font-weight: 900;
`;

const MessageBox = styled.div`
  margin-top: 0.8rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "#fecaca" : "#bbf7d0")};
  background: ${({ $tone }) => ($tone === "error" ? "#fff1f2" : "#f0fdf4")};
  color: ${({ $tone }) => ($tone === "error" ? "#991b1b" : "#166534")};
  font-weight: 700;
`;

const RideMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: #166534;
  font-weight: 800;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const RideList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const RideItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.72rem 0;
  border-bottom: 1px solid rgba(235, 193, 106, 0.3);
  color: #2f2100;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const RuleList = styled.ul`
  display: grid;
  gap: 0.55rem;
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;
  color: #7c4f00;
  line-height: 1.5;

  li {
    display: flex;
    gap: 0.45rem;
    align-items: flex-start;
  }
`;
