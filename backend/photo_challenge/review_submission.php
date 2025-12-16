<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$submissionId = isset($_POST['submission_id']) ? (int)$_POST['submission_id'] : 0;
$action = $_POST['action'] ?? '';

if (!$userId || !$submissionId || !in_array($action, ['approve', 'reject'], true)) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Ungültige Anfrage.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);
    $stmt = $pdo->prepare("
        SELECT s.*, c.status AS challenge_status
        FROM photo_challenge_submissions s
        JOIN photo_challenges c ON c.id = s.challenge_id
        WHERE s.id = :id
        FOR UPDATE
    ");
    $pdo->beginTransaction();
    $stmt->execute(['id' => $submissionId]);
    $submission = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$submission) {
        throw new RuntimeException('Einreichung nicht gefunden.');
    }
    if ($submission['status'] !== 'pending') {
        throw new RuntimeException('Einreichung wurde bereits bewertet.');
    }

    if ($action === 'approve') {
        $stmtInsert = $pdo->prepare("
            INSERT INTO photo_challenge_images (challenge_id, image_id, assigned_by)
            VALUES (:challenge_id, :image_id, :assigned_by)
            ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by)
        ");
        $stmtInsert->execute([
            'challenge_id' => $submission['challenge_id'],
            'image_id' => $submission['image_id'],
            'assigned_by' => $userId,
        ]);
        $newStatus = 'accepted';
    } else {
        $newStatus = 'rejected';
    }

    $stmtUpdate = $pdo->prepare("
        UPDATE photo_challenge_submissions
        SET status = :status, reviewer_id = :reviewer_id, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");
    $stmtUpdate->execute([
        'status' => $newStatus,
        'reviewer_id' => $userId,
        'id' => $submissionId,
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => $action === 'approve' ? 'Einreichung akzeptiert.' : 'Einreichung abgelehnt.',
    ]);
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Aktion konnte nicht durchgeführt werden.',
        'details' => $e->getMessage(),
    ]);
}

