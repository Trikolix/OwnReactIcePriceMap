<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/dev_db.php';
require_once __DIR__ . '/awards_cache.php';
require_once __DIR__ . '/award_icon_variants.php';

header('Content-Type: application/json; charset=utf-8');

function createAwardError(int $status, string $message, array $errors = []): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
    exit;
}

function createAwardUploadIcon(): ?string
{
    if (!isset($_FILES['icon_file']) || $_FILES['icon_file']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($_FILES['icon_file']['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Das Icon konnte nicht hochgeladen werden.');
    }

    $tmpName = $_FILES['icon_file']['tmp_name'];
    $imageInfo = @getimagesize($tmpName);
    $allowedMimeTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $mime = $imageInfo['mime'] ?? '';
    if (!isset($allowedMimeTypes[$mime])) {
        throw new InvalidArgumentException('Bitte ein PNG-, JPG-, WebP- oder GIF-Bild auswählen.');
    }

    $uploadDir = dirname(__DIR__, 2) . '/uploads/award_icons';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        throw new RuntimeException('Der Icon-Ordner konnte nicht erstellt werden.');
    }
    $filename = uniqid('award_', true) . '.' . $allowedMimeTypes[$mime];
    $relativePath = 'uploads/award_icons/' . $filename;
    if (!move_uploaded_file($tmpName, $uploadDir . '/' . $filename)) {
        throw new RuntimeException('Das Icon konnte nicht gespeichert werden.');
    }
    awardIconCreateVariant($relativePath);
    return $relativePath;
}

try {
    $code = trim((string)($_POST['code'] ?? ''));
    $category = trim((string)($_POST['category'] ?? ''));
    $level = filter_var($_POST['level'] ?? null, FILTER_VALIDATE_INT);
    $threshold = filter_var($_POST['threshold'] ?? null, FILTER_VALIDATE_INT);
    $ep = filter_var($_POST['ep'] ?? 0, FILTER_VALIDATE_INT);
    $title = trim((string)($_POST['title_de'] ?? ''));
    $description = trim((string)($_POST['description_de'] ?? ''));

    $errors = [];
    if ($code === '') $errors['code'] = 'Bitte einen Award-Code angeben.';
    if (function_exists('mb_strlen') ? mb_strlen($code) > 50 : strlen($code) > 50) $errors['code'] = 'Der Award-Code darf höchstens 50 Zeichen haben.';
    if (function_exists('mb_strlen') ? mb_strlen($category) > 50 : strlen($category) > 50) $errors['category'] = 'Die Kategorie darf höchstens 50 Zeichen haben.';
    if ($level === false || $level < 1) $errors['level'] = 'Das Level muss mindestens 1 sein.';
    if ($threshold === false || $threshold < 0) $errors['threshold'] = 'Die Schwelle darf nicht negativ sein.';
    if ($ep === false || $ep < 0) $errors['ep'] = 'EP dürfen nicht negativ sein.';
    if ($title === '') $errors['title_de'] = 'Bitte einen Titel angeben.';
    if ($errors) createAwardError(422, 'Bitte prüfe die markierten Felder.', $errors);

    $duplicateStmt = $pdo->prepare('SELECT id FROM awards WHERE code = ? LIMIT 1');
    $duplicateStmt->execute([$code]);
    if ($duplicateStmt->fetchColumn()) {
        createAwardError(422, 'Dieser Award-Code ist bereits vergeben.', ['code' => 'Dieser Award-Code ist bereits vergeben.']);
    }

    $iconPath = null;
    try {
        $iconPath = createAwardUploadIcon();
    } catch (InvalidArgumentException $e) {
        createAwardError(422, $e->getMessage(), ['icon_file' => $e->getMessage()]);
    }

    $pdoDev = getAwardsDevPdo();
    $pdo->beginTransaction();
    $pdoDev->beginTransaction();
    try {
        $awardStmt = $pdo->prepare('INSERT INTO awards (code, category) VALUES (?, ?)');
        $awardStmt->execute([$code, $category]);
        $awardId = (int)$pdo->lastInsertId();

        $devAwardStmt = $pdoDev->prepare('INSERT INTO awards (id, code, category) VALUES (?, ?, ?)');
        $devAwardStmt->execute([$awardId, $code, $category]);

        $levelStmt = $pdo->prepare('INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $levelStmt->execute([$awardId, $level, $threshold, $ep, $iconPath, $title, $description]);
        $devLevelStmt = $pdoDev->prepare('INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $devLevelStmt->execute([$awardId, $level, $threshold, $ep, $iconPath, $title, $description]);

        $pdoDev->commit();
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($pdoDev->inTransaction()) $pdoDev->rollBack();
        throw $e;
    }

    invalidateAwardsCache();
    echo json_encode(['success' => true, 'award' => [
        'id' => $awardId,
        'code' => $code,
        'category' => $category,
        'levels' => [[
            'level' => $level,
            'threshold' => $threshold,
            'ep' => $ep,
            'icon_path' => $iconPath,
            'title_de' => $title,
            'description_de' => $description,
        ]],
    ]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    if (isset($iconPath) && $iconPath) {
        awardIconDeleteVariant($iconPath);
        $absolutePath = awardIconAbsolutePathFromRelative($iconPath);
        if ($absolutePath && is_file($absolutePath)) @unlink($absolutePath);
    }
    createAwardError(500, 'Award konnte nicht angelegt werden.');
}
