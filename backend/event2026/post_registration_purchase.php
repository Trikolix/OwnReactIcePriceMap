<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/mail.php';

const EVENT2026_ADDON_ENTRY_FEE = 15.0;
const EVENT2026_ADDON_PAYMENT_CONTACT = 'admin@ice-app.de';

function event2026_addon_payment_instruction_text(): string
{
    return 'Bitte schließe die Zahlung über Stripe im Event-Portal ab. Bei Fragen melde dich bitte an ' . EVENT2026_ADDON_PAYMENT_CONTACT . '.';
}

try {
    event2026_ensure_schema($pdo);
    $auth = event2026_require_auth_user($pdo);

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $registrationStmt = $pdo->prepare("SELECT r.*, p.expected_amount, p.paid_amount, p.status AS payment_status_detail
        FROM event2026_registrations r
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        WHERE r.event_id = :event_id AND r.registered_by_user_id = :user_id
        ORDER BY r.created_at DESC
        LIMIT 1");
    $registrationStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
    ]);
    $registration = $registrationStmt->fetch(PDO::FETCH_ASSOC);
    if (!$registration) {
        http_response_code(403);
        throw new RuntimeException('Nur bereits registrierte Nutzer können Zusatzbestellungen anlegen.');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $purchaseStmt = $pdo->prepare("SELECT *
            FROM event2026_addon_purchases
            WHERE registration_id = :registration_id
            ORDER BY created_at DESC, id DESC");
        $purchaseStmt->execute([':registration_id' => (int) $registration['id']]);
        $purchases = $purchaseStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'registration' => [
                'id' => (int) $registration['id'],
                'payment_reference_code' => (string) $registration['payment_reference_code'],
                'payment_status' => (string) ($registration['payment_status_detail'] ?: $registration['payment_status']),
                'expected_amount' => $registration['expected_amount'] !== null ? (float) $registration['expected_amount'] : null,
                'paid_amount' => $registration['paid_amount'] !== null ? (float) $registration['paid_amount'] : null,
            ],
            'payment_instruction' => event2026_addon_payment_instruction_text(),
            'addon_purchases' => array_map(static function (array $purchase): array {
                return [
                    'id' => (int) $purchase['id'],
                    'payment_reference_code' => (string) $purchase['payment_reference_code'],
                    'gift_voucher_quantity' => (int) $purchase['gift_voucher_quantity'],
                    'expected_amount' => (float) $purchase['expected_amount'],
                    'paid_amount' => (float) $purchase['paid_amount'],
                    'status' => (string) $purchase['status'],
                    'payment_method' => (string) $purchase['payment_method'],
                    'created_at' => $purchase['created_at'],
                    'confirmed_at' => $purchase['confirmed_at'],
                ];
            }, $purchases),
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $data = event2026_json_input();
    $giftVoucherQuantity = max(0, min(20, (int) ($data['giftVoucherQuantity'] ?? 0)));
    $paymentMethod = (string) ($data['paymentMethodPreference'] ?? 'stripe_checkout');
    $notes = trim((string) ($data['notes'] ?? ''));

    if ($giftVoucherQuantity < 1) {
        throw new InvalidArgumentException('Bitte mindestens einen Gutschein-Code auswählen.');
    }
    if (!in_array($paymentMethod, ['paypal_friends', 'bank_transfer', 'stripe_checkout'], true)) {
        throw new InvalidArgumentException('Ungültige Zahlungsmethode.');
    }

    $expectedAmount = $giftVoucherQuantity * EVENT2026_ADDON_ENTRY_FEE;
    $paymentRef = sprintf('ICE26-A%s', strtoupper(bin2hex(random_bytes(4))));

    $pdo->beginTransaction();
    $event = event2026_current_event($pdo, true);
    $reservedCount = event2026_reserved_count($pdo, $eventId);
    if (($reservedCount + $giftVoucherQuantity) > (int) $event['max_participants']) {
        $pdo->rollBack();
        http_response_code(409);
        throw new RuntimeException('Nicht genügend freie Starterplätze für diese Zusatzbestellung verfügbar.');
    }

    $insertStmt = $pdo->prepare("INSERT INTO event2026_addon_purchases (
        event_id,
        registration_id,
        buyer_user_id,
        payment_reference_code,
        gift_voucher_quantity,
        expected_amount,
        paid_amount,
        status,
        payment_method,
        notes
    ) VALUES (
        :event_id,
        :registration_id,
        :buyer_user_id,
        :payment_reference_code,
        :gift_voucher_quantity,
        :expected_amount,
        0,
        'pending',
        :payment_method,
        :notes
    )");
    $insertStmt->execute([
        ':event_id' => $eventId,
        ':registration_id' => (int) $registration['id'],
        ':buyer_user_id' => (int) $auth['user_id'],
        ':payment_reference_code' => $paymentRef,
        ':gift_voucher_quantity' => $giftVoucherQuantity,
        ':expected_amount' => $expectedAmount,
        ':payment_method' => $paymentMethod,
        ':notes' => $notes !== '' ? $notes : null,
    ]);
    $purchaseId = (int) $pdo->lastInsertId();

    event2026_log_action($pdo, $eventId, $auth['user_id'], 'addon_purchase_create', 'addon_purchase', $purchaseId, [
        'gift_voucher_quantity' => $giftVoucherQuantity,
        'expected_amount' => $expectedAmount,
        'payment_method' => $paymentMethod,
    ]);
    $pdo->commit();

    $owner = event2026_fetch_registration_owner($pdo, (int) $registration['id']);
    $mailSent = false;
    if (!empty($owner['email'])) {
        $mailBody = "Hallo {$owner['username']},\n\n";
        $mailBody .= "deine Zusatzbestellung fuer die Ice-Tour 2026 wurde gespeichert.\n\n";
        $mailBody .= "Bestellung: #{$purchaseId}\n";
        $mailBody .= "Referenzcode: {$paymentRef}\n";
        $mailBody .= "Gutschein-Codes: {$giftVoucherQuantity}\n";
        $mailBody .= "Zu zahlender Gesamtbetrag: " . number_format($expectedAmount, 2, ',', '.') . " EUR\n\n";
        $mailBody .= "Bitte schliesse die Zahlung ueber Stripe im Event-Portal ab.\n";
        $mailBody .= "Die Gutschein-Codes werden erst nach bestaetigtem Zahlungseingang freigeschaltet.\n";
        $mailBody .= "Bitte gib den Referenzcode {$paymentRef} an.\n";
        $mailBody .= "Bei Rueckfragen melde dich bitte an " . EVENT2026_ADDON_PAYMENT_CONTACT . ".\n";
        $mailSent = iceapp_send_utf8_text_mail($owner['email'], 'Ice-Tour 2026: Deine Zusatzbestellung', $mailBody);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Zusatzbestellung gespeichert. Die Gutschein-Codes werden nach Zahlung freigeschaltet.',
        'addon_purchase' => [
            'id' => $purchaseId,
            'payment_reference_code' => $paymentRef,
            'gift_voucher_quantity' => $giftVoucherQuantity,
            'expected_amount' => $expectedAmount,
            'status' => 'pending',
            'payment_method' => $paymentMethod,
            'buyer_email' => $owner['email'] ?? null,
        ],
        'payment_instruction' => event2026_addon_payment_instruction_text(),
        'notification_mail_sent' => $mailSent,
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
