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
- Node.js + npm
- PHP 8+

Frontend starten:
```bash
npm start
```

Build:
```bash
npm run build
```

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
