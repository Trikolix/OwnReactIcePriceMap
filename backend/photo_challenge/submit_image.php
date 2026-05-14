<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/helpers.php';


$userId = isset($_POST['nutzer_id']) ? (int)$_POST['nutzer_id'] : 0;
$challengeId = isset($_POST['challenge_id']) ? (int)$_POST['challenge_id'] : 0;
$imageId = isset($_POST['image_id']) ? (int)$_POST['image_id'] : 0;
$title = isset($_POST['title']) ? trim($_POST['title']) : null;
if ($title === '') {
    $title = null;
}

$hasImageUpload = isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE;

if (!$userId || !$challengeId || (!$imageId && !$hasImageUpload)) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nutzer-, Challenge- oder Bild-Daten fehlen.',
    ]);
    exit;
}

try {
    ensurePhotoChallengeSchema($pdo);
    $challenge = getChallengeById($pdo, $challengeId);
    if (!$challenge) {
        throw new RuntimeException('Challenge existiert nicht.');
    }
    if (!isPhotoChallengeSubmissionEditable($challenge)) {
        throw new RuntimeException('Die Einreichungsphase ist bereits beendet.');
    }
    if ($title !== null) {
        $titleLength = function_exists('mb_strlen') ? mb_strlen($title, 'UTF-8') : strlen($title);
        if ($titleLength > 100) {
            throw new RuntimeException('Der Bild-Titel darf maximal 100 Zeichen lang sein.');
        }
    }

    if ($hasImageUpload) {
        if (empty($challenge['allow_direct_uploads'])) {
            throw new RuntimeException('Direkter Bilder-Upload ist für diese Challenge nicht erlaubt.');
        }
        require_once __DIR__ . '/../lib/image_upload.php';

        $filesArray = [
            'name' => [$_FILES['image']['name']],
            'type' => [$_FILES['image']['type']],
            'tmp_name' => [$_FILES['image']['tmp_name']],
            'error' => [$_FILES['image']['error']],
            'size' => [$_FILES['image']['size']],
        ];

        $uploaded = processUploadedImages($filesArray, '../uploads/photo_challenges/', 'pc_');
        if (empty($uploaded) || empty($uploaded[0]['url'])) {
            throw new RuntimeException('Bild konnte nicht hochgeladen werden.');
        }
        $relativePath = $uploaded[0]['url'];

        $stmt = $pdo->prepare("INSERT INTO bilder (nutzer_id, url) VALUES (:nutzer_id, :url)");
        $stmt->execute([
            'nutzer_id' => $userId,
            'url' => $relativePath,
        ]);
        $imageId = (int)$pdo->lastInsertId();
    } else {
        $stmt = $pdo->prepare("SELECT id, erstellt_am FROM bilder WHERE id = :image_id AND nutzer_id = :nutzer_id");
        $stmt->execute([
            'image_id' => $imageId,
            'nutzer_id' => $userId,
        ]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$image) {
            throw new RuntimeException('Dieses Bild gehört nicht dir.');
        }
        if (!empty($challenge['min_image_created_at'])) {
            $imageCreatedAt = strtotime((string)($image['erstellt_am'] ?? ''));
            $minImageCreatedAt = strtotime((string)$challenge['min_image_created_at']);
            if ($imageCreatedAt === false || $minImageCreatedAt === false || $imageCreatedAt < $minImageCreatedAt) {
                throw new RuntimeException('Dieses Bild ist für diese Challenge zu alt.');
            }
        }
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM photo_challenge_submissions
        WHERE challenge_id = :challenge_id AND nutzer_id = :nutzer_id
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'nutzer_id' => $userId,
    ]);
    $submissionCount = (int)$stmt->fetchColumn();
    if (!empty($challenge['submission_limit_per_user']) && $submissionCount >= (int)$challenge['submission_limit_per_user']) {
        throw new RuntimeException('Du hast bereits das Limit deiner Einreichungen erreicht.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO photo_challenge_submissions (challenge_id, image_id, nutzer_id, title)
        VALUES (:challenge_id, :image_id, :nutzer_id, :title)
    ");
    $stmt->execute([
        'challenge_id' => $challengeId,
        'image_id' => $imageId,
        'nutzer_id' => $userId,
        'title' => $title,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Bild wurde eingereicht.',
    ]);
} catch (RuntimeException $e) {
    http_response_code(422);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
} catch (PDOException $e) {
    if (($e->getCode() ?? '') === '23000') {
        http_response_code(422);
        echo json_encode([
            'status' => 'error',
            'message' => 'Dieses Bild wurde für diese Challenge bereits eingereicht.',
        ]);
        exit;
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Einreichung konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Einreichung konnte nicht gespeichert werden.',
        'details' => $e->getMessage(),
    ]);
}
