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
        <li>Single Sign-On (SSO): Wenn du dich über Google registrierst/anmeldest, erhalten wir von Google grundlegende Profildaten wie deine E-Mail-Adresse und ggf. deinen Namen sowie Profilbild, um deinen Account zu erstellen und zu verwalten.</li>
        <li>Standortdaten (für das Finden von Eisdielen – nur mit Zustimmung - werden nicht gespeichert)</li>
        <li>Inhalte, die du teilst (Bewertungen, Bilder)</li>
      </ul>

      <SubHeading>3. Verwendungszwecke</SubHeading>
      <p>Die Daten werden ausschließlich verwendet zur:</p>
      <ul>
        <li>Nutzerverwaltung</li>
        <li>Darstellung von Bewertungen und Standorten</li>
        <li>Verbesserung der App</li>
        <li>Bearbeitung von Kontaktanfragen zur Ice-Tour und zu Unterstützungsangeboten</li>
      </ul>

      <SubHeading>4. Veröffentlichung von Community-Fotos</SubHeading>
      <p>
        Wenn du Bilder zu einem Check-in hochlädst, können diese nach redaktioneller Prüfung im Zusammenhang mit der
        Ice-App in unseren Social-Media-Kanälen, insbesondere Instagram und Facebook, sowie auf der Ice-App-Website
        veröffentlicht werden. Dabei können der Nutzername, die besuchte Eisdiele, der Check-in-Typ, das Datum und
        die im Check-in gespeicherten Einzelbewertungen zusammen mit dem Bild dargestellt werden.
      </p>
      <p>
        Für einen optionalen Zusatz-Slide kann der öffentlich bekannte Standort der Eisdiele als Kartenmarker angezeigt
        werden. Der persönliche Standort des Nutzers sowie E-Mail-Adresse, Nutzer-ID und ausführliche Check-in-Texte
        werden nicht veröffentlicht. Für die Veröffentlichung können Inhalte technisch zugeschnitten, skaliert und
        mit Ice-App-Branding versehen werden.
      </p>
      <p>
        Die Veröffentlichung erfolgt nur im Zusammenhang mit der Ice-App. Du kannst der künftigen Nutzung eines Bildes
        jederzeit widersprechen oder die Entfernung aus unseren eigenen Veröffentlichungs- und Exportprozessen unter
        <a href="mailto:admin@ice-app.de"> admin@ice-app.de</a> verlangen. Bereits von Dritten übernommene oder
        archivierte Beiträge können wir nicht vollständig kontrollieren.
      </p>

      <SubHeading>5. Kontaktformular zur Ice-Tour</SubHeading>
      <p>
        Wenn du uns über das Kontaktformular zur Ice-Tour schreibst, speichern wir die von dir eingegebenen Angaben
        wie Name, E-Mail-Adresse, optionale Organisations- oder Telefonnummer und deine Nachricht, damit wir dein
        Anliegen bearbeiten und dir antworten können.
      </p>
      <p>
        Zusätzlich verarbeiten wir technische Angaben zum Schutz vor Missbrauch, insbesondere gekürzte oder gehashte
        Informationen zu IP-Adresse und Browser sowie Sicherheitsprotokolle bei auffälligen Anfragen.
      </p>
      <p>
        Die Verarbeitung erfolgt ausschließlich für die Kommunikation rund um die Ice-Tour, mögliche Partnerschaften,
        Unterstützungsangebote und organisatorische Rückfragen.
      </p>

      <SubHeading>6. Cookies & Drittanbieter</SubHeading>
      <p>Wir verwenden essentielle Technologien wie Local Storage zur Speicherung von Anmeldeinformationen und Einstellungen (z. B. Cookie-Banner-Zustimmung). Weiterhin nutzen wir Dienste wie OpenStreetMap. Dabei können Cookies eingesetzt und Daten an OpenStreetMap übermittelt werden. Für den Login via Google werden ebenfalls Cookies des Drittanbieters gesetzt.</p>

      <SubHeading>7. Deine Rechte</SubHeading>
      <p>Du hast das Recht auf Auskunft, Löschung, Berichtigung und Einschränkung der Verarbeitung deiner Daten. Kontaktiere uns jederzeit unter der oben genannten E-Mail-Adresse.</p>

      <SubHeading>8. Speicherung</SubHeading>
      <p>Wir speichern deine Daten nur so lange, wie es für die Nutzung der App erforderlich ist oder gesetzlich vorgeschrieben.</p>

      <SubHeading>9. Einwilligung</SubHeading>
      <p>Mit der Nutzung der App willigst du in diese Datenschutzerklärung ein.</p>
    </Container>
  );
}
