<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);
    $auth = event2026_require_auth_user($pdo);

    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];

    $registrationStmt = $pdo->prepare("SELECT
            r.*,
            p.method AS payment_method,
            p.expected_amount,
            p.paid_amount,
            p.status AS payment_status_detail
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
        throw new RuntimeException('Keine Event-Anmeldung für diesen Account gefunden.');
    }

    $slotStmt = $pdo->prepare("SELECT
            s.id,
            s.registration_id,
            s.user_id,
            s.full_name,
            s.email,
            s.route_key,
            s.distance_km,
            s.pace_group,
            s.women_wave_opt_in,
            s.public_name_consent,
            s.jersey_interest,
            s.clothing_interest,
            s.jersey_size,
            s.bib_size,
            s.license_status,
            s.legal_accepted_at,
            l.version AS legal_version,
            w.wave_code,
            w.start_time,
            w.is_women_wave
        FROM event2026_participant_slots s
        INNER JOIN event2026_legal_versions l ON l.id = s.legal_version_id
        LEFT JOIN event2026_wave_assignments wa ON wa.slot_id = s.id
        LEFT JOIN event2026_waves w ON w.id = wa.wave_id
        WHERE s.registration_id = :registration_id
        ORDER BY s.id ASC");
    $slotStmt->execute([
        ':registration_id' => (int) $registration['id'],
    ]);
    $slots = $slotStmt->fetchAll(PDO::FETCH_ASSOC);
    $ownSlot = $slots[0] ?? null;

    $voucherStmt = $pdo->prepare("SELECT
            id,
            code_value,
            purchased_by_addon_purchase_id,
            status,
            redeemed_by_registration_id,
            redeemed_at,
            created_at
        FROM event2026_gift_vouchers
        WHERE purchased_by_registration_id = :registration_id
        ORDER BY id ASC");
    $voucherStmt->execute([':registration_id' => (int) $registration['id']]);
    $giftVouchers = $voucherStmt->fetchAll(PDO::FETCH_ASSOC);

    $addonPurchaseStmt = $pdo->prepare("SELECT
            id,
            payment_reference_code,
            gift_voucher_quantity,
            expected_amount,
            paid_amount,
            status,
            payment_method,
            confirmed_at,
            created_at
        FROM event2026_addon_purchases
        WHERE registration_id = :registration_id
        ORDER BY created_at DESC, id DESC");
    $addonPurchaseStmt->execute([':registration_id' => (int) $registration['id']]);
    $addonPurchases = $addonPurchaseStmt->fetchAll(PDO::FETCH_ASSOC);

    $selectedRouteKey = event2026_normalize_route_key($ownSlot['route_key'] ?? '');
    $checkpointStatsStmt = $pdo->prepare("SELECT
            c.id,
            c.name,
            c.shop_id,
            c.order_index,
            c.is_mandatory,
            c.min_distance_km,
            c.route_keys_csv,
            CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS passed,
            p.passed_at,
            p.source,
            p.slot_id,
            p.checkin_id
        FROM event2026_checkpoints c
        LEFT JOIN event2026_checkpoint_passages p
            ON p.checkpoint_id = c.id
            AND p.event_id = c.event_id
            AND p.user_id = :user_id
        WHERE c.event_id = :event_id
          AND c.stamp_card_mode = 'live'
        ORDER BY c.order_index ASC, c.id ASC");
    $checkpointStatsStmt->execute([
        ':event_id' => $eventId,
        ':user_id' => $auth['user_id'],
    ]);
    $checkpoints = array_values(array_filter($checkpointStatsStmt->fetchAll(PDO::FETCH_ASSOC), static function (array $checkpoint) use ($selectedRouteKey): bool {
        return event2026_route_applies_to_checkpoint($selectedRouteKey, (string) ($checkpoint['route_keys_csv'] ?? ''));
    }));

    $mandatoryCount = 0;
    $mandatoryPassed = 0;
    foreach ($checkpoints as $cp) {
        if ((int) $cp['is_mandatory'] === 1) {
            $mandatoryCount++;
            if ((int) $cp['passed'] === 1) {
                $mandatoryPassed++;
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'name' => $event['name'],
            'event_date' => $event['event_date'],
            'status' => $event['status'],
        ],
        'route_catalog' => array_values(event2026_route_catalog()),
        'registration' => [
            'id' => (int) $registration['id'],
            'payment_reference_code' => (string) $registration['payment_reference_code'],
            'team_name' => $registration['team_name'],
            'payment_status' => (string) $registration['payment_status'],
            'entry_fee_amount' => (float) ($registration['entry_fee_amount'] ?? 0),
            'gift_voucher_quantity' => (int) ($registration['gift_voucher_quantity'] ?? 0),
            'gift_voucher_purchase_amount' => (float) ($registration['gift_voucher_purchase_amount'] ?? 0),
            'donation_amount' => (float) ($registration['donation_amount'] ?? 0),
            'voucher_discount_amount' => (float) ($registration['voucher_discount_amount'] ?? 0),
            'created_at' => $registration['created_at'],
        ],
        'payment' => [
            'method' => $registration['payment_method'] ?: null,
            'expected_amount' => $registration['expected_amount'] !== null ? (float) $registration['expected_amount'] : null,
            'paid_amount' => $registration['paid_amount'] !== null ? (float) $registration['paid_amount'] : null,
            'status' => $registration['payment_status_detail'] ?: null,
        ],
        'payment_instruction' => 'Bitte sende den Betrag wenn möglich per PayPal Freunde an ch_helbig@mail.de oder direkt über https://paypal.me/ChristianHelbig451. Diese privat organisierte Veranstaltung kann nicht als Spende ausgewiesen werden. Wenn du kein PayPal hast, melde dich bitte an admin@ice-app.de.',
        'slots' => array_map(static function (array $slot): array {
            $routeKey = event2026_normalize_route_key($slot['route_key'] ?? '');
            $slot['route_key'] = $routeKey;
            $slot['route_name'] = event2026_route_label($routeKey);
            $slot['route_type'] = event2026_route_definition($routeKey)['route_type'];
            $slot['clothing_interest'] = event2026_normalize_clothing_interest($slot['clothing_interest'] ?? '');
            $slot['clothing_interest_label'] = event2026_clothing_interest_label($slot['clothing_interest']);
            return $slot;
        }, $slots),
        'gift_vouchers' => array_map(static function (array $voucher): array {
            return [
                'id' => (int) $voucher['id'],
                'code' => (string) ($voucher['code_value'] ?? ''),
                'addon_purchase_id' => $voucher['purchased_by_addon_purchase_id'] !== null ? (int) $voucher['purchased_by_addon_purchase_id'] : null,
                'status' => (string) $voucher['status'],
                'redeemed_by_registration_id' => $voucher['redeemed_by_registration_id'] !== null ? (int) $voucher['redeemed_by_registration_id'] : null,
                'redeemed_at' => $voucher['redeemed_at'],
                'created_at' => $voucher['created_at'],
            ];
        }, $giftVouchers),
        'addon_purchases' => array_map(static function (array $purchase): array {
            return [
                'id' => (int) $purchase['id'],
                'payment_reference_code' => (string) $purchase['payment_reference_code'],
                'gift_voucher_quantity' => (int) $purchase['gift_voucher_quantity'],
                'expected_amount' => (float) $purchase['expected_amount'],
                'paid_amount' => (float) $purchase['paid_amount'],
                'status' => (string) $purchase['status'],
                'payment_method' => (string) $purchase['payment_method'],
                'confirmed_at' => $purchase['confirmed_at'],
                'created_at' => $purchase['created_at'],
            ];
        }, $addonPurchases),
        'checkpoints' => array_map(static function (array $checkpoint): array {
            $routeKeys = event2026_checkpoint_route_keys((string) ($checkpoint['route_keys_csv'] ?? ''));
            return [
                'id' => (int) $checkpoint['id'],
                'name' => (string) $checkpoint['name'],
                'shop_id' => $checkpoint['shop_id'] !== null ? (int) $checkpoint['shop_id'] : null,
                'order_index' => (int) $checkpoint['order_index'],
                'is_mandatory' => (int) $checkpoint['is_mandatory'],
                'min_distance_km' => (int) $checkpoint['min_distance_km'],
                'route_keys' => $routeKeys,
                'route_labels' => array_map('event2026_route_label', $routeKeys),
                'passed' => (int) $checkpoint['passed'],
                'passed_at' => $checkpoint['passed_at'],
                'source' => $checkpoint['source'],
                'slot_id' => $checkpoint['slot_id'] !== null ? (int) $checkpoint['slot_id'] : null,
                'checkin_id' => $checkpoint['checkin_id'] !== null ? (int) $checkpoint['checkin_id'] : null,
            ];
        }, $checkpoints),
        'progress' => [
            'mandatory_total' => $mandatoryCount,
            'mandatory_passed' => $mandatoryPassed,
            'is_finisher' => $mandatoryCount > 0 && $mandatoryCount === $mandatoryPassed,
        ],
        'starter_guide_assets' => event2026_starter_guide_assets(),
        'change_request_contact' => event2026_starter_guide_assets()['route_change_contact'],
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
