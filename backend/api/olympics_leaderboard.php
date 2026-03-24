<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/seasonal_results.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);

try {
    $rows = getArchivedCampaignResults($pdo, 'olympics_2026');

    if (!empty($rows)) {
        $leaderboard = [];
        $breakdowns = [];
        $userRank = null;

        foreach ($rows as $row) {
            $payload = decodeArchivedPayload($row['payload_json'] ?? null);
            $uid = isset($row['user_id']) ? (int)$row['user_id'] : 0;
            $leaderboard[] = [
                'rank' => (int)$row['rank_position'],
                'user_id' => $uid,
                'username' => $row['username_snapshot'],
                'total_xp' => (int)$row['score'],
            ];
            $breakdowns[$uid] = [
                'breakdown' => $payload['points']['breakdown'] ?? [],
                'counts' => $payload['counts'] ?? [],
                'total_xp' => (int)$row['score'],
            ];

            if ($userId > 0 && $uid === $userId) {
                $userRank = [
                    'rank' => (int)$row['rank_position'],
                    'user_id' => $uid,
                    'total_xp' => (int)$row['score'],
                ];
            }
        }

        echo json_encode([
            'leaderboard' => $leaderboard,
            'breakdowns' => $breakdowns,
            'user_rank' => $userRank,
            'archived' => true,
        ]);
        exit;
    }

    echo json_encode([
        'leaderboard' => [],
        'breakdowns' => [],
        'user_rank' => null,
        'archived' => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
