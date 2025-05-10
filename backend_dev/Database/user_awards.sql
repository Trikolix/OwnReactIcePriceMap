-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:13
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
-- Datenbank: `db_439770_2`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user_awards`
--

CREATE TABLE `user_awards` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `award_id` int NOT NULL,
  `level` int NOT NULL,
  `awarded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `user_awards`
--

INSERT INTO `user_awards` (`id`, `user_id`, `award_id`, `level`, `awarded_at`) VALUES
(43, 1, 1, 1, '2025-04-24 13:13:59'),
(44, 1, 1, 2, '2025-04-24 13:13:59'),
(47, 1, 6, 1, '2025-04-24 13:13:59'),
(48, 1, 6, 2, '2025-04-24 13:13:59'),
(49, 1, 6, 3, '2025-04-24 13:13:59'),
(50, 1, 3, 1, '2025-04-25 06:02:39'),
(51, 1, 3, 2, '2025-04-25 06:02:39'),
(52, 1, 8, 1, '2025-04-26 00:10:32'),
(53, 1, 8, 2, '2025-04-26 00:10:32'),
(54, 1, 8, 3, '2025-04-26 00:10:32'),
(55, 1, 8, 4, '2025-04-26 00:10:32'),
(56, 1, 8, 5, '2025-04-26 00:10:32'),
(57, 1, 1, 3, '2025-04-26 11:13:39'),
(58, 1, 2, 1, '2025-04-26 11:13:39'),
(59, 1, 2, 2, '2025-04-26 11:13:39'),
(60, 1, 2, 3, '2025-04-26 11:13:39'),
(61, 1, 2, 4, '2025-04-26 11:13:39'),
(62, 1, 2, 5, '2025-04-26 11:13:39');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`award_id`,`level`),
  ADD KEY `award_id` (`award_id`,`level`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD CONSTRAINT `user_awards_ibfk_1` FOREIGN KEY (`award_id`,`level`) REFERENCES `award_levels` (`award_id`, `level`),
  ADD CONSTRAINT `user_awards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
