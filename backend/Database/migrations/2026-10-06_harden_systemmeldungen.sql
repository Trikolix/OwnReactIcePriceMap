-- Apply before deploying the new API and worker. Re-runnable on old and current schemas.
-- Existing messages remain published. No notifications or jobs are created by this migration.
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='link_url')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `link_url` ', 'VARCHAR(255) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='link_label')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `link_label` ', 'VARCHAR(100) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='email_subject')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `email_subject` ', 'VARCHAR(180) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='email_heading')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `email_heading` ', 'VARCHAR(180) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='email_body')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `email_body` ', 'MEDIUMTEXT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='email_buttons')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `email_buttons` ', 'TEXT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='state')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `state` ', "VARCHAR(16) NOT NULL DEFAULT 'published'"), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='options_json')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `options_json` ', 'TEXT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='created_by')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `created_by` ', 'INT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='published_at')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `published_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='withdrawn_at')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `withdrawn_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='request_key')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `request_key` ', 'VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='request_hash')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `request_hash` ', 'CHAR(64) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldungen' AND column_name='publish_result')=0,
  CONCAT('ALTER TABLE `systemmeldungen` ADD COLUMN `publish_result` ', 'TEXT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
UPDATE systemmeldungen SET published_at = erstellt_am WHERE state = 'published' AND published_at IS NULL;
CREATE TABLE IF NOT EXISTS systemmeldung_requests (
  request_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  systemmeldung_id INT NOT NULL,
  request_hash CHAR(64) NOT NULL,
  result_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS systemmeldung_mail_queue (
  id INT AUTO_INCREMENT PRIMARY KEY, systemmeldung_id INT NOT NULL, user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL, subject VARCHAR(180) NOT NULL, heading VARCHAR(180) NOT NULL,
  body MEDIUMTEXT NOT NULL, buttons_json TEXT NULL, include_settings_hint TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(16) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0, last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, sent_at DATETIME NULL,
  UNIQUE KEY uniq_system_mail_recipient (systemmeldung_id,user_id,email),
  KEY idx_system_mail_queue_status (status,attempts,created_at), KEY idx_system_mail_queue_systemmeldung (systemmeldung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE systemmeldung_mail_queue MODIFY status VARCHAR(16) NOT NULL DEFAULT 'pending';
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldung_mail_queue' AND column_name='mail_mode')=0,
  CONCAT('ALTER TABLE `systemmeldung_mail_queue` ADD COLUMN `mail_mode` ', "VARCHAR(16) NOT NULL DEFAULT 'subscribers'"), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldung_mail_queue' AND column_name='next_attempt_at')=0,
  CONCAT('ALTER TABLE `systemmeldung_mail_queue` ADD COLUMN `next_attempt_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldung_mail_queue' AND column_name='lease_token')=0,
  CONCAT('ALTER TABLE `systemmeldung_mail_queue` ADD COLUMN `lease_token` ', 'CHAR(32) NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='systemmeldung_mail_queue' AND column_name='lease_until')=0,
  CONCAT('ALTER TABLE `systemmeldung_mail_queue` ADD COLUMN `lease_until` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
UPDATE systemmeldung_mail_queue SET mail_mode = 'all' WHERE include_settings_hint = 0;
-- A legacy worker may have handed these jobs to the transport before it stopped.
UPDATE systemmeldung_mail_queue SET status = 'uncertain', last_error = 'Legacy sending job: delivery outcome unknown' WHERE status = 'sending';
UPDATE systemmeldung_mail_queue SET status = 'retry' WHERE status = 'failed' AND attempts < 3;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='benachrichtigungen' AND column_name='ausgeblendet_am')=0,
  CONCAT('ALTER TABLE `benachrichtigungen` ADD COLUMN `ausgeblendet_am` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='user_notification_settings' AND column_name='notify_news_push')=0,
  CONCAT('ALTER TABLE `user_notification_settings` ADD COLUMN `notify_news_push` ', 'TINYINT(1) DEFAULT 1'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='user_notification_settings' AND column_name='push_enabled_web')=0,
  CONCAT('ALTER TABLE `user_notification_settings` ADD COLUMN `push_enabled_web` ', 'TINYINT(1) DEFAULT 0'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='user_notification_settings' AND column_name='push_enabled_android')=0,
  CONCAT('ALTER TABLE `user_notification_settings` ADD COLUMN `push_enabled_android` ', 'TINYINT(1) DEFAULT 0'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            endpoint TEXT NOT NULL,
            endpoint_hash CHAR(64) NOT NULL,
            p256dh VARCHAR(255) NOT NULL,
            auth VARCHAR(255) NOT NULL,
            subscription_token VARCHAR(64) NOT NULL,
            user_agent VARCHAR(255) NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_success_at DATETIME NULL DEFAULT NULL,
            last_failure_at DATETIME NULL DEFAULT NULL,
            invalidated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_web_push_endpoint_hash (endpoint_hash),
            UNIQUE KEY uniq_web_push_subscription_token (subscription_token),
            KEY idx_web_push_user (user_id, invalidated_at),
            CONSTRAINT fk_web_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS mobile_push_devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            platform VARCHAR(32) NOT NULL,
            provider VARCHAR(32) NOT NULL,
            device_token VARCHAR(255) NOT NULL,
            token_hash CHAR(64) NOT NULL,
            app_version VARCHAR(64) NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_success_at DATETIME NULL DEFAULT NULL,
            last_failure_at DATETIME NULL DEFAULT NULL,
            invalidated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_mobile_push_token_hash (token_hash),
            KEY idx_mobile_push_user (user_id, invalidated_at),
            CONSTRAINT fk_mobile_push_devices_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS push_notification_deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            notification_id INT NOT NULL,
            user_id INT NOT NULL,
            channel VARCHAR(16) NOT NULL,
            target_id INT NULL DEFAULT NULL,
            subscription_token VARCHAR(64) NULL DEFAULT NULL,
            payload_json LONGTEXT NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'pending',
            provider_status_code INT NULL DEFAULT NULL,
            provider_response TEXT NULL DEFAULT NULL,
            signal_sent_at DATETIME NULL DEFAULT NULL,
            pulled_at DATETIME NULL DEFAULT NULL,
            shown_at DATETIME NULL DEFAULT NULL,
            clicked_at DATETIME NULL DEFAULT NULL,
            failure_at DATETIME NULL DEFAULT NULL,
            attempt_count INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivered_at DATETIME NULL DEFAULT NULL,
            last_error TEXT NULL DEFAULT NULL,
            KEY idx_push_deliveries_pending (channel, subscription_token, status, created_at),
            KEY idx_push_deliveries_notification (notification_id),
            CONSTRAINT fk_push_deliveries_notification FOREIGN KEY (notification_id) REFERENCES benachrichtigungen(id) ON DELETE CASCADE,
            CONSTRAINT fk_push_deliveries_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='provider_status_code')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `provider_status_code` ', 'INT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='provider_response')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `provider_response` ', 'TEXT NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='signal_sent_at')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `signal_sent_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='pulled_at')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `pulled_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='shown_at')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `shown_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='clicked_at')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `clicked_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='failure_at')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `failure_at` ', 'DATETIME NULL'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='push_notification_deliveries' AND column_name='attempt_count')=0,
  CONCAT('ALTER TABLE `push_notification_deliveries` ADD COLUMN `attempt_count` ', 'INT NOT NULL DEFAULT 0'), 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
CREATE TABLE IF NOT EXISTS systemmeldung_push_queue (
  id INT AUTO_INCREMENT PRIMARY KEY, systemmeldung_id INT NOT NULL, notification_id INT NOT NULL,
  user_id INT NOT NULL, channel VARCHAR(16) NOT NULL, target_id INT NOT NULL, delivery_id INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NULL, lease_token CHAR(32) NULL, lease_until DATETIME NULL, last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, sent_at DATETIME NULL,
  UNIQUE KEY uniq_system_push_target (notification_id,channel,target_id),
  KEY idx_system_push_work (status,next_attempt_at), KEY idx_system_push_message (systemmeldung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS systemmeldung_audit (
  id INT AUTO_INCREMENT PRIMARY KEY, systemmeldung_id INT NOT NULL, actor_id INT NOT NULL,
  action VARCHAR(32) NOT NULL, details_json MEDIUMTEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_system_audit_message (systemmeldung_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE systemmeldung_audit MODIFY details_json MEDIUMTEXT NULL;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='benachrichtigungen' AND index_name='idx_notification_visible_id')=0,
  'CREATE INDEX idx_notification_visible_id ON benachrichtigungen (empfaenger_id,ausgeblendet_am,id)', 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='benachrichtigungen' AND index_name='idx_notification_unread')=0,
  'CREATE INDEX idx_notification_unread ON benachrichtigungen (empfaenger_id,ausgeblendet_am,ist_gelesen)', 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
SET @system_ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='systemmeldung_mail_queue' AND index_name='idx_system_mail_work')=0,
  'CREATE INDEX idx_system_mail_work ON systemmeldung_mail_queue (status,next_attempt_at,id)', 'SELECT 1');
PREPARE system_stmt FROM @system_ddl;
EXECUTE system_stmt;
DEALLOCATE PREPARE system_stmt;
