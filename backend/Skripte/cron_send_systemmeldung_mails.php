<?php

require_once __DIR__ . '/../systemmeldung.php';

$options = getopt('', ['limit::']);
$limit = isset($options['limit']) ? (int)$options['limit'] : 20;

$result = processSystemMailQueue($pdo, $limit);

echo "Systemmeldung-Mail-Queue: verarbeitet {$result['processed']}, gesendet {$result['sent']}, fehlgeschlagen {$result['failed']}, offen {$result['remaining']}\n";

