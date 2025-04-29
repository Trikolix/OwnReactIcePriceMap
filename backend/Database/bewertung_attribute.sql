-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:11
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
-- Tabellenstruktur für Tabelle `bewertung_attribute`
--

CREATE TABLE `bewertung_attribute` (
  `bewertung_id` int NOT NULL,
  `attribut_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bewertung_attribute`
--

INSERT INTO `bewertung_attribute` (`bewertung_id`, `attribut_id`) VALUES
(6, 1),
(95, 1),
(22, 2),
(32, 2),
(39, 2),
(95, 3),
(97, 3),
(108, 3),
(8, 4),
(19, 4),
(32, 4),
(56, 4),
(97, 4),
(113, 4),
(4, 6),
(22, 6),
(32, 6),
(39, 6),
(54, 6),
(95, 6),
(106, 6),
(108, 6),
(76, 7);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD PRIMARY KEY (`bewertung_id`,`attribut_id`),
  ADD KEY `attribut_id` (`attribut_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD CONSTRAINT `bewertung_attribute_ibfk_1` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bewertung_attribute_ibfk_2` FOREIGN KEY (`attribut_id`) REFERENCES `attribute` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
