-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:13
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
-- Tabellenstruktur für Tabelle `preise`
--

CREATE TABLE `preise` (
  `id` int NOT NULL,
  `eisdiele_id` int DEFAULT NULL,
  `typ` enum('kugel','softeis') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `preis` decimal(5,2) DEFAULT NULL,
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `gemeldet_von` int DEFAULT NULL,
  `gemeldet_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `preise`
--

INSERT INTO `preise` (`id`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_von`, `gemeldet_am`) VALUES
(1, 3, 'kugel', '1.60', NULL, 1, '2025-03-14 06:12:04'),
(2, 11, 'kugel', '1.40', NULL, 1, '2024-02-01 06:44:12'),
(4, 5, 'kugel', '2.00', NULL, 1, '2025-03-18 15:58:59'),
(5, 1, 'kugel', '1.60', 'Premiumsorten 1,80€', 1, '2024-04-01 07:29:38'),
(6, 1, 'softeis', '1.80', 'Großes Softeis 3,00€', 1, '2024-04-01 07:30:20'),
(7, 16, 'kugel', '1.50', 'Premiumsorten - 2.00€', 1, '2025-03-15 05:05:28'),
(8, 17, 'kugel', '2.00', NULL, 1, '2025-03-15 05:05:28'),
(9, 18, 'kugel', '2.00', NULL, 1, '2025-03-16 09:51:22'),
(10, 21, 'kugel', '1.70', NULL, 1, '2025-03-16 16:21:45'),
(11, 21, 'softeis', '2.50', 'kleines Softeis - 2.50€\r\ngroßes Softeis - 3.00 €', 1, '2025-03-16 16:21:45'),
(12, 22, 'kugel', '1.20', NULL, 1, '2024-03-01 06:47:55'),
(13, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 1, '2025-03-27 12:12:09'),
(14, 28, 'softeis', '3.00', 'Je nach Größe und Art der Waffel / Becher zwischen 3.00€ und 8.00€', 1, '2025-03-19 10:51:05'),
(15, 19, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-19 19:36:49'),
(16, 1, 'kugel', '1.70', 'Premiumsorten 2.00€ -\nCremino 2.50€', 1, '2025-04-25 04:26:44'),
(17, 1, 'softeis', '2.00', 'Kleines Softeis 2.00€ -\nGroßes Softeis 3.50€', 1, '2025-04-25 04:26:44'),
(18, 22, 'kugel', '1.30', NULL, 1, '2025-04-01 14:52:34'),
(19, 6, 'kugel', '1.60', NULL, 1, '2025-03-20 18:48:22'),
(20, 26, 'kugel', '1.50', NULL, 1, '2024-09-21 04:38:42'),
(21, 35, 'kugel', '1.90', NULL, 1, '2024-11-01 05:57:48'),
(22, 34, 'kugel', '2.00', 'Premiumsorten - 2.20 €', 1, '2025-03-21 05:59:04'),
(23, 37, 'kugel', '1.30', NULL, 1, '2025-04-08 15:10:10'),
(24, 38, 'kugel', '1.70', NULL, 1, '2025-03-23 17:45:55'),
(25, 39, 'kugel', '1.50', NULL, 1, '2025-03-23 17:46:52'),
(27, 40, 'kugel', '1.30', NULL, 1, '2024-03-01 06:36:13'),
(28, 42, 'kugel', '1.60', NULL, 1, '2025-02-24 12:13:18'),
(29, 32, 'kugel', '2.00', 'Premiumsorten - 2.20€', 1, '2025-03-24 16:54:56'),
(30, 43, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-24 17:23:48'),
(31, 44, 'kugel', '1.50', NULL, 1, '2025-03-24 16:43:57'),
(32, 45, 'kugel', '1.00', NULL, 1, '2024-05-01 17:18:39'),
(34, 11, 'kugel', '1.60', NULL, 1, '2025-03-25 16:30:00'),
(42, 51, 'kugel', '1.80', 'Premiumsorten - 2.20 €', 1, '2025-03-26 07:46:25'),
(51, 26, 'kugel', '1.80', 'Premiumsorten - 2.20 €', 1, '2025-03-27 15:11:26'),
(52, 13, 'kugel', '1.50', 'Kleines gemischtes Eis - 1,50 €\nGroßes gemischtes Eis - 2,50 €', 1, '2025-03-28 15:06:41'),
(53, 47, 'kugel', '1.00', 'Premiumsorten - 1,50 €', 1, '2025-03-28 15:53:03'),
(54, 47, 'softeis', '1.50', 'Großes Softeis - 2,50 €', 1, '2025-03-28 15:53:03'),
(55, 54, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\r\nGroßes Softeis - 3,00 €\r\nXXL Softeis - 3,50 €', 1, '2025-03-28 16:51:29'),
(56, 53, 'softeis', '1.50', 'Kleines Softeis - 1,50 €\r\nNormales Softeis - 2,00 €\r\nGroßes Softeis - 2,50 €', 1, '2025-03-28 17:01:44'),
(57, 55, 'kugel', '1.50', NULL, 1, '2025-04-17 13:53:20'),
(58, 58, 'kugel', '1.50', NULL, 1, '2025-03-30 10:49:57'),
(60, 31, 'softeis', '1.50', 'Kleines Eis - 1.50 €\nGroßes Eis - 2.50 €', 1, '2025-04-02 06:17:26'),
(62, 2, 'kugel', '2.00', NULL, 1, '2025-04-03 11:35:21'),
(63, 20, 'kugel', '2.00', NULL, 1, '2025-04-03 14:16:17'),
(64, 9, 'kugel', '1.50', NULL, 1, '2025-04-03 14:31:12'),
(65, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 1, '2025-04-03 14:31:12'),
(66, 61, 'kugel', '1.80', NULL, 1, '2025-04-03 14:54:33'),
(67, 63, 'kugel', '2.00', NULL, 1, '2025-04-04 04:58:58'),
(68, 62, 'kugel', '2.00', NULL, 1, '2025-04-04 04:59:58'),
(69, 64, 'kugel', '1.90', NULL, 1, '2025-04-04 05:03:15'),
(70, 46, 'kugel', '1.80', NULL, 1, '2025-04-04 12:36:30'),
(71, 65, 'kugel', '1.00', NULL, 1, '2025-04-05 11:18:17'),
(72, 65, 'softeis', '1.00', 'Kleines Softeis - 1,00 €\nGroßes Softeis - 2,00 €', 1, '2025-04-05 11:18:17'),
(73, 66, 'kugel', '1.40', NULL, 1, '2025-04-05 11:20:48'),
(74, 33, 'softeis', '3.20', 'Kleines Softeis - 3,20 €\nGroßes Softeis - 4,00 €', 1, '2025-04-05 14:35:21'),
(75, 67, 'kugel', '1.70', NULL, 1, '2025-04-05 16:39:21'),
(76, 68, 'kugel', '1.50', 'Premiumsorten - 2.00 €', 1, '2025-04-05 16:43:07'),
(77, 69, 'kugel', '1.60', NULL, 1, '2025-04-05 16:49:47'),
(78, 71, 'kugel', '2.00', NULL, 1, '2025-04-05 16:57:44'),
(79, 72, 'kugel', '1.90', NULL, 1, '2025-04-05 18:47:59'),
(80, 29, 'kugel', '1.60', NULL, 1, '2025-04-07 14:20:17'),
(81, 40, 'kugel', '1.70', NULL, 1, '2025-04-08 14:13:43'),
(83, 76, 'kugel', '1.50', NULL, 1, '2025-04-09 04:52:10'),
(87, 86, 'kugel', '1.50', NULL, 1, '2025-04-11 07:15:22'),
(90, 87, 'kugel', '1.40', NULL, 1, '2024-07-23 13:49:01'),
(91, 97, 'kugel', '1.70', NULL, 1, '2025-04-12 09:08:55'),
(92, 83, 'kugel', '2.00', NULL, 1, '2025-04-12 09:09:12'),
(93, 72, 'kugel', '1.70', 'Premiumsorten 2€', 1, '2025-04-12 09:39:02'),
(94, 98, 'kugel', '1.10', NULL, 1, '2025-04-16 14:49:12'),
(95, 100, 'kugel', '1.50', NULL, 1, '2025-04-14 10:50:50'),
(101, 101, 'kugel', '1.20', NULL, 1, '2025-04-14 14:06:06'),
(103, 101, 'softeis', '1.70', 'Mittel - 2,20 €\nGroß - 2,70 €', 1, '2025-04-14 14:06:06'),
(106, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 4, '2025-04-20 15:40:45'),
(107, 9, 'kugel', '1.50', NULL, 4, '2025-04-21 14:52:33'),
(108, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 4, '2025-04-21 14:52:33'),
(109, 85, 'kugel', '1.80', NULL, 1, '2025-04-22 08:30:13'),
(110, 114, 'softeis', '3.00', NULL, 1, '2025-04-22 08:35:39'),
(111, 115, 'softeis', '2.00', NULL, 3, '2025-04-22 12:35:13'),
(113, 59, 'kugel', '1.20', NULL, 1, '2025-04-22 16:59:31'),
(114, 59, 'softeis', '1.50', 'Mittleres Softeis - 2€\nGroßes Softeis - 2,50€', 1, '2025-04-22 16:59:31'),
(121, 118, 'kugel', '1.50', NULL, 1, '2025-04-26 00:16:57'),
(122, 119, 'softeis', '2.50', 'Kleine Portion 2,50€ / Mittlere Portion 3€ / große Portion 3,50€', 1, '2025-04-26 00:18:43'),
(123, 107, 'kugel', '1.50', NULL, 1, '2025-04-26 10:52:10'),
(124, 107, 'softeis', '3.00', NULL, 1, '2025-04-26 10:51:31'),
(126, 107, 'softeis', '2.50', 'Großes Softeis 3,50€', 1, '2025-04-26 10:52:10'),
(127, 118, 'kugel', '1.70', NULL, 1, '2025-04-26 11:02:14'),
(128, 118, 'softeis', '2.50', 'Großes Softeis 3,50€ / Super Softeis 4,50€', 1, '2025-04-26 11:02:14');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `preise`
--
ALTER TABLE `preise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eisdiele_id` (`eisdiele_id`,`typ`,`gemeldet_von`,`preis`),
  ADD KEY `gemeldet_von` (`gemeldet_von`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `preise`
--
ALTER TABLE `preise`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `preise`
--
ALTER TABLE `preise`
  ADD CONSTRAINT `preise_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `preise_ibfk_2` FOREIGN KEY (`gemeldet_von`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
