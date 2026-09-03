<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/OnboardingAwardEvaluator.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$requestedLevel = isset($input['level']) ? max(1, (int)$input['level']) : 1;

$currentUserId = null;
try {
    $authData = requireAuth($pdo);
    $currentUserId = (int)($authData['user_id'] ?? 0);
} catch (Throwable $e) {
    if (!empty($input['user_id'])) {
        $currentUserId = (int)$input['user_id'];
    }
}

if (!$currentUserId || $currentUserId <= 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Nicht autorisiert']);
    exit;
}

try {
    $evaluator = new OnboardingAwardEvaluator();
    $newAwards = $evaluator->evaluate($currentUserId, $requestedLevel);

    $levelChange = null;
    if (!empty($newAwards)) {
        $levelChange = updateUserLevelIfChanged($pdo, $currentUserId);
    }

    echo json_encode([
        'success' => true,
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['new_level'] ?? null,
        'current_level' => $levelChange['new_level'] ?? null,
        'level_name' => $levelChange['level_name'] ?? null,
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fehler bei der Award-Vergabe: ' . $error->getMessage(),
        'new_awards' => [],
    ]);
}
?>
