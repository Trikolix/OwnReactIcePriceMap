<?php
declare(strict_types=1);
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
$auth = requireAuth($pdo);
if ((int)$auth['user_id'] !== 1) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Nur für den Administrator.']);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['status' => 'error', 'message' => 'Bitte GET verwenden.']);
    exit;
}

try {
    $counts = [];
    foreach (['shop_changes' => 'eisdiele_change_requests', 'ice_offerings' => 'shop_ice_offering_reports'] as $key => $table) {
        try {
            $counts[$key] = (int)$pdo->query("SELECT COUNT(*) FROM $table WHERE status = 'pending'")->fetchColumn();
        } catch (PDOException $e) {
            // Keep the menu usable before the respective feature migration is installed.
            if ($e->getCode() !== '42S02') throw $e;
            $counts[$key] = 0;
        }
    }
    echo json_encode(['status' => 'success', 'pending_count' => array_sum($counts)] + $counts);
} catch (Throwable $e) {
    error_log('Shop change request count: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'Offene Vorschläge konnten nicht gezählt werden.']);
}
