-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 08. Mai 2025 um 14:27
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
  `url` text COLLATE utf8mb4_general_ci NOT NULL,
  `beschreibung` text COLLATE utf8mb4_general_ci,
  `typ` enum('Wanderung','Rennrad','MTB','Gravel','Sonstiges') COLLATE utf8mb4_general_ci NOT NULL,
  `ist_oeffentlich` tinyint(1) DEFAULT '0',
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `routen`
--

INSERT INTO `routen` (`id`, `eisdiele_id`, `nutzer_id`, `url`, `beschreibung`, `typ`, `ist_oeffentlich`, `erstellt_am`) VALUES
(1, 7, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/766051588/embed?share_token=a0wppn9FtkukVMb4eIO1LH0uC3zs4nkuulEG5yYiADhc9g47xq\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Traumhafte Runde durchs Vogtland / westliche Erzgebirge auf sehr ruhigen Straßen, tollen Bergen und einem schönen Eis-Stopp in Eibenstock.', 'Rennrad', 1, '2025-05-06 18:51:58'),
(2, 12, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2095130840/embed?share_token=ap4vnyKtDa4kQ7cUIHWHjzRuQ4EE4wcnWfh4SX7SzDwcpGnhFF\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(3, 23, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2102873500/embed?share_token=aO8lZ2QKczabkrOMLS3saC2EFtrjB3nq5AGk9bFQx3EXZtVrBo\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(4, 24, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2105973916/embed?share_token=aaPFk4zNdiuVWi0ZnbkJWSoLFS7NSN5CbtGIlU53lvLlZlAKxr\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'im Zschopautal nimmt man relativ flach die Steigung bis hoch zum Erzegbirskamm, den geht es dann auf ruhigen Wegen durch den Wald und kleiner Dörfer entlang bis nach Olbernhau, wo dann das Torteneck auf einen wartet. Von da aus geht es wellig zurück nach Chemnitz.', 'Rennrad', 1, '2025-05-06 18:51:58'),
(5, 30, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2116969975/embed?share_token=aOjrIbBFZ0G6Oev1Ajn3sK3L9t4nTo03R9LbBZIM4y6ZriPKr6\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(6, 31, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2109432795/embed?share_token=atw46aGE8ustrenEcMyr6X5NVCQviCSV71gB86FHE3JApl36UC\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(7, 40, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/1041597491/embed?share_token=a8ppmCGzfMQKoTKYBGgvZa8GEfvWPU8IFJpptxJ2RskCTpEouu\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(8, 45, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2117023918/embed?share_token=abMM6jTSdmMQSlAGrMdTO81vdDSLJrIK7KJXTzqIUURADyuZKz\" width=\"100%\" height=\"400\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Schöne Runde durchs Gebirge, erst auf den Keilberg, dann den Fichtelberg und anschließend über die tschechische Seite nach Johanngerogenstadt, wo es leckere Eisstärkung gibt, weiter rauf auf den Auersberg. Ab dann wird mehr gerollt. In Eibenstock bietet sich nochmal ein Eisstopp an.', 'Rennrad', 1, '2025-05-06 18:51:58'),
(9, 46, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2117187697/embed?share_token=aV2Hu3UCsgD69l3EKo2M5GZWarrQeZxDItCxpA9N2l1M52Kd4N\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(10, 57, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2125763714/embed?share_token=aEGQW3j7otzdf1X7vzMI8JBzEwEV07qoTCgdkxKcvDnfZO3phh\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(11, 65, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2141338801/embed?share_token=aRyl0tA138CJahivyKq3eKLmC7XUwprq5XDGRrkTFEjVYUcEE1&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(12, 74, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2143692597/embed?share_token=anzEZqQDeHTcRq1YJOXRuRMoVfkIrs1Chfik2ID3iNgsVjSQTj&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(13, 89, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/1259315746/embed?share_token=aAcrsdK0p1Ho74xaV4g7PsGmD375xR3P76dPBRUJKFFftZc1hi&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(14, 98, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2156485682/embed?share_token=aXul3Yn3HECtwMmDcRcbEHHOe6wXSdzb6D4XK1r4QNn7shP3GH&profile=1\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', NULL, 'Rennrad', 1, '2025-05-06 18:51:58'),
(15, 101, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2159077294/embed?share_token=aIGChRNihGNZKPZKdliYH3gg0Rt7MDGqwzTs9WukJK7TG71j7M\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Auf dem Hinweg geht es etwas bergig über Freiberg nach Nossen. Dort kann man sich für wenig Geld sehr viel super leckeres Eis gönnen bevor es dann etwas flacher zurück nach Chemnitz geht.', 'Rennrad', 1, '2025-05-06 18:51:58'),
(16, 106, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2201870273/embed?share_token=aYhNWuNhx23QiYtyROzDU7xXLieCNQNDS1hfjXJwSWjw8yW9nd\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Eine ordentlich anspruchsvolle Runde durchs Gebirge. Nach dem es im Zschopau Tal relativ gleichmäßig bergauf geht, geht\'s dann steil nach Jöhstadt wo mit dem Eiscafé Bartsch eine gute Quelle für Softeis wartet.\nDanach wird es richtig bergig, von hinten wird an den Auersberg Ran gefahren, der natürlich gleich mitgenommen wird, wenn man einmal da ist.\nDanach gibt\'s feinstes Eis bei der Eismanufaktur Lipp in Annaberg, aber obacht, danach warten auch noch einige giftige, steile Rampen.\nIn Summe ein wahres Höhenmeter Fest mit leckerstem Eis 😍🍦', 'Rennrad', 1, '2025-05-06 18:51:58'),
(34, 46, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2223149396/embed?share_token=aPnSArnRnwsrHdGtf8RisNJrJdYn2qdInbmHITiAZ3Gtswe0A2\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Die Wanderung habe ich noch geplant. Sobald sie gemacht wurde, werde ich berichten.', 'Wanderung', 1, '2025-05-07 08:41:59'),
(48, 149, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2225043577/embed?share_token=axZv8tPoWNnuly4DGuTKzmSl0TkblxCD9p9RWeoFKOlHMLtkLl\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', 'Möchte ich noch fahren.', 'Rennrad', 0, '2025-05-08 04:08:58'),
(49, 150, 1, '<iframe src=\"https://www.komoot.com/de-de/tour/2225276682/embed?share_token=a5yq8SrIGOjf71VeGkuGzcpqD4WORqZ805eF6DwAfJF6OOQ7Qj\" width=\"100%\" height=\"440\" frameborder=\"0\" scrolling=\"no\"></iframe>', '', 'Rennrad', 1, '2025-05-08 07:03:25');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

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
