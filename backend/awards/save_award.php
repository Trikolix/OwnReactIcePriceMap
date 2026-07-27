<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/dev_db.php';
require_once __DIR__ . '/awards_cache.php';

header('Content-Type: application/json; charset=utf-8');

function saveAwardError(int $status, string $message, array $errors = []): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $awardId = filter_var($_POST['award_id'] ?? null, FILTER_VALIDATE_INT);
    $code = trim((string)($_POST['code'] ?? ''));
    $category = trim((string)($_POST['category'] ?? ''));
    $errors = [];
    if ($awardId === false || $awardId < 1) $errors['award_id'] = 'Der Award-Kontext fehlt.';
    if ($code === '') $errors['code'] = 'Bitte einen Award-Code angeben.';
    if (function_exists('mb_strlen') ? mb_strlen($code) > 50 : strlen($code) > 50) $errors['code'] = 'Der Award-Code darf höchstens 50 Zeichen haben.';
    if (function_exists('mb_strlen') ? mb_strlen($category) > 50 : strlen($category) > 50) $errors['category'] = 'Die Kategorie darf höchstens 50 Zeichen haben.';
    if ($errors) saveAwardError(422, 'Bitte prüfe die markierten Felder.', $errors);

    $existsStmt = $pdo->prepare('SELECT id FROM awards WHERE id = ? LIMIT 1');
    $existsStmt->execute([$awardId]);
    if (!$existsStmt->fetchColumn()) saveAwardError(404, 'Der Award wurde nicht gefunden.', ['award_id' => 'Der Award wurde nicht gefunden.']);
    $duplicateStmt = $pdo->prepare('SELECT id FROM awards WHERE code = ? AND id <> ? LIMIT 1');
    $duplicateStmt->execute([$code, $awardId]);
    if ($duplicateStmt->fetchColumn()) saveAwardError(422, 'Dieser Award-Code ist bereits vergeben.', ['code' => 'Dieser Award-Code ist bereits vergeben.']);

    $pdoDev = getAwardsDevPdo();
    $pdo->beginTransaction();
    $pdoDev->beginTransaction();
    try {
        $statement = $pdo->prepare('UPDATE awards SET code = ?, category = ? WHERE id = ?');
        $statement->execute([$code, $category, $awardId]);
        $devStatement = $pdoDev->prepare('UPDATE awards SET code = ?, category = ? WHERE id = ?');
        $devStatement->execute([$code, $category, $awardId]);
        $pdoDev->commit();
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($pdoDev->inTransaction()) $pdoDev->rollBack();
        throw $e;
    }
    invalidateAwardsCache();
    echo json_encode(['success' => true, 'award' => ['id' => $awardId, 'code' => $code, 'category' => $category]], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    saveAwardError(500, 'Award konnte nicht gespeichert werden.');
}
