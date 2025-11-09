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
-- Tabellenstruktur für Tabelle `photo_challenge_groups`
--

CREATE TABLE `photo_challenge_groups` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `position` int NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_groups`
--
ALTER TABLE `photo_challenge_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_challenge_group` (`challenge_id`,`position`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_groups`
--
ALTER TABLE `photo_challenge_groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_groups`
--
ALTER TABLE `photo_challenge_groups`
  ADD CONSTRAINT `fk_challenge_group` FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
