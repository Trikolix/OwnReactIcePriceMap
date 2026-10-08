<?php
require_once __DIR__ . '/db_connect.php';

try {
    $includeSecondary = isset($_GET['include_secondary']) && (int)$_GET['include_secondary'] === 1;
    $placeCondition = $includeSecondary
        ? "(place_type <> 'temporary_stand' OR (active_until >= CURRENT_TIMESTAMP AND closed_early_at IS NULL))"
        : "place_type = 'ice_shop'";

    $stmt = $pdo->query("
        SELECT id, name, adresse, latitude, longitude, place_type, active_until
        FROM eisdielen
        WHERE {$placeCondition}
        ORDER BY name ASC
    ");
    $shops = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($shops);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Konnte Eisdielen nicht laden.']);
}
