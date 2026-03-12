<?php
require_once __DIR__ . '/bootstrap.php';

const EVENT2026_GIFT_PAYMENT_CONTACT = 'admin@ice-app.de';
const EVENT2026_GIFT_ENTRY_FEE = 15.0;

function event2026_gift_send_utf8_mail(string $to, string $subjectText, string $body): bool
{
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "From: Ice-App <noreply@ice-app.de>\r\n";
    $headers .= "Reply-To: noreply@ice-app.de\r\n";
    return @mail($to, $subject, $body, $headers);
}

try {
    event2026_ensure_schema($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        echo json_encode([
            'status' => 'success',
            'event' => [
                'id' => $eventId,
                'name' => (string) $event['name'],
                'status' => (string) $event['status'],
            ],
            'voucher_value' => EVENT2026_GIFT_ENTRY_FEE,
            'payment_instruction' => 'Bitte schließe die Zahlung über Stripe im Event-Portal ab. Bei Fragen melde dich bitte an ' . EVENT2026_GIFT_PAYMENT_CONTACT . '.',
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $data = event2026_json_input();
    $buyerName = trim((string) ($data['buyerName'] ?? ''));
    $buyerEmail = trim((string) ($data['buyerEmail'] ?? ''));
    $giftVoucherQuantity = max(1, min(20, (int) ($data['giftVoucherQuantity'] ?? 0)));
    $notes = trim((string) ($data['notes'] ?? ''));

    if ($buyerName === '' || $buyerEmail === '') {
        throw new InvalidArgumentException('Name und E-Mail sind erforderlich.');
    }
    if (!filter_var($buyerEmail, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Ungültige E-Mail-Adresse.');
    }

    $paymentRef = sprintf('ICE26-G%s', strtoupper(bin2hex(random_bytes(4))));
    $expectedAmount = $giftVoucherQuantity * EVENT2026_GIFT_ENTRY_FEE;

    $pdo->beginTransaction();
    $event = event2026_current_event($pdo, true);
    $reservedCount = event2026_reserved_count($pdo, $eventId);
    if (($reservedCount + $giftVoucherQuantity) > (int) $event['max_participants']) {
        $pdo->rollBack();
        http_response_code(409);
        throw new RuntimeException('Nicht genügend freie Starterplätze für diese Gutschein-Bestellung verfügbar.');
    }

    $insertStmt = $pdo->prepare("INSERT INTO event2026_addon_purchases (
        event_id,
        registration_id,
        buyer_user_id,
        buyer_name,
        buyer_email,
        payment_reference_code,
        gift_voucher_quantity,
        expected_amount,
        paid_amount,
        status,
        payment_method,
        notes
    ) VALUES (
        :event_id,
        NULL,
        NULL,
        :buyer_name,
        :buyer_email,
        :payment_reference_code,
        :gift_voucher_quantity,
        :expected_amount,
        0,
        'pending',
        'stripe_checkout',
        :notes
    )");
    $insertStmt->execute([
        ':event_id' => $eventId,
        ':buyer_name' => $buyerName,
        ':buyer_email' => $buyerEmail,
        ':payment_reference_code' => $paymentRef,
        ':gift_voucher_quantity' => $giftVoucherQuantity,
        ':expected_amount' => $expectedAmount,
        ':notes' => $notes !== '' ? $notes : null,
    ]);
    $purchaseId = (int) $pdo->lastInsertId();
    event2026_log_action($pdo, $eventId, null, 'gift_purchase_create', 'addon_purchase', $purchaseId, [
        'gift_voucher_quantity' => $giftVoucherQuantity,
        'buyer_email' => $buyerEmail,
        'expected_amount' => $expectedAmount,
    ]);
    $pdo->commit();

    $mailBody = "Hallo {$buyerName},\n\n";
    $mailBody .= "deine Gutschein-Bestellung fuer die Ice-Tour 2026 wurde gespeichert.\n\n";
    $mailBody .= "Bestellung: #{$purchaseId}\n";
    $mailBody .= "Referenzcode: {$paymentRef}\n";
    $mailBody .= "Gutschein-Codes: {$giftVoucherQuantity}\n";
    $mailBody .= "Zu zahlender Gesamtbetrag: " . number_format($expectedAmount, 2, ',', '.') . " EUR\n\n";
    $mailBody .= "Bitte schliesse die Zahlung ueber Stripe im Event-Portal ab.\n";
    $mailBody .= "Die Gutschein-Codes werden erst nach bestaetigtem Zahlungseingang per Mail freigeschaltet.\n";
    $mailBody .= "Bei Rueckfragen melde dich bitte an " . EVENT2026_GIFT_PAYMENT_CONTACT . ".\n";
    event2026_gift_send_utf8_mail($buyerEmail, 'Ice-Tour 2026: Deine Gutschein-Bestellung', $mailBody);

    echo json_encode([
        'status' => 'success',
        'message' => 'Gutschein-Bestellung gespeichert. Die Codes werden nach bestätigter Zahlung per E-Mail freigeschaltet.',
        'gift_purchase' => [
            'id' => $purchaseId,
            'payment_reference_code' => $paymentRef,
            'gift_voucher_quantity' => $giftVoucherQuantity,
            'expected_amount' => $expectedAmount,
            'status' => 'pending',
            'buyer_email' => $buyerEmail,
        ],
        'payment_instruction' => 'Bitte schließe die Zahlung über Stripe im Event-Portal ab.',
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
