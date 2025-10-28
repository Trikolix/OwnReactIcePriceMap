<?php
require_once '../db_connect.php';

header('Content-Type: application/json');

try {
    // Alle Awards holen
    $stmt = $pdo->query("SELECT id, code, category FROM awards ORDER BY id DESC");
    $awards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Für jeden Award die Levels holen
    foreach ($awards as &$award) {
        $stmtLevel = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                                    FROM award_levels 
                                    WHERE award_id = ? 
                                    ORDER BY level ASC");
        $stmtLevel->execute([$award['id']]);
        $award['levels'] = $stmtLevel->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($awards);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Abrufen der Awards: ' . $e->getMessage()]);
}
