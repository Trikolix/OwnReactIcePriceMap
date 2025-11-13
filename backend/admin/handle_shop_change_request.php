<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/opening_hours.php';

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Anfrage']);
    exit;
}

$requestId = isset($input['requestId']) ? intval($input['requestId']) : 0;
$action = isset($input['action']) ? strtolower(trim($input['action'])) : '';
$adminId = isset($input['adminId']) ? intval($input['adminId']) : 0;
$adminMessage = isset($input['adminMessage']) ? trim($input['adminMessage']) : '';

if ($requestId <= 0 || !in_array($action, ['approve', 'reject'], true) || $adminId <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Fehlende oder ungültige Parameter']);
    exit;
}

// Aktuell darf nur User 1 administrieren
if ($adminId !== 1) {
    echo json_encode(['status' => 'error', 'message' => 'Keine Berechtigung']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT 
        ecr.*,
        e.name AS shop_name,
        e.id AS shop_id,
        n.username AS requester_name,
        n.email AS requester_email
    FROM eisdiele_change_requests ecr
    JOIN eisdielen e ON ecr.eisdiele_id = e.id
    JOIN nutzer n ON ecr.requested_by = n.id
    WHERE ecr.id = :id
");
$stmt->execute([':id' => $requestId]);
$request = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$request) {
    echo json_encode(['status' => 'error', 'message' => 'Vorschlag nicht gefunden']);
    exit;
}

if ($request['status'] !== 'pending') {
    echo json_encode(['status' => 'error', 'message' => 'Dieser Vorschlag wurde bereits bearbeitet']);
    exit;
}

$payload = json_decode($request['payload'], true);
$changes = [];
if (is_array($payload) && isset($payload['changes']) && is_array($payload['changes'])) {
    $changes = $payload['changes'];
}

$validStatuses = ['open', 'seasonal_closed', 'permanent_closed'];

try {
    $pdo->beginTransaction();

    if ($action === 'approve' && !empty($changes)) {
        $allowedFields = [
            'name' => 'name',
            'adresse' => 'adresse',
            'website' => 'website',
            'status' => 'status',
            'reopening_date' => 'reopening_date'
        ];

        $setParts = [];
        $params = [':id' => $request['eisdiele_id']];
        foreach ($allowedFields as $key => $column) {
            if (!array_key_exists($key, $changes)) {
                continue;
            }

            $value = $changes[$key];

            if ($key === 'status' && $value !== null && !in_array($value, $validStatuses, true)) {
                continue;
            }

            $placeholder = ':' . $key;
            $setParts[] = "{$column} = {$placeholder}";
            $params[$placeholder] = ($value === '' ? null : $value);
        }

        $structuredRows = null;
        $hoursNote = $changes['openingHoursNote'] ?? null;
        if (isset($changes['openingHoursStructured']) && is_array($changes['openingHoursStructured'])) {
            $normalized = normalize_structured_opening_hours($changes['openingHoursStructured']);
            $structuredRows = $normalized['rows'];
            $hoursNote = $normalized['note'] ?? $hoursNote;
            $changes['openingHours'] = build_opening_hours_display($structuredRows, $hoursNote);
        } elseif (array_key_exists('openingHours', $changes)) {
            $parsed = parse_legacy_opening_hours($changes['openingHours']);
            $structuredRows = $parsed['rows'];
            if ($hoursNote === null && $parsed['note']) {
                $hoursNote = $parsed['note'];
            }
        }

        if (array_key_exists('openingHours', $changes)) {
            $setParts[] = "openingHours = :openingHours";
            $params[':openingHours'] = $changes['openingHours'];
            $setParts[] = "opening_hours_note = :openingHoursNote";
            $params[':openingHoursNote'] = $hoursNote;
        }

        if (!empty($setParts)) {
            $sql = "UPDATE eisdielen SET " . implode(', ', $setParts) . " WHERE id = :id";
            $updateStmt = $pdo->prepare($sql);
            $updateStmt->execute($params);
        }

        if ($structuredRows !== null) {
            replace_opening_hours($pdo, (int)$request['eisdiele_id'], $structuredRows);
        }
    }

    $newStatus = $action === 'approve' ? 'approved' : 'rejected';
    $updateRequest = $pdo->prepare("
        UPDATE eisdiele_change_requests
        SET status = :status,
            decided_at = NOW(),
            decided_by = :adminId
        WHERE id = :id
    ");
    $updateRequest->execute([
        ':status' => $newStatus,
        ':adminId' => $adminId,
        ':id' => $requestId
    ]);

    $pdo->commit();

    sendChangeRequestStatusEmail(
        $request['requester_email'],
        $request['requester_name'],
        $request['shop_name'],
        $request['shop_id'],
        $newStatus,
        $changes,
        $adminMessage
    );

    echo json_encode(['status' => 'success', 'message' => 'Vorschlag aktualisiert']);
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('handle_shop_change_request.php: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Aktualisierung fehlgeschlagen']);
}

function sendChangeRequestStatusEmail($email, $username, $shopName, $shopId, $status, $changes, $adminMessage) {
    if (empty($email)) {
        return;
    }

    $isApproved = $status === 'approved';
    $subject = $isApproved
        ? "Ice-App: Dein Änderungsvorschlag für \"{$shopName}\" wurde angenommen"
        : "Ice-App: Dein Änderungsvorschlag für \"{$shopName}\" wurde abgelehnt";

    $prettyFields = [
        'name' => 'Name',
        'adresse' => 'Adresse',
        'website' => 'Website',
        'openingHours' => 'Öffnungszeiten',
        'openingHoursStructured' => 'Öffnungszeiten (Strukturiert)',
        'openingHoursNote' => 'Öffnungszeiten-Hinweis',
        'status' => 'Status',
        'reopening_date' => 'Wiedereröffnungsdatum'
    ];

    $body = "<html><body style='font-family:Arial, sans-serif;color:#1f1f1f;'>";
    $body .= "<p>Hallo <strong>" . htmlspecialchars($username) . "</strong>,</p>";
    if ($isApproved) {
        $body .= "<p>dein Änderungsvorschlag für <strong>" . htmlspecialchars($shopName) . "</strong> wurde soeben freigeschaltet.</p>";
    } else {
        $body .= "<p>dein Änderungsvorschlag für <strong>" . htmlspecialchars($shopName) . "</strong> wurde leider nicht übernommen.</p>";
    }

    if (!empty($changes)) {
        $body .= "<p>Folgende Felder waren Teil deines Vorschlags:</p><ul>";
        foreach ($changes as $field => $value) {
            if (!array_key_exists($field, $prettyFields)) {
                continue;
            }
            $asString = $value;
            if (is_bool($value)) {
                $asString = $value ? 'Ja' : 'Nein';
            } elseif (is_array($value) || is_object($value)) {
                $asString = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            } elseif ($value === null || $value === '') {
                $asString = '—';
            }
            $body .= "<li><strong>{$prettyFields[$field]}:</strong> " . nl2br(htmlspecialchars((string)$asString)) . "</li>";
        }
        $body .= "</ul>";
    }

    if (!empty($adminMessage)) {
        $body .= "<p><strong>Hinweis vom Team:</strong><br>" . nl2br(htmlspecialchars($adminMessage)) . "</p>";
    }

    $body .= "<p>Zur Eisdiele: <a href='https://ice-app.de/#/map/activeShop/" . intval($shopId) . "' style='color:#0077b6;'>Direktlink öffnen</a></p>";
    $body .= "<p>Vielen Dank für deinen Beitrag zur Ice-App!<br>Dein Ice-App Team</p>";
    $body .= "</body></html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: noreply@ice-app.de\r\n";

    @mail($email, $subject, $body, $headers);
}
