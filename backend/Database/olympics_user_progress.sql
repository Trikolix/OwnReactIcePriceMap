-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 07. Feb 2026 um 10:57
-- Server-Version: 8.0.44
-- PHP-Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `k320202_iceapp`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `olympics_user_progress`
--

CREATE TABLE `olympics_user_progress` (
  `user_id` int NOT NULL,
  `total_xp` int NOT NULL DEFAULT '0',
  `login_days` int NOT NULL DEFAULT '0',
  `last_login_date` date DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `olympics_user_progress`
--

INSERT INTO `olympics_user_progress` (`user_id`, `total_xp`, `login_days`, `last_login_date`, `updated_at`) VALUES
(1, 29, 2, '2026-02-07', '2026-02-07 05:24:06'),
(2, 12, 1, '2026-02-06', '2026-02-06 09:39:06'),
(4, 22, 1, '2026-02-07', '2026-02-07 09:09:59'),
(8, 12, 1, '2026-02-07', '2026-02-07 06:04:17'),
(19, 24, 2, '2026-02-07', '2026-02-07 01:06:56'),
(22, 12, 1, '2026-02-06', '2026-02-06 19:49:49'),
(23, 12, 1, '2026-02-06', '2026-02-06 08:55:44'),
(31, 12, 1, '2026-02-06', '2026-02-06 21:41:40'),
(40, 7, 1, '2026-02-06', '2026-02-06 09:44:30'),
(48, 12, 1, '2026-02-06', '2026-02-06 11:00:06'),
(52, 7, 1, '2026-02-07', '2026-02-07 00:52:07'),
(53, 24, 2, '2026-02-07', '2026-02-07 08:31:34'),
(106, 7, 1, '2026-02-07', '2026-02-07 08:36:42'),
(125, 24, 2, '2026-02-07', '2026-02-07 09:28:38'),
(148, 42, 1, '2026-02-06', '2026-02-06 20:15:26');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `olympics_user_progress`
--
ALTER TABLE `olympics_user_progress`
  ADD PRIMARY KEY (`user_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `olympics_user_progress`
--
ALTER TABLE `olympics_user_progress`
  ADD CONSTRAINT `olympics_user_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
