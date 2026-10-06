# Kundenkarten und Betreiberzugang

Der Pilot verbindet manuell geprüfte Betreiberzuordnungen mit digitalen Kundenkarten. Ein Check-in, Standort oder Kampagnen-QR vergibt keine Stempel. Stempel und Prämien werden nur durch aktive, zugeordnete Betreiber oder Mitarbeiter bestätigt.

## Einstieg und Bedienung

- Kunden: Menü → **Meine Kundenkarten** (`/kundenkarten`); Teilnahme auf der Eisdielenseite ausdrücklich bestätigen. Ein Programm zählt entweder bezahlte Kugeln oder genau einen Stempel je Kauf. Standard: 14 bezahlte Kugeln ergeben eine Freikugel.
- Antrag: Eisdielenseite → **Betreiberzugang beantragen** (`/betreiber/antrag/:shopId`). Kontakt und Begründung sind ausschließlich für den Antragsteller und Admin sichtbar.
- Admin ID 1: Menü → **Betreiberanträge** (`/admin/betreiber`). Persönlich anhand eines unabhängigen Geschäftskontakts prüfen, Prüfvermerk und Bestätigung erfassen, dann freigeben. Der Eintragsersteller wird nicht automatisch Betreiber.
- Betreiber: **Meine Eisdielen** (`/betreiber`) → Eisdiele öffnen. Theke, Verwaltung/Statistik und Buchungsverlauf sind getrennt erreichbar. Öffnungszeiten, Website und Betriebsstatus werden direkt gespeichert; Name, Adresse und Position bleiben im vorhandenen Prüfverfahren.
- Mitarbeiter: Einladung an einen vorhandenen Nutzernamen, anschließend ausdrückliche Annahme unter „Meine Eisdielen“. Danach ausschließlich Thekenmodus für die zugeordnete Eisdiele.

An der Theke zeigt der Kunde „Stempel sammeln“. Personal scannt oder gibt den zehnstelligen Code ein, prüft Kunde und Bedingungen und bestätigt 1–50 **bezahlte** Kugeln beziehungsweise einen Kauf. Erreichte Ziele werden in verfügbare Prämien umgerechnet, Reststempel bleiben erhalten. Zum Einlösen zeigt der Kunde einen **separaten Prämiencode**; Personal bestätigt die tatsächliche Ausgabe einer Prämie. Gratisleistungen zählen nicht als neue Stempel.

Scan-Codes enthalten `iceapp-loyalty:` und einen zufälligen Token, keine Webadresse und keine personenbezogenen Angaben. Kamera nutzt `BarcodeDetector`, sonst `@zxing/browser`; bei fehlender Kamera oder abgelehnter Berechtigung bleibt manuelle Eingabe möglich. Die Kamera stoppt beim Scan und beim Schließen. Android erhält eine optionale Kameraberechtigung. Die neue ZXing-Version benötigt für Installation/Build Node 24 oder neuer.

## Daten und Sicherheitsregeln

Migration: `backend/Database/migrations/2026-10-06_loyalty_pilot.sql`. Additive InnoDB-Tabellen für Anträge, Mitgliedschaften, Programme, Karten, gehashte Einmalcodes, Buchungsjournal, Verwaltungsprotokoll und Versuchslimits. Mehrfaches Ausführen erzeugt keine Karten, Programme oder Stempel.

- Ein aktiver Betreiber pro Eisdiele; mehrere Mitarbeiter. Jeder Request verwendet den authentifizierten Nutzer und prüft das Recht für die konkrete Eisdiele. Adminrechte allein erlauben keinen Thekenzugriff.
- Veröffentlichung fixiert Einheit, Ziel (2–100) und Prämie (bis 300 Zeichen). Ein neues Programm beendet das bisherige atomar. Der Client bestätigt dessen aktuelle ID; Wiederholung mit veraltetem Stand wird abgelehnt. Reststempel werden nicht übertragen. Beendete Karten bleiben sichtbar; vorhandene Prämien bleiben einlösbar.
- Codes sind 120 Sekunden gültig und einmalig verwendbar. Scan- und Eingabecode werden nur als SHA-256-Hashes gespeichert. Bestehende Codes bleiben bis zu ihrer Ablaufzeit gültig, damit laufende Bestätigungen nicht durch Erneuerung unterbrochen werden. Codeausgabe: 10/min, Codeprüfung: 30/min, Buchungsversuche: 60/min pro Nutzer. Versuchszähler enthalten keine IP-Adressen oder Rohcodes und werden nach einer Stunde schrittweise bereinigt.
- Shop-Sperre serialisiert Vergabe, Einlösung, Storno, Programmwechsel und Rechteentzug. Karte, Codeverbrauch und Journal werden gemeinsam committed. Ein global eindeutiger Request-Schlüssel bindet Mitarbeiter und vollständigen Buchungsinhalt; identische Wiederholung liefert das ursprüngliche Ergebnis, auch nach Ablauf des Codes. Entzogene Mitarbeiterrechte verhindern auch Wiederholungen.
- Keine optimistische Erfolgsmeldung und kein Offline-Versand. Bei unklarer Serverantwort werden Menge und Code gesperrt und derselbe Request erneut geprüft. Der offene Vorgang wird pro Nutzer/Eisdiele im Session-Speicher erhalten, auch nach Neuladen. Bekannte Ablehnung oder Erfolg entfernt ihn.
- Storno ist eine vollständige Gegenbuchung mit eigenem Request-Schlüssel. Original und Gegenbuchung bleiben erhalten. Konservativ wird jedes Storno nach einer späteren Einlösung auf derselben Karte abgelehnt; eingelöste Prämien werden nie aufgehoben. Mitarbeiter können nicht stornieren.
- Admin-Widerruf entzieht Betreiber und sämtlichen Mitarbeitern den Zugriff und beendet aktive Programme. Vorhandene Karten/Prämien bleiben gespeichert; zur weiteren Ausgabe braucht die Eisdiele einen erneut geprüften Betreiber.
- Statistiken zählen Kunden über Programme hinweg eindeutig, bestätigte Käufe ohne Stornos, bestätigte Einheiten sowie offene/eingelöste Prämien. Gemischte Programme werden bei der Einheitensumme als „Einheiten“ bezeichnet.
- Es gibt weder automatische Ablaufdaten, Kassenintegration noch Kundenkartenaktivitäten im Feed. Absichtlich falsche Kaufbestätigungen durch berechtigtes Personal sind ohne Kassenintegration nicht zuverlässig erkennbar.

## Schnittstellen

`backend/loyalty.php?action=…`: authentifizierte GET-Leseaktionen und POST-Änderungen mit JSON. Antworten enthalten `status: success` oder einen sichtbaren Fehler mit passendem HTTP-Status. Karteninhalte werden nur dem Karteninhaber, Thekenvorschauen nur zugeordnetem Personal gezeigt. GET kann keine Änderungen auslösen. Vorhandene CORS-/Auth-Konfiguration gilt weiterhin; JSON und Content-Type verhindern einfache fremde Formular-POSTs.

| Bereich | Aktionen / wesentliche Eingaben |
|---|---|
| Kunden | GET `cards`; GET `card` mit `card_id`, optional `before_id`; POST `join` mit `program_id` |
| Codes | POST `issue_code` mit `card_id`, `purpose: stamp/redeem`; GET `code_status` mit `code_id`; POST `inspect_code` mit `shop_id`, `code` |
| Buchungen | POST `book` mit `shop_id`, `code`, `purpose`, ganzzahliger `quantity`, `request_key`; POST `reverse` mit `shop_id`, `entry_id`, `request_key` |
| Betreiber | GET `overview`, GET `operator_shop` mit `shop_id`, GET `history` mit `shop_id`/optional `before_id`; POST `claim`, `invite_staff`, `accept_invite`, `revoke_staff` |
| Programme | POST `publish_program` mit `shop_id`, `unit: scoop/purchase`, `stamp_target`, `reward`, `current_program_id` (0 bei keinem aktiven Programm); POST `end_program` mit `shop_id`, `program_id` |
| Geschäftsdaten | POST `update_business` mit `shop_id`, `website`, `status`, `opening_hours` (alle sieben Wochentage, bis drei Zeitbereiche, optionaler Hinweis) |
| Administration | GET `claims`, `operators`; POST `review_claim` mit `claim_id`, `approve`, `note`, bei Freigabe `verified: true`; POST `revoke_operator` mit `shop_id` |

Karten- und Betreiberverlauf liefern 50 Einträge sowie `next_cursor` für bewusstes Nachladen. Die vorhandenen Eisdielenantworten ergänzen `loyalty_program` und `business_permissions`, ermittelt aus der authentifizierten Sitzung. Eine übergebene Nutzer-ID erzeugt keine Betreiberrechte. Bei noch fehlender Pilotmigration bleiben vorhandene Eisdielenantworten nutzbar.

## Prüfung und Einführung

Automatisierte Prüfungen:

```powershell
powershell -ExecutionPolicy Bypass -File tests/php/run-loyalty.ps1
node tests/manual/loyalty-browser.cjs --screenshots
npm.cmd run build -- --outDir build/loyalty-pilot
```

PHP/MySQL läuft in temporären Containern ohne Zugriff auf Produktivdaten, einschließlich echter HTTP-Anfragen und paralleler PHP-Prozesse. Browserfixture verwendet echte Komponenten, QR-Erzeugung/JS-Decodierung und Tastaturbedienung, aber simulierte API-Antworten und Kameraablehnung. Screenshots/Reports liegen unter `build/loyalty-browser`.

Vor Freigabe: Migration auf gesicherter Staging-Datenbank ausführen, Servercode und Frontend gemeinsam bereitstellen, Betreiber für zwei bis drei Pilot-Eisdielen manuell prüfen und Mitarbeiter einladen. Auf einem echten Android-Gerät und iPhone die Kamerafreigabe, Scan/Manuelleingabe, Stempelvergabe, sofortige/spätere Einlösung sowie Verbindungsabbrüche an der Theke prüfen. Android-App mit aktualisiertem Manifest neu bauen. Kamera- und Thekentests auf physischen Geräten sind durch die lokale Browserprüfung nicht abgedeckt.
