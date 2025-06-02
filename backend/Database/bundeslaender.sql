-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Jun 2025 um 10:40
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
-- Tabellenstruktur für Tabelle `bundeslaender`
--

CREATE TABLE `bundeslaender` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `iso_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `land_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bundeslaender`
--

INSERT INTO `bundeslaender` (`id`, `name`, `iso_code`, `land_id`) VALUES
(1, 'Thüringen', 'DE-TH', 1),
(2, 'Sachsen-Anhalt', 'DE-ST', 1),
(3, 'Sachsen', 'DE-SN', 1),
(5, 'Brandenburg', 'DE-BB', 1),
(6, 'Nordwesten', NULL, 2),
(7, 'Bayern', 'DE-BY', 1),
(8, 'Lombardei', 'IT-25', 3),
(9, 'Grand Est', 'FR-GES', 4),
(10, 'Okzitanien', 'FR-OCC', 4),
(11, 'Luzern', 'CH-LU', 5),
(12, 'Trentino-Südtirol', 'IT-32', 3),
(13, 'Neu-Görz', 'SI-084', 43),
(14, 'Friaul-Julisch Venetien', 'IT-GO', 3),
(15, 'Hessen', 'DE-HE', 1),
(16, 'Zürich', 'CH-ZH', 5),
(17, 'Baden-Württemberg', 'DE-BW', 1),
(18, 'Berlin', 'DE-BE', 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `fk_country_id` (`land_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  ADD CONSTRAINT `fk_country_id` FOREIGN KEY (`land_id`) REFERENCES `laender` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
