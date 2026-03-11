<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    event2026_require_admin($pdo);
    $event = event2026_current_event($pdo, true);
    $eventId = (int) $event['id'];

    $registrationStmt = $pdo->prepare("SELECT
            r.id,
            r.registered_by_user_id,
            r.team_name,
            r.payment_reference_code,
            r.entry_fee_amount,
            r.gift_voucher_quantity,
            r.gift_voucher_purchase_amount,
            r.donation_amount,
            r.voucher_discount_amount,
            r.payment_status,
            r.notes,
            r.created_at,
            p.id AS payment_id,
            p.method AS payment_method,
            p.expected_amount,
            p.paid_amount,
            p.status AS payment_status_detail,
            p.confirmed_at,
            p.confirmed_by_admin,
            n.username AS registered_by_username
        FROM event2026_registrations r
        LEFT JOIN event2026_payments p ON p.registration_id = r.id
        LEFT JOIN nutzer n ON n.id = r.registered_by_user_id
        WHERE r.event_id = :event_id
        ORDER BY r.created_at DESC, r.id DESC");
    $registrationStmt->execute([':event_id' => $eventId]);
    $registrations = $registrationStmt->fetchAll(PDO::FETCH_ASSOC);

    $slotStmt = $pdo->prepare("SELECT
            s.id,
            s.registration_id,
            s.user_id,
            s.full_name,
            s.email,
            s.route_key,
            s.distance_km,
            s.pace_group,
            s.public_name_consent,
            s.clothing_interest,
            s.jersey_size,
            s.bib_size,
            s.license_status,
            s.created_at,
            n.username AS linked_username,
            w.wave_code,
            w.start_time
        FROM event2026_participant_slots s
        LEFT JOIN nutzer n ON n.id = s.user_id
        LEFT JOIN event2026_wave_assignments wa ON wa.slot_id = s.id
        LEFT JOIN event2026_waves w ON w.id = wa.wave_id
        WHERE s.event_id = :event_id
        ORDER BY s.registration_id ASC, s.id ASC");
    $slotStmt->execute([':event_id' => $eventId]);
    $slotRows = $slotStmt->fetchAll(PDO::FETCH_ASSOC);

    $voucherStmt = $pdo->prepare("SELECT
            id,
            purchased_by_registration_id,
            purchased_by_addon_purchase_id,
            redeemed_by_registration_id,
            redeemed_by_slot_id,
            code_value,
            status,
            redeemed_at,
            created_at
        FROM event2026_gift_vouchers
        WHERE event_id = :event_id
        ORDER BY purchased_by_registration_id ASC, id ASC");
    $voucherStmt->execute([':event_id' => $eventId]);
    $voucherRows = $voucherStmt->fetchAll(PDO::FETCH_ASSOC);

    $addonStmt = $pdo->prepare("SELECT
            ap.*,
            n.username AS buyer_username
        FROM event2026_addon_purchases ap
        LEFT JOIN nutzer n ON n.id = ap.buyer_user_id
        WHERE ap.event_id = :event_id
        ORDER BY ap.created_at DESC, ap.id DESC");
    $addonStmt->execute([':event_id' => $eventId]);
    $addonRows = $addonStmt->fetchAll(PDO::FETCH_ASSOC);

    $slotsByRegistration = [];
    foreach ($slotRows as $slotRow) {
        $registrationId = (int) $slotRow['registration_id'];
        $slotsByRegistration[$registrationId][] = [
            'id' => (int) $slotRow['id'],
            'full_name' => (string) $slotRow['full_name'],
            'email' => (string) $slotRow['email'],
            'route_key' => event2026_normalize_route_key($slotRow['route_key'] ?? ''),
            'route_name' => event2026_route_label($slotRow['route_key'] ?? ''),
            'distance_km' => (int) $slotRow['distance_km'],
            'pace_group' => (string) $slotRow['pace_group'],
            'public_name_consent' => (int) $slotRow['public_name_consent'],
            'clothing_interest' => event2026_normalize_clothing_interest($slotRow['clothing_interest'] ?? ''),
            'clothing_interest_label' => event2026_clothing_interest_label($slotRow['clothing_interest'] ?? ''),
            'jersey_size' => $slotRow['jersey_size'],
            'bib_size' => $slotRow['bib_size'],
            'license_status' => (string) $slotRow['license_status'],
            'linked_user_id' => $slotRow['user_id'] !== null ? (int) $slotRow['user_id'] : null,
            'linked_username' => $slotRow['linked_username'] ?: null,
            'wave_code' => $slotRow['wave_code'] ?: null,
            'start_time' => $slotRow['start_time'] ?: null,
        ];
    }

    $vouchersByRegistration = [];
    $vouchersByAddonPurchase = [];
    $summary = [
        'registration_count' => 0,
        'participant_count' => 0,
        'voucher_count' => 0,
        'open_voucher_count' => 0,
        'redeemed_voucher_count' => 0,
        'expected_amount_total' => 0.0,
        'paid_amount_total' => 0.0,
        'donation_amount_total' => 0.0,
        'entry_fee_amount_total' => 0.0,
        'gift_voucher_purchase_amount_total' => 0.0,
        'voucher_discount_amount_total' => 0.0,
        'outstanding_amount_total' => 0.0,
        'paid_registration_count' => 0,
        'open_registration_count' => 0,
        'addon_purchase_count' => 0,
        'open_addon_purchase_count' => 0,
    ];

    foreach ($voucherRows as $voucherRow) {
        $voucherPayload = [
            'id' => (int) $voucherRow['id'],
            'code' => (string) ($voucherRow['code_value'] ?? ''),
            'addon_purchase_id' => $voucherRow['purchased_by_addon_purchase_id'] !== null ? (int) $voucherRow['purchased_by_addon_purchase_id'] : null,
            'status' => (string) $voucherRow['status'],
            'redeemed_by_registration_id' => $voucherRow['redeemed_by_registration_id'] !== null ? (int) $voucherRow['redeemed_by_registration_id'] : null,
            'redeemed_by_slot_id' => $voucherRow['redeemed_by_slot_id'] !== null ? (int) $voucherRow['redeemed_by_slot_id'] : null,
            'redeemed_at' => $voucherRow['redeemed_at'],
            'created_at' => $voucherRow['created_at'],
        ];
        $registrationId = (int) $voucherRow['purchased_by_registration_id'];
        $vouchersByRegistration[$registrationId][] = $voucherPayload;
        if ($voucherRow['purchased_by_addon_purchase_id'] !== null) {
            $vouchersByAddonPurchase[(int) $voucherRow['purchased_by_addon_purchase_id']][] = $voucherPayload;
        }
        $summary['voucher_count']++;
        if ($voucherRow['status'] === 'redeemed') {
            $summary['redeemed_voucher_count']++;
        } elseif ($voucherRow['status'] === 'open') {
            $summary['open_voucher_count']++;
        }
    }

    $resultRows = [];
    foreach ($registrations as $registration) {
        $registrationId = (int) $registration['id'];
        $slots = $slotsByRegistration[$registrationId] ?? [];
        $vouchers = $vouchersByRegistration[$registrationId] ?? [];
        $expectedAmount = (float) ($registration['expected_amount'] ?? 0);
        $paidAmount = (float) ($registration['paid_amount'] ?? 0);
        $entryFeeAmount = (float) ($registration['entry_fee_amount'] ?? 0);
        $giftVoucherQuantity = (int) ($registration['gift_voucher_quantity'] ?? 0);
        $giftVoucherPurchaseAmount = (float) ($registration['gift_voucher_purchase_amount'] ?? 0);
        $donationAmount = (float) ($registration['donation_amount'] ?? 0);
        $voucherDiscountAmount = (float) ($registration['voucher_discount_amount'] ?? 0);
        $outstandingAmount = max(0, $expectedAmount - $paidAmount);

        $summary['registration_count']++;
        $summary['participant_count'] += count($slots);
        $summary['expected_amount_total'] += $expectedAmount;
        $summary['paid_amount_total'] += $paidAmount;
        $summary['donation_amount_total'] += $donationAmount;
        $summary['entry_fee_amount_total'] += $entryFeeAmount;
        $summary['gift_voucher_purchase_amount_total'] += $giftVoucherPurchaseAmount;
        $summary['voucher_discount_amount_total'] += $voucherDiscountAmount;
        $summary['outstanding_amount_total'] += $outstandingAmount;

        if (($registration['payment_status_detail'] ?: $registration['payment_status']) === 'paid') {
            $summary['paid_registration_count']++;
        } else {
            $summary['open_registration_count']++;
        }

        $resultRows[] = [
            'id' => $registrationId,
            'team_name' => $registration['team_name'],
            'notes' => $registration['notes'],
            'created_at' => $registration['created_at'],
            'registered_by' => [
                'user_id' => $registration['registered_by_user_id'] !== null ? (int) $registration['registered_by_user_id'] : null,
                'username' => $registration['registered_by_username'] ?: null,
            ],
            'payment' => [
                'id' => $registration['payment_id'] !== null ? (int) $registration['payment_id'] : null,
                'reference_code' => (string) $registration['payment_reference_code'],
                'method' => $registration['payment_method'] ?: null,
                'registration_status' => (string) $registration['payment_status'],
                'status' => $registration['payment_status_detail'] ?: (string) $registration['payment_status'],
                'expected_amount' => $expectedAmount,
                'paid_amount' => $paidAmount,
                'entry_fee_amount' => $entryFeeAmount,
                'gift_voucher_quantity' => $giftVoucherQuantity,
                'gift_voucher_purchase_amount' => $giftVoucherPurchaseAmount,
                'donation_amount' => $donationAmount,
                'voucher_discount_amount' => $voucherDiscountAmount,
                'outstanding_amount' => $outstandingAmount,
                'confirmed_at' => $registration['confirmed_at'],
                'confirmed_by_admin' => $registration['confirmed_by_admin'] !== null ? (int) $registration['confirmed_by_admin'] : null,
            ],
            'slots' => $slots,
            'gift_vouchers' => $vouchers,
        ];
    }

    $addonResults = [];
    foreach ($addonRows as $addonRow) {
        $summary['addon_purchase_count']++;
        if ((string) $addonRow['status'] !== 'paid') {
            $summary['open_addon_purchase_count']++;
        }
        $addonResults[] = [
            'id' => (int) $addonRow['id'],
            'registration_id' => (int) $addonRow['registration_id'],
            'buyer' => [
                'user_id' => $addonRow['buyer_user_id'] !== null ? (int) $addonRow['buyer_user_id'] : null,
                'username' => $addonRow['buyer_username'] ?: null,
                'name' => $addonRow['buyer_name'] ?: null,
                'email' => $addonRow['buyer_email'] ?: null,
            ],
            'payment_reference_code' => (string) $addonRow['payment_reference_code'],
            'gift_voucher_quantity' => (int) $addonRow['gift_voucher_quantity'],
            'expected_amount' => (float) $addonRow['expected_amount'],
            'paid_amount' => (float) $addonRow['paid_amount'],
            'status' => (string) $addonRow['status'],
            'payment_method' => (string) $addonRow['payment_method'],
            'confirmed_at' => $addonRow['confirmed_at'],
            'created_at' => $addonRow['created_at'],
            'gift_vouchers' => $vouchersByAddonPurchase[(int) $addonRow['id']] ?? [],
        ];
    }

    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => $eventId,
            'name' => (string) $event['name'],
            'event_date' => $event['event_date'],
            'status' => (string) $event['status'],
        ],
        'summary' => array_map(static function ($value) {
            return is_float($value) ? round($value, 2) : $value;
        }, $summary),
        'registrations' => $resultRows,
        'addon_purchases' => $addonResults,
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
