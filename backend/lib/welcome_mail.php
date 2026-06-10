<?php

require_once __DIR__ . '/mail.php';

function iceapp_build_welcome_mail_context($user, ?int $userId = null): array
{
    if (is_array($user)) {
        $username = trim((string) ($user['username'] ?? ''));
        $resolvedUserId = isset($user['id'])
            ? (int) $user['id']
            : (isset($user['user_id']) ? (int) $user['user_id'] : 0);
        $inviteCode = trim((string) ($user['invite_code'] ?? ''));
    } else {
        $username = trim((string) $user);
        $resolvedUserId = (int) ($userId ?? 0);
        $inviteCode = '';
    }

    $displayName = $username !== '' ? $username : 'Eis-Fan';
    $profileUrl = $resolvedUserId > 0
        ? 'https://ice-app.de/user/' . rawurlencode((string) $resolvedUserId)
        : 'https://ice-app.de/account/settings';

    return [
        'user_id' => $resolvedUserId,
        'username' => $username,
        'display_name' => $displayName,
        'profile_url' => $profileUrl,
        'settings_url' => 'https://ice-app.de/account/settings',
        'invite_code' => $inviteCode,
    ];
}

/**
 * @param string|array $user Username oder User-Row mit id/user_id, username und optional invite_code.
 */
function iceapp_send_welcome_mail(string $to, $user, ?int $userId = null): bool {
    $context = iceapp_build_welcome_mail_context($user, $userId);
    $username = $context['display_name'];
    $profileUrl = $context['profile_url'];
    $settingsUrl = $context['settings_url'];
    $inviteCode = $context['invite_code'];
    $subject = 'Willkommen bei der Ice-App! 🍦';
    $heading = 'Hey ' . $username . ', willkommen bei der Ice-App!';

    $markdown = <<<MD
Schön, dass du dabei bist! Damit du dich schnell zurechtfindest, haben wir hier die wichtigsten Funktionen der Ice-App für dich zusammengefasst:

### 🗺️ Neue Eisdielen finden
Die Karte nutzen um die neue Lieblingseisdiele zu finden. Man kann sich Kugeleis, Softeis, Eisbecher Bewertungen anzeigen lassen, Kugelpreis, Softeispreis. Zu Favoriten hinzufügen. Filtern nach Öffnungszeiten, Favoriten, Besucht / Nicht besucht und weitere Filtermöglichkeiten
![Karte entdecken](https://ice-app.de/assets/images/welcome_map.png)
[button: Zur Karte](https://ice-app.de/map)

### ➕ Neue Eisdiele eintragen
Füge Eisdielen die noch nicht eingetragen sind hinzu.
![Eisdiele eintragen](https://ice-app.de/assets/images/welcome_add_shop.png)

### 🍦 Eis einchecken / Eisdielen bewerten
Wenn du Eis isst, checke es ein, bewerte Geschmack, Preis-Leistung, Waffel, füge Bilder hinzu. Aus den Checkins wird der durchschnittliche Kugeleis / Softeis / Eisbecher- Score einer Eisdiele berechnet.
Eisdielen bewerten: Erzähle von deinen allgemeinen Erfahrungen mit der Eisdiele.
![Eis einchecken](https://ice-app.de/assets/images/welcome_checkin.png)
[button: Eisdielen entdecken](https://ice-app.de/map)

### 👤 Profilbild hinzufügen
Eigenes Profilbild hochladen oder Comic Avatar auswählen.
Instagram / Strava mit dem Ice-App Account verknüpfen.
![Profil anpassen](https://ice-app.de/assets/images/welcome_profile.png)
[button: Zum Profil]({$settingsUrl})

### 🤝 Freunde einladen
Lade Freunde zur Ice-App ein und teile Freunde, erhalte Spezialaward. In deinem Profil findest du einen Einladungslink,
wenn du diesen teilst und jemand sich darüber registriert, bekommst du einen Spezialaward. Je mehr Freunde du einlädst, desto bessere Awards kannst du sammeln!
[button: Zum Invite Code]({$profileUrl})

### 📸 An Foto-Challenge abstimmen
Nimm an der Foto-Challenge teil oder stimme für die besten Bilder ab.
![Foto-Challenge](https://ice-app.de/assets/images/welcome_photo_challenge.png)
[button: Zur Foto-Challenge](https://ice-app.de/photo-challenge)

### 🏆 Awards sammeln
für ganz viele Aktionen gibt es EP und Awards, davon steigt man Level auf. Chance Nutzer des Monats zu werden, weitere tolle Awards freizuschalten oder weitere Comic Avatare freizuschalten.
![Awards sammeln](https://ice-app.de/assets/images/welcome_awards.png)
[button: Deine Awards]({$profileUrl})

### 🚴 Ice-Tour und Routen
es gibt einige Rennrad, Gravel bzw. MTB-Routen und Wanderungen zu Eisdielen von und für Nutzer. Fahre eine bereits eingereichte ab oder teile deine eigene Empfehlung wie man am besten zu deiner Lieblingseisdiele kommt.
Ice-Tour: Ein Event in dem Spenden für den Elternverein krebskranker Kinder e.V gesammelt wurden. Dieses Jahr (2026) schon vorbei, man kann es aber als Self-Ride noch nach fahren und es wird sicherlich eine neue Auflage geben.
![Routen und Touren](https://ice-app.de/assets/images/welcome_routes.png)
[button: Zu den Routen](https://ice-app.de/routes)

### 🎯 Challenges
lass dir von der Ice-App zufällige Eisdielen in der Nähe aussuchen, wenn du sie noch diesen Tag oder diese Woche noch besuchst, bekommst du extra EP und Awards. Auch als Team-Challenge mit anderen Nutzern möglich.
![Challenges](https://ice-app.de/assets/images/welcome_challenges.png)
[button: Zu den Challenges](https://ice-app.de/challenge)

### 📊 Statistiken ansehen
es gibt diverse Statistiken, zu Bewertungen, Preise, beliebteste Sorten etc. Für alle Statistik Nerds und welche die es werden wollen.
![Statistiken ansehen](https://ice-app.de/assets/images/welcome_statistics.png)
[button: Zu den Statistiken](https://ice-app.de/statistics)

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
