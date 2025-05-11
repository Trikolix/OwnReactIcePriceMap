<?php

function getCheckinById(PDO $pdo, int $id): ?array {
    $stmt = $pdo->prepare("
        SELECT c.*,
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name
        FROM checkins c
        JOIN nutzer n ON n.id = c.nutzer_id
        JOIN eisdielen e ON e.id = c.eisdiele_id
        WHERE c.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $checkin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$checkin) return null;

    $checkin['eissorten'] = getSortenForCheckin($pdo, $id);
    $checkin['bilder'] = getBilderForCheckin($pdo, $id);

    return $checkin;
}

function getSortenForCheckin(PDO $pdo, int $checkinId): array {
    $stmt = $pdo->prepare("
        SELECT sortenname, bewertung
        FROM checkin_sorten
        WHERE checkin_id = :id
    ");
    $stmt->execute(['id' => $checkinId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getBilderForCheckin(PDO $pdo, int $checkinId): array {
    $stmt = $pdo->prepare("
        SELECT *
        FROM bilder b
        WHERE b.checkin_id = :id
    ");
    $stmt->execute(['id' => $checkinId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getCheckinsByEisdieleId(PDO $pdo, int $eisdieleId): array {
    $stmt = $pdo->prepare("
        SELECT c.*, 
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               e.adresse
        FROM checkins c
        JOIN nutzer n ON c.nutzer_id = n.id
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.eisdiele_id = ?
        ORDER BY c.datum DESC
    ");
    $stmt->execute([$eisdieleId]);
    $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($checkins as &$checkin) {
        $checkin['eissorten'] = getSortenByCheckinId($pdo, $checkin['id']);
        $checkin['bilder'] = getBilderForCheckin($pdo, $checkin['id']);
    }
    return $checkins;
}

function getCheckins(PDO $pdo, string $sort = 'datum', string $order = 'DESC', ?int $limit = null): array {
    $allowedSort = ['datum', 'geschmackbewertung', 'preisleistungsbewertung'];
    $allowedOrder = ['ASC', 'DESC'];

    if (!in_array($sort, $allowedSort)) $sort = 'datum';
    if (!in_array(strtoupper($order), $allowedOrder)) $order = 'DESC';

    $sql = "
        SELECT c.*, 
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               e.adresse
        FROM checkins c
        JOIN nutzer n ON c.nutzer_id = n.id
        JOIN eisdielen e ON c.eisdiele_id = e.id
        ORDER BY c.$sort $order
    ";
    if ($limit !== null) {
        $sql .= " LIMIT :limit";
    }

    $stmt = $pdo->prepare($sql);
    if ($limit !== null) {
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    }
    $stmt->execute();
    $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($checkins as &$checkin) {
        $checkin['eissorten'] = getSortenForCheckin($pdo, $checkin['id']);
        $checkin['bilder'] = getBilderForCheckin($pdo, $checkin['id']);
    }
    return $checkins;
}

function countCheckinsByNutzerId(PDO $pdo, int $nutzerId): int {
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT id) AS anzahl_checkins FROM checkins WHERE nutzer_id = ?");
    $stmt->execute([$nutzerId]);
    return (int) $stmt->fetchColumn();
}

function getCheckinsByNutzerId(PDO $pdo, int $nutzerId): array {
    $sql = "SELECT c.*, 
                   n.id AS nutzer_id,
                   n.username AS nutzer_name,
                   e.name AS eisdiele_name,
                   e.adresse
            FROM checkins c
            JOIN nutzer n ON c.nutzer_id = n.id
            JOIN eisdielen e ON c.eisdiele_id = e.id
            WHERE c.nutzer_id = :nutzerId
            ORDER BY c.datum DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':nutzerId', $nutzerId, PDO::PARAM_INT);
    $stmt->execute();
    $checkins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($checkins as &$checkin) {
        $checkin['eissorten'] = getSortenForCheckin($pdo, $checkin['id']);
        $checkin['bilder'] = getBilderForCheckin($pdo, $checkin['id']);
    }
    return $checkins;
}

?>