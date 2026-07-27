<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/dev_db.php';
require_once __DIR__ . '/awards_cache.php';
require_once __DIR__ . '/award_icon_variants.php';

header('Content-Type: application/json; charset=utf-8');

function saveLevelError(int $status, string $message, array $errors = []): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
    exit;
}

function saveLevelUploadedIcon(): ?string
{
    if (!isset($_FILES['icon_file']) || $_FILES['icon_file']['error'] === UPLOAD_ERR_NO_FILE) return null;
    if ($_FILES['icon_file']['error'] !== UPLOAD_ERR_OK) throw new RuntimeException('Das Icon konnte nicht hochgeladen werden.');
    $imageInfo = @getimagesize($_FILES['icon_file']['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $mime = $imageInfo['mime'] ?? '';
    if (!isset($extensions[$mime])) throw new InvalidArgumentException('Bitte ein PNG-, JPG-, WebP- oder GIF-Bild auswählen.');
    $uploadDir = dirname(__DIR__, 2) . '/uploads/award_icons';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) throw new RuntimeException('Der Icon-Ordner konnte nicht erstellt werden.');
    $relativePath = 'uploads/award_icons/' . uniqid('award_', true) . '.' . $extensions[$mime];
    if (!move_uploaded_file($_FILES['icon_file']['tmp_name'], dirname(__DIR__, 2) . '/' . $relativePath)) throw new RuntimeException('Das Icon konnte nicht gespeichert werden.');
    awardIconCreateVariant($relativePath);
    return $relativePath;
}

try {
    $awardId = filter_var($_POST['award_id'] ?? null, FILTER_VALIDATE_INT);
    $level = filter_var($_POST['level'] ?? null, FILTER_VALIDATE_INT);
    $threshold = filter_var($_POST['threshold'] ?? null, FILTER_VALIDATE_INT);
    $ep = filter_var($_POST['ep'] ?? 0, FILTER_VALIDATE_INT);
    $title = trim((string)($_POST['title_de'] ?? ''));
    $description = trim((string)($_POST['description_de'] ?? ''));
    $removeIcon = filter_var($_POST['remove_icon'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $createOnly = filter_var($_POST['create_only'] ?? false, FILTER_VALIDATE_BOOLEAN);

    $errors = [];
    if ($awardId === false || $awardId < 1) $errors['award_id'] = 'Der Award-Kontext fehlt.';
    if ($level === false || $level < 1) $errors['level'] = 'Das Level muss mindestens 1 sein.';
    if ($threshold === false || $threshold < 0) $errors['threshold'] = 'Die Schwelle darf nicht negativ sein.';
    if ($ep === false || $ep < 0) $errors['ep'] = 'EP dürfen nicht negativ sein.';
    if ($title === '') $errors['title_de'] = 'Bitte einen Titel angeben.';
    if ($errors) saveLevelError(422, 'Bitte prüfe die markierten Felder.', $errors);

    $awardStmt = $pdo->prepare('SELECT id FROM awards WHERE id = ? LIMIT 1');
    $awardStmt->execute([$awardId]);
    if (!$awardStmt->fetchColumn()) saveLevelError(404, 'Der Award wurde nicht gefunden.', ['award_id' => 'Der Award wurde nicht gefunden.']);

    $existingStmt = $pdo->prepare('SELECT icon_path FROM award_levels WHERE award_id = ? AND level = ? LIMIT 1');
    $existingStmt->execute([$awardId, $level]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if ($existing && $createOnly) {
        saveLevelError(422, 'Dieses Level existiert bereits für den Award.', ['level' => 'Dieses Level existiert bereits für den Award.']);
    }
    $previousIconPath = $existing['icon_path'] ?? null;
    $newlyUploadedIconPath = null;
    try {
        $newlyUploadedIconPath = saveLevelUploadedIcon();
    } catch (InvalidArgumentException $e) {
        saveLevelError(422, $e->getMessage(), ['icon_file' => $e->getMessage()]);
    }
    $iconPath = $newlyUploadedIconPath ?: ($removeIcon ? null : $previousIconPath);

    $pdoDev = getAwardsDevPdo();
    $pdo->beginTransaction();
    $pdoDev->beginTransaction();
    try {
        if ($existing) {
            $stmt = $pdo->prepare('UPDATE award_levels SET threshold = ?, ep = ?, title_de = ?, description_de = ?, icon_path = ? WHERE award_id = ? AND level = ?');
            $stmt->execute([$threshold, $ep, $title, $description, $iconPath, $awardId, $level]);
            $devStmt = $pdoDev->prepare('UPDATE award_levels SET threshold = ?, ep = ?, title_de = ?, description_de = ?, icon_path = ? WHERE award_id = ? AND level = ?');
            $devStmt->execute([$threshold, $ep, $title, $description, $iconPath, $awardId, $level]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$awardId, $level, $threshold, $ep, $iconPath, $title, $description]);
            $devStmt = $pdoDev->prepare('INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $devStmt->execute([$awardId, $level, $threshold, $ep, $iconPath, $title, $description]);
        }
        $pdoDev->commit();
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($pdoDev->inTransaction()) $pdoDev->rollBack();
        throw $e;
    }

    if (($newlyUploadedIconPath || $removeIcon) && $previousIconPath && $previousIconPath !== $iconPath) {
        awardIconDeleteVariant($previousIconPath);
        $previousAbsolutePath = awardIconAbsolutePathFromRelative($previousIconPath);
        if ($previousAbsolutePath && is_file($previousAbsolutePath)) @unlink($previousAbsolutePath);
    }
    invalidateAwardsCache();
    echo json_encode(['success' => true, 'level' => [
        'level' => $level, 'threshold' => $threshold, 'ep' => $ep, 'icon_path' => $iconPath,
        'title_de' => $title, 'description_de' => $description,
    ]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    if (isset($newlyUploadedIconPath) && $newlyUploadedIconPath) {
        awardIconDeleteVariant($newlyUploadedIconPath);
        $absolutePath = awardIconAbsolutePathFromRelative($newlyUploadedIconPath);
        if ($absolutePath && is_file($absolutePath)) @unlink($absolutePath);
    }
    saveLevelError(500, 'Level konnte nicht gespeichert werden.');
}
