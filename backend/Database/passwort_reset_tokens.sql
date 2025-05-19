CREATE TABLE `passwort_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nutzer_id` INT NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer`(`id`) ON DELETE CASCADE,
  UNIQUE (`token`)
);