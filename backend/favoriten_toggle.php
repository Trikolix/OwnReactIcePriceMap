<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/levelsystem.php';
require_once __DIR__ . '/evaluators/FavoriteShopCountEvaluator.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];
$eisdieleId = $_GET['eisdiele_id'] ?? null;

header('Content-Type: application/json');

if (!$currentUserId || !$eisdieleId) {
    echo json_encode(['error' => 'Parameter fehlen']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT 1 FROM favoriten WHERE nutzer_id = ? AND eisdiele_id = ?');
    $stmt->execute([$currentUserId, $eisdieleId]);

    if ($stmt->fetch()) {
        $delete = $pdo->prepare('DELETE FROM favoriten WHERE nutzer_id = ? AND eisdiele_id = ?');
        $delete->execute([$currentUserId, $eisdieleId]);
        echo json_encode([
            'status' => 'removed',
            'message' => 'Eisdiele wurde aus den Favoriten entfernt.',
            'is_favorit' => 0,
            'new_awards' => [],
            'level_up' => false,
            'new_level' => null,
            'level_name' => null,
        ]);
    } else {
        $insert = $pdo->prepare('INSERT INTO favoriten (nutzer_id, eisdiele_id) VALUES (?, ?)');
        $insert->execute([$currentUserId, $eisdieleId]);

        $newAwards = [];
        try {
            $newAwards = (new FavoriteShopCountEvaluator())->evaluate($currentUserId);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator FavoriteShopCountEvaluator: " . $e->getMessage());
        }

        $levelChange = updateUserLevelIfChanged($pdo, $currentUserId);

        echo json_encode([
            'status' => 'added',
            'message' => 'Eisdiele wurde zu den Favoriten hinzugefügt.',
            'is_favorit' => 1,
            'new_awards' => $newAwards,
            'level_up' => $levelChange['level_up'] ?? false,
            'new_level' => !empty($levelChange['level_up']) ? $levelChange['new_level'] : null,
            'level_name' => !empty($levelChange['level_up']) ? $levelChange['level_name'] : null,
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler bei der Datenbankoperation: ' . $e->getMessage()]);
}

?>
