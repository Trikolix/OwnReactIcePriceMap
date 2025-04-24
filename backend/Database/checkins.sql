-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 22. Apr 2025 um 12:22
-- Server-Version: 8.0.36-28
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
-- Tabellenstruktur für Tabelle `checkins`
--

CREATE TABLE `checkins` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `datum` datetime DEFAULT CURRENT_TIMESTAMP,
  `typ` enum('Kugel','Softeis','Eisbecher') COLLATE utf8mb4_general_ci NOT NULL,
  `geschmackbewertung` decimal(2,1) DEFAULT NULL,
  `waffelbewertung` decimal(2,1) DEFAULT NULL,
  `größenbewertung` decimal(2,1) DEFAULT NULL,
  `kommentar` text COLLATE utf8mb4_general_ci,
  `bild_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkins`
--

INSERT INTO `checkins` (`id`, `nutzer_id`, `eisdiele_id`, `datum`, `typ`, `geschmackbewertung`, `waffelbewertung`, `größenbewertung`, `kommentar`, `bild_url`) VALUES
(2, 1, 100, '2025-04-14 08:37:44', 'Kugel', '3.4', '1.9', '4.0', '', 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg'),
(3, 1, 72, '2025-04-14 08:41:48', 'Kugel', '4.5', '4.8', '4.5', '', 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg'),
(4, 1, 40, '2025-04-14 08:47:33', 'Kugel', '4.8', '3.0', '4.6', '', 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg'),
(5, 1, 47, '2025-04-14 10:23:14', 'Kugel', '3.2', '1.8', '2.8', 'Das Schokoeis hat nach günstigen Eis vom Discounter geschmeckt. Heidelbeere war recht lecker, hat aber auch 1,50€ gekostet und war somit 50 Cent teurer als die \'einfachen\' Sorten.\r\nDie Kugeln waren eher klein und die Eiswaffel nicht gut.', 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg'),
(6, 1, 46, '2025-04-14 10:31:39', 'Kugel', '4.9', '4.5', '5.0', 'Super leckeres Eis und riiiesige Kugeln, dazu eine knusprige Waffel.\r\nEine etwas größere Waffel und vielleicht noch ein paar Schokostückchen im Schokoeis und es gäbe die perfekte Bewertung.', 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg'),
(7, 1, 101, '2025-04-14 16:03:52', 'Kugel', '5.0', '2.5', '4.2', 'Alle 3 Kugeln Cookies, Salted Caramel und Brombeer Holunder waren super lecker, hatten eine cremige Konsistenz und vor allem hatten sie viele Cookie, Karamell bzw. Fruchtstückchen.\nDie Papp-Waffel war leider das einzige Manko. Ansonsten Top Top Top!', 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg'),
(9, 1, 101, '2025-04-14 16:09:10', 'Kugel', '4.7', '2.0', '2.0', '', 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg'),
(10, 1, 98, '2025-04-16 16:48:42', 'Kugel', '4.7', '4.2', '4.2', 'Super leckeres, sehr günstiges Eis und eine große Auswahl an Sorten, wobei alle Sorten den gleichen Preis kosten.\r\nSchade dass ich mit meiner Bestellung von 4 Kugeln zwar eine größere aber nicht so knusprige Waffel wie die anderen bekommen habe.', 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg'),
(11, 1, 55, '2025-04-17 15:55:27', 'Kugel', '4.6', '4.8', '4.2', '', 'uploads/checkins/checkin_6801084f859771.78778651.jpg'),
(12, 4, 10, '2025-04-20 17:42:30', 'Kugel', '4.2', '4.8', '4.8', 'Machste nix verkehrt. Schön schokoladig. Ab und zu ein Eiskristall in der Mitte.', NULL),
(14, 4, 9, '2025-04-21 15:20:39', 'Softeis', '4.4', '2.5', '4.5', '', NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nutzer_id` (`nutzer_id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `checkins`
--
ALTER TABLE `checkins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`),
  ADD CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
