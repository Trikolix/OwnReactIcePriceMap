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

const List = styled.ul`
  margin-top: 1rem;
  list-style-type: disc;
  padding-left: 1.5rem;
`;

export default function Community() {
  return (
    <Container>
      <Heading>🍦 Community-Richtlinien</Heading>
      <p>Willkommen in unserer Community rund um Eisgenuss, gute Laune und faire Bewertungen! Damit es für alle ein schönes Erlebnis bleibt, gelten folgende Regeln:</p>
      <List>
        <li>💜 <strong>No hate – just love (for ice cream)</strong>: Respektvoller Umgang ist Pflicht.</li>
        <li>🌈 <strong>Fairness first</strong>: Gib ehrliche und faire Bewertungen ab – keine Rachebewertungen, kein Bashing.</li>
        <li>📸 <strong>Erzähle von deinem Eis-Moment</strong>: Teile besondere Eiserlebnisse, schöne Fotos, Geheimtipps – aber keine Werbung.</li>
        <li>🚫 <strong>Kein Shaming, kein Hate-Posting</strong>: Negative Stimmung bleibt draußen.</li>
        <li>📢 <strong>Du bist verantwortlich</strong> für alle Inhalte (Texte, Bilder), die du postest.</li>
        <li>🔒 <strong>Wir behalten uns vor</strong>, Inhalte zu löschen und Accounts zu sperren, die gegen die Regeln verstoßen.</li>
      </List>
      <p>Danke, dass du Teil der Eis-Community bist! 🍨</p>
    </Container>
  );
}