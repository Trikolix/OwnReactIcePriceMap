<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;
$groupId = isset($_POST['group_id']) ? (int)$_POST['group_id'] : 0;

if (!$userId || !$challengeId || !$groupId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-, Challenge- oder Gruppen-ID fehlt.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

$hasStart = array_key_exists('start_at', $_POST);
$hasEnd = array_key_exists('end_at', $_POST);
if (!$hasStart && !$hasEnd) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Keine Änderungen übermittelt.',
    ]);
    exit;
}

$startAt = $hasStart ? normalizeDateTime($_POST['start_at']) : null;
$endAt = $hasEnd ? normalizeDateTime($_POST['end_at']) : null;

try {
    ensurePhotoChallengeSchema($pdo);
    $stmt = $pdo->prepare("
        SELECT id, challenge_id
        FROM photo_challenge_groups
        WHERE id = :group_id AND challenge_id = :challenge_id
    ");
    $stmt->execute([
        'group_id' => $groupId,
        'challenge_id' => $challengeId,
    ]);
    $group = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$group) {
        throw new RuntimeException('Gruppe wurde nicht gefunden.');
    }

    $setParts = [];
    $params = [
        'group_id' => $groupId,
        'challenge_id' => $challengeId,
    ];
    if ($hasStart) {
        $setParts[] = 'start_at = :start_at';
        $params['start_at'] = $startAt;
    }
    if ($hasEnd) {
        $setParts[] = 'end_at = :end_at';
        $params['end_at'] = $endAt;
    }
    if (!$setParts) {
        throw new RuntimeException('Keine Änderungen erkannt.');
    }

    $sql = sprintf(
        'UPDATE photo_challenge_groups SET %s WHERE id = :group_id AND challenge_id = :challenge_id',
        implode(', ', $setParts)
    );
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $stmt = $pdo->prepare('SELECT * FROM photo_challenge_groups WHERE id = :group_id');
    $stmt->execute(['group_id' => $groupId]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Gruppenzeiten aktualisiert.',
        'group' => $updated,
    ]);
} catch (RuntimeException $e) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Zeiten konnten nicht aktualisiert werden.',
        'details' => $e->getMessage(),
    ]);
}

