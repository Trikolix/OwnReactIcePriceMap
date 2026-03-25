<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/evaluators/SecretWorkshopAwardEvaluator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed', 'achievements' => []]);
    exit;
}

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

try {
    $evaluator = new SecretWorkshopAwardEvaluator();
    $achievements = $evaluator->evaluate($currentUserId, 1);
    echo json_encode([
        'success' => true,
        'message' => !empty($achievements)
            ? 'Award erfolgreich erhalten.'
            : 'Award bereits erhalten oder Bedingung nicht erfüllt.',
        'achievements' => $achievements,
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ein Fehler ist aufgetreten.',
        'achievements' => [],
        'error' => $error->getMessage(),
    ]);
}
?>
