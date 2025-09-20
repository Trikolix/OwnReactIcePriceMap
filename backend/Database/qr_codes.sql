-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:23
-- Server-Version: 8.0.39-30
-- PHP-Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `db_439770_2`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `qr_codes`
--

CREATE TABLE `qr_codes` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `award_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `icon_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `usage_limit` int DEFAULT '0',
  `eisdiele_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `qr_codes`
--

INSERT INTO `qr_codes` (`id`, `name`, `code`, `description`, `created_at`, `valid_from`, `valid_until`, `award_type`, `icon_path`, `usage_limit`, `eisdiele_id`) VALUES
(1, 'One More Loop', '01b6e70282', 'Du hast den limitierten One More Loop Award gescannt. Besuche bis zum 10. August eine Eisdiele per Rad (optimal natürlich direkt während des Brevet) und checke einen Besuch ein um den Award zu bekommen.', '2025-07-23 03:12:05', NULL, '2025-08-10 21:59:59', NULL, 'uploads/award_icons/688132889a1fe_OneMoreLoop_clouds.png', 0, NULL),
(2, '', 'bc62c41da6cb1882c583d7a205b13a81', NULL, '2025-08-07 10:48:07', NULL, NULL, NULL, '', 0, 14),
(3, '', 'dc07a0d0eb520be1c4db0c23f279f1ab', NULL, '2025-08-07 10:51:36', NULL, NULL, NULL, '', 0, 106),
(4, '', '1877c33007c9f938e513882884f5db46', NULL, '2025-08-07 10:51:39', NULL, NULL, NULL, '', 0, 314),
(5, 'EPR2025', '41e69b3e8f6232f17e5ce35f7c08e77a', 'Du hast den limitierten EPR2025 Award gescannt. Besuche bis zum 21. September eine Eisdiele per Rad und checke einen Besuch ein um den Award zu bekommen.', '2025-08-28 07:17:58', NULL, '2025-09-21 21:59:59', NULL, 'uploads/award_icons/68b001c6bf26f_EPR_2025_cloud.png', 0, NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_qr_codes_eisdiele` (`eisdiele_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `fk_qr_codes_eisdiele` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
