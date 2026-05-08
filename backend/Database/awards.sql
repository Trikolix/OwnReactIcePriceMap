-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 08. Mai 2026 um 15:41
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `k320202_iceapp_dev`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `awards`
--

CREATE TABLE `awards` (
  `id` int NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `visibility` enum('public','secret','preview') COLLATE utf8mb4_general_ci DEFAULT 'public',
  `is_repeatable` tinyint(1) DEFAULT '0',
  `repeat_xp_type` enum('full','reduced','none') COLLATE utf8mb4_general_ci DEFAULT 'full',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `awards`
--

INSERT INTO `awards` (`id`, `code`, `category`, `visibility`, `is_repeatable`, `repeat_xp_type`, `created_at`) VALUES
(1, 'county_visit', 'Eisdielen in verschiedenen Landkreisen', 'public', 0, 'full', '2025-04-23 09:49:27'),
(2, 'checkin_count', 'Anzahl an Checkins', 'public', 0, 'full', '2025-04-23 11:42:00'),
(3, 'count_kugeleis', 'Anzahl gegessener Kugeln Eis', 'public', 0, 'full', '2025-04-23 11:42:44'),
(4, 'count_softice', 'Anzahl gegessener Softeis', 'public', 0, 'full', '2025-04-23 11:42:58'),
(5, 'count_sundea', 'Anzahl gegessener Eisbecher', 'public', 0, 'full', '2025-04-23 11:43:12'),
(6, 'count_photos', 'Anzahl an Checkins mit Foto', 'public', 0, 'full', '2025-04-23 11:43:46'),
(7, 'count_pricesubmit', 'Anzahl Preismeldungen', 'public', 0, 'full', '2025-04-24 09:26:22'),
(8, 'count_iceshopsubmit', 'Anzahl eingetragener Eisdielen', 'public', 0, 'full', '2025-04-24 09:32:56'),
(9, 'all_ice_types', 'Jede Form von Eis ist wunderbar!', 'public', 0, 'full', '2025-04-25 01:35:21'),
(10, 'Fuerst_pueckler', 'Vanille, Erdbeer und Schoko Eis eingecheckt ', 'public', 0, 'full', '2025-04-25 01:46:35'),
(11, 'perfect_week', '7 Tage lang jeden Tag Eis eingecheckt ', 'public', 0, 'full', '2025-04-25 02:04:56'),
(12, 'bundesland_count', 'Eisdielen in verschiedenen Bundesländern', 'public', 0, 'full', '2025-04-25 04:48:25'),
(13, 'day_streak', 'Anzahl besuchter Eisdielen an einem tag', 'public', 0, 'full', '2025-05-04 18:22:58'),
(14, 'distance_ice_traveler', '2 Eisdielen - 100km Entfernung an einem Tag', 'public', 0, 'full', '2025-05-07 18:53:11'),
(15, 'Route_creator', 'Erstelle öffentliche Routen', 'public', 0, 'full', '2025-05-07 19:40:15'),
(16, 'private_route_creator', 'Private Routen erstellt', 'public', 0, 'full', '2025-05-08 12:30:37'),
(17, 'Stammkunde', 'Anzahl bei gleicher Eisdiele eingecheckt', 'public', 0, 'full', '2025-05-09 09:22:54'),
(18, 'Geschmackstreue', 'Anzahl eine Eissorte gegessen', 'public', 0, 'full', '2025-05-09 09:27:44'),
(19, 'laender_besucht', 'Eis in bestimmten Ländern eingecheckt', 'public', 0, 'full', '2025-05-10 11:32:23'),
(20, 'chemnitz2025', 'Chemnitz 2025: Kulturhauptstadt Europas', 'public', 0, 'full', '2025-05-25 14:38:19'),
(21, 'laender_count', 'Eis in unterschiedlichen Ländern gegessen', 'public', 0, 'full', '2025-05-29 04:23:21'),
(22, 'bundesland_experte', 'Mehr als 30 Eis in einem Bundesland', 'public', 0, 'full', '2025-06-02 08:19:17'),
(23, 'cycling_count', 'Anzahl per Fahrrad besuche Eisdielen', 'public', 0, 'full', '2025-06-16 06:14:49'),
(24, 'walk_count', 'Eisdielen zu Fuß besucht', 'public', 0, 'full', '2025-06-18 06:38:30'),
(25, 'bike_count', 'Eisdielen mit Motorrad besucht', 'public', 0, 'full', '2025-06-18 06:47:10'),
(26, 'early_starter', 'Für die ersten aktiven Nutzer', 'public', 0, 'full', '2025-06-19 07:53:43'),
(27, 'ice_summer', 'Hat mehrere Eis in einem Sommer gegessen', 'public', 0, 'full', '2025-06-19 07:55:52'),
(28, 'different_iceshops', 'Verschiedene Eisdielen besucht', 'public', 0, 'full', '2025-06-19 07:59:22'),
(29, 'award_collector', 'Hat mehrere Awards gesammelt', 'public', 0, 'full', '2025-06-19 08:21:19'),
(30, 'geschmacksvielfalt', 'Verschieden Eissorten gegessen', 'public', 0, 'full', '2025-06-19 09:17:45'),
(31, 'iceportions_per_week', 'Eisportionen in einer Woche eingecheckt', 'public', 0, 'full', '2025-06-23 05:54:38'),
(32, 'detailed_checkin', 'Mindestanzahl Zeichen bei Checkin', 'public', 0, 'full', '2025-06-23 08:00:18'),
(33, 'detailed_checkin-count', 'Anzahl ausführlicher Rezensionen', 'public', 0, 'full', '2025-06-23 08:09:03'),
(34, 'referred_users', 'geworbene Nutzer', 'public', 0, 'full', '2025-06-25 20:25:59'),
(35, 'comment_count', 'Anzahl Kommentare', 'public', 0, 'full', '2025-07-09 06:41:49'),
(36, 'streak_week', 'Wochen am Stück mit mind. 1 Checkin', 'public', 0, 'full', '2025-07-20 05:14:54'),
(37, 'one_more_loop', 'Für Teilnehmer vom OneMoreLoop Brevet', 'public', 0, 'full', '2025-07-22 12:29:25'),
(38, 'on_site_checkins', 'Checkins direkt vor Ort', 'public', 0, 'full', '2025-08-22 08:13:26'),
(39, 'oeffis_count', 'Anzahl Eisdielen mit Öffis besucht', 'public', 0, 'full', '2025-08-23 04:03:45'),
(40, 'epr_2025', 'European Peace Ride 2025', 'public', 0, 'full', '2025-08-23 04:30:43'),
(41, 'daily_challanges', 'Tägliche Challenges abgeschlossen', 'public', 0, 'full', '2025-08-30 00:38:29'),
(42, 'ice_winter', 'Hat X Eis im Winter gegessen ', 'public', 0, 'full', '2025-09-06 06:13:25'),
(43, 'user_of_the_month', 'Nutzer/in des Monats', 'public', 0, 'full', '2025-09-09 05:59:50'),
(44, 'ein_mal_eins', 'X Eisdielen jeweils X mal besucht', 'public', 0, 'full', '2025-09-17 06:18:30'),
(45, 'challenges_completed', 'Abgeschlossene Challenges', 'public', 0, 'full', '2025-09-19 05:19:56'),
(46, 'ice_autumn', 'Hat X Eis im Herbst gegessen', 'public', 0, 'full', '2025-09-25 06:12:26'),
(47, 'ice_spring', 'Hat X Eis im Frühling gegessen', 'public', 0, 'full', '2025-09-25 06:12:38'),
(48, 'four_seasons', 'In allen 4 Jahreszeiten gut Eis gegessen', 'public', 0, 'full', '2025-10-24 19:50:34'),
(49, 'multiple_vehicle', 'Mit verschiedenen Verkehrsmitteln angereist', 'public', 0, 'full', '2025-10-24 19:51:48'),
(50, 'count_group_checkins', 'Anzahl Gruppen-Checkins', 'public', 0, 'full', '2025-10-26 04:40:27'),
(51, 'size_checkin_group', 'Eis mit einer richtig großen Meute gegessen', 'public', 0, 'full', '2025-10-26 04:58:47'),
(52, 'photo_challenge_winners', 'Gewinner von Fotochallenges', 'public', 0, 'full', '2025-11-27 11:12:05'),
(53, 'Seasonal_presents', 'Kleine Bonus Awards für Feiertage', 'public', 0, 'full', '2025-12-20 04:16:29'),
(54, 'easter_eggs', 'geheime Awards für Aktionen', 'public', 0, 'full', '2025-12-24 11:14:26'),
(55, 'ice_olympia_2026', 'Eis-Winterolympiade 2026', 'public', 0, 'full', '2026-02-04 07:01:37'),
(56, 'taste_of_chemnitz', 'The Taste of Chemnitz', 'public', 0, 'full', '2026-03-05 08:49:47'),
(57, 'first_iceapp_birthday', 'Aktion zum 1. Geburtstag der Ice-App', 'public', 0, 'full', '2026-03-06 08:18:12'),
(58, 'multiple_challenges', 'Mehrere Challenges an einem Tag', 'public', 0, 'full', '2026-03-10 06:06:26'),
(59, 'ice_app_years_membership', 'X Jahre Mitgliedschaft bei der Ice-App', 'public', 0, 'full', '2026-03-17 18:12:23'),
(60, 'team_challenge_count', 'Anzahl abgeschlossene Team-Challenges', 'public', 0, 'full', '2026-03-27 07:42:23'),
(61, 'photo_challenge_votes', 'X mal bei Fotochallenge gevotet', 'public', 0, 'full', '2026-03-27 08:44:58'),
(62, 'ice_tour', 'Ice-Tour ', 'public', 0, 'full', '2026-04-24 07:19:59'),
(63, 'favorite_ice_shops', 'favorisierte Eisdielen', 'public', 0, 'full', '2026-05-05 16:22:31'),
(67, 'has_avatar', 'Hat ein Profilbild / Avatar', 'public', 0, 'full', '2026-05-08 13:31:40');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `awards`
--
ALTER TABLE `awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
