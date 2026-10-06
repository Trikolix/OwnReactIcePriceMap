# Serien und Foto-Challenges prüfen

Der Browserlauf verwendet die tatsächlichen React-Seiten, den Header und den Benutzerkontext. Alle API-Antworten werden lokal simuliert; es werden keine produktiven Daten geändert. Chrome und die bereits installierten Projektabhängigkeiten werden benötigt.

```sh
node tests/manual/photo-challenge-browser.cjs --all --screenshots
node --test tests/unit/photoChallengePlanning.test.mjs
php tests/php/streaks_test.php
php -l backend/lib/streaks.php
```

Die Größen sind 320, 360, 390, 768, 1024, 1200, 1280 und 2560 Pixel, zusätzlich Querformat und geringe Höhe. Der Lauf prüft Einreichen, Fehler und Wiederholen, Titeländerung, Löschen, Limits, Fristen, Abstimmen und Stimmenänderung, Login, Kontowechsel, private Serienangaben, Schutzvorräte und Verwaltungsphasen. Dazu kommen Sammelaktionen mit Teilfehlern, geschützte Entwürfe und native Tastaturprüfungen für verschachtelte Dialoge.

Berichte und Screenshots liegen unter `build/photo-challenge-browser/`. `--keyboard-only` überspringt die Ablaufprüfungen; die Tastatur- und optionalen Bildprüfungen laufen weiter. Ein Produktionsbuild leert das reguläre `build/`-Verzeichnis, daher vorher die Bilder sichern oder zunächst `vite build --outDir build/production-review` verwenden.

Der vorhandene MySQL-Integrationstest benötigt einen isolierten Server mit `STREAK_TEST_DSN`, `STREAK_TEST_USER` und `STREAK_TEST_PASSWORD`. Ohne diese Angaben meldet er ausdrücklich einen übersprungenen Lauf.
