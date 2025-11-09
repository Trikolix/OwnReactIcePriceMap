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
-- Tabellenstruktur für Tabelle `photo_challenge_votes`
--

CREATE TABLE `photo_challenge_votes` (
  `id` int NOT NULL,
  `match_id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `image_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_votes`
--

INSERT INTO `photo_challenge_votes` (`id`, `match_id`, `nutzer_id`, `image_id`, `created_at`) VALUES
(1, 43, 1, 652, '2025-11-09 10:42:50'),
(2, 44, 1, 756, '2025-11-09 10:42:53'),
(3, 45, 1, 673, '2025-11-09 10:43:07'),
(4, 46, 1, 652, '2025-11-09 10:43:09'),
(5, 47, 1, 673, '2025-11-09 10:43:11'),
(6, 48, 1, 752, '2025-11-09 10:43:12'),
(9, 49, 1, 468, '2025-11-09 10:44:59'),
(10, 50, 1, 468, '2025-11-09 10:45:04'),
(11, 51, 1, 468, '2025-11-09 10:45:05'),
(12, 52, 1, 764, '2025-11-09 10:45:08'),
(13, 53, 1, 691, '2025-11-09 10:45:10'),
(14, 54, 1, 764, '2025-11-09 10:45:11'),
(15, 55, 1, 620, '2025-11-09 10:45:21'),
(16, 56, 1, 736, '2025-11-09 10:45:23'),
(17, 57, 1, 620, '2025-11-09 10:45:24'),
(18, 58, 1, 736, '2025-11-09 10:45:26'),
(19, 59, 1, 595, '2025-11-09 10:45:28'),
(20, 60, 1, 736, '2025-11-09 10:45:29');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_votes`
--
ALTER TABLE `photo_challenge_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_vote` (`match_id`,`nutzer_id`),
  ADD KEY `fk_vote_image` (`image_id`),
  ADD KEY `fk_vote_user` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_votes`
--
ALTER TABLE `photo_challenge_votes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_votes`
--
ALTER TABLE `photo_challenge_votes`
  ADD CONSTRAINT `fk_vote_image` FOREIGN KEY (`image_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vote_match` FOREIGN KEY (`match_id`) REFERENCES `photo_challenge_matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vote_user` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
