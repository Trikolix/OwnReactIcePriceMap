<?php
require_once __DIR__ . '/db_connect.php';

try {
    $stmt = $pdo->query("
        SELECT id, name, adresse
        FROM eisdielen
        ORDER BY name ASC
    ");
    $shops = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($shops);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Konnte Eisdielen nicht laden.']);
}
