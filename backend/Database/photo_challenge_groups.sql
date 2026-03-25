-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 20. Mrz 2026 um 06:45
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
-- Tabellenstruktur für Tabelle `photo_challenge_groups`
--

CREATE TABLE `photo_challenge_groups` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `position` int NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_groups`
--

INSERT INTO `photo_challenge_groups` (`id`, `challenge_id`, `name`, `position`, `start_at`, `end_at`, `created_at`) VALUES
(8, 3, 'Gruppe A', 1, '2026-03-14 00:00:00', '2026-03-20 00:00:00', '2026-03-14 11:36:41'),
(9, 3, 'Gruppe B', 2, '2026-03-14 00:00:00', '2026-03-20 00:00:00', '2026-03-14 11:36:41'),
(10, 3, 'Gruppe C', 3, '2026-03-17 00:00:00', '2026-03-23 00:00:00', '2026-03-14 11:36:41'),
(11, 3, 'Gruppe D', 4, '2026-03-17 00:00:00', '2026-03-23 00:00:00', '2026-03-14 11:36:41'),
(12, 3, 'Gruppe E', 5, '2026-03-20 00:00:00', '2026-03-26 00:00:00', '2026-03-14 11:36:41'),
(13, 3, 'Gruppe F', 6, '2026-03-20 00:00:00', '2026-03-26 00:00:00', '2026-03-14 11:36:41'),
(14, 3, 'Gruppe G', 7, '2026-03-23 00:00:00', '2026-03-29 00:00:00', '2026-03-14 11:36:41'),
(15, 3, 'Gruppe H', 8, '2026-03-23 00:00:00', '2026-03-29 00:00:00', '2026-03-14 11:36:41'),
(16, 3, 'Gruppe I', 9, '2026-03-26 00:00:00', '2026-04-01 00:00:00', '2026-03-14 11:36:41'),
(17, 3, 'Gruppe J', 10, '2026-03-26 00:00:00', '2026-04-01 00:00:00', '2026-03-14 11:36:41');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
