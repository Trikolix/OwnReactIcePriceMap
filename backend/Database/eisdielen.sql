-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 22. Apr 2025 um 12:24
-- Server-Version: 8.0.36-28
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
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` float(9,6) DEFAULT NULL,
  `longitude` float(9,6) DEFAULT NULL,
  `openingHours` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `komoot` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  `landkreis_id` int DEFAULT NULL,
  `bundesland_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `eisdielen`
--

INSERT INTO `eisdielen` (`id`, `name`, `adresse`, `latitude`, `longitude`, `openingHours`, `komoot`, `erstellt_am`, `user_id`, `landkreis_id`, `bundesland_id`) VALUES
(1, 'Eiscafé Eis-Zapfen', 'Uhlichstraße 18, 09112 Chemnitz', 50.837021, 12.904737, 'Mo-Fr: 12-17 Uhr; Sa-So: 13-17 Uhr', '', '2025-03-14 05:53:53', 1, 6, 3),
(2, 'Eiscafé Kohlebunker', 'Ulmenstraße 1, 09112 Chemnitz', 50.824928, 12.899595, 'Do-Sa: 13-17 Uhr; So: 12-17 Uhr', '', '2025-03-14 05:53:53', 1, 6, 3),
(3, 'Duschek Rainer Eiscafé', 'Markt 11, 09328 Lunzenau', 50.961952, 12.756064, '', '', '2025-03-14 05:53:53', 1, 4, 3),
(4, 'Softeis Homann', 'Franz-Mehring-Straße 4,04746 Hartha', 51.093884, 12.974721, 'bei schönem Wetter ab 12 Uhr', '', '2025-03-14 05:53:53', 1, 4, 3),
(5, 'Rüllis Eismanufaktur', 'Limbacher Str. 212, 09116 Chemnitz', 50.833000, 12.874314, 'Mo-So: 13-17 Uhr', '', '2025-03-14 06:39:23', 1, 6, 3),
(6, 'Bäckerei Förster', 'Siemensstraße 8, 08371 Glauchau', 50.836006, 12.519606, 'Mo-Sa: 06-17 Uhr; So: 13-17 Uhr', '', '2025-03-14 06:39:23', 1, 5, 3),
(7, 'Bistro & Eiscafe Zur Mel', 'Schulstraße 5, 08309 Eibenstock', 50.496216, 12.596914, 'Di-So: 11-17 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/766051588/embed?share_token=a0wppn9FtkukVMb4eIO1LH0uC3zs4nkuulEG5yYiADhc9g47xq\" width=\"100%\" height=\"150\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-14 06:41:51', 1, 3, 3),
(8, 'Bravo Eiscafe & Bistro - Vollmershain', 'Dorfstraße 70, 04626 Vollmershain', 50.851028, 12.306548, 'Di-Fr: 14-22 Uhr; Sa: 13-21 Uhr; So: 12-19 Uhr', '', '2025-03-14 06:41:51', 1, 7, 1),
(9, 'Eisdiele Dietz', 'Hauptstraße 6, 09355 Gersdorf', 50.780605, 12.699031, 'Mi-So: 13-18 Uhr', '', '2025-03-14 06:41:51', 1, 5, 3),
(10, 'BELLA CIAO', 'Altmarkt 17, 09337 Hohenstein-Ernstthal', 50.802425, 12.708078, 'Mo-So: 12-20 Uhr', '', '2025-03-14 06:41:51', 1, 5, 3),
(11, 'Corina Heil Eiscafé Fantasy', 'Altmarkt 32, 09337 Hohenstein-Ernstthal', 50.802147, 12.706420, 'Di: 12:30-18 Uhr; Mi: 11-18 Uhr; Do-So: 12:30-18 Uhr', '', '2025-03-14 06:41:51', 1, 5, 3),
(12, 'Hübschmanns Eislädl', 'Alte Marienberger Str. 2, 09432 Großolbersdorf', 50.724041, 13.092184, 'Sa-So: 14-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2095130840/embed?share_token=ap4vnyKtDa4kQ7cUIHWHjzRuQ4EE4wcnWfh4SX7SzDwcpGnhFF\" width=\"100%\" height=\"150\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-14 06:44:00', 1, 3, 3),
(13, 'Eiscafé Börner', 'Lange Str. 22, 09569 Oederan', 50.859116, 13.167559, 'Mo-So: 13-18 Uhr', '', '2025-03-14 06:44:00', 1, 4, 3),
(14, 'Eis-Cafe Bartsch', 'Annaberger Str. 15, 09477 Jöhstadt', 50.514870, 13.088929, 'Do-Di: 13-21 Uhr', '', '2025-03-14 06:44:00', 1, 3, 3),
(16, 'Dolce Vita In Galerie Roter Turm Chemnitz', 'Peschelstraße 33, 01139 Chemnitz', 50.833866, 12.920806, 'Mo-Sa: 09-20 Uhr; So: 12-18:30 Uhr', '', '2025-03-15 05:03:39', 1, 6, 3),
(17, 'Cortina', 'Str. der Nationen 12, 09111 Chemnitz', 50.834316, 12.923563, 'Mo-Do: 09-21:30; Fr-Sa: 09-22 Uhr; So: 10-20:30 Uhr', '', '2025-03-15 05:03:39', 1, 6, 3),
(18, 'Hof 19', 'Hauptstraße 19, 07580 Braunichswalde', 50.799004, 12.218826, 'Sa-So: 13-18 Uhr', '', '2025-03-16 09:50:55', 1, 8, 1),
(19, 'Restaurant Pelzmühle', 'Pelzmühlenstraße 17, 09117 Chemnitz', 50.818760, 12.831811, 'So-Do: 11-22 Uhr; Fr-Sa: 11-23 Uhr', '', '2025-03-16 10:29:31', 1, 6, 3),
(20, 'Ackermanns Eiscafé', 'Hofer Str. 29, 09224 Chemnitz', 50.799519, 12.799654, 'Di-So: 14-18 Uhr', '', '2025-03-16 10:30:18', 1, 6, 3),
(21, 'Eiscafé kleine Verführung', 'B169 4, 09387 Jahnsdorf/Erzgeb', 50.762424, 12.837190, 'Mo-So: 14-18 Uhr', '', '2025-03-16 16:20:35', 1, 3, 3),
(22, 'Eiscafé Elisenhof', 'Kohrener Markt 134, 04655 Frohburg', 51.018433, 12.604663, 'Ab 01. April:;Di-So: 13-18 Uhr', '', '2025-03-17 06:47:49', 1, 9, 3),
(23, 'Albrecht Eis', 'Heynitzer Str. 56, 01683 Nossen', 51.090504, 13.376638, 'Mi-So: 13-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2102873500/embed?share_token=aO8lZ2QKczabkrOMLS3saC2EFtrjB3nq5AGk9bFQx3EXZtVrBo\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-17 07:03:10', 1, 10, 3),
(24, 'Torteneck', 'Bahnhofstraße 9, 09526 Olbernhau', 50.659409, 13.335841, 'Di-Sa: 10-17 Uhr; So: 12-17 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2105973916/embed?share_token=aaPFk4zNdiuVWi0ZnbkJWSoLFS7NSN5CbtGIlU53lvLlZlAKxr\" width=\"100%\" height=\"150\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-17 07:03:10', 1, 3, 3),
(26, 'Dolce Freddo Meerane', 'Untere Mühlgasse 18, 08393 Meerane', 50.850899, 12.463176, 'Di-Do: 11:00–20:30 Uhr; Fr-Sa: 11:00–21:30 Uhr; So: 11:00–20:30 Uhr', '', '2025-03-18 19:16:33', 1, 5, 3),
(28, '\'n Eis zapfen', 'Schloßstraße, 09669 Frankenberg/Sa.', 50.913357, 13.032811, 'Di-Fr: 13-18 Uhr;Sa-So: 13-17 Uhr', '', '2025-03-19 10:49:04', 1, 4, 3),
(29, 'Eis-Traum Speiseeis und Eisspezialitäten', 'Geyersche Str. 3, 09419 Thum', 50.665054, 12.927232, 'Mo-Fr: 12-17 Uhr; Sa: 13:30-17 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2141043157/embed?share_token=arAPDPutlmUYX5ckpJxyH3XCzZMnEBAJjXErny5OKKlXMRuDi8&profile=1\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-20 07:33:02', 1, 3, 3),
(30, 'Arndt’s Softeis Café', 'Pappelweg 1, 08340 Schwarzenberg/Erzgebirge', 50.533176, 12.772385, 'Mi-So: 14-17:30 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2116969975/embed?share_token=aOjrIbBFZ0G6Oev1Ajn3sK3L9t4nTo03R9LbBZIM4y6ZriPKr6\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-20 07:36:56', 1, 3, 3),
(31, 'Eiscafé Döge', 'August-Bebel-Straße 1, 04567 Kitzscher', 51.164234, 12.551695, 'Mi-Fr: 14-17:30 Uhr; Sa-So: 14-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2109432795/embed?share_token=atw46aGE8ustrenEcMyr6X5NVCQviCSV71gB86FHE3JApl36UC\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-20 07:56:16', 1, 9, 3),
(32, 'Café Milchhäuschen', 'Schloßteichstraße 20, 09113 Chemnitz', 50.842377, 12.912816, 'Mo-Do: 11:30-17 Uhr; Fr: 11:30-21:30 Uhr; Sa-So: 11-18 Uhr', '', '2025-03-21 05:33:04', 1, 6, 3),
(33, 'Gondelstation am Schlossteich', 'Promenadenstraße 5Z, 09111 Chemnitz', 50.840908, 12.915353, 'Mo-Do: 12-18 Uhr; Fr: 12-19 Uhr; Sa-So: 10-19 Uhr', '', '2025-03-21 05:33:04', 1, 6, 3),
(34, 'Gelato Valentino', 'Markt 1, 09111 Chemnitz', 50.832691, 12.919590, 'Mo-Sa: 10-18 Uhr; So: 12-18 Uhr', '', '2025-03-21 05:55:34', 1, 6, 3),
(35, 'Ferioli Gelato Chemnitz', 'Am Rathaus 1, 09111 Chemnitz', 50.832527, 12.920319, 'Mo-So: 9-21 Uhr', '', '2025-03-21 05:55:34', 1, 6, 3),
(36, 'Emmas Onkel', 'Weststraße 67, Ulmenstraße 48, 09112 Chemnitz', 50.831436, 12.897780, 'Di-Mi: 14-21 Uhr; Do: 14-22 Uhr; Fr-Sa: 14-23 Uhr; So: 10-20 Uhr', '', '2025-03-21 12:06:11', 1, 6, 3),
(37, 'Friedel\'s Cafe', 'Niedermarkt 9, 04736 Waldheim', 51.073997, 13.024919, 'Mo-Di: 10-20 Uhr; Fr-So: 10-20 Uhr', '', '2025-03-23 17:45:22', 1, 4, 3),
(38, 'La Bonta', 'Kirchgasse 1, 09306 Rochlitz', 51.045940, 12.802377, 'Mo: 11-21 Uhr; Di-So: 11-21 Uhr', '', '2025-03-23 17:45:22', 1, 4, 3),
(39, 'Café EISMAIK', 'Brückenstraße 24, 09322 Penig', 50.933479, 12.705230, 'Di-Do: 13-18 Uhr; Sa-So: 13-18 Uhr', '', '2025-03-23 17:45:22', 1, 4, 3),
(40, 'Eiscafé Venezia', 'Markt 9, 04680 Colditz', 51.129055, 12.805317, 'Mo-Do: 10-18 Uhr; Sa-So: 11-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/1041597491/embed?share_token=a8ppmCGzfMQKoTKYBGgvZa8GEfvWPU8IFJpptxJ2RskCTpEouu\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-24 06:33:51', 1, 9, 3),
(41, 'Eismanufaktur Kolibri', 'Rudolf-Breitscheid-Straße 36, 09557 Flöha', 50.856632, 13.075638, 'ab 01.04:;Mo-Sa: 13-18 Uhr; So: 11-18 Uhr', '', '2025-03-24 08:49:12', 1, 4, 3),
(42, 'Eiscafe Piccolo Dolce', 'Str. d. Freundschaft 33, 04654 Frohburg', 51.055256, 12.555690, 'Mo-So: 10-19 Uhr', '', '2025-03-24 12:13:13', 1, 9, 3),
(43, 'Ristorante Amore Mio', 'Schloßberg 1, 09113 Chemnitz', 50.845139, 12.916579, 'Di-So: 12-23 Uhr', '', '2025-03-24 17:21:28', 1, 6, 3),
(44, 'SPEISEKAMMER Chemnitz', 'Schloßberg 14, 09111 Chemnitz', 50.845486, 12.916230, 'Montag: Ruhetag;bei schönem Wetter ab 14 Uhr', '', '2025-03-24 17:21:28', 1, 6, 3),
(45, 'Eiscafe Leonhardt', 'Eibenstocker Str. 52, 08349 Johanngeorgenstadt', 50.432774, 12.713272, 'Mo-Di: 11-18 Uhr;Fr-Sa: 11-18 Uhr;So: 13-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2117023918/embed?share_token=abMM6jTSdmMQSlAGrMdTO81vdDSLJrIK7KJXTzqIUURADyuZKz\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-24 18:17:14', 1, 3, 3),
(46, 'Eiscafe Eiswürfel', 'Talstraße 45, 08344 Grünhain-Beierfeld', 50.562202, 12.831186, 'Mi-Fr: 13-18 Uhr;Sa-So: 13-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2117187697/embed?share_token=aV2Hu3UCsgD69l3EKo2M5GZWarrQeZxDItCxpA9N2l1M52Kd4N\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-25 10:10:42', 1, 3, 3),
(47, 'Eiskaffee Glösa', 'Slevogtstraße 43, 09114 Chemnitz', 50.883839, 12.943079, 'Fr-So: 11-18 Uhr', '', '2025-03-25 20:51:02', 1, 6, 3),
(49, 'Eiscafé Venezia', 'Markt 19, 09648 Mittweida', 50.985241, 12.981489, 'Di-Sa: 10-18 Uhr;So: 13-18 Uhr', '', '2025-03-26 18:55:34', 1, 4, 3),
(50, 'Café Zur Eiszeit', 'Wendischbora 61a, 01683 Nossen', 51.080006, 13.340350, 'Mi-So: 13-18 Uhr', '', '2025-03-27 07:40:30', 1, 10, 3),
(51, 'Dolce Freddo Zwickau', 'Hauptmarkt 16, 08056 Zwickau', 50.717957, 12.497235, 'Di-Do: 9:30-19 Uhr;Fr-Sa: 9:30-20 Uhr;So: 9:30-19 Uhr', '', '2025-03-27 07:45:18', 1, 5, 3),
(52, 'Die Eismühle', 'Flöhatalstraße 2, 09579 Grünhainichen', 50.760609, 13.171333, 'So: 13-17 Uhr', '', '2025-03-27 07:56:43', 1, 3, 3),
(53, 'Eis Specht', 'Gahlenzer Str. 48, 09569 Oederan', 50.828667, 13.216462, 'Ab 01. Mai:;Sa: 14-18 Uhr;So: 13-18 Uhr', '', '2025-03-27 07:58:11', 1, 4, 3),
(54, 'Piccolino - Eis- & Grillbar', 'Marienberger Str. 29B, 09573 Augustusburg', 50.809246, 13.100998, 'Mo-So: 11-17 Uhr', '', '2025-03-28 08:35:34', 1, 4, 3),
(55, 'Konditorei & Panoramacafé Schreier', 'Hohe Str. 13, 09573 Augustusburg', 50.813721, 13.101641, 'Mo-Sa: 6:30-17 Uhr;So: 13-17 Uhr', '', '2025-03-28 17:04:49', 1, 4, 3),
(56, 'Schloss-Café Ponitz', 'Schlosshof 3, 04639 Ponitz', 50.856808, 12.423168, 'Di-So: 13:30-17:30 Uhr\r\n', '', '2025-03-29 05:46:42', 1, 7, 1),
(57, 'Eisfabrik Gößnitz', 'Markt 15, 04639 Gößnitz', 50.888275, 12.433415, 'Mi-So: 14-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2125763714/embed?share_token=aEGQW3j7otzdf1X7vzMI8JBzEwEV07qoTCgdkxKcvDnfZO3phh\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-03-29 18:23:02', 1, 7, 1),
(58, 'Waldcafé Göhren', 'Göhren 1D, 09306 Wechselburg', 50.980434, 12.763076, 'März-Dezember:;Di-Sa: 14-17 Uhr;So: 11-17 Uhr', '', '2025-03-30 10:49:29', 1, 4, 3),
(59, 'Eis-Eck', 'Bahnhofstraße 11, 09577 Niederwiesa', 50.865376, 13.021731, 'Mo-Fr: 12-18 Uhr; Sa: 13-18 Uhr', '', '2025-04-03 05:00:53', 1, 4, 3),
(60, 'Gelato Italiano', 'Johannispl. 3, 09212 Limbach-Oberfrohna', 50.858650, 12.760948, 'Mo-Fr: 9-19 Uhr; Sa-So: 13-19 Uhr', '', '2025-04-03 05:03:56', 1, 5, 3),
(61, 'Jannys Eis', 'Pflockenstraße 28, 09376 Oelsnitz/Erzgebirge', 50.724373, 12.728905, 'Di-Fr: 13-18 Uhr; Sa-So: 12-18 Uhr', '', '2025-04-03 05:08:21', 1, 3, 3),
(62, 'Eiscafé Cortina Zwönitz', 'Annaberger Str. 2, 08297 Zwönitz', 50.629707, 12.813651, 'Mo-So: 9:30-20 Uhr', '', '2025-04-03 05:10:35', 1, 3, 3),
(63, 'Café Milchbubi', 'Lange G. 20, 08297 Zwönitz', 50.630199, 12.810021, 'Di-Do: 13-18 Uhr; Fr-So: 13-19 Uhr', '', '2025-04-04 04:58:21', 1, 3, 3),
(64, 'Marschner\'s Eisdiele', 'Chemnitzer Str. 1, 09380 Thalheim/Erzgeb.', 50.703686, 12.852109, '', '', '2025-04-04 05:02:29', 1, 3, 3),
(65, 'Eiscafé zum Römer', 'Hauptstraße 29, 08412 Werdau', 50.714363, 12.387291, 'So: 13-17 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2141338801/embed?share_token=aRyl0tA138CJahivyKq3eKLmC7XUwprq5XDGRrkTFEjVYUcEE1&profile=1\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-04-05 11:15:53', 1, 5, 3),
(66, 'Hofcafe Päßler', 'Schulstraße 1, 08427 Fraureuth', 50.681396, 12.365823, 'Mo-Do: 14-18 Uhr; Sa-So: 14-18 Uhr', '', '2025-04-05 11:20:34', 1, 5, 3),
(67, 'Jannys Eis', 'Herrengasse 14, 08451 Crimmitschau', 50.815258, 12.386800, 'Mo-Sa: 11-18 Uhr; So: 14-18 Uhr', '', '2025-04-05 16:37:11', 1, 5, 3),
(68, 'Eiscafé Fraureuth', 'Hauptstraße 78, 08427 Fraureuth', 50.703167, 12.355584, 'Mi-Fr: 13-17 Uhr; Sa: 13-17:30 Uhr; So: 13-18 Uhr', '', '2025-04-05 16:42:27', 1, 5, 3),
(69, 'lumipöllö lounge', 'Bahnhofstraße 45, 09435 Drebach', 50.702709, 13.056519, 'Fr-So: 12-23 Uhr', '', '2025-04-05 16:49:16', 1, 3, 3),
(70, 'Erzgebirgische Landbäckerei GmbH burgBlick Café & Eis', 'Wolkensteiner Str. 1 G, 09429 Wolkenstein', 50.652985, 13.061177, 'Mo-So: 7-17 Uhr', '', '2025-04-05 16:52:35', 1, 3, 3),
(71, 'SchillerGarten', 'Schillerpl. 8, 01309 Dresden', 51.052387, 13.808243, ' ', '', '2025-04-05 16:57:20', 1, 11, 3),
(72, 'Eis Venezia Manufaktur', 'Markt 26, 08289 Schneeberg', 50.595070, 12.640969, 'Di-So: 11-20 Uhr', '', '2025-04-05 18:47:03', 1, 3, 3),
(73, 'Cafe Naschkatze', 'Bahnhofstraße 1, 09661 Hainichen', 50.971966, 13.122789, 'Do-Sa: 13-17 Uhr', '', '2025-04-06 18:47:48', 1, 4, 3),
(74, 'Cafe Flora', 'Hauptstraße 87, 09619 Mulda/Sachsen', 50.809078, 13.407659, 'Di-Do: 11:30 - 17 Uhr; Fr-So: 11:30 - 21 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2143692597/embed?share_token=anzEZqQDeHTcRq1YJOXRuRMoVfkIrs1Chfik2ID3iNgsVjSQTj&profile=1\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-04-06 18:51:45', 1, 4, 3),
(75, 'Softeis in Garnsdorf', 'Nähe Garnsdorfer Hauptstraße 104, 09244 Lichtenau', 50.921795, 12.928590, 'manchmal gibt es hier Softeis', '', '2025-04-09 04:49:58', 1, 4, 3),
(76, 'Herzens-Schmiede e.V. – AusZeit-Oase', 'Zwönitztalstraße 32, 09380 Thalheim/Erzgeb.', 50.686947, 12.843474, 'Mi-Fr: 14:30-17:30 Uhr', '', '2025-04-09 04:51:58', 1, 3, 3),
(77, 'Silvio der Eisgraf von Freiberg', 'Burgstraße 46, 09599 Freiberg', 50.919468, 13.341347, ' Di-So: 11-19 Uhr', '', '2025-04-09 05:51:43', 1, 4, 3),
(81, 'Eiscafé Ys', 'Richard-Friedrich-Straße 18, 08280 Aue-Bad Schlema', 50.599815, 12.662221, 'Di-Fr: 11-18 Uhr;Sa-So: 12-18 Uhr', '', '2025-04-09 07:21:56', 1, 3, 3),
(82, 'Eiscafé Ys', 'Fürstenpl. 8, 08289 Schneeberg', 50.596218, 12.640791, 'Mo-So: 12-18 Uhr', '', '2025-04-09 07:25:26', 1, 3, 3),
(83, 'Eiscafé Cantina', 'Altmarkt 11, 08280 Aue-Bad Schlema', 50.586224, 12.703076, 'Mo-So: 11-19 Uhr', '', '2025-04-09 08:29:30', 1, 3, 3),
(84, 'Gelato Caffe by Giuseppe', 'Bahnhofstraße 17, 08340 Schwarzenberg/Erzgebirge', 50.542366, 12.787571, 'Mo-So: 10:30 - 20 Uhr', '', '2025-04-09 08:31:44', 1, 3, 3),
(85, 'Eiscafé Cortina', 'Buchholzer Str. 11, 09456 Annaberg-Buchholz', 50.578850, 13.002192, 'Mo-So: 10-21:30 Uhr', '', '2025-04-09 08:38:34', 1, 3, 3),
(86, 'Eis-Cafe Rositz', 'Karl-Marx-Straße 14, 04617 Rositz', 51.016502, 12.370026, 'Di-Sa: 13-18 Uhr; So: 11-18 Uhr', '', '2025-04-09 12:23:08', 1, 7, 1),
(87, 'Eiscafé Hoppe', 'Limbacher Str. 41, 09243 Niederfrohna', 50.874172, 12.748813, 'Di-So: 13-18 Uhr', '', '2025-04-10 09:13:18', 1, 5, 3),
(88, 'Bäckerei-Käferstein', 'Rosa-Luxemburg-Straße 3, 09241 Mühlau', 50.896767, 12.758780, 'Mo, Mi: 6-12 Uhr; Di, Do, Fr: 6-17 Uhr; Sa: 5-10:30 Uhr', '', '2025-04-10 09:15:28', 1, 4, 3),
(89, 'Pieschels Eisdiele', 'Pfarrstraße 9, 08233 Treuen', 50.539742, 12.308750, 'Mo-So: 13-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/1259315746/embed?share_token=aAcrsdK0p1Ho74xaV4g7PsGmD375xR3P76dPBRUJKFFftZc1hi&profile=1\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-04-11 07:27:22', 1, 12, 3),
(92, 'Saneto', 'Stollberger Str. 31, 09221 Neukirchen/Erzgebirge', 50.775143, 12.857387, 'Mo-So: 14-17 Uhr', '', '2025-04-11 09:58:48', 1, 3, 3),
(93, 'Eiscafé Amore', 'Bäckerstraße 3, 04720 Döbeln', 51.121494, 13.119929, 'Mo-So: 9-18 Uhr', '', '2025-04-11 10:05:39', 1, 4, 3),
(97, 'Bäckerei & Cafe Brückner', 'Auer Str. 30, 08344 Grünhain-Beierfeld', 50.579590, 12.805849, 'Mo-Fr: 5:30-18 Uhr, Sa: 5:30 - 11 Uhr', '', '2025-04-12 09:08:42', 1, 3, 3),
(98, 'Eisbär Planitz', 'Äußere Zwickauer Str. 46, 08064 Zwickau', 50.681068, 12.474918, 'Di-So: 13-18 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2156485682/embed?share_token=aXul3Yn3HECtwMmDcRcbEHHOe6wXSdzb6D4XK1r4QNn7shP3GH&profile=1\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-04-12 15:50:13', 1, 5, 3),
(99, 'Frollein Sommer', 'Bernsdorfer Str. 57, 09126 Chemnitz', 50.819443, 12.936491, 'Bei schönem Wetter;Mo-Sa: 13-18 Uhr;So: 12-18 Uhr', '', '2025-04-13 06:45:44', 1, 6, 3),
(100, 'Vila Hermes Café do Brasil', 'Kaufunger Str. 4a, 09212 Limbach-Oberfrohna', 50.900608, 12.668810, 'Mi-So: 10-17 Uhr', '', '2025-04-13 11:35:47', 1, 5, 3),
(101, 'Albrecht Eiseck', 'Dresdner Str. 54, 01683 Nossen', 51.057991, 13.305590, ' Mo-So: 12-17 Uhr', '<iframe src=\"https://www.komoot.com/de-de/tour/2159077294/embed?share_token=aIGChRNihGNZKPZKdliYH3gg0Rt7MDGqwzTs9WukJK7TG71j7M\" width=\"100%\" height=\"130\" frameborder=\"0\" scrolling=\"no\"></iframe>', '2025-04-13 13:42:29', 1, 10, 3),
(102, 'Landbäckerei Dietrich - Schloss Café Rochlitz', 'Markt 4, 09306 Rochlitz', 51.045963, 12.799110, 'Di-Sa: 10-17 Uhr;So: 13-17 Uhr', '', '2025-04-15 08:50:30', 1, 4, 3),
(103, 'Eiscafé Kampanile', 'Sonnenweg 1, 08132 Mülsen', 50.767017, 12.548699, 'Fr-So: 14-18 Uhr', '', '2025-04-15 19:31:19', 1, 5, 3),
(104, 'Eiscafé Monika Nestler', 'Ratsseite-Dorfstr. 100, 09496 Marienberg', 50.633167, 13.210966, 'Mo-Do & Sa-So: 14-18 Uhr', '', '2025-04-15 19:41:05', 1, 3, 3),
(105, 'Café Eisbär', 'Zschopauer Str. 26, 09496 Marienberg', 50.652615, 13.161110, 'Mo-So: 14-17 Uhr', '', '2025-04-15 19:41:57', 1, 3, 3),
(106, 'Eismanufaktur Lipp', 'Kleine Kirchgasse 57, 09456 Annaberg-Buchholz', 50.578262, 13.007279, 'Mi-So: 13-18 Uhr', '', '2025-04-15 19:45:26', 1, 3, 3),
(107, 'Sperlich\'s \"EISZEIT\"', 'Giebelstraße 2, 03222 Lübbenau/Spreewald', 51.861938, 13.938499, 'So-Fr: 14-18 Uhr ', '', '2025-04-21 05:23:30', 1, 16, 5),
(109, 'Eiscafe Sothis', 'Str. d. Einheit 20, 09569 Flöha', 50.853367, 13.113309, 'derzeit geschlossen', '', '2025-04-21 14:48:28', 1, 4, 3),
(111, 'Klatt-Eis Eismanufaktur', 'Mittweidaer Str. 102, 09648 Mittweida', 51.000374, 12.899914, 'So: 13-18 Uhr', '', '2025-04-21 15:04:29', 1, 4, 3),
(112, 'Eis-Pinguin', 'Puschkinstraße 4, 09112 Chemnitz', 50.830437, 12.900225, 'Coming soon', '', '2025-04-21 15:08:49', 1, 6, 3),
(113, 'Eiscafé Caramello', 'Bahnhofstraße 2, 04651 Bad Lausick', 51.143497, 12.648633, 'Mo-So: 11-18 Uhr', '', '2025-04-22 05:43:44', 1, 9, 3),
(114, ' Eisdiele Krause', 'Markt 2, 09306 Wechselburg', 51.004692, 12.773902, '', '', '2025-04-22 08:34:25', 1, 4, 3);

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
  ADD KEY `fk_eisdielen_bundesland` (`bundesland_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  ADD CONSTRAINT `fk_eisdielen_bundesland` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`),
  ADD CONSTRAINT `fk_eisdielen_landkreis` FOREIGN KEY (`landkreis_id`) REFERENCES `landkreise` (`id`),
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
