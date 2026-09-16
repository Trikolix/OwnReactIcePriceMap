<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/streaks.php';
require_once __DIR__ . '/../lib/levelsystem.php';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$auth = authenticateRequest($pdo, $_SERVER['REQUEST_METHOD'] === 'POST');
$own = (int)($auth['user_id'] ?? 0);
$target = $_GET['user_id'] ?? $own;
if (str_starts_with((string)$target, '@')) {
    $q = $pdo->prepare('SELECT id FROM nutzer WHERE username=?'); $q->execute([substr($target,1)]); $target = $q->fetchColumn();
}
$target = (int)$target;
if ($target <= 0) { http_response_code(400); echo json_encode(['error'=>'Nutzer fehlt']); exit; }
try {
    $now = streakNow();
    // GET is always read-only. Only an authenticated POST settles the owner's wallet.
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$own || $own !== $target) { http_response_code(403); echo json_encode(['error'=>'Nicht erlaubt']); exit; }
        $pdo->beginTransaction(); streakReconcile($pdo,$own,$now); $pdo->commit();
    } elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405); exit;
    }
    echo json_encode(['user_id'=>$target, 'refresh_after_seconds'=>$now->modify('tomorrow')->setTime(0,0)->getTimestamp()-$now->getTimestamp(), 'streaks'=>streakPayload(streakLoad($pdo,$target,$now),$now,$own===$target), 'level_info'=>getLevelInformationForUser($pdo,$target,false)]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Streak status: '.$e->getMessage());
    http_response_code(500); echo json_encode(['error'=>'Streak konnte nicht geladen werden']);
}
