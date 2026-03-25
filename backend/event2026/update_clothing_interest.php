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
    $slot = event2026_get_slot_for_user($pdo, $eventId, $auth['user_id']);
    if (!$slot) {
        http_response_code(403);
        throw new RuntimeException('Nur registrierte Nutzer koennen Bekleidungsinteresse aktualisieren.');
    }

    $data = event2026_json_input();
    $clothingInterest = event2026_normalize_clothing_interest((string) ($data['clothingInterest'] ?? ''));
    $jerseyInterest = $clothingInterest !== 'none' ? 1 : 0;
    $jerseySize = trim((string) ($data['jerseySize'] ?? ''));
    $bibSize = trim((string) ($data['bibSize'] ?? ''));

    if ($jerseyInterest && $jerseySize === '') {
        throw new InvalidArgumentException('Bitte gib eine Trikotgroesse an, wenn Interesse besteht.');
    }
    if ($clothingInterest === 'kit_interest' && $bibSize === '') {
        throw new InvalidArgumentException('Bitte gib eine Hosengroesse an, wenn Set-Interesse besteht.');
    }

    $updateStmt = $pdo->prepare("UPDATE event2026_participant_slots
        SET jersey_interest = :jersey_interest,
            clothing_interest = :clothing_interest,
            jersey_size = :jersey_size,
            bib_size = :bib_size,
            updated_at = NOW()
        WHERE id = :slot_id");
    $updateStmt->execute([
        ':jersey_interest' => $jerseyInterest,
        ':clothing_interest' => $clothingInterest,
        ':jersey_size' => $jerseyInterest ? $jerseySize : null,
        ':bib_size' => $clothingInterest === 'kit_interest' ? $bibSize : null,
        ':slot_id' => (int) $slot['id'],
    ]);

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'clothing_interest_update', 'slot', (int) $slot['id'], [
        'clothing_interest' => $clothingInterest,
        'jersey_size' => $jerseyInterest ? $jerseySize : null,
        'bib_size' => $clothingInterest === 'kit_interest' ? $bibSize : null,
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Bekleidungsinteresse aktualisiert.',
        'clothing' => [
            'clothing_interest' => $clothingInterest,
            'clothing_interest_label' => event2026_clothing_interest_label($clothingInterest),
            'jersey_size' => $jerseyInterest ? $jerseySize : null,
            'bib_size' => $clothingInterest === 'kit_interest' ? $bibSize : null,
        ],
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
