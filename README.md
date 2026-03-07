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
