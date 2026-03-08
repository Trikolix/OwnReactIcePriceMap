<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/levelsystem.php';

function initializeUserLevels(PDO $pdo) {
    $stmt = $pdo->query("SELECT id FROM nutzer");
    $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($userIds as $userId) {
        $levelInfo = getLevelInformationForUser($pdo, $userId);
        if ($levelInfo) {
            $update = $pdo->prepare("UPDATE nutzer SET current_level = :level WHERE id = :id");
            $update->execute([
                'level' => $levelInfo['level'],
                'id' => $userId
            ]);
        }
    }

    echo "Alle Nutzer-Levels aktualisiert.\n";
}

// Starte die Initialisierung
initializeUserLevels($pdo);
?>