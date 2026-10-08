# Systemmeldungen: Betrieb und Tests

## Einführung

1. Verwaltung der Systemmeldungen während der Umstellung sperren und den bisherigen Systemmeldungs-Cron stoppen. Datenbank sichern.
2. `backend/Database/migrations/2026-10-06_harden_systemmeldungen.sql` mit einem MySQL-Client importieren. Die Migration kann erneut ausgeführt werden, während der Worker gestoppt ist. Sie benötigt CREATE/ALTER/INDEX und PREPARE, aber keine Rechte für gespeicherte Prozeduren.
3. Backend und Frontend gemeinsam aktualisieren. Bestehende Meldungen bleiben veröffentlicht. Bestehende wartende E-Mails bleiben erhalten; bereits laufende Alt-Jobs werden als „unklar“ übernommen. Die Migration erzeugt keine neuen Aussendungen.
4. Den vorhandenen PHP-CLI-Cron wieder aktivieren, beispielsweise jede Minute:

   ```sh
   php /absoluter/pfad/backend/Skripte/cron_send_systemmeldung_mails.php --limit=20
   ```

   Derselbe Worker verarbeitet jetzt E-Mail und Push abwechselnd. Seine Ausgabe ist JSON mit `processed`, `accepted`, `retry`, `failed`, `uncertain` und `skipped`. HTTP-Aufrufe werden abgewiesen. Ein Worker verarbeitet maximal 100 Jobs pro Aufruf.

5. Vor Freigabe einen Entwurf mit dem Admin-Testkonto prüfen: App-Vorschau, Testmail und einen gezielten Browser-/Android-Push über die vorhandene Push-Testverwaltung. Cron-Ausgabe und Empfängerpostfach kontrollieren. Ein Testmail-Aufruf erzeugt keine In-App-Massenveröffentlichung.

PHP-Mailtransport, VAPID und FCM verwenden die vorhandene Serverkonfiguration. Tests in diesem Repository senden keine echten Nachrichten. Produktions-Cron, DNS/Spamfilter und tatsächliche Zustellung müssen am Server geprüft werden.

## Verhalten

- Nur der authentifizierte Admin mit ID 1 verwaltet Meldungen. Empfänger lesen ausschließlich ihre eigenen veröffentlichten App-Inhalte. E-Mail-Inhalte bleiben Admin-Daten.
- Entwürfe versenden nichts. Veröffentlichung speichert Meldung, Benachrichtigungen und Jobs atomar. Ein stabiler `request_key` verhindert Doppelveröffentlichungen, auch nach einer verlorenen Antwort. Andere Inhalte mit demselben Schlüssel werden abgewiesen.
- `preview` liefert das wirkliche E-Mail-Template und aktuelle Empfängerzahlen. `publish` erwartet diese Zahlen in `expected_counts`; geänderte Zahlen führen zu HTTP 409 und einer erneuten Bestätigung.
- E-Mail berücksichtigt `notify_news`; Browser-/Android-Push berücksichtigt `notify_news_push` sowie den jeweiligen globalen Push-Schalter. Push ist im Editor standardmäßig deaktiviert. Die Empfängerübersicht zählt App-/E-Mail-Empfänger und einzelne Push-Geräte.
- „E-Mail an alle“ erfordert Checkbox und den Text `EMAIL AN ALLE`. Der Override wird protokolliert und bleibt auch bei der Versandprüfung erhalten. Gelöschte Empfänger, geänderte E-Mail-Adressen und deaktivierte Geräte werden übersprungen.
- Nach Veröffentlichung dürfen Titel, App-Text und App-Link korrigiert werden. E-Mail-Standardwerte, Buttons und Push-Payloads bleiben als ursprüngliche Snapshots erhalten. Erneuter Versand erfolgt als neue Meldung.
- Zurückziehen blendet App-Benachrichtigungen aus und stoppt wartende Jobs. Bereits an den Transport übergebene Nachrichten können nicht zurückgeholt werden. Versandnachweise bleiben erhalten.
- Temporäre Ablehnungen werden bis zu dreimal mit Wartezeiten wiederholt; Push berücksichtigt `Retry-After`. Permanente Fehler bleiben sichtbar. Ein Verbindungsabbruch oder ausgelaufener Worker mit unklarem Ausgang wird nicht automatisch erneut versendet.
- „Zum Versand angenommen“ bestätigt die Übergabe an Mailtransport beziehungsweise Push-Provider. Es bestätigt weder den E-Mail-Empfang noch die Anzeige auf dem Gerät. Browser-Push besitzt zusätzlich getrennte Anzeige-/Klicknachweise.

## Schnittstellen

Bestehende PHP-Pfade bleiben bestehen. `systemmeldung.php` unterstützt GET `list`, `meta`, `get` und POST `save_draft`, `preview`, `test_email`, `publish`/`create`, `update`, `withdraw`/`delete`. Änderungen erfordern JSON. `list` verwendet Seiten mit 20 Meldungen.

`benachrichtigungen.php` leitet den Empfänger aus dem Auth-Token ab. Eine weiterhin übergebene `nutzer_id` muss dazu passen. Die Liste enthält maximal 50 Elemente, `unread_total` und `next_cursor`; die nächste Seite wird mit `before_id` geladen. Fehler haben passende HTTP-Statuscodes.

## Fehler beim Laden der Historie

Fehlende Tabellen oder Spalten ergeben HTTP 503 mit `code: SYSTEMMELDUNG_SCHEMA_OUTDATED`. Der authentifizierte Admin erhält zusätzlich den Namen der erforderlichen Migration. Die Migration `backend/Database/migrations/2026-10-06_harden_systemmeldungen.sql` muss in derselben Datenbank wie das Backend vollständig ausgeführt werden; insbesondere benötigt die Historie auch `systemmeldung_push_queue`, selbst wenn Push im Editor deaktiviert bleibt. Die API ändert das Schema nicht selbst.

Bei HTTP 500 mit „Aktion konnte nicht abgeschlossen werden“ steht die konkrete Ursache im PHP-Fehlerlog nach `Systemmeldung API:`. Diese Antwort allein belegt keine fehlende Migration. SQL-Fehlerdetails werden ausschließlich im Serverlog protokolliert. Nach Einrichtung der Datenbank muss ein authentifizierter Admin-Aufruf von `systemmeldung.php?action=list&page=1` HTTP 200 mit `systemmeldungen` und `pagination` liefern.

## Lokale Prüfung

```powershell
node --test tests/unit/systemMessages.test.mjs
powershell -ExecutionPolicy Bypass -File tests/php/run-systemmeldungen.ps1
node tests/manual/header-browser.cjs --systemmeldungen --screenshots
npm.cmd run build
```

Der PHP-Test benötigt Docker. Er startet eine separate MySQL-Datenbank ohne veröffentlichte Ports. Das Projekt wird schreibgeschützt eingebunden; die Backend-Kopie erhält ausschließlich fest definierte Testzugangsdaten. Mail- und Push-Transporte sind ersetzt oder gesperrt. Die temporären Container werden anschließend entfernt.

Browserprüfungen verwenden ersetzte APIs und 320, 390, 768 sowie 1280 Pixel. Berichte und Screenshots liegen unter `build/systemmeldungen-browser`.
