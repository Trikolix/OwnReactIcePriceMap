<?php
declare(strict_types=1);

// Keep the development API on the same implementation while deliberately
// using the development database connection.
require_once __DIR__ . '/../db_connect.php';
define('PRICE_STATISTICS_TIMELINE_PDO_READY', true);

require __DIR__ . '/../../backend/api/price_statistics_timeline.php';
