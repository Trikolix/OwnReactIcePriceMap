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
-- Tabellenstruktur für Tabelle `nutzer`
--

CREATE TABLE `nutzer` (
  `id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `nutzer`
--

INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `erstellt_am`, `is_verified`, `verification_token`) VALUES
(1, 'TheGourmetCyclist', 'ch_helbig@mail.de', '$2y$10$l24MOAvigoanK9fdMc7dYe06vIgVHVY6zyqq1xr940ShEuNEaMViK', '2025-03-14 06:11:55', 1, NULL),
(2, 'Luca', 'luca@randommail.de', '$2y$10$zT9SqEPz78ZrjMcwoCcCH.lKANr7XiCqDcjyT9OQ1uXV5Hydyp2/2', '2025-03-27 20:10:27', 1, NULL),
(3, 'Leckermäulchen95', 'simon.oertel1995@gmail.com', '$2y$10$AmnTKz9H5knO2.l9HULqYuyyCZxfXraAivdGc0PUOH/tET0JjYoia', '2025-04-02 19:28:56', 1, NULL),
(4, 'Tom', 'dummy@mail.de', '$2y$10$d2y8ktSLxyYbEfK1XftTcOJgKdvr9V9lv/y.tUYO4TRREe5iwzaby', '2025-04-05 12:41:30', 1, NULL),
(5, 'Erik', 'erik.loeschner@web.de', '$2y$10$Gtb7FMoek5h1mrypChCMp.5znsANd34Fc5UpuCNXLkhDHa.2QWet6', '2025-04-08 18:20:29', 1, NULL),
(6, 'Agon', 'agon.muli@random.mail.de', '$2y$10$ULhCRGTYoScnJvPs3GfUyuK4H7PATTLrsPcdUjNY6MeViXUN.m4Je', '2025-04-15 18:56:58', 1, NULL),
(7, 'Luise', 'lu.tuomari@no.mail.de', '$2y$10$O3pjh/Ly81ENzpiihb8MYurFtzH6ZFj.fF63nXQpSLmFwte19LzCu', '2025-04-16 06:43:01', 1, NULL),
(8, 'Enkiboy', 'sebastian@enke.dummymail.de', '$2y$10$ZTkG03poVKKTaOLzavI/BOrL.TI5fXJYIU5P6s0ixwdhj8kkfb1v6', '2025-04-26 18:34:34', 1, NULL),
(9, 'Carola-Eis', 'carola@dummymail.de', '$2y$10$91uWQyVuYLqaO71OCaWxC.Jfud15N.o0esDW.OEOwvYOeMhBXRGSy', '2025-04-27 19:01:59', 1, NULL),
(10, 'Pitiwowo', 'joel.machado@freenet.de', '$2y$10$eoosY8ZARZ5CvsbWt1KA6eQ6gWqQlxoZDyrjJUKyX..Rjq1Qufa1y', '2025-05-01 07:29:02', 1, NULL),
(11, 'CaptManu', 'cptnmanu@web.de', '$2y$10$PeRxbnFzzgUekaue9LdgBup4SerrsEadnx8xfYZ.lNuszPM0gpLym', '2025-05-02 17:37:31', 1, NULL),
(12, 'Matze T', 'matthias.trebeck@gmx.de', '$2y$10$fuCFkI8bAP8zxeXzrVcOiu3p3.ik1s1Y4pCJsTcChYhp6TONiIUBW', '2025-05-04 18:04:06', 1, NULL),
(13, 'Admin', 'admin@ice-app.de', '$2y$12$pjFKBd97VTV1NFf1CU7HVu6Q/x31qTfkX.RNW9HGmDnBTlDFUVEfK', '2025-05-06 05:10:51', 1, NULL),
(19, 'Maerc96', 'maerc96@gmail.com', '$2y$12$VsOFRx9XLXA1J2NmKmkbfuqwTDYMsGkZSTq0nEjqIzgOMHuVTlWti', '2025-05-06 16:25:27', 1, NULL),
(20, 'Beatrice', 'beatrice.schubert29@icloud.com', '$2y$12$LSgIRunbW2b3GagzwxYY8uwqvOeWGaL.tNYWIRRkTCk2.Zsn2K6QS', '2025-05-06 17:36:20', 1, NULL),
(21, 'emmi', 'schreiter.emmely@gmail.com', '$2y$12$aebCt7siPEdLonjfP4nHXeln1OED033MPcqJv7t4zK5vvjYHErdGe', '2025-05-06 18:36:53', 1, NULL),
(22, 'Eispfote', 'franziska.scharbrodt@gmail.com', '$2y$12$G5YgrJCPvp5sAEqBUSpOk.KuYG9DRO3SL8fVX/py3pn/Yz5Z9MMsK', '2025-05-06 19:38:09', 1, NULL),
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', '2025-05-12 14:51:32', 1, NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
