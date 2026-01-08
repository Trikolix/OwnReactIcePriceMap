<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/levelsystem.php';
require_once __DIR__ . '/lib/auth.php';

// FIXME: Temporarily adding a log to a public directory - REMOVE FOR PRODUCTION
$log_path = __DIR__ . '/../public/grant_award_log.txt';
file_put_contents($log_path, "Script started at " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
file_put_contents($log_path, "Session started. Session data: " . print_r($_SESSION, true) . "\n", FILE_APPEND);


require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/evaluators/SecretWorkshopAwardEvaluator.php';

$response = ['success' => false, 'message' => 'Anmeldung erforderlich.', 'achievements' => []];

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];
if (isset($currentUserId)) {
    file_put_contents($log_path, "User ID: $currentUserId\n", FILE_APPEND);

    try {
        $evaluator = new SecretWorkshopAwardEvaluator();
        $achievements = $evaluator->evaluate($currentUserId, 1);

        if (!empty($achievements)) {
            $response['success'] = true;
            $response['message'] = 'Award erfolgreich erhalten!';
            $response['achievements'] = $achievements;
            file_put_contents($log_path, "Achievements granted: " . print_r($achievements, true) . "\n", FILE_APPEND);
        } else {
            $response['success'] = true; 
            $response['message'] = 'Award bereits erhalten oder Bedingung nicht erfüllt.';
            file_put_contents($log_path, "No new achievements.\n", FILE_APPEND);
        }
    } catch (Exception $e) {
        $response['message'] = 'Ein Fehler ist aufgetreten: ' . $e->getMessage();
        file_put_contents($log_path, "Error: " . $e->getMessage() . "\n", FILE_APPEND);
    }
} else {
    file_put_contents($log_path, "User not logged in.\n", FILE_APPEND);
}

echo json_encode($response);
?>
