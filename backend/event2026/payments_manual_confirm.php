<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $admin = event2026_require_admin($pdo);
    $data = event2026_json_input();

    $registrationId = (int) ($data['registration_id'] ?? 0);
    $paidAmount = (float) ($data['paid_amount'] ?? 0);

    if ($registrationId <= 0) {
        throw new InvalidArgumentException('registration_id fehlt.');
    }

    $pdo->beginTransaction();

    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    $paymentStmt = $pdo->prepare("SELECT p.id, p.expected_amount
        FROM event2026_payments p
        INNER JOIN event2026_registrations r ON r.id = p.registration_id
        WHERE p.registration_id = :registration_id AND r.event_id = :event_id
        LIMIT 1 FOR UPDATE");
    $paymentStmt->execute([
        ':registration_id' => $registrationId,
        ':event_id' => $eventId,
    ]);
    $payment = $paymentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        throw new RuntimeException('Zahlung für Registrierung nicht gefunden.');
    }

    $effectivePaid = $paidAmount > 0 ? $paidAmount : (float) $payment['expected_amount'];

    $updatePayment = $pdo->prepare("UPDATE event2026_payments
        SET paid_amount = :paid_amount,
            status = 'paid',
            confirmed_by_admin = :admin_id,
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = :payment_id");
    $updatePayment->execute([
        ':paid_amount' => $effectivePaid,
        ':admin_id' => $admin['user_id'],
        ':payment_id' => (int) $payment['id'],
    ]);

    $pdo->prepare("UPDATE event2026_registrations
        SET payment_status = 'paid', updated_at = NOW()
        WHERE id = :registration_id")->execute([':registration_id' => $registrationId]);

    $pdo->prepare("UPDATE event2026_participant_slots
        SET license_status = 'licensed', updated_at = NOW()
        WHERE registration_id = :registration_id")->execute([':registration_id' => $registrationId]);

    event2026_log_action($pdo, $eventId, $admin['user_id'], 'payment_confirm', 'registration', $registrationId, [
        'paid_amount' => $effectivePaid,
    ]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Zahlung bestätigt und Lizenzen freigeschaltet.',
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
