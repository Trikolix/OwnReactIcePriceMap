-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 09. Nov 2025 um 14:15
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
-- Datenbank: `db_439770_3`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `photo_challenge_group_entries`
--

CREATE TABLE `photo_challenge_group_entries` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `group_id` int NOT NULL,
  `image_id` int NOT NULL,
  `seed` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_group_entries`
--

INSERT INTO `photo_challenge_group_entries` (`id`, `challenge_id`, `group_id`, `image_id`, `seed`, `created_at`) VALUES
(29, 1, 8, 756, 1, '2025-11-09 10:29:39'),
(30, 1, 8, 652, 2, '2025-11-09 10:29:39'),
(31, 1, 8, 752, 3, '2025-11-09 10:29:39'),
(32, 1, 8, 673, 4, '2025-11-09 10:29:39'),
(33, 1, 9, 468, 1, '2025-11-09 10:29:39'),
(34, 1, 9, 633, 2, '2025-11-09 10:29:39'),
(35, 1, 9, 764, 3, '2025-11-09 10:29:39'),
(36, 1, 9, 691, 4, '2025-11-09 10:29:39'),
(37, 1, 10, 620, 1, '2025-11-09 10:29:39'),
(38, 1, 10, 725, 2, '2025-11-09 10:29:39'),
(39, 1, 10, 736, 3, '2025-11-09 10:29:39'),
(40, 1, 10, 595, 4, '2025-11-09 10:29:39'),
(41, 1, 11, 732, 1, '2025-11-09 10:29:39'),
(42, 1, 11, 632, 2, '2025-11-09 10:29:39'),
(43, 1, 11, 717, 3, '2025-11-09 10:29:39'),
(44, 1, 11, 462, 4, '2025-11-09 10:29:39'),
(45, 1, 12, 757, 1, '2025-11-09 10:29:39'),
(46, 1, 12, 657, 2, '2025-11-09 10:29:39'),
(47, 1, 12, 753, 3, '2025-11-09 10:29:39'),
(48, 1, 12, 693, 4, '2025-11-09 10:29:39'),
(49, 1, 13, 762, 1, '2025-11-09 10:29:39'),
(50, 1, 13, 569, 2, '2025-11-09 10:29:39'),
(51, 1, 13, 759, 3, '2025-11-09 10:29:39'),
(52, 1, 13, 749, 4, '2025-11-09 10:29:39'),
(53, 1, 14, 597, 1, '2025-11-09 10:29:39'),
(54, 1, 14, 651, 2, '2025-11-09 10:29:39'),
(55, 1, 14, 630, 3, '2025-11-09 10:29:39'),
(56, 1, 14, 608, 4, '2025-11-09 10:29:39');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_group_entries`
--
ALTER TABLE `photo_challenge_group_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_group_image` (`group_id`,`image_id`),
  ADD KEY `fk_group_entry_image` (`image_id`),
  ADD KEY `fk_group_entry_challenge` (`challenge_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_group_entries`
--
ALTER TABLE `photo_challenge_group_entries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_group_entries`
--
ALTER TABLE `photo_challenge_group_entries`
  ADD CONSTRAINT `fk_group_entry_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_group_entry_group` FOREIGN KEY (`group_id`) REFERENCES `photo_challenge_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_group_entry_image` FOREIGN KEY (`image_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
