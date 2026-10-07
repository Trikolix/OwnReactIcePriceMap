<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/shop_ice_offerings.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? '';
    if ($method === 'GET' && $action === 'list') {
        $result = ['reports' => listShopOfferingReports($pdo, $userId, $_GET['status'] ?? 'pending')];
    } elseif ($method === 'POST' && in_array($action, ['report', 'review'], true)) {
        if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') throw new ShopOfferingError('Bitte JSON übermitteln.', 415);
        $data = json_decode(file_get_contents('php://input'), true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new ShopOfferingError('Ungültige Anfrage.', 400);
        $result = $action === 'report' ? reportShopIceOfferings($pdo, $userId, $data) : reviewShopOfferingReport($pdo, $userId, $data);
    } else {
        throw new ShopOfferingError('Diese Aktion ist nicht verfügbar.', 405);
    }
    echo json_encode(['status' => 'success'] + $result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (ShopOfferingError $e) {
    http_response_code($e->getCode());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (JsonException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige JSON-Anfrage.']);
} catch (Throwable $e) {
    error_log('Shop offerings API: ' . get_class($e) . ' ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'Angebotsangaben sind gerade nicht verfügbar. Bitte erneut versuchen.']);
}
