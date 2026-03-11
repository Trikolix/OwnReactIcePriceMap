import React, { useEffect } from "react";
import styled from "styled-components";
import { Calendar, CheckCircle2, Euro, Flag, MapPin, QrCode, Route, ShieldCheck, Smartphone, TimerReset } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import { EVENT_DATE, EVENT_ENTRY_FEE, EVENT_START_FINISH, ROUTE_OPTIONS } from "./eventConfig";
const PARTNER_ICE_CREAM_PARLORS = [
  {
    name: EVENT_START_FINISH.name,
    role: "Start und Ziel aller Routen",
    image: EVENT_START_FINISH.logoUrl,
    description: `Hier treffen sich alle Starter zum Ankommen, Losfahren und gemeinsamen Ausklang im Ziel.`,
  },
  {
    name: "Bäckerei Bräunig",
    role: "Checkpoint auf den sportlichen Routen",
    image: "https://www.baeckerei-braeunig.de/wp-content/uploads/baeckerei-braeunig-logo-1.png",
    description: "Hier wartet eine offizielle Gratis-Kugel für alle Starter der langen Strecken. Perfekt für Nachschub und eine kurze Pause.",
  },
  {
    name: "Eisdiele Schöne",
    role: "Checkpoint auf allen passenden Routen",
    image: "https://lh3.googleusercontent.com/p/AF1QipMaZZ6abii-iQVOXLTq0AEQ-T7wqFuHJKhIWTg3=s680-w680-h510-rw",
    description: "Ein fester Partnereis-Stopp für Familientour und Sportstrecken. Ideal für Kugel, Wasser und gute Laune unterwegs.",
  },
  {
    name: "Klatt Eis",
    role: "Checkpoint auf allen passenden Routen",
    image: "https://scontent-fra3-1.xx.fbcdn.net/v/t39.30808-6/309439806_410674307889950_1629544177299528238_n.png?_nc_cat=108&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=Wlta0QZof7EQ7kNvwFNBC2t&_nc_oc=AdkxeIbOQlznLYTmF3hiNxtBZMlVpZ6Y2kf61_TfEJdYdMecSZ2vrfOB2VzaAa8tJDyitLRPR5DEck5bKKw44A0O&_nc_zt=23&_nc_ht=scontent-fra3-1.xx&_nc_gid=7_v78JiyRM6zyeTNpVjb_Q&_nc_ss=8&oh=00_Afyxd4iCg12hPfU65FtC603zhX6PKRTudCQTnukXTdTTeg&oe=69B769F8",
    description: "Zum Durchatmen, Eis essen und Flaschen auffüllen. Einer der zentralen Partnerstopps des Events.",
  },
  {
    name: "Eiscafé Elisenhof",
    role: "Zusätzlicher Stopp auf der 4-Eis-Stopps-Route",
    image: "https://scontent-fra5-1.xx.fbcdn.net/v/t39.30808-6/302786919_538249798098822_3578997221769686943_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=xSfaI3j1UpoQ7kNvwGkkFy9&_nc_oc=AdlPNxci0ZYcjlIma5GSHD_ZG8YrBhqbVxol02dwmRurboXWKyMskvh3kz8TYTTtherx_NnaZAZPnwYWckqm2P8d&_nc_zt=23&_nc_ht=scontent-fra5-1.xx&_nc_gid=UgHLc03gM1EXLG1CBPmTLw&_nc_ss=8&oh=00_AfwePhh-mZw5e_h85MMlNbdVjDv9xg6r_yKwTPKVj4DPtA&oe=69B75BF9",
    description: "Der Extrapunkt für alle, die die volle Runde fahren und auch den vierten offiziellen Eisstopp mitnehmen.",
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
  font-size: clamp(1.9rem, 4vw, 3.2rem);
  font-weight: 900;
  text-align: center;
  margin: 0;
`;

const HeroSubtitle = styled.p`
  text-align: center;
  margin: 0.7rem auto 0;
  font-size: 1.05rem;
  color: rgba(47, 33, 0, 0.72);
  max-width: 740px;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  line-height: 1.5;
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

const RouteBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #fff3c2;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.82rem;
`;

const Timeline = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
`;

const TimelineItem = styled.div`
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 0.9rem;
  align-items: start;
  background: #fffdf7;
  border: 1px solid #f0d79a;
  border-radius: 16px;
  padding: 1rem;
`;

const Step = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #ffb522;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
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

const RequirementList = styled.ul`
  margin: 0.8rem 0 0;
  padding-left: 1.2rem;
  color: #7c4f00;
  line-height: 1.55;
`;

const FaqGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
`;

function Hero() {
  return (
    <Section style={{ paddingTop: "1rem" }}>
      <Container>
        <HeroCard>
          <HeroTitle>Ice-Tour 2026</HeroTitle>
          <HeroSubtitle>
            Drei Routen, digitale Stempelkarte, Gruppenstarts und eine Kugel Eis an jedem offiziellen Checkpoint.
          </HeroSubtitle>
          <HeroActions>
            <Button href="/#/event-registration">Jetzt anmelden</Button>
            <Button href="/#/event-me" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
              Meine Anmeldung
            </Button>
          </HeroActions>
          <FactGrid>
            <Fact><Calendar size={18} color="#ffb522" /> {EVENT_DATE}</Fact>
            <Fact><MapPin size={18} color="#ffb522" />{EVENT_START_FINISH.name}, {EVENT_START_FINISH.city}</Fact>
            <Fact><Euro size={18} color="#ffb522" /> {EVENT_ENTRY_FEE} € Startgebühr</Fact>
            <Fact><Flag size={18} color="#ffb522" /> Start in kleinen Gruppen oder individuell</Fact>
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
        <SectionTitle>Die 3 Routen</SectionTitle>
        <SectionDesc>Es stehen für euch 3 Routen zur Auswahl, wer die meisten Kilometer und Eis möchte, fährt die vollen 175 km mit 4 Eis-Stopps. Die klassische Tour hat 3 Eis-Stopps und die Einsteiger- / Familientour hat 2 Stopps.</SectionDesc>
        <CardGrid>
          {ROUTE_OPTIONS.map((route) => (
            <Card key={route.key}>
              <RouteBadge>{route.label}</RouteBadge>
              <h3 style={{ marginBottom: "0.4rem" }}>{route.teaser}</h3>
              <p style={{ color: "#7c4f00", marginTop: 0, lineHeight: 1.5 }}>{route.description}</p>
              <RequirementList>
                <li>{route.stops} offizielle Eis-Stopps</li>
                <li>{route.routeType === "family" ? "Eigenes Startfenster ohne Tempogruppe" : "Startgruppe nach Strecke und Selbsteinschätzung"}</li>
                <li>{route.routeType === "family" ? "Ideal für Einsteiger und gemeinsame Familienrunde" : "Für sportliche Starter mit Navigation und Gruppenrhythmus"}</li>
              </RequirementList>
            </Card>
          ))}
        </CardGrid>
      </Container>
    </Section>
  );
}

function Workflow() {
  const steps = [
    "Registrierung mit bestehendem Ice-App Account oder mit neuem Account im Event-Flow, anschließend Zahlung der Startgebühr.",
    "Nach erfolgreicher Registrierung und Zahlung erscheinen Route, Invite-Links für weitere Startplätze und später Startgruppe plus Startzeit in deinem persönlichen Portal.",
    `Einige Tage vor dem Event folgt eine Erinnerungsmail. Roadbook, GPX, Anreise zum Treffpunkt ${EVENT_START_FINISH.name} und Event-Hinweise stehen im geschützten Starter-Bereich.`,
    `Am Eventtag reist du zu ${EVENT_START_FINISH.name} in der ${EVENT_START_FINISH.fullAddress} an, startest mit deiner Gruppe oder im Startfenster und navigierst die gewählte Route mit Radcomputer oder Smartphone.`,
    "An jedem Checkpoint isst du natürlich Eis: digitale Stempelkarte zeigen, Gratis-Kugel bei der Partnereisdiele abholen, QR-Code scannen oder direkt einen Check-in in der Ice-App anlegen.",
    `Im Ziel bei ${EVENT_START_FINISH.name} wird die Runde per QR oder Check-in abgeschlossen, danach gemeinsamer Ausklang und optional kleine Siegerehrung.`,
  ];

  return (
    <Section>
      <Container>
        <SectionTitle>So läuft das Event ab</SectionTitle>
        <Timeline>
          {steps.map((text, idx) => (
            <TimelineItem key={idx}>
              <Step>{idx + 1}</Step>
              <div style={{ color: "#7c4f00", lineHeight: 1.5 }}>{text}</div>
            </TimelineItem>
          ))}
        </Timeline>
      </Container>
    </Section>
  );
}

function PartnerParlors() {
  return (
    <Section>
      <Container>
        <SectionTitle>Unsere Partnereisdielen</SectionTitle>
        <SectionDesc>
          Bei unseren tollen Partnern gibt es für jeden Starter eine Kugel Eis nach vorzeigen des Starterpass gratis. Ansonsten wird es die Möglichkeit eure Trinkflaschen mit Wasser und ISO-Pulver aufzufüllen. Dies ist eine tolle Gelegenheit, die Eisdielen zu unterstützen in dem ihr eine 2. / 3. Kugel Eis oder auch einen Kaffee, Kuchen euch kauft und optimal gestärkt zurück auf die Strecke geht.
        </SectionDesc>
        <CardGrid style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {PARTNER_ICE_CREAM_PARLORS.map((parlor) => (
            <Card key={parlor.name}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", marginBottom: "0.9rem", overflow: "hidden", borderRadius: 12 }}>
                <img src={parlor.image} alt={parlor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <RouteBadge>{parlor.role}</RouteBadge>
              <h3 style={{ marginBottom: "0.45rem" }}>{parlor.name}</h3>
              <p style={{ color: "#7c4f00", margin: 0, lineHeight: 1.55 }}>{parlor.description}</p>
            </Card>
          ))}
        </CardGrid>
      </Container>
    </Section>
  );
}

function CharitySection() {
  return (
    <Section>
      <Container>
        <SectionTitle>Radeln und Gutes tun</SectionTitle>
        <SectionDesc>
          Mit der Ice-Tour unterstützen wir auch den Elternverein krebskranker Kinder e.V. Chemnitz. Wer möchte, kann bei der Anmeldung zusätzlich spenden.
        </SectionDesc>
        <Card style={{ maxWidth: 860, margin: "1rem auto 0" }}>
          <p style={{ color: "#7c4f00", lineHeight: 1.6, marginTop: 0 }}>
            Die Veranstaltung soll nicht nur Spaß machen, sondern auch etwas Sinnvolles mitnehmen. Zusätzliche Spenden gehen an den Elternverein krebskranker Kinder e.V. Chemnitz.
          </p>
          <p style={{ color: "#7c4f00", lineHeight: 1.6, marginBottom: 0 }}>
            Den Spendenbetrag kannst du direkt bei der Registrierung ergänzen. So wird aus jeder Tour optional auch noch ein kleiner Beitrag für Familien in schwierigen Situationen.
          </p>
        </Card>
      </Container>
    </Section>
  );
}

function RequirementsAndServices() {
  return (
    <Section>
      <Container>
        <SectionTitle>Was du brauchst und was inklusive ist</SectionTitle>
        <SplitGrid>
          <Card>
            <h3 style={{ marginTop: 0 }}>Was du brauchst</h3>
            <RequirementList>
              <li>Navi-Radcomputer mit GPX oder Smartphone mit Navigation</li>
              <li>Smartphone mit Internet und installierter Ice-App</li>
              <li>Digitale Stempelkarte im persönlichen Event-Portal</li>
              <li>Bereitschaft, QR-Codes zu scannen oder Check-ins anzulegen</li>
              <li>Helm, Trinkflaschen und eigenverantwortliche Ausrüstung</li>
              <li>Anreise zum Start- und Zielpunkt bei {EVENT_START_FINISH.name}</li>
            </RequirementList>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Leistungen inklusive / selbst zahlen</h3>
            <RequirementList>
              <li>Inklusive: eine Kugel Eis pro offiziellem Checkpoint</li>
              <li>Inklusive: Iso-Pulver und Leitungswasser zum Auffüllen</li>
              <li>Optional: Kaffee oder kleine Notfall-Snacks am Start bei {EVENT_START_FINISH.name}, je nach Setup</li>
              <li>Selbst zahlen: weitere Speisen und Getränke an den Eisdielen</li>
              <li>Wer mehr Hunger hat, darf die Eisdielen gern zusätzlich unterstützen</li>
            </RequirementList>
          </Card>
        </SplitGrid>
      </Container>
    </Section>
  );
}

function EventTech() {
  return (
    <Section>
      <Container>
        <SectionTitle>Digitale Stempelkarte & Check-ins</SectionTitle>
        <CardGrid style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Card>
            <QrCode size={28} color="#ffb522" />
            <h3>QR am Checkpoint</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              An jeder Station liegen QR-Codes aus. Scan oder Vor-Ort-Check-in haken denselben Stopp auf deiner Stempelkarte ab.
            </p>
          </Card>
          <Card>
            <Smartphone size={28} color="#ffb522" />
            <h3>Ice-App Check-in</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Wenn es schnell gehen muss, kannst du unterwegs schon einchecken und das Eisfoto später im Ziel fertig bearbeiten.
            </p>
          </Card>
          <Card>
            <CheckCircle2 size={28} color="#ffb522" />
            <h3>Zielabschluss</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Im Ziel wird die Runde nochmals per QR oder Check-in abgeschlossen. Danach lässt sich dein Finisher-Status sauber auswerten.
            </p>
          </Card>
        </CardGrid>
        <Card style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Tipps für schnelle Checkpoints</h3>
          <RequirementList>
            <li>Tipp: Wenn du Zeit sparen willst, lege vor Ort direkt einen leeren Check-in an, mach ein Foto von deinem Eis und ergänze die Details später entspannt im Ziel.</li>
            <li>Fun-Hinweis: Wer am Eventtag die meisten Eisportionen mit Beweisbild eincheckt, gewinnt ein kleines Präsent. Vernunft bleibt trotzdem Teamsache.</li>
          </RequirementList>
        </Card>
      </Container>
    </Section>
  );
}

function Faq() {
  const items = [
    {
      q: "Kann ich später die Route wechseln?",
      a: "Im ersten Release nur per Kontaktformular bzw. über das Orga-Team, damit Startgruppen und Checkpoint-Logik konsistent bleiben.",
    },
    {
              q: "Wo finde ich GPX, Roadbook und finale Hinweise?",
      a: `Nur im geschützten Starter-Bereich unter \`Meine Anmeldung\`. Dort stehen auch Start und Ziel bei ${EVENT_START_FINISH.name}. Die Erinnerungsmail verlinkt direkt dorthin.`,
    },
    {
      q: "Muss ich zwingend die Ice-App nutzen?",
      a: "Ja. Für digitale Stempelkarte, QR-Scans und Event-Check-ins ist ein Ice-App Account erforderlich.",
    },
    {
      q: "Wer sieht die Live-Karte?",
      a: "Die Live-Karte ist öffentlich. Je Checkpoint werden aktuelle Zahlen und Detaildaten der bereits eingecheckten Starter angezeigt.",
    },
  ];

  return (
    <Section>
      <Container>
        <SectionTitle>FAQ</SectionTitle>
        <FaqGrid>
          {items.map((item) => (
            <Card key={item.q}>
              <h3 style={{ marginTop: 0 }}>{item.q}</h3>
              <p style={{ marginBottom: 0, color: "#7c4f00", lineHeight: 1.55 }}>{item.a}</p>
            </Card>
          ))}
        </FaqGrid>
      </Container>
    </Section>
  );
}

export default function RadEvent() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { userId, isLoggedIn } = useUser();

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) return;

    fetch(`${apiUrl}/api/birthday_track_event_page.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    }).catch(() => {});
  }, [apiUrl, isLoggedIn, userId]);

  return (
    <PageWrapper>
      <Header />
      <Hero />
      <RouteOverview />
      <PartnerParlors />
      <CharitySection />
      <Workflow />
      <RequirementsAndServices />
      <EventTech />
      <Faq />
      <Section>
        <Container>
          <Card style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Bereit für die Ice-Tour?</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Wenn du bereits angemeldet bist, findest du alle persönlichen Infos in `Meine Anmeldung`. Wenn nicht, kannst du jetzt deinen Startplatz sichern.
            </p>
            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Button href="/#/event-registration">Zur Anmeldung</Button>
              <Button href="/#/event-me" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                Mein Starter-Bereich
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
      <Footer />
    </PageWrapper>
  );
}
