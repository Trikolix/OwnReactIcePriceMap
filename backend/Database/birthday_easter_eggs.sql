CREATE TABLE IF NOT EXISTS `birthday_easter_eggs` (
  `user_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `discovered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `shop_id`),
  KEY `idx_birthday_easter_eggs_discovered` (`discovered_at`),
  CONSTRAINT `birthday_easter_eggs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `birthday_easter_eggs_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
