-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 09. Nov 2025 um 15:36
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

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
