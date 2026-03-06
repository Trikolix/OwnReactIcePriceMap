<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/checkin_grouping.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Nur POST erlaubt']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$checkinId = isset($payload['checkin_id']) ? (int)$payload['checkin_id'] : 0;
$userId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
$targetCheckins = $payload['target_checkin_ids'] ?? [];

if ($checkinId <= 0 || $userId <= 0 || !is_array($targetCheckins)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Eingabedaten']);
    exit;
}

$targetCheckins = array_values(array_unique(array_filter(array_map('intval', $targetCheckins), static function ($id) use ($checkinId) {
    return $id > 0 && $id !== $checkinId;
})));

if (empty($targetCheckins)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Keine Ziel-Checkins angegeben']);
    exit;
}

try {
    $pdo->beginTransaction();

    $ownerStmt = $pdo->prepare("SELECT nutzer_id, eisdiele_id, datum FROM checkins WHERE id = ? LIMIT 1");
    $ownerStmt->execute([$checkinId]);
    $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
    if (!$owner) {
        throw new RuntimeException('Checkin nicht gefunden');
    }
    if ((int)$owner['nutzer_id'] !== $userId) {
        throw new RuntimeException('Keine Berechtigung');
    }

    $windowMinutes = 180;
    $placeholders = implode(',', array_fill(0, count($targetCheckins), '?'));
    $sql = "
        SELECT id
        FROM checkins
        WHERE id IN ($placeholders)
          AND eisdiele_id = ?
          AND ABS(TIMESTAMPDIFF(MINUTE, datum, ?)) <= ?
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge($targetCheckins, [(int)$owner['eisdiele_id'], $owner['datum'], $windowMinutes]));
    $validTargetIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

    if (empty($validTargetIds)) {
        throw new RuntimeException('Keine passenden Ziel-Checkins gefunden');
    }

    $groupId = resolveOrMergeCheckinGroup($pdo, array_merge([$checkinId], $validTargetIds));

    $pdo->commit();
    echo json_encode([
        'status' => 'success',
        'group_id' => $groupId,
        'linked_checkin_ids' => $validTargetIds,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

