# Arbeitsplan: Foto-Challenges, Geburtstagsaktion, RadEvent

Stand: 26.02.2026

Ziel: Gemeinsames Aufgaben-Dokument zum schrittweisen Abarbeiten und Verfeinern.

## Legende

- `[ ]` offen
- `[~]` in Arbeit
- `[x]` erledigt
- `P1` = hoch (zeitkritisch / blockierend)
- `P2` = wichtig
- `P3` = nice-to-have / später konkretisieren

## Empfohlene Reihenfolge (grob)

1. `P1` Foto-Challenges prüfen und stabilisieren (Basis für Geburtstagsaktion)
2. `P1` Geburtstagsaktion (14.03.2026 bis 22.03.2026) fachlich + technisch vorbereiten
3. `P1/P2` RadEvent-Page schrittweise fertigstellen (größerer Themenblock)

## 1) Foto-Challenges prüfen (Nutzer + Admin, fehlersicher)

Referenz für Ziel-Workflow (Einreichphase -> Admin-Planung -> Voting):

- `docs/photochallenge_workflow_v2_spec.md`

### 1.1 Ist-Aufnahme / Funktionscheck (P1)

- [ ] Nutzer-Flow komplett testen: Challenge ansehen -> Foto hochladen/teilnehmen -> Voting -> Ergebnis sichtbar
- [ ] Admin-Flow testen: Challenge anlegen/bearbeiten -> Freigabe/Moderation -> Auswertung
- [ ] Rollen/Rechte prüfen (Nutzer darf keine Admin-Aktionen ausführen)
- [ ] Leere Zustände prüfen (keine Challenge, keine Votes, kein Foto)
- [ ] Fehlerfälle prüfen (Netzwerkfehler, ungültige Daten, doppelte Aktionen)
- [ ] Mobile-Ansicht testen (wichtig für Foto-Upload)

### 1.2 UX / Nutzbarkeit verbessern (P1/P2)

- [ ] Klarere Hinweise im UI: Was muss der Nutzer tun? (Upload, Regeln, Fristen, Voting)
- [ ] Statusanzeigen ergänzen: "bereits teilgenommen", "Voting offen/geschlossen", "wartet auf Freigabe"
- [ ] Nutzerfeedback verbessern (Success-/Error-Meldungen verständlich)
- [ ] Formularvalidierung frühzeitig anzeigen (statt erst nach Submit)
- [ ] Admin-Ansicht auf Effizienz prüfen (Filter, Sortierung, schnelle Moderation)

### 1.3 Fehlersicherheit / Datenkonsistenz (P1)

- [ ] Doppelte Votes verhindern (Frontend + Backend prüfen)
- [ ] Mehrfach-Uploads / doppelte Teilnahmen pro Challenge-Regel sauber behandeln
- [ ] Upload-Limits prüfen (Dateityp, Größe, ggf. Bilddimensionen)
- [ ] Sicherheitscheck: Dateinamen / Upload-Pfade / unerlaubte Dateitypen
- [ ] Ablauf bei abgelaufener Challenge prüfen (keine neuen Einsendungen/Votes)
- [ ] Logging für Fehlerfälle verbessern (mind. serverseitig nachvollziehbar)

### 1.4 Tests / Abnahme (P2)

- [ ] Test-Checkliste für Nutzer erstellen (Happy Path + 5 häufige Fehlerfälle)
- [ ] Test-Checkliste für Admin erstellen
- [ ] Mindestens 1 Test-Challenge komplett durchspielen (inkl. Voting-Ende)
- [ ] Ergebnis dokumentieren: gefundene Bugs + Entscheidungen

### 1.5 Offene Punkte (für gemeinsames Refinement)

- [ ] Welche Regeln gelten genau pro Challenge? (1 Foto pro Nutzer? mehrere?)
- [ ] Wie werden Gleichstände im Voting behandelt?
- [ ] Braucht Admin eine manuelle Sperr-/Freigabe-Funktion für Fotos/Votes?

## 2) Aktion zum 1. Geburtstag der Ice-App (14.03.2026 - 22.03.2026)

Ziel laut Idee: Wer alle Aktionen innerhalb der Aktionswoche abschließt, bekommt eine Kugel Eis (Einlösung am Tag der Eis-Tour am Start-/Zielort).

### 2.1 Fachliche Definition der Aktion (P1)

- [ ] Aktionsnamen, Beschreibung und Regeln final definieren
- [ ] Zeitraum technisch festlegen: Start `14.03.2026 00:00` / Ende `22.03.2026 23:59` (falls so gewünscht)
- [ ] Teilnahmebedingungen definieren (wer ist berechtigt? nur bestehende Nutzer? neue Nutzer auch?)
- [ ] Definition "alle Aktionen abgeschlossen" eindeutig machen
- [ ] Missbrauchsschutz definieren (Fake-Einladungen, Schein-Checkins, Mehrfachkonten)

### 2.2 Aufgaben / Challenges der Geburtstagsaktion (P1)

Bereits genannt:

- [ ] Nutzer einladen (`eingeladener neuer Nutzer` muss mind. 1 Eis einchecken)
- [ ] Mindestens 1 Gruppencheckin
- [ ] Bei der Fotochallenge voten
- [ ] An mindestens 5 von 8 Tagen einloggen

Weitere sinnvolle Ideen (optional, später entscheiden):

- [ ] 1 neues Eiscafe entdecken (erstmaliger Check-in für den Nutzer)
- [ ] 1 Bewertung/Kommentar abgeben (falls Feature vorhanden / sinnvoll)
- [ ] 1 Favoritenliste-Eintrag anlegen oder teilen (falls passend)

### 2.3 Tracking / technische Umsetzung (P1)

- [ ] Datenmodell festlegen: Aktionsfortschritt pro Nutzer (pro Teilaufgabe Status + Zeitstempel)
- [ ] Bestehende Events wiederverwenden, wo möglich (Login, Vote, Check-in, Invite)
- [ ] Regel "5 von 8 Tagen eingeloggt" robust zählen (Tagesgrenze/Zeitzone definieren)
- [ ] Regel "eingeladener Nutzer checkt mind. 1 Eis ein" technisch verknüpfen
- [ ] Fortschrittsanzeige in der App bauen ("4/5 Aufgaben erledigt")
- [ ] Endstatus/Belohnungsanspruch markieren (einlösbar ja/nein)

### 2.4 UX / Kommunikation (P1/P2)

- [ ] Aktionsseite/-karte ähnlich Olympia-Aktion anlegen
- [ ] Regeln kompakt und verständlich darstellen
- [ ] Fortschritt visuell anzeigen (Checkliste / Balken)
- [ ] Hinweise bei erledigten Aufgaben anzeigen
- [ ] Klare Info zur Einlösung der Kugel Eis (wann, wo, Bedingungen)

### 2.5 Admin / Auswertung (P2)

- [ ] Admin-Liste aller Teilnehmer mit Fortschritt
- [ ] Filter "vollständig abgeschlossen"
- [ ] Exportmöglichkeit (CSV/Excel) für Einlösung vor Ort
- [ ] Manuelle Korrektur/Override für Sonderfälle (optional, aber hilfreich)

### 2.6 Test / Go-Live Vorbereitung (P1)

- [ ] Testnutzer-Szenarien durchspielen (inkl. Grenzfälle zum Zeitraum)
- [ ] Zeitfenster-Test: Aktionen kurz vor Mitternacht
- [ ] Missbrauchs-/Dubletten-Checks testen
- [ ] Go-Live-Checkliste erstellen (Aktivierung, Monitoring, Ansprechpartner)

### 2.7 Offene Fragen (für gemeinsames Refinement)

- [ ] Soll "5 von 8 Tagen einloggen" den 14.03. und 22.03. vollständig mitzählen?
- [ ] Zählt nur App-Login oder auch Web-Session-Aktivität?
- [ ] Wie wird Einladung einem Nutzer eindeutig zugeordnet (Code/Link/Referral)?
- [ ] Gibt es ein Limit für gewonnene Kugeln (pro Person genau 1 vermutlich)?

## 3) RadEvent-Page fertigstellen (größter Block)

Hinweis: Hier sind viele Punkte noch in Refinement. Ziel ist ein umsetzbarer Backlog in Phasen.

### 3.1 Phase A: Anmeldung & Interessensbekundung (P1)

#### Fachlogik

- [ ] Anmeldefluss trennen: `Interesse am Radtrikot` statt Sofort-Kauf
- [ ] Datenmodell für Trikot-Interesse definieren (Größe, Menge, Kontakt, Status)
- [ ] Schwellenwert definieren: ab wann "genug Interesse" erreicht ist
- [ ] Statusmodell definieren (`interessiert`, `angeschrieben`, `bestellt`, `bezahlt`, ...)

#### UI / Portal

- [ ] Registrierung/Anmeldung für RadEvent überarbeiten (ohne direkten Trikot-Kauf)
- [ ] Hinweistext im Formular anpassen (Interesse wird gesammelt, spätere Kontaktaufnahme)
- [ ] Nutzer-Portal starten: eigene Anmeldung(en) sehen
- [ ] Bearbeiten/Stornieren (mindestens solange noch nicht bestätigt/bezahlt)

#### Kommunikation

- [ ] Automatische Registrierungs-Mail erstellen (Bestätigung + nächster Schritt)
- [ ] E-Mail-Texte für "genug Trikot-Interesse vorhanden" vorbereiten
- [ ] Zahlungsaufforderungs-Mail-Konzept definieren

### 3.2 Phase B: Zahlung & Bestätigung (P1/P2)

- [ ] Zahlungsprozess festlegen (manuell, PayPal-Mail-Auswertung, später API-Integration)
- [ ] Minimale erste Version definieren (empfohlen: manuelle Bestätigung + Admin-Tool)
- [ ] Felder für Zahlungsstatus ergänzen (`offen`, `angefordert`, `eingegangen`, `bestätigt`)
- [ ] Automatische Registrierungs-/Zahlungsmail mit klarer Referenz-ID
- [ ] Admin-Ansicht zur Zahlungsprüfung

#### PayPal-Idee (später / experimentell)

- [ ] Technische Machbarkeit prüfen: E-Mail-Postfach anbinden
- [ ] Datenschutz/Sicherheit prüfen (Zugriff auf Mailbox)
- [ ] Regex-Regeln für PayPal-Mails definieren und testen
- [ ] Matching-Regel gegen Registrierung (Name, Betrag, Referenz)
- [ ] Fallback bei Fehlmatch: manuelle Prüfung

### 3.3 Phase C: Strecken, Startgruppen, Event-Logik (P1/P2)

- [ ] Streckenmodell definieren (Name, Länge, Route, checkpoints)
- [ ] Startgruppenmodell definieren (Slots/Kapazitäten/Startzeiten)
- [ ] UI für Auswahl von Strecke + Startgruppe
- [ ] Validierung bei ausgebuchten Startgruppen
- [ ] Admin-Verwaltung für Strecken und Gruppen

### 3.4 Phase D: Event-Karte & Fortschritt (P2)

- [ ] Kartenkonzept definieren (welche Datenpunkte werden angezeigt?)
- [ ] Fortschrittsanzeige pro Starter: besuchte Eisdielen / Checkpoints
- [ ] Datenmodell für Checkpoint-Besuche
- [ ] Live-/Near-Live Aktualisierung entscheiden (Polling vs. manuell reload)
- [ ] Datenschutzsicht prüfen (wer sieht welchen Fortschritt?)

### 3.5 Phase E: QR-Codes & Vor-Ort-Checkin (P2/P3)

- [ ] QR-Code-Konzept definieren (pro Checkpoint? pro Starter? signiert?)
- [ ] Scan-Flow definieren (wer scannt: Teilnehmer selbst oder Helfer/Admin?)
- [ ] Verknüpfung mit Vor-Ort-Checkin umsetzen
- [ ] Missbrauchsschutz (QR weitergeben, Mehrfachscan, Replay) berücksichtigen
- [ ] Offline-/schlechtes Netz-Szenario bedenken

### 3.6 Nutzer-Portal (übergreifend) (P1/P2)

- [ ] "Meine RadEvent-Anmeldungen" Seite anlegen/erweitern
- [ ] Statusübersicht: Anmeldung, Zahlung, Strecke, Startgruppe, Trikot-Interesse
- [ ] E-Mail-Historie / letzte Benachrichtigung (optional)
- [ ] Download/Anzeige wichtiger Infos (Startzeit, Treffpunkt, QR-Code) später ergänzen

### 3.7 Admin-Portal (übergreifend) (P1/P2)

- [ ] Teilnehmerliste mit Filtern (Status, Strecke, Startgruppe, bezahlt)
- [ ] Einzelansicht / Detailansicht pro Teilnehmer
- [ ] Manuelle Statusänderungen protokollieren
- [ ] Exporte für Orga-Team (Check-in Liste, Startgruppen, Zahlstatus)

### 3.8 Test / Qualität / Betrieb (P1)

- [ ] End-to-End Testfälle definieren (Anmeldung -> Mail -> Zahlung -> Bestätigung)
- [ ] Fehlerfälle definieren (doppelte Anmeldung, falscher Betrag, ausgebuchte Gruppe)
- [ ] Logging / Audit-Infos für Admin-Aktionen
- [ ] Datenschutz / DSGVO-Prüfpunkte sammeln (Personendaten, Mailbox-Verarbeitung)

### 3.9 Offene Refinement-Fragen (P1)

- [ ] Welche Features müssen für die erste veröffentlichbare Version zwingend drin sein?
- [ ] Was ist "manuell okay" für v1 und was muss automatisiert werden?
- [ ] Gibt es einen festen Termin für das RadEvent (für Deadlines rückwärts planen)?
- [ ] Welche Zahlungsmethoden sollen kurzfristig vs. langfristig unterstützt werden?

## Nächste gemeinsame Arbeitsschritte (Vorschlag)

- [ ] Zuerst Block 1.1 + 1.3 (Foto-Challenges Funktions- und Fehlersicherheitscheck) gemeinsam durchgehen
- [ ] Danach Geburtstagsaktion-Regeln finalisieren (Block 2.1 + 2.2 + 2.7)
- [ ] Anschließend RadEvent v1 Scope festziehen (Block 3.1, 3.2, 3.9)

## Änderungslog (dieses Dokuments)

- `26.02.2026`: Erstfassung erstellt (Backlog + offene Fragen + Priorisierung)
