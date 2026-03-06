<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/awards_cache.php';

header('Content-Type: application/json; charset=utf-8');

const AWARDS_CACHE_TTL_SECONDS = 300;

try {
    $cachedJson = readAwardsCache(AWARDS_CACHE_TTL_SECONDS);
    if ($cachedJson !== null) {
        echo $cachedJson;
        exit;
    }

    $sql = "
        SELECT
            a.id,
            a.code,
            a.category,
            al.level,
            al.threshold,
            al.icon_path,
            al.title_de,
            al.description_de,
            al.ep
        FROM awards a
        LEFT JOIN award_levels al
            ON al.award_id = a.id
        ORDER BY a.id DESC, al.level ASC
    ";

    $stmt = $pdo->query($sql);

    $awards = [];
    $awardIndexById = [];

    while (($row = $stmt->fetch(PDO::FETCH_ASSOC)) !== false) {
        $awardId = (int)$row['id'];

        if (!isset($awardIndexById[$awardId])) {
            $awardIndexById[$awardId] = count($awards);
            $awards[] = [
                'id' => $awardId,
                'code' => $row['code'],
                'category' => $row['category'],
                'levels' => [],
            ];
        }

        if ($row['level'] !== null) {
            $awards[$awardIndexById[$awardId]]['levels'][] = [
                'level' => (int)$row['level'],
                'threshold' => isset($row['threshold']) ? (int)$row['threshold'] : null,
                'icon_path' => $row['icon_path'],
                'title_de' => $row['title_de'],
                'description_de' => $row['description_de'],
                'ep' => isset($row['ep']) ? (int)$row['ep'] : 0,
            ];
        }
    }

    $json = json_encode($awards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('JSON encoding failed');
    }

    writeAwardsCache($json);
    echo $json;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Abrufen der Awards: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

