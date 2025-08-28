-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:24
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
-- Tabellenstruktur für Tabelle `benachrichtigungen`
--

CREATE TABLE `benachrichtigungen` (
  `id` int NOT NULL,
  `empfaenger_id` int NOT NULL,
  `typ` enum('kommentar','new_user') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `referenz_id` int NOT NULL,
  `text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ist_gelesen` tinyint(1) DEFAULT '0',
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `zusatzdaten` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `benachrichtigungen`
--

INSERT INTO `benachrichtigungen` (`id`, `empfaenger_id`, `typ`, `referenz_id`, `text`, `ist_gelesen`, `erstellt_am`, `zusatzdaten`) VALUES
(1, 19, 'kommentar', 1, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:38:17', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"1\"}'),
(2, 8, 'kommentar', 2, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:39:49', '{\"checkin_id\":185,\"eisdiele_id\":42,\"kommentar_id\":\"2\"}'),
(3, 2, 'kommentar', 3, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:40:33', '{\"checkin_id\":182,\"eisdiele_id\":207,\"kommentar_id\":\"3\"}'),
(4, 23, 'kommentar', 4, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:42:36', '{\"checkin_id\":184,\"eisdiele_id\":105,\"kommentar_id\":\"4\"}'),
(5, 47, 'kommentar', 5, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:56:36', '{\"checkin_id\":187,\"eisdiele_id\":208,\"kommentar_id\":\"5\"}'),
(6, 30, 'kommentar', 6, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 06:00:57', '{\"checkin_id\":180,\"eisdiele_id\":206,\"kommentar_id\":\"6\"}'),
(7, 2, 'kommentar', 7, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 06:06:10', '{\"checkin_id\":71,\"eisdiele_id\":132,\"kommentar_id\":\"7\"}'),
(9, 19, 'kommentar', 9, 'Admin hat deinen Check-in kommentiert.', 1, '2025-06-13 06:25:04', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"9\"}'),
(10, 1, 'kommentar', 9, 'Admin hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-13 06:25:04', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"9\"}'),
(15, 8, 'kommentar', 12, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 11:27:40', '{\"checkin_id\":188,\"eisdiele_id\":10,\"kommentar_id\":\"12\"}'),
(16, 23, 'kommentar', 13, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-15 18:17:10', '{\"checkin_id\":193,\"eisdiele_id\":106,\"kommentar_id\":\"13\"}'),
(17, 2, 'kommentar', 14, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-15 18:17:52', '{\"checkin_id\":190,\"eisdiele_id\":47,\"kommentar_id\":\"14\"}'),
(18, 1, 'kommentar', 15, 'Holzmichl hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-16 08:07:15', '{\"checkin_id\":193,\"eisdiele_id\":106,\"kommentar_id\":\"15\"}'),
(19, 31, 'kommentar', 16, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-16 15:51:30', '{\"checkin_id\":194,\"eisdiele_id\":212,\"kommentar_id\":\"16\"}'),
(20, 1, 'kommentar', 17, 'Kristin hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-17 16:13:17', '{\"checkin_id\":187,\"eisdiele_id\":208,\"kommentar_id\":\"17\"}'),
(21, 31, 'kommentar', 18, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-17 17:36:42', '{\"checkin_id\":198,\"eisdiele_id\":215,\"kommentar_id\":\"18\"}'),
(22, 50, 'kommentar', 19, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-17 17:37:21', '{\"checkin_id\":195,\"eisdiele_id\":11,\"kommentar_id\":\"19\"}'),
(23, 47, 'kommentar', 20, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-17 17:37:53', '{\"checkin_id\":199,\"eisdiele_id\":171,\"kommentar_id\":\"20\"}'),
(24, 1, 'kommentar', 21, 'yannickr.t hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-17 20:10:01', '{\"checkin_id\":194,\"eisdiele_id\":212,\"kommentar_id\":\"21\"}'),
(25, 49, 'kommentar', 22, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-18 17:15:30', '{\"checkin_id\":205,\"eisdiele_id\":224,\"kommentar_id\":\"22\"}'),
(26, 1, 'kommentar', 23, 'Thomas hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-19 11:57:29', '{\"checkin_id\":205,\"eisdiele_id\":224,\"kommentar_id\":\"23\"}'),
(27, 52, 'kommentar', 24, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-21 03:06:54', '{\"checkin_id\":217,\"eisdiele_id\":238,\"kommentar_id\":\"24\"}'),
(28, 5, 'kommentar', 25, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-23 15:48:45', '{\"checkin_id\":232,\"eisdiele_id\":250,\"kommentar_id\":\"25\"}'),
(29, 53, 'kommentar', 26, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-25 14:36:25', '{\"checkin_id\":246,\"eisdiele_id\":1,\"kommentar_id\":\"26\"}'),
(30, 49, 'kommentar', 27, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-25 15:21:10', '{\"checkin_id\":247,\"eisdiele_id\":261,\"kommentar_id\":\"27\"}'),
(31, 1, 'new_user', 58, 'Testaccount2 hat sich über deinen Einladungslink registriert.', 1, '2025-06-26 06:32:17', NULL),
(32, 13, 'new_user', 60, 'Testaccount hat sich über deinen Einladungslink registriert.', 1, '2025-06-27 19:14:10', NULL),
(33, 63, 'kommentar', 28, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-29 13:34:33', '{\"checkin_id\":256,\"eisdiele_id\":267,\"kommentar_id\":\"28\"}'),
(34, 52, 'new_user', 64, 'Melanie hat sich über deinen Einladungslink registriert.', 1, '2025-06-30 11:48:55', NULL),
(35, 52, 'new_user', 65, 'Marissi hat sich über deinen Einladungslink registriert.', 1, '2025-06-30 11:56:29', NULL),
(36, 52, 'new_user', 66, 'Lilli hat sich über deinen Einladungslink registriert.', 1, '2025-06-30 13:04:50', NULL),
(37, 52, 'kommentar', 29, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-30 13:05:03', '{\"checkin_id\":264,\"eisdiele_id\":271,\"kommentar_id\":\"29\"}'),
(38, 52, 'new_user', 67, 'Uschi hat sich über deinen Einladungslink registriert.', 1, '2025-06-30 13:05:09', NULL),
(39, 1, 'kommentar', 30, 'alinaa.wrnr hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-30 18:16:58', '{\"checkin_id\":264,\"eisdiele_id\":271,\"kommentar_id\":\"30\"}'),
(40, 68, 'kommentar', 31, 'Luca hat deinen Check-in kommentiert.', 0, '2025-07-01 18:19:04', '{\"checkin_id\":266,\"eisdiele_id\":195,\"kommentar_id\":\"31\"}'),
(41, 31, 'new_user', 69, 'Silke hat sich über deinen Einladungslink registriert.', 1, '2025-07-02 14:35:42', NULL),
(42, 55, 'kommentar', 32, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-03 16:23:48', '{\"checkin_id\":275,\"eisdiele_id\":286,\"kommentar_id\":\"32\"}'),
(43, 40, 'kommentar', 33, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-04 19:10:45', '{\"checkin_id\":277,\"eisdiele_id\":289,\"kommentar_id\":\"33\"}'),
(44, 52, 'new_user', 71, 'Maria hat sich über deinen Einladungslink registriert.', 1, '2025-07-05 08:16:46', NULL),
(45, 52, 'new_user', 72, 'Fionski hat sich über deinen Einladungslink registriert.', 1, '2025-07-05 09:32:57', NULL),
(46, 52, 'new_user', 73, 'Emmskopf hat sich über deinen Einladungslink registriert.', 0, '2025-07-05 09:49:51', NULL),
(47, 31, 'new_user', 74, 'Tische hat sich über deinen Einladungslink registriert.', 0, '2025-07-05 12:58:07', NULL),
(48, 1, 'new_user', 75, 'Brommsler hat sich über deinen Einladungslink registriert.', 1, '2025-07-05 14:55:58', NULL),
(49, 8, 'kommentar', 34, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-05 20:11:23', '{\"checkin_id\":286,\"eisdiele_id\":295,\"kommentar_id\":\"34\"}'),
(50, 52, 'new_user', 76, 'marvxn hat sich über deinen Einladungslink registriert.', 0, '2025-07-06 11:53:27', NULL),
(51, 1, 'kommentar', 35, 'Anton hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-07-06 14:32:20', '{\"checkin_id\":277,\"eisdiele_id\":289,\"kommentar_id\":\"35\"}'),
(52, 40, 'new_user', 78, 'Ratatouille hat sich über deinen Einladungslink registriert.', 1, '2025-07-06 15:11:33', NULL),
(53, 1, 'kommentar', 36, 'Luca hat deinen Check-in kommentiert.', 1, '2025-07-06 20:38:41', '{\"checkin_id\":283,\"eisdiele_id\":292,\"kommentar_id\":\"36\"}'),
(54, 31, 'kommentar', 37, 'Luca hat deinen Check-in kommentiert.', 1, '2025-07-06 20:40:01', '{\"checkin_id\":281,\"eisdiele_id\":8,\"kommentar_id\":\"37\"}'),
(55, 52, 'new_user', 80, 'Lenny hat sich über deinen Einladungslink registriert.', 0, '2025-07-07 13:48:12', NULL),
(56, 52, 'new_user', 82, 'RW hat sich über deinen Einladungslink registriert.', 0, '2025-07-08 16:30:36', NULL),
(57, 52, 'new_user', 84, 'Schaf hat sich über deinen Einladungslink registriert.', 0, '2025-07-08 17:31:14', NULL),
(58, 52, 'new_user', 85, 'Rudi hat sich über deinen Einladungslink registriert.', 0, '2025-07-08 17:33:24', NULL),
(59, 8, 'kommentar', 38, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-09 04:16:20', '{\"checkin_id\":307,\"eisdiele_id\":307,\"kommentar_id\":\"38\"}'),
(60, 86, 'kommentar', 39, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-10 16:53:51', '{\"checkin_id\":313,\"eisdiele_id\":315,\"kommentar_id\":\"39\"}'),
(61, 48, 'kommentar', 40, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-10 17:35:57', '{\"checkin_id\":316,\"eisdiele_id\":318,\"kommentar_id\":\"40\"}'),
(62, 81, 'kommentar', 41, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-07-14 14:58:51', '{\"checkin_id\":331,\"eisdiele_id\":339,\"kommentar_id\":\"41\"}'),
(63, 81, 'kommentar', 42, 'Luca hat deinen Check-in kommentiert.', 0, '2025-07-14 16:14:13', '{\"checkin_id\":331,\"eisdiele_id\":339,\"kommentar_id\":\"42\"}'),
(64, 1, 'kommentar', 42, 'Luca hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-07-14 16:14:13', '{\"checkin_id\":331,\"eisdiele_id\":339,\"kommentar_id\":\"42\"}'),
(65, 1, 'kommentar', 43, 'Luca hat deinen Check-in kommentiert.', 1, '2025-07-14 16:15:02', '{\"checkin_id\":325,\"eisdiele_id\":333,\"kommentar_id\":\"43\"}'),
(66, 1, 'kommentar', 44, 'Holger hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-07-14 16:53:21', '{\"checkin_id\":331,\"eisdiele_id\":339,\"kommentar_id\":\"44\"}'),
(67, 2, 'kommentar', 44, 'Holger hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-07-14 16:53:21', '{\"checkin_id\":331,\"eisdiele_id\":339,\"kommentar_id\":\"44\"}'),
(68, 4, 'kommentar', 45, 'Luca hat deinen Check-in kommentiert.', 0, '2025-07-14 18:20:53', '{\"checkin_id\":259,\"eisdiele_id\":273,\"kommentar_id\":\"45\"}'),
(69, 1, 'kommentar', 46, 'Enkiboy hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-07-14 20:36:09', '{\"checkin_id\":307,\"eisdiele_id\":307,\"kommentar_id\":\"46\"}'),
(70, 22, 'new_user', 90, 'Phil hat sich über deinen Einladungslink registriert.', 1, '2025-07-15 18:40:32', NULL),
(71, 22, 'new_user', 91, 'Anni113 hat sich über deinen Einladungslink registriert.', 1, '2025-07-15 18:47:24', NULL),
(72, 55, 'kommentar', 52, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-18 20:01:47', '{\"checkin_id\":351,\"eisdiele_id\":357,\"kommentar_id\":\"52\"}'),
(73, 1, 'new_user', 92, 'Daniel hat sich über deinen Einladungslink registriert.', 1, '2025-07-20 19:00:12', NULL),
(74, 8, 'new_user', 93, 'Lexi hat sich über deinen Einladungslink registriert.', 1, '2025-07-21 20:05:10', NULL),
(75, 93, 'kommentar', 53, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-07-22 06:26:49', '{\"checkin_id\":371,\"eisdiele_id\":372,\"kommentar_id\":\"53\"}'),
(76, 94, 'kommentar', 54, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-07-22 17:09:52', '{\"checkin_id\":372,\"eisdiele_id\":375,\"kommentar_id\":\"54\"}'),
(77, 1, 'new_user', 95, 'Romy hat sich über deinen Einladungslink registriert.', 1, '2025-07-22 21:38:57', NULL),
(78, 86, 'kommentar', 55, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-23 13:04:35', '{\"checkin_id\":373,\"eisdiele_id\":376,\"kommentar_id\":\"55\"}'),
(79, 22, 'kommentar', 56, 'Anton hat deinen Check-in kommentiert.', 1, '2025-07-25 17:26:15', '{\"checkin_id\":378,\"eisdiele_id\":290,\"kommentar_id\":\"56\"}'),
(80, 40, 'new_user', 97, 'Markus hat sich über deinen Einladungslink registriert.', 1, '2025-07-26 16:42:41', NULL),
(81, 96, 'kommentar', 57, 'Luca hat deinen Check-in kommentiert.', 1, '2025-07-29 15:20:40', '{\"checkin_id\":400,\"eisdiele_id\":390,\"kommentar_id\":\"57\"}'),
(82, 53, 'kommentar', 58, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-07-30 18:17:54', '{\"checkin_id\":403,\"eisdiele_id\":1,\"kommentar_id\":\"58\"}'),
(83, 2, 'kommentar', 59, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-01 12:49:36', '{\"checkin_id\":406,\"eisdiele_id\":392,\"kommentar_id\":\"59\"}'),
(84, 1, 'new_user', 101, 'grumpelstielzchen hat sich über deinen Einladungslink registriert.', 1, '2025-08-01 14:35:22', NULL),
(85, 23, 'kommentar', 60, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-01 19:47:41', '{\"checkin_id\":409,\"eisdiele_id\":395,\"kommentar_id\":\"60\"}'),
(86, 63, 'kommentar', 61, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-08-01 19:51:04', '{\"checkin_id\":410,\"eisdiele_id\":396,\"kommentar_id\":\"61\"}'),
(87, 99, 'kommentar', 62, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-08-01 20:36:06', '{\"checkin_id\":411,\"eisdiele_id\":396,\"kommentar_id\":\"62\"}'),
(88, 1, 'new_user', 104, 'MayA hat sich über deinen Einladungslink registriert.', 1, '2025-08-02 05:41:11', NULL),
(89, 1, 'kommentar', 63, 'Holzmichl hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-02 12:29:58', '{\"checkin_id\":409,\"eisdiele_id\":395,\"kommentar_id\":\"63\"}'),
(90, 1, 'kommentar', 64, 'TheGourmetBiker hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-02 12:48:22', '{\"checkin_id\":406,\"eisdiele_id\":392,\"kommentar_id\":\"64\"}'),
(91, 23, 'new_user', 106, 'Iceroadtrucker hat sich über deinen Einladungslink registriert.', 1, '2025-08-02 15:40:41', NULL),
(92, 106, 'kommentar', 65, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-08-02 18:40:19', '{\"checkin_id\":419,\"eisdiele_id\":398,\"kommentar_id\":\"65\"}'),
(93, 106, 'kommentar', 66, 'TheGourmetBiker hat deinen Check-in kommentiert.', 0, '2025-08-03 14:38:32', '{\"checkin_id\":419,\"eisdiele_id\":398,\"kommentar_id\":\"66\"}'),
(94, 1, 'kommentar', 66, 'TheGourmetBiker hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-03 14:38:32', '{\"checkin_id\":419,\"eisdiele_id\":398,\"kommentar_id\":\"66\"}'),
(95, 1, 'kommentar', 67, 'TheGourmetBiker hat deinen Check-in kommentiert.', 1, '2025-08-03 14:38:58', '{\"checkin_id\":418,\"eisdiele_id\":145,\"kommentar_id\":\"67\"}'),
(96, 103, 'kommentar', 68, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-06 05:35:48', '{\"checkin_id\":424,\"eisdiele_id\":28,\"kommentar_id\":\"68\"}'),
(97, 1, 'kommentar', 69, 'IceGoe hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-06 18:56:02', '{\"checkin_id\":403,\"eisdiele_id\":1,\"kommentar_id\":\"69\"}'),
(98, 53, 'kommentar', 70, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-06 19:19:41', '{\"checkin_id\":432,\"eisdiele_id\":165,\"kommentar_id\":\"70\"}'),
(99, 31, 'kommentar', 71, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-07 18:59:10', '{\"checkin_id\":439,\"eisdiele_id\":271,\"kommentar_id\":\"71\"}'),
(100, 1, 'kommentar', 72, 'yannickr.t hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-08 08:48:53', '{\"checkin_id\":439,\"eisdiele_id\":271,\"kommentar_id\":\"72\"}'),
(101, 102, 'new_user', 115, 'Hagen hat sich über deinen Einladungslink registriert.', 0, '2025-08-09 17:14:35', NULL),
(102, 53, 'kommentar', 73, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-13 15:36:31', '{\"checkin_id\":458,\"eisdiele_id\":1,\"kommentar_id\":\"73\"}'),
(103, 96, 'kommentar', 74, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-16 14:54:13', '{\"checkin_id\":467,\"eisdiele_id\":416,\"kommentar_id\":\"74\"}'),
(104, 118, 'kommentar', 75, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-08-17 14:36:52', '{\"checkin_id\":468,\"eisdiele_id\":314,\"kommentar_id\":\"75\"}'),
(105, 2, 'new_user', 119, 'Gelatobert hat sich über deinen Einladungslink registriert.', 1, '2025-08-17 20:21:43', NULL),
(106, 1, 'kommentar', 76, 'GourmetKommissar hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-08-18 02:59:08', '{\"checkin_id\":467,\"eisdiele_id\":416,\"kommentar_id\":\"76\"}'),
(107, 96, 'new_user', 121, 'Gustomucho233 hat sich über deinen Einladungslink registriert.', 1, '2025-08-22 17:06:51', NULL),
(108, 52, 'kommentar', 77, 'TheGourmetBiker hat deinen Check-in kommentiert.', 0, '2025-08-23 19:01:49', '{\"checkin_id\":473,\"eisdiele_id\":418,\"kommentar_id\":\"77\"}'),
(109, 1, 'kommentar', 78, 'TheGourmetBiker hat deinen Check-in kommentiert.', 1, '2025-08-23 19:02:29', '{\"checkin_id\":471,\"eisdiele_id\":84,\"kommentar_id\":\"78\"}'),
(110, 8, 'new_user', 124, 'Mr. Uno hat sich über deinen Einladungslink registriert.', 0, '2025-08-27 08:09:29', NULL),
(111, 74, 'kommentar', 79, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-08-27 14:05:51', '{\"checkin_id\":492,\"eisdiele_id\":424,\"kommentar_id\":\"79\"}');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `benachrichtigungen`
--
ALTER TABLE `benachrichtigungen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empfaenger_id` (`empfaenger_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `benachrichtigungen`
--
ALTER TABLE `benachrichtigungen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `benachrichtigungen`
--
ALTER TABLE `benachrichtigungen`
  ADD CONSTRAINT `benachrichtigungen_ibfk_1` FOREIGN KEY (`empfaenger_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
