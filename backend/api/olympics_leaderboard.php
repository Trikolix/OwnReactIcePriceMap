<?php
require_once __DIR__ . '/../db_connect.php';

$userId = intval($_GET['user_id'] ?? $_GET['nutzer_id'] ?? 0);

try {
    $stmt = $pdo->prepare(
        "SELECT oup.user_id, n.username, oup.total_xp
         FROM olympics_user_progress oup
         JOIN nutzer n ON n.id = oup.user_id
         ORDER BY oup.total_xp DESC, oup.updated_at ASC, oup.user_id ASC"
    );
    $stmt->execute();
    $topRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $leaderboard = [];
    $currentRank = 0;
    $lastXp = null;
    foreach ($topRows as $index => $row) {
        $xp = (int)$row['total_xp'];
        if ($lastXp === null || $xp < $lastXp) {
            $currentRank = $index + 1;
            $lastXp = $xp;
        }
        $leaderboard[] = [
            'rank' => $currentRank,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'total_xp' => $xp,
        ];
    }

    $userRank = null;
    if ($userId > 0) {
        $stmt = $pdo->prepare(
            "SELECT total_xp FROM olympics_user_progress WHERE user_id = :user_id LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $userXp = $stmt->fetchColumn();

        if ($userXp !== false) {
            $userXp = (int)$userXp;
            $stmt = $pdo->prepare(
                "SELECT COUNT(DISTINCT total_xp) FROM olympics_user_progress WHERE total_xp > :xp"
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
        'user_rank' => $userRank,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
