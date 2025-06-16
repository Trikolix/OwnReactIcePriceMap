-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 16. Jun 2025 um 11:27
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
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', '2025-05-12 14:51:32', 1, NULL),
(25, 'alvaperez12', 'theresa.anna.perez@googlemail.com', '$2y$12$52IxywCiQd0kR8O2wGc9zeCOst2r8Fyj0dKVX8jiqkbXBPWtJpl3e', '2025-05-19 17:09:16', 1, NULL),
(26, 'moritz', 'moritzlistner1@gmail.com', '$2y$12$fByEoYTP8KAUwoXCgko/6Oxm34xb/3HzYqEv2PX7e65aOy86T9e5a', '2025-05-22 04:56:36', 1, NULL),
(27, 'Ben', 'ben.merb@gmail.com', '$2y$12$AH0w57pnJh95.OQensCn4OQQ4.xw.PND4I7MR83VEE/7XMg.Y3/EG', '2025-05-25 05:40:47', 1, NULL),
(28, 'Radolph', 'ralph@raumausstattung-kretz.de', '$2y$12$VahKmrDf4Sv0O7JAwo7W2.gQRSKfgv8g8nd6seT65rtuSzhGcJCni', '2025-05-26 08:21:07', 1, NULL),
(29, 'KingGC', 'mrupkalwis@gmx.de', '$2y$12$xtWKYNcALSnMhHRuCtgagufSO1rAucyIxvy.USFAfbqFxg9W6uZRa', '2025-05-26 08:31:08', 1, NULL),
(30, 'Erfurter Feinschmecker', 'valentin.oertel@uni-erfurt.de', '$2y$12$dvID264JsEqQGT8Wzp8PLux2LFbd1NtkI.j8go93.vBSyf9mIbah.', '2025-05-26 18:19:26', 1, NULL),
(31, 'yannickr.t', 'yannick.runst@gmx.de', '$2y$12$ieQwX3G1TuVDcLE0g7ceFulTh8gBoLRorDOC10i/vPTk5QfiyeM.m', '2025-05-26 19:53:40', 1, NULL),
(32, 'Lemony', 'Sarah.Reinhold.mail@gmail.com', '$2y$12$Ocaljou1GY.DgsL0CRdLSOR9MO.fmUYcRhgjE7l8ie8J1hygVKZeO', '2025-05-27 10:57:57', 1, NULL),
(33, 'Mandy', 'pieschelnico@aol.com', '$2y$12$iWJWiZ4WYxoA0Xsg0Rkafe.hqKsEd9rs5Ea9dgFhBmXZWZFG8AdFK', '2025-05-27 16:32:53', 1, NULL),
(34, 'Bräuti', 'grohmii@aol.com', '$2y$12$JQymVJ3oo/L.sR.6wc2fUeA14vzlw2Tw8U2r1j1itPsEY0UTb.svG', '2025-05-27 16:36:09', 1, NULL),
(35, 'frank.wiesegart@hotmail.de', 'frank.wiesegart@hotmail.de', '$2y$12$ZkvKjPGZmctci0QY97Ti4eNTQ/diMNEFkpWWpXj2p09kVH8VrIGUG', '2025-05-27 16:46:03', 1, NULL),
(36, 'Vanessa', 'vanessa1998@freenet.de', '$2y$12$1sVdPa1Q9nqiBFBX7wnHTeMbPnv7jLfe59.Wh08TZWR7aK39bRSYq', '2025-05-28 09:50:35', 1, NULL),
(37, 'Tobitobsen', 'tobias.markstein@gmail.com', '$2y$12$Fnmx8/B5/7p0lVe23p7sNuA.3MPQl85JgWd3ZM66T9nVzk8HSyAlm', '2025-05-30 14:51:09', 1, NULL),
(38, 'Conmuel', 'cornelia.mueller96@web.de', '$2y$12$4jQ2LrwgtxVrAMzYoYljiONmd2wlrAtxsorCwsVn87r/V.RRkNXlS', '2025-05-30 15:17:31', 0, '31a604a916646155a8863adea3744cb4dd8c1e548206378d6e1420dea77c9a4f'),
(39, 'tim', 'tim.pfueller01@gmail.com', '$2y$12$AIrT64Pa1mWih5cxDkZxU.b4pDB2cHc6CxZ5MrIAxVFqly0VCHQKG', '2025-05-30 16:33:21', 1, NULL),
(40, 'Anton', 'antonschmick@gmail.com', '$2y$12$.Kh6jEsGBbfGX.L6B246qOYIjXaD5AMyde4fxgMkk71/9L49jIhEa', '2025-05-30 19:44:24', 1, NULL),
(41, 'Sanni', 'susan.belda@posteo.de', '$2y$12$jVN.ldgpYpO8qB5qIUR./uCKzJHG6aOMXMbvcfB0BLAjJkw.WZrRO', '2025-05-30 21:57:47', 1, NULL),
(42, 'Ron', 'wallasch_ronny@web.de', '$2y$12$mi58gM5Wwgs3M9R/kzBwhOxR.73JNKmohWNMiHxORndO9GXm4Hty.', '2025-05-31 12:22:44', 1, NULL),
(43, 'Kati', 'kadomi03@gmx.de', '$2y$12$YSNq57Tr34t9L302Gqaar.u.m1mN4KCZLTsSnQUK5S/3y4yM0hNce', '2025-06-01 16:51:26', 1, NULL),
(44, 'paulemaule', 'miksacompanz@outlook.com', '$2y$12$G0jFOZFBHkMNyhqWndjFKeV1GFbIQs70t80rPFYU2aUG/.jNwZRTm', '2025-06-08 12:48:03', 1, NULL),
(45, 'Anne_glace', 'annemuhhle@gmail.com', '$2y$12$loj9Z4xFZPcAJt9z71Z2RehrzTH7L1ibkMoEcr5GHcgftYI4u1U2y', '2025-06-08 12:48:47', 1, NULL),
(46, 'Jutta B.', 'juttamobil49@gmail.com', '$2y$12$HZdrqw5v5E/VyD1K3eLpUOQVK3CyCSU6052fyp.zOeDDHZ2NGIjwO', '2025-06-09 18:17:19', 0, '6d110e61611825576353735d8414010504011c0c126426ee5b71e4898b1b4fdd'),
(47, 'Kristin', 'Kristin-79@web.de', '$2y$12$EevmPVhJ7pPcJb.TpeNRYOjrOOO8VH8sTsKF82cQgJvEwO5L1IOv.', '2025-06-11 04:44:21', 1, NULL),
(48, 'Simon', 'simon.lang09337@gmail.com', '$2y$12$QAO3Voa5GhdPDwGl6k5K4emua8tTsNH5DcnaTp0oxC88XGpAPVwum', '2025-06-13 12:47:28', 1, NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
