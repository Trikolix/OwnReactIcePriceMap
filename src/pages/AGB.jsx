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

      <SubHeading>2. Registrierung und Anmeldung</SubHeading>
      <p>Du kannst dich per E-Mail oder über Single Sign-On (z. B. Google) registrieren. Bei der Registrierung über Drittanbieter erklärst du dich damit einverstanden, dass wir grundlegende Profildaten (wie deine E-Mail-Adresse und ggf. deinen Namen) zur Erstellung und Verwaltung deines Accounts verwenden.</p>

      <SubHeading>3. Nutzerverhalten</SubHeading>
      <ul>
        <li>Du verpflichtest dich, keine rechtswidrigen, beleidigenden, diskriminierenden oder unangemessenen Inhalte zu posten.</li>
        <li>Du bist für die von dir veröffentlichten Inhalte selbst verantwortlich.</li>
        <li>Du darfst keine Inhalte hochladen, an denen du keine Rechte hast (z. B. fremde Fotos ohne Zustimmung).</li>
      </ul>

      <SubHeading>4. Nutzung von hochgeladenen Bildern</SubHeading>
      <p>Mit dem Hochladen von Bildern räumst du uns ein einfaches, nicht-exklusives und unentgeltliches Nutzungsrecht ein, diese Bilder im Zusammenhang mit der Ice-App zu speichern, öffentlich darzustellen und für den Social-Media-Auftritt der Ice-App (insbesondere Instagram, Facebook und die Ice-App-Website) zu verwenden. Das umfasst auch das Zuschneiden, Skalieren sowie das Einfügen von Ice-App-Branding und sachlichen Angaben zum zugehörigen Check-in, etwa Nutzername, Eisdiele, Check-in-Typ, Datum und Bewertungen.</p>
      <p>Die Veröffentlichung erfolgt ausschließlich im Zusammenhang mit der Ice-App. Du bleibst Urheberin oder Urheber des Bildes und darfst es weiterhin selbst verwenden. Wir veröffentlichen keine E-Mail-Adresse, Nutzer-ID oder ausführlichen privaten Check-in-Kommentare. Wenn du eine künftige Nutzung nicht möchtest, kannst du uns jederzeit unter <a href="mailto:admin@ice-app.de">admin@ice-app.de</a> kontaktieren. Bereits veröffentlichte Beiträge können bei einem berechtigten Widerruf nicht in jedem Fall aus bereits geteilten oder archivierten Inhalten Dritter entfernt werden; wir entfernen die Inhalte aus unseren eigenen Veröffentlichungs- und Exportprozessen so schnell wie möglich.</p>

      <SubHeading>5. Haftung</SubHeading>
      <p>Wir übernehmen keine Haftung für die Inhalte der Nutzer oder die Verfügbarkeit und Funktion der App.</p>

      <SubHeading>6. Änderungen</SubHeading>
      <p>Wir dürfen diese AGB jederzeit ändern. Du wirst über Änderungen informiert.</p>

      <SubHeading>7. Schlussbestimmungen</SubHeading>
      <p>Es gilt deutsches Recht. Gerichtsstand ist – soweit zulässig – Chemnitz.</p>
    </Container>
  );
}
