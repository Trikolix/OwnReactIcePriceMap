<?php
require __DIR__ . '/systemmeldung-db.php';
date_default_timezone_set('Europe/Berlin');
$pdo->exec("SET time_zone = '" . date('P') . "'");
// The minimal CLI image has no mbstring; production uses the extension.
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $value): int { return preg_match_all('/./us', $value); }
}
