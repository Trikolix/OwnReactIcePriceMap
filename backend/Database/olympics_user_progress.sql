-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 24. Feb 2026 um 20:56
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
(1, 524, 17, '2026-02-22', '2026-02-23 05:47:26'),
(2, 12, 1, '2026-02-06', '2026-02-06 09:39:06'),
(4, 55, 5, '2026-02-22', '2026-02-22 22:51:33'),
(8, 91, 8, '2026-02-21', '2026-02-23 12:46:43'),
(19, 95, 15, '2026-02-21', '2026-02-23 20:58:52'),
(22, 236, 8, '2026-02-20', '2026-02-20 18:24:44'),
(23, 14, 2, '2026-02-07', '2026-02-07 11:24:31'),
(31, 96, 8, '2026-02-22', '2026-02-21 23:22:38'),
(40, 91, 8, '2026-02-19', '2026-02-19 11:13:11'),
(48, 393, 14, '2026-02-22', '2026-02-22 15:59:42'),
(51, 24, 2, '2026-02-22', '2026-02-23 09:10:14'),
(52, 14, 2, '2026-02-08', '2026-02-08 08:09:10'),
(53, 700, 15, '2026-02-22', '2026-02-23 17:48:08'),
(63, 80, 5, '2026-02-14', '2026-02-14 08:37:02'),
(98, 52, 1, '2026-02-21', '2026-02-21 13:57:20'),
(99, 41, 3, '2026-02-15', '2026-02-15 11:37:50'),
(106, 7, 1, '2026-02-07', '2026-02-07 08:36:42'),
(118, 42, 1, '2026-02-19', '2026-02-19 21:10:47'),
(125, 60, 5, '2026-02-22', '2026-02-22 17:20:41'),
(139, 24, 2, '2026-02-09', '2026-02-09 13:53:10'),
(148, 46, 3, '2026-02-08', '2026-02-08 07:42:01'),
(149, 27, 1, '2026-02-08', '2026-02-08 04:40:41'),
(150, 22, 1, '2026-02-11', '2026-02-11 13:22:08'),
(151, 9, 2, '2026-02-21', '2026-02-21 14:55:16'),
(153, 12, 1, '2026-02-19', '2026-02-19 20:37:03'),
(154, 0, 0, NULL, '2026-02-23 11:39:15'),
(155, 0, 0, NULL, '2026-02-23 11:39:48');

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
