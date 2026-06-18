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
-- Tabellenstruktur für Tabelle `photo_challenge_images`
--

CREATE TABLE `photo_challenge_images` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `image_id` int NOT NULL,
  `land_id` int DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `assigned_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_images`
--

INSERT INTO `photo_challenge_images` (`id`, `challenge_id`, `image_id`, `land_id`, `title`, `assigned_by`, `created_at`) VALUES
(29, 3, 474, 1, NULL, 1, '2026-03-14 11:00:56'),
(30, 3, 880, 1, NULL, 1, '2026-03-14 11:00:58'),
(31, 3, 883, 1, NULL, 1, '2026-03-14 11:00:59'),
(32, 3, 913, 1, NULL, 1, '2026-03-14 11:01:00'),
(33, 3, 816, 1, NULL, 1, '2026-03-14 11:01:01'),
(34, 3, 429, 44, NULL, 1, '2026-03-14 11:01:01'),
(35, 3, 337, 1, NULL, 1, '2026-03-14 11:01:03'),
(36, 3, 440, 3, NULL, 1, '2026-03-14 11:01:04'),
(37, 3, 638, NULL, NULL, 1, '2026-03-14 11:01:05'),
(38, 3, 976, 2, NULL, 1, '2026-03-14 11:01:06'),
(39, 3, 315, 4, NULL, 1, '2026-03-14 11:01:07'),
(40, 3, 146, 1, NULL, 1, '2026-03-14 11:01:08'),
(41, 3, 427, 3, NULL, 1, '2026-03-14 11:01:08'),
(43, 3, 925, 1, NULL, 1, '2026-03-14 11:01:10'),
(44, 3, 924, 1, NULL, 1, '2026-03-14 11:01:17'),
(45, 3, 411, 44, NULL, 1, '2026-03-14 11:01:18'),
(46, 3, 430, 44, NULL, 1, '2026-03-14 11:01:19'),
(47, 3, 759, 53, NULL, 1, '2026-03-14 11:01:20'),
(48, 3, 964, 1, NULL, 1, '2026-03-14 11:01:21'),
(49, 3, 690, 3, NULL, 1, '2026-03-14 11:01:22'),
(50, 3, 677, 1, NULL, 1, '2026-03-14 11:01:31'),
(51, 3, 938, 56, NULL, 1, '2026-03-14 11:01:32'),
(52, 3, 810, 1, NULL, 1, '2026-03-14 11:01:33'),
(53, 3, 882, 1, NULL, 1, '2026-03-14 11:01:33'),
(54, 3, 71, 1, NULL, 1, '2026-03-14 11:01:34'),
(55, 3, 764, 3, NULL, 1, '2026-03-14 11:01:35'),
(56, 3, 102, 1, NULL, 1, '2026-03-14 11:01:36'),
(57, 3, 593, 1, NULL, 1, '2026-03-14 11:01:37'),
(58, 3, 768, 1, NULL, 1, '2026-03-14 11:01:37'),
(59, 3, 852, 1, NULL, 1, '2026-03-14 11:01:38'),
(60, 3, 58, 1, NULL, 1, '2026-03-14 11:01:39'),
(61, 3, 466, 1, NULL, 1, '2026-03-14 11:01:40'),
(62, 3, 632, 1, NULL, 1, '2026-03-14 11:01:41'),
(63, 3, 947, 1, NULL, 1, '2026-03-14 11:01:42'),
(64, 3, 448, 1, NULL, 1, '2026-03-14 11:01:42'),
(65, 3, 445, 1, NULL, 1, '2026-03-14 11:01:43'),
(66, 3, 543, 1, NULL, 1, '2026-03-14 11:01:44'),
(67, 3, 718, 3, NULL, 1, '2026-03-14 11:01:45'),
(68, 3, 874, 27, NULL, 1, '2026-03-14 11:01:45'),
(69, 3, 832, 1, NULL, 1, '2026-03-14 11:01:47'),
(70, 4, 1366, 1, NULL, 1, '2026-06-01 14:06:45'),
(71, 4, 1395, NULL, NULL, 1, '2026-06-01 14:06:46'),
(72, 4, 1390, NULL, NULL, 1, '2026-06-01 14:06:47'),
(73, 4, 1387, NULL, NULL, 1, '2026-06-01 14:06:48'),
(74, 4, 1359, 1, NULL, 1, '2026-06-01 14:06:49'),
(75, 4, 1355, NULL, NULL, 1, '2026-06-01 14:06:50'),
(76, 4, 1142, 1, NULL, 1, '2026-06-01 14:06:51'),
(77, 4, 1228, 1, NULL, 1, '2026-06-01 14:06:52'),
(78, 4, 1252, 1, NULL, 1, '2026-06-01 14:06:53'),
(79, 4, 1288, 1, NULL, 1, '2026-06-01 14:06:54'),
(80, 4, 1251, 1, NULL, 1, '2026-06-01 14:06:55'),
(81, 4, 1290, 1, NULL, 1, '2026-06-01 14:06:56'),
(82, 4, 1311, 1, NULL, 1, '2026-06-01 14:06:57'),
(83, 4, 1256, 1, NULL, 1, '2026-06-01 14:06:58'),
(84, 4, 1239, NULL, NULL, 1, '2026-06-01 14:06:59'),
(85, 4, 512, 1, NULL, 1, '2026-06-01 14:06:59'),
(86, 4, 807, 1, NULL, 1, '2026-06-01 14:07:01'),
(87, 4, 847, 1, NULL, 1, '2026-06-01 14:07:02'),
(88, 4, 1000, 44, NULL, 1, '2026-06-01 14:07:03'),
(89, 4, 291, 1, NULL, 1, '2026-06-01 14:07:04'),
(90, 5, 938, 56, NULL, 1, '2026-06-01 15:55:37'),
(91, 5, 759, 53, NULL, 1, '2026-06-01 15:55:40'),
(92, 5, 982, 20, NULL, 1, '2026-06-01 15:55:42'),
(93, 5, 288, 19, NULL, 1, '2026-06-01 15:55:46'),
(94, 5, 978, 58, NULL, 1, '2026-06-01 15:55:49'),
(95, 5, 923, 17, NULL, 1, '2026-06-01 15:55:54'),
(96, 5, 1164, 61, NULL, 1, '2026-06-01 15:55:57'),
(97, 5, 1314, 62, NULL, 1, '2026-06-01 15:56:06'),
(98, 5, 345, 10, NULL, 1, '2026-06-01 15:56:15'),
(99, 5, 975, 57, NULL, 1, '2026-06-01 15:56:20'),
(100, 5, 322, 46, NULL, 1, '2026-06-01 15:56:31'),
(101, 5, 1352, 35, NULL, 1, '2026-06-01 15:56:35'),
(103, 5, 338, 52, NULL, 1, '2026-06-01 15:57:04'),
(104, 5, 1084, 59, NULL, 1, '2026-06-01 15:57:10'),
(105, 5, 736, 31, NULL, 1, '2026-06-01 15:57:22'),
(106, 5, 1000, 44, NULL, 1, '2026-06-01 15:57:31'),
(107, 5, 608, 48, NULL, 1, '2026-06-01 15:57:59'),
(108, 5, 250, 22, NULL, 1, '2026-06-01 15:58:08'),
(109, 5, 766, 34, NULL, 1, '2026-06-01 15:58:13'),
(110, 5, 863, 27, NULL, 1, '2026-06-01 15:58:22'),
(111, 5, 537, 36, NULL, 1, '2026-06-01 15:58:45'),
(112, 5, 530, 2, NULL, 1, '2026-06-01 15:59:05'),
(113, 5, 1052, 5, NULL, 1, '2026-06-01 15:59:10'),
(114, 5, 154, 50, NULL, 1, '2026-06-01 15:59:26'),
(115, 5, 788, 4, NULL, 1, '2026-06-01 15:59:44'),
(116, 5, 1203, 3, NULL, 1, '2026-06-01 15:59:50'),
(117, 5, 1259, 1, NULL, 1, '2026-06-01 16:00:12');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_images`
--
ALTER TABLE `photo_challenge_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_challenge_image` (`challenge_id`,`image_id`),
  ADD KEY `fk_challenge_image` (`image_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_images`
--
ALTER TABLE `photo_challenge_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_images`
--
ALTER TABLE `photo_challenge_images`
  ADD CONSTRAINT `fk_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_challenge_image` FOREIGN KEY (`image_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
