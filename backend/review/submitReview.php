<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/image_upload.php';

// 1. Hole POST-Daten direkt aus $_POST (da multipart/form-data)
$userId = $_POST['userId'] ?? null;
$shopId = $_POST['shopId'] ?? null;
$auswahl = $_POST['auswahl'] ?? null;
$beschreibung = $_POST['beschreibung'] ?? null;
$bestehendeBilder = json_decode($_POST['bestehende_bilder'] ?? '[]', true); // erwartet Pfade wie "uploads/bewertungen/dateiname.jpg"
$beschreibungen = json_decode($_POST['bild_beschreibungen'] ?? '[]', true);

// selectedAttributes als Array, kann mehrfach gesendet werden (selectedAttributes[])
// Falls nur 1 Wert, kann es String sein, also sicherstellen, dass es Array ist
$selectedAttributes = $_POST['selectedAttributes'] ?? [];
if (!is_array($selectedAttributes)) {
    $selectedAttributes = [$selectedAttributes];
}

// Für einfacheren Zugriff indexieren wir die alten Bilder nach ID
$bestehendeBilderAssoc = [];
foreach ($bestehendeBilder as $bild) {
    $bestehendeBilderAssoc[$bild['id']] = $bild;
}
// Neue Bilder verarbeiten
$uploadDir = '../../uploads/bewertungen/';
if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);$bildUrls = [];
if (isset($_FILES['bilder']) && is_array($_FILES['bilder']['tmp_name'])) {
    try {
        $bildUrls = processUploadedImages(
            $_FILES['bilder'],
            '../../uploads/bewertungen/',
            'checkin_',
            $_POST['beschreibungen'] ?? []
        );
    } catch (Exception $e) {
        respondWithError($e->getMessage());
    }
}

// bestehende_bilder als JSON-String, also decodieren
$bestehende_bilder = [];
if (!empty($_POST['bestehende_bilder'])) {
    $bestehende_bilder = json_decode($_POST['bestehende_bilder'], true);
    if (!is_array($bestehende_bilder)) {
        $bestehende_bilder = [];
    }
}

if (!$userId || !$shopId) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter userId oder shopId"]);
    exit;
}

try {
    // 2. Bewertung einfügen oder updaten (ON DUPLICATE KEY UPDATE nur wenn eindeutiger Key definiert)
    $sql = "INSERT INTO bewertungen (eisdiele_id, nutzer_id, auswahl, beschreibung) 
            VALUES (:shopId, :userId, :auswahl, :beschreibung) 
            ON DUPLICATE KEY UPDATE
              auswahl = VALUES(auswahl), 
              beschreibung = VALUES(beschreibung)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':shopId' => $shopId,
        ':userId' => $userId,
        ':auswahl' => $auswahl,
        ':beschreibung' => $beschreibung
    ]);

    // 3. Bewertung-ID abfragen (für Verknüpfungen)
    $stmt = $pdo->prepare("SELECT id FROM bewertungen WHERE nutzer_id = :userId AND eisdiele_id = :shopId");
    $stmt->execute([':userId' => $userId, ':shopId' => $shopId]);
    $bewertungId = $stmt->fetchColumn();

    if (!$bewertungId) {
        echo json_encode(["status" => "error", "message" => "Bewertung konnte nicht gefunden werden"]);
        exit;
    }

    // 4. Bilder verarbeiten (Uploads)
    $bildUrls = [];
    if (isset($_FILES['bilder']) && is_array($_FILES['bilder']['tmp_name'])) {
        try {
            $bildUrls = processUploadedImages(
                $_FILES['bilder'],
                '../../uploads/bewertungen/',
                'bewertung_',
                $_POST['beschreibungen'] ?? []
            );
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }

    // 5. Neue Bilder in DB speichern
    if (!empty($bildUrls)) {
        $stmt = $pdo->prepare("INSERT INTO bilder (bewertung_id, nutzer_id, url, beschreibung, shop_id) VALUES (?, ?, ?, ?, ?)");
        foreach ($bildUrls as $bild) {
            $stmt->execute([$bewertungId, $userId, $bild['url'], $bild['beschreibung'], $shopId]);
        }
    }

    // 6. Bestehende Bilder aktualisieren (Beschreibung), falls gewünscht
    if (!empty($bestehende_bilder)) {
        $stmtUpdateBild = $pdo->prepare("UPDATE bilder SET beschreibung = :beschreibung WHERE id = :id AND bewertung_id = :bewertungId");
        foreach ($bestehende_bilder as $bild) {
            if (isset($bild['id'], $bild['beschreibung'])) {
                $stmtUpdateBild->execute([
                    ':beschreibung' => $bild['beschreibung'],
                    ':id' => $bild['id'],
                    ':bewertungId' => $bewertungId
                ]);
            }
        }
    }

    // 6b. Gelöschte Bilder entfernen (Datenbank + Datei)
    $deletedBildIds = json_decode($_POST['deleted_bild_ids'] ?? '[]', true);
    if (!empty($deletedBildIds)) {
        $stmtSelectDeleted = $pdo->prepare("SELECT url FROM bilder WHERE id = :id AND bewertung_id = :bewertungId");
        $stmtDelete = $pdo->prepare("DELETE FROM bilder WHERE id = :id AND bewertung_id = :bewertungId");

        foreach ($deletedBildIds as $bildId) {
            // Bild-URL holen
            $stmtSelectDeleted->execute([
                ':id' => $bildId,
                ':bewertungId' => $bewertungId
            ]);
            $row = $stmtSelectDeleted->fetch(PDO::FETCH_ASSOC);

            if ($row && isset($row['url'])) {
                $serverPath = __DIR__ . '/../../' . $row['url'];
                if (file_exists($serverPath)) {
                    unlink($serverPath);
                }
            }

            // Datenbankeintrag löschen
            $stmtDelete->execute([
                ':id' => $bildId,
                ':bewertungId' => $bewertungId
            ]);
        }
    }

    // 7. Attribute verarbeiten
    $attributIds = [];
    foreach ($selectedAttributes as $name) {
        // prüfen, ob Attribut existiert
        $stmt = $pdo->prepare("SELECT id FROM attribute WHERE name = :name");
        $stmt->execute([':name' => $name]);
        $id = $stmt->fetchColumn();

        if (!$id) {
            // neues Attribut anlegen
            $stmt = $pdo->prepare("INSERT INTO attribute (name) VALUES (:name)");
            $stmt->execute([':name' => $name]);
            $id = $pdo->lastInsertId();
        }

        $attributIds[] = $id;
    }

    // 8. Bisher verknüpfte Attribute löschen
    $stmt = $pdo->prepare("DELETE FROM bewertung_attribute WHERE bewertung_id = :bewertungId");
    $stmt->execute([':bewertungId' => $bewertungId]);

    // 9. Neue Verknüpfungen einfügen
    $stmt = $pdo->prepare("INSERT INTO bewertung_attribute (bewertung_id, attribut_id) VALUES (:bewertungId, :attributId)");
    foreach ($attributIds as $attrId) {
        $stmt->execute([
            ':bewertungId' => $bewertungId,
            ':attributId' => $attrId
        ]);
    }

    echo json_encode(["status" => "success"]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>