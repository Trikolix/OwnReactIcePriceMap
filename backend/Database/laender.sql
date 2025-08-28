-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:25
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
-- Tabellenstruktur für Tabelle `laender`
--

CREATE TABLE `laender` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `waehrung_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `laender`
--

INSERT INTO `laender` (`id`, `name`, `country_code`, `waehrung_id`) VALUES
(1, 'Deutschland', 'de', 1),
(2, 'Tschechien', 'cz', 2),
(3, 'Italien', 'it', 1),
(4, 'Frankreich', 'fr', 1),
(5, 'Schweiz', 'ch', 3),
(6, 'Albanien', 'al', 4),
(7, 'Andorra', 'ad', 1),
(8, 'Armenien', 'am', 5),
(9, 'Aserbaidschan', 'az', 6),
(10, 'Belgien', 'be', 1),
(11, 'Bosnien und Herzegowina', 'ba', 7),
(12, 'Bulgarien', 'bg', 8),
(13, 'Dänemark', 'dk', 9),
(14, 'Estland', 'ee', 1),
(15, 'Finnland', 'fi', 1),
(16, 'Georgien', 'ge', 10),
(17, 'Griechenland', 'gr', 1),
(18, 'Irland', 'ie', 1),
(19, 'Island', 'is', 11),
(20, 'Kasachstan', 'kz', 12),
(21, 'Kosovo', 'xk', 1),
(22, 'Kroatien', 'hr', 26),
(23, 'Lettland', 'lv', 1),
(24, 'Liechtenstein', 'li', 3),
(25, 'Litauen', 'lt', 1),
(26, 'Luxemburg', 'lu', 1),
(27, 'Malta', 'mt', 1),
(28, 'Moldau', 'md', 13),
(29, 'Monaco', 'mc', 1),
(30, 'Montenegro', 'me', 1),
(31, 'Niederlande', 'nl', 1),
(32, 'Nordmazedonien', 'mk', 14),
(33, 'Norwegen', 'no', 15),
(34, 'Österreich', 'at', 1),
(35, 'Polen', 'pl', 16),
(36, 'Portugal', 'pt', 1),
(37, 'Rumänien', 'ro', 17),
(38, 'Russland', 'ru', 18),
(39, 'San Marino', 'sm', 1),
(40, 'Schweden', 'se', 19),
(41, 'Serbien', 'rs', 20),
(42, 'Slowakei', 'sk', 1),
(43, 'Slowenien', 'si', 1),
(44, 'Spanien', 'es', 1),
(45, 'Ukraine', 'ua', 21),
(46, 'Ungarn', 'hu', 22),
(47, 'Vatikanstadt', 'va', 1),
(48, 'Vereinigtes Königreich', 'gb', 23),
(49, 'Weißrussland', 'by', 24),
(50, 'Zypern', 'cy', 1),
(51, 'Israel', 'il', 27),
(52, 'Vereinigte Staaten von Amerika', 'us', 25);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `laender`
--
ALTER TABLE `laender`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `fk_laender_waehrung` (`waehrung_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `laender`
--
ALTER TABLE `laender`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `laender`
--
ALTER TABLE `laender`
  ADD CONSTRAINT `fk_laender_waehrung` FOREIGN KEY (`waehrung_id`) REFERENCES `waehrungen` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
