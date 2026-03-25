-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 20. Mrz 2026 um 06:46
-- Server-Version: 8.0.44
-- PHP-Version: 8.4.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `k320202_iceapp`
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
(29, 3, 8, 102, 1, '2026-03-14 11:36:41'),
(30, 3, 8, 448, 2, '2026-03-14 11:36:41'),
(31, 3, 8, 764, 3, '2026-03-14 11:36:41'),
(32, 3, 8, 882, 4, '2026-03-14 11:36:41'),
(33, 3, 9, 925, 1, '2026-03-14 11:36:41'),
(34, 3, 9, 976, 2, '2026-03-14 11:36:41'),
(35, 3, 9, 690, 3, '2026-03-14 11:36:41'),
(36, 3, 9, 759, 4, '2026-03-14 11:36:41'),
(37, 3, 10, 146, 1, '2026-03-14 11:36:41'),
(38, 3, 10, 677, 2, '2026-03-14 11:36:41'),
(39, 3, 10, 593, 3, '2026-03-14 11:36:41'),
(40, 3, 10, 466, 4, '2026-03-14 11:36:41'),
(41, 3, 11, 883, 1, '2026-03-14 11:36:41'),
(42, 3, 11, 430, 2, '2026-03-14 11:36:41'),
(43, 3, 11, 474, 3, '2026-03-14 11:36:41'),
(44, 3, 11, 816, 4, '2026-03-14 11:36:41'),
(45, 3, 12, 427, 1, '2026-03-14 11:36:41'),
(46, 3, 12, 964, 2, '2026-03-14 11:36:41'),
(47, 3, 12, 543, 3, '2026-03-14 11:36:41'),
(48, 3, 12, 947, 4, '2026-03-14 11:36:41'),
(49, 3, 13, 638, 1, '2026-03-14 11:36:41'),
(50, 3, 13, 768, 2, '2026-03-14 11:36:41'),
(51, 3, 13, 880, 3, '2026-03-14 11:36:41'),
(52, 3, 13, 718, 4, '2026-03-14 11:36:41'),
(53, 3, 14, 810, 1, '2026-03-14 11:36:41'),
(54, 3, 14, 632, 2, '2026-03-14 11:36:41'),
(55, 3, 14, 337, 3, '2026-03-14 11:36:41'),
(56, 3, 14, 429, 4, '2026-03-14 11:36:41'),
(57, 3, 15, 315, 1, '2026-03-14 11:36:41'),
(58, 3, 15, 832, 2, '2026-03-14 11:36:41'),
(59, 3, 15, 913, 3, '2026-03-14 11:36:41'),
(60, 3, 15, 445, 4, '2026-03-14 11:36:41'),
(61, 3, 16, 874, 1, '2026-03-14 11:36:41'),
(62, 3, 16, 924, 2, '2026-03-14 11:36:41'),
(63, 3, 16, 71, 3, '2026-03-14 11:36:41'),
(64, 3, 16, 58, 4, '2026-03-14 11:36:41'),
(65, 3, 17, 852, 1, '2026-03-14 11:36:41'),
(66, 3, 17, 938, 2, '2026-03-14 11:36:41'),
(67, 3, 17, 411, 3, '2026-03-14 11:36:41'),
(68, 3, 17, 440, 4, '2026-03-14 11:36:41');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

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
