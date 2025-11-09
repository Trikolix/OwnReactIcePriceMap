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
-- Tabellenstruktur für Tabelle `photo_challenge_images`
--

CREATE TABLE `photo_challenge_images` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `image_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_images`
--

INSERT INTO `photo_challenge_images` (`id`, `challenge_id`, `image_id`, `assigned_by`, `created_at`) VALUES
(1, 1, 717, 1, '2025-11-09 09:45:37'),
(2, 1, 725, 1, '2025-11-09 09:45:44'),
(3, 1, 732, 1, '2025-11-09 09:45:47'),
(4, 1, 757, 1, '2025-11-09 09:45:59'),
(5, 1, 759, 1, '2025-11-09 09:46:00'),
(6, 1, 762, 1, '2025-11-09 09:46:14'),
(7, 1, 652, 1, '2025-11-09 09:46:51'),
(8, 1, 651, 1, '2025-11-09 09:46:55'),
(9, 1, 630, 1, '2025-11-09 09:47:02'),
(10, 1, 764, 1, '2025-11-09 10:18:07'),
(13, 1, 756, 1, '2025-11-09 10:18:13'),
(17, 1, 753, 1, '2025-11-09 10:18:18'),
(18, 1, 752, 1, '2025-11-09 10:18:18'),
(19, 1, 749, 1, '2025-11-09 10:18:20'),
(21, 1, 736, 1, '2025-11-09 10:18:31'),
(22, 1, 691, 1, '2025-11-09 10:18:42'),
(23, 1, 693, 1, '2025-11-09 10:18:43'),
(24, 1, 468, 1, '2025-11-09 10:18:51'),
(25, 1, 673, 1, '2025-11-09 10:18:53'),
(27, 1, 462, 1, '2025-11-09 10:18:56'),
(28, 1, 657, 1, '2025-11-09 10:18:58'),
(29, 1, 633, 1, '2025-11-09 10:19:04'),
(31, 1, 632, 1, '2025-11-09 10:19:07'),
(32, 1, 620, 1, '2025-11-09 10:19:10'),
(34, 1, 608, 1, '2025-11-09 10:19:14'),
(36, 1, 595, 1, '2025-11-09 10:19:20'),
(37, 1, 597, 1, '2025-11-09 10:19:23'),
(39, 1, 569, 1, '2025-11-09 10:19:31');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

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
