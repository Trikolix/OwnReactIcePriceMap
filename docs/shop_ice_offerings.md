# Eisangebot und gemeinsame Shopansichten

Vor dem Deployment die wiederholbare Migration `backend/Database/migrations/2026-10-07_shop_ice_offerings.sql` zuerst auf Entwicklung/Staging und anschließend auf Produktion ausführen. Die vorhandene Betreiber-Pilotmigration ist Voraussetzung für verifizierte Betreiberzuordnungen. Danach Backend und Frontend gemeinsam bereitstellen. Vorhandene Preise, Scores und Check-ins bleiben erhalten; es gibt keinen Backfill und keinen neuen Cronjob.

## Ermittlung

Beide Detailantworten ergänzen `eisdiele.ice_offerings` für `kugel`, `softeis` und `eisbecher`. Jede Eisart enthält `state` (`offered`, `not_offered`, `unknown`), `source`, `checkin_count`, Stimmzahlen, `my_state`, `operator_state` und `discrepancy`. Eigene Meldungen werden anhand der authentifizierten Sitzung ermittelt, nicht anhand einer übergebenen Nutzer-ID.

Aktive verifizierte Betreiberangaben haben Vorrang. Danach zählen Adminfreigaben, sonst zwei übereinstimmende aktive Nutzerstimmen ohne Gegenstimme. Widersprüche bleiben unbekannt. Ab zehn Check-ins von vier verschiedenen Nutzern wird eine Eisart ohne jemals gemeldeten Check-in, positiven Preis oder ausdrücklichen positiven Angebotshinweis als vermutlich nicht angeboten eingestuft. Es gibt kein Zeitfenster oder Ablaufdatum. Ein neuer Gegenbeleg öffnet eine automatische oder ältere Community-/Admin-Abwesenheitsangabe wieder; gegenüber Betreiberangaben entsteht stattdessen ein Korrekturhinweis. Widerrufene Betreiberzuordnungen verlieren ihren Vorrang.

Die Hauptbewertung folgt der meistbesuchten nicht ausgeschlossenen Eisart; Gleichstand: Kugel, Softeis, Eisbecher. Fehlende Bewertungen werden nicht durch Werte anderer Eisarten ersetzt. Preis und Hauptbewertung gehören derselben Eisart; Eisbecher erhalten keinen erfundenen Einheitspreis. Historische Daten werden auch beim Ausblenden nicht gelöscht.

## Bedienung und Schnittstellen

- Beide Shopansichten: „Preise & Bewertungen“ → „Angebot korrigieren“. „Keine Angabe“ nimmt die eigene Meldung zurück. Ausgeblendete Arten und deren Begründung stehen unter „Weitere Eisarten“.
- Betreiber: „Verwaltung & Statistik“ → „Eisdielendaten“ → „Unser Eisangebot“. Angaben werden innerhalb der bestehenden Geschäftsdatentransaktion gespeichert und protokolliert. Alte Clients ohne `ice_offerings` verändern das Angebot nicht.
- Administration: „Angebot korrigieren“ übernimmt Angaben des authentifizierten Admins direkt als freigegeben, ohne zweite Bestätigung. Entgegenstehende frühere Freigaben derselben Eisart werden abgelehnt; aktive Betreiberangaben behalten ihren Vorrang. „Keine Angabe“ zieht die eigene Adminangabe zurück.
- Bestehende Shopänderungsansicht → „Eisangebot aus der Community“. Freigabe/Ablehnung bezieht sich auf die aktuelle Version einer Meldung; eine zwischenzeitlich geänderte Meldung liefert HTTP 409. Auch hier ersetzt eine Freigabe ältere widersprechende Freigaben.
- Der Menüpunkt „Änderungsvorschläge“ zeigt die Summe offener Shopänderungen und Angebotsmeldungen. Der Zähler aktualisiert sich nach Entscheidungen, beim Öffnen des Menüs, bei Rückkehr in das Fenster und minütlich im sichtbaren Tab. Bei null entfällt der Indikator; über 99 erscheint „99+“, mit der vollständigen Zahl für Screenreader.
- `shop_ice_offerings.php?action=report`: authentifizierter JSON-POST mit `shop_id` und `states`, einer Zuordnung von Eisart zu Zustand. Eine Stimme je Nutzer/Shop/Eisart; Community-Änderungen setzen eine frühere Adminentscheidung zurück. Adminangaben werden direkt freigegeben. Die Rolle stammt ausschließlich aus der authentifizierten Identität.
- `admin/get_shop_change_request_count.php`: authentifizierter Admin-GET; `pending_count` zählt beide offenen Warteschlangen ohne Seitenlimit, `shop_changes` und `ice_offerings` liefern die Einzelzahlen. Fehlende Tabellen während des Rollouts zählen als null.
- `action=list`: authentifizierter Admin-GET mit `status` (`pending`, `approved`, `rejected`, `withdrawn`, `all`). Bis 100 aktuelle Meldungen; nach Entscheidungen werden die nächsten offenen Meldungen nachgeladen.
- `action=review`: authentifizierter Admin-JSON-POST mit `report_id`, `updated_at` und `decision` (`approve`, `reject`). Nutzeridentität und Adminrecht stammen ausschließlich aus der Sitzung.

Fehlende Angebotstabellen verhindern öffentliche Shop-Lesezugriffe während des Rollouts nicht. Schreibzugriffe benötigen die Migration. Check-in-Eisarten werden durch Angebotszustände nicht eingeschränkt.

## Prüfung

```powershell
node tests/unit/shopOfferings.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File tests/php/run-shop-offerings.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tests/php/run-loyalty.ps1
node tests/manual/shop-detail-browser.cjs --screenshots
node tests/manual/header-browser.cjs --all --screenshots
node tests/manual/loyalty-browser.cjs
npm.cmd exec -- vite build --outDir build/shop-offerings
```

PHP/MySQL-Tests laufen in temporären Containern ohne externes Netzwerk und ohne Produktivdaten. Browserfixtures verwenden die echten Komponenten, simulieren APIs und blockieren externe Anfragen. Screenshots und Berichte liegen unter `build/shop-detail-browser/`.
