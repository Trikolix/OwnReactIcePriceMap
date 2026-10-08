# Onboarding, Installation, Einladungen und Push

Die Integration übernimmt die betreffenden Funktionen aus `origin/feature/price-history-ranking-refactor` in die vorhandenen Dialoge, Navigation und Profilseiten. Check-in-Sharing verwendet weiterhin den aktuellen Share-Composer.

## Bedienung

- Dashboard und eigenes Profil zeigen die Startklar- und Experten-Checkliste. Einklappen gilt für das jeweilige Gerät; Ausblenden wird im Konto gespeichert. Über die Profileinstellungen oder „Dein Ice-App Einstieg“ im Menü lässt sie sich wieder anzeigen.
- In den Profileinstellungen wird die Checklisten-Sichtbarkeit erst mit „Onboarding speichern“ übernommen. Benachrichtigungseinstellungen werden separat gespeichert. Das Ausblenden direkt an der Checkliste bleibt eine unmittelbare Aktion.
- Bei aktivierter Einstellung „Startklar- und Experten-Checkliste anzeigen“ ist der Ice-App Einstieg standardmäßig als schwebender Button angepinnt. Er bleibt auf allen Seiten erreichbar und öffnet das aktuelle, noch nicht ausgezeichnete Kapitel. Im Kapitel oder an der kompakten Checkliste lässt er sich lösen und über die Pinnadel wieder anpinnen. Bewusstes Loslösen bleibt je Konto auf diesem Gerät gespeichert.
- Der Button lässt sich mit Maus oder Touch frei verschieben. Mit den Pfeiltasten verschiebt er sich um 10 Pixel, mit Umschalt um 40 Pixel; Pos1 setzt die Position zurück. Ziehen öffnet keinen Dialog. Anpinnen und Position werden je Konto auf diesem Gerät gespeichert; bei einer kleineren Bildschirmgröße bleibt der Button erreichbar.
- Neue erledigte Aufgaben und Kapitelabschlüsse erscheinen als Hinweis innerhalb der App. Der Fortschrittsring und ein ungelesener Punkt am Button ergänzen den Hinweis. Bereits bekannte Fortschritte werden nicht erneut angekündigt; beim erstmaligen Laden erscheint keine Meldung für alte Aufgaben. Ausblenden der Checkliste blendet auch den Button und die Hinweise aus.
- „Ice-App installieren“ nutzt den Installationsdialog des Browsers, soweit verfügbar. Sonst erscheinen passende Hinweise für Safari auf iOS bzw. Chrome/Edge. Erst `appinstalled`, Standalone-Anzeige oder die native App melden eine abgeschlossene Installation.
- Der Einladungsdialog im Profil und in der Checkliste bietet Teilen und Kopieren sowie die Anzahl bestätigter und ausstehender Einladungen. Abbrechen zählt nicht als geteilte Einladung.
- Die Profileinstellungen zeigen den Push-Status dieses Geräts und die aktivierten Browser. Verbindung erneuern, einzelnes Gerät abmelden und alle Browser abmelden sind getrennte Aktionen. Test-Push bleibt ausschließlich für den bisherigen Administrator verfügbar.

## Backend und Datenbank

Die vorhandene automatische Schema-Erweiterung legt beim ersten Aufruf die Einstellung `user_notification_settings.show_onboarding_checklist` (Standard: 1) sowie `user_onboarding_progress` mit `app_installed_at` und `invite_shared_at` an. Es ist keine manuelle SQL-Migration erforderlich; der DB-Nutzer benötigt wie bei den bestehenden Schema-Erweiterungen CREATE/ALTER-Rechte.

Einstellungen werden ausdrücklich per `UPDATE ... WHERE user_id` gespeichert; ein `UNIQUE`-Index auf `user_id` wird nicht vorausgesetzt. Schreibzugriffe werden über die Nutzerzeile serialisiert. Bei bereits vorhandenen doppelten Einstellungszeilen werden die übergebenen Felder in allen Zeilen aktualisiert, ohne weitere Zeilen anzulegen oder andere Einstellungen zu überschreiben. Die Leser verwenden die erste Zeile nach ID; der Push-Abruf vermeidet dadurch doppelte Zustellungen durch doppelte Einstellungszeilen.

`ensureOnboardingSchema()` ergänzt den Award-Code `onboarding` mit zwei Stufen (50 und 100 EP). ID 77 wird nur verwendet, wenn sie frei ist; vorhandene Awards werden nicht überschrieben. Bereits vorhandene Onboarding-Stufen werden nicht verändert. Das neue Icon liegt unter `backend/assets/onboarding-award.svg` und muss mit dem Backend ausgeliefert werden.

`GET /api/onboarding.php` liest ausschließlich den Fortschritt des angemeldeten Nutzers. `POST /api/onboarding.php` akzeptiert nur `app_installed` und `invite_shared`: Diese Geräteaktionen sind zwangsläufig Meldungen des Clients. Alle übrigen Voraussetzungen werden aus Kontodaten, aktiven Push-Geräten und Aktivitäten ermittelt. Neue Eisdielen zählen nur mit `place_type=ice_shop` und einem zugehörigen Eisdielen-Check-in; Likes müssen auf bestehende fremde Beiträge zeigen.

`POST /api/claim_onboarding_award.php` mit `level: 1` bzw. `level: 2` prüft die Voraussetzungen erneut auf dem Server. Eine Transaktion mit Nutzersperre verhindert doppelte Awards bei gleichzeitigen Anfragen. Vergabe und Anzeige nutzen die vorhandenen Award-Popups und EP-Berechnung.

## Gemeinsamer Quest-Einstieg

`OnboardingProvider` hält den Fortschritt einmal für die gesamte App. Erfolgreiche relevante Schreibzugriffe, Check-ins, Push-/Profiländerungen, Rückkehr zur App und das Teilen einer Einladung aktualisieren ihn. Solange der Einstieg angepinnt und die Seite sichtbar ist, fragt er zusätzlich alle 30 Sekunden nach Fortschritten, die anderswo entstanden sind. Ein Kontowechsel verwirft die Anzeige des vorherigen Kontos.

`features/onboarding/quest.js` übersetzt die bestehenden API-Daten in eine Quest mit `id`, `title` und `chapters`. Ein Kapitel enthält `id`, `title`, `reward`, `awarded` und `tasks`; Aufgaben enthalten `id`, `title` und `complete`. `FloatingQuestButton`, `QuestProgressNotice`, `useQuestProgress` und die Fortschrittsfunktionen unter `features/quests` hängen ausschließlich von diesem allgemeinen Modell ab und können für weitere Questreihen verwendet werden. Aktionen, Aufgabenbeschreibungen und die Anbindung an die API bleiben beim Onboarding. Für den schwebenden Einstieg ist keine zusätzliche Backend-Migration erforderlich.

## Push-Verhalten

Die Anmeldung beim App-Start repariert Push nur bei erteilter Browserberechtigung und aktivierter Kontoeinstellung. Ein lokal oder aus einem anderen Browser abgemeldetes Gerät bleibt abgemeldet. Erneute Anmeldung erfordert die ausdrückliche Aktivierung; das Speichern anderer Profileinstellungen aktiviert kein Gerät.

Web-Push-Konfiguration wird in CacheStorage und IndexedDB gespeichert. Der Worker verwendet die neuere Kopie einschließlich leerer Tokens nach Abmeldung. `pushsubscriptionchange` erneuert ausschließlich ein bestehendes aktives Gerät anhand seines bisherigen Tokens, ohne einen Login-Token im Worker zu speichern. Geräte-ID und Zustellungstoken bleiben bei einer Erneuerung erhalten. Bei einem Kontowechsel wird das Zustellungstoken ersetzt.

Ausstehende Zustellungen lassen sich nach zwei Minuten erneut abrufen, solange keine Anzeige bestätigt wurde. Nach 14 Tagen verfallen sie für diesen Abruf. Der Worker zeigt bei nicht erreichbarer Zustellungs-API eine allgemeine Benachrichtigung. Bestehende Filter für zurückgezogene Systemmeldungen, stille Aktualisierungen und Android-Fehler bleiben erhalten.

Push-Avatare verwenden `ICEAPP_ASSET_BASE_URL` (Standard `https://ice-app.de/`); bei einem getrennten Asset-Host muss diese Backend-Variable auf denselben Ursprung wie `VITE_ASSET_BASE_URL` zeigen. Die bestehende VAPID-/FCM-Konfiguration bleibt erforderlich.

## Lokale Prüfungen

```sh
php tests/php/onboarding_rules_test.php
node --test tests/unit/pushNotifications.test.cjs tests/unit/checkinShare.test.cjs tests/unit/quests.test.mjs
node tests/manual/onboarding-browser.cjs
node tests/manual/header-browser.cjs
node node_modules/vite/bin/vite.js build
```

Die Browserprüfungen benötigen Chrome (`CHROME_BIN` kann den Pfad setzen) und mocken sämtliche API-Aufrufe. Berichte und Screenshots landen unter `build/onboarding-browser`. Der Onboarding-Test prüft vier Bildschirmbreiten sowie echtes Ziehen mit Maus/Touch, Tastaturbedienung, Fokus im Kapitel, Navigation, Neuladen, Fortschrittshinweise und den Wechsel zum nächsten Kapitel. Vite-Build und Browserprüfung nacheinander ausführen, weil beide das Verzeichnis `build` verwenden.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/php/run-onboarding.ps1
```

Der Integrationstest startet temporäre MySQL-/PHP-Container ohne externes Netzwerk, ersetzt die Datenbankverbindung durch eine Test-Fixture und räumt die Container wieder auf. Optional lässt sich mit `-PhpImage` ein bereits vorhandenes PHP-8.3-Image angeben; das Standard-Image benötigt `pdo_mysql`. Produktionsdaten werden nicht verwendet. Android-Push und iOS-Installation benötigen ergänzend eine Prüfung auf einem echten Gerät.
