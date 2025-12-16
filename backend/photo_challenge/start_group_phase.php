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
    if (!in_array($challenge['status'], ['draft', 'submission_open'], true)) {
        throw new RuntimeException('Die Gruppenphase kann nur bei Challenges im Status "draft" oder während der Einreichphase gestartet werden.');
    }

    $groupSize = max(2, (int)$challenge['group_size']);
    $imageIds = getAssignedImageIds($pdo, $challengeId);
    if (count($imageIds) < $groupSize * 2) {
        throw new RuntimeException('Es werden mindestens ' . ($groupSize * 2) . ' Bilder benötigt.');
    }
    if (count($imageIds) % $groupSize !== 0) {
        throw new RuntimeException('Die Anzahl der Bilder muss durch die Gruppengröße teilbar sein.');
    }

    $groupCount = (int)(count($imageIds) / $groupSize);
    if ($groupCount < 2) {
        throw new RuntimeException('Es werden mindestens zwei Gruppen benötigt.');
    }

    shuffle($imageIds);

    $pdo->beginTransaction();
    deleteChallengeStructure($pdo, $challengeId, false);

    $insertGroup = $pdo->prepare("
        INSERT INTO photo_challenge_groups (challenge_id, name, position, start_at, end_at)
        VALUES (:challenge_id, :name, :position, :start_at, :end_at)
    ");
    $insertEntry = $pdo->prepare("
        INSERT INTO photo_challenge_group_entries (challenge_id, group_id, image_id, seed)
        VALUES (:challenge_id, :group_id, :image_id, :seed)
    ");
    $insertMatch = $pdo->prepare("
        INSERT INTO photo_challenge_matches
            (challenge_id, phase, round, group_id, position, image_a_id, image_b_id, status)
        VALUES
            (:challenge_id, 'group', 1, :group_id, :position, :image_a_id, :image_b_id, 'open')
    ");

    $positionCounter = 1;
    $groupNames = range('A', 'Z');
    $groupSchedule = sanitizeGroupSchedule($challenge['group_schedule'] ?? null, $challenge['start_at'] ?? null);
    $groupTimings = buildGroupTimings($groupSchedule, $groupCount, $challenge['start_at'] ?? null);

    for ($groupIndex = 0; $groupIndex < $groupCount; $groupIndex++) {
        $chunk = array_slice($imageIds, $groupIndex * $groupSize, $groupSize);
        $groupName = 'Gruppe ' . ($groupNames[$groupIndex] ?? '#' . ($groupIndex + 1));
        $timing = $groupTimings[$groupIndex] ?? null;
        if ($timing) {
            $startAt = $timing['start_at'];
            $endAt = $timing['end_at'];
        } else {
            $fallbackStart = $challenge['start_at'] ? new DateTimeImmutable($challenge['start_at']) : new DateTimeImmutable('now');
            $fallbackStart = $fallbackStart->setTime(0, 0, 0)->format('Y-m-d H:i:s');
            $fallbackEnd = (new DateTimeImmutable($fallbackStart))->modify('+14 days')->format('Y-m-d H:i:s');
            $startAt = $fallbackStart;
            $endAt = $fallbackEnd;
        }

        $insertGroup->execute([
            'challenge_id' => $challengeId,
            'name' => $groupName,
            'position' => $groupIndex + 1,
            'start_at' => $startAt,
            'end_at' => $endAt,
        ]);
        $groupId = (int)$pdo->lastInsertId();

        foreach ($chunk as $seed => $imageId) {
            $insertEntry->execute([
                'challenge_id' => $challengeId,
                'group_id' => $groupId,
                'image_id' => $imageId,
                'seed' => $seed + 1,
            ]);
        }

        $pairs = buildRoundRobinPairs($chunk);
        foreach ($pairs as [$imageA, $imageB]) {
            $insertMatch->execute([
                'challenge_id' => $challengeId,
                'group_id' => $groupId,
                'position' => $positionCounter++,
                'image_a_id' => $imageA,
                'image_b_id' => $imageB,
            ]);
        }
    }

    $stmt = $pdo->prepare("UPDATE photo_challenges SET status = 'group_running' WHERE id = :id");
    $stmt->execute(['id' => $challengeId]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Gruppenphase wurde erstellt.',
        'group_count' => $groupCount,
        'matches_per_group' => ($groupSize * ($groupSize - 1)) / 2,
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
        'message' => 'Gruppenphase konnte nicht gestartet werden.',
        'details' => $e->getMessage(),
    ]);
}
