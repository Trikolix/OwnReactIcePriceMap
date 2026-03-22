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
-- Tabellenstruktur für Tabelle `photo_challenge_matches`
--

CREATE TABLE `photo_challenge_matches` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `phase` enum('group','ko') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `round` int NOT NULL DEFAULT '1',
  `group_id` int DEFAULT NULL,
  `position` int NOT NULL,
  `image_a_id` int NOT NULL,
  `image_b_id` int NOT NULL,
  `winner_image_id` int DEFAULT NULL,
  `status` enum('open','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `locked_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_matches`
--

INSERT INTO `photo_challenge_matches` (`id`, `challenge_id`, `phase`, `round`, `group_id`, `position`, `image_a_id`, `image_b_id`, `winner_image_id`, `status`, `created_at`, `locked_at`) VALUES
(70, 3, 'group', 1, 8, 1, 102, 448, NULL, 'open', '2026-03-14 11:36:41', NULL),
(71, 3, 'group', 1, 8, 2, 102, 764, NULL, 'open', '2026-03-14 11:36:41', NULL),
(72, 3, 'group', 1, 8, 3, 102, 882, NULL, 'open', '2026-03-14 11:36:41', NULL),
(73, 3, 'group', 1, 8, 4, 448, 764, NULL, 'open', '2026-03-14 11:36:41', NULL),
(74, 3, 'group', 1, 8, 5, 448, 882, NULL, 'open', '2026-03-14 11:36:41', NULL),
(75, 3, 'group', 1, 8, 6, 764, 882, NULL, 'open', '2026-03-14 11:36:41', NULL),
(76, 3, 'group', 1, 9, 7, 925, 976, NULL, 'open', '2026-03-14 11:36:41', NULL),
(77, 3, 'group', 1, 9, 8, 925, 690, NULL, 'open', '2026-03-14 11:36:41', NULL),
(78, 3, 'group', 1, 9, 9, 925, 759, NULL, 'open', '2026-03-14 11:36:41', NULL),
(79, 3, 'group', 1, 9, 10, 976, 690, NULL, 'open', '2026-03-14 11:36:41', NULL),
(80, 3, 'group', 1, 9, 11, 976, 759, NULL, 'open', '2026-03-14 11:36:41', NULL),
(81, 3, 'group', 1, 9, 12, 690, 759, NULL, 'open', '2026-03-14 11:36:41', NULL),
(82, 3, 'group', 1, 10, 13, 146, 677, NULL, 'open', '2026-03-14 11:36:41', NULL),
(83, 3, 'group', 1, 10, 14, 146, 593, NULL, 'open', '2026-03-14 11:36:41', NULL),
(84, 3, 'group', 1, 10, 15, 146, 466, NULL, 'open', '2026-03-14 11:36:41', NULL),
(85, 3, 'group', 1, 10, 16, 677, 593, NULL, 'open', '2026-03-14 11:36:41', NULL),
(86, 3, 'group', 1, 10, 17, 677, 466, NULL, 'open', '2026-03-14 11:36:41', NULL),
(87, 3, 'group', 1, 10, 18, 593, 466, NULL, 'open', '2026-03-14 11:36:41', NULL),
(88, 3, 'group', 1, 11, 19, 883, 430, NULL, 'open', '2026-03-14 11:36:41', NULL),
(89, 3, 'group', 1, 11, 20, 883, 474, NULL, 'open', '2026-03-14 11:36:41', NULL),
(90, 3, 'group', 1, 11, 21, 883, 816, NULL, 'open', '2026-03-14 11:36:41', NULL),
(91, 3, 'group', 1, 11, 22, 430, 474, NULL, 'open', '2026-03-14 11:36:41', NULL),
(92, 3, 'group', 1, 11, 23, 430, 816, NULL, 'open', '2026-03-14 11:36:41', NULL),
(93, 3, 'group', 1, 11, 24, 474, 816, NULL, 'open', '2026-03-14 11:36:41', NULL),
(94, 3, 'group', 1, 12, 25, 427, 964, NULL, 'open', '2026-03-14 11:36:41', NULL),
(95, 3, 'group', 1, 12, 26, 427, 543, NULL, 'open', '2026-03-14 11:36:41', NULL),
(96, 3, 'group', 1, 12, 27, 427, 947, NULL, 'open', '2026-03-14 11:36:41', NULL),
(97, 3, 'group', 1, 12, 28, 964, 543, NULL, 'open', '2026-03-14 11:36:41', NULL),
(98, 3, 'group', 1, 12, 29, 964, 947, NULL, 'open', '2026-03-14 11:36:41', NULL),
(99, 3, 'group', 1, 12, 30, 543, 947, NULL, 'open', '2026-03-14 11:36:41', NULL),
(100, 3, 'group', 1, 13, 31, 638, 768, NULL, 'open', '2026-03-14 11:36:41', NULL),
(101, 3, 'group', 1, 13, 32, 638, 880, NULL, 'open', '2026-03-14 11:36:41', NULL),
(102, 3, 'group', 1, 13, 33, 638, 718, NULL, 'open', '2026-03-14 11:36:41', NULL),
(103, 3, 'group', 1, 13, 34, 768, 880, NULL, 'open', '2026-03-14 11:36:41', NULL),
(104, 3, 'group', 1, 13, 35, 768, 718, NULL, 'open', '2026-03-14 11:36:41', NULL),
(105, 3, 'group', 1, 13, 36, 880, 718, NULL, 'open', '2026-03-14 11:36:41', NULL),
(106, 3, 'group', 1, 14, 37, 810, 632, NULL, 'open', '2026-03-14 11:36:41', NULL),
(107, 3, 'group', 1, 14, 38, 810, 337, NULL, 'open', '2026-03-14 11:36:41', NULL),
(108, 3, 'group', 1, 14, 39, 810, 429, NULL, 'open', '2026-03-14 11:36:41', NULL),
(109, 3, 'group', 1, 14, 40, 632, 337, NULL, 'open', '2026-03-14 11:36:41', NULL),
(110, 3, 'group', 1, 14, 41, 632, 429, NULL, 'open', '2026-03-14 11:36:41', NULL),
(111, 3, 'group', 1, 14, 42, 337, 429, NULL, 'open', '2026-03-14 11:36:41', NULL),
(112, 3, 'group', 1, 15, 43, 315, 832, NULL, 'open', '2026-03-14 11:36:41', NULL),
(113, 3, 'group', 1, 15, 44, 315, 913, NULL, 'open', '2026-03-14 11:36:41', NULL),
(114, 3, 'group', 1, 15, 45, 315, 445, NULL, 'open', '2026-03-14 11:36:41', NULL),
(115, 3, 'group', 1, 15, 46, 832, 913, NULL, 'open', '2026-03-14 11:36:41', NULL),
(116, 3, 'group', 1, 15, 47, 832, 445, NULL, 'open', '2026-03-14 11:36:41', NULL),
(117, 3, 'group', 1, 15, 48, 913, 445, NULL, 'open', '2026-03-14 11:36:41', NULL),
(118, 3, 'group', 1, 16, 49, 874, 924, NULL, 'open', '2026-03-14 11:36:41', NULL),
(119, 3, 'group', 1, 16, 50, 874, 71, NULL, 'open', '2026-03-14 11:36:41', NULL),
(120, 3, 'group', 1, 16, 51, 874, 58, NULL, 'open', '2026-03-14 11:36:41', NULL),
(121, 3, 'group', 1, 16, 52, 924, 71, NULL, 'open', '2026-03-14 11:36:41', NULL),
(122, 3, 'group', 1, 16, 53, 924, 58, NULL, 'open', '2026-03-14 11:36:41', NULL),
(123, 3, 'group', 1, 16, 54, 71, 58, NULL, 'open', '2026-03-14 11:36:41', NULL),
(124, 3, 'group', 1, 17, 55, 852, 938, NULL, 'open', '2026-03-14 11:36:41', NULL),
(125, 3, 'group', 1, 17, 56, 852, 411, NULL, 'open', '2026-03-14 11:36:41', NULL),
(126, 3, 'group', 1, 17, 57, 852, 440, NULL, 'open', '2026-03-14 11:36:41', NULL),
(127, 3, 'group', 1, 17, 58, 938, 411, NULL, 'open', '2026-03-14 11:36:41', NULL),
(128, 3, 'group', 1, 17, 59, 938, 440, NULL, 'open', '2026-03-14 11:36:41', NULL),
(129, 3, 'group', 1, 17, 60, 411, 440, NULL, 'open', '2026-03-14 11:36:41', NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=130;

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
