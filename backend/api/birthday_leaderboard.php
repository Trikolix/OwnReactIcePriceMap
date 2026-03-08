<?php
require_once __DIR__ . '/../db_connect.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);

try {
    $snapshotTableExistsStmt = $pdo->query(
        "SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name = 'leaderboard_daily_snapshots'"
    );
    $hasSnapshotTable = ((int)$snapshotTableExistsStmt->fetchColumn()) > 0;

    $previousSnapshotByUser = [];
    if ($hasSnapshotTable) {
        $dateStmt = $pdo->prepare(
            "SELECT MAX(snapshot_date)
             FROM leaderboard_daily_snapshots
             WHERE leaderboard_type = :leaderboard_type
               AND snapshot_date < CURDATE()"
        );
        $dateStmt->execute(['leaderboard_type' => 'birthday']);
        $previousSnapshotDate = $dateStmt->fetchColumn();

        if ($previousSnapshotDate) {
            $snapshotStmt = $pdo->prepare(
                "SELECT user_id, rank_position, score
                 FROM leaderboard_daily_snapshots
                 WHERE leaderboard_type = :leaderboard_type
                   AND snapshot_date = :snapshot_date"
            );
            $snapshotStmt->execute([
                'leaderboard_type' => 'birthday',
                'snapshot_date' => $previousSnapshotDate,
            ]);

            foreach ($snapshotStmt->fetchAll(PDO::FETCH_ASSOC) as $snapshotRow) {
                $previousSnapshotByUser[(int)$snapshotRow['user_id']] = [
                    'rank' => (int)$snapshotRow['rank_position'],
                    'score' => (int)$snapshotRow['score'],
                ];
            }
        }
    }

    $stmt = $pdo->prepare(
        "SELECT bup.user_id, n.username, bup.total_xp, bup.mandatory_completed, bup.bonus_completed
         FROM birthday_user_progress bup
         JOIN nutzer n ON n.id = bup.user_id
         ORDER BY bup.total_xp DESC, bup.mandatory_completed DESC, bup.updated_at ASC, bup.user_id ASC"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $leaderboard = [];
    $breakdowns = [];
    $currentRank = 0;
    $lastXp = null;

    foreach ($rows as $index => $row) {
        $xp = (int)$row['total_xp'];
        if ($lastXp === null || $xp < $lastXp) {
            $currentRank = $index + 1;
            $lastXp = $xp;
        }

        $uid = (int)$row['user_id'];
        $rankChange = null;
        $rankDelta = null;
        if (isset($previousSnapshotByUser[$uid])) {
            $previousRank = (int)$previousSnapshotByUser[$uid]['rank'];
            $rankDelta = abs($previousRank - $currentRank);
            if ($previousRank > $currentRank) {
                $rankChange = 'up';
            } elseif ($previousRank < $currentRank) {
                $rankChange = 'down';
            } else {
                $rankChange = 'same';
            }
        } elseif (!empty($previousSnapshotByUser)) {
            $rankChange = 'new';
            $rankDelta = null;
        }

        $leaderboard[] = [
            'rank' => $currentRank,
            'user_id' => $uid,
            'username' => $row['username'],
            'total_xp' => $xp,
            'mandatory_completed' => (int)$row['mandatory_completed'],
            'bonus_completed' => (int)$row['bonus_completed'],
            'rank_change' => $rankChange,
            'rank_delta' => $rankDelta,
        ];

        $breakdowns[$uid] = [
            'mandatory_completed' => (int)$row['mandatory_completed'],
            'bonus_completed' => (int)$row['bonus_completed'],
            'total_xp' => $xp,
        ];
    }

    $userRank = null;
    if ($userId > 0) {
        $stmt = $pdo->prepare(
            "SELECT total_xp FROM birthday_user_progress WHERE user_id = :user_id LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $userXp = $stmt->fetchColumn();

        if ($userXp !== false) {
            $userXp = (int)$userXp;
            $stmt = $pdo->prepare(
                "SELECT COUNT(DISTINCT total_xp) FROM birthday_user_progress WHERE total_xp > :xp"
            );
            $stmt->execute(['xp' => $userXp]);
            $higherDistinct = (int)$stmt->fetchColumn();
            $userRank = [
                'rank' => $higherDistinct + 1,
                'user_id' => $userId,
                'total_xp' => $userXp,
            ];
        }
    }

    echo json_encode([
        'leaderboard' => $leaderboard,
        'breakdowns' => $breakdowns,
        'user_rank' => $userRank,
        'trend_reference_available' => !empty($previousSnapshotByUser),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
