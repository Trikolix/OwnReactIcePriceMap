<?php
require_once __DIR__ . '/../db_connect.php';

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
    // Nutzer-Email, Name, letzte Aktivität und letzte Email holen
    $stmt = $pdo->prepare("SELECT email, username, last_active_at, last_notification_email_at FROM nutzer WHERE id = ?");
    $stmt->execute([$userId]);
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$userRow || empty($userRow['email'])) return;

    // Email-Limitierung: Prüfe, ob Email gesendet werden darf
    $lastActive = $userRow['last_active_at'];
    $lastEmail = $userRow['last_notification_email_at'];
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $sendEmail = false;
    if ($lastEmail === null) {
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
    // Unterstützt auch notify_comment_participated und notify_news
    if ($notificationType === 'checkin_mention') {
        $settingField = 'notify_checkin_mention';
    } elseif ($notificationType === 'comment_participated') {
        $settingField = 'notify_comment_participated';
    } elseif ($notificationType === 'news') {
        $settingField = 'notify_news';
    } else {
        $settingField = 'notify_comment';
    }
    $stmtSetting = $pdo->prepare("SELECT $settingField FROM user_notification_settings WHERE user_id = ?");
    $stmtSetting->execute([$userId]);
    $setting = $stmtSetting->fetch(PDO::FETCH_ASSOC);
    $notify = ($setting === false || $setting === null) ? 1 : (isset($setting[$settingField]) ? (int)$setting[$settingField] : 1);
    if ($notify !== 1) return;

    // E-Mail als HTML zusammenbauen
    $mailTo = $userRow['email'];
    $mailSubject = '';
    $mailBody = "<html><body style='font-family:sans-serif;color:#222;'>";
    $mailBody .= "<p>Hallo <strong>" . htmlspecialchars($userRow['username']) . "</strong>,</p>";
    if ($notificationType === 'checkin_mention') {
        $mailSubject = "Ice-App: Du wurdest bei einem Checkin erwähnt";
        $mailBody .= "<p>" . htmlspecialchars($senderName) . " hat dich in der Ice-App bei einem Checkin erwähnt und angegeben, mit dir Eis gegessen zu haben.</p>";
        $mailBody .= "<p>Du kannst jetzt selbst deinen Checkin eintragen und EP sammeln!</p>";
        if (!empty($extra['shopName'])) {
            $mailBody .= "<p>Eisdiele: <strong>" . htmlspecialchars($extra['shopName']) . "</strong></p>";
        }
        $mailBody .= "<p>Details zum Checkin findest du direkt in der Ice-App.</p>";
    } elseif ($notificationType === 'comment') {
        $mailSubject = "Ice-App: Neuer Kommentar zu deinem Checkin";
        $mailBody .= "<p>" . htmlspecialchars($senderName) . " hat deinen Checkin kommentiert.</p>";
        if (!empty($extra['shopName'])) {
            $mailBody .= "<p>Eisdiele: <strong>" . htmlspecialchars($extra['shopName']) . "</strong></p>";
        }
        // Link generieren
        $link = '';
        if (!empty($extra['shopId']) && !empty($extra['checkinId'])) {
            $link = "https://ice-app.de/#/map/activeShop/" . $extra['shopId'] . "?tab=checkins&focusCheckin=" . $extra['checkinId'];
        } elseif (!empty($extra['shopId']) && !empty($extra['bewertungId'])) {
            $link = "https://ice-app.de/#/map/activeShop/" . $extra['shopId'] . "?tab=checkins&focusCheckin=" . $extra['bewertungId'];
        }
        if ($link) {
            $mailBody .= "<p>Direkter Link zum Kommentar: <a href='" . $link . "' style='color:#0077b6;'>" . $link . "</a></p>";
        }
        $mailBody .= "<p>Details findest du direkt in der Ice-App.</p>";
    } else {
        // Unbekannter Typ
        return;
    }
    $mailBody .= "<p>Hier geht's zur <a href='https://ice-app.de' style='color:#0077b6;'>Ice-App</a>.</p>";
    $mailBody .= "<p>Viel Spaß beim Eis essen und Punkte sammeln!<br>Dein Ice-App Team</p>";
    $mailBody .= "<hr style='margin:24px 0;'>";
    $mailBody .= "<small>Du kannst deine E-Mail-Benachrichtigungen jederzeit im Profil unter 'Einstellungen' ändern.<br>";
    $mailBody .= "Profil-Link: <a href='https://ice-app.de/#/user/" . $userId . "?openSettings=1' style='color:#0077b6;'>https://ice-app.de/#/user/" . $userId . "?openSettings=1</a></small>";
    $mailBody .= "</body></html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: noreply@ice-app.de\r\n";
    @mail($mailTo, $mailSubject, $mailBody, $headers);

    // Nach erfolgreichem Versand: Timestamp aktualisieren
    $stmtUpdate = $pdo->prepare("UPDATE nutzer SET last_notification_email_at = ? WHERE id = ?");
    $stmtUpdate->execute([$now->format('Y-m-d H:i:s'), $userId]);
}

?>
