-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 13. Mai 2025 um 07:42
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
-- Tabellenstruktur für Tabelle `user_awards`
--

CREATE TABLE `user_awards` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `award_id` int NOT NULL,
  `level` int NOT NULL,
  `awarded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `user_awards`
--

INSERT INTO `user_awards` (`id`, `user_id`, `award_id`, `level`, `awarded_at`) VALUES
(43, 1, 1, 1, '2025-04-24 13:13:59'),
(44, 1, 1, 2, '2025-04-24 13:13:59'),
(47, 1, 6, 1, '2025-04-24 13:13:59'),
(48, 1, 6, 2, '2025-04-24 13:13:59'),
(49, 1, 6, 3, '2025-04-24 13:13:59'),
(50, 1, 3, 1, '2025-04-25 06:02:39'),
(51, 1, 3, 2, '2025-04-25 06:02:39'),
(52, 1, 8, 1, '2025-04-26 00:10:32'),
(53, 1, 8, 2, '2025-04-26 00:10:32'),
(54, 1, 8, 3, '2025-04-26 00:10:32'),
(55, 1, 8, 4, '2025-04-26 00:10:32'),
(56, 1, 8, 5, '2025-04-26 00:10:32'),
(57, 1, 1, 3, '2025-04-26 11:13:39'),
(58, 1, 2, 1, '2025-04-26 11:13:39'),
(59, 1, 2, 2, '2025-04-26 11:13:39'),
(60, 1, 2, 3, '2025-04-26 11:13:39'),
(61, 1, 2, 4, '2025-04-26 11:13:39'),
(62, 1, 2, 5, '2025-04-26 11:13:39'),
(63, 1, 4, 1, '2025-04-27 12:13:59'),
(64, 2, 8, 1, '2025-04-27 15:31:05'),
(65, 2, 2, 1, '2025-04-27 15:45:25'),
(66, 2, 6, 1, '2025-04-27 15:45:25'),
(67, 4, 8, 1, '2025-04-27 17:39:26'),
(68, 7, 8, 1, '2025-04-27 19:11:41'),
(69, 7, 2, 1, '2025-04-27 19:19:09'),
(70, 7, 4, 1, '2025-04-27 19:19:09'),
(71, 3, 2, 1, '2025-04-27 19:41:16'),
(72, 1, 12, 1, '2025-04-30 15:14:18'),
(73, 1, 12, 2, '2025-05-01 15:03:53'),
(74, 1, 11, 1, '2025-05-01 15:03:53'),
(75, 10, 8, 1, '2025-05-01 17:30:30'),
(76, 7, 6, 1, '2025-05-01 19:12:06'),
(77, 2, 4, 1, '2025-05-02 04:55:21'),
(79, 1, 4, 2, '2025-05-02 10:28:16'),
(80, 1, 10, 1, '2025-05-02 11:16:02'),
(81, 2, 1, 1, '2025-05-02 13:06:45'),
(82, 2, 2, 2, '2025-05-02 13:06:45'),
(83, 1, 5, 1, '2025-05-04 08:19:38'),
(85, 9, 2, 1, '2025-05-04 14:43:12'),
(86, 9, 5, 1, '2025-05-04 14:43:12'),
(87, 4, 2, 1, '2025-05-04 17:42:34'),
(88, 4, 2, 2, '2025-05-04 17:42:34'),
(89, 4, 6, 1, '2025-05-04 17:42:34'),
(90, 4, 5, 1, '2025-05-04 17:42:34'),
(94, 5, 2, 1, '2025-05-05 09:23:28'),
(95, 5, 6, 1, '2025-05-05 09:23:28'),
(96, 5, 5, 1, '2025-05-05 09:23:28'),
(97, 5, 8, 1, '2025-05-05 09:38:28'),
(99, 1, 9, 1, '2025-05-06 09:21:20'),
(103, 2, 4, 2, '2025-05-09 14:17:37'),
(104, 1, 13, 1, '2025-05-02 16:08:15'),
(105, 1, 13, 2, '2025-05-02 16:16:44'),
(106, 1, 13, 3, '2025-05-02 16:16:51'),
(107, 1, 13, 4, '2025-05-02 16:16:57'),
(116, 1, 15, 1, '2025-05-09 19:19:07'),
(117, 1, 15, 2, '2025-05-09 19:19:07'),
(118, 1, 15, 3, '2025-05-09 19:19:07'),
(119, 1, 16, 1, '2025-05-09 19:19:07'),
(120, 2, 2, 3, '2025-05-10 13:27:21'),
(121, 11, 8, 1, '2025-05-10 15:43:42'),
(122, 11, 2, 1, '2025-05-05 15:44:43'),
(123, 4, 9, 1, '2025-05-10 16:30:35'),
(124, 4, 4, 1, '2025-05-10 16:30:35'),
(125, 11, 6, 1, '2025-05-10 18:57:30'),
(126, 11, 1, 1, '2025-05-10 18:59:12'),
(127, 11, 2, 2, '2025-05-10 18:59:12'),
(128, 11, 13, 1, '2025-05-10 18:59:12'),
(129, 1, 19, 2, '2025-05-12 12:00:22'),
(130, 23, 2, 1, '2025-05-12 20:16:37'),
(131, 23, 4, 1, '2025-05-12 20:16:37');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`award_id`,`level`),
  ADD KEY `award_id` (`award_id`,`level`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD CONSTRAINT `user_awards_ibfk_1` FOREIGN KEY (`award_id`,`level`) REFERENCES `award_levels` (`award_id`, `level`),
  ADD CONSTRAINT `user_awards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
