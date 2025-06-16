-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:26
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
-- Tabellenstruktur für Tabelle `bilder`
--

CREATE TABLE `bilder` (
  `id` int NOT NULL,
  `nutzer_id` int DEFAULT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `checkin_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `bewertung_id` int DEFAULT NULL,
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bilder`
--

INSERT INTO `bilder` (`id`, `nutzer_id`, `url`, `checkin_id`, `shop_id`, `bewertung_id`, `beschreibung`, `erstellt_am`) VALUES
(7, 1, 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg', 2, NULL, NULL, '', '2025-05-12 07:58:45'),
(8, 1, 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg', 3, NULL, NULL, '', '2025-05-12 07:58:45'),
(9, 1, 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg', 4, NULL, NULL, '', '2025-05-12 07:58:45'),
(10, 1, 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg', 5, NULL, NULL, '', '2025-05-12 07:58:45'),
(11, 1, 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg', 6, NULL, NULL, '', '2025-05-12 07:58:45'),
(12, 1, 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg', 7, NULL, NULL, '', '2025-05-12 07:58:45'),
(13, 1, 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg', 9, NULL, NULL, '', '2025-05-12 07:58:45'),
(14, 1, 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg', 10, NULL, NULL, '', '2025-05-12 07:58:45'),
(15, 1, 'uploads/checkins/checkin_6801084f859771.78778651.jpg', 11, NULL, NULL, '', '2025-05-12 07:58:45'),
(16, 1, 'uploads/checkins/checkin_6807750090a880.99200391.jfif', 16, NULL, NULL, '', '2025-05-12 07:58:45'),
(17, 1, 'uploads/checkins/checkin_680775c23a3b90.94454860.jpg', 17, NULL, NULL, '', '2025-05-12 07:58:45'),
(18, 1, 'uploads/checkins/checkin_6807764881a7d7.92172451.jpg', 18, NULL, NULL, '', '2025-05-12 07:58:45'),
(19, 1, 'uploads/checkins/checkin_680776a0e5f966.43189762.jpg', 19, NULL, NULL, '', '2025-05-12 07:58:45'),
(20, 1, 'uploads/checkins/checkin_68077724b19388.99511766.jpg', 20, NULL, NULL, '', '2025-05-12 07:58:45'),
(21, 1, 'uploads/checkins/checkin_6807779bcd13c8.48200144.jpg', 21, NULL, NULL, '', '2025-05-12 07:58:45'),
(22, 1, 'uploads/checkins/checkin_68077831306e46.00666877.jpg', 22, NULL, NULL, '', '2025-05-12 07:58:45'),
(23, 1, 'uploads/checkins/checkin_680778b7809bd9.23540954.jpg', 23, NULL, NULL, '', '2025-05-12 07:58:45'),
(24, 1, 'uploads/checkins/checkin_6807ab80cd8189.01435225.jpg', 24, NULL, NULL, '', '2025-05-12 07:58:45'),
(25, 1, 'uploads/checkins/checkin_6808a3cc294272.31810929.jpg', 25, NULL, NULL, '', '2025-05-12 07:58:45'),
(26, 1, 'uploads/checkins/checkin_6808a50f008879.38210265.jpg', 26, NULL, NULL, '', '2025-05-12 07:58:45'),
(27, 1, 'uploads/checkins/checkin_680b257f5ecd81.04364034.jpg', 52, NULL, NULL, '', '2025-05-12 07:58:45'),
(28, 1, 'uploads/checkins/checkin_680b260953a2c6.04111238.jpg', 53, NULL, NULL, '', '2025-05-12 07:58:45'),
(29, 1, 'uploads/checkins/checkin_680b27215c9cd7.16477511.jpg', 54, NULL, NULL, '', '2025-05-12 07:58:45'),
(30, 1, 'uploads/checkins/checkin_680b296ce5fe31.37610516.jpg', 55, NULL, NULL, '', '2025-05-12 07:58:45'),
(31, 1, 'uploads/checkins/checkin_680b29e24a1a94.15558268.jpg', 56, NULL, NULL, '', '2025-05-12 07:58:45'),
(32, 1, 'uploads/checkins/checkin_680b2a64289c96.21068159.jpg', 57, NULL, NULL, '', '2025-05-12 07:58:45'),
(33, 1, 'uploads/checkins/checkin_680cbfe340a0f3.28355942.jpg', 58, NULL, NULL, '', '2025-05-12 07:58:45'),
(34, 1, 'uploads/checkins/checkin_680e1f8730cad0.81147935.jpg', 59, NULL, NULL, '', '2025-05-12 07:58:45'),
(35, 2, 'uploads/checkins/checkin_680e5115747b78.57634651.jpeg', 60, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(36, 1, 'uploads/checkins/checkin_680fb580b86b28.07088248.jpg', 66, NULL, NULL, '', '2025-05-12 07:58:45'),
(37, 1, 'uploads/checkins/checkin_6810e166df05f3.24970135.jpg', 67, NULL, NULL, '', '2025-05-12 07:58:45'),
(38, 1, 'uploads/checkins/checkin_68123e4a243b37.88534837.jpg', 68, NULL, NULL, '', '2025-05-12 07:58:45'),
(39, 1, 'uploads/checkins/checkin_68138d592fb452.11491787.jpg', 69, NULL, NULL, '', '2025-05-12 07:58:45'),
(40, 7, 'uploads/checkins/checkin_6813c7869ac873.22346198.jpeg', 70, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(41, 2, 'uploads/checkins/checkin_68145039ded7a2.25747482.jpg', 71, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(42, 1, 'uploads/checkins/checkin_68149e40c22588.10598712.jpg', 72, NULL, NULL, '', '2025-05-12 07:58:45'),
(43, 1, 'uploads/checkins/checkin_6814a972d52041.20148645.jpg', 73, NULL, NULL, '', '2025-05-12 07:58:45'),
(44, 1, 'uploads/checkins/checkin_6814aad52eec93.08796872.jpg', 74, NULL, NULL, '', '2025-05-12 07:58:45'),
(45, 1, 'uploads/checkins/checkin_6814b5dca10765.62455648.jpg', 75, NULL, NULL, '', '2025-05-12 07:58:45'),
(46, 1, 'uploads/checkins/checkin_6814bf2b0120d1.06227474.jpg', 76, NULL, NULL, '', '2025-05-12 07:58:45'),
(47, 1, 'uploads/checkins/checkin_6814c0b8ce0d18.70274899.jpg', 77, NULL, NULL, '', '2025-05-12 07:58:45'),
(48, 2, 'uploads/checkins/checkin_6814c3655972b8.42912882.jpg', 78, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(49, 1, 'uploads/checkins/checkin_6817231a672452.85536664.jpg', 79, NULL, NULL, '', '2025-05-12 07:58:45'),
(50, 4, 'uploads/checkins/checkin_6817a70a08cfe3.05723235.jpg', 83, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(51, 11, 'uploads/checkins/checkin_681862f7115e29.67987507.jpg', 87, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(52, 5, 'uploads/checkins/checkin_68188390300dc2.92346935.jpg', 88, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(53, 1, 'uploads/checkins/checkin_681a319c0f3650.93239872.jpg', 90, NULL, NULL, '', '2025-05-12 07:58:45'),
(54, 1, 'uploads/checkins/checkin_681df76554f668.70865736.jpg', 102, NULL, NULL, '', '2025-05-12 07:58:45'),
(55, 2, 'uploads/checkins/checkin_681e0e80e91e47.61909818.jpg', 103, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(56, 1, 'uploads/checkins/checkin_681f48291b6963.89816226.jpg', 112, NULL, NULL, '', '2025-05-12 07:58:45'),
(57, 2, 'uploads/checkins/checkin_681f76299e0064.75169438.jpg', 113, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(58, 4, 'uploads/checkins/checkin_681f7f2b22fa65.49786419.jpg', 114, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(59, 11, 'uploads/checkins/checkin_681fa199dd3487.87433737.jpg', 115, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(60, 11, 'uploads/checkins/checkin_681faa7bc33fe5.53794950.jpg', 116, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(65, 1, 'uploads/checkins/checkin_682223ea6293f9.94009304.jpg', 122, NULL, NULL, '', '2025-05-12 16:38:02'),
(67, 1, 'uploads/checkins/checkin_682359da670ec2.98346301.jpg', 125, NULL, NULL, 'Meine Eis Kreation war zugegeben etwas wild', '2025-05-13 14:40:27'),
(68, 1, 'uploads/checkins/checkin_682359daad2635.18538038.jpg', 125, NULL, NULL, '', '2025-05-13 14:40:27'),
(69, 1, 'uploads/checkins/checkin_682359daef48e5.51099933.jpg', 125, NULL, NULL, 'So sieht die Eiszapfanlage aus', '2025-05-13 14:40:27'),
(71, 3, 'uploads/checkins/checkin_6824068552da17.81679062.jpg', 128, NULL, NULL, '', '2025-05-14 02:57:09'),
(72, 22, 'uploads/checkins/checkin_6824eff304dca2.82017208.jpg', 130, NULL, NULL, '', '2025-05-14 19:33:07'),
(80, 2, 'uploads/checkins/checkin_6825816a025960.81425973.jpg', 129, NULL, NULL, '', '2025-05-15 05:53:46'),
(81, 1, 'uploads/checkins/checkin_6825eea8e41c81.01153952.jpg', 134, NULL, NULL, '', '2025-05-15 13:39:53'),
(82, 8, 'uploads/checkins/checkin_68263592034128.94300237.jpg', 131, NULL, NULL, '', '2025-05-15 18:42:26'),
(83, 1, 'uploads/checkins/checkin_6829bc82222c41.96793537.jpg', 135, NULL, NULL, '', '2025-05-18 10:54:58'),
(84, 1, 'uploads/checkins/checkin_6829bc827358f7.07476791.jpg', 135, NULL, NULL, '', '2025-05-18 10:54:58'),
(85, 1, 'uploads/checkins/checkin_6829ea0f08e1d7.90384474.jpg', 135, NULL, NULL, '', '2025-05-18 14:09:19'),
(86, 25, 'uploads/checkins/checkin_682b685cab6ab4.78521055.jpg', 136, NULL, NULL, '', '2025-05-19 17:20:29'),
(87, 1, 'uploads/checkins/checkin_682c8896cf4292.02598669.jpg', 137, NULL, NULL, '', '2025-05-20 13:50:15'),
(88, 1, 'uploads/checkins/checkin_682c88972aab76.93454985.jpg', 137, NULL, NULL, '', '2025-05-20 13:50:15'),
(89, 2, 'uploads/checkins/checkin_682cd6cc1e5165.86032742.jpg', 138, NULL, NULL, '', '2025-05-20 19:23:56'),
(90, 2, 'uploads/checkins/checkin_682cd88ee60319.13545651.jpg', 139, NULL, NULL, '', '2025-05-20 19:31:27'),
(91, 1, 'uploads/checkins/checkin_682dde0989da53.09815305.jpg', 141, NULL, NULL, '', '2025-05-21 14:07:05'),
(92, 1, 'uploads/checkins/checkin_682f3466601311.17972328.jpg', 142, NULL, NULL, '', '2025-05-22 14:27:50'),
(93, 19, 'uploads/checkins/checkin_682f38f031db78.71212780.jpg', 143, NULL, NULL, 'Kleines Softeis für 2€. Schoko-Vanille ', '2025-05-22 14:47:12'),
(94, 1, 'uploads/checkins/checkin_6831ce2156aa21.96875772.jpg', 144, NULL, NULL, '', '2025-05-24 13:48:17'),
(95, 2, 'uploads/checkins/checkin_6832ff2a2ccf54.14858973.jpg', 145, NULL, NULL, '', '2025-05-25 11:29:46'),
(97, 2, 'uploads/checkins/checkin_68344d5ec248a0.97438173.jpg', 147, NULL, NULL, '', '2025-05-26 11:15:43'),
(99, 8, 'uploads/checkins/checkin_6834832e853132.88761234.jpg', 149, NULL, NULL, '', '2025-05-26 15:05:20'),
(100, 8, 'uploads/checkins/checkin_6834832f18b9c8.95549997.jpg', 149, NULL, NULL, '', '2025-05-26 15:05:20'),
(101, 8, 'uploads/checkins/checkin_6834832f9ab981.34844661.jpg', 149, NULL, NULL, '', '2025-05-26 15:05:20'),
(102, 3, 'uploads/checkins/checkin_6835abd68ae582.18246543.jpg', 151, NULL, NULL, '', '2025-05-27 12:11:03'),
(103, 1, 'uploads/checkins/checkin_6835c188e1a072.59256641.jpg', 153, NULL, NULL, '', '2025-05-27 13:43:37'),
(104, 1, 'uploads/checkins/checkin_6835c189345588.31523700.jpg', 153, NULL, NULL, '', '2025-05-27 13:43:37'),
(105, 1, 'uploads/checkins/checkin_683854b01f3d14.11011313.jpg', 155, NULL, NULL, '', '2025-05-29 12:36:00'),
(106, 1, 'uploads/checkins/checkin_683854b0673cb5.16759468.jpg', 155, NULL, NULL, '', '2025-05-29 12:36:00'),
(107, 1, 'uploads/checkins/checkin_68386762939634.26678442.jpg', 156, NULL, NULL, '', '2025-05-29 13:55:47'),
(108, 1, 'uploads/checkins/checkin_68386762dfb1e0.71300251.jpg', 156, NULL, NULL, '', '2025-05-29 13:55:47'),
(109, 23, 'uploads/checkins/checkin_683944811e99e6.73529755.jpg', 123, NULL, NULL, '', '2025-05-30 05:39:13'),
(110, 1, 'uploads/checkins/checkin_6839a7004d6cd4.53641524.jpg', 159, NULL, NULL, '', '2025-05-30 12:39:28'),
(111, 1, 'uploads/checkins/checkin_6839a700971082.61412705.jpg', 159, NULL, NULL, '', '2025-05-30 12:39:28'),
(112, 22, 'uploads/checkins/checkin_6839cdd384c870.43724892.jpg', 160, NULL, NULL, '', '2025-05-30 15:25:07'),
(113, 2, 'uploads/checkins/checkin_6839dc1477a886.82866557.jpg', 161, NULL, NULL, '', '2025-05-30 16:25:57'),
(114, 31, 'uploads/checkins/checkin_6839ffacb7b0d1.81194645.jpg', 163, NULL, NULL, '', '2025-05-30 18:57:49'),
(115, 1, 'uploads/checkins/checkin_683ae5df417287.86661274.jpg', 164, NULL, NULL, '', '2025-05-31 11:19:59'),
(116, 1, 'uploads/checkins/checkin_683ae772651204.56711562.jpg', 165, NULL, NULL, '', '2025-05-31 11:26:42'),
(117, 1, 'uploads/checkins/checkin_683af2cddd4214.47958831.jpg', 166, NULL, NULL, '', '2025-05-31 12:15:10'),
(118, 1, 'uploads/checkins/checkin_683b056bd25a51.70426531.jpg', 167, NULL, NULL, '', '2025-05-31 13:34:36'),
(119, 1, 'uploads/checkins/checkin_683b05e7d17766.93639809.jpg', 168, NULL, NULL, '', '2025-05-31 13:36:40'),
(120, 1, 'uploads/checkins/checkin_683b2ded890055.46655095.jpg', 167, NULL, NULL, '', '2025-05-31 16:27:25'),
(121, 4, 'uploads/checkins/checkin_683b49bbd596c3.90539158.jpg', 169, NULL, NULL, '', '2025-05-31 18:26:04'),
(122, 40, 'uploads/checkins/checkin_683c73555920b3.27674853.jpg', 171, NULL, NULL, '', '2025-06-01 15:35:49'),
(124, 40, 'uploads/checkins/checkin_683ca6e83a3499.81598462.jpg', 174, NULL, NULL, '', '2025-06-01 19:15:52'),
(125, 2, 'uploads/checkins/checkin_683cb096aebf59.03084851.jpg', 175, NULL, NULL, '', '2025-06-01 19:57:11'),
(126, 1, 'uploads/checkins/checkin_683eff7624fd68.99713839.jpg', 178, NULL, NULL, '', '2025-06-03 13:58:14'),
(127, 1, 'uploads/checkins/checkin_683f12a784a798.33354210.jpg', 179, NULL, NULL, 'Die Auswahl bei Eiscafé Duschek', '2025-06-03 15:20:08'),
(128, 1, 'uploads/checkins/checkin_683f12a7d12c61.46315839.jpg', 179, NULL, NULL, '', '2025-06-03 15:20:08'),
(129, 30, 'uploads/checkins/checkin_683f1e32879ce6.99905163.jpg', 180, NULL, NULL, '', '2025-06-03 16:09:23'),
(130, 30, 'uploads/checkins/checkin_683f1e33270009.86274070.jpg', 180, NULL, NULL, '', '2025-06-03 16:09:23'),
(131, 1, 'uploads/checkins/checkin_68403f3e8f1916.68463050.jpg', 181, NULL, NULL, 'Die Eisauswahl', '2025-06-04 12:42:39'),
(132, 1, 'uploads/checkins/checkin_68403f3ede96b7.04971251.jpg', 181, NULL, NULL, '', '2025-06-04 12:42:39'),
(133, 2, 'uploads/checkins/checkin_684591d37aafd5.79883288.jpg', 182, NULL, NULL, '', '2025-06-08 13:36:20'),
(134, 23, 'uploads/checkins/checkin_6845e345095d28.72252011.jpg', 183, NULL, NULL, '', '2025-06-08 19:23:49'),
(135, 23, 'uploads/checkins/checkin_6845e48cdf2088.20423430.jpg', 184, NULL, NULL, '', '2025-06-08 19:29:17'),
(136, 8, 'uploads/checkins/checkin_6846cfb566ea40.90906542.jpg', 185, NULL, NULL, '', '2025-06-09 12:12:39'),
(137, 8, 'uploads/checkins/checkin_6846cfb5ee5026.27710836.jpg', 185, NULL, NULL, '', '2025-06-09 12:12:39'),
(138, 8, 'uploads/checkins/checkin_6846cfb6827f60.91964532.jpg', 185, NULL, NULL, '', '2025-06-09 12:12:39'),
(139, 19, 'uploads/checkins/checkin_6849956f40f358.19485115.jpg', 186, NULL, NULL, 'Kleines Softeis Erdbeer-Vanille ', '2025-06-11 14:40:47'),
(140, 8, 'uploads/checkins/checkin_684c0a10a6fa33.72219514.jpg', 188, NULL, NULL, '', '2025-06-13 11:22:57'),
(141, 1, 'uploads/checkins/checkin_684c2a04a714e6.83403672.jpg', 189, NULL, NULL, '', '2025-06-13 13:39:16'),
(142, 2, 'uploads/checkins/checkin_684d772764d888.76382124.jpg', 190, NULL, NULL, '', '2025-06-14 13:20:40'),
(143, 8, 'uploads/checkins/checkin_684d809fc8cb60.47240643.jpg', 191, NULL, NULL, '', '2025-06-14 14:01:04'),
(144, 1, 'uploads/checkins/checkin_684ebe939949a7.94672586.jpg', 192, NULL, NULL, '', '2025-06-15 12:37:40'),
(145, 1, 'uploads/checkins/checkin_684ebe93deec39.65094684.jpg', 192, NULL, NULL, '', '2025-06-15 12:37:40'),
(146, 23, 'uploads/checkins/checkin_684f06cf84aca1.77171420.jpg', 193, NULL, NULL, '', '2025-06-15 17:45:51');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bilder`
--
ALTER TABLE `bilder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `bewertung_id` (`bewertung_id`),
  ADD KEY `fk_bilder_nutzer` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `bilder`
--
ALTER TABLE `bilder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bilder`
--
ALTER TABLE `bilder`
  ADD CONSTRAINT `bilder_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bilder_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bilder_ibfk_3` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bilder_nutzer` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
