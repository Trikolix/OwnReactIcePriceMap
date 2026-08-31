-- Introduce public ice-place types and allow check-ins without a public place.

ALTER TABLE `eisdielen`
  ADD COLUMN `place_type` enum('ice_shop','restaurant','temporary_stand')
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ice_shop'
    AFTER `closing_date`,
  ADD COLUMN `active_until` datetime DEFAULT NULL AFTER `place_type`,
  ADD COLUMN `closed_early_at` datetime DEFAULT NULL AFTER `active_until`,
  ADD KEY `idx_eisdielen_place_visibility` (`place_type`, `active_until`, `closed_early_at`);

ALTER TABLE `checkins`
  MODIFY `eisdiele_id` int DEFAULT NULL,
  ADD COLUMN `context_type` enum('ice_shop','restaurant','temporary_stand','no_public_place')
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ice_shop'
    AFTER `eisdiele_id`,
  ADD KEY `idx_checkins_context_type` (`context_type`);

CREATE TABLE `place_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `place_id` int NOT NULL,
  `reporter_user_id` int NOT NULL,
  `reason` enum('not_there','already_closed','wrong_details','other')
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('open','resolved','dismissed')
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_place_reports_place_status` (`place_id`, `status`),
  KEY `idx_place_reports_reporter` (`reporter_user_id`),
  CONSTRAINT `fk_place_reports_place` FOREIGN KEY (`place_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_place_reports_reporter` FOREIGN KEY (`reporter_user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
