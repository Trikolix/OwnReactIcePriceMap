-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:12
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
-- Tabellenstruktur für Tabelle `landkreise`
--

CREATE TABLE `landkreise` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bundesland_id` int DEFAULT NULL,
  `osm_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `landkreise`
--

INSERT INTO `landkreise` (`id`, `name`, `bundesland_id`, `osm_id`) VALUES
(3, 'Erzgebirgskreis', 3, '1124357916'),
(4, 'Mittelsachsen', 3, '381192823'),
(5, 'Zwickau', 3, '207867238'),
(6, 'Chemnitz', 3, '99537671'),
(7, 'Altenburger Land', 1, '540643668'),
(8, 'Greiz', 1, '11773930100'),
(9, 'Landkreis Leipzig', 3, '681606787'),
(10, 'Meißen', 3, '989292060'),
(11, 'Dresden', 3, '1775886513'),
(12, 'Vogtlandkreis', 3, '1833110668'),
(16, 'Oberspreewald-Lausitz - Górne Błota-Łužyca', 5, '56672261');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`,`bundesland_id`),
  ADD KEY `bundesland_id` (`bundesland_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD CONSTRAINT `landkreise_ibfk_1` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
