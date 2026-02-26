
import React from "react";
import styled from "styled-components";
import { Calendar, Clock, MapPin, ListChecks, ShieldCheck, Euro, IceCream, Heart } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import "../../styles/eventTheme.css";

const Images = {
    "eisstopp-klatt": "https://scontent-dus1-1.xx.fbcdn.net/v/t39.30808-6/474190233_922200500070659_4489896847841982265_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=f2Jieo4NxeIQ7kNvwEymZdf&_nc_oc=Admmhur-SjlFyrrcmgYgxasGpKasH8oB-82NyxGJyndSrwTLkbccPRYGosnixStGvCE&_nc_zt=23&_nc_ht=scontent-dus1-1.xx&_nc_gid=T4To4o42xMMITD_mnihQdA&oh=00_AfpOUAG0Cm3Bi6Z-1FlKDwVpc2Tf3-fRWD3e_O6qPVaITw&oe=6963F59E",
    "eisstopp-braeunig": "https://www.baeckerei-braeunig.de/wp-content/uploads/baeckerei-braeunig-logo-1.png",
    "eisstopp-ys": "https://eiscafeys.de/wp-content/uploads/2025/09/cropped-IMG_6203-scaled-1.jpeg",
    "eisstopp-schoene": "https://lh3.googleusercontent.com/p/AF1QipMaZZ6abii-iQVOXLTq0AEQ-T7wqFuHJKhIWTg3=s680-w680-h510-rw",
    "charity": "https://www.ekk-chemnitz.de/wp-content/uploads/2020/09/ekk-logo-300.png"
};

// Constants
const EVENT_DATE = "Wird noch bekannt gegeben. Vermutlich im Zeitraum Mitte Mai - Ende August";
const EVENT_TIME = "Start zwischen 7 und 9 Uhr. Zielschluss wird gegen 18 Uhr sein.";
const ENTRY_FEE = 15;

// Styled Components
const PageWrapper = styled.div`
    font-family: Arial, sans-serif;
    background: var(--event-bg);
    min-height: 100vh;
`;

const Section = styled.section`
    padding: 3rem 0;
    background: ${props => props.bg || "none"};
`;
const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem;
`;
const SectionTitle = styled.h2`
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5em;
`;
const SectionDesc = styled.p`
    text-align: center;
    color: var(--event-secondary);
    font-size: 1.1rem;
    margin-bottom: 2em;
`;

// Card Components
const CardGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  @media (min-width: 700px) {
    grid-template-columns: 1fr 1fr;
  }
`;
const Card = styled.div`
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid var(--event-border);
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1rem 0.5rem 1rem;
`;
const CardTitle = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
`;
const CardContent = styled.div`
    padding: 0 1rem 1rem 1rem;
    color: var(--event-text);
`;
const CardDescription = styled.div`
    color: var(--event-secondary);
    font-size: 1rem;
`;

// Hero
const HeroSection = styled(Section)`
    background: linear-gradient(90deg, #fff4e0ff 0%, var(--event-bg) 100%);
    padding: 4rem 0 2rem 0;
`;
const HeroTitle = styled.h1`
  font-size: 2.8rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
`;
const HeroSubtitle = styled.p`
    text-align: center;
    font-size: 1.3rem;
    color: var(--event-text);
`;

// Event Details
const details = [
    { icon: Calendar, title: "Datum", content: EVENT_DATE },
    { icon: Clock, title: "Uhrzeit", content: EVENT_TIME },
    { icon: ListChecks, title: "Ablauf", content: "Freier Start, Checkpunkte ansteuern, Eis genießen, Ziel erreichen." },
    { icon: MapPin, title: "Strecke", content: "Eine sportliche Route von ca. 220km, die euch zu den besten Eisdielen der Region führt. Die genaue Route bekommt ihr kurz vor dem Event zugeschickt." },
    { icon: ShieldCheck, title: "Teilnahmebedingungen", content: "Jeder ist willkommen! Helmpflicht für alle Teilnehmer. Teilnahme auf eigene Gefahr. Es gibt keine abgesperrten Straßen und der Straßenverkehrsordnung ist zu beachten." },
    { icon: Euro, title: "Startgebühren", content: `${ENTRY_FEE}€ pro Person. Inklusive einer Kugel Eis an jeder Checkpoint-Eisdiele.` },
];

// Ice Cream Parlors
const parlors = [
    { id: "eisstopp-ys", name: "Ys Eiscafé", description: "Dein neues Lieblingscafé in mitten von Schneeberg und Bad Schlema. Von Eis, über Kuchen & Torten bis hin zu saftigen Zimtschnecken findest du hier genau das, was dein süßes Herz begehrt" },
    { id: "eisstopp-braeunig", name: "Bäckerei Bräunig", description: "Die familiengeführte Handwerksbäckerei, bietet neben leckeren Kuchen, Brötchen und Brot auch selbst hergestelltes Eis an." },    
    { id: "eisstopp-schoene", name: "Eisdiele Schöne", description: "In der Nähe des Schloss Lichtenwalde lockt die Eisdiele Schöne mit selbst hergestelltem Eis, exotische Sorten und freundlichem Service." },
    { id: "eisstopp-klatt", name: "Klatt-Eismanufaktur", description: "Ein sehr gemütlicher Eis-Garten mitten im Grünen mit leckeren, kreativen, hausgemachten Eissorten." },
];

const CharityGrid = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
  align-items: center;
  .charity-image { order: 0; }
  .charity-text { order: 1; }
  @media (min-width: 700px) {
    grid-template-columns: 1fr 1fr;
    .charity-image { order: 1; }
    .charity-text { order: 0; }
  }
`;



function Hero() {
    return (
        <HeroSection>
            <Container>
                <HeroTitle>Eis-Tour</HeroTitle>
                <HeroSubtitle>
                    Dicke Gänge, Große Kugeln.
                </HeroSubtitle>
            </Container>
        </HeroSection>
    );
}

function EventDetails() {
    return (
        <Section bg="var(--event-bg)">
            <Container>
                <SectionTitle>Ausschreibung & Details</SectionTitle>
                <SectionDesc>Alle wichtigen Informationen auf einen Blick.</SectionDesc>
                <CardGrid>
                    {details.map((item) => (
                        <Card key={item.title}>
                            <CardHeader>
                                <item.icon size={32} color="var(--event-accent)" />
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{item.content}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </CardGrid>
            </Container>
        </Section>
    );
}

function IceCreamParlors() {
    return (
        <Section>
            <Container>
                <SectionTitle>Unsere Eisdielen-Checkpoints</SectionTitle>
                <SectionDesc>An diesen Stationen erwartet euch eine kühle Erfrischung!</SectionDesc>
                <CardGrid>
                    {parlors.map((parlor) => (
                        <Card key={parlor.name}>
                            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                                <img
                                    src={Images[parlor.id]}
                                    alt={parlor.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <CardHeader>
                                <IceCream size={24} color="var(--event-accent)" />
                                <CardTitle>{parlor.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{parlor.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </CardGrid>
            </Container>
        </Section>
    );
}

function CharityInfo() {
    return (
        <Section bg="var(--event-bg)">
            <Container>
                <CharityGrid>
                    <div className="charity-image">
                        <img
                            src={Images["charity"]}
                            alt="Charity"
                            style={{ width: "100%", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                        />
                    </div>
                    <div className="charity-text">
                        <SectionTitle>Radeln für den guten Zweck</SectionTitle>
                        <SectionDesc>
                            Ein Teil der Einnahmen und alle zusätzlichen Spenden gehen direkt an den <strong>Elternverein krebskranker Kinder e.V. Chemnitz</strong>
                        </SectionDesc>
                        <p style={{ color: "#64748b", marginBottom: "1.5em", textAlign: "center" }}>
                            Mit Ihrer Teilnahme unterstützen Sie nicht nur ein tolles Event, sondern helfen auch Familien in schwierigen Zeiten. Der Verein bietet psychosoziale Betreuung, finanzielle Unterstützung und organisiert Freizeitaktivitäten, um den Kindern und ihren Familien Momente der Freude zu schenken.
                            <br /><br />
                            <Button href="/#/event-registration" style={{ border: "1px solid var(--event-accent)", background: "#fff", color: "var(--event-accent)" }}>
                                <Heart size={18} style={{ marginRight: 8 }} /> Spenden & Teilnehmen
                            </Button>
                        </p>

                    </div>
                </CharityGrid>
            </Container>
        </Section>
    );
}



export default function RadEvent() {
    return (
        <PageWrapper>
            <Header />
            <Hero />
            <EventDetails />
            <IceCreamParlors />
            <CharityInfo />
            <Footer />
        </PageWrapper>
    );
}
