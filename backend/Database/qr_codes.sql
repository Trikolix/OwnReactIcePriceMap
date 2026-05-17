-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 12. Mai 2026 um 14:20
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `k320202_iceapp`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `qr_codes`
--

CREATE TABLE `qr_codes` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `award_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `icon_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `usage_limit` int DEFAULT '0',
  `eisdiele_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `qr_codes`
--

INSERT INTO `qr_codes` (`id`, `name`, `code`, `description`, `created_at`, `valid_from`, `valid_until`, `award_type`, `icon_path`, `usage_limit`, `eisdiele_id`) VALUES
(1, 'One More Loop', '01b6e70282', 'Du hast den limitierten One More Loop Award gescannt. Besuche bis zum 10. August eine Eisdiele per Rad (optimal natürlich direkt während des Brevet) und checke einen Besuch ein um den Award zu bekommen.', '2025-07-23 03:12:05', NULL, '2025-08-10 21:59:59', NULL, 'uploads/award_icons/688132889a1fe_OneMoreLoop_clouds.png', 0, NULL),
(2, '', 'bc62c41da6cb1882c583d7a205b13a81', NULL, '2025-08-07 10:48:07', NULL, NULL, NULL, '', 0, 14),
(3, '', 'dc07a0d0eb520be1c4db0c23f279f1ab', NULL, '2025-08-07 10:51:36', NULL, NULL, NULL, '', 0, 106),
(4, '', '1877c33007c9f938e513882884f5db46', NULL, '2025-08-07 10:51:39', NULL, NULL, NULL, '', 0, 314),
(5, 'EPR2025', '41e69b3e8f6232f17e5ce35f7c08e77a', 'Du hast den limitierten EPR2025 Award gescannt. Besuche bis zum 21. September eine Eisdiele checke einen Besuch ein um den Award zu bekommen.', '2025-08-28 07:17:58', NULL, '2025-09-21 21:59:59', NULL, 'uploads/award_icons/68b001c6bf26f_EPR_2025_cloud.png', 0, NULL),
(7, 'TheTasteOfChemnitz', '3cb55cb87747d1ed4069e612cef2e75d', 'Du hast den limitierten TheTasteOfChemnitz Award gefunden. Besuche bis zum 31. Mai  drei Eisdielen in Chemnitz um den Award zu bekommen.', '2026-03-05 09:00:00', NULL, '2026-05-31 21:59:59', NULL, 'uploads/award_icons/69a945671b4d1_the_taste_of_chemitz_clouds.png', 0, NULL),
(8, 'Ice-Tour 2026 Checkpoint: Bäckerei Bräunig', 'event2026-live-shop-314', ' QR-Code für die Event-Stempelkarte Bäckerei Bräunig.', '2026-03-11 19:12:56', NULL, NULL, 'event_stamp_card', '', 0, 314),
(9, 'Ice-Tour 2026 Checkpoint: Eisdiele & Partyservice ', 'event2026-live-shop-145', ' QR-Code für die Event-Stempelkarte Eisdiele & Partyservice Schöne.', '2026-03-11 19:12:56', NULL, NULL, 'event_stamp_card', '', 0, 145),
(10, 'Ice-Tour 2026 Checkpoint: Klatt-Eis Eismanufaktur', 'event2026-live-shop-111', ' QR-Code für die Event-Stempelkarte Klatt-Eis Eismanufaktur.', '2026-03-11 19:12:56', NULL, NULL, 'event_stamp_card', '', 0, 111),
(11, 'Ice-Tour 2026 Checkpoint: Eiscafé Elisenhof', 'event2026-live-shop-22', ' QR-Code für die Event-Stempelkarte Eiscafé Elisenhof.', '2026-03-11 19:12:57', NULL, NULL, 'event_stamp_card', '', 0, 22),
(12, 'Ice-Tour 2026 Test: Eiscafé Eis-Zapfen', 'event2026-test-shop-1', 'Test- QR-Code für die Event-Stempelkarte Eiscafé Eis-Zapfen.', '2026-03-11 19:12:57', NULL, NULL, 'event_stamp_card', '', 0, 1),
(13, 'Ice-Tour 2026 Test: Eiscafé Kohlebunker', 'event2026-test-shop-2', 'Test- QR-Code für die Event-Stempelkarte Eiscafé Kohlebunker.', '2026-03-11 19:12:57', NULL, NULL, 'event_stamp_card', '', 0, 2),
(14, 'Ice-Tour 2026 Checkpoint: Karl mag\'s süß ', 'event2026-live-shop-293', ' QR-Code für die Event-Stempelkarte Karl mag\'s süß .', '2026-03-18 12:06:39', NULL, NULL, 'event_stamp_card', '', 0, 293),
(15, 'Ice-Tour 2026 Test: nouri.', 'event2026-test-shop-565', 'Test- QR-Code für die Event-Stempelkarte nouri..', '2026-03-18 12:06:39', NULL, NULL, 'event_stamp_card', '', 0, 565),
(16, 'Ice-Tour 2026 Test: Ackermanns Eiscafé', 'event2026-test-shop-20', 'Test- QR-Code für die Event-Stempelkarte Ackermanns Eiscafé.', '2026-03-19 09:03:38', NULL, NULL, 'event_stamp_card', '', 0, 20),
(17, 'Ice-Tour 2026 Test: Café Klatsch - Andreas Wörl', 'event2026-test-shop-179', 'Test- QR-Code für die Event-Stempelkarte Café Klatsch - Andreas Wörl.', '2026-03-19 09:03:38', NULL, NULL, 'event_stamp_card', '', 0, 179);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_qr_codes_eisdiele` (`eisdiele_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `fk_qr_codes_eisdiele` FOREIGN KEY (`eisdiele_id`) REFERENCES `eisdielen` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
