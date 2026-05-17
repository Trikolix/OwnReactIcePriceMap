<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/summer_campaign.php';
require_once __DIR__ . '/../awards/awards_cache.php';

ensureSummerCampaignTables($pdo);

$dryRun = in_array('--dry-run', $argv, true);

function fetchCentralSummerAwardId(PDO $pdo, bool $dryRun): int
{
    $stmt = $pdo->prepare("SELECT id FROM awards WHERE code = :code LIMIT 1");
    $stmt->execute(['code' => SUMMER_CAMPAIGN_SHOP_AWARD_CODE]);
    $awardId = (int)$stmt->fetchColumn();
    if ($awardId > 0) {
        return $awardId;
    }

    if ($dryRun) {
        return 0;
    }

    $insert = $pdo->prepare(
        "INSERT INTO awards (code, category, visibility, is_repeatable, repeat_xp_type)
         VALUES (:code, 'Sommer-Sammelaktion 2026', 'public', 0, 'full')"
    );
    $insert->execute(['code' => SUMMER_CAMPAIGN_SHOP_AWARD_CODE]);

    return (int)$pdo->lastInsertId();
}

function nextCentralSummerAwardLevel(PDO $pdo, int $awardId): int
{
    $stmt = $pdo->prepare("SELECT COALESCE(MAX(level), 0) + 1 FROM award_levels WHERE award_id = :award_id");
    $stmt->execute(['award_id' => $awardId]);

    return max(1, (int)$stmt->fetchColumn());
}

function hasUserAwardComments(PDO $pdo): bool
{
    $stmt = $pdo->query("SHOW COLUMNS FROM kommentare LIKE 'user_award_id'");
    return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
}

function moveSummerUserAwards(PDO $pdo, int $oldAwardId, int $oldAwardLevel, int $centralAwardId, int $centralLevel, bool $hasAwardComments): void
{
    if ($oldAwardId <= 0 || $oldAwardLevel <= 0 || ($oldAwardId === $centralAwardId && $oldAwardLevel === $centralLevel)) {
        return;
    }

    $stmt = $pdo->prepare(
        "SELECT
            old_ua.id,
            old_ua.user_id,
            central_ua.id AS central_user_award_id
         FROM user_awards old_ua
         LEFT JOIN user_awards central_ua
           ON central_ua.user_id = old_ua.user_id
          AND central_ua.award_id = :central_award_id
          AND central_ua.level = :central_level
         WHERE old_ua.award_id = :old_award_id
           AND old_ua.level = :old_award_level"
    );
    $stmt->execute([
        'central_award_id' => $centralAwardId,
        'central_level' => $centralLevel,
        'old_award_id' => $oldAwardId,
        'old_award_level' => $oldAwardLevel,
    ]);

    $updateAward = $pdo->prepare("UPDATE user_awards SET award_id = :award_id, level = :level WHERE id = :id");
    $deleteAward = $pdo->prepare("DELETE FROM user_awards WHERE id = :id");
    $moveComments = $hasAwardComments
        ? $pdo->prepare("UPDATE kommentare SET user_award_id = :target_id WHERE user_award_id = :source_id")
        : null;

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $oldUserAwardId = (int)$row['id'];
        $centralUserAwardId = (int)($row['central_user_award_id'] ?? 0);

        if ($centralUserAwardId > 0) {
            if ($moveComments) {
                $moveComments->execute([
                    'target_id' => $centralUserAwardId,
                    'source_id' => $oldUserAwardId,
                ]);
            }
            $deleteAward->execute(['id' => $oldUserAwardId]);
            continue;
        }

        $updateAward->execute([
            'award_id' => $centralAwardId,
            'level' => $centralLevel,
            'id' => $oldUserAwardId,
        ]);
    }
}

$centralAwardId = fetchCentralSummerAwardId($pdo, $dryRun);
$hasAwardComments = $dryRun ? false : hasUserAwardComments($pdo);

$shopsStmt = $pdo->prepare(
    "SELECT
        scs.id AS summer_shop_id,
        scs.eisdiele_id,
        scs.award_id AS old_award_id,
        scs.award_level AS old_award_level,
        e.name AS shop_name,
        al.title_de,
        al.description_de,
        al.icon_path,
        al.ep
     FROM summer_campaign_shops scs
     JOIN eisdielen e ON e.id = scs.eisdiele_id
     LEFT JOIN award_levels al ON al.award_id = scs.award_id AND al.level = scs.award_level
     WHERE scs.campaign_id = :campaign_id
     ORDER BY scs.id"
);
$shopsStmt->execute(['campaign_id' => SUMMER_CAMPAIGN_ID]);
$shops = $shopsStmt->fetchAll(PDO::FETCH_ASSOC);

$migrated = 0;
$skipped = 0;

foreach ($shops as $shop) {
    $shopId = (int)$shop['eisdiele_id'];
    $oldAwardId = (int)($shop['old_award_id'] ?? 0);
    $oldAwardLevel = (int)($shop['old_award_level'] ?? 0);

    if ($centralAwardId > 0) {
        $levelStmt = $pdo->prepare(
            "SELECT level FROM award_levels WHERE award_id = :award_id AND threshold = :shop_id LIMIT 1"
        );
        $levelStmt->execute([
            'award_id' => $centralAwardId,
            'shop_id' => $shopId,
        ]);
        $centralLevel = (int)$levelStmt->fetchColumn();
    } else {
        $centralLevel = 0;
    }

    if ($centralLevel <= 0) {
        $centralLevel = $centralAwardId > 0 ? nextCentralSummerAwardLevel($pdo, $centralAwardId) : 1;
    }

    $title = trim((string)($shop['title_de'] ?? ''));
    if ($title === '') {
        $title = 'Sammelkarte: ' . $shop['shop_name'];
    }

    $description = trim((string)($shop['description_de'] ?? ''));
    if ($description === '') {
        $description = 'Du hast diese Sommer-Sammelkarte freigeschaltet.';
    }

    $line = sprintf(
        '#%d %s: Award %d/%d -> %s/%d, threshold=%d',
        $shopId,
        $shop['shop_name'],
        $oldAwardId,
        $oldAwardLevel,
        $centralAwardId > 0 ? (string)$centralAwardId : '(new)',
        $centralLevel,
        $shopId
    );

    if ($oldAwardId === $centralAwardId && $oldAwardLevel === $centralLevel) {
        echo "[skip] {$line}\n";
        $skipped++;
        continue;
    }

    echo ($dryRun ? '[dry-run] ' : '[migrate] ') . $line . "\n";
    if ($dryRun) {
        $migrated++;
        continue;
    }

    $pdo->beginTransaction();
    try {
        $upsertLevel = $pdo->prepare(
            "INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de)
             VALUES (:award_id, :level, :threshold, :ep, :icon_path, :title_de, :description_de)
             ON DUPLICATE KEY UPDATE
                threshold = VALUES(threshold),
                ep = VALUES(ep),
                icon_path = COALESCE(VALUES(icon_path), icon_path),
                title_de = VALUES(title_de),
                description_de = VALUES(description_de)"
        );
        $upsertLevel->execute([
            'award_id' => $centralAwardId,
            'level' => $centralLevel,
            'threshold' => $shopId,
            'ep' => (int)($shop['ep'] ?? 25),
            'icon_path' => $shop['icon_path'] ?: null,
            'title_de' => $title,
            'description_de' => $description,
        ]);

        moveSummerUserAwards($pdo, $oldAwardId, $oldAwardLevel, $centralAwardId, $centralLevel, $hasAwardComments);

        $updateShop = $pdo->prepare(
            "UPDATE summer_campaign_shops
             SET award_id = :award_id, award_level = :award_level
             WHERE id = :id"
        );
        $updateShop->execute([
            'award_id' => $centralAwardId,
            'award_level' => $centralLevel,
            'id' => (int)$shop['summer_shop_id'],
        ]);

        $pdo->commit();
        $migrated++;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

if (!$dryRun) {
    invalidateAwardsCache();
}

echo "Fertig. Migriert: {$migrated}, übersprungen: {$skipped}" . ($dryRun ? ' (dry-run)' : '') . "\n";
