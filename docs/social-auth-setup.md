# Google Login Setup

Diese Implementierung nutzt Google nur für den externen Identitätsnachweis. Nutzerkonto, Session-Token und Profildaten bleiben in der eigenen Datenbank.

## Was technisch passiert

- Das Frontend öffnet ein Popup zu `backend/userManagement/oauth_start.php`.
- Das Backend steuert den OAuth-Code-Flow direkt selbst.
- Bei bereits bekannten Google- oder E-Mail-Konten wird direkt verknüpft und eingeloggt.
- Bei neuen Google-Konten wird noch kein App-Konto angelegt.
- Stattdessen muss der Nutzer danach erst Benutzername, Bedingungen und optional Systemmeldungen bestätigen.
- Erst dann wird in `social_auth_identities` die Verknüpfung gespeichert und die App vergibt ihr eigenes `user_api_token`.

## Was Google von dir bekommt

- Google sieht, dass sich ein Nutzer bei deiner App per Google anmeldet.
- Google zeigt den Nutzern deinen App-Namen, Domain, Datenschutz-Link und Support-E-Mail.
- Google setzt im Login-Fenster eigene Cookies auf Google-Domains.
- Google bekommt nicht automatisch deine komplette Nutzerdatenbank.

## Was du von Google bekommst

- die externe Google-Nutzer-ID
- die E-Mail-Adresse
- den Anzeigenamen
- den Hinweis, ob die E-Mail von Google verifiziert ist

## Vorbereitungen

Bevor du in Google irgendetwas anklickst, prüfe diese Werte:

- Produktions-Website: `https://ice-app.de`
- Produktions-Backend-Callback: `https://ice-app.de/backend/userManagement/oauth_callback.php`
- Lokales Frontend laut Projekt: `http://localhost:5173`
- Lokale erlaubte Origins für das Backend: `http://localhost:5173`

## Schritt für Schritt: Google einrichten

### 1. Google Cloud Console öffnen

Link:

`https://console.cloud.google.com/`

### 2. Projekt anlegen

- Oben im Projekt-Auswahlmenü auf `New Project` klicken
- Projektname z. B. `Ice App Google Login`
- Projekt erstellen

Direktlink:

`https://console.cloud.google.com/projectcreate`

### 3. OAuth Consent Screen konfigurieren

Google nennt das inzwischen je nach Oberfläche `Google Auth Platform` oder `OAuth consent screen`.

Direktlink:

`https://console.cloud.google.com/auth/branding`

Dort eintragen:

- App name: `Ice-App`
- User support email: deine Support-Adresse
- App logo: optional
- App home page: `https://ice-app.de`
- Application privacy policy link: Link zu deiner Datenschutz-Seite
- Terms of service: optional, aber sinnvoll
- Authorized domains: `ice-app.de`

Wenn deine Datenschutz-Seite und Homepage nicht öffentlich erreichbar sind, blockiert Google später gern die Freigabe.

Google-Hinweise:

- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification

### 4. Testnutzer hinzufügen

Solange die App nicht offiziell veröffentlicht ist, kannst du sie mit Testnutzern verwenden.

Direktlink:

`https://console.cloud.google.com/auth/audience`

Dort:

- Publishing status erstmal auf Test lassen
- Unter `Test users` deine eigene Google-Mailadresse hinzufügen
- ggf. noch 1-2 weitere Testkonten eintragen

### 5. OAuth Client für Web anlegen

Direktlink:

`https://console.cloud.google.com/auth/clients`

Dort:

- `Create client`
- Application type: `Web application`
- Name: z. B. `Ice-App Web Login`

Dann eintragen:

- Authorized redirect URI:
  `https://ice-app.de/backend/userManagement/oauth_callback.php`

Falls du auch lokal mit echtem lokalem Backend testest, zusätzlich z. B.:

- `http://localhost/backend_dev/userManagement/oauth_callback.php`

Wichtig:

- Die Redirect-URI muss exakt stimmen.
- Kein abschließender Slash zusätzlich.
- Kein Tippfehler bei `backend/userManagement/oauth_callback.php`.

Google-Doku zum Web-Server-Flow:

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/openid-connect/openid-connect

### 6. Client ID und Secret kopieren

Nach dem Erstellen bekommst du:

- `Client ID`
- `Client Secret`

Die brauchst du für dein Backend.

## Backend konfigurieren

Folgende Umgebungsvariablen im Backend setzen:

```bash
SOCIAL_AUTH_STATE_SECRET=<DEIN_GEHEIMER_STRING>
SOCIAL_AUTH_ALLOWED_ORIGINS=https://ice-app.de,http://localhost:5173
GOOGLE_OAUTH_CLIENT_ID=deine-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=<DEIN_CLIENT_SECRET>
```

Hinweise:

- `SOCIAL_AUTH_STATE_SECRET` sollte lang und zufällig sein.
- `SOCIAL_AUTH_ALLOWED_ORIGINS` muss die Frontend-Origins enthalten, von denen das Popup geöffnet wird.
- Für Google brauchst du aktuell keine Facebook-Variablen.

## Datenbank ausführen

Vor dem Test die Migration ausführen:

`backend/Database/migrations/2026-04-15_add_social_auth_identities.sql`

## Testablauf

### Lokaler Test

1. Backend mit gesetzten Env-Variablen bereitstellen
2. Frontend lokal starten
3. Registrierungsseite öffnen
4. `Mit Google fortfahren` klicken
5. Optional vorher im Formular einen eigenen Benutzernamen eintragen
6. Mit einem als Test User eingetragenen Google-Konto anmelden
7. Prüfen, ob:
   - ein Datensatz in `nutzer` angelegt oder zugeordnet wurde
   - ein Datensatz in `social_auth_identities` angelegt wurde
   - du danach in der App eingeloggt bist

### Produktionstest

1. Google-Client mit Produktions-Redirect-URI anlegen
2. Backend-Env auf dem Server setzen
3. Migration in Produktion ausführen
4. Mit einem Testkonto auf `https://ice-app.de/register` testen

## Datenschutz und Cookies

### Muss ich Google in der Datenschutzerklärung erwähnen?

Ja. Ergänze mindestens:

- dass Login/Registrierung über Google möglich ist
- welche Daten von Google übernommen werden
- dass die Daten zur Authentifizierung und Kontoverknüpfung verwendet werden
- dass deine App eigene Sessions/Tokens verwendet

### Setzt Google Cookies?

Ja, im Google-Login-Fenster auf Google-Domains. Das ist normal für OAuth-Login.

### Greift Google andere Nutzerdaten aus meiner App ab?

Nicht automatisch. In dieser Implementierung wird Google nicht als zentrale Benutzerverwaltung verwendet. Google liefert nur die für den Login angeforderten Profildaten.

### Muss ich wegen Cookie-Banner etwas beachten?

Technisch:

- Deine App lädt kein eingebettetes Google-Tracking-SDK für alle Besucher.
- Der Kontakt zu Google entsteht erst, wenn der Nutzer aktiv auf `Mit Google fortfahren` klickt.

Rechtlich:

- Das ist günstiger als ein dauerhaft eingebettetes Drittanbieter-Skript.
- Ob du zusätzlich im Consent-Banner etwas ausweisen musst, solltest du mit deiner Datenschutzbewertung oder juristisch prüfen.

## Typische Fehler

### Fehler: Redirect URI mismatch

Dann stimmt die in Google eingetragene Redirect-URI nicht exakt mit dieser URL überein:

`https://ice-app.de/backend/userManagement/oauth_callback.php`

### Fehler: App nicht verfügbar für Testkonto

Dann fehlt dein Google-Konto in den Test Usern.

### Fehler: Google-Button öffnet Popup und bricht sofort ab

Dann sind meist diese Variablen nicht sauber gesetzt:

- `SOCIAL_AUTH_STATE_SECRET`
- `SOCIAL_AUTH_ALLOWED_ORIGINS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## Später optional

Wenn Google stabil läuft, kannst du Facebook später wieder ergänzen. Für den ersten produktiven Test würde ich bewusst nur Google aktiv lassen.

## Benutzername bei Google-Registrierung

- Wenn der Nutzer vor dem Klick auf `Mit Google fortfahren` einen Benutzernamen ins Formular einträgt, wird dieser als Vorschlag übernommen.
- Wenn das Feld leer bleibt, erzeugt das Backend einen Vorschlag aus dem Google-Anzeigenamen.
- Nach der Google-Anmeldung kann der Nutzer den vorgeschlagenen Namen noch ändern.
- Erst beim Abschluss der Registrierung wird geprüft, ob der gewünschte Benutzername gültig und frei ist.

## Bedingungen bei Google-Registrierung

- Neue Google-Nutzer werden nicht mehr sofort als App-Konto angelegt.
- Nach der Google-Anmeldung muss die Registrierung erst mit diesen Angaben abgeschlossen werden:
  - Benutzername bestätigen oder ändern
  - AGB, Datenschutzerklärung und Community-Richtlinien akzeptieren
  - optional Systemmeldungen & News aktivieren
- Ohne akzeptierte Bedingungen wird kein neues App-Konto angelegt.
