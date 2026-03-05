# Plan: Event-2026 Plattform (Account-Pflicht, Einladung, Zahlung, Startwellen, Checkpoints, Live-Karte)

## Kurzfassung
Wir bauen den Event-Flow als Erweiterung der bestehenden Ice-App mit **Account-Pflicht**, **Event-spezifischem Echtnamen**, **Sammelanmeldung + Claim-Invite-Links**, **hybridem Zahlungsprozess** (manuelle Freigabe als Wahrheit, Mail-Scan als Assistenz), **Startwellen-Logik** (Distanz + Selbsteinschätzung, max. 20), **Checkpoint-Pflicht per Check-in/QR** und einer **öffentlichen Live-Karte** mit Namen + Zeiten.  
Strava bleibt **Phase 2 (Nice-to-have)**.

---

## Festgelegte Produktentscheidungen (aus unserem Chat)
1. Zahlungsmodell: **Hybrid (MVP manuell + API-ready Datenmodell)**.
2. Mehrfachanmeldung: **Invite-Links mit Claim**.
3. Startwellen: **Distanz + Selbsteinschätzung**, max. 20 pro Welle.
4. Sichtbarkeit Checkpoints: **Teilnehmernamen öffentlich**.
5. Distanzen initial: **140 km + 90 km**.
6. Namensmodell: **Profilname bleibt**, zusätzlich **Pflicht-Echtname fürs Event**.
7. Frauen-Welle: **Opt-in + Mindestgröße**.
8. Mail-Scan: **als Assistenz-Tool** (nicht vollautomatisch autoritativ).
9. Strava: **Phase 2**.
10. Scope: **End-to-end Implementierung** (Frontend + Backend-Änderungen).

---

## Architektur-Zielbild

### Frontend (dieses Repo)
- `RadEvent` bleibt Landing/Info.
- `EventRegistration` wird auf Event-2026-Domainmodell umgestellt.
- Neue Seiten:
  - `EventMyRegistration` (Status, Zahlung, Claims, Welleninfo, Checkpoint-Status).
  - `EventInviteClaim` (`/#/event-invite/:token`) zum Account-Claim pro Starterplatz.
  - `EventLiveMap` mit Checkpoints, Counts, Detail-Modal.
- `RegisterForm`/`RegisterPage` erweitert um Event-Claim-Kontext (zusätzlich zu bestehendem referral inviteCode).

### Backend (PHP API)
- Neue Event-Module (z. B. `/event2026/*`):
  - Registrierung/Teilnehmerplätze
  - Claim-Tokens
  - Zahlungsstatus + Admin-Freigabe + Mail-Match-Vorschläge
  - Wellenberechnung
  - Event-Checkpoint-Passagen
  - Live-Map Aggregation + Detaildaten

### Datenhaltung
- Event-spezifische Tabellen statt Überladen bestehender Checkin/Invite-Logik.
- Bestehende globale `userManagement/register.php` bleibt, bekommt optional Event-Claim-Integration.

---

## Öffentliche APIs / Interfaces / Typen (neu oder geändert)

### Neue Backend-Endpunkte
1. `POST /event2026/registrations`
- Zweck: Sammelanmeldung erstellen.
- Input:
  - `registered_by_user_id`
  - `team_name?`
  - `participants[]`:
    - `full_name` (Pflicht)
    - `email` (Pflicht)
    - `distance` (`90|140`)
    - `self_estimated_speed_group` (`<24|24-27|27-30|30+`)
    - `women_wave_opt_in` (bool)
  - `payment_method_preference` (`paypal_friends|bank_transfer`)
  - `newsletter_opt_in`
- Output:
  - `registration_id`
  - `payment_reference_code` (`ICE26-R{id}`)
  - `participant_slots[]` inkl. `claim_token_status`

2. `POST /event2026/invites/:token/claim`
- Zweck: Starterplatz an Account binden.
- Input: `user_id`, optional `confirm_full_name`.
- Output: Slot gebunden, Event-Lizenz aktiv.

3. `GET /event2026/me`
- Zweck: Mein Event-Status (Starterplatz, Zahlung, Welle, Checkpoints).
- Output: komplettes Dashboard-Modell.

4. `GET /event2026/live/checkpoints`
- Zweck: Karte Hover-Daten.
- Output je Checkpoint:
  - `checkpoint_id`, `name`, `lat`, `lng`, `checked_in_count`, `licensed_count`.

5. `GET /event2026/live/checkpoints/:id/checkins`
- Zweck: Modal-Detailliste.
- Output:
  - `user_display_name`, `checkin_time`, `source` (`qr|onsite_form`), `distance`.

6. `POST /event2026/checkpoints/pass`
- Zweck: Event-Passage erfassen (QR oder On-site-Checkin-Verknüpfung).
- Input: `user_id`, `checkpoint_id`, `source`, optional `checkin_id`, optional `qr_payload`.
- Regeln: idempotent pro User+Checkpoint+Event.

7. `POST /event2026/payments/manual-confirm` (Admin)
- Zweck: Zahlung final freigeben.

8. `POST /event2026/payments/mail-scan/run` (Cron/Worker intern)
- Zweck: IMAP-Scan, Match-Vorschläge erzeugen.

9. `GET /event2026/payments/match-suggestions` (Admin)
- Zweck: Vorschläge prüfen/bestätigen.

10. `POST /event2026/waves/recompute` (Admin/System)
- Zweck: Wellen neu berechnen.

### Geänderte bestehende Interfaces
1. `POST /userManagement/register.php`
- Erweiterung um optionale Felder:
  - `event_claim_token?`
  - `event_full_name?`
- Verhalten:
  - Nach Registrierung optional automatischer Claim des Event-Slots.

2. `POST /event/submit_registration.php`
- Entweder ersetzen durch `/event2026/registrations` oder intern delegieren.
- Empfehlung: **neu versionieren** (`/event2026/*`), alte Route kompatibel halten.

---

## Datenmodell (DB) – neue Tabellen

1. `event_seasons`
- `id`, `slug` (`event-2026`), `name`, `date`, `status`, `registration_open_from/to`.

2. `event_registrations`
- `id`, `event_id`, `registered_by_user_id`, `team_name`, `total_amount`, `payment_reference_code`, `payment_status` (`pending|partially_paid|paid|cancelled`), timestamps.

3. `event_participant_slots`
- `id`, `registration_id`, `event_id`
- `full_name` (Pflicht)
- `email`
- `distance_km` (`90|140`)
- `speed_group`
- `women_wave_opt_in`
- `claimed_user_id` (nullable)
- `license_status` (`pending_payment|licensed|cancelled`)
- `public_name_consent` (bool, default true für dieses Event, aber explizit abfragen)
- unique constraint: (`event_id`, `claimed_user_id`) optional nur wenn claimed.

4. `event_invite_tokens`
- `id`, `slot_id`, `token_hash`, `expires_at`, `claimed_at`, `revoked_at`.

5. `event_payments`
- `id`, `registration_id`, `method` (`paypal_friends|bank_transfer`), `expected_amount`, `paid_amount`, `status`, `confirmed_by_admin`, timestamps.

6. `event_payment_mail_matches`
- `id`, `payment_id?`, `registration_id?`, `mail_message_id`, `sender`, `subject`, `amount_detected`, `reference_detected`, `confidence`, `status` (`suggested|approved|rejected`), timestamps.

7. `event_waves`
- `id`, `event_id`, `distance_km`, `wave_code`, `start_time`, `capacity` (default 20), `is_women_wave`, `speed_group`.

8. `event_wave_assignments`
- `id`, `slot_id`, `wave_id`, `assigned_at`, unique(`slot_id`).

9. `event_checkpoints`
- `id`, `event_id`, `shop_id`, `name`, `lat`, `lng`, `order_index`, `is_mandatory`.

10. `event_checkpoint_passages`
- `id`, `event_id`, `checkpoint_id`, `slot_id`, `user_id`, `passed_at`, `source`, `checkin_id?`, `qr_code_id?`
- unique(`event_id`,`checkpoint_id`,`slot_id`) für Idempotenz.

11. `event_qr_codes`
- `id`, `event_id`, `checkpoint_id`, `code_hash`, `active_from/to`, `is_active`.

---

## Kern-Workflows

### 1) Registrierung + Lizenzierung
1. Nutzer (eingeloggt) erstellt Registrierung mit 1..n Starterplätzen.
2. System generiert `payment_reference_code` und Zahlungsinstruktion.
3. Zahlung wird manuell bestätigt (MVP); Mail-Scan erzeugt nur Vorschläge.
4. Nach `paid`:
- Slot 1 (registrierender Account) direkt lizenziert, wenn gewünscht.
- Für weitere Slots: Claim-Invite-Link per Mail.
5. Eingeladene erstellen/verwenden Account und claimen Slot.
6. Nach Claim: `license_status=licensed`.

### 2) Invite-Claim
- Link `/#/event-invite/:token`
- Falls nicht eingeloggt: Login/Registrierung, danach Claim fortsetzen.
- Token One-time, serverseitig gehasht, Ablaufdatum (z. B. 30 Tage).

### 3) Startwellen
- Batch-Job oder Trigger bei Statusänderungen.
- Gruppierung zuerst nach `distance`, dann `speed_group`.
- Frauen-Welle:
  - Nur für `women_wave_opt_in=true`.
  - Mindestgröße default: **10** (konfigurierbar).
  - Darunter Rückführung in normale Pace-Wellen.
- Kapazität pro Welle: max. 20.
- Überlauf erzeugt nächste Welle gleicher Kategorie.

### 4) Checkpoint-Pflicht
- Passage möglich über:
  - QR-Scan (neuer Event-Code)
  - Vor-Ort-Checkin über bestehendes Formular (mit Event-Kontext)
- Wenn beides erfolgt: ein Event-Passage-Datensatz (idempotent).
- Freischaltung “Finisher” nur wenn alle `is_mandatory` Checkpoints passiert.

### 5) Live-Karte
- Öffentliche Karte mit Checkpoints und `checked_in_count / licensed_count`.
- Hover: Aggregat.
- Klick: Modal mit Teilnehmername + Uhrzeit + Quelle.
- Paginierung/Limit im Modal (z. B. 100 Einträge pro Seite).

### 6) Zahlung (Bewertung des vorgeschlagenen Workflows)
- Mail-Scan als **Assistenz** ist okay, aber nicht als alleinige Autorität.
- Begründung:
  - Betreff-Parsing ist fehleranfällig (Tippfehler/abweichender Text/Forwarding).
  - Deshalb: Admin-Bestätigung bleibt final.
- Sicheres Referenzformat verpflichtend:
  - `ICE26-R{registration_id}` im Betreff/Verwendungszweck.
- Für “kein PayPal”: `bank_transfer` mit gleichem Referenzcode, manuelle Bestätigung.

---

## Frontend-Umsetzung in diesem Repo (konkret)

1. `src/pages/Event/EventRegistration.jsx`
- Neues Formularschema:
  - pro Teilnehmer: Name, E-Mail, Distanz, Speed, Frauenwelle-Opt-in, Public-Consent.
- Remove/replace alte kostenbezogene Einzelpositionen soweit nicht eventrelevant.
- Submit auf `/event2026/registrations`.
- Success-State mit Zahlungsinstruktion + Referenzcode.

2. Neue Route/Seite: `src/pages/Event/EventInviteClaim.jsx`
- Token aus URL lesen, Status abfragen, Claim ausführen.

3. `src/pages/RegisterPage.jsx` + `src/components/RegisterForm.jsx`
- Optionalen `eventClaimToken` akzeptieren und nach erfolgreicher Registrierung auto-claimen.

4. Neue Route/Seite: `src/pages/Event/EventLiveMap.jsx`
- Leaflet/Map-Komponenten aus bestehendem Map-Stack wiederverwenden.
- Marker-Hover mit Count, Klick-Modal mit Checkinliste.

5. Neue Route/Seite: `src/pages/Event/EventMyRegistration.jsx`
- Zeigt:
  - Zahlungsstatus
  - Claim-Status je Slot
  - Wellenzuweisung
  - Checkpoint-Fortschritt.

6. `src/App.jsx`
- Routen ergänzen:
  - `/event-live`
  - `/event-invite/:token`
  - `/event-me`

---

## Backend-Implementierungsplan (Schritte)

1. DB-Migrationen für alle neuen Tabellen.
2. Service-Layer:
- RegistrationService
- PaymentService
- InviteClaimService
- WaveAssignmentService
- CheckpointService
3. Endpunkte implementieren inkl. Authz (User/Admin).
4. Cron/Worker:
- `mail-scan-run` (IMAP lesen, Regex-Parser, Confidence-Scoring).
5. Admin-Endpunkte:
- Zahlungsvorschläge bestätigen/ablehnen.
- Wellen neu berechnen.
6. Audit-Logging für kritische Actions (payment_confirm, claim, wave_recompute).

---

## Sicherheits-, Datenschutz- und Robustheitsregeln

1. Token nur gehasht speichern.
2. Rate limiting auf Claim- und Live-Detail-Endpunkten.
3. Public Name Anzeige nur bei explizitem Consent (Pflichtfeld im Flow).
4. Idempotenz bei Checkpoint-Passagen.
5. Serverzeit als Wahrheit (`passed_at`), nicht Client-Zeit.
6. Rollenprüfung für Admin-Funktionen (payment confirm, recompute).

---

## Testfälle und Szenarien

### Unit
1. Wellenalgorithmus:
- distanz/speed/frauen-opt-in
- cap=20
- Mindestgröße Frauenwelle.
2. Payment-Reference Parser:
- gültige/ungültige Betreffzeilen.
3. Claim-Token:
- abgelaufen, widerrufen, bereits benutzt.

### Integration
1. Registrierung mit 3 Teilnehmern → payment pending.
2. Manuelle Zahlung bestätigen → Lizenzierung aktiv.
3. Invite-Link claim mit neuem Account.
4. QR- und Checkin-Quelle erzeugen nur eine Passage pro Checkpoint.
5. Live-Map liefert korrekte Aggregate + Details.

### E2E
1. User meldet Team an, bezahlt, verschickt Links, Team claimt Accounts.
2. Teilnehmer sieht Welle + startet + checkt alle Pflicht-Checkpoints ein.
3. Finisher-Status wird erreicht.
4. Öffentliches Karten-Modal zeigt Namen/Zeiten korrekt.

---

## Rollout-Plan

1. Phase A (MVP Core)
- Registrierung, Payment-Manuell, Invite-Claim, Wellenzuweisung, Checkpoint-Passagen.
2. Phase B (Live Experience)
- EventLiveMap + MyRegistration Dashboard.
3. Phase C (Assistenz/Automation)
- Mail-Scan Suggestion Tool + Admin-Review.
4. Phase D (Nice-to-have)
- Strava Segment Challenge (separater Feature-Flag).

---

## Annahmen und gesetzte Defaults

1. Eventdatum: **16. Mai 2026 (voraussichtlich)**.
2. Distanzen initial: **90 km und 140 km**.
3. Frauenwelle Mindestgröße: **10** (konfigurierbar).
4. Wellenkapazität: **20**.
5. Public-Map zeigt Namen + Zeiten, aber nur für eventbezogene Passagen.
6. Mail-Scan ist **nicht** autoritativ; Admin-Freigabe bleibt final.
7. Bestehendes Invite-System der App bleibt erhalten; Event-Invite ist separates, slot-basiertes Token-System.
8. Backend kann neue `/event2026/*` Endpunkte bereitstellen, ohne alte Flows zu brechen.
