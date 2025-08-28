-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:24
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
-- Tabellenstruktur für Tabelle `challenges`
--

CREATE TABLE `challenges` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `type` enum('daily','weekly') COLLATE utf8mb4_general_ci NOT NULL,
  `difficulty` enum('leicht','mittel','schwer') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `valid_until` datetime NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `challenges`
--

INSERT INTO `challenges` (`id`, `nutzer_id`, `eisdiele_id`, `type`, `difficulty`, `created_at`, `valid_until`, `completed`, `completed_at`) VALUES
(1, 1, 179, 'daily', 'schwer', '2025-08-24 11:32:17', '2025-08-24 23:59:59', 1, '2025-08-24 12:39:18'),
(2, 1, 16, 'daily', 'leicht', '2025-08-24 18:52:31', '2025-08-25 23:59:59', 0, NULL),
(3, 1, 76, 'weekly', 'schwer', '2025-08-24 18:53:11', '2025-08-24 23:59:59', 0, NULL),
(4, 1, 202, 'weekly', 'mittel', '2025-08-24 18:58:20', '2025-08-31 23:59:59', 0, NULL),
(5, 1, 8, 'weekly', 'schwer', '2025-08-25 20:31:23', '2025-08-31 23:59:59', 0, NULL),
(6, 1, 52, 'daily', 'schwer', '2025-08-25 20:31:34', '2025-08-26 23:59:59', 0, NULL),
(7, 1, 38, 'daily', 'schwer', '2025-08-27 03:59:01', '2025-08-27 23:59:59', 0, NULL),
(8, 1, 393, 'daily', 'mittel', '2025-08-27 03:59:31', '2025-08-27 23:59:59', 0, NULL),
(9, 1, 115, 'weekly', 'leicht', '2025-08-27 12:33:59', '2025-08-31 23:59:59', 0, NULL),
(10, 1, 165, 'daily', 'leicht', '2025-08-27 12:34:13', '2025-08-27 23:59:59', 0, NULL),
(11, 1, 112, 'daily', 'leicht', '2025-08-28 01:43:21', '2025-08-28 23:59:59', 0, NULL),
(12, 1, 60, 'daily', 'mittel', '2025-08-28 01:43:52', '2025-08-28 23:59:59', 0, NULL),
(13, 1, 82, 'daily', 'schwer', '2025-08-28 01:44:21', '2025-08-28 23:59:59', 0, NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
