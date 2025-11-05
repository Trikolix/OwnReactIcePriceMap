-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 05. Nov 2025 um 08:18
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
  `current_level` int DEFAULT '1',
  `last_active_at` timestamp NULL DEFAULT NULL,
  `invite_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `invited_by` int DEFAULT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_notification_email_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `nutzer`
--

INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `current_level`, `last_active_at`, `invite_code`, `invited_by`, `erstellt_am`, `is_verified`, `verification_token`, `last_notification_email_at`) VALUES
(1, 'TheGourmetCyclist', 'ch_helbig@mail.de', '$2y$10$l24MOAvigoanK9fdMc7dYe06vIgVHVY6zyqq1xr940ShEuNEaMViK', 47, '2025-11-05 07:04:30', 'd21c6e56dc', NULL, '2025-03-14 06:11:55', 1, NULL, '2025-11-01 21:10:05'),
(2, 'TheGourmetBiker', 'luca.bock.2411@web.de', '$2y$10$zT9SqEPz78ZrjMcwoCcCH.lKANr7XiCqDcjyT9OQ1uXV5Hydyp2/2', 21, '2025-10-22 13:46:47', '128906c515', NULL, '2025-03-27 20:10:27', 1, NULL, NULL),
(3, 'Leckermäulchen95', 'simon.oertel1995@gmail.com', '$2y$10$AmnTKz9H5knO2.l9HULqYuyyCZxfXraAivdGc0PUOH/tET0JjYoia', 11, '2025-10-26 04:30:37', '0b1b662a4f', NULL, '2025-04-02 19:28:56', 1, NULL, NULL),
(4, 'Tom', 'tom-heilmann@live.de', '$2y$10$d2y8ktSLxyYbEfK1XftTcOJgKdvr9V9lv/y.tUYO4TRREe5iwzaby', 16, '2025-10-25 07:39:19', '1c6e4d07db', NULL, '2025-04-05 12:41:30', 1, NULL, NULL),
(5, 'Erik', 'erik.loeschner@web.de', '$2y$10$Gtb7FMoek5h1mrypChCMp.5znsANd34Fc5UpuCNXLkhDHa.2QWet6', 9, '2025-10-04 08:34:52', '31145ca634', NULL, '2025-04-08 18:20:29', 1, NULL, NULL),
(6, 'Agon', 'agon.muli@random.mail.de', '$2y$10$ULhCRGTYoScnJvPs3GfUyuK4H7PATTLrsPcdUjNY6MeViXUN.m4Je', 1, NULL, '2af144b83f', NULL, '2025-04-15 18:56:58', 1, NULL, NULL),
(7, 'Luise', 'lu.tuomari@no.mail.de', '$2y$10$O3pjh/Ly81ENzpiihb8MYurFtzH6ZFj.fF63nXQpSLmFwte19LzCu', 1, NULL, 'b26f690e28', NULL, '2025-04-16 06:43:01', 1, NULL, NULL),
(8, 'Enkiboy', 'enke.sebastian.91@gmail.com', '$2y$10$ZTkG03poVKKTaOLzavI/BOrL.TI5fXJYIU5P6s0ixwdhj8kkfb1v6', 22, '2025-11-01 07:15:13', '8d4a14bc01', NULL, '2025-04-26 18:34:34', 1, NULL, '2025-10-22 18:07:36'),
(9, 'Carola-Eis', 'carola@dummymail.de', '$2y$10$91uWQyVuYLqaO71OCaWxC.Jfud15N.o0esDW.OEOwvYOeMhBXRGSy', 1, NULL, '75e6275092', NULL, '2025-04-27 19:01:59', 1, NULL, NULL),
(10, 'Pitiwowo', 'joel.machado@freenet.de', '$2y$10$eoosY8ZARZ5CvsbWt1KA6eQ6gWqQlxoZDyrjJUKyX..Rjq1Qufa1y', 1, NULL, 'caea6bee5f', NULL, '2025-05-01 07:29:02', 1, NULL, NULL),
(11, 'CaptManu', 'cptnmanu@web.de', '$2y$10$PeRxbnFzzgUekaue9LdgBup4SerrsEadnx8xfYZ.lNuszPM0gpLym', 1, NULL, '15c2a2c0c8', NULL, '2025-05-02 17:37:31', 1, NULL, NULL),
(12, 'Matze T', 'matthias.trebeck@gmx.de', '$2y$10$fuCFkI8bAP8zxeXzrVcOiu3p3.ik1s1Y4pCJsTcChYhp6TONiIUBW', 1, NULL, 'a71597d7f7', NULL, '2025-05-04 18:04:06', 1, NULL, NULL),
(13, 'Admin', 'admin@ice-app.de', '$2y$12$pjFKBd97VTV1NFf1CU7HVu6Q/x31qTfkX.RNW9HGmDnBTlDFUVEfK', 5, '2025-10-29 12:15:05', 'c98f1d4636', NULL, '2025-05-06 05:10:51', 1, NULL, '2025-10-29 11:14:15'),
(19, 'Maerc96', 'maerc96@gmail.com', '$2y$12$VsOFRx9XLXA1J2NmKmkbfuqwTDYMsGkZSTq0nEjqIzgOMHuVTlWti', 11, '2025-11-03 18:29:27', '0354f20c07', NULL, '2025-05-06 16:25:27', 1, NULL, NULL),
(20, 'Beatrice', 'beatrice.schubert29@icloud.com', '$2y$12$LSgIRunbW2b3GagzwxYY8uwqvOeWGaL.tNYWIRRkTCk2.Zsn2K6QS', 1, NULL, 'faa4a6dca6', NULL, '2025-05-06 17:36:20', 1, NULL, NULL),
(21, 'emmi', 'schreiter.emmely@gmail.com', '$2y$12$aebCt7siPEdLonjfP4nHXeln1OED033MPcqJv7t4zK5vvjYHErdGe', 1, NULL, '82d283392c', NULL, '2025-05-06 18:36:53', 1, NULL, NULL),
(22, 'Eispfote', 'franziska.scharbrodt@gmail.com', '$2y$12$G5YgrJCPvp5sAEqBUSpOk.KuYG9DRO3SL8fVX/py3pn/Yz5Z9MMsK', 22, '2025-10-23 18:41:53', '973c05c5f4', NULL, '2025-05-06 19:38:09', 1, NULL, NULL),
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', 15, '2025-09-01 16:13:44', 'd2434287c2', NULL, '2025-05-12 14:51:32', 1, NULL, NULL),
(25, 'alvaperez12', 'theresa.anna.perez@googlemail.com', '$2y$12$52IxywCiQd0kR8O2wGc9zeCOst2r8Fyj0dKVX8jiqkbXBPWtJpl3e', 6, '2025-09-22 17:49:34', 'a8af7f342a', NULL, '2025-05-19 17:09:16', 1, NULL, NULL),
(26, 'moritz', 'moritzlistner1@gmail.com', '$2y$12$fByEoYTP8KAUwoXCgko/6Oxm34xb/3HzYqEv2PX7e65aOy86T9e5a', 5, '2025-10-23 16:48:36', 'e9efa25ecd', NULL, '2025-05-22 04:56:36', 1, NULL, NULL),
(27, 'Ben', 'ben.merb@gmail.com', '$2y$12$AH0w57pnJh95.OQensCn4OQQ4.xw.PND4I7MR83VEE/7XMg.Y3/EG', 1, NULL, 'c9ad393cdc', NULL, '2025-05-25 05:40:47', 1, NULL, NULL),
(28, 'Radolph', 'ralph@raumausstattung-kretz.de', '$2y$12$VahKmrDf4Sv0O7JAwo7W2.gQRSKfgv8g8nd6seT65rtuSzhGcJCni', 1, NULL, '6a2da9613c', NULL, '2025-05-26 08:21:07', 1, NULL, NULL),
(29, 'KingGC', 'mrupkalwis@gmx.de', '$2y$12$xtWKYNcALSnMhHRuCtgagufSO1rAucyIxvy.USFAfbqFxg9W6uZRa', 1, NULL, '3ef3df8a96', NULL, '2025-05-26 08:31:08', 1, NULL, NULL),
(30, 'Erfurter Feinschmecker', 'valentin.oertel@uni-erfurt.de', '$2y$12$5ja9eCAIzB41g3rIcaFfHeRvXGEQMNUfCgGuTWgg9iVrBrQf7R8yS', 7, '2025-09-03 15:01:36', 'f0d8f52d30', NULL, '2025-05-26 18:19:26', 1, NULL, NULL),
(31, 'yannickr.t', 'yannick.runst@gmx.de', '$2y$12$ieQwX3G1TuVDcLE0g7ceFulTh8gBoLRorDOC10i/vPTk5QfiyeM.m', 24, '2025-11-04 13:31:08', '32b8fddb86', NULL, '2025-05-26 19:53:40', 1, NULL, '2025-10-30 20:30:48'),
(32, 'Lemony', 'Sarah.Reinhold.mail@gmail.com', '$2y$12$Ocaljou1GY.DgsL0CRdLSOR9MO.fmUYcRhgjE7l8ie8J1hygVKZeO', 1, NULL, 'a5d1edcf35', NULL, '2025-05-27 10:57:57', 1, NULL, NULL),
(33, 'Mandy', 'pieschelnico@aol.com', '$2y$12$iWJWiZ4WYxoA0Xsg0Rkafe.hqKsEd9rs5Ea9dgFhBmXZWZFG8AdFK', 1, NULL, '5341a51d0d', NULL, '2025-05-27 16:32:53', 1, NULL, NULL),
(34, 'Bräuti', 'grohmii@aol.com', '$2y$12$JQymVJ3oo/L.sR.6wc2fUeA14vzlw2Tw8U2r1j1itPsEY0UTb.svG', 4, '2025-09-21 09:30:50', '1605fec742', NULL, '2025-05-27 16:36:09', 1, NULL, NULL),
(35, 'frank.wiesegart@hotmail.de', 'frank.wiesegart@hotmail.de', '$2y$12$ZkvKjPGZmctci0QY97Ti4eNTQ/diMNEFkpWWpXj2p09kVH8VrIGUG', 1, NULL, 'e5cdd9e67a', NULL, '2025-05-27 16:46:03', 1, NULL, NULL),
(36, 'Vanessa', 'vanessa1998@freenet.de', '$2y$12$1sVdPa1Q9nqiBFBX7wnHTeMbPnv7jLfe59.Wh08TZWR7aK39bRSYq', 1, NULL, '99a17d13b0', NULL, '2025-05-28 09:50:35', 1, NULL, NULL),
(37, 'Tobitobsen', 'tobias.markstein@gmail.com', '$2y$12$Fnmx8/B5/7p0lVe23p7sNuA.3MPQl85JgWd3ZM66T9nVzk8HSyAlm', 1, NULL, 'd75f294bc4', NULL, '2025-05-30 14:51:09', 1, NULL, NULL),
(38, 'Conmuel', 'cornelia.mueller96@web.de', '$2y$12$4jQ2LrwgtxVrAMzYoYljiONmd2wlrAtxsorCwsVn87r/V.RRkNXlS', 1, NULL, 'ad5d42c5ff', NULL, '2025-05-30 15:17:31', 0, '31a604a916646155a8863adea3744cb4dd8c1e548206378d6e1420dea77c9a4f', NULL),
(39, 'tim', 'tim.pfueller01@gmail.com', '$2y$12$AIrT64Pa1mWih5cxDkZxU.b4pDB2cHc6CxZ5MrIAxVFqly0VCHQKG', 1, NULL, '3b01dd193c', NULL, '2025-05-30 16:33:21', 1, NULL, NULL),
(40, 'Anton', 'antonschmick@gmail.com', '$2y$12$.Kh6jEsGBbfGX.L6B246qOYIjXaD5AMyde4fxgMkk71/9L49jIhEa', 19, '2025-09-03 11:54:02', 'be6b0ed713', NULL, '2025-05-30 19:44:24', 1, NULL, NULL),
(41, 'Sanni', 'susan.belda@posteo.de', '$2y$12$jVN.ldgpYpO8qB5qIUR./uCKzJHG6aOMXMbvcfB0BLAjJkw.WZrRO', 7, '2025-07-01 17:33:52', '9abe3ec4ae', NULL, '2025-05-30 21:57:47', 1, NULL, NULL),
(42, 'Ron', 'wallasch_ronny@web.de', '$2y$12$mi58gM5Wwgs3M9R/kzBwhOxR.73JNKmohWNMiHxORndO9GXm4Hty.', 1, NULL, '26c02e2b9e', NULL, '2025-05-31 12:22:44', 1, NULL, NULL),
(43, 'Kati', 'kadomi03@gmx.de', '$2y$12$YSNq57Tr34t9L302Gqaar.u.m1mN4KCZLTsSnQUK5S/3y4yM0hNce', 1, '2025-08-11 12:30:11', '1308e9a749', NULL, '2025-06-01 16:51:26', 1, NULL, NULL),
(44, 'paulemaule', 'miksacompanz@outlook.com', '$2y$12$G0jFOZFBHkMNyhqWndjFKeV1GFbIQs70t80rPFYU2aUG/.jNwZRTm', 4, '2025-07-27 18:35:07', 'b8a6d68259', NULL, '2025-06-08 12:48:03', 1, NULL, NULL),
(45, 'Anne_glace', 'annemuhhle@gmail.com', '$2y$12$loj9Z4xFZPcAJt9z71Z2RehrzTH7L1ibkMoEcr5GHcgftYI4u1U2y', 5, '2025-07-24 08:21:55', '7cfedad382', NULL, '2025-06-08 12:48:47', 1, NULL, NULL),
(46, 'Jutta B.', 'juttamobil49@gmail.com', '$2y$12$HZdrqw5v5E/VyD1K3eLpUOQVK3CyCSU6052fyp.zOeDDHZ2NGIjwO', 1, NULL, '8300fe3a93', NULL, '2025-06-09 18:17:19', 0, '6d110e61611825576353735d8414010504011c0c126426ee5b71e4898b1b4fdd', NULL),
(47, 'Kristin', 'Kristin-79@web.de', '$2y$12$EevmPVhJ7pPcJb.TpeNRYOjrOOO8VH8sTsKF82cQgJvEwO5L1IOv.', 1, NULL, '66cc4e1f12', NULL, '2025-06-11 04:44:21', 1, NULL, NULL),
(48, 'Simon', 'simon.lang09337@gmail.com', '$2y$12$QAO3Voa5GhdPDwGl6k5K4emua8tTsNH5DcnaTp0oxC88XGpAPVwum', 14, '2025-10-07 12:22:20', '8ed8ebd9f5', NULL, '2025-06-13 12:47:28', 1, NULL, NULL),
(49, 'Thomas', 'thomas.runst@t-online.de', '$2y$12$wDiceHHgD8NNL7NDzyd5he0r9rXADeOS9eCL7lCTQsY.IIUsiNFHq', 14, '2025-09-11 09:00:17', 'd53683f9b2', NULL, '2025-06-16 15:21:59', 1, NULL, NULL),
(50, 'VanessaR96', 'vanessa_uhlig@live.de', '$2y$12$HubZSEAP/7UnRpQe7dE9z.YmZQjcnixM7h1CLrEn.TPZ/hInvm35a', 1, NULL, 'ece8afdf03', NULL, '2025-06-17 12:46:20', 1, NULL, NULL),
(51, 'Selina', 'selinawill539@gmail.com', '$2y$12$lIwb/P/KEXeXaoEbOHJYhe7l6VhU3AXvBSDXRir2QTCBZoL4u/k9e', 1, NULL, '94881c8f17', NULL, '2025-06-18 04:00:44', 1, NULL, NULL),
(52, 'alinaa.wrnr', 'werneralina318@gmail.com', '$2y$12$UMr.7.5y/v48SngilRPImepVRsRcHVxSnQ7Npe3HD63gCMVte44IO', 23, '2025-11-01 13:25:31', '5d91129676', NULL, '2025-06-18 15:32:27', 1, NULL, '2025-11-01 14:42:07'),
(53, 'IceGoe', 'danielgoetze1982@gmail.com', '$2y$12$LxWIS/4pZYe3kiiOvCCbGe6IGLgYSUUjF5/kgvbxNO8qAxIYBrptq', 30, '2025-11-05 04:59:24', '754f8689f2', NULL, '2025-06-18 19:14:12', 1, NULL, '2025-11-01 20:52:10'),
(54, 'lewi', 'Winfried.Leister@gmail.com', '$2y$12$vUZhkDBRfHQmMWQb1PpN4ewEr1BLfyAjdmAOsjJ1BKsHs.s3IGN/O', 7, '2025-10-05 14:45:21', '5c7c147b81', NULL, '2025-06-20 21:53:11', 1, NULL, NULL),
(55, 'Philipp', 'p-m-grosse@web.de', '$2y$12$mH51FEkAfsTUFz0eh6YxQOIx1t0qkEUFncDn.udc11E32eP0kBVQ.', 6, '2025-08-07 04:44:02', 'e7fadec6b6', NULL, '2025-06-25 06:39:27', 1, NULL, NULL),
(62, 'reyckh', 'raikhelbig@gmail.com', '$2y$12$zlzPDZfxAZkoREDa/7L6CO8guHJzTgPEE6JEvAdADqTiDfi9FW28K', 13, '2025-10-29 13:42:30', '327956fa2c', 1, '2025-06-28 14:20:57', 1, NULL, NULL),
(63, 'Schleckzilla', 'mako_acc@posteo.de', '$2y$12$qcEUxl.qkx3Ptx/wzcbD6.Sf3JQDDzqPDpptJHUDIIMMVeq1bQeiS', 6, '2025-08-01 18:46:39', 'baa6a86d6d', NULL, '2025-06-29 11:01:47', 1, NULL, NULL),
(64, 'Melanie', 'info@ghs-glauchau.de', '$2y$12$29V46LFTb8WyBzE87RGbt.gvs1BK5wWINuVf2LSEfODSouloZ.x5S', 3, '2025-07-19 19:37:16', '6da7720fed', 52, '2025-06-30 11:48:13', 1, NULL, NULL),
(65, 'Marissi', 'melanie-roesler@outlook.de', '$2y$12$GjJSdAeO9T3yEAu/z14G9OhJO7KjPN8fXZZLqIvL15R5EhLQq5kpK', 1, NULL, 'd05a50fbad', 52, '2025-06-30 11:55:38', 1, NULL, NULL),
(66, 'Lilli', 'lilli.poralla@icloud.com', '$2y$12$M1Xg5ighcdUMI62VceGeCeazsppaOfd4jlTQeft8SDORNmeUQKoo6', 1, NULL, '5fb095751e', 52, '2025-06-30 13:04:25', 1, NULL, NULL),
(67, 'Uschi', 'uschi.weise@gmail.com', '$2y$12$OS6AKiN8bP0cvEiwsg7dbODh9P3XzwJe0cTQ0kVEbGbnPBTVQLLg.', 1, NULL, 'ec0262aa27', 52, '2025-06-30 13:04:27', 1, NULL, NULL),
(68, 'Elia Möbius', 'eliamoebius2@web.de', '$2y$12$pEhsMgD/Kw1kCo14VB22CufSL0MqndUS8/2uPoUvEcqYK1n/NfjF6', 4, '2025-07-01 11:45:00', 'c2679bccf9', NULL, '2025-07-01 05:22:47', 1, NULL, NULL),
(69, 'Silke', 'silke.runst75@gmx.de', '$2y$12$NcCALQltJpsuPq2rr4rKde44/jg6dK8zU524L4MLDz460vAM1qo92', 1, NULL, '40126e4b05', 31, '2025-07-02 14:09:50', 1, NULL, NULL),
(70, 'WaffelimKopf', 'tarife55.kakadu@icloud.com', '$2y$12$bJnv/7CMbGNaX1/5xD.GrOrKVgRqqJtuqPXVy.7PLm8mVXDXGTgGC', 1, NULL, '524ba1f3be', 31, '2025-07-03 00:08:47', 0, '24422f116da4684b8f4b34ca40dfb350ff577de39c1e2d5768b996a01a0d01f6', NULL),
(71, 'Maria', 'grosammaria02@gmail.com', '$2y$12$GRWQpperF392XErkZkStrePiF4KMQZmmqOBbBVyo8U.lDINglJySS', 1, NULL, '407d989328', 52, '2025-07-05 08:16:01', 1, NULL, NULL),
(72, 'Fionski', 'schwierzfiona@gmail.com', '$2y$12$VBaGb2tuIW33K8tQXrNpj.ndT9pcCO6NNfLesWJc6HF6sEKeAxAvq', 1, NULL, '31a196f2a1', 52, '2025-07-05 09:31:42', 1, NULL, NULL),
(73, 'Emmskopf', 'emily-siegel@web.de', '$2y$12$X5V/gnOk05Nw8ZPucSTVi.JQU0.zAijrWzu65ubaZnVpx/e4BT7uq', 1, NULL, '2b1a5cdd03', 52, '2025-07-05 09:49:36', 1, NULL, NULL),
(74, 'Tische', 'tim.tischendorf@gmx.de', '$2y$12$mG9MBxsnF5wnpYuf98uYpudcQ/urTCAA1eCer4eypxWcIe3/nEXSG', 5, '2025-08-27 13:41:56', '8af4894370', 31, '2025-07-05 12:57:45', 1, NULL, NULL),
(75, 'Brommsler', 'bastel.s@gmx.de', '$2y$12$yM/jt/CYL9OLsGrrRVObUuI/XMiMADlskWSAuR7I7yZxv7e7TIKqC', 2, '2025-10-27 18:53:05', 'cd1174821f', 1, '2025-07-05 14:55:47', 1, NULL, '2025-10-28 05:51:38'),
(76, 'marvxn', 'mxrvin00@icloud.com', '$2y$12$UjAQm44LC3NH3FsNkNWbg.KhcK4mv0H33DIpi1.OlcFR0eqw/Pn4G', 1, NULL, '8bb5dce6bf', 52, '2025-07-06 11:52:58', 1, NULL, NULL),
(77, 'DiKuHo', 'kuhne.tina@web.de', '$2y$12$t4QI.nACe1sj7xTqCt2jVuYZpeAWIICFsmtNNAFMxTf8.sE.L2F2W', 8, '2025-10-04 15:08:46', '0884e97998', NULL, '2025-07-06 14:19:47', 1, NULL, NULL),
(78, 'Ratatouille', 'susann.scharbrodt@web.de', '$2y$12$MIZoyXoTEQk3fPK6dlLR0.4a96Jyyhp5DwTNdWEZv2yEWNAdSNt8W', 5, '2025-07-27 17:59:34', 'faea465b69', 40, '2025-07-06 15:11:08', 1, NULL, NULL),
(79, 'maxenderlein', 'maxenderleinracing@gmail.com', '$2y$12$hSdvY.2txc5CZOC5XP7zl.Jr1bVpPmaBroC6.GYs4R6gv5vfAxYO.', 1, '2025-07-06 18:07:16', '5b6f60ac31', NULL, '2025-07-06 18:06:41', 1, NULL, NULL),
(80, 'Lenny', 'lennard.karl@aol.com', '$2y$12$Rq69.Stj4RdRITTEwBXGa.jOJDN./NOl/esavcfkL1vQK7K44R1Ki', 1, NULL, '1a17358b69', 52, '2025-07-07 13:46:24', 1, NULL, NULL),
(81, 'Holger', 'ht_5200@yahoo.de', '$2y$12$lMG.rUNlVmidhdLWf8QS..Widgn8ajyQVhQaYan5OC86zFCpjoyGK', 7, '2025-08-08 13:01:08', '0610d57b42', NULL, '2025-07-08 13:18:02', 1, NULL, NULL),
(82, 'RW', 'rico-werner@gmx.net', '$2y$12$TnEj4Qnr3UXAQF5EYA6hrO9uyZKPVrYPaiWRbrFlyZH70IETblcOW', 1, NULL, 'bb2046ac54', 52, '2025-07-08 16:29:50', 1, NULL, NULL),
(83, 'Schafi', 'kerstin0103@gmail.com', '$2y$12$is3WBtilSWbOatLyebN3W.rfU6EBoy16YQQ05...EVl0msXNqPze2', 1, NULL, 'aa0c67d454', 52, '2025-07-08 17:21:36', 0, '3e4ffece28e71cfd7fbce35e5f2c1db305228434031c2f19664cd0cd9f736deb', NULL),
(84, 'Schaf', 'wernerkerstin0103@gmail.com', '$2y$12$4dvySSInh6jukab9XKALHevHbURHzNs1wkDAV./jDfri/C3B0bjzq', 1, NULL, '313ba35118', 52, '2025-07-08 17:30:52', 1, NULL, NULL),
(85, 'Rudi', 'stw0076@aol.com', '$2y$12$EFbdfLCR9KhKIX3klYeireRWR0wR5k3Wlx0hDOBT7RVtC/HbIw6ba', 1, '2025-07-08 17:38:04', '8e74cbbfb8', 52, '2025-07-08 17:30:58', 1, NULL, NULL),
(86, 'Nathan_auf_rEISe', 'nathanael-horbank@gmx.de', '$2y$12$fe7cxOhuPCtyLb288IshIefxhbu7DJz4icC9Y6lQW9tovHbZXz.PS', 11, '2025-08-16 15:07:44', 'f81988e05e', NULL, '2025-07-10 07:43:47', 1, NULL, NULL),
(87, 'JMarkstein', 'j.hoellering@web.de', '$2y$12$P1nDCCM7qgAjP5rTa788tuawtCsD0kUPHHaPqEmvk0QuTRSdcvzaK', 9, '2025-09-19 18:49:27', '0c81054e71', NULL, '2025-07-10 14:08:11', 1, NULL, NULL),
(88, 'Jenja', 'jenjamytyukova@gmx.de', '$2y$12$ZC4zBFtNjzqhRRSwm3ftKuxb2FTPX0Cq/tJor9GsWL1D3yQDXaS1m', 9, '2025-07-14 20:22:56', '95cf0c5aff', NULL, '2025-07-13 14:37:14', 1, NULL, NULL),
(89, 'Zuckerbäcker', 'marcus-braeunig@web.de', '$2y$12$eLwkjcYlQuVPS8qm21zqeeHCBOiKRClctsBPxKBFYLEaA/nIvvnai', 1, '2025-07-13 20:43:59', '7cf665fe8b', NULL, '2025-07-13 18:18:47', 1, NULL, NULL),
(90, 'Phil', 'philipp.jendras@t-online.de', '$2y$12$A3/bUA2b/A7wAwM.73S79.qas1C8S2RKXARNIvyK.HxIyKQdnSApG', 2, '2025-07-15 21:14:38', 'ea25a45948', 22, '2025-07-15 18:40:00', 1, NULL, NULL),
(91, 'Anni113', 'famschalla@aol.de', '$2y$12$HcLSnM8UaO2AQSrVaJerg.dtPi5ED6SRacCmYR20GmslYnCEc6LeK', 1, NULL, 'c5bccd75d8', 22, '2025-07-15 18:45:14', 1, NULL, NULL),
(92, 'Daniel', 'daniel-tuerpe@web.de', '$2y$12$cNYYIBB2UeflAZs1sWyE9ea9sE3qiag4mEG.cAjK3oZkDqQo0C5/C', 4, '2025-07-21 06:23:37', '096ae6f4a9', 1, '2025-07-20 18:59:47', 1, NULL, NULL),
(93, 'Lexi', 'lexistar27@gmail.com', '$2y$12$xiVRYiLRVZeB6Cx5AlJdU.TEvBT5E1LITxK8HKGtQpG7YkTIyfWmW', 6, '2025-07-25 14:18:09', 'add340a4c4', 8, '2025-07-21 20:04:38', 1, NULL, NULL),
(94, 'jhhot', 'jhhot@t-online.de', '$2y$12$WQhIIwhe0BOea4a0lt6Anu.qj7YCugpJmoX1Ynn5baxvCgHpdK90m', 6, '2025-09-08 09:40:20', '37f7cc6ee4', NULL, '2025-07-22 15:36:47', 1, NULL, NULL),
(95, 'Romy', 'Romy.Roblick@gmx.de', '$2y$12$eTl5ekf6XJ1Ozk9QfnR2F.FGi0V48I8MQJCIG70lYdulCluWH8Cse', 1, NULL, '1adafabeb1', 1, '2025-07-22 21:38:39', 1, NULL, NULL),
(96, 'GourmetKommissar', 'felix.ist.online@gmx.net', '$2y$12$h0jHlUZW5R015piLE9N7S.NX/Q87K..t59j4z2zyYFZ2nQFa3NuDi', 15, '2025-11-01 18:56:48', '87ee5f4bd1', NULL, '2025-07-24 14:20:04', 1, NULL, '2025-10-29 15:14:41'),
(97, 'Markus', 'wombat_bluest.3o@icloud.com', '$2y$12$Y1mUcEXijUsA8tHwAyAUTeeipYk8q6hrGiOvgpIJ8MiLVbnej59AC', 1, '2025-08-12 16:24:43', 'f2baaae7ca', 40, '2025-07-26 16:41:45', 1, NULL, NULL),
(98, 'SchleckLina', 'alina.neugebauer@gmx.de', '$2y$12$WavvELKWmnGCrh.Scx.3VO5pmD2UUaVRnS6uMtC9amR2XCa.C1qM.', 4, '2025-07-27 20:10:19', '65508f5d45', NULL, '2025-07-27 14:10:38', 1, NULL, NULL),
(99, 'Eiskat', 'uhlig.katja@t-online.de', '$2y$12$e/bW2Z7TQ/kkdX/7/vcqi.tzdLkSbN6VQr97M0ibi2wkEWwoGE2kW', 7, '2025-10-21 02:46:19', '2eb69a4f97', NULL, '2025-07-28 14:39:06', 1, NULL, NULL),
(100, 'FrankaFah', 'frankafah@icloud.com', '$2y$12$Lq3snf1EaTIt1ffKBJKmB.HRc40JzaFNIfBglZYzh4y.m7q.86aKi', 3, '2025-09-16 20:09:20', '5dc158a210', NULL, '2025-07-29 16:14:27', 1, NULL, NULL),
(101, 'grumpelstielzchen', 'steve_grumpelt@gmx.de', '$2y$12$bIDv6L71ZhtTaeLO3239lOqfwJq2Uj.iKa9IsnHCi5X5g9kzQeKSW', 1, '2025-09-19 12:19:18', '7f28c061aa', 1, '2025-08-01 14:32:00', 1, NULL, NULL),
(102, 'Zelt', 'z-steffi@gmx.net', '$2y$12$nulmSGggSoaLHx7YcY/TlORBCaEF3gPz8NHp9ZpcAP0cwEIhXzXr2', 8, '2025-09-07 07:00:03', 'bf2ef77725', NULL, '2025-08-01 20:19:24', 1, NULL, NULL),
(103, 'Rooney82', 'ronald.kraatz@freenet.de', '$2y$12$/l9i5O4NAKbbiQ465uM/hOMIwdWOHOrIygYy4UKncjk8Ru2TKfiju', 7, '2025-08-10 13:20:56', '6bbd83eb13', NULL, '2025-08-02 05:26:40', 1, NULL, NULL),
(104, 'MayA', 'andreasmay83@gmail.com', '$2y$12$GD9WezJ5/.gClGqxV4LBb.edTd5/GhK91PQUNEqWcasJR4.KQzvyq', 1, NULL, '4e997eb104', 1, '2025-08-02 05:40:42', 1, NULL, NULL),
(105, 'Maria1987', 'fichtner.maria@web.de', '$2y$12$NVFFDBWNE2CGOeNy8aFkk.hq7TBGW2S.o.W.v7OEESVBON8IKU9TC', 1, '2025-08-02 06:36:53', '74b4e99996', NULL, '2025-08-02 06:19:21', 1, NULL, NULL),
(106, 'Iceroadtrucker', 'tommyspindler@freenet.de', '$2y$12$7NL8OE3yFJbR49ZvBtLdPuvwCKDHYa97S7K5Ex9WYiY0Ytzha20pi', 4, '2025-08-11 19:29:52', 'd4e0a1ab32', 23, '2025-08-02 15:40:21', 1, NULL, NULL),
(107, 'Antje Unger', 'unger.antje@gmx.de', '$2y$12$sBiefRcxhOXRP0Uf5M36Zen9jqTizcdYPi5d2lBoJp3ezq.oqBa2S', 1, NULL, 'a630fe0f1f', NULL, '2025-08-03 16:05:35', 1, NULL, NULL),
(108, 'lampshade', 'obstladen@t-online.de', '$2y$12$Qn7V20JE1BhzVGbsasc0euw5P/bd4JoilTBeWUTYcHhizwLRTogiu', 4, '2025-09-01 07:09:17', 'ac0c44e6dd', NULL, '2025-08-04 08:31:10', 1, NULL, NULL),
(109, 'Juli_He', 'Juliane.helbig@web.de', '$2y$12$QrEyGiWD/nOaXinLpwGMbeqKvUJI2vKhdlr.2KhI..860NPNK50.W', 7, '2025-10-06 14:52:38', '01b5ce4eff', NULL, '2025-08-05 14:05:37', 1, NULL, NULL),
(110, 'Reino', 'reino.albrecht@protonmail.com', '$2y$12$8ZC/gP4BFGsPNBcww8WXw./wHJX0w4e5ThYwAIjcTix5CUbDMxsMa', 1, '2025-08-09 13:10:57', '4918838ff5', NULL, '2025-08-05 14:33:20', 1, NULL, NULL),
(111, 'Kai', 'kaix0r@me.com', '$2y$12$uIi6F53qpWz7BMf4KxQDJ.vN5ue2rjpz2rWJQt21SFOB8V7OsZb8q', 4, '2025-09-14 09:24:56', '1c1651698d', NULL, '2025-08-05 14:44:55', 1, NULL, NULL),
(112, 'Si.R.', 'silvio73@gmail.com', '$2y$12$kJUvDxoU6NAZIylVRGd08Osswo/nq4b1Y0ukQHv/vUK49Y7A8ke0a', 1, NULL, 'ba88d315d5', NULL, '2025-08-08 11:25:41', 1, NULL, NULL),
(115, 'Hagen', 'hagen.schanze@mail.de', '$2y$12$VwJlNwWKp6raaQAwt4vis.Mseh/ZMc89OeT70m6ENuHVLkskzY6Ri', 1, NULL, 'a2885a6ad0', 102, '2025-08-09 17:14:20', 1, NULL, NULL),
(116, 'Hoschi', 'andreposcher@t-online.de', '$2y$12$GGi0qyaAYORwqqIyXbbl3OBF.t/X3GJBQpDHE0ND2LNNLchTlmyuO', 1, NULL, '70ca71a0ae', NULL, '2025-08-10 10:33:12', 0, '17102810e66f436e16904c0b75b9f5cac7198640730c828bb65f8ee7aa7fda5e', NULL),
(117, 'Marco Peters', 'marco-peters@outlook.de', '$2y$12$shxekxfcvIPe9glXOy23aORzqwk2vi0G8exdV10O64OuQxZu8VlNO', 2, '2025-08-13 10:01:25', '9a864434dd', NULL, '2025-08-12 14:35:26', 1, NULL, NULL),
(118, 'kleinesritzel', 'ach.hase@icloud.com', '$2y$12$O2u44DHB1Ztzol6EanCqIO8TdfbZhukyCGXAqjQRWKlTyODpRUPVG', 11, '2025-10-03 16:17:42', '40b21c042b', NULL, '2025-08-15 20:30:25', 1, NULL, NULL),
(119, 'Gelatobert', 'weber85robert@gmail.com', '$2y$12$ShKcSMvtHk.uxGwqewZojOth.oParJGHptOCsbSdkVmBNwHiNcZWe', 7, '2025-10-08 12:45:30', 'ef3383b26e', 2, '2025-08-17 20:21:14', 1, NULL, NULL),
(120, 'Marcello77', 'mlohmann77@gmx.de', '$2y$12$bp6MdwAiidpA3nmjW5PlbedyAEQ8B9hdW5RhlnmbrsPKiYwuBkOWO', 1, NULL, 'b5858cb9d8', NULL, '2025-08-21 08:09:17', 1, NULL, NULL),
(121, 'Gustomucho233', 'Paulschool@web.de', '$2y$12$dkHn.deJPfx3ZQcqvVttseo1yZWYe5PIZNIrdKw/qihGSHjepXpBe', 1, NULL, '04c3416230', 96, '2025-08-22 17:06:02', 1, NULL, NULL),
(122, 'Robert', 'rob12@gmx.de', '$2y$12$Y7y0OnGZyOZ9EHKwl7/ApuFaOSHLS/qxDkY/4gvMAqohzhCdzYdpy', 1, '2025-08-26 14:18:28', 'acb11d56e4', NULL, '2025-08-24 14:07:58', 1, NULL, NULL),
(123, 'Rabnizz', 'mischa.rabe@t-online.de', '$2y$12$DEcpZYZ0mA98n7W5jwK.JeE.O6WDpF1SLt8sp6NljtDhdwwrRlgae', 4, '2025-09-22 21:26:33', 'b917e85545', NULL, '2025-08-26 14:15:50', 1, NULL, NULL),
(124, 'Mr. Uno', 'paul.zilly@aol.com', '$2y$12$.kLwVw6uD5Pl9RBl5rGC4O3R89wa6Jj2dxtgO0KUhbHgb9Lxices.', 1, NULL, 'b02eab482a', 8, '2025-08-27 08:08:27', 1, NULL, NULL),
(125, 'Suklaafani', 'isabel.helbig@googlemail.com', '$2y$12$rY4rcY23NRLUFZYBiUNS7.9sfdos1FfxmcooZS47FlwSjL2Ok8fr6', 11, '2025-11-01 11:51:57', '4026dfc798', NULL, '2025-08-29 17:44:06', 1, NULL, NULL),
(126, 'Miranda', 'auriphrygia@gmail.com', '$2y$12$.NTSKsWSOTYakLXRtu4RqugFwKK7/T1HCtq2tK9ZjyNQlZFtAV9sm', 1, NULL, '86dcfeb4fe', 40, '2025-08-30 17:06:32', 0, '37d3d5173b3998b9605a23b44d36175c604de7466cfabeea6e4ed69b10daa5a7', NULL),
(127, 'eisprinzessin', 'miranda.stattmann@gmail.com', '$2y$12$IIlYGyVdUyc2jUXiNTtLL.E7PxhcTUmu4Vc1y4zOAiKFAjneXjx7K', 1, NULL, 'c65e1bd3f3', 40, '2025-08-30 17:07:09', 1, NULL, NULL),
(128, 'Kuki93', 'kunzek1993@gmail.com', '$2y$12$ozXFWUdpvakdTu4WEmpWmOYigjxBkDBoADYzLawf/ePTJn/SGGkYC', 1, '2025-09-23 18:30:54', '991887d5da', NULL, '2025-08-31 15:31:11', 1, NULL, NULL),
(129, 'Nina', 'hiller-nina@web.de', '$2y$12$6IyXfjmUL51cM04q9EdpjenjBynun563XK1Q.BWFtHqReMetDt7S2', 1, NULL, '01fa367dd9', 2, '2025-09-04 09:35:07', 0, '9e9b281014832ef064f6723cb5c97f30547eac94fe056727740e23481d9a1ccf', NULL),
(130, 'Wele', 'leanawerner@icloud.com', '$2y$12$37VW0hY6QLWiEH366nHtrOlk7eOO06EgD3577mv1TK.qnZLCcj8cK', 1, NULL, '2e5620726d', 52, '2025-09-06 19:05:15', 0, 'd22921037a0859b69314988a1308471441419e0c5cd3942c2259d99cb3bbb795', NULL),
(131, 'sestef', 'stefan-seidel@posteo.de', '$2y$12$9oOTlFfmx/Ml/jRdwYcDbeFZG/SW6apltbrKHtSEJMdauRzYmtUKm', 10, '2025-09-10 15:37:04', '9c188431a0', 1, '2025-09-07 04:10:54', 1, NULL, NULL),
(132, 'Vivi', 'viviennever@hotmail.com', '$2y$12$CmgQPPecVYWT/9ZXKixWcOIBdv2ilfDn7BuOfEdHiUdhEP4bxCexm', 1, '2025-09-07 05:26:12', 'a9fb77bc92', 102, '2025-09-07 04:18:00', 1, NULL, NULL),
(133, 'Kette46', 'racemaster46@gmail.com', '$2y$12$ovA7gHlQbRWeA9lBBvXSoOlhfhKzYZUR1676gc8tqdGgjZ1zokL3i', 2, '2025-10-30 14:35:05', '6bfd76b3b0', NULL, '2025-09-07 09:59:44', 1, NULL, NULL),
(134, 'Birgit', 'OMI0815@aol.com', '$2y$12$C6r8QtO6jKLC3cVc/3nHzuWsltx623P6jBDWzlL7asF/KyBq0.O6u', 1, NULL, '175ca2b78d', NULL, '2025-09-11 16:26:51', 1, NULL, NULL),
(135, 'Jan Wiedemann | Paracycling', 'janwied@web.de', '$2y$12$x32KjtJabIkD2L0sbfIcDObwyzgpFXzL9s5lmOlDRKDu4kpN9JNzu', 1, '2025-09-14 09:13:48', '2f6e1abb68', NULL, '2025-09-14 09:11:17', 1, NULL, NULL),
(136, 'Martin86', 'martin.missler@gmx.net', '$2y$12$6c0RIujfPydj1f/b7aTTA.lXcwm4HW/85xTmFU2JGy6Rp6wr8rgbu', 1, NULL, 'f301b6960b', NULL, '2025-09-14 11:57:14', 0, '1db009200ea9a9fefe410cc08f031d45cac89a6702a266e3110a479268978bdb', NULL),
(137, 'Mamil23', 'tilo.kozlik@gmail.com', '$2y$12$solkoEGNzKlYimstpQxIE.ocDiv/B9jdiZrBf1hLUSW5onwmizpYK', 7, '2025-09-22 10:13:50', '143c2dfc29', NULL, '2025-09-16 17:57:55', 1, NULL, NULL),
(138, 'Lydia S.', 'lydsch2000@googlemail.com', '$2y$12$y2zH9MN0llOCuIKGjgUap.gQzyMNOr320zGBhOEDbuR554tRMYzIe', 1, NULL, '8ee2b9e0e1', NULL, '2025-09-23 15:55:08', 1, NULL, NULL),
(139, 'LexaE', 'zillyalexandra@aol.com', '$2y$12$j7BwiRQw3jFBYaACYrtE/eGml2FD0toul3lvxkHJeBmptDwhkVKda', 12, '2025-10-28 21:05:37', '91a02309e7', 8, '2025-10-01 16:15:05', 1, NULL, '2025-10-24 21:16:03'),
(140, 'Tboneflow', 'posaunenfreak3@gmail.com', '$2y$12$nXsFQXrzgKmC8g5ZxOz4hOjkewB76h0wvxW6gsKHy8YozFG7rF45m', 1, NULL, 'dedb393c18', 22, '2025-10-04 14:35:06', 1, NULL, NULL),
(141, 'jäätelö-dori', 'dorothee.braun@quaerosys.com', '$2y$12$i8YMFclt5/T69ddnfNMinOHrdE10grn1vABqqjILzenZ9JBzQFm.S', 1, NULL, '2d38553f70', 22, '2025-10-04 14:44:07', 1, NULL, NULL),
(142, 'Stax', 'max.5@web.de', '$2y$12$GoCliJX6rB7gtTR0BxGax.r7kn6duqxgiz2yx54YhxgpPeRnBnnlq', 5, '2025-10-07 18:32:30', '5ac9b73638', 22, '2025-10-07 18:11:36', 1, NULL, NULL),
(143, 'Tim Lange', 'timlange25112010@gmail.com', '$2y$12$2KmsG2YDotVE5pmwzrRA7ONcyB0QKIwzThjpx1lXBY/2fTFe4igXe', 4, '2025-10-18 19:39:25', 'da9d6f9e15', 8, '2025-10-18 13:37:04', 1, NULL, NULL),
(144, 'JohannaWe', 'johanna.wenisch@gmx.de', '$2y$12$XiDjjpFgrEsAwpOO/YK.LezdLy3SrcAqeAoO6xoHqzBymxMkRdOAu', 5, '2025-10-19 17:50:51', '7310a3975f', NULL, '2025-10-19 17:40:28', 1, NULL, NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `invited_by` (`invited_by`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `nutzer`
--
ALTER TABLE `nutzer`
  ADD CONSTRAINT `nutzer_ibfk_1` FOREIGN KEY (`invited_by`) REFERENCES `nutzer` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
