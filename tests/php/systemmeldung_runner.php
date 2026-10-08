<?php
$root = getenv('ICE_SYSTEM_TEST_BACKEND');
if (!$root || strpos($root, '/tmp/ice-system-test/') !== 0) throw new RuntimeException('Isolated backend required');
require_once $root . '/db_connect.php';
require_once $root . '/lib/systemmeldung_worker.php';
if ($argv[1] === 'publish') {
    echo json_encode(systemmeldungPublish($pdo, json_decode(base64_decode($argv[2]), true), 1));
} else {
    processSystemDeliveryQueue($pdo, 100, 3, function ($pdo, $job, $push, $target) use ($argv) {
        file_put_contents($argv[2], ($push ? 'push' : 'mail') . ':' . $job['id'] . "\n", FILE_APPEND | LOCK_EX);
        usleep(20000);
        return ['status' => 200, 'body' => '', 'headers' => []];
    });
}
