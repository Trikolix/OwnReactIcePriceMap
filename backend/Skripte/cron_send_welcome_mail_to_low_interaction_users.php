<?php

if (PHP_SAPI !== 'cli') {
    die("This script can only be run from the command line.");
}

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/user_lifecycle_mails.php';

$dryRun = in_array('--dry-run', $argv, true);
$limit = null;
foreach ($argv as $arg) {
    if (preg_match('/^--limit=(\d+)$/', $arg, $matches)) {
        $limit = max(1, (int) $matches[1]);
    }
}

iceapp_ensure_user_lifecycle_mail_schema($pdo);

$limitSql = $limit !== null ? ' LIMIT ' . $limit : '';

$stmtUsers = $pdo->query("
    SELECT candidates.*
    FROM (
        SELECT
            n.id,
            n.username,
            n.email,
            (
                COALESCE(ci.checkin_count, 0)
                + COALESCE(r.review_count, 0)
                + COALESCE(s.shop_count, 0)
                + COALESCE(p.price_count, 0)
            ) AS interaction_count
        FROM nutzer n
        LEFT JOIN (
            SELECT nutzer_id, COUNT(*) AS checkin_count
            FROM checkins
            GROUP BY nutzer_id
        ) ci ON ci.nutzer_id = n.id
        LEFT JOIN (
            SELECT nutzer_id, COUNT(*) AS review_count
            FROM bewertungen
            GROUP BY nutzer_id
        ) r ON r.nutzer_id = n.id
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS shop_count
            FROM eisdielen
            GROUP BY user_id
        ) s ON s.user_id = n.id
        LEFT JOIN (
            SELECT gemeldet_von, COUNT(*) AS price_count
            FROM preise
            GROUP BY gemeldet_von
        ) p ON p.gemeldet_von = n.id
        WHERE n.is_verified = 1
          AND n.welcome_mail_sent_at IS NULL
          AND n.email IS NOT NULL
          AND n.email <> ''
    ) candidates
    WHERE candidates.interaction_count < 5
    ORDER BY candidates.id ASC
    {$limitSql}
");

$users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

if (!$users) {
    echo "Keine Nutzer fuer den Welcome-Mail-Backfill gefunden.\n";
    exit(0);
}

$sent = 0;
$failed = 0;

foreach ($users as $user) {
    $userId = (int) $user['id'];
    $label = "#{$userId} {$user['username']} ({$user['interaction_count']} Interaktionen)";

    if ($dryRun) {
        echo "[dry-run] Welcome-Mail: {$label}\n";
        continue;
    }

    if (iceapp_send_welcome_mail_to_user($pdo, $userId)) {
        echo "[sent] Welcome-Mail: {$label}\n";
        $sent++;
    } else {
        echo "[failed] Welcome-Mail: {$label}\n";
        $failed++;
    }
}

if ($dryRun) {
    echo "Dry-run abgeschlossen. Kandidaten: " . count($users) . "\n";
} else {
    echo "Welcome-Mail-Backfill abgeschlossen. Gesendet: {$sent}, fehlgeschlagen/uebersprungen: {$failed}\n";
}
