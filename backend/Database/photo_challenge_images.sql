-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 01. Apr 2026 um 06:46
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
-- Tabellenstruktur für Tabelle `photo_challenge_images`
--

CREATE TABLE `photo_challenge_images` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `image_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `assigned_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_images`
--

INSERT INTO `photo_challenge_images` (`id`, `challenge_id`, `image_id`, `title`, `assigned_by`, `created_at`) VALUES
(29, 3, 474, NULL, 1, '2026-03-14 11:00:56'),
(30, 3, 880, NULL, 1, '2026-03-14 11:00:58'),
(31, 3, 883, NULL, 1, '2026-03-14 11:00:59'),
(32, 3, 913, NULL, 1, '2026-03-14 11:01:00'),
(33, 3, 816, NULL, 1, '2026-03-14 11:01:01'),
(34, 3, 429, NULL, 1, '2026-03-14 11:01:01'),
(35, 3, 337, NULL, 1, '2026-03-14 11:01:03'),
(36, 3, 440, NULL, 1, '2026-03-14 11:01:04'),
(37, 3, 638, NULL, 1, '2026-03-14 11:01:05'),
(38, 3, 976, NULL, 1, '2026-03-14 11:01:06'),
(39, 3, 315, NULL, 1, '2026-03-14 11:01:07'),
(40, 3, 146, NULL, 1, '2026-03-14 11:01:08'),
(41, 3, 427, NULL, 1, '2026-03-14 11:01:08'),
(43, 3, 925, NULL, 1, '2026-03-14 11:01:10'),
(44, 3, 924, NULL, 1, '2026-03-14 11:01:17'),
(45, 3, 411, NULL, 1, '2026-03-14 11:01:18'),
(46, 3, 430, NULL, 1, '2026-03-14 11:01:19'),
(47, 3, 759, NULL, 1, '2026-03-14 11:01:20'),
(48, 3, 964, NULL, 1, '2026-03-14 11:01:21'),
(49, 3, 690, NULL, 1, '2026-03-14 11:01:22'),
(50, 3, 677, NULL, 1, '2026-03-14 11:01:31'),
(51, 3, 938, NULL, 1, '2026-03-14 11:01:32'),
(52, 3, 810, NULL, 1, '2026-03-14 11:01:33'),
(53, 3, 882, NULL, 1, '2026-03-14 11:01:33'),
(54, 3, 71, NULL, 1, '2026-03-14 11:01:34'),
(55, 3, 764, NULL, 1, '2026-03-14 11:01:35'),
(56, 3, 102, NULL, 1, '2026-03-14 11:01:36'),
(57, 3, 593, NULL, 1, '2026-03-14 11:01:37'),
(58, 3, 768, NULL, 1, '2026-03-14 11:01:37'),
(59, 3, 852, NULL, 1, '2026-03-14 11:01:38'),
(60, 3, 58, NULL, 1, '2026-03-14 11:01:39'),
(61, 3, 466, NULL, 1, '2026-03-14 11:01:40'),
(62, 3, 632, NULL, 1, '2026-03-14 11:01:41'),
(63, 3, 947, NULL, 1, '2026-03-14 11:01:42'),
(64, 3, 448, NULL, 1, '2026-03-14 11:01:42'),
(65, 3, 445, NULL, 1, '2026-03-14 11:01:43'),
(66, 3, 543, NULL, 1, '2026-03-14 11:01:44'),
(67, 3, 718, NULL, 1, '2026-03-14 11:01:45'),
(68, 3, 874, NULL, 1, '2026-03-14 11:01:45'),
(69, 3, 832, NULL, 1, '2026-03-14 11:01:47');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

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
