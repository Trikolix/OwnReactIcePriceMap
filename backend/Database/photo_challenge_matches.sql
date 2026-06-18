-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 18. Jun 2026 um 14:19
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.20

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
(70, 3, 'group', 1, 8, 1, 102, 448, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(71, 3, 'group', 1, 8, 2, 102, 764, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(72, 3, 'group', 1, 8, 3, 102, 882, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(73, 3, 'group', 1, 8, 4, 448, 764, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(74, 3, 'group', 1, 8, 5, 448, 882, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(75, 3, 'group', 1, 8, 6, 764, 882, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(76, 3, 'group', 1, 9, 7, 925, 976, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(77, 3, 'group', 1, 9, 8, 925, 690, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(78, 3, 'group', 1, 9, 9, 925, 759, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(79, 3, 'group', 1, 9, 10, 976, 690, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(80, 3, 'group', 1, 9, 11, 976, 759, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(81, 3, 'group', 1, 9, 12, 690, 759, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(82, 3, 'group', 1, 10, 13, 146, 677, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(83, 3, 'group', 1, 10, 14, 146, 593, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(84, 3, 'group', 1, 10, 15, 146, 466, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(85, 3, 'group', 1, 10, 16, 677, 593, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(86, 3, 'group', 1, 10, 17, 677, 466, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(87, 3, 'group', 1, 10, 18, 593, 466, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(88, 3, 'group', 1, 11, 19, 883, 430, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(89, 3, 'group', 1, 11, 20, 883, 474, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(90, 3, 'group', 1, 11, 21, 883, 816, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(91, 3, 'group', 1, 11, 22, 430, 474, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(92, 3, 'group', 1, 11, 23, 430, 816, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(93, 3, 'group', 1, 11, 24, 474, 816, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(94, 3, 'group', 1, 12, 25, 427, 964, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(95, 3, 'group', 1, 12, 26, 427, 543, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(96, 3, 'group', 1, 12, 27, 427, 947, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(97, 3, 'group', 1, 12, 28, 964, 543, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(98, 3, 'group', 1, 12, 29, 964, 947, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(99, 3, 'group', 1, 12, 30, 543, 947, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(100, 3, 'group', 1, 13, 31, 638, 768, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(101, 3, 'group', 1, 13, 32, 638, 880, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(102, 3, 'group', 1, 13, 33, 638, 718, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(103, 3, 'group', 1, 13, 34, 768, 880, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(104, 3, 'group', 1, 13, 35, 768, 718, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(105, 3, 'group', 1, 13, 36, 880, 718, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(106, 3, 'group', 1, 14, 37, 810, 632, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(107, 3, 'group', 1, 14, 38, 810, 337, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(108, 3, 'group', 1, 14, 39, 810, 429, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(109, 3, 'group', 1, 14, 40, 632, 337, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(110, 3, 'group', 1, 14, 41, 632, 429, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(111, 3, 'group', 1, 14, 42, 337, 429, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(112, 3, 'group', 1, 15, 43, 315, 832, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(113, 3, 'group', 1, 15, 44, 315, 913, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(114, 3, 'group', 1, 15, 45, 315, 445, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(115, 3, 'group', 1, 15, 46, 832, 913, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(116, 3, 'group', 1, 15, 47, 832, 445, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(117, 3, 'group', 1, 15, 48, 913, 445, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(118, 3, 'group', 1, 16, 49, 874, 924, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(119, 3, 'group', 1, 16, 50, 874, 71, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(120, 3, 'group', 1, 16, 51, 874, 58, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(121, 3, 'group', 1, 16, 52, 924, 71, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(122, 3, 'group', 1, 16, 53, 924, 58, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(123, 3, 'group', 1, 16, 54, 71, 58, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(124, 3, 'group', 1, 17, 55, 852, 938, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(125, 3, 'group', 1, 17, 56, 852, 411, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(126, 3, 'group', 1, 17, 57, 852, 440, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(127, 3, 'group', 1, 17, 58, 938, 411, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(128, 3, 'group', 1, 17, 59, 938, 440, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(129, 3, 'group', 1, 17, 60, 411, 440, NULL, 'closed', '2026-03-14 11:36:41', NULL),
(130, 3, 'ko', 1, NULL, 1, 882, 466, 882, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(131, 3, 'ko', 1, NULL, 2, 759, 832, 759, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(132, 3, 'ko', 1, NULL, 3, 430, 448, 430, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(133, 3, 'ko', 1, NULL, 4, 593, 810, 593, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(134, 3, 'ko', 1, NULL, 5, 947, 474, 947, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(135, 3, 'ko', 1, NULL, 6, 315, 976, 315, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(136, 3, 'ko', 1, NULL, 7, 718, 924, 718, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(137, 3, 'ko', 1, NULL, 8, 874, 852, 852, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(138, 3, 'ko', 1, NULL, 9, 440, 768, 440, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(139, 3, 'ko', 1, NULL, 10, 632, 427, 427, 'closed', '2026-03-31 23:26:10', '2026-04-06 00:33:21'),
(140, 3, 'ko', 2, NULL, 1, 882, 759, 759, 'closed', '2026-04-06 00:33:21', '2026-04-13 03:49:18'),
(141, 3, 'ko', 2, NULL, 2, 430, 593, 430, 'closed', '2026-04-06 00:33:21', '2026-04-13 03:49:18'),
(142, 3, 'ko', 2, NULL, 3, 947, 315, 315, 'closed', '2026-04-06 00:33:21', '2026-04-13 03:49:18'),
(143, 3, 'ko', 2, NULL, 4, 718, 852, 852, 'closed', '2026-04-06 00:33:21', '2026-04-13 03:49:18'),
(144, 3, 'ko', 2, NULL, 5, 440, 427, 427, 'closed', '2026-04-06 00:33:21', '2026-04-13 03:49:18'),
(145, 3, 'ko', 3, NULL, 1, 759, 430, 759, 'closed', '2026-04-13 03:49:18', '2026-04-19 19:40:58'),
(146, 3, 'ko', 3, NULL, 2, 315, 852, 315, 'closed', '2026-04-13 03:49:18', '2026-04-19 19:40:58'),
(147, 3, 'ko', 3, NULL, 3, 427, 947, 947, 'closed', '2026-04-13 03:49:18', '2026-04-19 19:40:58'),
(148, 3, 'ko', 4, NULL, 1, 759, 315, 759, 'closed', '2026-04-19 19:40:58', '2026-04-27 04:37:54'),
(149, 3, 'ko', 4, NULL, 2, 947, 852, 947, 'closed', '2026-04-19 19:40:58', '2026-04-27 04:37:54'),
(150, 3, 'ko', 5, NULL, 1, 759, 947, 759, 'closed', '2026-04-27 04:37:54', '2026-05-10 19:15:31'),
(151, 4, 'group', 1, 18, 1, 1311, 1251, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(152, 4, 'group', 1, 18, 2, 1311, 1142, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(153, 4, 'group', 1, 18, 3, 1311, 1366, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(154, 4, 'group', 1, 18, 4, 1251, 1142, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(155, 4, 'group', 1, 18, 5, 1251, 1366, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(156, 4, 'group', 1, 18, 6, 1142, 1366, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(157, 4, 'group', 1, 19, 7, 1390, 1256, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(158, 4, 'group', 1, 19, 8, 1390, 807, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(159, 4, 'group', 1, 19, 9, 1390, 1239, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(160, 4, 'group', 1, 19, 10, 1256, 807, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(161, 4, 'group', 1, 19, 11, 1256, 1239, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(162, 4, 'group', 1, 19, 12, 807, 1239, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(163, 4, 'group', 1, 20, 13, 512, 1288, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(164, 4, 'group', 1, 20, 14, 512, 1395, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(165, 4, 'group', 1, 20, 15, 512, 1228, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(166, 4, 'group', 1, 20, 16, 1288, 1395, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(167, 4, 'group', 1, 20, 17, 1288, 1228, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(168, 4, 'group', 1, 20, 18, 1395, 1228, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(169, 4, 'group', 1, 21, 19, 1355, 1290, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(170, 4, 'group', 1, 21, 20, 1355, 847, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(171, 4, 'group', 1, 21, 21, 1355, 1000, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(172, 4, 'group', 1, 21, 22, 1290, 847, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(173, 4, 'group', 1, 21, 23, 1290, 1000, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(174, 4, 'group', 1, 21, 24, 847, 1000, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(175, 4, 'group', 1, 22, 25, 1359, 1252, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(176, 4, 'group', 1, 22, 26, 1359, 1387, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(177, 4, 'group', 1, 22, 27, 1359, 291, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(178, 4, 'group', 1, 22, 28, 1252, 1387, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(179, 4, 'group', 1, 22, 29, 1252, 291, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(180, 4, 'group', 1, 22, 30, 1387, 291, NULL, 'closed', '2026-06-01 14:07:41', NULL),
(181, 5, 'group', 1, 23, 1, 288, 322, NULL, 'open', '2026-06-10 10:46:58', NULL),
(182, 5, 'group', 1, 23, 2, 288, 1164, NULL, 'open', '2026-06-10 10:46:58', NULL),
(183, 5, 'group', 1, 23, 3, 322, 1164, NULL, 'open', '2026-06-10 10:46:58', NULL),
(184, 5, 'group', 1, 24, 4, 608, 1259, NULL, 'open', '2026-06-10 10:46:58', NULL),
(185, 5, 'group', 1, 24, 5, 608, 766, NULL, 'open', '2026-06-10 10:46:58', NULL),
(186, 5, 'group', 1, 24, 6, 1259, 766, NULL, 'open', '2026-06-10 10:46:58', NULL),
(187, 5, 'group', 1, 25, 7, 863, 1000, NULL, 'open', '2026-06-10 10:46:58', NULL),
(188, 5, 'group', 1, 25, 8, 863, 736, NULL, 'open', '2026-06-10 10:46:58', NULL),
(189, 5, 'group', 1, 25, 9, 1000, 736, NULL, 'open', '2026-06-10 10:46:58', NULL),
(190, 5, 'group', 1, 26, 10, 338, 537, NULL, 'open', '2026-06-10 10:46:58', NULL),
(191, 5, 'group', 1, 26, 11, 338, 788, NULL, 'open', '2026-06-10 10:46:58', NULL),
(192, 5, 'group', 1, 26, 12, 537, 788, NULL, 'open', '2026-06-10 10:46:58', NULL),
(193, 5, 'group', 1, 27, 13, 530, 975, NULL, 'open', '2026-06-10 10:46:58', NULL),
(194, 5, 'group', 1, 27, 14, 530, 1352, NULL, 'open', '2026-06-10 10:46:58', NULL),
(195, 5, 'group', 1, 27, 15, 975, 1352, NULL, 'open', '2026-06-10 10:46:58', NULL),
(196, 5, 'group', 1, 28, 16, 250, 1052, NULL, 'open', '2026-06-10 10:46:58', NULL),
(197, 5, 'group', 1, 28, 17, 250, 1203, NULL, 'open', '2026-06-10 10:46:58', NULL),
(198, 5, 'group', 1, 28, 18, 1052, 1203, NULL, 'open', '2026-06-10 10:46:58', NULL),
(199, 5, 'group', 1, 29, 19, 923, 1084, NULL, 'open', '2026-06-10 10:46:58', NULL),
(200, 5, 'group', 1, 29, 20, 923, 759, NULL, 'open', '2026-06-10 10:46:58', NULL),
(201, 5, 'group', 1, 29, 21, 1084, 759, NULL, 'open', '2026-06-10 10:46:58', NULL),
(202, 5, 'group', 1, 30, 22, 1314, 978, NULL, 'open', '2026-06-10 10:46:58', NULL),
(203, 5, 'group', 1, 30, 23, 1314, 154, NULL, 'open', '2026-06-10 10:46:58', NULL),
(204, 5, 'group', 1, 30, 24, 978, 154, NULL, 'open', '2026-06-10 10:46:58', NULL),
(205, 5, 'group', 1, 31, 25, 345, 938, NULL, 'open', '2026-06-10 10:46:58', NULL),
(206, 5, 'group', 1, 31, 26, 345, 982, NULL, 'open', '2026-06-10 10:46:58', NULL),
(207, 5, 'group', 1, 31, 27, 938, 982, NULL, 'open', '2026-06-10 10:46:58', NULL),
(208, 4, 'ko', 1, NULL, 1, 1311, 1355, NULL, 'open', '2026-06-14 20:18:30', NULL),
(209, 4, 'ko', 1, NULL, 2, 847, 291, NULL, 'open', '2026-06-14 20:18:30', NULL),
(210, 4, 'ko', 1, NULL, 3, 1390, 807, NULL, 'open', '2026-06-14 20:18:30', NULL),
(211, 4, 'ko', 1, NULL, 4, 512, 1395, NULL, 'open', '2026-06-14 20:18:30', NULL),
(212, 4, 'ko', 1, NULL, 5, 1387, 1366, NULL, 'open', '2026-06-14 20:18:30', NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=213;

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
