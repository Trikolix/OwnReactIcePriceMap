import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Seo from "../../components/Seo";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import {
  EVENT_LOGIN_REQUIRED_MESSAGE,
  getEventAccessErrorMessage,
  readEventApiJson,
} from "./eventAuthMessages";
import route180GpxFile from "./Ice-Tour_180km.gpx?url";
import route140GpxFile from "./Ice-Tour_140km.gpx?url";
import route70GpxFile from "./Ice-Tour_70km.gpx?url";
import { EVENT_DATE, EVENT_START_FINISH, ROUTE_OPTIONS, formatRouteLabelWithDistance } from "./eventConfig";

const routeDownloads = {
  epic_4: {
    gpxHref: route180GpxFile,
    filename: "Ice-Tour_180km.gpx",
    komootUrl: "https://www.komoot.com/de-de/tour/2921638857?share_token=ac08gPaGi4ReME8kmttpYKuqtOu5fDPCfATg3vdleP6LlEfL4R&ref=wtd&t_s=referral&t_cid=route_share&t_ref_username=912642806792",
  },
  classic_3: {
    gpxHref: route140GpxFile,
    filename: "Ice-Tour_140km.gpx",
    komootUrl: "https://www.komoot.com/de-de/tour/2921634701?share_token=aNQ1wHAphErNlPEj5nGYRSzkpboVzX64jyipEpLeXTBdZvkIlG&ref=wtd&t_s=referral&t_cid=route_share&t_ref_username=912642806792",
  },
  family_2: {
    gpxHref: route70GpxFile,
    filename: "Ice-Tour_70km.gpx",
    komootUrl: "https://www.komoot.com/de-de/tour/2912847861?share_token=atSXhGgtT4QAoVrImuZ1ERPcUhDmI2bLOYBfz4zWHZaMCUblmI&ref=wtd&t_s=referral&t_cid=route_share&t_ref_username=912642806792",
  },
};

const generalRouteHints = [
  "Die Strecke verläuft teilweise auf Radwegen sowie kombinierten Rad- und Fußwegen. Bei schönem Wetter kann dort viel los sein: Nehmt besonders Rücksicht auf Fußgänger und andere Radfahrer.",
];

const sportRouteHints = [
  "In der Abfahrt nach Geyer kommt in einer Rechtskurve eine Abzweigung nach links in den Wald, die ihr nehmen sollt. Fahrt dort vorsichtig.",
  "Zwischen Zwönitz und Geyer über die Geyrische Platte kann teilweise viel Verkehr sein. Fahrt dort besonders rücksichtsvoll, bildet bei Bedarf kleinere Grüppchen und lasst Autos aktiv vorbei.",
];

const getRouteHints = (routeKey) => {
  if (routeKey === "classic_3" || routeKey === "epic_4") {
    return [...sportRouteHints, ...generalRouteHints];
  }

  return generalRouteHints;
};

const scheduleItems = [
  {
    time: "folgt",
    title: "Am Start sammeln",
    text: "Genaue Zeit wird noch bekannt gegeben. Vor Ort gibt es ggf. noch ein kleines Frühstück und eine kurze Einweisung.",
  },
  {
    time: "folgt",
    title: "Start in deiner Gruppe",
    text: "Genaue Zeit wird noch bekannt gegeben.",
  },
  {
    time: "nachmittags",
    title: "Rückkehr & gemeinsamer Abschluss",
    text: "Wenn du fertig bist, gibt es im Ziel nochmal ein Eis, aber auch andere herzhafte Leckereien. Danach ist gemütlicher Ausklang bei Essen, Trinken und Gesprächen.",
  },
];

const packingItems = [
  "Straßentaugliches Rad",
  "Gefüllte Trinkflaschen",
  "GPS Radcomputer oder Handy",
  "Helm",
  "Notfallwerkzeug / Flickzeug",
  "Sonnencreme",
  "etwas Bargeld (für Zusatz-Eis und Notfälle)",
  "Riegel / Gel nach Bedarf",
  "Ice-App auf dem Handy",
];

const groupRules = [
  "Wir fahren freundlich und rücksichtsvoll miteinander.",
  "Die Ice-Tour ist kein Rennen.",
  "Es gibt keine abgesperrten Straßen.",
  "Die StVO gilt jederzeit.",
  "In der Gruppe wird berechenbar gefahren: keine hektischen Manöver, klare Handzeichen, sauber einordnen.",
  "Jeder fährt auf eigenes Risiko, wir übernehmen keine Haftung für Unfälle oder Schäden.",
];

const EVENT_PARKING = {
  name: "Parkplatz Heinrich-Zille-Straße",
  coordinates: "50.842370, 12.926894",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=50.842370%2C%2012.926894",
};

const EVENT_PARKING_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&origin=50.842370%2C%2012.926894&destination=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&travelmode=walking";

const EVENT_PARKING_DIRECTIONS_EMBED_URL =
  "https://www.google.com/maps?f=d&source=s_d&saddr=50.842370%2C%2012.926894&daddr=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&hl=de&output=embed";

export default function EventParticipantInfo() {
  const apiUrl = getApiBaseUrl();
  const { isLoggedIn, authToken, authReady } = useUser();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canView = authReady && isLoggedIn;
  const ownSlot = eventData?.slots?.[0] || null;
  const selectedRoute = useMemo(
    () => ROUTE_OPTIONS.find((route) => route.key === ownSlot?.route_key) || null,
    [ownSlot?.route_key]
  );

  useEffect(() => {
    if (!authReady || !canView || !apiUrl) return;
    if (!authToken) {
      setEventData(null);
      setError(EVENT_LOGIN_REQUIRED_MESSAGE);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${apiUrl}/event2026/me.php`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (res) => {
        const json = await readEventApiJson(res);
        if (!res.ok || json?.status !== "success") {
          throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Teilnehmerdaten konnten nicht geladen werden."));
        }
        if (!cancelled) {
          setEventData(json);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Teilnehmerdaten konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authReady, authToken, canView]);

  if (!canView) {
    return (
      <Page>
        <Seo
          title="Teilnehmerinfos Ice-Tour"
          description="Teilnehmerinformationen zur Ice-Tour."
          robots="noindex,nofollow"
        />
        <Header />
        <Container>
          <Hero>
            <Eyebrow>Teilnehmerbereich</Eyebrow>
            <h1>Bitte einloggen.</h1>
            <p>{EVENT_LOGIN_REQUIRED_MESSAGE}</p>
            {!isLoggedIn && <PrimaryLink to="/ice-tour">Zur Ice-Tour</PrimaryLink>}
          </Hero>
        </Container>
        <Footer />
      </Page>
    );
  }

  return (
    <Page>
      <Seo
        title="Teilnehmerinfos Ice-Tour"
        description="Alle wichtigen Informationen für Teilnehmer der Ice-Tour."
        robots="noindex,nofollow"
      />
      <Header />
      <Container>
        <Hero>
          <Eyebrow>Teilnehmerinfos</Eyebrow>
          <h1>Alles Wichtige für die Ice-Tour</h1>
          <p>
            Downloads, Ablauf, Packliste und Regeln für den Tag.
          </p>
          <HeroMeta>
            <Pill>{EVENT_DATE}</Pill>
            <Pill>{EVENT_START_FINISH.name}</Pill>
            <Pill>{EVENT_START_FINISH.city}</Pill>
          </HeroMeta>
        </Hero>

        <Grid>
          <FullWidthCard>
            <SectionHeader>
              <div>
                <Kicker>Strecken</Kicker>
                <h2>Deine Route</h2>
              </div>
            </SectionHeader>
            {loading && <Muted>Teilnehmerdaten werden geladen...</Muted>}
            {error && <ErrorBox>{error}</ErrorBox>}
            {!loading && !error && selectedRoute && (
              <RouteGrid>
                <RouteCard>
                  <RouteBadge $theme={selectedRoute.badgeTone}>{selectedRoute.shortLabel}</RouteBadge>
                  <h3>{formatRouteLabelWithDistance(selectedRoute.key, selectedRoute.distanceKm)}</h3>
                  <RouteFacts>
                    <span>{selectedRoute.teaser}</span>
                    <span>{selectedRoute.stops} offizielle Stopps</span>
                    <span>Startwelle: {ownSlot?.wave_code || "folgt"}</span>
                  </RouteFacts>
                  <p>{selectedRoute.description}</p>
                  <ButtonRow>
                    <ActionAnchor
                      href={routeDownloads[selectedRoute.key]?.gpxHref}
                      download={routeDownloads[selectedRoute.key]?.filename}
                    >
                      GPX herunterladen
                    </ActionAnchor>
                    {routeDownloads[selectedRoute.key]?.komootUrl ? (
                      <SecondaryAnchor href={routeDownloads[selectedRoute.key].komootUrl} target="_blank" rel="noreferrer">
                        In Komoot öffnen
                      </SecondaryAnchor>
                    ) : (
                      <DisabledButton type="button" disabled>
                        Komoot-Link folgt
                      </DisabledButton>
                    )}
                  </ButtonRow>
                </RouteCard>
              </RouteGrid>
            )}
            {!loading && !error && !selectedRoute && (
              <ErrorBox>Für dich wurde noch keine registrierte Strecke gefunden.</ErrorBox>
            )}
          </FullWidthCard>

          <Card>
            <Kicker>Strecke</Kicker>
            <h2>Wichtige Strecken-Hinweise</h2>
            <WarningList>
              {getRouteHints(selectedRoute?.key).map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </WarningList>
          </Card>

          <Card>
            <Kicker>Ablauf</Kicker>
            <h2>Zeitplan</h2>
            <Timeline>
              {scheduleItems.map((item) => (
                <TimelineItem key={`${item.time}-${item.title}`}>
                  <time>{item.time}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
          </Card>

          <Card>
            <Kicker>Vorbereitung</Kicker>
            <h2>Packliste</h2>
            <Checklist>
              {packingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Checklist>
          </Card>

          <Card>
            <Kicker>Gruppe & Verkehr</Kicker>
            <h2>Verhalten unterwegs</h2>
            <CleanList>
              {groupRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </CleanList>
          </Card>

          <FullWidthCard>
            <Split>
              <div>
                <Kicker>Anfahrt</Kicker>
                <h2>Anfahrt & Parken</h2>
                <p>
                  Wenn du mit dem Auto kommst, parke bitte auf dem ausgewiesenen Parkplatz an der Heinrich-Zille-Straße. Von dort sind es nur
                  wenige Minuten bis zum Start-/Zielbereich bei {EVENT_START_FINISH.name}.
                </p>
                <AddressGrid>
                  <AddressBox>
                    <strong>Parken</strong>
                    <span>{EVENT_PARKING.coordinates}</span>
                  </AddressBox>
                  <AddressBox>
                    <strong>Ziel</strong>
                    <span>{EVENT_START_FINISH.fullAddress}</span>
                  </AddressBox>
                </AddressGrid>
                <ButtonRow>
                  <ActionAnchor href={EVENT_PARKING_DIRECTIONS_URL} target="_blank" rel="noreferrer">
                    Route öffnen
                  </ActionAnchor>
                  <SecondaryAnchor href={EVENT_PARKING.mapsUrl} target="_blank" rel="noreferrer">
                    Parkplatz öffnen
                  </SecondaryAnchor>
                </ButtonRow>
              </div>
              <MapFrameWrap>
                <iframe
                  title="Anfahrtsweg vom Parkplatz an der Heinrich-Zille-Straße zur Unteren Aktienstraße 12"
                  src={EVENT_PARKING_DIRECTIONS_EMBED_URL}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </MapFrameWrap>
            </Split>
          </FullWidthCard>
        </Grid>
      </Container>
      <Footer />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 213, 116, 0.32), transparent 32%),
    linear-gradient(180deg, #fffaf0 0%, #fff3da 100%);
`;

const Container = styled.main`
  width: min(94%, 1120px);
  margin: 0 auto;
  padding: 1rem 0 1.6rem;
`;

const Hero = styled.section`
  background: #fffdfa;
  border: 1px solid rgba(138, 87, 0, 0.14);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(63, 42, 0, 0.1);
  padding: clamp(1.1rem, 3vw, 1.6rem);
  margin-bottom: 1rem;

  h1 {
    margin: 0.25rem 0 0;
    color: #2d1d00;
    font-size: clamp(1.55rem, 4vw, 2.35rem);
    line-height: 1.08;
  }

  p {
    margin: 0.75rem 0 0;
    max-width: 760px;
    color: #6d4a00;
    line-height: 1.55;
  }
`;

const Eyebrow = styled.div`
  color: #9a6500;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
`;

const HeroMeta = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const Pill = styled.span`
  display: inline-flex;
  border-radius: 999px;
  background: #fff3c2;
  border: 1px solid #f3d37a;
  color: #6a4300;
  padding: 0.35rem 0.7rem;
  font-weight: 800;
  font-size: 0.86rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 880px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Card = styled.section`
  background: #fffdfa;
  border: 1px solid rgba(138, 87, 0, 0.13);
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(72, 45, 0, 0.08);
  padding: 1rem;

  h2 {
    margin: 0.2rem 0 0.75rem;
    color: #2d1d00;
    font-size: 1.1rem;
  }

  p {
    color: #5f4100;
    line-height: 1.55;
  }
`;

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const Kicker = styled.div`
  color: #9a6500;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
`;

const Muted = styled.p`
  margin: 0;
  color: #7a5200;
  max-width: 420px;
  line-height: 1.45;
`;

const RouteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.8rem;
`;

const RouteCard = styled.article`
  border: 1px solid #f0dcab;
  background: #fffaf0;
  border-radius: 14px;
  padding: 0.95rem;

  h3 {
    margin: 0.55rem 0 0.35rem;
    color: #2d1d00;
  }

  p {
    color: #6d4a00;
    line-height: 1.45;
    margin: 0.65rem 0 0;
  }
`;

const RouteBadge = styled.span`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid ${({ $theme }) => $theme?.border || "#f3d37a"};
  background: ${({ $theme }) => $theme?.background || "#fff3c2"};
  color: ${({ $theme }) => $theme?.text || "#6a4300"};
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 900;
`;

const RouteFacts = styled.div`
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;

  span {
    background: #fffdfa;
    border: 1px solid #f0dcab;
    border-radius: 999px;
    color: #6d4a00;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.25rem 0.5rem;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
`;

const ActionAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #2d1d00;
  color: #fff;
  text-decoration: none;
  font-weight: 800;
  padding: 0.62rem 0.85rem;
`;

const SecondaryAnchor = styled(ActionAnchor)`
  background: #fff6de;
  color: #6a4300;
  border: 1px solid #efcf84;
`;

const DisabledButton = styled.button`
  border: 1px solid #ead9ad;
  border-radius: 10px;
  background: #f7edd3;
  color: #8a6a24;
  font-weight: 800;
  padding: 0.62rem 0.85rem;
`;

const ErrorBox = styled.div`
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #9f1239;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  font-weight: 750;
`;

const CleanList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;

  li {
    border-bottom: 1px dashed rgba(138, 87, 0, 0.2);
    color: #5f4100;
    line-height: 1.45;
    padding-bottom: 0.55rem;
  }

  li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const WarningList = styled(CleanList)`
  li {
    display: grid;
    grid-template-columns: 1.45rem 1fr;
    gap: 0.55rem;
    align-items: start;
  }

  li::before {
    content: "!";
    display: inline-grid;
    place-items: center;
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 0.1rem;
    border-radius: 999px;
    background: #fff3c2;
    border: 1px solid #eab308;
    color: #8a5700;
    font-size: 0.78rem;
    font-weight: 950;
    line-height: 1;
  }
`;

const Checklist = styled(CleanList)`
  grid-template-columns: 1fr;

  @media (min-width: 540px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  li {
    border: 1px solid #f0dcab;
    border-radius: 10px;
    background: #fffaf0;
    padding: 0.55rem 0.65rem;
    font-weight: 750;
  }
`;

const Timeline = styled.div`
  display: grid;
  gap: 0.7rem;
`;

const TimelineItem = styled.div`
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 0.7rem;
  align-items: start;

  time {
    border-radius: 999px;
    background: #fff3c2;
    color: #6a4300;
    font-weight: 900;
    text-align: center;
    padding: 0.35rem 0.45rem;
    font-size: 0.84rem;
  }

  strong {
    color: #2d1d00;
  }

  p {
    margin: 0.25rem 0 0;
    color: #6d4a00;
  }
`;

const Split = styled.div`
  display: grid;
  gap: 1rem;
  align-items: stretch;

  @media (min-width: 860px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const AddressGrid = styled.div`
  display: grid;
  gap: 0.65rem;
  margin-top: 0.8rem;
`;

const AddressBox = styled.div`
  display: grid;
  gap: 0.2rem;
  border: 1px solid #f0dcab;
  background: #fffaf0;
  border-radius: 12px;
  padding: 0.8rem;
  color: #5f4100;
`;

const MapFrameWrap = styled.div`
  min-height: 300px;
  overflow: hidden;
  border: 1px solid #f0dcab;
  border-radius: 14px;
  background: #fffaf0;
  box-shadow: inset 0 0 0 1px rgba(255, 253, 250, 0.72);

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 300px;
    border: 0;
  }
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  margin-top: 1rem;
  border-radius: 10px;
  background: #2d1d00;
  color: #fff;
  text-decoration: none;
  font-weight: 800;
  padding: 0.7rem 1rem;
`;
