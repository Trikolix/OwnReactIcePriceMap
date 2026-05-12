CREATE TABLE IF NOT EXISTS `summer_campaign_config` (
  `campaign_id` varchar(64) NOT NULL,
  `title` varchar(120) NOT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `summer_campaign_config` (`campaign_id`, `title`, `starts_at`, `ends_at`, `is_active`)
VALUES ('summer_2026', 'Sommer-Sammelaktion 2026', '2026-05-01 00:00:00', '2026-09-30 23:59:59', 1)
ON DUPLICATE KEY UPDATE `campaign_id` = `campaign_id`;

CREATE TABLE IF NOT EXISTS `summer_campaign_shops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` varchar(64) NOT NULL,
  `qr_code_id` bigint UNSIGNED NOT NULL,
  `eisdiele_id` int NOT NULL,
  `category` varchar(80) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `award_id` int DEFAULT NULL,
  `award_level` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_summer_campaign_qr` (`campaign_id`,`qr_code_id`),
  UNIQUE KEY `uniq_summer_campaign_shop` (`campaign_id`,`eisdiele_id`),
  KEY `idx_summer_campaign_active` (`campaign_id`,`is_active`,`sort_order`),
  KEY `idx_summer_campaign_award` (`award_id`,`award_level`),
  KEY `fk_summer_campaign_shop_qr` (`qr_code_id`),
  KEY `fk_summer_campaign_shop_eisdiele` (`eisdiele_id`),
  CONSTRAINT `fk_summer_campaign_shop_qr` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_summer_campaign_shop_eisdiele` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `summer_campaign_bonus_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` varchar(64) NOT NULL,
  `rule_type` enum('scan_count','checkin_count','category_complete') NOT NULL,
  `target_value` int DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `award_id` int NOT NULL,
  `award_level` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_summer_bonus_rule` (`campaign_id`,`rule_type`,`target_value`,`category`,`award_id`,`award_level`),
  KEY `idx_summer_bonus_campaign` (`campaign_id`,`is_active`),
  KEY `fk_summer_bonus_award_level` (`award_id`,`award_level`),
  CONSTRAINT `fk_summer_bonus_award_level` FOREIGN KEY (`award_id`, `award_level`) REFERENCES `award_levels` (`award_id`, `level`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
