-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:21
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
(17, 1, 5, 'weekly', 'leicht', '2025-09-01 19:05:24', '2025-09-07 23:59:59', 0, NULL),
(18, 1, 202, 'weekly', 'mittel', '2025-09-01 19:05:45', '2025-09-07 23:59:59', 0, NULL),
(19, 1, 239, 'weekly', 'schwer', '2025-09-01 19:05:49', '2025-09-07 23:59:59', 0, NULL),
(20, 1, 412, 'daily', 'schwer', '2025-09-01 19:06:00', '2025-09-02 23:59:59', 0, NULL),
(21, 1, 28, 'daily', 'mittel', '2025-09-01 19:06:04', '2025-09-02 23:59:59', 0, NULL),
(22, 1, 99, 'daily', 'leicht', '2025-09-01 19:06:08', '2025-09-02 23:59:59', 0, NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
