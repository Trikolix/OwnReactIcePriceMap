-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 01. Jun 2025 um 10:49
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
  `bundesland_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `landkreise`
--

INSERT INTO `landkreise` (`id`, `name`, `bundesland_id`) VALUES
(7, 'Altenburger Land', 1),
(19, 'Aussiger Region', 6),
(30, 'Autonome Provinz Trient', 12),
(31, 'Bozen', 12),
(6, 'Chemnitz', 3),
(11, 'Dresden', 3),
(3, 'Erzgebirgskreis', 3),
(33, 'Gorizia', 14),
(8, 'Greiz', 1),
(25, 'Hérault', 10),
(18, 'Karlsbader Region', 6),
(9, 'Landkreis Leipzig', 3),
(23, 'Landkreis Tirschenreuth', 7),
(29, 'Luzern', 11),
(22, 'Mailand', 8),
(10, 'Meißen', 3),
(4, 'Mittelsachsen', 3),
(32, 'Neu-Görz', 13),
(24, 'Oberelsass', 9),
(16, 'Oberspreewald-Lausitz - Górne Błota-Łužyca', 5),
(17, 'Sächsische Schweiz-Osterzgebirge', 3),
(12, 'Vogtlandkreis', 3),
(28, 'Weiden in der Oberpfalz', 7),
(5, 'Zwickau', 3);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

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
