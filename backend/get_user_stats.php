<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';
require_once  __DIR__ . '/lib/levelsystem.php';

$nutzerId = intval($_GET['nutzer_id']); // z.B. ?nutzer_id=1
$curUserId = intval($_GET['cur_user_id']);

// Nutzername ermitteln
$sql1 = "SELECT username, erstellt_am AS erstellungsdatum, invite_code
         FROM nutzer WHERE id = ?";

// Anzahl unterschiedlicher besuchter Eisdielen
$sql2 = "SELECT COUNT(DISTINCT eisdiele_id) AS eisdielen_besucht
         FROM checkins
         WHERE nutzer_id = ?";

// Anzahl an Checkins
$sql3 = "SELECT COUNT(DISTINCT id) AS anzahl_checkins
         FROM checkins
         WHERE nutzer_id = ?";

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
$sql6 = "SELECT s.sortenname, AVG(s.bewertung) AS bewertung, COUNT(*) AS anzahl
         FROM checkin_sorten s
         JOIN checkins c ON s.checkin_id = c.id
         WHERE c.nutzer_id = ?
         GROUP BY s.sortenname
         ORDER BY anzahl DESC, bewertung DESC
         LIMIT 5";

// User Awards
$sql7 = "SELECT 
             ua.award_id,
             ua.level,
             al.title_de,
             al.description_de,
             al.icon_path,
             al.ep,
             ua.awarded_at
         FROM user_awards ua
         JOIN award_levels al 
           ON ua.award_id = al.award_id AND ua.level = al.level
         WHERE ua.user_id = ?
         ORDER BY ua.awarded_at DESC";

$checkins = getCheckinsByNutzerId($pdo, $nutzerId);
$levelInfo = getLevelInformationForUser($pdo, $nutzerId);

// User Reviews
$stmtReviews = $pdo->prepare("SELECT b.*,
                                     e.name AS eisdiele_name,
                                     n.username AS nutzer_name,
                                     n.id AS nutzer_id                            
                              FROM bewertungen b
                              JOIN eisdielen e ON b.eisdiele_id = e.id
                              JOIN nutzer n ON b.nutzer_id = n.id
                              WHERE b.nutzer_id = :nutzerId
                              ORDER BY b.erstellt_am DESC
                            ");
$stmtReviews->execute(['nutzerId' => $nutzerId]);
$reviews = $stmtReviews->fetchAll(PDO::FETCH_ASSOC);

// User Routen
$stmtRouten = $pdo->prepare("SELECT r.*, n.username
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        WHERE r.nutzer_id = :nutzer_id AND (r.ist_oeffentlich = TRUE OR r.nutzer_id = :cur_user_id)
        ORDER BY r.erstellt_am DESC");
$stmtRouten->execute(['nutzer_id' => $nutzerId, 'cur_user_id' => $curUserId]);

$routen = $stmtRouten->fetchAll(PDO::FETCH_ASSOC);

// Bewertungen durchgehen und Attribute anhängen
foreach ($reviews as &$review) { // ACHTUNG: Referenz verwenden (&$review)
    $stmtAttr = $pdo->prepare("
        SELECT a.name 
        FROM bewertung_attribute ba 
        JOIN attribute a ON ba.attribut_id = a.id 
        WHERE ba.bewertung_id = :bewertungId
    ");
    $stmtAttr->execute(['bewertungId' => $review['id']]);
    $attributes = $stmtAttr->fetchAll(PDO::FETCH_COLUMN);
    $review['bewertung_attribute'] = $attributes;
}
// Referenz wieder auflösen
unset($review);

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
                $stats['invite_code'] = $row['invite_code'] ?? null;
                break;
            case 1: $stats['eisdielen_besucht'] = $stmt->fetchColumn(); break;
            case 2: $stats['anzahl_checkins'] = $stmt->fetchColumn(); break;
            case 3: $stats['eisarten'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); break;
            case 4: $stats['eisdielen_pro_landkreis'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 5: $stats['top_5_geschmacksrichtung'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 6: $stats['user_awards'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
        }
    }
    $stats["checkins"] = $checkins; // Checkins hinzufügen
    $stats["reviews"] = $reviews; // Reviews hinzufügen
    $stats["routen"] = $routen; // Routen hinzufügen
    $stats["level_info"] = $levelInfo; // Level Info hinzufügen

    echo json_encode($stats);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}


?>