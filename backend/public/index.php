<?php

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../src/Shared/JsonResponse.php';
require_once __DIR__ . '/../src/Modules/Shops/Controllers/ShopsController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';

$apiPos = strpos($path, '/api/v2/');
if ($apiPos === false) {
    json_error('Route nicht gefunden.', 404);
    exit;
}

$apiPath = substr($path, $apiPos);
$normalizedPath = rtrim($apiPath, '/');
if ($normalizedPath === '') {
    $normalizedPath = '/';
}

if ($method === 'GET' && $normalizedPath === '/api/v2/shops') {
    shops_list($pdo);
    exit;
}

if ($method === 'GET' && preg_match('#^/api/v2/shops/(\d+)$#', $normalizedPath, $matches)) {
    shops_show($pdo, (int) $matches[1]);
    exit;
}

json_error('Route nicht gefunden.', 404);
