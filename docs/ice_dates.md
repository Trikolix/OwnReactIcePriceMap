# Eis-Dates

Ein Treffen hat acht reservierbare Plätze. Die Organisation behält einen Platz. Direkt eingeladene Nutzer sowie Antworten „Dabei“ und „Vielleicht“ reservieren jeweils einen weiteren Platz. Eine Absage eines anderen Teilnehmers gibt den Platz frei; eine spätere Zusage muss erneut Kapazität prüfen. Abgesagte Antworten bleiben als Historie erhalten.

Jeder angemeldete Empfänger eines gültigen Einladungslinks kann antworten. Neue Teilnehmer übermitteln den `invite_token` an `api/ice_date_rsvp.php`; bestehende Teilnehmer können weiterhin über `ice_date_id` antworten. Die Identität kommt ausschließlich aus der authentifizierten Sitzung. Eine Transaktion mit Sperre auf `ice_dates` serialisiert Antworten und Absagen. Antworten auf abgeschlossene oder abgesagte Treffen ergeben HTTP 409; volle Treffen ebenfalls. Identische Antworten erzeugen keine erneute Benachrichtigung.

Die Detail-API erlaubt anonyme Vorschau über den Token, berücksichtigt bei angemeldeten Aufrufen aber die persönliche Antwort und Organisatorrolle. Numerische IDs bleiben auf Organisation und Teilnehmer beschränkt. Antworten enthalten additiv `avatar_url` je Teilnehmer, `capacity`, `reserved_count`, `free_places`, `shop_is_open_at_start`, `checkin_window_open` und `can_checkin`. Fehlende Avatar-Tabellen erzeugen Initialen statt einer Schemaänderung.

`api/ice_date_shop.php` nimmt optional `starts_at` im bisherigen Format `Y-m-d H:i:s` an und liefert `is_open_at_start` (`true`, `false` oder `null`) sowie `opening_reference`. Die Prüfung verwendet Europe/Berlin, berücksichtigt saisonale Schließzeiträume, Wiedereröffnung und Öffnungszeiten über Mitternacht. Fehlende Zeiten bleiben unbekannt. Der Hinweis auf geschlossene Zeiten blockiert keine Erstellung. Die bestehende Terminvalidierung (Zukunft, maximal ein Jahr) bleibt erhalten.

Die persönliche Liste enthält auch abgesagte Treffen. Geplante Treffen werden während des bestehenden Check-in-Zeitfensters weiterhin unter „Kommende Treffen“ angezeigt; danach in der Historie. Zugeordnete Check-ins und der Abschluss ab zwei gemeinsamen Check-ins verwenden die bisherigen Regeln unverändert.

Formularentwürfe bleiben pro Browser-Tab in `sessionStorage` erhalten, auch beim Login mit Seitenneuladung. Erfolgreiches Erstellen und Abbrechen entfernen den Entwurf. Shopwechsel erhalten Termin, Nachricht und direkt eingeladene Freunde.

## Prüfung und Bereitstellung

- `node --test tests/unit/iceDate.test.mjs`
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/php/run-ice-dates.ps1`
- `node tests/manual/ice-date-browser.cjs --screenshots`
- `npm exec -- vite build --outDir build/ice-date-validation`

PHP-Prüfungen laufen in isolierten, vom externen Netzwerk getrennten PHP-/MySQL-Containern. Nur die Zustellungsanbieter werden durch einen Testadapter ersetzt; Datenbankeinträge für Benachrichtigungen, Authentifizierung und die echten APIs werden geprüft. Zwei separate PHP-Prozesse konkurrieren um den letzten Platz. Die Browserprüfung verwendet echte React-Komponenten, simulierte APIs und echte Chrome-Tastatureingaben bei 320, 390, 768 und 1280 px. Screenshots liegen unter `build/ice-date-browser`.

Für diese Erweiterung ist keine neue Migration erforderlich. Auf bestehenden Installationen genügt die vorhandene Eis-Date-Struktur. Backend und Frontend gemeinsam auf Entwicklung/Staging bereitstellen, den vollständigen Einladungs- und Check-in-Ablauf dort prüfen und anschließend gemeinsam produktiv bereitstellen. Die lokale Prüfung versendet keine externen Nachrichten.
