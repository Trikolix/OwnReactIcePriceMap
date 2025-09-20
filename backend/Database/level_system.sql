-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 02. Sep 2025 um 10:23
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
-- Tabellenstruktur für Tabelle `level_system`
--

CREATE TABLE `level_system` (
  `level` int NOT NULL,
  `ep_min` int NOT NULL,
  `level_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `level_system`
--

INSERT INTO `level_system` (`level`, `ep_min`, `level_name`) VALUES
(1, 0, 'Eisschnupperer'),
(2, 35, 'Kugel-Kenner'),
(3, 80, 'Waffel-Genießer'),
(4, 140, 'Eisfreund'),
(5, 220, 'Sorbet-Scout'),
(6, 325, 'Eismeister'),
(7, 455, 'Topping-Taktiker'),
(8, 615, 'Eis-Profi'),
(9, 805, 'Dessert-Dompteur'),
(10, 1030, 'Gelato-Guru'),
(11, 1295, 'Eis-Verfechter'),
(12, 1600, 'Sahne-Stratege'),
(13, 1945, 'Schoko-Spezialist'),
(14, 2335, 'Kugelkünstler'),
(15, 2770, 'Eis-Architekt'),
(16, 3255, 'Sorbet-Sensation'),
(17, 3790, 'Eisdielen-Veteran'),
(18, 4375, 'Frozen-Fighter'),
(19, 5015, 'Schleck-Champion'),
(20, 5715, 'Eis-Legende'),
(21, 6475, 'Gourmet-Gefährte'),
(22, 7300, 'Sahne-Schatten'),
(23, 8195, 'Kalter Kommandant'),
(24, 9165, 'Gelato-General'),
(25, 10215, 'Crème-de-la-Crème'),
(26, 11355, 'Dessert-Direktor'),
(27, 12585, 'Eis-Ikone'),
(28, 13915, 'Geschmacksguru'),
(29, 15345, 'Schleck-Superstar'),
(30, 16885, 'Kugel-König'),
(31, 18545, 'Zuckersturmjäger'),
(32, 20325, 'Softeis-Sheriff'),
(33, 22235, 'Kaltgetränk-Kommandant'),
(34, 24285, 'Milchmix-Magier'),
(35, 26475, 'Eiszeit-Elite'),
(36, 28815, 'Sorbet-Supremacist'),
(37, 31315, 'Gelato-Gouverneur'),
(38, 33975, 'Streusel-Stratege'),
(39, 36795, 'Knusperkronenkrieger'),
(40, 39785, 'Eiszeit-Initiator'),
(41, 42955, 'Topping-Titan'),
(42, 46305, 'Sahne-Senator'),
(43, 49845, 'Eis-Imperator'),
(44, 53585, 'Süßwaren-Supervisor'),
(45, 57525, 'Schleck-Sultan'),
(46, 61675, 'Frostfürst'),
(47, 66045, 'Kugelkaiser'),
(48, 70645, 'Dessert-Diktator'),
(49, 75485, 'Eisplanet-Pionier'),
(50, 80575, 'Kältekönig der Galaxis');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `level_system`
--
ALTER TABLE `level_system`
  ADD PRIMARY KEY (`level`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
