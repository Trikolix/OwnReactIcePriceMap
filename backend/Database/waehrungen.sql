-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:27
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
-- Tabellenstruktur für Tabelle `waehrungen`
--

CREATE TABLE `waehrungen` (
  `id` int NOT NULL,
  `code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `waehrungen`
--

INSERT INTO `waehrungen` (`id`, `code`, `name`, `symbol`) VALUES
(1, 'EUR', 'Euro', '€'),
(2, 'CZK', 'Tschechische Krone', 'Kč'),
(3, 'CHF', 'Schweizer Franken', 'CHF'),
(4, 'ALL', 'Albanischer Lek', 'L'),
(5, 'AMD', 'Armenischer Dram', '֏'),
(6, 'AZN', 'Aserbaidschanischer Manat', '₼'),
(7, 'BAM', 'Konvertible Mark', 'KM'),
(8, 'BGN', 'Bulgarischer Lew', 'лв'),
(9, 'DKK', 'Dänische Krone', 'kr'),
(10, 'GEL', 'Georgischer Lari', '₾'),
(11, 'ISK', 'Isländische Krone', 'kr'),
(12, 'KZT', 'Kasachischer Tenge', '₸'),
(13, 'MDL', 'Moldauischer Leu', 'L'),
(14, 'MKD', 'Mazedonischer Denar', 'ден'),
(15, 'NOK', 'Norwegische Krone', 'kr'),
(16, 'PLN', 'Polnischer Zloty', 'zł'),
(17, 'RON', 'Rumänischer Leu', 'lei'),
(18, 'RUB', 'Russischer Rubel', '₽'),
(19, 'SEK', 'Schwedische Krone', 'kr'),
(20, 'RSD', 'Serbischer Dinar', 'дин'),
(21, 'UAH', 'Ukrainische Hrywnja', '₴'),
(22, 'HUF', 'Ungarischer Forint', 'Ft'),
(23, 'GBP', 'Britisches Pfund', '£'),
(24, 'BYN', 'Weißrussischer Rubel', 'Br'),
(25, 'USD', 'US Dollar', '$'),
(26, 'HRK', 'Kuna', 'kn'),
(27, 'ILS', 'Schekel', 'NIS');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `waehrungen`
--
ALTER TABLE `waehrungen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `waehrungen`
--
ALTER TABLE `waehrungen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
