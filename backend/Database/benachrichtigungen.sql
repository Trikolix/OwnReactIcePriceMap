-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:25
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
  `typ` enum('kommentar') COLLATE utf8mb4_general_ci NOT NULL,
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
(1, 19, 'kommentar', 1, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-13 05:38:17', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"1\"}'),
(2, 8, 'kommentar', 2, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-13 05:39:49', '{\"checkin_id\":185,\"eisdiele_id\":42,\"kommentar_id\":\"2\"}'),
(3, 2, 'kommentar', 3, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:40:33', '{\"checkin_id\":182,\"eisdiele_id\":207,\"kommentar_id\":\"3\"}'),
(4, 23, 'kommentar', 4, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 05:42:36', '{\"checkin_id\":184,\"eisdiele_id\":105,\"kommentar_id\":\"4\"}'),
(5, 47, 'kommentar', 5, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-13 05:56:36', '{\"checkin_id\":187,\"eisdiele_id\":208,\"kommentar_id\":\"5\"}'),
(6, 30, 'kommentar', 6, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-13 06:00:57', '{\"checkin_id\":180,\"eisdiele_id\":206,\"kommentar_id\":\"6\"}'),
(7, 2, 'kommentar', 7, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-13 06:06:10', '{\"checkin_id\":71,\"eisdiele_id\":132,\"kommentar_id\":\"7\"}'),
(9, 19, 'kommentar', 9, 'Admin hat deinen Check-in kommentiert.', 0, '2025-06-13 06:25:04', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"9\"}'),
(10, 1, 'kommentar', 9, 'Admin hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-13 06:25:04', '{\"checkin_id\":186,\"eisdiele_id\":9,\"kommentar_id\":\"9\"}'),
(15, 8, 'kommentar', 12, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-13 11:27:40', '{\"checkin_id\":188,\"eisdiele_id\":10,\"kommentar_id\":\"12\"}'),
(16, 23, 'kommentar', 13, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 1, '2025-06-15 18:17:10', '{\"checkin_id\":193,\"eisdiele_id\":106,\"kommentar_id\":\"13\"}'),
(17, 2, 'kommentar', 14, 'TheGourmetCyclist hat deinen Check-in kommentiert.', 0, '2025-06-15 18:17:52', '{\"checkin_id\":190,\"eisdiele_id\":47,\"kommentar_id\":\"14\"}'),
(18, 1, 'kommentar', 15, 'Holzmichl hat einen Check-in kommentiert, den du auch kommentiert hast.', 1, '2025-06-16 08:07:15', '{\"checkin_id\":193,\"eisdiele_id\":106,\"kommentar_id\":\"15\"}');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
