CREATE TABLE IF NOT EXISTS `birthday_event_page_visits` (
  `user_id` int NOT NULL,
  `first_visited_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `birthday_event_page_visits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
