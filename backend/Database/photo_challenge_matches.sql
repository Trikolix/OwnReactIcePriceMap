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
-- Tabellenstruktur für Tabelle `photo_challenge_matches`
--

CREATE TABLE `photo_challenge_matches` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `phase` enum('group','ko') COLLATE utf8mb4_general_ci NOT NULL,
  `round` int NOT NULL DEFAULT '1',
  `group_id` int DEFAULT NULL,
  `position` int NOT NULL,
  `image_a_id` int NOT NULL,
  `image_b_id` int NOT NULL,
  `winner_image_id` int DEFAULT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `locked_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_matches`
--

INSERT INTO `photo_challenge_matches` (`id`, `challenge_id`, `phase`, `round`, `group_id`, `position`, `image_a_id`, `image_b_id`, `winner_image_id`, `status`, `created_at`, `locked_at`) VALUES
(43, 1, 'group', 1, 8, 1, 756, 652, NULL, 'open', '2025-11-09 10:29:39', NULL),
(44, 1, 'group', 1, 8, 2, 756, 752, NULL, 'open', '2025-11-09 10:29:39', NULL),
(45, 1, 'group', 1, 8, 3, 756, 673, NULL, 'open', '2025-11-09 10:29:39', NULL),
(46, 1, 'group', 1, 8, 4, 652, 752, NULL, 'open', '2025-11-09 10:29:39', NULL),
(47, 1, 'group', 1, 8, 5, 652, 673, NULL, 'open', '2025-11-09 10:29:39', NULL),
(48, 1, 'group', 1, 8, 6, 752, 673, NULL, 'open', '2025-11-09 10:29:39', NULL),
(49, 1, 'group', 1, 9, 7, 468, 633, NULL, 'open', '2025-11-09 10:29:39', NULL),
(50, 1, 'group', 1, 9, 8, 468, 764, NULL, 'open', '2025-11-09 10:29:39', NULL),
(51, 1, 'group', 1, 9, 9, 468, 691, NULL, 'open', '2025-11-09 10:29:39', NULL),
(52, 1, 'group', 1, 9, 10, 633, 764, NULL, 'open', '2025-11-09 10:29:39', NULL),
(53, 1, 'group', 1, 9, 11, 633, 691, NULL, 'open', '2025-11-09 10:29:39', NULL),
(54, 1, 'group', 1, 9, 12, 764, 691, NULL, 'open', '2025-11-09 10:29:39', NULL),
(55, 1, 'group', 1, 10, 13, 620, 725, NULL, 'open', '2025-11-09 10:29:39', NULL),
(56, 1, 'group', 1, 10, 14, 620, 736, NULL, 'open', '2025-11-09 10:29:39', NULL),
(57, 1, 'group', 1, 10, 15, 620, 595, NULL, 'open', '2025-11-09 10:29:39', NULL),
(58, 1, 'group', 1, 10, 16, 725, 736, NULL, 'open', '2025-11-09 10:29:39', NULL),
(59, 1, 'group', 1, 10, 17, 725, 595, NULL, 'open', '2025-11-09 10:29:39', NULL),
(60, 1, 'group', 1, 10, 18, 736, 595, NULL, 'open', '2025-11-09 10:29:39', NULL),
(61, 1, 'group', 1, 11, 19, 732, 632, NULL, 'open', '2025-11-09 10:29:39', NULL),
(62, 1, 'group', 1, 11, 20, 732, 717, NULL, 'open', '2025-11-09 10:29:39', NULL),
(63, 1, 'group', 1, 11, 21, 732, 462, NULL, 'open', '2025-11-09 10:29:39', NULL),
(64, 1, 'group', 1, 11, 22, 632, 717, NULL, 'open', '2025-11-09 10:29:39', NULL),
(65, 1, 'group', 1, 11, 23, 632, 462, NULL, 'open', '2025-11-09 10:29:39', NULL),
(66, 1, 'group', 1, 11, 24, 717, 462, NULL, 'open', '2025-11-09 10:29:39', NULL),
(67, 1, 'group', 1, 12, 25, 757, 657, NULL, 'open', '2025-11-09 10:29:39', NULL),
(68, 1, 'group', 1, 12, 26, 757, 753, NULL, 'open', '2025-11-09 10:29:39', NULL),
(69, 1, 'group', 1, 12, 27, 757, 693, NULL, 'open', '2025-11-09 10:29:39', NULL),
(70, 1, 'group', 1, 12, 28, 657, 753, NULL, 'open', '2025-11-09 10:29:39', NULL),
(71, 1, 'group', 1, 12, 29, 657, 693, NULL, 'open', '2025-11-09 10:29:39', NULL),
(72, 1, 'group', 1, 12, 30, 753, 693, NULL, 'open', '2025-11-09 10:29:39', NULL),
(73, 1, 'group', 1, 13, 31, 762, 569, NULL, 'open', '2025-11-09 10:29:39', NULL),
(74, 1, 'group', 1, 13, 32, 762, 759, NULL, 'open', '2025-11-09 10:29:39', NULL),
(75, 1, 'group', 1, 13, 33, 762, 749, NULL, 'open', '2025-11-09 10:29:39', NULL),
(76, 1, 'group', 1, 13, 34, 569, 759, NULL, 'open', '2025-11-09 10:29:39', NULL),
(77, 1, 'group', 1, 13, 35, 569, 749, NULL, 'open', '2025-11-09 10:29:39', NULL),
(78, 1, 'group', 1, 13, 36, 759, 749, NULL, 'open', '2025-11-09 10:29:39', NULL),
(79, 1, 'group', 1, 14, 37, 597, 651, NULL, 'open', '2025-11-09 10:29:39', NULL),
(80, 1, 'group', 1, 14, 38, 597, 630, NULL, 'open', '2025-11-09 10:29:39', NULL),
(81, 1, 'group', 1, 14, 39, 597, 608, NULL, 'open', '2025-11-09 10:29:39', NULL),
(82, 1, 'group', 1, 14, 40, 651, 630, NULL, 'open', '2025-11-09 10:29:39', NULL),
(83, 1, 'group', 1, 14, 41, 651, 608, NULL, 'open', '2025-11-09 10:29:39', NULL),
(84, 1, 'group', 1, 14, 42, 630, 608, NULL, 'open', '2025-11-09 10:29:39', NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_matches`
--
ALTER TABLE `photo_challenge_matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_match_position` (`challenge_id`,`phase`,`round`,`position`),
  ADD KEY `fk_match_group` (`group_id`),
  ADD KEY `fk_match_image_a` (`image_a_id`),
  ADD KEY `fk_match_image_b` (`image_b_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_matches`
--
ALTER TABLE `photo_challenge_matches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_matches`
--
ALTER TABLE `photo_challenge_matches`
  ADD CONSTRAINT `fk_match_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_match_group` FOREIGN KEY (`group_id`) REFERENCES `photo_challenge_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_match_image_a` FOREIGN KEY (`image_a_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_match_image_b` FOREIGN KEY (`image_b_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
