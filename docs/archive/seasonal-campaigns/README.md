# Seasonal Campaign Archive

Dieses Verzeichnis dokumentiert aufgeräumte Altaktionen und deren spätere Wiederverwendung.

## Zielbild
- vergangene Aktionen bleiben als Historie nachvollziehbar
- produktive Entry-Points importieren keine verstreuten Legacy-Komponenten mehr
- wiederverwendbare Muster werden in `src/features/seasonal/*` gepflegt

## Archivierte Legacy-Komponenten
- `src/archive/seasonal/legacy/ChristmasElf.jsx`
- `src/archive/seasonal/legacy/EasterBunny.jsx`
- `src/archive/seasonal/legacy/OlympicsVenues.jsx`
- `src/archive/seasonal/legacy/BirthdayPresentMarkers.jsx`
- `src/archive/seasonal/legacy/BirthdayRulesModal.jsx`

## Historische Backend-Reste
- `backend/api/birthday_progress.php`
- `backend/api/birthday_leaderboard.php`
- `backend/api/olympics_leaderboard.php`

Diese Endpunkte bleiben als Read-APIs erhalten, solange historische Ergebnisansichten im Produkt sichtbar sind.
