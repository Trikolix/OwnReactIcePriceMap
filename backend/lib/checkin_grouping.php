<?php

function fetchCheckinRowsForUpdate(PDO $pdo, array $checkinIds): array
{
    $ids = array_values(array_unique(array_map('intval', $checkinIds)));
    if (empty($ids)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, group_id FROM checkins WHERE id IN ($placeholders) FOR UPDATE");
    $stmt->execute($ids);

    $rows = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $rows[(int)$row['id']] = [
            'id' => (int)$row['id'],
            'group_id' => $row['group_id'] !== null ? (int)$row['group_id'] : null,
        ];
    }

    return $rows;
}

function createCheckinGroup(PDO $pdo): int
{
    $pdo->exec("INSERT INTO checkin_groups () VALUES ()");
    return (int)$pdo->lastInsertId();
}

function cleanupUnusedCheckinGroups(PDO $pdo, array $groupIds): void
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $groupIds))));
    if (empty($ids)) {
        return;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "
        DELETE cg
        FROM checkin_groups cg
        LEFT JOIN checkins c ON c.group_id = cg.id
        WHERE cg.id IN ($placeholders)
          AND c.id IS NULL
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($ids);
}

function resolveOrMergeCheckinGroup(PDO $pdo, array $checkinIds): ?int
{
    $checkinIds = array_values(array_unique(array_map('intval', $checkinIds)));
    if (empty($checkinIds)) {
        return null;
    }

    sort($checkinIds);
    $rows = fetchCheckinRowsForUpdate($pdo, $checkinIds);
    if (empty($rows)) {
        return null;
    }

    $existingGroupIds = [];
    foreach ($rows as $row) {
        if ($row['group_id'] !== null) {
            $existingGroupIds[] = $row['group_id'];
        }
    }
    $existingGroupIds = array_values(array_unique($existingGroupIds));
    sort($existingGroupIds);

    if (empty($existingGroupIds)) {
        $targetGroupId = createCheckinGroup($pdo);
    } else {
        $targetGroupId = (int)$existingGroupIds[0];
        if (count($existingGroupIds) > 1) {
            $mergeIds = array_slice($existingGroupIds, 1);
            $placeholders = implode(',', array_fill(0, count($mergeIds), '?'));
            $updateSql = "UPDATE checkins SET group_id = ? WHERE group_id IN ($placeholders)";
            $stmtUpdate = $pdo->prepare($updateSql);
            $stmtUpdate->execute(array_merge([$targetGroupId], $mergeIds));
            cleanupUnusedCheckinGroups($pdo, $mergeIds);
        }
    }

    $updateCheckinSql = "
        UPDATE checkins
        SET group_id = ?
        WHERE id IN (" . implode(',', array_fill(0, count($checkinIds), '?')) . ")
          AND (group_id IS NULL OR group_id <> ?)
    ";
    $params = array_merge([$targetGroupId], $checkinIds, [$targetGroupId]);
    $stmtUpdateCheckins = $pdo->prepare($updateCheckinSql);
    $stmtUpdateCheckins->execute($params);

    return $targetGroupId;
}

