import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  line-height: 1.6;
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const SubHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 1.5rem;
`;

export default function Datenschutz() {
  return (
    <Container>
      <Heading>🔐 Datenschutzerklärung</Heading>
      <p>Wir nehmen den Schutz deiner Daten sehr ernst. Hier erfährst du, welche Daten wir speichern und wie wir sie verwenden:</p>

      <SubHeading>1. Verantwortlicher</SubHeading>
      <p>Christian Helbig, admin@ice-app.de</p>

      <SubHeading>2. Erhobene Daten</SubHeading>
      <ul>
        <li>Registrierungsdaten (z. B. Nutzername, E-Mail)</li>
        <li>Standortdaten (für das Finden von Eisdielen – nur mit Zustimmung - werden nicht gespeichert)</li>
        <li>Inhalte, die du teilst (Bewertungen, Bilder)</li>
      </ul>

      <SubHeading>3. Verwendungszwecke</SubHeading>
      <p>Die Daten werden ausschließlich verwendet zur:</p>
      <ul>
        <li>Nutzerverwaltung</li>
        <li>Darstellung von Bewertungen und Standorten</li>
        <li>Verbesserung der App</li>
      </ul>

      <SubHeading>4. Cookies & Drittanbieter</SubHeading>
      <p>Wir verwenden Dienste wie OpenStreetMap. Dabei können Cookies eingesetzt und Daten an OpenStreetMap übermittelt werden.</p>

      <SubHeading>5. Deine Rechte</SubHeading>
      <p>Du hast das Recht auf Auskunft, Löschung, Berichtigung und Einschränkung der Verarbeitung deiner Daten. Kontaktiere uns jederzeit unter der oben genannten E-Mail-Adresse.</p>

      <SubHeading>6. Speicherung</SubHeading>
      <p>Wir speichern deine Daten nur so lange, wie es für die Nutzung der App erforderlich ist oder gesetzlich vorgeschrieben.</p>

      <SubHeading>7. Einwilligung</SubHeading>
      <p>Mit der Nutzung der App willigst du in diese Datenschutzerklärung ein.</p>
    </Container>
  );
}