-- Event 2026 schema migration

CREATE TABLE IF NOT EXISTS event2026_seasons (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_legal_versions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    version VARCHAR(32) NOT NULL,
    content_md TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_legal_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event2026_legal_version (event_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_registrations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    registered_by_user_id INT DEFAULT NULL,
    team_name VARCHAR(255) DEFAULT NULL,
    payment_reference_code VARCHAR(64) NOT NULL,
    payment_status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_reg_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event2026_payment_ref (payment_reference_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_participant_slots (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    event_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    distance_km INT NOT NULL,
    pace_group VARCHAR(32) NOT NULL,
    women_wave_opt_in TINYINT(1) NOT NULL DEFAULT 0,
    public_name_consent TINYINT(1) NOT NULL DEFAULT 1,
    jersey_interest TINYINT(1) NOT NULL DEFAULT 0,
    jersey_size VARCHAR(10) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_invite_tokens (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    slot_id INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME NOT NULL,
    claimed_at DATETIME DEFAULT NULL,
    revoked_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_invite_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event2026_invite_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_payments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    method ENUM('paypal_friends','bank_transfer') NOT NULL DEFAULT 'paypal_friends',
    expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('pending','partially_paid','paid','cancelled') NOT NULL DEFAULT 'pending',
    confirmed_by_admin INT DEFAULT NULL,
    confirmed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_payment_reg FOREIGN KEY (registration_id) REFERENCES event2026_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_payment_mail_matches (
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
    UNIQUE KEY uniq_event2026_mail_message (mail_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_waves (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_wave_assignments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    slot_id INT NOT NULL,
    wave_id INT NOT NULL,
    assigned_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_wave_assign_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
    CONSTRAINT fk_event2026_wave_assign_wave FOREIGN KEY (wave_id) REFERENCES event2026_waves(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event2026_wave_slot (slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_checkpoints (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    shop_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_checkpoint_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_checkpoint_passages (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    checkpoint_id INT NOT NULL,
    slot_id INT NOT NULL,
    user_id INT NOT NULL,
    passed_at DATETIME NOT NULL,
    source ENUM('qr','onsite_form') NOT NULL,
    checkin_id INT DEFAULT NULL,
    qr_payload VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_passage_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE,
    CONSTRAINT fk_event2026_passage_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES event2026_checkpoints(id) ON DELETE CASCADE,
    CONSTRAINT fk_event2026_passage_slot FOREIGN KEY (slot_id) REFERENCES event2026_participant_slots(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event2026_passage (event_id, checkpoint_id, slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event2026_audit_log (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    actor_user_id INT DEFAULT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) DEFAULT NULL,
    target_id INT DEFAULT NULL,
    meta_json JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event2026_audit_event FOREIGN KEY (event_id) REFERENCES event2026_seasons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO event2026_seasons (slug, name, event_date, status, max_participants, min_participants_for_go, cancellation_deadline)
SELECT 'event-2026', 'Eis-Tour 2026', '2026-05-16', 'open', 150, 60, '2026-05-01 23:59:59'
WHERE NOT EXISTS (SELECT 1 FROM event2026_seasons WHERE slug = 'event-2026');
