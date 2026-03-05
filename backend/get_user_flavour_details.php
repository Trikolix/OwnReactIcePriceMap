<?php
require_once __DIR__ . '/db_connect.php';

$userId = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : null;
$sortenname = isset($_GET['sortenname']) ? trim($_GET['sortenname']) : null;
$iceType = isset($_GET['iceType']) ? trim($_GET['iceType']) : null;

if (!$userId || !$sortenname) {
    http_response_code(400);
    echo json_encode(['error' => 'nutzer_id und sortenname sind erforderlich.']);
    exit;
}

$params = [
    ':user_id' => $userId,
    ':sortenname' => $sortenname,
];

$typeFilter = '';
if ($iceType !== null && $iceType !== '') {
    $typeFilter = ' AND c.typ = :ice_type';
    $params[':ice_type'] = $iceType;
}

$stmt = $pdo->prepare("
    SELECT
        e.id AS eisdiele_id,
        e.name AS eisdiele_name,
        c.typ AS ice_type,
        COUNT(*) AS anzahl_checkins,
        AVG(s.bewertung) AS durchschnittsbewertung,
        MAX(c.datum) AS letzter_besuch
    FROM checkin_sorten s
    JOIN checkins c ON s.checkin_id = c.id
    JOIN eisdielen e ON c.eisdiele_id = e.id
    WHERE c.nutzer_id = :user_id
      AND s.sortenname = :sortenname
      $typeFilter
    GROUP BY e.id, e.name, c.typ
    ORDER BY
        anzahl_checkins DESC,
        (durchschnittsbewertung IS NULL),
        durchschnittsbewertung DESC,
        letzter_besuch DESC
");

$stmt->execute($params);
$entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($entries);
