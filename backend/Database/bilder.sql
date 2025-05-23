-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 23. Mai 2025 um 11:15
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
(7, 1, 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg', 2, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(8, 1, 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg', 3, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(9, 1, 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg', 4, NULL, NULL, '', '2025-05-12 07:58:45'),
(10, 1, 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg', 5, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(11, 1, 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg', 6, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(12, 1, 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg', 7, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(13, 1, 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg', 9, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(14, 1, 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg', 10, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(15, 1, 'uploads/checkins/checkin_6801084f859771.78778651.jpg', 11, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(16, 1, 'uploads/checkins/checkin_6807750090a880.99200391.jfif', 16, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(17, 1, 'uploads/checkins/checkin_680775c23a3b90.94454860.jpg', 17, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(18, 1, 'uploads/checkins/checkin_6807764881a7d7.92172451.jpg', 18, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(19, 1, 'uploads/checkins/checkin_680776a0e5f966.43189762.jpg', 19, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(20, 1, 'uploads/checkins/checkin_68077724b19388.99511766.jpg', 20, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(21, 1, 'uploads/checkins/checkin_6807779bcd13c8.48200144.jpg', 21, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(22, 1, 'uploads/checkins/checkin_68077831306e46.00666877.jpg', 22, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(23, 1, 'uploads/checkins/checkin_680778b7809bd9.23540954.jpg', 23, NULL, NULL, '', '2025-05-12 07:58:45'),
(24, 1, 'uploads/checkins/checkin_6807ab80cd8189.01435225.jpg', 24, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(25, 1, 'uploads/checkins/checkin_6808a3cc294272.31810929.jpg', 25, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(26, 1, 'uploads/checkins/checkin_6808a50f008879.38210265.jpg', 26, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(27, 1, 'uploads/checkins/checkin_680b257f5ecd81.04364034.jpg', 52, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(28, 1, 'uploads/checkins/checkin_680b260953a2c6.04111238.jpg', 53, NULL, NULL, '', '2025-05-12 07:58:45'),
(29, 1, 'uploads/checkins/checkin_680b27215c9cd7.16477511.jpg', 54, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(30, 1, 'uploads/checkins/checkin_680b296ce5fe31.37610516.jpg', 55, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(31, 1, 'uploads/checkins/checkin_680b29e24a1a94.15558268.jpg', 56, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(32, 1, 'uploads/checkins/checkin_680b2a64289c96.21068159.jpg', 57, NULL, NULL, '', '2025-05-12 07:58:45'),
(33, 1, 'uploads/checkins/checkin_680cbfe340a0f3.28355942.jpg', 58, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(34, 1, 'uploads/checkins/checkin_680e1f8730cad0.81147935.jpg', 59, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(35, 2, 'uploads/checkins/checkin_680e5115747b78.57634651.jpeg', 60, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(36, 1, 'uploads/checkins/checkin_680fb580b86b28.07088248.jpg', 66, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(37, 1, 'uploads/checkins/checkin_6810e166df05f3.24970135.jpg', 67, NULL, NULL, '', '2025-05-12 07:58:45'),
(38, 1, 'uploads/checkins/checkin_68123e4a243b37.88534837.jpg', 68, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(39, 1, 'uploads/checkins/checkin_68138d592fb452.11491787.jpg', 69, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(40, 7, 'uploads/checkins/checkin_6813c7869ac873.22346198.jpeg', 70, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(41, 2, 'uploads/checkins/checkin_68145039ded7a2.25747482.jpg', 71, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(42, 1, 'uploads/checkins/checkin_68149e40c22588.10598712.jpg', 72, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(43, 1, 'uploads/checkins/checkin_6814a972d52041.20148645.jpg', 73, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(44, 1, 'uploads/checkins/checkin_6814aad52eec93.08796872.jpg', 74, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(45, 1, 'uploads/checkins/checkin_6814b5dca10765.62455648.jpg', 75, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(46, 1, 'uploads/checkins/checkin_6814bf2b0120d1.06227474.jpg', 76, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(47, 1, 'uploads/checkins/checkin_6814c0b8ce0d18.70274899.jpg', 77, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(48, 2, 'uploads/checkins/checkin_6814c3655972b8.42912882.jpg', 78, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(49, 1, 'uploads/checkins/checkin_6817231a672452.85536664.jpg', 79, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(50, 4, 'uploads/checkins/checkin_6817a70a08cfe3.05723235.jpg', 83, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(51, 11, 'uploads/checkins/checkin_681862f7115e29.67987507.jpg', 87, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(52, 5, 'uploads/checkins/checkin_68188390300dc2.92346935.jpg', 88, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(53, 1, 'uploads/checkins/checkin_681a319c0f3650.93239872.jpg', 90, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(54, 1, 'uploads/checkins/checkin_681df76554f668.70865736.jpg', 102, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(55, 2, 'uploads/checkins/checkin_681e0e80e91e47.61909818.jpg', 103, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(56, 1, 'uploads/checkins/checkin_681f48291b6963.89816226.jpg', 112, NULL, NULL, NULL, '2025-05-12 07:58:45'),
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
(93, 19, 'uploads/checkins/checkin_682f38f031db78.71212780.jpg', 143, NULL, NULL, 'Kleines Softeis für 2€. Schoko-Vanille ', '2025-05-22 14:47:12');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

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
