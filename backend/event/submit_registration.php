<?php
require_once  __DIR__ . '/../db_connect.php';

// 1. Tabellen sicherstellen
$tableSchemas = [
    "CREATE TABLE IF NOT EXISTS `event_anmeldungen` (
        `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `user_id` int DEFAULT NULL,
        `payment_session_id` varchar(255) NOT NULL,
        `vorname_nachname` varchar(255) NOT NULL,
        `email` varchar(255) NOT NULL,
        `team_name` varchar(255) DEFAULT NULL,
        `status` enum('ausstehend','bezahlt','storniert') DEFAULT 'ausstehend',
        `reg_token` varchar(64) DEFAULT NULL,
        `erstellt_am` timestamp DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS `event_bestellungen` (
        `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `payment_session_id` varchar(255) NOT NULL,
        `typ` enum('startgebuehr', 'trikot', 'spende') NOT NULL,
        `groesse` varchar(10) DEFAULT NULL,
        `anzahl` int DEFAULT 1,
        `einzelpreis` decimal(10,2) NOT NULL,
        `gesamtpreis` decimal(10,2) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
];

foreach ($tableSchemas as $sql) {
    $pdo->exec($sql);
}

// 2. JSON Daten einlesen
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Ungültige JSON Daten"]);
    exit;
}

// 3. Transaktion starten
try {
    $pdo->beginTransaction();

    // Eindeutige ID für diese Transaktion/Zahlung (z.B. für Stripe/PayPal)
    $paymentSessionId = "SES_" . uniqid() . "_" . bin2hex(random_bytes(4));
    
    // Konstanten (Sollten idealerweise aus einer DB-Konfiguration kommen)
    $ENTRY_FEE = 15.00;
    $JERSEY_PRICE = 69.00;

    // A. Teilnehmer & Startgebühren speichern
    $stmtAnmeldung = $pdo->prepare("INSERT INTO event_anmeldungen 
        (user_id, payment_session_id, vorname_nachname, email, team_name, reg_token) 
        VALUES (?, ?, ?, ?, ?, ?)");
    
    $stmtBestellung = $pdo->prepare("INSERT INTO event_bestellungen 
        (payment_session_id, typ, groesse, anzahl, einzelpreis, gesamtpreis) 
        VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($data['participants'] as $index => $p) {
        // Token generieren, falls kein Account verknüpft ist (für spätere Registrierung)
        $regToken = (!$data['isLoggedIn'] || $index > 0) ? bin2hex(random_bytes(32)) : null;
        
        // Der erste Teilnehmer bekommt die userId, wenn eingeloggt
        $currentUserId = ($index === 0 && isset($data['registeredByUserId'])) ? $data['registeredByUserId'] : null;

        $stmtAnmeldung->execute([
            $currentUserId,
            $paymentSessionId,
            $p['name'],
            $p['email'],
            $data['teamName'] ?? null,
            $regToken
        ]);

        // Pro Teilnehmer eine Startgebühr-Position
        $stmtBestellung->execute([
            $paymentSessionId,
            'startgebuehr',
            null,
            1,
            $ENTRY_FEE,
            $ENTRY_FEE
        ]);
    }

    // B. Trikots speichern
    if (!empty($data['jerseyOrders'])) {
        foreach ($data['jerseyOrders'] as $order) {
            $totalJerseyPrice = $order['quantity'] * $JERSEY_PRICE;
            $stmtBestellung->execute([
                $paymentSessionId,
                'trikot',
                $order['size'],
                $order['quantity'],
                $JERSEY_PRICE,
                $totalJerseyPrice
            ]);
        }
    }

    // C. Spende speichern
    if (isset($data['donation']) && floatval($data['donation']) > 0) {
        $donationAmount = floatval($data['donation']);
        $stmtBestellung->execute([
            $paymentSessionId,
            'spende',
            null,
            1,
            $donationAmount,
            $donationAmount
        ]);
    }

    // Alles okay -> Commit
    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Anmeldung erfolgreich gespeichert",
        "payment_session_id" => $paymentSessionId,
        "total_cost" => $data['totalCost']
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Fehler: " . $e->getMessage()]);
}
?>