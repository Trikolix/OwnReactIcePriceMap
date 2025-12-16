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
$groupAdvancers = (int)($_POST['group_advancers'] ?? 2);
$luckyLoserSlots = (int)($_POST['lucky_loser_slots'] ?? 2);
$koBracketSize = isset($_POST['ko_bracket_size']) ? (int)$_POST['ko_bracket_size'] : null;
$startAt = normalizeDateTime($_POST['start_at'] ?? null);
$submissionDeadline = normalizeDateTime($_POST['submission_deadline'] ?? null);
$submissionLimit = isset($_POST['submission_limit_per_user']) ? (int)$_POST['submission_limit_per_user'] : null;
$groupScheduleRaw = $_POST['group_schedule'] ?? null;
$groupSchedule = sanitizeGroupSchedule($groupScheduleRaw, $startAt);
$groupScheduleJson = $groupSchedule ? json_encode($groupSchedule) : null;

if ($title === '') {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bitte gib einen Titel an.',
    ]);
    exit;
}

if (!in_array($status, ['draft', 'active', 'finished', 'submission_open', 'group_running', 'ko_running'], true)) {
    $status = 'draft';
}

if ($groupSize < 2) {
    $groupSize = 2;
}
if ($groupSize > 8) {
    $groupSize = 8;
}
$groupAdvancers = max(1, min($groupAdvancers, $groupSize));
$luckyLoserSlots = max(0, $luckyLoserSlots);
$submissionLimit = $submissionLimit !== null ? max(0, $submissionLimit) : null;
if ($koBracketSize !== null) {
    if ($koBracketSize < 2) {
        $koBracketSize = null;
    } elseif ($koBracketSize % 2 !== 0) {
        http_response_code(422);
        echo json_encode([
            'status' => 'error',
            'message' => 'Die Teilnehmerzahl für die KO-Phase muss eine gerade Zahl sein.',
        ]);
        exit;
    }
}

try {
    ensurePhotoChallengeSchema($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO photo_challenges (
            title,
            description,
            status,
            group_size,
            start_at,
            submission_deadline,
            submission_limit_per_user,
            group_schedule,
            group_advancers,
            lucky_loser_slots,
            ko_bracket_size,
            created_by
        ) VALUES (
            :title,
            :description,
            :status,
            :group_size,
            :start_at,
            :submission_deadline,
            :submission_limit_per_user,
            :group_schedule,
            :group_advancers,
            :lucky_loser_slots,
            :ko_bracket_size,
            :created_by
        )
    ");
    $stmt->execute([
        'title' => $title,
        'description' => $description,
        'status' => $status,
        'group_size' => $groupSize,
        'start_at' => $startAt,
        'submission_deadline' => $submissionDeadline,
        'submission_limit_per_user' => $submissionLimit,
        'group_schedule' => $groupScheduleJson,
        'group_advancers' => $groupAdvancers,
        'lucky_loser_slots' => $luckyLoserSlots,
        'ko_bracket_size' => $koBracketSize,
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
