<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID fehlt.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

$query = trim($_GET['query'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = (int)($_GET['limit'] ?? 40);
$limit = max(1, min(80, $limit));
$offset = ($page - 1) * $limit;

try {
    $sql = "
        SELECT b.id,
               b.url,
               b.beschreibung,
               b.nutzer_id,
               n.username,
               b.checkin_id,
               c.datum AS checkin_datum,
               e.name AS eisdiele_name,
               COALESCE(c.datum, b.erstellt_am) AS sortDatum
        FROM bilder b
        LEFT JOIN nutzer n ON n.id = b.nutzer_id
        LEFT JOIN checkins c ON c.id = b.checkin_id
        LEFT JOIN eisdielen e ON e.id = c.eisdiele_id
        WHERE 1=1
    ";
    $params = [];

    if ($query !== '') {
        $sql .= " AND (
            n.username LIKE :query
            OR e.name LIKE :query
            OR b.beschreibung LIKE :query
        )";
        $params['query'] = '%' . $query . '%';
    }

    $sql .= " ORDER BY (sortDatum IS NULL), sortDatum DESC, b.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $images,
        'meta' => [
            'page' => $page,
            'limit' => $limit,
            'has_more' => count($images) === $limit,
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bilder konnten nicht geladen werden.',
        'details' => $e->getMessage(),
    ]);
}
