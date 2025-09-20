-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:24
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
-- Tabellenstruktur für Tabelle `user_qr_scans`
--

CREATE TABLE `user_qr_scans` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` int DEFAULT NULL,
  `qr_code_id` bigint UNSIGNED DEFAULT NULL,
  `scanned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `user_qr_scans`
--

INSERT INTO `user_qr_scans` (`id`, `user_id`, `qr_code_id`, `scanned_at`) VALUES
(1, 1, 1, '2025-07-30 09:25:50'),
(2, 101, 1, '2025-08-01 16:43:31'),
(3, 103, 1, '2025-08-02 05:27:16'),
(4, 108, 1, '2025-08-04 08:32:38'),
(5, 111, 1, '2025-08-05 14:45:49'),
(6, 1, 2, '2025-08-07 10:49:22'),
(7, 1, 3, '2025-08-07 10:53:47'),
(8, 1, 5, '2025-09-02 07:24:36');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `user_qr_scans`
--
ALTER TABLE `user_qr_scans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`qr_code_id`),
  ADD KEY `fk_user_qr_scans_qr_code` (`qr_code_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `user_qr_scans`
--
ALTER TABLE `user_qr_scans`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `user_qr_scans`
--
ALTER TABLE `user_qr_scans`
  ADD CONSTRAINT `fk_user_qr_scans_qr_code` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
