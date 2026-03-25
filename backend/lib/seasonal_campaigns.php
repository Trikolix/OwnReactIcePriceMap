<?php

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../evaluators/SecretClickAwardEvaluator.php';

function getSeasonalCampaignConfig(string $campaignId): ?array
{
    $configs = [
        'easter_2026' => [
            'id' => 'easter_2026',
            'period_start' => '2026-04-03 00:00:00',
            'period_end' => '2026-04-13 23:59:59',
            'total_hops' => 5,
            'award_action_key' => 'hideout_found',
            'award_level' => 2,
        ],
    ];

    return $configs[$campaignId] ?? null;
}

function getSeasonalCampaignPhase(array $config, ?DateTimeImmutable $now = null): string
{
    $reference = $now ?? new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
    $start = new DateTimeImmutable($config['period_start'], new DateTimeZone('Europe/Berlin'));
    $end = new DateTimeImmutable($config['period_end'], new DateTimeZone('Europe/Berlin'));

    if ($reference < $start) {
        return 'upcoming';
    }
    if ($reference > $end) {
        return 'results';
    }

    return 'active';
}

function ensureEasterCampaignTables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS easter_bunny_progress (
            user_id INT NOT NULL PRIMARY KEY,
            path_json LONGTEXT DEFAULT NULL,
            current_index INT NOT NULL DEFAULT 0,
            total_hops INT NOT NULL DEFAULT 5,
            daily_hint_claims INT NOT NULL DEFAULT 0,
            last_hint_claimed_on DATE DEFAULT NULL,
            completed_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_easter_bunny_progress_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function seasonalFallbackPath(): array
{
    return [
        ['name' => 'Chemnitz Zentrum', 'lat' => 50.8322, 'lng' => 12.9253],
        ['name' => 'Schlossteich', 'lat' => 50.8417, 'lng' => 12.9177],
        ['name' => 'Küchwald', 'lat' => 50.8517, 'lng' => 12.8995],
        ['name' => 'Kaßberg', 'lat' => 50.8297, 'lng' => 12.8971],
        ['name' => 'Limbacher Straße', 'lat' => 50.8330, 'lng' => 12.8743],
    ];
}

function buildEasterBunnyPath(PDO $pdo, int $totalHops): array
{
    $stmt = $pdo->query(
        "SELECT id, name, latitude, longitude
         FROM eisdielen
         WHERE latitude IS NOT NULL
           AND longitude IS NOT NULL
           AND status <> 'permanent_closed'
         ORDER BY RAND()
         LIMIT 18"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $path = [];
    foreach ($rows as $row) {
        if (!isset($row['latitude'], $row['longitude'])) {
            continue;
        }
        $path[] = [
            'shop_id' => isset($row['id']) ? (int)$row['id'] : null,
            'name' => (string)($row['name'] ?? 'Eisdiele'),
            'lat' => (float)$row['latitude'],
            'lng' => (float)$row['longitude'],
        ];
        if (count($path) >= $totalHops) {
            break;
        }
    }

    if (count($path) < $totalHops) {
        foreach (seasonalFallbackPath() as $fallbackStop) {
            $path[] = $fallbackStop;
            if (count($path) >= $totalHops) {
                break;
            }
        }
    }

    return array_slice($path, 0, $totalHops);
}

function getEasterProgressRow(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM easter_bunny_progress WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function persistEasterProgress(PDO $pdo, int $userId, array $config, ?array $existingRow = null): array
{
    $path = buildEasterBunnyPath($pdo, (int)$config['total_hops']);
    $pathJson = json_encode($path, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($existingRow) {
        $stmt = $pdo->prepare(
            "UPDATE easter_bunny_progress
             SET path_json = :path_json,
                 current_index = 0,
                 total_hops = :total_hops,
                 completed_at = NULL
             WHERE user_id = :user_id"
        );
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO easter_bunny_progress (user_id, path_json, current_index, total_hops)
             VALUES (:user_id, :path_json, 0, :total_hops)"
        );
    }

    $stmt->execute([
        'user_id' => $userId,
        'path_json' => $pathJson,
        'total_hops' => (int)$config['total_hops'],
    ]);

    return getEasterProgressRow($pdo, $userId) ?? [
        'user_id' => $userId,
        'path_json' => $pathJson,
        'current_index' => 0,
        'total_hops' => (int)$config['total_hops'],
        'daily_hint_claims' => 0,
        'last_hint_claimed_on' => null,
        'completed_at' => null,
    ];
}

function decodeEasterPath(?string $pathJson): array
{
    if (!$pathJson) {
        return [];
    }

    $decoded = json_decode($pathJson, true);
    return is_array($decoded) ? $decoded : [];
}

function getDirectionalHint(?array $target): ?array
{
    if (!$target) {
        return null;
    }

    $referenceLat = 50.8337;
    $referenceLng = 12.9192;
    $vertical = ((float)$target['lat'] >= $referenceLat) ? 'nördlich' : 'südlich';
    $horizontal = ((float)$target['lng'] >= $referenceLng) ? 'östlich' : 'westlich';

    return [
        'tone' => 'soft',
        'text' => "Heutiger Hinweis: Der Hase hält sich eher {$vertical} und {$horizontal} der Kartenmitte auf.",
    ];
}

function normalizeEasterProgressRow(PDO $pdo, int $userId, array $config, bool $allowReset = false): array
{
    ensureEasterCampaignTables($pdo);
    $row = getEasterProgressRow($pdo, $userId);

    if (!$row) {
        $row = persistEasterProgress($pdo, $userId, $config);
    }

    $path = decodeEasterPath($row['path_json'] ?? null);
    if (!$path || ($allowReset && !empty($row['completed_at']))) {
        $row = persistEasterProgress($pdo, $userId, $config, $row);
        $path = decodeEasterPath($row['path_json'] ?? null);
    }

    $currentIndex = max(0, min((int)($row['current_index'] ?? 0), max(count($path) - 1, 0)));
    $completed = !empty($row['completed_at']);
    $currentTarget = (!$completed && isset($path[$currentIndex])) ? $path[$currentIndex] : null;
    $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');

    return [
        'row' => $row,
        'path' => $path,
        'progress' => [
            'completed' => $completed,
            'current_step' => min($currentIndex + 1, (int)($row['total_hops'] ?? $config['total_hops'])),
            'total_steps' => (int)($row['total_hops'] ?? $config['total_hops']),
            'current_target' => $currentTarget,
            'daily_hint_claims' => (int)($row['daily_hint_claims'] ?? 0),
            'daily_hint_available' => ($row['last_hint_claimed_on'] ?? null) !== $today,
            'hint' => getDirectionalHint($currentTarget),
        ],
    ];
}

function grantSeasonalActionAward(PDO $pdo, string $campaignId, string $actionKey, int $userId): array
{
    if ($campaignId === 'easter_2026' && $actionKey === 'hideout_found') {
        $evaluator = new SecretClickAwardEvaluator();
        return $evaluator->evaluate($userId, 2);
    }

    return [];
}
