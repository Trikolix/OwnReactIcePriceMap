import Header from './../Header';
import React from 'react';
import styled from "styled-components";

function Impressum() {


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'white' }}>
            <Header />
            <Container>
                <Title>Impressum</Title>
                Angaben gemäß § 5 TMG
                <p>
                    <SubTitle>Name und Anschrift des Anbieters:</SubTitle>
                    Christian Helbig <br />
                    Henriettenstraße 45 <br />
                    09112 Chemnitz <br />
                    Deutschland <br />
                </p>
                <p>
                    <SubTitle>Kontakt: </SubTitle>
                    E-Mail: admin@ice-app.de
                </p>

                <p>
                    <SubTitle>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</SubTitle>
                    Christian Helbig <br />
                    Adresse wie oben
                </p>
                <Title>Hinweis auf User-generierte Inhalte</Title>
                <p>Nutzer der App haben die Möglichkeit, Inhalte wie Bewertungen, Fotos und Eisdielen-Einträge eigenständig einzureichen.
                    Diese Inhalte werden nicht vorab geprüft. Sollten Sie dennoch auf rechtswidrige Inhalte aufmerksam werden,
                    bitten wir um eine kurze Nachricht an die oben genannte E-Mail-Adresse. Solche Inhalte werden bei Bekanntwerden umgehend entfernt.</p>
            </Container>
        </div>
    )

}

export default Impressum;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  height: 100vh;
  max-width: 700px;
  align-self: center;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;

const SubTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
`;