<?php
// Only copied into the isolated test backend; never load production credentials.
require __DIR__ . '/systemmeldung-db.php';
if ($testNow = getenv('CHALLENGE_TEST_NOW')) {
    $timestamp = (new DateTimeImmutable($testNow, new DateTimeZone('UTC')))->getTimestamp();
    $pdo->exec('SET timestamp = ' . $timestamp);
}
