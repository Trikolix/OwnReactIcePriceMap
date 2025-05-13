-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 13. Mai 2025 um 09:53
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
(36, 7, 2, 3, 'uploads/awards/award_680b70b68a9cf.png', 'Preis-Detektiv', 'Drei Preise aufgespürt – du bringst Licht ins Preis-Dunkel!'),
(37, 7, 3, 5, 'uploads/awards/award_680b70d96a7c6.png', 'Preis-Profi', 'Deine Meldungen helfen anderen, nicht aufs (Eis-)Glatteis geführt zu werden!'),
(38, 7, 4, 10, 'uploads/awards/award_680b71c9f1527.png', 'Preis-Pionier', 'Du sorgst für Transparenz im Eis-Dschungel – Chapeau!'),
(39, 7, 5, 20, 'uploads/awards/award_680b730a16943.png', 'Kugel-Kommissar', 'Du hast den Preis-Finger am Puls der Kugel – echte Aufklärungsarbeit!'),
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
(77, 19, 2, 2, 'uploads/awards/award_6820b536335c9.png', 'Zmrzlina-Zeit', 'Du hast in Tschechien Eis genossen – ein Hoch auf unsere Nachbarn und ihre kühle Köstlichkeit!');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

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
