<?php
require_once  __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/route_utils.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

function nullIfEmpty($value) {
    return ($value === '' || !isset($value)) ? null : $value;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Pflichtfelder
    $route_id = $data['id'] ?? null;

    // Optional / geänderte Werte
    $url = $data['url'] ?? null;
    $beschreibung = $data['beschreibung'] ?? null;
    $typ = $data['typ'] ?? null;
    $ist_oeffentlich = $data['ist_oeffentlich'] ?? false;
    $name = $data['name'] ?? '';
    $laenge_km   = nullIfEmpty($data['laenge_km'] ?? null);
    $hoehenmeter = nullIfEmpty($data['hoehenmeter'] ?? null);
    $schwierigkeit = $data['schwierigkeit'] ?? null;
    $is_admin = ($currentUserId === 1);
    $incomingEisdieleIds = $data['eisdiele_ids'] ?? null;
    $newEisdieleIds = null;
    if ($is_admin) {
        if (!isset($data['embed_code']) || $data['embed_code'] === '') {
            $embed_code = generateEmbedCode($url);
        } else {
            $embed_code = $data['embed_code'];
        }
    } else {
        $embed_code = generateEmbedCode($url);
    }

    if (!$route_id || !$currentUserId) {
        echo json_encode(['status' => 'error', 'message' => 'Fehlende erforderliche Daten']);
        die();
    }

    // Wenn URL angegeben, validieren und kürzen
    $cleanUrl = null;
    if ($url) {
        $cleanUrl = validateAndCleanUrl($url);
        if (!$cleanUrl) {
            echo json_encode(['status' => 'error', 'message' => 'Ungültige oder nicht unterstützte URL']);
            die();
        }
    }

    // SQL-Dynamik: nur vorhandene Felder aktualisieren
    $fields = [];
    $params = ['id' => $route_id, 'nutzer_id' => $currentUserId];

    if ($cleanUrl !== null) {
        $fields[] = "url = :url";
        $params['url'] = $cleanUrl;
    }
    if ($beschreibung !== null) {
        $fields[] = "beschreibung = :beschreibung";
        $params['beschreibung'] = $beschreibung;
    }
    if ($typ !== null) {
        $fields[] = "typ = :typ";
        $params['typ'] = $typ;
    }
    if ($ist_oeffentlich !== null) {
        $fields[] = "ist_oeffentlich = :ist_oeffentlich";
        $params['ist_oeffentlich'] = $ist_oeffentlich;
    }
    if ($name !== null) {
        $fields[] = "name = :name";
        $params['name'] = $name;
    }
    if ($laenge_km !== null) {
        $fields[] = "laenge_km = :laenge_km";
        $params['laenge_km'] = $laenge_km;
    }
    if ($hoehenmeter !== null) {
        $fields[] = "hoehenmeter = :hoehenmeter";
        $params['hoehenmeter'] = $hoehenmeter;
    }
    if ($schwierigkeit !== null) {
        $fields[] = "schwierigkeit = :schwierigkeit";
        $params['schwierigkeit'] = $schwierigkeit;
    }
    if ($is_admin && $embed_code !== null) {
        $fields[] = "embed_code = :embed_code";
        $params['embed_code'] = $embed_code;
    }

    if ($incomingEisdieleIds !== null) {
        if (!is_array($incomingEisdieleIds)) {
            echo json_encode(['status' => 'error', 'message' => 'Ungültiges Format für Eisdielen.']);
            die();
        }
        $newEisdieleIds = [];
        foreach ($incomingEisdieleIds as $rawId) {
            $intId = (int)$rawId;
            if ($intId > 0 && !in_array($intId, $newEisdieleIds, true)) {
                $newEisdieleIds[] = $intId;
            }
        }
        if (empty($newEisdieleIds)) {
            echo json_encode(['status' => 'error', 'message' => 'Bitte mindestens eine Eisdiele auswählen.']);
            die();
        }
        $fields[] = "eisdiele_id = :primary_eisdiele";
        $params['primary_eisdiele'] = $newEisdieleIds[0];
    }

    if (count($fields) === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Keine Felder zum Aktualisieren übergeben']);
        die();
    }

    $sql = "UPDATE routen SET " . implode(", ", $fields) . " WHERE id = :id AND nutzer_id = :nutzer_id";

    $pdo->beginTransaction();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($newEisdieleIds !== null) {
        $del = $pdo->prepare("DELETE FROM route_eisdielen WHERE route_id = :route_id");
        $del->execute(['route_id' => $route_id]);

        $ins = $pdo->prepare("
            INSERT INTO route_eisdielen (route_id, eisdiele_id)
            VALUES (:route_id, :eisdiele_id)
        ");
        foreach ($newEisdieleIds as $shopId) {
            $ins->execute([
                'route_id' => $route_id,
                'eisdiele_id' => $shopId
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Route erfolgreich aktualisiert'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fehler beim Aktualisieren der Route',
        'details' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unbekannter Fehler',
        'details' => $e->getMessage()
    ]);
}
?>
