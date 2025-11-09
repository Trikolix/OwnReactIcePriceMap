-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 09. Nov 2025 um 15:37
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

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
