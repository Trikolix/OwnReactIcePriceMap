# Vollbildansicht eines Eis-Orts

Die Seite /shop/:shopId startet mit einer kompakten Übersicht: Name, Adresse, Öffnungsstatus, gemeldeter Preis, Community-Wertung und Check-in-Anzahl. Check-in, Navigation, Eis-Date, Favorit und Teilen bleiben erreichbar. Kundenkartenprogramme erscheinen direkt in der Übersicht; Bearbeitung und Betreiberzugang stehen unter „Angaben verbessern & Betreiberzugang“.

## Bereiche und Bedienung

- Übersicht, Beiträge, Fotos, Routen und Statistik sind beschriftete Tabs. Restaurant/Café und temporäre Stände erhalten keine Eisdielenbewertungen oder Routenverwaltung.
- Die Tab-Leiste bleibt beim Scrollen erreichbar. Ein Bereichswechsel aus einem langen Beitragsteil zeigt den neuen Inhalt direkt unter der Leiste. Tastatur: Pfeile, Pos1 und Ende; native Details öffnen mit Enter.
- Beiträge und Routen zeigen direkt die bestehenden Check-in-, Bewertungs- und Routen-Cards einschließlich Likes, Kommentaren und Bearbeitung. Das eigene Design der gemeinsamen Cards bleibt erhalten. Pro Kategorie sind zunächst zwölf Einträge sichtbar, weitere werden ausdrücklich eingeblendet.
- tab=checkins|reviews|photos|routes sowie focusCheckin, focusReview, focusRoute, focusComment und openCheckin bleiben unterstützt. Verlinkte Beiträge werden auch außerhalb der ersten zwölf Einträge sichtbar; ihre Kommentare öffnen automatisch. Ein manueller Bereichswechsel entfernt den vorübergehenden Beitragsfokus.
- Die Fotogalerie besitzt eine Dialogansicht mit Fokusführung, Escape, Pfeiltasten, beschrifteten Buttons und Rückkehr zum Auslöser. Fehlende Bilder erhalten eine Rückmeldung. Ohne Fotos wird kein Medienplatz reserviert.
- Öffnungszeiten zeigen zunächst den heutigen Tag, die Woche lässt sich aufklappen. Fehlende Zeiten werden als unbekannt angezeigt. Saisonpause, dauerhaft geschlossene Orte und beendete Stände bleiben eindeutig.
- Aktualisieren behält vorhandene Inhalte. Fehler bieten einen erneuten Versuch; neue oder veraltete Requests werden abgebrochen, nach zwanzig Sekunden erscheint eine Rückmeldung.
- Teilen verwendet den BrowserRouter-Link /shop/:id, den nativen Share-Dialog oder die Zwischenablage. Bei Fehlern bleibt der Link manuell kopierbar.
- Preisverlauf und Verteilungen stehen im Statistikbereich. Preise tragen ihre Währung; bei unterschiedlichen Währungen wird ausschließlich die beschriftete Tabelle gezeigt. Unbekannte frühere Preise bleiben unbekannt.

Die bestehenden APIs bleiben erhalten. „Weitere anzeigen“ bezieht sich auf die vom Detailendpunkt gelieferten Einträge; die Fotogalerie des Endpunkts liefert derzeit höchstens zwanzig Fotos.

## Prüfung

Aufruf: node tests/manual/shop-detail-browser.cjs --screenshots

Der Test baut die echten Komponenten mit isolierten API-Antworten und blockiert externe Netzwerkaufrufe. Chrome wird mit einem eigenen temporären Profil gestartet. Prüffälle laufen bei 320, 390, 768 und 1280 Pixeln; zusätzlich werden echte Tastatureingaben für Tabs, Details und Fotodialog geprüft. Berichte und Screenshots entstehen unter build/shop-detail-browser/.

Abgedeckt: lange Namen/Texte, fehlende Daten und Bilder, Beiträge nachladen, Direktlinks zu älteren Beiträgen und Kommentaren, Browser-Zurück, initiale und spätere Ladefehler, geteilte Links, gültige Null-Koordinaten, unterschiedliche Ortstypen, Kundenkarten- und Betreiberzugang sowie Preiswährungen.

Produktionsbuild: npm.cmd run build -- --outDir build/shop-detail-release

Die Browserprüfung verwendet Testdaten; ein Zugriff auf die produktive Datenbank oder ein echter Check-in ist nicht erforderlich.
