-- Additive, repeatable pilot migration. No automatic enrolment or stamp grants.
CREATE TABLE IF NOT EXISTS shop_operator_claims (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 shop_id INT NOT NULL, user_id INT NOT NULL,
 contact VARCHAR(300) NOT NULL, reason TEXT NOT NULL,
 state VARCHAR(20) NOT NULL DEFAULT 'pending', review_note VARCHAR(1000) NULL,
 reviewed_by INT NULL, reviewed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY claim_user_shop (shop_id,user_id), KEY claims_state (state,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS shop_operator_members (
 shop_id INT NOT NULL, user_id INT NOT NULL,
 role VARCHAR(20) NOT NULL, state VARCHAR(20) NOT NULL,
 invited_by INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (shop_id,user_id), KEY members_user (user_id,state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS loyalty_programs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, shop_id INT NOT NULL,
 unit VARCHAR(20) NOT NULL, stamp_target INT NOT NULL,
 reward VARCHAR(300) NOT NULL, state VARCHAR(20) NOT NULL DEFAULT 'active',
 created_by INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 ended_at DATETIME NULL, KEY programs_shop (shop_id,state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS loyalty_cards (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 program_id BIGINT UNSIGNED NOT NULL, user_id INT NOT NULL,
 total_units INT NOT NULL DEFAULT 0, redeemed_rewards INT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY card_program_user (program_id,user_id), KEY cards_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS loyalty_codes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, card_id BIGINT UNSIGNED NOT NULL,
 purpose VARCHAR(20) NOT NULL, token_hash CHAR(64) NOT NULL,
 manual_hash CHAR(64) NOT NULL, expires_at DATETIME NOT NULL,
 consumed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY code_token (token_hash), UNIQUE KEY code_manual (manual_hash),
 KEY codes_card (card_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS loyalty_ledger (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, shop_id INT NOT NULL,
 card_id BIGINT UNSIGNED NOT NULL, actor_id INT NOT NULL,
 kind VARCHAR(20) NOT NULL, units INT NOT NULL DEFAULT 0,
 reward_delta INT NOT NULL DEFAULT 0, reversal_of BIGINT UNSIGNED NULL,
 request_key VARCHAR(80) NOT NULL, request_hash CHAR(64) NOT NULL,
 result_json MEDIUMTEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY ledger_request (request_key), UNIQUE KEY ledger_reversal (reversal_of),
 KEY ledger_card (card_id,id), KEY ledger_shop (shop_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS shop_operator_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, shop_id INT NOT NULL,
 actor_id INT NOT NULL, action VARCHAR(40) NOT NULL, details_json TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY audit_shop (shop_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS loyalty_rate_limits (
 user_id INT NOT NULL, action VARCHAR(30) NOT NULL, bucket BIGINT NOT NULL,
 attempts INT NOT NULL DEFAULT 1, PRIMARY KEY (user_id,action,bucket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
