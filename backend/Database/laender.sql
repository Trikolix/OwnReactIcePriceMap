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
-- Tabellenstruktur für Tabelle `laender`
--

CREATE TABLE `laender` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `laender`
--

INSERT INTO `laender` (`id`, `name`, `country_code`) VALUES
(1, 'Deutschland', 'de'),
(2, 'Tschechien', 'cz'),
(3, 'Italien', 'it'),
(4, 'Frankreich', 'fr'),
(5, 'Schweiz', 'ch'),
(6, 'Albanien', 'al'),
(7, 'Andorra', 'ad'),
(8, 'Armenien', 'am'),
(9, 'Aserbaidschan', 'az'),
(10, 'Belgien', 'be'),
(11, 'Bosnien und Herzegowina', 'ba'),
(12, 'Bulgarien', 'bg'),
(13, 'Dänemark', 'dk'),
(14, 'Estland', 'ee'),
(15, 'Finnland', 'fi'),
(16, 'Georgien', 'ge'),
(17, 'Griechenland', 'gr'),
(18, 'Irland', 'ie'),
(19, 'Island', 'is'),
(20, 'Kasachstan', 'kz'),
(21, 'Kosovo', 'xk'),
(22, 'Kroatien', 'hr'),
(23, 'Lettland', 'lv'),
(24, 'Liechtenstein', 'li'),
(25, 'Litauen', 'lt'),
(26, 'Luxemburg', 'lu'),
(27, 'Malta', 'mt'),
(28, 'Moldau', 'md'),
(29, 'Monaco', 'mc'),
(30, 'Montenegro', 'me'),
(31, 'Niederlande', 'nl'),
(32, 'Nordmazedonien', 'mk'),
(33, 'Norwegen', 'no'),
(34, 'Österreich', 'at'),
(35, 'Polen', 'pl'),
(36, 'Portugal', 'pt'),
(37, 'Rumänien', 'ro'),
(38, 'Russland', 'ru'),
(39, 'San Marino', 'sm'),
(40, 'Schweden', 'se'),
(41, 'Serbien', 'rs'),
(42, 'Slowakei', 'sk'),
(43, 'Slowenien', 'si'),
(44, 'Spanien', 'es'),
(45, 'Ukraine', 'ua'),
(46, 'Ungarn', 'hu'),
(47, 'Vatikanstadt', 'va'),
(48, 'Vereinigtes Königreich', 'gb'),
(49, 'Weißrussland', 'by');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `laender`
--
ALTER TABLE `laender`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `laender`
--
ALTER TABLE `laender`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
