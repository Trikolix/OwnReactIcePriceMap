<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/systemmeldung_worker.php';

$options = getopt('', ['limit::']);
$limit = isset($options['limit']) ? (int)$options['limit'] : 20;

$result = processSystemDeliveryQueue($pdo, $limit);

echo json_encode($result, JSON_UNESCAPED_UNICODE) . "\n";
