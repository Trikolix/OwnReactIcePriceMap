# Eiscreme Price Radar

## Überblick
Dieses Repository enthält:
- ein React/Vite-Frontend in `src/`
- ein PHP-Backend in `backend/`
- SQL- und Betriebsdokumentation in `backend/Database` und `docs/`

Ziel der aktuellen Aufräumphase ist eine klarere, modularere Struktur bei laufender Funktionalität.

## Projektstruktur (aktueller Zielzustand)
- `src/features/*`: fachliche Feature-Module (z. B. `event`, `core`)
- `src/shared/*`: wiederverwendbare Infrastruktur (z. B. API-Client)
- `backend/public/index.php`: Einstieg für neue `/api/v2/*` Routen
- `backend/src/Modules/*`: modulare Backend-Controller/Services/Repositories
- `backend/src/Shared/*`: gemeinsame Backend-Helfer
- `backend/*` (Top-Level PHP): Legacy-Endpunkte, schrittweise Ablösung

## Lokale Entwicklung
Voraussetzungen:
- Node.js 24 LTS ab 24.22.1 + npm (Version in `.nvmrc` und `.node-version`)
- PHP 8+

Node.js muss auf Entwicklungs- und Build-Rechnern separat installiert bzw. aktualisiert
werden; `npm install` aktualisiert die Node-Laufzeit nicht. Mit nvm:
```bash
nvm install 24.22.1
nvm use 24.22.1
npm ci
```

Unter Windows ohne Versionsmanager den offiziellen
[Node.js-24.22.1-Installer](https://nodejs.org/en/blog/release/v24.22.1)
oder einen neueren Patch der 24er-Reihe installieren und das Terminal neu öffnen.
`node --version` muss mindestens `v24.22.1` anzeigen. `.npmrc` verhindert
Paketinstallationen mit einer nicht unterstützten Node-Version.

Hintergrund: Die [Security-Releases vom 21.10.2026](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
beheben unter anderem die Brotli-Lücke CVE-2026-111497 (Schweregrad High).
Die Ice-App verwendet Node.js für Vite, Builds und CLI-Werkzeuge. Im hier
dokumentierten Produktivbetrieb werden statische Frontend-Dateien und ein
PHP-Backend ausgeliefert; die Node-Laufzeit wird nicht in die Web-App oder
Android-App eingebettet. Falls auf einem Server zusätzlich ein Node-Prozess
betrieben wird, muss dessen Laufzeit ebenfalls aktualisiert und der Prozess
neu gestartet werden.

Frontend starten:
```bash
npm start
```

Build:
```bash
npm run build
```

### Sicherheitskorrekturen der npm-Abhängigkeiten

`gh-pages` ist bewusst auf **6.1.1** festgelegt. Ab 6.2.0 führt dessen
Globbing-Abhängigkeit das von [CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
betroffene Paket `braces` ein; dafür gibt es derzeit keinen Patch.
Die feste Version verhindert, dass ein Update erneut diese Abhängigkeit installiert.
Das ist eine Übergangslösung: Die ältere Globbing-Kette enthält veraltete Pakete
(`glob`, `inflight`), für die npm weiterhin Deprecation-Warnungen ausgeben kann.
Den Pin neu bewerten, sobald eine neuere `gh-pages`-Version die anfällige Kette ersetzt.

Der `overrides`-Eintrag für `xcode` ersetzt ausschließlich dessen `uuid` durch
**11.1.1**, das [CVE-2026-41907](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
behebt. Diese Version unterstützt weiterhin CommonJS und die von `xcode` verwendete
`v4()`-API. Der Override kann entfallen, sobald Capacitor eine `xcode`-Version
ohne die anfällige `uuid`-Abhängigkeit verwendet. Änderungen an diesen Festlegungen
mit `npm audit` sowie einem Build und einem Funktionstest der CLI-Werkzeuge prüfen.

### Frontend-Cache beim Deployment

`index.html` und `version.json` müssen bei Apache mit `Cache-Control: no-cache` ausgeliefert werden. Die Datei `public/.htaccess` enthält dafür die nötigen Header. Die von Vite erzeugten, gehashten JavaScript- und CSS-Dateien dürfen dagegen langfristig gecacht werden.

### Welcher Build läuft auf dem Server?

Bei `npm start`, `npm run build` und `npm run build:release` werden die Metadaten
automatisch erzeugt. Beim Build landet `version.json` neben `index.html` im
Ausgabeverzeichnis. Die Datei beschreibt den **Frontend-Build**:

- `appVersion`: die von Hand gepflegte Release-Version aus `package.json`.
- `buildId`: Kennung des Build-Laufs mit kurzem Commit, Änderungsstatus und Zeitstempel.
- `buildTime`: Zeitpunkt des Builds in UTC, nicht der Zeitpunkt des Uploads.
- `gitCommit`: vollständige Commit-ID des ausgecheckten Stands beim Build.
- `gitBranch`: Branch beim Build; bei einem Detached HEAD oder ohne Git `null`.
- `gitDirty`: `true` bei geänderten, gestagten oder neuen, nicht ignorierten Dateien;
  `false` bei sauberem Stand; `null`, wenn Git den Status nicht ermitteln konnte.

Bei `gitDirty: true` ist der Commit nur der Ausgangspunkt: Der Build enthält
zusätzlich lokale Änderungen und lässt sich nicht allein aus diesem Commit
wiederherstellen. Ignorierte Dateien, etwa lokale Umgebungskonfigurationen,
werden dabei nicht erfasst. Ohne Git bleiben die Git-Angaben unbekannt.

Für ein Deployment zuerst die beabsichtigten Änderungen committen und dann bauen:

```bash
npm ci
npm run build:release
```

Der Release-Befehl bricht bei fehlendem Commit oder unsauberem Arbeitsstand ab.
Anschließend den Inhalt von `build/` einschließlich `version.json` und `.htaccess`
zusammen nach `httpdocs` hochladen. Die Metadaten nach dem Build nicht separat neu
generieren: Sie müssen zu den ausgelieferten JavaScript-Dateien gehören.

Die veröffentlichte Datei unter `https://ice-app.de/version.json` aufrufen und
`gitCommit` nach einem `git fetch origin` mit den gewünschten Branch-Spitzen vergleichen:

```bash
git rev-parse origin/master
git rev-parse origin/feature/floating-quest-onboarding
git show <gitCommit-aus-version.json>
```

Branches können weiterwandern oder denselben Commit enthalten; die Commit-ID
identifiziert den Stand. `appVersion` muss dafür nicht bei jedem Build erhöht
werden. Alte `version.json`-Dateien ohne Git-Angaben lassen sich nachträglich
nicht sicher zuordnen. Separat hochgeladene PHP-Dateien werden durch diese
Frontend-Metadaten nicht geprüft.

## Event-Simulator
Es gibt ein lokales CLI-Skript, um Event-Aktivität für Test-Live-Map und Dashboard zu simulieren:

```bash
npm run simulate:event -- --config scripts/event-simulator.config.json
```

Beispielkonfiguration:
- `scripts/event-simulator.config.example.json`

Typischer Ablauf:
1. Beispieldatei kopieren:
```bash
copy scripts\event-simulator.config.example.json scripts\event-simulator.config.json
```
2. `apiBaseUrl` auf dein lokales Backend setzen.
3. Admin-Zugang eintragen.
4. Teilnehmer eintragen.
5. Erst mit Dry Run prüfen:
```bash
npm run simulate:event -- --config scripts/event-simulator.config.json --dry-run
```
6. Danach echten Lauf starten:
```bash
npm run simulate:event -- --config scripts/event-simulator.config.json --participants 10 --duration-minutes 5
```

Wichtig:
- Teilnehmer müssen bereits existierende Accounts sein.
- Teilnehmer müssen bereits eine Event-Anmeldung bzw. einen Event-Slot haben, weil das Skript das über `event2026/me.php` prüft.
- Du musst nicht zwingend neue Testfahrer anlegen; vorhandene Dev-Accounts reichen, wenn sie für das Event registriert sind.
- Für `admin` und `participants` kannst du entweder `username + password` oder `token + userId` verwenden.
- Das Skript schreibt absichtlich nur auf Test-Checkpoints.

Technischer Hinweis:
- Der normale `test`-Modus der Stempelkarte ist aktuell für Admin reserviert.
- Deshalb liest der Simulator die Test-Checkpoint-Konfiguration über den Admin-Zugang aus, schreibt die Passagen für Teilnehmer aber über `event2026/checkpoints_pass.php`.
- Die zeitliche Staffelung entsteht durch echte Laufzeit des Skripts. `passed_at` wird serverseitig gesetzt und nicht künstlich rückdatiert.

### Testaccounts für den Simulator
Für größere Testläufe gibt es ein separates Dev-CLI unter `backend_dev`, das Testaccounts und Event-Slots verwaltet:

```bash
npm run simulate:event-users -- seed --count 50 --batch mai-test --write-config scripts/event-simulator.config.json --admin-username Admin --admin-password deinpasswort
```

Wichtige Befehle:

```bash
npm run simulate:event-users -- --help
npm run simulate:event-users -- seed --count 25 --batch mai-test
npm run simulate:event-users -- list --batch mai-test
npm run simulate:event-users -- cleanup --batch mai-test
npm run simulate:event-users -- cleanup --all
```

Was das Tool macht:
- legt verifizierte Dev-Testnutzer an
- erzeugt für diese Nutzer Event-Registrierungen, Slots und bezahlte Payments
- verteilt die Routen standardmäßig zyklisch auf Genuss / Sport / König
- kann direkt eine passende Simulator-Config schreiben
- kann die erzeugten Nutzer später wieder gezielt entfernen

Hinweise:
- Das Tool ist nur für CLI und Dev gedacht.
- `cleanup --batch ...` ist der selektive Reset.
- `backend/Skripte/cron_sync_dev_from_prod.php` bleibt der grobe Komplettreset für die gesamte Dev-Datenbank.

## Neue API-Fassade (Start)
Aktuell eingeführt:
- `GET /api/v2/shops`
- `GET /api/v2/shops/{id}`

Implementierung:
- Router: `backend/public/index.php`
- Controller: `backend/src/Modules/Shops/Controllers/ShopsController.php`

## Event-Routing
Folgende Event-Routen sind aktiv in der App eingebunden:
- `/#/ice-tour`
- `/#/event-registration`
- `/#/event-live`
- `/#/event-me`
- `/#/event-invite/:token`
- `/#/event-registration-summary`

## Cleanup-Regeln
- Keine Build-Artefakte im Repo (`build/`, `*.zip`, `*.bak`, Rohdesign-Dateien).
- `uploads/` wird nicht mehr versioniert.
- Potenziell externe Legacy-Endpunkte werden zuerst als deprecated markiert, dann später entfernt.

## Branch-Strategie für Aufräumarbeiten
- `cleanup/trash-candidates`: Lösch-/Archivkandidaten
- `cleanup/main-refactor`: Architekturumbau

So bleiben aggressive Cleanup-Schritte rückholbar.
