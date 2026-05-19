import React from "react";
import styled from "styled-components";
import { Bike, Calendar, Flag, HeartHandshake, IceCreamCone, MapPin, Route, Sparkles } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import Seo from "../../components/Seo";
import EventContactForm from "./EventContactForm";
import {
  EVENT_COMMUNITY_RIDE_CLAIM,
  EVENT_DATE,
  EVENT_ENTRY_FEE,
  EVENT_ENTRY_FEE_NOTICE,
  EVENT_IS_RETROSPECTIVE,
  EVENT_PAYMENT_CONTACT_EMAIL,
  EVENT_START_FINISH,
  ROUTE_OPTIONS,
} from "./eventConfig";
import eisdieleSchoeneImage from "./images/eisdiele_schoene.webp";
import eismanufakturKlattImage from "./images/eismanufaktur_klatt.jpg";
import eiscafeElisenhofImage from "./images/eiscafe_elisenhof.webp";

const PARTNER_ICE_CREAM_PARLORS = [
  {
    name: EVENT_START_FINISH.name,
    role: "Start und Ziel",
    image: EVENT_START_FINISH.logoUrl,
    description: "Café am Brühl Boulevard und gemeinsamer Treffpunkt für Start, Zielankunft und Ausklang.",
  },
  {
    name: "Bäckerei Bräunig",
    role: "Checkpoint",
    image: "https://www.baeckerei-braeunig.de/wp-content/uploads/baeckerei-braeunig-logo-1.png",
    description: "Traditionsbäckerei mit handwerklichem Anspruch, natürlichen Zutaten und selbstgemachtem Eis.",
  },
  {
    name: "Eisdiele Schöne",
    role: "Checkpoint",
    image: eisdieleSchoeneImage,
    description: "Familienunternehmen mit regionalen Naturprodukten und viel Erfahrung bei Feiern und Veranstaltungen.",
  },
  {
    name: "Klatt Eis",
    role: "Checkpoint",
    image: eismanufakturKlattImage,
    description: "Kleine Eismanufaktur aus Frankenau mit wechselnden Sorten aus frischen, saisonalen Zutaten.",
  },
  {
    name: "Eiscafé Elisenhof",
    role: "Checkpoint der Königsrunde",
    image: eiscafeElisenhofImage,
    description: "Der zusätzliche Eisstopp am Töpferbrunnen in Kohren-Sahlis für die lange Runde.",
  },
];

const PageWrapper = styled.div`
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
  min-height: 100vh;
  color: #2f2100;
`;

const Section = styled.section`
  padding: 1.2rem 0;
`;

const Container = styled.div`
  width: min(96%, 1080px);
  margin: 0 auto;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 24px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1.4rem;
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.95rem, 4vw, 3.25rem);
  font-weight: 900;
  text-align: center;
  margin: 0;
`;

const HeroSubtitle = styled.p`
  text-align: center;
  margin: 0.75rem auto 0;
  font-size: 1.05rem;
  color: rgba(47, 33, 0, 0.72);
  max-width: 820px;
  line-height: 1.6;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.2rem;
`;

const FactGrid = styled.div`
  margin-top: 1.2rem;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
`;

const Fact = styled.div`
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 247, 226, 0.75);
  border-radius: 14px;
  padding: 0.85rem;
  font-weight: 700;
  color: #5f4200;
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 800;
  margin: 0;
  text-align: center;
`;

const SectionDesc = styled.p`
  text-align: center;
  color: rgba(47, 33, 0, 0.7);
  font-size: 0.98rem;
  margin: 0.45rem auto 0;
  max-width: 840px;
  line-height: 1.55;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  margin-top: 1.1rem;

  @media (min-width: 840px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.07);
  padding: 1.1rem;
`;

const PartnerGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: 1.1rem;
`;

const PartnerCard = styled.article`
  overflow: hidden;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(138, 87, 0, 0.12);
  box-shadow: 0 14px 30px rgba(77, 48, 0, 0.09);
`;

const PartnerImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #fff7e5;
`;

const PartnerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const PartnerBody = styled.div`
  padding: 1rem 1rem 1.1rem;
`;

const RouteBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg || "#fff3c2"};
  color: ${({ $color }) => $color || "#8a5700"};
  border: 1px solid ${({ $border }) => $border || "#f0d79a"};
  font-weight: 700;
  font-size: 0.82rem;
`;

const RouteBadgeIcon = styled.span`
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
`;

const PartnerTitle = styled.h3`
  margin: 0.7rem 0 0.4rem;
  font-size: 1.12rem;
`;

const PartnerDescription = styled.p`
  color: #7c4f00;
  margin: 0;
  line-height: 1.6;
`;

const SplitGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  margin-top: 1rem;

  @media (min-width: 840px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const BulletList = styled.ul`
  margin: 0.8rem 0 0;
  padding-left: 1.2rem;
  color: #7c4f00;
  line-height: 1.55;
`;

const ContactWrap = styled.div`
  max-width: 860px;
  margin: 0 auto;
`;

function routeIcon(routeKey) {
  if (routeKey === "epic_4") return <Flag size={14} />;
  if (routeKey === "classic_3") return <Bike size={14} />;
  return <HeartHandshake size={14} />;
}

function Hero() {
  return (
    <Section style={{ paddingTop: "1rem" }}>
      <Container>
        <HeroCard>
          <HeroTitle>Ice-Tour 2026 Rückblick</HeroTitle>
          <HeroSubtitle>
            Die Ice-Tour 2026 ist gefahren: über 70 Starterinnen und Starter, mehr als 6.400 gemeinsame Kilometer,
            mehrere hundert Portionen Eis und unzählige kleine Genussmomente bei unseren Partnern.
            Trotz frostiger Temperaturen und müder Beine kamen am Ende vor allem erschöpfte, aber durchweg glückliche Gesichter ins Ziel.
            {` ${EVENT_COMMUNITY_RIDE_CLAIM}`}
          </HeroSubtitle>
          <HeroActions>
            <Button href="/ice-tour-impressionen">Impressionen ansehen</Button>
            <Button href="/ice-tour-selbst-fahren" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Selbst fahren
            </Button>
            <Button href="/event-live" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Event-Karte ansehen
            </Button>
            <Button href="#kontakt-zukunft" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Kontakt für künftige Events
            </Button>
            <Button href="/ice-tour-unterstuetzen" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Unterstützen
            </Button>
          </HeroActions>
          <FactGrid>
            <Fact><Calendar size={18} color="#ffb522" /> {EVENT_DATE}</Fact>
            <Fact><MapPin size={18} color="#ffb522" />{EVENT_START_FINISH.name}, {EVENT_START_FINISH.city}</Fact>
            <Fact><Route size={18} color="#ffb522" /> 70, 145 und 180 km</Fact>
            <Fact><IceCreamCone size={18} color="#ffb522" /> Offizielle Eis-Stopps</Fact>
          </FactGrid>
        </HeroCard>
      </Container>
    </Section>
  );
}

function AnnouncementHero() {
  return (
    <Section style={{ paddingTop: "1rem" }}>
      <Container>
        <HeroCard>
          <HeroTitle>Ice-Tour 2026</HeroTitle>
          <HeroSubtitle>
            Ein Tag auf dem Rad, mehrere Eisdielen-Stopps, gute Leute und am Ende auch noch etwas Gutes tun:
            Die Ice-Tour verbindet gemeinsames Radfahren, Gratis-Eis an offiziellen Checkpoints und freiwillige Spenden für einen guten Zweck.
            {` ${EVENT_COMMUNITY_RIDE_CLAIM}`}
          </HeroSubtitle>
          <HeroActions>
            <Button href="/event-registration">Jetzt anmelden</Button>
            <Button href="/ice-tour-unterstuetzen" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Ice-Tour unterstützen
            </Button>
          </HeroActions>
          <FactGrid>
            <Fact><Calendar size={18} color="#ffb522" /> {EVENT_DATE}</Fact>
            <Fact><MapPin size={18} color="#ffb522" />{EVENT_START_FINISH.name}, {EVENT_START_FINISH.city}</Fact>
            <Fact><Route size={18} color="#ffb522" /> 75, 140 und 180 km</Fact>
            <Fact><IceCreamCone size={18} color="#ffb522" /> {EVENT_ENTRY_FEE} € Teilnahmebeitrag</Fact>
          </FactGrid>
        </HeroCard>
      </Container>
    </Section>
  );
}

function RouteOverview() {
  return (
    <Section>
      <Container>
        <SectionTitle>Die gefahrenen Routen</SectionTitle>
        <SectionDesc>
          Zur Auswahl standen drei Routen: die Genussrunde über 75 km, die Sportliche Runde über 140 km
          und die Königsrunde mit 180 km.
        </SectionDesc>
        <CardGrid>
          {ROUTE_OPTIONS.map((route) => (
            <Card key={route.key}>
              <RouteBadge $bg={route.badgeTone.background} $border={route.badgeTone.border} $color={route.badgeTone.text}>
                <RouteBadgeIcon>{routeIcon(route.key)}</RouteBadgeIcon>
                {route.label}
              </RouteBadge>
              <h3 style={{ marginBottom: "0.4rem" }}>{route.teaser}</h3>
              <p style={{ color: "#7c4f00", marginTop: 0, lineHeight: 1.5 }}>{route.description}</p>
              <BulletList>
                <li>{route.stops} offizielle Checkpoints plus Ziel</li>
                <li>{route.routeType === "family" ? "Freies Startfenster für die kompakte Runde" : "Sportliche Gruppen mit gemeinsamer Orientierung"}</li>
                <li>Eis-Stopps, Check-ins und gemeinsamer Ausklang als verbindendes Element</li>
              </BulletList>
            </Card>
          ))}
        </CardGrid>
      </Container>
    </Section>
  );
}

function PartnerParlors() {
  return (
    <Section>
      <Container>
        <SectionTitle>Partnereisdielen 2026</SectionTitle>
        <SectionDesc>
          Die Route lebte von den Eisdielen und Cafés entlang der Strecke. Dort gab es die offiziellen Stopps,
          Eis für die Starter und Gelegenheit zum Auffüllen der Flaschen.
        </SectionDesc>
        <PartnerGrid>
          {PARTNER_ICE_CREAM_PARLORS.map((parlor) => (
            <PartnerCard key={parlor.name}>
              <PartnerImageWrap>
                <PartnerImage src={parlor.image} alt={parlor.name} />
              </PartnerImageWrap>
              <PartnerBody>
                <RouteBadge>{parlor.role}</RouteBadge>
                <PartnerTitle>{parlor.name}</PartnerTitle>
                <PartnerDescription>{parlor.description}</PartnerDescription>
              </PartnerBody>
            </PartnerCard>
          ))}
        </PartnerGrid>
      </Container>
    </Section>
  );
}

function RetrospectiveSection() {
  return (
    <Section>
      <Container>
        <SplitGrid>
          <Card>
            <Sparkles size={28} color="#ffb522" />
            <h2>Was die Tour ausgemacht hat</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.6 }}>
              Die Ice-Tour war genau das, was sie sein sollte: kein Rennen, sondern ein richtig starkes Community-Event
              mit Teamwork auf der Strecke, gegenseitiger Hilfe an den richtigen Stellen und Eis als rotem Faden durch den Tag.
              Viele waren nach den Kilometern und den kühlen Temperaturen sichtbar geschafft, aber die Stimmung im Ziel war eindeutig:
              müde Beine, warme Gespräche und viele glückliche Gesichter.
            </p>
            <BulletList>
              <li>über 70 Starterinnen und Starter auf drei Routen</li>
              <li>mehr als 6.400 gefahrene Kilometer</li>
              <li>richtig tolle Genussmomente und leckeres Eis bei allen Partnern</li>
            </BulletList>
          </Card>
          <Card>
            <HeartHandshake size={28} color="#ffb522" />
            <h2>Guter Zweck und Ausblick</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.6 }}>
              Neben all den Kilometern und Eisportionen wurde auch viel gespendet. {EVENT_ENTRY_FEE_NOTICE} Zusätzliche freiwillige Spenden gingen an den{" "}
              <a href="https://www.ekk-chemnitz.de/" target="_blank" rel="noopener noreferrer" style={{ color: "#8a5700", fontWeight: 700, textDecoration: "none" }}>
                Elternverein krebskranker Kinder e.V. Chemnitz
              </a>.
            </p>
            <p style={{ color: "#7c4f00", lineHeight: 1.6, marginBottom: 0 }}>
              Sehr oft kam die Rückmeldung, dass die Ice-Tour wiederholt werden soll. Und genau danach fühlt es sich auch an:
              Es wird sehr wahrscheinlich eine weitere Auflage geben. Für künftige Events sind Partner, Eisdielen und Unterstützer weiterhin willkommen.
            </p>
          </Card>
        </SplitGrid>
      </Container>
    </Section>
  );
}

function AnnouncementInfo() {
  return (
    <Section>
      <Container>
        <SplitGrid>
          <Card>
            <Sparkles size={28} color="#ffb522" />
            <h2>So ist die Ice-Tour gedacht</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.6 }}>
              Die Ice-Tour ist eine Community-Ausfahrt mit digitalen Stempeln, offiziellen Eis-Stopps und einem gemeinsamen Ausklang.
              Sie ist kein Rennen; Navigation, Ausrüstung und Fahrt erfolgen eigenverantwortlich.
            </p>
            <BulletList>
              <li>Wähle eine der drei Routen passend zu deinem Tag.</li>
              <li>Nutze deine digitale Stempelkarte an den Checkpoints.</li>
              <li>Genieße Eis, Strecke und Community ohne Renncharakter.</li>
            </BulletList>
          </Card>
          <Card>
            <HeartHandshake size={28} color="#ffb522" />
            <h2>Guter Zweck</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.6 }}>
              {EVENT_ENTRY_FEE_NOTICE} Zusätzliche freiwillige Spenden gehen an den{" "}
              <a href="https://www.ekk-chemnitz.de/" target="_blank" rel="noopener noreferrer" style={{ color: "#8a5700", fontWeight: 700, textDecoration: "none" }}>
                Elternverein krebskranker Kinder e.V. Chemnitz
              </a>.
            </p>
            <div style={{ marginTop: "1rem" }}>
              <Button href="/event-registration">Zur Registrierung</Button>
            </div>
          </Card>
        </SplitGrid>
      </Container>
    </Section>
  );
}

function ContactSection() {
  return (
    <Section id="kontakt-zukunft">
      <Container>
        <ContactWrap>
          <SectionTitle>{EVENT_IS_RETROSPECTIVE ? "Interesse an künftigen Events?" : "Fragen zur Ice-Tour?"}</SectionTitle>
          <SectionDesc>
            {EVENT_IS_RETROSPECTIVE
              ? "Nutze das Kontaktformular für Rückmeldungen zur Ice-Tour 2026, Ideen für kommende Ausgaben, Partnerschaften oder wenn du als Eisdiele künftig dabei sein möchtest."
              : "Nutze das Kontaktformular für Fragen zur Anmeldung, zur Route, zum Ablauf, für Unterstützungsaktionen, Partnerschaften oder wenn du als Eisdiele bei künftigen Events dabei sein möchtest."}
          </SectionDesc>
          <div style={{ marginTop: "1rem" }}>
            <EventContactForm
              title="Kontakt zur Ice-Tour"
              description={EVENT_IS_RETROSPECTIVE
                ? "Wir lesen jede Anfrage und melden uns per E-Mail zurück. Das gilt für Rückblick, Partnerschaften und neue Ideen rund um kommende Ice-Tour-Ausgaben."
                : "Wir lesen jede Anfrage und melden uns per E-Mail zurück. Das gilt für Eventfragen genauso wie für Partnerschaften und neue Ideen rund um die Ice-Tour."}
              sourcePage={EVENT_IS_RETROSPECTIVE ? "ice-tour-retrospective" : "ice-tour"}
            />
          </div>
          <p style={{ marginTop: "0.9rem", textAlign: "center", color: "#7c4f00", lineHeight: 1.5 }}>
            Alternativ erreichst du uns direkt per Mail unter{" "}
            <a href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}?subject=Ice-Tour%20Kontakt`} style={{ color: "#8a5700", fontWeight: 700, textDecoration: "none" }}>
              {EVENT_PAYMENT_CONTACT_EMAIL}
            </a>.
          </p>
        </ContactWrap>
      </Container>
    </Section>
  );
}

export default function RadEvent() {
  const routeDistances = ROUTE_OPTIONS.map((route) => route.distanceKm).join(", ");
  const seoDescription = EVENT_IS_RETROSPECTIVE
    ? `Rückblick auf die Ice-Tour 2026 in Chemnitz: Community-Ausfahrt mit ${routeDistances} km, Eisdielen-Stopps, digitaler Stempelkarte und Spendenaktion.`
    : `Ice-Tour 2026 in Chemnitz: Community-Ausfahrt mit ${routeDistances} km, offiziellen Eisdielen-Stopps, digitaler Stempelkarte und Spendenaktion.`;
  const seoKeywords = EVENT_IS_RETROSPECTIVE ? [
    "Ice-Tour 2026 Rückblick",
    "Eis-Tour 2026",
    "Chemnitz",
    "Spendenfahrt",
    "Eisdielenradtour",
    "Community Ride Chemnitz",
    "Ice-App Event",
  ] : [
    "Ice-Tour 2026",
    "Eis-Tour 2026",
    "Chemnitz",
    "Spendenfahrt",
    "Eisdielenradtour",
    "Fahrrad Event Chemnitz",
    "Community Ride Chemnitz",
    "Ice-App Event",
  ];

  return (
    <PageWrapper>
      <Seo
        title={EVENT_IS_RETROSPECTIVE ? "Ice-Tour 2026 Rückblick | Eis-Tour, Spendenfahrt und Impressionen" : "Ice-Tour 2026 in Chemnitz | Eis-Tour, Spendenfahrt und Eisdielen-Stopps"}
        description={seoDescription}
        keywords={seoKeywords}
        canonical="/ice-tour"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Ice-Tour 2026",
          startDate: "2026-05-16",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: EVENT_IS_RETROSPECTIVE ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
          description: seoDescription,
          url: "https://ice-app.de/ice-tour",
          location: {
            "@type": "Place",
            name: EVENT_START_FINISH.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: EVENT_START_FINISH.address,
              postalCode: EVENT_START_FINISH.postalCode,
              addressLocality: EVENT_START_FINISH.city,
              addressCountry: "DE",
            },
          },
          ...(EVENT_IS_RETROSPECTIVE ? {} : {
            offers: {
              "@type": "Offer",
              price: String(EVENT_ENTRY_FEE),
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url: "https://ice-app.de/event-registration",
            },
          }),
          keywords: seoKeywords.join(", "),
        }}
      />
      <Header />
      {EVENT_IS_RETROSPECTIVE ? <Hero /> : <AnnouncementHero />}
      <RouteOverview />
      <PartnerParlors />
      {EVENT_IS_RETROSPECTIVE ? <RetrospectiveSection /> : <AnnouncementInfo />}
      <ContactSection />
      <Footer />
    </PageWrapper>
  );
}
