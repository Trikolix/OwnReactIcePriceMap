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
  `preisleistungsbewertung` decimal(2,1) DEFAULT NULL,
  `kommentar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `bild_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkins`
--

INSERT INTO `checkins` (`id`, `nutzer_id`, `eisdiele_id`, `datum`, `typ`, `geschmackbewertung`, `waffelbewertung`, `größenbewertung`, `preisleistungsbewertung`, `kommentar`, `bild_url`) VALUES
(2, 1, 100, '2025-04-14 08:37:44', 'Kugel', '3.4', '1.9', '3.9', NULL, '', 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg'),
(3, 1, 72, '2025-04-14 08:41:48', 'Kugel', '4.5', '4.8', '4.4', NULL, '', 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg'),
(4, 1, 40, '2025-04-14 08:47:33', 'Kugel', '4.8', '3.0', '4.5', NULL, 'Meine Kugel salziges Karamell war geschmacklich vorzüglich und hatte eine wunderbar cremige Konsistenz.\r\nEine riesige Auswahl an teils ausgefallene Sorten runden das Angebot ab.\r\nLediglich bei der einfachen Waffel gibt es Luft nach oben.', 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg'),
(5, 1, 47, '2025-04-14 10:23:14', 'Kugel', '3.2', '1.8', '2.7', NULL, 'Das Schokoeis hat nach günstigen Eis vom Discounter geschmeckt. Heidelbeere war recht lecker, hat aber auch 1,50€ gekostet und war somit 50 Cent teurer als die \'einfachen\' Sorten.\r\nDie Kugeln waren eher klein und die Eiswaffel nicht gut.', 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg'),
(6, 1, 46, '2025-04-14 10:31:39', 'Kugel', '4.9', '4.5', '4.9', NULL, 'Super leckeres Eis und riiiesige Kugeln, dazu eine knusprige Waffel.\r\nEine etwas größere Waffel und vielleicht noch ein paar Schokostückchen im Schokoeis und es gäbe die perfekte Bewertung.', 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg'),
(7, 1, 101, '2025-04-14 16:03:52', 'Kugel', '5.0', '2.5', '4.1', NULL, 'Alle 3 Kugeln Cookies, Salted Caramel und Brombeer Holunder waren super lecker, hatten eine cremige Konsistenz und vor allem hatten sie viele Cookie, Karamell bzw. Fruchtstückchen.\nDie Papp-Waffel war leider das einzige Manko. Ansonsten Top Top Top!', 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg'),
(9, 1, 101, '2025-04-14 16:09:10', 'Kugel', '4.7', '2.0', '1.9', NULL, '', 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg'),
(10, 1, 98, '2025-04-16 16:48:42', 'Kugel', '4.7', '4.2', '4.1', NULL, 'Super leckeres, sehr günstiges Eis und eine große Auswahl an Sorten, wobei alle Sorten den gleichen Preis kosten.\r\nSchade dass ich mit meiner Bestellung von 4 Kugeln zwar eine größere aber nicht so knusprige Waffel wie die anderen bekommen habe.', 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg'),
(11, 1, 55, '2025-04-17 15:55:27', 'Kugel', '4.6', '4.8', '4.1', NULL, '', 'uploads/checkins/checkin_6801084f859771.78778651.jpg'),
(12, 4, 10, '2025-04-20 17:42:30', 'Kugel', '4.2', '4.8', '4.8', NULL, 'Machste nix verkehrt. Schön schokoladig. Ab und zu ein Eiskristall in der Mitte.', NULL),
(14, 4, 9, '2025-04-21 15:20:39', 'Softeis', '4.4', '2.5', '4.5', '4.5', '', NULL),
(16, 1, 18, '2025-04-22 12:52:48', 'Kugel', '4.9', '3.5', '1.7', NULL, 'Ich hatte eine Kugel gebrannte Mandeln. Das Eis war sehr lecker, vor allem durch die Stückchen gebrannte Mandel die noch oben drauf gestreut waren, allerdings für 2€ war die Kugel relativ klein.', 'uploads/checkins/checkin_6807750090a880.99200391.jfif'),
(17, 1, 39, '2025-04-22 12:56:02', 'Kugel', '4.9', '4.5', '3.3', NULL, 'Ich hatte eine Kugel \'Kalter Hund\', die war sehr lecker und für 1,50€ auch angemessen groß. Die Waffel war sehr knusprig und lecker. \r\nInsgesamt hatte die Eisdiele eine gute Auswahl an Sorten.', 'uploads/checkins/checkin_680775c23a3b90.94454860.jpg'),
(18, 1, 1, '2025-04-22 12:58:16', 'Kugel', '4.8', '3.8', '4.2', NULL, 'Sehr leckeres Ei, die Kugeln sind ordentlich groß und den Preis wert.\r\n\r\nEs lohnt sich 2 Kugeln oder mehr zu nehme, ab dann gibt es eine besser schmeckende Waffel.', 'uploads/checkins/checkin_6807764881a7d7.92172451.jpg'),
(19, 1, 5, '2025-04-22 12:59:44', 'Kugel', '4.5', '1.0', '3.7', NULL, 'Dunkle Schokolade war schon sehr lecker, aber die Waffel war eine ganz einfache nach Pappe schmeckende. Für den Preis von 2€ die Kugel war ich etwas enttäuscht.', 'uploads/checkins/checkin_680776a0e5f966.43189762.jpg'),
(20, 1, 11, '2025-04-22 13:01:56', 'Kugel', '4.8', '4.7', '4.2', NULL, 'Sehr leckeres Eis in einer super großen leckeren Waffel. Die Auswahl umfasst jetzt weniger ausgefallene Sorten, aber trotzdem alles lecker. Besonders die Sorte Milchreis kann ich empfehlen.', 'uploads/checkins/checkin_68077724b19388.99511766.jpg'),
(21, 1, 26, '2025-04-22 13:03:55', 'Kugel', '4.3', '4.5', '3.0', NULL, 'Ich hatte eine Kugel Mango und eine Kugel Cookies. Die Kugel Mango war sehr groß, die Cookie Kugel hingegen eher klein. Insgesamt schon sehr solide, aber es könnten zum Beispiel mehr Cookie Stückchen im Eis sein.', 'uploads/checkins/checkin_6807779bcd13c8.48200144.jpg'),
(22, 1, 22, '2025-04-22 13:06:25', 'Kugel', '4.8', '4.7', '4.4', NULL, 'Ich hatte eine Kugel Schoko-Praline. Die war äußerst lecker, mit vielen Nuss / Pralinen Stückchen. Und für 1,30€ die Kugel äußerst groß.\r\nDie Waffel war auch sehr lecker und angenehm groß.', 'uploads/checkins/checkin_68077831306e46.00666877.jpg'),
(23, 1, 31, '2025-04-22 13:08:39', 'Softeis', '4.7', '3.5', NULL, '4.3', 'Beliebter Softeisstand auf dem Markt in Kietscher. Es gab zwei verschiedene gemischte Softeis zur Auswahl in klein und groß für 1,50 bzw. 2,50 € und für 20 Cent Aufpreis gab es Streusel auf das Eis.', 'uploads/checkins/checkin_680778b7809bd9.23540954.jpg'),
(24, 1, 59, '2025-04-22 16:45:20', 'Kugel', '4.8', '2.5', '4.5', NULL, 'Feines kleines Eislokal mit leckeren Sorten, großen Kugeln und fairen Preisen.', 'uploads/checkins/checkin_6807ab80cd8189.01435225.jpg'),
(25, 1, 6, '2025-04-23 10:24:44', 'Kugel', '3.9', '1.5', '2.4', NULL, 'Ich hatte ein Sorbet Eis der Geschmacksrichtung Heidelbeere, was geschmacklich nicht ganz überzeugt hat. Die Größe war unteres Mittelfeld und die Waffel leider eine einfachste Pappwaffel.', 'uploads/checkins/checkin_6808a3cc294272.31810929.jpg'),
(26, 1, 10, '2025-04-23 10:30:07', 'Kugel', '4.8', '4.7', '4.3', NULL, 'Sehr leckeres Eis in einer leckeren großen Waffel. Die Portion sind auch recht groß, aber bei einem Preis von 1,80 € bzw. 2,20 € für Premiumsorten pro Kugel könnten sie noch größer sein.\r\nSchöner Außenbereich zum sitzen.', 'uploads/checkins/checkin_6808a50f008879.38210265.jpg'),
(39, 3, 115, '2025-04-22 13:24:51', 'Softeis', '4.7', '3.2', '4.5', '4.5', 'Bei meinem Besuch im Eisgarten an der Kaßbergauffahrt ließ ich mir ein Schoko-Vanille-Softeis schmecken. Überzeugen konnte das Eis durch die Kombination aus der für Softeis üblichen cremigen Konsistenz sowie durch seinen angenehmen Geschmack. Eine eher schlechtere Bewertung erhielt die sehr einfache Waffel. Das Angebot an Eissorten ist sehr überschaubar, was aber bei Softeis keine Überraschung ist. Punkten kann der Eisgarten ebenfalls durch seine kleine anschließende Grünfläche sowie einige Sitzmöglichkeiten, die zum Verweilen einladen. Für Softeis-Liebhaber einen Besuch wert!', NULL),
(52, 1, 16, '2025-04-25 08:02:39', 'Kugel', '4.6', '3.5', '4.0', NULL, '', 'uploads/checkins/checkin_680b257f5ecd81.04364034.jpg'),
(53, 1, 29, '2025-04-25 08:04:57', 'Kugel', '5.0', '3.5', '3.7', NULL, 'Ich hatte eine Kugel Marzipan und\r\neine Kugel Cookies, beide waren\r\nsuper lecker und viel zu schnell\r\nverputzt. Bemerkenswert war die Cremigkeit vom Eis.\r\nDas Lokal ist sehr idyllisch und\r\nscheint privat betrieben zu sein.', 'uploads/checkins/checkin_680b260953a2c6.04111238.jpg'),
(54, 1, 37, '2025-04-25 08:09:37', 'Kugel', '4.6', '4.8', '3.5', NULL, 'Uriges kleines Lokal. Der ältere Betreiber erklärte mir dass er das Kremeeis selber aus Milch, Eiern und Zucker herstellt.\r\nDen Unterschied zu anderen Eis hat man in der Konsistenz geschmeckt, es hatte mehr Struktur. Insgesamt geschmacklich sehr gut, aber etwas sahniger hätte es für meinen Geschmack sein können.', 'uploads/checkins/checkin_680b27215c9cd7.16477511.jpg'),
(55, 1, 58, '2025-04-25 08:19:24', 'Kugel', '2.5', '3.0', '1.7', NULL, 'Sehr liebevolles Café mit wirklich tollen, leckeren Kuchen und Torten zu sehr fairen Preisen, aber leider war das Eis nicht wirklich gut. Es hatten sich schon Kristalle gebildet, was vielleicht daran liegen mag, dass es insgesamt wenig besucht ist. Sehr schade :(', 'uploads/checkins/checkin_680b296ce5fe31.37610516.jpg'),
(56, 1, 71, '2025-04-25 08:21:22', 'Kugel', '4.8', '4.2', '4.0', NULL, 'Das Eis war sehr lecker und enthielt einige Schoko- / Pralinenstückchen. Die Portion war für 2,00€ angemessen und die Waffel war auch recht lecker aber klein. Andere Kunden mit ebenfalls nur einer Kugel Eis haben teilweise andere (größere) Waffeln erhalten.', 'uploads/checkins/checkin_680b29e24a1a94.15558268.jpg'),
(57, 1, 86, '2025-04-25 08:23:32', 'Kugel', '2.4', '2.0', '2.4', NULL, 'Ich hatte eine Kugel Straciatella und eine Kugel Pfirsich-Maracuja.\r\nDie Kugel Straciatella hatte zwar viele Schokostückchen aber beide Kugeln haben wässrig geschmeckt, waren eher klein und geben in Verbindung mit einer pappigen Waffel ein schlechtes Gesamtbild ab.', 'uploads/checkins/checkin_680b2a64289c96.21068159.jpg'),
(58, 1, 118, '2025-04-26 13:13:39', 'Kugel', '4.6', '4.6', '5.0', NULL, 'Eine super Auswahl von ca. 30 Sorten, davon ziemlich viele ausgefallene.\r\nDie Kugeln waren die größten die ich bis jetzt jemals bekommen habe.😍\r\nDas Eis war lecker, aber bei der Geschmacksintensität ist noch bisschen Raum nach oben.\r\nInsgesamt eine große Empfehlung.', 'uploads/checkins/checkin_680cbfe340a0f3.28355942.jpg'),
(59, 1, 121, '2025-04-27 14:13:59', 'Softeis', '3.4', '1.7', '3.5', '3.4', 'Das Schoko Vanille Softeis hat etwas wie Zott Monte Joghurt geschmeckt nur etwas weniger intensiv. Die größte war angemessen und die Waffel wie bei Softeis fast immer eher pappig.', 'uploads/checkins/checkin_680e1f8730cad0.81147935.jpg'),
(60, 2, 123, '2025-04-27 17:45:25', 'Kugel', '4.0', '3.0', '3.0', NULL, 'Habe eine Kugel Eis in der Motorradpause dort geschleckert: Geschmack war ganz gut, Größe aber nicht überzeugend für den Preis. Waffel ist Standard. Dafür überzeugt die tolle Lage und die Geschmacksauswahl', 'uploads/checkins/checkin_680e5115747b78.57634651.jpeg'),
(61, 7, 125, '2025-04-27 21:19:09', 'Softeis', '4.5', '5.0', '4.0', '4.5', 'Solides Softeis in der leckeren und knusprigen Variante der Waffel (nicht in dem obligatorischen Pappwaffelbecher).', NULL),
(62, 3, 32, '2025-04-27 21:41:16', 'Kugel', '4.6', '4.5', '4.0', NULL, 'Ich entschied mich bei meinem Besuch am Milchkännchen für die Premiumsorte Joghurt-Sanddorn, womit ich definitiv eine gute Wahl traf. Der Geschmack wirkt ausgefallen/aufregend und vertraut zugleich. Auch mit seiner cremigen Konsistenz wusste das Eis zu überzeugen, abgerundet von einer leckeren und knusprigen Waffel. Eine Premiumsorte hat jedoch mit 2,20€ einen Preis, dem die Kugelgröße nicht ganz gerecht wird. Bei einem anschließenden Spaziergang am Schloßteich schmeckt das Eis gleich nochmal besser.', NULL),
(66, 1, 42, '2025-04-28 19:06:08', 'Kugel', '4.6', '4.6', '4.7', NULL, 'Das Eiscafé Piccolo bietet eine große Auswahl leckerer Sorten an, wobei jede Sorte 1,60€ kostet. Meine Sorten Himbeere und Nougat konnten überzeugen und die Portionen waren für den Preis sehr gut. Der Verkäufer war sehr nett und plauderte etwas mit mir. 😅', 'uploads/checkins/checkin_680fb580b86b28.07088248.jpg'),
(67, 1, 92, '2025-04-29 16:25:42', 'Kugel', '4.8', '4.3', '4.5', NULL, 'Die Eisdiele Saneto hat ein breites Sortiment an Kugel- und Softeis, wobei es auch viele ehere besondere Sorten gibt. Premiumsorten kosten mit 2,20€ dabei 20cent mehr als die restlichen Sorten. Ich hab mich für Eierlikör-Nougat und Quark-Zitrone entschieden, welche beide sehr sahniges, intensiv und lecker schmeckend waren. Besonders der Eierlikör Geschmack kam gut zur Geltung Als weitere Besonderheit gibt es einen 24/7 Automat an dem man sich abgepacktes Eis holen kann.', 'uploads/checkins/checkin_6810e166df05f3.24970135.jpg'),
(68, 1, 106, '2025-04-30 17:14:18', 'Kugel', '5.0', '4.7', '4.9', NULL, 'Ein tolles Eiscafé mit einer süßen kleinen Sitzecke auf dem Bürgersteig. Es gibt eine große Auswahl an ausgefallenen Sorten. Ich hatte je eine Kugel Kirsch-Schoko und Baileys. Das Eis war fantastisch lecker, besonders die Kugel Schoko-Kirsch glänzte mit einer Vielzahl an ganzen Kirschen und vielen Schokostückchen. 😍 Ein absolutes Geschmackshighlight, besser kann Eis nicht schmecken! \r\nEs gibt auch Bubble Waffels im Angebot', 'uploads/checkins/checkin_68123e4a243b37.88534837.jpg'),
(69, 1, 126, '2025-05-01 17:03:53', 'Kugel', '4.5', '3.5', '3.0', NULL, 'Die Kugel Cheesecake-Waldbeere war lecker und mit einigen kleinen Beeren drinnen.\r\nIch habe mir für 40 Cent Aufpreis eine Schokowaffel gegönnt, welche sich nicht gelohnt hat. Die Waffel war selber etwas pappig und die Schokolade und Streusel haben den Geschmack nicht so aufgewertet wie erhofft. ', 'uploads/checkins/checkin_68138d592fb452.11491787.jpg'),
(70, 7, 12, '2025-05-01 21:12:06', 'Softeis', '4.5', '3.0', '5.0', '5.0', 'Super Preis-Leistungs Verhältnis.\r\nAb dem großen Softeis bzw. für die Eisbecher gibt es auch eine leckere knusprige Waffel.', 'uploads/checkins/checkin_6813c7869ac873.22346198.jpeg'),
(71, 2, 132, '2025-05-02 06:55:21', 'Softeis', '4.5', '4.8', '5.0', '5.0', 'Ein sehr gutes Softeis mit verschiedener Auswahl an Geschmäckern. Ich hatte komplett Mango, was man auch mal ausprobieren kann :)', 'uploads/checkins/checkin_68145039ded7a2.25747482.jpg'),
(72, 1, 133, '2025-05-02 12:28:16', 'Softeis', '2.1', '3.0', '2.5', '2.5', 'Das Eis war eine Packung aus dem TK Fach was durch eine Softeis Presse gejagt wurde.\r\nGeschmacklich nichts besonderes, die Waffel ganz okay und die Größe für den Preis eher unteres Mittelfeld.', 'uploads/checkins/checkin_68149e40c22588.10598712.jpg'),
(73, 1, 45, '2025-05-02 13:16:02', 'Kugel', '3.6', '4.4', '3.5', NULL, 'Geschmacklich wie auch von der Größe waren die Kugeleis eher mittelmäßig. Die Waffel war recht ordentlich. Bemerkenswert ist allerdings der Preis von nur 1€ pro Kugel für jede Sorte.\nEs gibt allerdings keine sonst wie ausgefallenen Sorten.', 'uploads/checkins/checkin_6814a972d52041.20148645.jpg'),
(74, 1, 45, '2025-05-02 13:21:57', 'Softeis', '4.6', '4.2', NULL, '5.0', 'Für 1€ bekommt man hier ein wirklich großes und sehr leckeres Softeis in einer für Softeis recht guten Waffel. Eine klare Empfehlung! 😋', 'uploads/checkins/checkin_6814aad52eec93.08796872.jpg'),
(75, 1, 134, '2025-05-02 14:09:00', 'Kugel', '4.7', '4.7', '4.3', NULL, 'Eine sehr große leckere Waffel, die Kugel Butterkeks war sehr lecker und hatte einige Keks und Schokostückchen.', 'uploads/checkins/checkin_6814b5dca10765.62455648.jpg'),
(76, 1, 135, '2025-05-02 14:48:43', 'Kugel', '4.0', '1.0', '2.7', NULL, 'Das Eis war leider nichts besonderes. Ich liebe eigentlich Weiße Schokolade, aber geschmacklich hätte man deutlich mehr raus holen können. Dazu kommt noch die wirklich unterirdische Waffel.\r\nTipp: lieber nebenan bei Eiscafé Ys für 10 Cent mehr ein deutlich besseres Eis kaufen.', 'uploads/checkins/checkin_6814bf2b0120d1.06227474.jpg'),
(77, 1, 81, '2025-05-02 14:55:20', 'Kugel', '4.9', '4.7', '4.5', NULL, 'Die Kugel Amerettini war sehr lecker, sahnig, angenehm groß und kam in einer leckeren großen Waffel. Für 1,60€ ein ziemlich gutes Eis.', 'uploads/checkins/checkin_6814c0b8ce0d18.70274899.jpg'),
(78, 2, 47, '2025-05-02 15:06:45', 'Softeis', '4.9', '3.0', '5.0', '5.0', 'Mega geiles und günstiges Softeis. Muss man probiert haben (allerdings kein gutes Kugeleis).Für den Preis von 1,50€ für ein kleines Softeis eine gute Portion. Die Waffel ist zwar etwas billig - aber für den Preis und den Eisgeschmack sofort vergessen ', 'uploads/checkins/checkin_6814c3655972b8.42912882.jpg'),
(79, 1, 136, '2025-05-04 10:19:38', 'Eisbecher', '4.5', NULL, '4.0', '4.0', 'Hier gibt es nur Eisbecher zur Auswahl. Mein Eisbecher Orion für 80czk war sehr lecker und für den Preis auch gut groß.', 'uploads/checkins/checkin_6817231a672452.85536664.jpg'),
(82, 9, 11, '2025-05-04 16:43:12', 'Eisbecher', '5.0', NULL, '4.8', '4.8', 'Sensationell ', NULL),
(83, 4, 11, '2025-05-04 19:42:34', 'Eisbecher', '4.8', NULL, '4.2', '4.2', '2 Top Kugeln im Becher! Nette Garnitur dazu!', 'uploads/checkins/checkin_6817a70a08cfe3.05723235.jpg'),
(87, 11, 137, '2025-05-05 09:04:23', 'Kugel', '4.0', '1.0', '1.0', NULL, '', 'uploads/checkins/checkin_681862f7115e29.67987507.jpg'),
(88, 5, 46, '2025-05-05 11:23:28', 'Eisbecher', '4.9', NULL, '4.9', '4.9', 'Speiseeis nach original italienischer Art in super Lage. Sehr lecker, ein Abstecher lohnt sich immer. Der Becher war gut gefüllt, das Eis cremig und geschmacklich top. Alle bisher probierten Sorten waren lecker. Einzige kleine Kritik: bei der Karamellsorte gab’s nur ein paar große Chunks, ein paar mehr kleinere Stücke hätten’s perfekt gemacht.', 'uploads/checkins/checkin_68188390300dc2.92346935.jpg'),
(90, 1, 1, '2025-05-06 17:58:20', 'Kugel', '4.6', '4.6', '4.9', NULL, 'Der Verkäufer meinte es heute sehr gut mit der Größe der Kugeln.\r\nDie Kombination aus Waldbeere und Schokolade war hervorragend. Waldbeere war schön fruchtig, Schokolade hatte mehr den Geschmack von Trinkschokolade als von richtig intensiv schmeckender Schokolade.\r\nDadurch dass ich zwei Kugeln kaufte bekam ich auch eine knusprige Waffel und nicht die pappige, die es hier beim Kauf einer Kugel gibt.', 'uploads/checkins/checkin_681a319c0f3650.93239872.jpg'),
(102, 1, 32, '2025-05-09 14:39:01', 'Kugel', '4.6', '4.3', '2.0', NULL, 'Das Eis war lecker und hat intensiv nach Eierlikör geschmeckt.\r\nFür 2€ war die Kugel schon sehr klein.\r\nDie Waffel war schlank und knusprig, fast etwas zu knusprig für meinen Geschmack. \r\n\r\nAuffällig ist, dass ich Eierlikör-Nougat bei einer anderen Eisdiele schon hatte wo es exakt gleich geschmeckt hat und die gleichen Waffeln verwendet wurden.', 'uploads/checkins/checkin_681df76554f668.70865736.jpg'),
(103, 2, 47, '2025-05-09 16:17:37', 'Softeis', '4.5', '3.5', NULL, '4.8', 'So mal wieder hier. Hat leider nicht immer geöffnet - ist ein wenig auf gut Glück. Softeis Geschmack ist lecker aber offenbar tagesformabhängig. Letztens hat es noch besser geschmeckt.', 'uploads/checkins/checkin_681e0e80e91e47.61909818.jpg'),
(112, 1, 115, '2025-05-10 14:35:53', 'Softeis', '4.0', '2.8', NULL, '3.5', 'So cremig das Softeis war, so schnell war es auch verputzt.\r\nBei Waffel und Größe muss ich ein paar Abzüge machen und der Geschmack war etwas künstlich, aber ich vermute damit muss man bei Erdbeer Softeis rechnen.', 'uploads/checkins/checkin_681f48291b6963.89816226.jpg'),
(113, 2, 125, '2025-05-10 15:27:21', 'Softeis', '4.4', '4.0', NULL, '3.8', 'Ist auf jeden Fall mal Wert hier anzuhalten. Das Softeis ist voll okay, aber auch nichts Überragendes. ', 'uploads/checkins/checkin_681f76299e0064.75169438.jpg'),
(114, 4, 126, '2025-05-10 18:30:35', 'Softeis', '4.4', '3.9', NULL, '4.5', 'Leckeres Softeis. Auch gutes Preis-Leistung Verhältnis. Angenehm groß und cremig. Überdurchschnittlich leckerer Waffel für ein Softeis.', 'uploads/checkins/checkin_681f7f2b22fa65.49786419.jpg'),
(115, 11, 162, '2025-05-10 20:57:30', 'Kugel', '5.0', '4.0', '4.0', NULL, 'Für den Preis ein gutes Eis und schöne Lokation ', 'uploads/checkins/checkin_681fa199dd3487.87433737.jpg'),
(116, 11, 59, '2025-05-10 20:59:12', 'Kugel', '4.0', '1.0', '5.0', NULL, 'Leider Pappwaffel. Andere Kunden hatten eine richtige. Keine Ahnung wieso.', 'uploads/checkins/checkin_681faa7bc33fe5.53794950.jpg'),
(120, 5, 118, '2025-05-05 11:31:54', 'Kugel', '4.8', NULL, '4.0', NULL, 'Eis war lecker, Kugeln durchschnittlich groß. Es gab auch ein paar ausgefallenere Sorten wie „Dubai Chocolate“. Auswahl insgesamt sehr gut. Der Besitzer wirkte eher mäßig freundlich, aber an und für sich trotzdem empfehlenswert.', NULL),
(121, 5, 139, '2025-05-06 20:26:51', 'Kugel', '4.5', NULL, '3.0', NULL, 'Wirklich leckeres Sorbet, Milchreis eher durchschnittlich. Man zahlt hier klar auch für die Lage.', NULL),
(122, 1, 117, '2025-05-12 18:38:02', 'Kugel', '4.6', '3.8', '4.8', NULL, 'Eine sehr große Kugel Eis, der Gummibären Geschmack war interessant und lecker und tatsächlich fällt mir keine bessere Beschreibung ein als \'hat authentisch nach Gummibärchen geschmeckt\' 😅\r\nDie Waffel ist eher im Mittelfeld an zu siedeln.', NULL),
(123, 23, 14, '2025-05-12 22:16:37', 'Softeis', '5.0', '3.0', NULL, '5.0', 'Die bekannteste Eisdiele im Umkreis. Es gibt Softeis aber auch Eisbecher und kleine warme Speisen. \r\nAußenbereich schlicht, aber einladend, Innen ausreichend Platz. \r\nDas Angebot des Softeises wechselt täglich (Am WE) und unter der Woche wöchentlich. Das Softeis ist selbst gemacht und das schmeckt man auch! \r\nWaffel ist okay, aber kein Highlight. \r\n\r\nDie Eisdiele ist gut zu erreichen und es stehen genug Parkplätze im Umkreis bereit. ', NULL),
(125, 1, 28, '2025-05-13 16:40:27', 'Softeis', '4.4', '5.0', NULL, '4.3', 'Ich entschied mich für eine große Waffel in die ich die Sorten Caipirinha (alkoholfrei), Mango und Schokolade füllte und mit diversen Toppings und Saußen verfeinerte. Rein geschmacklich konnte mich von den Softeis Sorten allerdings nur Schokolade überzeugen. Enttäuscht war ich von Mango, das hat ziemlich künstlich geschmeckt. Caipirinha war okay, aber geschmacklich ziemlich neutral.\r\nDie Waffel war hervorragend und insgesamt war es durch die Toppings und dem ganzen Prozess, sich ein Eis individuell zusammen stellen zu können, ein tolles Eis Erlebnis.\r\nAllerdings in meiner Konfiguration mit 6€ auch nicht gerade günstig.', NULL),
(126, 3, 11, '2025-05-13 21:08:28', 'Kugel', '4.7', '2.9', '4.4', NULL, 'Schmackofatz! Milchreis-Eis ist eine absolute Empfehlung! Die Kugelgröße ist angesichts des Preises absolut fair. Einziger Kritikpunkt ist die einfache Waffel, die man bei der Bestellung einer einzelnen Kugel erhält. ', NULL),
(127, 3, 117, '2025-05-12 16:11:20', 'Kugel', '4.4', '4.4', '4.6', NULL, 'Eisgeschmack und Waffel waren wirklich lecker! Kugelgröße völlig in Ordnung. Gerne wieder!', NULL),
(128, 3, 32, '2025-05-09 15:16:31', 'Kugel', '4.3', '4.5', '4.2', NULL, 'Kann nicht meckern, geschmacklich wirklich gut! Angesichts des Preises könnte nur die Kugel etwas größer sein', NULL),
(129, 2, 28, '2025-05-14 21:03:00', 'Softeis', '4.7', '4.1', NULL, '4.2', 'Wegen vorherigen Bewertungen mal hier mit dem Rad vorbeigefahren und mir ein leckeres Eis zusammengestellt - die Sorten und das Topping ,das du willst - Mega 💯', 'uploads/checkins/checkin_6824e8fed93723.65509359.jpg'),
(130, 22, 28, '2025-05-14 21:33:07', 'Softeis', '3.8', NULL, NULL, '4.0', 'Tolles Konzept, vielfältige Toppings und täglich wechselnde Sorten - empfehlenswert für Softeisschlecker ;)', NULL),
(131, 8, 163, '2025-05-15 05:38:51', 'Kugel', '3.6', '4.2', '3.6', NULL, 'Es gab keine Eistheke - man bekommt die Sorten genannt und muss sich blind entscheiden. Geschmacklich i.O. wobei das Erdbeereis etwas künstlich geschmeckt hat - Schokolade hingegen war durchaus lecker. Bonus war die Riesenwaffel in der die zwei Kugeln aber etwas verloren aussahen.', NULL),
(132, 4, 126, '2025-05-01 15:49:25', 'Kugel', '4.1', '4.2', '4.2', NULL, 'Absolutes durchschnittliches Eis. Für ein schnelles auf die Hand bei Bedarf geeignet!', NULL),
(134, 1, 165, '2025-05-15 15:39:53', 'Kugel', '4.7', '2.0', '3.8', NULL, 'Gerade eine Stunde nach der Neueröffnung von Marshners Eiscafé war ich dort um zwei Kugeln Eis zu essen.\r\nBei der großen Auswahl entschied ich mich für Zitrone und weiße Schoko-Crisp.\r\nDie Kugel Schoko-Crisp hatte eine gute Größe und beinhaltete einige Schoko bzw. Crisp Stückchen. Die Kugel Zitrone war dagegen etwas klein geraten, war aber erfrischend fruchtig-sauer.\r\nDie Waffel war groß aber von der pappigen Art.\r\nInsgesamt ein leckeres aber nicht überdurchschnittliches Eis-Erlebnis.', NULL),
(135, 1, 145, '2025-05-18 12:54:58', 'Kugel', '4.7', '3.0', '2.7', NULL, 'Direkt in der Nähe zum Schloss Lichtenwalde liegt idyllisch die Eisdiele Schöne.\r\n14 Sorten Auswahl + 2 Sorten Softeis erwarteten mich.\r\nDie Kugel Zimt war lecker zimtig aber nicht besonders groß, was aber bei einem Preis von 1,20€ auch total okay ist.\r\nDie Waffel war ein Zwischending zwischen knuspriger und pappiger. 😁', NULL),
(136, 25, 9, '2025-05-19 19:20:29', 'Softeis', '4.5', '4.1', NULL, '4.5', 'Ich liebe dieses Softeis. Sehr gute Preis-Leistung!  ', NULL),
(137, 1, 22, '2025-05-20 15:50:15', 'Kugel', '4.8', '4.7', '5.0', NULL, 'Wieder mal gab es riesige Kugel super leckeren Eises in einer großen knusprigen Waffel.\r\nAußerdem punktet die Eisdiele durch einen schönen gemütlichen Außenbereich.\r\nEine meiner Lieblings Eisdielen 🤩', NULL),
(138, 2, 10, '2025-05-20 21:23:56', 'Kugel', '4.5', '3.5', '4.0', NULL, 'Heute mal wieder eine klassische Kugel Schoko. Hat solide geschmeckt. Die Waffel ist halt immernoch Standard und recht trocken', NULL),
(139, 2, 60, '2025-05-20 21:31:27', 'Kugel', '4.9', '4.5', '3.5', NULL, 'So muss Mango schmecken! Vielfältiges Angebot und sehr lecker. Die Waffel ist nicht billig, aber auch nicht zu trocken, war mir sehr angenehm. Leider nur etwas kleine Kugeln', NULL),
(140, 25, 165, '2025-05-21 08:12:34', 'Kugel', '4.5', '4.0', '4.0', NULL, '', NULL),
(141, 1, 9, '2025-05-21 16:07:05', 'Softeis', '4.5', '1.8', '3.0', '4.0', 'Nach etlichen Checkins anderer Nutzer, wollte ich doch auch mal wieder die Eisdiele meiner Kindheit austesten.\r\nDie klassische Softeis Kombi Schoko-Vanille hat nicht enttäuscht, hat mich aber auch nicht aus den Socken gehauen.\r\n\r\nEin solides Softeis in guter Lage.', NULL),
(142, 1, 51, '2025-05-22 16:27:50', 'Kugel', '4.5', '4.3', '4.2', NULL, 'Direkt auf dem Altmarkt Zwickau gelegen, mit großem Außensitzbereich liegt das Dolce Freddo. \nEs gibt eine große Auswahl ausgefallener Sorten, die sich bunt und zu großen Haufen geschichtet auftürmen.\n\nMeine zwei Kugeln Salted-Butter-Caramel und Malaga wurden von der freundlichen Bedienung in einer vernünftigen Größe in einer knusprigen Waffel portionieriert.\n\nDas Eis war sehr sahnig / cremig und intensiv von Geschmack.\nMir fast schon etwas zu intensiv. Karamell oder Rosinenstückchen waren zu missen. Insgesamt aber schon ein leckeres Eis.', NULL),
(143, 19, 9, '2025-05-22 16:47:12', 'Softeis', '4.8', '2.5', NULL, '4.0', 'Anlaufstelle Nr. 1 für Softeis in der näheren Umgebung.\nGeschmacklich top. Die Waffel ist eher von der \"pappigen\" Art, da ist noch Luft nach oben.', NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

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
