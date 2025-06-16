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
-- Tabellenstruktur für Tabelle `bewertung_attribute`
--

CREATE TABLE `bewertung_attribute` (
  `bewertung_id` int NOT NULL,
  `attribut_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bewertung_attribute`
--

INSERT INTO `bewertung_attribute` (`bewertung_id`, `attribut_id`) VALUES
(6, 1),
(95, 1),
(203, 1),
(211, 1),
(11, 2),
(22, 2),
(32, 2),
(39, 2),
(120, 2),
(125, 2),
(146, 2),
(162, 2),
(163, 2),
(166, 2),
(177, 2),
(179, 2),
(191, 2),
(203, 2),
(211, 2),
(215, 2),
(239, 2),
(241, 2),
(22, 3),
(95, 3),
(97, 3),
(108, 3),
(122, 3),
(139, 3),
(145, 3),
(160, 3),
(189, 3),
(208, 3),
(213, 3),
(215, 3),
(224, 3),
(230, 3),
(234, 3),
(241, 3),
(8, 4),
(19, 4),
(32, 4),
(56, 4),
(97, 4),
(113, 4),
(120, 4),
(121, 4),
(130, 4),
(139, 4),
(144, 4),
(145, 4),
(146, 4),
(163, 4),
(184, 4),
(189, 4),
(194, 4),
(198, 4),
(199, 4),
(200, 4),
(206, 4),
(208, 4),
(211, 4),
(215, 4),
(226, 4),
(145, 5),
(205, 5),
(208, 5),
(211, 5),
(215, 5),
(4, 6),
(11, 6),
(22, 6),
(32, 6),
(39, 6),
(54, 6),
(95, 6),
(106, 6),
(108, 6),
(120, 6),
(121, 6),
(125, 6),
(146, 6),
(166, 6),
(177, 6),
(179, 6),
(194, 6),
(199, 6),
(203, 6),
(205, 6),
(206, 6),
(211, 6),
(213, 6),
(224, 6),
(230, 6),
(239, 6),
(240, 6),
(76, 7),
(125, 7),
(179, 7),
(211, 7),
(130, 8),
(145, 8),
(148, 8),
(162, 8),
(163, 8),
(179, 8),
(192, 8),
(208, 8),
(215, 8),
(216, 8),
(221, 8),
(230, 8),
(10, 9),
(25, 9),
(118, 9),
(146, 9),
(147, 9),
(157, 9),
(177, 9),
(179, 9),
(184, 9),
(191, 9),
(192, 9),
(201, 9),
(203, 9),
(205, 9),
(206, 9),
(208, 9),
(211, 9),
(224, 9),
(225, 9),
(230, 9),
(240, 9),
(139, 10),
(184, 10),
(201, 10),
(177, 11),
(179, 11),
(188, 11),
(211, 11),
(179, 12),
(221, 12),
(179, 13),
(196, 14),
(11, 15),
(205, 15),
(207, 16),
(211, 17),
(216, 17),
(211, 18),
(224, 18),
(223, 19),
(223, 20),
(118, 21),
(130, 21),
(224, 21),
(230, 21),
(239, 22);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD PRIMARY KEY (`bewertung_id`,`attribut_id`),
  ADD KEY `attribut_id` (`attribut_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD CONSTRAINT `bewertung_attribute_ibfk_1` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bewertung_attribute_ibfk_2` FOREIGN KEY (`attribut_id`) REFERENCES `attribute` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
