<?php

require_once __DIR__ . '/mail.php';

function iceapp_send_welcome_mail(string $to, string $username): bool {
    $subject = 'Willkommen bei der Ice-App! 🍦';
    $heading = 'Hey ' . $username . ', willkommen bei der Ice-App!';

    $markdown = <<<MD
Schön, dass du dabei bist! Damit du dich schnell zurechtfindest, haben wir hier die wichtigsten Funktionen der Ice-App für dich zusammengefasst:

### 🗺️ Neue Eisdielen finden
Die Karte nutzen um die neue Lieblingseisdiele zu finden. Man kann sich Kugeleis, Softeis, Eisbecher Bewertungen anzeigen lassen, Kugelpreis, Softeispreis. Zu Favoriten hinzufügen. Filtern nach Öffnungszeiten, Favoriten, Besucht / Nicht besucht und weitere Filtermöglichkeiten
![Karte entdecken](https://ice-app.de/assets/images/welcome_map_placeholder.jpg)
[button: Zur Karte](https://ice-app.de/map)

### ➕ Neue Eisdiele eintragen
Füge Eisdielen die noch nicht eingetragen sind hinzu.
[button: Eisdiele eintragen](https://ice-app.de/add-shop)

### 🍦 Eis einchecken / Eisdielen bewerten
Wenn du Eis isst, checke es ein, bewerte Geschmack, Preis-Leistung, Waffel, füge Bilder hinzu. Aus den Checkins wird der durchschnittliche Kugeleis / Softeis / Eisbecher- Score einer Eisdiele berechnet.
Eisdielen bewerten: Erzähle von deinen allgemeinen Erfahrungen mit der Eisdiele.
![Eis einchecken](https://ice-app.de/assets/images/welcome_checkin_placeholder.jpg)
[button: Eisdielen entdecken](https://ice-app.de/map)

### 👤 Profilbild hinzufügen
Eigenes Profilbild hochladen oder Comic Avatar auswählen.
Instagram / Strava mit dem Ice-App Account verknüpfen.
![Profil anpassen](https://ice-app.de/assets/images/welcome_profile_placeholder.jpg)
[button: Zum Profil](https://ice-app.de/account)

### 📸 An Foto-Challenge abstimmen
Nimm an der Foto-Challenge teil oder stimme für die besten Bilder ab.
[button: Zur Foto-Challenge](https://ice-app.de/photo-challenge)

### 🏆 Awards sammeln
für ganz viele Aktionen gibt es EP und Awards, davon steigt man Level auf. Chance Nutzer des Monats zu werden, weitere tolle Awards freizuschalten oder weitere Comic Avatare freizuschalten.
![Awards sammeln](https://ice-app.de/assets/images/welcome_awards_placeholder.jpg)
[button: Deine Awards](https://ice-app.de/dashboard)

### 📊 Statistiken ansehen
es gibt diverse Statistiken, zu Bewertungen, Preise, beliebteste Sorten etc. Für alle Statistik Nerds und welche die es werden wollen.
[button: Zu den Statistiken](https://ice-app.de/statistics)

### 🚴 Ice-Tour und Routen
es gibt einige Rennrad / MTB / Wanderungen zu Eisdielen von und für Nutzer. fahre eine bereits eingereichte ab oder teile deine eigene Empfehlung wie man am besten zu deiner Lieblingseisdiele kommt.
Ice-Tour: Ein Event in dem Spenden für den Elternverein krebskranker Kinder e.V gesammelt wurden. Dieses Jahr (2026) schon vorbei, man kann es aber als Self-Ride noch nach fahren und es wird sicherlich eine neue Auflage geben.
![Routen und Touren](https://ice-app.de/assets/images/welcome_routes_placeholder.jpg)
[button: Zu den Routen](https://ice-app.de/routes)

### 🎯 Challenges
lass dir von der Ice-App zufällige Eisdielen in der Nähe aussuchen, wenn du sie noch diesen Tag oder diese Woche noch besuchst, bekommst du extra EP und Awards. Auch als Team-Challenge mit anderen Nutzern möglich.
[button: Zu den Challenges](https://ice-app.de/challenge)

### 🤝 Freunde einladen
Lade Freunde zur Ice-App ein und teile Freunde, erhalte Spezialaward.
[button: Freunde einladen](https://ice-app.de/account/invite)

Wir wünschen dir viel Spaß beim Eis essen und Entdecken! 🍦
Dein Ice-App Team
MD;

    return iceapp_send_branded_admin_markdown_mail(
        $to,
        $subject,
        $heading,
        $markdown,
        [],
        false
    );
}
