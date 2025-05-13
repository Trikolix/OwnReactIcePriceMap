-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 13. Mai 2025 um 07:40
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
-- Tabellenstruktur für Tabelle `checkin_sorten`
--

CREATE TABLE `checkin_sorten` (
  `id` int NOT NULL,
  `checkin_id` int NOT NULL,
  `sortenname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bewertung` decimal(2,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkin_sorten`
--

INSERT INTO `checkin_sorten` (`id`, `checkin_id`, `sortenname`, `bewertung`) VALUES
(2, 2, 'Nogger', '3.5'),
(3, 2, 'Tiramisu', '3.3'),
(4, 3, 'Amarena-Kirsch', '4.5'),
(5, 3, 'Cookies', '4.5'),
(6, 4, 'Salted Caramel', '4.8'),
(7, 5, 'Schokolade', '2.6'),
(8, 5, 'Heidelbeere', '3.8'),
(9, 6, 'Erdnuss', '5.0'),
(10, 6, 'Weiße Schokolade ', '4.9'),
(11, 7, 'Cookies', '5.0'),
(12, 7, 'Salted Caramel', '5.0'),
(13, 7, 'Brombeer Holunder', '5.0'),
(17, 9, 'Bueno', '4.7'),
(18, 10, 'Weiße Schokolade mit Himbeere', '4.7'),
(19, 10, 'Nuss-Nougat', '4.7'),
(20, 10, 'Chilli Schokolade', '4.8'),
(21, 10, 'Dubai Style', '4.6'),
(22, 11, 'Erdbeerkäsekuchen ', '4.6'),
(23, 12, 'Cookies ', '4.2'),
(24, 12, 'Schokolade', '4.2'),
(27, 14, 'Schoko/Vanille', '4.4'),
(29, 16, 'gebrannte Mandeln', '4.9'),
(30, 17, 'Kalter Hund', '4.9'),
(31, 18, 'After Eight', '4.8'),
(33, 20, 'Milchreis', '4.9'),
(34, 21, 'Mango', '4.3'),
(35, 21, 'Cookies', '4.3'),
(36, 22, 'Schoko-Praline', '4.8'),
(38, 24, 'Zimt ', '4.9'),
(39, 24, 'Malaga ', '4.7'),
(40, 25, 'Heidelbeere', '3.9'),
(41, 26, 'Cookies', '4.8'),
(42, 26, 'Bella Ciao', '4.8'),
(49, 39, 'Schoko/Vanille', '4.7'),
(56, 52, 'Heidelbeere', '4.6'),
(57, 53, 'Marzipan', '5.0'),
(58, 53, 'Cookies', '5.0'),
(59, 54, 'Wildpreiselbeere', '4.6'),
(60, 55, 'Straciatella', '2.5'),
(62, 57, 'Straciatella', '2.8'),
(63, 57, 'Pfirsich-Maracuja', '2.0'),
(67, 60, 'Waldmeister', '4.0'),
(68, 61, 'Vanille', '4.5'),
(69, 62, 'Joghurt-Sanddorn', '4.6'),
(75, 59, 'Schoko/Vanille', '3.4'),
(76, 58, 'Lemoncurd', '4.8'),
(77, 58, 'Mohn Marzipan ', '4.6'),
(84, 66, 'Himbeere', '4.6'),
(85, 66, 'Nougat', '4.6'),
(90, 67, 'Eierlikör-Nougat ', '4.9'),
(91, 67, 'Quark-Zitrone', '4.8'),
(96, 68, 'Schoko-Kirsch', '5.0'),
(97, 68, 'Baileys', '4.9'),
(100, 69, 'Cheesecake-Waldbeere', '4.5'),
(102, 71, 'Mango', '4.5'),
(103, 70, 'Erdbeere-Vanille', '4.5'),
(108, 75, 'Butterkeks', '4.7'),
(111, 78, 'Schoko/Vanille', '4.9'),
(115, 73, 'Straciatella', '3.9'),
(116, 73, 'Amarena', '3.4'),
(117, 72, 'Vanille/Karamell', '3.0'),
(118, 77, 'Amerettini ', '4.9'),
(123, 82, 'Spaghetti Eis', '5.0'),
(124, 83, 'Milchreiseis', '4.8'),
(125, 83, 'Butterkeks', '4.8'),
(129, 79, 'Eisbecher \"Orion\"', '4.5'),
(130, 88, 'Karamell', '4.9'),
(131, 88, 'Weiße Schokolade', '4.9'),
(133, 76, 'Weiße Schokolade ', '4.0'),
(137, 90, 'Waldbeere', '4.8'),
(138, 90, 'Schokolade', '4.3'),
(152, 103, 'Schoko/Vanille', '4.5'),
(160, 112, 'Vanille/Erdbeere', '4.0'),
(163, 113, 'Schoko Vanille', '4.4'),
(164, 114, 'Schoko/Vanille ', '4.4'),
(165, 115, 'Cookies ', '5.0'),
(170, 116, 'Schokolade', '3.0'),
(171, 116, 'Himbeere', '5.0'),
(172, 102, 'Eierlikör-Nougat ', '4.6'),
(173, 74, 'Schoko/Vanille', '4.6'),
(175, 19, 'Dunkle Schokolade', '4.5'),
(179, 122, 'Gummibären ', '4.6'),
(180, 123, 'Danielle/Mango', '5.0'),
(181, 23, 'Schoko/Vanille', '4.7');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=182;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD CONSTRAINT `checkin_sorten_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
