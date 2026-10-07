<?php
require getenv('ICE_DATE_TEST_BACKEND') . '/db_connect.php';
require getenv('ICE_DATE_TEST_BACKEND') . '/lib/ice_dates.php';
$user = (int)$argv[2];
file_put_contents($argv[4] . '-' . $user, 'ready');
try {
    $detail = iceDateRespond($pdo, $user, ['ice_date_id' => (int)$argv[1], 'status' => 'going', 'invite_token' => $argv[3]]);
    echo json_encode(['status' => 200, 'reserved' => $detail['reserved_count']]);
} catch (IceDateError $error) { echo json_encode(['status' => $error->getCode()]); }
