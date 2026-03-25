<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/auth.php';

function event2026_ensure_schema(PDO $pdo): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }

    $sql = [
        "CREATE TABLE IF NOT EXISTS event2026_seasons (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(64) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            event_date DATE DEFAULT NULL,
            status ENUM('draft','open','closed','cancelled','confirmed') NOT NULL DEFAULT 'open',
            max_participants INT NOT NULL DEFAULT 150,
            min_participants_for_go INT NOT NULL DEFAULT 60,
            cancellation_deadline DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_legal_versions (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            version VARCHAR(32) NOT NULL,
            content_md TEXT NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_legal_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_legal_version (event_id, version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_registrations (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            registered_by_user_id INT DEFAULT NULL,
            team_name VARCHAR(255) DEFAULT NULL,
            payment_reference_code VARCHAR(64) NOT NULL,
            entry_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            gift_voucher_quantity INT NOT NULL DEFAULT 0,
            gift_voucher_purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            donation_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            voucher_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            payment_status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
            notes VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_reg_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_payment_ref (payment_reference_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_addon_purchases (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            registration_id INT DEFAULT NULL,
            buyer_user_id INT DEFAULT NULL,
            buyer_name VARCHAR(255) DEFAULT NULL,
            buyer_email VARCHAR(255) DEFAULT NULL,
            payment_reference_code VARCHAR(64) NOT NULL,
            gift_voucher_quantity INT NOT NULL DEFAULT 0,
            expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
            payment_method ENUM('paypal_friends','bank_transfer','stripe_checkout') NOT NULL DEFAULT 'paypal_friends',
            confirmed_by_admin INT DEFAULT NULL,
            confirmed_at DATETIME DEFAULT NULL,
            notes VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_addon_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_addon_registration FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_addon_payment_ref (payment_reference_code),
            KEY idx_event2026_addon_buyer (buyer_user_id, status),
            KEY idx_event2026_addon_registration (registration_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_participant_slots (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            registration_id INT NOT NULL,
            event_id INT NOT NULL,
            user_id INT DEFAULT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            route_key VARCHAR(32) NOT NULL DEFAULT 'classic_3',
            distance_km INT NOT NULL,
            pace_group VARCHAR(32) NOT NULL,
            women_wave_opt_in TINYINT(1) NOT NULL DEFAULT 0,
            public_name_consent TINYINT(1) NOT NULL DEFAULT 1,
            jersey_interest TINYINT(1) NOT NULL DEFAULT 0,
            clothing_interest VARCHAR(32) NOT NULL DEFAULT 'none',
            jersey_size VARCHAR(10) DEFAULT NULL,
            bib_size VARCHAR(10) DEFAULT NULL,
            license_status ENUM('pending_payment','licensed','cancelled') NOT NULL DEFAULT 'pending_payment',
            legal_version_id INT NOT NULL,
            legal_accepted_at DATETIME NOT NULL,
            legal_ip_hash VARCHAR(128) DEFAULT NULL,
            legal_user_agent_hash VARCHAR(128) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_slot_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_slot_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_slot_legal FOREIGN KEY (legal_version_id) REFERENCES event2026_legal_versions(id),
            KEY idx_event2026_slot_event_license (event_id, license_status),
            KEY idx_event2026_slot_user (event_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_legal_acceptances (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slot_id INT NOT NULL,
            legal_version_id INT NOT NULL,
            accepted_at DATETIME NOT NULL,
            ip_hash VARCHAR(128) DEFAULT NULL,
            user_agent_hash VARCHAR(128) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_accept_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_accept_legal FOREIGN KEY (legal_version_id) REFERENCES event2026_legal_versions(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_gift_vouchers (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            purchased_by_registration_id INT DEFAULT NULL,
            purchased_by_addon_purchase_id INT DEFAULT NULL,
            redeemed_by_registration_id INT DEFAULT NULL,
            redeemed_by_slot_id INT DEFAULT NULL,
            code_value VARCHAR(64) NOT NULL,
            code_hash VARCHAR(128) NOT NULL,
            status ENUM('open','redeemed','cancelled') NOT NULL DEFAULT 'open',
            redeemed_at DATETIME DEFAULT NULL,
            cancelled_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_voucher_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_voucher_purchase_reg FOREIGN KEY (purchased_by_registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_voucher_purchase_addon FOREIGN KEY (purchased_by_addon_purchase_id) REFERENCES event2026_addon_purchases(id) ON DELETE SET NULL,
            CONSTRAINT fk_event2026_voucher_redeem_reg FOREIGN KEY (redeemed_by_registration_id) REFERENCES event2026_registrations(id) ON DELETE SET NULL,
            CONSTRAINT fk_event2026_voucher_redeem_slot FOREIGN KEY (redeemed_by_slot_id) REFERENCES event2026_participant_slots(id) ON DELETE SET NULL,
            UNIQUE KEY uniq_event2026_voucher_hash (code_hash),
            KEY idx_event2026_voucher_purchase_reg (purchased_by_registration_id),
            KEY idx_event2026_voucher_redeem_reg (redeemed_by_registration_id),
            KEY idx_event2026_voucher_status (event_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_payments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            registration_id INT NOT NULL,
            method ENUM('paypal_friends','bank_transfer','stripe_checkout') NOT NULL DEFAULT 'paypal_friends',
            expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
            confirmed_by_admin INT DEFAULT NULL,
            confirmed_at DATETIME DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_payment_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            KEY idx_event2026_payment_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_registration_access_tokens (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            registration_id INT NOT NULL,
            token_hash VARCHAR(128) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME DEFAULT NULL,
            CONSTRAINT fk_event2026_reg_access_token_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_reg_access_token_hash (token_hash),
            KEY idx_event2026_reg_access_token_reg (registration_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_payment_mail_matches (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            payment_id INT DEFAULT NULL,
            registration_id INT DEFAULT NULL,
            mail_message_id VARCHAR(255) NOT NULL,
            sender VARCHAR(255) DEFAULT NULL,
            subject VARCHAR(255) DEFAULT NULL,
            amount_detected DECIMAL(10,2) DEFAULT NULL,
            reference_detected VARCHAR(64) DEFAULT NULL,
            confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
            status ENUM('suggested','approved','rejected') NOT NULL DEFAULT 'suggested',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_mailmatch_payment FOREIGN KEY (payment_id) REFERENCES event2026_payments(id) ON DELETE SET NULL,
            CONSTRAINT fk_event2026_mailmatch_registration FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE SET NULL,
            UNIQUE KEY uniq_event2026_mail_message (mail_message_id),
            KEY idx_event2026_mailmatch_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_waves (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            distance_km INT NOT NULL,
            wave_code VARCHAR(32) NOT NULL,
            start_time DATETIME DEFAULT NULL,
            capacity INT NOT NULL DEFAULT 20,
            is_women_wave TINYINT(1) NOT NULL DEFAULT 0,
            pace_group VARCHAR(32) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_wave_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_wave_code (event_id, wave_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_wave_assignments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            slot_id INT NOT NULL,
            wave_id INT NOT NULL,
            assigned_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_wave_assign_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_wave_assign_wave FOREIGN KEY (wave_id) REFERENCES event2026_waves(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_wave_slot (slot_id),
            KEY idx_event2026_wave_assign_wave (wave_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_checkpoints (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            shop_id INT DEFAULT NULL,
            name VARCHAR(255) NOT NULL,
            lat DECIMAL(10,7) NOT NULL,
            lng DECIMAL(10,7) NOT NULL,
            order_index INT NOT NULL DEFAULT 0,
            stamp_card_mode VARCHAR(16) NOT NULL DEFAULT 'live',
            is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
            min_distance_km INT NOT NULL DEFAULT 0,
            route_keys_csv VARCHAR(255) NOT NULL DEFAULT '',
            qr_code_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_checkpoint_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_checkpoint_shop_mode (event_id, shop_id, stamp_card_mode),
            KEY idx_event2026_checkpoint_order (event_id, order_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_checkpoint_passages (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            checkpoint_id INT NOT NULL,
            slot_id INT NOT NULL,
            user_id INT NOT NULL,
            passed_at DATETIME NOT NULL,
            source ENUM('qr','onsite_form','gps_click','qr_scan') NOT NULL,
            checkin_id INT DEFAULT NULL,
            qr_payload VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_passage_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_passage_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES event2026_checkpoints(id) ON DELETE CASCADE,
            CONSTRAINT fk_event2026_passage_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_event2026_passage (event_id, checkpoint_id, slot_id),
            KEY idx_event2026_passage_checkpoint (checkpoint_id, passed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS event2026_audit_log (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            actor_user_id INT DEFAULT NULL,
            action VARCHAR(64) NOT NULL,
            target_type VARCHAR(64) DEFAULT NULL,
            target_id INT DEFAULT NULL,
            meta_json JSON DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event2026_audit_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
            KEY idx_event2026_audit_action (action, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($sql as $statement) {
        $pdo->exec($statement);
    }

    // Backfill for existing installs (without relying on ADD COLUMN IF NOT EXISTS support).
    $columnExistsStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_participant_slots'
          AND COLUMN_NAME = 'public_name_consent'
    ");
    $columnExistsStmt->execute();
    if ((int) $columnExistsStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_participant_slots ADD COLUMN public_name_consent TINYINT(1) NOT NULL DEFAULT 1 AFTER women_wave_opt_in");
    }

    $routeKeyColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_participant_slots'
          AND COLUMN_NAME = 'route_key'
    ");
    $routeKeyColStmt->execute();
    if ((int) $routeKeyColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_participant_slots ADD COLUMN route_key VARCHAR(32) NOT NULL DEFAULT 'classic_3' AFTER email");
    }

    $donationAmountColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_registrations'
          AND COLUMN_NAME = 'donation_amount'
    ");
    $donationAmountColStmt->execute();
    if ((int) $donationAmountColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_registrations ADD COLUMN donation_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER payment_reference_code");
    }

    $entryFeeAmountColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_registrations'
          AND COLUMN_NAME = 'entry_fee_amount'
    ");
    $entryFeeAmountColStmt->execute();
    if ((int) $entryFeeAmountColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_registrations ADD COLUMN entry_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER payment_reference_code");
    }

    $giftVoucherAmountColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_registrations'
          AND COLUMN_NAME = 'gift_voucher_purchase_amount'
    ");
    $giftVoucherAmountColStmt->execute();
    if ((int) $giftVoucherAmountColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_registrations ADD COLUMN gift_voucher_purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER entry_fee_amount");
    }

    $giftVoucherQuantityColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_registrations'
          AND COLUMN_NAME = 'gift_voucher_quantity'
    ");
    $giftVoucherQuantityColStmt->execute();
    if ((int) $giftVoucherQuantityColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_registrations ADD COLUMN gift_voucher_quantity INT NOT NULL DEFAULT 0 AFTER entry_fee_amount");
    }

    $voucherDiscountColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_registrations'
          AND COLUMN_NAME = 'voucher_discount_amount'
    ");
    $voucherDiscountColStmt->execute();
    if ((int) $voucherDiscountColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_registrations ADD COLUMN voucher_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER donation_amount");
    }

    $voucherCodeValueColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_gift_vouchers'
          AND COLUMN_NAME = 'code_value'
    ");
    $voucherCodeValueColStmt->execute();
    if ((int) $voucherCodeValueColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_gift_vouchers ADD COLUMN code_value VARCHAR(64) DEFAULT NULL AFTER redeemed_by_slot_id");
    }

    $voucherAddonPurchaseColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_gift_vouchers'
          AND COLUMN_NAME = 'purchased_by_addon_purchase_id'
    ");
    $voucherAddonPurchaseColStmt->execute();
    if ((int) $voucherAddonPurchaseColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_gift_vouchers ADD COLUMN purchased_by_addon_purchase_id INT DEFAULT NULL AFTER purchased_by_registration_id");
    }

    $addonBuyerNameColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_addon_purchases'
          AND COLUMN_NAME = 'buyer_name'
    ");
    $addonBuyerNameColStmt->execute();
    if ((int) $addonBuyerNameColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_addon_purchases ADD COLUMN buyer_name VARCHAR(255) DEFAULT NULL AFTER buyer_user_id");
    }

    $addonBuyerEmailColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_addon_purchases'
          AND COLUMN_NAME = 'buyer_email'
    ");
    $addonBuyerEmailColStmt->execute();
    if ((int) $addonBuyerEmailColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_addon_purchases ADD COLUMN buyer_email VARCHAR(255) DEFAULT NULL AFTER buyer_name");
    }

    $pdo->exec("ALTER TABLE event2026_addon_purchases MODIFY COLUMN registration_id INT DEFAULT NULL");
    $pdo->exec("ALTER TABLE event2026_addon_purchases MODIFY COLUMN buyer_user_id INT DEFAULT NULL");
    $pdo->exec("ALTER TABLE event2026_addon_purchases MODIFY COLUMN payment_method ENUM('paypal_friends','bank_transfer','stripe_checkout') NOT NULL DEFAULT 'paypal_friends'");
    $pdo->exec("ALTER TABLE event2026_payments MODIFY COLUMN method ENUM('paypal_friends','bank_transfer','stripe_checkout') NOT NULL DEFAULT 'paypal_friends'");
    $pdo->exec("ALTER TABLE event2026_gift_vouchers MODIFY COLUMN purchased_by_registration_id INT DEFAULT NULL");

    $clothingInterestColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_participant_slots'
          AND COLUMN_NAME = 'clothing_interest'
    ");
    $clothingInterestColStmt->execute();
    if ((int) $clothingInterestColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_participant_slots ADD COLUMN clothing_interest VARCHAR(32) NOT NULL DEFAULT 'none' AFTER jersey_interest");
    }

    $bibSizeColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_participant_slots'
          AND COLUMN_NAME = 'bib_size'
    ");
    $bibSizeColStmt->execute();
    if ((int) $bibSizeColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_participant_slots ADD COLUMN bib_size VARCHAR(10) DEFAULT NULL AFTER jersey_size");
    }

    $checkpointMinDistanceColStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoints'
          AND COLUMN_NAME = 'min_distance_km'
    ");
    $checkpointMinDistanceColStmt->execute();
    if ((int) $checkpointMinDistanceColStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_checkpoints ADD COLUMN min_distance_km INT NOT NULL DEFAULT 0 AFTER is_mandatory");
    }

    $checkpointRouteKeysStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoints'
          AND COLUMN_NAME = 'route_keys_csv'
    ");
    $checkpointRouteKeysStmt->execute();
    if ((int) $checkpointRouteKeysStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_checkpoints ADD COLUMN route_keys_csv VARCHAR(255) NOT NULL DEFAULT '' AFTER min_distance_km");
    }

    $checkpointModeStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoints'
          AND COLUMN_NAME = 'stamp_card_mode'
    ");
    $checkpointModeStmt->execute();
    if ((int) $checkpointModeStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_checkpoints ADD COLUMN stamp_card_mode VARCHAR(16) NOT NULL DEFAULT 'live' AFTER order_index");
    }

    $checkpointQrStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoints'
          AND COLUMN_NAME = 'qr_code_id'
    ");
    $checkpointQrStmt->execute();
    if ((int) $checkpointQrStmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE event2026_checkpoints ADD COLUMN qr_code_id INT DEFAULT NULL AFTER route_keys_csv");
    }

    $passageSourceStmt = $pdo->prepare("
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'event2026_checkpoint_passages'
          AND COLUMN_NAME = 'source'
        LIMIT 1
    ");
    $passageSourceStmt->execute();
    $passageSourceType = (string) ($passageSourceStmt->fetchColumn() ?: '');
    if (strpos($passageSourceType, 'gps_click') === false || strpos($passageSourceType, 'qr_scan') === false) {
        $pdo->exec("ALTER TABLE event2026_checkpoint_passages MODIFY COLUMN source ENUM('qr','onsite_form','gps_click','qr_scan') NOT NULL");
    }

    $pdo->exec("UPDATE event2026_participant_slots
        SET route_key = CASE
            WHEN route_key IS NULL OR route_key = '' THEN
                CASE
                    WHEN distance_km >= 175 THEN 'epic_4'
                    ELSE 'classic_3'
                END
            ELSE route_key
        END");

    $pdo->exec("UPDATE event2026_participant_slots
        SET clothing_interest = CASE
            WHEN clothing_interest IS NULL OR clothing_interest = '' THEN
                CASE
                    WHEN jersey_interest = 1 THEN 'jersey_interest'
                    ELSE 'none'
                END
            ELSE clothing_interest
        END");

    $pdo->exec("UPDATE event2026_registrations r
        LEFT JOIN (
            SELECT registration_id, COUNT(*) AS slot_count
            FROM event2026_participant_slots
            GROUP BY registration_id
        ) slots ON slots.registration_id = r.id
        SET r.entry_fee_amount = CASE
            WHEN r.entry_fee_amount > 0 THEN r.entry_fee_amount
            ELSE COALESCE(slots.slot_count, 0) * 15
        END
        WHERE r.entry_fee_amount = 0");

    $pdo->exec("UPDATE event2026_registrations
        SET gift_voucher_purchase_amount = 0
        WHERE gift_voucher_purchase_amount IS NULL");

    $pdo->exec("UPDATE event2026_registrations
        SET gift_voucher_quantity = ROUND(COALESCE(gift_voucher_purchase_amount, 0) / 15)
        WHERE gift_voucher_quantity = 0 AND COALESCE(gift_voucher_purchase_amount, 0) > 0");

    $pdo->exec("UPDATE event2026_registrations
        SET voucher_discount_amount = 0
        WHERE voucher_discount_amount IS NULL");

    $pdo->exec("UPDATE event2026_checkpoints
        SET stamp_card_mode = 'live'
        WHERE stamp_card_mode IS NULL OR stamp_card_mode = ''");

    $pdo->exec("INSERT INTO event2026_seasons (slug, name, event_date, status, max_participants, min_participants_for_go, cancellation_deadline)
        SELECT 'event-2026', 'Ice-Tour 2026', '2026-05-16', 'open', 150, 60, '2026-05-01 23:59:59'
        WHERE NOT EXISTS (SELECT 1 FROM event2026_seasons WHERE slug = 'event-2026')");

    $eventIdStmt = $pdo->prepare("SELECT id FROM event2026_seasons WHERE slug = 'event-2026' LIMIT 1");
    $eventIdStmt->execute();
    $eventId = (int) ($eventIdStmt->fetchColumn() ?: 0);

    if ($eventId > 0) {
        $defaultLegal = "## Teilnahmebedingungen Ice-Tour 2026\n\n- Teilnahme auf eigene Gefahr und eigene Kosten.\n- Es gilt die StVO.\n- Dies ist kein Rennen und keine Zeitfahrveranstaltung.\n- Maximal 150 Teilnehmer.\n- Bei zu geringer Teilnehmerzahl behalten wir uns eine Absage vor.";

        $legalStmt = $pdo->prepare("INSERT INTO event2026_legal_versions (event_id, version, content_md, is_active)
            SELECT :event_id, '2026.1', :content_md, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM event2026_legal_versions WHERE event_id = :event_id2 AND version = '2026.1'
            )");
        $legalStmt->execute([
            ':event_id' => $eventId,
            ':event_id2' => $eventId,
            ':content_md' => $defaultLegal,
        ]);

        $shopStmt = $pdo->prepare("SELECT id, name, latitude, longitude FROM eisdielen WHERE id = :id LIMIT 1");
        $checkpointStmt = $pdo->prepare("INSERT INTO event2026_checkpoints (event_id, shop_id, name, lat, lng, order_index, stamp_card_mode, is_mandatory, min_distance_km, route_keys_csv, qr_code_id)
            SELECT :event_id, :shop_id, :name, :lat, :lng, :order_index, :stamp_card_mode, 1, :min_distance_km, :route_keys_csv, :qr_code_id
            WHERE NOT EXISTS (
                SELECT 1 FROM event2026_checkpoints WHERE event_id = :event_id2 AND shop_id = :shop_id2 AND stamp_card_mode = :stamp_card_mode2
            )");
        $checkpointUpdateStmt = $pdo->prepare("UPDATE event2026_checkpoints
            SET name = :name,
                lat = :lat,
                lng = :lng,
                order_index = :order_index,
                stamp_card_mode = :stamp_card_mode,
                is_mandatory = 1,
                min_distance_km = :min_distance_km,
                route_keys_csv = :route_keys_csv,
                qr_code_id = :qr_code_id
            WHERE event_id = :event_id AND shop_id = :shop_id AND stamp_card_mode = :stamp_card_mode");

        foreach (event2026_stamp_card_configs($pdo) as $stampCardMode => $targetCheckpointShops) {
            $shopIds = array_keys($targetCheckpointShops);
            if (!empty($shopIds)) {
                $shopIdsSql = implode(',', array_map('intval', $shopIds));
                $pdo->prepare("DELETE FROM event2026_checkpoints WHERE event_id = :event_id AND stamp_card_mode = :stamp_card_mode AND (shop_id IS NULL OR shop_id NOT IN ({$shopIdsSql}))")
                    ->execute([
                        ':event_id' => $eventId,
                        ':stamp_card_mode' => $stampCardMode,
                    ]);
            }

            foreach ($targetCheckpointShops as $shopId => $config) {
                $shopStmt->execute([':id' => $shopId]);
                $shop = $shopStmt->fetch(PDO::FETCH_ASSOC);
                if (!$shop) {
                    continue;
                }
                $order = (int) ($config['order'] ?? 0);
                $minDistanceKm = (int) ($config['min_distance_km'] ?? 0);
                $routeKeysCsv = implode(',', (array) ($config['route_keys'] ?? []));
                $qrCodeId = event2026_ensure_checkpoint_qr_code($pdo, $eventId, $stampCardMode, (int) $shop['id'], (string) $shop['name']);
                $checkpointStmt->execute([
                    ':event_id' => $eventId,
                    ':event_id2' => $eventId,
                    ':shop_id' => $shopId,
                    ':shop_id2' => $shopId,
                    ':name' => (string) $shop['name'],
                    ':lat' => (float) $shop['latitude'],
                    ':lng' => (float) $shop['longitude'],
                    ':order_index' => $order,
                    ':stamp_card_mode' => $stampCardMode,
                    ':stamp_card_mode2' => $stampCardMode,
                    ':min_distance_km' => $minDistanceKm,
                    ':route_keys_csv' => $routeKeysCsv,
                    ':qr_code_id' => $qrCodeId,
                ]);
                $checkpointUpdateStmt->execute([
                    ':event_id' => $eventId,
                    ':shop_id' => $shopId,
                    ':name' => (string) $shop['name'],
                    ':lat' => (float) $shop['latitude'],
                    ':lng' => (float) $shop['longitude'],
                    ':order_index' => $order,
                    ':stamp_card_mode' => $stampCardMode,
                    ':min_distance_km' => $minDistanceKm,
                    ':route_keys_csv' => $routeKeysCsv,
                    ':qr_code_id' => $qrCodeId,
                ]);
            }
        }
    }

    $initialized = true;
}

function event2026_current_event(PDO $pdo, bool $forUpdate = false): array
{
    $lockClause = $forUpdate ? " FOR UPDATE" : "";
    $stmt = $pdo->prepare("SELECT * FROM event2026_seasons WHERE slug = 'event-2026' LIMIT 1{$lockClause}");
    $stmt->execute();
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$event) {
        throw new RuntimeException('Event 2026 konnte nicht geladen werden.');
    }
    return $event;
}

function event2026_checkpoint_shop_config(): array
{
    return event2026_live_checkpoint_shop_config();
}

function event2026_live_checkpoint_shop_config(): array
{
    return [
        314 => ['order' => 1, 'min_distance_km' => 140, 'route_keys' => ['classic_3', 'epic_4']], // Bäckerei Bräunig
        145 => ['order' => 2, 'min_distance_km' => 70, 'route_keys' => ['family_2', 'classic_3', 'epic_4']], // Eisdiele Schöne
        111 => ['order' => 3, 'min_distance_km' => 70, 'route_keys' => ['family_2', 'classic_3', 'epic_4']], // Klatt-Eismanufaktur
        22  => ['order' => 4, 'min_distance_km' => 175, 'route_keys' => ['epic_4']], // Eiscafé Elisenhof
        293 => ['order' => 5, 'min_distance_km' => 70, 'route_keys' => ['family_2', 'classic_3', 'epic_4']], // Karl mag's süß
    ];
}

function event2026_test_checkpoint_shop_config(PDO $pdo): array
{
    return [
        20 => ['order' => 1, 'min_distance_km' => 0, 'route_keys' => ['family_2', 'classic_3', 'epic_4']],
        179 => ['order' => 2, 'min_distance_km' => 0, 'route_keys' => ['family_2', 'classic_3', 'epic_4']],
        565 => ['order' => 3, 'min_distance_km' => 0, 'route_keys' => ['family_2', 'classic_3', 'epic_4']],
    ];
}

function event2026_stamp_card_configs(PDO $pdo): array
{
    return [
        'live' => event2026_live_checkpoint_shop_config(),
        'test' => event2026_test_checkpoint_shop_config($pdo),
    ];
}

function event2026_normalize_stamp_card_mode(?string $mode): string
{
    return trim((string) $mode) === 'test' ? 'test' : 'live';
}

function event2026_start_finish_shop_id(?string $mode = 'live'): int
{
    return event2026_normalize_stamp_card_mode($mode) === 'test' ? 565 : 293;
}

function event2026_start_finish_config(PDO $pdo, ?string $mode = 'live'): array
{
    $mode = event2026_normalize_stamp_card_mode($mode);
    $shopId = event2026_start_finish_shop_id($mode);

    $stmt = $pdo->prepare("SELECT id, name, adresse, latitude, longitude FROM eisdielen WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $shopId]);
    $shop = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shop) {
        return [
            'shop_id' => $shopId,
            'name' => $mode === 'test' ? 'Test Start & Ziel' : 'Start & Ziel',
            'address' => '',
            'postal_code' => '',
            'city' => '',
            'full_address' => '',
            'lat' => 0.0,
            'lng' => 0.0,
        ];
    }

    $address = trim((string) ($shop['adresse'] ?? ''));
    $postalCode = '';
    $city = '';
    $fullAddress = $address;

    return [
        'shop_id' => (int) $shop['id'],
        'name' => (string) $shop['name'],
        'address' => $address,
        'postal_code' => $postalCode,
        'city' => $city,
        'full_address' => $fullAddress,
        'lat' => (float) $shop['latitude'],
        'lng' => (float) $shop['longitude'],
    ];
}

function event2026_live_stamping_available_from(array $event): string
{
    $eventDate = trim((string) ($event['event_date'] ?? ''));
    return $eventDate !== '' ? $eventDate : '2026-05-16';
}

function event2026_live_stamping_message(array $event): string
{
    $rawDate = event2026_live_stamping_available_from($event);
    $months = [
        1 => 'Januar',
        2 => 'Februar',
        3 => 'März',
        4 => 'April',
        5 => 'Mai',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'August',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Dezember',
    ];

    try {
        $date = new DateTimeImmutable($rawDate);
        $month = $months[(int) $date->format('n')] ?? $date->format('m');
        $formattedDate = sprintf('%d. %s %s', (int) $date->format('j'), $month, $date->format('y'));
    } catch (Throwable $e) {
        $formattedDate = $rawDate;
    }

    return sprintf('Die Stempelkarte kann erst am Event-Tag (%s) genutzt werden.', $formattedDate);
}

function event2026_is_live_stamping_open(array $event): bool
{
    $timezone = new DateTimeZone('Europe/Berlin');
    $availableFrom = new DateTimeImmutable(event2026_live_stamping_available_from($event) . ' 00:00:00', $timezone);
    $now = new DateTimeImmutable('now', $timezone);
    return $now >= $availableFrom;
}

function event2026_ensure_checkpoint_qr_code(PDO $pdo, int $eventId, string $stampCardMode, int $shopId, string $shopName): int
{
    $stampCardMode = event2026_normalize_stamp_card_mode($stampCardMode);
    $code = sprintf('event2026-%s-shop-%d', $stampCardMode, $shopId);
    $name = sprintf('Ice-Tour 2026 %s: %s', $stampCardMode === 'test' ? 'Test' : 'Checkpoint', $shopName);
    $description = sprintf(
        '%s QR-Code für die Event-Stempelkarte %s.',
        $stampCardMode === 'test' ? 'Test-' : '',
        $shopName
    );

    $selectStmt = $pdo->prepare("SELECT id FROM qr_codes WHERE code = :code LIMIT 1");
    $selectStmt->execute([':code' => $code]);
    $existingId = (int) ($selectStmt->fetchColumn() ?: 0);

    if ($existingId <= 0) {
        $insertStmt = $pdo->prepare("INSERT INTO qr_codes (name, code, description, award_type, eisdiele_id, created_at)
            VALUES (:name, :code, :description, :award_type, :eisdiele_id, NOW())");
        $insertStmt->execute([
            ':name' => $name,
            ':code' => $code,
            ':description' => $description,
            ':award_type' => 'event_stamp_card',
            ':eisdiele_id' => $shopId,
        ]);
        $existingId = (int) $pdo->lastInsertId();
    } else {
        $updateStmt = $pdo->prepare("UPDATE qr_codes
            SET name = :name,
                description = :description,
                award_type = :award_type,
                eisdiele_id = :eisdiele_id
            WHERE id = :id");
        $updateStmt->execute([
            ':id' => $existingId,
            ':name' => $name,
            ':description' => $description,
            ':award_type' => 'event_stamp_card',
            ':eisdiele_id' => $shopId,
        ]);
    }

    return $existingId;
}

function event2026_haversine_distance_m(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $earthRadius = 6371000.0;
    $lat1Rad = deg2rad($lat1);
    $lat2Rad = deg2rad($lat2);
    $deltaLat = deg2rad($lat2 - $lat1);
    $deltaLng = deg2rad($lng2 - $lng1);

    $a = sin($deltaLat / 2) ** 2
        + cos($lat1Rad) * cos($lat2Rad) * sin($deltaLng / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}

function event2026_route_catalog(): array
{
    return [
        'epic_4' => [
            'key' => 'epic_4',
            'label' => 'Königsrunde',
            'short_label' => 'König',
            'distance_km' => 175,
            'elevation_m' => 1950,
            'stops' => 4,
            'route_type' => 'sport',
            'pace_group' => '24_27',
            'pace_enabled' => true,
            'start_mode' => 'grouped',
        ],
        'classic_3' => [
            'key' => 'classic_3',
            'label' => 'Sportliche Runde',
            'short_label' => 'Sport',
            'distance_km' => 140,
            'elevation_m' => 1600,
            'stops' => 3,
            'route_type' => 'sport',
            'pace_group' => '24_27',
            'pace_enabled' => true,
            'start_mode' => 'grouped',
        ],
        'family_2' => [
            'key' => 'family_2',
            'label' => 'Genussrunde',
            'short_label' => 'Genuss',
            'distance_km' => 75,
            'elevation_m' => 550,
            'stops' => 2,
            'route_type' => 'family',
            'pace_group' => 'family',
            'pace_enabled' => false,
            'start_mode' => 'open_window',
        ],
    ];
}

function event2026_default_route_key(): string
{
    return 'classic_3';
}

function event2026_normalize_route_key(?string $routeKey): string
{
    $catalog = event2026_route_catalog();
    $routeKey = trim((string) $routeKey);
    if ($routeKey !== '' && isset($catalog[$routeKey])) {
        return $routeKey;
    }
    return event2026_default_route_key();
}

function event2026_route_definition(?string $routeKey): array
{
    $catalog = event2026_route_catalog();
    $normalized = event2026_normalize_route_key($routeKey);
    return $catalog[$normalized];
}

function event2026_route_label(?string $routeKey): string
{
    $route = event2026_route_definition($routeKey);
    return (string) $route['label'];
}

function event2026_route_distance(?string $routeKey): int
{
    $route = event2026_route_definition($routeKey);
    return (int) $route['distance_km'];
}

function event2026_route_supports_pace(?string $routeKey): bool
{
    $route = event2026_route_definition($routeKey);
    return !empty($route['pace_enabled']);
}

function event2026_allowed_pace_groups(?string $routeKey): array
{
    if (!event2026_route_supports_pace($routeKey)) {
        return ['family'];
    }
    return ['unter_24', '24_27', '27_30', 'ueber_30'];
}

function event2026_normalize_pace_group(?string $routeKey, ?string $paceGroup): string
{
    $route = event2026_route_definition($routeKey);
    $paceGroup = trim((string) $paceGroup);
    $allowed = event2026_allowed_pace_groups($route['key']);
    if ($paceGroup !== '' && in_array($paceGroup, $allowed, true)) {
        return $paceGroup;
    }
    return (string) $route['pace_group'];
}

function event2026_clothing_interest_options(): array
{
    return ['none', 'jersey_interest', 'kit_interest'];
}

function event2026_normalize_clothing_interest(?string $value): string
{
    $value = trim((string) $value);
    if (in_array($value, event2026_clothing_interest_options(), true)) {
        return $value;
    }
    return 'none';
}

function event2026_clothing_interest_label(?string $value): string
{
    switch (event2026_normalize_clothing_interest($value)) {
        case 'jersey_interest':
            return 'Trikot-Interesse';
        case 'kit_interest':
            return 'Set-Interesse';
        default:
            return 'Kein Bekleidungsinteresse';
    }
}

function event2026_checkpoint_route_keys(string $routeKeysCsv): array
{
    return array_values(array_filter(array_map('trim', explode(',', $routeKeysCsv))));
}

function event2026_route_applies_to_checkpoint(string $routeKey, string $routeKeysCsv): bool
{
    $routeKeys = event2026_checkpoint_route_keys($routeKeysCsv);
    return in_array(event2026_normalize_route_key($routeKey), $routeKeys, true);
}

function event2026_starter_guide_assets(): array
{
    return [
        'roadbook_status' => 'placeholder',
        'gpx_status' => 'placeholder',
        'contact_email' => 'event@ice-app.de',
        'route_change_contact' => 'Nutze bitte das Kontaktformular bzw. schreibe an event@ice-app.de, wenn du die Route wechseln möchtest.',
        'checklist' => [
            'Navi-Radcomputer mit GPX oder Smartphone mit Navigation',
            'Smartphone mit Internet und eingeloggter Ice-App',
            'Digitale Stempelkarte im Event-Portal bereithalten',
            'Helm, Licht und Trinkflaschen mitbringen',
        ],
    ];
}

function event2026_checkpoint_shop_ids(): array
{
    return array_keys(event2026_checkpoint_shop_config());
}

function event2026_active_legal(PDO $pdo, int $eventId): array
{
    $stmt = $pdo->prepare("SELECT * FROM event2026_legal_versions WHERE event_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1");
    $stmt->execute([$eventId]);
    $legal = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$legal) {
        throw new RuntimeException('Aktive Rechtstext-Version fehlt.');
    }
    return $legal;
}

function event2026_reserved_count(PDO $pdo, int $eventId): int
{
    $sql = "SELECT
            COALESCE((
                SELECT COUNT(*)
                FROM event2026_participant_slots s
                WHERE s.event_id = :event_id_slots
                  AND (
                    s.license_status = 'licensed'
                    OR (
                      s.license_status = 'pending_payment'
                      AND s.created_at >= (NOW() - INTERVAL 72 HOUR)
                    )
                  )
            ), 0)
            +
            COALESCE((
                SELECT COUNT(*)
                FROM event2026_gift_vouchers gv
                WHERE gv.event_id = :event_id_open_vouchers
                  AND gv.status NOT IN ('redeemed', 'cancelled')
            ), 0)
            +
            COALESCE((
                SELECT SUM(GREATEST(r.gift_voucher_quantity - COALESCE(v.created_count, 0), 0))
                FROM event2026_registrations r
                LEFT JOIN (
                    SELECT purchased_by_registration_id AS registration_id, COUNT(*) AS created_count
                    FROM event2026_gift_vouchers
                    WHERE event_id = :event_id_reg_voucher_created
                      AND purchased_by_registration_id IS NOT NULL
                    GROUP BY purchased_by_registration_id
                ) v ON v.registration_id = r.id
                WHERE r.event_id = :event_id_reg
                  AND (
                    r.payment_status = 'paid'
                    OR (
                      r.payment_status IN ('pending', 'partially_paid')
                      AND r.created_at >= (NOW() - INTERVAL 72 HOUR)
                    )
                  )
            ), 0)
            +
            COALESCE((
                SELECT SUM(GREATEST(ap.gift_voucher_quantity - COALESCE(v.created_count, 0), 0))
                FROM event2026_addon_purchases ap
                LEFT JOIN (
                    SELECT purchased_by_addon_purchase_id AS addon_purchase_id, COUNT(*) AS created_count
                    FROM event2026_gift_vouchers
                    WHERE event_id = :event_id_addon_voucher_created
                      AND purchased_by_addon_purchase_id IS NOT NULL
                    GROUP BY purchased_by_addon_purchase_id
                ) v ON v.addon_purchase_id = ap.id
                WHERE ap.event_id = :event_id_addon
                  AND (
                    ap.status = 'paid'
                    OR (
                      ap.status IN ('pending', 'partially_paid')
                      AND ap.created_at >= (NOW() - INTERVAL 72 HOUR)
                    )
                  )
            ), 0) AS reserved_total";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':event_id_slots' => $eventId,
        ':event_id_open_vouchers' => $eventId,
        ':event_id_reg_voucher_created' => $eventId,
        ':event_id_reg' => $eventId,
        ':event_id_addon_voucher_created' => $eventId,
        ':event_id_addon' => $eventId,
    ]);
    return (int) $stmt->fetchColumn();
}

function event2026_hash_nullable(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    return hash('sha256', $value);
}

function event2026_json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Ungültige JSON Daten.');
    }
    return $data;
}

function event2026_require_auth_user(PDO $pdo): array
{
    $authData = requireAuth($pdo);
    return [
        'user_id' => (int) $authData['user_id'],
        'username' => (string) $authData['username'],
    ];
}

function event2026_fetch_user_email(PDO $pdo, int $userId): ?string
{
    $stmt = $pdo->prepare("SELECT email FROM nutzer WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $email = $stmt->fetchColumn();
    if (!is_string($email) || $email === '') {
        return null;
    }
    return $email;
}

function event2026_require_admin(PDO $pdo): array
{
    $auth = event2026_require_auth_user($pdo);
    if ($auth['user_id'] !== 1) {
        http_response_code(403);
        throw new RuntimeException('Nur Admin erlaubt.');
    }
    return $auth;
}

function event2026_generate_gift_voucher_code(): string
{
    return strtoupper(implode('-', [
        substr(bin2hex(random_bytes(2)), 0, 4),
        substr(bin2hex(random_bytes(2)), 0, 4),
        substr(bin2hex(random_bytes(2)), 0, 4),
    ]));
}

function event2026_create_gift_voucher(PDO $pdo, int $eventId, ?int $registrationId, ?int $addonPurchaseId = null): array
{
    $code = event2026_generate_gift_voucher_code();
    $stmt = $pdo->prepare("INSERT INTO event2026_gift_vouchers (
        event_id,
        purchased_by_registration_id,
        purchased_by_addon_purchase_id,
        code_value,
        code_hash,
        status
    ) VALUES (
        :event_id,
        :registration_id,
        :addon_purchase_id,
        :code_value,
        :code_hash,
        'open'
    )");
    $stmt->execute([
        ':event_id' => $eventId,
        ':registration_id' => $registrationId,
        ':addon_purchase_id' => $addonPurchaseId,
        ':code_value' => $code,
        ':code_hash' => hash('sha256', $code),
    ]);

    return [
        'id' => (int) $pdo->lastInsertId(),
        'code' => $code,
        'status' => 'open',
    ];
}

function event2026_generate_missing_registration_vouchers(PDO $pdo, int $eventId, int $registrationId, int $targetQuantity): array
{
    if ($targetQuantity <= 0) {
        return [];
    }

    $countStmt = $pdo->prepare("SELECT COUNT(*)
        FROM event2026_gift_vouchers
        WHERE event_id = :event_id
          AND purchased_by_registration_id = :registration_id
          AND purchased_by_addon_purchase_id IS NULL");
    $countStmt->execute([
        ':event_id' => $eventId,
        ':registration_id' => $registrationId,
    ]);
    $existingCount = (int) $countStmt->fetchColumn();
    $missing = max(0, $targetQuantity - $existingCount);
    $created = [];
    for ($i = 0; $i < $missing; $i++) {
        $created[] = event2026_create_gift_voucher($pdo, $eventId, $registrationId);
    }
    return $created;
}

function event2026_generate_missing_addon_purchase_vouchers(PDO $pdo, int $eventId, ?int $registrationId, int $addonPurchaseId, int $targetQuantity): array
{
    if ($targetQuantity <= 0) {
        return [];
    }

    $countStmt = $pdo->prepare("SELECT COUNT(*)
        FROM event2026_gift_vouchers
        WHERE event_id = :event_id
          AND purchased_by_registration_id = :registration_id
          AND purchased_by_addon_purchase_id = :addon_purchase_id");
    $countStmt->execute([
        ':event_id' => $eventId,
        ':registration_id' => $registrationId,
        ':addon_purchase_id' => $addonPurchaseId,
    ]);
    $existingCount = (int) $countStmt->fetchColumn();
    $missing = max(0, $targetQuantity - $existingCount);
    $created = [];
    for ($i = 0; $i < $missing; $i++) {
        $created[] = event2026_create_gift_voucher($pdo, $eventId, $registrationId, $addonPurchaseId);
    }
    return $created;
}

function event2026_fetch_registration_owner(PDO $pdo, int $registrationId): ?array
{
    $stmt = $pdo->prepare("SELECT
            r.id,
            r.registered_by_user_id,
            r.payment_reference_code,
            n.username,
            n.email
        FROM event2026_registrations r
        LEFT JOIN nutzer n ON n.id = r.registered_by_user_id
        WHERE r.id = :registration_id
        LIMIT 1");
    $stmt->execute([':registration_id' => $registrationId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function event2026_fetch_addon_purchase_contact(PDO $pdo, int $addonPurchaseId): ?array
{
    $stmt = $pdo->prepare("SELECT
            id,
            buyer_name,
            buyer_email,
            buyer_user_id
        FROM event2026_addon_purchases
        WHERE id = :id
        LIMIT 1");
    $stmt->execute([':id' => $addonPurchaseId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    $name = trim((string) ($row['buyer_name'] ?? ''));
    $email = trim((string) ($row['buyer_email'] ?? ''));
    if ($email !== '') {
        return [
            'name' => $name !== '' ? $name : 'Ice-Tour Teilnehmer',
            'email' => $email,
            'user_id' => $row['buyer_user_id'] !== null ? (int) $row['buyer_user_id'] : null,
        ];
    }

    if ($row['buyer_user_id'] !== null) {
        $userStmt = $pdo->prepare("SELECT username, email FROM nutzer WHERE id = :id LIMIT 1");
        $userStmt->execute([':id' => (int) $row['buyer_user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($user && !empty($user['email'])) {
            return [
                'name' => (string) ($user['username'] ?? 'Ice-Tour Teilnehmer'),
                'email' => (string) $user['email'],
                'user_id' => (int) $row['buyer_user_id'],
            ];
        }
    }

    return null;
}

function event2026_load_gift_voucher(PDO $pdo, int $eventId, string $rawCode, bool $forUpdate = false): ?array
{
    $code = strtoupper(trim($rawCode));
    if ($code === '') {
        return null;
    }

    $lockClause = $forUpdate ? ' FOR UPDATE' : '';
    $stmt = $pdo->prepare("SELECT *
        FROM event2026_gift_vouchers
        WHERE event_id = :event_id
          AND code_hash = :code_hash
        LIMIT 1{$lockClause}");
    $stmt->execute([
        ':event_id' => $eventId,
        ':code_hash' => hash('sha256', $code),
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function event2026_gift_voucher_status(?array $voucher): array
{
    if (!$voucher) {
        return ['state' => 'invalid', 'message' => 'Gutschein-Code wurde nicht gefunden.'];
    }

    $status = (string) ($voucher['status'] ?? '');
    if ($status === 'redeemed') {
        return ['state' => 'redeemed', 'message' => 'Dieser Gutschein wurde bereits eingelöst.'];
    }
    if ($status === 'cancelled') {
        return ['state' => 'cancelled', 'message' => 'Dieser Gutschein ist nicht mehr gültig.'];
    }

    return ['state' => 'valid', 'message' => 'Gutschein ist gültig.'];
}

function event2026_create_registration_access_token(PDO $pdo, int $registrationId, int $days = 14): array
{
    $raw = bin2hex(random_bytes(24));
    $hash = hash('sha256', $raw);
    $expiresAt = (new DateTimeImmutable('now'))->modify('+' . $days . ' days')->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO event2026_registration_access_tokens (registration_id, token_hash, expires_at)
        VALUES (:registration_id, :token_hash, :expires_at)");
    $stmt->execute([
        ':registration_id' => $registrationId,
        ':token_hash' => $hash,
        ':expires_at' => $expiresAt,
    ]);

    return [
        'token' => $raw,
        'expires_at' => $expiresAt,
    ];
}

function event2026_validate_registration_access_token(PDO $pdo, int $registrationId, string $rawToken): bool
{
    if ($rawToken === '') {
        return false;
    }

    $stmt = $pdo->prepare("SELECT id
        FROM event2026_registration_access_tokens
        WHERE registration_id = :registration_id
          AND token_hash = :token_hash
          AND expires_at >= NOW()
        LIMIT 1");
    $stmt->execute([
        ':registration_id' => $registrationId,
        ':token_hash' => hash('sha256', $rawToken),
    ]);

    $tokenId = (int) ($stmt->fetchColumn() ?: 0);
    if ($tokenId <= 0) {
        return false;
    }

    $pdo->prepare("UPDATE event2026_registration_access_tokens SET used_at = NOW() WHERE id = :id")
        ->execute([':id' => $tokenId]);
    return true;
}

function event2026_get_slot_for_user(PDO $pdo, int $eventId, int $userId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM event2026_participant_slots WHERE event_id = :event_id AND user_id = :user_id LIMIT 1");
    $stmt->execute([':event_id' => $eventId, ':user_id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function event2026_log_action(PDO $pdo, int $eventId, ?int $actorUserId, string $action, ?string $targetType = null, ?int $targetId = null, ?array $meta = null): void
{
    $stmt = $pdo->prepare("INSERT INTO event2026_audit_log (event_id, actor_user_id, action, target_type, target_id, meta_json)
        VALUES (:event_id, :actor_user_id, :action, :target_type, :target_id, :meta_json)");
    $stmt->execute([
        ':event_id' => $eventId,
        ':actor_user_id' => $actorUserId,
        ':action' => $action,
        ':target_type' => $targetType,
        ':target_id' => $targetId,
        ':meta_json' => $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
    ]);
}

function event2026_recompute_waves(PDO $pdo, int $eventId, int $capacity = 20, int $womenWaveMinSize = 10): array
{
    $slotsStmt = $pdo->prepare("SELECT id, route_key, distance_km, pace_group, women_wave_opt_in
        FROM event2026_participant_slots
        WHERE event_id = :event_id AND license_status = 'licensed'
        ORDER BY distance_km ASC, route_key ASC, pace_group ASC, id ASC");
    $slotsStmt->execute([':event_id' => $eventId]);
    $slots = $slotsStmt->fetchAll(PDO::FETCH_ASSOC);

    $pdo->prepare("DELETE wa FROM event2026_wave_assignments wa
        INNER JOIN event2026_participant_slots s ON s.id = wa.slot_id
        WHERE s.event_id = :event_id")->execute([':event_id' => $eventId]);

    $pdo->prepare("DELETE FROM event2026_waves WHERE event_id = :event_id")->execute([':event_id' => $eventId]);

    if (!$slots) {
        return ['waves_created' => 0, 'assignments_created' => 0];
    }

    $groups = [];
    foreach ($slots as $slot) {
        $routeKey = event2026_normalize_route_key($slot['route_key'] ?? '');
        $distance = (int) $slot['distance_km'];
        $pace = event2026_normalize_pace_group($routeKey, (string) $slot['pace_group']);
        $supportsPace = event2026_route_supports_pace($routeKey);
        $optIn = $supportsPace && (int) $slot['women_wave_opt_in'] === 1;
        $key = $routeKey . '|' . $pace;
        if (!isset($groups[$key])) {
            $groups[$key] = ['route_key' => $routeKey, 'distance' => $distance, 'pace' => $pace, 'women' => [], 'normal' => []];
        }
        if ($optIn) {
            $groups[$key]['women'][] = $slot;
        } else {
            $groups[$key]['normal'][] = $slot;
        }
    }

    $waveInsert = $pdo->prepare("INSERT INTO event2026_waves (event_id, distance_km, wave_code, start_time, capacity, is_women_wave, pace_group)
        VALUES (:event_id, :distance_km, :wave_code, NULL, :capacity, :is_women_wave, :pace_group)");
    $assignInsert = $pdo->prepare("INSERT INTO event2026_wave_assignments (slot_id, wave_id, assigned_at) VALUES (:slot_id, :wave_id, NOW())");

    $waveCount = 0;
    $assignmentCount = 0;

    foreach ($groups as $group) {
        $routeKey = $group['route_key'];
        $distance = $group['distance'];
        $pace = $group['pace'];

        $normalPool = $group['normal'];
        $womenPool = $group['women'];

        if (count($womenPool) < $womenWaveMinSize) {
            $normalPool = array_merge($normalPool, $womenPool);
            $womenPool = [];
        }

        $buckets = [];
        if ($womenPool) {
            $buckets[] = ['is_women' => 1, 'slots' => $womenPool];
        }
        if ($normalPool) {
            $buckets[] = ['is_women' => 0, 'slots' => $normalPool];
        }

        foreach ($buckets as $bucket) {
            $chunks = array_chunk($bucket['slots'], $capacity);
            foreach ($chunks as $index => $chunk) {
                $waveCode = sprintf(
                    '%s-%s-%s-%02d',
                    strtoupper($routeKey),
                    $pace,
                    $bucket['is_women'] ? 'W' : 'M',
                    $index + 1
                );

                $waveInsert->execute([
                    ':event_id' => $eventId,
                    ':distance_km' => $distance,
                    ':wave_code' => $waveCode,
                    ':capacity' => $capacity,
                    ':is_women_wave' => $bucket['is_women'],
                    ':pace_group' => $pace,
                ]);
                $waveId = (int) $pdo->lastInsertId();
                $waveCount++;

                foreach ($chunk as $slot) {
                    $assignInsert->execute([
                        ':slot_id' => (int) $slot['id'],
                        ':wave_id' => $waveId,
                    ]);
                    $assignmentCount++;
                }
            }
        }
    }

    return ['waves_created' => $waveCount, 'assignments_created' => $assignmentCount];
}
