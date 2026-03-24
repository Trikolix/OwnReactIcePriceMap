CREATE TABLE IF NOT EXISTS `seasonal_campaign_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` varchar(64) NOT NULL,
  `user_id` int DEFAULT NULL,
  `username_snapshot` varchar(255) NOT NULL,
  `rank_position` int NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `payload_json` longtext DEFAULT NULL,
  `finalized_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_seasonal_campaign_user` (`campaign_id`,`user_id`),
  KEY `idx_seasonal_campaign_rank` (`campaign_id`,`rank_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
