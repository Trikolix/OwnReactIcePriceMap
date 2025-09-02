<?php
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/levelsystem.php';
require_once __DIR__ . '/../evaluators/ReferredUsersEvaluator.php';
require_once __DIR__ . '/../evaluators/CountryVisitEvaluator.php';
require_once __DIR__ . '/../evaluators/CommentCountEvaluator.php';
require_once __DIR__ . '/../evaluators/WeekStreakEvaluator.php';
require_once __DIR__ . '/../evaluators/IcePortionsPerWeekEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinEvaluator.php';
require_once __DIR__ . '/../evaluators/DetailedCheckinCountEvaluator.php';
require_once __DIR__ . '/../evaluators/StammkundeEvaluator.php';
require_once __DIR__ . '/../evaluators/OeffisCountEvaluator.php';
require_once __DIR__ . '/../evaluators/EPR2025Evaluator.php';
 
try {
    // Nutzer-ID prüfen
    if (!isset($_GET['nutzer_id']) || !is_numeric($_GET['nutzer_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine gültige Nutzer-ID übergeben']);
        exit;
    }
 
    $userId = (int) $_GET['nutzer_id'];
 
    // Letzte Aktivität aktualisieren
    $stmt = $pdo->prepare("UPDATE nutzer SET last_active_at = NOW() WHERE id = ?");
    $stmt->execute([$userId]);
 
    // Award-Evaluatoren durchlaufen
    $evaluators = [
        new ReferredUsersEvaluator(),
        new CountryVisitEvaluator(),
        new CommentCountEvaluator(),
        new WeekStreakEvaluator(),
        new IcePortionsPerWeekEvaluator(),
        new DetailedCheckinEvaluator(),
        new DetailedCheckinCountEvaluator(),
        new StammkundeEvaluator(),
        new OeffisCountEvaluator(),
        new EPR2025Evaluator(),
        // weitere Evaluatoren können hier ergänzt werden
    ];
 
    $newAwards = [];
    foreach ($evaluators as $evaluator) {
        try {
            $evaluated = $evaluator->evaluate($userId);
            $newAwards = array_merge($newAwards, $evaluated);
        } catch (Exception $e) {
            error_log("Fehler beim Evaluator " . get_class($evaluator) . ": " . $e->getMessage());
        }
    }
 
    // Level-Änderung prüfen
    $levelChange = updateUserLevelIfChanged($pdo, $userId);
 
    // JSON-Antwort vorbereiten
    echo json_encode([
        'status' => 'success',
        'new_awards' => $newAwards,
        'level_up' => $levelChange['level_up'] ?? false,
        'new_level' => $levelChange['level_up'] ? $levelChange['new_level'] : null,
        'level_name' => $levelChange['level_up'] ? $levelChange['level_name'] : null
    ]);
 
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Ein unerwarteter Fehler ist aufgetreten.' . $e->getMessage()
    ]);
}
?>