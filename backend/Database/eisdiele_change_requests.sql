CREATE TABLE IF NOT EXISTS `eisdiele_change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eisdiele_id` int NOT NULL,
  `requested_by` int NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decided_at` timestamp NULL DEFAULT NULL,
  `decided_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eisdiele_change_requests_eisdiele` (`eisdiele_id`),
  KEY `idx_eisdiele_change_requests_user` (`requested_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
