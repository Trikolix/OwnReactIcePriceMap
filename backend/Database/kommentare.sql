-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:25
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
(15, 193, 23, 'Oh, das muss ich mir mal anschauen. Die liegen ja direkt in der Umgebung, für mich ist\'s einfacher da mal vorbeizuschauen. ☺️', '2025-06-16 08:07:15'),
(16, 194, 1, 'Oh zyprisches Eis 🤓😏\nDann schmecken lassen und einen schönen Urlaub! 😎', '2025-06-16 15:51:30'),
(17, 187, 47, 'Ach hab ich wohl vergessen zu schreiben ;) 1,80€', '2025-06-17 16:13:17'),
(18, 198, 1, 'Du genießt ja fleißig das Eis in Zypern! :)\nLeider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen.', '2025-06-17 17:36:42'),
(19, 195, 1, 'Hey, schön dich bei der Eis-App begrüßen zu können! :)\nLeider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen.', '2025-06-17 17:37:21'),
(20, 199, 1, 'Hey, leider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen. :)', '2025-06-17 17:37:53'),
(21, 194, 31, 'Danke :)', '2025-06-17 20:10:01'),
(22, 205, 1, 'Einen schönen Urlaub wünsche ich dir! 😊\nViel Spaß in der Heimat des Gelatos 🇮🇹🍨', '2025-06-18 17:15:30'),
(23, 205, 49, 'Dankeschön 🍀🇮🇹', '2025-06-19 11:57:29'),
(24, 217, 1, 'Herzlich Willkommen auf der Ice-App 🫶🏼🍦\nUnd weiterhin viele leckere Eis und noch einen schönen Urlaub! 😊', '2025-06-21 03:06:54'),
(25, 232, 1, 'Pistazie und weiße Schokolade sind schon sehr geile Sorten 😋🤤\n\nWeißt du zufällig noch wie teuer eine Kugel Eis war? 😅', '2025-06-23 15:48:45'),
(26, 246, 1, 'Eine wirklich sehr gute Eisdiele 👌🏼😋', '2025-06-25 14:36:25'),
(27, 247, 1, 'ist ja auch geil mit der kleinen Waffelmütze oben drauf! 😁😅', '2025-06-25 15:21:10'),
(28, 256, 1, 'Herzlich willkommen auf der Ice-App, schön dass du an Board bist!🤗\nImmer köstliche Eise für deinen Gaumen! 😋', '2025-06-29 13:34:33'),
(29, 264, 1, 'Das Eis sieht ja echt verdammt lecker aus 😍😋\nWillst du den Checkin noch auf Softeis umstellen?', '2025-06-30 13:05:03'),
(30, 264, 52, 'Ja, war es auch😅 und Dankeschön für den Hinweis!😊', '2025-06-30 18:16:58'),
(31, 266, 2, 'Ich kenn das, wenn das Eis so lecker aussieht, dass man erstmal das Bild vergisst 😂🍦', '2025-07-01 18:19:04'),
(32, 275, 1, 'Oha, Osnabrück setzt ja wirklich gute Maßstäbe was Preis-Leistung angeht 🤩🤯\nHerzlichen Glückwunsch zum ersten CheckIn auf der Ice-App!', '2025-07-03 16:23:48'),
(33, 277, 1, 'Hey cool dass du wieder Eis eingecheckt hast, aber Spaghetti Eis klingt für mich eher nach Eisbecher als Kugeleis 🤔😅', '2025-07-04 19:10:45'),
(34, 286, 1, 'Oha das sind ja wirklich ganz andere Preise 😵‍💫\nUnd ich dachte 3,50€ in Frankreich sind teuer 😅😅😂', '2025-07-05 20:11:23'),
(35, 277, 40, 'Stimmt! Dank drop-down Menü angepasst!', '2025-07-06 14:32:20'),
(36, 283, 2, 'Wuuuucher :D', '2025-07-06 20:38:41'),
(37, 281, 2, 'Waffel wohl besser als das Eis?😂😝', '2025-07-06 20:40:01'),
(38, 307, 1, 'Das erste Transatlantische Eis eingecheckt! 🤩\nIhr macht auch ne schöne Rundreise! Viel Spaß noch weiterhin!', '2025-07-09 04:16:20'),
(39, 313, 1, 'Herzlich Willkommen auf der Ice-App! 🤗\nUnd eine gute Reise durch UK, ich hoffe du findest noch bessere Eis-Stopps bei den Britten 😀', '2025-07-10 16:53:51'),
(40, 316, 1, 'Einen schönen Urlaub euch! 🌅🤗', '2025-07-10 17:35:57'),
(41, 331, 1, 'Herzlich Willkommen auf der Ice-App und Glückwunsch zum ersten CheckIn 🤗\nCool dass du an Board bist und noch viele tolle Eis-Erlebnisse dir!', '2025-07-14 14:58:51'),
(42, 331, 2, 'Ui gleich 4 Sorten! 🍦🥳', '2025-07-14 16:14:13'),
(43, 325, 2, 'Ah oui la gelateria', '2025-07-14 16:15:02'),
(44, 331, 81, 'Ja, wir waren zu zweit unterwegs ;-)', '2025-07-14 16:53:21'),
(45, 259, 2, 'Ach da gibt\'s auch normales Eis? Da muss ich wohl mal hin', '2025-07-14 18:20:53'),
(46, 307, 8, 'Danke!\nJa, hier regnet es Abzeichen bei mir. :)', '2025-07-14 20:36:09'),
(52, 351, 1, 'Sieht echt verdammt lecker aus! Und der Preis ist auch gut für französische Verhältnisse 😏\nEinen schönen Urlaub dir!', '2025-07-18 20:01:47'),
(53, 371, 1, 'Hey, welcome on the Ice-App! Great that you joined us! 😊\n\nBy the way, you made the 300. Checkin on this App! So congratulations! 🏆🥳\n\nHope you have fun using this App!', '2025-07-22 06:26:49'),
(54, 372, 1, 'Herzlich Willkommen auf der Ice-App und Glückwunsch zum ersten Check-In! 😊🥳\nAuf viele weitere tolle Eis Erlebnisse und natürlich noch einen schönen Urlaub!', '2025-07-22 17:09:52'),
(55, 373, 1, 'Sehr nice, richtige Eisbecher Verköstiger 😏🤙🏼', '2025-07-23 13:04:35'),
(56, 378, 40, 'Nyam😋', '2025-07-25 17:26:15'),
(57, 400, 2, 'È un gelato gustoso🇮🇹', '2025-07-29 15:20:40'),
(58, 403, 1, 'Lavendel hatte ich auch beim letzten Mal überlegt zu nehmen und hab es nicht getan. Nach deinem Bericht muss ich das wohl nachholen 🤓😁\n\nHast du die Flyer und Sticker für die Ice-App auslegen sehen?', '2025-07-30 18:17:54'),
(59, 406, 1, 'Sieht echt mega lecker aus 😍😋', '2025-08-01 12:49:36'),
(60, 409, 1, 'Ohhh das sieht doch nach einem sehr geilen Eis aus! 😍\nEine tolle Belohnung nach so einer harten Alpen-Etappe und hoffentlich Entschädigung für das schlechte Softeis davor 😅', '2025-08-01 19:47:41'),
(61, 410, 1, 'Das sieht mir nach einem guten Eis aus 😍😋\nEinen schönen Urlaub euch noch und danke für den Checkin 🫶🏼', '2025-08-01 19:51:04'),
(62, 411, 1, 'Na da habt ihr ja noch ein günstiges und leckeres Eis gefunden 😍😋👌🏼', '2025-08-01 20:36:06'),
(63, 409, 23, 'Ich hätte mich trauen sollen und die ausgefallen Sorten probieren sollen. Naja, beim nächsten Mal vielleicht. 😅', '2025-08-02 12:29:58'),
(64, 406, 2, 'So isses🍨🇮🇹', '2025-08-02 12:48:22'),
(65, 419, 1, 'Hey, willkommen auf der Ice-App 💓👋🏼\nSieht nach einem leckeren Eis aus!\n\nViele weiter tolle Eis Momente dir und erstmal noch eine gute Bikepacking Tour!', '2025-08-02 18:40:19'),
(66, 419, 2, 'Puh das sieht ja wahnsinnig lecker aus, anscheinend Handgemacht?', '2025-08-03 14:38:32'),
(67, 418, 2, 'Günstige Softeise jaaa', '2025-08-03 14:38:58'),
(68, 424, 1, 'Hey, cool dass du an Board bist und herzlichen Glükwunsch zum Brevet Finish! 🥳​\nJa mit den ganzen Toppings die man sich dann noch drauf haut ist so ein \"kleines\" 3€ Eis wirklich oft ausreichend 😂​ \nWobei, wenn man sich bei so einer großen Radtour kein großes Eis leisten kann, wann dann? ​😛​', '2025-08-06 05:35:48'),
(69, 403, 53, 'Ist echt zu empfehlen. Auf Sticker und Co hab ich leider nicht geachtet', '2025-08-06 18:56:02'),
(70, 432, 1, 'Uhh da muss ich Marschners vielleicht doch mal wieder besuchen 🤔😁\nWas ist denn bei OmaMarschners drinne im Eis?', '2025-08-06 19:19:41'),
(71, 439, 1, 'Du hast vergessen die Sorte abzugeben. Sieht mir nach Schoko/Vanille aus? 🤔😅', '2025-08-07 18:59:10'),
(72, 439, 31, 'War bisschen im Zeit Verzug 😅 hab es aktualisiert', '2025-08-08 08:48:53'),
(73, 458, 1, 'Ohh da waren ich nur ein paar Stunden später als du beim Eiszapfen, aber Salted Caramel gab\'s bei und schön gar nicht mehr 😞😅\n\nBtw: heißes Bild 😏😀', '2025-08-13 15:36:31'),
(74, 467, 1, 'Hey,\nich war mal so frei und hab die Eisdiele von dir korrigiert.\nName und Adresse hatte zu der Eisdiele in der Sachsen-Allee gepasst, aber der Standort war irgendwo in Düsseldorf 😅\nhoffe das war okay?', '2025-08-16 14:54:13'),
(75, 468, 1, 'Herzlich Willkommen auf der Ice-App 🫶🏼\nSchön dass du an Board bist! Auf viele tolle Eis-Erlebnisse 🍦😊', '2025-08-17 14:36:52'),
(76, 467, 96, 'Oh,das war natürlich nicht beabsichtigt. Danke', '2025-08-18 02:59:08'),
(77, 473, 2, 'Das Softeis sieht aber auch echt gut aus ^^', '2025-08-23 19:01:49'),
(78, 471, 2, 'Da muss ich auch dringend mal hin', '2025-08-23 19:02:29'),
(79, 492, 1, 'Einen schönen Urlaub dir! 😎☀️', '2025-08-27 14:05:51');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

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
