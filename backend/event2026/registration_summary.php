<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $registrationId = (int) ($_GET['registration_id'] ?? 0);
    if ($registrationId <= 0) {
        throw new InvalidArgumentException('registration_id fehlt.');
    }

    $registrationStmt = $pdo->prepare("SELECT
            r.id,
            r.event_id,
            r.registered_by_user_id,
            r.payment_reference_code,
            r.payment_status,
            r.team_name,
            r.created_at,
            p.method AS payment_method,
            p.expected_amount,
            p.paid_amount,
            p.status AS payment_status_detail
        FROM event2026_registrations r
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        WHERE r.id = :registration_id
        LIMIT 1");
    $registrationStmt->execute([
        ':registration_id' => $registrationId,
    ]);
    $registration = $registrationStmt->fetch(PDO::FETCH_ASSOC);

    if (!$registration) {
        http_response_code(404);
        throw new RuntimeException('Registrierung nicht gefunden.');
    }

    $auth = authenticateRequest($pdo);
    $summaryToken = trim((string) ($_GET['summary_token'] ?? ''));

    $isAllowedByAuth = false;
    if ($auth) {
        $isAllowedByAuth = (int) $auth['user_id'] === 1
            || (int) $registration['registered_by_user_id'] === (int) $auth['user_id'];
    }
    $isAllowedByToken = event2026_validate_registration_access_token($pdo, $registrationId, $summaryToken);

    if (!$isAllowedByAuth && !$isAllowedByToken) {
        http_response_code(403);
        throw new RuntimeException('Keine Berechtigung für diese Registrierung.');
    }

    $slotsStmt = $pdo->prepare("SELECT
            s.id,
            s.full_name,
            s.distance_km,
            s.license_status,
            s.pace_group,
            s.public_name_consent,
            s.jersey_interest,
            s.jersey_size,
            l.version AS legal_version
        FROM event2026_participant_slots s
        INNER JOIN event2026_legal_versions l ON l.id = s.legal_version_id
        WHERE s.registration_id = :registration_id
        ORDER BY s.id ASC");
    $slotsStmt->execute([
        ':registration_id' => $registrationId,
    ]);
    $slots = $slotsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'registration' => [
            'id' => (int) $registration['id'],
            'payment_reference_code' => (string) $registration['payment_reference_code'],
            'payment_status' => (string) $registration['payment_status'],
            'team_name' => $registration['team_name'],
            'created_at' => $registration['created_at'],
        ],
        'payment' => [
            'method' => $registration['payment_method'] ?: null,
            'expected_amount' => $registration['expected_amount'] !== null ? (float) $registration['expected_amount'] : null,
            'paid_amount' => $registration['paid_amount'] !== null ? (float) $registration['paid_amount'] : null,
            'status' => $registration['payment_status_detail'] ?: null,
        ],
        'slots' => array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'full_name' => (string) $row['full_name'],
                'distance_km' => (int) $row['distance_km'],
                'license_status' => (string) $row['license_status'],
                'pace_group' => (string) $row['pace_group'],
                'public_name_consent' => (int) $row['public_name_consent'],
                'jersey_interest' => (int) $row['jersey_interest'],
                'jersey_size' => $row['jersey_size'],
                'legal_version' => (string) $row['legal_version'],
            ];
        }, $slots),
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
