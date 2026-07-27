-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 18. Jun 2026 um 14:19
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.20

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
-- Tabellenstruktur für Tabelle `photo_challenge_submissions`
--

CREATE TABLE `photo_challenge_submissions` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `image_id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `reviewer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenge_submissions`
--

INSERT INTO `photo_challenge_submissions` (`id`, `challenge_id`, `image_id`, `nutzer_id`, `title`, `status`, `reviewer_id`, `created_at`, `reviewed_at`) VALUES
(1, 3, 832, 1, 'Oh no, he is about to eat my brother!', 'accepted', 1, '2026-03-06 08:31:08', '2026-03-14 11:01:47'),
(3, 3, 874, 1, 'Wilde Kombi, aber super lecker!', 'accepted', 1, '2026-03-06 08:34:13', '2026-03-14 11:01:45'),
(5, 3, 718, 19, NULL, 'accepted', 1, '2026-03-06 14:42:45', '2026-03-14 11:01:45'),
(6, 3, 543, 22, NULL, 'accepted', 1, '2026-03-06 16:12:10', '2026-03-14 11:01:44'),
(7, 3, 445, 22, NULL, 'accepted', 1, '2026-03-06 16:12:23', '2026-03-14 11:01:43'),
(8, 3, 448, 22, NULL, 'accepted', 1, '2026-03-06 16:13:29', '2026-03-14 11:01:42'),
(10, 3, 947, 8, 'hEISse Liebe', 'accepted', 1, '2026-03-07 18:36:04', '2026-03-14 11:01:42'),
(11, 3, 632, 4, 'Dolce Fredo ist nicht nur das Kredo der Waffel, nein es ist ein Italienisches Lebensgefühl.', 'accepted', 1, '2026-03-08 09:47:03', '2026-03-14 11:01:41'),
(12, 3, 466, 4, 'Hier sieht man was es in einem auslöst, wenn man sein Eisbecher mich nicht bekommen hat.', 'accepted', 1, '2026-03-08 09:48:20', '2026-03-14 11:01:40'),
(13, 3, 58, 4, 'Ein vierfach Axel in leckerer Form zum vernaschen!', 'accepted', 1, '2026-03-08 09:50:22', '2026-03-14 11:01:39'),
(14, 3, 852, 125, 'Konfetti & Kugeln', 'accepted', 1, '2026-03-08 09:50:40', '2026-03-14 11:01:38'),
(15, 3, 768, 125, 'Urbaner Eisgenuss', 'accepted', 1, '2026-03-08 10:07:46', '2026-03-14 11:01:37'),
(16, 3, 593, 125, 'Rosaroter Genuss zwischen Reben', 'accepted', 1, '2026-03-08 10:11:08', '2026-03-14 11:01:37'),
(17, 3, 102, 3, NULL, 'accepted', 1, '2026-03-08 18:13:13', '2026-03-14 11:01:36'),
(18, 3, 764, 3, NULL, 'accepted', 1, '2026-03-08 18:13:16', '2026-03-14 11:01:35'),
(19, 3, 71, 3, NULL, 'accepted', 1, '2026-03-08 18:13:19', '2026-03-14 11:01:34'),
(21, 3, 882, 53, 'Das Beste Topping ever', 'accepted', 1, '2026-03-08 20:49:07', '2026-03-14 11:01:33'),
(22, 3, 810, 53, 'Ein Traum mit Schokolade', 'accepted', 1, '2026-03-08 20:50:19', '2026-03-14 11:01:33'),
(23, 3, 938, 158, 'Eis auf der Seidenstraße', 'accepted', 1, '2026-03-09 19:07:22', '2026-03-14 11:01:32'),
(24, 3, 677, 139, 'Schokotastisch', 'accepted', 1, '2026-03-10 05:49:26', '2026-03-14 11:01:31'),
(25, 3, 690, 139, 'When in Rome', 'accepted', 1, '2026-03-10 05:49:49', '2026-03-14 11:01:22'),
(26, 3, 964, 118, NULL, 'accepted', 1, '2026-03-10 15:36:05', '2026-03-14 11:01:21'),
(28, 3, 759, 99, '1001 Nacht und ein Eis', 'accepted', 1, '2026-03-10 16:28:00', '2026-03-14 11:01:20'),
(29, 3, 430, 99, 'Heilige Kalorien vor der heiligen Kirche', 'accepted', 1, '2026-03-10 16:28:03', '2026-03-14 11:01:19'),
(30, 3, 411, 99, 'Wellenrauschen und Waffelbecher', 'accepted', 1, '2026-03-10 16:28:05', '2026-03-14 11:01:18'),
(31, 3, 924, 156, NULL, 'accepted', 1, '2026-03-11 15:08:59', '2026-03-14 11:01:17'),
(32, 3, 925, 156, NULL, 'accepted', 1, '2026-03-11 15:09:08', '2026-03-14 11:01:10'),
(33, 3, 441, 23, 'Eis mit Aussicht', 'accepted', 1, '2026-03-11 21:35:55', '2026-03-14 11:01:09'),
(34, 3, 427, 23, 'Italian Gelato', 'accepted', 1, '2026-03-11 21:36:38', '2026-03-14 11:01:08'),
(35, 3, 146, 23, 'Für ein Eis nach Potsdam', 'accepted', 1, '2026-03-11 21:37:42', '2026-03-14 11:01:08'),
(36, 3, 315, 1, 'Kommt man mit dem Eis überhaupt noch durch die Tür? 🍨🚪', 'accepted', 1, '2026-03-12 01:58:30', '2026-03-14 11:01:07'),
(37, 3, 976, 53, 'Prager Eistraum mit Hut', 'accepted', 1, '2026-03-12 07:32:52', '2026-03-14 11:01:06'),
(38, 3, 638, 2, 'Softes Eis, softes Herz ❤️', 'accepted', 1, '2026-03-13 10:54:34', '2026-03-14 11:01:05'),
(39, 3, 440, 2, 'Verlobung mit Eis am Gardasee', 'accepted', 1, '2026-03-13 10:55:08', '2026-03-14 11:01:04'),
(40, 3, 337, 2, 'Ein Hauch von Tüll', 'accepted', 1, '2026-03-13 10:55:30', '2026-03-14 11:01:03'),
(41, 3, 429, 63, 'Wie vom Titel der Eisdiele versprochen gab es hier eine positive Karambolage der Sinne.', 'accepted', 1, '2026-03-13 15:43:09', '2026-03-14 11:01:01'),
(42, 3, 816, 77, 'Macht Lust auf Sommer', 'accepted', 1, '2026-03-13 17:48:09', '2026-03-14 11:01:01'),
(43, 3, 913, 51, NULL, 'accepted', 1, '2026-03-13 19:00:16', '2026-03-14 11:01:00'),
(44, 3, 883, 48, NULL, 'accepted', 1, '2026-03-13 22:00:05', '2026-03-14 11:00:59'),
(45, 3, 880, 48, NULL, 'accepted', 1, '2026-03-13 22:00:23', '2026-03-14 11:00:58'),
(46, 3, 474, 48, NULL, 'accepted', 1, '2026-03-13 22:00:49', '2026-03-14 11:00:56'),
(47, 4, 291, 23, 'Velo n Ice', 'accepted', 1, '2026-05-14 20:00:36', '2026-06-01 14:07:04'),
(48, 4, 1000, 23, 'Canarian Ice', 'accepted', 1, '2026-05-14 20:01:09', '2026-06-01 14:07:03'),
(49, 4, 847, 1, 'Bei Eis und Schnee nehme ich lieber das Gravelrad', 'accepted', 1, '2026-05-15 03:24:25', '2026-06-01 14:07:02'),
(50, 4, 807, 1, 'So dekoriert man sein Rennrad-Cockpit', 'accepted', 1, '2026-05-15 03:25:22', '2026-06-01 14:07:01'),
(51, 4, 512, 1, 'Der heilige Strahl scheint aufs Eis', 'accepted', 1, '2026-05-15 03:27:36', '2026-06-01 14:06:59'),
(52, 4, 1239, 174, NULL, 'accepted', 1, '2026-05-17 07:08:59', '2026-06-01 14:06:59'),
(53, 4, 1256, 174, NULL, 'accepted', 1, '2026-05-17 07:09:06', '2026-06-01 14:06:58'),
(54, 4, 1311, 1, 'Eis - Rennrad - Romanze', 'accepted', 1, '2026-05-19 18:29:07', '2026-06-01 14:06:57'),
(55, 4, 1290, 62, NULL, 'accepted', 1, '2026-05-20 14:08:33', '2026-06-01 14:06:56'),
(56, 4, 1251, 62, NULL, 'accepted', 1, '2026-05-20 14:09:25', '2026-06-01 14:06:55'),
(57, 4, 1288, 94, 'Ice-Tour: Finished', 'accepted', 1, '2026-05-27 13:07:00', '2026-06-01 14:06:54'),
(58, 4, 1252, 94, 'Genuss für Gourmets', 'accepted', 1, '2026-05-27 13:07:05', '2026-06-01 14:06:53'),
(59, 4, 1228, 94, 'Ice-App Fan on Tour', 'accepted', 1, '2026-05-27 13:07:10', '2026-06-01 14:06:52'),
(60, 4, 1142, 94, 'The Taste of Ice', 'accepted', 1, '2026-05-27 13:07:13', '2026-06-01 14:06:51'),
(61, 4, 1355, 94, 'Ice-Tour bei Klatt-Eis', 'accepted', 1, '2026-05-27 13:17:15', '2026-06-01 14:06:50'),
(62, 4, 1359, 53, 'Eistüte im Flaschenhalter', 'accepted', 1, '2026-05-27 20:23:33', '2026-06-01 14:06:49'),
(64, 4, 1387, 248, NULL, 'accepted', 1, '2026-05-30 18:36:19', '2026-06-01 14:06:48'),
(65, 4, 1390, 8, 'Eis ohne Ent(d)e', 'accepted', 1, '2026-05-31 13:08:24', '2026-06-01 14:06:47'),
(66, 4, 1395, 235, 'Eis geht immer, auch schon am Anfang der Tour', 'accepted', 1, '2026-05-31 19:59:41', '2026-06-01 14:06:46'),
(67, 4, 1366, 235, 'Kriebstein zum Feierabend', 'accepted', 1, '2026-05-31 20:01:36', '2026-06-01 14:06:45');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenge_submissions`
--
ALTER TABLE `photo_challenge_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_submission` (`challenge_id`,`image_id`,`nutzer_id`),
  ADD KEY `fk_submission_image` (`image_id`),
  ADD KEY `fk_submission_user` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenge_submissions`
--
ALTER TABLE `photo_challenge_submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `photo_challenge_submissions`
--
ALTER TABLE `photo_challenge_submissions`
  ADD CONSTRAINT `fk_submission_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_submission_image` FOREIGN KEY (`image_id`) REFERENCES `bilder` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_submission_user` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
