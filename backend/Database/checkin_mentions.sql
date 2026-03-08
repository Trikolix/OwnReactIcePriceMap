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
-- Tabellenstruktur für Tabelle `checkin_mentions`
--

CREATE TABLE `checkin_mentions` (
  `id` bigint UNSIGNED NOT NULL,
  `checkin_id` int DEFAULT NULL,
  `mentioned_user_id` int DEFAULT NULL,
  `status` enum('pending','accepted','declined') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `responded_checkin_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkin_mentions`
--

INSERT INTO `checkin_mentions` (`id`, `checkin_id`, `mentioned_user_id`, `status`, `responded_checkin_id`, `created_at`, `updated_at`) VALUES
(2, 610, 8, 'pending', NULL, '2025-10-02 08:19:50', '2025-10-02 08:19:50'),
(3, 618, 1, 'pending', NULL, '2025-10-03 12:09:27', '2025-10-03 12:09:27'),
(4, 626, 31, 'pending', NULL, '2025-10-04 14:26:52', '2025-10-04 14:26:52'),
(5, 642, 1, 'pending', NULL, '2025-10-10 15:38:28', '2025-10-10 15:38:28'),
(6, 647, 22, 'pending', NULL, '2025-10-11 13:12:06', '2025-10-11 13:12:06'),
(7, 650, 22, 'pending', NULL, '2025-10-12 15:52:42', '2025-10-12 15:52:42'),
(8, 656, 22, 'pending', NULL, '2025-10-14 10:38:43', '2025-10-14 10:38:43'),
(10, 684, 139, 'pending', NULL, '2025-10-24 23:16:03', '2025-10-24 23:16:03'),
(11, 690, 52, 'pending', NULL, '2025-10-27 13:06:48', '2025-10-27 13:06:48'),
(12, 686, 13, 'declined', NULL, '2025-10-29 12:14:15', '2025-10-29 12:15:34'),
(13, 694, 52, 'pending', NULL, '2025-10-30 14:01:17', '2025-10-30 14:01:17'),
(14, 700, 52, 'pending', NULL, '2025-11-01 15:42:07', '2025-11-01 15:42:07');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `checkin_mentions`
--
ALTER TABLE `checkin_mentions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `checkin_id` (`checkin_id`,`mentioned_user_id`),
  ADD KEY `checkin_mention_ibfk_2` (`mentioned_user_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `checkin_mentions`
--
ALTER TABLE `checkin_mentions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `checkin_mentions`
--
ALTER TABLE `checkin_mentions`
  ADD CONSTRAINT `checkin_mention_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `checkin_mention_ibfk_2` FOREIGN KEY (`mentioned_user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
