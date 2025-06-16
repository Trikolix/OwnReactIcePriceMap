-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:25
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
(7, 1, 1, 3, 'uploads/award_icons/682d6347e611e_ChatGPT Image 21. Mai 2025, 07_22_15.png', 'Grenzgänger mit Geschmack', 'Du hast Eisdielen in 3 verschiedenen Landkreisen besucht! Dein Eishunger kennt keine Gemeindegrenzen – du bist auf süßer Entdeckungsreise.'),
(8, 1, 2, 5, 'uploads/award_icons/682ee7ea544cd_ChatGPT Image 22. Mai 2025, 10_48_34.png', 'Der Landkreis-Löffler', '5 Landkreise, 5 mal Eisliebe neu entdeckt! Du weißt: Jede Region hat ihre eigene Kugel-Philosophie – und du bist mittendrin.'),
(9, 1, 3, 7, 'uploads/award_icons/68303be9f0d21_ChatGPT Image 23. Mai 2025, 11_10_57.png', 'Kreisläufer auf Eis-Mission', '7 Landkreise voller Kugelkunst liegen hinter dir! Du bist ein echter Eis-Explorer, dein Gaumen hat schon fast einen eigenen Reisepass.'),
(10, 1, 4, 10, 'uploads/award_icons/68329e1a3e97d_1000080565.png', 'Der Eis-Nomade', '10 Landkreise, 10 mal Glück! Wo du auftauchst, schmilzt das Eis – und die Herzen gleich mit. Du bist die mobile Legende der Schleckkultur.'),
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
(71, 18, 1, 20, 'uploads/award_icons/68332a2d9e6c7_Design ohne Titel (1).png', 'Geschmackstreue', 'Vanille? Zitrone? Mango-Chili? Egal welche Sorte – du hast dich entschieden. Über 20-mal treu geblieben und jeder Kugel mit Hingabe begegnet. Diese geschmackliche Konsequenz verdient Respekt – und diesen Award.'),
(72, 15, 4, 10, 'uploads/awards/award_681f3091364e2.png', 'Routen-Ritter', 'Zehn Wege zur eisigen Ehre – du bringst Menschen auf Kurs in Sachen Genuss!'),
(74, 15, 5, 20, 'uploads/awards/award_681f3556122df.png', 'Komootisseur', 'Du bist nicht nur Eisliebhaber, sondern auch echter Pfadfinder des guten Geschmacks! Du hast bereits 20 öffentliche Routen erstellt.'),
(75, 19, 1, 3, 'uploads/awards/award_681f39a9cd717.png', 'Gelato Italiano', 'Du hast Eis in Italien eingecheckt – dort, wo die süßeste Versuchung zuhause ist!'),
(77, 19, 2, 2, 'uploads/awards/award_6820b536335c9.png', 'Zmrzlina-Zeit', 'Du hast in Tschechien Eis genossen – ein Hoch auf unsere Nachbarn und ihre kühle Köstlichkeit!'),
(78, 5, 4, 10, 'uploads/awards/award_6823936fd3bca.png', 'Becher-Kapitän', 'Zehn Eisbecher, unzählige Sorten – du steuerst zielsicher durch das Meer der Geschmacksexplosionen!'),
(79, 5, 5, 20, 'uploads/awards/award_682393fe340d1.png', 'Eis-Experte', 'Zwanzig Becher später ist klar: Du bist kein Genießer von gestern – du bist ein echter Eis-Experte mit ausgeprägtem Geschmackssinn und Durchhaltevermögen! 🍨💪'),
(80, 5, 6, 50, 'uploads/awards/award_682394c3a8d40.png', 'Eiskrone', 'Fünfzig Eisbecher – das ist nicht nur Leidenschaft, das ist Legende.\r\nDu hast dich zur wahren Majestät der gefrorenen Genüsse emporgeschleckt.\r\nDie Krone gehört dir – und sie ist aus Waffel. 👑🍦'),
(81, 4, 4, 20, 'uploads/awards/award_6823957de5bd5.png', 'Softeismeister', 'Zwanzigmal purer Genuss auf der Zunge – du bist ein wahrer Wirbelwind im Reich der cremigen Krönchen!'),
(82, 4, 5, 50, 'uploads/awards/award_68239653bb960.png', 'Der Eis-Overlord: 50 Softeis besiegt', 'Dieser besondere Award wird an all jene verliehen, die sich tapfer durch 50 Softeisportionen gekämpft haben – eine wahre Meisterleistung der Zuckergeschmacksnerven und Ausdauer! Der Weg zu diesem Preis ist nicht nur ein süßer Genuss, sondern auch eine wahre Herausforderung für den Gaumen. Herzlichen Glückwunsch für deinen eisigen Ehrgeiz!'),
(83, 7, 6, 100, 'uploads/award_icons/683325db311a5_100 Preise Gemeldet Abzeichen.png', 'Legendärer Preis-Entdecker', 'Du hast Einhundert Eisdielen mit Preisangaben versorgt – dein Preisradar ist legendär! Diese goldene Trophäe mit edlem Schliff und funkelnden Details zeichnet deinen Beitrag zur Eis-Transparenz gebührend aus.'),
(84, 7, 7, 250, 'uploads/award_icons/6832e49da2b7c_1000080604.png', 'Eispreis-König der Nation', 'Du hast die magische Marke von 250 Preis-Meldungen durchbrochen – und damit Eisdielen-Geschichte geschrieben. Dieser prunkvolle Award mit farbigen Edelsteinen ist das Zeichen deiner unermüdlichen Suche nach der Wahrheit in der Waffel.'),
(85, 19, 3, 4, 'uploads/award_icons/683556e2a20b3_ChatGPT Image 27. Mai 2025, 08_06_28.png', 'glace française', 'Eisurlaub in Frankreich – auf die deutsch-französische Eis-Freundschaft!'),
(86, 19, 4, 35, 'uploads/award_icons/6833295d2be12_Design ohne Titel.png', 'Polskie Lody', 'Du hast Eis in Polen gegessen!'),
(87, 20, 1, 1, 'uploads/award_icons/6837d0690f24c_1000081125.png', 'Eis-Kultur-Award Chemnitz 2025', 'Für den herausragenden kulturellen Beitrag, im Jahr 2025 ein Eis in Chemnitz, der Kulturhauptstadt Europas, genossen zu haben.\r\nMit jedem Löffel wurde nicht nur der Gaumen verwöhnt, sondern auch ein Zeichen gesetzt – für die genussvolle Verbindung von Hochkultur und Himbeerbecher.\r\nWeil wahre Kultur nicht nur in Museen, sondern auch in Waffeln steckt.\r\nChemnitz bedankt sich für diesen eiskalten Akt europäischer Verbundenheit.'),
(88, 19, 5, 44, 'uploads/award_icons/68354fb6a80f6_ChatGPT Image 27. Mai 2025, 07_36_06.png', 'Helado Hola', 'Ein Eis unter spanischer Sonne – ¡delicioso!'),
(89, 19, 6, 17, 'uploads/award_icons/683550383d8de_ChatGPT Image 27. Mai 2025, 07_38_42.png', 'Pagoto please', 'Ein eiskalter Genuss zwischen Olivenhainen und Ouzo.'),
(90, 19, 7, 13, 'uploads/award_icons/683550cc2849b_ChatGPT Image 27. Mai 2025, 07_40_53.png', 'Is-Tid', 'Skandinavisch cool: Ein dänisches Eis am Hafen.'),
(91, 19, 8, 31, 'uploads/award_icons/683558cb9de16_ChatGPT Image 27. Mai 2025, 08_15_16.png', 'Ijs-Tijd', 'Zwischen Grachten und Gouda: Eispause in den Niederlanden.'),
(92, 21, 1, 2, 'uploads/award_icons/684017e5d43b1_ChatGPT Image 4. Juni 2025, 11_54_03.png', 'Welt-Eis-Einsteiger', 'Du hast Eis in 2 verschiedenen Ländern gegessen. Ein kleiner Schritt für die Welt – ein großer für deinen Geschmackssinn!'),
(93, 19, 9, 36, 'uploads/award_icons/6837e32f5d75c_1000081129.png', 'Gelado português', 'Hat ein Eis in Portugal genossen – wo Sonne, Küste und Geschmack aufeinandertreffen.'),
(94, 19, 10, 48, 'uploads/award_icons/683c0e2f0c852_IT\'S TEA ICE TIME.png', 'It\'s ice time!', 'Ein Eis im Vereinigten Königreich? Mutig – und stilvoll! Zwischen Regen und Royals hast du dich zum Eis bekannt.'),
(95, 19, 11, 10, 'uploads/award_icons/683c0eb5ac027_ChatGPT Image 1. Juni 2025, 10_24_45.png', 'Echt belgisch!', 'Du hast in Belgien Eis gegessen – dort, wo sich Schokolade, Waffeln und Weltklasse-Geschmack vereinen. Très délicieux, sehr lekker!'),
(96, 20, 2, 2, 'uploads/award_icons/683c0f1dbb800_ChatGPT Image 1. Juni 2025, 10_27_41.png', 'Eis-Kultur-Award Nova Gorica 2025', 'Für den herausragenden kulturellen Beitrag, im Jahr 2025 ein Eis in Nova Gorica, der Kulturhauptstadt Europas, genossen zu haben.\r\nMit jedem Löffel wurde nicht nur der Gaumen verwöhnt, sondern auch ein Zeichen gesetzt – für die genussvolle Verbindung von Hochkultur und Himbeerbecher.\r\nWeil wahre Kultur nicht nur in Museen, sondern auch in Waffeln steckt.\r\nChemnitz bedankt sich für diesen eiskalten Akt europäischer Verbundenheit.'),
(97, 20, 3, 3, 'uploads/award_icons/683c0f674860d_ChatGPT Image 1. Juni 2025, 10_28_55.png', 'Kulturkugel-Kombi 2025', 'Dieser besondere Award ehrt alle, die 2025 in beiden Europäischen Kulturhauptstädten – Chemnitz und Nova Gorica – Eis gegessen haben. Symbolisch verbindet eine stilisierte Brücke die zwei Städte über kulturelle Grenzen hinweg. Eisgenuss trifft Kulturverständnis – ein Zeichen für Entdeckergeist, Geschmack und Europa ohne Grenzen.\r\nWeil wahre Kultur nicht nur in Museen, sondern auch in Waffeln steckt.\r\nChemnitz bedankt sich für diesen eiskalten Akt europäischer Verbundenheit.'),
(98, 9, 2, 2, 'uploads/award_icons/683d524864263_3b4ce87d-8909-4c1d-ad1f-074e0b736c19.png', 'Eine softe Kugel', 'An einem Tag hast du ein Softeis und ein Kugeleis gegessen. Du hast den Geschmackskampf hautnah miterlebt und kannst nun selbst entscheiden, welches besser schmeckt!'),
(100, 22, 1, 1, 'uploads/award_icons/683d615fa5b6d_Design ohne Titel (2).png', 'Eisvulkanologe Thüringens', 'Wer 30 Eis in Thüringen schleckt, darf sich mit Fug und Recht Eisvulkanologe Thüringens nennen. Vom Eisbecher auf dem Erfurter Domplatz bis zur Kugel im Thüringer Wald – dieser Titel würdigt deinen kühlen Forschergeist zwischen Bratwurst und Burgruinen.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.'),
(101, 22, 4, 18, 'uploads/award_icons/683d63b404630_ChatGPT Image 2. Juni 2025, 10_34_22.png', 'Berliner Eisdiplom', 'Du hast 30-mal Eis in der Hauptstadt gegessen? Dann bekommst du das Berliner Eisdiplom! Zwischen Späti, Street Art und Spree ist dein Geschmack genauso vielfältig wie die Stadt selbst.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.'),
(102, 22, 3, 7, 'uploads/award_icons/683d64a4e6bed_ChatGPT Image 2. Juni 2025, 10_44_18.png', 'Bayerischer Eiskrone-Träger', '30 Eis in Bayern? Das ist königlich! Mit diesem Titel wirst du Teil des süßesten Hofstaats des Südens – ein Eiskrone-Träger durch und durch'),
(103, 22, 2, 3, 'uploads/award_icons/683d64c9f2c51_Kein Titel (1024 x 1024 px).png', 'Kurfürstlicher Eisexperte Sachsens', 'Du hast dich durch die Kugeln des Königreichs geschleckt – von der Leipziger Pfefferminzschnitte bis zum Erzgebirgs-Kirschtraum. Mit 30 Eis in Sachsen auf dem Zähler bist du jetzt offiziell Kurfürstlicher Eisexperte Sachsens!\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.'),
(104, 22, 5, 19, 'uploads/award_icons/683eb6e1dc97d_ChatGPT Image 3. Juni 2025, 10_47_24.png', 'Hansestädtischer Eiskapitän Hamburgs', 'Wer sich durch 30 Hamburger Kugeln geschleckt hat, wird zum Hansestädtischen Eiskapitän befördert. Zwischen Alster, Hafen und Hafeneis zeigt sich: die Zunge ist dein Kompass.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.'),
(105, 22, 6, 2, 'uploads/award_icons/683eb8dee9fe2_ChatGPT Image 3. Juni 2025, 10_56_49.png', 'Eisreformator Sachsen-Anhalts', 'Für wahre Genießer, die mindestens 30 Kugeln Eis im Land der Reformation verspeist haben.'),
(106, 22, 7, 5, 'uploads/award_icons/683eb979c4c51_ChatGPT Image 3. Juni 2025, 10_59_25.png', 'Preußischer Eiskanzler Brandenburgs', 'Verliehen an Eisliebhaber, die sich den preußischen Genussstandards in mindestens 30 Portionen Eis in Brandenburg unterzogen haben.'),
(107, 22, 8, 17, 'uploads/award_icons/683eba2ab9a29_ChatGPT Image 3. Juni 2025, 11_02_12.png', 'Schleckbaron von Baden-Württemberg', 'Für standesgemäßen Genuss süddeutscher Eisfreuden – 30 Eisportionen im Baden-Württembergischen Ländle vernascht.'),
(108, 22, 9, 15, 'uploads/award_icons/6841b9472aa30_ChatGPT Image 5. Juni 2025, 17_35_23.png', 'Eisgraf von Hessen', 'Frankfurter Kranz ist was für Anfänger – echte Genießer:innen holen sich 30 Portionen Eis aus allen Ecken Hessens. Vom Fachwerk-Flair bis zum Skyline-Scooping: Wer hier ausdauernd löffelt, wird zum Eisgrafen gekrönt – natürlich mit extra Sahne auf dem Wappeneis.'),
(109, 21, 2, 3, NULL, 'Eis-Grenzgänger', '3 Länder, 3 Kugeln, 3x Glück. Du bist bereit, Grenzen für Eis zu überschreiten!'),
(110, 21, 3, 5, NULL, 'Eis-Entdecker', 'Du hast die halbe Welt für Eis erkundet – 5 Länder, 5 Geschmacksexplosionen!'),
(111, 21, 4, 7, NULL, 'Kugel-Weltenbummler', 'Eis in 7 Ländern? Dein Löffel ist ein Kompass. Und der zeigt immer Richtung Eisdiele!'),
(112, 21, 5, 10, NULL, 'Eis-Diplomat', 'Du hast Eis auf 10 internationalen Bühnen genossen. Wenn es um Eis geht, bist du ein Global Player!'),
(113, 22, 10, 22, 'uploads/award_icons/6841ba5b2a3fa_ChatGPT Image 5. Juni 2025, 17_37_08.png', 'Norddeutscher Eishengst Niedersachsens', 'Wer 30 Kugeln Eis zwischen der Lüneburger Heide und den Nordseewellen verputzt hat, verdient mehr als Applaus – er oder sie galoppiert direkt in den Kreis der „Eishengste“. Ob mit Sand zwischen den Zehen oder Kuhglocken im Ohr: Diese Auszeichnung ist nichts für Zuckerscheue.'),
(114, 22, 11, 23, 'uploads/award_icons/6841bb25c3e02_ChatGPT Image 5. Juni 2025, 17_40_31.png', 'Eislandgraf Nordrhein-Westfalens', 'Drei Kugeln, drei Symbole, ein Titel: Wer im Schatten des Doms, am Pott oder entlang des Rheins mindestens 30 Portionen Eis verdrückt, darf sich mit Fug und Recht Eislandgraf nennen. Der Adelstitel mit Sahnehaube für alle, die sich durch die kulinarischen Regionen NRWs geschleckt haben.'),
(115, 22, 12, 21, 'uploads/award_icons/6847eb206d221_ChatGPT Image 10. Juni 2025, 10_16_15.png', 'Küstenschlecker Mecklenburg-Vorpommerns', 'Verliehen an echte Eis-Lotsen der Ostsee! Wer 30 Portionen Eis zwischen Seebrücken, Möwen und Sanddünen geschleckt hat, darf sich stolz „Küstenschlecker“ nennen. Dieser Orden weht mit salziger Brise und cremiger Würde – mit extra Sahne on top!'),
(116, 23, 1, 1, 'uploads/award_icons/684fb689be56d_ChatGPT Image 16. Juni 2025, 08_15_28.png', 'Sattelstart-Award', 'Du hast deine erste Eisdiele auf zwei Rädern erobert – willkommen in der Community der Eis-Radler!'),
(117, 23, 2, 3, 'uploads/award_icons/684fb75051017_ChatGPT Image 16. Juni 2025, 08_16_11.png', 'Bronzene Speiche', 'Drei Touren, drei Kugeln – du trittst nicht nur in die Pedale, sondern auch in die Hall of Cream!'),
(118, 23, 3, 5, 'uploads/award_icons/684fb77d65ed7_ChatGPT Image 16. Juni 2025, 08_19_33.png', 'Silberkurbel', 'Fünfmal Eis per Rad – du kombinierst Ausdauer mit Genuss. Die silberne Kurbel ist dein Antrieb.'),
(119, 23, 4, 10, 'uploads/award_icons/684fb7b93dcb1_ChatGPT Image 16. Juni 2025, 08_20_30.png', 'Goldene Kette', 'Zehnmal bist du auf dem goldenen Weg zur perfekten Kugel – deine Kette glänzt wie dein Ehrgeiz.'),
(120, 23, 5, 50, 'uploads/award_icons/684fb84b4fd82_ChatGPT Image 16. Juni 2025, 08_22_59.png', 'Eislegende auf Rädern', 'Du bist eine Legende des Eisradelns. 50 Touren sprechen für Stil, Ausdauer und echten Geschmack.');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

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
