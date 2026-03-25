<?php
require_once  __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/mail.php';
require_once __DIR__ . '/lib/opening_hours.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/currency.php';

$authData = requireAuth($pdo);
$currentUserId = (int)$authData['user_id'];

$data = json_decode(file_get_contents("php://input"), true);

// Akzeptierte Status-Werte
$validStatuses = ['open','seasonal_closed','permanent_closed'];

if (!isset($data['shopId']) || !isset($data['name']) || !isset($data['adresse']) || !isset($data['latitude']) || !isset($data['longitude']) || !isset($data['userId'])) {
    echo json_encode(["status" => "error", "message" => "Fehlende Parameter"]);
    exit;
}

$eisdieleId = intval($data['shopId']);

// Hole ursprünglichen Eintrag
$stmt = $pdo->prepare("SELECT user_id, erstellt_am, latitude, longitude FROM eisdielen WHERE id = ?");
$stmt->execute([$eisdieleId]);
$eisdiele = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$eisdiele) {
    echo json_encode(["status" => "error", "message" => "Eisdiele nicht gefunden"]);
    exit;
}

$isAdmin = $currentUserId === 1;
$isOwner = $currentUserId === intval($eisdiele['user_id']);
$createdAt = strtotime($eisdiele['erstellt_am']);
$isRecent = (time() - $createdAt) <= 6 * 3600; // 6 Stunden
$autoApprove = $isAdmin || ($isOwner && $isRecent);
$canEditCoordinates = $isAdmin;

$structuredPayload = $data['openingHoursStructured'] ?? null;
if (!is_array($structuredPayload) && array_key_exists('openingHours', $data)) {
    $legacyText = trim((string)$data['openingHours']);
    $structuredPayload = [
        'timezone' => OPENING_HOURS_DEFAULT_TIMEZONE,
        'note' => $legacyText !== '' ? $legacyText : null,
        'days' => []
    ];
}
$normalizedHours = normalize_structured_opening_hours($structuredPayload);
$openingHoursText = build_opening_hours_display($normalizedHours['rows'], $normalizedHours['note']);

if (!$autoApprove) {
    $changeSet = buildChangeSet($data, $validStatuses, $normalizedHours, $openingHoursText);

    if (empty($changeSet)) {
        echo json_encode(["status" => "error", "message" => "Keine Änderungen zum Vorschlagen gefunden."]);
        exit;
    }

    try {
        storeChangeRequest($pdo, $eisdieleId, $currentUserId, $changeSet);
        sendChangeRequestNotificationMail(
            $eisdieleId,
            (string) ($data['name'] ?? ''),
            $currentUserId,
            (string) ($authData['username'] ?? 'unbekannt'),
            $changeSet
        );
        echo json_encode([
            "status" => "pending",
            "message" => "Vielen Dank! Dein Änderungsvorschlag wurde gespeichert und wartet auf Prüfung."
        ]);
    } catch (Throwable $e) {
        echo json_encode(["status" => "error", "message" => "Änderungsvorschlag konnte nicht gespeichert werden."]);
    }
    exit;
}

$latitude = $canEditCoordinates ? floatval($data['latitude']) : floatval($eisdiele['latitude']);
$longitude = $canEditCoordinates ? floatval($data['longitude']) : floatval($eisdiele['longitude']);

function getLocationDetailsFromCoords($lat, $lon) {
    $url = "https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lon}&format=json&addressdetails=1&accept-language=de";
    $opts = [
        "http" => [
            "header" => "User-Agent: Ice-App/0.1\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $json = file_get_contents($url, false, $context);
    $data = json_decode($json, true);

    if (!isset($data['address']['country'])) {
        return null; // abbrechen, wenn nichts Brauchbares da ist
    }
    
     $address = $data['address'];

     // Bundesland / Region fallback
    $bundesland = $address['state']
        ?? $address['region']
        ?? $address['state_district']
        ?? $address['county']
        ?? $address['municipality']
        ?? $address['town']
        ?? $address['city']
        ?? $address['village']
        ?? $address['postcode']
        ?? 'Unbekannt';

    // 'county' -> fallback 'city' -> fallback 'town' -> fallback 'village'
    $landkreis = $address['county']
        ?? $address['city']
        ?? $address['town']
        ?? $address['village']
        ?? null;

    // ISO-Level automatisch bestimmen
    $iso = null;
    foreach ($address as $key => $value) {
        if (strpos($key, 'ISO3166-2') !== false) {
            $iso = $value;
            break;
        }
    }

    return [
        'land' => $address['country'],
        'country_code' => $address['country_code'],
        'bundesland' => $bundesland,
        'bundesland_iso' => $iso,
        'landkreis' => $landkreis,
    ];
}

function getOrCreateLandId($pdo, $land, $country_code = null) {
    $normalizedCountryCode = normalizeCountryCode($country_code);
    $resolvedCurrency = ensureCountryCurrencyAndRates($pdo, $normalizedCountryCode);
    $currencyId = $resolvedCurrency['currency_id'] ?? null;

    $stmt = $pdo->prepare("SELECT id, country_code, waehrung_id FROM laender WHERE name = ?");
    $stmt->execute([$land]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $updates = [];
        $params = [];

        if ($normalizedCountryCode !== null && empty($row['country_code'])) {
            $updates[] = "country_code = ?";
            $params[] = $normalizedCountryCode;
        }

        if ($currencyId !== null && empty($row['waehrung_id'])) {
            $updates[] = "waehrung_id = ?";
            $params[] = $currencyId;
        }

        if ($updates) {
            $params[] = $row['id'];
            $update = $pdo->prepare("UPDATE laender SET " . implode(', ', $updates) . " WHERE id = ?");
            $update->execute($params);
        }

        return (int)$row['id'];
    }

    $insert = $pdo->prepare("INSERT INTO laender (name, country_code, waehrung_id) VALUES (?, ?, ?)");
    $insert->execute([$land, $normalizedCountryCode, $currencyId]);
    return $pdo->lastInsertId();
}

function getOrCreateBundeslandId($pdo, $bundeslandName, $iso = null, $landId) {
    $stmt = $pdo->prepare("SELECT id FROM bundeslaender WHERE name = ? AND land_id = ?");
    $stmt->execute([$bundeslandName, $landId]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO bundeslaender (name, iso_code, land_id) VALUES (?, ?, ?)");
    $insert->execute([$bundeslandName, $iso, $landId]);
    return $pdo->lastInsertId();
}

function getOrCreateLandkreisId($pdo, $landkreisName, $bundeslandId) {
    $stmt = $pdo->prepare("SELECT id FROM landkreise WHERE name = ? AND bundesland_id = ?");
    $stmt->execute([$landkreisName, $bundeslandId]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $insert = $pdo->prepare("INSERT INTO landkreise (name, bundesland_id) VALUES (?, ?)");
    $insert->execute([$landkreisName, $bundeslandId]);
    return $pdo->lastInsertId();
}

function ensureChangeRequestTable(PDO $pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS eisdiele_change_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            eisdiele_id INT NOT NULL,
            requested_by INT NOT NULL,
            payload LONGTEXT NOT NULL,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            decided_at TIMESTAMP NULL,
            decided_by INT NULL,
            INDEX idx_eisdiele_change_requests_eisdiele (eisdiele_id),
            INDEX idx_eisdiele_change_requests_user (requested_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function storeChangeRequest(PDO $pdo, int $shopId, int $currentUserId, array $changes) {
    ensureChangeRequestTable($pdo);
    $payload = json_encode(['changes' => $changes], JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        throw new RuntimeException('Konnte Änderungsvorschlag nicht serialisieren.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO eisdiele_change_requests (eisdiele_id, requested_by, payload)
        VALUES (:eisdiele_id, :requested_by, :payload)
    ");
    $stmt->execute([
        ':eisdiele_id' => $shopId,
        ':requested_by' => $currentUserId,
        ':payload' => $payload
    ]);
}

function sendChangeRequestNotificationMail(int $shopId, string $shopName, int $requestedByUserId, string $requestedByUsername, array $changes): void {
    $to = 'admin@ice-app.de';
    $subject = 'Neuer Änderungsvorschlag für Eisdiele #' . $shopId;
    $changesJson = json_encode($changes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($changesJson === false) {
        $changesJson = '(konnte Änderungen nicht serialisieren)';
    }

    $message = "Es wurde ein neuer Änderungsvorschlag eingereicht.\n\n";
    $message .= "Shop-ID: {$shopId}\n";
    $message .= "Shop-Name: {$shopName}\n";
    $message .= "Eingereicht von: {$requestedByUsername} (User-ID {$requestedByUserId})\n\n";
    $message .= "Vorgeschlagene Änderungen:\n{$changesJson}\n\n";
    $message .= "Bitte im Admin-Bereich prüfen.\n";
    $message .= "Direktlink: https://ice-app.de/shop-change-requests\n";

    iceapp_send_utf8_text_mail($to, $subject, $message);
}

function buildChangeSet(array $data, array $validStatuses, array $normalizedHours, string $openingHoursText): array {
    $changeSet = [];
    $simpleFields = ['name', 'adresse', 'website'];

    foreach ($simpleFields as $field) {
        if (array_key_exists($field, $data)) {
            $changeSet[$field] = $data[$field];
        }
    }

    if (array_key_exists('status', $data) && in_array($data['status'], $validStatuses, true)) {
        $changeSet['status'] = $data['status'];
    }

    if (array_key_exists('reopening_date', $data)) {
        $changeSet['reopening_date'] = $data['reopening_date'] !== '' ? $data['reopening_date'] : null;
    }

    if (!empty($normalizedHours['rows']) || array_key_exists('openingHoursStructured', $data)) {
        $changeSet['openingHours'] = $openingHoursText;
        $changeSet['openingHoursNote'] = $normalizedHours['note'] ?? null;
        $changeSet['openingHoursStructured'] = build_structured_opening_hours(
            $normalizedHours['rows'],
            $normalizedHours['note'],
            $normalizedHours['timezone'] ?? OPENING_HOURS_DEFAULT_TIMEZONE
        );
    }

    return $changeSet;
}

$location = getLocationDetailsFromCoords($latitude, $longitude);

if ($location) {
    $landId = getOrCreateLandId($pdo, $location['land'], $location['country_code']);
    $bundeslandId = getOrCreateBundeslandId($pdo, $location['bundesland'], $location['bundesland_iso'], $landId);
    $landkreisId = getOrCreateLandkreisId($pdo, $location['landkreis'], $bundeslandId);

    // Optional: status, reopening_date und closing_date setzen (falls übergeben)
    $status = isset($data['status']) && in_array($data['status'], $validStatuses) ? $data['status'] : null;
    $reopening_date = isset($data['reopening_date']) && $data['reopening_date'] !== '' ? $data['reopening_date'] : null;
    $closing_date = isset($data['closing_date']) && $data['closing_date'] !== '' ? $data['closing_date'] : null;

    // Prepare common params
    $params = [
        ':name' => $data['name'],
        ':adresse' => $data['adresse'],
        ':latitude' => $latitude,
        ':longitude' => $longitude,
        ':website' => $data['website'] ?? null,
        ':openingHours' => $openingHoursText,
        ':openingHoursNote' => $normalizedHours['note'] ?? null,
        ':landkreisId' => $landkreisId,
        ':bundeslandId' => $bundeslandId,
        ':landId' => $landId,
    ];

    // Wenn status, reopening_date oder closing_date übergeben wurden, erweitere Query und Params
    if ($status !== null || $reopening_date !== null || $closing_date !== null) {
        $sql = "UPDATE eisdielen 
            SET name = :name, adresse = :adresse, latitude = :latitude, longitude = :longitude, website = :website, openingHours = :openingHours,
                opening_hours_note = :openingHoursNote,
                landkreis_id = :landkreisId, bundesland_id = :bundeslandId, land_id = :landId, status = :status, reopening_date = :reopening_date, closing_date = :closing_date
            WHERE id = :id";
        $params[':status'] = $status;
        $params[':reopening_date'] = $reopening_date;
        $params[':closing_date'] = $closing_date;
    } else {
        $sql = "UPDATE eisdielen 
            SET name = :name, adresse = :adresse, latitude = :latitude, longitude = :longitude, website = :website, openingHours = :openingHours,
                opening_hours_note = :openingHoursNote,
                landkreis_id = :landkreisId, bundesland_id = :bundeslandId, land_id = :landId
            WHERE id = :id";
    }

    // id anhängen
    $params[':id'] = intval($data['shopId']);

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        replace_opening_hours($pdo, $eisdieleId, $normalizedHours['rows']);
        $pdo->commit();
        echo json_encode(["status" => "success"]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Konnte Land/Bundesland/Landkreis nicht bestimmen."]);
}
?>
