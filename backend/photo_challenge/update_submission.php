<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$submissionId = isset($_POST['submission_id']) ? (int)$_POST['submission_id'] : 0;
$title = isset($_POST['title']) ? trim((string)$_POST['title']) : null;

if ($title === '') {
    $title = null;
}

if (!$userId || !$submissionId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID oder Einreichungs-ID fehlen.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);

    if ($title !== null) {
        $titleLength = function_exists('mb_strlen') ? mb_strlen($title, 'UTF-8') : strlen($title);
        if ($titleLength > 100) {
            throw new RuntimeException('Der Bild-Titel darf maximal 100 Zeichen lang sein.');
        }
    }

    $stmt = $pdo->prepare("
        SELECT s.id, s.nutzer_id, s.status, c.id AS challenge_id, c.status AS challenge_status, c.submission_deadline
        FROM photo_challenge_submissions s
        JOIN photo_challenges c ON c.id = s.challenge_id
        WHERE s.id = :id
        LIMIT 1
    ");
    $stmt->execute(['id' => $submissionId]);
    $submission = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$submission) {
        throw new RuntimeException('Einreichung wurde nicht gefunden.');
    }
    if ((int)$submission['nutzer_id'] !== $userId) {
        throw new RuntimeException('Du darfst diese Einreichung nicht bearbeiten.');
    }
    if (($submission['status'] ?? '') !== 'pending') {
        throw new RuntimeException('Nur ausstehende Einreichungen können geändert werden.');
    }
    $challengeContext = [
        'status' => $submission['challenge_status'] ?? 'draft',
        'submission_deadline' => $submission['submission_deadline'] ?? null,
    ];
    if (!isPhotoChallengeSubmissionEditable($challengeContext)) {
        throw new RuntimeException('Die Einreichungsphase ist bereits beendet.');
    }

    $stmt = $pdo->prepare("
        UPDATE photo_challenge_submissions
        SET title = :title
        WHERE id = :id AND nutzer_id = :nutzer_id
    ");
    $stmt->execute([
        'title' => $title,
        'id' => $submissionId,
        'nutzer_id' => $userId,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Einreichung wurde aktualisiert.',
        'submission' => [
            'id' => $submissionId,
            'title' => $title,
        ],
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
        'message' => 'Einreichung konnte nicht aktualisiert werden.',
        'details' => $e->getMessage(),
    ]);
}

