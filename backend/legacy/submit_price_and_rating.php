<?php
// DEPRECATED (cleanup 2026-03): kept for external compatibility checks.
// Planned replacement path: /api/v2/reviews + /api/v2/prices

require 'db_connect.php'; // Stellt die PDO-Verbindung her

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["error" => "Ungültige JSON-Daten"]);
    exit;
}

// Parameter aus JSON extrahieren
$nutzer_id = $data['nutzer_id'];
$eisdiele_id = $data['eisdiele_id'];
$preis_kugel = isset($data['preis_kugel']) ? $data['preis_kugel'] : null;
$preis_softeis = isset($data['preis_softeis']) ? $data['preis_softeis'] : null;
$bewertung_geschmack = isset($data['bewertung_geschmack']) ? $data['bewertung_geschmack'] : null;
$bewertung_groesse_kugel = isset($data['bewertung_groesse_kugel']) ? $data['bewertung_groesse_kugel'] : null;
$bewertung_auswahl = isset($data['bewertung_auswahl']) ? $data['bewertung_auswahl'] : null;
$attribute = isset($data['attribute']) ? $data['attribute'] : [];

// PDO-Transaktion starten
$pdo->beginTransaction();

try {
    // 1️⃣ **Preise speichern oder bestätigen**
    if ($preis_kugel !== null) {
        $stmt = $pdo->prepare("
            INSERT INTO preise (eisdiele_id, nutzer_id, preis, typ, gemeldet_am)
            VALUES (?, ?, ?, 'kugel', NOW())
            ON DUPLICATE KEY UPDATE gemeldet_am = NOW()
        ");
        $stmt->execute([$eisdiele_id, $nutzer_id, $preis_kugel]);
    }

    if ($preis_softeis !== null) {
        $stmt = $pdo->prepare("
            INSERT INTO preise (eisdiele_id, nutzer_id, preis, typ, gemeldet_am)
            VALUES (?, ?, ?, 'softeis', NOW())
            ON DUPLICATE KEY UPDATE gemeldet_am = NOW()
        ");
        $stmt->execute([$eisdiele_id, $nutzer_id, $preis_softeis]);
    }

    // 2️⃣ **Bewertungen speichern oder updaten**
    if ($bewertung_geschmack !== null || $bewertung_groesse_kugel !== null || $bewertung_auswahl !== null) {
        $stmt = $pdo->prepare("
            INSERT INTO bewertungen (eisdiele_id, nutzer_id, geschmack, groesse_kugel, auswahl, bewertet_am)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE geschmack = VALUES(geschmack), groesse_kugel = VALUES(groesse_kugel), auswahl = VALUES(auswahl), bewertet_am = NOW()
        ");
        $stmt->execute([$eisdiele_id, $nutzer_id, $bewertung_geschmack, $bewertung_groesse_kugel, $bewertung_auswahl]);
    }

    // 3️⃣ **Attribute speichern**
    if (!empty($attribute)) {
        $attr_ids = [];
        foreach ($attribute as $attr) {
            // Prüfen, ob Attribut bereits existiert
            $stmt = $pdo->prepare("SELECT id FROM attribute WHERE name = ?");
            $stmt->execute([$attr]);
            $attr_id = $stmt->fetchColumn();

            if (!$attr_id) {
                // Neues Attribut einfügen
                $stmt = $pdo->prepare("INSERT INTO attribute (name) VALUES (?)");
                $stmt->execute([$attr]);
                $attr_id = $pdo->lastInsertId();
            }
            $attr_ids[] = $attr_id;
        }

        if (!empty($attr_ids)) {
            $attr_counts = array_count_values($attr_ids);
            $placeholders = [];
            $values = [];
            foreach ($attr_counts as $attr_id => $count) {
                $placeholders[] = "(?, ?, ?)";
                $values[] = $eisdiele_id;
                $values[] = $attr_id;
                $values[] = $count;
            }
            $stmt = $pdo->prepare("
                INSERT INTO eisdiele_attribute (eisdiele_id, attribute_id, anzahl)
                VALUES " . implode(', ', $placeholders) . "
                ON DUPLICATE KEY UPDATE anzahl = anzahl + VALUES(anzahl)
            ");
            $stmt->execute($values);
        }
    }

    // Alle Queries erfolgreich -> Transaktion committen
    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Daten erfolgreich gespeichert"]);
} catch (Exception $e) {
    // Fehler aufgetreten -> Rollback
    $pdo->rollBack();
    echo json_encode(["error" => "Fehler beim Speichern", "details" => $e->getMessage()]);
}
?>
