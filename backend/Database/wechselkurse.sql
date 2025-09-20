-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:25
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
(1, 1, 4, '97.212725', '2025-08-26 11:00:12'),
(2, 4, 1, '0.010287', '2025-08-26 11:00:12'),
(3, 1, 5, '446.409170', '2025-08-26 11:00:12'),
(4, 5, 1, '0.002240', '2025-08-26 11:00:12'),
(5, 1, 6, '1.979110', '2025-08-26 11:00:12'),
(6, 6, 1, '0.505278', '2025-08-26 11:00:12'),
(7, 1, 7, '1.955402', '2025-08-26 11:00:12'),
(8, 7, 1, '0.511404', '2025-08-26 11:00:12'),
(9, 1, 8, '1.958300', '2025-08-26 11:00:12'),
(10, 8, 1, '0.510647', '2025-08-26 11:00:12'),
(11, 1, 24, '3.950430', '2025-08-26 11:00:12'),
(12, 24, 1, '0.253137', '2025-08-26 11:00:12'),
(13, 1, 3, '0.938396', '2025-08-26 11:00:12'),
(14, 3, 1, '1.065648', '2025-08-26 11:00:12'),
(15, 1, 2, '24.538763', '2025-08-26 11:00:12'),
(16, 2, 1, '0.040752', '2025-08-26 11:00:12'),
(17, 1, 9, '7.463935', '2025-08-26 11:00:12'),
(18, 9, 1, '0.133978', '2025-08-26 11:00:12'),
(19, 1, 23, '0.863959', '2025-08-26 11:00:12'),
(20, 23, 1, '1.157462', '2025-08-26 11:00:12'),
(21, 1, 10, '3.138479', '2025-08-26 11:00:12'),
(22, 10, 1, '0.318626', '2025-08-26 11:00:12'),
(23, 1, 22, '396.944312', '2025-08-26 11:00:12'),
(24, 22, 1, '0.002519', '2025-08-26 11:00:12'),
(25, 1, 11, '143.204923', '2025-08-26 11:00:12'),
(26, 11, 1, '0.006983', '2025-08-26 11:00:12'),
(27, 1, 12, '625.648073', '2025-08-26 11:00:12'),
(28, 12, 1, '0.001598', '2025-08-26 11:00:12'),
(29, 1, 13, '19.538528', '2025-08-26 11:00:12'),
(30, 13, 1, '0.051181', '2025-08-26 11:00:12'),
(31, 1, 14, '61.527481', '2025-08-26 11:00:12'),
(32, 14, 1, '0.016253', '2025-08-26 11:00:12'),
(33, 1, 15, '11.844681', '2025-08-26 11:00:12'),
(34, 15, 1, '0.084426', '2025-08-26 11:00:12'),
(35, 1, 16, '4.261821', '2025-08-26 11:00:12'),
(36, 16, 1, '0.234641', '2025-08-26 11:00:12'),
(37, 1, 17, '5.055787', '2025-08-26 11:00:12'),
(38, 17, 1, '0.197793', '2025-08-26 11:00:12'),
(39, 1, 20, '117.131942', '2025-08-26 11:00:12'),
(40, 20, 1, '0.008537', '2025-08-26 11:00:12'),
(41, 1, 18, '93.687854', '2025-08-26 11:00:12'),
(42, 18, 1, '0.010674', '2025-08-26 11:00:12'),
(43, 1, 19, '11.162992', '2025-08-26 11:00:12'),
(44, 19, 1, '0.089582', '2025-08-26 11:00:12'),
(45, 1, 21, '48.474170', '2025-08-26 11:00:12'),
(46, 21, 1, '0.020630', '2025-08-26 11:00:12'),
(69, 1, 26, '7.538499', '2025-08-26 11:00:12'),
(70, 26, 1, '0.132652', '2025-08-26 11:00:12'),
(73, 1, 27, '3.921749', '2025-08-26 11:00:12'),
(74, 27, 1, '0.254988', '2025-08-26 11:00:12'),
(97, 1, 25, '1.164553', '2025-08-26 11:00:12'),
(98, 25, 1, '0.858699', '2025-08-26 11:00:12');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

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
