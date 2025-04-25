-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:11
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
-- Tabellenstruktur für Tabelle `bewertungen`
--

CREATE TABLE `bewertungen` (
  `id` int NOT NULL,
  `eisdiele_id` int DEFAULT NULL,
  `nutzer_id` int DEFAULT NULL,
  `geschmack` decimal(2,1) DEFAULT NULL,
  `kugelgroesse` decimal(2,1) DEFAULT NULL,
  `waffel` decimal(2,1) DEFAULT NULL,
  `auswahl` int DEFAULT NULL,
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Daten für Tabelle `bewertungen`
--

INSERT INTO `bewertungen` (`id`, `eisdiele_id`, `nutzer_id`, `geschmack`, `kugelgroesse`, `waffel`, `auswahl`, `beschreibung`, `erstellt_am`) VALUES
(1, 16, 1, '4.6', '4.0', '3.5', 16, '', '2025-03-14 08:27:11'),
(2, 18, 1, '4.9', '1.7', '3.5', 8, 'Ich hatte eine Kugel gebrannte Mandeln. Das Eis war sehr lecker, vorallem durch die Stückchen gebrannte Mandel die noch oben drauf gestreut waren, allerdings für 2€ war die Kugel relativ klein.', '2025-03-16 09:52:01'),
(3, 17, 1, NULL, NULL, NULL, 16, '', '2025-03-14 08:27:11'),
(4, 10, 1, '4.8', '4.1', '4.7', 20, '', '2025-03-17 18:36:58'),
(5, 5, 1, '4.5', '3.7', '1.0', 23, 'Dunkle Schokolade war schon sehr lecker, aber die Waffel war eine ganz einfache nach Pappe schmeckende. Für den Preis von 2€ die Kugel war ich etwas enttäuscht.', '2025-03-26 21:09:53'),
(6, 6, 1, '3.9', '2.4', '1.5', 16, '', '2025-03-20 18:52:20'),
(7, 36, 1, NULL, NULL, NULL, 8, '', '2025-03-21 12:06:35'),
(8, 39, 1, '4.9', '3.3', '4.5', 20, 'Ich hatte eine Kugel \'Kalter Hund\', die war sehr lecker und für 1,50€ auch angemessen groß. Die Waffel war sehr knusprig und lecker. \nInsgesamt hatte die Eisdiele eine gute Auswahl an Sorten.', '2025-03-23 17:48:39'),
(10, 1, 1, '4.8', '4.2', '3.8', 14, 'Sehr leckeres Ei, die Kugeln sind ordentlich groß und den Preis wert.\n\nEs lohnt sich 2 Kugeln oder mehr zu nehme, ab dann gibt es eine besser schmeckende Waffel.', '2025-03-24 16:44:36'),
(11, 32, 1, NULL, NULL, NULL, 18, '', '2025-03-24 17:50:13'),
(12, 11, 1, '4.8', '4.2', '4.7', 16, 'Sehr leckeres Eis in einer super großen leckeren Waffel. Die Auswahl umfasst jetzt weniger ausgefallene Sorten, aber trotzdem alles lecker. Besonders die Sorte Milchreis kann ich empfehlen.', '2025-03-27 08:57:04'),
(17, 26, 1, '4.3', '3.0', '4.5', 20, 'Ich hatte eine Kugel Mango und eine Kugel Cookies. Die Kugel Mango war sehr groß, die Cookie Kugel hingegen eher klein. Insgesamt schon sehr solide, aber es könnten zum Beispiel mehr Cookie Stückchen im Eis sein.', '2025-03-27 15:15:06'),
(18, 47, 1, '3.2', '2.7', '1.8', 7, 'Sehr günstiges Eis, allerdings nur die Sorten Erdbeere, Vanille, Schoko und Himmelblau für 1€ und die Sorten haben eher nach billig Discounter Eis geschmeckt. Die restlichen 3 Sorten kosteten 1,50€, wobei Heidelbeere recht lecker war. Die Kugeln waren eher klein und die Eiswaffel nicht gut.', '2025-03-28 15:55:33'),
(19, 55, 1, '4.6', '4.1', '4.8', 18, 'Eine gute Auswahl an leckeren Sorten. Ich hatte eine Kugel Erdbeerkäsekuchen, welche ziemlich gut geschmeckt hat.\nFür 1,50 € in Verbindung mit einer sehr leckeren, knusprigen Waffel eine wirkliche Empfehlung.', '2025-03-28 17:05:17'),
(20, 58, 1, '2.5', '1.7', '3.0', 7, 'Sehr liebevolles Café mit wirklich tollen, leckeren Kuchen und Torten zu sehr fairen Preisen, aber leider war das Eis nicht wirklich gut. Es hatten sich schon Kristalle gebildet, was vielleicht daran liegen mag, dass es insgesamt wenig besucht ist. Sehr schade :(', '2025-03-30 11:23:34'),
(22, 22, 1, '4.8', '4.4', '4.7', 18, 'Ich hatte eine Kugel Schoko-Praline. Die war äußerst lecker, mit vielen Nuss / Pralinen Stückchen. Und für 1,30€ die Kugel äußerst groß.\nDie Waffel war auch sehr lecker und angenehm groß.', '2025-04-02 04:04:01'),
(25, 31, 1, '4.7', NULL, '3.5', 2, 'Beliebter Softeisstand auf dem Markt in Kietscher. Es gab zwei verschiedene gemischte Softeis zur Auswahl in klein und groß für 1,50 bzw. 2,50 € und für 20 Cent Aufpreis gab es Streusel auf das Eis.', '2025-04-02 14:55:24'),
(26, 2, 1, NULL, NULL, NULL, 12, '', '2025-04-03 11:35:39'),
(28, 20, 1, NULL, NULL, NULL, 14, '', '2025-04-03 14:16:26'),
(29, 9, 1, NULL, NULL, NULL, 8, '', '2025-04-03 14:32:36'),
(30, 61, 1, NULL, NULL, NULL, 16, '', '2025-04-03 14:54:47'),
(31, 63, 1, NULL, NULL, NULL, 25, '', '2025-04-04 04:59:06'),
(32, 46, 1, '4.9', '4.9', '4.5', 13, 'Ich hatte eine Kugel Erdnuss und eine Kugel weiße Schokolade, die Portion war wirklich riesig und geschmacklich wahnsinnig lecker. Die Waffel war geschmacklich auch Top, allerdings gab es bei anderen Eisdielen schon etwas größere Waffeln.\nMit noch ein paar Schokostückchen z.bsp. in den Eiskugeln und größeren Waffeln hätte es die perfekte Bewertung gegeben.', '2025-04-04 12:46:24'),
(38, 69, 1, NULL, NULL, NULL, 6, '', '2025-04-05 16:49:59'),
(39, 71, 1, '4.8', '4.0', '4.2', 18, 'Das Eis war sehr lecker und enthielt einige Schoko- / Pralinenstückchen. Die Portion war für 2,00€ angemessen und die Waffel war auch recht lecker aber klein. Andere Kunden mit ebenfalls nur einer Kugel Eis haben teilweise andere (größere) Waffeln erhalten.', '2025-04-06 11:58:24'),
(54, 29, 1, '5.0', '3.7', '3.5', 12, 'Ich hatte eine Kugel Marzipan und\neine Kugel Cookies, beide waren\nsuper lecker und viel zu schnell\nverputzt. Bemerkenswert war die Cremigkeit vom Eis.\nDas Lokal ist sehr niedlich und\nscheint privat betrieben zu sein.', '2025-04-07 16:24:22'),
(56, 40, 1, '4.8', '4.5', '3.0', 31, 'Meine Kugel salziges Karamell war geschmacklich vorzüglich und hatte eine wunderbar cremige Konsistenz.\nEine riesige Auswahl an teils ausgefallene Sorten runden das Angebot ab.\nLediglich bei der einfachen Waffel gibt es Luft nach oben.', '2025-04-08 14:16:56'),
(60, 37, 1, '4.6', '3.5', '4.8', 6, 'Kremeeis Wildpreiselbeere aus eigener Herstellung aus Milch, Eiern und Zucker', '2025-04-08 15:15:56'),
(65, 81, 1, NULL, NULL, NULL, 30, '', '2025-04-09 07:22:27'),
(66, 82, 1, NULL, NULL, NULL, 30, '', '2025-04-09 07:26:37'),
(68, 86, 1, '2.4', '2.4', '2.0', 14, 'Eine Kugel Straciatella und eine Kugel Pfirsich-Maracuja.\nDie Kugel Straciatella hatte zwar viele Schokostückchen aber beide Kugeln haben wässrig geschmeckt, waren eher klein und geben in Verbindung mit einer pappigen Waffel ein schlechtes Gesamtbild ab.', '2025-04-09 14:42:11'),
(74, 83, 1, NULL, NULL, NULL, 16, '', '2025-04-12 09:09:49'),
(75, 72, 1, '4.5', '4.4', '4.8', 19, 'Ich hatte eine Kugel Amarena-Kirsch und eine Cookies. Sehr cremig aber hätte etwas fruchtiger bzw. \"keksiger\" sein können.\nInsgesamt ein sehr solides Eis. In Verbindung mit der großen, knusprigen Waffel macht man nichts verkehrt.\n', '2025-04-12 09:46:53'),
(76, 100, 1, '3.4', '3.9', '1.9', 9, 'Ich hatte eine Kugel Noggereis,  welche geschmacklich ganz gut war, aber zu hart / kalt. Meine Verlobte hatte eine Kugel Tiramisu, welche wiederum zu weich war.\nDafür gibt es sehr leckeren Kaffee und gutes Bier.', '2025-04-13 11:53:34'),
(95, 101, 1, '5.0', '4.1', '2.3', 14, 'Alle 3 Kugeln Cookies, Salted Caramel und Brombeer Holunder waren super lecker, hatten eine cremige Konsistenz und vor allem hatten sie viele Cookie, Karamell bzw. Fruchtstückchen. Die Papp-Waffel war leider das einzige Manko. Ansonsten Top Top Top!', '2025-04-14 14:04:41'),
(97, 98, 1, '4.7', '4.1', '4.2', 24, 'Super leckeres, sehr günstiges Eis und eine große Auswahl an Sorten, wobei alle Sorten den gleichen Preis kosten.\nSchade dass ich mit meiner Bestellung von 4 Kugeln zwar eine größere aber nicht so knusprige Waffel wie die anderen bekommen habe.', '2025-04-16 14:34:21'),
(103, 10, 4, '4.2', '4.8', '4.8', NULL, 'Machste nix verkehrt. Schön schokoladig. Ab und zu ein Eiskristall in der Mitte.', '2025-04-20 12:22:39'),
(105, 9, 4, '4.4', '2.5', '4.5', NULL, '', '2025-04-21 13:20:39'),
(106, 115, 3, '4.7', '4.5', '3.2', 2, 'Bei meinem Besuch im Eisgarten an der Kaßbergauffahrt ließ ich mir ein Schoko-Vanille-Softeis schmecken. Überzeugen konnte das Eis durch die Kombination aus der für Softeis üblichen cremigen Konsistenz sowie durch seinen angenehmen Geschmack. Eine eher schlechtere Bewertung erhielt die sehr einfache Waffel. Das Angebot an Eissorten ist sehr überschaubar, was aber bei Softeis keine Überraschung ist. Punkten kann der Eisgarten ebenfalls durch seine kleine anschließende Grünfläche sowie einige Sitzmöglichkeiten, die zum Verweilen einladen. Für Softeis-Liebhaber einen Besuch wert!', '2025-04-22 11:24:51'),
(108, 59, 1, '4.8', '4.5', '2.3', 10, 'Gut im Ort versteckt, hat mich die kleine aber feine Eckeisdiele doch positiv überrascht.\nEs gibt Softeis, Kugeleis und Eisbecher im Angebot.\nMeine Kugeln Zimt und Malaga waren beide sehr lecker, intensiv von Geschmack und relativ groß.\nDazu ein günstiger Preis von 1,20€ pro Kugel.\nLediglich die kleine \"Papp\"Waffel sorgt mal wieder für Abzüge.', '2025-04-22 14:45:49'),
(113, 118, 1, '4.6', '5.0', '4.6', 30, 'Eine super Auswahl von ca. 30 Sorten, davon ziemlich viele ausgefallene. Die Kugeln waren die größten die ich bis jetzt jemals bekommen habe. Das Eis war lecker, aber bei der Geschmacksintensität ist noch bisschen Raum nach oben. Insgesamt eine große Empfehlung.', '2025-04-26 00:17:09');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bewertung` (`eisdiele_id`,`nutzer_id`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  ADD CONSTRAINT `bewertungen_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `bewertungen_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
