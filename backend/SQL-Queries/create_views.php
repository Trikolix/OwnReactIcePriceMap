<?php
// Datenbankverbindung einbinden
require_once __DIR__ . '/../db_connect.php'; // Passe den Pfad bei Bedarf an

$verzeichnis = __DIR__; // Aktuelles Verzeichnis

// Alle .sql-Dateien im Verzeichnis laden
$sqlDateien = glob($verzeichnis . '/*.sql');

foreach ($sqlDateien as $datei) {
    echo "Verarbeite Datei: " . basename($datei) . "\n";

    // Dateiinhalt laden
    $sql = file_get_contents($datei);

    if ($sql === false) {
        echo "Fehler beim Lesen der Datei: " . $datei . "\n";
        continue;
    }

    try {
        // SQL ausführen (nur für einfache Statements oder Views ohne DELIMITER etc.)
        $pdo->exec($sql);
        echo "Erfolgreich ausgeführt: " . basename($datei) . "\n";
    } catch (PDOException $e) {
        echo "Fehler in Datei " . basename($datei) . ": " . $e->getMessage() . "\n";
    }
}

?>