-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 08. Nov 2025 um 17:58
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
-- Tabellenstruktur für Tabelle `route_eisdielen`
--

CREATE TABLE `route_eisdielen` (
  `route_id` int NOT NULL,
  `eisdiele_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `route_eisdielen`
--

INSERT INTO `route_eisdielen` (`route_id`, `eisdiele_id`) VALUES
(67, 4),
(1, 7),
(64, 9),
(2, 12),
(68, 21),
(78, 21),
(70, 22),
(76, 22),
(3, 23),
(4, 24),
(5, 30),
(6, 31),
(7, 40),
(8, 45),
(9, 46),
(34, 46),
(66, 56),
(75, 57),
(72, 60),
(12, 74),
(13, 89),
(73, 93),
(14, 98),
(15, 101),
(16, 106),
(77, 127),
(48, 149),
(49, 150),
(75, 179),
(69, 213),
(74, 314),
(76, 411);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `route_eisdielen`
--
ALTER TABLE `route_eisdielen`
  ADD PRIMARY KEY (`route_id`,`eisdiele_id`),
  ADD KEY `route_eisdielen_eisdiele_idx` (`eisdiele_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `route_eisdielen`
--
ALTER TABLE `route_eisdielen`
  ADD CONSTRAINT `route_eisdielen_eisdiele_fk` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `route_eisdielen_route_fk` FOREIGN KEY (`route_id`) REFERENCES `routen` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
