# Gemeinsame Aktivitäten-Cards

Alle neun Card-Typen im Dashboard verwenden die weiße `ActivityCard` aus `src/styles/ShopUi.jsx`: Check-in, Bewertung, Route, neuer Shop, einzelner Award, Award-Sammlung, Award-Welle, neuer Nutzer und gemeinsamer Check-in. Datum, Nutzerkopf, Chips, Links und Social-Aktionen stammen aus denselben Bausteinen. Die Komponenten werden auch auf Nutzerprofilen, Shopseiten und bei verlinkten Aktivitäten verwendet.

Fotos bleiben groß; die vorhandene Galerie, Sterne, Kommentare, Likes und Bearbeitungsaktionen bleiben erhalten. Das Fotolayout richtet sich weiterhin nach der Breite der Card: ab 720 px nebeneinander, darunter unter dem Nutzerkopf. Der Dashboard-Inhalt ist auf 1040 px begrenzt und hat auch auf kleinen Bildschirmen seitlichen Abstand.

`ActivityHeader` stellt Nutzer und das kurze Datum nebeneinander, sobald die Card mindestens 600 px Inhaltsbreite bietet. In schmalen Cards steht das Datum als erste Zeile oben rechts, vor dem Nutzerkopf. Datum und Uhrzeit bleiben vollständig sichtbar. `ActivityChip` gleicht die sichtbare Pill-Höhe für Sorten, Merkmale, Anreise und Vor-Ort-Hinweis auf etwa 32 px an; verlinkte Pills behalten eine 44 px hohe klickbare Fläche. Die Social-Zeile verwendet weniger Abstand und keine zusätzliche obere Polsterung, ihre Buttons bleiben mindestens 44 px groß.

`ActivityCarousel` bündelt die Navigation für gemeinsame Check-ins und beide Award-Gruppen. Vorheriger/nächster Eintrag und die Position stehen unter dem Inhalt. Swipe bleibt möglich. Nicht sichtbare Slides sind `inert`; die aktiven Inhalte und aufgeklappten Kommentare bestimmen die Höhe. Award-Galerien erhalten Tastaturfokus, schließen mit Escape und geben den Fokus zurück. Award-Effekte bleiben erhalten und beachten reduzierte Bewegung.

Die Browserfixture verwendet das echte Dashboard und alle Card-Komponenten mit simulierten APIs. Sie prüft lange Namen, mobile Aktionsflächen, Fotos, Links, Likes, Kommentare, Gruppenwechsel, Filter, Nachladen und verlinkte Awards. Externe Anfragen und Produktiv-Schreibzugriffe sind ausgeschlossen.

```powershell
node tests/manual/activity-feed-browser.cjs --screenshots
node tests/manual/shop-detail-browser.cjs
npm.cmd exec -- vite build --outDir build/activity-cards-validation
```

Berichte sowie Gesamtansichten und einzelne Card-Screenshots bei 320, 390, 768 und 1280 px liegen unter `build/activity-feed-browser/`. Es sind keine Backend- oder Datenbankänderungen erforderlich.
