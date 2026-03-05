
import React, { useEffect } from "react";
import styled from "styled-components";
import {
    Calendar,
    Clock,
    MapPin,
    ListChecks,
    ShieldCheck,
    Euro,
    IceCream,
    Heart,
    Route,
    Flag,
    Mountain,
} from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import { useUser } from "../../context/UserContext";

const Images = {
    "eisstopp-klatt": "https://scontent-dus1-1.xx.fbcdn.net/v/t39.30808-6/474190233_922200500070659_4489896847841982265_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=f2Jieo4NxeIQ7kNvwEymZdf&_nc_oc=Admmhur-SjlFyrrcmgYgxasGpKasH8oB-82NyxGJyndSrwTLkbccPRYGosnixStGvCE&_nc_zt=23&_nc_ht=scontent-dus1-1.xx&_nc_gid=T4To4o42xMMITD_mnihQdA&oh=00_AfpOUAG0Cm3Bi6Z-1FlKDwVpc2Tf3-fRWD3e_O6qPVaITw&oe=6963F59E",
    "eisstopp-braeunig": "https://www.baeckerei-braeunig.de/wp-content/uploads/baeckerei-braeunig-logo-1.png",
    "eisstopp-schoene": "https://lh3.googleusercontent.com/p/AF1QipMaZZ6abii-iQVOXLTq0AEQ-T7wqFuHJKhIWTg3=s680-w680-h510-rw",
    "eisstopp-elisenhof": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=80",
    "charity": "https://www.ekk-chemnitz.de/wp-content/uploads/2020/09/ekk-logo-300.png"
};

// Constants
const EVENT_DATE = "Samstag, 16. Mai 2026 (voraussichtlich)";
const EVENT_TIME = "Startfenster 7:00-9:00 Uhr, Zielschluss voraussichtlich gegen 18:00 Uhr.";
const ENTRY_FEE = 15;

// Styled Components
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
    width: min(96%, 1040px);
    margin: 0 auto;
`;

const SectionTitle = styled.h2`
    font-size: clamp(1.3rem, 2vw, 1.9rem);
    font-weight: 800;
    text-align: center;
    margin: 0;
`;

const SectionDesc = styled.p`
    text-align: center;
    color: rgba(47, 33, 0, 0.7);
    font-size: 0.95rem;
    margin: 0.45rem auto 0;
    max-width: 780px;
`;

// Card Components
const CardGrid = styled.div`
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    margin-top: 1rem;
    @media (min-width: 760px) {
        grid-template-columns: 1fr 1fr;
    }
`;

const Card = styled.div`
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(47, 33, 0, 0.08);
    box-shadow: 0 10px 28px rgba(28, 20, 0, 0.07);
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1rem 0.5rem 1rem;
`;

const CardTitle = styled.div`
    font-size: 1rem;
    font-weight: 700;
    color: #2f2100;
`;

const CardContent = styled.div`
    padding: 0 1rem 1rem 1rem;
    color: #2f2100;
`;

const CardDescription = styled.div`
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.95rem;
    line-height: 1.45;
`;

// Hero
const HeroSection = styled(Section)`
    padding-top: 1rem;
`;

const HeroCard = styled.div`
    background: rgba(255, 252, 243, 0.96);
    border: 1px solid rgba(47, 33, 0, 0.08);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
    padding: 1rem 1rem 1.1rem;
`;

const HeroTitle = styled.h1`
    font-size: clamp(1.5rem, 2.8vw, 2.2rem);
    font-weight: 800;
    text-align: center;
    margin: 0;
    color: #2f2100;
`;

const HeroSubtitle = styled.p`
    text-align: center;
    margin: 0.45rem 0 0;
    font-size: 1rem;
    color: rgba(47, 33, 0, 0.72);
`;

const KeyFacts = styled.div`
    margin-top: 0.9rem;
    display: grid;
    gap: 0.7rem;
    grid-template-columns: 1fr;
    @media (min-width: 760px) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

const Fact = styled.div`
    display: flex;
    align-items: center;
    gap: 0.55rem;
    justify-content: center;
    border: 1px solid rgba(47, 33, 0, 0.08);
    background: rgba(255, 247, 226, 0.75);
    border-radius: 12px;
    padding: 0.55rem 0.75rem;
    font-size: 0.92rem;
    font-weight: 700;
    color: #5f4200;
`;

const IntroSection = styled(Section)`
    padding-top: 1rem;
`;

const IntroCard = styled(HeroCard)`
    padding: 1.1rem;
`;

const IntroText = styled.p`
    margin: 0;
    text-align: center;
    color: rgba(47, 33, 0, 0.75);
    line-height: 1.5;
`;

// Event Details
const details = [
    { icon: Calendar, title: "Datum", content: EVENT_DATE },
    { icon: Clock, title: "Uhrzeit", content: EVENT_TIME },
    { icon: Flag, title: "Start & Ziel", content: "Start und Zielort wird noch bekannt gegeben." },
    { icon: MapPin, title: "Strecken", content: "Zur Auswahl: 140 km / ca. 1.600 hm (3 Eis-Stopps) oder 175 km / ca. 1.950 hm (4 Eis-Stopps)." },
    { icon: ListChecks, title: "Ablauf", content: "Freier Start, Eis-Stopps anfahren, die Runde schließen und Am Ende noch gemütlich ausklingen lassen." },
    { icon: ShieldCheck, title: "Teilnahmebedingungen", content: "Jeder ist willkommen! Helmpflicht für alle Teilnehmer. Teilnahme auf eigene Gefahr und Kosten. Es gilt die StVO, es ist kein Rennen/keine Zeitfahrveranstaltung. Maximal 150 Teilnehmer. Bei zu geringer Teilnehmerzahl behalten wir uns eine Absage vor." },
    { icon: Euro, title: "Startgebühren", content: `${ENTRY_FEE}€ pro Person. Inklusive einer Kugel Eis an jeder Checkpoint-Eisdiele.` },
];

// Ice Cream Parlors
const parlors = [
    { id: "eisstopp-braeunig", name: "Bäckerei Bräunig", description: "Handwerksbäckerei mit eigener Eisproduktion und regionalem Charakter." },
    { id: "eisstopp-schoene", name: "Eisdiele Schöne", description: "In der Nähe des Schloss Lichtenwalde lockt die Eisdiele Schöne mit selbst hergestelltem Eis, exotische Sorten und freundlichem Service." },
    { id: "eisstopp-klatt", name: "Klatt-Eismanufaktur", description: "Ein sehr gemütlicher Eis-Garten mitten im Grünen mit leckeren, kreativen, hausgemachten Eissorten." },
    { id: "eisstopp-elisenhof", name: "Eiscafé Elisenhof", description: "Zusätzlicher Pflicht-Checkpoint auf der langen 175-km-Strecke." },
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
                <HeroCard>
                    <HeroTitle>Eis-Tour 2026</HeroTitle>
                    <HeroSubtitle>Dicke Gänge, große Kugeln, starke Beine.</HeroSubtitle>
                    <KeyFacts>
                        <Fact><Route size={16} color="#ffb522" /> 140 km / 175 km</Fact>
                        <Fact><Mountain size={16} color="#ffb522" /> 1.600 hm / 1.950 hm</Fact>
                        <Fact><MapPin size={16} color="#ffb522" /> Start & Ziel in Chemnitz</Fact>
                    </KeyFacts>
                </HeroCard>
            </Container>
        </HeroSection>
    );
}

function Intro() {
    return (
        <IntroSection>
            <Container>
                <IntroCard>
                    <IntroText>
                        Wenn Asphalt auf Abenteuer trifft und der Sommer nach Vanille riecht, beginnt unsere
                        <strong> Eis-Tour 2026</strong>: eine sportliche Rennrad-Herausforderung mit rund
                        <strong> 140 Kilometern / 1.600 Höhenmetern</strong> oder
                        <strong> 175 Kilometern / 1.950 Höhenmetern</strong>, die Tempo, Teamgeist
                        und pure Ausdauer fordert. Start und Ziel wird noch bekannt gegeben. Auf beiden Strecken warten drei legendäre Eis-Stopps:
                        <strong> Bäckerei Bräunig</strong>, <strong>Eisdiele Schöne</strong> und
                        <strong> Klatt-Eismanufaktur</strong>. Auf der langen Strecke kommt
                        <strong> Eiscafé Elisenhof </strong> als vierter Pflicht-Stopp dazu.
                        Hier geht es nicht nur um Watt und Bestzeiten,
                        sondern um das perfekte Zusammenspiel aus harten Beinen, kühlem Kopf und großen Kugeln.
                        Gefahren wird unter Einhaltung der <strong>StVO</strong>, ausdrücklich <strong>nicht als Rennen</strong>.
                        Die Teilnehmerzahl ist auf <strong>150 Starter</strong> begrenzt; bei zu geringer Teilnehmerzahl
                        behalten wir uns eine Absage vor.
                    </IntroText>
                </IntroCard>
            </Container>
        </IntroSection>
    );
}

function EventDetails() {
    return (
        <Section>
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
                <SectionDesc>140 km: Bräunig, Schöne, Klatt. 175 km: zusätzlich Eiscafé Elisenhof (Shop ID 22).</SectionDesc>
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
        <Section>
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
                        <p style={{ color: "rgba(47, 33, 0, 0.72)", marginBottom: "1.5em", textAlign: "center" }}>
                            Mit Ihrer Teilnahme unterstützen Sie nicht nur ein tolles Event, sondern helfen auch Familien in schwierigen Zeiten. Der Verein bietet psychosoziale Betreuung, finanzielle Unterstützung und organisiert Freizeitaktivitäten, um den Kindern und ihren Familien Momente der Freude zu schenken.
                            <br /><br />
                            <Button href="/#/event-registration" style={{ border: "1px solid #ffb522", background: "#fff", color: "#b57600" }}>
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
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const { userId, isLoggedIn } = useUser();

    useEffect(() => {
        if (!isLoggedIn || !userId || !apiUrl) {
            return;
        }

        fetch(`${apiUrl}/api/birthday_track_event_page.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }),
        }).catch((error) => {
            console.error("Fehler beim Tracking der Event-Seite:", error);
        });
    }, [apiUrl, isLoggedIn, userId]);

    return (
        <PageWrapper>
            <Header />
            <Hero />
            <Intro />
            <EventDetails />
            <IceCreamParlors />
            <CharityInfo />
            <Footer />
        </PageWrapper>
    );
}
