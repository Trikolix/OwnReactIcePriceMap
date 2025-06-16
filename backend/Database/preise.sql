-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:28
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
(10, 21, 'kugel', '1.70', 'Premiumsorten 2€', 1, '2025-05-30 14:17:54'),
(11, 21, 'softeis', '2.50', 'kleines Softeis - 2.50€\r\ngroßes Softeis - 3.00 €', 1, '2025-05-30 14:17:54'),
(12, 22, 'kugel', '1.20', NULL, 1, '2024-03-01 06:47:55'),
(13, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 1, '2025-03-27 12:12:09'),
(14, 28, 'softeis', '3.00', 'Je nach Größe und Art der Waffel / Becher zwischen 3.00€ und 8.00€', 1, '2025-05-13 17:12:24'),
(15, 19, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-19 19:36:49'),
(16, 1, 'kugel', '1.70', 'Premiumsorten 2.00€ -\nCremino 2.50€', 1, '2025-04-25 04:26:44'),
(17, 1, 'softeis', '2.00', 'Kleines Softeis 2.00€ -\nGroßes Softeis 3.50€', 1, '2025-04-25 04:26:44'),
(18, 22, 'kugel', '1.30', NULL, 1, '2025-05-20 10:47:33'),
(19, 6, 'kugel', '1.60', NULL, 1, '2025-03-20 18:48:22'),
(20, 26, 'kugel', '1.50', NULL, 1, '2024-09-21 04:38:42'),
(21, 35, 'kugel', '1.90', 'Im Restaurant 2,60€', 1, '2025-05-12 01:39:12'),
(22, 34, 'kugel', '2.00', 'Premiumsorten - 2.20 €', 1, '2025-03-21 05:59:04'),
(23, 37, 'kugel', '1.30', NULL, 1, '2025-04-08 15:10:10'),
(24, 38, 'kugel', '1.70', NULL, 1, '2025-03-23 17:45:55'),
(25, 39, 'kugel', '1.50', NULL, 1, '2025-03-23 17:46:52'),
(27, 40, 'kugel', '1.30', NULL, 1, '2024-03-01 06:36:13'),
(28, 42, 'kugel', '1.60', NULL, 1, '2025-04-28 14:35:08'),
(29, 32, 'kugel', '2.00', 'Premiumsorten - 2.20€', 1, '2025-05-09 13:14:32'),
(30, 43, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-24 17:23:48'),
(31, 44, 'kugel', '1.50', NULL, 1, '2025-03-24 16:43:57'),
(32, 45, 'kugel', '1.00', NULL, 1, '2025-05-02 11:16:58'),
(34, 11, 'kugel', '1.60', NULL, 1, '2025-03-25 16:30:00'),
(42, 51, 'kugel', '1.80', 'Premiumsorten - 2.20 €', 1, '2025-05-22 18:53:34'),
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
(64, 9, 'kugel', '1.50', NULL, 1, '2025-05-21 15:16:34'),
(65, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 1, '2025-05-21 15:16:34'),
(66, 61, 'kugel', '1.80', NULL, 1, '2025-04-03 14:54:33'),
(67, 63, 'kugel', '2.00', NULL, 1, '2025-04-04 04:58:58'),
(68, 62, 'kugel', '2.00', NULL, 1, '2025-04-04 04:59:58'),
(69, 64, 'kugel', '1.90', NULL, 1, '2025-04-04 05:03:15'),
(70, 46, 'kugel', '1.80', NULL, 1, '2025-04-04 12:36:30'),
(71, 65, 'kugel', '1.00', NULL, 1, '2025-05-31 13:17:26'),
(72, 65, 'softeis', '1.00', 'Kleines Softeis - 1,00 €\nGroßes Softeis - 2,00 €', 1, '2025-05-31 13:17:26'),
(73, 66, 'kugel', '1.40', NULL, 1, '2025-04-05 11:20:48'),
(74, 33, 'softeis', '3.20', 'Kleines Softeis - 3,20 €\nGroßes Softeis - 4,00 €', 1, '2025-04-05 14:35:21'),
(75, 67, 'kugel', '1.70', NULL, 1, '2025-04-05 16:39:21'),
(76, 68, 'kugel', '1.50', 'Premiumsorten - 2.00 €', 1, '2025-04-05 16:43:07'),
(77, 69, 'kugel', '1.60', NULL, 1, '2025-04-05 16:49:47'),
(78, 71, 'kugel', '2.00', NULL, 1, '2025-04-05 16:57:44'),
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
(113, 59, 'kugel', '1.20', NULL, 1, '2025-04-30 07:31:47'),
(114, 59, 'softeis', '1.50', 'Mittleres Softeis - 2€\nGroßes Softeis - 2,50€', 1, '2025-04-30 07:31:47'),
(121, 118, 'kugel', '1.50', NULL, 1, '2025-04-26 00:16:57'),
(122, 119, 'softeis', '2.50', 'Kleine Portion 2,50€ / Mittlere Portion 3€ / große Portion 3,50€', 1, '2025-04-26 00:18:43'),
(123, 107, 'kugel', '1.50', NULL, 1, '2025-04-26 10:52:10'),
(126, 107, 'softeis', '2.50', 'Großes Softeis 3,50€', 1, '2025-04-26 10:52:10'),
(127, 118, 'kugel', '1.70', NULL, 1, '2025-04-26 11:02:14'),
(128, 118, 'softeis', '2.50', 'Großes Softeis 3,50€ / Super Softeis 4,50€', 1, '2025-04-26 11:02:14'),
(129, 121, 'softeis', '2.00', 'Großes Softeis 3€', 1, '2025-04-27 12:10:29'),
(130, 75, 'softeis', '2.50', NULL, 1, '2025-04-27 15:19:46'),
(132, 123, 'kugel', '1.90', NULL, 2, '2025-04-27 15:33:25'),
(133, 32, 'kugel', '2.00', 'Premiumsorten - 2.20€', 3, '2025-04-27 16:23:05'),
(134, 124, 'kugel', '2.00', NULL, 4, '2025-04-27 17:44:49'),
(135, 125, 'softeis', '2.80', 'Keine unterschiedlichen Größen / Preise', 7, '2025-04-27 19:22:41'),
(137, 60, 'kugel', '1.60', 'Premiumsorten 1,90€', 1, '2025-04-28 15:57:49'),
(138, 92, 'kugel', '2.00', 'Premiumsorten 2,20€', 1, '2025-04-29 14:22:12'),
(139, 92, 'softeis', '2.50', 'Großes Softeis 4€', 1, '2025-04-29 14:22:12'),
(144, 106, 'kugel', '1.80', NULL, 1, '2025-04-30 15:03:36'),
(145, 126, 'kugel', '1.60', NULL, 1, '2025-05-01 14:54:00'),
(146, 126, 'softeis', '1.80', 'Großes Softeis 3,00€', 1, '2025-05-01 14:54:00'),
(147, 12, 'softeis', '1.70', 'Kleines Softeis: 1,70€\nGroßes Softeis: 3,00€\nXXL Softeis:      4,00€', 7, '2025-05-01 19:08:01'),
(148, 131, 'kugel', '1.80', NULL, 1, '2025-05-01 19:43:23'),
(149, 132, 'kugel', '2.00', NULL, 2, '2025-05-02 04:53:39'),
(150, 132, 'softeis', '2.20', 'Klein: 2,20€\nMittel: 3,50€\nGroß: 4,80€', 2, '2025-05-02 04:53:39'),
(151, 133, 'softeis', '1.81', '45 czk', 1, '2025-05-02 10:27:22'),
(153, 45, 'softeis', '1.00', 'Mittleres Softeis 2€ - Großes Softeis 3€', 1, '2025-05-02 11:16:58'),
(154, 128, 'kugel', '1.70', 'Zum mitnehmen und 2,20€ zum vor Ort essen', 10, '2025-05-02 11:33:01'),
(155, 134, 'kugel', '1.80', NULL, 1, '2025-05-02 12:04:42'),
(160, 135, 'kugel', '1.50', NULL, 1, '2025-05-02 12:57:14'),
(161, 135, 'softeis', '2.50', '3,50€ großes Softeis, 4,50€ XXL', 1, '2025-05-02 12:57:14'),
(162, 81, 'kugel', '1.60', NULL, 1, '2025-05-02 12:57:31'),
(163, 82, 'kugel', '1.60', NULL, 1, '2025-05-02 14:51:53'),
(164, 49, 'kugel', '1.80', NULL, 1, '2025-05-04 15:06:01'),
(165, 122, 'kugel', '1.80', NULL, 1, '2025-05-04 15:07:42'),
(166, 122, 'softeis', '1.80', 'mittlere Portion 2,50 € / große Portion 3,20 €', 1, '2025-05-04 15:07:42'),
(169, 137, 'kugel', '1.70', NULL, 11, '2025-05-05 07:03:23'),
(170, 46, 'kugel', '1.80', NULL, 5, '2025-05-05 09:26:26'),
(171, 118, 'kugel', '1.70', NULL, 5, '2025-05-05 09:31:59'),
(172, 118, 'softeis', '2.50', 'Großes Softeis 3,50€ / Super Softeis 4,50€', 5, '2025-05-05 09:31:59'),
(173, 139, 'kugel', '2.50', NULL, 5, '2025-05-06 18:27:27'),
(174, 149, 'kugel', '1.00', NULL, 1, '2023-05-08 06:47:45'),
(178, 150, 'kugel', '1.20', NULL, 1, '2025-05-31 12:03:20'),
(179, 161, 'kugel', '4.49', NULL, 1, '2025-05-09 10:59:12'),
(186, 115, 'softeis', '2.00', 'Großes Softeis - 4€', 1, '2025-05-10 12:34:36'),
(187, 125, 'softeis', '2.80', 'Keine unterschiedlichen Größen / Preise', 2, '2025-05-10 13:25:48'),
(188, 162, 'kugel', '1.50', NULL, 11, '2025-05-10 18:51:04'),
(190, 117, 'kugel', '1.70', 'Premiumsorten 2.00€ - Cremino 2.50€', 1, '2025-05-13 05:05:29'),
(191, 14, 'softeis', '2.50', 'Groß', 23, '2025-05-12 20:13:17'),
(192, 14, 'softeis', '2.00', 'Klein', 23, '2025-05-12 20:12:58'),
(197, 163, 'kugel', '1.80', NULL, 8, '2025-05-14 19:45:18'),
(198, 165, 'kugel', '1.80', 'Kategorie Zwei: 2€ / Kategorie 3: 2,20€', 1, '2025-05-15 13:31:45'),
(199, 145, 'kugel', '1.20', NULL, 1, '2025-05-18 10:53:16'),
(200, 145, 'softeis', '1.40', 'Mittleres Softeis - 1.9€ großes Softeis: 2,40€', 1, '2025-05-18 10:53:16'),
(201, 167, 'kugel', '1.80', 'Premiumsorten 2,20 €', 1, '2025-05-18 16:14:21'),
(202, 167, 'softeis', '2.80', 'Kleines Softeis: 2,80 € / großes Softeis 3,80 €', 1, '2025-05-18 16:14:21'),
(203, 9, 'kugel', '1.50', NULL, 25, '2025-05-19 17:14:06'),
(204, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 25, '2025-05-19 17:14:06'),
(205, 162, 'kugel', '1.50', NULL, 1, '2025-05-20 01:19:56'),
(206, 162, 'softeis', '2.50', 'Kleines Softeis 2,50€ - großes Softeis 3,50€', 1, '2025-05-20 01:19:56'),
(208, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 2, '2025-05-20 19:22:06'),
(209, 60, 'kugel', '1.60', 'Premiumsorten 1,90€', 2, '2025-05-20 19:32:53'),
(210, 170, 'kugel', '2.50', NULL, 1, '2025-05-21 11:27:54'),
(213, 9, 'kugel', '1.50', NULL, 19, '2025-05-22 14:48:07'),
(214, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 19, '2025-05-22 14:48:07'),
(216, 112, 'softeis', '2.20', 'Größe S: 2,20€\nGröße M: 2,90€\nGröße L: 3,90€', 1, '2025-05-25 04:09:21'),
(217, 175, 'kugel', '1.80', NULL, 2, '2025-05-25 11:27:04'),
(218, 170, 'kugel', '2.50', '10 Sorten handgemachtes Eis nur mit natürlichen Zutaten.Schokolade und Erdbeere sind wirklich ihr Geld wert.', 29, '2025-05-26 08:43:47'),
(219, 176, 'kugel', '1.80', NULL, 2, '2025-05-26 11:13:46'),
(220, 177, 'kugel', '1.80', 'Premiumsorten 2.20€', 8, '2025-05-26 15:07:35'),
(221, 180, 'softeis', '2.00', 'Klein 2,00 €\nMittel 2,20 €\nGroß 2,50 €\nStreusel 0,30 €\nFrosteis 2,20 €\nSlush 3,00 €', 32, '2025-05-27 13:30:32'),
(222, 56, 'kugel', '1.80', NULL, 1, '2025-05-27 13:38:43'),
(223, 89, 'kugel', '1.50', 'sehr gute Größe zu einem sehr guten Preis ', 33, '2025-05-27 16:40:57'),
(224, 184, 'softeis', '2.80', 'Klein 2,80 €\nGroß 3,80 €', 32, '2025-05-28 05:09:53'),
(225, 65, 'kugel', '1.00', NULL, 36, '2025-05-28 09:53:44'),
(226, 65, 'softeis', '1.00', 'Kleines Softeis - 1,00 €\nGroßes Softeis - 2,00 €', 36, '2025-05-28 09:53:44'),
(228, 23, 'kugel', '1.20', NULL, 1, '2025-05-29 12:21:13'),
(229, 4, 'kugel', '2.50', 'Kleines Softeis 2,50€ - großes Softeis 3,50€', 1, '2025-05-29 13:51:57'),
(232, 193, 'softeis', '2.50', 'Klein 2,50€\nGroß 3,50€', 2, '2025-05-30 16:24:38'),
(233, 194, 'kugel', '2.00', 'Einige Premiumsorten, die etwas teurer sind', 39, '2025-05-30 16:40:54'),
(234, 194, 'softeis', '2.50', 'Kleines Softeis: 2,50€\nGroßes Softeis: 3,50€', 39, '2025-05-30 16:40:54'),
(235, 185, 'kugel', '2.50', NULL, 31, '2025-05-30 18:49:43'),
(236, 193, 'softeis', '2.50', 'Klein 2,50€\nGroß 3,50€', 1, '2025-05-30 21:37:07'),
(237, 195, 'kugel', '1.90', 'Waffel oder Becher, alles Bio, auch vegan, viele besondere Sorten.', 41, '2025-05-30 22:11:08'),
(238, 195, 'softeis', '2.20', 'Schokolade, Vanille oder gemischt\nWaffel oder Becher\nPortion groß: 4,20 €', 41, '2025-05-30 22:11:08'),
(242, 199, 'kugel', '2.00', NULL, 40, '2025-06-01 15:36:17'),
(243, 200, 'kugel', '4.00', NULL, 40, '2025-06-01 19:11:07'),
(244, 201, 'kugel', '1.80', NULL, 40, '2025-06-01 19:17:44'),
(245, 202, 'softeis', '2.50', 'Klein 2,50€\nGroß 3,50€', 2, '2025-06-01 19:55:10'),
(246, 204, 'kugel', '1.70', 'Ca.14 Sorten', 41, '2025-06-02 14:45:03'),
(247, 204, 'softeis', '2.50', 'Schoko, Vanille, gemischt\nKlein 2,50\nGroß 3,50', 41, '2025-06-02 14:45:03'),
(248, 205, 'kugel', '1.50', NULL, 1, '2025-06-03 13:57:01'),
(249, 205, 'softeis', '2.00', 'Kleines Softeis 2€ - \nGroßes Softeis 3€', 1, '2025-06-03 13:57:01'),
(250, 3, 'kugel', '1.70', '20 Cent Aufpreis für Pappbecher ', 1, '2025-06-03 15:17:26'),
(252, 206, 'kugel', '1.70', NULL, 30, '2025-06-03 18:04:48'),
(253, 35, 'kugel', '2.00', 'Im Restaurant 2,60€\nFür 1€ Aufpreis gibt es Soezialwaffeln', 1, '2025-06-04 12:44:20'),
(255, 207, 'kugel', '1.80', 'Für Streusel nochmal 20ct', 2, '2025-06-08 13:33:41'),
(256, 127, 'kugel', '1.60', NULL, 23, '2025-06-08 19:20:53'),
(257, 105, 'kugel', '1.50', NULL, 23, '2025-06-08 19:24:36'),
(258, 105, 'softeis', '2.50', 'Kleines Softeis', 23, '2025-06-08 19:24:36'),
(259, 209, 'kugel', '3.00', 'Safran Eis - 5€', 1, '2025-06-13 17:54:46'),
(260, 47, 'kugel', '1.00', 'Premiumsorten - 1,50 €', 2, '2025-06-14 13:18:35'),
(261, 47, 'softeis', '1.50', 'Großes Softeis - 2,50 €', 2, '2025-06-14 13:18:35'),
(262, 210, 'kugel', '1.70', NULL, 8, '2025-06-14 14:04:37'),
(263, 70, 'kugel', '1.75', 'Im Haus 2€', 1, '2025-06-15 12:34:49'),
(264, 106, 'kugel', '1.80', NULL, 23, '2025-06-15 17:43:09');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=265;

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
