-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 23. Mai 2025 um 11:19
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
-- Tabellenstruktur für Tabelle `attribute`
--

CREATE TABLE `attribute` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `attribute`
--

INSERT INTO `attribute` (`id`, `name`) VALUES
(4, 'ausgefallene Sorten'),
(10, 'Bubblewaffles'),
(8, 'Eis zum Mitnehmen '),
(3, 'Eisbecher im Angebot'),
(12, 'Gebrannte Mandeln '),
(7, 'guter Kaffee '),
(6, 'schöner Außenbereich'),
(13, 'Slush'),
(9, 'Softeis'),
(11, 'sonstige Verpflegung'),
(2, 'tolle Lage'),
(1, 'vegane Optionen'),
(5, 'wechselndes Angebot');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `awards`
--

CREATE TABLE `awards` (
  `id` int NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `awards`
--

INSERT INTO `awards` (`id`, `code`, `category`, `created_at`) VALUES
(1, 'county_visit', 'Eisdielen in verschiedenen Landkreisen', '2025-04-23 09:49:27'),
(2, 'checkin_count', 'Anzahl an Checkins', '2025-04-23 11:42:00'),
(3, 'count_kugeleis', 'Anzahl gegessener Kugeln Eis', '2025-04-23 11:42:44'),
(4, 'count_softice', 'Anzahl gegessener Softeis', '2025-04-23 11:42:58'),
(5, 'count_sundea', 'Anzahl gegessener Eisbecher', '2025-04-23 11:43:12'),
(6, 'count_photos', 'Anzahl an Checkins mit Foto', '2025-04-23 11:43:46'),
(7, 'count_pricesubmit', 'Anzahl Preismeldungen', '2025-04-24 09:26:22'),
(8, 'count_iceshopsubmit', 'Anzahl eingetragener Eisdielen', '2025-04-24 09:32:56'),
(9, 'all_ice_types', 'Jede Form von Eis ist wunderbar!', '2025-04-25 01:35:21'),
(10, 'Fuerst_pueckler', 'Vanille, Erdbeer und Schoko Eis eingecheckt ', '2025-04-25 01:46:35'),
(11, 'perfect_week', '7 Tage lang jeden Tag Eis eingecheckt ', '2025-04-25 02:04:56'),
(12, 'bundesland_count', 'Eisdielen in verschiedenen Bundesländern', '2025-04-25 04:48:25'),
(13, 'day_streak', 'Anzahl besuchter Eisdielen an einem tag', '2025-05-04 18:22:58'),
(14, 'distance_ice_traveler', '2 Eisdielen - 100km Entfernung an einem Tag', '2025-05-07 18:53:11'),
(15, 'Route_creator', 'Erstelle öffentliche Routen', '2025-05-07 19:40:15'),
(16, 'private_route_creator', 'Private Routen erstellt', '2025-05-08 12:30:37'),
(17, 'Stammkunde', 'Anzahl bei gleicher Eisdiele eingecheckt', '2025-05-09 09:22:54'),
(18, 'Geschmackstreue', 'Anzahl eine Eissorte gegessen', '2025-05-09 09:27:44'),
(19, 'laender_besucht', 'Eis in bestimmten Ländern eingecheckt', '2025-05-10 11:32:23');

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
(7, 1, 1, 3, 'uploads/award_icons/682d6347e611e_ChatGPT Image 21. Mai 2025, 07_22_15.png', 'Grenzgänger mit Geschmack', 'Du hast Eisdielen in 3 verschiedenen Landkreisen besucht! Dein Eishunger kennt keine Gemeindegrenzen – du bist auf süßer Entdeckungsreise.'),
(8, 1, 2, 5, 'uploads/award_icons/682ee7ea544cd_ChatGPT Image 22. Mai 2025, 10_48_34.png', 'Der Landkreis-Löffler', '5 Landkreise, 5 mal Eisliebe neu entdeckt! Du weißt: Jede Region hat ihre eigene Kugel-Philosophie – und du bist mittendrin.'),
(9, 1, 3, 7, 'uploads/award_icons/68303be9f0d21_ChatGPT Image 23. Mai 2025, 11_10_57.png', 'Kreisläufer auf Eis-Mission', '7 Landkreise voller Kugelkunst liegen hinter dir! Du bist ein echter Eis-Explorer, dein Gaumen hat schon fast einen eigenen Reisepass.'),
(10, 1, 4, 10, 'uploads/award_icons/682d6448599c9_ChatGPT Image 21. Mai 2025, 07_26_47.png', 'Der Eis-Nomade', '10 Landkreise, 10 mal Glück! Wo du auftauchst, schmilzt das Eis – und die Herzen gleich mit. Du bist die mobile Legende der Schleckkultur.'),
(11, 1, 5, 20, 'uploads/award_icons/682d64a4a0d8b_21. Mai 2025, 07_12_42.png', 'Der Landkr(eis)könig', '20 Landkreise? Du bist die höchste Eisdielen-Instanz im Umkreis von 200 Kilometern. Wer dir folgt, folgt dem Geschmack.'),
(12, 6, 1, 1, 'uploads/awards/award_6808d7097cc6e.png', 'Erster Schnappschuss', 'Du hast dein allererstes Foto eingereicht – ein historischer Moment! Jetzt wissen wir: Du kannst nicht nur Eis essen, sondern auch knipsen.'),
(13, 6, 3, 20, 'uploads/awards/award_6808d733e0df6.png', 'Der Eisfluencer', '20 visuelle Eiswerke später: Du bringst Glanz in jede Waffel und Stil in jeden Becher. Insta-worthy durch und durch!'),
(14, 6, 4, 50, 'uploads/awards/award_6808d7638faaa.png', 'Fotogeschmacksexperte', '50 mal Eis, 50 mal Klick – du dokumentierst Eiskunst wie ein Profi. Deine Galerie ist eine Ode an den Sommer.'),
(15, 6, 2, 10, 'uploads/awards/award_6809f6c323bbe.png', 'Kugel-Knipser', '10 Fotos, 10 mal Genuss im Bildformat! Deine Kamera liebt Eis fast so sehr wie du – weiter so!'),
(16, 6, 5, 100, 'uploads/awards/award_6809f8a524f5e.png', 'Der Paparazzi des Speiseeises', '100 Fotos? Du bist der Meister der eiskalten Momentaufnahmen. Wenn irgendwo Eis serviert wird, bist du mit der Linse schon da.'),
(22, 9, 1, 1, 'uploads/awards/award_680ae7ac902bf.png', 'Heilige Dreifaltigkeit', 'Du hast das Eis-Universum komplettiert: Kugeleis, Softeis und Eisbecher – alle genossen! Ein wahrer Eis-Gläubiger auf Pilgerreise zum ultimativen Genuss.'),
(23, 10, 1, 1, 'uploads/awards/award_680ae9bb9320f.png', 'Fürst Pückler ', 'Du bist ein echter Klassiker! Mit Vanille, Erdbeer und Schoko hast du die legendäre Fürst-Pückler-Kombination vollendet. Ein Hoch auf deinen traditionellen Geschmack!'),
(24, 11, 1, 1, 'uploads/awards/award_680aee0db3554.png', 'Perfekte Woche ', '7 Tage, 7 Eisdielen, 7 Glücksmomente! Du hast eine ganze Woche lang täglich Eis eingecheckt – wahrlich eine perfekte Woche voller süßer Abenteuer'),
(27, 3, 1, 3, 'uploads/awards/award_680a357b235ed.png', 'Kugel-Kenner', '3 Kugeln Eis – du weißt, was schmeckt! Deine Geschmacksknospen haben sich gerade aufgewärmt – das Abenteuer hat gerade erst begonnen.'),
(28, 3, 2, 10, 'uploads/awards/award_680a35a2d3362.png', 'Triple-Scooper', '10 Kugeln – du jonglierst Sorten wie ein echter Profi! Du bist auf dem besten Weg zur Eis-Elite.'),
(29, 3, 3, 50, 'uploads/awards/award_680a35c35870e.png', 'Eisberg voraus!', '50 Kugeln! (Kein Scherz.) Du bist offiziell eine wandelnde Eisdiele. Deine Lieblingssorte kennt dich beim Namen.'),
(30, 3, 4, 100, 'uploads/awards/award_680a35e047707.png', 'Der Kugel-Kapitän', '100 Kugeln – du steuerst souverän durch jede Eiskarte. Dein Löffel ist dein Kompass, dein Magen ein Tresor für Glück.'),
(31, 3, 5, 200, 'uploads/awards/award_680a3634585f6.png', 'Die Legende der Löffel', '200 Kugeln?! Du bist ein Mythos unter Eisfreunden. Irgendwo erzählt man sich Geschichten über dich – der oder die, der alles probiert hat. Mehrfach.'),
(32, 8, 1, 1, 'uploads/awards/award_680b6aab6fcc0.png', 'Eisdielen-Entdecker', 'Du hast deine erste Eisdiele eingetragen. Der Anfang einer leckeren Reise!'),
(33, 8, 2, 3, 'uploads/awards/award_680b6ac7bec0d.png', 'Eisdielen-Kundschafter', 'Drei neue Eisdielen von dir entdeckt – danke für die Vielfalt!'),
(34, 8, 4, 10, 'uploads/awards/award_680b6c6685927.png', 'Eisdielen-Botschafter', 'Mit zehn neuen Eisdielen hast du die Karte spürbar erweitert.'),
(35, 7, 1, 1, 'uploads/awards/award_680b70853fa69.png', 'Preis-Späher', 'Du hast den ersten Preis entdeckt – Wissen ist Kugel-Macht!'),
(36, 7, 2, 5, 'uploads/award_icons/682ee58829bf5_5 PREISE GEMELDET.png', 'Preis-Detektiv', '5 Preise aufgespürt – du bringst Licht ins Preis-Dunkel!'),
(37, 7, 3, 10, 'uploads/award_icons/682ee79251e00_ChatGPT Image 22. Mai 2025, 10_57_21.png', 'Preis-Profi', 'Deine Meldungen helfen anderen, nicht aufs (Eis-)Glatteis geführt zu werden!'),
(38, 7, 4, 25, 'uploads/award_icons/68303b8850e48_ChatGPT Image 23. Mai 2025, 11_08_52.png', 'Preis-Pionier', 'Du sorgst für Transparenz im Eis-Dschungel – Chapeau!'),
(39, 7, 5, 50, 'uploads/award_icons/68303c63e8f74_ChatGPT Image 23. Mai 2025, 11_13_30.png', 'Kugel-Kommissar', 'Du hast den Preis-Finger am Puls der Kugel und hast schon 50 Preise für Eis gemeldet – echte Aufklärungsarbeit!'),
(40, 2, 1, 1, 'uploads/awards/award_680b74ac2beaa.png', 'Erster Löffel!', 'Dein erster Check-in – wie aufregend! (1/∞) Der Start eines großen Abenteuers, mit vielen leckeren Kugeln und klebrigen Fingern. Jetzt geht’s erst richtig los!'),
(41, 2, 2, 3, 'uploads/awards/award_680b7678539f0.png', 'Eis-Entdecker', '3 Check-Ins und du bist schon auf Entdeckungstour! Neue Sorten, neue Orte – dein Löffel hat sich offiziell auf die Reise gemacht.'),
(42, 8, 3, 5, 'uploads/awards/award_680b7741d9ce8.png', 'Eisdielen Influencer', 'Fünf Eisdielen hast du auf die Karte gebracht – echte Pionierarbeit!'),
(43, 8, 5, 20, 'uploads/awards/award_680b789583229.png', 'Reiseguru für Eisdielen', '20 neue Eisdielen? Wahnsinn! Ohne dich wäre die Eislandschaft nur halb so süß.'),
(44, 4, 1, 1, 'uploads/awards/award_680b78ddb85fb.png', 'Softie-Starter', 'Dein allererstes Softeis! (1 Softeis) Noch wackelt die Waffel – aber der erste Schleck ist gemacht. Willkommen in der cremigen Welt der Drehmaschinen!'),
(45, 2, 3, 5, 'uploads/awards/award_680bb72e3099e.png', 'Schnupper-Profi', 'Mit 5 Check-Ins bist du kein Anfänger mehr. Dein Bauch freut sich, dein Gaumen kennt schon so einiges – und du weißt: Es geht noch mehr!'),
(46, 2, 4, 10, 'uploads/awards/award_680bb7957c22f.png', 'Stammgast in Spe', '10-mal eingecheckt – man kennt dich! Die Kugelverkäufer nicken dir zu. Noch ein paar Besuche, und du bekommst den Ehrenlöffel.'),
(47, 2, 5, 20, 'uploads/awards/award_680bb81fd37a2.png', 'Eis-Kenner', '20 Check-Ins sprechen eine klare Sprache: Du bist ein Genießer mit Erfahrung. Du erkennst gute Sorten blind – und isst trotzdem mit offenen Augen.'),
(48, 2, 6, 50, 'uploads/awards/award_680bb90c0f608.png', 'Eisdielen-Legende', 'Schon 50-mal eingecheckt! Man erzählt sich von dir – du bist der oder die mit dem unersättlichen Hunger nach Kugelglück.'),
(49, 2, 7, 100, 'uploads/awards/award_680bb947a5fdc.png', 'Großmeister der Gelaterias', 'Du bist nicht einfach Genießer – du bist Legende. Hundertfach eingecheckt, hundertfach gefeiert. Dein Weg ist gepflastert mit Eiskugeln und Ruhm!'),
(50, 2, 8, 200, 'uploads/awards/award_680bb971e5094.png', 'Unaufhaltbarer Eis-König', 'Zweihundert Checkins, unzählige Sorten – du herrschst über das Reich des Eises wie kein anderer. Eine Legende auf zwei Rädern mit einem unstillbaren Appetit auf Genuss!'),
(51, 4, 2, 3, 'uploads/awards/award_680bbb0e33857.png', 'Dreher der Herzen', '3-mal hast du dir ein Softeis gegönnt – das ist wahre Liebe in Spiralform! Dein Geschmackssinn hat jetzt offiziell den Swirl-Segen.'),
(52, 4, 3, 10, 'uploads/awards/award_680bbb252723c.png', 'Softe(r) Profi', '10 Softeis – du weißt genau, wie man die perfekte Höhe balanciert, ohne dass es tropft. Du bist bereit für extra Toppings und neidische Blicke.'),
(54, 5, 1, 1, 'uploads/awards/award_680f137b91177.png', 'Der erste Becher-Zauber', 'Du hast deinen allerersten Eisbecher verputzt! Ein kleiner Schritt für dich, ein großer Schritt für deine Liebe zum Eis.'),
(55, 5, 2, 3, 'uploads/awards/award_680f148944647.png', 'Becher-Bändiger', 'Drei Becher Eis? Du hast den Bogen raus! Dein Löffel ist jetzt offiziell dein Zauberstab.'),
(56, 12, 1, 2, 'uploads/awards/award_6811ca84adcf4.png', 'Grenzenloser Genuss', 'Du hast Eis in mindestens zwei verschiedenen Bundesländern geschleckt – echte Geschmacksexpedition mit Bundesländer-Bonus!'),
(57, 12, 2, 3, 'uploads/awards/award_68133071047d9.png', 'Dreiländer-Eis', 'Egal ob Nord, Süd oder irgendwo dazwischen – du bist quer durchs Land gereist und hast in drei Bundesländern Eisgenuss verbreitet.'),
(58, 12, 3, 4, 'uploads/awards/award_681330b5e67cd.png', 'Eisland-Erkunder', 'Du hast schon in vier Bundesländern Eis getestet – dein Gaumen kennt keine Landesgrenzen mehr!'),
(59, 12, 4, 5, 'uploads/awards/award_68133125997cc.png', 'LandesmEISter ', 'Fünf Bundesländer, fünfmal Eis – du bist auf dem besten Weg, zum Champion der Eis-Republik zu werden.'),
(60, 13, 1, 2, 'uploads/awards/award_6817be87d4265.png', 'Zwei auf einen Streich', 'Du hast zwei verschiedene Eisdielen an einem Tag besucht. Ein klarer Fall von Doppelt hält besser – oder einfach doppelt lecker!'),
(61, 13, 2, 3, 'uploads/awards/award_6817bf1c410ef.png', 'Eistripple', 'Drei Eisdielen an einem Tag – du bist offiziell auf Eis-Sightseeing-Tour!'),
(62, 13, 3, 4, 'uploads/awards/award_68190b3322ac0.png', 'Eis-Marathon', 'Vier Eisdielen, ein Tag – du hast Ausdauer bewiesen. Das war ein Eis-Marathon der Extraklasse!'),
(63, 13, 4, 5, 'uploads/awards/award_6819910757f21.png', 'Grand Schleck-Tour', 'Fünf Eisdielen an einem Tag – das ist wahre Hingabe! Du hast Geschichte geschrieben.'),
(64, 5, 3, 5, 'uploads/awards/award_6819f90d1c110.png', 'Meister der Becherkunst', 'Fünf Becher – und jedes Mal ein neues Abenteuer! Du bist auf dem besten Weg zum Eis-Sommelier.'),
(65, 14, 1, 1, 'uploads/awards/award_681bacbc937b0.png', 'Kilometer-Kugler', 'Zwei Eisdielen, ein Tag – und mehr als 100 Kilometer dazwischen!\r\nDu hast keine Mühen gescheut und bist dem Eis hinterhergereist.\r\nEgal ob mit dem Rad, dem Auto oder zu Fuß – das war ein weiter Weg für deinen Geschmack!\r\n(Mindestens 100 km Distanz zwischen den besuchten Eisdielen an einem Tag)'),
(66, 15, 1, 1, 'uploads/awards/award_681bb7932be9e.png', 'Wege zum Glück', 'Du hast deine erste Route geteilt – der Weg zum Eis ist jetzt offiziell schöner geworden!\r\n'),
(67, 15, 2, 3, 'uploads/awards/award_681bb847b0a75.png', 'Touren Tüftler ', 'Drei geniale Routen – du weißt einfach, wie man Rad- und Eisfreude perfekt kombiniert!'),
(68, 15, 3, 5, 'uploads/awards/award_681dc92f54104.png', 'GPS-Gourmet', 'Dein Geschmack kennt nicht nur bei Eis keine Grenzen – auch bei der Routenwahl liegst du goldrichtig! Du hast bereits 5 öffentliche Routen erstellt.'),
(69, 17, 1, 10, 'uploads/awards/award_681dc99975457.png', 'Stammkunde', 'Du bist nicht einfach ein Gast – du bist Institution! Zehnmal hast du derselben Eisdiele die Treue gehalten. Ob für das beste Pistazieneis der Stadt oder die charmante Kugelverkäuferin: Deine Loyalität ist preisverdächtig – und jetzt offiziell ausgezeichnet!'),
(70, 16, 1, 1, 'uploads/awards/award_681dc9f04fbaf.png', 'Eis-Schmuggler-Route', 'Du hast eine Route nur für dich geplant – ein exklusiver Weg zum Eisgenuss im Verborgenen!'),
(71, 18, 1, 20, 'uploads/awards/award_681dcab3633d6.png', 'Geschmackstreue', 'Vanille? Zitrone? Mango-Chili? Egal welche Sorte – du hast dich entschieden. Über 20-mal treu geblieben und jeder Kugel mit Hingabe begegnet. Diese geschmackliche Konsequenz verdient Respekt – und diesen Award.'),
(72, 15, 4, 10, 'uploads/awards/award_681f3091364e2.png', 'Routen-Ritter', 'Zehn Wege zur eisigen Ehre – du bringst Menschen auf Kurs in Sachen Genuss!'),
(74, 15, 5, 20, 'uploads/awards/award_681f3556122df.png', 'Komootisseur', 'Du bist nicht nur Eisliebhaber, sondern auch echter Pfadfinder des guten Geschmacks! Du hast bereits 20 öffentliche Routen erstellt.'),
(75, 19, 1, 3, 'uploads/awards/award_681f39a9cd717.png', 'Gelato Italiano', 'Du hast Eis in Italien eingecheckt – dort, wo die süßeste Versuchung zuhause ist!'),
(77, 19, 2, 2, 'uploads/awards/award_6820b536335c9.png', 'Zmrzlina-Zeit', 'Du hast in Tschechien Eis genossen – ein Hoch auf unsere Nachbarn und ihre kühle Köstlichkeit!'),
(78, 5, 4, 10, 'uploads/awards/award_6823936fd3bca.png', 'Becher-Kapitän', 'Zehn Eisbecher, unzählige Sorten – du steuerst zielsicher durch das Meer der Geschmacksexplosionen!'),
(79, 5, 5, 20, 'uploads/awards/award_682393fe340d1.png', 'Eis-Experte', 'Zwanzig Becher später ist klar: Du bist kein Genießer von gestern – du bist ein echter Eis-Experte mit ausgeprägtem Geschmackssinn und Durchhaltevermögen! 🍨💪'),
(80, 5, 6, 50, 'uploads/awards/award_682394c3a8d40.png', 'Eiskrone', 'Fünfzig Eisbecher – das ist nicht nur Leidenschaft, das ist Legende.\r\nDu hast dich zur wahren Majestät der gefrorenen Genüsse emporgeschleckt.\r\nDie Krone gehört dir – und sie ist aus Waffel. 👑🍦'),
(81, 4, 4, 20, 'uploads/awards/award_6823957de5bd5.png', 'Softeismeister', 'Zwanzigmal purer Genuss auf der Zunge – du bist ein wahrer Wirbelwind im Reich der cremigen Krönchen!'),
(82, 4, 5, 50, 'uploads/awards/award_68239653bb960.png', 'Der Eis-Overlord: 50 Softeis besiegt', 'Dieser besondere Award wird an all jene verliehen, die sich tapfer durch 50 Softeisportionen gekämpft haben – eine wahre Meisterleistung der Zuckergeschmacksnerven und Ausdauer! Der Weg zu diesem Preis ist nicht nur ein süßer Genuss, sondern auch eine wahre Herausforderung für den Gaumen. Herzlichen Glückwunsch für deinen eisigen Ehrgeiz!'),
(83, 7, 6, 100, 'uploads/awards/award_68272fab9b4be.png', 'Legendärer Preis-Entdecker', 'Du hast Einhundert Eisdielen mit Preisangaben versorgt – dein Preisradar ist legendär! Diese goldene Trophäe mit edlem Schliff und funkelnden Details zeichnet deinen Beitrag zur Eis-Transparenz gebührend aus.'),
(84, 7, 7, 250, 'uploads/awards/award_68272fbbc517e.png', 'Eispreis-König der Nation', 'Du hast die magische Marke von 250 Preis-Meldungen durchbrochen – und damit Eisdielen-Geschichte geschrieben. Dieser prunkvolle Award mit farbigen Edelsteinen ist das Zeichen deiner unermüdlichen Suche nach der Wahrheit in der Waffel.');

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

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bewertung_attribute`
--

CREATE TABLE `bewertung_attribute` (
  `bewertung_id` int NOT NULL,
  `attribut_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bewertung_attribute`
--

INSERT INTO `bewertung_attribute` (`bewertung_id`, `attribut_id`) VALUES
(6, 1),
(95, 1),
(22, 2),
(32, 2),
(39, 2),
(120, 2),
(125, 2),
(146, 2),
(162, 2),
(163, 2),
(166, 2),
(177, 2),
(179, 2),
(191, 2),
(95, 3),
(97, 3),
(108, 3),
(122, 3),
(145, 3),
(160, 3),
(189, 3),
(8, 4),
(19, 4),
(32, 4),
(56, 4),
(97, 4),
(113, 4),
(120, 4),
(121, 4),
(130, 4),
(139, 4),
(144, 4),
(145, 4),
(146, 4),
(163, 4),
(184, 4),
(189, 4),
(194, 4),
(145, 5),
(4, 6),
(22, 6),
(32, 6),
(39, 6),
(54, 6),
(95, 6),
(106, 6),
(108, 6),
(120, 6),
(121, 6),
(125, 6),
(146, 6),
(166, 6),
(177, 6),
(179, 6),
(194, 6),
(76, 7),
(125, 7),
(179, 7),
(130, 8),
(145, 8),
(148, 8),
(162, 8),
(163, 8),
(179, 8),
(192, 8),
(10, 9),
(25, 9),
(146, 9),
(147, 9),
(157, 9),
(177, 9),
(179, 9),
(184, 9),
(191, 9),
(192, 9),
(139, 10),
(184, 10),
(177, 11),
(179, 11),
(188, 11),
(179, 12),
(179, 13);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bilder`
--

CREATE TABLE `bilder` (
  `id` int NOT NULL,
  `nutzer_id` int DEFAULT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `checkin_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `bewertung_id` int DEFAULT NULL,
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bilder`
--

INSERT INTO `bilder` (`id`, `nutzer_id`, `url`, `checkin_id`, `shop_id`, `bewertung_id`, `beschreibung`, `erstellt_am`) VALUES
(7, 1, 'uploads/checkins/checkin_67fcad38dbe008.16084263.jpg', 2, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(8, 1, 'uploads/checkins/checkin_67fcae2c2fc8e6.70329833.jpg', 3, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(9, 1, 'uploads/checkins/checkin_67fcaf85da9ed8.19217297.jpg', 4, NULL, NULL, '', '2025-05-12 07:58:45'),
(10, 1, 'uploads/checkins/checkin_67fcc5f2c2ef09.25124588.jpg', 5, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(11, 1, 'uploads/checkins/checkin_67fcc7ebe632b0.02776064.jpg', 6, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(12, 1, 'uploads/checkins/checkin_67fd15c8bb2e97.40523118.jpg', 7, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(13, 1, 'uploads/checkins/checkin_67fd17064276b7.37796337.jpg', 9, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(14, 1, 'uploads/checkins/checkin_67ffc349f1bb54.42476866.jpg', 10, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(15, 1, 'uploads/checkins/checkin_6801084f859771.78778651.jpg', 11, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(16, 1, 'uploads/checkins/checkin_6807750090a880.99200391.jfif', 16, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(17, 1, 'uploads/checkins/checkin_680775c23a3b90.94454860.jpg', 17, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(18, 1, 'uploads/checkins/checkin_6807764881a7d7.92172451.jpg', 18, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(19, 1, 'uploads/checkins/checkin_680776a0e5f966.43189762.jpg', 19, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(20, 1, 'uploads/checkins/checkin_68077724b19388.99511766.jpg', 20, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(21, 1, 'uploads/checkins/checkin_6807779bcd13c8.48200144.jpg', 21, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(22, 1, 'uploads/checkins/checkin_68077831306e46.00666877.jpg', 22, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(23, 1, 'uploads/checkins/checkin_680778b7809bd9.23540954.jpg', 23, NULL, NULL, '', '2025-05-12 07:58:45'),
(24, 1, 'uploads/checkins/checkin_6807ab80cd8189.01435225.jpg', 24, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(25, 1, 'uploads/checkins/checkin_6808a3cc294272.31810929.jpg', 25, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(26, 1, 'uploads/checkins/checkin_6808a50f008879.38210265.jpg', 26, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(27, 1, 'uploads/checkins/checkin_680b257f5ecd81.04364034.jpg', 52, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(28, 1, 'uploads/checkins/checkin_680b260953a2c6.04111238.jpg', 53, NULL, NULL, '', '2025-05-12 07:58:45'),
(29, 1, 'uploads/checkins/checkin_680b27215c9cd7.16477511.jpg', 54, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(30, 1, 'uploads/checkins/checkin_680b296ce5fe31.37610516.jpg', 55, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(31, 1, 'uploads/checkins/checkin_680b29e24a1a94.15558268.jpg', 56, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(32, 1, 'uploads/checkins/checkin_680b2a64289c96.21068159.jpg', 57, NULL, NULL, '', '2025-05-12 07:58:45'),
(33, 1, 'uploads/checkins/checkin_680cbfe340a0f3.28355942.jpg', 58, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(34, 1, 'uploads/checkins/checkin_680e1f8730cad0.81147935.jpg', 59, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(35, 2, 'uploads/checkins/checkin_680e5115747b78.57634651.jpeg', 60, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(36, 1, 'uploads/checkins/checkin_680fb580b86b28.07088248.jpg', 66, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(37, 1, 'uploads/checkins/checkin_6810e166df05f3.24970135.jpg', 67, NULL, NULL, '', '2025-05-12 07:58:45'),
(38, 1, 'uploads/checkins/checkin_68123e4a243b37.88534837.jpg', 68, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(39, 1, 'uploads/checkins/checkin_68138d592fb452.11491787.jpg', 69, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(40, 7, 'uploads/checkins/checkin_6813c7869ac873.22346198.jpeg', 70, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(41, 2, 'uploads/checkins/checkin_68145039ded7a2.25747482.jpg', 71, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(42, 1, 'uploads/checkins/checkin_68149e40c22588.10598712.jpg', 72, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(43, 1, 'uploads/checkins/checkin_6814a972d52041.20148645.jpg', 73, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(44, 1, 'uploads/checkins/checkin_6814aad52eec93.08796872.jpg', 74, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(45, 1, 'uploads/checkins/checkin_6814b5dca10765.62455648.jpg', 75, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(46, 1, 'uploads/checkins/checkin_6814bf2b0120d1.06227474.jpg', 76, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(47, 1, 'uploads/checkins/checkin_6814c0b8ce0d18.70274899.jpg', 77, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(48, 2, 'uploads/checkins/checkin_6814c3655972b8.42912882.jpg', 78, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(49, 1, 'uploads/checkins/checkin_6817231a672452.85536664.jpg', 79, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(50, 4, 'uploads/checkins/checkin_6817a70a08cfe3.05723235.jpg', 83, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(51, 11, 'uploads/checkins/checkin_681862f7115e29.67987507.jpg', 87, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(52, 5, 'uploads/checkins/checkin_68188390300dc2.92346935.jpg', 88, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(53, 1, 'uploads/checkins/checkin_681a319c0f3650.93239872.jpg', 90, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(54, 1, 'uploads/checkins/checkin_681df76554f668.70865736.jpg', 102, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(55, 2, 'uploads/checkins/checkin_681e0e80e91e47.61909818.jpg', 103, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(56, 1, 'uploads/checkins/checkin_681f48291b6963.89816226.jpg', 112, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(57, 2, 'uploads/checkins/checkin_681f76299e0064.75169438.jpg', 113, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(58, 4, 'uploads/checkins/checkin_681f7f2b22fa65.49786419.jpg', 114, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(59, 11, 'uploads/checkins/checkin_681fa199dd3487.87433737.jpg', 115, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(60, 11, 'uploads/checkins/checkin_681faa7bc33fe5.53794950.jpg', 116, NULL, NULL, NULL, '2025-05-12 07:58:45'),
(65, 1, 'uploads/checkins/checkin_682223ea6293f9.94009304.jpg', 122, NULL, NULL, '', '2025-05-12 16:38:02'),
(67, 1, 'uploads/checkins/checkin_682359da670ec2.98346301.jpg', 125, NULL, NULL, 'Meine Eis Kreation war zugegeben etwas wild', '2025-05-13 14:40:27'),
(68, 1, 'uploads/checkins/checkin_682359daad2635.18538038.jpg', 125, NULL, NULL, '', '2025-05-13 14:40:27'),
(69, 1, 'uploads/checkins/checkin_682359daef48e5.51099933.jpg', 125, NULL, NULL, 'So sieht die Eiszapfanlage aus', '2025-05-13 14:40:27'),
(71, 3, 'uploads/checkins/checkin_6824068552da17.81679062.jpg', 128, NULL, NULL, '', '2025-05-14 02:57:09'),
(72, 22, 'uploads/checkins/checkin_6824eff304dca2.82017208.jpg', 130, NULL, NULL, '', '2025-05-14 19:33:07'),
(80, 2, 'uploads/checkins/checkin_6825816a025960.81425973.jpg', 129, NULL, NULL, '', '2025-05-15 05:53:46'),
(81, 1, 'uploads/checkins/checkin_6825eea8e41c81.01153952.jpg', 134, NULL, NULL, '', '2025-05-15 13:39:53'),
(82, 8, 'uploads/checkins/checkin_68263592034128.94300237.jpg', 131, NULL, NULL, '', '2025-05-15 18:42:26'),
(83, 1, 'uploads/checkins/checkin_6829bc82222c41.96793537.jpg', 135, NULL, NULL, '', '2025-05-18 10:54:58'),
(84, 1, 'uploads/checkins/checkin_6829bc827358f7.07476791.jpg', 135, NULL, NULL, '', '2025-05-18 10:54:58'),
(85, 1, 'uploads/checkins/checkin_6829ea0f08e1d7.90384474.jpg', 135, NULL, NULL, '', '2025-05-18 14:09:19'),
(86, 25, 'uploads/checkins/checkin_682b685cab6ab4.78521055.jpg', 136, NULL, NULL, '', '2025-05-19 17:20:29'),
(87, 1, 'uploads/checkins/checkin_682c8896cf4292.02598669.jpg', 137, NULL, NULL, '', '2025-05-20 13:50:15'),
(88, 1, 'uploads/checkins/checkin_682c88972aab76.93454985.jpg', 137, NULL, NULL, '', '2025-05-20 13:50:15'),
(89, 2, 'uploads/checkins/checkin_682cd6cc1e5165.86032742.jpg', 138, NULL, NULL, '', '2025-05-20 19:23:56'),
(90, 2, 'uploads/checkins/checkin_682cd88ee60319.13545651.jpg', 139, NULL, NULL, '', '2025-05-20 19:31:27'),
(91, 1, 'uploads/checkins/checkin_682dde0989da53.09815305.jpg', 141, NULL, NULL, '', '2025-05-21 14:07:05'),
(92, 1, 'uploads/checkins/checkin_682f3466601311.17972328.jpg', 142, NULL, NULL, '', '2025-05-22 14:27:50'),
(93, 19, 'uploads/checkins/checkin_682f38f031db78.71212780.jpg', 143, NULL, NULL, 'Kleines Softeis für 2€. Schoko-Vanille ', '2025-05-22 14:47:12');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bundeslaender`
--

CREATE TABLE `bundeslaender` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `iso_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `land_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `bundeslaender`
--

INSERT INTO `bundeslaender` (`id`, `name`, `iso_code`, `land_id`) VALUES
(1, 'Thüringen', 'DE-TH', 1),
(2, 'Sachsen-Anhalt', 'DE-ST', 1),
(3, 'Sachsen', 'DE-SN', 1),
(5, 'Brandenburg', 'DE-BB', 1),
(6, 'Nordwesten', NULL, 2),
(7, 'Bayern', 'DE-BY', 1),
(8, 'Lombardei', 'IT-25', 3),
(9, 'Grand Est', 'FR-GES', 4),
(10, 'Okzitanien', 'FR-OCC', 4),
(11, 'Luzern', 'CH-LU', 5);

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

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `checkin_sorten`
--

CREATE TABLE `checkin_sorten` (
  `id` int NOT NULL,
  `checkin_id` int NOT NULL,
  `sortenname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bewertung` decimal(2,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkin_sorten`
--

INSERT INTO `checkin_sorten` (`id`, `checkin_id`, `sortenname`, `bewertung`) VALUES
(2, 2, 'Nogger', '3.5'),
(3, 2, 'Tiramisu', '3.3'),
(4, 3, 'Amarena-Kirsch', '4.5'),
(5, 3, 'Cookies', '4.5'),
(7, 5, 'Schokolade', '2.6'),
(8, 5, 'Heidelbeere', '3.8'),
(9, 6, 'Erdnuss', '5.0'),
(10, 6, 'Weiße Schokolade ', '4.9'),
(11, 7, 'Cookies', '5.0'),
(12, 7, 'Salted Caramel', '5.0'),
(13, 7, 'Brombeer Holunder', '5.0'),
(17, 9, 'Bueno', '4.7'),
(18, 10, 'Weiße Schokolade mit Himbeere', '4.7'),
(19, 10, 'Nuss-Nougat', '4.7'),
(20, 10, 'Chilli Schokolade', '4.8'),
(21, 10, 'Dubai Style', '4.6'),
(22, 11, 'Erdbeerkäsekuchen ', '4.6'),
(23, 12, 'Cookies ', '4.2'),
(24, 12, 'Schokolade', '4.2'),
(27, 14, 'Schoko/Vanille', '4.4'),
(29, 16, 'gebrannte Mandeln', '4.9'),
(30, 17, 'Kalter Hund', '4.9'),
(31, 18, 'After Eight', '4.8'),
(33, 20, 'Milchreis', '4.9'),
(34, 21, 'Mango', '4.3'),
(35, 21, 'Cookies', '4.3'),
(36, 22, 'Schoko-Praline', '4.8'),
(38, 24, 'Zimt ', '4.9'),
(39, 24, 'Malaga ', '4.7'),
(40, 25, 'Heidelbeere', '3.9'),
(41, 26, 'Cookies', '4.8'),
(42, 26, 'Bella Ciao', '4.8'),
(49, 39, 'Schoko/Vanille', '4.7'),
(56, 52, 'Heidelbeere', '4.6'),
(59, 54, 'Wildpreiselbeere', '4.6'),
(60, 55, 'Straciatella', '2.5'),
(67, 60, 'Waldmeister', '4.0'),
(68, 61, 'Vanille', '4.5'),
(69, 62, 'Joghurt-Sanddorn', '4.6'),
(75, 59, 'Schoko/Vanille', '3.4'),
(76, 58, 'Lemoncurd', '4.8'),
(77, 58, 'Mohn Marzipan ', '4.6'),
(84, 66, 'Himbeere', '4.6'),
(85, 66, 'Nougat', '4.6'),
(96, 68, 'Schoko-Kirsch', '5.0'),
(97, 68, 'Baileys', '4.9'),
(100, 69, 'Cheesecake-Waldbeere', '4.5'),
(102, 71, 'Mango', '4.5'),
(103, 70, 'Erdbeere-Vanille', '4.5'),
(108, 75, 'Butterkeks', '4.7'),
(111, 78, 'Schoko/Vanille', '4.9'),
(115, 73, 'Stracciatella', '3.9'),
(116, 73, 'Amarena', '3.4'),
(117, 72, 'Vanille/Karamell', '3.0'),
(118, 77, 'Amerettini ', '4.9'),
(123, 82, 'Spaghetti Eis', '5.0'),
(124, 83, 'Milchreis', '4.8'),
(125, 83, 'Butterkeks', '4.8'),
(129, 79, 'Eisbecher \"Orion\"', '4.5'),
(130, 88, 'Karamell', '4.9'),
(131, 88, 'Weiße Schokolade', '4.9'),
(133, 76, 'Weiße Schokolade ', '4.0'),
(137, 90, 'Waldbeere', '4.8'),
(138, 90, 'Schokolade', '4.3'),
(152, 103, 'Schoko/Vanille', '4.5'),
(160, 112, 'Vanille/Erdbeere', '4.0'),
(163, 113, 'Schoko/Vanille', '4.4'),
(164, 114, 'Schoko/Vanille ', '4.4'),
(165, 115, 'Cookies ', '5.0'),
(170, 116, 'Schokolade', '3.0'),
(171, 116, 'Himbeere', '5.0'),
(172, 102, 'Eierlikör-Nougat ', '4.6'),
(173, 74, 'Schoko/Vanille', '4.6'),
(175, 19, 'Dunkle Schokolade', '4.5'),
(179, 122, 'Gummibären ', '4.6'),
(180, 123, 'Vanille/Mango', '5.0'),
(181, 23, 'Schoko/Vanille', '4.7'),
(191, 125, 'Caipirinha ', '4.4'),
(192, 125, 'Mango ', '3.9'),
(193, 125, 'Schokolade', '4.8'),
(194, 126, 'Milchreis', '4.7'),
(197, 127, 'Erdbeere', '4.4'),
(198, 127, 'Himbeerkuss', '4.4'),
(199, 128, 'Stracciatella', '4.3'),
(206, 130, 'Schokolade', '4.8'),
(207, 130, 'Mango', '2.8'),
(210, 4, 'Salted Caramel', '4.8'),
(226, 129, 'Schokolade', '4.7'),
(227, 129, 'Tiramisu', '4.7'),
(228, 129, 'Marshmallow', '4.7'),
(231, 134, 'Zitrone ', '4.6'),
(232, 134, 'Weiße Schoko-Crisp', '4.8'),
(235, 131, 'Erdbeere', '2.0'),
(236, 131, 'Schokolade', '4.3'),
(240, 136, 'Schoko-Vanille', '5.0'),
(241, 53, 'Marzipan', '5.0'),
(242, 53, 'Cookies', '5.0'),
(245, 137, 'Joghurt Rote Grütze', '4.8'),
(246, 137, 'Schoko-Mint', '4.8'),
(247, 138, 'Schoko', '4.5'),
(248, 139, 'Mango', '4.9'),
(253, 140, 'Raffaello ', '3.0'),
(254, 140, 'Bueno', '4.5'),
(255, 67, 'Eierlikör-Nougat ', '4.8'),
(256, 67, 'Quark-Zitrone', '4.7'),
(257, 135, 'Zimt', '4.7'),
(258, 141, 'Schoko-Vanille', '4.5'),
(261, 143, 'Schoko-Vanille ', '4.8'),
(262, 142, 'Salted-Butter-Caramel', '4.7'),
(263, 142, 'Malaga', '4.3'),
(264, 57, 'Stracciatella', '2.8'),
(265, 57, 'Pfirsich-Maracuja', '2.0');

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `eisbecher_scores`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `eisbecher_scores` (
`eisdiele_id` int
,`finaler_eisbecher_score` double
,`avg_geschmack` double
,`avg_preisleistung` double
);

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

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `favoriten`
--

CREATE TABLE `favoriten` (
  `nutzer_id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `hinzugefuegt_am` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `favoriten`
--

INSERT INTO `favoriten` (`nutzer_id`, `eisdiele_id`, `hinzugefuegt_am`) VALUES
(1, 1, '2025-04-29 12:11:18'),
(1, 4, '2025-04-05 20:27:29'),
(1, 7, '2025-04-09 08:18:38'),
(1, 9, '2025-04-09 08:18:12'),
(1, 12, '2025-04-05 20:19:46'),
(1, 14, '2025-04-09 08:18:32'),
(1, 22, '2025-04-05 20:19:17'),
(1, 23, '2025-04-05 20:20:05'),
(1, 24, '2025-04-29 06:52:51'),
(1, 28, '2025-04-29 10:41:16'),
(1, 29, '2025-04-05 22:53:50'),
(1, 37, '2025-04-05 20:19:55'),
(1, 39, '2025-04-09 08:15:38'),
(1, 42, '2025-04-27 16:47:06'),
(1, 45, '2025-04-05 20:27:18'),
(1, 46, '2025-04-05 20:19:30'),
(1, 53, '2025-04-06 20:36:29'),
(1, 56, '2025-04-12 18:02:03'),
(1, 57, '2025-04-12 18:02:21'),
(1, 59, '2025-04-29 13:55:28'),
(1, 65, '2025-04-05 22:53:43'),
(1, 69, '2025-04-05 20:19:40'),
(1, 74, '2025-04-06 20:52:01'),
(1, 81, '2025-04-10 11:18:12'),
(1, 85, '2025-04-22 10:30:43'),
(1, 89, '2025-04-11 09:27:32'),
(1, 98, '2025-04-12 17:50:22'),
(1, 101, '2025-04-13 15:48:02'),
(1, 106, '2025-05-05 13:10:02'),
(1, 122, '2025-04-27 16:40:49'),
(1, 125, '2025-04-29 10:40:23'),
(1, 127, '2025-05-01 01:40:05'),
(1, 145, '2025-05-06 12:54:59'),
(1, 149, '2025-05-08 06:21:07'),
(1, 150, '2025-05-08 08:57:25'),
(1, 162, '2025-05-10 21:19:42');

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `kugel_scores`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `kugel_scores` (
`eisdiele_id` int
,`finaler_kugel_score` double
,`avg_geschmack` double
,`avg_geschmacksfaktor` double
,`avg_preisleistungsfaktor` double
,`avg_preisleistung` double
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `laender`
--

CREATE TABLE `laender` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `laender`
--

INSERT INTO `laender` (`id`, `name`, `country_code`) VALUES
(1, 'Deutschland', 'de'),
(2, 'Tschechien', 'cz'),
(3, 'Italien', 'it'),
(4, 'Frankreich', 'fr'),
(5, 'Schweiz', 'ch'),
(6, 'Albanien', 'al'),
(7, 'Andorra', 'ad'),
(8, 'Armenien', 'am'),
(9, 'Aserbaidschan', 'az'),
(10, 'Belgien', 'be'),
(11, 'Bosnien und Herzegowina', 'ba'),
(12, 'Bulgarien', 'bg'),
(13, 'Dänemark', 'dk'),
(14, 'Estland', 'ee'),
(15, 'Finnland', 'fi'),
(16, 'Georgien', 'ge'),
(17, 'Griechenland', 'gr'),
(18, 'Irland', 'ie'),
(19, 'Island', 'is'),
(20, 'Kasachstan', 'kz'),
(21, 'Kosovo', 'xk'),
(22, 'Kroatien', 'hr'),
(23, 'Lettland', 'lv'),
(24, 'Liechtenstein', 'li'),
(25, 'Litauen', 'lt'),
(26, 'Luxemburg', 'lu'),
(27, 'Malta', 'mt'),
(28, 'Moldau', 'md'),
(29, 'Monaco', 'mc'),
(30, 'Montenegro', 'me'),
(31, 'Niederlande', 'nl'),
(32, 'Nordmazedonien', 'mk'),
(33, 'Norwegen', 'no'),
(34, 'Österreich', 'at'),
(35, 'Polen', 'pl'),
(36, 'Portugal', 'pt'),
(37, 'Rumänien', 'ro'),
(38, 'Russland', 'ru'),
(39, 'San Marino', 'sm'),
(40, 'Schweden', 'se'),
(41, 'Serbien', 'rs'),
(42, 'Slowakei', 'sk'),
(43, 'Slowenien', 'si'),
(44, 'Spanien', 'es'),
(45, 'Ukraine', 'ua'),
(46, 'Ungarn', 'hu'),
(47, 'Vatikanstadt', 'va'),
(48, 'Vereinigtes Königreich', 'gb'),
(49, 'Weißrussland', 'by');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `landkreise`
--

CREATE TABLE `landkreise` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bundesland_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `landkreise`
--

INSERT INTO `landkreise` (`id`, `name`, `bundesland_id`) VALUES
(7, 'Altenburger Land', 1),
(19, 'Aussiger Region', 6),
(6, 'Chemnitz', 3),
(11, 'Dresden', 3),
(3, 'Erzgebirgskreis', 3),
(8, 'Greiz', 1),
(25, 'Hérault', 10),
(18, 'Karlsbader Region', 6),
(9, 'Landkreis Leipzig', 3),
(23, 'Landkreis Tirschenreuth', 7),
(29, 'Luzern', 11),
(22, 'Mailand', 8),
(10, 'Meißen', 3),
(4, 'Mittelsachsen', 3),
(24, 'Oberelsass', 9),
(16, 'Oberspreewald-Lausitz - Górne Błota-Łužyca', 5),
(17, 'Sächsische Schweiz-Osterzgebirge', 3),
(12, 'Vogtlandkreis', 3),
(28, 'Weiden in der Oberpfalz', 7),
(5, 'Zwickau', 3);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `nutzer`
--

CREATE TABLE `nutzer` (
  `id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `nutzer`
--

INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `erstellt_am`, `is_verified`, `verification_token`) VALUES
(1, 'TheGourmetCyclist', 'ch_helbig@mail.de', '$2y$10$l24MOAvigoanK9fdMc7dYe06vIgVHVY6zyqq1xr940ShEuNEaMViK', '2025-03-14 06:11:55', 1, NULL),
(2, 'Luca', 'luca@randommail.de', '$2y$10$zT9SqEPz78ZrjMcwoCcCH.lKANr7XiCqDcjyT9OQ1uXV5Hydyp2/2', '2025-03-27 20:10:27', 1, NULL),
(3, 'Leckermäulchen95', 'simon.oertel1995@gmail.com', '$2y$10$AmnTKz9H5knO2.l9HULqYuyyCZxfXraAivdGc0PUOH/tET0JjYoia', '2025-04-02 19:28:56', 1, NULL),
(4, 'Tom', 'dummy@mail.de', '$2y$10$d2y8ktSLxyYbEfK1XftTcOJgKdvr9V9lv/y.tUYO4TRREe5iwzaby', '2025-04-05 12:41:30', 1, NULL),
(5, 'Erik', 'erik.loeschner@web.de', '$2y$10$Gtb7FMoek5h1mrypChCMp.5znsANd34Fc5UpuCNXLkhDHa.2QWet6', '2025-04-08 18:20:29', 1, NULL),
(6, 'Agon', 'agon.muli@random.mail.de', '$2y$10$ULhCRGTYoScnJvPs3GfUyuK4H7PATTLrsPcdUjNY6MeViXUN.m4Je', '2025-04-15 18:56:58', 1, NULL),
(7, 'Luise', 'lu.tuomari@no.mail.de', '$2y$10$O3pjh/Ly81ENzpiihb8MYurFtzH6ZFj.fF63nXQpSLmFwte19LzCu', '2025-04-16 06:43:01', 1, NULL),
(8, 'Enkiboy', 'sebastian@enke.dummymail.de', '$2y$10$ZTkG03poVKKTaOLzavI/BOrL.TI5fXJYIU5P6s0ixwdhj8kkfb1v6', '2025-04-26 18:34:34', 1, NULL),
(9, 'Carola-Eis', 'carola@dummymail.de', '$2y$10$91uWQyVuYLqaO71OCaWxC.Jfud15N.o0esDW.OEOwvYOeMhBXRGSy', '2025-04-27 19:01:59', 1, NULL),
(10, 'Pitiwowo', 'joel.machado@freenet.de', '$2y$10$eoosY8ZARZ5CvsbWt1KA6eQ6gWqQlxoZDyrjJUKyX..Rjq1Qufa1y', '2025-05-01 07:29:02', 1, NULL),
(11, 'CaptManu', 'cptnmanu@web.de', '$2y$10$PeRxbnFzzgUekaue9LdgBup4SerrsEadnx8xfYZ.lNuszPM0gpLym', '2025-05-02 17:37:31', 1, NULL),
(12, 'Matze T', 'matthias.trebeck@gmx.de', '$2y$10$fuCFkI8bAP8zxeXzrVcOiu3p3.ik1s1Y4pCJsTcChYhp6TONiIUBW', '2025-05-04 18:04:06', 1, NULL),
(13, 'Admin', 'admin@ice-app.de', '$2y$12$pjFKBd97VTV1NFf1CU7HVu6Q/x31qTfkX.RNW9HGmDnBTlDFUVEfK', '2025-05-06 05:10:51', 1, NULL),
(19, 'Maerc96', 'maerc96@gmail.com', '$2y$12$VsOFRx9XLXA1J2NmKmkbfuqwTDYMsGkZSTq0nEjqIzgOMHuVTlWti', '2025-05-06 16:25:27', 1, NULL),
(20, 'Beatrice', 'beatrice.schubert29@icloud.com', '$2y$12$LSgIRunbW2b3GagzwxYY8uwqvOeWGaL.tNYWIRRkTCk2.Zsn2K6QS', '2025-05-06 17:36:20', 1, NULL),
(21, 'emmi', 'schreiter.emmely@gmail.com', '$2y$12$aebCt7siPEdLonjfP4nHXeln1OED033MPcqJv7t4zK5vvjYHErdGe', '2025-05-06 18:36:53', 1, NULL),
(22, 'Eispfote', 'franziska.scharbrodt@gmail.com', '$2y$12$G5YgrJCPvp5sAEqBUSpOk.KuYG9DRO3SL8fVX/py3pn/Yz5Z9MMsK', '2025-05-06 19:38:09', 1, NULL),
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', '2025-05-12 14:51:32', 1, NULL),
(25, 'alvaperez12', 'theresa.anna.perez@googlemail.com', '$2y$12$52IxywCiQd0kR8O2wGc9zeCOst2r8Fyj0dKVX8jiqkbXBPWtJpl3e', '2025-05-19 17:09:16', 1, NULL),
(26, 'moritz', 'moritzlistner1@gmail.com', '$2y$12$fByEoYTP8KAUwoXCgko/6Oxm34xb/3HzYqEv2PX7e65aOy86T9e5a', '2025-05-22 04:56:36', 1, NULL);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `passwort_reset_tokens`
--

CREATE TABLE `passwort_reset_tokens` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `preise`
--

CREATE TABLE `preise` (
  `id` int NOT NULL,
  `eisdiele_id` int DEFAULT NULL,
  `typ` enum('kugel','softeis') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `preis` decimal(5,2) DEFAULT NULL,
  `beschreibung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `gemeldet_von` int DEFAULT NULL,
  `gemeldet_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `preise`
--

INSERT INTO `preise` (`id`, `eisdiele_id`, `typ`, `preis`, `beschreibung`, `gemeldet_von`, `gemeldet_am`) VALUES
(1, 3, 'kugel', '1.60', NULL, 1, '2025-03-14 06:12:04'),
(2, 11, 'kugel', '1.40', NULL, 1, '2024-02-01 06:44:12'),
(4, 5, 'kugel', '2.00', NULL, 1, '2025-03-18 15:58:59'),
(5, 1, 'kugel', '1.60', 'Premiumsorten 1,80€', 1, '2024-04-01 07:29:38'),
(6, 1, 'softeis', '1.80', 'Großes Softeis 3,00€', 1, '2024-04-01 07:30:20'),
(7, 16, 'kugel', '1.50', 'Premiumsorten - 2.00€', 1, '2025-03-15 05:05:28'),
(8, 17, 'kugel', '2.00', NULL, 1, '2025-03-15 05:05:28'),
(9, 18, 'kugel', '2.00', NULL, 1, '2025-03-16 09:51:22'),
(10, 21, 'kugel', '1.70', NULL, 1, '2025-03-16 16:21:45'),
(11, 21, 'softeis', '2.50', 'kleines Softeis - 2.50€\r\ngroßes Softeis - 3.00 €', 1, '2025-03-16 16:21:45'),
(12, 22, 'kugel', '1.20', NULL, 1, '2024-03-01 06:47:55'),
(13, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 1, '2025-03-27 12:12:09'),
(14, 28, 'softeis', '3.00', 'Je nach Größe und Art der Waffel / Becher zwischen 3.00€ und 8.00€', 1, '2025-05-13 17:12:24'),
(15, 19, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-19 19:36:49'),
(16, 1, 'kugel', '1.70', 'Premiumsorten 2.00€ -\nCremino 2.50€', 1, '2025-04-25 04:26:44'),
(17, 1, 'softeis', '2.00', 'Kleines Softeis 2.00€ -\nGroßes Softeis 3.50€', 1, '2025-04-25 04:26:44'),
(18, 22, 'kugel', '1.30', NULL, 1, '2025-05-20 10:47:33'),
(19, 6, 'kugel', '1.60', NULL, 1, '2025-03-20 18:48:22'),
(20, 26, 'kugel', '1.50', NULL, 1, '2024-09-21 04:38:42'),
(21, 35, 'kugel', '1.90', 'Im Restaurant 2,60€', 1, '2025-05-12 01:39:12'),
(22, 34, 'kugel', '2.00', 'Premiumsorten - 2.20 €', 1, '2025-03-21 05:59:04'),
(23, 37, 'kugel', '1.30', NULL, 1, '2025-04-08 15:10:10'),
(24, 38, 'kugel', '1.70', NULL, 1, '2025-03-23 17:45:55'),
(25, 39, 'kugel', '1.50', NULL, 1, '2025-03-23 17:46:52'),
(27, 40, 'kugel', '1.30', NULL, 1, '2024-03-01 06:36:13'),
(28, 42, 'kugel', '1.60', NULL, 1, '2025-04-28 14:35:08'),
(29, 32, 'kugel', '2.00', 'Premiumsorten - 2.20€', 1, '2025-05-09 13:14:32'),
(30, 43, 'softeis', '3.00', 'kleines Softeis - 3.00 €\r\ngroßes Softeis - 4.00 €', 1, '2025-03-24 17:23:48'),
(31, 44, 'kugel', '1.50', NULL, 1, '2025-03-24 16:43:57'),
(32, 45, 'kugel', '1.00', NULL, 1, '2025-05-02 11:16:58'),
(34, 11, 'kugel', '1.60', NULL, 1, '2025-03-25 16:30:00'),
(42, 51, 'kugel', '1.80', 'Premiumsorten - 2.20 €', 1, '2025-05-22 18:53:34'),
(51, 26, 'kugel', '1.80', 'Premiumsorten - 2.20 €', 1, '2025-03-27 15:11:26'),
(52, 13, 'kugel', '1.50', 'Kleines gemischtes Eis - 1,50 €\nGroßes gemischtes Eis - 2,50 €', 1, '2025-03-28 15:06:41'),
(53, 47, 'kugel', '1.00', 'Premiumsorten - 1,50 €', 1, '2025-03-28 15:53:03'),
(54, 47, 'softeis', '1.50', 'Großes Softeis - 2,50 €', 1, '2025-03-28 15:53:03'),
(55, 54, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\r\nGroßes Softeis - 3,00 €\r\nXXL Softeis - 3,50 €', 1, '2025-03-28 16:51:29'),
(56, 53, 'softeis', '1.50', 'Kleines Softeis - 1,50 €\r\nNormales Softeis - 2,00 €\r\nGroßes Softeis - 2,50 €', 1, '2025-03-28 17:01:44'),
(57, 55, 'kugel', '1.50', NULL, 1, '2025-04-17 13:53:20'),
(58, 58, 'kugel', '1.50', NULL, 1, '2025-03-30 10:49:57'),
(60, 31, 'softeis', '1.50', 'Kleines Eis - 1.50 €\nGroßes Eis - 2.50 €', 1, '2025-04-02 06:17:26'),
(62, 2, 'kugel', '2.00', NULL, 1, '2025-04-03 11:35:21'),
(63, 20, 'kugel', '2.00', NULL, 1, '2025-04-03 14:16:17'),
(64, 9, 'kugel', '1.50', NULL, 1, '2025-05-21 15:16:34'),
(65, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 1, '2025-05-21 15:16:34'),
(66, 61, 'kugel', '1.80', NULL, 1, '2025-04-03 14:54:33'),
(67, 63, 'kugel', '2.00', NULL, 1, '2025-04-04 04:58:58'),
(68, 62, 'kugel', '2.00', NULL, 1, '2025-04-04 04:59:58'),
(69, 64, 'kugel', '1.90', NULL, 1, '2025-04-04 05:03:15'),
(70, 46, 'kugel', '1.80', NULL, 1, '2025-04-04 12:36:30'),
(71, 65, 'kugel', '1.00', NULL, 1, '2025-04-05 11:18:17'),
(72, 65, 'softeis', '1.00', 'Kleines Softeis - 1,00 €\nGroßes Softeis - 2,00 €', 1, '2025-04-05 11:18:17'),
(73, 66, 'kugel', '1.40', NULL, 1, '2025-04-05 11:20:48'),
(74, 33, 'softeis', '3.20', 'Kleines Softeis - 3,20 €\nGroßes Softeis - 4,00 €', 1, '2025-04-05 14:35:21'),
(75, 67, 'kugel', '1.70', NULL, 1, '2025-04-05 16:39:21'),
(76, 68, 'kugel', '1.50', 'Premiumsorten - 2.00 €', 1, '2025-04-05 16:43:07'),
(77, 69, 'kugel', '1.60', NULL, 1, '2025-04-05 16:49:47'),
(78, 71, 'kugel', '2.00', NULL, 1, '2025-04-05 16:57:44'),
(80, 29, 'kugel', '1.60', NULL, 1, '2025-04-07 14:20:17'),
(81, 40, 'kugel', '1.70', NULL, 1, '2025-04-08 14:13:43'),
(83, 76, 'kugel', '1.50', NULL, 1, '2025-04-09 04:52:10'),
(87, 86, 'kugel', '1.50', NULL, 1, '2025-04-11 07:15:22'),
(90, 87, 'kugel', '1.40', NULL, 1, '2024-07-23 13:49:01'),
(91, 97, 'kugel', '1.70', NULL, 1, '2025-04-12 09:08:55'),
(92, 83, 'kugel', '2.00', NULL, 1, '2025-04-12 09:09:12'),
(93, 72, 'kugel', '1.70', 'Premiumsorten 2€', 1, '2025-04-12 09:39:02'),
(94, 98, 'kugel', '1.10', NULL, 1, '2025-04-16 14:49:12'),
(95, 100, 'kugel', '1.50', NULL, 1, '2025-04-14 10:50:50'),
(101, 101, 'kugel', '1.20', NULL, 1, '2025-04-14 14:06:06'),
(103, 101, 'softeis', '1.70', 'Mittel - 2,20 €\nGroß - 2,70 €', 1, '2025-04-14 14:06:06'),
(106, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 4, '2025-04-20 15:40:45'),
(107, 9, 'kugel', '1.50', NULL, 4, '2025-04-21 14:52:33'),
(108, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 4, '2025-04-21 14:52:33'),
(109, 85, 'kugel', '1.80', NULL, 1, '2025-04-22 08:30:13'),
(110, 114, 'softeis', '3.00', NULL, 1, '2025-04-22 08:35:39'),
(111, 115, 'softeis', '2.00', NULL, 3, '2025-04-22 12:35:13'),
(113, 59, 'kugel', '1.20', NULL, 1, '2025-04-30 07:31:47'),
(114, 59, 'softeis', '1.50', 'Mittleres Softeis - 2€\nGroßes Softeis - 2,50€', 1, '2025-04-30 07:31:47'),
(121, 118, 'kugel', '1.50', NULL, 1, '2025-04-26 00:16:57'),
(122, 119, 'softeis', '2.50', 'Kleine Portion 2,50€ / Mittlere Portion 3€ / große Portion 3,50€', 1, '2025-04-26 00:18:43'),
(123, 107, 'kugel', '1.50', NULL, 1, '2025-04-26 10:52:10'),
(126, 107, 'softeis', '2.50', 'Großes Softeis 3,50€', 1, '2025-04-26 10:52:10'),
(127, 118, 'kugel', '1.70', NULL, 1, '2025-04-26 11:02:14'),
(128, 118, 'softeis', '2.50', 'Großes Softeis 3,50€ / Super Softeis 4,50€', 1, '2025-04-26 11:02:14'),
(129, 121, 'softeis', '2.00', 'Großes Softeis 3€', 1, '2025-04-27 12:10:29'),
(130, 75, 'softeis', '2.50', NULL, 1, '2025-04-27 15:19:46'),
(132, 123, 'kugel', '1.90', NULL, 2, '2025-04-27 15:33:25'),
(133, 32, 'kugel', '2.00', 'Premiumsorten - 2.20€', 3, '2025-04-27 16:23:05'),
(134, 124, 'kugel', '2.00', NULL, 4, '2025-04-27 17:44:49'),
(135, 125, 'softeis', '2.80', 'Keine unterschiedlichen Größen / Preise', 7, '2025-04-27 19:22:41'),
(137, 60, 'kugel', '1.60', 'Premiumsorten 1,90€', 1, '2025-04-28 15:57:49'),
(138, 92, 'kugel', '2.00', 'Premiumsorten 2,20€', 1, '2025-04-29 14:22:12'),
(139, 92, 'softeis', '2.50', 'Großes Softeis 4€', 1, '2025-04-29 14:22:12'),
(144, 106, 'kugel', '1.80', NULL, 1, '2025-04-30 15:03:36'),
(145, 126, 'kugel', '1.60', NULL, 1, '2025-05-01 14:54:00'),
(146, 126, 'softeis', '1.80', 'Großes Softeis 3,00€', 1, '2025-05-01 14:54:00'),
(147, 12, 'softeis', '1.70', 'Kleines Softeis: 1,70€\nGroßes Softeis: 3,00€\nXXL Softeis:      4,00€', 7, '2025-05-01 19:08:01'),
(148, 131, 'kugel', '1.80', NULL, 1, '2025-05-01 19:43:23'),
(149, 132, 'kugel', '2.00', NULL, 2, '2025-05-02 04:53:39'),
(150, 132, 'softeis', '2.20', 'Klein: 2,20€\nMittel: 3,50€\nGroß: 4,80€', 2, '2025-05-02 04:53:39'),
(151, 133, 'softeis', '1.81', '45 czk', 1, '2025-05-02 10:27:22'),
(153, 45, 'softeis', '1.00', 'Mittleres Softeis 2€ - Großes Softeis 3€', 1, '2025-05-02 11:16:58'),
(154, 128, 'kugel', '1.70', 'Zum mitnehmen und 2,20€ zum vor Ort essen', 10, '2025-05-02 11:33:01'),
(155, 134, 'kugel', '1.80', NULL, 1, '2025-05-02 12:04:42'),
(160, 135, 'kugel', '1.50', NULL, 1, '2025-05-02 12:57:14'),
(161, 135, 'softeis', '2.50', '3,50€ großes Softeis, 4,50€ XXL', 1, '2025-05-02 12:57:14'),
(162, 81, 'kugel', '1.60', NULL, 1, '2025-05-02 12:57:31'),
(163, 82, 'kugel', '1.60', NULL, 1, '2025-05-02 14:51:53'),
(164, 49, 'kugel', '1.80', NULL, 1, '2025-05-04 15:06:01'),
(165, 122, 'kugel', '1.80', NULL, 1, '2025-05-04 15:07:42'),
(166, 122, 'softeis', '1.80', 'mittlere Portion 2,50 € / große Portion 3,20 €', 1, '2025-05-04 15:07:42'),
(169, 137, 'kugel', '1.70', NULL, 11, '2025-05-05 07:03:23'),
(170, 46, 'kugel', '1.80', NULL, 5, '2025-05-05 09:26:26'),
(171, 118, 'kugel', '1.70', NULL, 5, '2025-05-05 09:31:59'),
(172, 118, 'softeis', '2.50', 'Großes Softeis 3,50€ / Super Softeis 4,50€', 5, '2025-05-05 09:31:59'),
(173, 139, 'kugel', '2.50', NULL, 5, '2025-05-06 18:27:27'),
(174, 149, 'kugel', '1.00', NULL, 1, '2023-05-08 06:47:45'),
(178, 150, 'kugel', '1.20', NULL, 1, '2025-02-08 07:56:08'),
(179, 161, 'kugel', '4.49', NULL, 1, '2025-05-09 10:59:12'),
(186, 115, 'softeis', '2.00', 'Großes Softeis - 4€', 1, '2025-05-10 12:34:36'),
(187, 125, 'softeis', '2.80', 'Keine unterschiedlichen Größen / Preise', 2, '2025-05-10 13:25:48'),
(188, 162, 'kugel', '1.50', NULL, 11, '2025-05-10 18:51:04'),
(190, 117, 'kugel', '1.70', 'Premiumsorten 2.00€ - Cremino 2.50€', 1, '2025-05-13 05:05:29'),
(191, 14, 'softeis', '2.50', 'Groß', 23, '2025-05-12 20:13:17'),
(192, 14, 'softeis', '2.00', 'Klein', 23, '2025-05-12 20:12:58'),
(197, 163, 'kugel', '1.80', NULL, 8, '2025-05-14 19:45:18'),
(198, 165, 'kugel', '1.80', 'Kategorie Zwei: 2€ / Kategorie 3: 2,20€', 1, '2025-05-15 13:31:45'),
(199, 145, 'kugel', '1.20', NULL, 1, '2025-05-18 10:53:16'),
(200, 145, 'softeis', '1.40', 'Mittleres Softeis - 1.9€ großes Softeis: 2,40€', 1, '2025-05-18 10:53:16'),
(201, 167, 'kugel', '1.80', 'Premiumsorten 2,20 €', 1, '2025-05-18 16:14:21'),
(202, 167, 'softeis', '2.80', 'Kleines Softeis: 2,80 € / großes Softeis 3,80 €', 1, '2025-05-18 16:14:21'),
(203, 9, 'kugel', '1.50', NULL, 25, '2025-05-19 17:14:06'),
(204, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 25, '2025-05-19 17:14:06'),
(205, 162, 'kugel', '1.50', NULL, 1, '2025-05-20 01:19:56'),
(206, 162, 'softeis', '2.50', 'Kleines Softeis 2,50€ - großes Softeis 3,50€', 1, '2025-05-20 01:19:56'),
(208, 10, 'kugel', '1.80', 'Premiumsorten - 2.30 €', 2, '2025-05-20 19:22:06'),
(209, 60, 'kugel', '1.60', 'Premiumsorten 1,90€', 2, '2025-05-20 19:32:53'),
(210, 170, 'kugel', '2.50', NULL, 1, '2025-05-21 11:27:54'),
(213, 9, 'kugel', '1.50', NULL, 19, '2025-05-22 14:48:07'),
(214, 9, 'softeis', '2.00', 'Kleines Softeis - 2,00 €\nGroßes Softeis - 3,00 €', 19, '2025-05-22 14:48:07');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `rate_limit`
--

CREATE TABLE `rate_limit` (
  `id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `rate_limit`
--

INSERT INTO `rate_limit` (`id`, `ip_address`, `timestamp`) VALUES
(13, '2003:f4:e72e:a200:21e:3956:2506:56a1', '2025-05-06 18:25:26'),
(14, '2003:c0:f72a:5700:7d8b:5860:3709:c4f4', '2025-05-06 19:36:20'),
(15, '2a02:810a:8ca9:c900:6c8d:b244:2db9:4755', '2025-05-06 20:36:52'),
(16, '2003:ca:6f20:1364:ff2c:86f3:b934:f34f', '2025-05-06 21:38:08'),
(17, '2003:ca:6f20:1364:ff2c:86f3:b934:f34f', '2025-05-06 21:38:09'),
(18, '2a00:20:b2c6:4274:5032:cdff:feac:556b', '2025-05-12 16:51:32'),
(19, '91.0.62.133', '2025-05-12 19:13:09'),
(20, '91.0.62.133', '2025-05-12 19:13:11'),
(21, '2a02:810a:900d:3600:fe:46b3:1cf6:b765', '2025-05-19 19:09:16'),
(22, '2a00:20:b2de:5770:64f4:96a5:8d2e:cb89', '2025-05-22 06:56:36');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `routen`
--

CREATE TABLE `routen` (
  `id` int NOT NULL,
  `eisdiele_id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `embed_code` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `beschreibung` text COLLATE utf8mb4_general_ci,
  `typ` enum('Wanderung','Rennrad','MTB','Gravel','Sonstiges') COLLATE utf8mb4_general_ci NOT NULL,
  `laenge_km` decimal(5,2) DEFAULT NULL,
  `hoehenmeter` int DEFAULT NULL,
  `schwierigkeit` enum('Leicht','Mittel','Schwer') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ist_oeffentlich` tinyint(1) DEFAULT '0',
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `routen`
--

INSERT INTO `routen` (`id`, `eisdiele_id`, `nutzer_id`, `url`, `embed_code`, `name`, `beschreibung`, `typ`, `laenge_km`, `hoehenmeter`, `schwierigkeit`, `ist_oeffentlich`, `erstellt_am`) VALUES
(1, 7, 1, 'https://www.komoot.com/de-de/tour/766051588/', '<iframe src=\"https://www.komoot.com/de-de/tour/766051588/embed?share_token=a0wppn9FtkukVMb4eIO1LH0uC3zs4nkuulEG5yYiADhc9g47xq\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Traumhafte Runde durchs Vogtland / westliche Erzgebirge auf sehr ruhigen Straßen, tollen Bergen und einem schönen Eis-Stopp in Eibenstock.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(2, 12, 1, 'https://www.komoot.com/de-de/tour/2095130840/', '<iframe src=\"https://www.komoot.com/de-de/tour/2095130840/embed?share_token=ap4vnyKtDa4kQ7cUIHWHjzRuQ4EE4wcnWfh4SX7SzDwcpGnhFF\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(3, 23, 1, 'https://www.komoot.com/de-de/tour/2102873500/', '<iframe src=\"https://www.komoot.com/de-de/tour/2102873500/embed?share_token=aO8lZ2QKczabkrOMLS3saC2EFtrjB3nq5AGk9bFQx3EXZtVrBo\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(4, 24, 1, 'https://www.komoot.com/de-de/tour/2105973916/', '<iframe src=\"https://www.komoot.com/de-de/tour/2105973916/embed?share_token=aaPFk4zNdiuVWi0ZnbkJWSoLFS7NSN5CbtGIlU53lvLlZlAKxr\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Los gehts durchs Zschopautal mit relativ gemütlicher Steigung bis hoch zum Erzgebirgskamm, den geht es dann auf ruhigen Wegen durch den Wald und kleinere Dörfer entlang bis nach Olbernhau, wo dann das Torteneck auf einen wartet. Von da aus geht es wellig zurück nach Chemnitz.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(5, 30, 1, 'https://www.komoot.com/de-de/tour/2116969975/', '<iframe src=\"https://www.komoot.com/de-de/tour/2116969975/embed?share_token=aOjrIbBFZ0G6Oev1Ajn3sK3L9t4nTo03R9LbBZIM4y6ZriPKr6\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(6, 31, 1, 'https://www.komoot.com/de-de/tour/2109432795/', '<iframe src=\"https://www.komoot.com/de-de/tour/2109432795/embed?share_token=atw46aGE8ustrenEcMyr6X5NVCQviCSV71gB86FHE3JApl36UC\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(7, 40, 1, 'https://www.komoot.com/de-de/tour/1041597491/', '<iframe src=\"https://www.komoot.com/de-de/tour/1041597491/embed?share_token=a8ppmCGzfMQKoTKYBGgvZa8GEfvWPU8IFJpptxJ2RskCTpEouu\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(8, 45, 1, 'https://www.komoot.com/de-de/tour/2117023918/', '<iframe src=\"https://www.komoot.com/de-de/tour/2117023918/embed?share_token=abMM6jTSdmMQSlAGrMdTO81vdDSLJrIK7KJXTzqIUURADyuZKz\" width=\"100%\" height=\"400\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Schöne Runde durchs Gebirge, erst auf den Keilberg, dann den Fichtelberg und anschließend über die tschechische Seite nach Johanngerogenstadt, wo es leckere Eisstärkung gibt, weiter rauf auf den Auersberg. Ab dann wird mehr gerollt. In Eibenstock bietet sich nochmal ein Eisstopp an.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(9, 46, 1, 'https://www.komoot.com/de-de/tour/2117187697/', '<iframe src=\"https://www.komoot.com/de-de/tour/2117187697/embed?share_token=aV2Hu3UCsgD69l3EKo2M5GZWarrQeZxDItCxpA9N2l1M52Kd4N\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(10, 57, 1, 'https://www.komoot.com/de-de/tour/2125763714/', '<iframe src=\"https://www.komoot.com/de-de/tour/2125763714/embed?share_token=aEGQW3j7otzdf1X7vzMI8JBzEwEV07qoTCgdkxKcvDnfZO3phh\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(11, 65, 1, 'https://www.komoot.com/de-de/tour/2141338801/', '<iframe src=\"https://www.komoot.com/de-de/tour/2141338801/embed?share_token=aRyl0tA138CJahivyKq3eKLmC7XUwprq5XDGRrkTFEjVYUcEE1&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(12, 74, 1, 'https://www.komoot.com/de-de/tour/2143692597/', '<iframe src=\"https://www.komoot.com/de-de/tour/2143692597/embed?share_token=anzEZqQDeHTcRq1YJOXRuRMoVfkIrs1Chfik2ID3iNgsVjSQTj&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(13, 89, 1, 'https://www.komoot.com/de-de/tour/1259315746/', '<iframe src=\"https://www.komoot.com/de-de/tour/1259315746/embed?share_token=aAcrsdK0p1Ho74xaV4g7PsGmD375xR3P76dPBRUJKFFftZc1hi&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(14, 98, 1, 'https://www.komoot.com/de-de/tour/2156485682/', '<iframe src=\"https://www.komoot.com/de-de/tour/2156485682/embed?share_token=aXul3Yn3HECtwMmDcRcbEHHOe6wXSdzb6D4XK1r4QNn7shP3GH&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(15, 101, 1, 'https://www.komoot.com/de-de/tour/2159077294/', '<iframe src=\"https://www.komoot.com/de-de/tour/2159077294/embed?share_token=aIGChRNihGNZKPZKdliYH3gg0Rt7MDGqwzTs9WukJK7TG71j7M\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Auf dem Hinweg geht es etwas bergig über Freiberg nach Nossen. Dort kann man sich für wenig Geld sehr viel super leckeres Eis gönnen bevor es dann etwas flacher zurück nach Chemnitz geht.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(16, 106, 1, 'https://www.komoot.com/de-de/tour/2201870273/', '<iframe src=\"https://www.komoot.com/de-de/tour/2201870273/embed?share_token=aYhNWuNhx23QiYtyROzDU7xXLieCNQNDS1hfjXJwSWjw8yW9nd\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Eine ordentlich anspruchsvolle Runde durchs Gebirge. Nach dem es im Zschopau Tal relativ gleichmäßig bergauf geht, geht\'s dann steil nach Jöhstadt wo mit dem Eiscafé Bartsch eine gute Quelle für Softeis wartet.\nDanach wird es richtig bergig, von hinten wird an den Auersberg Ran gefahren, der natürlich gleich mitgenommen wird, wenn man einmal da ist.\nDanach gibt\'s feinstes Eis bei der Eismanufaktur Lipp in Annaberg, aber obacht, danach warten auch noch einige giftige, steile Rampen.\nIn Summe ein wahres Höhenmeter Fest mit leckerstem Eis 😍🍦', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(34, 46, 1, 'https://www.komoot.com/de-de/tour/2223149396/', '<iframe src=\"https://www.komoot.com/de-de/tour/2223149396/embed?share_token=aPnSArnRnwsrHdGtf8RisNJrJdYn2qdInbmHITiAZ3Gtswe0A2\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Die Wanderung habe ich noch geplant. Sobald sie gemacht wurde, werde ich berichten.', 'Wanderung', NULL, NULL, NULL, 1, '2025-05-07 08:41:59'),
(48, 149, 1, 'https://www.komoot.com/de-de/tour/2225043577/', '<iframe src=\"https://www.komoot.com/de-de/tour/2225043577/embed?share_token=axZv8tPoWNnuly4DGuTKzmSl0TkblxCD9p9RWeoFKOlHMLtkLl\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Möchte ich noch fahren.', 'Rennrad', NULL, NULL, 'Schwer', 0, '2025-05-08 04:08:58'),
(49, 150, 1, 'https://www.komoot.com/de-de/tour/2225276682/', '<iframe src=\"https://www.komoot.com/de-de/tour/2225276682/embed?share_token=a5yq8SrIGOjf71VeGkuGzcpqD4WORqZ805eF6DwAfJF6OOQ7Qj\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Göltzschtalbrücke', '', 'Rennrad', NULL, NULL, 'Schwer', 1, '2025-05-08 07:03:25'),
(60, 42, 1, 'https://www.komoot.com/de-de/tour/2244100680/', '<iframe src=\"https://www.komoot.com/de-de/tour/2244100680/embed?share_token=aMt1pB6aqgwuFckjBm6Uk5lVnxn9XCNPYJZk8J1QEL4UZylZdP&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Geburtstagsrunde zum Eiscafé Elisenhof ', 'Am Sonntag biete ich für meinen Radsportverein diese Rennradrunde mit Eis-Genuss in Kohren-Sahlis an.', 'Rennrad', NULL, NULL, 'Mittel', 1, '2025-05-15 07:29:50'),
(63, 22, 1, 'https://www.komoot.com/de-de/tour/2257117699/', '<iframe src=\"https://www.komoot.com/de-de/tour/2257117699/embed?share_token=a4DJSTsSfqCjhgTcets22iemzH1VAgRrZKKpVyzAlaGRdIvxWL\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Probefahrt für die Geburtstagsrunde', 'Probefahrt für die Geburtstagsrunde', 'Rennrad', '114.00', 830, 'Mittel', 0, '2025-05-20 11:17:09'),
(64, 9, 1, 'https://www.komoot.com/de-de/tour/2260332775/', '<iframe src=\"https://www.komoot.com/de-de/tour/2260332775/embed?share_token=aGiI6OPvnX7PSTiwdPihquVe8zeOFjRgvuyGaLiyKKdHwgJ4lR\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Über Kohlebahnradweg zur Eisdiele Dietz', 'Schöne, einfache Rennrad Runde: über Klaffenbach geht es raus aus Chemnitz, den Kohlebahnradweg entlang bis nach Lugau. Von dort rollt man quasi komplett Gersdorf herunter bis am Ende vom Ort die Eisdiele Dietz einen erwartet.\nDort kann man lecker Eis essen bevor es über Oberlungwitz und Mittelbach zurück nach Chemnitz geht.', 'Rennrad', '35.10', 230, 'Leicht', 1, '2025-05-21 19:30:15');

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `softeis_scores`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `softeis_scores` (
`eisdiele_id` int
,`finaler_softeis_score` double
,`avg_geschmack` double
,`avg_geschmacksfaktor` double
,`avg_preisleistung` double
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user_awards`
--

CREATE TABLE `user_awards` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `award_id` int NOT NULL,
  `level` int NOT NULL,
  `awarded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `user_awards`
--

INSERT INTO `user_awards` (`id`, `user_id`, `award_id`, `level`, `awarded_at`) VALUES
(43, 1, 1, 1, '2025-04-24 13:13:59'),
(44, 1, 1, 2, '2025-04-24 13:13:59'),
(47, 1, 6, 1, '2025-04-24 13:13:59'),
(48, 1, 6, 2, '2025-04-24 13:13:59'),
(49, 1, 6, 3, '2025-04-24 13:13:59'),
(50, 1, 3, 1, '2025-04-25 06:02:39'),
(51, 1, 3, 2, '2025-04-25 06:02:39'),
(52, 1, 8, 1, '2025-04-26 00:10:32'),
(53, 1, 8, 2, '2025-04-26 00:10:32'),
(54, 1, 8, 3, '2025-04-26 00:10:32'),
(55, 1, 8, 4, '2025-04-26 00:10:32'),
(56, 1, 8, 5, '2025-04-26 00:10:32'),
(57, 1, 1, 3, '2025-04-26 11:13:39'),
(58, 1, 2, 1, '2025-04-26 11:13:39'),
(59, 1, 2, 2, '2025-04-26 11:13:39'),
(60, 1, 2, 3, '2025-04-26 11:13:39'),
(61, 1, 2, 4, '2025-04-26 11:13:39'),
(62, 1, 2, 5, '2025-04-26 11:13:39'),
(63, 1, 4, 1, '2025-04-27 12:13:59'),
(64, 2, 8, 1, '2025-04-27 15:31:05'),
(65, 2, 2, 1, '2025-04-27 15:45:25'),
(66, 2, 6, 1, '2025-04-27 15:45:25'),
(67, 4, 8, 1, '2025-04-27 17:39:26'),
(68, 7, 8, 1, '2025-04-27 19:11:41'),
(69, 7, 2, 1, '2025-04-27 19:19:09'),
(70, 7, 4, 1, '2025-04-27 19:19:09'),
(71, 3, 2, 1, '2025-04-27 19:41:16'),
(72, 1, 12, 1, '2025-04-30 15:14:18'),
(73, 1, 12, 2, '2025-05-01 15:03:53'),
(74, 1, 11, 1, '2025-05-01 15:03:53'),
(75, 10, 8, 1, '2025-05-01 17:30:30'),
(76, 7, 6, 1, '2025-05-01 19:12:06'),
(77, 2, 4, 1, '2025-05-02 04:55:21'),
(79, 1, 4, 2, '2025-05-02 10:28:16'),
(80, 1, 10, 1, '2025-05-02 11:16:02'),
(81, 2, 1, 1, '2025-05-02 13:06:45'),
(82, 2, 2, 2, '2025-05-02 13:06:45'),
(83, 1, 5, 1, '2025-05-04 08:19:38'),
(85, 9, 2, 1, '2025-05-04 14:43:12'),
(86, 9, 5, 1, '2025-05-04 14:43:12'),
(87, 4, 2, 1, '2025-05-04 17:42:34'),
(88, 4, 2, 2, '2025-05-04 17:42:34'),
(89, 4, 6, 1, '2025-05-04 17:42:34'),
(90, 4, 5, 1, '2025-05-04 17:42:34'),
(94, 5, 2, 1, '2025-05-05 09:23:28'),
(95, 5, 6, 1, '2025-05-05 09:23:28'),
(96, 5, 5, 1, '2025-05-05 09:23:28'),
(97, 5, 8, 1, '2025-05-05 09:38:28'),
(99, 1, 9, 1, '2025-05-06 09:21:20'),
(103, 2, 4, 2, '2025-05-09 14:17:37'),
(104, 1, 13, 1, '2025-05-02 16:08:15'),
(105, 1, 13, 2, '2025-05-02 16:16:44'),
(106, 1, 13, 3, '2025-05-02 16:16:51'),
(107, 1, 13, 4, '2025-05-02 16:16:57'),
(116, 1, 15, 1, '2025-05-09 19:19:07'),
(117, 1, 15, 2, '2025-05-09 19:19:07'),
(118, 1, 15, 3, '2025-05-09 19:19:07'),
(119, 1, 16, 1, '2025-05-09 19:19:07'),
(120, 2, 2, 3, '2025-05-10 13:27:21'),
(121, 11, 8, 1, '2025-05-10 15:43:42'),
(122, 11, 2, 1, '2025-05-05 15:44:43'),
(123, 4, 9, 1, '2025-05-10 16:30:35'),
(124, 4, 4, 1, '2025-05-10 16:30:35'),
(125, 11, 6, 1, '2025-05-10 18:57:30'),
(126, 11, 1, 1, '2025-05-10 18:59:12'),
(127, 11, 2, 2, '2025-05-10 18:59:12'),
(128, 11, 13, 1, '2025-05-10 18:59:12'),
(129, 1, 19, 2, '2025-05-12 12:00:22'),
(130, 23, 2, 1, '2025-05-12 20:16:37'),
(131, 23, 4, 1, '2025-05-12 20:16:37'),
(132, 3, 2, 2, '2025-05-13 19:08:28'),
(134, 3, 3, 1, '2025-05-13 19:11:20'),
(135, 3, 2, 3, '2025-05-13 19:16:31'),
(137, 3, 6, 1, '2025-05-13 19:16:31'),
(138, 8, 8, 1, '2025-05-14 14:04:04'),
(139, 22, 2, 1, '2025-05-14 19:33:07'),
(140, 22, 6, 1, '2025-05-14 19:33:07'),
(141, 22, 4, 1, '2025-05-14 19:33:07'),
(142, 8, 2, 1, '2025-05-15 03:38:51'),
(143, 4, 2, 3, '2025-05-15 03:49:25'),
(144, 1, 15, 4, '2025-05-15 07:29:50'),
(145, 25, 2, 1, '2025-05-19 17:20:29'),
(146, 25, 6, 1, '2025-05-19 17:20:29'),
(147, 25, 4, 1, '2025-05-19 17:20:29'),
(148, 1, 7, 1, '2025-05-20 10:47:33'),
(149, 1, 7, 2, '2025-05-20 10:47:33'),
(150, 1, 7, 3, '2025-05-20 10:47:33'),
(151, 1, 7, 4, '2025-05-20 10:47:33'),
(152, 1, 7, 5, '2025-05-20 10:47:33'),
(153, 1, 7, 6, '2025-05-20 10:47:33'),
(155, 2, 7, 1, '2025-05-20 19:22:06'),
(156, 2, 7, 2, '2025-05-20 19:22:06'),
(157, 2, 7, 3, '2025-05-20 19:22:06'),
(158, 2, 1, 2, '2025-05-20 19:23:56'),
(159, 2, 8, 2, '2025-05-20 19:27:00'),
(160, 2, 13, 1, '2025-05-20 19:31:27'),
(161, 2, 3, 1, '2025-05-20 19:31:27'),
(162, 1, 1, 4, '2025-05-21 14:07:05'),
(164, 1, 15, 5, '2025-05-21 19:32:15'),
(165, 19, 2, 1, '2025-05-22 14:47:12'),
(166, 19, 6, 1, '2025-05-22 14:47:12'),
(167, 19, 4, 1, '2025-05-22 14:47:12'),
(168, 19, 7, 1, '2025-05-22 14:48:07');

-- --------------------------------------------------------

--
-- Struktur des Views `eisbecher_scores`
--
DROP TABLE IF EXISTS `eisbecher_scores`;

CREATE ALGORITHM=UNDEFINED DEFINER=`USER439770_wed`@`%` SQL SECURITY DEFINER VIEW `eisbecher_scores`  AS   with `bewertete_checkins` as (select `checkins`.`nutzer_id` AS `nutzer_id`,`checkins`.`eisdiele_id` AS `eisdiele_id`,`checkins`.`geschmackbewertung` AS `geschmackbewertung`,`checkins`.`preisleistungsbewertung` AS `preisleistungsbewertung`,round(((0.7 * `checkins`.`geschmackbewertung`) + (0.3 * `checkins`.`preisleistungsbewertung`)),2) AS `score` from `checkins` where ((`checkins`.`typ` = 'Eisbecher') and (`checkins`.`geschmackbewertung` is not null) and (`checkins`.`preisleistungsbewertung` is not null))), `nutzer_scores` as (select `bewertete_checkins`.`eisdiele_id` AS `eisdiele_id`,`bewertete_checkins`.`nutzer_id` AS `nutzer_id`,count(0) AS `checkin_count`,avg(`bewertete_checkins`.`score`) AS `durchschnitt_score`,avg(`bewertete_checkins`.`geschmackbewertung`) AS `durchschnitt_geschmack`,avg(`bewertete_checkins`.`preisleistungsbewertung`) AS `durchschnitt_preisleistung` from `bewertete_checkins` group by `bewertete_checkins`.`eisdiele_id`,`bewertete_checkins`.`nutzer_id`), `gewichtete_scores` as (select `nutzer_scores`.`eisdiele_id` AS `eisdiele_id`,`nutzer_scores`.`nutzer_id` AS `nutzer_id`,sqrt(`nutzer_scores`.`checkin_count`) AS `gewicht`,(`nutzer_scores`.`durchschnitt_score` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_score`,(`nutzer_scores`.`durchschnitt_geschmack` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmack`,(`nutzer_scores`.`durchschnitt_preisleistung` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_preisleistung` from `nutzer_scores`) select `g`.`eisdiele_id` AS `eisdiele_id`,round((sum(`g`.`gewichteter_score`) / nullif(sum(`g`.`gewicht`),0)),2) AS `finaler_eisbecher_score`,round((sum(`g`.`gewichteter_geschmack`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmack`,round((sum(`g`.`gewichteter_preisleistung`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_preisleistung` from `gewichtete_scores` `g` group by `g`.`eisdiele_id`  ;

-- --------------------------------------------------------

--
-- Struktur des Views `kugel_scores`
--
DROP TABLE IF EXISTS `kugel_scores`;

CREATE ALGORITHM=UNDEFINED DEFINER=`USER439770_wed`@`%` SQL SECURITY DEFINER VIEW `kugel_scores`  AS   with `bewertete_checkins` as (select `c`.`nutzer_id` AS `nutzer_id`,`c`.`eisdiele_id` AS `eisdiele_id`,`c`.`geschmackbewertung` AS `geschmackbewertung`,`c`.`waffelbewertung` AS `waffelbewertung`,`c`.`größenbewertung` AS `größenbewertung`,`p`.`preis` AS `preis`,(case when (`c`.`waffelbewertung` is null) then `c`.`geschmackbewertung` else (((4 * `c`.`geschmackbewertung`) + `c`.`waffelbewertung`) / 5.0) end) AS `geschmacksfaktor`,(((`c`.`größenbewertung` / `p`.`preis`) / (5.0 / 1.5)) * 5.0) AS `preisleistungsfaktor`,round(((0.7 * (case when (`c`.`waffelbewertung` is null) then `c`.`geschmackbewertung` else (((4 * `c`.`geschmackbewertung`) + `c`.`waffelbewertung`) / 5.0) end)) + ((0.3 * ((`c`.`größenbewertung` / `p`.`preis`) / (5.0 / 1.5))) * 5.0)),4) AS `score` from (`checkins` `c` join `preise` `p` on(((`c`.`eisdiele_id` = `p`.`eisdiele_id`) and (`p`.`typ` = 'kugel') and (`p`.`gemeldet_am` = (select max(`p2`.`gemeldet_am`) from `preise` `p2` where ((`p2`.`eisdiele_id` = `p`.`eisdiele_id`) and (`p2`.`typ` = 'kugel'))))))) where ((`c`.`typ` = 'Kugel') and (`c`.`geschmackbewertung` is not null) and (`c`.`größenbewertung` is not null))), `nutzer_scores` as (select `bewertete_checkins`.`eisdiele_id` AS `eisdiele_id`,`bewertete_checkins`.`nutzer_id` AS `nutzer_id`,count(0) AS `checkin_count`,avg(`bewertete_checkins`.`score`) AS `durchschnitt_score`,avg(`bewertete_checkins`.`geschmacksfaktor`) AS `durchschnitt_geschmacksfaktor`,avg(`bewertete_checkins`.`preisleistungsfaktor`) AS `durchschnitt_preisleistungsfaktor`,avg(`bewertete_checkins`.`geschmackbewertung`) AS `durchschnitt_geschmack`,avg(`bewertete_checkins`.`preisleistungsfaktor`) AS `durchschnitt_preisleistung` from `bewertete_checkins` group by `bewertete_checkins`.`eisdiele_id`,`bewertete_checkins`.`nutzer_id`), `gewichtete_scores` as (select `nutzer_scores`.`eisdiele_id` AS `eisdiele_id`,`nutzer_scores`.`nutzer_id` AS `nutzer_id`,sqrt(`nutzer_scores`.`checkin_count`) AS `gewicht`,(`nutzer_scores`.`durchschnitt_score` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_score`,(`nutzer_scores`.`durchschnitt_preisleistungsfaktor` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_preisleistungsfaktor`,(`nutzer_scores`.`durchschnitt_geschmack` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmack`,(`nutzer_scores`.`durchschnitt_geschmacksfaktor` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmacksfaktor`,(`nutzer_scores`.`durchschnitt_preisleistung` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_preisleistung` from `nutzer_scores`) select `g`.`eisdiele_id` AS `eisdiele_id`,round((sum(`g`.`gewichteter_score`) / nullif(sum(`g`.`gewicht`),0)),2) AS `finaler_kugel_score`,round((sum(`g`.`gewichteter_geschmack`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmack`,round((sum(`g`.`gewichteter_geschmacksfaktor`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmacksfaktor`,round((sum(`g`.`gewichteter_preisleistungsfaktor`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_preisleistungsfaktor`,round((sum(`g`.`gewichteter_preisleistung`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_preisleistung` from `gewichtete_scores` `g` group by `g`.`eisdiele_id`  ;

-- --------------------------------------------------------

--
-- Struktur des Views `softeis_scores`
--
DROP TABLE IF EXISTS `softeis_scores`;

CREATE ALGORITHM=UNDEFINED DEFINER=`USER439770_wed`@`%` SQL SECURITY DEFINER VIEW `softeis_scores`  AS   with `bewertete_checkins` as (select `checkins`.`nutzer_id` AS `nutzer_id`,`checkins`.`eisdiele_id` AS `eisdiele_id`,`checkins`.`geschmackbewertung` AS `geschmackbewertung`,`checkins`.`preisleistungsbewertung` AS `preisleistungsbewertung`,(case when (`checkins`.`waffelbewertung` is null) then (`checkins`.`geschmackbewertung` / 5.0) else (((4 * `checkins`.`geschmackbewertung`) + `checkins`.`waffelbewertung`) / 25.0) end) AS `geschmacksfaktor`,round((1 + (4 * (((0.7 * (case when (`checkins`.`waffelbewertung` is null) then (`checkins`.`geschmackbewertung` / 5.0) else (((4 * `checkins`.`geschmackbewertung`) + `checkins`.`waffelbewertung`) / 25.0) end)) + (0.3 * `checkins`.`preisleistungsbewertung`)) / 2.2))),4) AS `score` from `checkins` where ((`checkins`.`typ` = 'Softeis') and (`checkins`.`geschmackbewertung` is not null) and (`checkins`.`preisleistungsbewertung` is not null))), `nutzer_scores` as (select `bewertete_checkins`.`eisdiele_id` AS `eisdiele_id`,`bewertete_checkins`.`nutzer_id` AS `nutzer_id`,count(0) AS `checkin_count`,avg(`bewertete_checkins`.`score`) AS `durchschnitt_score`,avg(`bewertete_checkins`.`geschmacksfaktor`) AS `durchschnitt_geschmacksfaktor`,avg(`bewertete_checkins`.`geschmackbewertung`) AS `durchschnitt_geschmack`,avg(`bewertete_checkins`.`preisleistungsbewertung`) AS `durchschnitt_preisleistung` from `bewertete_checkins` group by `bewertete_checkins`.`eisdiele_id`,`bewertete_checkins`.`nutzer_id`), `gewichtete_scores` as (select `nutzer_scores`.`eisdiele_id` AS `eisdiele_id`,`nutzer_scores`.`nutzer_id` AS `nutzer_id`,sqrt(`nutzer_scores`.`checkin_count`) AS `gewicht`,(`nutzer_scores`.`durchschnitt_score` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_score`,(`nutzer_scores`.`durchschnitt_geschmack` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmack`,(`nutzer_scores`.`durchschnitt_geschmacksfaktor` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmacksfaktor`,(`nutzer_scores`.`durchschnitt_preisleistung` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_preisleistung` from `nutzer_scores`) select `g`.`eisdiele_id` AS `eisdiele_id`,round((sum(`g`.`gewichteter_score`) / nullif(sum(`g`.`gewicht`),0)),2) AS `finaler_softeis_score`,round((sum(`g`.`gewichteter_geschmack`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmack`,round((sum(`g`.`gewichteter_geschmacksfaktor`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmacksfaktor`,round((sum(`g`.`gewichteter_preisleistung`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_preisleistung` from `gewichtete_scores` `g` group by `g`.`eisdiele_id`  ;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `attribute`
--
ALTER TABLE `attribute`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indizes für die Tabelle `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indizes für die Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `award_id` (`award_id`,`level`);

--
-- Indizes für die Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bewertung` (`eisdiele_id`,`nutzer_id`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- Indizes für die Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD PRIMARY KEY (`bewertung_id`,`attribut_id`),
  ADD KEY `attribut_id` (`attribut_id`);

--
-- Indizes für die Tabelle `bilder`
--
ALTER TABLE `bilder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `bewertung_id` (`bewertung_id`),
  ADD KEY `fk_bilder_nutzer` (`nutzer_id`);

--
-- Indizes für die Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `fk_country_id` (`land_id`);

--
-- Indizes für die Tabelle `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nutzer_id` (`nutzer_id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`);

--
-- Indizes für die Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`);

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
-- Indizes für die Tabelle `favoriten`
--
ALTER TABLE `favoriten`
  ADD PRIMARY KEY (`nutzer_id`,`eisdiele_id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`);

--
-- Indizes für die Tabelle `laender`
--
ALTER TABLE `laender`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indizes für die Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`,`bundesland_id`),
  ADD KEY `bundesland_id` (`bundesland_id`);

--
-- Indizes für die Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indizes für die Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- Indizes für die Tabelle `preise`
--
ALTER TABLE `preise`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eisdiele_id` (`eisdiele_id`,`typ`,`gemeldet_von`,`preis`),
  ADD KEY `gemeldet_von` (`gemeldet_von`);

--
-- Indizes für die Tabelle `rate_limit`
--
ALTER TABLE `rate_limit`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `routen`
--
ALTER TABLE `routen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- Indizes für die Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`award_id`,`level`),
  ADD KEY `award_id` (`award_id`,`level`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `attribute`
--
ALTER TABLE `attribute`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT für Tabelle `awards`
--
ALTER TABLE `awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT für Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT für Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `bilder`
--
ALTER TABLE `bilder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT für Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT für Tabelle `checkins`
--
ALTER TABLE `checkins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT für Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=266;

--
-- AUTO_INCREMENT für Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=174;

--
-- AUTO_INCREMENT für Tabelle `laender`
--
ALTER TABLE `laender`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT für Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT für Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT für Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `preise`
--
ALTER TABLE `preise`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=216;

--
-- AUTO_INCREMENT für Tabelle `rate_limit`
--
ALTER TABLE `rate_limit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT für Tabelle `routen`
--
ALTER TABLE `routen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT für Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `award_levels`
--
ALTER TABLE `award_levels`
  ADD CONSTRAINT `award_levels_ibfk_1` FOREIGN KEY (`award_id`) REFERENCES `awards` (`id`);

--
-- Constraints der Tabelle `bewertungen`
--
ALTER TABLE `bewertungen`
  ADD CONSTRAINT `bewertungen_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `bewertungen_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`);

--
-- Constraints der Tabelle `bewertung_attribute`
--
ALTER TABLE `bewertung_attribute`
  ADD CONSTRAINT `bewertung_attribute_ibfk_1` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bewertung_attribute_ibfk_2` FOREIGN KEY (`attribut_id`) REFERENCES `attribute` (`id`);

--
-- Constraints der Tabelle `bilder`
--
ALTER TABLE `bilder`
  ADD CONSTRAINT `bilder_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bilder_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bilder_ibfk_3` FOREIGN KEY (`bewertung_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bilder_nutzer` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE SET NULL;

--
-- Constraints der Tabelle `bundeslaender`
--
ALTER TABLE `bundeslaender`
  ADD CONSTRAINT `fk_country_id` FOREIGN KEY (`land_id`) REFERENCES `laender` (`id`);

--
-- Constraints der Tabelle `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`),
  ADD CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`);

--
-- Constraints der Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD CONSTRAINT `checkin_sorten_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `eisdielen`
--
ALTER TABLE `eisdielen`
  ADD CONSTRAINT `fk_eisdielen_bundesland` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`),
  ADD CONSTRAINT `fk_eisdielen_landkreis` FOREIGN KEY (`landkreis_id`) REFERENCES `landkreise` (`id`),
  ADD CONSTRAINT `fk_land_id` FOREIGN KEY (`land_id`) REFERENCES `laender` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `favoriten`
--
ALTER TABLE `favoriten`
  ADD CONSTRAINT `favoriten_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favoriten_ibfk_2` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `landkreise`
--
ALTER TABLE `landkreise`
  ADD CONSTRAINT `landkreise_ibfk_1` FOREIGN KEY (`bundesland_id`) REFERENCES `bundeslaender` (`id`);

--
-- Constraints der Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  ADD CONSTRAINT `passwort_reset_tokens_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `preise`
--
ALTER TABLE `preise`
  ADD CONSTRAINT `preise_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `preise_ibfk_2` FOREIGN KEY (`gemeldet_von`) REFERENCES `nutzer` (`id`);

--
-- Constraints der Tabelle `routen`
--
ALTER TABLE `routen`
  ADD CONSTRAINT `routen_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `routen_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`);

--
-- Constraints der Tabelle `user_awards`
--
ALTER TABLE `user_awards`
  ADD CONSTRAINT `user_awards_ibfk_1` FOREIGN KEY (`award_id`,`level`) REFERENCES `award_levels` (`award_id`, `level`),
  ADD CONSTRAINT `user_awards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
