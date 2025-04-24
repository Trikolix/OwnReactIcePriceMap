<?php
require_once  __DIR__ . '/db_connect.php';

$nutzerId = intval($_GET['nutzer_id']); // z.B. ?nutzer_id=1

// Nutzername ermitteln
$sql1 = "SELECT username, erstellt_am AS erstellungsdatum
         FROM nutzer WHERE id = ?";

// Anzahl unterschiedlicher besuchter Eisdielen
$sql2 = "SELECT COUNT(DISTINCT eisdiele_id) AS eisdielen_besucht
         FROM checkins
         WHERE nutzer_id = ?";

// Anzahl an Checkins
$sql3 = "SELECT COUNT(DISTINCT c.id) AS anzahl_checkins
         FROM checkins c
         JOIN checkin_sorten s ON c.id = s.checkin_id
         WHERE c.nutzer_id = ?";

// Anzahl gegessener Eisarten (Kugeln, Softeis, Eisbecher)
$sql4 = "SELECT c.typ, COUNT(s.id) AS anzahl_eis
         FROM checkins c
         JOIN checkin_sorten s ON s.checkin_id = c.id
         WHERE c.nutzer_id = ?
         GROUP BY c.typ";

// Anzahl besuchter Eisdielen pro Landkreis
$sql5 = "SELECT l.name AS landkreis, COUNT(DISTINCT c.eisdiele_id) AS anzahl
         FROM checkins c
         JOIN eisdielen e ON c.eisdiele_id = e.id
         JOIN landkreise l ON e.landkreis_id = l.id
         WHERE c.nutzer_id = ?
         GROUP BY l.id, l.name
         ORDER BY anzahl DESC";

// Top 5 Geschmacksrichtung
$sql6 = "SELECT s.sortenname, COUNT(*) AS anzahl
         FROM checkin_sorten s
         JOIN checkins c ON s.checkin_id = c.id
         WHERE c.nutzer_id = ?
         GROUP BY s.sortenname
         ORDER BY anzahl DESC, s.sortenname ASC
         LIMIT 5";

// User Awards
$sql7 = "SELECT 
             ua.award_id,
             ua.level,
             al.title_de,
             al.description_de,
             al.icon_path,
             ua.awarded_at
         FROM user_awards ua
         JOIN award_levels al 
           ON ua.award_id = al.award_id AND ua.level = al.level
         WHERE ua.user_id = ?
         ORDER BY ua.awarded_at DESC";

// Ausführen & Ergebnisse sammeln
try {
    $stats = [];

    foreach ([$sql1, $sql2, $sql3, $sql4, $sql5, $sql6, $sql7] as $i => $query) {
        $stmt = $pdo->prepare($query);
        $stmt->execute([$nutzerId]);

        switch ($i) {
            case 0: 
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $stats['nutzername'] = $row['username'];
                $stats['erstellungsdatum'] = $row['erstellungsdatum'];
                break;
            case 1: $stats['eisdielen_besucht'] = $stmt->fetchColumn(); break;
            case 2: $stats['anzahl_checkins'] = $stmt->fetchColumn(); break;
            case 3: $stats['eisarten'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); break;
            case 4: $stats['eisdielen_pro_landkreis'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 5: $stats['top_5_geschmacksrichtung'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 6: $stats['user_awards'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
        }
    }

    header('Content-Type: application/json');
    echo json_encode($stats);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}


?>