<?php
require_once __DIR__ . '/../db_connect.php';

date_default_timezone_set('Europe/Berlin');
$leaderboardType = 'birthday';
$snapshotDate = (new DateTimeImmutable('today'))->format('Y-m-d');

$createTableSql = <<<SQL
CREATE TABLE IF NOT EXISTS leaderboard_daily_snapshots (
  id INT NOT NULL AUTO_INCREMENT,
  leaderboard_type VARCHAR(64) NOT NULL,
  snapshot_date DATE NOT NULL,
  user_id INT NOT NULL,
  rank_position INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  payload_json JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_leaderboard_snapshot_user (leaderboard_type, snapshot_date, user_id),
  KEY idx_leaderboard_snapshot_lookup (leaderboard_type, snapshot_date, rank_position),
  CONSTRAINT fk_leaderboard_snapshot_user FOREIGN KEY (user_id) REFERENCES nutzer (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL;

try {
    $pdo->exec($createTableSql);

    $stmt = $pdo->prepare(
        "SELECT bup.user_id, bup.total_xp, bup.mandatory_completed, bup.bonus_completed
         FROM birthday_user_progress bup
         ORDER BY bup.total_xp DESC, bup.mandatory_completed DESC, bup.updated_at ASC, bup.user_id ASC"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insertStmt = $pdo->prepare(
        "INSERT INTO leaderboard_daily_snapshots
            (leaderboard_type, snapshot_date, user_id, rank_position, score, payload_json)
         VALUES
            (:leaderboard_type, :snapshot_date, :user_id, :rank_position, :score, :payload_json)
         ON DUPLICATE KEY UPDATE
            rank_position = VALUES(rank_position),
            score = VALUES(score),
            payload_json = VALUES(payload_json)"
    );

    $rank = 0;
    $lastScore = null;
    foreach ($rows as $index => $row) {
        $score = (int)$row['total_xp'];
        if ($lastScore === null || $score < $lastScore) {
            $rank = $index + 1;
            $lastScore = $score;
        }

        $payload = json_encode([
            'mandatory_completed' => (int)$row['mandatory_completed'],
            'bonus_completed' => (int)$row['bonus_completed'],
        ], JSON_UNESCAPED_UNICODE);

        $insertStmt->execute([
            'leaderboard_type' => $leaderboardType,
            'snapshot_date' => $snapshotDate,
            'user_id' => (int)$row['user_id'],
            'rank_position' => $rank,
            'score' => $score,
            'payload_json' => $payload,
        ]);
    }

    echo json_encode([
        'status' => 'success',
        'leaderboard_type' => $leaderboardType,
        'snapshot_date' => $snapshotDate,
        'count' => count($rows),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
