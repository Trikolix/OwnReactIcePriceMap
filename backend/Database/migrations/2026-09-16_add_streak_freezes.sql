-- launched_at is UTC; no MySQL timezone tables are required.
-- Apply before deploying streak-aware PHP. Existing DATETIME values use Berlin wall time.
CREATE TABLE IF NOT EXISTS streak_config (
 id TINYINT PRIMARY KEY, launched_at DATETIME NOT NULL
) ENGINE=InnoDB;
INSERT IGNORE INTO streak_config VALUES (1, UTC_TIMESTAMP());
CREATE TABLE IF NOT EXISTS streak_wallets (
 user_id INT NOT NULL, type ENUM('day','week') NOT NULL,
 balance TINYINT UNSIGNED NOT NULL DEFAULT 0, cursor_period DATE NOT NULL,
 PRIMARY KEY(user_id,type)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS streak_ledger (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL, type ENUM('day','week') NOT NULL,
 kind ENUM('consume','grant','qualify') NOT NULL, period DATE NOT NULL,
 event_key VARCHAR(100) NOT NULL, amount TINYINT NOT NULL, created_at DATETIME NOT NULL,
 UNIQUE KEY streak_event(user_id,type,event_key), KEY streak_history(user_id,type,period)
) ENGINE=InnoDB;
UPDATE award_levels SET description_de = CONCAT(description_de, ' Geschützte Pausen erhalten die Serie, zählen aber nicht als Check-in-Tag bzw. -Woche.')
WHERE award_id IN (11,36) AND description_de NOT LIKE '%Geschützte Pausen%';
