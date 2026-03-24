CREATE TABLE IF NOT EXISTS `easter_bunny_progress` (
  `user_id` int NOT NULL,
  `path_json` longtext DEFAULT NULL,
  `current_index` int NOT NULL DEFAULT '0',
  `total_hops` int NOT NULL DEFAULT '5',
  `daily_hint_claims` int NOT NULL DEFAULT '0',
  `last_hint_claimed_on` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_easter_bunny_progress_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
