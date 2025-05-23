-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 23. Mai 2025 um 11:15
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
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
(10, 1, 1, '4.7', '4.5', '3.8', 14, 'Sehr leckeres Ei, die Kugeln sind ordentlich groß und den Preis wert.\n\nEs lohnt sich 2 Kugeln oder mehr zu nehmen, ab dann gibt es eine besser schmeckende knusprige Waffel. Bei einer Kugel bekommt man leider nur eine kleine \'pappige\'.', '2025-03-24 16:44:36'),
(11, 32, 1, '4.6', '2.0', '4.3', 18, 'Das Eis war lecker und hat intensiv nach Eierlikör geschmeckt. Für 2€ war die Kugel schon sehr klein. Die Waffel war war schlank und knusprig, fast etwas zu knusprig für meinen Geschmack. Auffällig ist, dass ich Eierlikör-Nougat bei einer anderen Eisdiele schon hatte wo es exakt gleich geschmeckt hat und die gleichen Waffeln verwendet wurden.', '2025-03-24 17:50:13'),
(12, 11, 1, '4.8', '4.2', '4.7', 16, 'Sehr leckeres Eis in einer super großen leckeren Waffel. Die Auswahl umfasst jetzt weniger ausgefallene Sorten, aber trotzdem alles lecker. Besonders die Sorte Milchreis kann ich empfehlen.', '2025-03-27 08:57:04'),
(17, 26, 1, '4.3', '3.0', '4.5', 20, 'Ich hatte eine Kugel Mango und eine Kugel Cookies. Die Kugel Mango war sehr groß, die Cookie Kugel hingegen eher klein. Insgesamt schon sehr solide, aber es könnten zum Beispiel mehr Cookie Stückchen im Eis sein.', '2025-03-27 15:15:06'),
(18, 47, 1, '3.2', '2.7', '1.8', 7, 'Sehr günstiges Eis, allerdings nur die Sorten Erdbeere, Vanille, Schoko und Himmelblau für 1€ und die Sorten haben eher nach billig Discounter Eis geschmeckt. Die restlichen 3 Sorten kosteten 1,50€, wobei Heidelbeere recht lecker war. Die Kugeln waren eher klein und die Eiswaffel nicht gut.', '2025-03-28 15:55:33'),
(19, 55, 1, '4.6', '4.1', '4.8', 18, 'Eine gute Auswahl an leckeren Sorten. Ich hatte eine Kugel Erdbeerkäsekuchen, welche ziemlich gut geschmeckt hat.\nFür 1,50 € in Verbindung mit einer sehr leckeren, knusprigen Waffel eine wirkliche Empfehlung.', '2025-03-28 17:05:17'),
(20, 58, 1, '2.5', '1.7', '3.0', 7, 'Sehr liebevolles Café mit wirklich tollen, leckeren Kuchen und Torten zu sehr fairen Preisen, aber leider war das Eis nicht wirklich gut. Es hatten sich schon Kristalle gebildet, was vielleicht daran liegen mag, dass es insgesamt wenig besucht ist. Sehr schade :(', '2025-03-30 11:23:34'),
(22, 22, 1, '4.8', '4.4', '4.7', 18, 'Ich hatte eine Kugel Schoko-Praline. Die war äußerst lecker, mit vielen Nuss / Pralinen Stückchen. Und für 1,30€ die Kugel äußerst groß.\nDie Waffel war auch sehr lecker und angenehm groß.', '2025-04-02 04:04:01'),
(25, 31, 1, '4.7', '4.3', '3.5', 2, 'Beliebter Softeisstand auf dem Markt in Kietscher. Es gab zwei verschiedene gemischte Softeis zur Auswahl in klein und groß für 1,50 bzw. 2,50 € und für 20 Cent Aufpreis gab es Streusel auf das Eis.', '2025-04-02 14:55:24'),
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
(65, 81, 1, '4.9', '4.5', '4.7', 16, '', '2025-04-09 07:22:27'),
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
(113, 118, 1, '4.6', '5.0', '4.6', 30, 'Eine super Auswahl von ca. 30 Sorten, davon ziemlich viele ausgefallene. Die Kugeln waren die größten die ich bis jetzt jemals bekommen habe. Das Eis war lecker, aber bei der Geschmacksintensität ist noch bisschen Raum nach oben. Insgesamt eine große Empfehlung.', '2025-04-26 00:17:09'),
(118, 75, 1, NULL, NULL, NULL, 3, 'Hier gibt es einen Automaten, wo man Vanille-Softeis pur, mit Erdbeerfruchtzubereitung oder Soße mit Schokogeschmack bekommen kann.', '2025-04-27 13:45:01'),
(120, 123, 2, '4.0', '3.0', '3.0', 22, 'Ich hatte eine Kugel Waldmeister, war ganz okay mal zur Abwechslung. Gibt eine überraschen große Auswahl zwischen Fruchtiges und Schokoladiges/Cookies etc. Nur die Kugelgröße hätte für den Preis besser sein können (1,90€)', '2025-04-27 15:33:12'),
(121, 32, 3, '4.6', '4.0', '4.5', NULL, 'Ich entschied mich bei meinem Besuch am Milchkännchen für die Premiumsorte Joghurt-Sanddorn, womit ich definitiv eine gute Wahl traf. Der Geschmack wirkt ausgefallen/aufregend und vertraut zugleich. Auch mit seiner cremigen Konsistenz wusste das Eis zu überzeugen, abgerundet von einer leckeren und knusprigen Waffel. Eine Premiumsorte hat jedoch mit 2,20€ einen Preis, dem die Kugelgröße nicht ganz gerecht wird. Bei einem anschließenden Spaziergang am Schloßteich schmeckt das Eis gleich nochmal besser. ', '2025-04-27 16:30:16'),
(122, 124, 4, '4.5', '5.0', '4.0', 12, 'Waffel nicht getestet. \nEiskugeln waren sehr groß \n', '2025-04-27 17:44:38'),
(123, 121, 1, '3.4', '1.7', '3.5', 2, 'Das Schoko Vanille Softeis hat etwas wie Zott Monte Joghurt geschmeckt nur etwas weniger intensiv. Die größte war angemessen und die Waffel wie bei Softeis fast immer eher pappig.', '2025-04-27 18:56:38'),
(125, 125, 7, '4.0', '5.0', '5.0', 1, 'Es gibt am WALKTEICH neben zahlreichen Imbisssnacks nur Softeis.\nBei diesem kann man wählen, ob man Vanille, Schokolade oder die Mischung haben möchte.\nDie Größe fand ich dem Preis angemessen.\nHervorzuheben ist der wunderbare Außenbereich mit tollen Sitzmöglichkeiten und Schattenplätzen am Teich. \nEs gibt zudem eine große Speisenauswahl und eine reichhaltige Getränkekarte.', '2025-04-27 19:28:12'),
(126, 42, 1, '4.6', '4.7', '4.6', 18, 'Das Eiscafé Piccolo bietet eine große Auswahl leckerer Sorten an, wobei jede Sorte 1,60€ kostet.\nMeine Sorten Himbeere und Nougat konnten überzeugen und die Portionen waren für den Preis sehr gut.\nDer Verkäufer war sehr nett und plauderte etwas mit mir. 😅', '2025-04-28 14:35:01'),
(130, 92, 1, '4.9', '4.5', '4.3', 16, 'Die Eisdiele Saneto hat ein breites Sortiment an Kugel- und Softeis, wobei es auch viele ehere besondere Sorten gibt. Premiumsorten kosten mit 2,20€ dabei 20cent mehr als die restlichen Sorten.\n\nIch hab mich für Eierlikör-Nougat und Quark-Zitrone entschieden, welche beide sehr sahniges, intensiv und lecker schmeckend waren.\nBesonders der Eierlikör Geschmack kam gut zur Geltung\nAls weitere Besonderheit gibt es einen 24/7 Automat an dem man sich abgepacktes Eis holen kann.\n', '2025-04-29 14:26:23'),
(138, 14, 1, NULL, NULL, NULL, 13, '', '2025-04-30 14:24:58'),
(139, 106, 1, '5.0', '4.9', '4.7', 21, 'Ein tolles Eiscafé mit einer süßen kleinen Sitzecke auf dem Bürgersteig. Es gibt eine große Auswahl an ausgefallenen Sorten. Ich hatte je eine Kugel Kirsch-Schoko und Baileys. Das Eis war fantastisch lecker, besonders die Kugel Schoko-Kirsch glänzte mit einer Vielzahl an ganzen Kirschen und vielen Schokostückchen. 😍 Ein absolutes Geschmackshighlight, besser kann Eis nicht schmecken! \nEs gibt auch Bubble Waffels im Angebot', '2025-04-30 15:03:43'),
(142, 126, 1, '4.4', '3.0', '3.5', 16, 'Die Kugel Cheesecake-Waldbeere war lecker und mit einigen kleinen Beeren drinnen.\nIch habe mir für 40 Cent Aufpreis eine Schokowaffel gegönnt, welche sich nicht gelohnt hat. Die Waffel war selber etwas pappig und die Schokolade und Streusel haben den Geschmack nicht so aufgewertet wie erhofft. ', '2025-05-01 15:38:54'),
(144, 126, 4, '4.1', '4.2', '4.2', 18, 'Absolutes durchschnittliches Eis. Für ein schnelles auf die Hand bei Bedarf geeignet!', '2025-05-01 18:39:45'),
(145, 12, 7, '4.0', '5.0', '3.5', 5, 'In Hübschmanns Eislädl gibt es immer drei Sorten frisches Softeis. Das Angebot wechselt dabei stets.\nDen Klassiker Schoko-Vanille bieten sie immer an. Dazu kommen dann noch zwei ausgefallenere Sorten. Heute waren es noch Erdbeere-Vanille und Schoko-Kokos.\nZudem gibt es viele verschiedene Sorten Softeis im Becher, dieses ist jedoch nicht „frisch gezapft“.\nAb dem großen Softeis gibt es eine leckere knusprige Waffel.\nEmpfehlenswert sind auch die Eisbecher (kleine aber feine Auswahl!) und die Eisschokolade bzw. -kaffee.\nWas ich heute zum ersten Mal gesehen habe: Man kann sich das Softeis auch in selbst mitgebrachte Behälter abfüllen lassen.', '2025-05-01 19:06:04'),
(146, 132, 2, '4.4', '4.8', '4.8', 40, 'Ein echt schönes Eiscafe in der Innenstadt von Pirna. Es gibt eine große Auswahl an Kugeleis (ca. 40 Sorten) aber auch an Softeis (z.B. Mango oder Kokos). Leider nur Selbstbedienung aber dafür sehr empfehlenswert (gibt zB auch Crepes)', '2025-05-02 04:52:41'),
(147, 45, 1, '3.9', '4.0', '4.0', 8, 'Das Kugeleis ist Standard und schmeckt okay, der Preis von 1€ pro Kugel macht es interessant.\nBemerkenswert ist das Softeis, die kleine Portion für 1€ war super lecker und für den Preis auch sehr groß!', '2025-05-02 11:22:56'),
(148, 128, 10, '4.0', '4.0', NULL, 12, 'Solides Eis, aber mit Abstrichen im Service und der Präsentation\n\nNach längerer Zeit haben wir der Eisdiele wieder einen Besuch abgestattet – das schöne Wetter lud einfach zu einem Eisbecher ein. Anschließend ging es für einen Spaziergang an den nahegelegenen See.\n\nDas Eis war geschmacklich gut, die Portionen angemessen, und es hat uns allen geschmeckt. Besonders gefallen haben uns der Nougatbecher (mit vier Nougatstückchen, Sahne und passenden Eissorten), der Bananensplit (mit frischen Bananenscheiben, Sahne sowie Vanille- und Bananeneis), der Jogurettenbecher (wobei statt Joguretteneis leider Joghurteis verwendet wurde) und ein Kinderbecher. Insgesamt haben wir für vier Becher 36 € bezahlt – ein aus unserer Sicht etwas hoher Preis, vor allem, da Sortenänderungen mit 1 € extra pro Becher berechnet werden. Positiv zu erwähnen ist, dass Kartenzahlung möglich ist.\n\nIm Vergleich zu früher hat die Eisdiele jedoch etwas nachgelassen. Es gibt keine Bedienung mehr am Tisch – man bestellt an der Theke und trägt das Eis selbst zum Platz. Auch die Präsentation der Eisbecher war eher schlicht und wenig liebevoll gestaltet. Gerade bei den Preisen hätten wir uns hier mehr Mühe und Kreativität gewünscht.\n\nEin großer Pluspunkt ist jedoch der tolle Spielplatz am örtlichen See: Kinder erwartet dort eine Seilbahn, eine Rollenrutsche (Tipp: Brotkiste oder Sitzunterlage selbst mitbringen) sowie zahlreiche Klettermöglichkeiten – ein echtes Highlight für Familien.\n\nFazit: Wer ein solides Eis in guter Lage genießen möchte, wird hier fündig. Wer aber Wert auf freundlichen Service und optisch ansprechende Eisbecher legt, könnte etwas enttäuscht sein. Mit etwas mehr Liebe zum Detail wäre deutlich mehr möglich – das tolle Freizeitangebot in der Nähe gleicht jedoch einiges wieder aus.\n', '2025-05-02 11:31:58'),
(149, 134, 1, '4.7', '4.3', '4.7', 17, 'Eine sehr große leckere Waffel, die Kugel Butterkeks war sehr lecker und hatte einige Keks und Schokostückchen.', '2025-05-02 12:05:10'),
(155, 135, 1, '4.0', '2.7', '1.0', 10, 'Das Eis war leider nichts besonderes. Ich liebe eigentlich Weiße Schokolade, aber geschmacklich hätte man deutlich mehr raus holen können. Dazu kommt noch die wirklich unterirdische Waffel. Tipp: lieber nebenan bei Eiscafé Ys für 10 Cent mehr ein deutlich besseres Eis kaufen.', '2025-05-02 15:19:49'),
(157, 133, 1, '2.1', '2.7', '3.0', 3, 'Hier gibt es nur Softeis, welches abgepackt aus dem Tiefkühler geholt wird und durch eine Softeispresse gedrückt wird.\nIst halt keine Eisdiele oder Café sondern ein Gemischtwarenladen.\nUm den akuten Eishunger zu stillen schon ganz gut, ein Geschmackshighlight sollte man hier nicht erwarten.', '2025-05-02 15:28:30'),
(160, 136, 1, '4.5', '4.0', NULL, 5, 'Hier gibt es nur Eisbecher zur Auswahl. Mein Eisbecher Orion für 80czk war sehr lecker und für den Preis auch gut groß.', '2025-05-03 11:32:13'),
(161, 137, 11, '4.0', '1.0', '1.0', 8, '', '2025-05-05 07:03:57'),
(162, 46, 5, '4.9', '4.9', NULL, NULL, 'Top Eisdiele in richtig guter Lage, perfekt für einen kurzen Stopp. Freundliches Team, alles sauber und entspannt. Man merkt, dass hier mit Liebe gearbeitet wird. ', '2025-05-05 09:26:18'),
(163, 118, 5, '4.8', '4.0', NULL, 25, 'Eis war lecker, Kugeln durchschnittlich groß. Es gab auch ein paar ausgefallenere Sorten wie „Dubai Chocolate“. Auswahl insgesamt sehr gut. Der Besitzer wirkte eher mäßig freundlich, aber an und für sich trotzdem empfehlenswert.', '2025-05-05 09:31:54'),
(166, 139, 5, '4.5', '3.5', NULL, 15, 'Wirklich leckeres Sorbet, Milchreis eher durchschnittlich. Man zahlt hier klar auch für die Lage.', '2025-05-06 18:26:51'),
(174, 115, 1, '4.0', '3.5', '2.8', 2, 'Hier gibt es ausschließlich Softeis in zwei Geschmackskombinationen.\n\nSo cremig das Softeis ist, so schnell war es auch verputzt.\nBei Waffel und Größe muss ich ein paar Abzüge machen und der Geschmack war etwas künstlich, aber ich vermute damit muss man bei Erdbeer Softeis rechnen.', '2025-05-10 12:38:00'),
(177, 125, 2, '4.4', '3.8', '4.0', 1, 'Sehr schöner Zwischenstopp. Direkt am Teich mit vielen Sitzmöglichkeiten. Außerdem gibt\'s dort auch viel sonstige Verpflegung. Softeis leider nur eine Größe und nur Schoko Vanille. War aber solide. Die Waffel ist knusprig und im Stile einer kugeleiswaffel', '2025-05-10 13:25:42'),
(179, 162, 11, '4.5', '4.0', '4.0', 10, 'Eisdiele mit einer kleinen Wiese und Sitz sowie Spielmöglichkeiten. Manchmal seltsame Kunden. Sehr Kinderfreundlich. Topings möglich', '2025-05-10 18:52:44'),
(181, 117, 1, '4.6', '4.8', '3.8', 16, 'Eine sehr große Kugel Eis, der Gummibären Geschmack war interessant und lecker und tatsächlich fällt mir keine bessere Beschreibung ein als \'hat authentisch nach Gummibärchen geschmeckt\' 😅 Die Waffel ist eher im Mittelfeld an zu siedeln.', '2025-05-12 15:41:50'),
(184, 28, 1, '4.4', '4.3', '5.0', 6, 'Ein sehr ausgefallenes Konzept. Bei n\'Eis zapfen wählt man einen Becher oder eine Waffel und kann sich dann beliebig 6 Sorten Softeis und einer großen Auswahl an Toppings ein Eis (oder auch eher einen Eisbecher) zusammen stellen.\nNeben Softeis kann man sich wohl auch Hot-Dogs zusammenstellen. Das teste ich aber erst, sobald ich eine App für Hot-Dogs entwickelt habe :D', '2025-05-13 14:31:59'),
(188, 163, 8, '3.6', '3.6', '4.2', 7, 'Es gab keine Eistheke - man bekommt die Sorten genannt und muss sich blind entscheiden. \n\nGeschmacklich i.O. wobei das Erdbeereis etwas künstlich geschmeckt hat - Schokolade hingegen war durchaus lecker. \n\nBonus war die Riesenwaffel in der die zwei Kugeln aber etwas verloren aussahen. \n', '2025-05-14 19:53:06'),
(189, 165, 1, NULL, NULL, NULL, 24, '\"Marschner\'s Eiscafé\", kein anderes Lokal hat wohl in der Region so eine Bekanntheit und einen Ruhm für Eisgenuss.\nUm so herber war der Schock, als die Eisdiele letztes Jahr auf einmal geschlossen hatte und die Zukunft ungewiss war.\nHeute (am 15.05) öffnete die Eisdiele mit dem alten Betreiber wieder ihre Pforten!\nEs gibt eine große Auswahl an ausgefallenen Sorten und ein Preis System von 1,80€ / 2,00€ / 2,20€ pro Kugel.\n\nSchön ist der neu angelegt Park in unmittelbarer Nähe.', '2025-05-15 11:48:10'),
(191, 145, 1, NULL, NULL, NULL, 16, '', '2025-05-18 11:31:11'),
(192, 9, 25, NULL, NULL, NULL, NULL, 'Gutes Softeis! Es ist erhältlich in den Sorten Schoko-Vanille oder Erdbeer-Vanille. Sitzgelegenheiten gibt es draußen & drinnen. ', '2025-05-19 17:14:02'),
(194, 60, 2, NULL, NULL, NULL, 22, 'Schöner belebter Außenbereich und auch zum Reinsetzen. Nun zum Eis:\nSo muss Mango schmecken! Vielfältiges Angebot und sehr lecker. Die Waffel ist nicht billig, aber auch nicht zu trocken, war mir sehr angenehm. Leider nur etwas kleine Kugeln', '2025-05-20 19:32:49');

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
