<?php
require_once __DIR__ . '/notification_dispatcher.php';
require_once __DIR__ . '/user_profile.php';
require_once __DIR__ . '/likes.php';
require_once __DIR__ . '/award_grants.php';
require_once __DIR__ . '/onboarding_rules.php';
require_once __DIR__ . '/levelsystem.php';

function ensureOnboardingSchema(PDO $pdo): int
{
    static $awardId = null;
    if ($awardId !== null) return $awardId;
    ensurePushInfrastructureSchema($pdo);
    ensureUserProfileColumns($pdo);
    ensureUserProfileTable($pdo);
    ensureLikesSchema($pdo);
    ensureAwardShownAtColumn($pdo);
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_onboarding_progress (
        user_id INT PRIMARY KEY,
        app_installed_at DATETIME NULL,
        invite_shared_at DATETIME NULL,
        CONSTRAINT fk_onboarding_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    // Keep the remote branch's ID where available, without overwriting another award.
    $pdo->exec("INSERT IGNORE INTO awards (id, code, category) VALUES (77, 'onboarding', 'Einstieg in die Ice-App')");
    $pdo->exec("INSERT IGNORE INTO awards (code, category) VALUES ('onboarding', 'Einstieg in die Ice-App')");
    $awardId = (int)$pdo->query("SELECT id FROM awards WHERE code = 'onboarding'")->fetchColumn();
    foreach ([1 => ['Startklar!', 'Alle sechs Schritte deines Ice-App Starts abgeschlossen.', 50],
              2 => ['Ice-App Experte', 'Alle sechs Aufgaben der Experten-Stufe gemeistert.', 100]] as $level => $data) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO award_levels (award_id, level, threshold, icon_path, title_de, description_de, ep)
            SELECT ?, ?, 6, 'assets/onboarding-award.svg', ?, ?, ?
            WHERE NOT EXISTS (SELECT 1 FROM award_levels WHERE award_id = ? AND level = ?)");
        $stmt->execute([$awardId, $level, $data[0], $data[1], $data[2], $awardId, $level]);
    }
    return $awardId;
}

function fetchOnboardingProgress(PDO $pdo, int $userId): array
{
    $awardId = ensureOnboardingSchema($pdo);
    $count = static function (string $sql, array $args = []) use ($pdo): int {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        return (int)$stmt->fetchColumn();
    };
    $stmt = $pdo->prepare("SELECT n.invite_code, n.instagram_account, n.strava_account, up.avatar_path,
        op.app_installed_at, op.invite_shared_at
        FROM nutzer n LEFT JOIN user_profile_images up ON up.user_id = n.id
        LEFT JOIN user_onboarding_progress op ON op.user_id = n.id WHERE n.id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $settings = fetchUserNotificationSettings($pdo, $userId);
    $stats = [
        'avatar' => trim((string)($user['avatar_path'] ?? '')) !== '',
        'app_installed' => !empty($user['app_installed_at']),
        'invite_shared' => !empty($user['invite_shared_at']),
        'social_account' => trim((string)($user['instagram_account'] ?? '')) !== '' || trim((string)($user['strava_account'] ?? '')) !== '',
        'push_active' => ((int)$settings['push_enabled_web'] === 1 && $count('SELECT COUNT(*) FROM web_push_subscriptions WHERE user_id = ? AND invalidated_at IS NULL', [$userId]) > 0)
            || ((int)$settings['push_enabled_android'] === 1 && $count('SELECT COUNT(*) FROM mobile_push_devices WHERE user_id = ? AND invalidated_at IS NULL', [$userId]) > 0),
        'checkins' => $count('SELECT COUNT(*) FROM checkins WHERE nutzer_id = ?', [$userId]),
        'invited_count' => $count('SELECT COUNT(*) FROM nutzer WHERE invited_by = ? AND is_verified = 1 AND deletion_requested_at IS NULL', [$userId]),
        'invited_pending_count' => $count('SELECT COUNT(*) FROM nutzer WHERE invited_by = ? AND is_verified = 0 AND deletion_requested_at IS NULL', [$userId]),
        'created_shops_with_checkin' => $count("SELECT COUNT(*) FROM eisdielen e WHERE e.user_id = ? AND e.place_type = 'ice_shop'
            AND EXISTS (SELECT 1 FROM checkins c WHERE c.eisdiele_id = e.id AND c.context_type = 'ice_shop')", [$userId]),
        'reviews' => $count('SELECT COUNT(*) FROM bewertungen WHERE nutzer_id = ?', [$userId]),
        'completed_challenges' => $count('SELECT COUNT(*) FROM challenges WHERE nutzer_id = ? AND completed = 1', [$userId]),
        'routes' => $count('SELECT COUNT(*) FROM routen WHERE nutzer_id = ?', [$userId]),
        'foreign_likes' => $count("SELECT COUNT(*) FROM likes l WHERE l.user_id = ? AND (
            (l.entity_type = 'checkin' AND EXISTS (SELECT 1 FROM checkins c WHERE c.id = l.entity_id AND c.nutzer_id <> l.user_id))
            OR (l.entity_type = 'bewertung' AND EXISTS (SELECT 1 FROM bewertungen b WHERE b.id = l.entity_id AND b.nutzer_id <> l.user_id))
            OR (l.entity_type = 'route' AND EXISTS (SELECT 1 FROM routen r WHERE r.id = l.entity_id AND r.nutzer_id <> l.user_id))
            OR (l.entity_type = 'kommentar' AND EXISTS (SELECT 1 FROM kommentare k WHERE k.id = l.entity_id AND k.nutzer_id <> l.user_id))
            OR (l.entity_type = 'user_registration' AND EXISTS (SELECT 1 FROM nutzer n WHERE n.id = l.entity_id AND n.id <> l.user_id))
            OR (l.entity_type = 'user_award' AND EXISTS (SELECT 1 FROM user_awards a WHERE a.id = l.entity_id AND a.user_id <> l.user_id)))", [$userId]),
    ];
    $stmt = $pdo->prepare('SELECT level FROM user_awards WHERE user_id = ? AND award_id = ?');
    $stmt->execute([$userId, $awardId]);
    return ['stats' => $stats, 'stages' => onboardingStages($stats), 'award_id' => $awardId,
        'awarded_levels' => array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN)),
        'invite_code' => $user['invite_code'] ?? null,
        'visible' => (int)($settings['show_onboarding_checklist'] ?? 1) === 1];
}

function recordOnboardingDeviceAction(PDO $pdo, int $userId, string $action): void
{
    $columns = ['app_installed' => 'app_installed_at', 'invite_shared' => 'invite_shared_at'];
    if (!isset($columns[$action])) throw new InvalidArgumentException('Unbekannte Onboarding-Aktion.');
    ensureOnboardingSchema($pdo);
    // Installation and opening an OS share sheet can only be reported by that device.
    $column = $columns[$action];
    $pdo->prepare("INSERT INTO user_onboarding_progress (user_id, $column) VALUES (?, NOW())
        ON DUPLICATE KEY UPDATE $column = COALESCE($column, NOW())")->execute([$userId]);
}

function claimOnboardingAward(PDO $pdo, int $userId, int $level): array
{
    if (!in_array($level, [1, 2], true)) throw new InvalidArgumentException('Ungültige Onboarding-Stufe.');
    $awardId = ensureOnboardingSchema($pdo);
    ensureShopMaintenanceSchema($pdo);
    $pdo->beginTransaction();
    try {
        // Serialize claims from profile/dashboard tabs, including the duplicate check.
        $lock = $pdo->prepare('SELECT id FROM nutzer WHERE id = ? FOR UPDATE');
        $lock->execute([$userId]);
        if (!$lock->fetchColumn()) throw new InvalidArgumentException('Nutzer wurde nicht gefunden.');
        $progress = fetchOnboardingProgress($pdo, $userId);
        $awards = [];
        $levelChange = null;
        if (!in_array(false, $progress['stages'][$level], true)) {
            $grant = grantAwardToUser($pdo, $userId, $awardId, $level);
            if ($grant['created']) $awards[] = $grant['award'];
            $levelChange = updateUserLevelIfChanged($pdo, $userId);
        }
        $pdo->commit();
        return ['awards' => $awards, 'level_change' => $levelChange];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
