<?php
require_once '../db_connect.php';
require_once '../../backend_dev/db_connect.php'; // Entwicklungsdatenbank

header('Content-Type: application/json');

try {
    // Alle Awards holen (Produktiv)
    $stmt = $pdo->query("SELECT id, code, category FROM awards ORDER BY id DESC");
    $awards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Für jeden Award die Levels holen (Produktiv)
    foreach ($awards as &$award) {
        $stmtLevel = $pdo->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                                    FROM award_levels 
                                    WHERE award_id = ? 
                                    ORDER BY level ASC");
        $stmtLevel->execute([$award['id']]);
        $award['levels'] = $stmtLevel->fetchAll(PDO::FETCH_ASSOC);
            // Auch in Entwicklung sicherstellen (nur lesend, keine Änderung)
            $stmtLevelDev = $pdo_dev->prepare("SELECT level, threshold, icon_path, title_de, description_de, ep
                                        FROM award_levels 
                                        WHERE award_id = ? 
                                        ORDER BY level ASC");
            $stmtLevelDev->execute([$award['id']]);
            // Optional: $award['levels_dev'] = $stmtLevelDev->fetchAll(PDO::FETCH_ASSOC);
    }

    // Optional: Auch aus Entwicklung lesen (z.B. zum Vergleich, hier aber nur Produktiv zurückgeben)

    echo json_encode($awards);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Abrufen der Awards: ' . $e->getMessage()]);
}
