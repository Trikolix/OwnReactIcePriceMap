-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 28. Aug 2025 um 14:25
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
  `verification_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `current_level` int DEFAULT '1',
  `invite_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `invited_by` int DEFAULT NULL,
  `last_active_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `nutzer`
--

INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `erstellt_am`, `is_verified`, `verification_token`, `current_level`, `invite_code`, `invited_by`, `last_active_at`) VALUES
(1, 'TheGourmetCyclist', 'ch_helbig@mail.de', '$2y$10$l24MOAvigoanK9fdMc7dYe06vIgVHVY6zyqq1xr940ShEuNEaMViK', '2025-03-14 06:11:55', 1, NULL, 38, 'd21c6e56dc', NULL, '2025-08-28 12:25:11'),
(2, 'TheGourmetBiker', 'luca.bock.2411@web.de', '$2y$10$zT9SqEPz78ZrjMcwoCcCH.lKANr7XiCqDcjyT9OQ1uXV5Hydyp2/2', '2025-03-27 20:10:27', 1, NULL, 20, '128906c515', NULL, '2025-08-23 19:02:38'),
(3, 'Leckermäulchen95', 'simon.oertel1995@gmail.com', '$2y$10$AmnTKz9H5knO2.l9HULqYuyyCZxfXraAivdGc0PUOH/tET0JjYoia', '2025-04-02 19:28:56', 1, NULL, 9, '0b1b662a4f', NULL, '2025-08-13 16:35:03'),
(4, 'Tom', 'tom-heilmann@live.de', '$2y$10$d2y8ktSLxyYbEfK1XftTcOJgKdvr9V9lv/y.tUYO4TRREe5iwzaby', '2025-04-05 12:41:30', 1, NULL, 13, '1c6e4d07db', NULL, '2025-08-17 11:53:36'),
(5, 'Erik', 'erik.loeschner@web.de', '$2y$10$Gtb7FMoek5h1mrypChCMp.5znsANd34Fc5UpuCNXLkhDHa.2QWet6', '2025-04-08 18:20:29', 1, NULL, 1, '31145ca634', NULL, NULL),
(6, 'Agon', 'agon.muli@random.mail.de', '$2y$10$ULhCRGTYoScnJvPs3GfUyuK4H7PATTLrsPcdUjNY6MeViXUN.m4Je', '2025-04-15 18:56:58', 1, NULL, 1, '2af144b83f', NULL, NULL),
(7, 'Luise', 'lu.tuomari@no.mail.de', '$2y$10$O3pjh/Ly81ENzpiihb8MYurFtzH6ZFj.fF63nXQpSLmFwte19LzCu', '2025-04-16 06:43:01', 1, NULL, 1, 'b26f690e28', NULL, NULL),
(8, 'Enkiboy', 'sebastian@enke.dummymail.de', '$2y$10$ZTkG03poVKKTaOLzavI/BOrL.TI5fXJYIU5P6s0ixwdhj8kkfb1v6', '2025-04-26 18:34:34', 1, NULL, 17, '8d4a14bc01', NULL, '2025-08-27 07:21:08'),
(9, 'Carola-Eis', 'carola@dummymail.de', '$2y$10$91uWQyVuYLqaO71OCaWxC.Jfud15N.o0esDW.OEOwvYOeMhBXRGSy', '2025-04-27 19:01:59', 1, NULL, 1, '75e6275092', NULL, NULL),
(10, 'Pitiwowo', 'joel.machado@freenet.de', '$2y$10$eoosY8ZARZ5CvsbWt1KA6eQ6gWqQlxoZDyrjJUKyX..Rjq1Qufa1y', '2025-05-01 07:29:02', 1, NULL, 1, 'caea6bee5f', NULL, NULL),
(11, 'CaptManu', 'cptnmanu@web.de', '$2y$10$PeRxbnFzzgUekaue9LdgBup4SerrsEadnx8xfYZ.lNuszPM0gpLym', '2025-05-02 17:37:31', 1, NULL, 1, '15c2a2c0c8', NULL, NULL),
(12, 'Matze T', 'matthias.trebeck@gmx.de', '$2y$10$fuCFkI8bAP8zxeXzrVcOiu3p3.ik1s1Y4pCJsTcChYhp6TONiIUBW', '2025-05-04 18:04:06', 1, NULL, 1, 'a71597d7f7', NULL, NULL),
(13, 'Admin', 'admin@ice-app.de', '$2y$12$pjFKBd97VTV1NFf1CU7HVu6Q/x31qTfkX.RNW9HGmDnBTlDFUVEfK', '2025-05-06 05:10:51', 1, NULL, 4, 'c98f1d4636', NULL, '2025-08-19 13:34:02'),
(19, 'Maerc96', 'maerc96@gmail.com', '$2y$12$VsOFRx9XLXA1J2NmKmkbfuqwTDYMsGkZSTq0nEjqIzgOMHuVTlWti', '2025-05-06 16:25:27', 1, NULL, 1, '0354f20c07', NULL, NULL),
(20, 'Beatrice', 'beatrice.schubert29@icloud.com', '$2y$12$LSgIRunbW2b3GagzwxYY8uwqvOeWGaL.tNYWIRRkTCk2.Zsn2K6QS', '2025-05-06 17:36:20', 1, NULL, 1, 'faa4a6dca6', NULL, NULL),
(21, 'emmi', 'schreiter.emmely@gmail.com', '$2y$12$aebCt7siPEdLonjfP4nHXeln1OED033MPcqJv7t4zK5vvjYHErdGe', '2025-05-06 18:36:53', 1, NULL, 1, '82d283392c', NULL, NULL),
(22, 'Eispfote', 'franziska.scharbrodt@gmail.com', '$2y$12$G5YgrJCPvp5sAEqBUSpOk.KuYG9DRO3SL8fVX/py3pn/Yz5Z9MMsK', '2025-05-06 19:38:09', 1, NULL, 18, '973c05c5f4', NULL, '2025-08-26 17:47:57'),
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', '2025-05-12 14:51:32', 1, NULL, 15, 'd2434287c2', NULL, '2025-08-22 16:41:56'),
(25, 'alvaperez12', 'theresa.anna.perez@googlemail.com', '$2y$12$52IxywCiQd0kR8O2wGc9zeCOst2r8Fyj0dKVX8jiqkbXBPWtJpl3e', '2025-05-19 17:09:16', 1, NULL, 1, 'a8af7f342a', NULL, NULL),
(26, 'moritz', 'moritzlistner1@gmail.com', '$2y$12$fByEoYTP8KAUwoXCgko/6Oxm34xb/3HzYqEv2PX7e65aOy86T9e5a', '2025-05-22 04:56:36', 1, NULL, 4, 'e9efa25ecd', NULL, '2025-08-13 18:07:49'),
(27, 'Ben', 'ben.merb@gmail.com', '$2y$12$AH0w57pnJh95.OQensCn4OQQ4.xw.PND4I7MR83VEE/7XMg.Y3/EG', '2025-05-25 05:40:47', 1, NULL, 1, 'c9ad393cdc', NULL, NULL),
(28, 'Radolph', 'ralph@raumausstattung-kretz.de', '$2y$12$VahKmrDf4Sv0O7JAwo7W2.gQRSKfgv8g8nd6seT65rtuSzhGcJCni', '2025-05-26 08:21:07', 1, NULL, 1, '6a2da9613c', NULL, NULL),
(29, 'KingGC', 'mrupkalwis@gmx.de', '$2y$12$xtWKYNcALSnMhHRuCtgagufSO1rAucyIxvy.USFAfbqFxg9W6uZRa', '2025-05-26 08:31:08', 1, NULL, 1, '3ef3df8a96', NULL, NULL),
(30, 'Erfurter Feinschmecker', 'valentin.oertel@uni-erfurt.de', '$2y$12$dvID264JsEqQGT8Wzp8PLux2LFbd1NtkI.j8go93.vBSyf9mIbah.', '2025-05-26 18:19:26', 1, NULL, 7, 'f0d8f52d30', NULL, '2025-07-26 21:40:17'),
(31, 'yannickr.t', 'yannick.runst@gmx.de', '$2y$12$ieQwX3G1TuVDcLE0g7ceFulTh8gBoLRorDOC10i/vPTk5QfiyeM.m', '2025-05-26 19:53:40', 1, NULL, 21, '32b8fddb86', NULL, '2025-08-27 09:32:34'),
(32, 'Lemony', 'Sarah.Reinhold.mail@gmail.com', '$2y$12$Ocaljou1GY.DgsL0CRdLSOR9MO.fmUYcRhgjE7l8ie8J1hygVKZeO', '2025-05-27 10:57:57', 1, NULL, 1, 'a5d1edcf35', NULL, NULL),
(33, 'Mandy', 'pieschelnico@aol.com', '$2y$12$iWJWiZ4WYxoA0Xsg0Rkafe.hqKsEd9rs5Ea9dgFhBmXZWZFG8AdFK', '2025-05-27 16:32:53', 1, NULL, 1, '5341a51d0d', NULL, NULL),
(34, 'Bräuti', 'grohmii@aol.com', '$2y$12$JQymVJ3oo/L.sR.6wc2fUeA14vzlw2Tw8U2r1j1itPsEY0UTb.svG', '2025-05-27 16:36:09', 1, NULL, 1, '1605fec742', NULL, NULL),
(35, 'frank.wiesegart@hotmail.de', 'frank.wiesegart@hotmail.de', '$2y$12$ZkvKjPGZmctci0QY97Ti4eNTQ/diMNEFkpWWpXj2p09kVH8VrIGUG', '2025-05-27 16:46:03', 1, NULL, 1, 'e5cdd9e67a', NULL, NULL),
(36, 'Vanessa', 'vanessa1998@freenet.de', '$2y$12$1sVdPa1Q9nqiBFBX7wnHTeMbPnv7jLfe59.Wh08TZWR7aK39bRSYq', '2025-05-28 09:50:35', 1, NULL, 1, '99a17d13b0', NULL, NULL),
(37, 'Tobitobsen', 'tobias.markstein@gmail.com', '$2y$12$Fnmx8/B5/7p0lVe23p7sNuA.3MPQl85JgWd3ZM66T9nVzk8HSyAlm', '2025-05-30 14:51:09', 1, NULL, 1, 'd75f294bc4', NULL, NULL),
(38, 'Conmuel', 'cornelia.mueller96@web.de', '$2y$12$4jQ2LrwgtxVrAMzYoYljiONmd2wlrAtxsorCwsVn87r/V.RRkNXlS', '2025-05-30 15:17:31', 0, '31a604a916646155a8863adea3744cb4dd8c1e548206378d6e1420dea77c9a4f', 1, 'ad5d42c5ff', NULL, NULL),
(39, 'tim', 'tim.pfueller01@gmail.com', '$2y$12$AIrT64Pa1mWih5cxDkZxU.b4pDB2cHc6CxZ5MrIAxVFqly0VCHQKG', '2025-05-30 16:33:21', 1, NULL, 1, '3b01dd193c', NULL, NULL),
(40, 'Anton', 'antonschmick@gmail.com', '$2y$12$.Kh6jEsGBbfGX.L6B246qOYIjXaD5AMyde4fxgMkk71/9L49jIhEa', '2025-05-30 19:44:24', 1, NULL, 17, 'be6b0ed713', NULL, '2025-08-27 09:37:14'),
(41, 'Sanni', 'susan.belda@posteo.de', '$2y$12$jVN.ldgpYpO8qB5qIUR./uCKzJHG6aOMXMbvcfB0BLAjJkw.WZrRO', '2025-05-30 21:57:47', 1, NULL, 7, '9abe3ec4ae', NULL, '2025-07-01 17:33:52'),
(42, 'Ron', 'wallasch_ronny@web.de', '$2y$12$mi58gM5Wwgs3M9R/kzBwhOxR.73JNKmohWNMiHxORndO9GXm4Hty.', '2025-05-31 12:22:44', 1, NULL, 1, '26c02e2b9e', NULL, NULL),
(43, 'Kati', 'kadomi03@gmx.de', '$2y$12$YSNq57Tr34t9L302Gqaar.u.m1mN4KCZLTsSnQUK5S/3y4yM0hNce', '2025-06-01 16:51:26', 1, NULL, 1, '1308e9a749', NULL, '2025-08-11 12:30:11'),
(44, 'paulemaule', 'miksacompanz@outlook.com', '$2y$12$G0jFOZFBHkMNyhqWndjFKeV1GFbIQs70t80rPFYU2aUG/.jNwZRTm', '2025-06-08 12:48:03', 1, NULL, 4, 'b8a6d68259', NULL, '2025-07-27 18:35:07'),
(45, 'Anne_glace', 'annemuhhle@gmail.com', '$2y$12$loj9Z4xFZPcAJt9z71Z2RehrzTH7L1ibkMoEcr5GHcgftYI4u1U2y', '2025-06-08 12:48:47', 1, NULL, 5, '7cfedad382', NULL, '2025-07-24 08:21:55'),
(46, 'Jutta B.', 'juttamobil49@gmail.com', '$2y$12$HZdrqw5v5E/VyD1K3eLpUOQVK3CyCSU6052fyp.zOeDDHZ2NGIjwO', '2025-06-09 18:17:19', 0, '6d110e61611825576353735d8414010504011c0c126426ee5b71e4898b1b4fdd', 1, '8300fe3a93', NULL, NULL),
(47, 'Kristin', 'Kristin-79@web.de', '$2y$12$EevmPVhJ7pPcJb.TpeNRYOjrOOO8VH8sTsKF82cQgJvEwO5L1IOv.', '2025-06-11 04:44:21', 1, NULL, 1, '66cc4e1f12', NULL, NULL),
(48, 'Simon', 'simon.lang09337@gmail.com', '$2y$12$QAO3Voa5GhdPDwGl6k5K4emua8tTsNH5DcnaTp0oxC88XGpAPVwum', '2025-06-13 12:47:28', 1, NULL, 11, '8ed8ebd9f5', NULL, '2025-08-11 14:11:45'),
(49, 'Thomas', 'thomas.runst@t-online.de', '$2y$12$wDiceHHgD8NNL7NDzyd5he0r9rXADeOS9eCL7lCTQsY.IIUsiNFHq', '2025-06-16 15:21:59', 1, NULL, 1, 'd53683f9b2', NULL, NULL),
(50, 'VanessaR96', 'vanessa_uhlig@live.de', '$2y$12$HubZSEAP/7UnRpQe7dE9z.YmZQjcnixM7h1CLrEn.TPZ/hInvm35a', '2025-06-17 12:46:20', 1, NULL, 1, 'ece8afdf03', NULL, NULL),
(51, 'Selina', 'selinawill539@gmail.com', '$2y$12$lIwb/P/KEXeXaoEbOHJYhe7l6VhU3AXvBSDXRir2QTCBZoL4u/k9e', '2025-06-18 04:00:44', 1, NULL, 1, '94881c8f17', NULL, NULL),
(52, 'alinaa.wrnr', 'werneralina318@gmail.com', '$2y$12$UMr.7.5y/v48SngilRPImepVRsRcHVxSnQ7Npe3HD63gCMVte44IO', '2025-06-18 15:32:27', 1, NULL, 21, '5d91129676', NULL, '2025-08-26 18:45:39'),
(53, 'IceGoe', 'danielgoetze1982@gmail.com', '$2y$12$LxWIS/4pZYe3kiiOvCCbGe6IGLgYSUUjF5/kgvbxNO8qAxIYBrptq', '2025-06-18 19:14:12', 1, NULL, 18, '754f8689f2', NULL, '2025-08-27 19:46:21'),
(54, 'lewi', 'Winfried.Leister@gmail.com', '$2y$12$vUZhkDBRfHQmMWQb1PpN4ewEr1BLfyAjdmAOsjJ1BKsHs.s3IGN/O', '2025-06-20 21:53:11', 1, NULL, 6, '5c7c147b81', NULL, '2025-07-23 13:57:25'),
(55, 'Philipp', 'p-m-grosse@web.de', '$2y$12$mH51FEkAfsTUFz0eh6YxQOIx1t0qkEUFncDn.udc11E32eP0kBVQ.', '2025-06-25 06:39:27', 1, NULL, 6, 'e7fadec6b6', NULL, '2025-08-07 04:44:02'),
(62, 'reyckh', 'raikhelbig@gmail.com', '$2y$12$zlzPDZfxAZkoREDa/7L6CO8guHJzTgPEE6JEvAdADqTiDfi9FW28K', '2025-06-28 14:20:57', 1, NULL, 12, '327956fa2c', 1, '2025-08-27 17:54:44'),
(63, 'Schleckzilla', 'mako_acc@posteo.de', '$2y$12$qcEUxl.qkx3Ptx/wzcbD6.Sf3JQDDzqPDpptJHUDIIMMVeq1bQeiS', '2025-06-29 11:01:47', 1, NULL, 6, 'baa6a86d6d', NULL, '2025-08-01 18:46:39'),
(64, 'Melanie', 'info@ghs-glauchau.de', '$2y$12$29V46LFTb8WyBzE87RGbt.gvs1BK5wWINuVf2LSEfODSouloZ.x5S', '2025-06-30 11:48:13', 1, NULL, 3, '6da7720fed', 52, '2025-07-19 19:37:16'),
(65, 'Marissi', 'melanie-roesler@outlook.de', '$2y$12$GjJSdAeO9T3yEAu/z14G9OhJO7KjPN8fXZZLqIvL15R5EhLQq5kpK', '2025-06-30 11:55:38', 1, NULL, 1, 'd05a50fbad', 52, NULL),
(66, 'Lilli', 'lilli.poralla@icloud.com', '$2y$12$M1Xg5ighcdUMI62VceGeCeazsppaOfd4jlTQeft8SDORNmeUQKoo6', '2025-06-30 13:04:25', 1, NULL, 1, '5fb095751e', 52, NULL),
(67, 'Uschi', 'uschi.weise@gmail.com', '$2y$12$OS6AKiN8bP0cvEiwsg7dbODh9P3XzwJe0cTQ0kVEbGbnPBTVQLLg.', '2025-06-30 13:04:27', 1, NULL, 1, 'ec0262aa27', 52, NULL),
(68, 'Elia Möbius', 'eliamoebius2@web.de', '$2y$12$pEhsMgD/Kw1kCo14VB22CufSL0MqndUS8/2uPoUvEcqYK1n/NfjF6', '2025-07-01 05:22:47', 1, NULL, 4, 'c2679bccf9', NULL, '2025-07-01 11:45:00'),
(69, 'Silke', 'silke.runst75@gmx.de', '$2y$12$NcCALQltJpsuPq2rr4rKde44/jg6dK8zU524L4MLDz460vAM1qo92', '2025-07-02 14:09:50', 1, NULL, 1, '40126e4b05', 31, NULL),
(70, 'WaffelimKopf', 'tarife55.kakadu@icloud.com', '$2y$12$bJnv/7CMbGNaX1/5xD.GrOrKVgRqqJtuqPXVy.7PLm8mVXDXGTgGC', '2025-07-03 00:08:47', 0, '24422f116da4684b8f4b34ca40dfb350ff577de39c1e2d5768b996a01a0d01f6', 1, '524ba1f3be', 31, NULL),
(71, 'Maria', 'grosammaria02@gmail.com', '$2y$12$GRWQpperF392XErkZkStrePiF4KMQZmmqOBbBVyo8U.lDINglJySS', '2025-07-05 08:16:01', 1, NULL, 1, '407d989328', 52, NULL),
(72, 'Fionski', 'schwierzfiona@gmail.com', '$2y$12$VBaGb2tuIW33K8tQXrNpj.ndT9pcCO6NNfLesWJc6HF6sEKeAxAvq', '2025-07-05 09:31:42', 1, NULL, 1, '31a196f2a1', 52, NULL),
(73, 'Emmskopf', 'emily-siegel@web.de', '$2y$12$X5V/gnOk05Nw8ZPucSTVi.JQU0.zAijrWzu65ubaZnVpx/e4BT7uq', '2025-07-05 09:49:36', 1, NULL, 1, '2b1a5cdd03', 52, NULL),
(74, 'Tische', 'tim.tischendorf@gmx.de', '$2y$12$mG9MBxsnF5wnpYuf98uYpudcQ/urTCAA1eCer4eypxWcIe3/nEXSG', '2025-07-05 12:57:45', 1, NULL, 5, '8af4894370', 31, '2025-08-27 13:41:56'),
(75, 'Brommsler', 'bastel.s@gmx.de', '$2y$12$1C.TZA4GBjvVVtZU4XQ7husqPS02UZhsCoKhPR0h9jJdyn31Upk86', '2025-07-05 14:55:47', 1, NULL, 1, 'cd1174821f', 1, NULL),
(76, 'marvxn', 'mxrvin00@icloud.com', '$2y$12$UjAQm44LC3NH3FsNkNWbg.KhcK4mv0H33DIpi1.OlcFR0eqw/Pn4G', '2025-07-06 11:52:58', 1, NULL, 1, '8bb5dce6bf', 52, NULL),
(77, 'DiKuHo', 'kuhne.tina@web.de', '$2y$12$t4QI.nACe1sj7xTqCt2jVuYZpeAWIICFsmtNNAFMxTf8.sE.L2F2W', '2025-07-06 14:19:47', 1, NULL, 6, '0884e97998', NULL, '2025-07-29 16:38:38'),
(78, 'Ratatouille', 'susann.scharbrodt@web.de', '$2y$12$MIZoyXoTEQk3fPK6dlLR0.4a96Jyyhp5DwTNdWEZv2yEWNAdSNt8W', '2025-07-06 15:11:08', 1, NULL, 5, 'faea465b69', 40, '2025-07-27 17:59:34'),
(79, 'maxenderlein', 'maxenderleinracing@gmail.com', '$2y$12$hSdvY.2txc5CZOC5XP7zl.Jr1bVpPmaBroC6.GYs4R6gv5vfAxYO.', '2025-07-06 18:06:41', 1, NULL, 1, '5b6f60ac31', NULL, '2025-07-06 18:07:16'),
(80, 'Lenny', 'lennard.karl@aol.com', '$2y$12$Rq69.Stj4RdRITTEwBXGa.jOJDN./NOl/esavcfkL1vQK7K44R1Ki', '2025-07-07 13:46:24', 1, NULL, 1, '1a17358b69', 52, NULL),
(81, 'Holger', 'ht_5200@yahoo.de', '$2y$12$lMG.rUNlVmidhdLWf8QS..Widgn8ajyQVhQaYan5OC86zFCpjoyGK', '2025-07-08 13:18:02', 1, NULL, 7, '0610d57b42', NULL, '2025-08-08 13:01:08'),
(82, 'RW', 'rico-werner@gmx.net', '$2y$12$TnEj4Qnr3UXAQF5EYA6hrO9uyZKPVrYPaiWRbrFlyZH70IETblcOW', '2025-07-08 16:29:50', 1, NULL, 1, 'bb2046ac54', 52, NULL),
(83, 'Schafi', 'kerstin0103@gmail.com', '$2y$12$is3WBtilSWbOatLyebN3W.rfU6EBoy16YQQ05...EVl0msXNqPze2', '2025-07-08 17:21:36', 0, '3e4ffece28e71cfd7fbce35e5f2c1db305228434031c2f19664cd0cd9f736deb', 1, 'aa0c67d454', 52, NULL),
(84, 'Schaf', 'wernerkerstin0103@gmail.com', '$2y$12$4dvySSInh6jukab9XKALHevHbURHzNs1wkDAV./jDfri/C3B0bjzq', '2025-07-08 17:30:52', 1, NULL, 1, '313ba35118', 52, NULL),
(85, 'Rudi', 'stw0076@aol.com', '$2y$12$EFbdfLCR9KhKIX3klYeireRWR0wR5k3Wlx0hDOBT7RVtC/HbIw6ba', '2025-07-08 17:30:58', 1, NULL, 1, '8e74cbbfb8', 52, '2025-07-08 17:38:04'),
(86, 'Nathan_auf_rEISe', 'nathanael-horbank@gmx.de', '$2y$12$fe7cxOhuPCtyLb288IshIefxhbu7DJz4icC9Y6lQW9tovHbZXz.PS', '2025-07-10 07:43:47', 1, NULL, 11, 'f81988e05e', NULL, '2025-08-16 15:07:44'),
(87, 'JMarkstein', 'j.hoellering@web.de', '$2y$12$P1nDCCM7qgAjP5rTa788tuawtCsD0kUPHHaPqEmvk0QuTRSdcvzaK', '2025-07-10 14:08:11', 1, NULL, 7, '0c81054e71', NULL, '2025-08-06 14:39:21'),
(88, 'Jenja', 'jenjamytyukova@gmx.de', '$2y$12$ZC4zBFtNjzqhRRSwm3ftKuxb2FTPX0Cq/tJor9GsWL1D3yQDXaS1m', '2025-07-13 14:37:14', 1, NULL, 9, '95cf0c5aff', NULL, '2025-07-14 20:22:56'),
(89, 'Zuckerbäcker', 'marcus-braeunig@web.de', '$2y$12$eLwkjcYlQuVPS8qm21zqeeHCBOiKRClctsBPxKBFYLEaA/nIvvnai', '2025-07-13 18:18:47', 1, NULL, 1, '7cf665fe8b', NULL, '2025-07-13 20:43:59'),
(90, 'Phil', 'philipp.jendras@t-online.de', '$2y$12$A3/bUA2b/A7wAwM.73S79.qas1C8S2RKXARNIvyK.HxIyKQdnSApG', '2025-07-15 18:40:00', 1, NULL, 2, 'ea25a45948', 22, '2025-07-15 21:14:38'),
(91, 'Anni113', 'famschalla@aol.de', '$2y$12$HcLSnM8UaO2AQSrVaJerg.dtPi5ED6SRacCmYR20GmslYnCEc6LeK', '2025-07-15 18:45:14', 1, NULL, 1, 'c5bccd75d8', 22, NULL),
(92, 'Daniel', 'daniel-tuerpe@web.de', '$2y$12$cNYYIBB2UeflAZs1sWyE9ea9sE3qiag4mEG.cAjK3oZkDqQo0C5/C', '2025-07-20 18:59:47', 1, NULL, 4, '096ae6f4a9', 1, '2025-07-21 06:23:37'),
(93, 'Lexi', 'lexistar27@gmail.com', '$2y$12$xiVRYiLRVZeB6Cx5AlJdU.TEvBT5E1LITxK8HKGtQpG7YkTIyfWmW', '2025-07-21 20:04:38', 1, NULL, 6, 'add340a4c4', 8, '2025-07-25 14:18:09'),
(94, 'jhhot', 'jhhot@t-online.de', '$2y$12$WQhIIwhe0BOea4a0lt6Anu.qj7YCugpJmoX1Ynn5baxvCgHpdK90m', '2025-07-22 15:36:47', 1, NULL, 5, '37f7cc6ee4', NULL, '2025-07-22 17:37:13'),
(95, 'Romy', 'Romy.Roblick@gmx.de', '$2y$12$eTl5ekf6XJ1Ozk9QfnR2F.FGi0V48I8MQJCIG70lYdulCluWH8Cse', '2025-07-22 21:38:39', 1, NULL, 1, '1adafabeb1', 1, NULL),
(96, 'GourmetKommissar', 'felix.ist.online@gmx.net', '$2y$12$h0jHlUZW5R015piLE9N7S.NX/Q87K..t59j4z2zyYFZ2nQFa3NuDi', '2025-07-24 14:20:04', 1, NULL, 9, '87ee5f4bd1', NULL, '2025-08-24 20:13:05'),
(97, 'Markus', 'wombat_bluest.3o@icloud.com', '$2y$12$Y1mUcEXijUsA8tHwAyAUTeeipYk8q6hrGiOvgpIJ8MiLVbnej59AC', '2025-07-26 16:41:45', 1, NULL, 1, 'f2baaae7ca', 40, '2025-08-12 16:24:43'),
(98, 'SchleckLina', 'alina.neugebauer@gmx.de', '$2y$12$WavvELKWmnGCrh.Scx.3VO5pmD2UUaVRnS6uMtC9amR2XCa.C1qM.', '2025-07-27 14:10:38', 1, NULL, 4, '65508f5d45', NULL, '2025-07-27 20:10:19'),
(99, 'Eiskat', 'uhlig.katja@t-online.de', '$2y$12$e/bW2Z7TQ/kkdX/7/vcqi.tzdLkSbN6VQr97M0ibi2wkEWwoGE2kW', '2025-07-28 14:39:06', 1, NULL, 5, '2eb69a4f97', NULL, '2025-08-01 20:14:07'),
(100, 'FrankaFah', 'frankafah@icloud.com', '$2y$12$Lq3snf1EaTIt1ffKBJKmB.HRc40JzaFNIfBglZYzh4y.m7q.86aKi', '2025-07-29 16:14:27', 1, NULL, 3, '5dc158a210', NULL, '2025-07-29 17:29:36'),
(101, 'grumpelstielzchen', 'steve_grumpelt@gmx.de', '$2y$12$bIDv6L71ZhtTaeLO3239lOqfwJq2Uj.iKa9IsnHCi5X5g9kzQeKSW', '2025-08-01 14:32:00', 1, NULL, 1, '7f28c061aa', 1, '2025-08-26 11:47:51'),
(102, 'Zelt', 'z-steffi@gmx.net', '$2y$12$nulmSGggSoaLHx7YcY/TlORBCaEF3gPz8NHp9ZpcAP0cwEIhXzXr2', '2025-08-01 20:19:24', 1, NULL, 6, 'bf2ef77725', NULL, '2025-08-09 16:59:14'),
(103, 'Rooney82', 'ronald.kraatz@freenet.de', '$2y$12$/l9i5O4NAKbbiQ465uM/hOMIwdWOHOrIygYy4UKncjk8Ru2TKfiju', '2025-08-02 05:26:40', 1, NULL, 7, '6bbd83eb13', NULL, '2025-08-10 13:20:56'),
(104, 'MayA', 'andreasmay83@gmail.com', '$2y$12$GD9WezJ5/.gClGqxV4LBb.edTd5/GhK91PQUNEqWcasJR4.KQzvyq', '2025-08-02 05:40:42', 1, NULL, 1, '4e997eb104', 1, NULL),
(105, 'Maria1987', 'fichtner.maria@web.de', '$2y$12$NVFFDBWNE2CGOeNy8aFkk.hq7TBGW2S.o.W.v7OEESVBON8IKU9TC', '2025-08-02 06:19:21', 1, NULL, 1, '74b4e99996', NULL, '2025-08-02 06:36:53'),
(106, 'Iceroadtrucker', 'tommyspindler@freenet.de', '$2y$12$7NL8OE3yFJbR49ZvBtLdPuvwCKDHYa97S7K5Ex9WYiY0Ytzha20pi', '2025-08-02 15:40:21', 1, NULL, 4, 'd4e0a1ab32', 23, '2025-08-11 19:29:52'),
(107, 'Antje Unger', 'unger.antje@gmx.de', '$2y$12$sBiefRcxhOXRP0Uf5M36Zen9jqTizcdYPi5d2lBoJp3ezq.oqBa2S', '2025-08-03 16:05:35', 1, NULL, 1, 'a630fe0f1f', NULL, NULL),
(108, 'lampshade', 'obstladen@t-online.de', '$2y$12$Qn7V20JE1BhzVGbsasc0euw5P/bd4JoilTBeWUTYcHhizwLRTogiu', '2025-08-04 08:31:10', 1, NULL, 2, 'ac0c44e6dd', NULL, '2025-08-26 05:16:07'),
(109, 'Juli_He', 'Juliane.helbig@web.de', '$2y$12$QrEyGiWD/nOaXinLpwGMbeqKvUJI2vKhdlr.2KhI..860NPNK50.W', '2025-08-05 14:05:37', 1, NULL, 7, '01b5ce4eff', NULL, '2025-08-08 11:15:28'),
(110, 'Reino', 'reino.albrecht@protonmail.com', '$2y$12$8ZC/gP4BFGsPNBcww8WXw./wHJX0w4e5ThYwAIjcTix5CUbDMxsMa', '2025-08-05 14:33:20', 1, NULL, 1, '4918838ff5', NULL, '2025-08-09 13:10:57'),
(111, 'Kai', 'kaix0r@me.com', '$2y$12$uIi6F53qpWz7BMf4KxQDJ.vN5ue2rjpz2rWJQt21SFOB8V7OsZb8q', '2025-08-05 14:44:55', 1, NULL, 3, '1c1651698d', NULL, '2025-08-17 10:55:47'),
(112, 'Si.R.', 'silvio73@gmail.com', '$2y$12$kJUvDxoU6NAZIylVRGd08Osswo/nq4b1Y0ukQHv/vUK49Y7A8ke0a', '2025-08-08 11:25:41', 1, NULL, 1, 'ba88d315d5', NULL, NULL),
(115, 'Hagen', 'hagen.schanze@mail.de', '$2y$12$VwJlNwWKp6raaQAwt4vis.Mseh/ZMc89OeT70m6ENuHVLkskzY6Ri', '2025-08-09 17:14:20', 1, NULL, 1, 'a2885a6ad0', 102, NULL),
(116, 'Hoschi', 'andreposcher@t-online.de', '$2y$12$GGi0qyaAYORwqqIyXbbl3OBF.t/X3GJBQpDHE0ND2LNNLchTlmyuO', '2025-08-10 10:33:12', 0, '17102810e66f436e16904c0b75b9f5cac7198640730c828bb65f8ee7aa7fda5e', 1, '70ca71a0ae', NULL, NULL),
(117, 'Marco Peters', 'marco-peters@outlook.de', '$2y$12$shxekxfcvIPe9glXOy23aORzqwk2vi0G8exdV10O64OuQxZu8VlNO', '2025-08-12 14:35:26', 1, NULL, 2, '9a864434dd', NULL, '2025-08-13 10:01:25'),
(118, 'kleinesritzel', 'ach.hase@icloud.com', '$2y$12$O2u44DHB1Ztzol6EanCqIO8TdfbZhukyCGXAqjQRWKlTyODpRUPVG', '2025-08-15 20:30:25', 1, NULL, 2, '40b21c042b', NULL, '2025-08-17 19:05:03'),
(119, 'Gelatobert', 'weber85robert@gmail.com', '$2y$12$ShKcSMvtHk.uxGwqewZojOth.oParJGHptOCsbSdkVmBNwHiNcZWe', '2025-08-17 20:21:14', 1, NULL, 1, 'ef3383b26e', 2, '2025-08-23 10:43:16'),
(120, 'Marcello77', 'mlohmann77@gmx.de', '$2y$12$bp6MdwAiidpA3nmjW5PlbedyAEQ8B9hdW5RhlnmbrsPKiYwuBkOWO', '2025-08-21 08:09:17', 1, NULL, 1, 'b5858cb9d8', NULL, NULL),
(121, 'Gustomucho233', 'Paulschool@web.de', '$2y$12$dkHn.deJPfx3ZQcqvVttseo1yZWYe5PIZNIrdKw/qihGSHjepXpBe', '2025-08-22 17:06:02', 1, NULL, 1, '04c3416230', 96, NULL),
(122, 'Robert', 'rob12@gmx.de', '$2y$12$Y7y0OnGZyOZ9EHKwl7/ApuFaOSHLS/qxDkY/4gvMAqohzhCdzYdpy', '2025-08-24 14:07:58', 1, NULL, 1, 'acb11d56e4', NULL, '2025-08-26 14:18:28'),
(123, 'Rabnizz', 'mischa.rabe@t-online.de', '$2y$12$DEcpZYZ0mA98n7W5jwK.JeE.O6WDpF1SLt8sp6NljtDhdwwrRlgae', '2025-08-26 14:15:50', 1, NULL, 4, 'b917e85545', NULL, '2025-08-26 16:31:45'),
(124, 'Mr. Uno', 'paul.zilly@aol.com', '$2y$12$.kLwVw6uD5Pl9RBl5rGC4O3R89wa6Jj2dxtgO0KUhbHgb9Lxices.', '2025-08-27 08:08:27', 1, NULL, 1, 'b02eab482a', 8, NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

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
