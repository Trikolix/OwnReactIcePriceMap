<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/currency.php';

try {
    syncCountryCurrencies($pdo);
    $updatedPairs = syncExchangeRatesForAllCurrencies($pdo);

    echo "Wechselkurse erfolgreich aktualisiert. {$updatedPairs} Kurse verarbeitet.\n";

    $stmt = $pdo->query("
        SELECT
            w1.code AS von_waehrung,
            w2.code AS zu_waehrung,
            wk.kurs,
            wk.aktualisiert_am
        FROM wechselkurse wk
        JOIN waehrungen w1 ON wk.von_waehrung_id = w1.id
        JOIN waehrungen w2 ON wk.zu_waehrung_id = w2.id
        WHERE w1.code = 'EUR' OR w2.code = 'EUR'
        ORDER BY w1.code, w2.code
    ");

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf(
            "%-8s -> %-8s: %10.6f (aktualisiert: %s)\n",
            $row['von_waehrung'],
            $row['zu_waehrung'],
            $row['kurs'],
            $row['aktualisiert_am']
        );
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo "Fehler beim Aktualisieren der Wechselkurse: " . $e->getMessage() . "\n";
}
