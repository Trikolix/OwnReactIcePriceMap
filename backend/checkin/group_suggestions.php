<?php
require_once __DIR__ . '/../db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Nur GET erlaubt']);
    exit;
}

$checkinId = isset($_GET['checkin_id']) ? (int)$_GET['checkin_id'] : 0;
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$windowMinutes = isset($_GET['window_minutes']) ? (int)$_GET['window_minutes'] : 45;
$windowMinutes = max(10, min($windowMinutes, 180));

if ($checkinId <= 0 || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'checkin_id und user_id erforderlich']);
    exit;
}

try {
    $baseStmt = $pdo->prepare("
        SELECT id, nutzer_id, eisdiele_id, datum, group_id
        FROM checkins
        WHERE id = ?
        LIMIT 1
    ");
    $baseStmt->execute([$checkinId]);
    $base = $baseStmt->fetch(PDO::FETCH_ASSOC);
    if (!$base) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Checkin nicht gefunden']);
        exit;
    }

    if ((int)$base['nutzer_id'] !== $userId) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Kein Zugriff auf diesen Checkin']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT c.id, c.nutzer_id, c.datum, c.group_id, n.username
        FROM checkins c
        JOIN nutzer n ON n.id = c.nutzer_id
        WHERE c.eisdiele_id = :shop_id
          AND c.id <> :checkin_id
          AND c.nutzer_id <> :user_id
          AND ABS(TIMESTAMPDIFF(MINUTE, c.datum, :base_date)) <= :window_minutes
        ORDER BY ABS(TIMESTAMPDIFF(MINUTE, c.datum, :base_date)) ASC, c.datum DESC
        LIMIT 30
    ");
    $stmt->bindValue(':shop_id', (int)$base['eisdiele_id'], PDO::PARAM_INT);
    $stmt->bindValue(':checkin_id', $checkinId, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':base_date', $base['datum']);
    $stmt->bindValue(':window_minutes', $windowMinutes, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $baseGroupId = $base['group_id'] !== null ? (int)$base['group_id'] : null;
    $suggestions = array_map(static function ($row) use ($baseGroupId) {
        $candidateGroup = $row['group_id'] !== null ? (int)$row['group_id'] : null;
        return [
            'checkin_id' => (int)$row['id'],
            'user_id' => (int)$row['nutzer_id'],
            'username' => $row['username'],
            'datum' => $row['datum'],
            'group_id' => $candidateGroup,
            'already_grouped' => $baseGroupId !== null && $candidateGroup !== null && $baseGroupId === $candidateGroup,
        ];
    }, $rows);

    echo json_encode([
        'status' => 'success',
        'checkin_id' => $checkinId,
        'window_minutes' => $windowMinutes,
        'suggestions' => $suggestions,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}

