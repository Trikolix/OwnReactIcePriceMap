-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:24
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
(3, 23, 1, 'https://www.komoot.de/tour/2280368377/', '<iframe src=\"https://www.komoot.com/de-de/tour/2280368377/embed?share_token=a3mG8iRmcYbY1045GvIhcZ6Ch1qaei3Q8zZfHTqWPoGqmzN8PB\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Albrecht Eis bei Nossen und Softeis in Hartha ', '', 'Rennrad', '134.00', 1310, 'Schwer', 1, '2025-05-06 18:51:58'),
(4, 24, 1, 'https://www.komoot.com/de-de/tour/2105973916/', '<iframe src=\"https://www.komoot.com/de-de/tour/2105973916/embed?share_token=aaPFk4zNdiuVWi0ZnbkJWSoLFS7NSN5CbtGIlU53lvLlZlAKxr\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Los gehts durchs Zschopautal mit relativ gemütlicher Steigung bis hoch zum Erzgebirgskamm, den geht es dann auf ruhigen Wegen durch den Wald und kleinere Dörfer entlang bis nach Olbernhau, wo dann das Torteneck auf einen wartet. Von da aus geht es wellig zurück nach Chemnitz.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(5, 30, 1, 'https://www.komoot.com/de-de/tour/2116969975/', '<iframe src=\"https://www.komoot.com/de-de/tour/2116969975/embed?share_token=aOjrIbBFZ0G6Oev1Ajn3sK3L9t4nTo03R9LbBZIM4y6ZriPKr6\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(6, 31, 1, 'https://www.komoot.com/de-de/tour/2109432795/', '<iframe src=\"https://www.komoot.com/de-de/tour/2109432795/embed?share_token=atw46aGE8ustrenEcMyr6X5NVCQviCSV71gB86FHE3JApl36UC\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(7, 40, 1, 'https://www.komoot.com/de-de/tour/1041597491/', '<iframe src=\"https://www.komoot.com/de-de/tour/1041597491/embed?share_token=a8ppmCGzfMQKoTKYBGgvZa8GEfvWPU8IFJpptxJ2RskCTpEouu\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(8, 45, 1, 'https://www.komoot.com/de-de/tour/2117023918/', '<iframe src=\"https://www.komoot.com/de-de/tour/2117023918/embed?share_token=abMM6jTSdmMQSlAGrMdTO81vdDSLJrIK7KJXTzqIUURADyuZKz\" width=\"100%\" height=\"400\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Schöne Runde durchs Gebirge, erst auf den Keilberg, dann den Fichtelberg und anschließend über die tschechische Seite nach Johanngerogenstadt, wo es leckere Eisstärkung gibt, weiter rauf auf den Auersberg. Ab dann wird mehr gerollt. In Eibenstock bietet sich nochmal ein Eisstopp an.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(9, 46, 1, 'https://www.komoot.com/de-de/tour/2117187697/', '<iframe src=\"https://www.komoot.com/de-de/tour/2117187697/embed?share_token=aV2Hu3UCsgD69l3EKo2M5GZWarrQeZxDItCxpA9N2l1M52Kd4N\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(11, 65, 1, 'https://www.komoot.com/de-de/tour/2141338801/', '<iframe src=\"https://www.komoot.com/de-de/tour/2141338801/embed?share_token=aRyl0tA138CJahivyKq3eKLmC7XUwprq5XDGRrkTFEjVYUcEE1&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(12, 74, 1, 'https://www.komoot.com/de-de/tour/2143692597/', '<iframe src=\"https://www.komoot.com/de-de/tour/2143692597/embed?share_token=anzEZqQDeHTcRq1YJOXRuRMoVfkIrs1Chfik2ID3iNgsVjSQTj&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(13, 89, 1, 'https://www.komoot.com/de-de/tour/1259315746/', '<iframe src=\"https://www.komoot.com/de-de/tour/1259315746/embed?share_token=aAcrsdK0p1Ho74xaV4g7PsGmD375xR3P76dPBRUJKFFftZc1hi&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(14, 98, 1, 'https://www.komoot.com/de-de/tour/2156485682/', '<iframe src=\"https://www.komoot.com/de-de/tour/2156485682/embed?share_token=aXul3Yn3HECtwMmDcRcbEHHOe6wXSdzb6D4XK1r4QNn7shP3GH&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', NULL, 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(15, 101, 1, 'https://www.komoot.com/de-de/tour/2159077294/', '<iframe src=\"https://www.komoot.com/de-de/tour/2159077294/embed?share_token=aIGChRNihGNZKPZKdliYH3gg0Rt7MDGqwzTs9WukJK7TG71j7M\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Auf dem Hinweg geht es etwas bergig über Freiberg nach Nossen. Dort kann man sich für wenig Geld sehr viel super leckeres Eis gönnen bevor es dann etwas flacher zurück nach Chemnitz geht.', 'Rennrad', NULL, NULL, NULL, 1, '2025-05-06 18:51:58'),
(16, 106, 1, 'https://www.komoot.com/de-de/tour/2201870273/', '<iframe src=\"https://www.komoot.com/de-de/tour/2201870273/embed?share_token=aYhNWuNhx23QiYtyROzDU7xXLieCNQNDS1hfjXJwSWjw8yW9nd\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Eine ordentlich anspruchsvolle Runde durchs Gebirge. Nach dem es im Zschopau Tal relativ gleichmäßig bergauf geht, geht\'s dann steil nach Jöhstadt wo mit dem Eiscafé Bartsch eine gute Quelle für Softeis wartet.\nDanach wird es richtig bergig, von hinten wird sich den Auersberg genähert, der natürlich auch erklommen wird, wenn man einmal da ist.\n\nDanach gibt\'s feinstes Eis bei der Eismanufaktur Lipp in Annaberg, aber Obacht, danach warten auch noch einige giftige, steile Rampen.\nIn Summe ein wahres Höhenmeter Fest mit leckerstem Eis 😍🍦', 'Rennrad', '108.00', 1900, 'Schwer', 1, '2025-05-06 18:51:58'),
(34, 46, 1, 'https://www.komoot.com/de-de/tour/2223149396/', '<iframe src=\"https://www.komoot.com/de-de/tour/2223149396/embed?share_token=aPnSArnRnwsrHdGtf8RisNJrJdYn2qdInbmHITiAZ3Gtswe0A2\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Die Wanderung habe ich noch geplant. Sobald sie gemacht wurde, werde ich berichten.', 'Wanderung', NULL, NULL, NULL, 1, '2025-05-07 08:41:59'),
(48, 149, 1, 'https://www.komoot.com/de-de/tour/2225043577/', '<iframe src=\"https://www.komoot.com/de-de/tour/2225043577/embed?share_token=axZv8tPoWNnuly4DGuTKzmSl0TkblxCD9p9RWeoFKOlHMLtkLl\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'von Chemnitz zum Eis-Karli in Rodewisch', 'Möchte ich noch fahren.', 'Rennrad', '133.00', 1800, 'Schwer', 0, '2025-05-08 04:08:58'),
(49, 150, 1, 'https://www.komoot.com/de-de/tour/2225276682/', '<iframe src=\"https://www.komoot.com/de-de/tour/2225276682/embed?share_token=a5yq8SrIGOjf71VeGkuGzcpqD4WORqZ805eF6DwAfJF6OOQ7Qj\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Göltzschtalbrücke', '', 'Rennrad', NULL, NULL, 'Schwer', 1, '2025-05-08 07:03:25'),
(64, 9, 1, 'https://www.komoot.com/de-de/tour/2260332775/', '<iframe src=\"https://www.komoot.com/de-de/tour/2260332775/embed?share_token=aGiI6OPvnX7PSTiwdPihquVe8zeOFjRgvuyGaLiyKKdHwgJ4lR\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Über Kohlebahnradweg zur Eisdiele Dietz', 'Schöne, einfache Rennrad Runde: über Klaffenbach geht es raus aus Chemnitz, den Kohlebahnradweg entlang bis nach Lugau. Von dort rollt man quasi komplett Gersdorf herunter bis am Ende vom Ort die Eisdiele Dietz einen erwartet.\nDort kann man lecker Eis essen bevor es über Oberlungwitz und Mittelbach zurück nach Chemnitz geht.', 'Rennrad', '35.10', 230, 'Leicht', 1, '2025-05-21 19:30:15'),
(66, 56, 1, 'https://www.komoot.com/de-de/tour/2273621482/', '<iframe src=\"https://www.komoot.com/de-de/tour/2273621482/embed?share_token=aj4XMWv3aKQrZhaNWTDN23cqn2CWpEMrviLECx99Fr6yqMR1NV\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Von Chemnitz zum Schloss-Café Ponitz', 'Das Schloss-Café Ponitz wurde mit empfohlen, mal schauen was es taugt. Ich hab mal eine bisschen flachere Runde über Norden geplant.', 'Rennrad', '105.00', 890, 'Mittel', 1, '2025-05-27 05:54:21'),
(67, 4, 1, 'https://www.komoot.de/tour/2104351326/', '<iframe src=\"https://www.komoot.com/de-de/tour/2104351326/embed?share_token=aHT51hSqmzvoimJE1ECm1hf7qqwacEh0aalXN3oG498PaVMQ39\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Softeis in Harthau', 'Eine Runde - 3 neue Eisdielen für mich erkunden.', 'Rennrad', '118.00', 1130, 'Mittel', 1, '2025-05-29 03:02:35'),
(68, 21, 1, 'https://www.komoot.de/tour/2283324311/', '<iframe src=\"https://www.komoot.com/de-de/tour/2283324311/embed?share_token=aUCCsXVk38ybSKkm18RKUb5pqazdmISD7gR68bcPrKS0fQ9v5o\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Von Chemnitz über Klaffenbach zum Eiscafé \'kleine Verführung\'', '', 'Gravel', '38.60', 360, 'Leicht', 1, '2025-05-30 14:35:30'),
(69, 213, 1, 'https://www.komoot.com/de-de/tour/2333240505/', '<iframe src=\"https://www.komoot.com/de-de/tour/2333240505/embed?share_token=a8wDrc25tT2lmpM0QFeOX7dyQ4SUneSM5Uy9Yv0vlN3nYP6Kcl\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Von Chemnitz zur Bäckerei Steffi Reichardt in Löbichau', '', 'Rennrad', '135.00', 1440, 'Schwer', 1, '2025-06-18 05:01:26'),
(70, 22, 1, 'https://www.komoot.de/tour/2422400323/', '<iframe src=\"https://www.komoot.com/de-de/tour/2422400323/embed?share_token=a67QorxOC0qKPzFOAfxbGGjhG71wR8Euobw1zPNkRekU8ABIpO\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Im Chemnitztal zum Eiscafé Elisenhof ', 'Der relativ schnellste aber auch schön ruhiger Weg mit dem Rennrad von Chemnitz zum Eiscafé Elisenhof in Kohren-Salis.', 'Rennrad', '88.20', 690, 'Mittel', 1, '2025-07-21 01:32:38'),
(72, 60, 1, 'https://www.komoot.de/tour/2422400323/', '<iframe src=\"https://www.komoot.com/de-de/tour/2422400323/embed?share_token=a67QorxOC0qKPzFOAfxbGGjhG71wR8Euobw1zPNkRekU8ABIpO\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Späte Feierabendrunde', 'Die Eisdiele in Limbach Oberfrohna hat bis 19 Uhr auf, damit kann man auch noch Recht spät starten und bekommt immer noch ein Eis. 🍦👍🏼', 'Rennrad', '76.50', 740, 'Mittel', 1, '2025-07-23 18:04:57'),
(73, 93, 1, 'https://www.komoot.com/de-de/tour/2512610805/', '<iframe src=\"https://www.komoot.com/de-de/tour/2512610805/embed?share_token=aDT7DrgAUNeZI1Tkga8w4fPqWPad58xs0Lod627WFdiMigeQQZ\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Freiberg -> Nossen -> Döbeln', '', 'Rennrad', '132.00', 1530, 'Schwer', 0, '2025-07-28 12:13:27'),
(74, 314, 1, 'https://www.komoot.de/tour/2443810417/', '<iframe src=\"https://www.komoot.com/de-de/tour/2443810417/embed?share_token=a6TwsdM3xAAgtFQ9leCnXFMn4fYsLwgZ57sXR3wiIp7YMo4KAv\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Cycle the Unsern 200 - mit Eisstopps ', 'Für alle Starter des 200km Brevets gibt\'s hier die Route erweitert mit einigen Eis-Stopps die direkt auf der Strecke liegen oder nur einen minimalen Umweg bedeuten.\n\nDie ersten Eisdielen passiert man wenn sie noch geschlossen sind, los geht es mit \n- Kilometer 94: Bäckerei Bräunig in Ehrenfriedersdorf \n- Kilometer 134: n\'Eis zapfen in Frankenberg\n- Kilometer 158: Eiscafé Venezia in Mittweida (alternativ gibt es noch 2-3 andere Eis Möglichkeiten in Mittweida)\n- Kilometer 176: Eiscafé Krause Wechselburg\n- Im Ziel: Ice-Eis Pinguin oder Karl mags Süß ', 'Rennrad', '204.00', 2540, 'Schwer', 1, '2025-08-02 00:08:33'),
(75, 179, 1, 'https://www.komoot.com/de-de/tour/2468788191/', '<iframe src=\"https://www.komoot.com/de-de/tour/2468788191/embed?share_token=aWHQ9Nx09zfvEePJlP5kzFYZYHGynqjmRwNLSMtHCpg7j4yh6R\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Konditorei Seifert & Eisfabrik Gößnitz', 'Aus ursprünglich 3 geplanten Eis Stopps wurde es doch nur ein Stopp bei dem es Kuchen gab und ein Softeis-Stopp bei der Eisfabrik Gößnitz', 'Rennrad', '120.00', 900, 'Mittel', 1, '2025-08-06 05:32:17'),
(76, 411, 1, 'https://www.komoot.com/de-de/tour/2486305418/', '<iframe src=\"https://www.komoot.com/de-de/tour/2486305418/embed?share_token=asJCdQfPFKl43yHKra3xGzk1AssaoCAaEiYrArkImtdhblCgLI\" width=\"640\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Elisenhof, Eismarie und Vereinstreffen', '', 'Rennrad', '124.00', 1020, 'Mittel', 0, '2025-08-12 05:38:19');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `routen`
--
ALTER TABLE `routen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eisdiele_id` (`eisdiele_id`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `routen`
--
ALTER TABLE `routen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `routen`
--
ALTER TABLE `routen`
  ADD CONSTRAINT `routen_ibfk_1` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`),
  ADD CONSTRAINT `routen_ibfk_2` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
