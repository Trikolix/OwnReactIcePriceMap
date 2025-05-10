-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 27. Apr 2025 um 12:12
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
-- Tabellenstruktur für Tabelle `checkins`
--

CREATE TABLE `checkins` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `datum` datetime DEFAULT CURRENT_TIMESTAMP,
  `typ` enum('Kugel','Softeis','Eisbecher') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `geschmackbewertung` decimal(2,1) DEFAULT NULL,
  `waffelbewertung` decimal(2,1) DEFAULT NULL,
  `größenbewertung` decimal(2,1) DEFAULT NULL,
  `kommentar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `bild_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkins`
--

INSERT INTO `checkins` (`id`, `nutzer_id`, `eisdiele_id`, `datum`, `typ`, `geschmackbewertung`, `waffelbewertung`, `größenbewertung`, `kommentar`, `bild_url`) VALUES
(2, 1, 100, '2025-04-14 08:37:44', 'Kugel', '3.4', '1.9', '3.9', '', 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg'),
(3, 1, 72, '2025-04-14 08:41:48', 'Kugel', '4.5', '4.8', '4.4', '', 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg'),
(4, 1, 40, '2025-04-14 08:47:33', 'Kugel', '4.8', '3.0', '4.5', '', 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg'),
(5, 1, 47, '2025-04-14 10:23:14', 'Kugel', '3.2', '1.8', '2.7', 'Das Schokoeis hat nach günstigen Eis vom Discounter geschmeckt. Heidelbeere war recht lecker, hat aber auch 1,50€ gekostet und war somit 50 Cent teurer als die \'einfachen\' Sorten.\r\nDie Kugeln waren eher klein und die Eiswaffel nicht gut.', 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg'),
(6, 1, 46, '2025-04-14 10:31:39', 'Kugel', '4.9', '4.5', '4.9', 'Super leckeres Eis und riiiesige Kugeln, dazu eine knusprige Waffel.\r\nEine etwas größere Waffel und vielleicht noch ein paar Schokostückchen im Schokoeis und es gäbe die perfekte Bewertung.', 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg'),
(7, 1, 101, '2025-04-14 16:03:52', 'Kugel', '5.0', '2.5', '4.1', 'Alle 3 Kugeln Cookies, Salted Caramel und Brombeer Holunder waren super lecker, hatten eine cremige Konsistenz und vor allem hatten sie viele Cookie, Karamell bzw. Fruchtstückchen.\nDie Papp-Waffel war leider das einzige Manko. Ansonsten Top Top Top!', 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg'),
(9, 1, 101, '2025-04-14 16:09:10', 'Kugel', '4.7', '2.0', '1.9', '', 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg'),
(10, 1, 98, '2025-04-16 16:48:42', 'Kugel', '4.7', '4.2', '4.1', 'Super leckeres, sehr günstiges Eis und eine große Auswahl an Sorten, wobei alle Sorten den gleichen Preis kosten.\r\nSchade dass ich mit meiner Bestellung von 4 Kugeln zwar eine größere aber nicht so knusprige Waffel wie die anderen bekommen habe.', 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg'),
(11, 1, 55, '2025-04-17 15:55:27', 'Kugel', '4.6', '4.8', '4.1', '', 'uploads/checkins/checkin_6801084f859771.78778651.jpg'),
(12, 4, 10, '2025-04-20 17:42:30', 'Kugel', '4.2', '4.8', '4.8', 'Machste nix verkehrt. Schön schokoladig. Ab und zu ein Eiskristall in der Mitte.', NULL),
(14, 4, 9, '2025-04-21 15:20:39', 'Softeis', '4.4', '2.5', '4.5', '', NULL),
(16, 1, 18, '2025-04-22 12:52:48', 'Kugel', '4.9', '3.5', '1.7', 'Ich hatte eine Kugel gebrannte Mandeln. Das Eis war sehr lecker, vor allem durch die Stückchen gebrannte Mandel die noch oben drauf gestreut waren, allerdings für 2€ war die Kugel relativ klein.', 'uploads/checkins/checkin_6807750090a880.99200391.jfif'),
(17, 1, 39, '2025-04-22 12:56:02', 'Kugel', '4.9', '4.5', '3.3', 'Ich hatte eine Kugel \'Kalter Hund\', die war sehr lecker und für 1,50€ auch angemessen groß. Die Waffel war sehr knusprig und lecker. \r\nInsgesamt hatte die Eisdiele eine gute Auswahl an Sorten.', 'uploads/checkins/checkin_680775c23a3b90.94454860.jpg'),
(18, 1, 1, '2025-04-22 12:58:16', 'Kugel', '4.8', '3.8', '4.2', 'Sehr leckeres Ei, die Kugeln sind ordentlich groß und den Preis wert.\r\n\r\nEs lohnt sich 2 Kugeln oder mehr zu nehme, ab dann gibt es eine besser schmeckende Waffel.', 'uploads/checkins/checkin_6807764881a7d7.92172451.jpg'),
(19, 1, 5, '2025-04-22 12:59:44', 'Kugel', '4.5', '1.0', '3.7', 'Dunkle Schokolade war schon sehr lecker, aber die Waffel war eine ganz einfache nach Pappe schmeckende. Für den Preis von 2€ die Kugel war ich etwas enttäuscht.', 'uploads/checkins/checkin_680776a0e5f966.43189762.jpg'),
(20, 1, 11, '2025-04-22 13:01:56', 'Kugel', '4.8', '4.7', '4.2', 'Sehr leckeres Eis in einer super großen leckeren Waffel. Die Auswahl umfasst jetzt weniger ausgefallene Sorten, aber trotzdem alles lecker. Besonders die Sorte Milchreis kann ich empfehlen.', 'uploads/checkins/checkin_68077724b19388.99511766.jpg'),
(21, 1, 26, '2025-04-22 13:03:55', 'Kugel', '4.3', '4.5', '3.0', 'Ich hatte eine Kugel Mango und eine Kugel Cookies. Die Kugel Mango war sehr groß, die Cookie Kugel hingegen eher klein. Insgesamt schon sehr solide, aber es könnten zum Beispiel mehr Cookie Stückchen im Eis sein.', 'uploads/checkins/checkin_6807779bcd13c8.48200144.jpg'),
(22, 1, 22, '2025-04-22 13:06:25', 'Kugel', '4.8', '4.7', '4.4', 'Ich hatte eine Kugel Schoko-Praline. Die war äußerst lecker, mit vielen Nuss / Pralinen Stückchen. Und für 1,30€ die Kugel äußerst groß.\r\nDie Waffel war auch sehr lecker und angenehm groß.', 'uploads/checkins/checkin_68077831306e46.00666877.jpg'),
(23, 1, 31, '2025-04-22 13:08:39', 'Softeis', '4.7', '3.5', '3.8', 'Beliebter Softeisstand auf dem Markt in Kietscher. Es gab zwei verschiedene gemischte Softeis zur Auswahl in klein und groß für 1,50 bzw. 2,50 € und für 20 Cent Aufpreis gab es Streusel auf das Eis.', 'uploads/checkins/checkin_680778b7809bd9.23540954.jpg'),
(24, 1, 59, '2025-04-22 16:45:20', 'Kugel', '4.8', '2.5', '4.5', 'Feines kleines Eislokal mit leckeren Sorten, großen Kugeln und fairen Preisen.', 'uploads/checkins/checkin_6807ab80cd8189.01435225.jpg'),
(25, 1, 6, '2025-04-23 10:24:44', 'Kugel', '3.9', '1.5', '2.4', 'Ich hatte ein Sorbet Eis der Geschmacksrichtung Heidelbeere, was geschmacklich nicht ganz überzeugt hat. Die Größe war unteres Mittelfeld und die Waffel leider eine einfachste Pappwaffel.', 'uploads/checkins/checkin_6808a3cc294272.31810929.jpg'),
(26, 1, 10, '2025-04-23 10:30:07', 'Kugel', '4.8', '4.7', '4.3', 'Sehr leckeres Eis in einer leckeren großen Waffel. Die Portion sind auch recht groß, aber bei einem Preis von 1,80 € bzw. 2,20 € für Premiumsorten pro Kugel könnten sie noch größer sein.\r\nSchöner Außenbereich zum sitzen.', 'uploads/checkins/checkin_6808a50f008879.38210265.jpg'),
(39, 3, 115, '2025-04-22 13:24:51', 'Softeis', '4.7', '3.2', '4.5', 'Bei meinem Besuch im Eisgarten an der Kaßbergauffahrt ließ ich mir ein Schoko-Vanille-Softeis schmecken. Überzeugen konnte das Eis durch die Kombination aus der für Softeis üblichen cremigen Konsistenz sowie durch seinen angenehmen Geschmack. Eine eher schlechtere Bewertung erhielt die sehr einfache Waffel. Das Angebot an Eissorten ist sehr überschaubar, was aber bei Softeis keine Überraschung ist. Punkten kann der Eisgarten ebenfalls durch seine kleine anschließende Grünfläche sowie einige Sitzmöglichkeiten, die zum Verweilen einladen. Für Softeis-Liebhaber einen Besuch wert!', NULL),
(52, 1, 16, '2025-04-25 08:02:39', 'Kugel', '4.6', '3.5', '4.0', '', 'uploads/checkins/checkin_680b257f5ecd81.04364034.jpg'),
(53, 1, 29, '2025-04-25 08:04:57', 'Kugel', '5.0', '3.5', '3.7', 'Ich hatte eine Kugel Marzipan und\r\neine Kugel Cookies, beide waren\r\nsuper lecker und viel zu schnell\r\nverputzt. Bemerkenswert war die Cremigkeit vom Eis.\r\nDas Lokal ist sehr niedlich und\r\nscheint privat betrieben zu sein.', 'uploads/checkins/checkin_680b260953a2c6.04111238.jpg'),
(54, 1, 37, '2025-04-25 08:09:37', 'Kugel', '4.6', '4.8', '3.5', 'Uriges kleines Lokal. Der ältere Betreiber erklärte mir dass er das Kremeeis selber aus Milch, Eiern und Zucker herstellt.\r\nDen Unterschied zu anderen Eis hat man in der Konsistenz geschmeckt, es hatte mehr Struktur. Insgesamt geschmacklich sehr gut, aber etwas sahniger hätte es für meinen Geschmack sein können.', 'uploads/checkins/checkin_680b27215c9cd7.16477511.jpg'),
(55, 1, 58, '2025-04-25 08:19:24', 'Kugel', '2.5', '3.0', '1.7', 'Sehr liebevolles Café mit wirklich tollen, leckeren Kuchen und Torten zu sehr fairen Preisen, aber leider war das Eis nicht wirklich gut. Es hatten sich schon Kristalle gebildet, was vielleicht daran liegen mag, dass es insgesamt wenig besucht ist. Sehr schade :(', 'uploads/checkins/checkin_680b296ce5fe31.37610516.jpg'),
(56, 1, 71, '2025-04-25 08:21:22', 'Kugel', '4.8', '4.2', '4.0', 'Das Eis war sehr lecker und enthielt einige Schoko- / Pralinenstückchen. Die Portion war für 2,00€ angemessen und die Waffel war auch recht lecker aber klein. Andere Kunden mit ebenfalls nur einer Kugel Eis haben teilweise andere (größere) Waffeln erhalten.', 'uploads/checkins/checkin_680b29e24a1a94.15558268.jpg'),
(57, 1, 86, '2025-04-25 08:23:32', 'Kugel', '2.4', '2.0', '2.4', 'Eine Kugel Straciatella und eine Kugel Pfirsich-Maracuja.\r\nDie Kugel Straciatella hatte zwar viele Schokostückchen aber beide Kugeln haben wässrig geschmeckt, waren eher klein und geben in Verbindung mit einer pappigen Waffel ein schlechtes Gesamtbild ab.', 'uploads/checkins/checkin_680b2a64289c96.21068159.jpg'),
(58, 1, 118, '2025-04-26 13:13:39', 'Kugel', '4.6', '4.6', '5.0', 'Eine super Auswahl von ca. 30 Sorten, davon ziemlich viele ausgefallene.\r\nDie Kugeln waren die größten die ich bis jetzt jemals bekommen habe.\r\nDas Eis war lecker, aber bei der Geschmacksintensität ist noch bisschen Raum nach oben.\r\nInsgesamt eine große Empfehlung.', 'uploads/checkins/checkin_680cbfe340a0f3.28355942.jpg');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

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
