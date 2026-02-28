CREATE TABLE IF NOT EXISTS `birthday_user_progress` (
  `user_id` int NOT NULL,
  `total_xp` int NOT NULL DEFAULT '0',
  `login_days` int NOT NULL DEFAULT '0',
  `last_login_date` date DEFAULT NULL,
  `mandatory_completed` int NOT NULL DEFAULT '0',
  `bonus_completed` int NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `birthday_user_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
