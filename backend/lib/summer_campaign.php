<?php

require_once __DIR__ . '/auth.php';

const SUMMER_CAMPAIGN_ID = 'summer_2026';
const SUMMER_CAMPAIGN_AWARD_TYPE = 'summer_2026_shop';
const SUMMER_CAMPAIGN_SHOP_AWARD_CODE = 'summer_2026_shop';

function ensureSummerCampaignTables(PDO $pdo): void
{
    if (isset($GLOBALS['__summer_campaign_schema_initialized'])) {
        return;
    }
    $GLOBALS['__summer_campaign_schema_initialized'] = true;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS summer_campaign_config (
            campaign_id VARCHAR(64) NOT NULL PRIMARY KEY,
            title VARCHAR(120) NOT NULL,
            starts_at DATETIME DEFAULT NULL,
            ends_at DATETIME DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS summer_campaign_shops (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            qr_code_id BIGINT UNSIGNED NOT NULL,
            eisdiele_id INT NOT NULL,
            category VARCHAR(80) DEFAULT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            award_id INT DEFAULT NULL,
            award_level INT NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_summer_campaign_qr (campaign_id, qr_code_id),
            UNIQUE KEY uniq_summer_campaign_shop (campaign_id, eisdiele_id),
            KEY idx_summer_campaign_active (campaign_id, is_active, sort_order),
            KEY idx_summer_campaign_award (award_id, award_level),
            CONSTRAINT fk_summer_campaign_shop_qr FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_summer_campaign_shop_eisdiele FOREIGN KEY (eisdiele_id) REFERENCES eisdielen(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    ensureSummerCampaignColumn($pdo, 'summer_campaign_shops', 'award_id', 'INT DEFAULT NULL');
    ensureSummerCampaignColumn($pdo, 'summer_campaign_shops', 'award_level', 'INT NOT NULL DEFAULT 1');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS summer_campaign_shop_categories (
            id INT NOT NULL AUTO_INCREMENT,
            summer_shop_id INT NOT NULL,
            category VARCHAR(80) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_summer_shop_category (summer_shop_id, category),
            KEY idx_summer_category_name (category),
            CONSTRAINT fk_summer_category_shop FOREIGN KEY (summer_shop_id) REFERENCES summer_campaign_shops(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "INSERT IGNORE INTO summer_campaign_shop_categories (summer_shop_id, category)
         SELECT id, TRIM(category)
         FROM summer_campaign_shops
         WHERE category IS NOT NULL AND TRIM(category) <> ''"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS summer_campaign_bonus_rules (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            rule_type ENUM('scan_count','checkin_count','category_complete') NOT NULL,
            target_value INT DEFAULT NULL,
            category VARCHAR(80) DEFAULT NULL,
            award_id INT NOT NULL,
            award_level INT NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_summer_bonus_rule (campaign_id, rule_type, target_value, category, award_id, award_level),
            KEY idx_summer_bonus_campaign (campaign_id, is_active),
            CONSTRAINT fk_summer_bonus_award_level FOREIGN KEY (award_id, award_level) REFERENCES award_levels(award_id, level) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $stmt = $pdo->prepare(
        "INSERT INTO summer_campaign_config (campaign_id, title, starts_at, ends_at, is_active)
         VALUES (:campaign_id, 'Sommer-Sammelaktion 2026', '2026-05-01 00:00:00', '2026-09-30 23:59:59', 1)
         ON DUPLICATE KEY UPDATE campaign_id = campaign_id"
    );
    $stmt->execute(['campaign_id' => SUMMER_CAMPAIGN_ID]);
}

function ensureSummerCampaignColumn(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$tableName} LIKE :column_name");
    $stmt->execute(['column_name' => $columnName]);
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec("ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$definition}");
    }
}

function normalizeSummerCategories($value): array
{
    if (is_array($value)) {
        $parts = $value;
    } else {
        $parts = preg_split('/[,;\n]+/', (string)$value);
    }

    $categories = [];
    foreach ($parts as $part) {
        $category = trim((string)$part);
        if ($category === '') {
            continue;
        }
        $categories[$category] = $category;
    }

    return array_values($categories);
}

function fetchSummerCampaignShopCategories(PDO $pdo, array $summerShopIds): array
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $summerShopIds), static fn($id) => $id > 0)));
    if (empty($ids)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "SELECT summer_shop_id, category
         FROM summer_campaign_shop_categories
         WHERE summer_shop_id IN ({$placeholders})
         ORDER BY category"
    );
    $stmt->execute($ids);

    $categories = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $shopId = (int)$row['summer_shop_id'];
        if (!isset($categories[$shopId])) {
            $categories[$shopId] = [];
        }
        $categories[$shopId][] = $row['category'];
    }

    return $categories;
}

function setSummerCampaignShopCategories(PDO $pdo, int $summerShopId, $categories): void
{
    $normalized = normalizeSummerCategories($categories);

    $deleteStmt = $pdo->prepare("DELETE FROM summer_campaign_shop_categories WHERE summer_shop_id = :summer_shop_id");
    $deleteStmt->execute(['summer_shop_id' => $summerShopId]);

    if (empty($normalized)) {
        return;
    }

    $insertStmt = $pdo->prepare(
        "INSERT IGNORE INTO summer_campaign_shop_categories (summer_shop_id, category)
         VALUES (:summer_shop_id, :category)"
    );
    foreach ($normalized as $category) {
        $insertStmt->execute([
            'summer_shop_id' => $summerShopId,
            'category' => $category,
        ]);
    }
}

function getSummerCampaignConfig(PDO $pdo, string $campaignId = SUMMER_CAMPAIGN_ID): array
{
    ensureSummerCampaignTables($pdo);
    $stmt = $pdo->prepare("SELECT * FROM summer_campaign_config WHERE campaign_id = :campaign_id LIMIT 1");
    $stmt->execute(['campaign_id' => $campaignId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: [
        'campaign_id' => $campaignId,
        'title' => 'Sommer-Sammelaktion 2026',
        'starts_at' => '2026-05-01 00:00:00',
        'ends_at' => '2026-09-30 23:59:59',
        'is_active' => 1,
    ];
}

function isSummerCampaignCurrentlyActive(array $config): bool
{
    if ((int)($config['is_active'] ?? 0) !== 1) {
        return false;
    }

    $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    if (!empty($config['starts_at']) && $now < new DateTimeImmutable($config['starts_at'], new DateTimeZone('Europe/Berlin'))) {
        return false;
    }
    if (!empty($config['ends_at']) && $now > new DateTimeImmutable($config['ends_at'], new DateTimeZone('Europe/Berlin'))) {
        return false;
    }

    return true;
}

function findSummerCampaignShopByQrCode(PDO $pdo, int $qrCodeId, string $campaignId = SUMMER_CAMPAIGN_ID): ?array
{
    ensureSummerCampaignTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT
            scs.*,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.latitude,
            e.longitude,
            q.code AS qr_code,
            q.name AS qr_name,
            q.description AS qr_description,
            al.icon_path AS award_icon,
            al.title_de AS award_title,
            al.description_de AS award_description,
            al.ep AS award_ep
         FROM summer_campaign_shops scs
         JOIN eisdielen e ON e.id = scs.eisdiele_id
         JOIN qr_codes q ON q.id = scs.qr_code_id
         LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
         WHERE scs.campaign_id = :campaign_id
           AND scs.qr_code_id = :qr_code_id
         LIMIT 1"
    );
    $stmt->execute([
        'campaign_id' => $campaignId,
        'qr_code_id' => $qrCodeId,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $categoryMap = fetchSummerCampaignShopCategories($pdo, [(int)$row['id']]);
        $row['categories'] = $categoryMap[(int)$row['id']] ?? normalizeSummerCategories($row['category'] ?? '');
        $row['category'] = $row['categories'][0] ?? ($row['category'] ?: 'Sommerroute');
    }

    return $row ?: null;
}

function hasSummerCampaignCheckin(PDO $pdo, int $userId, int $shopId, array $config): bool
{
    $conditions = ["nutzer_id = :user_id", "eisdiele_id = :shop_id"];
    $params = [
        'user_id' => $userId,
        'shop_id' => $shopId,
    ];

    if (!empty($config['starts_at'])) {
        $conditions[] = "datum >= :starts_at";
        $params['starts_at'] = $config['starts_at'];
    }
    if (!empty($config['ends_at'])) {
        $conditions[] = "datum <= :ends_at";
        $params['ends_at'] = $config['ends_at'];
    }

    $stmt = $pdo->prepare("SELECT 1 FROM checkins WHERE " . implode(' AND ', $conditions) . " LIMIT 1");
    $stmt->execute($params);

    return (bool)$stmt->fetchColumn();
}

function getSummerCampaignAdminInsights(PDO $pdo, array $config, string $campaignId = SUMMER_CAMPAIGN_ID): array
{
    $checkinConditions = ["c.nutzer_id = uqs.user_id", "c.eisdiele_id = scs.eisdiele_id"];
    $checkinParams = [];
    if (!empty($config['starts_at'])) {
        $checkinConditions[] = "c.datum >= :starts_at";
        $checkinParams['starts_at'] = $config['starts_at'];
    }
    if (!empty($config['ends_at'])) {
        $checkinConditions[] = "c.datum <= :ends_at";
        $checkinParams['ends_at'] = $config['ends_at'];
    }
    $checkinJoin = implode(' AND ', $checkinConditions);

    $awardStmt = $pdo->prepare(
        "SELECT
            scs.id AS summer_shop_id,
            scs.eisdiele_id AS shop_id,
            scs.award_id,
            scs.award_level,
            e.name AS shop_name,
            COUNT(DISTINCT uqs.user_id) AS scan_count,
            COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN uqs.user_id END) AS checkin_count
         FROM summer_campaign_shops scs
         JOIN eisdielen e ON e.id = scs.eisdiele_id
         LEFT JOIN user_qr_scans uqs ON uqs.qr_code_id = scs.qr_code_id
         LEFT JOIN checkins c ON {$checkinJoin}
         WHERE scs.campaign_id = :campaign_id
           AND scs.is_active = 1
         GROUP BY scs.id, scs.eisdiele_id, scs.award_id, scs.award_level, e.name
         ORDER BY COALESCE(scs.sort_order, 0), e.name"
    );
    $awardStmt->execute(array_merge($checkinParams, ['campaign_id' => $campaignId]));
    $awards = array_map(static fn(array $row): array => [
        'summer_shop_id' => (int)$row['summer_shop_id'],
        'shop_id' => (int)$row['shop_id'],
        'shop_name' => $row['shop_name'],
        'award_id' => $row['award_id'] !== null ? (int)$row['award_id'] : null,
        'award_level' => $row['award_id'] !== null ? (int)$row['award_level'] : null,
        'scan_count' => (int)$row['scan_count'],
        'checkin_count' => (int)$row['checkin_count'],
    ], $awardStmt->fetchAll(PDO::FETCH_ASSOC));

    $rankingStmt = $pdo->prepare(
        "SELECT
            n.id AS user_id,
            n.username,
            COUNT(DISTINCT scs.id) AS scan_count,
            COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN scs.id END) AS checkin_count
         FROM user_qr_scans uqs
         JOIN summer_campaign_shops scs ON scs.qr_code_id = uqs.qr_code_id
         JOIN nutzer n ON n.id = uqs.user_id
         LEFT JOIN checkins c ON {$checkinJoin}
         WHERE scs.campaign_id = :campaign_id
           AND scs.is_active = 1
         GROUP BY n.id, n.username
         HAVING scan_count > 0
         ORDER BY scan_count DESC, checkin_count DESC, n.username ASC"
    );
    $rankingStmt->execute(array_merge($checkinParams, ['campaign_id' => $campaignId]));
    $rank = 0;
    $ranking = array_map(static function (array $row) use (&$rank): array {
        $rank++;
        return [
            'rank' => $rank,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'scan_count' => (int)$row['scan_count'],
            'checkin_count' => (int)$row['checkin_count'],
        ];
    }, $rankingStmt->fetchAll(PDO::FETCH_ASSOC));

    return [
        'awards' => $awards,
        'ranking' => $ranking,
    ];
}

function getSummerCampaignProgress(PDO $pdo, ?int $userId = null, string $campaignId = SUMMER_CAMPAIGN_ID): array
{
    ensureSummerCampaignTables($pdo);
    $config = getSummerCampaignConfig($pdo, $campaignId);

    $scanJoin = $userId
        ? "LEFT JOIN user_qr_scans uqs ON uqs.qr_code_id = scs.qr_code_id AND uqs.user_id = :user_id"
        : "LEFT JOIN user_qr_scans uqs ON 1 = 0";

    $stmt = $pdo->prepare(
        "SELECT
            scs.id,
            scs.campaign_id,
            scs.qr_code_id,
            scs.eisdiele_id,
            scs.category,
            scs.sort_order,
            scs.is_active,
            scs.award_id,
            scs.award_level,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.latitude,
            e.longitude,
            q.code AS qr_code,
            q.name AS qr_name,
            q.description AS qr_description,
            al.icon_path AS award_icon,
            al.title_de AS award_title,
            al.description_de AS award_description,
            al.ep AS award_ep,
            uqs.scanned_at
         FROM summer_campaign_shops scs
         JOIN eisdielen e ON e.id = scs.eisdiele_id
         JOIN qr_codes q ON q.id = scs.qr_code_id
         LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
         {$scanJoin}
         WHERE scs.campaign_id = :campaign_id
           AND scs.is_active = 1
         ORDER BY COALESCE(scs.sort_order, 0), e.name"
    );
    $params = ['campaign_id' => $campaignId];
    if ($userId) {
        $params['user_id'] = $userId;
    }
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $categoryMap = fetchSummerCampaignShopCategories($pdo, array_column($rows, 'id'));

    $items = [];
    $categories = [];
    $collectedCount = 0;
    $checkinCount = 0;

    foreach ($rows as $row) {
        $collected = !empty($row['scanned_at']);
        $checkinConfirmed = $userId ? hasSummerCampaignCheckin($pdo, $userId, (int)$row['eisdiele_id'], $config) : false;
        if ($collected) {
            $collectedCount++;
        }
        if ($collected && $checkinConfirmed) {
            $checkinCount++;
        }

        $shopCategories = $categoryMap[(int)$row['id']] ?? normalizeSummerCategories($row['category'] ?? '');
        foreach ($shopCategories as $category) {
            if (!isset($categories[$category])) {
                $categories[$category] = ['total' => 0, 'collected' => 0, 'checkins' => 0];
            }
            $categories[$category]['total']++;
            if ($collected) {
                $categories[$category]['collected']++;
            }
            if ($collected && $checkinConfirmed) {
                $categories[$category]['checkins']++;
            }
        }

        $items[] = [
            'id' => (int)$row['id'],
            'qr_code_id' => (int)$row['qr_code_id'],
            'shop_id' => (int)$row['eisdiele_id'],
            'shop_name' => $row['shop_name'],
            'shop_address' => $row['shop_address'],
            'lat' => $row['latitude'] !== null ? (float)$row['latitude'] : null,
            'lng' => $row['longitude'] !== null ? (float)$row['longitude'] : null,
            'category' => $shopCategories[0] ?? 'Sommerroute',
            'categories' => $shopCategories,
            'award_id' => $row['award_id'] !== null ? (int)$row['award_id'] : null,
            'award_level' => $row['award_id'] !== null ? (int)$row['award_level'] : null,
            'award_icon' => $row['award_icon'] ?? null,
            'award_title' => $row['award_title'] ?? null,
            'award_description' => $row['award_description'] ?? null,
            'award_ep' => $row['award_ep'] !== null ? (int)$row['award_ep'] : 0,
            'collected' => $collected,
            'scanned_at' => $row['scanned_at'],
            'checkin_confirmed' => $collected && $checkinConfirmed,
        ];
    }

    $response = [
        'campaign' => [
            'id' => $config['campaign_id'],
            'title' => $config['title'],
            'starts_at' => $config['starts_at'],
            'ends_at' => $config['ends_at'],
            'is_active' => (int)$config['is_active'] === 1,
            'is_running' => isSummerCampaignCurrentlyActive($config),
        ],
        'summary' => [
            'total' => count($items),
            'collected' => $collectedCount,
            'missing' => max(0, count($items) - $collectedCount),
            'checkins' => $checkinCount,
        ],
        'categories' => $categories,
        'shops' => $items,
    ];

    if ((int)$userId === 1) {
        $response['admin_insights'] = getSummerCampaignAdminInsights($pdo, $config, $campaignId);
    }

    return $response;
}

function buildSummerAwardPayload(PDO $pdo, int $awardId, int $awardLevel): ?array
{
    $stmt = $pdo->prepare(
        "SELECT icon_path, title_de, description_de, ep
         FROM award_levels
         WHERE award_id = :award_id AND level = :award_level
         LIMIT 1"
    );
    $stmt->execute([
        'award_id' => $awardId,
        'award_level' => $awardLevel,
    ]);
    $level = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$level) {
        return null;
    }

    return [
        'award_id' => $awardId,
        'level' => $awardLevel,
        'title' => $level['title_de'],
        'message' => $level['description_de'],
        'icon' => $level['icon_path'],
        'ep' => (int)$level['ep'],
    ];
}

function getSummerShopAwardPayload(PDO $pdo, array $summerCampaignShop): ?array
{
    $awardId = isset($summerCampaignShop['award_id']) ? (int)$summerCampaignShop['award_id'] : 0;
    $awardLevel = isset($summerCampaignShop['award_level']) ? (int)$summerCampaignShop['award_level'] : 1;
    if ($awardId <= 0 || $awardLevel <= 0) {
        return null;
    }

    return buildSummerAwardPayload($pdo, $awardId, $awardLevel);
}

function userHasAwardLevel(PDO $pdo, int $userId, int $awardId, int $awardLevel): bool
{
    $stmt = $pdo->prepare(
        "SELECT 1 FROM user_awards
         WHERE user_id = :user_id AND award_id = :award_id AND level = :award_level
         LIMIT 1"
    );
    $stmt->execute([
        'user_id' => $userId,
        'award_id' => $awardId,
        'award_level' => $awardLevel,
    ]);

    return (bool)$stmt->fetchColumn();
}

function storeSummerAwardIfNew(PDO $pdo, int $userId, int $awardId, int $awardLevel): bool
{
    if (userHasAwardLevel($pdo, $userId, $awardId, $awardLevel)) {
        return false;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO user_awards (user_id, award_id, level)
         VALUES (:user_id, :award_id, :award_level)"
    );
    return $stmt->execute([
        'user_id' => $userId,
        'award_id' => $awardId,
        'award_level' => $awardLevel,
    ]);
}

function grantSummerShopAward(PDO $pdo, int $userId, array $summerCampaignShop): ?array
{
    $awardId = isset($summerCampaignShop['award_id']) ? (int)$summerCampaignShop['award_id'] : 0;
    $awardLevel = isset($summerCampaignShop['award_level']) ? (int)$summerCampaignShop['award_level'] : 1;
    if ($awardId <= 0 || $awardLevel <= 0) {
        return null;
    }

    if (!storeSummerAwardIfNew($pdo, $userId, $awardId, $awardLevel)) {
        return null;
    }

    return buildSummerAwardPayload($pdo, $awardId, $awardLevel);
}

function evaluateSummerCampaignBonusAwards(PDO $pdo, int $userId, string $campaignId = SUMMER_CAMPAIGN_ID): array
{
    ensureSummerCampaignTables($pdo);
    $progress = getSummerCampaignProgress($pdo, $userId, $campaignId);
    $config = $progress['campaign'];
    if (empty($config['is_active'])) {
        return [];
    }

    $stmt = $pdo->prepare(
        "SELECT *
         FROM summer_campaign_bonus_rules
         WHERE campaign_id = :campaign_id
           AND is_active = 1
         ORDER BY rule_type, target_value, category"
    );
    $stmt->execute(['campaign_id' => $campaignId]);
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $achievements = [];
    foreach ($rules as $rule) {
        $passed = false;
        $ruleType = (string)$rule['rule_type'];
        $targetValue = (int)($rule['target_value'] ?? 0);
        $category = trim((string)($rule['category'] ?? ''));

        if ($ruleType === 'scan_count') {
            $passed = (int)$progress['summary']['collected'] >= $targetValue;
        } elseif ($ruleType === 'checkin_count') {
            $passed = (int)$progress['summary']['checkins'] >= $targetValue;
        } elseif ($ruleType === 'category_complete' && $category !== '') {
            $categoryStats = $progress['categories'][$category] ?? null;
            $passed = $categoryStats && (int)$categoryStats['total'] > 0
                && (int)$categoryStats['collected'] >= (int)$categoryStats['total'];
        }

        if (!$passed) {
            continue;
        }

        $awardId = (int)$rule['award_id'];
        $awardLevel = (int)$rule['award_level'];
        if (storeSummerAwardIfNew($pdo, $userId, $awardId, $awardLevel)) {
            $payload = buildSummerAwardPayload($pdo, $awardId, $awardLevel);
            if ($payload) {
                $achievements[] = $payload;
            }
        }
    }

    return $achievements;
}

?>
