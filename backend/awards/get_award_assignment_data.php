<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/../lib/award_grants.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    ensureAwardShownAtColumn($pdo);
    $awardId = (int)($_GET['award_id'] ?? 0);
    $level = (int)($_GET['level'] ?? 0);
    if ($awardId <= 0 || $level <= 0) {
        throw new InvalidArgumentException('Award und Level fehlen.');
    }

    $recipientStmt = $pdo->prepare(
        "SELECT n.id AS user_id, n.username, ua.awarded_at, ua.shown_at
         FROM user_awards ua
         JOIN nutzer n ON n.id = ua.user_id
         WHERE ua.award_id = ? AND ua.level = ?
         ORDER BY n.username ASC"
    );
    $recipientStmt->execute([$awardId, $level]);
    $recipients = array_map(static fn(array $row): array => [
        'user_id' => (int)$row['user_id'],
        'username' => $row['username'],
        'awarded_at' => $row['awarded_at'],
        'shown_at' => $row['shown_at'],
    ], $recipientStmt->fetchAll(PDO::FETCH_ASSOC));

    $query = trim((string)($_GET['query'] ?? ''));
    $users = [];
    $queryLength = function_exists('mb_strlen') ? mb_strlen($query, 'UTF-8') : strlen($query);
    if ($queryLength >= 2) {
        $userStmt = $pdo->prepare(
            "SELECT id, username
             FROM nutzer
             WHERE username LIKE ?
             ORDER BY username ASC
             LIMIT 12"
        );
        $userStmt->execute(['%' . $query . '%']);
        $users = array_map(static fn(array $row): array => [
            'user_id' => (int)$row['id'],
            'username' => $row['username'],
        ], $userStmt->fetchAll(PDO::FETCH_ASSOC));
    }

    echo json_encode(['success' => true, 'recipients' => $recipients, 'users' => $users], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Award-Daten konnten nicht geladen werden.'], JSON_UNESCAPED_UNICODE);
}
?>
