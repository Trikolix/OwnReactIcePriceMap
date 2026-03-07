<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

header('Content-Type: application/json; charset=utf-8');

$auth = requireAuth($pdo);
if ((int) $auth['user_id'] !== 1) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Forbidden',
    ]);
    exit;
}

$stmt = $pdo->query("
    SELECT *
    FROM wochenstatistiken
    ORDER BY start_datum ASC
");

$weeks = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'success',
    'weeks' => $weeks,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
