-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:27
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
-- Tabellenstruktur für Tabelle `favoriten`
--

CREATE TABLE `favoriten` (
  `nutzer_id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `hinzugefuegt_am` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `favoriten`
--

INSERT INTO `favoriten` (`nutzer_id`, `eisdiele_id`, `hinzugefuegt_am`) VALUES
(1, 1, '2025-04-29 12:11:18'),
(1, 4, '2025-04-05 20:27:29'),
(1, 7, '2025-04-09 08:18:38'),
(1, 9, '2025-04-09 08:18:12'),
(1, 12, '2025-04-05 20:19:46'),
(1, 14, '2025-04-09 08:18:32'),
(1, 22, '2025-04-05 20:19:17'),
(1, 23, '2025-04-05 20:20:05'),
(1, 24, '2025-04-29 06:52:51'),
(1, 28, '2025-04-29 10:41:16'),
(1, 29, '2025-04-05 22:53:50'),
(1, 37, '2025-04-05 20:19:55'),
(1, 39, '2025-04-09 08:15:38'),
(1, 42, '2025-04-27 16:47:06'),
(1, 45, '2025-04-05 20:27:18'),
(1, 46, '2025-04-05 20:19:30'),
(1, 53, '2025-04-06 20:36:29'),
(1, 56, '2025-04-12 18:02:03'),
(1, 57, '2025-04-12 18:02:21'),
(1, 59, '2025-04-29 13:55:28'),
(1, 65, '2025-04-05 22:53:43'),
(1, 69, '2025-04-05 20:19:40'),
(1, 74, '2025-04-06 20:52:01'),
(1, 81, '2025-04-10 11:18:12'),
(1, 85, '2025-04-22 10:30:43'),
(1, 89, '2025-04-11 09:27:32'),
(1, 98, '2025-04-12 17:50:22'),
(1, 101, '2025-04-13 15:48:02'),
(1, 106, '2025-05-05 13:10:02'),
(1, 112, '2025-05-26 22:00:49'),
(1, 122, '2025-04-27 16:40:49'),
(1, 125, '2025-04-29 10:40:23'),
(1, 127, '2025-05-01 01:40:05'),
(1, 145, '2025-05-06 12:54:59'),
(1, 149, '2025-05-08 06:21:07'),
(1, 150, '2025-05-08 08:57:25'),
(1, 162, '2025-05-10 21:19:42');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `favoriten`
--
ALTER TABLE `favoriten`
  ADD PRIMARY KEY (`nutzer_id`,`eisdiele_id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `favoriten`
--
ALTER TABLE `favoriten`
  ADD CONSTRAINT `favoriten_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favoriten_ibfk_2` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
