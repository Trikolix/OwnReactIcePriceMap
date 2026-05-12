<?php
require_once __DIR__ . '/../awards/auth_awards_admin.php';
require_once __DIR__ . '/../lib/summer_campaign.php';
require_once __DIR__ . '/../awards/awards_cache.php';
require_once __DIR__ . '/../awards/award_icon_variants.php';

header('Content-Type: application/json');
ensureSummerCampaignTables($pdo);

function readSummerAdminJson(): array
{
    if (!empty($_POST)) {
        return $_POST;
    }

    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function slugifySummerAwardPart(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '_', $value);
    $value = trim($value ?? '', '_');
    return $value !== '' ? $value : 'award';
}

function normalizeSummerBool($value): bool
{
    return $value === true || $value === 1 || $value === '1' || $value === 'true' || $value === 'on';
}

function storeSummerAwardIcon(string $fileKey): ?string
{
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $uploadDir = 'uploads/award_icons/';
    $absoluteDir = dirname(__DIR__, 2) . '/' . $uploadDir;
    if (!is_dir($absoluteDir) && !@mkdir($absoluteDir, 0775, true) && !is_dir($absoluteDir)) {
        throw new RuntimeException('Icon-Upload-Verzeichnis konnte nicht erstellt werden.');
    }

    $originalName = basename((string)$_FILES[$fileKey]['name']);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
        throw new RuntimeException('Nur JPG, PNG und WebP sind als Award-Icon erlaubt.');
    }

    $filename = uniqid('summer_award_', true) . '.' . $extension;
    $relativePath = $uploadDir . $filename;
    $targetPath = dirname(__DIR__, 2) . '/' . $relativePath;

    if (!move_uploaded_file($_FILES[$fileKey]['tmp_name'], $targetPath)) {
        throw new RuntimeException('Award-Icon konnte nicht gespeichert werden.');
    }

    awardIconCreateVariant($relativePath);
    return $relativePath;
}

function upsertSummerAward(PDO $pdo, string $code, string $category, int $level, int $threshold, int $ep, string $title, string $description, ?string $iconPath): array
{
    $awardStmt = $pdo->prepare("SELECT id FROM awards WHERE code = :code LIMIT 1");
    $awardStmt->execute(['code' => $code]);
    $awardId = (int)$awardStmt->fetchColumn();

    if ($awardId <= 0) {
        $insertAward = $pdo->prepare("INSERT INTO awards (code, category, visibility, is_repeatable, repeat_xp_type) VALUES (:code, :category, 'public', 0, 'full')");
        $insertAward->execute([
            'code' => $code,
            'category' => $category,
        ]);
        $awardId = (int)$pdo->lastInsertId();
    } else {
        $updateAward = $pdo->prepare("UPDATE awards SET category = :category WHERE id = :award_id");
        $updateAward->execute([
            'category' => $category,
            'award_id' => $awardId,
        ]);
    }

    $existingStmt = $pdo->prepare("SELECT icon_path FROM award_levels WHERE award_id = :award_id AND level = :level LIMIT 1");
    $existingStmt->execute([
        'award_id' => $awardId,
        'level' => $level,
    ]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    $nextIconPath = $iconPath ?: ($existing['icon_path'] ?? null);

    if ($existing) {
        $stmt = $pdo->prepare(
            "UPDATE award_levels
             SET threshold = :threshold,
                 ep = :ep,
                 title_de = :title_de,
                 description_de = :description_de,
                 icon_path = :icon_path
             WHERE award_id = :award_id AND level = :level"
        );
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de)
             VALUES (:award_id, :level, :threshold, :ep, :icon_path, :title_de, :description_de)"
        );
    }

    $stmt->execute([
        'award_id' => $awardId,
        'level' => $level,
        'threshold' => $threshold,
        'ep' => $ep,
        'icon_path' => $nextIconPath,
        'title_de' => $title,
        'description_de' => $description,
    ]);

    invalidateAwardsCache();

    return [
        'award_id' => $awardId,
        'award_level' => $level,
        'icon_path' => $nextIconPath,
    ];
}

function getNextSummerAwardLevel(PDO $pdo, int $awardId): int
{
    $stmt = $pdo->prepare("SELECT COALESCE(MAX(level), 0) + 1 FROM award_levels WHERE award_id = :award_id");
    $stmt->execute(['award_id' => $awardId]);
    return max(1, (int)$stmt->fetchColumn());
}

function resolveSummerShopAwardLevel(PDO $pdo, string $awardCode, int $shopId): int
{
    $stmt = $pdo->prepare(
        "SELECT al.level
         FROM awards a
         JOIN award_levels al ON al.award_id = a.id
         WHERE a.code = :award_code
           AND al.threshold = :shop_id
         LIMIT 1"
    );
    $stmt->execute([
        'award_code' => $awardCode,
        'shop_id' => $shopId,
    ]);
    $existingLevel = (int)$stmt->fetchColumn();
    if ($existingLevel > 0) {
        return $existingLevel;
    }

    $awardStmt = $pdo->prepare("SELECT id FROM awards WHERE code = :award_code LIMIT 1");
    $awardStmt->execute(['award_code' => $awardCode]);
    $awardId = (int)$awardStmt->fetchColumn();
    if ($awardId <= 0) {
        return 1;
    }

    return getNextSummerAwardLevel($pdo, $awardId);
}

function generateUniqueSummerQrCode(PDO $pdo): string
{
    do {
        $code = bin2hex(random_bytes(18));
        $stmt = $pdo->prepare("SELECT 1 FROM qr_codes WHERE code = :code LIMIT 1");
        $stmt->execute(['code' => $code]);
    } while ($stmt->fetchColumn());

    return $code;
}

function fetchSummerAdminState(PDO $pdo): array
{
    $config = getSummerCampaignConfig($pdo, SUMMER_CAMPAIGN_ID);
    $progress = getSummerCampaignProgress($pdo, null, SUMMER_CAMPAIGN_ID);

    $rulesStmt = $pdo->prepare(
        "SELECT r.*, al.title_de, al.description_de, al.icon_path, al.ep
         FROM summer_campaign_bonus_rules r
         LEFT JOIN award_levels al ON al.award_id = r.award_id AND al.level = r.award_level
         WHERE r.campaign_id = :campaign_id
         ORDER BY r.rule_type, r.target_value, r.category"
    );
    $rulesStmt->execute(['campaign_id' => SUMMER_CAMPAIGN_ID]);

    $shopsStmt = $pdo->prepare(
        "SELECT
            scs.*,
            q.code,
            q.name AS qr_name,
            q.valid_from,
            q.valid_until,
            e.name AS shop_name,
            e.adresse AS shop_address,
            al.title_de AS award_title,
            al.description_de AS award_description,
            al.icon_path AS award_icon,
            al.ep AS award_ep
         FROM summer_campaign_shops scs
         JOIN qr_codes q ON q.id = scs.qr_code_id
         JOIN eisdielen e ON e.id = scs.eisdiele_id
         LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
         WHERE scs.campaign_id = :campaign_id
         ORDER BY COALESCE(scs.sort_order, 0), e.name"
    );
    $shopsStmt->execute(['campaign_id' => SUMMER_CAMPAIGN_ID]);
    $shopRows = $shopsStmt->fetchAll(PDO::FETCH_ASSOC);
    $categoryMap = fetchSummerCampaignShopCategories($pdo, array_column($shopRows, 'id'));
    $shops = array_map(static function (array $row) use ($categoryMap): array {
        $categories = $categoryMap[(int)$row['id']] ?? normalizeSummerCategories($row['category'] ?? '');
        return [
            'id' => (int)$row['id'],
            'qr_code_id' => (int)$row['qr_code_id'],
            'eisdiele_id' => (int)$row['eisdiele_id'],
            'shop_name' => $row['shop_name'],
            'shop_address' => $row['shop_address'],
            'category' => implode(', ', $categories),
            'categories' => $categories,
            'sort_order' => (int)$row['sort_order'],
            'is_active' => (int)$row['is_active'] === 1,
            'award_id' => $row['award_id'] !== null ? (int)$row['award_id'] : null,
            'award_level' => $row['award_id'] !== null ? (int)$row['award_level'] : null,
            'award_title' => $row['award_title'],
            'award_description' => $row['award_description'],
            'award_icon' => $row['award_icon'],
            'award_ep' => $row['award_ep'] !== null ? (int)$row['award_ep'] : 0,
            'code' => $row['code'],
            'flyer_url' => 'https://ice-app.de/?scan=' . rawurlencode($row['code']),
            'qr_name' => $row['qr_name'],
            'valid_from' => $row['valid_from'],
            'valid_until' => $row['valid_until'],
        ];
    }, $shopRows);

    return [
        'status' => 'success',
        'config' => $config,
        'shops' => $shops,
        'rules' => $rulesStmt->fetchAll(PDO::FETCH_ASSOC),
        'public_progress' => $progress,
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $q = trim((string)($_GET['q'] ?? ''));
        if ($q !== '') {
            $stmt = $pdo->prepare(
                "SELECT id, name, adresse
                 FROM eisdielen
                 WHERE name LIKE :q OR adresse LIKE :q OR id = :id
                 ORDER BY name
                 LIMIT 20"
            );
            $stmt->execute([
                'q' => '%' . $q . '%',
                'id' => ctype_digit($q) ? (int)$q : 0,
            ]);
            echo json_encode(['status' => 'success', 'shops' => $stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(fetchSummerAdminState($pdo), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        exit;
    }

    $input = readSummerAdminJson();
    $action = (string)($input['action'] ?? '');

    if ($action === 'save_config') {
        $stmt = $pdo->prepare(
            "INSERT INTO summer_campaign_config (campaign_id, title, starts_at, ends_at, is_active)
             VALUES (:campaign_id, :title, :starts_at, :ends_at, :is_active)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                starts_at = VALUES(starts_at),
                ends_at = VALUES(ends_at),
                is_active = VALUES(is_active)"
        );
        $stmt->execute([
            'campaign_id' => SUMMER_CAMPAIGN_ID,
            'title' => trim((string)($input['title'] ?? 'Sommer-Sammelaktion 2026')),
            'starts_at' => ($input['starts_at'] ?? '') ?: null,
            'ends_at' => ($input['ends_at'] ?? '') ?: null,
            'is_active' => normalizeSummerBool($input['is_active'] ?? false) ? 1 : 0,
        ]);
    } elseif ($action === 'add_shop') {
        $shopId = (int)($input['eisdiele_id'] ?? 0);
        if ($shopId <= 0) {
            throw new InvalidArgumentException('Eisdiele fehlt.');
        }

        $shopStmt = $pdo->prepare("SELECT id, name FROM eisdielen WHERE id = :id LIMIT 1");
        $shopStmt->execute(['id' => $shopId]);
        $shop = $shopStmt->fetch(PDO::FETCH_ASSOC);
        if (!$shop) {
            throw new InvalidArgumentException('Eisdiele wurde nicht gefunden.');
        }

        $duplicateStmt = $pdo->prepare(
            "SELECT 1 FROM summer_campaign_shops WHERE campaign_id = :campaign_id AND eisdiele_id = :eisdiele_id LIMIT 1"
        );
        $duplicateStmt->execute([
            'campaign_id' => SUMMER_CAMPAIGN_ID,
            'eisdiele_id' => $shopId,
        ]);
        if ($duplicateStmt->fetchColumn()) {
            throw new InvalidArgumentException('Diese Eisdiele ist bereits in der Sommeraktion.');
        }

        $code = generateUniqueSummerQrCode($pdo);
        $config = getSummerCampaignConfig($pdo, SUMMER_CAMPAIGN_ID);
        $qrStmt = $pdo->prepare(
            "INSERT INTO qr_codes (name, code, description, created_at, valid_from, valid_until, award_type, icon_path, usage_limit, eisdiele_id)
             VALUES (:name, :code, :description, NOW(), :valid_from, :valid_until, :award_type, '', 0, :eisdiele_id)"
        );
        $qrStmt->execute([
            'name' => 'Sommer 2026: ' . $shop['name'],
            'code' => $code,
            'description' => 'Du hast eine Sammelkarte der Sommer-Sammelaktion 2026 freigeschaltet.',
            'valid_from' => $config['starts_at'],
            'valid_until' => $config['ends_at'],
            'award_type' => SUMMER_CAMPAIGN_AWARD_TYPE,
            'eisdiele_id' => $shopId,
        ]);

        $shopCategories = normalizeSummerCategories($input['category'] ?? '');
        $campaignStmt = $pdo->prepare(
            "INSERT INTO summer_campaign_shops (campaign_id, qr_code_id, eisdiele_id, category, sort_order, is_active)
             VALUES (:campaign_id, :qr_code_id, :eisdiele_id, :category, :sort_order, 1)"
        );
        $campaignStmt->execute([
            'campaign_id' => SUMMER_CAMPAIGN_ID,
            'qr_code_id' => (int)$pdo->lastInsertId(),
            'eisdiele_id' => $shopId,
            'category' => $shopCategories[0] ?? '',
            'sort_order' => (int)($input['sort_order'] ?? 0),
        ]);
        setSummerCampaignShopCategories($pdo, (int)$pdo->lastInsertId(), $shopCategories);
    } elseif ($action === 'update_shop') {
        $shopCategories = normalizeSummerCategories($input['category'] ?? '');
        $stmt = $pdo->prepare(
            "UPDATE summer_campaign_shops
             SET category = :category,
                 sort_order = :sort_order,
                 is_active = :is_active
             WHERE id = :id AND campaign_id = :campaign_id"
        );
        $stmt->execute([
            'category' => $shopCategories[0] ?? '',
            'sort_order' => (int)($input['sort_order'] ?? 0),
            'is_active' => normalizeSummerBool($input['is_active'] ?? false) ? 1 : 0,
            'id' => (int)($input['id'] ?? 0),
            'campaign_id' => SUMMER_CAMPAIGN_ID,
        ]);
        setSummerCampaignShopCategories($pdo, (int)($input['id'] ?? 0), $shopCategories);
    } elseif ($action === 'save_shop_award') {
        $shopRowId = (int)($input['id'] ?? 0);
        $shopStmt = $pdo->prepare(
            "SELECT scs.*,
                    e.name AS shop_name,
                    al.icon_path AS current_award_icon
             FROM summer_campaign_shops scs
             JOIN eisdielen e ON e.id = scs.eisdiele_id
             LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
             WHERE scs.id = :id AND scs.campaign_id = :campaign_id
             LIMIT 1"
        );
        $shopStmt->execute([
            'id' => $shopRowId,
            'campaign_id' => SUMMER_CAMPAIGN_ID,
        ]);
        $shop = $shopStmt->fetch(PDO::FETCH_ASSOC);
        if (!$shop) {
            throw new InvalidArgumentException('Sommer-Eisdiele wurde nicht gefunden.');
        }

        $iconPath = storeSummerAwardIcon('award_icon_file') ?: ($shop['current_award_icon'] ?? null);
        $shopId = (int)$shop['eisdiele_id'];
        $awardCode = SUMMER_CAMPAIGN_SHOP_AWARD_CODE;
        $awardLevel = resolveSummerShopAwardLevel($pdo, $awardCode, $shopId);
        $award = upsertSummerAward(
            $pdo,
            $awardCode,
            'Sommer-Sammelaktion 2026',
            $awardLevel,
            $shopId,
            (int)($input['award_ep'] ?? 25),
            trim((string)($input['award_title'] ?? 'Sammelkarte: ' . $shop['shop_name'])),
            trim((string)($input['award_description'] ?? 'Du hast die Sommer-Sammelkarte dieser Eisdiele freigeschaltet.')),
            $iconPath
        );

        $linkStmt = $pdo->prepare(
            "UPDATE summer_campaign_shops
             SET award_id = :award_id,
                 award_level = :award_level
             WHERE id = :id AND campaign_id = :campaign_id"
        );
        $linkStmt->execute([
            'award_id' => $award['award_id'],
            'award_level' => $award['award_level'],
            'id' => $shopRowId,
            'campaign_id' => SUMMER_CAMPAIGN_ID,
        ]);
    } elseif ($action === 'delete_shop') {
        $stmt = $pdo->prepare("DELETE FROM summer_campaign_shops WHERE id = :id AND campaign_id = :campaign_id");
        $stmt->execute([
            'id' => (int)($input['id'] ?? 0),
            'campaign_id' => SUMMER_CAMPAIGN_ID,
        ]);
    } elseif ($action === 'save_rule') {
        $awardId = (int)($input['award_id'] ?? 0);
        $awardLevel = (int)($input['award_level'] ?? 1);
        $ruleType = (string)($input['rule_type'] ?? 'scan_count');
        $targetValue = ($input['target_value'] ?? '') === '' ? null : (int)$input['target_value'];
        $category = trim((string)($input['category'] ?? '')) ?: null;

        $hasAwardDetails = trim((string)($input['award_title'] ?? '')) !== ''
            || trim((string)($input['award_description'] ?? '')) !== ''
            || isset($_FILES['award_icon_file']);

        if ($awardId <= 0 || $hasAwardDetails) {
            $ruleSuffix = $ruleType === 'category_complete'
                ? 'category_complete_' . slugifySummerAwardPart((string)$category)
                : $ruleType . '_' . (int)$targetValue;
            $fallbackTitle = $ruleType === 'category_complete'
                ? 'Sommerkategorie komplett: ' . (string)$category
                : 'Sommer-Sammelbonus ' . (int)$targetValue;
            $fallbackDescription = 'Du hast eine Bonusregel der Sommer-Sammelaktion 2026 erfüllt.';
            $iconPath = storeSummerAwardIcon('award_icon_file');
            $award = upsertSummerAward(
                $pdo,
                'summer_2026_' . $ruleSuffix,
                'Sommer-Sammelaktion 2026',
                $awardLevel > 0 ? $awardLevel : 1,
                max(1, (int)($targetValue ?? 1)),
                (int)($input['award_ep'] ?? 100),
                trim((string)($input['award_title'] ?? $fallbackTitle)),
                trim((string)($input['award_description'] ?? $fallbackDescription)),
                $iconPath
            );
            $awardId = (int)$award['award_id'];
            $awardLevel = (int)$award['award_level'];
        }

        $stmt = $pdo->prepare(
            "INSERT INTO summer_campaign_bonus_rules (campaign_id, rule_type, target_value, category, award_id, award_level, is_active)
             VALUES (:campaign_id, :rule_type, :target_value, :category, :award_id, :award_level, :is_active)
             ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)"
        );
        $stmt->execute([
            'campaign_id' => SUMMER_CAMPAIGN_ID,
            'rule_type' => $ruleType,
            'target_value' => $targetValue,
            'category' => $category,
            'award_id' => $awardId,
            'award_level' => $awardLevel,
            'is_active' => normalizeSummerBool($input['is_active'] ?? false) ? 1 : 0,
        ]);
    } elseif ($action === 'delete_rule') {
        $stmt = $pdo->prepare("DELETE FROM summer_campaign_bonus_rules WHERE id = :id AND campaign_id = :campaign_id");
        $stmt->execute([
            'id' => (int)($input['id'] ?? 0),
            'campaign_id' => SUMMER_CAMPAIGN_ID,
        ]);
    } else {
        throw new InvalidArgumentException('Unbekannte Aktion.');
    }

    echo json_encode(fetchSummerAdminState($pdo), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
?>
