-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 13. Mai 2025 um 07:41
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
(20, '91.0.62.133', '2025-05-12 19:13:11');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `rate_limit`
--
ALTER TABLE `rate_limit`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `rate_limit`
--
ALTER TABLE `rate_limit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
