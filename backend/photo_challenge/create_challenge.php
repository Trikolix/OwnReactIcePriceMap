<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID fehlt.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$status = $_POST['status'] ?? 'draft';
$groupSize = (int)($_POST['group_size'] ?? 4);
$startAt = normalizeDateTime($_POST['start_at'] ?? null);

if ($title === '') {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bitte gib einen Titel an.',
    ]);
    exit;
}

if (!in_array($status, ['draft', 'active', 'finished'], true)) {
    $status = 'draft';
}

if ($groupSize < 2) {
    $groupSize = 2;
}
if ($groupSize > 8) {
    $groupSize = 8;
}

try {
    ensurePhotoChallengeSchema($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO photo_challenges (title, description, status, group_size, start_at, created_by)
        VALUES (:title, :description, :status, :group_size, :start_at, :created_by)
    ");
    $stmt->execute([
        'title' => $title,
        'description' => $description,
        'status' => $status,
        'group_size' => $groupSize,
        'start_at' => $startAt,
        'created_by' => $userId,
    ]);

    $challengeId = (int)$pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT * FROM photo_challenges WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);
    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Challenge wurde erstellt.',
        'challenge' => $challenge,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Challenge konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
}
