<?php

if (PHP_SAPI !== 'cli') {
    die("This script can only be run from the command line.");
}

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/user_lifecycle_mails.php';

$dryRun = in_array('--dry-run', $argv, true);
$initial = in_array('--initial', $argv, true);
$limit = null;
foreach ($argv as $arg) {
    if (preg_match('/^--limit=(\d+)$/', $arg, $matches)) {
        $limit = max(1, (int) $matches[1]);
    }
}

iceapp_ensure_user_lifecycle_mail_schema($pdo);

function iceapp_verification_reminder_limit_sql(?int $limit): string
{
    return $limit !== null ? ' LIMIT ' . $limit : '';
}

function iceapp_fetch_verification_reminder_users(PDO $pdo, string $stage, ?int $limit): array
{
    $limitSql = iceapp_verification_reminder_limit_sql($limit);

    if ($stage === 'initial') {
        $stmt = $pdo->query("
            SELECT id, username, email, verification_token, erstellt_am
            FROM nutzer
            WHERE is_verified = 0
              AND verification_token IS NOT NULL
              AND verification_token <> ''
              AND email IS NOT NULL
              AND email <> ''
              AND (verification_reminder_1_sent_at IS NULL OR verification_reminder_2_sent_at IS NULL)
            ORDER BY erstellt_am ASC
            {$limitSql}
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($stage === 'second') {
        $stmt = $pdo->query("
            SELECT id, username, email, verification_token, erstellt_am
            FROM nutzer
            WHERE is_verified = 0
              AND verification_token IS NOT NULL
              AND verification_token <> ''
              AND email IS NOT NULL
              AND email <> ''
              AND verification_reminder_1_sent_at IS NOT NULL
              AND verification_reminder_2_sent_at IS NULL
              AND erstellt_am <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ORDER BY erstellt_am ASC
            {$limitSql}
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $stmt = $pdo->query("
        SELECT id, username, email, verification_token, erstellt_am
        FROM nutzer
        WHERE is_verified = 0
          AND verification_token IS NOT NULL
          AND verification_token <> ''
          AND email IS NOT NULL
          AND email <> ''
          AND verification_reminder_1_sent_at IS NULL
          AND erstellt_am <= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY erstellt_am ASC
        {$limitSql}
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function iceapp_process_verification_reminder_stage(PDO $pdo, array $users, string $stage, bool $dryRun): array
{
    $sent = 0;
    $failed = 0;

    $updateSql = $stage === 'initial'
        ? "UPDATE nutzer SET verification_reminder_1_sent_at = COALESCE(verification_reminder_1_sent_at, NOW()), verification_reminder_2_sent_at = COALESCE(verification_reminder_2_sent_at, NOW()) WHERE id = ?"
        : ($stage === 'second'
            ? "UPDATE nutzer SET verification_reminder_2_sent_at = NOW() WHERE id = ?"
            : "UPDATE nutzer SET verification_reminder_1_sent_at = NOW() WHERE id = ?");
    $stmtUpdate = $pdo->prepare($updateSql);

    foreach ($users as $user) {
        $userId = (int) $user['id'];
        $label = "#{$userId} {$user['username']} (registriert: {$user['erstellt_am']})";

        if ($dryRun) {
            echo "[dry-run] {$stage}: {$label}\n";
            continue;
        }

        if (iceapp_send_verification_reminder_mail($user)) {
            $stmtUpdate->execute([$userId]);
            echo "[sent] {$stage}: {$label}\n";
            $sent++;
        } else {
            echo "[failed] {$stage}: {$label}\n";
            $failed++;
        }
    }

    return ['sent' => $sent, 'failed' => $failed];
}

if ($initial) {
    $users = iceapp_fetch_verification_reminder_users($pdo, 'initial', $limit);
    if (!$users) {
        echo "Keine Nutzer fuer initiale Verifizierungs-Erinnerungen gefunden.\n";
        exit(0);
    }

    $result = iceapp_process_verification_reminder_stage($pdo, $users, 'initial', $dryRun);
    $count = count($users);
    echo $dryRun
        ? "Initialer Dry-run abgeschlossen. Kandidaten: {$count}\n"
        : "Initiale Verifizierungs-Erinnerungen abgeschlossen. Gesendet: {$result['sent']}, fehlgeschlagen: {$result['failed']}\n";
    exit(0);
}

$secondUsers = iceapp_fetch_verification_reminder_users($pdo, 'second', $limit);
$remainingLimit = $limit !== null ? max(0, $limit - count($secondUsers)) : null;
$firstUsers = $remainingLimit === 0 ? [] : iceapp_fetch_verification_reminder_users($pdo, 'first', $remainingLimit);

if (!$secondUsers && !$firstUsers) {
    echo "Keine Nutzer fuer Verifizierungs-Erinnerungen gefunden.\n";
    exit(0);
}

$secondResult = iceapp_process_verification_reminder_stage($pdo, $secondUsers, 'second', $dryRun);
$firstResult = iceapp_process_verification_reminder_stage($pdo, $firstUsers, 'first', $dryRun);

if ($dryRun) {
    echo "Dry-run abgeschlossen. Kandidaten: " . (count($secondUsers) + count($firstUsers)) . "\n";
} else {
    echo "Verifizierungs-Erinnerungen abgeschlossen. Gesendet: " . ($secondResult['sent'] + $firstResult['sent']) . ", fehlgeschlagen: " . ($secondResult['failed'] + $firstResult['failed']) . "\n";
}

