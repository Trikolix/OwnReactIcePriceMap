# Challenge-Seite prüfen

Die Prüfung rendert die echten Solo- und Team-Komponenten mit isolierten API-Antworten. Sie verändert keine produktiven Daten. HTTPS-Verbindungen sind im Testbrowser gesperrt; deshalb erscheinen Karten ohne externe Kartenkacheln. Marker, Auswahl, Bedienelemente und Layout werden lokal geprüft.

```powershell
npm.cmd run build
node --test tests/unit/challengePlanning.test.mjs
powershell -NoProfile -File tests/php/run-challenge-generation.ps1
node tests/manual/challenge-browser.cjs --screenshots
```

Chrome muss installiert sein; alternativ den Pfad über `CHROME_BIN` setzen. Die PHP-Regression benötigt die bereits verwendeten Docker-Images `mysql:8.0` und `php:8.3-cli` und läuft gegen eine isolierte Datenbank.

Der Browser prüft 56 Verhaltensfälle je Bildschirmbreite (320, 390, 768 und 1280 px): belegte abgeschlossene Tagesplätze, heute/morgen, Wochen-Challenges, individuelle Distanzen, Sammelerstellung mit Teilerfolg und gezieltem Wiederholen, verweigerten Standort, Login-Einstieg, Ladefehler, Team-Kapazität und Einladungen, Zielwahl, Abbruchbestätigung, Check-in-Fortschritt, Verlauf, veraltete API-Antworten, Rückkehr nach einem Check-in und Tageswechsel. Check-in-Ziele verwenden den bestehenden Link `/shop/:id?openCheckin=1`.

Zusätzliche native Chrome-Tastatureingaben prüfen die Nutzersuche (Pfeiltasten, Enter, Escape), den Dialogfokus über 18 Tab-Schritte und die Fokusrückgabe beim Schließen. Escape schließt zunächst die geöffnete Suchliste; danach den Dialog.

Mit `--screenshots` werden 14 Zustände je Breite aufgenommen und auf horizontales Überlaufen sowie mindestens 44 px große Aktionsflächen geprüft. Bei Radiofeldern zählt die vollständige klickbare Beschriftung. Kartenattribution ist von der Aktionsflächenmessung ausgenommen. Ergebnisse und Bilder liegen in `build/challenge-browser/`; ein erneuter Produktionsbuild entfernt diesen Ordner.

Die Angebots- und Challenge-APIs sowie die Datenbankstruktur bleiben unverändert. Einladungen werden aus den vorhandenen Team-Datensätzen abgeleitet. Die Zeit- und Platzbelegungsauswertung verwendet Berlin-Zeit und berücksichtigt auch abgeschlossene Challenges innerhalb ihres gültigen Zeitraums.
