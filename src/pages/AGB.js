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

export default function AGB() {
  return (
    <Container>
      <Heading>📜 Allgemeine Geschäftsbedingungen (AGB)</Heading>
      <p>Mit der Registrierung und Nutzung unserer App erklärst du dich mit den folgenden Bedingungen einverstanden:</p>

      <SubHeading>1. Leistungen</SubHeading>
      <p>Wir stellen dir eine Plattform zur Verfügung, auf der du Eisdielen entdecken, bewerten und eigene Erlebnisse teilen kannst.</p>

      <SubHeading>2. Nutzerverhalten</SubHeading>
      <ul>
        <li>Du verpflichtest dich, keine rechtswidrigen, beleidigenden, diskriminierenden oder unangemessenen Inhalte zu posten.</li>
        <li>Du bist für die von dir veröffentlichten Inhalte selbst verantwortlich.</li>
        <li>Du darfst keine Inhalte hochladen, an denen du keine Rechte hast (z. B. fremde Fotos ohne Zustimmung).</li>
      </ul>

      <SubHeading>3. Sperrung und Löschung</SubHeading>
      <p>Wir behalten uns vor, Inhalte zu löschen und Nutzerkonten zu sperren, wenn gegen die Community-Richtlinien oder Gesetze verstoßen wird.</p>

      <SubHeading>4. Haftung</SubHeading>
      <p>Wir übernehmen keine Haftung für die Inhalte der Nutzer oder die Verfügbarkeit und Funktion der App.</p>

      <SubHeading>5. Änderungen</SubHeading>
      <p>Wir dürfen diese AGB jederzeit ändern. Du wirst über Änderungen informiert.</p>

      <SubHeading>6. Schlussbestimmungen</SubHeading>
      <p>Es gilt deutsches Recht. Gerichtsstand ist – soweit zulässig – Chemnitz.</p>
    </Container>
  );
}

