-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 26. Aug 2025 um 12:47
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
-- Tabellenstruktur für Tabelle `wechselkurse`
--

CREATE TABLE `wechselkurse` (
  `id` int NOT NULL,
  `von_waehrung_id` int NOT NULL,
  `zu_waehrung_id` int NOT NULL,
  `kurs` decimal(10,6) NOT NULL,
  `aktualisiert_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `wechselkurse`
--

INSERT INTO `wechselkurse` (`id`, `von_waehrung_id`, `zu_waehrung_id`, `kurs`, `aktualisiert_am`) VALUES
(1, 1, 4, '97.159402', '2025-08-26 10:38:25'),
(2, 4, 1, '0.010292', '2025-08-26 10:38:25'),
(3, 1, 5, '446.164306', '2025-08-26 10:38:25'),
(4, 5, 1, '0.002241', '2025-08-26 10:38:25'),
(5, 1, 6, '1.985085', '2025-08-26 10:38:25'),
(6, 6, 1, '0.503757', '2025-08-26 10:38:25'),
(7, 1, 7, '1.954330', '2025-08-26 10:38:25'),
(8, 7, 1, '0.511684', '2025-08-26 10:38:25'),
(9, 1, 8, '1.957233', '2025-08-26 10:38:25'),
(10, 8, 1, '0.510925', '2025-08-26 10:38:25'),
(11, 1, 24, '3.948263', '2025-08-26 10:38:25'),
(12, 24, 1, '0.253276', '2025-08-26 10:38:25'),
(13, 1, 3, '0.938488', '2025-08-26 10:38:25'),
(14, 3, 1, '1.065544', '2025-08-26 10:38:25'),
(15, 1, 2, '24.543486', '2025-08-26 10:38:25'),
(16, 2, 1, '0.040744', '2025-08-26 10:38:25'),
(17, 1, 9, '7.464645', '2025-08-26 10:38:25'),
(18, 9, 1, '0.133965', '2025-08-26 10:38:25'),
(19, 1, 23, '0.863834', '2025-08-26 10:38:25'),
(20, 23, 1, '1.157630', '2025-08-26 10:38:25'),
(21, 1, 10, '3.136750', '2025-08-26 10:38:25'),
(22, 10, 1, '0.318801', '2025-08-26 10:38:25'),
(23, 1, 22, '396.872651', '2025-08-26 10:38:25'),
(24, 22, 1, '0.002520', '2025-08-26 10:38:25'),
(25, 1, 11, '143.196792', '2025-08-26 10:38:25'),
(26, 11, 1, '0.006983', '2025-08-26 10:38:25'),
(27, 1, 12, '625.304893', '2025-08-26 10:38:25'),
(28, 12, 1, '0.001599', '2025-08-26 10:38:25'),
(29, 1, 13, '19.527811', '2025-08-26 10:38:25'),
(30, 13, 1, '0.051209', '2025-08-26 10:38:25'),
(31, 1, 14, '61.493732', '2025-08-26 10:38:25'),
(32, 14, 1, '0.016262', '2025-08-26 10:38:25'),
(33, 1, 15, '11.838916', '2025-08-26 10:38:25'),
(34, 15, 1, '0.084467', '2025-08-26 10:38:25'),
(35, 1, 16, '4.262900', '2025-08-26 10:38:25'),
(36, 16, 1, '0.234582', '2025-08-26 10:38:25'),
(37, 1, 17, '5.054763', '2025-08-26 10:38:25'),
(38, 17, 1, '0.197833', '2025-08-26 10:38:25'),
(39, 1, 20, '117.186324', '2025-08-26 10:38:25'),
(40, 20, 1, '0.008533', '2025-08-26 10:38:25'),
(41, 1, 18, '93.630435', '2025-08-26 10:38:25'),
(42, 18, 1, '0.010680', '2025-08-26 10:38:25'),
(43, 1, 19, '11.165785', '2025-08-26 10:38:25'),
(44, 19, 1, '0.089559', '2025-08-26 10:38:25'),
(45, 1, 21, '48.447581', '2025-08-26 10:38:25'),
(46, 21, 1, '0.020641', '2025-08-26 10:38:25');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `wechselkurse`
--
ALTER TABLE `wechselkurse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_waehrungspaar` (`von_waehrung_id`,`zu_waehrung_id`),
  ADD KEY `fk_wechselkurs_von` (`von_waehrung_id`),
  ADD KEY `fk_wechselkurs_zu` (`zu_waehrung_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `wechselkurse`
--
ALTER TABLE `wechselkurse`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `wechselkurse`
--
ALTER TABLE `wechselkurse`
  ADD CONSTRAINT `fk_wechselkurs_von` FOREIGN KEY (`von_waehrung_id`) REFERENCES `waehrungen` (`id`),
  ADD CONSTRAINT `fk_wechselkurs_zu` FOREIGN KEY (`zu_waehrung_id`) REFERENCES `waehrungen` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
