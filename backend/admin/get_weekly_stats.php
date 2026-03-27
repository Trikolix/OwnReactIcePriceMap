<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

header('Content-Type: application/json; charset=utf-8');

$auth = requireAuth($pdo);
$allowedUserIds = [1, 2];
if (!in_array((int) $auth['user_id'], $allowedUserIds, true)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Forbidden',
    ]);
    exit;
}

$stmt = $pdo->query("
    SELECT *
    FROM wochenstatistiken
    ORDER BY start_datum ASC
");

$weeks = $stmt->fetchAll(PDO::FETCH_ASSOC);

$countryDistributionStmt = $pdo->prepare("
    SELECT
        COALESCE(l.name, 'Unbekannt') AS land_name,
        COUNT(*) AS anzahl
    FROM checkins c
    JOIN eisdielen e ON e.id = c.eisdiele_id
    LEFT JOIN laender l ON l.id = e.land_id
    WHERE c.datum >= :start
      AND c.datum < DATE_ADD(:end, INTERVAL 1 DAY)
    GROUP BY COALESCE(l.name, 'Unbekannt')
    ORDER BY anzahl DESC, land_name ASC
");

$distinctCountryCountStmt = $pdo->prepare("
    SELECT COUNT(DISTINCT e.land_id) AS laender_mit_checkins
    FROM checkins c
    JOIN eisdielen e ON e.id = c.eisdiele_id
    WHERE c.datum >= :start
      AND c.datum < DATE_ADD(:end, INTERVAL 1 DAY)
      AND e.land_id IS NOT NULL
");

$onSiteDistributionStmt = $pdo->prepare("
    SELECT
        CASE
            WHEN c.is_on_site = 1 THEN 'Vor Ort'
            ELSE 'Nicht vor Ort'
        END AS ort_status,
        COUNT(*) AS anzahl
    FROM checkins c
    WHERE c.datum >= :start
      AND c.datum < DATE_ADD(:end, INTERVAL 1 DAY)
    GROUP BY CASE
        WHEN c.is_on_site = 1 THEN 'Vor Ort'
        ELSE 'Nicht vor Ort'
    END
    ORDER BY anzahl DESC, ort_status ASC
");

foreach ($weeks as &$week) {
    $params = [
        'start' => $week['start_datum'],
        'end' => $week['end_datum'],
    ];

    $countryDistributionStmt->execute($params);
    $week['verteilung_laender'] = json_encode(
        $countryDistributionStmt->fetchAll(PDO::FETCH_ASSOC),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    $distinctCountryCountStmt->execute($params);
    $distinctCountryCount = $distinctCountryCountStmt->fetchColumn();
    $week['laender_mit_checkins'] = (int) ($distinctCountryCount !== false ? $distinctCountryCount : ($week['laender_mit_checkins'] ?? 0));

    $onSiteDistributionStmt->execute($params);
    $week['verteilung_ort'] = json_encode(
        $onSiteDistributionStmt->fetchAll(PDO::FETCH_ASSOC),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
}
unset($week);

echo json_encode([
    'status' => 'success',
    'weeks' => $weeks,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
