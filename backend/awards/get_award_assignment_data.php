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

    $includeRecipients = (string)($_GET['recipients'] ?? '1') !== '0';
    $recipientPage = max(1, (int)($_GET['recipients_page'] ?? 1));
    $recipientPageSize = min(50, max(5, (int)($_GET['recipients_page_size'] ?? 10)));
    $recipients = [];
    $recipientPagination = ['page' => $recipientPage, 'page_size' => $recipientPageSize, 'total' => 0, 'total_pages' => 1];

    if ($includeRecipients) {
        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM user_awards WHERE award_id = ? AND level = ?');
        $countStmt->execute([$awardId, $level]);
        $recipientPagination['total'] = (int)$countStmt->fetchColumn();
        $recipientPagination['total_pages'] = max(1, (int)ceil($recipientPagination['total'] / $recipientPageSize));
        $recipientPage = min($recipientPage, $recipientPagination['total_pages']);
        $recipientPagination['page'] = $recipientPage;
        $offset = ($recipientPage - 1) * $recipientPageSize;
        $recipientStmt = $pdo->prepare(
            "SELECT n.id AS user_id, n.username, ua.awarded_at, ua.shown_at
             FROM user_awards ua
             JOIN nutzer n ON n.id = ua.user_id
             WHERE ua.award_id = ? AND ua.level = ?
             ORDER BY ua.awarded_at DESC, n.username ASC
             LIMIT {$offset}, {$recipientPageSize}"
        );
        $recipientStmt->execute([$awardId, $level]);
        $recipients = array_map(static fn(array $row): array => [
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'awarded_at' => $row['awarded_at'],
            'shown_at' => $row['shown_at'],
        ], $recipientStmt->fetchAll(PDO::FETCH_ASSOC));
    }

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

    echo json_encode(['success' => true, 'recipients' => $recipients, 'recipient_pagination' => $recipientPagination, 'users' => $users], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Award-Daten konnten nicht geladen werden.'], JSON_UNESCAPED_UNICODE);
}
?>
