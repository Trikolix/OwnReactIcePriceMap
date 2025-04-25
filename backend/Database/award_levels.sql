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
-- Tabellenstruktur für Tabelle `award_levels`
--

CREATE TABLE `award_levels` (
  `id` int NOT NULL,
  `award_id` int NOT NULL,
  `level` int NOT NULL,
  `threshold` int NOT NULL,
  `icon_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `title_de` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description_de` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `award_levels`
--

INSERT INTO `award_levels` (`id`, `award_id`, `level`, `threshold`, `icon_path`, `title_de`, `description_de`) VALUES
(7, 1, 1, 3, 'uploads/awards/award_6808ce8cb7b85.png', 'Grenzgänger mit Geschmack', 'Du hast Eisdielen in 3 verschiedenen Landkreisen besucht! Dein Eishunger kennt keine Gemeindegrenzen – du bist auf süßer Entdeckungsreise.'),
(8, 1, 2, 5, 'uploads/awards/award_6808d065a0a82.png', 'Der Landkreis-Löffler', '5 Landkreise, 5 mal Eisliebe neu entdeckt! Du weißt: Jede Region hat ihre eigene Kugel-Philosophie – und du bist mittendrin.'),
(9, 1, 3, 10, 'uploads/awards/award_6808d10df2ca6.png', 'Kreisläufer auf Eis-Mission', '10 Landkreise voller Kugelkunst liegen hinter dir! Du bist ein echter Eis-Explorer, dein Gaumen hat schon fast einen eigenen Reisepass.'),
(10, 1, 4, 20, 'uploads/awards/award_6808d12ebdb30.png', 'Der Eis-Nomade', '20 Landkreise, 20 mal Glück! Wo du auftauchst, schmilzt das Eis – und die Herzen gleich mit. Du bist die mobile Legende der Schleckkultur.'),
(11, 1, 5, 30, 'uploads/awards/award_6808d141f2569.png', 'Der Landkr(eis)könig', '30 Landkreise? Du bist die höchste Eisdielen-Instanz im Umkreis von 200 Kilometern. Wer dir folgt, folgt dem Geschmack.'),
(12, 6, 1, 1, 'uploads/awards/award_6808d7097cc6e.png', 'Erster Schnappschuss', 'Du hast dein allererstes Foto eingereicht – ein historischer Moment! Jetzt wissen wir: Du kannst nicht nur Eis essen, sondern auch knipsen.'),
(13, 6, 3, 20, 'uploads/awards/award_6808d733e0df6.png', 'Der Eisfluencer', '20 visuelle Eiswerke später: Du bringst Glanz in jede Waffel und Stil in jeden Becher. Insta-worthy durch und durch!'),
(14, 6, 4, 50, 'uploads/awards/award_6808d7638faaa.png', 'Fotogeschmacksexperte', '50 mal Eis, 50 mal Klick – du dokumentierst Eiskunst wie ein Profi. Deine Galerie ist eine Ode an den Sommer.'),
(15, 6, 2, 10, 'uploads/awards/award_6809f6c323bbe.png', 'Kugel-Knipser', '10 Fotos, 10 mal Genuss im Bildformat! Deine Kamera liebt Eis fast so sehr wie du – weiter so!'),
(16, 6, 5, 100, 'uploads/awards/award_6809f8a524f5e.png', 'Der Paparazzi des Speiseeises', '100 Fotos? Du bist der Meister der eiskalten Momentaufnahmen. Wenn irgendwo Eis serviert wird, bist du mit der Linse schon da.'),
(22, 9, 1, 1, 'uploads/awards/award_680ae7ac902bf.png', 'Jede Art von Eis ist wunderbar!', 'Du hast bereits Kugeleis, Softeis und Eisbecher eingecheckt.'),
(23, 10, 1, 1, 'uploads/awards/award_680ae9bb9320f.jpg', 'Fürst Pückler ', 'Du hast bereits ein Vanille, ein Erdbeer und ein Schoko Eis eingecheckt.'),
(24, 11, 1, 1, 'uploads/awards/award_680aee0db3554.jpg', 'Perfekte Woche ', '7  Tage lang täglich Eis eingecheckt'),
(27, 3, 1, 5, 'uploads/awards/award_680a357b235ed.png', 'Kugel-Kenner', '5 Kugeln Eis – du weißt, was schmeckt! Deine Geschmacksknospen haben sich gerade aufgewärmt – das Abenteuer hat gerade erst begonnen.'),
(28, 3, 2, 15, 'uploads/awards/award_680a35a2d3362.png', 'Triple-Scooper', '15 Kugeln – du jonglierst Sorten wie ein echter Profi! Du bist auf dem besten Weg zur Eis-Elite.'),
(29, 3, 3, 100, 'uploads/awards/award_680a35c35870e.png', 'Eisberg voraus!', '100 Kugeln! (Kein Scherz.) Du bist offiziell eine wandelnde Eisdiele. Deine Lieblingssorte kennt dich beim Namen.'),
(30, 3, 4, 200, 'uploads/awards/award_680a35e047707.png', 'Der Kugel-Kapitän', '200 Kugeln – du steuerst souverän durch jede Eiskarte. Dein Löffel ist dein Kompass, dein Magen ein Tresor für Glück.'),
(31, 3, 5, 1000, 'uploads/awards/award_680a3634585f6.png', 'Die Legende der Löffel', '1000 Kugeln?! Du bist ein Mythos unter Eisfreunden. Irgendwo erzählt man sich Geschichten über dich – der oder die, der alles probiert hat. Mehrfach.'),
(32, 8, 1, 1, 'uploads/awards/award_680b6aab6fcc0.png', 'Eisdielen-Entdecker', 'Trage eine neue Eisdiele ein.'),
(33, 8, 2, 3, 'uploads/awards/award_680b6ac7bec0d.png', 'Eisdielen-Kundschafter', 'Trage mindestens 3 neue Eisdielen ein.'),
(34, 8, 4, 10, 'uploads/awards/award_680b6c6685927.png', 'Eisdielen-Botschafter', 'Trage mindestens 10 neue Eisdielen ein.'),
(35, 7, 1, 1, 'uploads/awards/award_680b70853fa69.png', 'Pfennigfuchser', 'Du hast schon eine Preismeldung für Eis abgeben.'),
(36, 7, 2, 5, 'uploads/awards/award_680b70b68a9cf.png', 'Groschenzähler', 'Du hast schon mindestens 5 Preismeldungen abgegeben.'),
(37, 7, 3, 10, 'uploads/awards/award_680b70d96a7c6.png', 'Sparschwein', 'Du hast schon mindestens 10 Preismeldungen abgeben.'),
(38, 7, 4, 50, 'uploads/awards/award_680b71c9f1527.png', 'Eis-Kapitalist', 'Du hast schon mehr als 50 Preise eingetragen. Good Job!'),
(39, 7, 5, 100, 'uploads/awards/award_680b730a16943.png', 'Eis-Börsenmakler', 'Du hast bereits mehr als 100 Preise gemeldet und hast die totale Preisübersicht auf dem Eismarkt.'),
(40, 2, 1, 1, 'uploads/awards/award_680b74ac2beaa.jpg', 'Erster Löffel!', 'Dein erster Check-in – wie aufregend! (1/∞) Der Start eines großen Abenteuers, mit vielen leckeren Kugeln und klebrigen Fingern. Jetzt geht’s erst richtig los!'),
(41, 2, 2, 3, 'uploads/awards/award_680b7678539f0.png', 'Eis-Entdecker', '3 Check-Ins und du bist schon auf Entdeckungstour! Neue Sorten, neue Orte – dein Löffel hat sich offiziell auf die Reise gemacht.'),
(42, 8, 3, 5, 'uploads/awards/award_680b7741d9ce8.png', 'Eisdielen Influencer', 'Schon 5 neue Eisdielen eingetragen, die ersten Jünger folgen dir.'),
(43, 8, 5, 20, 'uploads/awards/award_680b789583229.png', 'Reiseguru für Eisdielen', 'Du hast schon mehr als 20 neue Eisdielen eingetragen. Dein Rat und Wissen wird über alle Grenzen hinweg geschätzt!'),
(44, 4, 1, 1, 'uploads/awards/award_680b78ddb85fb.png', 'Softie-Starter', 'Dein allererstes Softeis! (1 Softeis) Noch wackelt die Waffel – aber der erste Schleck ist gemacht. Willkommen in der cremigen Welt der Drehmaschinen!'),
(45, 2, 3, 5, 'uploads/awards/award_680bb72e3099e.png', 'Schnupper-Profi', 'Mit 5 Check-Ins bist du kein Anfänger mehr. Dein Bauch freut sich, dein Gaumen kennt schon so einiges – und du weißt: Es geht noch mehr!'),
(46, 2, 4, 10, 'uploads/awards/award_680bb7957c22f.png', 'Stammgast in Spe', '10-mal eingecheckt – man kennt dich! Die Kugelverkäufer nicken dir zu. Noch ein paar Besuche, und du bekommst den Ehrenlöffel.'),
(47, 2, 5, 20, 'uploads/awards/award_680bb81fd37a2.png', 'Kugel-Kenner', '20 Check-Ins sprechen eine klare Sprache: Du bist ein Genießer mit Erfahrung. Du erkennst gute Sorten blind – und isst trotzdem mit offenen Augen.'),
(48, 2, 6, 50, 'uploads/awards/award_680bb90c0f608.png', 'Eisdielen-Legende', 'Schon 50-mal eingecheckt! Man erzählt sich von dir – du bist der oder die mit dem unersättlichen Hunger nach Kugelglück.'),
(49, 2, 7, 100, 'uploads/awards/award_680bb947a5fdc.png', 'Großmeister der Gelaterias', '100 Check-Ins – du hast mehr Löffel geleert als andere Eisdielen kennen. Vermutlich hast du schon eine Kugel auf deinem Namen.'),
(50, 2, 8, 500, 'uploads/awards/award_680bb971e5094.png', 'Unaufhaltbarer Eis-König', 'Mit 500 Check-Ins bist du unantastbar. Du herrschst über Waffeln, Becher und Softeis. Der Legende nach tropft dein Schweiß nach Erdbeer.'),
(51, 4, 2, 3, 'uploads/awards/award_680bbb0e33857.png', 'Dreher der Herzen', '3-mal hast du dir ein Softeis gegönnt – das ist wahre Liebe in Spiralform! Dein Geschmackssinn hat jetzt offiziell den Swirl-Segen.'),
(52, 4, 3, 10, 'uploads/awards/award_680bbb252723c.png', 'Softe(r) Profi', '10 Softeis – du weißt genau, wie man die perfekte Höhe balanciert, ohne dass es tropft. Du bist bereit für extra Toppings und neidische Blicke.');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `award_id` (`award_id`,`level`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  ADD CONSTRAINT `award_levels_ibfk_1` FOREIGN KEY (`award_id`) REFERENCES `awards` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
