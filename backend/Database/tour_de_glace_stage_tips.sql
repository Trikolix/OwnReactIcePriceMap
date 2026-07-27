-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 07. Jul 2026 um 20:27
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
-- Tabellenstruktur für Tabelle `tour_de_glace_stage_tips`
--

CREATE TABLE `tour_de_glace_stage_tips` (
  `id` int NOT NULL,
  `campaign_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `stage_number` int NOT NULL,
  `tip_stage_winner` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `tour_de_glace_stage_tips`
--

INSERT INTO `tour_de_glace_stage_tips` (`id`, `campaign_id`, `user_id`, `stage_number`, `tip_stage_winner`, `submitted_at`, `updated_at`) VALUES
(1, 'tour_de_glace_2026', 1, 1, 'Remco Evenepoel', '2026-07-03 11:26:10', '2026-07-04 09:09:23'),
(2, 'tour_de_glace_2026', 53, 1, 'Remco Evenepoel', '2026-07-03 16:35:46', '2026-07-03 16:35:46'),
(4, 'tour_de_glace_2026', 246, 1, 'Florian Lipowitz', '2026-07-03 23:10:16', '2026-07-03 23:10:16'),
(5, 'tour_de_glace_2026', 246, 2, 'Tadej Pogacar', '2026-07-03 23:10:22', '2026-07-03 23:10:22'),
(7, 'tour_de_glace_2026', 53, 2, 'Tadej Pogacar', '2026-07-04 21:23:03', '2026-07-05 07:55:36'),
(8, 'tour_de_glace_2026', 1, 2, 'Mathieu van der Poel', '2026-07-05 06:53:18', '2026-07-05 07:13:28'),
(13, 'tour_de_glace_2026', 23, 2, 'Juan Ayuso', '2026-07-05 12:46:24', '2026-07-05 12:46:26'),
(15, 'tour_de_glace_2026', 94, 3, 'Tadej Pogacar', '2026-07-05 16:48:58', '2026-07-05 16:48:58'),
(16, 'tour_de_glace_2026', 94, 4, 'Paul Seixas', '2026-07-05 16:51:50', '2026-07-07 10:45:50'),
(17, 'tour_de_glace_2026', 94, 5, 'Jonas Vingegaard', '2026-07-05 16:51:59', '2026-07-05 16:51:59'),
(18, 'tour_de_glace_2026', 94, 6, 'Paul Seixas', '2026-07-05 16:52:06', '2026-07-05 16:52:06'),
(19, 'tour_de_glace_2026', 94, 7, 'Sepp Kuss', '2026-07-05 16:52:12', '2026-07-05 16:52:12'),
(20, 'tour_de_glace_2026', 94, 8, 'Remco Evenepoel', '2026-07-05 17:23:17', '2026-07-05 17:23:17'),
(21, 'tour_de_glace_2026', 94, 10, 'Remco Evenepoel', '2026-07-05 17:23:36', '2026-07-05 17:23:36'),
(22, 'tour_de_glace_2026', 94, 9, 'Paul Seixas', '2026-07-05 17:23:47', '2026-07-06 20:15:08'),
(23, 'tour_de_glace_2026', 94, 11, 'Florian Lipowitz', '2026-07-05 17:23:53', '2026-07-05 17:23:53'),
(24, 'tour_de_glace_2026', 94, 12, 'Mathieu van der Poel', '2026-07-05 19:00:02', '2026-07-05 19:00:02'),
(25, 'tour_de_glace_2026', 94, 13, 'Isaac del Toro', '2026-07-05 19:00:11', '2026-07-05 19:00:11'),
(26, 'tour_de_glace_2026', 94, 14, 'Isaac del Toro', '2026-07-05 19:00:19', '2026-07-05 19:00:19'),
(27, 'tour_de_glace_2026', 94, 15, 'Mathieu van der Poel', '2026-07-05 19:00:28', '2026-07-05 19:00:28'),
(28, 'tour_de_glace_2026', 94, 16, 'Remco Evenepoel', '2026-07-05 19:00:34', '2026-07-05 19:00:34'),
(29, 'tour_de_glace_2026', 94, 17, 'Tadej Pogacar', '2026-07-05 19:00:50', '2026-07-05 19:00:50'),
(30, 'tour_de_glace_2026', 1, 3, 'Ben Healy', '2026-07-06 05:49:31', '2026-07-06 05:49:31'),
(31, 'tour_de_glace_2026', 246, 3, 'Tadej Pogacar', '2026-07-06 08:05:40', '2026-07-06 08:05:54'),
(32, 'tour_de_glace_2026', 246, 4, 'Tadej Pogacar', '2026-07-06 08:05:52', '2026-07-06 08:05:52'),
(34, 'tour_de_glace_2026', 53, 3, 'Mathieu van der Poel', '2026-07-06 09:33:24', '2026-07-06 09:33:24'),
(36, 'tour_de_glace_2026', 1, 4, 'Quinn Simmons', '2026-07-06 20:28:23', '2026-07-07 09:32:31'),
(37, 'tour_de_glace_2026', 22, 4, 'Tadej Pogacar', '2026-07-06 20:31:05', '2026-07-06 20:31:05'),
(38, 'tour_de_glace_2026', 22, 5, 'Biniam Girmay', '2026-07-06 20:32:05', '2026-07-06 20:32:05'),
(39, 'tour_de_glace_2026', 1, 5, 'Biniam Girmay', '2026-07-06 20:32:13', '2026-07-06 20:32:13'),
(43, 'tour_de_glace_2026', 94, 18, 'Mathieu van der Poel', '2026-07-07 18:00:42', '2026-07-07 18:00:42'),
(44, 'tour_de_glace_2026', 94, 19, 'Tadej Pogacar', '2026-07-07 18:00:48', '2026-07-07 18:00:48'),
(45, 'tour_de_glace_2026', 94, 21, 'Remco Evenepoel', '2026-07-07 18:01:04', '2026-07-07 18:01:04'),
(46, 'tour_de_glace_2026', 94, 20, 'Kevin Vauquelin', '2026-07-07 18:01:27', '2026-07-07 18:01:27');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `tour_de_glace_stage_tips`
--
ALTER TABLE `tour_de_glace_stage_tips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_tdg_stage_tip` (`campaign_id`,`user_id`,`stage_number`),
  ADD KEY `idx_tdg_stage_tips_user` (`campaign_id`,`user_id`),
  ADD KEY `idx_tdg_stage_tips_stage` (`campaign_id`,`stage_number`),
  ADD KEY `fk_tdg_stage_tip_user` (`user_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `tour_de_glace_stage_tips`
--
ALTER TABLE `tour_de_glace_stage_tips`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `tour_de_glace_stage_tips`
--
ALTER TABLE `tour_de_glace_stage_tips`
  ADD CONSTRAINT `fk_tdg_stage_tip_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
