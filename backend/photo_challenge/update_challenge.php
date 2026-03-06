<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';

$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;

if (!$userId || !$challengeId) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-ID oder Challenge-ID fehlen.',
    ]);
    exit;
}

requirePhotoChallengeAdmin($userId);

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }

    if (in_array($challenge['status'], ['group_running', 'ko_running', 'finished'], true)) {
        throw new RuntimeException('Challenge-Konfiguration kann nach Start der Gruppenphase nicht mehr angepasst werden.');
    }

    $title = array_key_exists('title', $_POST) ? trim((string)$_POST['title']) : (string)$challenge['title'];
    $description = array_key_exists('description', $_POST)
        ? normalizeMultilineText((string)$_POST['description'])
        : (string)($challenge['description'] ?? '');
    $status = array_key_exists('status', $_POST) ? trim((string)$_POST['status']) : (string)($challenge['status'] ?? 'draft');
    $groupSize = array_key_exists('group_size', $_POST) ? (int)$_POST['group_size'] : (int)$challenge['group_size'];
    $groupAdvancers = array_key_exists('group_advancers', $_POST) ? (int)$_POST['group_advancers'] : (int)($challenge['group_advancers'] ?? 2);
    $luckyLoserSlots = array_key_exists('lucky_loser_slots', $_POST) ? (int)$_POST['lucky_loser_slots'] : (int)($challenge['lucky_loser_slots'] ?? 0);
    $koBracketSize = array_key_exists('ko_bracket_size', $_POST)
        ? ((string)$_POST['ko_bracket_size'] === '' ? null : (int)$_POST['ko_bracket_size'])
        : ($challenge['ko_bracket_size'] !== null ? (int)$challenge['ko_bracket_size'] : null);
    $startAt = array_key_exists('start_at', $_POST) ? normalizeDateTime($_POST['start_at'] ?? null) : ($challenge['start_at'] ?? null);
    $submissionDeadline = array_key_exists('submission_deadline', $_POST)
        ? normalizeDateTime($_POST['submission_deadline'] ?? null)
        : ($challenge['submission_deadline'] ?? null);
    $submissionLimit = array_key_exists('submission_limit_per_user', $_POST)
        ? (int)$_POST['submission_limit_per_user']
        : ($challenge['submission_limit_per_user'] !== null ? (int)$challenge['submission_limit_per_user'] : null);

    $groupScheduleRaw = array_key_exists('group_schedule', $_POST) ? $_POST['group_schedule'] : ($challenge['group_schedule'] ?? null);
    $groupSchedule = sanitizeGroupSchedule($groupScheduleRaw, $startAt);
    $groupScheduleJson = $groupSchedule ? json_encode($groupSchedule) : null;

    if ($title === '') {
        throw new RuntimeException('Bitte gib einen Titel an.');
    }
    if (!in_array($status, ['draft', 'submission_open', 'submission_closed'], true)) {
        throw new RuntimeException('Ungültiger Status für die Vorbereitungsphase.');
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
            throw new RuntimeException('Die Teilnehmerzahl für die KO-Phase muss eine gerade Zahl sein.');
        }
    }
    if ($startAt && $submissionDeadline && strtotime($submissionDeadline) <= strtotime($startAt)) {
        throw new RuntimeException('Die Einreichdeadline muss nach dem Startzeitpunkt liegen.');
    }
    if ($status === 'submission_open' && !$submissionDeadline) {
        throw new RuntimeException('Für den Status "submission_open" muss eine Einreichdeadline gesetzt sein.');
    }
    if (($challenge['status'] ?? '') === 'submission_closed' && $status === 'draft') {
        throw new RuntimeException('Nach geschlossener Einreichphase kann nicht mehr auf Draft zurückgestellt werden.');
    }

    $stmt = $pdo->prepare("
        UPDATE photo_challenges
        SET title = :title,
            description = :description,
            status = :status,
            group_size = :group_size,
            start_at = :start_at,
            submission_deadline = :submission_deadline,
            submission_limit_per_user = :submission_limit_per_user,
            group_schedule = :group_schedule,
            group_advancers = :group_advancers,
            lucky_loser_slots = :lucky_loser_slots,
            ko_bracket_size = :ko_bracket_size
        WHERE id = :id
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
        'id' => $challengeId,
    ]);

    $updated = getChallengeById($pdo, $challengeId);

    echo json_encode([
        'status' => 'success',
        'message' => 'Challenge-Konfiguration wurde gespeichert.',
        'challenge' => $updated ? enrichPhotoChallengeForApi($updated) : null,
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
        'message' => 'Challenge-Konfiguration konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
}
