<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/user_notification_settings.php';

/**
 * Erkennt eine lokale/dev-Ausfuehrung anhand des Dateipfads (backend_dev).
 *
 * @return bool
 */
function isBackendDevNotificationContext() {
    $pathsToCheck = [__DIR__, realpath(__DIR__ . '/../db_connect.php') ?: ''];

    foreach ($pathsToCheck as $path) {
        $normalizedPath = str_replace('\\', '/', (string)$path);
        if (preg_match('~(^|/)backend_dev(/|$)~', $normalizedPath) === 1) {
            return true;
        }
    }

    return false;
}

function iceapp_notification_absolute_url(string $pathOrUrl): string
{
    $value = trim($pathOrUrl);
    if ($value === '') {
        return 'https://ice-app.de';
    }
    if (preg_match('~^https?://~i', $value) === 1) {
        return $value;
    }
    return 'https://ice-app.de' . (strpos($value, '/') === 0 ? $value : '/' . $value);
}

function iceapp_notification_settings_url(int $userId): string
{
    return 'https://ice-app.de/account/settings';
}

/**
 * Send a notification email to a user if their settings allow it (or no settings exist).
 *
 * @param PDO $pdo
 * @param int $userId - Empfänger
 * @param string $notificationType - Enum: 'checkin_mention', 'comment'
 * @param string $senderName - Name des Senders
 * @param array $extra - Zusätzliche Daten wie shopName, checkinId, etc.
 * @return void
 */
function sendNotificationEmailIfAllowed($pdo, $userId, $notificationType, $senderName, $extra = []) {
    ensureUserNotificationSettingsSchema($pdo);

    // Nutzer-Email, Name, letzte Aktivität und letzte Email holen
    $stmt = $pdo->prepare("SELECT email, username, last_active_at, last_notification_email_at FROM nutzer WHERE id = ?");
    $stmt->execute([$userId]);
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$userRow || empty($userRow['email'])) return;

    // Email-Limitierung: Prüfe, ob Email gesendet werden darf
    $lastActive = $userRow['last_active_at'];
    $lastEmail = $userRow['last_notification_email_at'];
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $skipRateLimit = !empty($extra['skipRateLimit']) || $notificationType === 'news';
    $sendEmail = false;
    if ($skipRateLimit) {
        $sendEmail = true;
    } elseif ($lastEmail === null) {
        $sendEmail = true; // Noch nie eine Email gesendet
    } else {
        $lastEmailDT = new DateTimeImmutable($lastEmail, new DateTimeZone('UTC'));
        // 1. War User seit letzter Email wieder aktiv?
        if ($lastActive !== null) {
            $lastActiveDT = new DateTimeImmutable($lastActive, new DateTimeZone('UTC'));
            if ($lastActiveDT > $lastEmailDT) {
                $sendEmail = true;
            }
        }
        // 2. Oder ist die letzte Email über 24h her?
        if (!$sendEmail && $now->getTimestamp() - $lastEmailDT->getTimestamp() > 86400) {
            $sendEmail = true;
        }
    }
    if (!$sendEmail) return;

    // Benachrichtigungseinstellung holen
    if ($notificationType === 'checkin_mention') {
        $settingField = 'notify_checkin_mention';
    } elseif ($notificationType === 'comment_participated') {
        $settingField = 'notify_comment_participated';
    } elseif ($notificationType === 'engagement') {
        $settingField = 'notify_news';
    } elseif ($notificationType === 'news') {
        $settingField = 'notify_news';
    } elseif ($notificationType === 'team_challenge') {
        $settingField = 'notify_team_challenge';
    } elseif ($notificationType === 'ice_date') {
        $settingField = 'notify_ice_date';
    } elseif ($notificationType === 'photo_challenge') {
        $settingField = 'notify_photo_challenge';
    } else {
        $settingField = 'notify_comment';
    }
    $stmtSetting = $pdo->prepare("SELECT $settingField FROM user_notification_settings WHERE user_id = ?");
    $stmtSetting->execute([$userId]);
    $setting = $stmtSetting->fetch(PDO::FETCH_ASSOC);
    $defaultNotify = $notificationType === 'news' ? 0 : 1;
    $notify = ($setting === false || $setting === null) ? $defaultNotify : (isset($setting[$settingField]) ? (int)$setting[$settingField] : $defaultNotify);
    if ($notify !== 1) return;

    // E-Mail im gemeinsamen Ice-App Design zusammenbauen
    $mailTo = $userRow['email'];
    $mailSubject = '';
    $mailHeading = 'Neue Benachrichtigung';
    $mailGreeting = 'Hallo ' . (string)$userRow['username'] . ',';
    $mailParagraphs = [];
    $buttonLabel = 'In der Ice-App ansehen';
    $buttonUrl = 'https://ice-app.de';

    if ($notificationType === 'checkin_mention') {
        $mailSubject = "Ice-App: Du wurdest bei einem Checkin erwähnt";
        $mailHeading = 'Du wurdest erwähnt';
        $mailParagraphs[] = "{$senderName} hat dich in der Ice-App bei einem Checkin erwähnt und angegeben, mit dir Eis gegessen zu haben.";
        $mailParagraphs[] = 'Du kannst jetzt selbst deinen Checkin eintragen und EP sammeln.';
        if (!empty($extra['shopName'])) {
            $mailParagraphs[] = 'Eisdiele: ' . (string)$extra['shopName'];
        }
        $mailParagraphs[] = 'Details zum Checkin findest du direkt in der Ice-App.';
        if (!empty($extra['shopId']) && !empty($extra['checkinId'])) {
            $buttonUrl = "https://ice-app.de/map/activeShop/" . urlencode((string)$extra['shopId']) . "?tab=checkins&focusCheckin=" . urlencode((string)$extra['checkinId']);
        }
    } elseif ($notificationType === 'comment') {
        $mailSubject = "Ice-App: Neuer Kommentar zu deinem Checkin";
        $mailHeading = 'Neuer Kommentar';
        $mailParagraphs[] = "{$senderName} hat deinen Checkin kommentiert.";
        $link = '';
        if (!empty($extra['shopId']) && !empty($extra['checkinId'])) {
            $link = "https://ice-app.de/map/activeShop/" . urlencode((string)$extra['shopId']) . "?tab=checkins&focusCheckin=" . urlencode((string)$extra['checkinId']);
        } elseif (!empty($extra['shopId']) && !empty($extra['bewertungId'])) {
            $link = "https://ice-app.de/map/activeShop/" . urlencode((string)$extra['shopId']) . "?tab=reviews&focusReview=" . urlencode((string)$extra['bewertungId']);
        }
        if ($link) {
            $buttonUrl = $link;
        }
        $mailParagraphs[] = 'Details findest du direkt in der Ice-App.';
    } elseif ($notificationType === 'comment_participated') {
        $mailSubject = "Ice-App: {$senderName} hat einen Check-in kommentiert, den du auch kommentiert hast.";
        $mailHeading = 'Neuer Kommentar in deiner Unterhaltung';
        $mailParagraphs[] = "{$senderName} hat einen Check-in kommentiert, den du auch kommentiert hast.";
        $link = '';
        if (!empty($extra['shopId']) && !empty($extra['checkinId'])) {
            $link = "https://ice-app.de/map/activeShop/" . urlencode((string)$extra['shopId']) . "?tab=checkins&focusCheckin=" . urlencode((string)$extra['checkinId']);
        } elseif (!empty($extra['shopId']) && !empty($extra['bewertungId'])) {
            $link = "https://ice-app.de/map/activeShop/" . urlencode((string)$extra['shopId']) . "?tab=reviews&focusReview=" . urlencode((string)$extra['bewertungId']);
        }
        if ($link) {
            $buttonUrl = $link;
        }
        $mailParagraphs[] = 'Details findest du direkt in der Ice-App.';
    } elseif ($notificationType === 'comment_participated_route') {
        $mailSubject = "Ice-App: {$senderName} hat einen Kommentar zu einer Route geschrieben, die du auch kommentiert hast.";
        $mailHeading = 'Neuer Routen-Kommentar';
        $mailParagraphs[] = "{$senderName} hat einen Kommentar zu einer Route geschrieben, die du auch kommentiert hast.";
        $link = '';
        if (!empty($extra['routeId']) && !empty($extra['route_autor_id'])) {
            $link = "https://ice-app.de/user/" . urlencode((string)$extra['route_autor_id']) . "?tab=routes&focusRoute=" . urlencode((string)$extra['routeId']);
        }
        if ($link) {
            $buttonUrl = $link;
        }
        $mailParagraphs[] = 'Details findest du direkt in der Ice-App.';

    } elseif ($notificationType === 'team_challenge') {
        $action = (string)($extra['teamChallengeAction'] ?? 'update');
        $challengeLink = '';
        if (!empty($extra['teamChallengeId'])) {
            $challengeLink = "https://ice-app.de/challenge?tab=team&teamChallengeId=" . urlencode((string)$extra['teamChallengeId']);
        }

        if ($action === 'invite') {
            $mailSubject = "Ice-App: Neue Team-Challenge-Einladung";
            $mailHeading = 'Team-Challenge Einladung';
            $mailParagraphs[] = "{$senderName} hat dich zu einer Team-Challenge eingeladen.";
        } elseif ($action === 'accepted') {
            $mailSubject = "Ice-App: Deine Team-Challenge wurde angenommen";
            $mailHeading = 'Team-Challenge angenommen';
            $mailParagraphs[] = "{$senderName} hat deine Team-Challenge angenommen.";
        } elseif ($action === 'declined') {
            $mailSubject = "Ice-App: Deine Team-Challenge wurde abgelehnt";
            $mailHeading = 'Team-Challenge abgelehnt';
            $mailParagraphs[] = "{$senderName} hat deine Team-Challenge abgelehnt.";
        } elseif ($action === 'cancelled') {
            $mailSubject = "Ice-App: Team-Challenge abgebrochen";
            $mailHeading = 'Team-Challenge abgebrochen';
            $mailParagraphs[] = "{$senderName} hat die Team-Challenge abgebrochen.";
        } elseif ($action === 'completed') {
            $mailSubject = "Ice-App: Team-Challenge erfolgreich abgeschlossen";
            $mailHeading = 'Team-Challenge abgeschlossen';
            $mailParagraphs[] = 'Eure Team-Challenge wurde erfolgreich abgeschlossen.';
        } else {
            $mailSubject = "Ice-App: Update zu deiner Team-Challenge";
            $mailHeading = 'Team-Challenge Update';
            $mailParagraphs[] = 'Es gibt ein Update zu deiner Team-Challenge.';
        }

        if (!empty($extra['shopName'])) {
            $mailParagraphs[] = 'Ziel-Eisdiele: ' . (string)$extra['shopName'];
        }

        if ($challengeLink) {
            $buttonUrl = $challengeLink;
        }

        $mailParagraphs[] = 'Details findest du direkt im Bereich Challenges der Ice-App.';

    } elseif ($notificationType === 'ice_date') {
        $mailSubject = 'Ice-App: Einladung zu einem Eis-Date';
        $mailHeading = 'Eis-Date';
        $mailParagraphs[] = $senderName !== ''
            ? "{$senderName} hat dich zu einem gemeinsamen Eis-Date eingeladen oder den Termin aktualisiert."
            : 'Es gibt ein Update zu einem gemeinsamen Eis-Date.';
        $buttonUrl = 'https://ice-app.de/ice-date?id=' . (int)($extra['iceDateId'] ?? 0);
        $buttonLabel = 'Eis-Date ansehen';
        $mailParagraphs[] = 'Details und deine Zusage findest du direkt in der Ice-App.';

    } elseif ($notificationType === 'photo_challenge') {
        $mailSubject = "Ice-App: Neue Foto-Challenge!";
        $mailHeading = 'Neue Foto-Challenge';
        $mailParagraphs[] = 'Eine neue Foto-Challenge hat begonnen. Zeige uns deine besten Eis-Bilder und stimme für deine Favoriten ab.';
        $challengeLink = "https://ice-app.de/photo-challenge/" . (isset($extra['challengeId']) ? (int)$extra['challengeId'] : '');
        $buttonUrl = $challengeLink;
        $mailParagraphs[] = 'Details findest du direkt in der Ice-App.';
    } elseif ($notificationType === 'news') {
        $title = trim((string)($extra['title'] ?? 'Neue Systemmeldung'));
        $message = trim((string)($extra['message'] ?? ''));
        $linkUrl = trim((string)($extra['linkUrl'] ?? ''));
        $linkLabel = trim((string)($extra['linkLabel'] ?? 'In der Ice-App ansehen'));

        $mailSubject = "Ice-App: " . $title;
        $mailHeading = $title;
        if ($message !== '') {
            $mailParagraphs[] = $message;
        }

        if ($linkUrl !== '') {
            $buttonUrl = iceapp_notification_absolute_url($linkUrl);
            $buttonLabel = $linkLabel !== '' ? $linkLabel : 'In der Ice-App ansehen';
        }
    } elseif ($notificationType === 'engagement') {
        $mailSubject = "Ice-App: Zeit für ein Eis!";
        $mailHeading = 'Zeit für ein Eis!';
        $mailParagraphs[] = 'Du warst schon länger nicht mehr in der Ice-App aktiv.';
        $mailParagraphs[] = 'Starte eine neue Challenge oder checke in deiner Lieblings-Eisdiele ein.';
        $mailParagraphs[] = 'Wir freuen uns auf dich.';
        $buttonLabel = 'Challenges ansehen';
        $buttonUrl = 'https://ice-app.de/challenge';
    } else {
        // Unbekannter Typ
        return;
    }

    $notificationSettingsFooterText = 'Du kannst deine E-Mail-Benachrichtigungen jederzeit im Profil unter Einstellungen ändern';
    $notificationSettingsUrl = iceapp_notification_settings_url((int)$userId);

    // Im backend_dev werden Mails nur real an user_id=1 gesendet.
    // Alle anderen Mails werden an die Dev-Adresse umgeleitet.
    if (isBackendDevNotificationContext() && (int)$userId !== 1) {
        $originalMailTo = $mailTo;
        $mailTo = 'ch_helbig@mail';
        $mailSubject = '[DEV-Weiterleitung] ' . $mailSubject;
        array_unshift($mailParagraphs, "Hinweis backend_dev: Diese E-Mail waere eigentlich an {$originalMailTo} (user_id=" . (int)$userId . ") gesendet worden.");
    }

    $mailSent = iceapp_send_branded_action_mail(
        $mailTo,
        $mailSubject,
        $mailHeading,
        $mailGreeting,
        $mailParagraphs,
        $buttonLabel,
        $buttonUrl,
        'Direkter Link',
        'Ice-App <noreply@ice-app.de>',
        $notificationSettingsFooterText,
        $notificationSettingsUrl
    );

    if (!$mailSent) {
        error_log("Ice-App mail() failed for notification type {$notificationType} to user_id={$userId}");
        return;
    }

    // Nach erfolgreichem Versand: Timestamp aktualisieren
    $stmtUpdate = $pdo->prepare("UPDATE nutzer SET last_notification_email_at = ? WHERE id = ?");
    $stmtUpdate->execute([$now->format('Y-m-d H:i:s'), $userId]);
}

?>
