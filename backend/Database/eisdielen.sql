-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 23. Mai 2025 um 11:16
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
-- Tabellenstruktur für Tabelle `eisdielen`
--

CREATE TABLE `eisdielen` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `latitude` float(9,6) DEFAULT NULL,
  `longitude` float(9,6) DEFAULT NULL,
  `openingHours` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  `landkreis_id` int DEFAULT NULL,
  `bundesland_id` int DEFAULT NULL,
  `land_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `eisdielen`
--

INSERT INTO `eisdielen` (`id`, `name`, `adresse`, `website`, `latitude`, `longitude`, `openingHours`, `erstellt_am`, `user_id`, `landkreis_id`, `bundesland_id`, `land_id`) VALUES
(1, 'Eiscafé Eis-Zapfen', 'Uhlichstraße 18, 09112 Chemnitz', 'https://maps.app.goo.gl/ZvMkoFKxjhSS8urs7', 50.837021, 12.904737, 'Mo-Fr: 12-17 Uhr\nSa-So: 13-17 Uhr', '2025-03-14 05:53:53', 1, 6, 3, 1),
(2, 'Eiscafé Kohlebunker', 'Ulmenstraße 1, 09112 Chemnitz', '', 50.824928, 12.899595, 'Do-Sa: 13-17 Uhr\nSo: 12-17 Uhr', '2025-03-14 05:53:53', 1, 6, 3, 1),
(3, 'Duschek Rainer Eiscafé', 'Markt 11, 09328 Lunzenau', '', 50.961952, 12.756064, '', '2025-03-14 05:53:53', 1, 4, 3, 1),
(4, 'Softeis Homann', 'Franz-Mehring-Straße 4,04746 Hartha', '', 51.093884, 12.974721, 'bei schönem Wetter ab 12 Uhr', '2025-03-14 05:53:53', 1, 4, 3, 1),
(5, 'Rüllis Eismanufaktur', 'Limbacher Str. 212, 09116 Chemnitz', 'https://ruellis-eismanufaktur.de/', 50.833000, 12.874314, 'Mo-So: 13-17 Uhr', '2025-03-14 06:39:23', 1, 6, 3, 1),
(6, 'Bäckerei Förster', 'Siemensstraße 8, 08371 Glauchau', '', 50.836006, 12.519606, 'Mo-Sa: 06-17 Uhr\nSo: 13-17 Uhr', '2025-03-14 06:39:23', 1, 5, 3, 1),
(7, 'Bistro & Eiscafe Zur Mel', 'Schulstraße 5, 08309 Eibenstock', '', 50.496216, 12.596914, 'Di-So: 11-17 Uhr', '2025-03-14 06:41:51', 1, 3, 3, 1),
(8, 'Bravo Eiscafe & Bistro - Vollmershain', 'Dorfstraße 70, 04626 Vollmershain', '', 50.851028, 12.306548, 'Di-Fr: 14-22 Uhr\nSa: 13-21 Uhr\nSo: 12-19 Uhr', '2025-03-14 06:41:51', 1, 7, 1, 1),
(9, 'Eisdiele Dietz', 'Hauptstraße 6, 09355 Gersdorf', '', 50.780605, 12.699031, 'Mi-So: 13-18 Uhr', '2025-03-14 06:41:51', 1, 5, 3, 1),
(10, 'BELLA CIAO', 'Altmarkt 17, 09337 Hohenstein-Ernstthal', '', 50.802425, 12.708078, 'Mo-So: 12-20 Uhr', '2025-03-14 06:41:51', 1, 5, 3, 1),
(11, 'Corina Heil Eiscafé Fantasy', 'Altmarkt 32, 09337 Hohenstein-Ernstthal', '', 50.802147, 12.706420, 'Di: 12:30-18 Uhr\nMi: 11-18 Uhr\nDo-So: 12:30-18 Uhr', '2025-03-14 06:41:51', 1, 5, 3, 1),
(12, 'Hübschmanns Eislädl', 'Alte Marienberger Str. 2, 09432 Großolbersdorf', '', 50.724041, 13.092184, 'Sa-So: 14-18 Uhr', '2025-03-14 06:44:00', 1, 3, 3, 1),
(13, 'Eiscafé Börner', 'Lange Str. 22, 09569 Oederan', '', 50.859116, 13.167559, 'Mo-So: 13-18 Uhr', '2025-03-14 06:44:00', 1, 4, 3, 1),
(14, 'Eis-Cafe Bartsch', 'Annaberger Str. 15, 09477 Jöhstadt', 'https://maps.app.goo.gl/xzLCmUn5x7cdCvw19', 50.514870, 13.088929, 'Do-Di: 13-21 Uhr', '2025-03-14 06:44:00', 1, 3, 3, 1),
(16, 'Dolce Vita In Galerie Roter Turm Chemnitz', 'Peschelstraße 33, 01139 Chemnitz', '', 50.833866, 12.920806, 'Mo-Sa: 09-20 Uhr\nSo: 12-18:30 Uhr', '2025-03-15 05:03:39', 1, 6, 3, 1),
(17, 'Cortina', 'Str. der Nationen 12, 09111 Chemnitz', '', 50.834316, 12.923563, 'Mo-Do: 09-21:30\nFr-Sa: 09-22 Uhr\nSo: 10-20:30 Uhr', '2025-03-15 05:03:39', 1, 6, 3, 1),
(18, 'Hof 19', 'Hauptstraße 19, 07580 Braunichswalde', '', 50.799004, 12.218826, 'Sa-So: 13-18 Uhr', '2025-03-16 09:50:55', 1, 8, 1, 1),
(19, 'Restaurant Pelzmühle', 'Pelzmühlenstraße 17, 09117 Chemnitz', '', 50.818760, 12.831811, 'So-Do: 11-22 Uhr; Fr-Sa: 11-23 Uhr', '2025-03-16 10:29:31', 1, 6, 3, 1),
(20, 'Ackermanns Eiscafé', 'Hofer Str. 29, 09224 Chemnitz', '', 50.799519, 12.799654, 'Di-So: 14-18 Uhr', '2025-03-16 10:30:18', 1, 6, 3, 1),
(21, 'Eiscafé kleine Verführung', 'B169 4, 09387 Jahnsdorf/Erzgeb', '', 50.762424, 12.837190, 'Mo-So: 14-18 Uhr', '2025-03-16 16:20:35', 1, 3, 3, 1),
(22, 'Eiscafé Elisenhof', 'Kohrener Markt 134, 04655 Frohburg', '', 51.018433, 12.604663, 'Ab 01. April:;Di-So: 13-18 Uhr', '2025-03-17 06:47:49', 1, 9, 3, 1),
(23, 'Albrecht Eis', 'Heynitzer Str. 56, 01683 Nossen', 'www.albrecht-eis.de', 51.090504, 13.376638, 'Mi-So: 13-18 Uhr', '2025-03-17 07:03:10', 1, 10, 3, 1),
(24, 'Torteneck', 'Bahnhofstraße 9, 09526 Olbernhau', '', 50.659409, 13.335841, 'Di-Sa: 10-17 Uhr; So: 12-17 Uhr', '2025-03-17 07:03:10', 1, 3, 3, 1),
(26, 'Dolce Freddo Meerane', 'Untere Mühlgasse 18, 08393 Meerane', '', 50.850899, 12.463176, 'Di-Do: 11:00–20:30 Uhr; Fr-Sa: 11:00–21:30 Uhr; So: 11:00–20:30 Uhr', '2025-03-18 19:16:33', 1, 5, 3, 1),
(28, '\'n Eis zapfen', 'Schloßstraße, 09669 Frankenberg/Sa.', 'https://neiszapfen.de/neis-frankenberg/', 50.913357, 13.032811, 'Di-Fr: 13-18 Uhr;Sa-So: 13-17 Uhr', '2025-03-19 10:49:04', 1, 4, 3, 1),
(29, 'Eis-Traum Speiseeis und Eisspezialitäten', 'Geyersche Str. 3, 09419 Thum', 'https://www.eis-traum.de/', 50.665054, 12.927232, 'Mo-Fr: 12-17 Uhr; Sa: 13:30-17 Uhr', '2025-03-20 07:33:02', 1, 3, 3, 1),
(30, 'Arndt’s Softeis Café', 'Pappelweg 1, 08340 Schwarzenberg/Erzgebirge', '', 50.533176, 12.772385, 'Mi-So: 14-17:30 Uhr', '2025-03-20 07:36:56', 1, 3, 3, 1),
(31, 'Eiscafé Döge', 'August-Bebel-Straße 1, 04567 Kitzscher', '', 51.164234, 12.551695, 'Mi-Fr: 14-17:30 Uhr; Sa-So: 14-18 Uhr', '2025-03-20 07:56:16', 1, 9, 3, 1),
(32, 'Café Milchhäuschen', 'Schloßteichstraße 20, 09113 Chemnitz', '', 50.842377, 12.912816, 'Mo-Do: 11:30-17 Uhr; Fr: 11:30-21:30 Uhr; Sa-So: 11-18 Uhr', '2025-03-21 05:33:04', 1, 6, 3, 1),
(33, 'Gondelstation am Schlossteich', 'Promenadenstraße 5Z, 09111 Chemnitz', '', 50.840908, 12.915353, 'Mo-Do: 12-18 Uhr; Fr: 12-19 Uhr; Sa-So: 10-19 Uhr', '2025-03-21 05:33:04', 1, 6, 3, 1),
(34, 'Gelato Valentino', 'Markt 1, 09111 Chemnitz', '', 50.832691, 12.919590, 'Mo-Sa: 10-18 Uhr; So: 12-18 Uhr', '2025-03-21 05:55:34', 1, 6, 3, 1),
(35, 'Ferioli Gelato Chemnitz', 'Am Rathaus 1, 09111 Chemnitz', '', 50.832527, 12.920319, 'Mo-So: 9-21 Uhr', '2025-03-21 05:55:34', 1, 6, 3, 1),
(36, 'Emmas Onkel', 'Weststraße 67, Ulmenstraße 48, 09112 Chemnitz', 'http://www.emmas-onkel.com/', 50.831436, 12.897780, 'Di-Mi: 14-21 Uhr; Do: 14-22 Uhr; Fr-Sa: 14-23 Uhr; So: 10-20 Uhr', '2025-03-21 12:06:11', 1, 6, 3, 1),
(37, 'Friedel\'s Cafe', 'Niedermarkt 9, 04736 Waldheim', '', 51.073997, 13.024919, 'Mo-Di: 10-20 Uhr; Fr-So: 10-20 Uhr', '2025-03-23 17:45:22', 1, 4, 3, 1),
(38, 'La Bonta', 'Kirchgasse 1, 09306 Rochlitz', '', 51.045940, 12.802377, 'Mo: 11-21 Uhr; Mi-So: 11-21 Uhr', '2025-03-23 17:45:22', 1, 4, 3, 1),
(39, 'Café EISMAIK', 'Brückenstraße 24, 09322 Penig', '', 50.933479, 12.705230, 'Di-Do: 13-18 Uhr; Sa-So: 13-18 Uhr', '2025-03-23 17:45:22', 1, 4, 3, 1),
(40, 'Eiscafé Venezia', 'Markt 9, 04680 Colditz', '', 51.129055, 12.805317, 'Mo-Do: 10-18 Uhr; Sa-So: 11-18 Uhr', '2025-03-24 06:33:51', 1, 9, 3, 1),
(42, 'Eiscafe Piccolo Dolce', 'Str. d. Freundschaft 33, 04654 Frohburg', 'https://maps.app.goo.gl/C2dvK9yKkS8JTNMp9', 51.054962, 12.555676, 'Mo-So: 10-19 Uhr', '2025-03-24 12:13:13', 1, 9, 3, 1),
(43, 'Ristorante Amore Mio', 'Schloßberg 1, 09113 Chemnitz', '', 50.845139, 12.916579, 'Di-So: 12-23 Uhr', '2025-03-24 17:21:28', 1, 6, 3, 1),
(44, 'SPEISEKAMMER Chemnitz', 'Schloßberg 14, 09111 Chemnitz', '', 50.845486, 12.916230, 'Montag: Ruhetag;bei schönem Wetter ab 14 Uhr', '2025-03-24 17:21:28', 1, 6, 3, 1),
(45, 'Eiscafe Leonhardt', 'Eibenstocker Str. 52, 08349 Johanngeorgenstadt', '', 50.432774, 12.713272, 'Mo-Di: 11-18 Uhr;Fr-Sa: 11-18 Uhr;So: 13-18 Uhr', '2025-03-24 18:17:14', 1, 3, 3, 1),
(46, 'Eiscafe Eiswürfel', 'Talstraße 45, 08344 Grünhain-Beierfeld', '', 50.562202, 12.831186, 'Mi-Fr: 13-18 Uhr;Sa-So: 13-18 Uhr', '2025-03-25 10:10:42', 1, 3, 3, 1),
(47, 'Eiskaffee Glösa', 'Slevogtstraße 43, 09114 Chemnitz', '', 50.883839, 12.943079, 'Fr-So: 11-18 Uhr', '2025-03-25 20:51:02', 1, 6, 3, 1),
(49, 'Eiscafé Venezia', 'Markt 19, 09648 Mittweida', '', 50.985241, 12.981489, 'Di-Sa: 10-18 Uhr;So: 13-18 Uhr', '2025-03-26 18:55:34', 1, 4, 3, 1),
(50, 'Café Zur Eiszeit', 'Wendischbora 61a, 01683 Nossen', 'https://www.cafe-zur-eiszeit.de/', 51.080006, 13.340350, 'Mi - So & Feiertage: 13-18 Uhr', '2025-03-27 07:40:30', 1, 10, 3, 1),
(51, 'Dolce Freddo Zwickau', 'Hauptmarkt 16, 08056 Zwickau', 'https://www.dolce-freddo.com/', 50.717957, 12.497235, 'Di-Do: 9:30-19 Uhr;Fr-Sa: 9:30-20 Uhr;So: 9:30-19 Uhr', '2025-03-27 07:45:18', 1, 5, 3, 1),
(52, 'Die Eismühle', 'Flöhatalstraße 2, 09579 Grünhainichen', '', 50.760609, 13.171333, 'So: 13-17 Uhr', '2025-03-27 07:56:43', 1, 3, 3, 1),
(53, 'Eis Specht', 'Gahlenzer Str. 48, 09569 Oederan', '', 50.828667, 13.216462, 'Ab 01. Mai:;Sa: 14-18 Uhr;So: 13-18 Uhr', '2025-03-27 07:58:11', 1, 4, 3, 1),
(54, 'Piccolino - Eis- & Grillbar', 'Marienberger Str. 29B, 09573 Augustusburg', '', 50.809246, 13.100998, 'Mo-So: 11-17 Uhr', '2025-03-28 08:35:34', 1, 4, 3, 1),
(55, 'Konditorei & Panoramacafé Schreier', 'Hohe Str. 13, 09573 Augustusburg', '', 50.813721, 13.101641, 'Mo-Sa: 6:30-17 Uhr;So: 13-17 Uhr', '2025-03-28 17:04:49', 1, 4, 3, 1),
(56, 'Schloss-Café Ponitz', 'Schlosshof 3, 04639 Ponitz', 'https://maps.app.goo.gl/CJk6kEaYisexNiMA7', 50.856808, 12.423168, 'Di-So: 13:30-17:30 Uhr\r\n', '2025-03-29 05:46:42', 1, 7, 1, 1),
(57, 'Eisfabrik Gößnitz', 'Markt 15, 04639 Gößnitz', '', 50.888275, 12.433415, 'Mi-So: 14-18 Uhr', '2025-03-29 18:23:02', 1, 7, 1, 1),
(58, 'Waldcafé Göhren', 'Göhren 1D, 09306 Wechselburg', '', 50.980434, 12.763076, 'März-Dezember:;Di-Sa: 14-17 Uhr;So: 11-17 Uhr', '2025-03-30 10:49:29', 1, 4, 3, 1),
(59, 'Eis-Eck', 'Bahnhofstraße 11, 09577 Niederwiesa', '', 50.865376, 13.021731, 'Mo-Fr: 12-18 Uhr; Sa: 13-18 Uhr', '2025-04-03 05:00:53', 1, 4, 3, 1),
(60, 'Gelato Italiano', 'Johannispl. 3, 09212 Limbach-Oberfrohna', '', 50.858650, 12.760948, 'Mo-Fr: 9-19 Uhr; Sa-So: 13-19 Uhr', '2025-04-03 05:03:56', 1, 5, 3, 1),
(61, 'Jannys Eis', 'Pflockenstraße 28, 09376 Oelsnitz/Erzgebirge', '', 50.724373, 12.728905, 'Di-Fr: 13-18 Uhr; Sa-So: 12-18 Uhr', '2025-04-03 05:08:21', 1, 3, 3, 1),
(62, 'Eiscafé Cortina Zwönitz', 'Annaberger Str. 2, 08297 Zwönitz', '', 50.629707, 12.813651, 'Mo-So: 9:30-20 Uhr', '2025-04-03 05:10:35', 1, 3, 3, 1),
(63, 'Café Milchbubi', 'Lange G. 20, 08297 Zwönitz', '', 50.630199, 12.810021, 'Di-Do: 13-18 Uhr; Fr-So: 13-19 Uhr', '2025-04-04 04:58:21', 1, 3, 3, 1),
(64, 'Marschner\'s Eisdiele', 'Chemnitzer Str. 1, 09380 Thalheim/Erzgeb.', '', 50.703686, 12.852109, '', '2025-04-04 05:02:29', 1, 3, 3, 1),
(65, 'Eiscafé zum Römer', 'Hauptstraße 29, 08412 Werdau', '', 50.714363, 12.387291, 'So: 13-17 Uhr', '2025-04-05 11:15:53', 1, 5, 3, 1),
(66, 'Hofcafe Päßler', 'Schulstraße 1, 08427 Fraureuth', '', 50.681396, 12.365823, 'Mo-Do: 14-18 Uhr; Sa-So: 14-18 Uhr', '2025-04-05 11:20:34', 1, 5, 3, 1),
(67, 'Jannys Eis', 'Herrengasse 14, 08451 Crimmitschau', '', 50.815258, 12.386800, 'Mo-Sa: 11-18 Uhr; So: 14-18 Uhr', '2025-04-05 16:37:11', 1, 5, 3, 1),
(68, 'Eiscafé Fraureuth', 'Hauptstraße 78, 08427 Fraureuth', '', 50.703167, 12.355584, 'Mi-Fr: 13-17 Uhr; Sa: 13-17:30 Uhr; So: 13-18 Uhr', '2025-04-05 16:42:27', 1, 5, 3, 1),
(69, 'lumipöllö lounge', 'Bahnhofstraße 45, 09435 Drebach', '', 50.702709, 13.056519, 'Fr-So: 12-23 Uhr', '2025-04-05 16:49:16', 1, 3, 3, 1),
(70, 'Erzgebirgische Landbäckerei GmbH burgBlick Café & Eis', 'Wolkensteiner Str. 1 G, 09429 Wolkenstein', '', 50.652985, 13.061177, 'Mo-So: 7-17 Uhr', '2025-04-05 16:52:35', 1, 3, 3, 1),
(71, 'SchillerGarten', 'Schillerpl. 8, 01309 Dresden', '', 51.052387, 13.808243, ' ', '2025-04-05 16:57:20', 1, 11, 3, 1),
(72, 'Eis Venezia Manufaktur', 'Markt 26, 08289 Schneeberg', '', 50.595070, 12.640969, 'Di-So: 11-20 Uhr', '2025-04-05 18:47:03', 1, 3, 3, 1),
(73, 'Cafe Naschkatze', 'Bahnhofstraße 1, 09661 Hainichen', '', 50.971966, 13.122789, 'Do-Sa: 13-17 Uhr', '2025-04-06 18:47:48', 1, 4, 3, 1),
(74, 'Cafe Flora', 'Hauptstraße 87, 09619 Mulda/Sachsen', '', 50.809078, 13.407659, 'Di-Do: 11:30 - 17 Uhr; Fr-So: 11:30 - 21 Uhr', '2025-04-06 18:51:45', 1, 4, 3, 1),
(75, 'Softeisautomat Garnsdorf', 'Garnsdorfer Hauptstraße 116, 09244 Lichtenau', '', 50.921780, 12.928367, 'Mo-So: 9:30-20 Uhr', '2025-04-09 04:49:58', 1, 4, 3, 1),
(76, 'Herzens-Schmiede e.V. – AusZeit-Oase', 'Zwönitztalstraße 32, 09380 Thalheim/Erzgeb.', '', 50.686947, 12.843474, 'Mi-Fr: 14:30-17:30 Uhr', '2025-04-09 04:51:58', 1, 3, 3, 1),
(77, 'Silvio der Eisgraf von Freiberg', 'Burgstraße 46, 09599 Freiberg', '', 50.919468, 13.341347, ' Di-So: 11-19 Uhr', '2025-04-09 05:51:43', 1, 4, 3, 1),
(81, 'Eiscafé Ys', 'Richard-Friedrich-Straße 18, 08280 Aue-Bad Schlema', '', 50.599815, 12.662221, 'Di-Fr: 11-18 Uhr;Sa-So: 12-18 Uhr', '2025-04-09 07:21:56', 1, 3, 3, 1),
(82, 'Eiscafé Ys', 'Fürstenpl. 8, 08289 Schneeberg', '', 50.596218, 12.640791, 'Mo-So: 12-18 Uhr', '2025-04-09 07:25:26', 1, 3, 3, 1),
(83, 'Eiscafé Cantina', 'Altmarkt 11, 08280 Aue-Bad Schlema', '', 50.586224, 12.703076, 'Mo-So: 11-19 Uhr', '2025-04-09 08:29:30', 1, 3, 3, 1),
(84, 'Gelato Caffe by Giuseppe', 'Bahnhofstraße 17, 08340 Schwarzenberg/Erzgebirge', '', 50.542366, 12.787571, 'Mo-So: 10:30 - 20 Uhr', '2025-04-09 08:31:44', 1, 3, 3, 1),
(85, 'Eiscafé Cortina', 'Buchholzer Str. 11, 09456 Annaberg-Buchholz', '', 50.578850, 13.002192, 'Mo-So: 10-21:30 Uhr', '2025-04-09 08:38:34', 1, 3, 3, 1),
(86, 'Eis-Cafe Rositz', 'Karl-Marx-Straße 14, 04617 Rositz', '', 51.016502, 12.370026, 'Di-Sa: 13-18 Uhr; So: 11-18 Uhr', '2025-04-09 12:23:08', 1, 7, 1, 1),
(87, 'Eiscafé Hoppe', 'Limbacher Str. 41, 09243 Niederfrohna', '', 50.874172, 12.748813, 'Di-So: 13-18 Uhr', '2025-04-10 09:13:18', 1, 5, 3, 1),
(88, 'Bäckerei-Käferstein', 'Rosa-Luxemburg-Straße 3, 09241 Mühlau', '', 50.896767, 12.758780, 'Mo, Mi: 6-12 Uhr; Di, Do, Fr: 6-17 Uhr; Sa: 5-10:30 Uhr', '2025-04-10 09:15:28', 1, 4, 3, 1),
(89, 'Pieschels Eisdiele', 'Pfarrstraße 9, 08233 Treuen', '', 50.539742, 12.308750, 'Mo-So: 13-18 Uhr', '2025-04-11 07:27:22', 1, 12, 3, 1),
(92, 'Saneto', 'Stollberger Str. 31, 09221 Neukirchen/Erzgebirge', 'https://saneto.de/', 50.775143, 12.857387, 'Mo-So: 14-17 Uhr', '2025-04-11 09:58:48', 1, 3, 3, 1),
(93, 'Eiscafé Amore', 'Bäckerstraße 3, 04720 Döbeln', '', 51.121494, 13.119929, 'Mo-So: 9-18 Uhr', '2025-04-11 10:05:39', 1, 4, 3, 1),
(97, 'Bäckerei & Cafe Brückner', 'Auer Str. 30, 08344 Grünhain-Beierfeld', '', 50.579590, 12.805849, 'Mo-Fr: 5:30-18 Uhr, Sa: 5:30 - 11 Uhr', '2025-04-12 09:08:42', 1, 3, 3, 1),
(98, 'Eisbär Planitz', 'Äußere Zwickauer Str. 46, 08064 Zwickau', '', 50.681068, 12.474918, 'Di-So: 13-18 Uhr', '2025-04-12 15:50:13', 1, 5, 3, 1),
(99, 'Frollein Sommer', 'Bernsdorfer Str. 57, 09126 Chemnitz', 'https://maps.app.goo.gl/Wez6pdY7A4YMybux8', 50.819443, 12.936491, 'Bei schönem Wetter;Mo-Sa: 13-18 Uhr;So: 12-18 Uhr', '2025-04-13 06:45:44', 1, 6, 3, 1),
(100, 'Vila Hermes Café do Brasil', 'Kaufunger Str. 4a, 09212 Limbach-Oberfrohna', '', 50.900608, 12.668810, 'Mi-So: 10-17 Uhr', '2025-04-13 11:35:47', 1, 5, 3, 1),
(101, 'Albrecht Eiseck', 'Dresdner Str. 54, 01683 Nossen', 'https://maps.app.goo.gl/CjYxf3mzD4iuRAQh8', 51.057991, 13.305590, ' Mo-So: 12-17 Uhr', '2025-04-13 13:42:29', 1, 10, 3, 1),
(102, 'Landbäckerei Dietrich - Schloss Café Rochlitz', 'Markt 4, 09306 Rochlitz', '', 51.045963, 12.799110, 'Di-Sa: 10-17 Uhr;So: 13-17 Uhr', '2025-04-15 08:50:30', 1, 4, 3, 1),
(103, 'Eiscafé Kampanile', 'Sonnenweg 1, 08132 Mülsen', '', 50.767017, 12.548699, 'Fr-So: 14-18 Uhr', '2025-04-15 19:31:19', 1, 5, 3, 1),
(104, 'Eiscafé Monika Nestler', 'Ratsseite-Dorfstr. 100, 09496 Marienberg', '', 50.633167, 13.210966, 'Mo-Do & Sa-So: 14-18 Uhr', '2025-04-15 19:41:05', 1, 3, 3, 1),
(105, 'Café Eisbär', 'Zschopauer Str. 26, 09496 Marienberg', '', 50.652615, 13.161110, 'Mo-So: 14-17 Uhr', '2025-04-15 19:41:57', 1, 3, 3, 1),
(106, 'Eismanufaktur Lipp', 'Kleine Kirchgasse 57, 09456 Annaberg-Buchholz', 'http://eismanufaktur-lipp.de/', 50.578262, 13.007279, 'Mi-So: 13-18 Uhr', '2025-04-15 19:45:26', 1, 3, 3, 1),
(107, 'Sperlich\'s \"EISZEIT\"', 'Giebelstraße 2, 03222 Lübbenau/Spreewald', '', 51.861938, 13.938499, 'So-Fr: 14-18 Uhr ', '2025-04-21 05:23:30', 1, 16, 5, 1),
(109, 'Eiscafé Sothis', 'Str. d. Einheit 20, 09569 Flöha', '', 50.853367, 13.113309, 'derzeit geschlossen', '2025-04-21 14:48:28', 1, 4, 3, 1),
(111, 'Klatt-Eis Eismanufaktur', 'Mittweidaer Str. 102, 09648 Mittweida', '', 51.000374, 12.899914, 'So: 13-18 Uhr', '2025-04-21 15:04:29', 1, 4, 3, 1),
(112, 'Eis-Pinguin', 'Puschkinstraße 4, 09112 Chemnitz', 'https://www.eisice-pinguin.de', 50.830437, 12.900225, 'Coming soon', '2025-04-21 15:08:49', 1, 6, 3, 1),
(113, 'Eiscafé Caramello', 'Bahnhofstraße 2, 04651 Bad Lausick', '', 51.143497, 12.648633, 'Mo-So: 11-18 Uhr', '2025-04-22 05:43:44', 1, 9, 3, 1),
(114, ' Eisdiele Krause', 'Markt 2, 09306 Wechselburg', '', 51.004692, 12.773902, '', '2025-04-22 08:34:25', 1, 4, 3, 1),
(115, 'Eisgarten an der Kaßbergauffahrt', 'Theaterstraße 60, 09111 Chemnitz', '', 50.833527, 12.915260, 'Mo-So 12-18 Uhr', '2025-04-22 11:09:10', 3, 6, 3, 1),
(116, 'Eiscafé Im Ratshof', 'Markt 1, 08371 Glauchau', '', 50.817062, 12.541419, 'Mo, Di, Do: 11:30-18 Uhr; Mi: 10-18 Uhr; Fr-So: 14-18 Uhr', '2025-04-24 06:21:54', 1, 5, 3, 1),
(117, 'Eiscafé Eis-Zapfen', 'Arthur-Bretschneider-Straße 13, 09113 Chemnitz', '', 50.844517, 12.901866, 'Mo-So: 13-18 Uhr', '2025-04-24 16:07:08', 1, 6, 3, 1),
(118, 'Eiscafé Sansi', 'Dammstraße 9, 03222 Lübbenau/Spreewald', NULL, 51.866680, 13.972628, 'Mo-So: 10:30-19 Uhr', '2025-04-26 00:10:32', 1, 16, 5, 1),
(119, 'Gelateria & Bistro Valmantone', 'Dammstraße 6, 03222 Lübbenau/Spreewald', NULL, 51.867027, 13.972271, 'Mo-So: 10-18 Uhr', '2025-04-26 00:13:26', 1, 16, 5, 1),
(120, 'Eisdiele \"Zur Buxbaude\"', 'Augustusburger Str. 240, 09127 Chemnitz', NULL, 50.829086, 12.960858, 'Mi-So: 13-17 Uhr', '2025-04-27 08:55:29', 1, 6, 3, 1),
(121, 'Bäckerei Ronny Roder', 'Am Kirchberg 6, 09244 Lichtenau', NULL, 50.900852, 12.917040, 'Sonntag: 13-17 Uhr ', '2025-04-27 12:10:10', 1, 4, 3, 1),
(122, 'Eiscafé Leuschner', 'Leisniger Str. 33, 09648 Mittweida', NULL, 50.991051, 12.968228, 'Mo, Do, Fr: 11:30-18 Uhr;Sa, So, Feiertage: 13-18 Uhr', '2025-04-27 14:40:32', 1, 4, 3, 1),
(123, 'Sommerrodelbahn \"Italienisches Eis\"', 'An der Rodelbahn 3, 09573 Augustusburg', NULL, 50.817879, 13.098708, 'bei schönem Wetter: 10-17 Uhr', '2025-04-27 15:31:05', 2, 4, 3, 1),
(124, 'Pizzeria Bella Italia', 'Mühlsteig 5, 09355 Gersdorf ', NULL, 50.781872, 12.698739, 'Montag: Ruhetag;\nDienstag-Donnerstag: 17:00-21:00 Uhr;\nFreitag-Samstag: 17:00-22:00 Uhr;\nFeiertags/Sonntag: 11:30-14:00 & 17:00- 20:00 Uhr', '2025-04-27 17:39:26', 4, 5, 3, 1),
(125, 'WALKBEACH', 'Hartensteiner Str. 3a 09366 Stollberg', NULL, 50.697372, 12.771628, 'Öffnungszeiten Saison 2025\n(17.04.25 - 19.10.25);\nDo-So: 11:30-18:00 Uhr;', '2025-04-27 19:11:41', 7, 3, 3, 1),
(126, 'Eiswerk', 'Marienstraße 70, 08056 Zwickau', 'http://www.eiswerkzwickau.de/', 50.720486, 12.495402, 'Mo-So: 12-18 Uhr', '2025-04-30 06:29:49', 1, 5, 3, 1),
(127, 'Philipps Eisdielerei', 'Grünthaler Str. 1, 09526 Olbernhau', NULL, 50.661037, 13.336630, 'Mo-Mi & Fr: 12-18 Uhr;So, Sa, So: 14-18 Uhr', '2025-04-30 23:37:08', 1, 3, 3, 1),
(128, 'Eiscafé di Lago', 'Großstolpen 100, 04539 Groitzsch', NULL, 51.142094, 12.326560, 'Mo-So: 14-18 Uhr', '2025-05-01 17:30:30', 10, 9, 3, 1),
(131, 'Trattoria Da Mert', 'Hauptmarkt 8, 08056 Zwickau', NULL, 50.717693, 12.495791, 'Mo-So: 11-22 Uhr', '2025-05-01 19:42:48', 1, 5, 3, 1),
(132, 'Alfredo Eiscafe', 'Dohnaische Straße 74, 01796 Pirna', NULL, 50.962826, 13.939511, '11:30-17:30 jeden Tag', '2025-05-02 04:49:15', 2, 17, 3, 1),
(133, 'Konzum Čáda', 'Boží Dar 189, 363 01 Boží Dar, Tschechien', NULL, 50.410511, 12.922996, 'Mo-So: 7:30-18 Uhr', '2025-05-02 10:26:23', 1, 18, 6, 2),
(134, 'Eibenstocker Waffelstube', 'Postpl. 1, 08309 Eibenstock', NULL, 50.493996, 12.599739, 'Mi-So: 13-17 Uhr', '2025-05-02 12:04:34', 1, 3, 3, 1),
(135, 'Reki Shop', 'Richard-Friedrich-Straße 18, 08280 Aue-Bad Schlema', NULL, 50.599983, 12.662392, '', '2025-05-02 12:56:43', 1, 3, 3, 1),
(136, 'Touristenhütte Tyssa Turistická chata Tisá', 'Tisá 257, 403 36 Tisá, Tschechien', NULL, 50.787819, 14.039744, '', '2025-05-03 11:29:43', 1, 19, 6, 2),
(137, 'Oskarshausen', 'Burgker Str. 39, 01705 Freital', NULL, 51.005135, 13.663627, 'Mo-So: 9-19 Uhr', '2025-05-05 07:02:39', 11, 17, 3, 1),
(139, 'Bäckerei Emil Reimann Eiscafé im Q3', 'An d. Frauenkirche 18, 01067 Dresden', NULL, 51.051510, 13.741971, 'Mo - So: 9-18 Uhr ', '2025-05-05 09:38:28', 5, 11, 3, 1),
(144, 'Pizzeria EisCaféBar „Dolomiti“', 'Rochlitzer Str. 20, 09648 Mittweida', NULL, 50.986160, 12.979220, 'täglich: 11-14 Uhr & 17:30-23 Uhr;Mittwoch: Ruhetag', '2025-05-05 12:00:30', 1, 4, 3, 1),
(145, 'Eisdiele & Partyservice Schöne', 'Rudolf-Breitscheid-Straße 6, 09577 Niederwiesa', 'http://www.eisdiele-lichtenwalde.de/', 50.885036, 13.007964, 'Di-Fr: 14-18 Uhr;Sa & So: 13-18 Uhr', '2025-05-06 10:54:45', 1, 4, 3, 1),
(146, 'Eiscafé & Restaurant - Martina Kodym', 'Jägerhorn 8, 09633 Halsbrücke', '', 50.973362, 13.460288, 'Do-So: 14-17 Uhr', '2025-05-06 11:01:57', 1, 4, 3, 1),
(147, 'Eisgarten-Sonnenschein (Lösermühle)', 'An d. Lösermühle 1, 09544 Neuhausen/Erzgebirge', 'https://loesermuehle.de/eiskarte/', 50.691113, 13.489707, 'Mi-So: 13-18 Uhr', '2025-05-06 11:07:22', 1, 4, 3, 1),
(149, 'Eis-Karli', 'Albert-Schweitzer-Straße 36, 08209 Auerbach/Vogtland', 'https://maps.app.goo.gl/e3m14MdHRxjbQCwb9', 50.512085, 12.385431, 'Mo-So: 13-17 Uhr', '2025-05-08 04:05:55', 1, 12, 3, 1),
(150, 'Eiscafé Roßberg', 'Zwickauer Str. 104, 08468 Reichenbach im Vogtland', 'https://maps.app.goo.gl/Jux29G113wzxWghc6', 50.629913, 12.308249, 'Di-Sa: 10-18 Uhr;So: 13-18 Uhr', '2025-05-08 06:55:38', 1, 12, 3, 1),
(151, 'Gelato Fatto Con Amore', 'Corso Magenta, 30, 20121 Milano MI, Italien', 'https://maps.app.goo.gl/WhDs4zHwC8jv4JEN9', 45.466072, 9.177474, 'Di-So: 12-22 Uhr', '2025-05-08 08:54:55', 1, 22, 8, 3),
(152, 'Venchi Cioccolato e Gelato', 'Via Giuseppe Mengoni, 1, 20121 Milano MI, Italien', 'https://it.venchi.com/', 45.465229, 9.188667, 'Mo-So: 10-22:30 Uhr', '2025-05-08 09:03:44', 1, 22, 8, 3),
(153, 'Eiscafé Silvio', 'Unterer Markt 4, 92681 Erbendorf', 'https://maps.app.goo.gl/KPoQzeJKXBjwXBBf9', 49.837658, 12.047334, 'Mo: 11-19 Uhr;Di: Ruhetag;Mi-So:11-19 Uhr', '2025-05-08 09:07:50', 1, 23, 7, 1),
(154, 'Amorino Gelato - Colmar', '54 Rue des Clefs, 68000 Colmar, Frankreich', 'https://maps.app.goo.gl/V4yu8cSVktvXmQdB7', 48.079197, 7.357572, 'Mo-Do: 12-19 Uhr; Fr-Sa: 12-21 Uhr; So: 12-19 Uhr', '2025-05-08 09:11:11', 1, 24, 9, 4),
(155, 'Justine au Pays des Glaces', '47 Av. Louis Tudesq, 34140 Bouzigues, Frankreich', 'https://justine-glaces.fr/', 43.448586, 3.655041, 'Mo-So: 14-18:30 Uhr', '2025-05-08 09:13:39', 1, 25, 10, 4),
(158, 'Eiscafé Diana', 'Regensburger Str. 86a, 92637 Weiden in der Oberpfalz', 'https://maps.app.goo.gl/2stZH7RGRpgjECFk6', 49.656540, 12.143935, 'Sa-So: 12-19 Uhr', '2025-05-08 10:36:02', 1, 28, 7, 1),
(161, 'Confiseur Bachmann AG - Gelateria am Quai', 'Kurpl., 6006 Luzern, Schweiz', 'http://www.confiserie.ch/gelateria-am-quai', 47.054562, 8.312192, 'Mo-Fr: 7:30-19:30 Uhr;Sa-So: 9-19:30 Uhr', '2025-05-09 10:57:50', 1, 29, 11, 5),
(162, 'Eis Wunderland', 'Max-Saupe-Straße 1, 09131 Chemnitz', 'https://maps.app.goo.gl/bqXQafyraE5JtQgQ7', 50.867744, 12.960678, 'Mo-Mi: 13-18 Uhr;\nSa-So: 13-18 Uhr', '2025-05-10 15:35:12', 11, 6, 3, 1),
(163, 'Ristorante pizzeria Piccolino', 'Hauptstraße 183, 09355 Gersdorf', 'https://piccolino-gersdorf.de/', 50.761101, 12.709423, 'Di-Sa: 17-22 Uhr;Sa & So: zusätzlich von 11:30 - 14 Uhr', '2025-05-14 14:04:04', 8, 5, 3, 1),
(165, 'Marschner\'s Eiscafé', 'Zwickauer Str. 424, 09117 Chemnitz', 'http://www.marschners-eiscafe.de/', 50.817329, 12.846802, 'Neueröffnung: 15.05.25 14:00 Uhr', '2025-05-15 11:38:43', 1, 6, 3, 1),
(166, 'Eiscafé Venezia', 'Obermarkt 6, 04736 Waldheim', 'https://maps.app.goo.gl/3VyxJk7R8mDoCdDL8', 51.072765, 13.024507, 'Mo - So: 10-19 Uhr', '2025-05-18 16:07:45', 1, 4, 3, 1),
(167, 'Brixx', 'Annaberger Str. 315, 09125 Chemnitz', 'https://maps.app.goo.gl/uG6hsFoA6ndy5uxY6', 50.795490, 12.921456, 'Mo - Sa: 11-18 Uhr', '2025-05-18 16:13:04', 1, 6, 3, 1),
(168, 'Jannys Eis', 'Neumarkt 15, 09405 Zschopau', 'https://www.facebook.com/profile.php?id=100063648308529#', 50.747807, 13.069595, 'ab 25.Mai:;Mo-Fr: 11-17 Uhr; Sa-So: 13-17 Uhr', '2025-05-18 16:17:46', 1, 3, 3, 1),
(170, 'Zeisigwaldschänke', 'Forststraße 100, 09131 Chemnitz', 'http://www.zeisigwaldschaenke.de/', 50.845589, 12.963314, 'Mo-So: 12-17 Uhr', '2025-05-21 11:27:45', 1, 6, 3, 1),
(171, 'Gran Gelato', 'Hauptmarkt 17-18, 08056 Zwickau', 'http://www.grangelato.de/', 50.717999, 12.497528, 'Mo-So: 10-19 Uhr', '2025-05-21 12:25:02', 1, 5, 3, 1),
(172, 'Imbiss der Bäckerei und Konditorei Seifert', 'Alte Flockenstraße 7, 09385 Lugau/Erzgeb.', '', 50.772354, 12.786156, 'Di - Fr: 5:00 - 17:00 Uhr;\nSa: 5:30 - 10:30 Uhr', '2025-05-23 07:58:57', 1, 3, 3, 1),
(173, 'Das Eiscafé Lichtenstein', 'Rosengasse 4, 09350 Lichtenstein/Sachsen', '', 50.756748, 12.630780, 'Sa & So: 13:30 - 17:30 Uhr', '2025-05-23 08:03:00', 1, 5, 3, 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`user_id`),
  ADD KEY `fk_eisdielen_landkreis` (`landkreis_id`),
  ADD KEY `fk_eisdielen_bundesland` (`bundesland_id`),
  ADD KEY `fk_land_id` (`land_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=174;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  ADD CONSTRAINT `fk_eisdielen_bundesland` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`),
  ADD CONSTRAINT `fk_eisdielen_landkreis` FOREIGN KEY (`landkreis_id`) REFERENCES `landkreise` (`id`),
  ADD CONSTRAINT `fk_land_id` FOREIGN KEY (`land_id`) REFERENCES `laender` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
