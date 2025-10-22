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
    // Nutzer-Email und Name holen
    $stmt = $pdo->prepare("SELECT email, username FROM nutzer WHERE id = ?");
    $stmt->execute([$userId]);
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$userRow || empty($userRow['email'])) return;

    // Benachrichtigungseinstellung holen
    $settingField = ($notificationType === 'checkin_mention') ? 'notify_checkin_mention' : 'notify_comment';
    $stmtSetting = $pdo->prepare("SELECT $settingField FROM user_notification_settings WHERE user_id = ?");
    $stmtSetting->execute([$userId]);
    $setting = $stmtSetting->fetch(PDO::FETCH_ASSOC);
    $notify = ($setting === false || $setting === null) ? 1 : (isset($setting[$settingField]) ? (int)$setting[$settingField] : 1);
    if ($notify !== 1) return;

    // E-Mail zusammenbauen
    $mailTo = $userRow['email'];
    $mailSubject = '';
    $mailBody = "Hallo " . $userRow['username'] . ",\n\n";
    if ($notificationType === 'checkin_mention') {
        $mailSubject = "Ice-App: Du wurdest bei einem Checkin erwähnt";
        $mailBody .= "$senderName hat dich in der Ice-App bei einem Checkin erwähnt und angegeben, mit dir Eis gegessen zu haben.\n\n";
        $mailBody .= "Du kannst jetzt selbst deinen Checkin eintragen und EP sammeln!\n\n";
        if (!empty($extra['shopName'])) {
            $mailBody .= "Eisdiele: " . $extra['shopName'] . "\n\n";
        }
        $mailBody .= "Details zum Checkin findest du direkt in der Ice-App.\n\n";
    } elseif ($notificationType === 'comment') {
        $mailSubject = "Ice-App: Neuer Kommentar zu deinem Checkin";
        $mailBody .= "$senderName hat deinen Checkin kommentiert.\n\n";
        if (!empty($extra['shopName'])) {
            $mailBody .= "Eisdiele: " . $extra['shopName'] . "\n\n";
        }
        // Link generieren
        $link = '';
        if (!empty($extra['shopId']) && !empty($extra['checkinId'])) {
            $link = "https://ice-app.de/#/map/activeShop/" . $extra['shopId'] . "?tab=checkins&focusCheckin=" . $extra['checkinId'];
        } elseif (!empty($extra['shopId']) && !empty($extra['bewertungId'])) {
            $link = "https://ice-app.de/#/map/activeShop/" . $extra['shopId'] . "?tab=checkins&focusCheckin=" . $extra['bewertungId'];
        }
        if ($link) {
            $mailBody .= "Direkter Link zum Kommentar: $link\n\n";
        }
        $mailBody .= "Details findest du direkt in der Ice-App.\n\n";
    } else {
        // Unbekannter Typ
        return;
    }
    $mailBody .= "Hier geht's zur Ice-App: https://ice-app.de\n\n";
    $mailBody .= "Viel Spaß beim Eis essen und Punkte sammeln!\n\nDein Ice-App Team\n\n";
    $mailBody .= "---\n";
    $mailBody .= "Du kannst deine E-Mail-Benachrichtigungen jederzeit im Profil unter 'Einstellungen' ändern.\n";
    $mailBody .= "Profil-Link: https://ice-app.de/#/user/" . $userId . "?openSettings=1\n";
    @mail($mailTo, $mailSubject, $mailBody, "From: noreply@ice-app.de");
}

?>
