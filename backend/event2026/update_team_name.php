<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $auth = event2026_require_auth_user($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $registrationStmt = $pdo->prepare("SELECT id, team_name
        FROM event2026_registrations
        WHERE event_id = :event_id
          AND registered_by_user_id = :user_id
        ORDER BY created_at DESC
        LIMIT 1");
    $registrationStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
    ]);
    $registration = $registrationStmt->fetch(PDO::FETCH_ASSOC);
    if (!$registration) {
        http_response_code(403);
        throw new RuntimeException('Keine Event-Anmeldung für diesen Account gefunden.');
    }

    $currentTeamName = trim((string) ($registration['team_name'] ?? ''));
    if ($currentTeamName !== '') {
        http_response_code(409);
        throw new RuntimeException('Team / Verein wurde bereits hinterlegt und kann hier nicht mehr geändert werden.');
    }

    $data = event2026_json_input();
    $teamName = trim((string) ($data['teamName'] ?? ''));
    if ($teamName === '') {
        throw new InvalidArgumentException('Bitte gib einen Team- oder Vereinsnamen ein.');
    }
    if (mb_strlen($teamName) > 255) {
        throw new InvalidArgumentException('Team / Verein ist zu lang.');
    }

    $updateStmt = $pdo->prepare("UPDATE event2026_registrations
        SET team_name = :team_name,
            updated_at = NOW()
        WHERE id = :registration_id");
    $updateStmt->execute([
        ':team_name' => $teamName,
        ':registration_id' => (int) $registration['id'],
    ]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'registration_team_name_update', 'registration', (int) $registration['id'], [
        'team_name' => $teamName,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Team / Verein aktualisiert.',
        'team_name' => $teamName,
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
