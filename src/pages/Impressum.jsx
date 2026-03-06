import Header from '../Header';
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

function Impressum() {
  return (
    <Page>
      <Header />
      <Container>
        <HeroSection>
          <HeroTitle>Über diese Website</HeroTitle>
          <HeroText>
            Ich bin begeisterter Radsportler und wer viel radelt, braucht natürlich auch mal eine Pause.
            Für mich war schnell klar: Die besten Stopps sind die mit Eis.
          </HeroText>
          <HeroText>
            Auf meinen Touren habe ich unzählige Eisdielen entdeckt, manche zufällig, manche gezielt.
            So entstand die Idee zu dieser Plattform:
            <br />
            <Strong>Eisdielen entdecken, teilen und feiern für alle.</Strong>
          </HeroText>
        </HeroSection>

        <Section>
          <Heading>Was du hier machen kannst</Heading>
          <List>
            <ListItem>Neue Eisdielen eintragen</ListItem>
            <ListItem>Eisdielen zu Favoriten hinzufügen</ListItem>
            <ListItem>Einchecken, wenn du Eis schlemmst</ListItem>
            <ListItem>Bewertungen abgeben</ListItem>
            <ListItem>Routen zu Eisdielen speichern und teilen</ListItem>
          </List>
        </Section>

        <Section>
          <Heading>Unsere Mission</Heading>
          <p>Wir wollen gemeinsam:</p>
          <MissionList>
            <li>die <Strong>größten Kugeln</Strong> finden</li>
            <li>die <Strong>besten Kugeleis / Softeis / Eisbecher</Strong> entdecken</li>
            <li>die <Strong>kreativsten Sorten</Strong> bewerten</li>
            <li>die <Strong>freundlichsten Läden</Strong> supporten</li>
            <li>die <Strong>schönsten Eismomente</Strong> teilen</li>
          </MissionList>
          <p>Ob du Team Schoko, Team Mango oder Team Lakritz bist: hier ist Platz für dich.</p>
        </Section>

        <Section>
          <Heading>EP-System: So sammelst du Punkte</Heading>
          <p>
            Wer mitmacht, wird belohnt. Für jede Aktion bekommst du Erfahrungspunkte (EP), mit denen
            du dein Level steigern kannst. Je aktiver du bist, desto mehr EP bekommst du.
          </p>
          <MissionList>
            <li><Strong>Check-in ohne Bild:</Strong> 30 EP</li>
            <li><Strong>Check-in mit Bild:</Strong> 45 EP</li>
            <li><Strong>Bewertung abgeben:</Strong> 20 EP</li>
            <li><Strong>Preis melden:</Strong> 15 EP</li>
            <li><Strong>Route teilen:</Strong> 20 EP</li>
            <li><Strong>Eisdiele eintragen:</Strong> 5 EP (nach erstem Check-in bei der Eisdiele: 25 EP)</li>
            <li><Strong>Nutzer werben:</Strong> 10 EP (nach erstem Check-in: 250 EP)</li>
            <li><Strong>Awards:</Strong> Je nach Schwierigkeit 10 bis 2000 EP</li>
          </MissionList>
          <p>Viel Spaß beim Eis essen, EP sammeln und Level aufsteigen.</p>
        </Section>

        <Section>
          <Heading>Häufige Fragen (FAQ)</Heading>
          <FAQItem>
            <SubHeading>Warum ist meine Lieblingseisdiele noch nicht drin?</SubHeading>
            <p>Vielleicht kennt sie noch niemand hier. Trag sie gern ein, so hilfst du anderen, sie zu entdecken.</p>
          </FAQItem>
          <FAQItem>
            <SubHeading>Wie kann ich mitmachen?</SubHeading>
            <p>Einfach registrieren und loslegen. Check-ins, Bewertungen, Einträge: du gestaltest die Karte mit.</p>
          </FAQItem>
          <FAQItem>
            <SubHeading>Was bedeutet Einchecken?</SubHeading>
            <p>
              Wenn du bei einer Eisdiele bist, kannst du deinen Besuch eintragen. Wähle, ob du Kugeleis,
              Softeis oder einen Eisbecher gegessen hast und bewerte, wie es dir geschmeckt hat.
              Aus den Check-ins werden die jeweiligen Scores für die Eisdielen berechnet.
            </p>
          </FAQItem>
          <FAQItem>
            <SubHeading>Kostet das was?</SubHeading>
            <p>Nö. Diese Seite ist ein Projekt aus Leidenschaft für Eis, nicht fürs Geld.</p>
          </FAQItem>
        </Section>

        <Section>
          <Heading>Noch Fragen?</Heading>
          <p>
            Wenn du Ideen hast, Fehler findest oder einfach sagen willst, wo es das beste Stracciatella gibt,
            melde dich gern.
          </p>
          <p>Und hier findest du noch mehr Infos:</p>
          <LinkRow>
            <StyledLink to="/agb" target="_blank">AGB</StyledLink>
            <StyledLink to="/datenschutz" target="_blank">Datenschutzerklärung</StyledLink>
            <StyledLink to="/community" target="_blank">Community-Richtlinien</StyledLink>
          </LinkRow>
        </Section>

        <Section>
          <Heading>Impressum</Heading>
          <LegalNote>Angaben gemäß § 5 TMG</LegalNote>
          <LegalBox>
            <SubHeading>Name und Anschrift des Anbieters</SubHeading>
            <p>
              Christian Helbig
              <br />
              Henriettenstraße 45
              <br />
              09112 Chemnitz
              <br />
              Deutschland
            </p>

            <SubHeading>Kontakt</SubHeading>
            <p>E-Mail: admin@ice-app.de</p>

            <SubHeading>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</SubHeading>
            <p>Christian Helbig, Adresse wie oben.</p>
          </LegalBox>
          <SubHeading>Hinweis auf nutzergenerierte Inhalte</SubHeading>
          <p>
            Nutzer der App können Inhalte wie Bewertungen, Fotos und Eisdielen-Einträge eigenständig einreichen.
            Diese Inhalte werden nicht vorab geprüft. Sollten Sie auf rechtswidrige Inhalte aufmerksam werden,
            bitten wir um eine kurze Nachricht an die oben genannte E-Mail-Adresse. Solche Inhalte werden
            bei Bekanntwerden umgehend entfernt.
          </p>
        </Section>
      </Container>
    </Page>
  );
}

export default Impressum;

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 181, 34, 0.14), transparent 34%),
    linear-gradient(180deg, #fffdf7 0%, #fff8eb 45%, #ffffff 100%);
`;

const Container = styled.div`
  width: min(900px, calc(100% - 2rem));
  margin: 1.25rem auto 2.5rem;
  display: grid;
  gap: 1rem;
`;

const cardSurface = `
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 16px;
  box-shadow: 0 14px 28px rgba(47, 33, 0, 0.07);
`;

const HeroSection = styled.section`
  ${cardSurface}
  padding: 1.4rem 1.25rem;
  background:
    linear-gradient(120deg, rgba(255, 181, 34, 0.18), rgba(255, 255, 255, 0.96) 42%),
    rgba(255, 255, 255, 0.98);
`;

const HeroTitle = styled.h1`
  margin: 0 0 0.6rem;
  color: #2f2100;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
`;

const HeroText = styled.p`
  color: #3f2f0a;
  margin: 0.45rem 0;
  line-height: 1.6;
`;

const Section = styled.section`
  ${cardSurface}
  padding: 1.2rem 1.25rem;
  color: #3f2f0a;
  line-height: 1.6;
`;

const Heading = styled.h2`
  margin: 0 0 0.75rem;
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  color: #2f2100;
`;

const SubHeading = styled.h3`
  margin: 1rem 0 0.35rem;
  font-size: 1.05rem;
  color: #9b5f00;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.4rem;

  &::before {
    content: '•';
    color: #ffb522;
    font-weight: 700;
  }
`;

const MissionList = styled.ul`
  margin: 0.5rem 0 0.6rem;
  padding-left: 1.1rem;

  li {
    margin-bottom: 0.4rem;
  }
`;

const FAQItem = styled.div`
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Strong = styled.strong`
  color: #2f2100;
`;

const StyledLink = styled(Link)`
  color: #8a5000;
  display: inline-block;
  background: rgba(255, 181, 34, 0.18);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  text-decoration: none;
  font-weight: 700;

  &:hover {
    background: rgba(255, 181, 34, 0.32);
    color: #6f3f00;
  }
`;

const LegalNote = styled.p`
  margin: -0.1rem 0 0.8rem;
  color: #6b5831;
  font-size: 0.95rem;
`;

const LegalBox = styled.div`
  border: 1px solid rgba(155, 95, 0, 0.2);
  background: rgba(255, 181, 34, 0.08);
  border-radius: 12px;
  padding: 0.2rem 0.9rem 0.9rem;
  margin-bottom: 1rem;
`;