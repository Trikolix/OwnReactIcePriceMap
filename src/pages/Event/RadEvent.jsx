import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Bike, Calendar, CheckCircle2, Euro, Flag, HeartHandshake, Mail, MapPin, QrCode, Route, ShieldCheck, Smartphone, TimerReset } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";
import Seo from "../../components/Seo";
import { EVENT_COMMUNITY_RIDE_CLAIM, EVENT_DATE, EVENT_ENTRY_FEE, EVENT_ENTRY_FEE_NOTICE, EVENT_PAYMENT_CONTACT_EMAIL, EVENT_START_FINISH, ROUTE_OPTIONS } from "./eventConfig";
import eisdieleSchoeneImage from "./images/eisdiele_schoene.webp";
import eismanufakturKlattImage from "./images/eismanufaktur_klatt.jpg";
import eiscafeElisenhofImage from "./images/eiscafe_elisenhof.webp";
const PARTNER_ICE_CREAM_PARLORS = [
  {
    name: EVENT_START_FINISH.name,
    role: "Start und Ziel aller Routen",
    image: EVENT_START_FINISH.logoUrl,
    description: "Café am Brühl Boulevard, Startpunkt der Tour und perfekter Ort für einen gemütlichen gemeinsamen Ausklang im Ziel.",
  },
  {
    name: "Bäckerei Bräunig",
    role: "Checkpoint auf den sportlichen Routen",
    image: "https://www.baeckerei-braeunig.de/wp-content/uploads/baeckerei-braeunig-logo-1.png",
    description: "Traditionsbäckerei in 5. Generation mit handwerklichem Anspruch, natürlichen Zutaten und selbstgemachtem Eis.",
  },
  {
    name: "Eisdiele Schöne",
    role: "Checkpoint auf allen Routen",
    image: eisdieleSchoeneImage,
    description: "Familienunternehmen mit regionalen Naturprodukten und viel Erfahrung bei Feiern und Veranstaltungen.",
  },
  {
    name: "Klatt Eis",
    role: "Checkpoint auf allen Routen",
    image: eismanufakturKlattImage,
    description: "Kleine Eismanufaktur aus Frankenau mit wechselnden Sorten aus frischen, saisonalen Zutaten und viel Regionalität.",
  },
  {
    name: "Eiscafé Elisenhof",
    role: "Zusätzlicher Stopp auf der Königsrunde",
    image: eiscafeElisenhofImage,
    description: "Wer die Königsrunde dreht, bekommt hier am Töpferbrunnen in Kohren-Sahlis noch einen beliebten zusätzlichen Eisstopp.",
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

const PartnerGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: 1.1rem;
`;

const PartnerCard = styled.article`
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 235, 0.98)),
    #fff;
  border-radius: 24px;
  border: 1px solid rgba(138, 87, 0, 0.12);
  box-shadow: 0 14px 30px rgba(77, 48, 0, 0.09);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
  transform-origin: center center;

  @media (hover: hover) {
    &:hover {
      transform: translateY(-6px) scale(1.03);
      border-color: rgba(255, 181, 34, 0.5);
      box-shadow: 0 22px 42px rgba(77, 48, 0, 0.16);
    }
  }

  &:active {
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(255, 181, 34, 0.5);
    box-shadow: 0 18px 34px rgba(77, 48, 0, 0.14);
  }
`;

const PartnerImageWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #fff;
`;

const PartnerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 220ms ease, filter 220ms ease;

  ${PartnerCard}:hover &,
  ${PartnerCard}:active & {
    transform: scale(1.06);
    filter: saturate(1.06);
  }
`;

const PartnerImageShade = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(47, 33, 0, 0.05) 0%, rgba(47, 33, 0, 0.22) 100%);
  pointer-events: none;
`;

const PartnerBody = styled.div`
  padding: 1rem 1rem 1.1rem;
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

const RouteBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg || "#fff3c2"};
  color: ${({ $color }) => $color || "#8a5700"};
  border: 1px solid ${({ $border }) => $border || "#f0d79a"};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
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

function Hero({ hasEventRegistration }) {
  return (
    <Section style={{ paddingTop: "1rem" }}>
      <Container>
        <HeroCard>
          <HeroTitle>Ice-Tour 2026</HeroTitle>
          <HeroSubtitle>
            Ein Tag auf dem Rad, mehrere Eisdielen-Stopps, gute Leute und am Ende auch noch etwas Gutes tun:
            Die Ice-Tour verbindet gemeinsames Radfahren, Gratis-Eis an offiziellen Checkpoints und freiwillige Spenden für einen guten Zweck.<br /><br />

            Du sammelst digitale Stempel, triffst andere Teilnehmer und genießt eine besondere Runde durch die Region.
            {` ${EVENT_COMMUNITY_RIDE_CLAIM}`}
          </HeroSubtitle>
          <HeroActions>
            {hasEventRegistration ? (
              <Button href="/event-me" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                Meine Anmeldung
              </Button>
            ) : (
              <Button href="/event-registration">Jetzt anmelden</Button>
            )}
          </HeroActions>
          <FactGrid>
            <Fact><Calendar size={18} color="#ffb522" /> {EVENT_DATE}</Fact>
            <Fact><MapPin size={18} color="#ffb522" />{EVENT_START_FINISH.name}, {EVENT_START_FINISH.city}</Fact>
            <Fact><Euro size={18} color="#ffb522" /> {EVENT_ENTRY_FEE} € Teilnahmebeitrag</Fact>
            <Fact><Flag size={18} color="#ffb522" /> Start in kleinen Gruppen oder individuell</Fact>
          </FactGrid>
        </HeroCard>
      </Container>
    </Section>
  );
}

function RouteOverview() {
  const getBadgeIcon = (routeKey) => {
    if (routeKey === "epic_4") return <Flag size={14} />;
    if (routeKey === "classic_3") return <Bike size={14} />;
    return <HeartHandshake size={14} />;
  };

  return (
    <Section>
      <Container>
        <SectionTitle>Die 3 Routen</SectionTitle>
        <SectionDesc>Es stehen für euch 3 Routen zur Auswahl: die Genussrunde über rund 75 km, die Sportliche Runde über 140 km und als längste Option die Königsrunde mit 175 km.</SectionDesc>
        <CardGrid>
          {ROUTE_OPTIONS.map((route) => (
            <Card key={route.key}>
              <RouteBadge $bg={route.badgeTone.background} $border={route.badgeTone.border} $color={route.badgeTone.text}>
                <RouteBadgeIcon>{getBadgeIcon(route.key)}</RouteBadgeIcon>
                {route.label}
              </RouteBadge>
              <h3 style={{ marginBottom: "0.4rem" }}>{route.teaser}</h3>
              <p style={{ color: "#7c4f00", marginTop: 0, lineHeight: 1.5 }}>{route.description}</p>
              <RequirementList>
                <li>{route.stops} offizielle Checkpoints plus Ziel</li>
                <li>{route.routeType === "family" ? "Eigenes Startfenster ohne Tempogruppe" : "Anhand der gewählten Route und Selbsteinschätzung wirst du in eine Startgruppe eingeteilt"}</li>
                <li>{route.routeType === "family" ? "Für alle, die 75 km bewusst genießen und ohne Gruppendruck fahren wollen" : "Für sportliche Starter mit Navigation und Gruppenrhythmus"}</li>
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
    "Entweder hast du bereits einen Ice-App-Account oder du erstellst bei der Registrierung einen Account. Anschließend zahlst du den Teilnahmebeitrag.",
    "Nach erfolgreicher Anmeldung und Zahlung erhältst du Zugang zu deiner Anmeldung. Dort siehst du noch einmal deine Daten, eventuell ergänzte Geschenk-Startplätze und später auch deine Startgruppe, deine Startzeit sowie die konkrete Strecke.",
    "Einige Tage vor dem Event erhältst du noch eine Erinnerungsmail mit allen wichtigen Informationen zur Anreise, zum Ablauf und zur Strecke.",
    "Am Eventtag reist du selbstständig an, startest mit deiner zugeteilten Gruppe bzw. deinem Startzeitfenster und navigierst die gewählte Route mit Radcomputer oder Smartphone.",
    "An jedem Checkpoint bekommst du eine Kugel Eis: Digitale Stempelkarte zeigen, Gratis-Kugel bei der Partnereisdiele abholen, QR-Code scannen oder direkt einen Check-in in der Ice-App anlegen.",
    `Im Ziel bei ${EVENT_START_FINISH.name} wird die Runde per QR-Code oder Check-in abgeschlossen. Danach gibt es einen gemeinsamen Ausklang in der Community.`,
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
          Bei unseren tollen Partnern erhält jeder Starter nach Vorzeigen des Starterpasses eine Kugel Eis gratis. Außerdem besteht die Möglichkeit, eure Trinkflaschen mit Wasser und ISO-Pulver aufzufüllen.<br /><br />
          Nutzt die Gelegenheit gerne, die Eisdielen zu unterstützen – zum Beispiel mit einer zweiten oder dritten Kugel Eis oder auch einem Kaffee oder Stück Kuchen – und geht anschließend optimal gestärkt zurück auf die Strecke.
        </SectionDesc>
        <PartnerGrid>
          {PARTNER_ICE_CREAM_PARLORS.map((parlor) => (
            <PartnerCard key={parlor.name}>
              <PartnerImageWrap>
                <PartnerImage src={parlor.image} alt={parlor.name} />
                <PartnerImageShade />
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

function CharitySection() {
  return (
    <Section>
      <Container>
        <Card style={{ maxWidth: 860, margin: "1rem auto 0" }}>
          <SectionTitle>Radeln und Gutes tun</SectionTitle>
          <p style={{ color: "#7c4f00", lineHeight: 1.6, marginTop: "1rem" }}>
            {EVENT_ENTRY_FEE_NOTICE} Zusätzliche freiwillige Spenden gehen an den <a href="https://www.ekk-chemnitz.de/" target="_blank" rel="noopener noreferrer" style={{ color: "#8a5700", textDecoration: "none", fontWeight: 700 }}>Elternverein krebskranker Kinder e.V. Chemnitz</a>.
          </p>
          <p style={{ color: "#7c4f00", lineHeight: 1.6, marginBottom: 0 }}>
            Den freiwilligen Spendenbetrag kannst du direkt bei der Anmeldung ergänzen. So unterstützt die Ausfahrt optional auch noch Familien in schwierigen Situationen.
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
              <li>Smartphone mit Internet und installierter Ice-App / Ice-App im Browser geöffnet</li>
              <li>Digitale Stempelkarte im persönlichen Event-Portal</li>
              <li>Bereitschaft einen coolen Tag auf dem Rad mit leckerem Eis und coolen Leuten zu verbringen</li>
              <li>Helm, Trinkflaschen, wettergerechte Kleidung und eigenverantwortliche Ausrüstung</li>
            </RequirementList>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Leistungen inklusive / selbst zahlen</h3>
            <RequirementList>
              <li>Inklusive: eine Kugel Eis pro offiziellem Checkpoint</li>
              <li>Inklusive: Iso-Pulver und Leitungswasser zum Auffüllen an den Checkpunkten</li>
              <li>Wer mehr Eis oder etwas anderes essen / trinken möchte, muss das selber zahlen</li>
              <li>Am Start und im Ziel wird es die Möglichkeit geben, Kleinigkeiten zu essen und zu trinken zu kaufen.</li>
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
            <h3>Checkpoint abhaken</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Wenn du GPS aktiviert hast, kannst du vor Ort einfach den Checkpoint abhaken. Sollte das nicht funktionieren, liegt ein QR-Code aus, der beim Scannen ebenfalls den Checkpoint einlöst.
            </p>
          </Card>
          <Card>
            <Smartphone size={28} color="#ffb522" />
            <h3>Ice-App Check-in</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Es wäre natürlich toll, wenn du deine Kugel(n) Eis in der Ice-App eincheckst.<br /><br />
              Wenn es schnell gehen muss, mache einfach ein Foto vom Eis, lege einen leeren Check-in an und füge die Beschreibung später hinzu.
            </p>
          </Card>
          <Card>
            <CheckCircle2 size={28} color="#ffb522" />
            <h3>Zielabschluss</h3>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              Im Ziel wird die Runde noch einmal per QR-Code oder Check-in abgeschlossen. Danach lässt sich dein Finisher-Status sauber auswerten.
            </p>
          </Card>
        </CardGrid>

        <Card style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Tipps für schnelle Checkpoints</h3>
          <RequirementList>
            <li>Tipp: Wenn du Zeit sparen willst, lege vor Ort direkt einen leeren Check-in an, mache ein Foto von deinem Eis und ergänze die Details später entspannt im Ziel.</li>
            <li><strong>Zusatz-Ice-Challenge:</strong> Wer am Eventtag die meisten Eisportionen mit Beweisbild eincheckt, gewinnt ein kleines Präsent.</li>
          </RequirementList>
        </Card>
      </Container>
    </Section>
  );
}

function EventMapSection() {
  return (
    <Section>
      <Container>
        <SectionTitle>Event-Karte am Veranstaltungstag</SectionTitle>
        <SectionDesc>
          Am Eventtag gibt es eine öffentliche Event-Karte. Dort können Interessierte, Freunde und Familie live verfolgen, an welchen offiziellen Eis-Stopps bereits Starter eingecheckt haben.
        </SectionDesc>
        <SplitGrid>
          <Card>
            <h3 style={{ marginTop: 0 }}>Was die Karte zeigt</h3>
            <RequirementList>
              <li>welche offiziellen Checkpoints bereits erreicht wurden</li>
              <li>wie viele Starter an einem Stopp schon eingecheckt haben</li>
              <li>welche Eis-Stopps auf den jeweiligen Routen liegen</li>
            </RequirementList>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Wichtig zu wissen</h3>
            <RequirementList>
              <li>Die Karte wird erst am Eventtag freigeschaltet.</li>
              <li>Sie ist öffentlich sichtbar und kann auch von Nicht-Teilnehmern geöffnet werden.</li>
              <li>In der Anmeldung kannst du zustimmen, dass dein Name und deine Check-in-Zeiten dort sichtbar sind.</li>
            </RequirementList>
          </Card>
        </SplitGrid>
      </Container>
    </Section>
  );
}

function ContactSection() {
  return (
    <Section>
      <Container>
        <Card style={{ maxWidth: 860, margin: "0 auto" }}>
          <SectionTitle>Fragen zum Event?</SectionTitle>
          <SectionDesc>
            Wenn du Fragen zur Anmeldung, zu Geschenk-Startplätzen, zur Route oder zum Ablauf der Community-Ausfahrt hast, schreibe uns einfach eine Mail.
          </SectionDesc>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <a
              href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}?subject=Frage%20zur%20Ice-Tour%202026`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.8rem 1rem",
                borderRadius: 12,
                background: "#fff7e5",
                border: "1px solid #f0d79a",
                color: "#8a5700",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              <Mail size={18} />
              {EVENT_PAYMENT_CONTACT_EMAIL}
            </a>
          </div>
        </Card>
      </Container>
    </Section>
  );
}

function Faq() {
  const items = [
    {
      q: "Wo finde ich die konkreten Routen?",
      a: `Die GPX-Datei mit der Route wird einige Tage vor dem Event im persönlichen Starterbereich zum Download bereitgestellt. So hast du genug Zeit, die Route auf deinen Radcomputer oder dein Smartphone zu laden und dich mit der Navigation vertraut zu machen.`,
    },
    {
      q: "Wie wird der genaue zeitliche Ablauf sein?",
      a: "Der genaue Zeitplan wird noch bekannt gegeben, aber grundsätzlich starten die Gruppen im Laufe des Vormittags im Abstand von einigen Minuten. Die Teilnehmer der längsten Strecke gehen zuerst auf die Runde. Ziel ist, dass alle Gruppen im Laufe des Nachmittags wieder im Ziel eintreffen.",
    },
    {
      q: "Gibt es Verpflegung auf der Strecke?",
      a: "Es gibt keine offizielle Verpflegungsstation mit All-you-can-eat, aber an jedem offiziellen Checkpoint erhältst du eine Kugel Eis deiner Wahl gratis. Außerdem kannst du deine Trinkflaschen mit Leitungswasser und Iso-Pulver auffüllen. Es ist empfehlenswert, zusätzlich eigene Snacks und Getränke mitzunehmen, um unterwegs gut versorgt zu sein. Alternativ könnt ihr die Checkpoints nutzen, um euch dort zusätzlich mit Verpflegung einzudecken. Packt am besten etwas Bargeld ein, falls ihr noch ein Stück Kuchen oder eine zweite oder dritte Kugel Eis kaufen möchtet.",
    },
    {
      q: "Kann ich die Route wechseln?",
      a: "Momentan ist es nicht möglich, auf eine andere Route als die bei der Registrierung gewählte zu wechseln.",
    },
    {
      q: "Muss ich zwingend die Ice-App nutzen?",
      a: "Ja, die Ice-App dient als eure digitale Stempelkarte und als Nachweis, dass ihr Teilnehmer des Events seid. Außerdem könnt ihr damit die Check-ins an den Eis-Stopps vornehmen und habt alle wichtigen Infos zum Event jederzeit griffbereit.",
    },
    {
      q: "Gibt es am Eventtag eine öffentliche Event-Karte?",
      a: "Ja. Die Event-Karte wird am Veranstaltungstag freigeschaltet und ist öffentlich sichtbar. Dort sieht man, welche Starter an welchen offiziellen Checkpoints bereits eingecheckt haben.",
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
  const [hasEventRegistration, setHasEventRegistration] = useState(
    () => localStorage.getItem("event2026_has_registration") === "1"
  );
  const seoDescription = `Ice-Tour 2026 in Chemnitz: Eis-Tour und Spendenfahrt mit ${ROUTE_OPTIONS.map((route) => route.distanceKm).join(", ")} km, offiziellen Eisdielen-Stopps, digitaler Stempelkarte und freiwilligen Spenden für einen guten Zweck.`;
  const seoKeywords = [
    "Ice-Tour 2026",
    "Eis-Tour 2026",
    "Chemnitz",
    "Spendenfahrt",
    "Eisdielen",
    "Eisdielenradtour",
    "Charity Radtour Chemnitz",
    "Fahrrad Event Chemnitz",
    "Community Ride Chemnitz",
    "Radtour Chemnitz Mai 2026",
    "Eisdielen Chemnitz",
    "Ice-App Event",
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      setHasEventRegistration(false);
      return;
    }

    const syncRegistrationState = () => {
      setHasEventRegistration(localStorage.getItem("event2026_has_registration") === "1");
    };

    syncRegistrationState();
    window.addEventListener("storage", syncRegistrationState);
    return () => {
      window.removeEventListener("storage", syncRegistrationState);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) return;

    fetch(`${apiUrl}/api/birthday_track_event_page.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    }).catch(() => { });
  }, [apiUrl, isLoggedIn, userId]);

  return (
    <PageWrapper>
      <Seo
        title="Ice-Tour 2026 in Chemnitz | Eis-Tour, Spendenfahrt und Eisdielen-Stopps"
        description={seoDescription}
        keywords={seoKeywords}
        canonical="/ice-tour-2026.html"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Ice-Tour 2026",
          startDate: "2026-05-16",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          description: seoDescription,
          url: "https://ice-app.de/ice-tour-2026.html",
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
          offers: {
            "@type": "Offer",
            price: String(EVENT_ENTRY_FEE),
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: "https://ice-app.de/event-registration",
          },
          keywords: seoKeywords.join(", "),
        }}
      />
      <Header />
      <Hero hasEventRegistration={hasEventRegistration} />
      <RouteOverview />
      <PartnerParlors />
      <CharitySection />
      <Workflow />
      <RequirementsAndServices />
      <EventTech />
      <EventMapSection />
      <Faq />
      <ContactSection />
      <Section>
        <Container>
          <Card style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Bereit für die Ice-Tour?</h2>
            <p style={{ color: "#7c4f00", lineHeight: 1.5 }}>
              {hasEventRegistration ? (
                <>
                  Sehr cool, du bist bereits angemeldet. Gehe zu deinem <strong>Teilnehmer-Bereich</strong>.
                </>
              ) : (
                <>Bist du bereit für einen unvergesslichen Tag auf dem Rad mit leckerem Eis, guten Leuten und einer privat organisierten Community-Ausfahrt? Dann melde dich jetzt an.</>
              )}
            </p>
            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
              {hasEventRegistration ? (
                <Button href="/event-me" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                  Mein Teilnehmer-Bereich
                </Button>
              ) : (
                <>
                  <Button href="/event-registration">Zur Anmeldung</Button>
                  {/* <Button href="/#/event-gifts" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                    Startplatz verschenken
                  </Button> */}
                </>
              )}
            </div>
          </Card>
        </Container>
      </Section>
      <Footer />
    </PageWrapper>
  );
}
