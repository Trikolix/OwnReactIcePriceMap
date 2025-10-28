-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Okt 2025 um 06:53
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
-- Tabellenstruktur für Tabelle `checkin_groups`
--

CREATE TABLE `checkin_groups` (
  `id` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkin_groups`
--

INSERT INTO `checkin_groups` (`id`, `created_at`) VALUES
(1, '2025-10-02 08:14:14'),
(3, '2025-10-03 12:09:27'),
(4, '2025-10-04 14:26:52'),
(5, '2025-10-10 15:38:28'),
(6, '2025-10-11 13:12:06'),
(7, '2025-10-12 15:52:42'),
(8, '2025-10-14 10:38:43'),
(9, '2025-10-22 12:18:23'),
(10, '2025-10-24 23:16:03'),
(11, '2025-10-27 13:06:48'),
(12, '2025-10-25 16:19:20');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `checkin_groups`
--
ALTER TABLE `checkin_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `checkin_groups`
--
ALTER TABLE `checkin_groups`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
