-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 05. Nov 2025 um 08:20
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
-- Tabellenstruktur für Tabelle `wochenstatistiken`
--

CREATE TABLE `wochenstatistiken` (
  `id` int NOT NULL,
  `start_datum` date NOT NULL,
  `end_datum` date NOT NULL,
  `neue_nutzer` int NOT NULL,
  `neue_eisdielen` int NOT NULL,
  `aktive_nutzer` int NOT NULL,
  `checkins` int NOT NULL,
  `portionen` int NOT NULL,
  `laender_mit_checkins` int NOT NULL,
  `gesamt_nutzer` int NOT NULL,
  `gesamt_checkins` int NOT NULL,
  `gesamt_eisdielen` int NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verteilung_checkins_typ` json DEFAULT NULL,
  `verteilung_anreise` json DEFAULT NULL,
  `verteilung_bild` json DEFAULT NULL,
  `verteilung_ort` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `wochenstatistiken`
--

INSERT INTO `wochenstatistiken` (`id`, `start_datum`, `end_datum`, `neue_nutzer`, `neue_eisdielen`, `aktive_nutzer`, `checkins`, `portionen`, `laender_mit_checkins`, `gesamt_nutzer`, `gesamt_checkins`, `gesamt_eisdielen`, `erstellt_am`, `verteilung_checkins_typ`, `verteilung_anreise`, `verteilung_bild`, `verteilung_ort`) VALUES
(1, '2025-03-31', '2025-04-06', 2, 16, 0, 0, 0, 0, 4, 0, 69, '2025-07-22 09:41:54', '[]', '[]', '[]', NULL),
(2, '2025-04-07', '2025-04-13', 1, 19, 0, 0, 0, 0, 5, 0, 88, '2025-07-22 09:41:54', '[]', '[]', '[]', NULL),
(3, '2025-04-14', '2025-04-20', 2, 5, 2, 10, 20, 1, 7, 10, 93, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 10}]', '[{\"anzahl\": 1, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 7, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}, {\"anzahl\": 1, \"anreise\": null}]', '[{\"anzahl\": 9, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}]', NULL),
(4, '2025-04-21', '2025-04-27', 2, 17, 5, 24, 29, 1, 9, 34, 110, '2025-07-22 09:41:54', '[{\"typ\": \"Softeis\", \"anzahl\": 5}, {\"typ\": \"Kugel\", \"anzahl\": 19}]', '[{\"anzahl\": 5, \"anreise\": null}, {\"anzahl\": 16, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 3, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 20, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 4, \"bild_status\": \"Ohne Bild\"}]', NULL),
(5, '2025-04-28', '2025-05-04', 3, 9, 6, 18, 21, 2, 12, 52, 119, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 9}, {\"typ\": \"Softeis\", \"anzahl\": 5}, {\"typ\": \"Eisbecher\", \"anzahl\": 4}]', '[{\"anzahl\": 9, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}, {\"anzahl\": 7, \"anreise\": null}, {\"anzahl\": 1, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 15, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 3, \"bild_status\": \"Ohne Bild\"}]', NULL),
(6, '2025-05-05', '2025-05-11', 5, 14, 6, 13, 13, 1, 17, 65, 133, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 8}, {\"typ\": \"Eisbecher\", \"anzahl\": 1}, {\"typ\": \"Softeis\", \"anzahl\": 4}]', '[{\"anzahl\": 10, \"anreise\": null}, {\"anzahl\": 3, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 11, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 2, \"bild_status\": \"Ohne Bild\"}]', NULL),
(7, '2025-05-12', '2025-05-18', 1, 5, 6, 10, 18, 1, 18, 75, 138, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 6}, {\"typ\": \"Softeis\", \"anzahl\": 4}]', '[{\"anzahl\": 1, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 6, \"anreise\": null}, {\"anzahl\": 1, \"anreise\": \"Auto\"}, {\"anzahl\": 2, \"anreise\": \"Fahrrad\"}]', '[{\"anzahl\": 8, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 2, \"bild_status\": \"Ohne Bild\"}]', NULL),
(8, '2025-05-19', '2025-05-25', 3, 6, 4, 10, 15, 2, 21, 85, 144, '2025-07-22 09:41:54', '[{\"typ\": \"Softeis\", \"anzahl\": 3}, {\"typ\": \"Kugel\", \"anzahl\": 6}, {\"typ\": \"Eisbecher\", \"anzahl\": 1}]', '[{\"anzahl\": 6, \"anreise\": null}, {\"anzahl\": 3, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}]', '[{\"anzahl\": 9, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}]', NULL),
(9, '2025-05-26', '2025-06-01', 16, 19, 11, 24, 43, 4, 37, 109, 163, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 18}, {\"typ\": \"Softeis\", \"anzahl\": 6}]', '[{\"anzahl\": 14, \"anreise\": null}, {\"anzahl\": 9, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 19, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 5, \"bild_status\": \"Ohne Bild\"}]', NULL),
(10, '2025-06-02', '2025-06-08', 2, 4, 5, 8, 11, 1, 39, 117, 167, '2025-07-22 09:41:54', '[{\"typ\": \"Softeis\", \"anzahl\": 1}, {\"typ\": \"Kugel\", \"anzahl\": 7}]', '[{\"anzahl\": 1, \"anreise\": null}, {\"anzahl\": 5, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}, {\"anzahl\": 1, \"anreise\": \"Sonstiges\"}]', '[{\"anzahl\": 7, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}]', NULL),
(11, '2025-06-09', '2025-06-15', 3, 3, 6, 9, 18, 1, 42, 126, 170, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 6}, {\"typ\": \"Softeis\", \"anzahl\": 3}]', '[{\"anzahl\": 5, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 2, \"anreise\": \"Auto\"}, {\"anzahl\": 2, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 8, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}]', NULL),
(12, '2025-06-16', '2025-06-22', 6, 37, 12, 35, 45, 3, 48, 161, 207, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 32}, {\"typ\": \"Softeis\", \"anzahl\": 3}]', '[{\"anzahl\": 2, \"anreise\": \"Sonstiges\"}, {\"anzahl\": 16, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 11, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 2, \"anreise\": \"Motorrad\"}, {\"anzahl\": 2, \"anreise\": \"Auto\"}, {\"anzahl\": 2, \"anreise\": \"\"}]', '[{\"anzahl\": 30, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 5, \"bild_status\": \"Ohne Bild\"}]', NULL),
(13, '2025-06-23', '2025-06-29', 3, 26, 12, 29, 36, 5, 51, 190, 233, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 25}, {\"typ\": \"Eisbecher\", \"anzahl\": 3}, {\"typ\": \"Softeis\", \"anzahl\": 1}]', '[{\"anzahl\": 17, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 2, \"anreise\": \"Motorrad\"}, {\"anzahl\": 6, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Bus / Bahn\"}, {\"anzahl\": 3, \"anreise\": \"Auto\"}]', '[{\"anzahl\": 27, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 2, \"bild_status\": \"Ohne Bild\"}]', NULL),
(14, '2025-06-30', '2025-07-06', 16, 25, 17, 41, 69, 4, 67, 231, 258, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 35}, {\"typ\": \"Softeis\", \"anzahl\": 2}, {\"typ\": \"Eisbecher\", \"anzahl\": 4}]', '[{\"anzahl\": 8, \"anreise\": \"Auto\"}, {\"anzahl\": 12, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 2, \"anreise\": \"\"}, {\"anzahl\": 18, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"Bus / Bahn\"}]', '[{\"anzahl\": 30, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 11, \"bild_status\": \"Ohne Bild\"}]', NULL),
(15, '2025-07-07', '2025-07-13', 10, 35, 10, 27, 49, 6, 77, 258, 293, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 23}, {\"typ\": \"Eisbecher\", \"anzahl\": 3}, {\"typ\": \"Softeis\", \"anzahl\": 1}]', '[{\"anzahl\": 15, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 4, \"anreise\": \"Auto\"}, {\"anzahl\": 7, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 21, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 6, \"bild_status\": \"Ohne Bild\"}]', NULL),
(16, '2025-07-14', '2025-07-20', 3, 34, 18, 37, 68, 6, 80, 295, 327, '2025-07-22 09:41:54', '[{\"typ\": \"Kugel\", \"anzahl\": 28}, {\"typ\": \"Eisbecher\", \"anzahl\": 5}, {\"typ\": \"Softeis\", \"anzahl\": 4}]', '[{\"anzahl\": 6, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 24, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"Motorrad\"}, {\"anzahl\": 4, \"anreise\": \"Auto\"}, {\"anzahl\": 1, \"anreise\": \"Bus / Bahn\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 27, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 10, \"bild_status\": \"Ohne Bild\"}]', NULL),
(17, '2025-07-21', '2025-07-27', 6, 15, 13, 27, 49, 5, 86, 322, 339, '2025-07-28 04:00:08', '[{\"typ\": \"Kugel\", \"anzahl\": 21}, {\"typ\": \"Softeis\", \"anzahl\": 3}, {\"typ\": \"Eisbecher\", \"anzahl\": 3}]', '[{\"anzahl\": 8, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}, {\"anzahl\": 17, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 33, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 5, \"bild_status\": \"Ohne Bild\"}]', NULL),
(18, '2025-07-28', '2025-08-03', 9, 15, 12, 27, 49, 3, 95, 349, 354, '2025-08-04 04:00:06', '[{\"typ\": \"Kugel\", \"anzahl\": 26}, {\"typ\": \"Softeis\", \"anzahl\": 1}]', '[{\"anzahl\": 6, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 20, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"Auto\"}]', '[{\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}, {\"anzahl\": 35, \"bild_status\": \"Mit Bild\"}]', NULL),
(19, '2025-08-04', '2025-08-10', 7, 8, 14, 30, 46, 3, 102, 380, 362, '2025-08-11 04:00:10', '[{\"typ\": \"Kugel\", \"anzahl\": 21}, {\"typ\": \"Eisbecher\", \"anzahl\": 4}, {\"typ\": \"Softeis\", \"anzahl\": 5}]', '[{\"anzahl\": 3, \"anreise\": \"\"}, {\"anzahl\": 10, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 10, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 5, \"anreise\": \"Auto\"}, {\"anzahl\": 1, \"anreise\": \"Motorrad\"}, {\"anzahl\": 1, \"anreise\": \"Bus / Bahn\"}]', '[{\"anzahl\": 30, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 7, \"bild_status\": \"Ohne Bild\"}]', NULL),
(20, '2025-08-11', '2025-08-17', 3, 8, 12, 19, 24, 3, 105, 399, 370, '2025-08-18 04:00:07', '[{\"typ\": \"Softeis\", \"anzahl\": 4}, {\"typ\": \"Kugel\", \"anzahl\": 15}]', '[{\"anzahl\": 10, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 4, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 3, \"anreise\": \"\"}, {\"anzahl\": 2, \"anreise\": \"Auto\"}]', '[{\"anzahl\": 13, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 6, \"bild_status\": \"Ohne Bild\"}]', NULL),
(21, '2025-08-18', '2025-08-24', 3, 3, 5, 9, 13, 1, 108, 408, 373, '2025-08-25 04:00:07', '[{\"typ\": \"Softeis\", \"anzahl\": 2}, {\"typ\": \"Kugel\", \"anzahl\": 7}]', '[{\"anzahl\": 7, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 1, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"Motorrad\"}]', '[{\"anzahl\": 9, \"bild_status\": \"Mit Bild\"}]', NULL),
(22, '2025-08-25', '2025-08-31', 6, 18, 14, 30, 49, 6, 114, 438, 391, '2025-09-01 04:00:11', '[{\"typ\": \"Kugel\", \"anzahl\": 24}, {\"typ\": \"Softeis\", \"anzahl\": 5}, {\"typ\": \"Eisbecher\", \"anzahl\": 1}]', '[{\"anzahl\": 12, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 5, \"anreise\": \"Auto\"}, {\"anzahl\": 12, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 22, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 8, \"bild_status\": \"Ohne Bild\"}]', NULL),
(23, '2025-09-01', '2025-09-07', 5, 27, 14, 27, 53, 5, 119, 465, 418, '2025-09-08 04:00:05', '[{\"typ\": \"Softeis\", \"anzahl\": 2}, {\"typ\": \"Kugel\", \"anzahl\": 22}, {\"typ\": \"Eisbecher\", \"anzahl\": 3}]', '[{\"anzahl\": 5, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 16, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 3, \"anreise\": \"Auto\"}, {\"anzahl\": 2, \"anreise\": \"Bus / Bahn\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 26, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 1, \"bild_status\": \"Ohne Bild\"}]', NULL),
(24, '2025-09-08', '2025-09-14', 3, 14, 7, 21, 35, 4, 122, 486, 432, '2025-09-15 04:00:07', '[{\"typ\": \"Kugel\", \"anzahl\": 17}, {\"typ\": \"Softeis\", \"anzahl\": 4}]', '[{\"anzahl\": 8, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 12, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"Bus / Bahn\"}]', '[{\"anzahl\": 19, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 2, \"bild_status\": \"Ohne Bild\"}]', NULL),
(25, '2025-09-15', '2025-09-21', 1, 7, 13, 27, 42, 1, 123, 513, 436, '2025-09-22 04:00:04', '[{\"typ\": \"Softeis\", \"anzahl\": 5}, {\"typ\": \"Kugel\", \"anzahl\": 18}, {\"typ\": \"Eisbecher\", \"anzahl\": 4}]', '[{\"anzahl\": 7, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 17, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 3, \"anreise\": \"Auto\"}]', '[{\"anzahl\": 23, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 4, \"bild_status\": \"Ohne Bild\"}]', NULL),
(26, '2025-09-22', '2025-09-28', 1, 2, 4, 8, 14, 1, 124, 522, 438, '2025-09-29 04:00:08', '[{\"typ\": \"Kugel\", \"anzahl\": 8}]', '[{\"anzahl\": 2, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 2, \"anreise\": \"Auto\"}, {\"anzahl\": 4, \"anreise\": \"Fahrrad\"}]', '[{\"anzahl\": 6, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 2, \"bild_status\": \"Ohne Bild\"}]', NULL),
(27, '2025-09-29', '2025-10-05', 3, 12, 13, 23, 37, 2, 127, 544, 450, '2025-10-06 04:00:05', '[{\"typ\": \"Kugel\", \"anzahl\": 19}, {\"typ\": \"Eisbecher\", \"anzahl\": 4}]', '[{\"anzahl\": 6, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 9, \"anreise\": \"Auto\"}, {\"anzahl\": 8, \"anreise\": \"Zu Fuß\"}]', '[{\"anzahl\": 20, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 3, \"bild_status\": \"Ohne Bild\"}]', NULL),
(28, '2025-10-06', '2025-10-12', 1, 25, 7, 21, 37, 5, 128, 565, 477, '2025-10-13 04:00:10', '[{\"typ\": \"Kugel\", \"anzahl\": 19}, {\"typ\": \"Softeis\", \"anzahl\": 2}]', '[{\"anzahl\": 3, \"anreise\": \"Bus / Bahn\"}, {\"anzahl\": 8, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 5, \"anreise\": \"Auto\"}, {\"anzahl\": 5, \"anreise\": \"Fahrrad\"}]', '[{\"anzahl\": 16, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 5, \"bild_status\": \"Ohne Bild\"}]', NULL),
(29, '2025-10-13', '2025-10-19', 2, 15, 12, 23, 37, 7, 130, 588, 490, '2025-10-20 04:00:04', '[{\"typ\": \"Kugel\", \"anzahl\": 20}, {\"typ\": \"Eisbecher\", \"anzahl\": 3}]', '[{\"anzahl\": 8, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 5, \"anreise\": \"Auto\"}, {\"anzahl\": 5, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 4, \"anreise\": \"Bus / Bahn\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 15, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 8, \"bild_status\": \"Ohne Bild\"}]', NULL),
(30, '2025-10-20', '2025-10-26', 0, 8, 4, 10, 14, 2, 130, 598, 498, '2025-10-27 06:18:36', '[{\"typ\": \"Softeis\", \"anzahl\": 2}, {\"typ\": \"Kugel\", \"anzahl\": 7}, {\"typ\": \"Eisbecher\", \"anzahl\": 1}]', '[{\"anzahl\": 1, \"anreise\": \"Fahrrad\"}, {\"anzahl\": 5, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 3, \"anreise\": \"Auto\"}, {\"anzahl\": 1, \"anreise\": \"\"}]', '[{\"anzahl\": 5, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 5, \"bild_status\": \"Ohne Bild\"}]', '[{\"anzahl\": 2, \"ort_status\": \"Vor Ort\"}, {\"anzahl\": 8, \"ort_status\": \"Nicht vor Ort\"}]'),
(31, '2025-10-27', '2025-11-02', 0, 11, 5, 14, 13, 4, 130, 612, 509, '2025-11-03 05:00:05', '[{\"typ\": \"Kugel\", \"anzahl\": 13}, {\"typ\": \"Softeis\", \"anzahl\": 1}]', '[{\"anzahl\": 9, \"anreise\": \"Zu Fuß\"}, {\"anzahl\": 1, \"anreise\": \"\"}, {\"anzahl\": 4, \"anreise\": \"Fahrrad\"}]', '[{\"anzahl\": 11, \"bild_status\": \"Mit Bild\"}, {\"anzahl\": 3, \"bild_status\": \"Ohne Bild\"}]', '[{\"anzahl\": 10, \"ort_status\": \"Vor Ort\"}, {\"anzahl\": 4, \"ort_status\": \"Nicht vor Ort\"}]');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `wochenstatistiken`
--
ALTER TABLE `wochenstatistiken`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `wochenstatistiken`
--
ALTER TABLE `wochenstatistiken`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
