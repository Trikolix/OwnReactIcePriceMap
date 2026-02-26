# Fotochallenge Workflow v2 (Einreichphase -> Admin-Planung -> Voting)

Stand: 26.02.2026

Ziel: Fotochallenge so strukturieren, dass die Einreichphase flexibel bleibt (Nutzer können bis Deadline ändern), der Admin erst nach Einreichschluss die Turnierstruktur festlegt und danach das Voting stabil startet.

## Kurzfazit

Der vorgeschlagene Workflow ist sinnvoll und verbessert Planungssicherheit, Fairness und Bedienbarkeit.

Wesentliche Verbesserung gegenüber dem aktuellen Stand:

- Turnierstruktur wird **nach realer Anzahl der Einsendungen** geplant
- Nutzer können ihre Auswahl bis Deadline anpassen
- Admin hat eine eigene Planungsphase (Auswahl + Gruppen/Lucky-Loser + Zeitplan)
- Start der Gruppenphase wird an einen Finalisierungsschritt gekoppelt

## Ziel-Workflow (fachlich)

1. Admin erstellt Challenge mit:
   - Titel/Beschreibung
   - Start-/Enddatum der Einreichphase
   - Einreichlimit pro Nutzer
2. Status `submission_open`:
   - Nutzer reichen Bilder ein
   - Nutzer dürfen bis Deadline ihre Auswahl ändern (hinzufügen/entfernen/titel anpassen)
3. Nach Ende der Einreichphase:
   - Keine Nutzeränderungen mehr
   - Admin sieht alle Einsendungen und entscheidet, welche Bilder teilnehmen
   - Admin legt Gruppenanzahl, Advancers, Lucky Loser, KO-Größe und Terminplan fest
4. Admin finalisiert und startet Gruppenphase
5. Voting läuft (Gruppenphase -> KO) wie bisher

## Empfohlenes Statusmodell (Challenge)

Challenge-Status (`photo_challenges.status`):

- `draft`
- `submission_open`
- `submission_closed` (neu)
- `group_running`
- `ko_running`
- `finished`

Optional später:

- `cancelled`

Hinweis:
- Das bisherige `active` ist fachlich unscharf und sollte mittelfristig nicht mehr aktiv verwendet werden.

## Status-Übergänge (State Machine)

- `draft -> submission_open`
  - Admin startet Einreichphase
  - Voraussetzung: Titel vorhanden, Einreichungsdeadline gesetzt

- `submission_open -> submission_closed`
  - automatisch bei Deadline-Ablauf (empfohlen: serverseitig "effektiv" behandeln)
  - optional zusätzlich manueller Admin-Button "Einreichphase schließen"

- `submission_closed -> group_running`
  - Admin hat Teilnehmerbilder ausgewählt
  - Admin hat Gruppen-/KO-Parameter gesetzt
  - Admin hat Zeitplan gespeichert
  - Validierung erfolgreich
  - Admin klickt "Gruppenphase starten"

- `group_running -> ko_running`
  - Admin startet KO-Phase (wie bisher)

- `ko_running -> finished`
  - Nach Finale / letzter KO-Runde

## Zentrale Regeln pro Phase

### `draft`

- Admin darf Challenge-Daten ändern
- Admin darf Bilder manuell hinzufügen/entfernen (optional)
- Nutzer sehen Challenge optional noch nicht öffentlich

### `submission_open`

- Nutzer dürfen eigene Einsendungen verwalten (bis Deadline)
- Admin darf Einsendungen sehen, aber **noch keine finale Turnierstruktur starten**
- Empfohlen: Admin-Review (approve/reject) erst nach Einreichschluss nutzen, damit Nutzeränderungen nicht mit Review kollidieren

### `submission_closed`

- Nutzer: nur lesen, keine Änderungen mehr
- Admin:
  - Einsendungen sichten
  - Bilder zulassen/ablehnen
  - Teilnehmerfeld finalisieren
  - Gruppen/Lucky-Loser/KO konfigurieren
  - Zeitplan setzen

### `group_running` / `ko_running`

- Teilnehmerfeld und Turnierstruktur sind eingefroren
- Keine nachträgliche Änderung des Bildpools
- Voting aktiv entsprechend Phase

## Nutzer-Workflow in der Einreichphase (wichtig für UX)

Bis zum Ende der Einreichphase soll der Nutzer seine Auswahl ändern können.

Empfohlene Umsetzung:

- Nutzer kann eigene Einsendungen sehen (`Meine Einreichungen`)
- Pro Einreichung:
  - Titel ändern
  - Entfernen
- Aus Bildergalerie:
  - Neue Bilder einreichen, solange Limit nicht erreicht

Empfohlene Klarstellung im UI:

- "Du kannst deine Einreichungen bis `TT.MM.JJJJ HH:mm` ändern."
- Countdown/Deadline sichtbar
- Nach Deadline: Buttons deaktivieren + Hinweis "Einreichphase beendet"

## Admin-Workflow nach Einreichschluss (Planungsphase)

### Schritt 1: Einsendungen prüfen / Teilnehmerfeld finalisieren

- Übersicht:
  - Gesamtzahl Einsendungen
  - Anzahl Nutzer
  - Einreichungen pro Nutzer
  - Pending/accepted/rejected
- Admin wählt aus:
  - Welche Bilder nehmen teil
  - Welche nicht

Empfohlen:
- "Ausgewählte Bilder" Count live anzeigen
- Warnungen bei problematischer Zahl (z. B. zu wenig Bilder für gewünschte Struktur)

### Schritt 2: Turnierstruktur konfigurieren

Admin legt fest:

- Anzahl Gruppen
- Gruppengröße (oder automatisch aus Auswahl ableiten)
- `group_advancers`
- `lucky_loser_slots`
- KO-Größe (`ko_bracket_size`)

System soll Vorschläge machen:

- sinnvolle Gruppenanzahl basierend auf Auswahl
- passende KO-Größe (nächste Zweierpotenz)
- Warnung bei Überschuss/Unterdeckung

### Schritt 3: Terminplan festlegen

- Gruppen-Slots (Start/Ende)
- KO-Termine (optional zunächst nur Gruppenphase, KO später)

### Schritt 4: Finalisieren + Start Gruppenphase

- Validierung zusammengefasst anzeigen
- Admin bestätigt einmal bewusst
- Danach wird `group_running` gesetzt

## Validierungsregeln (empfohlen, serverseitig)

### Einreichphase

- `submission_deadline` muss gesetzt und > Start sein
- `submission_limit_per_user >= 1`
- Änderungen nur erlaubt, wenn:
  - Status effektiv `submission_open`
  - aktuelle Zeit <= `submission_deadline`
  - Einreichung gehört dem Nutzer

### Planungsphase / Turnierstart

- Challenge muss in `submission_closed` sein
- Es müssen genügend akzeptierte/ausgewählte Bilder vorhanden sein
- Gruppenparameter müssen konsistent sein
- `group_advancers <= group_size`
- `lucky_loser_slots >= 0`
- KO-Teilnehmerzahl muss zur KO-Struktur passen (oder System füllt sauber auf)
- Zeitplan vollständig und gültig

## Technische Umsetzung (empfohlene Minimalvariante v1)

### 1. Effektive Einreichphase serverseitig auswerten

Auch wenn `status = submission_open`, gilt die Phase als geschlossen, sobald Deadline überschritten ist.

Vorteil:
- Kein Cronjob nötig
- Keine "vergessene" Statusumstellung blockiert den Ablauf

Zusätzlich kann ein Admin-Button die Challenge explizit auf `submission_closed` setzen.

### 2. Nutzeränderungen an Einreichungen ermöglichen

Minimal:

- neuer Endpoint: `photo_challenge/delete_submission.php`
  - löscht eigene Einreichung nur in `submission_open` und vor Deadline
  - nur wenn Status der Einreichung `pending`

Optional/sauberer:

- `withdrawn`-Status statt Hard Delete

### 3. Admin-Planung nach Einreichschluss

Minimal:

- bestehende Admin-Seite (`src/pages/PhotoChallengeAdmin.jsx`) erweitern um Abschnitt:
  - "Einreichphase abgeschlossen / Planung"
  - Auswahl-Count
  - Strukturparameter
  - Terminplan
  - Finalisieren/Start

### 4. Start Gruppenphase härter absichern

`start_group_phase.php` sollte nur noch erlauben:

- `submission_closed` (nicht mehr direkt aus `submission_open`)
- und nur bei erfolgreicher Gesamtvalidierung

## Betroffene Bereiche (Code / Endpunkte)

### Backend (direkt betroffen)

- `backend/photo_challenge/create_challenge.php`
  - Statuswerte validieren (`submission_closed` ergänzen)
  - Einreichdaten Pflichtfelder sauber prüfen

- `backend/photo_challenge/submit_image.php`
  - bereits vorhanden, erweitern für "effektive Deadline" / ggf. Updatestrategie

- `backend/photo_challenge/list_submissions.php`
  - Admin-Planungsdaten / Filter verbessern (optional)

- `backend/photo_challenge/review_submission.php`
  - empfohlen: nur in `submission_closed` für finale Auswahl zulassen

- `backend/photo_challenge/start_group_phase.php`
  - Statusvoraussetzung auf `submission_closed` ändern
  - Validierungen verschärfen

- `backend/photo_challenge/get_challenge_overview.php`
  - Response um Flags ergänzen:
    - `submission_is_open_effective`
    - `submission_is_editable_for_user`
    - ggf. `admin_planning_required`

- `backend/photo_challenge/helpers.php`
  - Statuskonstanten/Helper ergänzen (empfohlen)
  - ggf. Helper für effektive Phase (Deadline-Logik)

### Backend (neue Endpunkte empfohlen)

- `backend/photo_challenge/delete_submission.php` (v1 minimal)
- optional `backend/photo_challenge/update_submission.php` (Titeländerung, wenn nicht über Resubmit gelöst)
- optional `backend/photo_challenge/close_submission_phase.php` (expliziter Admin-Schritt)

### Frontend (direkt betroffen)

- `src/pages/PhotoChallengeVoting/SubmissionPanel.jsx`
  - "Meine Einreichungen" editierbar machen (Entfernen / Titel ändern)
  - Deadline-Hinweise / Lock nach Ablauf

- `src/pages/PhotoChallengeVoting/index.jsx`
  - Submission-Phase-Anzeige nicht nur an `status === submission_open`, sondern effektive Flags aus API berücksichtigen

- `src/pages/PhotoChallengeAdmin.jsx`
  - Planungs-Workflow in Phasen darstellen:
    - Einreichungen prüfen
    - Teilnehmerfeld finalisieren
    - Struktur konfigurieren
    - Zeitplan
    - Gruppenphase starten

- `src/pages/PhotoChallengeList.jsx`
  - Statuslabel für `submission_closed` ergänzen (z. B. "Planung läuft")

## UX-Verbesserungen (empfohlen)

- Admin-Wizard statt "alles auf einer Seite" (weniger Fehler)
- Vor Start Gruppenphase ein Validierungs-Summary:
  - "X Bilder ausgewählt"
  - "Y Gruppen"
  - "Z direkte Qualifikanten + N Lucky Loser"
  - "KO mit K Teilnehmern"
- Nutzerseite mit klaren Deadlines + Änderbarkeit-Status
- Sperrhinweise statt generischer Fehlermeldungen

## Offene Entscheidungen (bitte gemeinsam festlegen)

- Sollen Nutzer mehrere Bilder im finalen Turnier haben dürfen?
- Soll Admin schon während `submission_open` moderieren dürfen oder erst in `submission_closed`?
- Hard Delete vs. `withdrawn`-Status bei Nutzer-Änderungen?
- Wird `submission_closed` automatisch gesetzt oder nur "effektiv" aus Deadline abgeleitet + optional manuell persistiert?
- Müssen KO-Termine schon vor `group_running` vollständig geplant sein?

## Empfohlene Umsetzungsreihenfolge (technisch)

1. Statusmodell + effektive Deadline-Logik einführen
2. Nutzer-Einreichungen löschbar/änderbar machen
3. Admin-Status `submission_closed` + Startbedingungen für Gruppenphase anpassen
4. Admin-Planungs-UX in `PhotoChallengeAdmin` verbessern
5. Validierungs-Summary + Finalisieren-Flow

