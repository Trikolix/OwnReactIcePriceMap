-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 01. Apr 2026 um 06:45
-- Server-Version: 8.0.44
-- PHP-Version: 8.4.17

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
-- Tabellenstruktur für Tabelle `photo_challenges`
--

CREATE TABLE `photo_challenges` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft',
  `group_size` int NOT NULL DEFAULT '4',
  `start_at` datetime DEFAULT NULL,
  `submission_deadline` datetime DEFAULT NULL,
  `submission_limit_per_user` int DEFAULT NULL,
  `group_schedule` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `group_advancers` int NOT NULL DEFAULT '2',
  `lucky_loser_slots` int NOT NULL DEFAULT '2',
  `ko_bracket_size` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `photo_challenges`
--

INSERT INTO `photo_challenges` (`id`, `title`, `description`, `status`, `group_size`, `start_at`, `submission_deadline`, `submission_limit_per_user`, `group_schedule`, `group_advancers`, `lucky_loser_slots`, `ko_bracket_size`, `created_by`, `created_at`, `updated_at`) VALUES
(3, 'Ice-App Fotochallenge – 1 Jahr Ice-App!', 'Ein Jahr voller Eis-Momente liegt hinter uns – jetzt suchen wir die besten Eisfotos aus der Ice-App! 🎉\r\n\r\nWähle einfach deine schönsten Bilder aus deinen bisherigen Ice-App Posts aus und reiche sie für die Challenge ein. Egal ob perfekte Kugel, beeindruckender Eisbecher oder dein Lieblingsmoment mit Eis. 🍨\r\n\r\n🏆 Es wird tolle Preise zu gewinnen geben! Auch wer nur abstimmt hat eine Chance zu gewinnen.\r\n\r\nAlso stöbere durch deine bisherigen Beiträge, reiche deine Favoriten ein und lade Freunde ein, ebenfalls mitzumachen.\r\n\r\nViel Spaß bei der Fotochallenge! 📷🍦', 'ko_running', 4, '2026-03-06 09:00:00', '2026-03-14 12:00:00', 3, NULL, 2, 2, NULL, 1, '2026-03-06 08:30:41', '2026-03-31 23:26:10');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `photo_challenges`
--
ALTER TABLE `photo_challenges`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `photo_challenges`
--
ALTER TABLE `photo_challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
