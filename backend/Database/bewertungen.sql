-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:20
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
(7, 36, 1, NULL, NULL, NULL, 9, '', '2025-03-21 12:06:35'),
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
(138, 14, 1, NULL, NULL, NULL, 13, 'Hier gibt es täglich wechselndes Softeis.\nFür 50cent Aufpreis gibt es besondere (farbige) Waffeln die wohl auch verschiedene Geschmäcker haben.', '2025-04-30 14:24:58'),
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
(191, 145, 1, NULL, NULL, NULL, 16, 'Hier gibt es selbstgemachtes Eis und Torte / Kuchen. Das Angebot wechselt immer mal.\nDraußen ist eine gemütliche Terrasse zum verweilen.', '2025-05-18 11:31:11'),
(192, 9, 25, NULL, NULL, NULL, NULL, 'Gutes Softeis! Es ist erhältlich in den Sorten Schoko-Vanille oder Erdbeer-Vanille. Sitzgelegenheiten gibt es draußen & drinnen. ', '2025-05-19 17:14:02'),
(194, 60, 2, NULL, NULL, NULL, 22, 'Schöner belebter Außenbereich und auch zum Reinsetzen. Nun zum Eis:\nSo muss Mango schmecken! Vielfältiges Angebot und sehr lecker. Die Waffel ist nicht billig, aber auch nicht zu trocken, war mir sehr angenehm. Leider nur etwas kleine Kugeln', '2025-05-20 19:32:49'),
(196, 175, 2, NULL, NULL, NULL, 7, 'Sehr lecker italienisches Eis! Gute Kugelgröße. Ich hatte Fragola😜 einfach mega schön hier!', '2025-05-25 11:28:20'),
(197, 176, 2, NULL, NULL, NULL, 3, 'Passt schon, aber kein Tourziel unbedingt wert', '2025-05-26 11:16:14'),
(198, 177, 8, NULL, NULL, NULL, 19, 'Leckeres Eis mit vielen interessanten Sorten, ein Bonus sind die schwarzen Waffeln ', '2025-05-26 15:07:11'),
(199, 56, 1, NULL, NULL, NULL, 18, 'Sehr schönes Café in toller Lage mit großem Außensitzbereich und einer tollen Auswahl an Eissorten 😍\nDie Gegend lädt zu einem Ausflug ein und das Café ist auf jeden Fall einen Besuch wert.', '2025-05-27 13:45:41'),
(200, 89, 33, NULL, NULL, NULL, 20, '', '2025-05-27 16:41:31'),
(201, 184, 32, NULL, NULL, NULL, NULL, 'Hier findest du verschiedene Sorten Softeis, aber auch ein tolles Angebot an Bubblewaffeln. Askir Fresh besitzt eine kleine Sitzecke, auch einen kleinen Radständer. Da sich der Große Garten gleich in der Nähe befindet empfiehlt es sich meiner Meinung nach, vorallem an warmen Sommertagen, sich dann dort ein gemütliches Plätzchen auf einer Wiese oder Bank zu suchen. Im Sommer kann es hier gerade bei den Bubblewaffeln zu ein bisschen Wartezeit kommen. ', '2025-05-28 05:19:51'),
(202, 170, 1, NULL, NULL, NULL, 10, '', '2025-05-28 05:23:08'),
(203, 112, 1, NULL, NULL, NULL, 4, 'Hier gibt es lediglich Softeis, dafür 4 verschiedene Sorten und mit verschiedenen Toppings und Saußen. Es gibt auch immer vegane Optionen.\nDirekt anliegend ist der Gerhard-Hauptmann Platz ein schöner Park mit Spielplatz.', '2025-05-28 11:24:47'),
(205, 4, 1, NULL, NULL, NULL, 1, 'Es gibt hier immer nur eine Sorte im Angebot, diese wechselt aber ständig.\nSehr schöner Gartenbereich der zum Verweilen einlädt, nette Verkäuferin die mir auch schon öfters die Trinkflaschen fürs Fahrrad aufgefüllt hat.', '2025-05-29 13:57:37'),
(206, 21, 1, NULL, NULL, NULL, 13, 'Eine gute Auswahl ausgefallener Sorten, die man so nicht überall findet. Dazu gibt es auch Softeis, Eisbecher und einen schönen Außenbereich wo man sein Eis gemütlich in der Sonne essen kann.', '2025-05-30 14:17:39'),
(207, 193, 2, NULL, NULL, NULL, 2, 'Hier gibt\'s zum Bubbletea auch Softeis. Entweder Schoko/Vanille oder Melone/Mango. Als kleines Früchtchen hatte ich das zweite. Hatte im Becher bestellt, die Waffel sah standardmäßig für Softeis aus. Das kleine Eis an sich hatte eine okay Größe für den Preis. Geschmacklich wars nicht überragend, aber auch nicht schlecht.', '2025-05-30 16:23:56'),
(208, 194, 39, NULL, NULL, NULL, 16, 'Sehr nettes Personal, super leckere Eissorten mit großer Auswahl', '2025-05-30 16:39:38'),
(211, 195, 41, NULL, NULL, NULL, 10, 'Lieblingscafé am Nordufer des Cosspudener See, im Torhaus des Kees\'schen Parks. Eis draußen am Pavillon aber auch drinnen. Überschaubares Kugel-Angebot aber immer neue, ausgefallene Kreationen.\nViele weitere leckere Speisen, großes phantastisches Kuchenangebot. Herrlicher Außenbereich für jede Witterung, auch Rastplatz für mitgebrachte Speisen, drinnen zwei Etagen, jeden Tag 2 Suppen, großartiges Frühstücksbuffet.\nIm Winter frische Waffeln.', '2025-05-30 22:19:22'),
(213, 150, 1, NULL, NULL, NULL, 18, 'Gelegen im Erdgeschoss eines Plattenbaus liegt das Eiscafé Roßberg. Draußen gibt es einen schönen und großen Sitzbereich im Grünen.', '2025-05-31 12:03:53'),
(215, 199, 40, NULL, NULL, NULL, 2, 'Tolles Eis!', '2025-06-01 15:37:35'),
(216, 200, 40, NULL, NULL, NULL, NULL, 'Stracciatella und Caramel Sorbet, sehr köstlich', '2025-06-01 19:10:58'),
(221, 201, 40, NULL, NULL, NULL, NULL, 'Super', '2025-06-01 19:16:06'),
(223, 202, 2, NULL, NULL, NULL, 1, 'Sehr solides Softeis, leider nur Schoko/Vanille, aber dennoch sehr lecker und sahnig bzw. Cremig. Waffel ist Standard für softeis. Die Größe ist für das Geld auch iO :)', '2025-06-01 19:59:10'),
(224, 204, 41, NULL, NULL, NULL, 14, 'Selbstbedienung.\nSoft- und Kugeleis mit Liebe produziert. \nGetränke, Shakes und Eisbecher\n\nGroßer Freisitz mit Tischen und Bänken. Bäume und Pavillon sorgen für Schatten.\n\nVor dem Zaun gibt es einen Eisautomaten!\n', '2025-06-02 14:49:18'),
(225, 205, 1, NULL, NULL, NULL, 16, 'Kleines Lokal mit Eis-Fenster zur Straße.\nEs gibt Kugeleis und Softeis.\nDas Kugeleis hat mich nicht ganz überzeugt, das Softeis was die Kunden hinter mir hatten sah aber sehr gut aus, das werde ich wohl noch mal probieren 🤓', '2025-06-03 13:57:32'),
(226, 3, 1, NULL, NULL, NULL, 14, 'Kleines uriges Lokal, direkt am Marktplatz. Unter anderem gibt es Schwarzbier-Eis.\n', '2025-06-03 15:16:49'),
(230, 65, 1, NULL, NULL, NULL, 21, 'Ein großes altes Gebäude mit Eisdiele. Alles etwas in die Jahre gekommen und es gibt einen Spendenaufruf zum Erhalt des Gebäudes.\nAber die Eisdiele ist absolut genial, super Preise, sehr leckeres Eis, große Portionen, tolle Sorten und nettes Personal.\nEinen Besuch wert!', '2025-06-04 07:12:42'),
(234, 35, 1, NULL, NULL, NULL, 19, 'Direkt am Marktplatz in Chemnitz gelegen, gibt es hier Kaffee, Kuchen und auch einen Straßenverlauf für Eis.\n', '2025-06-04 12:39:55'),
(239, 207, 2, NULL, NULL, NULL, 6, 'Kleine Eisdiele in der Gaststätte beim Campingplatz. Ich hatte eine Kugel Schoko und eine Erdbeere. Geschmacklich ganz solide, aber für den Preis ziemlich klein :/', '2025-06-08 13:33:22'),
(240, 47, 2, NULL, NULL, NULL, 2, 'Es gibt hier zwar auch Kugeleis, ich würde aber nur das Softeis empfehlen. Das ist mega lecker und auch wirklich groß für den kleinen Preis', '2025-06-14 13:18:26'),
(241, 70, 1, NULL, NULL, NULL, 18, 'Schön gelegener Bäcker / Café mit Recht großen Eisangebot.\nWenn man draußen sitze hat man Blick auf die Wolkensteiner Schweiz.', '2025-06-15 12:39:46'),
(242, 213, 1, NULL, NULL, NULL, 19, 'Schön gelegener Bäcker, wo es neben leckeren Eis auch gute Kuchen zu vernünftigen Preisen gibt. 👍🏼', '2025-06-17 13:54:48'),
(249, 223, 1, NULL, NULL, NULL, 14, 'Die Bäckerei liegt direkt am Markt, es gibt ein Straßenverkaufsfenster für Eis, sowie einige Sitzgruppen draußen. Es gibt 12 Sorten Eis und 2 Sorten Softeis.', '2025-06-18 18:35:53'),
(250, 222, 1, NULL, NULL, NULL, 18, 'In einer Seitengasse gelegen gibt es hier ein Verkaufsfenster für Straßenverkauf.', '2025-06-18 18:38:24'),
(251, 234, 49, NULL, NULL, NULL, 12, '', '2025-06-20 15:22:55'),
(253, 249, 31, NULL, NULL, NULL, 16, 'sehr moderne Location mit extrem leckeren Eis und großen Kugeln ', '2025-06-23 07:37:01'),
(254, 254, 31, NULL, NULL, NULL, 24, 'Eisdiele befindet sich sehr zentral in der Stadt. Es gibt viele exklusive Eissorten. Der Geschmack ist sehr gut. Preis/Leistung passt nicht ganz. ', '2025-06-24 08:13:01'),
(255, 89, 1, NULL, NULL, NULL, 12, 'Die Sorten sehen alle toll aus, mit vielen Frucht- oder Schokostückchen. 😋\nDirekt auf dem Markt gelegen mit großem Außensitzbereich und auch Innen gibt es viele Sitzplätze.', '2025-06-24 14:35:50'),
(256, 258, 48, NULL, NULL, NULL, 24, 'Gute Lage im Büroviertel am Fluss. Bedienung sehr nett. Man kann auch mit Karte bezahlen ', '2025-06-24 16:14:42'),
(257, 259, 52, NULL, NULL, NULL, 2, 'Sehr schön eingerichtet, nettes Personal und es gibt leckere Eisbecher mit einer Vielzahl von Toppings', '2025-06-24 19:02:08'),
(258, 249, 52, NULL, NULL, NULL, NULL, 'Der wohl schönste eingerichtete Eisladen auf Zypern, viele Sorten und große Kugeln ', '2025-06-24 19:03:30'),
(259, 99, 1, NULL, NULL, NULL, 2, 'Hier gibt es täglich eine andere Sorte Softeis. Entweder pur oder gemischt mit Vanille.\nDie Lage ist nicht die schönste, dafür gibt es aber einen schön gestalteten Außenbereich mit vielen Sitzmöglichkeiten.\nDer Verkäufer war auch sehr nett.\n\nFür Softeis Fans lohnt es sich auf jeden Fall!', '2025-06-25 13:08:18'),
(260, 264, 52, NULL, NULL, NULL, NULL, 'Sehr zentral gelegen und schön bunt eingerichtet, aber leider nicht so freundliches Personal \n\n+ Punkt es gibt auch Eisrollen', '2025-06-25 19:06:24'),
(261, 237, 52, NULL, NULL, NULL, NULL, 'Viele Sorten, große Kugeln und freundliche Mitarbeiter\n\nMan kann sich gut hinsetzen und das Eis genießen', '2025-06-27 10:57:03'),
(263, 272, 53, NULL, NULL, NULL, 20, 'Gute Lage und große Eisportionen. Geschmacklich gut mit Verbesserungspotential', '2025-06-29 21:20:38'),
(264, 273, 4, NULL, NULL, NULL, 12, 'Berries ist Teil von Parkers Pizza. Es gibt eine große Auswahl an Waffeln, Milchshake, Bubbletea und und und. \nEs gibt aber auch ganz normales Kugeleis im Becher oder Waffel.', '2025-06-29 21:22:42'),
(265, 275, 53, NULL, NULL, NULL, 30, 'Tolle Eisdiele mit original italienischen Eis. Die 2,2€ ist jede Kugel wert. Tolle Sorten und Größen ', '2025-06-30 18:28:15'),
(266, 276, 53, NULL, NULL, NULL, 20, 'Schöne kleine, ruhig gelegen Eisdiele am Hafen. Leider war das Eis wahrscheinlich schon mal ein wenig aufgetaut ', '2025-07-01 09:53:03'),
(267, 279, 1, NULL, NULL, NULL, 24, 'Ich könnte vor der Bestellung verschiedenste Eissorten ausprobieren.\nDer Verkäufer war sehr zuvorkommend und freundlich und hat es sehr gut mit den Portionen gemeint 🤤😁\n\nSpäter am Tag habe ich gesehen, dass das Hotel ihr Eis von der nahe gelegenen Eisdiele \'L\'atelier d\'écrin glacé\' bezieht.', '2025-07-02 13:55:32'),
(268, 280, 53, NULL, NULL, NULL, 20, 'Kleines Café mit tollem Eis. Kann fast übersehen werden.\nDer Bauernmarkt nebenan ist auch zu empfehlen', '2025-07-02 19:15:21'),
(269, 281, 53, NULL, NULL, NULL, 32, 'Absolut geniale Eisdiele Mut jeder Menge ungewöhnlicher Sorten und tollem Blick auf die Altstadt von Rovinj', '2025-07-03 08:20:53'),
(270, 155, 1, NULL, NULL, NULL, 34, 'Hier gibt es eine große Auswahl an leckeren Eissorten. Davon rund ein Drittel Sorbet-Eis und der Rest Milch-Eis.\nDirekt am See / Strand gelegen.', '2025-07-04 18:03:15'),
(272, 288, 40, NULL, NULL, NULL, NULL, 'Gute Lage am Strand, ', '2025-07-05 12:16:34'),
(273, 16, 2, NULL, NULL, NULL, 16, 'Sehr zentrale Lage im Roten Turm, ist auf jeden Fall einen Besuch und ein Eis wert!', '2025-07-05 13:44:34'),
(274, 8, 31, NULL, NULL, NULL, 17, 'Schönes Cafe mit leckeren Eis, schöner Außenbereich mit mehreren Sitz Möglichkeiten und es gibt noch anderen Aktivitäten (wie mini Golf) ', '2025-07-05 16:22:27'),
(275, 294, 53, NULL, NULL, NULL, 12, 'Kleines aber feines Café in einer ganz tollen kleinen Altstadt', '2025-07-05 19:02:05'),
(276, 178, 52, NULL, NULL, NULL, NULL, 'Es gibt hier sehr nette Mitarbeiter, die Eisdiele ist gut mit dem Fahrrad, Auto und auch zu Fuß erreichbar. Man kann das Eis sowohl auch die Eisbecher auch mitnehmen.', '2025-07-06 14:33:00'),
(278, 288, 78, NULL, NULL, NULL, 24, '', '2025-07-06 15:18:59'),
(279, 297, 1, NULL, NULL, NULL, 32, 'Etwas versteckt, sehr liebenswerter netter Betreiber. Große Auswahl an Milcheis, Sorbets und Softeis.\nAnscheinend ein kleiner Geheimtipp gegenüber den Eisdielen welche direkt an der Strandpromenade gelegen sind.', '2025-07-06 16:45:52'),
(280, 298, 53, NULL, NULL, NULL, 30, 'Mega Eisdiele, alles vom Feinsten. Die Entscheidung fällt schwer', '2025-07-06 21:03:58'),
(281, 300, 53, NULL, NULL, NULL, 32, 'Viele Sorten, guter Geschmack, gibt aber bessere', '2025-07-06 21:12:12'),
(282, 302, 1, NULL, NULL, NULL, NULL, 'Hier gibt es hausgemachte Kekse und Eis und die Kombination aus beidem.\nZum Beispiel einen Eisbecher mit 2 Kugeln Eis, einem Keks und einen Toppings für 7,50€', '2025-07-07 20:35:32'),
(283, 303, 62, NULL, NULL, NULL, 30, 'Es gibt eine grosse Auswahl an eissorten', '2025-07-08 12:30:51'),
(284, 305, 81, NULL, NULL, NULL, 10, 'Tolle Lage. Direkt am Jagst-Radweg.', '2025-07-08 19:57:57'),
(286, 306, 53, NULL, NULL, NULL, 12, 'Kleine Eisverkauf am Lim Fjord. Zugekauftes Eis aber dafür recht gut.', '2025-07-08 20:11:40'),
(287, 307, 8, NULL, NULL, NULL, 10, 'Teuer  \nGeschmack i.O.  - wir erhielten eine Warnung vor dem Minze-Eis …tastes like tooth paste', '2025-07-08 20:35:52'),
(288, 316, 52, NULL, NULL, NULL, NULL, 'Meiner Meinung nach das Beste Eis in Glauchau, das Eis schmeckt nicht so künstlich es gibt große Eisbecher und man kann sich auch gut draußen hinsetzen.\nAllerdings sind die Eisbecher mit 8,50€ relativ teuer.', '2025-07-10 15:02:14'),
(289, 318, 48, NULL, NULL, NULL, 8, 'Als wir da waren, war die Auswahl nicht ganz so groß. Aber die Lage ist neben dem Parlament natürlich einwandfrei. ', '2025-07-10 17:03:08'),
(290, 319, 48, NULL, NULL, NULL, 10, 'Es war eher ein Imbiss, mit Brötchen und warmen Snacks. Der Besitzer hat aber auch eine kleine Eistruhe gehabt. Mit sehr leckeren und auch besonderen Sorten. Er war sehr nett, auch wenn er kein Englisch konnte ', '2025-07-10 17:17:34'),
(291, 320, 48, NULL, NULL, NULL, 20, 'Richtig ausgefallene Sorten, die ich so noch nie gesehen habe. Richtig cremig und super präsentiert. Ich glaube, der Eisstand des Restaurants hat aber nur im Sommer auf. Wenn man mit seinem Eis 1 min läuft (wenn es so lange hält) kann man sich an die Donau setzten und direkt auf das Parlament schauen.', '2025-07-10 17:30:34'),
(292, 321, 53, NULL, NULL, NULL, 18, 'Tolle Eisdiele in Fazana mit dem geschmacklich bestem Eis', '2025-07-10 19:31:16'),
(293, 325, 40, NULL, NULL, NULL, 2, 'Softeis', '2025-07-11 15:40:21'),
(294, 326, 40, NULL, NULL, NULL, NULL, 'Das beste Eis in Zürich!', '2025-07-11 15:43:47'),
(295, 322, 1, NULL, NULL, NULL, 24, 'Hier gibt es keine klassischen Kugeln als Portion, sondern man wählt eine Becher bzw. Waffelgröße und kann dann je nach Größe verschiedene Anzahl an Geschmacksrichtungen wählen.\nKleine Waffel / Becher: 1-2 Sorten\nMittlere Waffel / Becher: 2-3 Sorten\nGroße Waffel / Becher: 3-4 Sorten\n\nDie Eis werden dann mit einem Spachtel in der Waffel oder dem Becher platziert.\n\nEs gibt eine große Auswahl an Sorten, draußen sowie drinne einige schöne Sitzmöglichkeiten.', '2025-07-11 19:51:24'),
(296, 324, 1, NULL, NULL, NULL, 18, 'Eigentlich ein Wein und Souvenir Shop, gibt es hier auch einige Sorten Eis zum Kauf.\n\nDie Preisgestaltung ist etwas unlogisch. Dafür ist die erste Kugel für französische Verhältnisse Recht günstig.\nDie zweite Kugel ist noch günstiger. Aber wenn man eine 3. Kugel dazu bestellt kostet diese 3. Kugel wieder mehr als die zweite.', '2025-07-11 19:53:39'),
(297, 331, 1, NULL, NULL, NULL, 6, 'Kleiner Imbiss vor dem Château Chenonceau, der neben belegten Brötchen auch ein paar Sorten Eis anbietet. Allerdings zu stattlichen Preisen 😅', '2025-07-12 10:54:45'),
(298, 337, 53, NULL, NULL, NULL, 18, 'Eiskugeln in guter Größe, Geschmack gut aber etwas süß', '2025-07-14 09:26:26'),
(299, 351, 1, NULL, NULL, NULL, 38, 'Direkt an der Strandpromenade gelegen gibt es hier sehr viele Sorten Eis zur Auswahl.\nDer Preis ist mit 3,90€ pro Kugel ziemlich teuer, vor allem da die Kugeln nicht sonderlich groß sind.', '2025-07-17 21:16:45'),
(300, 362, 1, NULL, NULL, NULL, 15, 'Hier gibt es neben belgischen Waffeln auch eine beachtliche Auswahl an Eis für einen günstigen Preis (für Maastricht).\n', '2025-07-19 11:36:42'),
(301, 363, 45, NULL, NULL, NULL, 17, '', '2025-07-19 11:48:59'),
(302, 202, 62, NULL, NULL, NULL, NULL, 'Standard Soft-Eis: Schoko-Vanille,\nGeschmack gut, Waffel geht auch', '2025-07-20 11:52:51'),
(303, 178, 31, NULL, NULL, NULL, 14, 'Schöne Eisdiele mit Terrasse, Standart Eissorten + paar Ausgefallene Sorten, verschiedene Eisbecher, Cafe usw. ', '2025-07-21 13:27:22'),
(304, 273, 1, NULL, NULL, NULL, 14, 'Bei der Pizzeria Parker gibt es auch eine gute Auswahl ausgefallener Eissorten. In der Bubblewaffel oder auch im Becher oder einer normalen Waffel.\n\nDie Pizzen sind auch sehr zu empfehlen.', '2025-07-24 16:48:43'),
(306, 378, 8, NULL, NULL, NULL, 36, 'Mega lecker \nMega Auswahl\nAmerika-teuer', '2025-07-24 21:46:20'),
(307, 380, 1, NULL, NULL, NULL, 15, 'Direkt in der Nähe der Burg und der Talsperre Kriebstein gelegen, befindet sich das Garten / Eiscafé.\nHier gibt es Kaffee, Kuchen, Eisbecher.', '2025-07-25 12:37:16'),
(308, 381, 22, NULL, NULL, NULL, 14, 'Kleine Eisdiele mit sehr ausgefallenen Sorten. Die Bedienung ist nett und man bekommt immer eine kleine Probierkugel oben drauf in der Sorte, dieman möchte.', '2025-07-25 20:21:47'),
(309, 382, 40, NULL, NULL, NULL, 6, 'Täglich frisch gemacht wechselnde 6 Eissorten\n\nhttps://www.gaultmillau.ch/zuri-isst/eisvogel-das-beste-glace-zurich\n', '2025-07-26 16:40:22'),
(310, 383, 4, NULL, NULL, NULL, 10, 'Es gibt viele bekannte Sorten, aber auch nette Sommerkombination!\nKleine Auswahl an Sorbet Eis.', '2025-07-26 18:20:12'),
(311, 113, 1, NULL, NULL, NULL, 12, 'Das Eiscafé liegt direkt am Bahnhof und hat einen großen Innen wie auch Außenbereich, sowie ein kleines Fenster für den Straßenverkauf von Eis.\n\nPositiv zu erwähnen ist dass Kartenzahlung möglich ist.', '2025-07-27 09:44:00'),
(312, 111, 1, NULL, NULL, NULL, 20, 'Wunderschön idyllisch gelegen gibt es bei Klett jeden Sonntag zwischen 13 und 18 Uhr Eis und andere Verpflegung im Gartenhäuschen zu kaufen.\n\nEs gibt viele gemütliche Sitzgelegenheiten mitten im Grünen. Die Betreiberin war super freundlich und die Preise sind auch top.\n\nEs gibt eine gute Auswahl ausgefallener Sorten, die insgesamt alle sehr natürlich und kein bisschen künstlich oder zu süß schmecken.', '2025-07-27 12:29:59'),
(313, 386, 98, NULL, NULL, NULL, 10, 'Schöne Eisdiele. Toll gelegen. Immer viele Familien davor die Eis schlecken. Ein toller Ort für das Viertel. Eiskugeln könnte größer sein. ', '2025-07-27 14:17:42'),
(314, 290, 40, NULL, NULL, NULL, NULL, 'Schöne Eisdiele im Quartier ', '2025-07-27 15:54:22'),
(315, 387, 2, NULL, NULL, NULL, 12, 'Schöne Lage direkt am Gardasee, viele Sitzmöglichkeiten. Eis schmeckt sehr natürlich fruchtig ', '2025-07-28 13:01:51'),
(316, 389, 2, NULL, NULL, NULL, 26, 'Schöne Eisdiele to go, aber recht teuer. Sonst viel Auswahl ', '2025-07-29 12:10:33'),
(317, 392, 2, NULL, NULL, NULL, 30, 'Sehr nette Eisdiele in der wunderschönen Stadt Malcesine. Wenn du mal hier bist, gerne hier anhalten für ein Eis.  Italienisch lecker mit schönem Außenbereich', '2025-08-01 12:45:28'),
(318, 396, 63, NULL, NULL, NULL, 32, '', '2025-08-01 18:49:51'),
(319, 393, 8, NULL, NULL, NULL, 6, '', '2025-08-01 20:43:35'),
(320, 314, 1, NULL, NULL, NULL, 10, 'Ein sehr guter Handwerksbäcker mit großer Auswahl an Kuchen, Teilchen, Brötchen, Brot und eben auch einige Eis-Sorten.\n\nDie Eissorten die ich probierte waren sehr lecker und der Service super freundlich 👍🏼☺️\n\nSchön dass es noch solche tollen Bäcker gibt.', '2025-08-02 10:00:07'),
(321, 397, 2, NULL, NULL, NULL, 28, 'Schöne Auswahl von fruchtig bis schokoladig. Sehr tolle Lage in einer schönen italienischen Stadt', '2025-08-02 12:14:43'),
(322, 400, 8, NULL, NULL, NULL, 24, '', '2025-08-02 13:58:25'),
(324, 401, 2, NULL, NULL, NULL, 20, 'Schöne Lage am Hafen, viele Sitzmöglichkeiten. Das Eis ist etwas teuer aber ganz lecker. Kann man mal machen, wenn man Lust hat', '2025-08-03 12:10:43'),
(325, 402, 2, NULL, NULL, NULL, 12, 'Nach einer leckeren Mittagspause mit Spaghetti Cabonara musste trotzdem noch ein Eis her. Auch wenn es eigentlich gar nicht mehr reingepasst hat - deshalb ohne Waffel. Leider war das Eis zu schaumig, weshalb es nicht ganz so lecker war. Rein geschmacklich sonst ganz gut. Es gab gegenüber auch noch eine andere Eisdiele, da kostet das Eis aber 2,50€! 🤔😂', '2025-08-04 12:46:05'),
(326, 404, 48, NULL, NULL, NULL, NULL, 'Die Sortenvielfalt hängt tatsächlich von der Wetterprognose ab, wenn nicht so gutes Wetter gemeldet ist wird weniger produziert sagte mir der Verkäufer. Trotzdem eine riesige Auswahl und auch besondere Sorten. Die Kugel könnte ein kleine bisschen größer sein, aber für 1,80€ kann man sich in Berlin absolut nicht beschweren. Außerdem gibt es noch Milchshakes und viele Kaffeeprodukte und auch Eisbecher. Im Winter gibt es hier nur eine winzige Auswahl an Eis, aber dafür gebrannte Mandeln und kandierte Äpfel 😋\nDie Lage an einer Kreuzung von zwei Hauptstraßen ist nicht die allerbeste, aber ein Eis geht immer :) ', '2025-08-05 08:00:11'),
(331, 71, 109, NULL, NULL, NULL, 16, 'Schöne Lage am Schillerplatz. Es handelt sich um einen Straßenverkauf, man kann mit dem Eis aber gut neben dem Spielplatz des Schillergartens platznehmen.', '2025-08-05 14:15:22'),
(333, 405, 109, NULL, NULL, NULL, 4, 'Es handelt sich um einen Imbiss mit klassischen Speisen, der daneben auch Eis von IceGuerilla (eine regionale Eismanufaktur) anbietet. Schöne Lage am See. Leider gab es kein reines Fruchteis.', '2025-08-05 14:35:12'),
(334, 406, 81, NULL, NULL, NULL, 7, 'Kleiner Eiswagen am Radweg\n', '2025-08-06 13:01:03'),
(336, 57, 1, NULL, NULL, NULL, 1, 'Hier gibt es jeden Tag ein anderes Softeis. Dazu kann man verschiedene Soßen und Toppings kombinieren.\nAußerdem kann man auch andere Waffeln für einen Aufpreis bekommen.', '2025-08-06 14:41:54'),
(337, 39, 52, NULL, NULL, NULL, NULL, 'Ausgefallene Sorten und nettes Personal ', '2025-08-07 12:56:17'),
(339, 356, 53, NULL, NULL, NULL, 4, 'Toller Außenbereich und leckeres Softeis in 3 verschiedenen Größen. Empfehlenswert!', '2025-08-07 17:59:39'),
(340, 271, 31, NULL, NULL, NULL, 2, 'Sehr schöner Laden, mit extrem guten Softeis. \nTäglich neue Sorten Softeis, außerdem gibt es noch sämtliche andere Biowaren. ', '2025-08-08 08:46:46'),
(341, 39, 31, NULL, NULL, NULL, 20, 'Schöne Eisdiele mit ausgefallenen Sorten, zum drin und draußen Sitzen und vielen Angeboten. ', '2025-08-08 08:54:07'),
(342, 407, 40, NULL, NULL, NULL, NULL, 'Nette Eisdiele am Dorfplatz ', '2025-08-08 17:21:47'),
(343, 102, 4, NULL, NULL, NULL, 10, 'Klassische Standardsorten. Achtung im Cafe-Bereich wird eine Servicepauschale von 45% erhoben!\nEs gibt neben Eis auch Kuchen und Bockwurst 😄', '2025-08-09 12:49:00'),
(344, 34, 102, NULL, NULL, NULL, NULL, 'Meiner Meinung nach, die beste Eisdiele der Stadt. Sitzplätze direkt am Geschehen, freundliche Bedienung und richtig leckeres, selbstgemachtes Eis mit Liebe. Außerdem auch Waffeln und Sorten für Veganer:innen oder Personen mit Laktoseintoleranz.', '2025-08-09 16:45:55'),
(345, 26, 52, NULL, NULL, NULL, NULL, '', '2025-08-10 06:13:57'),
(346, 273, 2, NULL, NULL, NULL, 13, 'Hier gibt\'s viele Leckereien zum Vesper ;) Eis ist okay, so eine bubblewaffel bestimmt sehr geil', '2025-08-10 11:40:30'),
(347, 158, 1, NULL, NULL, NULL, 12, 'Hier handelt es sich um einen kleinen Container / Eisverkaufsstand an der Straße.\nEs gibt eine kleine Bank für 2 Personen als Sitzmöglichkeit, das war\'s.\nDie Lage ist so mäßig schön und die beiden Betreiber auch nur so mäßig freundlich.', '2025-08-10 16:03:23'),
(348, 409, 48, NULL, NULL, NULL, 28, 'Nette Mitarbeiter, und eine große Auswahl. Zwar keine Sitzplätze aber das ist nicht schlimm. -nur Kartenzahlung möglich ', '2025-08-10 16:31:00'),
(349, 410, 53, NULL, NULL, NULL, 6, 'Tolles Softeis und leckere Waffeln als Stärkung vor dem Krupka Climb', '2025-08-11 09:34:11'),
(350, 411, 1, NULL, NULL, NULL, 10, 'Ein süßer kleiner Straßenverkauf zum Fenster heraus in der Innenstadt von Altenburg.\nHier gibt es täglich wechselndes Softeis und dazu viele Sorten aus dem Froster zum Mitnehmen.', '2025-08-12 15:48:00'),
(351, 408, 53, NULL, NULL, NULL, 10, 'Klein aber fein. Neben den Backwaren, teilweise auch sehr lokal ala Karl-Marx Kuchen noch 10 Eissorten. Hier kann man mal schön Pause machen', '2025-08-13 14:23:03'),
(352, 239, 2, NULL, NULL, NULL, 7, 'Eine sehr schöne Location mit gemütlicher Ambiente. Gibt auch viele andere Leckereien, aber das Eisangebot ist leider recht klein', '2025-08-15 13:07:43'),
(353, 84, 1, NULL, NULL, NULL, 21, '', '2025-08-17 20:24:28'),
(354, 418, 52, NULL, NULL, NULL, NULL, 'sehr schöner und großer außenbereich man kann hier direkt ein Kanu ausleihen ', '2025-08-18 13:25:27'),
(355, 178, 1, NULL, NULL, NULL, 14, 'Recht große Eisdiele mit vielen Sitzmöglichkeiten im Inneren und einer Terrasse.', '2025-08-18 14:26:51'),
(357, 77, 1, NULL, NULL, NULL, 1, 'Hier gibt es nur Vanilleeis.\nUnd verschiedene Eisbecher damit, also mit Erdbeeren oder Sause.', '2025-08-20 14:11:10'),
(358, 50, 1, NULL, NULL, NULL, 18, '', '2025-08-20 15:04:49'),
(359, 93, 1, NULL, NULL, NULL, 22, 'Schöne Lage mitten in der Altstadt von Döbeln mit großem Außensitzbereich.', '2025-08-20 15:51:02'),
(360, 420, 2, NULL, NULL, NULL, 5, 'Sehr leckere und günstige Gaststätte, es gibt aber auch ein paar wenige Eissorten für einen günstigen Preis, wobei der Geschmack aber durchschnittlich ist', '2025-08-23 18:39:40'),
(361, 179, 1, NULL, NULL, NULL, 16, 'Unscheinbar gelegenes kleines liebevoll geführtes Café.\r\nEs gibt einige Sitzgelegenheiten außen wie auch Innen.\r\n', '2025-08-24 12:44:15'),
(362, 38, 1, NULL, NULL, NULL, 13, 'Direkt auf dem Marktplatz gelegen  viele Sitzplätze außen wie auch Innen.', '2025-08-25 13:59:50'),
(365, 422, 1, NULL, NULL, NULL, 10, 'Direkt am Waldbadneuwürschnitz gelegen gibt es einen kleinen Imbiss, wo es Kugeleis und auch eine Sorte Softeis gibt.', '2025-08-26 16:08:27'),
(366, 353, 1, NULL, NULL, NULL, 17, 'Das Schild Design, die Sorten und der Geschmack lässt darauf schließen, dass es hier das gleiche Eis gibt wie beim Eiscafé Elisenhof.\r\nWas aber tatsächlich eines meiner Lieblings-Eis ist 😋', '2025-08-27 15:13:24'),
(369, 423, 53, NULL, NULL, NULL, 16, 'Neu eröffnete Eisdiele der Podolski Kette. Schön eingerichtet und auch ein schöner Außenbereich auf der Klosterstraße. Hier fühlt man sich wohl.', '2025-08-27 18:39:09'),
(370, 88, 1, NULL, NULL, NULL, 2, 'Hier gibt\'s neben Kuchen, Kaffee und Brötchen auch Softeis. Es gibt Schoko, Vanille gemischt oder einzeln.', '2025-08-29 14:01:09'),
(371, 423, 1, NULL, NULL, NULL, 16, 'Hier sind die Eissorten in Rühr Maschinen gelagert, wo sie wirklich regelmäßig neu gerührt werden, was das Eis sehr cremig macht.\r\nAnsonsten mitten in der Innenstadt von Chemnitz gelegen mit vielen Sitzmöglichkeiten außen und netten Service.', '2025-08-29 16:17:39'),
(373, 433, 40, NULL, NULL, NULL, 12, 'Schöne Eisdiele mit kremigen Sorten in einer beliebten Gegend von Lissabon ', '2025-08-30 10:56:36'),
(375, 432, 1, NULL, NULL, NULL, 20, '', '2025-08-30 11:30:47'),
(376, 435, 1, NULL, NULL, NULL, 17, '', '2025-08-30 12:47:27'),
(378, 439, 53, NULL, NULL, NULL, 6, 'Kleine und feine Eisdiele ', '2025-08-31 18:39:39'),
(380, 104, 1, NULL, NULL, NULL, 2, 'Unscheinbar in zweiter Reihe gelegen befindet sich das kleine, charmante Eis-Café. Es gibt zwei Sorten Softeis und verschiedene (Eis)Kaffe Kreationen.', '2025-09-01 13:16:44'),
(381, 127, 1, NULL, NULL, NULL, 18, 'Mitten in der Fußgängerzone gibt es hier am Eisfenster Softeis und viele Sorten Kugeleis zu kaufen. Direkt davor gibt es einige Sitzmöglichkeiten.', '2025-09-01 13:59:38'),
(383, 442, 2, NULL, NULL, NULL, 7, 'Falls du nach dem Einkauf Lust auf ein Eis hast, bekommst du direkt noch beim Bäcker vor Ort eins. Auch wenn es kein Highlight ist, schmeckt es nicht schlecht. Leider sind die Kugeln für den Preis recht klein ', '2025-09-01 19:23:00');

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
