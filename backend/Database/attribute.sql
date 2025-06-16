-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:25
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
-- Tabellenstruktur für Tabelle `attribute`
--

CREATE TABLE `attribute` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `attribute`
--

INSERT INTO `attribute` (`id`, `name`) VALUES
(4, 'ausgefallene Sorten'),
(17, 'Bio'),
(16, 'BubbleTea'),
(10, 'Bubblewaffles'),
(8, 'Eis zum Mitnehmen '),
(21, 'Eisautomat'),
(3, 'Eisbecher im Angebot'),
(19, 'Freibad'),
(22, 'Gaststätte '),
(12, 'Gebrannte Mandeln '),
(7, 'guter Kaffee '),
(15, 'Hundeeis'),
(20, 'Imbiss'),
(14, 'Italienisch '),
(6, 'schöner Außenbereich'),
(18, 'Selbstbedienung '),
(13, 'Slush'),
(9, 'Softeis'),
(11, 'sonstige Verpflegung'),
(2, 'tolle Lage'),
(1, 'vegane Optionen'),
(5, 'wechselndes Angebot');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `attribute`
--
ALTER TABLE `attribute`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `attribute`
--
ALTER TABLE `attribute`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
