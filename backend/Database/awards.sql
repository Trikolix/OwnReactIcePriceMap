-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 13. Mai 2025 um 07:39
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
-- Tabellenstruktur für Tabelle `awards`
--

CREATE TABLE `awards` (
  `id` int NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `awards`
--

INSERT INTO `awards` (`id`, `code`, `category`, `created_at`) VALUES
(1, 'county_visit', 'Eisdielen in verschiedenen Landkreisen', '2025-04-23 09:49:27'),
(2, 'checkin_count', 'Anzahl an Checkins', '2025-04-23 11:42:00'),
(3, 'count_kugeleis', 'Anzahl gegessener Kugeln Eis', '2025-04-23 11:42:44'),
(4, 'count_softice', 'Anzahl gegessener Softeis', '2025-04-23 11:42:58'),
(5, 'count_sundea', 'Anzahl gegessener Eisbecher', '2025-04-23 11:43:12'),
(6, 'count_photos', 'Anzahl an Checkins mit Foto', '2025-04-23 11:43:46'),
(7, 'count_pricesubmit', 'Anzahl Preismeldungen', '2025-04-24 09:26:22'),
(8, 'count_iceshopsubmit', 'Anzahl eingetragener Eisdielen', '2025-04-24 09:32:56'),
(9, 'all_ice_types', 'Jede Form von Eis ist wunderbar!', '2025-04-25 01:35:21'),
(10, 'Fuerst_pueckler', 'Vanille, Erdbeer und Schoko Eis eingecheckt ', '2025-04-25 01:46:35'),
(11, 'perfect_week', '7 Tage lang jeden Tag Eis eingecheckt ', '2025-04-25 02:04:56'),
(12, 'bundesland_count', 'Eisdielen in verschiedenen Bundesländern', '2025-04-25 04:48:25'),
(13, 'day_streak', 'Anzahl besuchter Eisdielen an einem tag', '2025-05-04 18:22:58'),
(14, 'distance_ice_traveler', '2 Eisdielen - 100km Entfernung an einem Tag', '2025-05-07 18:53:11'),
(15, 'Route_creator', 'Erstelle öffentliche Routen', '2025-05-07 19:40:15'),
(16, 'private_route_creator', 'Private Routen erstellt', '2025-05-08 12:30:37'),
(17, 'Stammkunde', 'Anzahl bei gleicher Eisdiele eingecheckt', '2025-05-09 09:22:54'),
(18, 'Geschmackstreue', 'Anzahl eine Eissorte gegessen', '2025-05-09 09:27:44'),
(19, 'laender_besucht', 'Eis in bestimmten Ländern eingecheckt', '2025-05-10 11:32:23');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `awards`
--
ALTER TABLE `awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
