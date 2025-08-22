<?php
require_once  __DIR__ . '/../db_connect.php';

$nutzer_id = isset($_GET['nutzer_id']) ? (int)$_GET['nutzer_id'] : 0;

if ($nutzer_id <= 0) {
    echo json_encode(["error" => "Ungültige Nutzer-ID"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.nutzer_id,
            c.difficulty,
            c.type,
            c.valid_until,
            e.id AS shop_id,
            e.name AS shop_name,
            e.adresse AS shop_address
        FROM challenges c
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.nutzer_id = :nutzer_id
          AND c.valid_until > NOW()
        ORDER BY c.valid_until ASC
    ");
    $stmt->execute(['nutzer_id' => $nutzer_id]);
    $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($challenges);
} catch (PDOException $e) {
    echo json_encode([
        "error" => "DB-Fehler beim Laden der Challenges",
        "details" => $e->getMessage()
    ]);
}
?>