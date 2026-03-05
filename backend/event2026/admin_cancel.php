<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Methode nicht erlaubt']);
        exit;
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();

    $reason = trim((string) ($data['reason'] ?? 'Zu geringe Teilnehmerzahl'));

    $pdo->beginTransaction();

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $updateEventStmt = $pdo->prepare("UPDATE event2026_seasons SET status = 'cancelled', updated_at = NOW() WHERE id = :id");
    $updateEventStmt->execute([':id' => $eventId]);

    // Follow-up marker for refund workflow.
    $noteStmt = $pdo->prepare("UPDATE event2026_registrations
        SET notes = TRIM(CONCAT(IFNULL(notes, ''), CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE ' | ' END, :note))
        WHERE event_id = :event_id");
    $noteStmt->execute([
        ':event_id' => $eventId,
        ':note' => sprintf('event_cancelled:%s:refund_followup_required', $reason),
    ]);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM event2026_participant_slots WHERE event_id = :event_id");
    $countStmt->execute([':event_id' => $eventId]);
    $participantsCount = (int) $countStmt->fetchColumn();

    event2026_log_action($pdo, $eventId, $admin['user_id'], 'event_cancel', 'event', $eventId, [
        'reason' => $reason,
        'affected_participants' => $participantsCount,
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Event wurde als abgesagt markiert. Benachrichtigung/Rückerstattung muss jetzt durchgeführt werden.',
        'event_id' => $eventId,
        'affected_participants' => $participantsCount,
        'reason' => $reason,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
