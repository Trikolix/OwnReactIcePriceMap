<?php
require_once  __DIR__ . '/db_connect.php';
require_once  __DIR__ . '/lib/checkin.php';
require_once  __DIR__ . '/lib/levelsystem.php';
require_once  __DIR__ . '/lib/review.php';
require_once  __DIR__ . '/lib/route_helpers.php';
require_once  __DIR__ . '/lib/user_profile.php';

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

// Anzahl besuchter Eisdielen & Checkins pro Landkreis
$sql5 = "SELECT l.name AS landkreis,
                COUNT(DISTINCT c.eisdiele_id) AS eisdielen,
                COUNT(*) AS checkins
         FROM checkins c
         JOIN eisdielen e ON c.eisdiele_id = e.id
         LEFT JOIN landkreise l ON e.landkreis_id = l.id
         WHERE c.nutzer_id = ?
         GROUP BY e.landkreis_id, l.name
         ORDER BY checkins DESC";

// Meistgegessene Geschmacksrichtungen
$sql6 = "SELECT s.sortenname, AVG(s.bewertung) AS bewertung, COUNT(*) AS anzahl
         FROM checkin_sorten s
         JOIN checkins c ON s.checkin_id = c.id
         WHERE c.nutzer_id = ?
         GROUP BY s.sortenname
         ORDER BY anzahl DESC, bewertung DESC";

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

// Meistbesuchte Eisdielen
$sql8 = "SELECT e.id AS eisdiele_id, e.name, COUNT(*) AS besuche
         FROM checkins c
         JOIN eisdielen e ON e.id = c.eisdiele_id
         WHERE c.nutzer_id = ?
         GROUP BY e.id, e.name
         ORDER BY besuche DESC";

// Bestbewertete Sorten
$sql9 = "SELECT s.sortenname, AVG(s.bewertung) AS durchschnitt, COUNT(*) AS anzahl
         FROM checkin_sorten s
         JOIN checkins c ON s.checkin_id = c.id
         WHERE c.nutzer_id = ?
         GROUP BY s.sortenname
         ORDER BY durchschnitt DESC, anzahl DESC";

// Verteilung der Anreisearten
$sql10 = "SELECT anreise, COUNT(*) AS anzahl
          FROM checkins
          WHERE nutzer_id = ? AND anreise IS NOT NULL AND anreise <> ''
          GROUP BY anreise
          ORDER BY anzahl DESC";

// Aktivität pro Land
$sql11 = "SELECT la.name AS land,
                 COUNT(DISTINCT c.eisdiele_id) AS eisdielen,
                 COUNT(*) AS checkins
          FROM checkins c
          JOIN eisdielen e ON c.eisdiele_id = e.id
          LEFT JOIN laender la ON e.land_id = la.id
          WHERE c.nutzer_id = ?
          GROUP BY e.land_id, la.name
          ORDER BY checkins DESC";

// Aktivität pro Bundesland
$sql12 = "SELECT bl.name AS bundesland,
                 COUNT(DISTINCT c.eisdiele_id) AS eisdielen,
                 COUNT(*) AS checkins
          FROM checkins c
          JOIN eisdielen e ON c.eisdiele_id = e.id
          LEFT JOIN bundeslaender bl ON e.bundesland_id = bl.id
          WHERE c.nutzer_id = ?
          GROUP BY e.bundesland_id, bl.name
          ORDER BY checkins DESC";

$checkins = getCheckinsByNutzerId($pdo, $nutzerId);
$levelInfo = getLevelInformationForUser($pdo, $nutzerId);

// User Reviews
$reviews = getReviewsByNutzerId($pdo, $nutzerId);

// User Routen
$stmtRouten = $pdo->prepare("SELECT r.*, n.username, up.avatar_path AS avatar_url
        FROM routen r
        JOIN nutzer n ON r.nutzer_id = n.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE r.nutzer_id = :nutzer_id AND (r.ist_oeffentlich = TRUE OR r.nutzer_id = :cur_user_id)
        ORDER BY r.erstellt_am DESC");
$stmtRouten->execute(['nutzer_id' => $nutzerId, 'cur_user_id' => $curUserId]);

$routen = $stmtRouten->fetchAll(PDO::FETCH_ASSOC);
$routeShopMap = getRouteIceShops($pdo, array_column($routen, 'id'));
foreach ($routen as &$routeEntry) {
    $rid = (int)$routeEntry['id'];
    $routeEntry['eisdielen'] = $routeShopMap[$rid] ?? [];
    if (!empty($routeEntry['eisdielen'])) {
        $routeEntry['eisdiele_id'] = $routeEntry['eisdielen'][0]['id'];
        $routeEntry['eisdiele_name'] = $routeEntry['eisdielen'][0]['name'];
    }
}
unset($routeEntry);

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
            case 4: $stats['aktivitaet_landkreis'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 5: $stats['meistgegessene_eissorten'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
            case 6: $stats['user_awards'] = $stmt->fetchAll(PDO::FETCH_ASSOC); break;
        }
    }
    $stats['avatar_url'] = getUserAvatarPath($pdo, $nutzerId);

    $stmt = $pdo->prepare($sql8);
    $stmt->execute([$nutzerId]);
    $stats['meistbesuchte_eisdielen'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare($sql9);
    $stmt->execute([$nutzerId]);
    $stats['best_bewertete_eissorten'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare($sql10);
    $stmt->execute([$nutzerId]);
    $stats['anreise_verteilung'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare($sql11);
    $stmt->execute([$nutzerId]);
    $stats['aktivitaet_land'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare($sql12);
    $stmt->execute([$nutzerId]);
    $stats['aktivitaet_bundesland'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
