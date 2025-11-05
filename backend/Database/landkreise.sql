-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 05. Nov 2025 um 08:18
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
-- Tabellenstruktur für Tabelle `landkreise`
--

CREATE TABLE `landkreise` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bundesland_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `landkreise`
--

INSERT INTO `landkreise` (`id`, `name`, `bundesland_id`) VALUES
(7, 'Altenburger Land', 1),
(128, 'Anhalt-Bitterfeld', 2),
(19, 'Aussiger Region', 6),
(30, 'Autonome Provinz Trient', 12),
(93, 'Barcelonès', 57),
(45, 'Bari', 26),
(37, 'Berlin', 18),
(121, 'Bezirk Gmunden', 64),
(101, 'Bezirk Horgen', 16),
(112, 'Bezirk Innsbruck-Land', 33),
(49, 'Bezirk Kufstein', 33),
(120, 'Bezirk Spittal an der Drau', 63),
(123, 'Bezirk Vöcklabruck', 64),
(35, 'Bezirk Zürich', 16),
(147, 'Bouches-du-Rhône', 93),
(31, 'Bozen', 12),
(91, 'Braga', 55),
(76, 'Brandenburg an der Havel', 5),
(95, 'Brescia', 8),
(46, 'Brindisi', 26),
(67, 'Budapest', 40),
(122, 'Caerphilly County Borough', 65),
(80, 'Calvados', 47),
(146, 'Casteddu/Cagliari', 92),
(66, 'Charente-Maritime', 37),
(6, 'Chemnitz', 3),
(148, 'Comarca de València', 94),
(50, 'Cottbus', 5),
(39, 'Dahme-Spreewald', 5),
(102, 'Darmstadt', 15),
(11, 'Dresden', 3),
(139, 'Düsseldorf', 23),
(133, 'Edinburg', 39),
(38, 'Erfurt', 1),
(3, 'Erzgebirgskreis', 3),
(136, 'Falkenburg', 50),
(134, 'Faro', 70),
(34, 'Frankfurt am Main', 15),
(36, 'Freiburg im Breisgau', 17),
(55, 'Gard', 10),
(78, 'Gent', 45),
(53, 'Gespanschaft Istrien', 35),
(59, 'Gironde', 37),
(33, 'Gorizia', 14),
(77, 'Grafton County', 44),
(8, 'Greiz', 1),
(138, 'Gwynedd', 65),
(117, 'Hamburg', 19),
(106, 'Hauptstadt Prag', 59),
(127, 'Heidekreis', 22),
(105, 'Heidelberg', 17),
(25, 'Hérault', 10),
(65, 'Highland', 39),
(113, 'Hohenlohekreis', 17),
(137, 'Hulsberg', 50),
(74, 'Ille-et-Vilaine', 43),
(103, 'Ilm-Kreis', 1),
(68, 'Indre-et-Loire', 41),
(145, 'Innsbruck', 33),
(51, 'Isère', 34),
(144, 'Istanbul', 91),
(142, 'Jena', 1),
(18, 'Karlsbader Region', 6),
(87, 'Koblenz', 28),
(60, 'Kreis Lippe', 23),
(57, 'Kreis Nordfriesland', 30),
(131, 'Kreis Ostholstein', 30),
(63, 'Kreis Paderborn', 23),
(130, 'La Spezia', 68),
(73, 'Landkreis Breisgau-Hochschwarzwald', 17),
(70, 'Landkreis Hameln-Pyrmont', 22),
(84, 'Landkreis Harz', 2),
(61, 'Landkreis Heilbronn', 17),
(9, 'Landkreis Leipzig', 3),
(110, 'Landkreis Rhön-Grabfeld', 7),
(71, 'Landkreis Rosenheim', 7),
(111, 'Landkreis Schwäbisch Hall', 17),
(116, 'Landkreis Stade', 22),
(23, 'Landkreis Tirschenreuth', 7),
(69, 'Landkreis Waldeck-Frankenberg', 15),
(44, 'Landkreis Weimarer Land', 1),
(42, 'Lecce', 26),
(54, 'Leipzig', 3),
(92, 'Lissabon', 56),
(29, 'Luzern', 11),
(85, 'Maastricht', 50),
(22, 'Mailand', 8),
(72, 'Maine-et-Loire', 42),
(118, 'Mannheim', 17),
(10, 'Meißen', 3),
(4, 'Mittelsachsen', 3),
(98, 'München', 7),
(32, 'Neu-Görz', 13),
(90, 'New York County', 54),
(96, 'Niederampurien', 57),
(109, 'Nordsachsen', 3),
(24, 'Oberelsass', 9),
(100, 'Oberspreewald-Lausitz', 5),
(16, 'Oberspreewald-Lausitz - Górne Błota-Łužyca', 5),
(89, 'Ocean County', 53),
(56, 'Osnabrück', 22),
(82, 'Paris', 48),
(124, 'Passau', 7),
(48, 'Pesaro und Urbino', 32),
(88, 'Philadelphia', 52),
(125, 'Pilsner Region', 66),
(52, 'Potsdam', 5),
(41, 'Provinz Jämtland', 25),
(81, 'Region Hannover', 22),
(104, 'Regionalbezirk Chania', 58),
(58, 'Reykjavik', 36),
(129, 'Roma Capitale', 67),
(135, 'Rothem', 50),
(17, 'Sächsische Schweiz-Osterzgebirge', 3),
(115, 'Serra de Tramuntana', 61),
(83, 'Somme', 49),
(99, 'Sondrio', 8),
(132, 'Südkorsika', 69),
(62, 'Suffolk County', 38),
(126, 'Swansea', 65),
(108, 'Swinemünde', 60),
(143, 'Tongern', 90),
(79, 'Venezia', 46),
(97, 'Verona', 46),
(86, 'Verwaltungskreis Bern-Mittelland', 51),
(12, 'Vogtlandkreis', 3),
(75, 'Vorpommern-Greifswald', 21),
(28, 'Weiden in der Oberpfalz', 7),
(114, 'Weimar', 1),
(141, 'Werra-Meißner-Kreis', 15),
(94, 'Wiesbaden', 15),
(119, 'Windsor and Maidenhead', 62),
(107, 'Wittenberg', 2),
(140, 'Wuppertal', 23),
(64, 'Würzburg', 7),
(5, 'Zwickau', 3),
(43, 'Δήμος Αγίας Νάπας', 24),
(40, 'Δήμος Παραλιμνίου - Δερύνειας', 24),
(47, 'תל־אביב–יפו', 31);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`,`bundesland_id`),
  ADD KEY `bundesland_id` (`bundesland_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD CONSTRAINT `landkreise_ibfk_1` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
