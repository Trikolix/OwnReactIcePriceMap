import React from "react";
import styled from "styled-components";
import { Calendar, Clock, MapPin, ListChecks, ShieldCheck, Euro, IceCream, Heart } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";

// Dummy Images
const dummyImages = {
    "eisdiele-1": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    "eisdiele-2": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    "eisdiele-3": "https://ice-app.de/uploads/checkins/checkin_693ae020891c99.77757200.jpg",
    "eisdiele-4": "https://ice-app.de/uploads/checkins/checkin_693ae020891c99.77757200.jpg",
    "charity": "https://ice-app.de/uploads/checkins/checkin_693ae020891c99.77757200.jpg"
};

// Constants
const EVENT_DATE = "Wird noch bekannt gegeben. Vermutlich im Zeitraum Mitte Mai - Ende August";
const EVENT_TIME = "Start zwischen 7 und 9 Uhr. Zielschluss wird gegen 18 Uhr sein.";
const ENTRY_FEE = 15;

// Styled Components
const PageWrapper = styled.div`
  font-family: Arial, sans-serif;
  background: #f8fafc;
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
  color: #64748b;
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
  color: #475569;
`;
const CardDescription = styled.div`
  color: #64748b;
  font-size: 1rem;
`;

// Hero
const HeroSection = styled(Section)`
  background: linear-gradient(90deg, #fff4e0ff 0%, #f8fafc 100%);
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
  color: #475569;
`;

// Event Details
const details = [
    { icon: Calendar, title: "Datum", content: EVENT_DATE },
    { icon: Clock, title: "Uhrzeit", content: EVENT_TIME },
    { icon: ListChecks, title: "Ablauf", content: "Freier Start, Checkpunkte ansteuern, Eis genießen, Ziel erreichen." },
    { icon: MapPin, title: "Strecke", content: "Eine sportliche Route von ca. 220km, die euch zu den besten Eisdielen der Region führt. Die genaue Route bekommt ihr kurz vor dem Event zugeschickt." },
    { icon: ShieldCheck, title: "Teilnahmebedingungen", content: "Jeder ist willkommen! Helmpflicht für alle Teilnehmer. Teilnahme auf eigene Gefahr. Es gibt keine abgesperrten Straßen und der Straßenverkehrsordnung ist zu beachten." },
    { icon: Euro, title: "Startgebühren", content: `€${ENTRY_FEE} pro Person. Inklusive einer Kugel Eis an jeder Checkpoint-Eisdiele.` },
];

// Ice Cream Parlors
const parlors = [
    { id: "eisdiele-1", name: "Klatt-Eismanufaktur", description: "Klassische Eissorten und kreative Neuschöpfungen im Herzen der Altstadt." },
    { id: "eisdiele-2", name: "Bäckerei Bräunig", description: "Vegane und laktosefreie Eissorten, die jeden Gaumen verzaubern." },
    { id: "eisdiele-3", name: "Ys Eiscafé", description: "Genießt euer Eis mit einem wunderschönen Blick auf den Fluss." },
    { id: "eisdiele-4", name: "Eisdiele Schöne", description: "Genießt euer Eis mit einem wunderschönen Blick auf den Fluss." },
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
                <HeroTitle>Eisdielen Tour</HeroTitle>
                <HeroSubtitle>
                    Die süßeste Versuchung, seit es Fahrräder gibt.
                </HeroSubtitle>
            </Container>
        </HeroSection>
    );
}

function EventDetails() {
    return (
        <Section bg="#f1f5f9">
            <Container>
                <SectionTitle>Ausschreibung & Details</SectionTitle>
                <SectionDesc>Alle wichtigen Informationen auf einen Blick.</SectionDesc>
                <CardGrid>
                    {details.map((item) => (
                        <Card key={item.title}>
                            <CardHeader>
                                <item.icon size={32} color="#ffb522" />
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
                                    src={dummyImages[parlor.id]}
                                    alt={parlor.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <CardHeader>
                                <IceCream size={24} color="#ffb522" />
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
        <Section bg="#f1f5f9">
            <Container>
                <CharityGrid>
                    <div className="charity-image">
                        <img
                            src={dummyImages["charity"]}
                            alt="Charity"
                            style={{ width: "100%", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                        />
                    </div>
                    <div className="charity-text">
                        <SectionTitle>Radeln für den guten Zweck</SectionTitle>
                        <SectionDesc>
                            Ein Teil der Einnahmen und alle zusätzlichen Spenden gehen direkt an den <strong>Verein für krebskranke Kinder e.V.</strong>
                        </SectionDesc>
                        <p style={{ color: "#64748b", marginBottom: "1.5em" }}>
                            Mit Ihrer Teilnahme unterstützen Sie nicht nur ein tolles Event, sondern helfen auch Familien in schwierigen Zeiten. Der Verein bietet psychosoziale Betreuung, finanzielle Unterstützung und organisiert Freizeitaktivitäten, um den Kindern und ihren Familien Momente der Freude zu schenken.
                        </p>
                        <Button href="/#/event-registration" style={{ border: "1px solid #ffb522", background: "#fff", color: "#ffb522" }}>
                            <Heart size={18} style={{ marginRight: 8 }} /> Spenden & Teilnehmen
                        </Button>
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
