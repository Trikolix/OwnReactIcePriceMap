# Streaks und Freeze-Betrieb

## Einführung

1. Vor dem PHP-Deployment `backend/Database/migrations/2026-09-16_add_streak_freezes.sql` auf der jeweiligen Datenbank ausführen. Wiederholbares SQL; der erste Ausführungszeitpunkt bleibt als Einführung erhalten. `launched_at` speichert UTC, Check-in-DATETIME und Perioden verwenden Berliner Kalenderzeit. MySQL-Zeitzonentabellen werden nicht benötigt.
2. Backend und Frontend gemeinsam ausrollen. Die drei neuen Tabellen sind Voraussetzung, es gibt bewusst keine DDL innerhalb von Check-in-Transaktionen. `backend/` ist die Quelle; eine getrennte Dev-Installation benötigt dieselbe Migration und dieselben PHP-Dateien.
3. Täglich um 00:05 **Europe/Berlin** `php /pfad/zur/Ice-App/backend/Skripte/cron_streak_freezes.php` ausführen. Bei Cron mit `CRON_TZ`-Unterstützung:

   ```cron
   CRON_TZ=Europe/Berlin
   5 0 * * * /usr/bin/php /pfad/zur/Ice-App/backend/Skripte/cron_streak_freezes.php
   ```

   Andernfalls die Scheduler-Zeitzone explizit einstellen. Der Job ist wiederholbar, verarbeitet Nutzer in Batches und liefert bei Fehlern Exitcode 1; Fehler gehen ins PHP-Errorlog. Authentifizierte Aktivität und Check-ins holen Ausfälle nach.

Keine rückwirkenden Vorräte oder Belohnungen. Bereits laufende Serien bleiben bestehen; für Belohnungen zählen nur erstmals ab Einführung aktuell eingecheckte Perioden. Eine schon vor Einführung eingecheckte laufende Woche zählt nicht nochmals als neue Belohnungsperiode. Bei vollem Vorrat wird die Belohnung mit Betrag 0 endgültig protokolliert.

## Schnittstellen und Konsistenz

- `GET api/streak_status.php?user_id=123` (auch `@username`) liefert `user_id`, `level_info`, `refresh_after_seconds` und `streaks`. Der Abruf bucht nichts. `POST` ist nur für den authentifizierten eigenen Nutzer erlaubt und gleicht abgelaufene Perioden ab. Keine Nutzer-ID aus dem Request autorisiert Schreibzugriffe.
- `streaks.day/week` behalten `value`, `record`, `state`, `deadline_iso`, `seconds_left`; neu sind `start`, `protected_periods` und Zustand `frozen`. `day_current/week_current` bleiben aus Kompatibilitätsgründen außerhalb einer aktuell eingecheckten Periode 0. Die UI verwendet `day/week.value`.
- Nur der Besitzer erhält `freezes: {day, week}` und `last_freeze: {type, period}`. Öffentliche Antworten enthalten weder Vorräte noch persönliche Vergabebuchungen.
- Check-in-Upload ergänzt `streaks` und `streak_events`. Ereignisse haben eindeutige `id`, `type`, `kind`, `period`, `amount` und bei `start/continue` einen `value`. `consume` bezeichnet automatischen Verbrauch, `grant` eine Vergabe. Eine volle Tasche produziert `grant` mit `amount: 0`, ohne Erfolgsmeldung.
- `streak_wallets` hält Vorräte und Verarbeitungsstand, `streak_ledger` eindeutige Vergaben, qualifizierende Perioden und Verbrauch. Schreibvorgänge sperren zuerst die Nutzerzeile. Verbrauch wird vor dem Einfügen/Löschen eines Check-ins abgerechnet; Challenges und Serienbelohnungen folgen danach in derselben Transaktion.
- Tages-/Wochen-Awards nutzen echte Perioden plus verbuchte Schutzperioden; Schutzperioden tragen 0 zur Schwelle bei. Award 13 (mehrere Eisdielen an einem Tag) bleibt unverändert.
- Nachträge korrigieren die Serie ohne Vergabe oder Erstattung. Löschen setzt vergangene Verarbeitung nicht zurück und zieht bereits verliehene Awards nicht ein.

## Prüfungen

```sh
php tests/php/streaks_test.php
php tests/php/streaks_integration_test.php
node node_modules/vite/bin/vite.js build
node tests/manual/streaks-preview.cjs
```

Die MySQL-Integration benötigt `STREAK_TEST_DSN`, `STREAK_TEST_USER`, `STREAK_TEST_PASSWORD` für einen separaten Testserver mit CREATE/DROP-DATABASE-Rechten. Ohne DSN wird sie mit Exitcode 77 übersprungen. Sie erzeugt eine zufällige `ice_streak_test_*`-Datenbank, testet unter anderem tatsächliche konkurrierende Prozesse, Vergabegrenzen, Wiederholungen, Nachträge und Löschungen und entfernt ausschließlich ihre Testdatenbank.

Der optionale visuelle Test rendert die echten gemeinsamen React-Komponenten mit Testdaten in Chrome; `CHROME_BIN` kann den Browserpfad überschreiben. Vorschau und Screenshots liegen unter `build/`. Dies ersetzt keinen vollständigen Live-Test des Headers mit echten API-Antworten.

Abnahme in der Dev-App: eigener/fremder Nutzer, Avatar mit Bild/Initialen, schmale Mobilansicht, Streak-Fortsetzung einmalig, zweiter Check-in ohne erneute Animation, Freeze-Verbrauch, Reload, Fokuswechsel, Mitternacht, Kontowechsel und reduzierte Bewegung. Cron-Exitcode und PHP-Fehler bei Einführung überwachen.
