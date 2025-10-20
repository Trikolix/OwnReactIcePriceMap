-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 18. Okt 2025 um 17:21
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
  `description_de` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `ep` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `award_levels`
--

INSERT INTO `award_levels` (`id`, `award_id`, `level`, `threshold`, `icon_path`, `title_de`, `description_de`, `ep`) VALUES
(7, 1, 1, 3, 'uploads/award_icons/682d6347e611e_ChatGPT Image 21. Mai 2025, 07_22_15.png', 'Grenzgänger mit Geschmack', 'Du hast Eisdielen in 3 verschiedenen Landkreisen besucht! Dein Eishunger kennt keine Gemeindegrenzen – du bist auf süßer Entdeckungsreise.', 50),
(8, 1, 2, 5, 'uploads/award_icons/682ee7ea544cd_ChatGPT Image 22. Mai 2025, 10_48_34.png', 'Der Landkreis-Löffler', '5 Landkreise, 5 mal Eisliebe neu entdeckt! Du weißt: Jede Region hat ihre eigene Kugel-Philosophie – und du bist mittendrin.', 100),
(9, 1, 3, 7, 'uploads/award_icons/68303be9f0d21_ChatGPT Image 23. Mai 2025, 11_10_57.png', 'Kreisläufer auf Eis-Mission', '7 Landkreise voller Kugelkunst liegen hinter dir! Du bist ein echter Eis-Explorer, dein Gaumen hat schon fast einen eigenen Reisepass.', 150),
(10, 1, 4, 10, 'uploads/award_icons/68329e1a3e97d_1000080565.png', 'Der Eis-Nomade', '10 Landkreise, 10 mal Glück! Wo du auftauchst, schmilzt das Eis – und die Herzen gleich mit. Du bist die mobile Legende der Schleckkultur.', 250),
(11, 1, 5, 20, 'uploads/award_icons/682d64a4a0d8b_21. Mai 2025, 07_12_42.png', 'Der Landkr(eis)könig', '20 Landkreise? Du bist die höchste Eisdielen-Instanz im Umkreis von 200 Kilometern. Wer dir folgt, folgt dem Geschmack.', 500),
(12, 6, 1, 1, 'uploads/awards/award_6808d7097cc6e.png', 'Erster Schnappschuss', 'Du hast dein allererstes Foto eingereicht – ein historischer Moment! Jetzt wissen wir: Du kannst nicht nur Eis essen, sondern auch knipsen.', 20),
(13, 6, 3, 20, 'uploads/awards/award_6808d733e0df6.png', 'Der Eisfluencer', '20 visuelle Eiswerke später: Du bringst Glanz in jede Waffel und Stil in jeden Becher. Insta-worthy durch und durch!', 150),
(14, 6, 4, 50, 'uploads/awards/award_6808d7638faaa.png', 'Fotogeschmacksexperte', '50 mal Eis, 50 mal Klick – du dokumentierst Eiskunst wie ein Profi. Deine Galerie ist eine Ode an den Sommer.', 300),
(15, 6, 2, 10, 'uploads/awards/award_6809f6c323bbe.png', 'Kugel-Knipser', '10 Fotos, 10 mal Genuss im Bildformat! Deine Kamera liebt Eis fast so sehr wie du – weiter so!', 60),
(16, 6, 5, 100, 'uploads/awards/award_6809f8a524f5e.png', 'Der Paparazzi des Speiseeises', '100 Fotos? Du bist der Meister der eiskalten Momentaufnahmen. Wenn irgendwo Eis serviert wird, bist du mit der Linse schon da.', 500),
(22, 9, 1, 1, 'uploads/awards/award_680ae7ac902bf.png', 'Heilige Dreifaltigkeit', 'Du hast das Eis-Universum komplettiert: Kugeleis, Softeis und Eisbecher – alle genossen! Ein wahrer Eis-Gläubiger auf Pilgerreise zum ultimativen Genuss.', 100),
(23, 10, 1, 1, 'uploads/awards/award_680ae9bb9320f.png', 'Fürst Pückler ', 'Du bist ein echter Klassiker! Mit Vanille, Erdbeer und Schoko hast du die legendäre Fürst-Pückler-Kombination vollendet. Ein Hoch auf deinen traditionellen Geschmack!', 100),
(24, 11, 1, 1, 'uploads/awards/award_680aee0db3554.png', 'Perfekte Woche ', '7 Tage, 7 Eisdielen, 7 Glücksmomente! Du hast eine ganze Woche lang täglich Eis eingecheckt – wahrlich eine perfekte Woche voller süßer Abenteuer', 400),
(27, 3, 1, 3, 'uploads/awards/award_680a357b235ed.png', 'Kugel-Kenner', '3 Kugeln Eis – du weißt, was schmeckt! Deine Geschmacksknospen haben sich gerade aufgewärmt – das Abenteuer hat gerade erst begonnen.', 10),
(28, 3, 2, 10, 'uploads/awards/award_680a35a2d3362.png', 'Triple-Scooper', '10 Kugeln – du jonglierst Sorten wie ein echter Profi! Du bist auf dem besten Weg zur Eis-Elite.', 40),
(29, 3, 3, 50, 'uploads/awards/award_680a35c35870e.png', 'Eisberg voraus!', '50 Kugeln! (Kein Scherz.) Du bist offiziell eine wandelnde Eisdiele. Deine Lieblingssorte kennt dich beim Namen.', 150),
(30, 3, 4, 100, 'uploads/awards/award_680a35e047707.png', 'Der Kugel-Kapitän', '100 Kugeln – du steuerst souverän durch jede Eiskarte. Dein Löffel ist dein Kompass, dein Magen ein Tresor für Glück.', 500),
(31, 3, 5, 200, 'uploads/awards/award_680a3634585f6.png', 'Die Legende der Löffel', '200 Kugeln?! Du bist ein Mythos unter Eisfreunden. Irgendwo erzählt man sich Geschichten über dich – der oder die, der alles probiert hat. Mehrfach.', 1000),
(32, 8, 1, 1, 'uploads/awards/award_680b6aab6fcc0.png', 'Eisdielen-Entdecker', 'Du hast deine erste Eisdiele eingetragen. Der Anfang einer leckeren Reise!', 30),
(33, 8, 2, 3, 'uploads/awards/award_680b6ac7bec0d.png', 'Eisdielen-Kundschafter', 'Drei neue Eisdielen von dir entdeckt – danke für die Vielfalt!', 60),
(34, 8, 4, 10, 'uploads/awards/award_680b6c6685927.png', 'Eisdielen-Botschafter', 'Mit zehn neuen Eisdielen hast du die Karte spürbar erweitert.', 250),
(35, 7, 1, 1, 'uploads/awards/award_680b70853fa69.png', 'Preis-Späher', 'Du hast den ersten Preis entdeckt – Wissen ist Kugel-Macht!', 20),
(36, 7, 2, 5, 'uploads/award_icons/682ee58829bf5_5 PREISE GEMELDET.png', 'Preis-Detektiv', '5 Preise aufgespürt – du bringst Licht ins Preis-Dunkel!', 50),
(37, 7, 3, 10, 'uploads/award_icons/682ee79251e00_ChatGPT Image 22. Mai 2025, 10_57_21.png', 'Preis-Profi', 'Deine Meldungen helfen anderen, nicht aufs (Eis-)Glatteis geführt zu werden!', 100),
(38, 7, 4, 25, 'uploads/award_icons/68303b8850e48_ChatGPT Image 23. Mai 2025, 11_08_52.png', 'Preis-Pionier', 'Du sorgst für Transparenz im Eis-Dschungel – Chapeau!', 200),
(39, 7, 5, 50, 'uploads/award_icons/68303c63e8f74_ChatGPT Image 23. Mai 2025, 11_13_30.png', 'Kugel-Kommissar', 'Du hast den Preis-Finger am Puls der Kugel und hast schon 50 Preise für Eis gemeldet – echte Aufklärungsarbeit!', 400),
(40, 2, 1, 1, 'uploads/awards/award_680b74ac2beaa.png', 'Erster Löffel!', 'Dein erster Check-in – wie aufregend! (1/∞) Der Start eines großen Abenteuers, mit vielen leckeren Kugeln und klebrigen Fingern. Jetzt geht’s erst richtig los!', 10),
(41, 2, 2, 3, 'uploads/awards/award_680b7678539f0.png', 'Eis-Entdecker', '3 Check-Ins und du bist schon auf Entdeckungstour! Neue Sorten, neue Orte – dein Löffel hat sich offiziell auf die Reise gemacht.', 30),
(42, 8, 3, 5, 'uploads/awards/award_680b7741d9ce8.png', 'Eisdielen Influencer', 'Fünf Eisdielen hast du auf die Karte gebracht – echte Pionierarbeit!', 120),
(43, 8, 5, 20, 'uploads/awards/award_680b789583229.png', 'Reiseguru für Eisdielen', '20 neue Eisdielen? Wahnsinn! Ohne dich wäre die Eislandschaft nur halb so süß.', 500),
(44, 4, 1, 1, 'uploads/awards/award_680b78ddb85fb.png', 'Softie-Starter', 'Dein allererstes Softeis! (1 Softeis) Noch wackelt die Waffel – aber der erste Schleck ist gemacht. Willkommen in der cremigen Welt der Drehmaschinen!', 10),
(45, 2, 3, 5, 'uploads/awards/award_680bb72e3099e.png', 'Schnupper-Profi', 'Mit 5 Check-Ins bist du kein Anfänger mehr. Dein Bauch freut sich, dein Gaumen kennt schon so einiges – und du weißt: Es geht noch mehr!', 50),
(46, 2, 4, 10, 'uploads/awards/award_680bb7957c22f.png', 'Stammgast in Spe', '10-mal eingecheckt – man kennt dich! Die Kugelverkäufer nicken dir zu. Noch ein paar Besuche, und du bekommst den Ehrenlöffel.', 100),
(47, 2, 5, 20, 'uploads/awards/award_680bb81fd37a2.png', 'Eis-Kenner', '20 Check-Ins sprechen eine klare Sprache: Du bist ein Genießer mit Erfahrung. Du erkennst gute Sorten blind – und isst trotzdem mit offenen Augen.', 200),
(48, 2, 6, 50, 'uploads/awards/award_680bb90c0f608.png', 'Eisdielen-Legende', 'Schon 50-mal eingecheckt! Man erzählt sich von dir – du bist der oder die mit dem unersättlichen Hunger nach Kugelglück.', 500),
(49, 2, 7, 100, 'uploads/awards/award_680bb947a5fdc.png', 'Großmeister der Gelaterias', 'Du bist nicht einfach Genießer – du bist Legende. Hundertfach eingecheckt, hundertfach gefeiert. Dein Weg ist gepflastert mit Eiskugeln und Ruhm!', 1000),
(50, 2, 8, 200, 'uploads/awards/award_680bb971e5094.png', 'Unaufhaltbarer Eis-König', 'Zweihundert Checkins, unzählige Sorten – du herrschst über das Reich des Eises wie kein anderer. Eine Legende auf zwei Rädern mit einem unstillbaren Appetit auf Genuss!', 2000),
(51, 4, 2, 3, 'uploads/awards/award_680bbb0e33857.png', 'Dreher der Herzen', '3-mal hast du dir ein Softeis gegönnt – das ist wahre Liebe in Spiralform! Dein Geschmackssinn hat jetzt offiziell den Swirl-Segen.', 40),
(52, 4, 3, 10, 'uploads/awards/award_680bbb252723c.png', 'Softe(r) Profi', '10 Softeis – du weißt genau, wie man die perfekte Höhe balanciert, ohne dass es tropft. Du bist bereit für extra Toppings und neidische Blicke.', 150),
(54, 5, 1, 1, 'uploads/awards/award_680f137b91177.png', 'Der erste Becher-Zauber', 'Du hast deinen allerersten Eisbecher verputzt! Ein kleiner Schritt für dich, ein großer Schritt für deine Liebe zum Eis.', 10),
(55, 5, 2, 3, 'uploads/awards/award_680f148944647.png', 'Becher-Bändiger', 'Drei Becher Eis? Du hast den Bogen raus! Dein Löffel ist jetzt offiziell dein Zauberstab.', 40),
(56, 12, 1, 2, 'uploads/awards/award_6811ca84adcf4.png', 'Grenzenloser Genuss', 'Du hast Eis in mindestens zwei verschiedenen Bundesländern geschleckt – echte Geschmacksexpedition mit Bundesländer-Bonus!', 50),
(57, 12, 2, 3, 'uploads/awards/award_68133071047d9.png', 'Dreiländer-Eis', 'Egal ob Nord, Süd oder irgendwo dazwischen – du bist quer durchs Land gereist und hast in drei Bundesländern Eisgenuss verbreitet.', 100),
(58, 12, 3, 4, 'uploads/awards/award_681330b5e67cd.png', 'Eisland-Erkunder', 'Du hast schon in vier Bundesländern Eis getestet – dein Gaumen kennt keine Landesgrenzen mehr!', 150),
(59, 12, 4, 5, 'uploads/awards/award_68133125997cc.png', 'LandesmEISter ', 'Fünf Bundesländer, fünfmal Eis – du bist auf dem besten Weg, zum Champion der Eis-Republik zu werden.', 250),
(60, 13, 1, 2, 'uploads/awards/award_6817be87d4265.png', 'Zwei auf einen Streich', 'Du hast zwei verschiedene Eisdielen an einem Tag besucht. Ein klarer Fall von Doppelt hält besser – oder einfach doppelt lecker!', 50),
(61, 13, 2, 3, 'uploads/awards/award_6817bf1c410ef.png', 'Eistripple', 'Drei Eisdielen an einem Tag – du bist offiziell auf Eis-Sightseeing-Tour!', 80),
(62, 13, 3, 4, 'uploads/awards/award_68190b3322ac0.png', 'Eis-Marathon', 'Vier Eisdielen, ein Tag – du hast Ausdauer bewiesen. Das war ein Eis-Marathon der Extraklasse!', 150),
(63, 13, 4, 5, 'uploads/awards/award_6819910757f21.png', 'Grand Schleck-Tour', 'Fünf Eisdielen an einem Tag – das ist wahre Hingabe! Du hast Geschichte geschrieben.', 250),
(64, 5, 3, 5, 'uploads/awards/award_6819f90d1c110.png', 'Meister der Becherkunst', 'Fünf Becher – und jedes Mal ein neues Abenteuer! Du bist auf dem besten Weg zum Eis-Sommelier.', 150),
(65, 14, 1, 1, 'uploads/awards/award_681bacbc937b0.png', 'Kilometer-Kugler', 'Zwei Eisdielen, ein Tag – und mehr als 100 Kilometer dazwischen!\r\nDu hast keine Mühen gescheut und bist dem Eis hinterhergereist.\r\nEgal ob mit dem Rad, dem Auto oder zu Fuß – das war ein weiter Weg für deinen Geschmack!\r\n(Mindestens 100 km Distanz zwischen den besuchten Eisdielen an einem Tag)', 150),
(66, 15, 1, 1, 'uploads/awards/award_681bb7932be9e.png', 'Wege zum Glück', 'Du hast deine erste Route geteilt – der Weg zum Eis ist jetzt offiziell schöner geworden!\r\n', 20),
(67, 15, 2, 3, 'uploads/awards/award_681bb847b0a75.png', 'Touren Tüftler ', 'Drei geniale Routen – du weißt einfach, wie man Rad- und Eisfreude perfekt kombiniert!', 30),
(68, 15, 3, 5, 'uploads/awards/award_681dc92f54104.png', 'GPS-Gourmet', 'Dein Geschmack kennt nicht nur bei Eis keine Grenzen – auch bei der Routenwahl liegst du goldrichtig! Du hast bereits 5 öffentliche Routen erstellt.', 50),
(69, 17, 1, 3, 'uploads/award_icons/689eef01c150c_Wiederholungstäter Medaille mit Eisdiele.png', 'Wiederholungstäter', 'Du warst schon drei Mal in derselben Eisdiele – das ist der Anfang einer wunderbaren Freundschaft. Willkommen im Club der Wiederholungstäter!', 50),
(70, 16, 1, 1, 'uploads/awards/award_681dc9f04fbaf.png', 'Eis-Schmuggler-Route', 'Du hast eine Route nur für dich geplant – ein exklusiver Weg zum Eisgenuss im Verborgenen!', 20),
(71, 18, 1, 4, 'uploads/award_icons/68c3bd7a9f935_1000103208.png', 'Geschmackstreue', 'Du hast viermal dieselbe Eissorte gewählt – echte Loyalität zum Lieblingsgeschmack!', 60),
(72, 15, 4, 10, 'uploads/awards/award_681f3091364e2.png', 'Routen-Ritter', 'Zehn Wege zur eisigen Ehre – du bringst Menschen auf Kurs in Sachen Genuss!', 80),
(74, 15, 5, 20, 'uploads/awards/award_681f3556122df.png', 'Komootisseur', 'Du bist nicht nur Eisliebhaber, sondern auch echter Pfadfinder des guten Geschmacks! Du hast bereits 20 öffentliche Routen erstellt.', 150),
(75, 19, 1, 3, 'uploads/awards/award_681f39a9cd717.png', 'Gelato Italiano', 'Du hast Eis in Italien eingecheckt – dort, wo die süßeste Versuchung zuhause ist!', 30),
(77, 19, 2, 2, 'uploads/awards/award_6820b536335c9.png', 'Zmrzlina-Zeit', 'Du hast in Tschechien Eis genossen – ein Hoch auf unsere Nachbarn und ihre kühle Köstlichkeit!', 30),
(78, 5, 4, 10, 'uploads/awards/award_6823936fd3bca.png', 'Becher-Kapitän', 'Zehn Eisbecher, unzählige Sorten – du steuerst zielsicher durch das Meer der Geschmacksexplosionen!', 300),
(79, 5, 5, 20, 'uploads/awards/award_682393fe340d1.png', 'Eis-Experte', 'Zwanzig Becher später ist klar: Du bist kein Genießer von gestern – du bist ein echter Eis-Experte mit ausgeprägtem Geschmackssinn und Durchhaltevermögen! 🍨💪', 600),
(80, 5, 6, 50, 'uploads/awards/award_682394c3a8d40.png', 'Eiskrone', 'Fünfzig Eisbecher – das ist nicht nur Leidenschaft, das ist Legende.\r\nDu hast dich zur wahren Majestät der gefrorenen Genüsse emporgeschleckt.\r\nDie Krone gehört dir – und sie ist aus Waffel. 👑🍦', 1000),
(81, 4, 4, 20, 'uploads/awards/award_6823957de5bd5.png', 'Softeismeister', 'Zwanzigmal purer Genuss auf der Zunge – du bist ein wahrer Wirbelwind im Reich der cremigen Krönchen!', 250),
(82, 4, 5, 50, 'uploads/awards/award_68239653bb960.png', 'Der Eis-Overlord: 50 Softeis besiegt', 'Dieser besondere Award wird an all jene verliehen, die sich tapfer durch 50 Softeisportionen gekämpft haben – eine wahre Meisterleistung der Zuckergeschmacksnerven und Ausdauer! Der Weg zu diesem Preis ist nicht nur ein süßer Genuss, sondern auch eine wahre Herausforderung für den Gaumen. Herzlichen Glückwunsch für deinen eisigen Ehrgeiz!', 500),
(83, 7, 6, 100, 'uploads/award_icons/683325db311a5_100 Preise Gemeldet Abzeichen.png', 'Legendärer Preis-Entdecker', 'Du hast Einhundert Eisdielen mit Preisangaben versorgt – dein Preisradar ist legendär! Diese goldene Trophäe mit edlem Schliff und funkelnden Details zeichnet deinen Beitrag zur Eis-Transparenz gebührend aus.', 600),
(84, 7, 7, 250, 'uploads/award_icons/6832e49da2b7c_1000080604.png', 'Eispreis-König der Nation', 'Du hast die magische Marke von 250 Preis-Meldungen durchbrochen – und damit Eisdielen-Geschichte geschrieben. Dieser prunkvolle Award mit farbigen Edelsteinen ist das Zeichen deiner unermüdlichen Suche nach der Wahrheit in der Waffel.', 1000),
(85, 19, 3, 4, 'uploads/award_icons/683556e2a20b3_ChatGPT Image 27. Mai 2025, 08_06_28.png', 'glace française', 'Eisurlaub in Frankreich – auf die deutsch-französische Eis-Freundschaft!', 30),
(86, 19, 4, 35, 'uploads/award_icons/685148fa4544f_ChatGPT Image 17. Juni 2025, 12_50_48.png', 'Lody Polskie', 'Du hast Eis in Polen gegessen!', 30),
(87, 20, 1, 1, 'uploads/award_icons/6837d0690f24c_1000081125.png', 'Eis-Kultur-Award Chemnitz 2025', 'Für den kulturellen Beitrag, 2025 in Chemnitz – der Kulturhauptstadt Europas – ein Eis genossen zu haben. Mit jedem Löffel wurde Hochkultur mit Himbeerbecher verbunden. Denn wahre Kultur steckt nicht nur in Museen, sondern auch in Waffeln.', 50),
(88, 19, 5, 44, 'uploads/award_icons/68354fb6a80f6_ChatGPT Image 27. Mai 2025, 07_36_06.png', 'Helado Hola', 'Ein Eis unter spanischer Sonne – ¡delicioso!', 30),
(89, 19, 6, 17, 'uploads/award_icons/683550383d8de_ChatGPT Image 27. Mai 2025, 07_38_42.png', 'Pagoto please', 'Ein eiskalter Genuss zwischen Olivenhainen und Ouzo.', 30),
(90, 19, 7, 13, 'uploads/award_icons/683550cc2849b_ChatGPT Image 27. Mai 2025, 07_40_53.png', 'Is-Tid', 'Skandinavisch cool: Ein dänisches Eis am Hafen.', 30),
(91, 19, 8, 31, 'uploads/award_icons/683558cb9de16_ChatGPT Image 27. Mai 2025, 08_15_16.png', 'Ijs-Tijd', 'Zwischen Grachten und Gouda: Eispause in den Niederlanden.', 30),
(92, 21, 1, 2, 'uploads/award_icons/684017e5d43b1_ChatGPT Image 4. Juni 2025, 11_54_03.png', 'Welt-Eis-Einsteiger', 'Du hast Eis in 2 verschiedenen Ländern gegessen. Ein kleiner Schritt für die Welt – ein großer für deinen Geschmackssinn!', 20),
(93, 19, 9, 36, 'uploads/award_icons/6837e32f5d75c_1000081129.png', 'Gelado português', 'Hat ein Eis in Portugal genossen – wo Sonne, Küste und Geschmack aufeinandertreffen.', 30),
(94, 19, 10, 48, 'uploads/award_icons/685263071b0b1_ChatGPT Image 18. Juni 2025, 08_30_59.png', 'Scoop in the UK', 'Ein Eis im Vereinigten Königreich? Mutig – und stilvoll! Zwischen Regen und Royals hast du dich zum Eis bekannt.', 30),
(95, 19, 11, 10, 'uploads/award_icons/685246103f22e_ChatGPT Image 18. Juni 2025, 06_50_25.png', 'Echt belgisch!', 'Du hast in Belgien Eis gegessen – dort, wo sich Schokolade, Waffeln und Weltklasse-Geschmack vereinen. Très délicieux, sehr lekker!', 30),
(96, 20, 2, 2, 'uploads/award_icons/683c0f1dbb800_ChatGPT Image 1. Juni 2025, 10_27_41.png', 'Eis-Kultur-Award Nova Gorica 2025', 'Für den Genuss eines Eises 2025 in Nova Gorica, Europas Kulturhauptstadt. Ein Hoch auf die Verbindung von Hochkultur und Himbeerbecher – denn wahre Kultur steckt auch in der Waffel.', 50),
(97, 20, 3, 3, 'uploads/award_icons/683c0f674860d_ChatGPT Image 1. Juni 2025, 10_28_55.png', 'Kulturkugel-Kombi 2025', 'Dieser Award ehrt alle, die 2025 in Chemnitz und Nova Gorica Eis genossen haben. Eine symbolische Brücke verbindet beide Städte – Eisgenuss trifft Kulturverständnis. Denn wahre Kultur steckt nicht nur in Museen, sondern auch in Waffeln.', 150),
(98, 9, 2, 2, 'uploads/award_icons/683d524864263_3b4ce87d-8909-4c1d-ad1f-074e0b736c19.png', 'Eine softe Kugel', 'An einem Tag hast du ein Softeis und ein Kugeleis gegessen. Du hast den Geschmackskampf hautnah miterlebt und kannst nun selbst entscheiden, welches besser schmeckt!', 100),
(100, 22, 1, 1, 'uploads/award_icons/683d615fa5b6d_Design ohne Titel (2).png', 'Eisvulkanologe Thüringens', 'Wer 30 Eis in Thüringen schleckt, darf sich mit Fug und Recht Eisvulkanologe Thüringens nennen. Vom Eisbecher auf dem Erfurter Domplatz bis zur Kugel im Thüringer Wald – dieser Titel würdigt deinen kühlen Forschergeist zwischen Bratwurst und Burgruinen.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.', 350),
(101, 22, 4, 18, 'uploads/award_icons/683d63b404630_ChatGPT Image 2. Juni 2025, 10_34_22.png', 'Berliner Eisdiplom', 'Du hast 30-mal Eis in der Hauptstadt gegessen? Dann bekommst du das Berliner Eisdiplom! Zwischen Späti, Street Art und Spree ist dein Geschmack genauso vielfältig wie die Stadt selbst.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.', 350),
(102, 22, 3, 7, 'uploads/award_icons/683d64a4e6bed_ChatGPT Image 2. Juni 2025, 10_44_18.png', 'Bayerischer Eiskrone-Träger', '30 Eis in Bayern? Das ist königlich! Mit diesem Titel wirst du Teil des süßesten Hofstaats des Südens – ein Eiskrone-Träger durch und durch', 350),
(103, 22, 2, 3, 'uploads/award_icons/683d64c9f2c51_Kein Titel (1024 x 1024 px).png', 'Kurfürstlicher Eisexperte Sachsens', 'Du hast dich durch die Kugeln des Königreichs geschleckt – von der Leipziger Pfefferminzschnitte bis zum Erzgebirgs-Kirschtraum. Mit 30 Eis in Sachsen auf dem Zähler bist du jetzt offiziell Kurfürstlicher Eisexperte Sachsens!\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.', 350),
(104, 22, 5, 19, 'uploads/award_icons/683eb6e1dc97d_ChatGPT Image 3. Juni 2025, 10_47_24.png', 'Hansestädtischer Eiskapitän Hamburgs', 'Wer sich durch 30 Hamburger Kugeln geschleckt hat, wird zum Hansestädtischen Eiskapitän befördert. Zwischen Alster, Hafen und Hafeneis zeigt sich: die Zunge ist dein Kompass.\r\nEine Ehre, die einst nur August der Starke persönlich zuteilwurde.', 350),
(105, 22, 6, 2, 'uploads/award_icons/683eb8dee9fe2_ChatGPT Image 3. Juni 2025, 10_56_49.png', 'Eisreformator Sachsen-Anhalts', 'Für wahre Genießer, die mindestens 30 Kugeln Eis im Land der Reformation verspeist haben.', 350),
(106, 22, 7, 5, 'uploads/award_icons/683eb979c4c51_ChatGPT Image 3. Juni 2025, 10_59_25.png', 'Preußischer Eiskanzler Brandenburgs', 'Verliehen an Eisliebhaber, die sich den preußischen Genussstandards in mindestens 30 Portionen Eis in Brandenburg unterzogen haben.', 350),
(107, 22, 8, 17, 'uploads/award_icons/683eba2ab9a29_ChatGPT Image 3. Juni 2025, 11_02_12.png', 'Schleckbaron von Baden-Württemberg', 'Für standesgemäßen Genuss süddeutscher Eisfreuden – 30 Eisportionen im Baden-Württembergischen Ländle vernascht.', 350),
(108, 22, 9, 15, 'uploads/award_icons/6841b9472aa30_ChatGPT Image 5. Juni 2025, 17_35_23.png', 'Eisgraf von Hessen', 'Frankfurter Kranz ist was für Anfänger – echte Genießer:innen holen sich 30 Portionen Eis aus allen Ecken Hessens. Vom Fachwerk-Flair bis zum Skyline-Scooping: Wer hier ausdauernd löffelt, wird zum Eisgrafen gekrönt – natürlich mit extra Sahne auf dem Wappeneis.', 350),
(109, 21, 2, 3, 'uploads/award_icons/6855040a85f06_ChatGPT Image 20. Juni 2025, 08_47_00.png', 'Eis-Grenzgänger', '3 Länder, 3 Kugeln, 3x Glück. Du bist bereit, Grenzen für Eis zu überschreiten!', 50),
(110, 21, 3, 5, 'uploads/award_icons/68594cb14a2bf_ChatGPT Image 23. Juni 2025, 12_43_19.png', 'Welt-Eis-Abenteurer', 'Du hast die Eiskugeln dieser Welt erkundet – in fünf verschiedenen Ländern! Ob Sorbet in Spanien oder Matcha in Japan: Dein Geschmack kennt keine Grenzen. Ein echter Abenteurer der Eisvielfalt!', 150),
(111, 21, 4, 7, 'uploads/award_icons/685af308e3da1_ChatGPT Image 24. Juni 2025, 20_48_05.png', 'Welt-Eis-Entdecker', 'Du hast die Welt auf der Suche nach neuen Geschmackserlebnissen durchquert – sieben Länder, sieben Kugeln voller Abenteuer. Dein Gaumen kennt keine Grenzen!', 250),
(112, 21, 5, 10, 'uploads/award_icons/685af428a8f48_ChatGPT Image 24. Juni 2025, 20_52_58.png', 'Welt-Eis-Legende', 'Zehn Länder, zehn einzigartige Eiskugeln – du bist nicht einfach nur unterwegs, du bist eine lebende Legende der internationalen Eiskultur!', 500),
(113, 22, 10, 22, 'uploads/award_icons/6841ba5b2a3fa_ChatGPT Image 5. Juni 2025, 17_37_08.png', 'Norddeutscher Eishengst Niedersachsens', 'Wer 30 Kugeln Eis zwischen der Lüneburger Heide und den Nordseewellen verputzt hat, verdient mehr als Applaus – er oder sie galoppiert direkt in den Kreis der „Eishengste“. Ob mit Sand zwischen den Zehen oder Kuhglocken im Ohr: Diese Auszeichnung ist nichts für Zuckerscheue.', 350),
(114, 22, 11, 23, 'uploads/award_icons/6841bb25c3e02_ChatGPT Image 5. Juni 2025, 17_40_31.png', 'Eislandgraf Nordrhein-Westfalens', 'Drei Kugeln, drei Symbole, ein Titel: Wer im Schatten des Doms, am Pott oder entlang des Rheins mindestens 30 Portionen Eis verdrückt, darf sich mit Fug und Recht Eislandgraf nennen. Der Adelstitel mit Sahnehaube für alle, die sich durch die kulinarischen Regionen NRWs geschleckt haben.', 350),
(115, 22, 12, 21, 'uploads/award_icons/6847eb206d221_ChatGPT Image 10. Juni 2025, 10_16_15.png', 'Küstenschlecker Mecklenburg-Vorpommerns', 'Verliehen an echte Eis-Lotsen der Ostsee! Wer 30 Portionen Eis zwischen Seebrücken, Möwen und Sanddünen geschleckt hat, darf sich stolz „Küstenschlecker“ nennen. Dieser Orden weht mit salziger Brise und cremiger Würde – mit extra Sahne on top!', 350),
(116, 23, 1, 1, 'uploads/award_icons/68514ebca50ec_ChatGPT Image 16. Juni 2025, 08_15_28.png', 'Sattelstart-Award', 'Du hast deine erste Eisdiele auf zwei Rädern erobert – willkommen in der Community der Eis-Radler!', 20),
(117, 23, 2, 3, 'uploads/award_icons/684fb75051017_ChatGPT Image 16. Juni 2025, 08_16_11.png', 'Bronzene Speiche', 'Drei Touren, drei Kugeln – du trittst nicht nur in die Pedale, sondern auch in die Hall of Cream!', 30),
(118, 23, 3, 5, 'uploads/award_icons/684fb77d65ed7_ChatGPT Image 16. Juni 2025, 08_19_33.png', 'Silberkurbel', 'Fünfmal Eis per Rad – du kombinierst Ausdauer mit Genuss. Die silberne Kurbel ist dein Antrieb.', 50),
(119, 23, 4, 10, 'uploads/award_icons/684fb7b93dcb1_ChatGPT Image 16. Juni 2025, 08_20_30.png', 'Goldene Kette', 'Zehnmal bist du auf dem goldenen Weg zur perfekten Kugel – deine Kette glänzt wie dein Ehrgeiz.', 80),
(120, 23, 5, 50, 'uploads/award_icons/684fb84b4fd82_ChatGPT Image 16. Juni 2025, 08_22_59.png', 'Eislegende auf Rädern', 'Du bist eine Legende des Eisradelns. 50 Touren sprechen für Stil, Ausdauer und echten Geschmack.', 250),
(121, 19, 12, 50, 'uploads/award_icons/68514ea222a75_ChatGPT Image 17. Juni 2025, 08_12_07.png', 'GLYKÓ KYPRIÁKO', 'Du hast ein Eis auf der sonnigen Insel Zypern genossen – zwischen Ruinen, Olivenbäumen und Meeresbrise.', 30),
(122, 19, 13, 40, 'uploads/award_icons/68525c0b9ed81_ChatGPT Image 18. Juni 2025, 08_23_52.png', 'Glass i Sverige', 'Ein köstliches Eis in Schweden genossen – egal ob in Stockholm am Wasser, im hippen Göteborg oder mitten in Lappland. Wer sagt, dass Eis nur im Süden schmeckt?', 30),
(123, 19, 14, 46, 'uploads/award_icons/68525c5eb16d1_ChatGPT Image 18. Juni 2025, 08_24_59.png', 'FAGYI MAGYARORSZÁGON', 'Du hast dir in Ungarn ein Eis gegönnt! Ob am Balaton, in Budapest oder zwischen Paprikafeldern – dieser goldene Award feiert deinen süßen Moment im Land der Thermalbäder und Donau-Panoramen.', 30),
(124, 24, 1, 3, 'uploads/award_icons/68525f2aa3486_ChatGPT Image 18. Juni 2025, 08_37_53.png', 'Schleck-Schritt-Abzeichen', 'Der erste süße Schritt – du hast zu Fuß drei Eisdielen erreicht und das Abenteuer mit dem Löffel gekrönt.', 30),
(125, 24, 2, 5, 'uploads/award_icons/68525f7281777_ChatGPT Image 18. Juni 2025, 08_40_13.png', 'Bronzener Becherläufer', 'Fünfmal hast du die süße Versuchung auf Schusters Rappen bezwungen – ein echter Eisgeher mit Ausdauer!', 50),
(126, 25, 1, 1, 'uploads/award_icons/6852625b2b0f0_8aa6f840-d8d5-4019-89dd-18a39fda82bf.png', 'The Gourmet Biker Junior', 'Du hast deine erste Eisdiele mit dem Motorrad besucht und damit bewiesen, dass du ein wahrer Abenteurer bist. Der Wind in den Haaren und Eis in der Hand – was will man mehr?', 30),
(127, 24, 3, 10, 'uploads/award_icons/6852629166b13_ChatGPT Image 18. Juni 2025, 08_48_41.png', 'Silberne Schleckspur', 'Dein Weg ist gepflastert mit Schritten – und Eisklecksen. Zehnmal hast du gezeigt: wahre Schlecker gehen zu Fuß.', 100),
(128, 24, 4, 20, 'uploads/award_icons/6853b4ad09744_ChatGPT Image 19. Juni 2025, 08_54_28.png', 'Goldener Eiswanderer', 'Zwanzigmal hast du dich erhoben, bist gegangen – nicht für Ruhm, sondern für Eis. Und das mit Stil.', 200),
(129, 26, 1, 50, 'uploads/award_icons/685954b959375_ChatGPT Image 23. Juni 2025, 15_18_54.png', 'IceRocket Quickstarter', 'Du bist mit Vollgas in die Ice-App gestartet – als einer der ersten 50 Nutzer hast du die Eisdielenwelt aufgemischt und dabei Spuren im Eis hinterlassen. Der IceRocket Quickstarter-Award ehrt deinen frühen, frostig-flotten Einstieg. Danke, dass du die Rakete gezündet hast!', 50),
(130, 27, 2025, 20, 'uploads/award_icons/6855058fe49e5_ChatGPT Image 20. Juni 2025, 08_53_58.png', 'Sommer-Eis-Champion 2025', 'Verliehen an Nutzer, die im Sommer 2025 mindestens 20 Eis eingecheckt und damit ihre Leidenschaft für Eis bewiesen haben.', 150),
(132, 28, 1, 15, 'uploads/award_icons/68ddbfd9ea514_1000107935.png', 'Entdecker des ersten Geschmacks', 'Du hast 15 verschiedene Eisdielen erkundet – der Beginn einer süßen Reise voller Entdeckungen.', 150),
(133, 28, 2, 25, 'uploads/award_icons/68ddc0a68acaf_1000107938.png', 'Kartenzeichner der Kugeln', 'Mit 25 besuchten Eisdielen zeichnest du bereits deine eigene Karte der süßen Abenteuer.', 300),
(134, 28, 3, 35, 'uploads/award_icons/68ddc1642ed31_1000107943.png', 'Eis-Kapitän der Meere', 'Du führst deine Expedition sicher von Kugel zu Kugel – ein Kapitän auf süßen Wegen. Bereits 35 verschiedene Eisdielen besucht!', 450),
(135, 28, 4, 50, 'uploads/award_icons/68ddc2073a118_1000107946.png', 'Marco Polo der Gelati', '50 Stationen – du bringst exotische Sorten von fernen Welten nach Hause.\r\n', 600),
(136, 28, 5, 65, 'uploads/award_icons/68ddc2e28ce1a_1000107945.png', 'Magellan des Eises', 'Einmal um die Welt – 65 verschiedene Eisdielen führen dich auf eine wahre Weltreise des Genusses.', 800),
(137, 29, 1, 20, 'uploads/award_icons/6853c93fd0c73_5377454365360648820.png', 'Award-Sammler', 'Du hast 20 verschiedene Awards gesammelt. Aber dein Platz 1 bleibt immer noch das Eis.', 100),
(138, 24, 5, 50, 'uploads/award_icons/6853d461688b7_ChatGPT Image 19. Juni 2025, 11_10_13.png', 'Wandernde Eismythos', 'Man spricht in Legenden von dir – der, der 50-mal zu Fuß ging, dem Ruf des Eises folgend. Ein Pilger der Schleckkunst.', 500),
(139, 30, 1, 20, 'uploads/award_icons/6857f5837992d_ChatGPT Image 22. Juni 2025, 14_21_25.png', 'Eisvielfalt-Pionier', 'Du hast 20 verschiedene Eissorten probiert! Dein Geschmackshorizont dehnt sich aus – Vanille, Erdbeere und darüber hinaus. Willkommen im Club der Abwechslung!', 150),
(140, 30, 2, 50, 'uploads/award_icons/6857f5eb8b300_ChatGPT Image 22. Juni 2025, 14_23_43.png', 'Kugel-Kosmopolit', '50 Sorten, 50 Abenteuer! Du hast dich um die Welt geschleckt – von Basilikum-Zitrone bis Tonkabohne. Dein Gaumen kennt keine Grenzen.', 300),
(141, 30, 3, 80, 'uploads/award_icons/6857f66567c3e_ChatGPT Image 22. Juni 2025, 14_25_49.png', 'Eiscreme-Universalgenie', 'Für Nutzer, die 80 verschiedene Eissorten probiert haben und damit bewiesen haben, dass sie wahre Universalgenies der Eiscremewelt sind.', 500),
(142, 30, 4, 100, 'uploads/award_icons/6857f6e06e931_ChatGPT Image 22. Juni 2025, 14_28_03.png', 'Meister aller Eissorten', 'An Nutzer, die 100 verschiedene Eissorten probiert haben und damit bewiesen haben, dass sie wahre Meister aller Eissorten sind.', 800),
(143, 22, 13, 27, 'uploads/award_icons/6853ee38e4b2d_ChatGPT Image 19. Juni 2025, 13_02_08.png', 'Freieisbrecher von Bremen', 'Wer es schafft, in der kleinsten Hansestadt 30 Kugeln Eis zu verputzen, dem gehört nicht nur das Weserufer, sondern auch dieser Award! Der Freieisbrecher von Bremen durchpflügt Eisdielen wie einst die Hanse den Nordwestwind – mit Zunge, Stil und einem leichten Zuckerschock.', 350),
(144, 22, 14, 28, 'uploads/award_icons/6853eef8a2de4_ChatGPT Image 19. Juni 2025, 13_05_05.png', 'Eisritter vom Rhein', '30 Kugeln Eis in Rheinland-Pfalz? Dann bist du würdig, den Titel Eisritter vom Rhein zu tragen! Ob in Koblenz, Trier oder am Weinstand – du hast Ehre, Mut und ein eiskaltes Herz… zumindest bei Erdbeer-Sorbet.', 350),
(145, 22, 15, 29, 'uploads/award_icons/6853efa529c68_ChatGPT Image 19. Juni 2025, 13_08_11.png', 'Grill-Eisfürst des Saarlands', 'Du hast 30 Kugeln Eis im Saarland geschafft – wahrscheinlich direkt nach der dritten Grillparty! Als Grill-Eisfürst des Saarlands hast du nicht nur die Zunge fürs Eis, sondern auch den Magen für Bratwurst-Dessert-Kombinationen. Respekt!', 350),
(146, 22, 16, 30, 'uploads/award_icons/6855023e66842_ChatGPT Image 20. Juni 2025, 08_39_37.png', 'Eisdeichgraf von Schleswig-Holstein', 'Wer 30 Portionen Eis nördlich der Elbe schafft, trotzt Wind, Wellen und Watt. Der Eisdeichgraf von Schleswig-Holstein steht fest wie der Deich und schmilzt nur bei Vanille. Ein Titel für echte Küstengenießer!', 350),
(147, 25, 2, 3, 'uploads/award_icons/685c0c51a867b_dreifacher_kurvenkratzer.png', 'Dreifacher Eiskurvenkratzer', 'Dreimal mit dem Motorrad zur Eisdiele gedüst – du kennst die süßesten Kurven der Stadt. Dein Geschmack für Abenteuer und Eis ist unübertroffen!', 50),
(148, 25, 3, 5, 'uploads/award_icons/685c0c92ba762_fünfsterne_rocker.png', 'Fünfsterne-Eisrocker', 'Fünf Eisdielen mit dem Motorrad besucht? Du rockst die Straßen und die Eistheken gleichermaßen. Ein wahrer Meister des süßen Fahrspaßes!', 80),
(149, 25, 4, 10, 'uploads/award_icons/685da21235bb9_zehnfacher-kugelblitz.png', 'Zehnfacher Kugelblitz', 'Zehnmal mit dem Motorrad zur Eisdiele – du bist ein wahrer Kugelblitz auf zwei Rädern. Nichts kann dich aufhalten, wenn es um Geschwindigkeit und Genuss geht!', 100),
(150, 25, 5, 50, 'uploads/award_icons/685da21ab9089_eisiger-straßenkönig.png', 'Eisiger Straßenkönig', 'Fünfzig Eisdielen mit dem Motorrad besucht – du bist der unangefochtene König der Straßen und der Eistheken. Dein Ruf als Eisiger Straßenkönig eilt dir voraus!', 250),
(151, 27, 2026, 20, NULL, 'Sommer-Eis-Champion 2026', 'Verliehen an Nutzer, die im Sommer 2026 mindestens 20 Eis eingecheckt und damit ihre Leidenschaft für Eis bewiesen haben.', 150),
(152, 31, 1, 10, 'uploads/award_icons/685a5c209eb7d_EISINTENSIVE WOCHE_20250624_040652_0000.png', 'Eisintensive Woche', 'Du hast es in einer Woche auf über 10 Portionen Eis gebracht. Eine beachtliche Leistung – da war der Löffel sicher im Dauereinsatz.', 100),
(153, 31, 2, 15, 'uploads/award_icons/685a5c2aecc4d_ChatGPT Image 24. Juni 2025, 06_41_40.png', 'Extrem-Eiswoche', '15 Portionen Eis in sieben Tagen – das ist keine normale Woche, das ist eine Mission. Du lebst den Eistraum und brauchst wahrscheinlich ein Kugel-Abo.', 150),
(154, 31, 3, 20, 'uploads/award_icons/685ba25cf021b_ChatGPT Image 25. Juni 2025, 09_16_19.png', 'Eis-Exzess-Woche', '20 oder mehr Portionen Eis in einer einzigen Woche?! Das ist kein Versehen – das ist Hingabe. Du bist der Endgegner jeder Eisdiele.', 250),
(155, 32, 1, 300, 'uploads/award_icons/685ba3e0b3f5a_ChatGPT Image 25. Juni 2025, 09_22_55.png', 'Wortakrobat', 'Du hast eine Rezension mit mehr als 300 Zeichen verfasst – ein erstes Meisterwerk der Worte. Du bringst mehr als nur schnelle Eindrücke aufs Papier!', 30),
(156, 32, 2, 500, 'uploads/award_icons/685e49f2bfefe_generation-88ae017f-96a4-4b60-9624-857fe950ef25.png', 'Erzählmeister', 'Mit deinem ausführlichen Check-in von über 500 Zeichen beweist du Liebe zum Detail. Du erzählst Geschichten, statt nur Bewertungen zu schreiben', 60),
(157, 32, 3, 1000, 'uploads/award_icons/685e487ebfb9a_generation-5c861d47-3aa6-4cce-bc49-1f82102fd2ce.png', 'Romanverfasser', 'Du hast die Kunst der Eisrezension perfektioniert: Mehr als 1.000 Zeichen, fundiert und unterhaltsam – ein echter Genuss für Leser und Eisdielen gleichermaßen!', 100),
(158, 32, 4, 2000, 'uploads/award_icons/685e4a3c81032_generation-4f76212c-770c-446d-9792-3e75daf4df16.png', 'Wortgigant', 'Deine Rezension sprengt alle Grenzen: Über 2.000 Zeichen voller Beobachtung, Meinung und Stil. Du bist ein literarischer Riese unter den Eisverkostern!', 200),
(159, 33, 1, 5, 'uploads/award_icons/68643f8799aff_1000087392.png', 'Tiefschreiber', 'Fünf Rezensionen mit mehr als 250 Zeichen – du bleibst dran und gehst in die Tiefe. Deine Bewertungen sind mehr als oberflächliche Notizen – sie zeigen echtes Engagement.', 50),
(160, 33, 2, 10, 'uploads/award_icons/68643fd547cc9_1000087393.png', 'Detailverliebt', 'Du hast bereits 10 ausführliche Rezensionen geschrieben – ein klarer Beweis dafür, dass dir kein Eis entgeht. Du gehst mit Begeisterung ins Detail und teilst es mit der Welt!', 100),
(161, 33, 3, 25, 'uploads/award_icons/6864408186b83_1000087394.png', 'Rezensionsprofi', 'Mit 25 detaillierten Rezensionen gehörst du zur Elite der Eisexperten. Deine Ausdauer und Qualität heben dich von der Masse ab – du bist ein echter Profi in Sachen Feedback!', 250),
(162, 34, 1, 1, 'uploads/award_icons/685da2344b9a9_eis-freund-zur-hilfe.png', 'Ein Eis-Freund zur Hilfe!', 'Du hast bereits einen Nutzer geworben, sich bei der ice-app zu registrieren. Zusammen macht Eis schleckern und ein checken doch gleich doppelt Spaß!', 150),
(163, 34, 2, 2, 'uploads/award_icons/685da42415ab9_team-schleck.png', 'Team Schleck', 'Du hast schon zwei Eis-Freunde für die Ice-App begeistert – gemeinsam seid ihr jetzt ein echtes Schleck-Team! Eisdiele für Eisdiele wird euer Genussnetz größer! 🍦👬', 150),
(164, 34, 3, 3, 'uploads/award_icons/68632cb80239d_1000087158.png', 'Eis-Gang aktiv!', 'Drei geworbene Nutzer! Eure Eis-Gang ist jetzt nicht mehr zu stoppen – ob Himbeere, Zitrone oder Cookie: Ihr checkt alles ein, was schmeckt! 🍨💪', 150),
(165, 34, 4, 5, 'uploads/award_icons/68643e3627189_1000087391.png', 'Schleckfluencer', 'Fünf neue Eis-Fans dank dir – du bist ein wahrer Schleckfluencer! Die Eisdielenwelt liegt dir zu Füßen, und deine Empfehlungen sind Gold wert! 📱🍦🌟', 150),
(166, 19, 15, 22, 'uploads/award_icons/6862eb0507cee_1000087148.png', 'SLADOLED U HRVATSKOJ', 'Eisgenuss an der Adriaküste! Ob in Dubrovniks Altstadt, am Strand von Split oder in Istriens Dörfern – dieser Badge feiert dein Eisabenteuer im sonnenverwöhnten Kroatien.', 30),
(167, 19, 16, 43, 'uploads/award_icons/6862129341362_1000086910.png', 'SLADOLED V SLOVENIJI', 'Ein Eis zwischen Alpen und Adria! Ob in Ljubljana, am Bleder See oder in Piran – dieser Badge belohnt deinen cremigen Genuss im grünen Herzen Europas.', 30),
(168, 19, 17, 34, 'uploads/award_icons/6862eb86d399c_1000087149.png', 'EISZEIT IN ÖSTERREICH', 'Stracciatella mit Alpenglühen – dieser Badge ehrt dein Eisvergnügen in der Alpenrepublik. Egal ob Wien, Salzburg oder Tirol – Hauptsache cremig!', 30),
(169, 19, 18, 5, 'uploads/award_icons/6862ec81d8bc7_1000087150.png', 'GLACE SUISSE', 'Ob am Vierwaldstättersee, in Zürich oder in den Walliser Alpen – du hast dir ein Eis in der Schweiz gegönnt. Dieser Badge belohnt kühle Genussmomente im Land der Schokolade.', 30),
(170, 19, 19, 12, 'uploads/award_icons/68632be7bd136_1000087151.png', 'SLADOLED V BALGARIYA', 'Ein Eis in Bulgarien – ob in der Altstadt von Plowdiw, am Goldstrand oder am Fuße des Rila-Gebirges. Dieser Award feiert deinen eiskalten Moment im Land der Rosen.', 30),
(171, 19, 20, 6, 'uploads/award_icons/68632c2ac6e1a_1000087156.png', 'AKULLORË NË SHQIPËRI', 'Eisgenuss mit Adria-Ausblick! Dieser Award würdigt dein Eis in Albanien – von den Stränden der Riviera bis zu den Burgen von Gjirokastra.', 30),
(172, 19, 21, 21, 'uploads/award_icons/68656bda711b2_1000087551.png', 'AKULLORË NË KOSOVË', 'Ein Eis in den Bergen von Prizren oder auf dem Boulevard von Pristina – dieser Award ehrt dein cremiges Erlebnis im jüngsten Land Europas.', 30),
(173, 19, 22, 33, 'uploads/award_icons/686609f381fc7_1000087557.png', 'IS I NORGE', 'Ein Eis mit Blick auf Fjorde, rote Fischerhäuschen oder Mitternachtssonne – dieser Badge feiert deine kalte Köstlichkeit im hohen Norden.', 30),
(174, 19, 23, 15, 'uploads/award_icons/68660a5b1e7c2_1000087558.png', 'JÄÄTELÖ SUOMESSA', 'Von Helsinki bis Lappland – ein Eis in Finnland ist etwas ganz Besonderes. Dieser Badge ehrt den Geschmack der stillen Seen und nordischen Wälder.', 30),
(175, 28, 9, 150, 'uploads/award_icons/68ddc3f3b4aa8_1000107948.png', 'Kolumbus der Kugeln', 'Mit 150 verschiedenen besuchten Eisdielen hast du neue Geschmackswelten entdeckt.', 2000),
(176, 19, 24, 19, 'uploads/award_icons/6869856fc1b8a_1000088249.png', 'ÍS Á ÍSLANDI', 'Ein Eis im Land aus Feuer und Eis – wer das geschafft hat, trotzt nicht nur Vulkanen, Gletschern und Nordlichtern, sondern genießt mit Stil. Dieser Award ehrt deine frostige Leckerei auf der magischen Insel Island.', 30),
(177, 19, 25, 52, 'uploads/award_icons/686c9b6fbc4ec_1000088892.png', 'SCOOP IN THE STATES', 'Ob New York, Kalifornien oder Texas – ein Eis in den Vereinigten Staaten ist mehr als nur Dessert. Dieser Badge feiert deinen eiskalten Genuss im Land der unbegrenzten Möglichkeiten.', 30),
(178, 19, 26, 98, 'uploads/award_icons/686c9bfed3ea1_1000088893.png', 'CRÈME GLACÉE AU CANADA', 'Ein Eis unter Ahornbäumen, an einem der tausend Seen oder vor den Rockies – Kanada bietet nicht nur Natur, sondern auch eiskalte Genussmomente.', 30),
(179, 19, 27, 97, 'uploads/award_icons/686c9cb2370ed_1000088898.png', 'HELADO EN MÉXICO', 'Von Paletas am Strand bis zur Eisdiele in Oaxaca – dieser Award feiert dein cremiges Abenteuer zwischen Farben, Kultur und Sonne.', 30),
(180, 34, 5, 10, 'uploads/award_icons/686df3dc84092_1000089096.png', 'Der Eisprophet', 'Du hast zehn neue Eis-Fans zur Ice-App geführt – dein Wort hat Kugelgewicht! Überall, wo du gehst, folgen dir Eisliebhaber. Dein Einfluss ist legendär, deine Empfehlungen eine Offenbarung. ', 1000),
(181, 35, 1, 1, 'uploads/award_icons/687e1403ec406_Kein Titel (1024 x 1024 px).png', 'Eisflüsterer', 'Der erste Kommentar bei einem Check-In eines anderen Nutzers. Noch leise, aber mit Geschmack. Der Anfang deiner Meinungsmacht.', 15),
(182, 35, 2, 5, 'uploads/award_icons/687e14505a46a_Design ohne Titel.png', 'Waffelphilosoph', 'Du redest nicht nur übers Eis – du interpretierst es. Und das gleich mehrfach. Du hast bereits 5 oder mehr Check-Ins anderer Nutzer kommentiert.', 50),
(183, 35, 3, 20, 'uploads/award_icons/687e148e9d273_Design ohne Titel (1).png', 'Kommentar-Crusher', 'Deine Meinungen haben Biss – knackig, ehrlich, unterhaltsam. Du hinterlässt überall Spuren. 20 oder mehr Kommentare unter fremden Check-Ins.', 120),
(184, 35, 4, 50, 'uploads/award_icons/687e8f35d5078_Design ohne Titel (1).png', 'Meister der Eisworte', 'Du bist zur Legende geworden. Deine Kommentare sind so beliebt wie Gratis-Toppings. 50 oder mehr Kommentare unter fremden Check-Ins.', 250),
(185, 36, 1, 2, 'uploads/award_icons/687c7ba7002f9_1000092451.png', '2 Wochen Eis-Streak', 'Zwei Wochen Eisgenuss am Stück – du bist auf dem besten Weg zum Eis-Profi!', 20),
(186, 36, 2, 3, 'uploads/award_icons/687c7c3b24023_1000092452.png', '3 Wochen Eis-Streak', 'Drei Wochen, drei Kugeln Glück – deine Bronze-Streak glänzt!', 40),
(187, 36, 3, 4, 'uploads/award_icons/687e113779c1c_ChatGPT Image 21. Juli 2025, 12_05_26.png', '4 Wochen Eis-Streak', 'Ein ganzer Monat wöchentlich mindestens ein Eis – du bist nicht aufzuhalten!', 50),
(188, 36, 4, 5, 'uploads/award_icons/687e117aef866_ChatGPT Image 21. Juli 2025, 12_07_14.png', '5 Wochen Eis-Streak', 'Fünf Wochen mit Geschmack – der Goldstatus gehört dir!', 60),
(189, 36, 5, 6, 'uploads/award_icons/687e11bd1ec94_ChatGPT Image 21. Juli 2025, 12_08_28.png', '6 Wochen Eis-Streak', 'Sechs Wochen im Eis-Flow – das ist Hingabe!', 70),
(190, 36, 6, 7, 'uploads/award_icons/687e12e877325_ChatGPT Image 21. Juli 2025, 12_13_28.png', '7 Wochen Eis-Streak', 'Sieben Wochen ohne Pause – du bist ein echter Eis-Juwel!', 80),
(191, 36, 7, 8, 'uploads/award_icons/687e15119dbaf_8 Wochen Eis-Streak Abzeichen.png', '8 Wochen Eis-Streak', 'Acht Wochen Königsklasse – dein Eisreich wächst!', 90),
(192, 36, 8, 9, 'uploads/award_icons/688099ae2ca9e_ChatGPT Image 23. Juli 2025, 10_13_10.png', '9 Wochen Eis-Streak', 'Neun Wochen legendärer Eisgenuss – du bist eine Legende!', 100),
(193, 37, 2, 1, 'uploads/award_icons/687f848e85a70_Einmal mehr Schleife Abzeichen.png', 'OneMoreLoop meets IceCream', 'Limited Edition Award für Teilnehmer von „Cycle the Loop“ 2025! Du kannst nicht nur Eis schlecken, sondern auch Rad fahren!', 400),
(194, 36, 9, 10, 'uploads/award_icons/688099f7f1c28_ChatGPT Image 23. Juli 2025, 10_13_55.png', '10 Wochen Eis-Streak', 'Zehn Wochen durchgehalten – du bist jetzt offiziell Eis-Veteran! Dein Einsatz für gefrorene Genüsse ist legendär. Dieser Award steht für Ausdauer, Disziplin und eine eiskalte Leidenschaft.', 110),
(195, 36, 10, 11, 'uploads/award_icons/68809ba3c4a8d_11 Wochen Eis-Streak Emblem.png', '11 Wochen Eis-Streak', 'Elf Wochen am Stück Eis – deine Zunge kennt keinen Winterschlaf! Du bist ein Eis-Held auf Marathonkurs. Nur wenige halten so lange durch.', 120),
(196, 37, 1, 0, 'uploads/award_icons/688132889a1fe_OneMoreLoop_clouds.png', 'Vorschau: OneMoreLoop', 'Du hast den limitierten One More Loop Award gescannt. Besuche bis zum 10. August eine Eisdiele per Rad (optimal natürlich direkt während des Brevet) und checke einen Besuch ein um den Award zu bekommen.', 0),
(197, 36, 11, 12, 'uploads/award_icons/6881370d5234f_ChatGPT Image 23. Juli 2025, 21_23_07.png', '12 Wochen Eis-Streak', 'Zwölf Wochen – ein ganzes Quartal voller eiskalter Leidenschaft! Du hast bewiesen, dass der Eis-Streak kein Zufall ist. Ein wahres Meisterwerk der Genusskunst.', 130),
(198, 36, 12, 13, 'uploads/award_icons/688137280585b_ChatGPT Image 23. Juli 2025, 21_23_11.png', '13 Wochen Eis-Streak', 'Du hast 13 Wochen lang in Folge Eis geschleckt – eine Leistung wie aus einem Eispalast! Dieser Award ist eine Hommage an deine eisige Entschlossenheit.', 140),
(199, 36, 13, 14, 'uploads/award_icons/688137444aad8_ChatGPT Image 23. Juli 2025, 21_23_15.png', '14 Wochen Eis-Streak', '14 Wochen, 14 Mal pures Eisglück! Du bist auf dem besten Weg zur ewigen Eislegende – fast schon übermenschlich konsequent!', 150),
(200, 36, 14, 15, 'uploads/award_icons/688363a948da7_ChatGPT Image 25. Juli 2025, 12_59_42.png', '15 Wochen Eis-Streak', '15 Wochen Eis – du bist offiziell im Olymp der Schleckenden angekommen. Dieser Award ist ein Monument deiner eisigen Ausdauer.', 160),
(201, 36, 15, 16, 'uploads/award_icons/68836437ee947_ChatGPT Image 25. Juli 2025, 13_01_56.png', '16 Wochen Eis-Streak', 'Du hast 16 Wochen ununterbrochen Eis eingecheckt. Deine Disziplin ist legendär – dieser Award gleicht einem Artefakt aus einer eisigen Parallelwelt.', 170),
(202, 36, 16, 17, 'uploads/award_icons/688364eccf399_ChatGPT Image 25. Juli 2025, 13_05_07.png', '17 Wochen Eis-Streak', 'Ein Symbol ewiger Hingabe an den gefrorenen Genuss – dieser Award zelebriert 17 Wochen ununterbrochener Eisliebe. Nur die Beharrlichsten erreichen diesen süßen Meilenstein.', 180),
(205, 36, 17, 18, 'uploads/award_icons/6893f61d42598_1000095909.png', '18 Wochen Eis-Streak', '18 Wochen, 18 Kugeln, 18 Gründe zu feiern! Dieses Emblem ist der frostige Ritterschlag für wahre Ausdauer auf der Reise durch das Eisreich.', 190),
(206, 36, 18, 19, 'uploads/award_icons/6893f650d4046_1000095910.png', '19 Wochen Eis-Streak', '19 Wochen auf Eis – nicht im Winterschlaf, sondern mit Löffel bewaffnet auf süßer Mission! Dieser Award ehrt die fast mythische Konstanz deiner Eisdielen-Tour.', 200),
(207, 36, 19, 20, 'uploads/award_icons/6893f68f3d2d3_1000095911.png', '20 Wochen Eis-Streak', '20 Wochen lang dem Ruf der Eisdiele gefolgt – du bist jetzt offiziell ein Eis-Orakel. Dieses Emblem markiert den Beginn deiner Legende!', 210),
(208, 36, 20, 21, 'uploads/award_icons/689eec7635e47_ChatGPT Image 15. Aug. 2025, 10_14_35.png', '21 Wochen Eis-Streak', 'Ein Symbol purer Hingabe – dieser magische Orden ehrt 21 Wochen voller eiskalter Entschlossenheit. Die Eiskugeln tanzen wie Planeten um ein Zentrum aus Sahne und Fantasie.', 220),
(209, 36, 21, 22, 'uploads/award_icons/689eeca124cc8_ChatGPT Image 15. Aug. 2025, 10_15_11.png', '22 Wochen Eis-Streak', 'Zweiundzwanzig Wochen süßer Beständigkeit – gekrönt durch ein mystisches Eiscreme-Labyrinth, in dem jeder Weg zur nächsten Kugel führt.', 230),
(210, 36, 22, 23, 'uploads/award_icons/689eeda1b54ae_ChatGPT Image 15. Aug. 2025, 10_19_25.png', '23 Wochen Eis-Streak', 'Ein Denkmal aus Eis – dieser Orden ehrt 23 Wochen voller Schleckfreude mit einer leuchtenden Kugelpyramide, gebaut auf purem Durchhaltevermögen.', 240),
(211, 36, 23, 24, 'uploads/award_icons/689eee2f7e03f_ChatGPT Image 15. Aug. 2025, 10_21_57.png', '24 Wochen Eis-Streak', '24 Wochen voller Eis! Dieser legendäre Orden zeigt ein verzaubertes Riesenrad – jede Gondel eine andere Sorte, jede Umdrehung ein Triumph.', 250),
(212, 17, 3, 10, 'uploads/award_icons/689ef016cabf5_ChatGPT Image 15. Aug. 2025, 10_27_42.png', 'Eis-Connaisseur', 'Zehn Besuche – du bist nicht nur ein Fan, du bist Teil des Inventars! Vielleicht gibt\'s bald eine Kugel auf\'s Haus?', 250),
(213, 17, 2, 5, 'uploads/award_icons/689eefbf803ed_ChatGPT Image 15. Aug. 2025, 10_28_29.png', 'Stammkunde', 'Fünf Mal dieselbe Kugel? Du weißt genau, wo es dir schmeckt. Deine Treue zahlt sich aus – willkommen auf der nächsten Stufe!', 100),
(214, 17, 4, 20, 'uploads/award_icons/689ef042a59b7_ChatGPT Image 15. Aug. 2025, 10_30_30.png', 'Ehrenkunde Platin', '20 Besuche! Man kennt deinen Namen, deinen Lieblingsgeschmack und deine Lieblingsbank. Du bist offiziell Eisadel!', 500),
(215, 38, 1, 1, 'uploads/award_icons/68aaa8a44cab7_1000098624.png', 'Instant-Checkin', 'Du hast dein Eis direkt an der Eisdiele eingecheckt (< 300m Entfernung).', 15),
(216, 39, 1, 1, 'uploads/award_icons/68a93e3423015_1000098402.png', 'Öffi-Eis Scout', 'Für den ersten mutigen Ausflug zur Eisdiele mit den Öffis. Ein kleiner Schritt für dich, ein großer für dein Eisabenteuer.', 30),
(217, 39, 2, 3, 'uploads/award_icons/68a93e750459a_1000098403.png', 'Bronzener Schleck-Passagier', 'Drei Eisdielen mit Bus und Bahn erreicht – jetzt bist du mehr als nur ein Gelegenheits-Schlecker.', 50),
(218, 39, 3, 5, 'uploads/award_icons/68a93eb5d6451_1000098404.png', 'Silberner Kugel-Kurier', 'Fünfmal Eis mit den Öffis erobert – jetzt rollt der Genuss schon wie auf Schienen.', 80),
(219, 39, 4, 10, 'uploads/award_icons/68a93f23e3509_1000098405.png', 'Goldener Schleck-Express', 'Zehn Eisdielen mit Bus, Bahn & Tram erreicht – der goldene Express bringt dich immer zum Eis.', 100),
(220, 39, 5, 20, 'uploads/award_icons/68a93fc0f1e52_1000098406.png', 'Legendärer Eis-Nomade', 'Zwanzig Eisdielen mit den Öffis besucht – du bist jetzt eine Legende des urbanen Schlemmens.', 250),
(221, 40, 1, 0, 'uploads/award_icons/68b001c6bf26f_EPR_2025_cloud.png', 'European Peace Ride 2025', 'Der Besitzer dieses Emblems ist stolzer Teilnehmer des EPR 2025 und zeigt wie Kultur und Völkerverständigung per Rad funktioniert. Check noch ein Eis im Zeitraum 07.-21. September ein um den vollständigen Award zu erhalten.', 0),
(222, 40, 2, 1, 'uploads/award_icons/68af8ce4be4de_1000099125.png', 'EPR 2025 meets Ice-App', 'Für Teilnehmer des European Peace Rides 2025, die während des EPR ein Eis eingecheckt haben. Du verbindest Radfahrer mit europäischer Eis-Schleck-Kultur', 600),
(223, 38, 2, 3, 'uploads/award_icons/68aaa970ef6f5_1000098625.png', '3 Eis direkt vor Ort ', 'Schon die dritte Kugel direkt vor Ort eingecheckt – du bist immer top aktuell auf der Ice-App unterwegs!', 25),
(224, 38, 3, 7, 'uploads/award_icons/68aaaa017047f_1000098626.png', '7 Eis direkt vor Ort ', 'Mit 7 Eis die du direkt vor Ort eingecheckt hast, beweist du New-Reporter Qualitäten!', 50),
(225, 38, 4, 15, 'uploads/award_icons/68aaaab3e3d47_1000098627.png', '15 Eis direkt vor Ort ', 'Schön 15 mal hast du die Eis-App direkt vor Ort gezückt und berichtet. Das ist Dedication!', 100),
(226, 38, 5, 30, 'uploads/award_icons/68aaac26bdc94_1000098628.png', '30 Eis direkt vor Ort ', 'Dreißig Vor-Ort-Check-ins – kein Eis bleibt unentdeckt, du berichtest live von der Eisdielen-Front!', 250);
INSERT INTO `award_levels` (`id`, `award_id`, `level`, `threshold`, `icon_path`, `title_de`, `description_de`, `ep`) VALUES
(227, 38, 6, 50, 'uploads/award_icons/68acb99202488_ChatGPT Image 25. Aug. 2025, 21_27_49.png', 'Breaking-Ice-Legende', '50 Mal direkt vor Ort eingecheckt – du bist die ultimative Live-Quelle für Eisdielen-Sensationen!', 600),
(228, 41, 1, 1, 'uploads/award_icons/68b2484edcdca_1000099335.png', '1 Tägliche Challenge abgeschlossen', 'Du hast deine erste tägliche Challenge abgeschlossen – der Beginn deiner Eisabenteuer!', 100),
(229, 41, 2, 2, 'uploads/award_icons/68b248a0a9b82_1000099336.png', '2 Tägliche Challenges abgeschlossen', 'Bereits 2 mal den Ruf der täglichen Challenges erfolgreich gefolgt. ', 100),
(230, 41, 3, 3, 'uploads/award_icons/68b69857ea7d7_3 Tägliche Herausforderungen Abgeschlossen.png', '3 Tägliche Challenges abgeschlossen', 'Bereits 3 mal den Ruf der täglichen Challenges erfolgreich gefolgt. ', 100),
(231, 41, 4, 4, 'uploads/award_icons/68b6986a32c0e_4 Tägliche Herausforderungen Abgeschlossen.png', '4 Tägliche Challenges abgeschlossen', 'Bereits 4 mal den Ruf der täglichen Challenges erfolgreich gefolgt. ', 100),
(232, 41, 5, 5, 'uploads/award_icons/68b6987852309_5 tägliche Herausforderungen abgeschlossen.png', '5 Tägliche Challenges abgeschlossen', 'Bereits 5 mal den Ruf der täglichen Challenges erfolgreich gefolgt. ', 100),
(233, 42, 2025, 5, 'uploads/award_icons/68bbd15fab70c_1000100490.png', 'Winter-Eis-Champion 25 / 26', 'Verliehen an Nutzer, die im Winter 2025 / 2026 mindestens 5 Eis eingecheckt und damit ihre Leidenschaft für Eis bewiesen haben.', 150),
(234, 42, 2026, 5, 'uploads/award_icons/68bbd1922c2e6_1000100492.png', 'Winter-Eis-Champion 26 / 27', 'Verliehen an Nutzer, die im Winter 2026 / 2027 mindestens 5 Eis eingecheckt und damit ihre Leidenschaft für Eis bewiesen haben.', 150),
(235, 43, 1, 3, 'uploads/award_icons/68bfc3848cd3b_1000101913.png', 'Nutzer/in des Monats April 2025', 'Leckermäulchen95 ist im April als Pionier in die Welt der Ice-App gestartet!', 250),
(236, 43, 2, 2, 'uploads/award_icons/68bfc3f576783_1000101914.png', 'Nutzer/in des Monats Mai 2025', 'The GourmetBiker hat im Mai 2025 richtig Gas gegeben: 10 Checkins und einige Bewertungen und Preismeldungen machen ihm zum Nutzer des Monats Mai 2025!', 250),
(237, 43, 3, 52, 'uploads/award_icons/68bfc408d55d6_1000101915.png', 'Nutzer/in des Monats Juni 2025', 'alinaa.wrnr ist unsere Nutzerin des Monats Juni 2025! 12 Checkins, neue geworbene Nutzer und über 20 Preismeldungen sichern ihr den Titel!', 250),
(238, 43, 4, 22, 'uploads/award_icons/68bfc41eb4748_1000101916.png', 'Nutzer/in des Monats Juli 2025', 'Eispfote ist Nutzerin des Monats Juli 2025! Alleine 16 Checkins nur in diesem Monat ist schon sehr beeindruckend!', 250),
(239, 43, 5, 53, 'uploads/award_icons/68bfc43ab0c79_1000101917.png', 'Nutzer/in des Monats August 2025', 'IceGoe ist Nutzer des Monats August 2025! Viele Checkins, Preismeldungen und Awards sichern ihn den Titel für den Monat!', 250),
(240, 18, 2, 7, 'uploads/award_icons/68c4f9a838210_1000103484.png', 'Sorten-Loyalist', 'Siebenmal dieselbe Sorte – du bist deinem Geschmack absolut treu geblieben.', 100),
(241, 18, 3, 10, 'uploads/award_icons/68c4fad65dd33_1000103486.png', 'Kugel-Klassiker', '10 Mal dieselbe Sorte – du machst daraus schon eine Tradition.', 180),
(242, 18, 4, 15, 'uploads/award_icons/68c511ae849cd_1000103490.png', 'Eis-Monogamist', '15 Mal dieselbe Sorte – wahre Hingabe!', 300),
(243, 18, 5, 30, 'uploads/award_icons/68ceeb0704946_68c3bf0e0ef3e_1000103213.png', 'Geschmacks-Legende', '30 Mal die gleiche Sorte – du hast Geschichte geschrieben!', 450),
(244, 18, 6, 40, 'uploads/award_icons/68c3bf4b678e8_1000103214.png', 'Diamant der Kugel ', '40 Mal die gleiche Sorte – deine Hingabe funkelt wie ein Diamant.', 700),
(245, 44, 1, 2, 'uploads/award_icons/68ca52ef35951_ChatGPT Image 17. Sept. 2025, 08_18_49.png', '2 × 2 der Eisdielen', 'Du hast 2 Eisdielen jeweils 2-mal besucht – das kleine Einmaleins des Eisdielen-Genusses beginnt!', 50),
(246, 44, 2, 3, 'uploads/award_icons/68ca53b8021e0_ChatGPT Image 17. Sept. 2025, 08_19_52.png', '3 × 3 der Eisdielen', '3 Eisdielen, jeweils 3-mal besucht – du wirst zum Profi im Eisdielen-1 × 1!', 150),
(247, 44, 3, 4, 'uploads/award_icons/68ca539f5d864_ChatGPT Image 17. Sept. 2025, 08_21_45.png', '4 × 4 der Eisdielen', '4 Eisdielen, jeweils 4-mal besucht – deine Sammlung wächst bunt wie eine Eisvitrine!', 450),
(248, 44, 4, 5, 'uploads/award_icons/68ca548bcf7aa_ChatGPT Image 17. Sept. 2025, 08_26_05.png', '5 × 5 der Eisdielen', '5 Eisdielen, jeweils 5-mal besucht – das Meisterstück im Eisdielen-1 × 1!', 1000),
(249, 45, 1, 1, 'uploads/award_icons/68da385f50a33_ChatGPT Image 29. Sept. 2025, 09_37_36.png', 'Challenge Hunter', 'Du hast deine erste Challenge abgeschlossen! Was war das für ein Abenteuer. Eine Kariere als Eis-Agent steht dir bevor!', 150),
(250, 45, 2, 2, 'uploads/award_icons/68da38de35e46_2_Challenges.png', 'Challenge Hunter', 'Du hast bereits 2 Challenges abgeschlossen. Deine Agenten Ausbildung ist offiziell gestartet!', 150),
(251, 45, 3, 3, 'uploads/award_icons/68da398d1839d_3_Challenges.png', 'Challenge Hunter', 'Du hast bereits 3 Challenges abgeschlossen. Deine Agenten Ausbildung ist offiziell gestartet!', 150),
(252, 45, 4, 4, 'uploads/award_icons/68da399ba8772_4_Challenges.png', 'Challenge Hunter', 'Du hast bereits 4 Challenges abgeschlossen. Deine Agenten Ausbildung ist offiziell gestartet!', 150),
(253, 45, 5, 5, 'uploads/award_icons/68da3a54e206f_5_Challenges.png', 'Challenge Hunter', 'Du hast bereits 5 Challenges abgeschlossen. Deine Agenten Ausbildung ist offiziell gestartet!', 150),
(254, 45, 6, 6, 'uploads/award_icons/68da3a6218b95_6_Challenges.png', 'Challenge Hunter', 'Du hast bereits 6 Challenges abgeschlossen. Deine Agenten Ausbildung ist offiziell gestartet!', 150),
(255, 45, 7, 7, 'uploads/award_icons/68e2dbb157dcd_1000108900.png', '007 - Lizenz zum Eis', 'Ein besonderes Ehrenabzeichen im Retro-Comic-Stil für Agent:innen mit eisernem Durchhaltevermögen. Wer sieben Challenges abgeschlossen hat, trägt die „Lizenz zum Eis“ – cool, charmant und unerschütterlich wie James Bond selbst.', 150),
(256, 46, 2025, 5, 'uploads/award_icons/68d4ddd7bbcca_ChatGPT Image 25. Sept. 2025, 08_14_39.png', 'Herbst-Champion 2025', 'Du hast 5 oder mehr Eis im Herbst 2025 gegessen!', 150),
(257, 36, 24, 25, 'uploads/award_icons/68d5f3b8d673c_1000106078.png', '25 Wochen Eis-Streak', '25 Wochen – ein Vierteljahrhundert an Wochen mit Eis! Dieser Award steht für Beständigkeit, Freude und die Krönung einer langen süßen Reise.', 260),
(258, 36, 25, 26, 'uploads/award_icons/68d5f43fbffbf_1000106079.png', '26 Wochen Eis-Streak', 'Ein halbes Jahr ohne Unterbrechung – 26 Wochen voller Eis! Dieser Award markiert den legendären Meilenstein, der Beständigkeit und puren Genuss krönt.', 270),
(259, 36, 26, 27, 'uploads/award_icons/68d5f49d02f5e_1000106080.png', '27 Wochen Eis-Streak', '27 Wochen – mehr als ein halbes Jahr! Der Eis-Streak wächst über das Alltägliche hinaus und zeigt wahre Legenden-Ausdauer.', 280),
(260, 36, 27, 28, 'uploads/award_icons/68d6e47b210d7_ChatGPT Image 26. Sept. 2025, 21_07_22.png', '28 Wochen Eis-Streak', '28 Wochen – dieser Award würdigt pure Ausdauer und ein Feuerwerk an süßen Glücksmomenten.', 290),
(261, 36, 28, 29, 'uploads/award_icons/68d6e4e43707c_ChatGPT Image 26. Sept. 2025, 21_09_08.png', '29 Wochen Eis-Streak', '29 Wochen – ein fast ununterbrochener Strom von süßen Erfolgen. Der Eis-Streak hat längst mythische Dimensionen erreicht.', 300),
(262, 36, 29, 30, 'uploads/award_icons/68d6e54217aed_ChatGPT Image 26. Sept. 2025, 21_10_51.png', '30 Wochen Eis-Streak', '30 Wochen – ein legendärer Meilenstein! Ein Streak, der zeigt: wahre Helden bestehen nicht nur Rennen, sie genießen auch ihr Eis.', 310),
(263, 45, 8, 8, 'uploads/award_icons/68da3e222381a_8_Challenges.png', 'Eis-Drache – 8 Challenges besiegt', 'Sechs waren stark, sieben noch stärker – aber acht Challenges zu meistern, macht dich zum wahren Eis-Drachen-Bändiger!', 150),
(264, 45, 9, 9, 'uploads/award_icons/68da3e4ff093b_9_Challenges.png', 'Eis-Geheimoperation – 9 Challenges abgeschlossen', 'Für alle, die sich wie ein Top-Agent durch die Missionen geschlichen haben: unauffällig, clever und mit perfektem Timing. Dieses Abzeichen feiert deine „Geheimoperation im Eis-Einsatz', 150),
(265, 45, 10, 10, 'uploads/award_icons/68db9b228ec93_ChatGPT Image 30. Sept. 2025, 10_55_51.png', 'Eis-Galaxy – 10 Challenges erreicht', 'Ein intergalaktisches Abzeichen für alle, die ihre zehnte Challenge wie ein Weltraum-Pionier gemeistert haben. Dein Eis ist jetzt nicht mehr von dieser Welt.', 150),
(266, 45, 11, 11, 'uploads/award_icons/68db9b2d92d50_ChatGPT Image 30. Sept. 2025, 10_55_48.png', 'Eis-Paradies – 11 Challenges gemeistert', 'Elf Challenges geschafft – Zeit für Urlaub! Dieses Abzeichen zeigt, dass du dir dein Eis-Paradies redlich verdient hast.', 150),
(267, 43, 6, 53, 'uploads/award_icons/68dd0401cf5ad_ChatGPT Image 1. Okt. 2025, 12_32_52.png', 'Nutzer/in des Monats September 2025', 'Wahnsinn! Bereits den zweiten Monat in Folge beweist IceGoe voller Elan und Hingabe seine Leidenschaft fürs Eis-Schlecken! Mit 13 Check-ins im September hat er sich diesen Award mehr als verdient.', 250),
(268, 28, 6, 80, 'uploads/award_icons/68dff777d2f42_Mythos der Eis-Expeditionen.png', 'Mythos der Eis-Expeditionen', 'Mit 80 verschiedenen Eisdielen wirst du selbst zur Legende – dein Weg ist voller Geschichten.', 1000),
(269, 28, 7, 100, 'uploads/award_icons/68dff7c328d13_Großer Entdecker des Eises.png', 'Großer Entdecker des Eises', '100 verschiedene Eisdielen! Dein Name steht in den Chroniken der süßen Expeditionen.', 1250),
(270, 28, 8, 125, 'uploads/award_icons/68dff830f3494_Design ohne Titel (2).png', 'Unsterblicher Eiskosmopolit', '125 unterschiedliche Eisdielen besucht – du bist ein weltumspannender Entdecker, unsterblich in der Eisgeschichte.', 1500),
(271, 45, 12, 12, 'uploads/award_icons/68e4cde08e423_1000109194.png', 'Eis-Meister – 12 Challenges gemeistert', 'Zwölf Challenges gemeistert – Wie ein fleißiger Bildhauer sich durch den Stein meißelt, arbeitest du dich dich durch die Eisdielen!', 150),
(272, 45, 16, 16, 'uploads/award_icons/68e646a6eeb42_ChatGPT Image 8. Okt. 2025, 13_09_01.png', 'Eis-Ranger – 16 Challenges abgeschlosen', 'Sechzehn Challenges abgeschlossen – Wie ein harter Ranger, erarbeitest du dir Eis-Challenge für Eis-Challenge!', 150),
(273, 45, 17, 17, 'uploads/award_icons/68e64793ed63a_ChatGPT Image 8. Okt. 2025, 13_14_08.png', 'Der Vulkan-Eisjäger – 17 Challenges abgeschlosen', 'Siebzehn Challenges abgeschlossen – Die Jagd nach dem Eis-Vulkan ist abgeschlossen - du knallharter Hund weißt wie man Challenges abschließt!', 150),
(274, 45, 18, 18, 'uploads/award_icons/68f203a63f94d_ChatGPT Image 17. Okt. 2025, 10_50_32.png', 'Der Zeitreisende Eis-Agent – 18 Challenges abgeschlosen', 'Achtzehn Challenges abgeschlossen – Du bist durch Raum und Zeit gereist um 18 Challenges abzuschließen!', 150),
(275, 19, 28, 53, 'uploads/award_icons/68f2034825bf6_ChatGPT Image 17. Okt. 2025, 10_48_34.png', 'DONDURMA TÜRKİYE’DE', 'Für den Genuss eines Eises in der Türkei – dort, wo cremige Dondurma traditionell mit Show serviert wird. Ob an der Ägäis, am Bosporus oder in Kappadokien – dieser Award feiert deinen eiskalten Genussmoment zwischen Orient und Okzident.', 30),
(276, 19, 29, 54, 'uploads/award_icons/68f2067a3db84_Marokko.png', 'GLACE AU MAROC', 'Ein Eis im Königreich der Farben und Düfte – von den Souks Marrakechs bis zur Gischt des Atlantiks. Dieser Badge feiert deinen süßen Genussmoment in Marokko.', 30),
(277, 19, 30, 55, 'uploads/award_icons/68f206addf132_ChatGPT Image 17. Okt. 2025, 10_59_24.png', 'Moslajāt fī Miṣr', 'Eis unter der Sonne der Pharaonen – dieser Award ehrt dein eiskaltes Abenteuer in Ägypten. Zwischen Wüste, Nil und Pyramiden bleibt das Gelato ein königlicher Genuss.', 30),
(278, 36, 30, 31, 'uploads/award_icons/68f334be0ea46_1000112500.png', '31 Wochen Eis-Streak', '31 Wochen – das ist wahre Eis-Weisheit! Du hast längst das Alltägliche hinter dir gelassen und bist zum weisen Hüter der gefrorenen Kugeln aufgestiegen.', 320),
(279, 36, 31, 32, 'uploads/award_icons/68f3356b6101e_1000112502.png', '32 Wochen Eis-Streak', '32 Wochen – du bist auf dem Weg zur Legende! Jede Kugel erzählt eine Geschichte, jeder Check-in ein Kapitel deines eiskalten Abenteuers.', 330),
(280, 36, 32, 33, 'uploads/award_icons/68f33598a4665_1000112504.png', '33 Wochen Eis-Streak', 'Ein Schnapszahl an Wochen Eis! Dieser Orden ehrt deinen unerschütterlichen Glauben an den eiskalten Genuss – ein Symbol purer Ausdauer.', 340),
(281, 36, 33, 34, NULL, '34 Wochen Eis-Streak', '34 Wochen – du bist der Chronist der Eiszeit. Keine Waffel bleibt ungedreht, kein Geschmack ungetestet. Dieser Orden zelebriert deine ewige Neugier.', 350),
(282, 36, 34, 35, NULL, '35 Wochen Eis-Streak', '35 Wochen! Du bist ein lebendes Eisdenkmal. Dieser Award steht für meisterhafte Beständigkeit, Leidenschaft und eine Legende, die ihresgleichen sucht.', 360);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=283;

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
