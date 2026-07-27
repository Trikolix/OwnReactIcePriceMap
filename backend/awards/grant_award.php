<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/../lib/award_grants.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $awardId = (int)($payload['award_id'] ?? 0);
    $level = (int)($payload['level'] ?? 0);
    $showPopup = !array_key_exists('show_popup', $payload) || filter_var($payload['show_popup'], FILTER_VALIDATE_BOOLEAN);
    $userId = (int)($payload['user_id'] ?? 0);
    $username = trim((string)($payload['username'] ?? ''));

    if ($userId <= 0 && $username === '') {
        throw new InvalidArgumentException('Bitte einen Nutzernamen oder eine Nutzer-ID angeben.');
    }
    if ($userId <= 0) {
        $userStmt = $pdo->prepare("SELECT id FROM nutzer WHERE username = ? LIMIT 2");
        $userStmt->execute([$username]);
        $matches = $userStmt->fetchAll(PDO::FETCH_COLUMN);
        if (count($matches) !== 1) {
            throw new InvalidArgumentException('Nutzername wurde nicht eindeutig gefunden.');
        }
        $userId = (int)$matches[0];
    }

    $result = grantAwardToUser($pdo, $userId, $awardId, $level, $showPopup);
    echo json_encode(['success' => true, 'user_id' => $userId] + $result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Award konnte nicht vergeben werden.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
