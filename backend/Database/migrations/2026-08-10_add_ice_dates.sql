-- Ice-Dates: private planning, shareable invitation links and date check-ins.
-- The runtime schema helper in backend/lib/ice_dates.php is intentionally idempotent
-- for installations that deploy PHP files before running migrations.

CREATE TABLE IF NOT EXISTS ice_dates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  creator_user_id INT NOT NULL,
  shop_id INT NOT NULL,
  title VARCHAR(120) NULL,
  note TEXT NULL,
  starts_at DATETIME NOT NULL,
  status ENUM('planned', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  invite_token CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_ice_dates_invite_token (invite_token),
  KEY idx_ice_dates_creator_status (creator_user_id, status, starts_at),
  KEY idx_ice_dates_shop_time (shop_id, starts_at),
  CONSTRAINT fk_ice_dates_creator FOREIGN KEY (creator_user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
  CONSTRAINT fk_ice_dates_shop FOREIGN KEY (shop_id) REFERENCES eisdielen(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS ice_date_participants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_id INT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  role ENUM('organizer', 'participant') NOT NULL DEFAULT 'participant',
  status ENUM('invited', 'going', 'maybe', 'declined') NOT NULL DEFAULT 'invited',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_ice_date_participant (date_id, user_id),
  KEY idx_ice_date_participants_user (user_id, status),
  CONSTRAINT fk_ice_date_participants_date FOREIGN KEY (date_id) REFERENCES ice_dates(id) ON DELETE CASCADE,
  CONSTRAINT fk_ice_date_participants_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS ice_date_checkins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_id INT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  checkin_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_ice_date_checkin_user (date_id, user_id),
  UNIQUE KEY uniq_ice_date_checkin (date_id, checkin_id),
  KEY idx_ice_date_checkins_date (date_id),
  CONSTRAINT fk_ice_date_checkins_date FOREIGN KEY (date_id) REFERENCES ice_dates(id) ON DELETE CASCADE,
  CONSTRAINT fk_ice_date_checkins_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE,
  CONSTRAINT fk_ice_date_checkins_checkin FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE user_notification_settings
  ADD COLUMN IF NOT EXISTS notify_ice_date TINYINT(1) NOT NULL DEFAULT 1 AFTER notify_team_challenge,
  ADD COLUMN IF NOT EXISTS notify_ice_date_push TINYINT(1) NOT NULL DEFAULT 1 AFTER notify_ice_date;
