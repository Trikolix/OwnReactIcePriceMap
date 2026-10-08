# Tages-Challenges für heute und morgen

`challenge_generate.php` berücksichtigt `for_tomorrow=true` ausdrücklich. Ohne das Flag wird eine Daily für heute angelegt, auch nach 18 Uhr. Morgen geplante Dailys beginnen um Mitternacht und enden um 23:59:59. Die Datenbankzeit bestimmt die Tagesgrenzen, passend zu den bisherigen Zeitfeldern und Aktivitätsabfragen.

Je Nutzer und Schwierigkeit werden heute und morgen getrennt auf vorhandene Dailys geprüft. Abgeschlossene Challenges belegen ihren Platz weiterhin. Ältere Abend-Challenges, die noch heute laufen, zählen zu heute. Weekly-Challenges behalten ihre bisherige Laufzeit; am Sonntag erstellte Weeklys laufen bis zum nächsten Sonntag.

Ein Neuversuch ändert die Eisdiele und behält Start, Ablauf, Typ und Schwierigkeit. Abgeschlossene oder abgelaufene Challenges sowie ein zweiter Neuversuch bleiben gesperrt. `valid_from` und die Distanzgrenzen werden gespeichert und in beiden bisherigen Antwortformaten zurückgegeben. Individuelle Distanzen entsprechen den Grenzen der vorhandenen Oberfläche. Die Check-in-Zuordnung berücksichtigt den Startzeitpunkt, damit eine geplante Challenge vor Mitternacht nicht abgeschlossen wird.

Der Fehler vom 7. Oktober 2026 entstand, weil der Generator das Flag ignorierte und nur `valid_until > NOW()` prüfte. Die exportierten Tages-Challenges 1113–1115 für den 7. Oktober blockierten dadurch auch den 8. Oktober. Die Regressionstests verwenden diese drei Datensätze in einer isolierten Testdatenbank; der Export selbst wird nicht geändert.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/php/run-challenge-generation.ps1
npm.cmd exec -- vite build --outDir build/challenge-generation-validation
```

Die Tests prüfen alle drei Schwierigkeiten, Doppelgenerierung, abgeschlossene und abgelaufene Challenges, Heute/Morgen nach 18 Uhr, Neuversuche, Jahreswechsel, Sonntag, individuelle Distanzen und die echte Check-in-Abfrage vor beziehungsweise ab Mitternacht. Docker verwendet vorhandene PHP-/MySQL-Images ohne externen Netzwerkzugriff oder Produktivdatenbank-Verbindung.

Bereitstellung: `backend/api/challenge_generate.php` und `backend/checkin/checkin_upload.php` gemeinsam aktualisieren; der Frontend-Hinweis in `src/pages/Challenges.jsx` beschreibt die ausdrückliche Tageswahl. Eine Datenbankmigration ist nicht erforderlich, da der Export die benötigten Spalten bereits enthält.
