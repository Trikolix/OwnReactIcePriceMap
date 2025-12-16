<?php
// cron_update_eisdielen_status.php
// Dieses Skript wird täglich ausgeführt, um den Status der Eisdielen anhand von closing_date und reopening_date zu aktualisieren.

require_once __DIR__ . '/../db_connect.php';

// Aktuelles Datum im Format YYYY-MM-DD
$today = date('Y-m-d');

try {
    // 1. Eisdielen mit seasonal_closed setzen, wenn closing_date <= heute und status = 'open'
    $sqlClose = "UPDATE eisdielen SET status = 'seasonal_closed', closing_date = NULL WHERE closing_date IS NOT NULL AND closing_date <= :today AND status = 'open'";
    $stmtClose = $pdo->prepare($sqlClose);
    $stmtClose->execute([':today' => $today]);

    // 2. Eisdielen wieder öffnen, wenn reopening_date <= heute und status = 'seasonal_closed'
    $sqlOpen = "UPDATE eisdielen SET status = 'open', reopening_date = NULL WHERE reopening_date IS NOT NULL AND reopening_date <= :today AND status = 'seasonal_closed'";
    $stmtOpen = $pdo->prepare($sqlOpen);
    $stmtOpen->execute([':today' => $today]);

    echo "Status-Update erfolgreich abgeschlossen.\n";
} catch (Exception $e) {
    echo "Fehler beim Status-Update: " . $e->getMessage() . "\n";
    exit(1);
}
