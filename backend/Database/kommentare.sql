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
-- Tabellenstruktur für Tabelle `kommentare`
--

CREATE TABLE `kommentare` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `checkin_id` int DEFAULT NULL,
  `bewertung_id` int DEFAULT NULL,
  `route_id` int DEFAULT NULL,
  `kommentar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `kommentare`
--

INSERT INTO `kommentare` (`id`, `nutzer_id`, `checkin_id`, `bewertung_id`, `kommentar`, `erstellt_am`) VALUES
(1, 1, 186, NULL, 'Ohh interessant, Erdbeer-Vanille muss ich auch mal ausprobieren! 😋😍', '2025-06-13 05:38:17'),
(2, 1, 185, NULL, 'Sieht echt sehr lecker aus! 😋 \nIst schon eine gute Eisdiele. Bei mir war der Verkäufer auch wahnsinnig freundlich.\nMit der Platzsituation hast du natürlich recht, gerade mit der Family wirds da eng mit Rädern.', '2025-06-13 05:39:49'),
(3, 1, 182, NULL, 'Mit dem Cityroller ist natürlich auch mal was anderes :D', '2025-06-13 05:40:33'),
(4, 1, 184, NULL, 'Sehr coole Radtour die du da zurück gelegt hast 🚴🏼‍♂️👍🏼\nUnd gleich zwei neue Eisdielen eingecheckt 🔥🫶🏼', '2025-06-13 05:42:36'),
(5, 1, 187, NULL, 'Willkommen auf der Ice-App und vielen Dank für deinen ersten CheckIn 🤗\nWeißt du zufällig noch wie teuer eine Kugel Eis war?', '2025-06-13 05:56:36'),
(6, 1, 180, NULL, 'Die Waffel sieht ja mal richtig lecker aus! 😍​', '2025-06-13 06:00:57'),
(7, 1, 71, NULL, 'sieht echt Hammer aus! 🤩​ Mango ist natürlich auch ne geile Geschmacksrichtung für Softeis.\n\nAber die Waffel sieht mir doch recht pappig aus 😅', '2025-06-13 06:06:10'),
(9, 13, 186, NULL, 'Richtiger Stammkunde bei der Eisdiele Dietz! Gefällt mir!', '2025-06-13 06:25:04'),
(12, 1, 188, NULL, 'Da wurde sich schön ein Eis zum Geburtstag gegönnt 😍😋\nHerzlichen Glückwunsch zum Geburtstag und ich hoffe es hat geschmeckt 🥳😁', '2025-06-13 11:27:40'),
(13, 1, 193, NULL, 'Sehr geil, das ist wirklich geschmacklich eine meiner absoluten Lieblingseisdielen! 😍\nich hab gelesen die haben auch einen Eis-Burger wo das Eis in einem Ufo-Burger-Brötchen eingebacken wird. 🧐\nDen will ich mal ausprobieren wenn ich das nächste Mal dort bin', '2025-06-15 18:17:10'),
(14, 1, 190, NULL, 'Oha, das ist ja wirklich ein riiesiges Eis! 🤩', '2025-06-15 18:17:52'),
(15, 23, 193, NULL, 'Oh, das muss ich mir mal anschauen. Die liegen ja direkt in der Umgebung, für mich ist\'s einfacher da mal vorbeizuschauen. ☺️', '2025-06-16 08:07:15'),
(16, 1, 194, NULL, 'Oh zyprisches Eis 🤓😏\nDann schmecken lassen und einen schönen Urlaub! 😎', '2025-06-16 15:51:30'),
(17, 47, 187, NULL, 'Ach hab ich wohl vergessen zu schreiben ;) 1,80€', '2025-06-17 16:13:17'),
(18, 1, 198, NULL, 'Du genießt ja fleißig das Eis in Zypern! :)\nLeider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen.', '2025-06-17 17:36:42'),
(19, 1, 195, NULL, 'Hey, schön dich bei der Eis-App begrüßen zu können! :)\nLeider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen.', '2025-06-17 17:37:21'),
(20, 1, 199, NULL, 'Hey, leider gab es einen Bug, so dass es die eingecheckten Sorten nicht gespeichert hat.\nDen habe ich aber schon behoben, wenn du willst kannst du deinen Checkin ja nochmal bearbeiten und die Sorten nochmal eintragen. :)', '2025-06-17 17:37:53'),
(21, 31, 194, NULL, 'Danke :)', '2025-06-17 20:10:01'),
(22, 1, 205, NULL, 'Einen schönen Urlaub wünsche ich dir! 😊\nViel Spaß in der Heimat des Gelatos 🇮🇹🍨', '2025-06-18 17:15:30'),
(23, 49, 205, NULL, 'Dankeschön 🍀🇮🇹', '2025-06-19 11:57:29'),
(24, 1, 217, NULL, 'Herzlich Willkommen auf der Ice-App 🫶🏼🍦\nUnd weiterhin viele leckere Eis und noch einen schönen Urlaub! 😊', '2025-06-21 03:06:54'),
(25, 1, 232, NULL, 'Pistazie und weiße Schokolade sind schon sehr geile Sorten 😋🤤\n\nWeißt du zufällig noch wie teuer eine Kugel Eis war? 😅', '2025-06-23 15:48:45'),
(26, 1, 246, NULL, 'Eine wirklich sehr gute Eisdiele 👌🏼😋', '2025-06-25 14:36:25'),
(27, 1, 247, NULL, 'ist ja auch geil mit der kleinen Waffelmütze oben drauf! 😁😅', '2025-06-25 15:21:10'),
(28, 1, 256, NULL, 'Herzlich willkommen auf der Ice-App, schön dass du an Board bist!🤗\nImmer köstliche Eise für deinen Gaumen! 😋', '2025-06-29 13:34:33'),
(29, 1, 264, NULL, 'Das Eis sieht ja echt verdammt lecker aus 😍😋\nWillst du den Checkin noch auf Softeis umstellen?', '2025-06-30 13:05:03'),
(30, 52, 264, NULL, 'Ja, war es auch😅 und Dankeschön für den Hinweis!😊', '2025-06-30 18:16:58'),
(31, 2, 266, NULL, 'Ich kenn das, wenn das Eis so lecker aussieht, dass man erstmal das Bild vergisst 😂🍦', '2025-07-01 18:19:04'),
(32, 1, 275, NULL, 'Oha, Osnabrück setzt ja wirklich gute Maßstäbe was Preis-Leistung angeht 🤩🤯\nHerzlichen Glückwunsch zum ersten CheckIn auf der Ice-App!', '2025-07-03 16:23:48'),
(33, 1, 277, NULL, 'Hey cool dass du wieder Eis eingecheckt hast, aber Spaghetti Eis klingt für mich eher nach Eisbecher als Kugeleis 🤔😅', '2025-07-04 19:10:45'),
(34, 1, 286, NULL, 'Oha das sind ja wirklich ganz andere Preise 😵‍💫\nUnd ich dachte 3,50€ in Frankreich sind teuer 😅😅😂', '2025-07-05 20:11:23'),
(35, 40, 277, NULL, 'Stimmt! Dank drop-down Menü angepasst!', '2025-07-06 14:32:20'),
(36, 2, 283, NULL, 'Wuuuucher :D', '2025-07-06 20:38:41'),
(37, 2, 281, NULL, 'Waffel wohl besser als das Eis?😂😝', '2025-07-06 20:40:01'),
(38, 1, 307, NULL, 'Das erste Transatlantische Eis eingecheckt! 🤩\nIhr macht auch ne schöne Rundreise! Viel Spaß noch weiterhin!', '2025-07-09 04:16:20'),
(39, 1, 313, NULL, 'Herzlich Willkommen auf der Ice-App! 🤗\nUnd eine gute Reise durch UK, ich hoffe du findest noch bessere Eis-Stopps bei den Britten 😀', '2025-07-10 16:53:51'),
(40, 1, 316, NULL, 'Einen schönen Urlaub euch! 🌅🤗', '2025-07-10 17:35:57'),
(41, 1, 331, NULL, 'Herzlich Willkommen auf der Ice-App und Glückwunsch zum ersten CheckIn 🤗\nCool dass du an Board bist und noch viele tolle Eis-Erlebnisse dir!', '2025-07-14 14:58:51'),
(42, 2, 331, NULL, 'Ui gleich 4 Sorten! 🍦🥳', '2025-07-14 16:14:13'),
(43, 2, 325, NULL, 'Ah oui la gelateria', '2025-07-14 16:15:02'),
(44, 81, 331, NULL, 'Ja, wir waren zu zweit unterwegs ;-)', '2025-07-14 16:53:21'),
(45, 2, 259, NULL, 'Ach da gibt\'s auch normales Eis? Da muss ich wohl mal hin', '2025-07-14 18:20:53'),
(46, 8, 307, NULL, 'Danke!\nJa, hier regnet es Abzeichen bei mir. :)', '2025-07-14 20:36:09'),
(52, 1, 351, NULL, 'Sieht echt verdammt lecker aus! Und der Preis ist auch gut für französische Verhältnisse 😏\nEinen schönen Urlaub dir!', '2025-07-18 20:01:47'),
(53, 1, 371, NULL, 'Hey, welcome on the Ice-App! Great that you joined us! 😊\n\nBy the way, you made the 300. Checkin on this App! So congratulations! 🏆🥳\n\nHope you have fun using this App!', '2025-07-22 06:26:49'),
(54, 1, 372, NULL, 'Herzlich Willkommen auf der Ice-App und Glückwunsch zum ersten Check-In! 😊🥳\nAuf viele weitere tolle Eis Erlebnisse und natürlich noch einen schönen Urlaub!', '2025-07-22 17:09:52'),
(55, 1, 373, NULL, 'Sehr nice, richtige Eisbecher Verköstiger 😏🤙🏼', '2025-07-23 13:04:35'),
(56, 40, 378, NULL, 'Nyam😋', '2025-07-25 17:26:15'),
(57, 2, 400, NULL, 'È un gelato gustoso🇮🇹', '2025-07-29 15:20:40'),
(58, 1, 403, NULL, 'Lavendel hatte ich auch beim letzten Mal überlegt zu nehmen und hab es nicht getan. Nach deinem Bericht muss ich das wohl nachholen 🤓😁\n\nHast du die Flyer und Sticker für die Ice-App auslegen sehen?', '2025-07-30 18:17:54'),
(59, 1, 406, NULL, 'Sieht echt mega lecker aus 😍😋', '2025-08-01 12:49:36'),
(60, 1, 409, NULL, 'Ohhh das sieht doch nach einem sehr geilen Eis aus! 😍\nEine tolle Belohnung nach so einer harten Alpen-Etappe und hoffentlich Entschädigung für das schlechte Softeis davor 😅', '2025-08-01 19:47:41'),
(61, 1, 410, NULL, 'Das sieht mir nach einem guten Eis aus 😍😋\nEinen schönen Urlaub euch noch und danke für den Checkin 🫶🏼', '2025-08-01 19:51:04'),
(62, 1, 411, NULL, 'Na da habt ihr ja noch ein günstiges und leckeres Eis gefunden 😍😋👌🏼', '2025-08-01 20:36:06'),
(63, 23, 409, NULL, 'Ich hätte mich trauen sollen und die ausgefallen Sorten probieren sollen. Naja, beim nächsten Mal vielleicht. 😅', '2025-08-02 12:29:58'),
(64, 2, 406, NULL, 'So isses🍨🇮🇹', '2025-08-02 12:48:22'),
(65, 1, 419, NULL, 'Hey, willkommen auf der Ice-App 💓👋🏼\nSieht nach einem leckeren Eis aus!\n\nViele weiter tolle Eis Momente dir und erstmal noch eine gute Bikepacking Tour!', '2025-08-02 18:40:19'),
(66, 2, 419, NULL, 'Puh das sieht ja wahnsinnig lecker aus, anscheinend Handgemacht?', '2025-08-03 14:38:32'),
(67, 2, 418, NULL, 'Günstige Softeise jaaa', '2025-08-03 14:38:58'),
(68, 1, 424, NULL, 'Hey, cool dass du an Board bist und herzlichen Glükwunsch zum Brevet Finish! 🥳​\nJa mit den ganzen Toppings die man sich dann noch drauf haut ist so ein \"kleines\" 3€ Eis wirklich oft ausreichend 😂​ \nWobei, wenn man sich bei so einer großen Radtour kein großes Eis leisten kann, wann dann? ​😛​', '2025-08-06 05:35:48'),
(69, 53, 403, NULL, 'Ist echt zu empfehlen. Auf Sticker und Co hab ich leider nicht geachtet', '2025-08-06 18:56:02'),
(70, 1, 432, NULL, 'Uhh da muss ich Marschners vielleicht doch mal wieder besuchen 🤔😁\nWas ist denn bei OmaMarschners drinne im Eis?', '2025-08-06 19:19:41'),
(71, 1, 439, NULL, 'Du hast vergessen die Sorte abzugeben. Sieht mir nach Schoko/Vanille aus? 🤔😅', '2025-08-07 18:59:10'),
(72, 31, 439, NULL, 'War bisschen im Zeit Verzug 😅 hab es aktualisiert', '2025-08-08 08:48:53'),
(73, 1, 458, NULL, 'Ohh da waren ich nur ein paar Stunden später als du beim Eiszapfen, aber Salted Caramel gab\'s bei und schön gar nicht mehr 😞😅\n\nBtw: heißes Bild 😏😀', '2025-08-13 15:36:31'),
(74, 1, 467, NULL, 'Hey,\nich war mal so frei und hab die Eisdiele von dir korrigiert.\nName und Adresse hatte zu der Eisdiele in der Sachsen-Allee gepasst, aber der Standort war irgendwo in Düsseldorf 😅\nhoffe das war okay?', '2025-08-16 14:54:13'),
(75, 1, 468, NULL, 'Herzlich Willkommen auf der Ice-App 🫶🏼\nSchön dass du an Board bist! Auf viele tolle Eis-Erlebnisse 🍦😊', '2025-08-17 14:36:52'),
(76, 96, 467, NULL, 'Oh,das war natürlich nicht beabsichtigt. Danke', '2025-08-18 02:59:08'),
(77, 2, 473, NULL, 'Das Softeis sieht aber auch echt gut aus ^^', '2025-08-23 19:01:49'),
(78, 2, 471, NULL, 'Da muss ich auch dringend mal hin', '2025-08-23 19:02:29'),
(79, 1, 492, NULL, 'Einen schönen Urlaub dir! 😎☀️', '2025-08-27 14:05:51'),
(80, 1, 499, NULL, 'Willkommen auf der Ice-App 🫶🏼\nUnd vielen Dank für den Checkin, sieht echt nach sehr gutem Eis aus 😋', '2025-08-29 19:07:15'),
(81, 2, 448, NULL, 'Fehlt da aber nicht die Kugel auf dem Bild?🤣', '2025-09-01 19:14:29'),
(82, 2, 519, NULL, 'Da muss ich auch mal wieder hin', '2025-09-01 19:25:43'),
(83, 1, 525, NULL, 'Sehr cool, wie du Lissabon Eis checkst! 🫶🏼😁\nWenn du keine Waffel isst, kannst du auch einfach die Waffelbewertung frei lassen. 😅', '2025-09-03 01:18:52'),
(84, 40, 525, NULL, 'Ok! Da steht Wert muss größer 1 sein..', '2025-09-03 08:40:20'),
(85, 1, 525, NULL, 'Wenn man die Zahl einfach raus löscht (also nicht \'0\' rein schreiben, sondern wirklich löschen) müsste es funktionieren. 🤔\nAber wenn nicht ist es auch nicht schlimm, ändert nicht viel an der Bewertung. :)', '2025-09-03 09:09:22'),
(86, 40, 525, NULL, 'Ok! Die Waffel hier war übrigens gemäß (in Sachen Eis und Waffel) vertrauenswürdiger Begleitung äußerst köstlich!', '2025-09-03 11:55:10'),
(87, 2, 525, NULL, 'Ein perfektes Eis 💯😎', '2025-09-03 16:09:48'),
(88, 1, 528, NULL, 'Willkommen zurück im Ice-App Game! 💓​\nCookies ist natürlich ein leckerer Eis-Klassiker!\nWeisst du zufällig den Preis noch?', '2025-09-04 07:18:43'),
(89, 1, NULL, 386, 'Sehr schöne ausführliche Bewertung! Einen Lehrer würdig! 😁😜\nWillst du noch einen Checkin für dein Eis anlegen? 😏', '2025-09-04 07:28:18'),
(90, 1, NULL, 384, 'Hey, danke für die Bewertung und den wichtigen Hinweis!\nMagst du noch ein Checkin für dein Eis anlegen?', '2025-09-04 07:30:27'),
(91, 1, 536, NULL, 'Ohh das sieht mir echt nach sehr leckeren Eis aus! 😍\nUnd wirklich sehr gut klingende Sorten 🤤', '2025-09-06 13:21:40'),
(92, 125, 536, NULL, 'Absolut! 🙂😋', '2025-09-06 13:38:55'),
(93, 1, 539, NULL, 'Rekordverdächtige Eis Bestellung 😃\nSieht aber auch echt lecker aus 😍🤤', '2025-09-07 13:35:11'),
(94, 8, 539, NULL, 'Es war Mega gut. Das Pistazie war auch mit gesalzenen Pistazien… Aber ja - ich hab ein Gespür für die teuren Locations', '2025-09-07 14:16:57'),
(95, 1, NULL, 397, 'Also hatten die ganzen Google Bewertungen Recht mit der Unfreundlichkeit 🙈😅', '2025-09-10 04:25:20'),
(96, 1, 558, NULL, 'What? Als wir vorhin bei der Eisdiele vorbei sind haben die gerade zu gemacht 😅🙈\nOder warst du schon eher dort?', '2025-09-10 16:43:03'),
(97, 1, 562, NULL, 'Sehr schöner Eis-Spot 😎☺️', '2025-09-12 18:35:07'),
(98, 1, 569, NULL, 'Hey, herzlich Willkommen auf der Ice-App, schön dass du zu uns gefunden hast! 🫶🏼\nViel Spaß hier und immer frohes Eis schlecken! 😋🍦', '2025-09-16 19:24:27'),
(99, 1, 593, NULL, 'Ich glaube das Café Raabe wird vom Eiszapfen beliefert. Also kein wunder, dass das Eis so gut schmeckt 😋\nWeißt du zufällig wie viel dort eine Kugel kostet? 😅', '2025-09-22 08:28:08'),
(100, 1, 597, NULL, '5 Wochen Eis-Streak, sehr stabil! 💪🏼😁', '2025-09-24 07:36:19'),
(101, 53, 593, NULL, 'Leider schon wieder vergessen. Schaue die Tage mal vorbei', '2025-09-25 06:58:31'),
(102, 1, 605, NULL, 'Hast du da ne Doppel-Waffel bekommen?😏😁', '2025-09-30 16:31:07'),
(103, 1, 610, NULL, 'Herzlich Willkommen auf der Ice-App! Schön dass du dabei bist! ☺️\nAuf viele tolle Eis-Momente 🍨🤘🏼', '2025-10-01 20:28:27'),
(104, 1, 628, NULL, 'Die Eis sehen echt top aus! 😍\nSchönen Urlaub euch! 🏝️', '2025-10-04 20:17:36'),
(105, 1, 633, NULL, 'Sieht echt super lecker aus!', '2025-10-06 11:40:26'),
(106, 1, 634, NULL, 'Einen schönen Urlaub wünsche ich dir!  😊☀️\nMagst du vielleicht den Preis gleich noch bei der Eisdiele eintragen? :)', '2025-10-06 17:06:28'),
(107, 1, 636, NULL, 'Herzlich Willkommen auf der Ice-App 🫶🏼\nAuf viele tolle Eis Erlebnisse! 😊🍨\n\nDas ist natürlich eine krasse Story mit den Möwen 😅', '2025-10-07 19:41:51'),
(108, 19, 634, NULL, 'Danke dir! Preis ist ergänzt 😃', '2025-10-08 08:59:05'),
(109, 1, 665, NULL, 'Sieht nach einem schmackofatz Eis aus 😋😁\nAber was sind denn Spielereien beim Eis-Kauf? 😅', '2025-10-16 18:18:05'),
(110, 1, 671, NULL, 'Herzlich willkommen auf der Ice-App, schön dass du an Board bist!🤗\nImmer köstliche Eise für deinen Gaumen! 😋', '2025-10-18 15:09:17'),
(111, 1, 675, NULL, 'Herzlich Willkommen auf der Ice-App 🫶🏼😁\nSchön, dass du an Board bist und auf viele tolle Eis-Erlebnisse! 🍨', '2025-10-19 18:36:41'),
(112, 1, 581, NULL, 'Eisdiele Dietz, ein echter Klassiker in der Region!\nBtw: ich habe jetzt (E-Mail)-Benachrichtigungen eingeführt', '2025-10-22 12:38:04'),
(113, 2, 605, NULL, 'Ja Tatsache, weil die eine gebrochen war :D', '2025-10-22 13:46:06'),
(114, 2, 581, NULL, 'Sehr niceee', '2025-10-22 13:46:35'),
(115, 2, 679, NULL, 'Ist doch auch eine solide Waffel?! :D', '2025-10-22 13:47:27'),
(116, 1, 679, NULL, 'Für jemanden der auf pappige Waffeln steht schon :P\n\nAber kannst ja gerne auch mal testen die Eisdiele lohnt sich auf jeden Fall!\nAber Achtung ab Sonntag geht sie erstmal in die Saisonpause.', '2025-10-22 13:53:24'),
(118, 1, 682, NULL, 'Oh du findest auch immer noch neue Eisdielen in der Umgebung. 👌🏼\nUnd das Eis sieht echt mega aus 😍 \nschon mehr ein Eisbecher als nur eine Kugel 😀', '2025-10-22 16:43:55'),
(119, 8, 682, NULL, '2 Kugeln mit Sahne ohne Schnick-Schnack \n\nHabe gefragt die machen das Eis nicht selbst aber haben einen Lieferanten der das Handwerk in Italien gelernt hat.', '2025-10-22 19:27:00'),
(120, 1, 682, NULL, 'Sogar noch Recherche Arbeit geleistet 👌🏼\nIch glaube ein guter Lieferant ist durchaus akzeptabel, wenn er sein Handwerk beherrscht und es schmeckt 😀', '2025-10-22 20:07:36'),
(121, 1, 685, NULL, 'Man muss auch mal das innere Kind mit Schlumpf Eis befriedigen 😁', '2025-10-25 06:55:45'),
(122, 1, 691, NULL, 'Hey, ich hab mal deinen und Yannicks Checkin zusammen geführt -> Die Team-Checkin Funktion genutzt :D\n\nLiebe Grüße und einen schönen Urlaub!\n\nPS: Die Verkäuferin sieht ja wirklich maximal genervt / gelangweilt aus! 😂😂', '2025-10-27 20:30:06'),
(123, 1, 690, NULL, 'Genießt den Urlaub und das leckere Eis! 👌', '2025-10-27 20:30:38'),
(124, 1, 688, NULL, 'Hey, Glückwunsch zu deinem ersten Checkin! 🥳', '2025-10-28 06:51:38'),
(125, 31, 690, NULL, 'Danke schön :)', '2025-10-28 16:27:32'),
(126, 1, 693, NULL, 'Sieht schon sehr nice aus das Eis! 😋😁', '2025-10-29 16:14:41'),
(127, 52, 691, NULL, 'Danke!😊', '2025-10-30 09:21:04'),
(128, 1, 694, NULL, 'Hey, wenn ihr wollt könnt ihr jetzt auch im Nachgang eure Check-ins miteinander verknüpfen.\nEinfach Checkin bearbeiten und dort den anderen Nutzern einladen. Der erhält dann eine Benachrichtigung über die er den bestehenden Check-in verknüpfen kann :)', '2025-10-30 21:30:48'),
(129, 1, 703, NULL, 'Ahh sehr geil, 3 Eis und ne Komoot Route erstellt!\nDas ist der Spirit den ich mir für die Ice-App wünsche 😍😎', '2025-11-01 21:52:10'),
(130, 53, 703, NULL, 'Saisonstart muss gefeiert werden mit der Eisrunde in kurz/kurz', '2025-11-01 22:10:05');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`),
  ADD KEY `nutzer_id` (`nutzer_id`),
  ADD KEY `bewertung_id` (`bewertung_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `kommentare`
--
ALTER TABLE `kommentare`
  ADD CONSTRAINT `kommentare_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kommentare_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kommentare_ibfk_3` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
