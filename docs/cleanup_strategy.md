# Cleanup Strategy (2026-03)

## Ziele
- Legacy-Dateien aus dem Top-Level entfernen
- modulare Struktur für Frontend und Backend etablieren
- große Artefakte aus Git fernhalten

## Branch-Modell
- `cleanup/trash-candidates`: nur Lösch-/Archiv-Themen
- `cleanup/main-refactor`: Struktur-, Routing- und API-Umbau

## Legacy-Übergang
1. Alt-Endpunkt nach `backend/legacy/*` verschieben
2. Wrapper unter altem Pfad belassen
3. Nutzung überwachen
4. Nach Umstellung auf `/api/v2/*` Wrapper entfernen

## Upload-Auslagerung
1. Neues Object-Storage-Bucket bereitstellen
2. `uploads/*` migrieren
3. URL-Resolving zentral im Backend/Frontend anpassen
4. `uploads/` vollständig aus Git entfernen

## Qualitätssicherung
- `./scripts/find-dead-files.sh` regelmäßig ausführen
- CI-Workflow `dead-file-check` aktiv halten
- vor Löschungen immer Referenzscan + Smoke-Test
