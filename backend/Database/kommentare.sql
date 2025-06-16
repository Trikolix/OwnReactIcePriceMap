-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:27
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
-- Tabellenstruktur für Tabelle `kommentare`
--

CREATE TABLE `kommentare` (
  `id` int NOT NULL,
  `checkin_id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `kommentar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `kommentare`
--

INSERT INTO `kommentare` (`id`, `checkin_id`, `nutzer_id`, `kommentar`, `erstellt_am`) VALUES
(1, 186, 1, 'Ohh interessant, Erdbeer-Vanille muss ich auch mal ausprobieren! 😋😍', '2025-06-13 05:38:17'),
(2, 185, 1, 'Sieht echt sehr lecker aus! 😋 \nIst schon eine gute Eisdiele. Bei mir war der Verkäufer auch wahnsinnig freundlich.\nMit der Platzsituation hast du natürlich recht, gerade mit der Family wirds da eng mit Rädern.', '2025-06-13 05:39:49'),
(3, 182, 1, 'Mit dem Cityroller ist natürlich auch mal was anderes :D', '2025-06-13 05:40:33'),
(4, 184, 1, 'Sehr coole Radtour die du da zurück gelegt hast 🚴🏼‍♂️👍🏼\nUnd gleich zwei neue Eisdielen eingecheckt 🔥🫶🏼', '2025-06-13 05:42:36'),
(5, 187, 1, 'Willkommen auf der Ice-App und vielen Dank für deinen ersten CheckIn 🤗\nWeißt du zufällig noch wie teuer eine Kugel Eis war?', '2025-06-13 05:56:36'),
(6, 180, 1, 'Die Waffel sieht ja mal richtig lecker aus! 😍​', '2025-06-13 06:00:57'),
(7, 71, 1, 'sieht echt Hammer aus! 🤩​ Mango ist natürlich auch ne geile Geschmacksrichtung für Softeis.\n\nAber die Waffel sieht mir doch recht pappig aus 😅', '2025-06-13 06:06:10'),
(9, 186, 13, 'Richtiger Stammkunde bei der Eisdiele Dietz! Gefällt mir!', '2025-06-13 06:25:04'),
(12, 188, 1, 'Da wurde sich schön ein Eis zum Geburtstag gegönnt 😍😋\nHerzlichen Glückwunsch zum Geburtstag und ich hoffe es hat geschmeckt 🥳😁', '2025-06-13 11:27:40'),
(13, 193, 1, 'Sehr geil, das ist wirklich geschmacklich eine meiner absoluten Lieblingseisdielen! 😍\nich hab gelesen die haben auch einen Eis-Burger wo das Eis in einem Ufo-Burger-Brötchen eingebacken wird. 🧐\nDen will ich mal ausprobieren wenn ich das nächste Mal dort bin', '2025-06-15 18:17:10'),
(14, 190, 1, 'Oha, das ist ja wirklich ein riiesiges Eis! 🤩', '2025-06-15 18:17:52'),
(15, 193, 23, 'Oh, das muss ich mir mal anschauen. Die liegen ja direkt in der Umgebung, für mich ist\'s einfacher da mal vorbeizuschauen. ☺️', '2025-06-16 08:07:15');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  ADD CONSTRAINT `kommentare_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kommentare_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
