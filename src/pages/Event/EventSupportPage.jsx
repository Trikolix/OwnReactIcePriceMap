import React from "react";
import styled from "styled-components";
import { Building2, HandCoins, IceCreamCone, Lightbulb, MoveRight } from "lucide-react";
import Seo from "../../components/Seo";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import EventContactForm from "./EventContactForm";
import { EVENT_COMMUNITY_RIDE_CLAIM, EVENT_PAYMENT_CONTACT_EMAIL } from "./eventConfig";

const PageWrapper = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
  color: #2f2100;
`;

const Section = styled.section`
  padding: 1.1rem 0;
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
  margin: 0;
  text-align: center;
  font-size: clamp(2rem, 4vw, 3.1rem);
`;

const HeroText = styled.p`
  margin: 0.8rem auto 0;
  max-width: 840px;
  text-align: center;
  color: rgba(47, 33, 0, 0.74);
  line-height: 1.6;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.2rem;
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin: 0;
  font-size: clamp(1.45rem, 2vw, 2rem);
`;

const SectionDesc = styled.p`
  text-align: center;
  color: rgba(47, 33, 0, 0.7);
  font-size: 0.98rem;
  margin: 0.5rem auto 0;
  max-width: 860px;
  line-height: 1.55;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1.1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const Card = styled.article`
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 12px 28px rgba(28, 20, 0, 0.08);
  padding: 1.15rem;
`;

const IconWrap = styled.div`
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #fff7e5;
  color: #ffb522;
  border: 1px solid #f0d79a;
`;

const CardTitle = styled.h3`
  margin: 0.8rem 0 0.4rem;
`;

const CardText = styled.p`
  margin: 0;
  color: #7c4f00;
  line-height: 1.6;
`;

const InlineLink = styled.a`
  color: #8a5700;
  font-weight: 700;
  text-decoration: none;
`;

export default function EventSupportPage() {
  const seoDescription = "Ice-Tour unterstützen: Firmenaktionen, Spendenbox, strategische Partnerschaften und Kontakt für Eisdielen oder zukünftige Events.";

  return (
    <PageWrapper>
      <Seo
        title="Ice-Tour unterstützen | Firmen, Partner und Eisdielen"
        description={seoDescription}
        canonical="/ice-tour-unterstuetzen"
        keywords={[
          "Ice-Tour unterstützen",
          "Sponsoring Radsport Event",
          "Firmenaktion Spende pro Kilometer",
          "Eisdiele Eventpartner",
          "Ice-Tour Chemnitz",
        ]}
      />
      <Header />
      <Section style={{ paddingTop: "1rem" }}>
        <Container>
          <HeroCard>
            <HeroTitle>Die Ice-Tour unterstützen</HeroTitle>
            <HeroText>
              Die Ice-Tour lebt von Menschen, Partnern und Ideen, die Lust auf ein starkes Event mit guter Wirkung haben.
              {` ${EVENT_COMMUNITY_RIDE_CLAIM}`}
            </HeroText>
            <HeroText>
              Wenn du als Firma, Unterstützer, Eisdiele oder Möglichmacher dabei sein möchtest, melde dich direkt über das Kontaktformular.
            </HeroText>
            <HeroActions>
              <Button href="#ice-tour-kontaktformular">Kontakt aufnehmen</Button>
              <Button href="/ice-tour" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                Zur Event-Seite
              </Button>
            </HeroActions>
          </HeroCard>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>So kannst du helfen</SectionTitle>
          <SectionDesc>
            Ob einmalige Aktion oder langfristige Partnerschaft: Wir suchen Unterstützer, die zur Ice-Tour passen und gemeinsam mit uns etwas Gutes auf die Beine stellen wollen.
          </SectionDesc>
          <CardGrid>
            <Card>
              <IconWrap><Building2 size={24} /></IconWrap>
              <CardTitle>Firmenaktionen mit Wirkung</CardTitle>
              <CardText>
                Deine Firma kann zum Beispiel einen Betrag pro gefahrenem Kilometer oder pro gegessener Kugel Eis am Eventtag spenden. So entsteht eine Aktion mit echtem Bezug zur Tour und klarer Geschichte.
              </CardText>
            </Card>
            <Card>
              <IconWrap><HandCoins size={24} /></IconWrap>
              <CardTitle>Spendenbox vor Ort</CardTitle>
              <CardText>
                Wer lieber direkt unterstützen möchte, kann im Start- und Zielbereich etwas in die Spendenbox geben. Das ist einfach, transparent und ohne zusätzliche Transaktionsgebühren.
              </CardText>
            </Card>
            <Card>
              <IconWrap><Lightbulb size={24} /></IconWrap>
              <CardTitle>Individuelle Partnerschaften</CardTitle>
              <CardText>
                Firmen können sich jederzeit melden, wenn sie gemeinsam mit der Ice-Tour eine passende Strategie entwickeln möchten, von Sichtbarkeit bis gemeinsamer Aktion mit Mehrwert für beide Seiten.
              </CardText>
            </Card>
            <Card>
              <IconWrap><IceCreamCone size={24} /></IconWrap>
              <CardTitle>Eisdielen für zukünftige Events</CardTitle>
              <CardText>
                Auch Eisdielen und Locations dürfen sich gerne melden, wenn sie bei künftigen Ice-Tour-Ausgaben als Partner oder offizieller Stopp dabei sein möchten.
              </CardText>
            </Card>
          </CardGrid>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Vorteile einer Partnerschaft</SectionTitle>
          <SectionDesc>
            Eine Zusammenarbeit mit der Ice-Tour kann sichtbar, lokal verankert und sozial wirksam sein. Je nach Partner gestalten wir die Einbindung passend zum Event und zu euren Zielen.
          </SectionDesc>
          <CardGrid>
            <Card>
              <IconWrap><Lightbulb size={24} /></IconWrap>
              <CardTitle>Sichtbarkeit rund um das Event</CardTitle>
              <CardText>
                Partner können auf der Website sowie in Social-Media-Postings vor und nach dem Event sichtbar eingebunden werden. So entsteht Reichweite mit direktem Bezug zur Aktion.
              </CardText>
            </Card>
            <Card>
              <IconWrap><Building2 size={24} /></IconWrap>
              <CardTitle>Relevante Zielgruppen vor Ort</CardTitle>
              <CardText>
                Die Ice-Tour erreicht potenziell viele Sportlerinnen und Sportler, deren Angehörige, weitere Interessierte und Besucher. Damit entsteht ein natürlicher Kontakt zu einem aktiven, regionalen Publikum.
              </CardText>
            </Card>
            <Card>
              <IconWrap><IceCreamCone size={24} /></IconWrap>
              <CardTitle>Lokal und gemeinschaftlich wirksam</CardTitle>
              <CardText>
                Partner unterstützen sportliche, gemeinschaftliche Aktivitäten und stärken zugleich kleine lokale Gastronomiebetriebe wie Eisdielen, Cafés und Bäckereien entlang der Tour.
              </CardText>
            </Card>
            <Card>
              <IconWrap><HandCoins size={24} /></IconWrap>
              <CardTitle>Soziales Engagement mit Wirkung</CardTitle>
              <CardText>
                Die Unterstützung wirkt über das Event hinaus und hilft dabei, den Elternverein krebskranker Kinder e.V. sichtbar und konkret zu fördern.
              </CardText>
            </Card>
          </CardGrid>
        </Container>
      </Section>

      <Section>
        <Container>
          <EventContactForm
            title="Anfrage für Unterstützung, Partnerschaft oder neue Ideen"
            description="Nutze das Formular für Firmenaktionen, Unterstützung ohne Radteilnahme, Eisdielen-Anfragen oder allgemeine Rückmeldungen zur Ice-Tour. Je konkreter deine Idee ist, desto schneller können wir sinnvoll darauf reagieren."
            sourcePage="ice-tour-support"
          />
          <SectionDesc style={{ marginTop: "0.9rem" }}>
            Wenn das Formular gerade nicht erreichbar ist, kannst du auch direkt an <InlineLink href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}`}>{EVENT_PAYMENT_CONTACT_EMAIL}</InlineLink> schreiben.
          </SectionDesc>
        </Container>
      </Section>

      <Section>
        <Container>
          <Card style={{ textAlign: "center" }}>
            <SectionTitle>Noch unsicher, ob deine Idee passt?</SectionTitle>
            <SectionDesc>
              Melde dich trotzdem. Lieber eine Anfrage zu viel als eine starke Idee, die nie bei uns ankommt.
            </SectionDesc>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
              <Button href="#ice-tour-kontaktformular" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                Formular öffnen <MoveRight size={16} />
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
      <Footer />
    </PageWrapper>
  );
}
