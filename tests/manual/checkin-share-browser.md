Die eigene Teilen-Funktion stammt aus Commit `5478351` auf `feature/price-history-ranking-refactor`. Sie wurde gezielt wiederhergestellt; andere Änderungen dieses Commits wurden nicht übernommen.

Prüfungen aus dem Repository-Verzeichnis:

```powershell
npm.cmd run build
node --test tests/unit/checkinShare.test.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File tests/php/run-checkin-share.ps1
node tests/manual/checkin-share-browser.cjs
```

Die PHP-Prüfung verwendet eine isolierte MySQL-Datenbank, echte Tokenauthentifizierung und PHP/GD. Sie schreibt die Bildexporte nach `build/checkin-share/`: Story und Beitrag als Foto beziehungsweise Bewertungskarte, zusätzlich ein echtes JPEG aus dem Repository, private Check-ins und Fälle mit langen Namen, Kommentaren, Sorten und Auszeichnungen. Sie prüft auch die berechneten Abstände und Bildgrenzen sowie halb gefüllte Sterne auf einem Fotohintergrund. Sie liest keine `.env` und benötigt keine Datenbankmigration. Die einmalige Erstellung des lokalen Testimages installiert GD, JPEG/WebP-Unterstützung und FreeType.

Die Browserprüfung benötigt diese PNGs und lokal installiertes Chrome (alternativ `CHROME_BIN`). Alle API-Antworten werden simuliert; externe HTTPS-Aufrufe sind blockiert. Bei 320, 390, 768 und 1280 px prüft sie Besitzer/Gäste, die dezente Platzierung neben Likes und Kommentaren, beide Formate, Fotoauswahl, Download, Web Share, Abbruch, Fallback, Auszeichnungen, verspätete Antworten, Fehler/Wiederholen, Check-ins ohne Ort oder Foto, Mindestgröße der Aktionen und echte Tastatureingaben mit Fokusführung. Wiederholen muss die gewählten Einstellungen behalten. Eine vergrößerbare Vorschau, sichtbare Rückmeldungen im Footer und ein manuell kopierbarer Begleittext bei Clipboard-Fehlern gehören ebenfalls zur Prüfung. Für Browser ohne Datei-Teilen ist Speichern die Hauptaktion; die simulierte native Oberfläche bietet Teilen und Text kopieren. Screenshots und Berichte liegen in `build/checkin-share-browser/`.

Die Exporte verwenden die statischen Nunito-Schnitte `backend/assets/fonts/Nunito-Regular.ttf` und `Nunito-Bold.ttf`. Diese beheben die zu dünne Darstellung der variablen Originalschrift in GD. Die bestehende Lizenz `Nunito-OFL.txt` bleibt beigefügt. Zur erneuten Erzeugung aus `Nunito.ttf` dient `scripts/generate-export-fonts.py`; dafür wird lokal FontTools benötigt, auf dem PHP-Server nicht. Die Bewertungskarte zeigt eine Karte nur bei vorhandenen öffentlichen Shopkoordinaten und genügend Platz. Fotoexporte lassen das Foto groß und verwenden einen an die Textmenge angepassten Verlauf statt kräftiger Schriftkonturen.

Abnahme am 7. Oktober 2026: 58 PHP-Integrationsprüfungen und PHP-Syntaxprüfungen bestanden, 9 Unit-Tests für Teilen und Begleittext bestanden, 39 Browserprüfungen je Bildschirmbreite sowie Tastaturprüfung bestanden. Die vorhandene Feed-Prüfung bestand mit 122 Prüfungen je Breite und 6 zusätzlichen Tastaturprüfungen. PNGs und Dialog-Screenshots wurden visuell geprüft, einschließlich dichter Inhalte und flacher Kartenausschnitte. Die Kartenprüfung läuft offline mit dem bestehenden Ersatzbild; echte OSM-Kacheln und der native Teilen-Dialog sind damit nicht auf einem Gerät abgenommen.

Frontend und Backend einschließlich `backend/social_media/checkin_share.php`, `helpers.php`, `backend/lib/checkin_share_design.php`, `social_media_stories.php`, `social_report_stories.php` und der beiden neuen Schriftdateien zusammen bereitstellen. Für eine neue Android-Version nach dem Frontend-Build `npm.cmd run cap:sync` ausführen; Filesystem und Share sind in den Android-Projekten registriert. Der echte Android-Teilen-Dialog und die Auswahl in Instagram müssen zusätzlich auf einem Gerät geprüft werden.
