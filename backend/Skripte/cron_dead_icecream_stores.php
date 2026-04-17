<?php
/**
 * cron_dead_icecream_stores.php
 *
 * Runs periodically (e.g. monthly) to find "dead" IceCreamStores.
 * Dead stores are older than 1 month and have no A-items (checkins, prices, routes, reviews).
 *
 * Rules:
 * - 0 B-items (address, opening hours, website): Delete after 4 months.
 * - 1 B-item: Delete after 6 months.
 * - 2 B-items: Delete after 9 months.
 * - 3 B-items: Delete after 12 months.
 *
 * Notifications:
 * - "Gentle Nudge": At 1 month old, if 0 A-items.
 * - "Final Warning": 1 month before deletion.
 */

if (PHP_SAPI !== 'cli') {
    die("This script can only be run from the command line.");
}

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/notification_dispatcher.php';
require_once __DIR__ . '/../lib/user_notification_settings.php';
require_once __DIR__ . '/../lib/mail.php';

ensureUserNotificationSettingsSchema($pdo);

// Helper function to send email if user wants news
function sendEmailNotification(PDO $pdo, int $userId, string $subject, string $body) {
    $stmt = $pdo->prepare("
        SELECT n.email, s.notify_news
        FROM nutzer n
        LEFT JOIN user_notification_settings s ON n.id = s.user_id
        WHERE n.id = :id
    ");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['email'] && (is_null($user['notify_news']) || $user['notify_news'] == 1)) {
        iceapp_send_utf8_text_mail($user['email'], $subject, $body);
    }
}

try {
    // 1. Fetch all "dead" stores
    $sql = "
        SELECT
            e.id,
            e.name,
            e.user_id,
            e.erstellt_am,
            TIMESTAMPDIFF(MONTH, e.erstellt_am, NOW()) AS age_in_months,
            (
                (CASE WHEN e.adresse IS NOT NULL AND TRIM(e.adresse) != '' THEN 1 ELSE 0 END) +
                (CASE WHEN e.openingHours IS NOT NULL AND TRIM(e.openingHours) != '' AND TRIM(e.openingHours) != '[]' THEN 1 ELSE 0 END) +
                (CASE WHEN e.website IS NOT NULL AND TRIM(e.website) != '' THEN 1 ELSE 0 END)
            ) AS b_items_present
        FROM
            eisdielen e
        WHERE
            e.erstellt_am <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            AND e.status != 'permanent_closed'
            AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.eisdiele_id = e.id)
            AND NOT EXISTS (SELECT 1 FROM preise p WHERE p.eisdiele_id = e.id)
            AND NOT EXISTS (SELECT 1 FROM route_eisdielen re WHERE re.eisdiele_id = e.id)
            AND NOT EXISTS (SELECT 1 FROM bewertungen b WHERE b.eisdiele_id = e.id)
    ";

    $stmt = $pdo->query($sql);
    $deadStores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $deletedCount = 0;
    $nudgeCount = 0;
    $warningCount = 0;

    foreach ($deadStores as $store) {
        $age = (int)$store['age_in_months'];
        $bItems = (int)$store['b_items_present'];
        $storeId = (int)$store['id'];
        $userId = (int)$store['user_id'];
        $storeName = $store['name'];

        // Determine deletion threshold
        $deletionThreshold = 4;
        if ($bItems == 1) $deletionThreshold = 6;
        elseif ($bItems == 2) $deletionThreshold = 9;
        elseif ($bItems == 3) $deletionThreshold = 12;

        if ($age >= $deletionThreshold) {
            // Delete store
            $updateStmt = $pdo->prepare("DELETE FROM eisdielen WHERE id = :id");
            $updateStmt->execute(['id' => $storeId]);

            $text = "Deine hinzugefügte Eisdiele '$storeName' wurde gelöscht, da sie zu lange inaktiv war.";
            createNotification($pdo, $userId, 'systemmeldung', $storeId, $text);
            sendEmailNotification($pdo, $userId, "Eisdiele $storeName gelöscht", $text);

            $deletedCount++;
            echo "Deleted store ID $storeId ('$storeName')\n";
        } elseif ($age == ($deletionThreshold - 1)) {
            // Final warning (1 month before deletion)
            $text = "Letzte Warnung! Deine Eisdiele '$storeName' ist komplett inaktiv und wird in 30 Tagen gelöscht. Füge Check-Ins oder Preise hinzu, um sie zu retten!";
            createNotification($pdo, $userId, 'systemmeldung', $storeId, $text);
            sendEmailNotification($pdo, $userId, "Letzte Warnung für $storeName", $text);

            $warningCount++;
            echo "Warned store ID $storeId ('$storeName')\n";
        } elseif ($age == 1) {
            // Gentle nudge (Exactly 1 month old)
            $text = "Erinnerung: Du hast '$storeName' vor einem Monat hinzugefügt, aber es gibt noch keine Check-Ins oder Preise. Sei der Erste!";
            createNotification($pdo, $userId, 'systemmeldung', $storeId, $text);
            sendEmailNotification($pdo, $userId, "Erinnerung für $storeName", $text);

            $nudgeCount++;
            echo "Nudged store ID $storeId ('$storeName')\n";
        }
    }

    echo "Cronjob completed.\n";
    echo "- Deleted: $deletedCount\n";
    echo "- Warned: $warningCount\n";
    echo "- Nudged: $nudgeCount\n";

} catch (Exception $e) {
    echo "Fehler im Cronjob cron_dead_icecream_stores: " . $e->getMessage() . "\n";
    exit(1);
}
