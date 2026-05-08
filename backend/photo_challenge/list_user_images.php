<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;
$challengeId = isset($_GET['challenge_id']) ? (int)$_GET['challenge_id'] : 0;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID fehlt.',
    ]);
    exit;
}

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = 30;
$offset = ($page - 1) * $limit;

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = $challengeId ? getChallengeById($pdo, $challengeId) : null;
    $minImageCreatedAt = $challenge['min_image_created_at'] ?? null;
    $where = "b.nutzer_id = :nutzer_id";
    if (!empty($minImageCreatedAt)) {
        $where .= " AND b.erstellt_am >= :min_image_created_at";
    }

    $stmt = $pdo->prepare("
        SELECT b.id,
               b.url,
               b.beschreibung,
               b.erstellt_am AS created_at
        FROM bilder b
        WHERE {$where}
        ORDER BY b.erstellt_am DESC
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':nutzer_id', $userId, PDO::PARAM_INT);
    if (!empty($minImageCreatedAt)) {
        $stmt->bindValue(':min_image_created_at', $minImageCreatedAt, PDO::PARAM_STR);
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
