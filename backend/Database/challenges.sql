-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 05. Nov 2025 um 08:17
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
  `completed_at` timestamp NULL DEFAULT NULL,
  `recreated` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `challenges`
--

INSERT INTO `challenges` (`id`, `nutzer_id`, `eisdiele_id`, `type`, `difficulty`, `created_at`, `valid_until`, `completed`, `completed_at`, `recreated`) VALUES
(1, 1, 179, 'daily', 'schwer', '2025-08-24 11:32:17', '2025-08-24 23:59:59', 1, '2025-08-24 12:39:18', 0),
(17, 1, 5, 'weekly', 'leicht', '2025-09-01 19:05:24', '2025-09-07 23:59:59', 1, '2025-09-03 14:53:41', 0),
(35, 1, 145, 'daily', 'mittel', '2025-09-06 06:34:41', '2025-09-06 23:59:59', 1, '2025-09-06 11:39:53', 0),
(38, 1, 2, 'weekly', 'leicht', '2025-09-14 11:55:33', '2025-09-21 23:59:59', 1, '2025-09-18 14:12:03', 0),
(39, 1, 59, 'weekly', 'mittel', '2025-09-14 11:55:39', '2025-09-21 23:59:59', 1, '2025-09-19 12:08:13', 0),
(53, 1, 87, 'daily', 'mittel', '2025-09-18 02:19:11', '2025-09-18 23:59:59', 1, '2025-09-18 12:20:55', 0),
(97, 1, 21, 'daily', 'mittel', '2025-10-02 01:39:30', '2025-10-02 23:59:59', 1, '2025-10-02 12:48:20', 0),
(116, 1, 517, 'weekly', 'schwer', '2025-10-11 15:23:06', '2025-10-12 23:59:59', 1, '2025-10-12 19:08:58', 0),
(120, 1, 523, 'daily', 'leicht', '2025-10-14 05:24:19', '2025-10-14 23:59:59', 1, '2025-10-14 10:38:43', 0),
(132, 1, 22, 'daily', 'schwer', '2025-10-19 08:17:03', '2025-10-19 23:59:59', 1, '2025-10-19 13:22:51', 0),
(161, 1, 170, 'daily', 'leicht', '2025-10-31 05:22:57', '2025-10-31 23:59:59', 1, '2025-10-31 14:20:48', 0),
(173, 1, 2, 'weekly', 'leicht', '2025-11-03 10:13:58', '2025-11-09 23:59:59', 0, NULL, 0),
(174, 1, 59, 'weekly', 'mittel', '2025-11-03 10:14:02', '2025-11-09 23:59:59', 0, NULL, 0),
(175, 1, 30, 'weekly', 'schwer', '2025-11-03 10:14:06', '2025-11-09 23:59:59', 0, NULL, 1),
(176, 1, 117, 'daily', 'leicht', '2025-11-04 03:37:26', '2025-11-04 23:59:59', 0, NULL, 0),
(177, 1, 92, 'daily', 'mittel', '2025-11-04 03:37:29', '2025-11-04 23:59:59', 0, NULL, 0),
(178, 1, 67, 'daily', 'schwer', '2025-11-04 03:37:32', '2025-11-04 23:59:59', 0, NULL, 0),
(179, 1, 165, 'daily', 'leicht', '2025-11-05 02:54:06', '2025-11-05 23:59:59', 0, NULL, 1),
(180, 1, 19, 'daily', 'mittel', '2025-11-05 02:54:12', '2025-11-05 23:59:59', 0, NULL, 1),
(181, 1, 116, 'daily', 'schwer', '2025-11-05 02:54:22', '2025-11-05 23:59:59', 0, NULL, 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `challenges_ibfk_1` (`eisdiele_id`),
  ADD KEY `challenges_ibfk_2` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=182;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `challenges_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
