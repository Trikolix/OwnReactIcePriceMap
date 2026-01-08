import Header from '../Header';
import React from 'react';
import styled from "styled-components";
import { Link } from 'react-router-dom';

function Impressum() {


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'white' }}>
            <Header />
            <Container>

                <Section>
                    <Heading>🧁 Über diese Website</Heading>
                    <p>
                        Ich bin begeisterter Radsportler – und wer viel radelt, braucht natürlich auch mal eine Pause. Für mich war schnell klar: Die besten Stopps sind die mit Eis.
                    </p>
                    <p>
                        Auf meinen Touren habe ich unzählige Eisdielen entdeckt – manche zufällig, manche gezielt. So entstand die Idee zu dieser Plattform:
                        <br />
                        <strong>Eisdielen entdecken, teilen und feiern – für alle!</strong>
                    </p>
                </Section>

                <Section>
                    <Heading>🚀 Was du hier machen kannst</Heading>
                    <List>
                        <ListItem>Neue Eisdielen eintragen</ListItem>
                        <ListItem>Eisdielen zu Favoriten hinzufügen</ListItem>
                        <ListItem>Einchecken, wenn du Eis schlemmst</ListItem>
                        <ListItem>Bewertungen abgeben</ListItem>
                        <ListItem>Routen zu Eisdielen speichern und teilen</ListItem>
                    </List>
                </Section>

                <Section>
                    <Heading>🌍 Unsere Mission</Heading>
                    <p>
                        Wir wollen gemeinsam:
                    </p>
                    <ul>
                        <li>die <Bold>größten Kugeln</Bold> finden</li>
                        <li>die <Bold>besten Kugeleis / Softeis / Eisbecher</Bold> entdecken</li>
                        <li>die <Bold>kreativsten Sorten</Bold> bewerten</li>
                        <li>die <Bold>freundlichsten Läden</Bold> supporten</li>
                        <li>die <Bold>schönsten Eismomente</Bold> teilen</li>
                    </ul>
                    <p>
                        Ob du Team Schoko, Team Mango oder Team Lakritz bist – hier ist Platz für dich.
                    </p>
                </Section>

                <Section>
                    <Heading>🎯 EP-System – So sammelst du Punkte!</Heading>
                    <p>
                        Wer mitmacht, wird belohnt! Für jede Aktion bekommst du Erfahrungspunkte (EP), mit denen du dein Level steigern kannst.
                        Je aktiver du bist, desto mehr EP bekommst du – und desto mehr Spaß macht’s.
                    </p>
                    <ul>
                        <li><Bold>Check-in ohne Bild:</Bold> 30 EP</li>
                        <li><Bold>Check-in mit Bild:</Bold> 45 EP</li>
                        <li><Bold>Bewertung abgeben:</Bold> 20 EP</li>
                        <li><Bold>Preis melden:</Bold> 15 EP</li>
                        <li><Bold>Route teilen:</Bold> 20 EP</li>
                        <li><Bold>Eisdiele eintragen:</Bold> 5 EP (nach erstem Checkin bei der Eisdiele: 25 EP)</li>
                        <li><Bold>Nutzer werben:</Bold> 10 EP (sobald der neue Nutzer seinen ersten Check-in macht: 250 EP!)</li>
                        <li><Bold>Awards:</Bold> Jeder Award gibt individuell nach Schwierigkeit EP. (10-2000 EP)</li>
                    </ul>
                    <p>
                        Viel Spaß beim Eis essen, EP sammeln und Level aufsteigen!
                    </p>
                </Section>


                <Section>
                    <Heading>❓ Häufige Fragen (FAQ)</Heading>
                    <FAQItem>
                        <SubHeading>Warum ist meine Lieblingseisdiele noch nicht drin?</SubHeading>
                        <p>Vielleicht kennt sie noch niemand hier! Trag sie gern ein – so hilfst du anderen, sie zu entdecken.</p>
                    </FAQItem>
                    <FAQItem>
                        <SubHeading>Wie kann ich mitmachen?</SubHeading>
                        <p>Einfach registrieren und loslegen – Check-ins, Bewertungen, Einträge … du gestaltest die Karte mit!</p>
                    </FAQItem>
                    <FAQItem>
                        <SubHeading>Was bedeutet „Einchecken“?</SubHeading>
                        <p>Wenn du bei einer Eisdiele bist, kannst du deinen Besuch eintragen. Wähle ob du Kugeleis, Softeis oder einen Eisbecher gegessen hast und bewerte wie dir das Eis geschmeckt / gefallen hat.
                            Aus den Check-Ins werden die jeweiligen Scores für die Eisdielen berechnet.
                        </p>
                    </FAQItem>
                    <FAQItem>
                        <SubHeading>Kostet das was?</SubHeading>
                        <p>Nö. Diese Seite ist ein Projekt aus Leidenschaft. Für Eis, nicht fürs Geld.</p>
                    </FAQItem>
                </Section>

                <Section>
                    <Heading>📬 Noch Fragen?</Heading>
                    <p>
                        Wenn du Ideen hast, Fehler findest oder einfach sagen willst, wo’s das beste Stracciatella gibt – meld dich gern!
                    </p>
                    <p>
                        Und hier findest du noch mehr Infos:
                    </p>
                    <p>
                        <StyledLink to="/agb" target="_blank">AGB</StyledLink>
                        <StyledLink to="/datenschutz" target="_blank">Datenschutzerklärung</StyledLink>
                        <StyledLink to="/community" target="_blank">Community-Richtlinien</StyledLink>
                    </p>
                </Section>
                <Section>
                    <Heading>📝 Impressum</Heading>
                    Angaben gemäß § 5 TMG
                    <p>
                        <SubHeading>Name und Anschrift des Anbieters:</SubHeading>
                        Christian Helbig <br />
                        Henriettenstraße 45 <br />
                        09112 Chemnitz <br />
                        Deutschland <br />
                    </p>
                    <p>
                        <SubHeading>Kontakt: </SubHeading>
                        E-Mail: admin@ice-app.de
                    </p>

                    <p>
                        <SubHeading>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</SubHeading>
                        Christian Helbig <br />
                        Adresse wie oben
                    </p>
                    <Heading>Hinweis auf User-generierte Inhalte</Heading>
                    <p>Nutzer der App haben die Möglichkeit, Inhalte wie Bewertungen, Fotos und Eisdielen-Einträge eigenständig einzureichen.
                        Diese Inhalte werden nicht vorab geprüft. Sollten Sie dennoch auf rechtswidrige Inhalte aufmerksam werden,
                        bitten wir um eine kurze Nachricht an die oben genannte E-Mail-Adresse. Solche Inhalte werden bei Bekanntwerden umgehend entfernt.</p>
                </Section>
            </Container>
        </div>
    )

}

export default Impressum;

const Container = styled.div`
  padding: 2rem 1rem 4rem 1rem;  // oben / rechts / unten / links
  background-color: white;
  max-width: 700px;
  align-self: center;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const Heading = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #ffb522;
`;

const SubHeading = styled.h3`
  font-size: 1.4rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color:rgb(255, 133, 34);
`;

const List = styled.ul`
  list-style: none;
  padding-left: 0;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
  &:before {
    content: "🍦 ";
  }
`;

const FAQItem = styled.div`
  margin-bottom: 1.2rem;
`;

const Bold = styled.span`
  font-weight: bold;
`;

const StyledLink = styled(Link)`
  color: #0077cc;
  display: inline-block;
  margin-right: 1rem;
  text-decoration: none;
  font-weight: bold;
  &:hover {
    color: #005999;
  }
`;