<?php

function ensureSeasonalCampaignResultsTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS seasonal_campaign_results (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT DEFAULT NULL,
            username_snapshot VARCHAR(255) NOT NULL,
            rank_position INT NOT NULL,
            score INT NOT NULL DEFAULT 0,
            payload_json LONGTEXT DEFAULT NULL,
            finalized_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_seasonal_campaign_user (campaign_id, user_id),
            KEY idx_seasonal_campaign_rank (campaign_id, rank_position)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function getArchivedCampaignResults(PDO $pdo, string $campaignId): array
{
    ensureSeasonalCampaignResultsTable($pdo);
    $stmt = $pdo->prepare(
        "SELECT campaign_id, user_id, username_snapshot, rank_position, score, payload_json, finalized_at
         FROM seasonal_campaign_results
         WHERE campaign_id = :campaign_id
         ORDER BY rank_position ASC, score DESC, username_snapshot ASC"
    );
    $stmt->execute(['campaign_id' => $campaignId]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function getArchivedCampaignResult(PDO $pdo, string $campaignId, int $userId): ?array
{
    ensureSeasonalCampaignResultsTable($pdo);
    $stmt = $pdo->prepare(
        "SELECT campaign_id, user_id, username_snapshot, rank_position, score, payload_json, finalized_at
         FROM seasonal_campaign_results
         WHERE campaign_id = :campaign_id
           AND user_id = :user_id
         LIMIT 1"
    );
    $stmt->execute([
        'campaign_id' => $campaignId,
        'user_id' => $userId,
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function decodeArchivedPayload(?string $payloadJson): array
{
    if (!$payloadJson) {
        return [];
    }

    $decoded = json_decode($payloadJson, true);
    return is_array($decoded) ? $decoded : [];
}

function upsertArchivedCampaignResult(
    PDO $pdo,
    string $campaignId,
    int $userId,
    string $usernameSnapshot,
    int $rankPosition,
    int $score,
    array $payload,
    string $finalizedAt
): void {
    ensureSeasonalCampaignResultsTable($pdo);
    $stmt = $pdo->prepare(
        "INSERT INTO seasonal_campaign_results
            (campaign_id, user_id, username_snapshot, rank_position, score, payload_json, finalized_at)
         VALUES
            (:campaign_id, :user_id, :username_snapshot, :rank_position, :score, :payload_json, :finalized_at)
         ON DUPLICATE KEY UPDATE
            username_snapshot = VALUES(username_snapshot),
            rank_position = VALUES(rank_position),
            score = VALUES(score),
            payload_json = VALUES(payload_json),
            finalized_at = VALUES(finalized_at)"
    );
    $stmt->execute([
        'campaign_id' => $campaignId,
        'user_id' => $userId,
        'username_snapshot' => $usernameSnapshot,
        'rank_position' => $rankPosition,
        'score' => $score,
        'payload_json' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'finalized_at' => $finalizedAt,
    ]);
}
