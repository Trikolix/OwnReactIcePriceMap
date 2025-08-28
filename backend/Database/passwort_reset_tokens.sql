-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:26
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
-- Tabellenstruktur für Tabelle `passwort_reset_tokens`
--

CREATE TABLE `passwort_reset_tokens` (
  `id` int NOT NULL,
  `nutzer_id` int NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `passwort_reset_tokens`
--

INSERT INTO `passwort_reset_tokens` (`id`, `nutzer_id`, `token`, `expires_at`, `used`) VALUES
(1, 34, '0aad0f5633590942cd93bfeb30fdf781ff2154544af4fb9709d9cf83b4e0ba45', '2025-05-27 19:38:25', 1),
(2, 53, 'fe87d49043fd5300dc4f092dd64480d9279aec620c116d962147f45bcb378312', '2025-06-18 22:21:03', 1),
(3, 54, 'f5c0513bb159f65b7bef9bf8f7564e0481828e70195549d0cd49fdab8b2ac629', '2025-06-21 00:53:47', 1),
(4, 88, '0931425b5ade1cdf45a9b528323385a6c7700b3042d9d653a58eae0913014680', '2025-07-13 17:39:32', 0),
(5, 88, '9091a6e4eb75f3cf45af7b6a7c3bee84d1c93157d2bd3a1de13de064771c85ee', '2025-07-13 17:39:32', 1),
(6, 88, 'f8dd9670909bfdf83d9dc6de7ef7d013bf17725c212f4b750ce6f17506da9b7d', '2025-07-14 22:30:04', 1),
(7, 88, 'd7387f7b7fae2366c2df4c7af1d2be05087533e00f0083882edd44c63f090bcb', '2025-07-14 22:32:39', 1),
(8, 88, 'e982ef90ad214c0ce251ae2daba0f6f7b63871fe83b59d116ada081a66130c12', '2025-07-14 22:33:19', 0),
(9, 116, 'c3b4c9fa2d0da52024499d789282c2d68ec3f04c179d047489b83b754136ef19', '2025-08-10 16:18:32', 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `nutzer_id` (`nutzer_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `passwort_reset_tokens`
--
ALTER TABLE `passwort_reset_tokens`
  ADD CONSTRAINT `passwort_reset_tokens_ibfk_1` FOREIGN KEY (`nutzer_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
