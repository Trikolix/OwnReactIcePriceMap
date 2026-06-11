-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 11. Jun 2026 um 08:07
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.20

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
  `last_notification_email_at` timestamp NULL DEFAULT NULL,
  `welcome_mail_sent_at` timestamp NULL DEFAULT NULL,
  `verification_reminder_1_sent_at` timestamp NULL DEFAULT NULL,
  `verification_reminder_2_sent_at` timestamp NULL DEFAULT NULL,
  `deletion_requested_at` timestamp NULL DEFAULT NULL,
  `instagram_account` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `strava_account` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `nutzer`
--

INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `current_level`, `last_active_at`, `invite_code`, `invited_by`, `erstellt_am`, `is_verified`, `verification_token`, `last_notification_email_at`, `welcome_mail_sent_at`, `verification_reminder_1_sent_at`, `verification_reminder_2_sent_at`, `deletion_requested_at`, `instagram_account`, `strava_account`) VALUES
(1, 'TheGourmetCyclist', 'ch_helbig@mail.de', '$2y$12$O/CHPXbZV4c15.qj5IE7bu7II5NZu636n2cNc2qSKnRHpBeqA2Nni', 55, '2026-06-11 06:06:29', 'd21c6e56dc', NULL, '2025-03-14 06:11:55', 1, NULL, '2026-06-06 15:55:21', NULL, NULL, NULL, NULL, 'https://www.instagram.com/ice_app.de/', 'https://www.strava.com/athletes/4548282'),
(2, 'TheGourmetBiker', 'luca.bock.2411@web.de', '$2y$12$tzxQ4L3gRKTiZbUVA2nxpu5i4bPIpuMcTt5KsH5DCBUcofOQE8Mue', 25, '2026-05-30 11:58:09', '128906c515', NULL, '2025-03-27 20:10:27', 1, NULL, '2026-05-29 09:45:19', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Leckermäulchen95', 'simon.oertel1995@gmail.com', '$2y$10$AmnTKz9H5knO2.l9HULqYuyyCZxfXraAivdGc0PUOH/tET0JjYoia', 14, '2026-06-09 15:16:11', '0b1b662a4f', NULL, '2025-04-02 19:28:56', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Tom', 'tom-heilmann@live.de', '$2y$10$d2y8ktSLxyYbEfK1XftTcOJgKdvr9V9lv/y.tUYO4TRREe5iwzaby', 22, '2026-06-10 13:25:59', '1c6e4d07db', NULL, '2025-04-05 12:41:30', 1, NULL, '2026-05-30 09:12:31', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Erik', 'erik.loeschner@web.de', '$2y$10$Gtb7FMoek5h1mrypChCMp.5znsANd34Fc5UpuCNXLkhDHa.2QWet6', 9, '2025-10-04 08:34:52', '31145ca634', NULL, '2025-04-08 18:20:29', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Agon', 'agon-muli@hotmail.de', '$2y$10$ULhCRGTYoScnJvPs3GfUyuK4H7PATTLrsPcdUjNY6MeViXUN.m4Je', 1, NULL, '2af144b83f', NULL, '2025-04-15 18:56:58', 1, NULL, NULL, '2026-06-10 09:57:36', NULL, NULL, NULL, NULL, NULL),
(7, 'Luise', 'lilori@gmx.de', '$2y$10$O3pjh/Ly81ENzpiihb8MYurFtzH6ZFj.fF63nXQpSLmFwte19LzCu', 1, NULL, 'b26f690e28', NULL, '2025-04-16 06:43:01', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Enkiboy', 'enke.sebastian.91@gmail.com', '$2y$12$c0Y872JEWOfGRlTrdRjY1ey.u8V1ETZyxY3aJ2d7KrWeki9uUCUkK', 28, '2026-06-10 15:26:44', '8d4a14bc01', NULL, '2025-04-26 18:34:34', 1, NULL, '2026-05-24 18:50:09', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Carola-Eis', 'carola@dummymail.de', '$2y$10$91uWQyVuYLqaO71OCaWxC.Jfud15N.o0esDW.OEOwvYOeMhBXRGSy', 1, NULL, '75e6275092', NULL, '2025-04-27 19:01:59', 1, NULL, NULL, '2026-06-10 09:57:36', NULL, NULL, NULL, NULL, NULL),
(10, 'Pitiwowo', 'joel.machado@freenet.de', '$2y$10$eoosY8ZARZ5CvsbWt1KA6eQ6gWqQlxoZDyrjJUKyX..Rjq1Qufa1y', 6, '2026-03-10 13:01:26', 'caea6bee5f', NULL, '2025-05-01 07:29:02', 1, NULL, '2026-03-10 19:50:18', NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'CaptManu', 'cptnmanu@web.de', '$2y$12$9gJBrhhLlyti46LmOhAco.BFc5dpzHjB0uaJYMIwjZvbY1Cj4/jVe', 12, '2026-05-16 08:27:36', '15c2a2c0c8', NULL, '2025-05-02 17:37:31', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'Matze T', 'matthias.trebeck@gmx.de', '$2y$10$fuCFkI8bAP8zxeXzrVcOiu3p3.ik1s1Y4pCJsTcChYhp6TONiIUBW', 1, NULL, 'a71597d7f7', NULL, '2025-05-04 18:04:06', 1, NULL, NULL, '2026-06-10 09:57:36', NULL, NULL, NULL, NULL, NULL),
(13, 'Admin', 'admin@ice-app.de', '$2y$12$pjFKBd97VTV1NFf1CU7HVu6Q/x31qTfkX.RNW9HGmDnBTlDFUVEfK', 5, '2026-06-10 07:23:23', 'c98f1d4636', NULL, '2025-05-06 05:10:51', 1, NULL, '2026-05-07 09:02:21', '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(19, 'Maerc96', 'maerc96@gmail.com', '$2y$12$VsOFRx9XLXA1J2NmKmkbfuqwTDYMsGkZSTq0nEjqIzgOMHuVTlWti', 17, '2026-06-01 19:06:04', '0354f20c07', NULL, '2025-05-06 16:25:27', 1, NULL, '2026-03-17 14:32:00', NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'Beatrice', 'beatrice.schubert29@icloud.com', '$2y$12$LSgIRunbW2b3GagzwxYY8uwqvOeWGaL.tNYWIRRkTCk2.Zsn2K6QS', 1, NULL, 'faa4a6dca6', NULL, '2025-05-06 17:36:20', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(21, 'emmi', 'schreiter.emmely@gmail.com', '$2y$12$aebCt7siPEdLonjfP4nHXeln1OED033MPcqJv7t4zK5vvjYHErdGe', 1, NULL, '82d283392c', NULL, '2025-05-06 18:36:53', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(22, 'Eispfote', 'franziska.scharbrodt@gmail.com', '$2y$12$pZFM9rkGwuL2k4yhT5xy5.vtewpdUXr1SXrP2pIjiAyYgCaB6Fjfe', 28, '2026-06-08 19:09:38', '973c05c5f4', NULL, '2025-05-06 19:38:09', 1, NULL, '2026-06-07 09:30:45', NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'Holzmichl', 'michael.knoof@web.de', '$2y$12$W00hzmTBdIS2Yq3f9mDupODHtH/FJfr0RmldhSKxR6XLqNKZzua7u', 25, '2026-06-06 17:58:49', 'd2434287c2', NULL, '2025-05-12 14:51:32', 1, NULL, '2026-05-16 16:41:37', NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'alvaperez12', 'theresa.anna.perez@googlemail.com', '$2y$12$52IxywCiQd0kR8O2wGc9zeCOst2r8Fyj0dKVX8jiqkbXBPWtJpl3e', 6, '2025-09-22 17:49:34', 'a8af7f342a', NULL, '2025-05-19 17:09:16', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'moritz', 'moritzlistner1@gmail.com', '$2y$12$fByEoYTP8KAUwoXCgko/6Oxm34xb/3HzYqEv2PX7e65aOy86T9e5a', 11, '2026-06-06 18:41:49', 'e9efa25ecd', NULL, '2025-05-22 04:56:36', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'Ben', 'ben.merb@gmail.com', '$2y$12$AH0w57pnJh95.OQensCn4OQQ4.xw.PND4I7MR83VEE/7XMg.Y3/EG', 3, '2026-03-08 14:01:43', 'c9ad393cdc', NULL, '2025-05-25 05:40:47', 1, NULL, '2026-03-07 13:37:42', '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(28, 'Radolph', 'ralph@raumausstattung-kretz.de', '$2y$12$VahKmrDf4Sv0O7JAwo7W2.gQRSKfgv8g8nd6seT65rtuSzhGcJCni', 1, NULL, '6a2da9613c', NULL, '2025-05-26 08:21:07', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(29, 'KingGC', 'mrupkalwis@gmx.de', '$2y$12$xtWKYNcALSnMhHRuCtgagufSO1rAucyIxvy.USFAfbqFxg9W6uZRa', 1, NULL, '3ef3df8a96', NULL, '2025-05-26 08:31:08', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(30, 'Erfurter Feinschmecker', 'valentin.oertel@uni-erfurt.de', '$2y$12$5ja9eCAIzB41g3rIcaFfHeRvXGEQMNUfCgGuTWgg9iVrBrQf7R8yS', 8, '2026-06-06 16:13:44', 'f0d8f52d30', NULL, '2025-05-26 18:19:26', 1, NULL, '2026-06-06 14:14:10', NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'yannickr.t', 'yannick.runst@gmx.de', '$2y$12$ieQwX3G1TuVDcLE0g7ceFulTh8gBoLRorDOC10i/vPTk5QfiyeM.m', 25, '2026-04-25 20:27:18', '32b8fddb86', NULL, '2025-05-26 19:53:40', 1, NULL, '2026-03-11 20:49:28', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'Lemony', 'Sarah.Reinhold.mail@gmail.com', '$2y$12$Ocaljou1GY.DgsL0CRdLSOR9MO.fmUYcRhgjE7l8ie8J1hygVKZeO', 1, NULL, 'a5d1edcf35', NULL, '2025-05-27 10:57:57', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'Mandy', 'pieschelnico@aol.com', '$2y$12$iWJWiZ4WYxoA0Xsg0Rkafe.hqKsEd9rs5Ea9dgFhBmXZWZFG8AdFK', 1, NULL, '5341a51d0d', NULL, '2025-05-27 16:32:53', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(34, 'Bräuti', 'grohmii@aol.com', '$2y$12$JQymVJ3oo/L.sR.6wc2fUeA14vzlw2Tw8U2r1j1itPsEY0UTb.svG', 4, '2025-09-21 09:30:50', '1605fec742', NULL, '2025-05-27 16:36:09', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(35, 'frank.wiesegart@hotmail.de', 'frank.wiesegart@hotmail.de', '$2y$12$ZkvKjPGZmctci0QY97Ti4eNTQ/diMNEFkpWWpXj2p09kVH8VrIGUG', 1, NULL, 'e5cdd9e67a', NULL, '2025-05-27 16:46:03', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(36, 'Vanessa', 'vanessa1998@freenet.de', '$2y$12$1sVdPa1Q9nqiBFBX7wnHTeMbPnv7jLfe59.Wh08TZWR7aK39bRSYq', 1, NULL, '99a17d13b0', NULL, '2025-05-28 09:50:35', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(37, 'Tobitobsen', 'tobias.markstein@gmail.com', '$2y$12$Fnmx8/B5/7p0lVe23p7sNuA.3MPQl85JgWd3ZM66T9nVzk8HSyAlm', 1, NULL, 'd75f294bc4', NULL, '2025-05-30 14:51:09', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(38, 'Conmuel', 'cornelia.mueller96@web.de', '$2y$12$4jQ2LrwgtxVrAMzYoYljiONmd2wlrAtxsorCwsVn87r/V.RRkNXlS', 1, NULL, 'ad5d42c5ff', NULL, '2025-05-30 15:17:31', 0, '31a604a916646155a8863adea3744cb4dd8c1e548206378d6e1420dea77c9a4f', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(39, 'tim', 'tim.pfueller01@gmail.com', '$2y$12$AIrT64Pa1mWih5cxDkZxU.b4pDB2cHc6CxZ5MrIAxVFqly0VCHQKG', 1, NULL, '3b01dd193c', NULL, '2025-05-30 16:33:21', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 'Anton', 'antonschmick@gmail.com', '$2y$12$.Kh6jEsGBbfGX.L6B246qOYIjXaD5AMyde4fxgMkk71/9L49jIhEa', 22, '2026-03-08 10:59:01', 'be6b0ed713', NULL, '2025-05-30 19:44:24', 1, NULL, '2026-03-08 04:50:49', NULL, NULL, NULL, NULL, NULL, NULL),
(41, 'Sanni', 'susan.belda@posteo.de', '$2y$12$jVN.ldgpYpO8qB5qIUR./uCKzJHG6aOMXMbvcfB0BLAjJkw.WZrRO', 7, '2025-07-01 17:33:52', '9abe3ec4ae', NULL, '2025-05-30 21:57:47', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 'Ron', 'wallasch_ronny@web.de', '$2y$12$mi58gM5Wwgs3M9R/kzBwhOxR.73JNKmohWNMiHxORndO9GXm4Hty.', 1, NULL, '26c02e2b9e', NULL, '2025-05-31 12:22:44', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(43, 'Kati', 'kadomi03@gmx.de', '$2y$12$YSNq57Tr34t9L302Gqaar.u.m1mN4KCZLTsSnQUK5S/3y4yM0hNce', 4, '2026-05-11 14:32:27', '1308e9a749', NULL, '2025-06-01 16:51:26', 1, NULL, '2026-05-07 09:04:52', '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(44, 'paulemaule', 'miksacompanz@outlook.com', '$2y$12$G0jFOZFBHkMNyhqWndjFKeV1GFbIQs70t80rPFYU2aUG/.jNwZRTm', 4, '2025-07-27 18:35:07', 'b8a6d68259', NULL, '2025-06-08 12:48:03', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(45, 'Anne_glace', 'annemuhhle@gmail.com', '$2y$12$loj9Z4xFZPcAJt9z71Z2RehrzTH7L1ibkMoEcr5GHcgftYI4u1U2y', 5, '2025-07-24 08:21:55', '7cfedad382', NULL, '2025-06-08 12:48:47', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(46, 'Jutta B.', 'juttamobil49@gmail.com', '$2y$12$HZdrqw5v5E/VyD1K3eLpUOQVK3CyCSU6052fyp.zOeDDHZ2NGIjwO', 1, NULL, '8300fe3a93', NULL, '2025-06-09 18:17:19', 0, '6d110e61611825576353735d8414010504011c0c126426ee5b71e4898b1b4fdd', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(47, 'Kristin', 'Kristin-79@web.de', '$2y$12$XwZqPrMMAXeGtQcf/peOm.MW60nGYa.xzCQjyLIoOpQkwH5ngXoS6', 4, '2026-03-25 11:30:20', '66cc4e1f12', NULL, '2025-06-11 04:44:21', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 'Simon', 'simon.lang09337@gmail.com', '$2y$12$QAO3Voa5GhdPDwGl6k5K4emua8tTsNH5DcnaTp0oxC88XGpAPVwum', 25, '2026-06-10 12:35:12', '8ed8ebd9f5', NULL, '2025-06-13 12:47:28', 1, NULL, '2026-05-18 14:03:43', NULL, NULL, NULL, NULL, NULL, NULL),
(49, 'Thomas', 'thomas.runst@t-online.de', '$2y$12$wDiceHHgD8NNL7NDzyd5he0r9rXADeOS9eCL7lCTQsY.IIUsiNFHq', 16, '2026-04-25 20:54:40', 'd53683f9b2', NULL, '2025-06-16 15:21:59', 1, NULL, '2026-04-21 09:19:13', NULL, NULL, NULL, NULL, NULL, NULL),
(50, 'VanessaR96', 'vanessa_uhlig@live.de', '$2y$12$HubZSEAP/7UnRpQe7dE9z.YmZQjcnixM7h1CLrEn.TPZ/hInvm35a', 1, NULL, 'ece8afdf03', NULL, '2025-06-17 12:46:20', 1, NULL, NULL, '2026-06-10 09:57:37', NULL, NULL, NULL, NULL, NULL),
(51, 'Selina', 'selinawill539@gmail.com', '$2y$12$lIwb/P/KEXeXaoEbOHJYhe7l6VhU3AXvBSDXRir2QTCBZoL4u/k9e', 8, '2026-05-18 17:55:13', '94881c8f17', NULL, '2025-06-18 04:00:44', 1, NULL, '2026-05-18 12:37:04', '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(52, 'alinaa.wrnr', 'werneralina318@gmail.com', '$2y$12$LGIprNo3nW0jkVH5V0ysSeGGKmxnLBXNFclj0V/WlOsvt1jb4aMyO', 24, '2026-04-05 08:29:58', '5d91129676', NULL, '2025-06-18 15:32:27', 1, NULL, '2026-04-05 13:31:15', NULL, NULL, NULL, NULL, NULL, NULL),
(53, 'IceGoe', 'danielgoetze1982@gmail.com', '$2y$12$LxWIS/4pZYe3kiiOvCCbGe6IGLgYSUUjF5/kgvbxNO8qAxIYBrptq', 44, '2026-06-10 16:31:36', '754f8689f2', NULL, '2025-06-18 19:14:12', 1, NULL, '2026-04-01 17:40:03', NULL, NULL, NULL, NULL, NULL, NULL),
(54, 'lewi', 'Winfried.Leister@gmail.com', '$2y$12$vUZhkDBRfHQmMWQb1PpN4ewEr1BLfyAjdmAOsjJ1BKsHs.s3IGN/O', 7, '2025-10-05 14:45:21', '5c7c147b81', NULL, '2025-06-20 21:53:11', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 'Philipp', 'p-m-grosse@web.de', '$2y$12$mH51FEkAfsTUFz0eh6YxQOIx1t0qkEUFncDn.udc11E32eP0kBVQ.', 6, '2025-12-24 09:40:29', 'e7fadec6b6', NULL, '2025-06-25 06:39:27', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 'reyckh', 'raikhelbig@gmail.com', '$2y$12$zlzPDZfxAZkoREDa/7L6CO8guHJzTgPEE6JEvAdADqTiDfi9FW28K', 18, '2026-06-09 09:32:55', '327956fa2c', 1, '2025-06-28 14:20:57', 1, NULL, '2026-05-16 14:44:02', NULL, NULL, NULL, NULL, NULL, NULL),
(63, 'Schleckzilla', 'mako_acc@posteo.de', '$2y$12$qcEUxl.qkx3Ptx/wzcbD6.Sf3JQDDzqPDpptJHUDIIMMVeq1bQeiS', 13, '2026-06-08 10:28:25', 'baa6a86d6d', NULL, '2025-06-29 11:01:47', 1, NULL, '2026-05-30 14:56:40', NULL, NULL, NULL, NULL, NULL, NULL),
(64, 'Melanie', 'info@ghs-glauchau.de', '$2y$12$29V46LFTb8WyBzE87RGbt.gvs1BK5wWINuVf2LSEfODSouloZ.x5S', 3, '2025-07-19 19:37:16', '6da7720fed', 52, '2025-06-30 11:48:13', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(65, 'Marissi', 'melanie-roesler@outlook.de', '$2y$12$GjJSdAeO9T3yEAu/z14G9OhJO7KjPN8fXZZLqIvL15R5EhLQq5kpK', 1, NULL, 'd05a50fbad', 52, '2025-06-30 11:55:38', 1, NULL, '2026-04-05 13:31:15', '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(66, 'Lilli', 'lilli.poralla@icloud.com', '$2y$12$M1Xg5ighcdUMI62VceGeCeazsppaOfd4jlTQeft8SDORNmeUQKoo6', 1, NULL, '5fb095751e', 52, '2025-06-30 13:04:25', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(67, 'Uschi', 'uschi.weise@gmail.com', '$2y$12$OS6AKiN8bP0cvEiwsg7dbODh9P3XzwJe0cTQ0kVEbGbnPBTVQLLg.', 1, NULL, 'ec0262aa27', 52, '2025-06-30 13:04:27', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(68, 'Elia Möbius', 'eliamoebius2@web.de', '$2y$12$pEhsMgD/Kw1kCo14VB22CufSL0MqndUS8/2uPoUvEcqYK1n/NfjF6', 14, '2026-05-21 07:44:52', 'c2679bccf9', NULL, '2025-07-01 05:22:47', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 'Silke', 'silke.runst75@gmx.de', '$2y$12$NcCALQltJpsuPq2rr4rKde44/jg6dK8zU524L4MLDz460vAM1qo92', 1, NULL, '40126e4b05', 31, '2025-07-02 14:09:50', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(70, 'WaffelimKopf', 'tarife55.kakadu@icloud.com', '$2y$12$bJnv/7CMbGNaX1/5xD.GrOrKVgRqqJtuqPXVy.7PLm8mVXDXGTgGC', 1, NULL, '524ba1f3be', 31, '2025-07-03 00:08:47', 0, '24422f116da4684b8f4b34ca40dfb350ff577de39c1e2d5768b996a01a0d01f6', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(71, 'Maria', 'grosammaria02@gmail.com', '$2y$12$GRWQpperF392XErkZkStrePiF4KMQZmmqOBbBVyo8U.lDINglJySS', 1, NULL, '407d989328', 52, '2025-07-05 08:16:01', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(72, 'Fionski', 'schwierzfiona@gmail.com', '$2y$12$VBaGb2tuIW33K8tQXrNpj.ndT9pcCO6NNfLesWJc6HF6sEKeAxAvq', 1, NULL, '31a196f2a1', 52, '2025-07-05 09:31:42', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(73, 'Emmskopf', 'emily-siegel@web.de', '$2y$12$X5V/gnOk05Nw8ZPucSTVi.JQU0.zAijrWzu65ubaZnVpx/e4BT7uq', 1, NULL, '2b1a5cdd03', 52, '2025-07-05 09:49:36', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(74, 'Tische', 'tim.tischendorf@gmx.de', '$2y$12$mG9MBxsnF5wnpYuf98uYpudcQ/urTCAA1eCer4eypxWcIe3/nEXSG', 9, '2026-05-16 10:04:23', '8af4894370', 31, '2025-07-05 12:57:45', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 'Brommsler', 'bastel.s@gmx.de', '$2y$12$yM/jt/CYL9OLsGrrRVObUuI/XMiMADlskWSAuR7I7yZxv7e7TIKqC', 2, '2025-10-27 18:53:05', 'cd1174821f', 1, '2025-07-05 14:55:47', 1, NULL, '2025-10-28 05:51:38', '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(76, 'marvxn', 'mxrvin00@icloud.com', '$2y$12$UjAQm44LC3NH3FsNkNWbg.KhcK4mv0H33DIpi1.OlcFR0eqw/Pn4G', 1, NULL, '8bb5dce6bf', 52, '2025-07-06 11:52:58', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(77, 'DiKuHo', 'kuhne.tina@web.de', '$2y$12$t4QI.nACe1sj7xTqCt2jVuYZpeAWIICFsmtNNAFMxTf8.sE.L2F2W', 12, '2026-05-17 21:37:22', '0884e97998', NULL, '2025-07-06 14:19:47', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 'Ratatouille', 'susann.scharbrodt@web.de', '$2y$12$MIZoyXoTEQk3fPK6dlLR0.4a96Jyyhp5DwTNdWEZv2yEWNAdSNt8W', 5, '2025-07-27 17:59:34', 'faea465b69', 40, '2025-07-06 15:11:08', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(79, 'maxenderlein', 'maxenderleinracing@gmail.com', '$2y$12$hSdvY.2txc5CZOC5XP7zl.Jr1bVpPmaBroC6.GYs4R6gv5vfAxYO.', 5, '2026-05-25 10:19:52', '5b6f60ac31', NULL, '2025-07-06 18:06:41', 1, NULL, '2026-05-25 07:04:42', '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(80, 'Lenny', 'lennard.karl@aol.com', '$2y$12$Rq69.Stj4RdRITTEwBXGa.jOJDN./NOl/esavcfkL1vQK7K44R1Ki', 1, NULL, '1a17358b69', 52, '2025-07-07 13:46:24', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(81, 'Holger', 'ht_5200@yahoo.de', '$2y$12$lMG.rUNlVmidhdLWf8QS..Widgn8ajyQVhQaYan5OC86zFCpjoyGK', 7, '2025-08-08 13:01:08', '0610d57b42', NULL, '2025-07-08 13:18:02', 1, NULL, '2026-06-07 11:57:29', NULL, NULL, NULL, NULL, NULL, NULL),
(82, 'RW', 'rico-werner@gmx.net', '$2y$12$TnEj4Qnr3UXAQF5EYA6hrO9uyZKPVrYPaiWRbrFlyZH70IETblcOW', 1, NULL, 'bb2046ac54', 52, '2025-07-08 16:29:50', 1, NULL, NULL, '2026-06-10 09:57:38', NULL, NULL, NULL, NULL, NULL),
(83, 'Schafi', 'kerstin0103@gmail.com', '$2y$12$is3WBtilSWbOatLyebN3W.rfU6EBoy16YQQ05...EVl0msXNqPze2', 1, NULL, 'aa0c67d454', 52, '2025-07-08 17:21:36', 0, '3e4ffece28e71cfd7fbce35e5f2c1db305228434031c2f19664cd0cd9f736deb', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(84, 'Schaf', 'wernerkerstin0103@gmail.com', '$2y$12$4dvySSInh6jukab9XKALHevHbURHzNs1wkDAV./jDfri/C3B0bjzq', 1, NULL, '313ba35118', 52, '2025-07-08 17:30:52', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(85, 'Rudi', 'stw0076@aol.com', '$2y$12$EFbdfLCR9KhKIX3klYeireRWR0wR5k3Wlx0hDOBT7RVtC/HbIw6ba', 1, '2025-07-08 17:38:04', '8e74cbbfb8', 52, '2025-07-08 17:30:58', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(86, 'Nathan_auf_rEISe', 'nathanael-horbank@gmx.de', '$2y$12$fe7cxOhuPCtyLb288IshIefxhbu7DJz4icC9Y6lQW9tovHbZXz.PS', 12, '2026-03-10 12:53:07', 'f81988e05e', NULL, '2025-07-10 07:43:47', 1, NULL, '2026-03-10 19:48:57', NULL, NULL, NULL, NULL, NULL, NULL),
(87, 'JMarkstein', 'j.hoellering@web.de', '$2y$12$P1nDCCM7qgAjP5rTa788tuawtCsD0kUPHHaPqEmvk0QuTRSdcvzaK', 9, '2025-09-19 18:49:27', '0c81054e71', NULL, '2025-07-10 14:08:11', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 'Jenja', 'jenjamytyukova@gmx.de', '$2y$12$ZC4zBFtNjzqhRRSwm3ftKuxb2FTPX0Cq/tJor9GsWL1D3yQDXaS1m', 9, '2025-07-14 20:22:56', '95cf0c5aff', NULL, '2025-07-13 14:37:14', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 'Zuckerbäcker', 'marcus-braeunig@web.de', '$2y$12$eLwkjcYlQuVPS8qm21zqeeHCBOiKRClctsBPxKBFYLEaA/nIvvnai', 1, '2025-07-13 20:43:59', '7cf665fe8b', NULL, '2025-07-13 18:18:47', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(90, 'Phil', 'philipp.jendras@t-online.de', '$2y$12$A3/bUA2b/A7wAwM.73S79.qas1C8S2RKXARNIvyK.HxIyKQdnSApG', 2, '2025-07-15 21:14:38', 'ea25a45948', 22, '2025-07-15 18:40:00', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(91, 'Anni113', 'famschalla@aol.de', '$2y$12$HcLSnM8UaO2AQSrVaJerg.dtPi5ED6SRacCmYR20GmslYnCEc6LeK', 1, NULL, 'c5bccd75d8', 22, '2025-07-15 18:45:14', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(92, 'Daniel', 'daniel-tuerpe@web.de', '$2y$12$cNYYIBB2UeflAZs1sWyE9ea9sE3qiag4mEG.cAjK3oZkDqQo0C5/C', 4, '2026-05-15 14:37:54', '096ae6f4a9', 1, '2025-07-20 18:59:47', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(93, 'Lexi', 'lexistar27@gmail.com', '$2y$12$xiVRYiLRVZeB6Cx5AlJdU.TEvBT5E1LITxK8HKGtQpG7YkTIyfWmW', 6, '2025-07-25 14:18:09', 'add340a4c4', 8, '2025-07-21 20:04:38', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 'jhhot', 'jhhot@t-online.de', '$2y$12$WQhIIwhe0BOea4a0lt6Anu.qj7YCugpJmoX1Ynn5baxvCgHpdK90m', 15, '2026-06-04 07:53:58', '37f7cc6ee4', NULL, '2025-07-22 15:36:47', 1, NULL, '2026-05-01 17:48:41', NULL, NULL, NULL, NULL, NULL, NULL),
(95, 'Romy', 'Romy.Roblick@gmx.de', '$2y$12$eTl5ekf6XJ1Ozk9QfnR2F.FGi0V48I8MQJCIG70lYdulCluWH8Cse', 1, NULL, '1adafabeb1', 1, '2025-07-22 21:38:39', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(96, 'GourmetKommissar', 'felix.ist.online@gmx.net', '$2y$12$h0jHlUZW5R015piLE9N7S.NX/Q87K..t59j4z2zyYFZ2nQFa3NuDi', 15, '2026-04-21 08:46:42', '87ee5f4bd1', NULL, '2025-07-24 14:20:04', 1, NULL, '2026-03-08 04:52:06', NULL, NULL, NULL, NULL, NULL, NULL),
(97, 'Markus', 'wombat_bluest.3o@icloud.com', '$2y$12$Y1mUcEXijUsA8tHwAyAUTeeipYk8q6hrGiOvgpIJ8MiLVbnej59AC', 1, '2025-08-12 16:24:43', 'f2baaae7ca', 40, '2025-07-26 16:41:45', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(98, 'SchleckLina', 'alina.neugebauer@gmx.de', '$2y$12$WavvELKWmnGCrh.Scx.3VO5pmD2UUaVRnS6uMtC9amR2XCa.C1qM.', 10, '2026-03-18 13:46:17', '65508f5d45', NULL, '2025-07-27 14:10:38', 1, NULL, '2026-02-27 15:48:34', NULL, NULL, NULL, NULL, NULL, NULL),
(99, 'Eiskat', 'uhlig.katja@t-online.de', '$2y$12$e/bW2Z7TQ/kkdX/7/vcqi.tzdLkSbN6VQr97M0ibi2wkEWwoGE2kW', 17, '2026-06-10 12:12:41', '2eb69a4f97', NULL, '2025-07-28 14:39:06', 1, NULL, '2026-05-30 09:12:31', NULL, NULL, NULL, NULL, NULL, NULL),
(100, 'FrankaFah', 'frankafah@icloud.com', '$2y$12$Lq3snf1EaTIt1ffKBJKmB.HRc40JzaFNIfBglZYzh4y.m7q.86aKi', 3, '2026-05-16 18:15:33', '5dc158a210', NULL, '2025-07-29 16:14:27', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(101, 'grumpelstielzchen', 'steve_grumpelt@gmx.de', '$2y$12$bIDv6L71ZhtTaeLO3239lOqfwJq2Uj.iKa9IsnHCi5X5g9kzQeKSW', 1, '2026-03-22 15:11:11', '7f28c061aa', 1, '2025-08-01 14:32:00', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(102, 'Zelt', 'z-steffi@gmx.net', '$2y$12$nulmSGggSoaLHx7YcY/TlORBCaEF3gPz8NHp9ZpcAP0cwEIhXzXr2', 8, '2025-09-07 07:00:03', 'bf2ef77725', NULL, '2025-08-01 20:19:24', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 'Rooney82', 'ronald.kraatz@freenet.de', '$2y$12$/l9i5O4NAKbbiQ465uM/hOMIwdWOHOrIygYy4UKncjk8Ru2TKfiju', 7, '2025-08-10 13:20:56', '6bbd83eb13', NULL, '2025-08-02 05:26:40', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(104, 'MayA', 'andreasmay83@gmail.com', '$2y$12$GD9WezJ5/.gClGqxV4LBb.edTd5/GhK91PQUNEqWcasJR4.KQzvyq', 1, NULL, '4e997eb104', 1, '2025-08-02 05:40:42', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(105, 'Maria1987', 'fichtner.maria@web.de', '$2y$12$NVFFDBWNE2CGOeNy8aFkk.hq7TBGW2S.o.W.v7OEESVBON8IKU9TC', 1, '2025-08-02 06:36:53', '74b4e99996', NULL, '2025-08-02 06:19:21', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(106, 'Iceroadtrucker', 'tommyspindler@freenet.de', '$2y$12$7NL8OE3yFJbR49ZvBtLdPuvwCKDHYa97S7K5Ex9WYiY0Ytzha20pi', 4, '2026-02-07 11:30:17', 'd4e0a1ab32', 23, '2025-08-02 15:40:21', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(107, 'Antje Unger', 'unger.antje@gmx.de', '$2y$12$sBiefRcxhOXRP0Uf5M36Zen9jqTizcdYPi5d2lBoJp3ezq.oqBa2S', 1, NULL, 'a630fe0f1f', NULL, '2025-08-03 16:05:35', 1, NULL, NULL, '2026-06-10 09:57:39', NULL, NULL, NULL, NULL, NULL),
(108, 'lampshade', 'obstladen@t-online.de', '$2y$12$Qn7V20JE1BhzVGbsasc0euw5P/bd4JoilTBeWUTYcHhizwLRTogiu', 4, '2026-05-07 16:28:17', 'ac0c44e6dd', NULL, '2025-08-04 08:31:10', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 'Juli_He', 'Juliane.helbig@web.de', '$2y$12$QrEyGiWD/nOaXinLpwGMbeqKvUJI2vKhdlr.2KhI..860NPNK50.W', 8, '2026-04-26 11:06:51', '01b5ce4eff', NULL, '2025-08-05 14:05:37', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 'Reino', 'reino.albrecht@protonmail.com', '$2y$12$8ZC/gP4BFGsPNBcww8WXw./wHJX0w4e5ThYwAIjcTix5CUbDMxsMa', 1, '2025-08-09 13:10:57', '4918838ff5', NULL, '2025-08-05 14:33:20', 1, NULL, NULL, '2026-06-10 09:57:40', NULL, NULL, NULL, NULL, NULL),
(111, 'Kai', 'kaix0r@me.com', '$2y$12$uIi6F53qpWz7BMf4KxQDJ.vN5ue2rjpz2rWJQt21SFOB8V7OsZb8q', 4, '2026-05-10 17:22:40', '1c1651698d', NULL, '2025-08-05 14:44:55', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(112, 'Si.R.', 'silvio73@gmail.com', '$2y$12$b7ku1ZZRf8ngwaQwOc8fH.WLT55zBX2z3AKLIUUvCty7SrxAlqyDC', 11, '2026-05-16 17:08:01', 'ba88d315d5', NULL, '2025-08-08 11:25:41', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 'Hagen', 'hagen.schanze@mail.de', '$2y$12$VwJlNwWKp6raaQAwt4vis.Mseh/ZMc89OeT70m6ENuHVLkskzY6Ri', 1, '2026-05-31 13:17:48', 'a2885a6ad0', 102, '2025-08-09 17:14:20', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(116, 'Hoschi', 'andreposcher@t-online.de', '$2y$12$GGi0qyaAYORwqqIyXbbl3OBF.t/X3GJBQpDHE0ND2LNNLchTlmyuO', 1, NULL, '70ca71a0ae', NULL, '2025-08-10 10:33:12', 0, '17102810e66f436e16904c0b75b9f5cac7198640730c828bb65f8ee7aa7fda5e', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(117, 'Marco Peters', 'marco-peters@outlook.de', '$2y$12$shxekxfcvIPe9glXOy23aORzqwk2vi0G8exdV10O64OuQxZu8VlNO', 2, '2025-08-13 10:01:25', '9a864434dd', NULL, '2025-08-12 14:35:26', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(118, 'kleinesritzel', 'ach.hase@icloud.com', '$2y$12$O2u44DHB1Ztzol6EanCqIO8TdfbZhukyCGXAqjQRWKlTyODpRUPVG', 22, '2026-05-27 16:09:23', '40b21c042b', NULL, '2025-08-15 20:30:25', 1, NULL, '2026-03-04 18:03:11', NULL, NULL, NULL, NULL, NULL, NULL),
(119, 'Gelatobert', 'weber85robert@gmail.com', '$2y$12$ShKcSMvtHk.uxGwqewZojOth.oParJGHptOCsbSdkVmBNwHiNcZWe', 15, '2026-06-09 05:57:41', 'ef3383b26e', 2, '2025-08-17 20:21:14', 1, NULL, '2026-05-01 08:27:32', NULL, NULL, NULL, NULL, NULL, NULL),
(120, 'Marcello77', 'mlohmann77@gmx.de', '$2y$12$bp6MdwAiidpA3nmjW5PlbedyAEQ8B9hdW5RhlnmbrsPKiYwuBkOWO', 1, NULL, 'b5858cb9d8', NULL, '2025-08-21 08:09:17', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(121, 'Gustomucho233', 'Paulschool@web.de', '$2y$12$dkHn.deJPfx3ZQcqvVttseo1yZWYe5PIZNIrdKw/qihGSHjepXpBe', 1, NULL, '04c3416230', 96, '2025-08-22 17:06:02', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(122, 'Robert', 'rob12@gmx.de', '$2y$12$Y7y0OnGZyOZ9EHKwl7/ApuFaOSHLS/qxDkY/4gvMAqohzhCdzYdpy', 1, '2025-08-26 14:18:28', 'acb11d56e4', NULL, '2025-08-24 14:07:58', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(123, 'Rabnizz', 'mischa.rabe@t-online.de', '$2y$12$DEcpZYZ0mA98n7W5jwK.JeE.O6WDpF1SLt8sp6NljtDhdwwrRlgae', 4, '2025-09-22 21:26:33', 'b917e85545', NULL, '2025-08-26 14:15:50', 1, NULL, NULL, '2026-06-10 09:58:51', NULL, NULL, NULL, NULL, NULL),
(124, 'Mr. Uno', 'paul.zilly@aol.com', '$2y$12$.kLwVw6uD5Pl9RBl5rGC4O3R89wa6Jj2dxtgO0KUhbHgb9Lxices.', 1, '2026-03-15 07:26:09', 'b02eab482a', 8, '2025-08-27 08:08:27', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(125, 'Suklaafani', 'isabel.helbig@googlemail.com', '$2y$12$Nr5lgH6sjVX5znKPEg0GjeM.5.SgWApqYLVk/3.PZeKYgfduHmMDi', 19, '2026-06-10 21:25:28', '4026dfc798', NULL, '2025-08-29 17:44:06', 1, NULL, '2026-05-31 17:21:40', NULL, NULL, NULL, NULL, NULL, NULL),
(126, 'Miranda', 'auriphrygia@gmail.com', '$2y$12$.NTSKsWSOTYakLXRtu4RqugFwKK7/T1HCtq2tK9ZjyNQlZFtAV9sm', 1, NULL, '86dcfeb4fe', 40, '2025-08-30 17:06:32', 0, '37d3d5173b3998b9605a23b44d36175c604de7466cfabeea6e4ed69b10daa5a7', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(127, 'eisprinzessin', 'miranda.stattmann@gmail.com', '$2y$12$IIlYGyVdUyc2jUXiNTtLL.E7PxhcTUmu4Vc1y4zOAiKFAjneXjx7K', 1, NULL, 'c65e1bd3f3', 40, '2025-08-30 17:07:09', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(128, 'Kuki93', 'kunzek1993@gmail.com', '$2y$12$ozXFWUdpvakdTu4WEmpWmOYigjxBkDBoADYzLawf/ePTJn/SGGkYC', 1, '2025-09-23 18:30:54', '991887d5da', NULL, '2025-08-31 15:31:11', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(129, 'Nina', 'hiller-nina@web.de', '$2y$12$6IyXfjmUL51cM04q9EdpjenjBynun563XK1Q.BWFtHqReMetDt7S2', 1, NULL, '01fa367dd9', 2, '2025-09-04 09:35:07', 0, '9e9b281014832ef064f6723cb5c97f30547eac94fe056727740e23481d9a1ccf', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(130, 'Wele', 'leanawerner@icloud.com', '$2y$12$37VW0hY6QLWiEH366nHtrOlk7eOO06EgD3577mv1TK.qnZLCcj8cK', 1, NULL, '2e5620726d', 52, '2025-09-06 19:05:15', 0, 'd22921037a0859b69314988a1308471441419e0c5cd3942c2259d99cb3bbb795', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(131, 'sestef', 'stefan-seidel@posteo.de', '$2y$12$9oOTlFfmx/Ml/jRdwYcDbeFZG/SW6apltbrKHtSEJMdauRzYmtUKm', 10, '2026-04-25 16:20:32', '9c188431a0', 1, '2025-09-07 04:10:54', 1, NULL, '2026-03-08 04:54:10', NULL, NULL, NULL, NULL, NULL, NULL),
(132, 'Vivi', 'viviennever@hotmail.com', '$2y$12$CmgQPPecVYWT/9ZXKixWcOIBdv2ilfDn7BuOfEdHiUdhEP4bxCexm', 1, '2025-09-07 05:26:12', 'a9fb77bc92', 102, '2025-09-07 04:18:00', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(133, 'Kette46', 'racemaster46@gmail.com', '$2y$12$ovA7gHlQbRWeA9lBBvXSoOlhfhKzYZUR1676gc8tqdGgjZ1zokL3i', 5, '2026-03-23 20:42:23', '6bfd76b3b0', NULL, '2025-09-07 09:59:44', 1, NULL, '2026-05-10 10:26:17', '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(134, 'Birgit', 'OMI0815@aol.com', '$2y$12$C6r8QtO6jKLC3cVc/3nHzuWsltx623P6jBDWzlL7asF/KyBq0.O6u', 1, NULL, '175ca2b78d', NULL, '2025-09-11 16:26:51', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(135, 'Jan Wiedemann | Paracycling', 'janwied@web.de', '$2y$12$x32KjtJabIkD2L0sbfIcDObwyzgpFXzL9s5lmOlDRKDu4kpN9JNzu', 1, '2025-09-14 09:13:48', '2f6e1abb68', NULL, '2025-09-14 09:11:17', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(136, 'Martin86', 'martin.missler@gmx.net', '$2y$12$6c0RIujfPydj1f/b7aTTA.lXcwm4HW/85xTmFU2JGy6Rp6wr8rgbu', 1, NULL, 'f301b6960b', NULL, '2025-09-14 11:57:14', 0, '1db009200ea9a9fefe410cc08f031d45cac89a6702a266e3110a479268978bdb', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(137, 'Mamil23', 'tilo.kozlik@gmail.com', '$2y$12$solkoEGNzKlYimstpQxIE.ocDiv/B9jdiZrBf1hLUSW5onwmizpYK', 7, '2025-09-22 10:13:50', '143c2dfc29', NULL, '2025-09-16 17:57:55', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, 'Lydia S.', 'lydsch2000@googlemail.com', '$2y$12$y2zH9MN0llOCuIKGjgUap.gQzyMNOr320zGBhOEDbuR554tRMYzIe', 1, NULL, '8ee2b9e0e1', NULL, '2025-09-23 15:55:08', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(139, 'LexaE', 'zillyalexandra@aol.com', '$2y$12$j7BwiRQw3jFBYaACYrtE/eGml2FD0toul3lvxkHJeBmptDwhkVKda', 14, '2026-05-31 12:52:12', '91a02309e7', 8, '2025-10-01 16:15:05', 1, NULL, '2026-06-07 11:57:29', NULL, NULL, NULL, NULL, NULL, NULL),
(140, 'Tboneflow', 'posaunenfreak3@gmail.com', '$2y$12$nXsFQXrzgKmC8g5ZxOz4hOjkewB76h0wvxW6gsKHy8YozFG7rF45m', 1, NULL, 'dedb393c18', 22, '2025-10-04 14:35:06', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(141, 'jäätelö-dori', 'dorothee.braun@quaerosys.com', '$2y$12$i8YMFclt5/T69ddnfNMinOHrdE10grn1vABqqjILzenZ9JBzQFm.S', 1, NULL, '2d38553f70', 22, '2025-10-04 14:44:07', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(142, 'Stax', 'max.5@web.de', '$2y$12$GoCliJX6rB7gtTR0BxGax.r7kn6duqxgiz2yx54YhxgpPeRnBnnlq', 5, '2025-10-07 18:32:30', '5ac9b73638', 22, '2025-10-07 18:11:36', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(143, 'Tim Lange', 'timlange25112010@gmail.com', '$2y$12$2KmsG2YDotVE5pmwzrRA7ONcyB0QKIwzThjpx1lXBY/2fTFe4igXe', 4, '2025-10-18 19:39:25', 'da9d6f9e15', 8, '2025-10-18 13:37:04', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(144, 'JohannaWe', 'johanna.wenisch@gmx.de', '$2y$12$XiDjjpFgrEsAwpOO/YK.LezdLy3SrcAqeAoO6xoHqzBymxMkRdOAu', 5, '2025-10-19 17:50:51', '7310a3975f', NULL, '2025-10-19 17:40:28', 1, NULL, NULL, '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(145, 'Tanay', 'mauryatanay@gmail.com', '$2y$12$r0vDUg/19GPmd0VMoVSHTuxZKj9/0pBJ/E9Cpbg2nNhlwHMWI6DYC', 1, '2026-01-18 21:35:23', '70cd2493e8', NULL, '2026-01-08 17:04:43', 1, NULL, '2026-02-25 06:42:26', '2026-06-10 09:58:52', NULL, NULL, NULL, NULL, NULL),
(146, 'Testuser', 'cross-im-bad@e.mail.de', '$2y$12$jKZsbhOYDPrwE9/DQjt62OyoJKK1Os3tasFUrXiEik7Sswta0xsGy', 1, '2026-02-06 06:36:52', '0304c4b3b7', NULL, '2026-01-11 15:48:52', 1, NULL, '2026-02-25 06:42:26', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(147, 'tilmiteineml', 'tilmiteineml2020@gmail.com', '$2y$12$egMcfRMhmOhUa3aef7VlDOY4yA.ppfdpWd5T3TQfhbkJgrIiAY02a', 1, '2026-02-05 12:43:09', 'a236ac4071', NULL, '2026-02-05 12:39:15', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(148, 'Rene', 'rene_steinert@gmx.de', '$2y$12$90t17DsJz/aSph99gMYW1.JCj6MxDXxnYaxmlgD2iysml.lxaCL8y', 6, '2026-02-08 08:30:58', '5fed45c475', NULL, '2026-02-06 19:37:44', 1, NULL, '2026-02-06 18:51:08', NULL, NULL, NULL, NULL, NULL, NULL),
(149, 'UltraAlex', 'ride@veloventure.org', '$2y$12$kH.8lXxJ/R3jJ1wfnl5wpOfxCLvdQYlmOZ5wiDOWsyFL63EQaGBnm', 8, '2026-05-20 23:59:41', 'f2a8d4689b', NULL, '2026-02-07 23:36:19', 1, NULL, '2026-04-24 10:30:29', NULL, NULL, NULL, NULL, NULL, NULL),
(150, 'AnnaMCDough', 'a.schrage@gmx.net', '$2y$12$MBBaJ569HO/AtfQ5jGsgCOE4jffOncXeKgPqozpWCsNWBBrUM6J4q', 9, '2026-04-08 14:48:09', 'c8b6cf1217', 22, '2026-02-10 15:40:35', 1, NULL, '2026-02-11 12:25:14', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(151, 'lara_217', 'lara.muelhausen@icloud.com', '$2y$12$FZI8swAjGWOppa3vXCxIyuy5UgEJN.Zg4IqJyCbAIGIKwikmF6JhK', 5, '2026-02-22 20:04:12', '60203035b4', 48, '2026-02-11 20:48:29', 1, NULL, '2026-02-22 15:35:39', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(152, 'FrozenJo', 'jonas.hausmann98@gmail.com', '$2y$12$3lDL9kpeDRCA7z5id0ET6Ox7XIJB8pSQr73Ex.ux6asttn0zeeJMy', 1, NULL, '3a585c65a8', 48, '2026-02-15 13:46:01', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(153, 'IceNadl', 'nadiner79@gmx.de', '$2y$12$90pzciKvBuKJao5PKvgTAOVU3e4FN0fOBOZEnj5yXbpRgCnJ06QBC', 5, '2026-04-06 07:44:17', '86236ff477', 53, '2026-02-19 20:33:08', 1, NULL, '2026-04-26 10:21:38', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(154, 'Finja', 'dutenhoeferfinja@gmail.com', '$2y$12$NZwuuS1duyou6GQV1.LmXOJ5vcZa.U0lkeFeEWXbpr4KzxI8sFnnO', 1, '2026-02-23 11:39:15', '28ae36a21f', NULL, '2026-02-23 11:34:47', 1, NULL, '2026-02-25 06:42:26', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(155, 'Mathilda069', 'tilchmathilda1@gmail.com', '$2y$12$wJFSt1rufB67wbcNviose.giE7a.eFKNbIjMIv7ScwATmitc27gIK', 8, '2026-05-01 15:21:14', '9363b144fa', NULL, '2026-02-23 11:37:23', 1, NULL, '2026-02-25 06:42:26', NULL, NULL, NULL, NULL, NULL, NULL),
(156, 'Thetasteofchemnitz', 'thetasteofchemnitz@gmail.com', '$2y$12$Va68hEhaaR9ALB3aKOMPDu5vmuSVTGBaXaFuvFsiXnXeXogv.bw0m', 18, '2026-06-06 18:08:13', '7b1c6f9521', NULL, '2026-02-28 13:40:05', 1, NULL, '2026-03-08 05:01:23', NULL, NULL, NULL, NULL, 'https://www.instagram.com/thetasteofchemnitz?igsh=MW5oNHU3ZTVmb2dteA%3D%3D&utm_source=qr', ''),
(157, 'HerrZensdinge', 'herr.zensdinge@icloud.com', '$2y$12$/tw6CyB.74UUfnIsGLzVAOTq.b6kSTq78u/ztDp..zSAPERX8n4qa', 6, '2026-06-10 12:48:32', '98120a5c80', NULL, '2026-02-28 21:56:30', 1, NULL, '2026-03-21 17:13:06', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(158, 'ScoopsAroundTheWorld', 'fe.korte@web.de', '$2y$12$lfHR48LgiKBWvEXbhebs1eXkYhKa1LKTnxWDoIDBnR3vp7nZxwkG6', 18, '2026-06-02 10:49:55', 'd54d1c2772', NULL, '2026-03-06 10:28:25', 1, NULL, '2026-05-10 14:16:37', NULL, NULL, NULL, NULL, NULL, NULL),
(159, 'Pierrilein', 'pierrilein@aol.com', '$2y$12$ZCVfkGVjfwDs97zzzqWSAuCPpQNedhMujbi820.rGosxk.p3UXk12', 1, '2026-03-06 17:00:58', '550ca2a165', NULL, '2026-03-06 16:30:17', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(160, 'PatrickmagEis', 'patrick.klix1996@gmail.com', '$2y$12$UpwFbuB8ZnlrDSAxGdNWF./JzHBBCEpxnb4oUR4Q6T6Livs8vNhOq', 5, '2026-05-12 19:00:17', '56a1a9fead', NULL, '2026-03-06 17:13:11', 1, NULL, '2026-03-06 18:19:19', NULL, NULL, NULL, NULL, NULL, NULL),
(161, 'Flo', 'flo289@gmx.dd', '$2y$12$arkxSXqXUhHMTkouTUfgte6NzYSAuUgQlEwksCJ60rHeQwdSV5S86', 1, NULL, 'b8809b9f18', NULL, '2026-03-06 22:02:22', 0, 'edafd8be9c85c828c9aeaa77e4151ecbd63019e620f91e3272d1de6ecca903b4', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(162, 'palekale666', 'julkaschmidtjev@gmail.com', '$2y$12$itQ9SX2EFuzh7TJLMCvrIesVfNUFOp5QzytSmrdCPa.pwQ/LysWrK', 1, NULL, '6f2498f165', NULL, '2026-03-06 22:05:05', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(163, 'mrsgoodvibez', 'romytietz96@outlook.de', '$2y$12$DNXT.b/qhja9G2gjBAEl9e.Jp4sPkxFkhxn4QTF/Wn31Di5cg9wHG', 1, '2026-03-06 23:12:37', 'f2e6af1e04', NULL, '2026-03-06 22:35:55', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(164, 'nady233', 'natalygottberg@gmx.de', '$2y$12$LJGwuF7GMxASWM3gFQuTeuGNrcwDXsCIT5OjkHBs.pLsTb9AgkLYS', 1, NULL, '0dfb6ef223', NULL, '2026-03-07 05:29:27', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(165, 'Sabiscreative', 'sabrinaschreiter.work@gmail.com', '$2y$12$Ro7gn.L37lNa0zkUxX8wYOCbsU7HaCJOKWyR9qRn8UfHs4Cc/wVze', 6, '2026-03-07 17:14:02', 'd62c3bf73f', NULL, '2026-03-07 06:50:13', 1, NULL, '2026-03-07 05:55:30', NULL, NULL, NULL, NULL, NULL, NULL),
(166, 'LifePloschke', 'matze0906matze@gmail.com', '$2y$12$k1izAn7SdwEfCTwWYJWorubc0DvsPUw2wwrbcg9vyIpf0gsHsbFIq', 1, NULL, '7770bea937', 19, '2026-03-07 11:41:44', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(167, 'Anni', 'familie.ahnert@gmx.de', '$2y$12$0qMSoZjK3Xef3KSOX4ZO/uk4i.6y04mHcKaFRoF1fO9GAyLG8p2M6', 4, '2026-03-08 09:56:10', '5609628faf', NULL, '2026-03-07 21:14:57', 1, NULL, '2026-03-08 04:56:20', '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(168, 'Fladenbrot', 'info@steveconrad.de', '$2y$12$0M0SsuB18oTGdTifZ.wuzuDQxyaYjhSA.uJcPPCx9pugVzskeyem2', 1, NULL, 'c3be8651af', NULL, '2026-03-08 00:10:49', 1, NULL, NULL, '2026-06-10 09:58:53', NULL, NULL, NULL, NULL, NULL),
(169, 'trail_surfer_Basti', 'Sebastian.noack@mail.de', '$2y$12$2CnbkrwZVQBQ0W.5HNfRauyazDdHglYrJHuCADlwZ/kzaJbDxXhW6', 1, NULL, 'eed0365da4', 1, '2026-03-12 07:36:15', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(170, 'oatarrow', 'otero.mason@gmail.com', '$2y$12$Nui0H0TROfQcVIIvP/Yp5.UdGSTRR3VCwMQ9JEtPDTiAyht/3GNdi', 1, NULL, 'a7210b7ef8', 1, '2026-03-13 20:31:17', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(171, 'Krissy85', 'leseratte8589@gmail.com', '$2y$12$Ka66uW.fbRcfAP/s.ONzieNZksJH9A/7GtkzOy5xscjzaQKKnRqn.', 1, NULL, '3acf3fba74', NULL, '2026-03-14 15:43:22', 0, '73bf5f39ffd89d0633a8f4c0adce67a0bb2ee2714c12de57b18b49d5e34be415', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(172, 'soddelini', 'schneidersophie@gmx.de', '$2y$12$aWO0gSfVn9rdHQHi1AWIs.SDq1NBnbECcoLuTIerfpo2eKr/dBXqy', 5, '2026-05-03 14:01:36', 'e68c4efe22', NULL, '2026-03-15 10:21:41', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(173, 'Djemba_Djemba', 'richard.schirmer@gmx.de', '$2y$12$8..OyTdJpbHjQRxrK0lQlO3WLNOhMOfEKaXbigOtbbPIiZ7JSmIZu', 9, '2026-05-06 22:17:34', '4bb9e6db35', NULL, '2026-03-15 10:32:32', 1, NULL, '2026-05-01 14:18:07', NULL, NULL, NULL, NULL, NULL, NULL),
(174, 'MichaB', 'burgoldservice@gmail.com', '$2y$12$vj0GMOwjrV01EwYzD5E99utoVRceCsLQwu5QRKonkzIuDWeby.tDW', 14, '2026-05-17 17:49:54', '16db952109', 23, '2026-03-15 17:29:06', 1, NULL, '2026-05-16 16:39:34', NULL, NULL, NULL, NULL, NULL, NULL),
(175, 'LarsKrachen', 'lars-hiemann@web.de', '$2y$12$j8.fmilaFLxSBNEDD.TltekoCOhWjBexX1Nla4nOSlUsRN3DV.4Ry', 15, '2026-06-06 13:24:01', 'a27a2ac953', NULL, '2026-03-15 22:21:19', 1, NULL, '2026-06-06 14:56:06', NULL, NULL, NULL, NULL, NULL, NULL),
(176, 'Triceman09', 'patrice.nielsen1@gmail.com', '$2y$12$H26rwdOISfzvY5rVo.kJ1Ob5QiPTnfPBWZUGipC0Cy.aAKpMnpRcy', 1, NULL, '5990bda21f', NULL, '2026-03-16 06:57:44', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(177, 'Christian', 'christianschaedel1976@gmail.com', '$2y$12$8zOR7qII7UVdeylssh/dhe4LPhHVEbLSvY7FVfTl2EmL0xnmRG0nm', 1, '2026-03-16 07:42:41', '43a549f7f9', 23, '2026-03-16 07:28:36', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(178, 'Pavel82', 'schindlerlars7@web.de', '$2y$12$GiTwOT2kdmLrl7K2qxndk.jszlWBaZ/WkKXAbAXs2NGuaY4lUXO6C', 1, '2026-04-30 08:13:59', '09a06ce2be', NULL, '2026-03-16 14:30:45', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(179, 'PatrickE', 'patrick-eppler@gmx.de', '$2y$12$Y5bcHJWoQ5LqAAvnPngTd.SCXkVxjtbWTALJDI7FQtvZD2Epy2Jmq', 16, '2026-05-31 18:47:29', '494f3d240c', NULL, '2026-03-16 19:03:40', 1, NULL, '2026-05-27 09:46:20', NULL, NULL, NULL, NULL, NULL, NULL),
(180, 'Hannesbre', 'brennerhannes@yahoo.de', '$2y$12$17PGLU.hriCr45z2tSF7A.tXOB9GVEr5/TRGiEYLP/IEyOQAatXRa', 1, '2026-03-16 19:26:27', '884561ce40', NULL, '2026-03-16 19:23:00', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(181, 'ckuhl96', 'ckuhl123@yahoo.de', '$2y$12$Zvy7.wfv0XBzMhAQq.s6VeNKw.mRuPJiOyZyKv4CRm65AmawzOcta', 10, '2026-05-16 10:59:28', 'a7858be1bc', NULL, '2026-03-16 19:35:02', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(182, 'Luki', 'lukas97.s@arcor.de', '$2y$12$WfFJ0uQl69VBkZ/g7LBen./r4x6yrqoUkkGjhci9E27EJ6b6kfJVi', 14, '2026-05-16 13:38:55', '6d473ae909', NULL, '2026-03-16 20:35:21', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(183, 'Nils', 'nilslose@icloud.com', '$2y$12$KYub.TDdayZRbq/k/m.ZrujMAkJ/h39yIHauFOzXgMMXKwDsCP1pq', 1, '2026-05-15 09:13:52', '84ca3b47b3', NULL, '2026-03-17 08:09:57', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(184, 'RIAN_Dee', 'quartal_keimzelle.3s@icloud.com', '$2y$12$TyFZUInRC9PgYe/3OKU0T.r1YFWvj8ytNeUyMF85YWW2fT959N2sC', 11, '2026-05-15 20:46:26', '198eb33db9', NULL, '2026-03-17 08:37:25', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(185, 'Nine', 'nine_@gmx.net', '$2y$12$JKDSzIelgjvXtc/qD2i8UO3awJqhQmkx6wYywe4eD5I/ZfZCm51se', 13, '2026-05-16 14:11:25', '347958e1c6', NULL, '2026-03-18 13:20:46', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(186, 'Welzi', 'welz.va@googlemail.com', '$2y$12$6GdTN6MUvmOf9MzxmRDhVezisCs0reznyVc0sI8.k/kknlOOLGUVm', 4, '2026-05-07 20:34:29', '0b7ab8887a', NULL, '2026-03-19 18:15:02', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(187, 'Judith', 'vonossowskijudith@yahoo.de', '$2y$12$i.WVGJoJB4m5ZMXf7QSeC.Lm5QU0ndwv1M59yTvsjFt/HvrjTKEu6', 1, '2026-03-23 14:23:46', '8b4d81be86', NULL, '2026-03-19 18:20:55', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(188, 'Flomo93', 'lehmann.florian@web.de', '$2y$12$A0a8RmTOwvMqD9yd3YX/EuA5FkLNOb0bEV1togI5EjIvzya9c3Ml.', 1, '2026-03-20 09:37:34', '54c73fdcf7', NULL, '2026-03-20 09:33:55', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(189, 'Wuschel', 'manja.seemann@outlook.de', '$2y$12$F0QfNKBbA8q8bOlm7gpigeCUJenYCgcUi1f0RCYsSN62jV/Nn6Rlu', 1, '2026-03-20 12:42:50', '0b1ca4e701', NULL, '2026-03-20 12:36:26', 1, NULL, NULL, '2026-06-10 09:58:54', NULL, NULL, NULL, NULL, NULL),
(190, 'heike21', 'heikefindeisen@googlemail.com', '$2y$12$Ow75b7M/5zAHdraNSETwauWCud.fSnqk4WRTdseTpwJxf8dXqAh7W', 11, '2026-06-06 15:58:36', '1c7a76a4aa', NULL, '2026-03-22 13:03:45', 1, NULL, '2026-03-22 12:17:54', NULL, NULL, NULL, NULL, NULL, NULL),
(191, 'maxx_blaxx', 'lisa.kunze93@gmail.com', '$2y$12$h4vAtiKD0zaCIIQoEOXCnedMbChGcyRRDqFMs8lY3M0eOA2zZmGEG', 1, '2026-04-08 11:26:33', '89f80222f6', NULL, '2026-03-23 09:32:41', 1, NULL, NULL, '2026-06-10 09:59:03', NULL, NULL, NULL, NULL, NULL),
(192, 'Anne', 'anne.gottstein@web.de', '$2y$12$Hdrdjqkg61uXZZjXuynv8O8/7RVJCclXYqelt2Q/gx9ZSZ09B6nbq', 1, NULL, '4deebc0000', NULL, '2026-03-24 06:44:40', 1, NULL, NULL, '2026-06-10 09:59:03', NULL, NULL, NULL, NULL, NULL),
(193, 'JohnB', 'johnbarth31@gmail.com', '$2y$12$xszHyELnOqkOyThsS9khe.Co/.DmUX9W/5TA9N3epg5RT1pagFPqW', 1, '2026-04-10 17:01:22', '24db46a18d', 8, '2026-03-24 21:37:33', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(194, 'Lennert', 'oechsnerlennert@gmail.com', '$2y$12$GrhWFdoFnjqWILQE5SQn5.Sve2NtJ6FMnnaOTnGt52V.ADKWLwzIi', 1, '2026-05-16 10:54:08', '1febb33d96', NULL, '2026-03-25 17:23:06', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(195, 'Katel', 'katjapetarus@aol.com', '$2y$12$yZQXgGU64XNg2Tj/2VPFBuNUX7VQaF4h6LZaqYTrSZ2ZnltYH2zEG', 1, NULL, 'ff34e33164', NULL, '2026-04-03 07:29:05', 0, '4a1ddde9eda7ce117bd35fc35bb8a38f02f24fc97110c36825b9854bd6bc8368', NULL, NULL, '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(196, 'Kay_Baumann', 'kay.baumann@web.de', '$2y$12$qDoqhFvrsMsm50yviWAydOsAU/locbV1fNm3S/q.Rbl6riemKrTp2', 1, NULL, 'fa154f677e', NULL, '2026-04-03 10:14:39', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(197, 'Celeste', 'miriquidi@gmail.com', '$2y$12$Ys6Ik6S16sR46cnWfBofcOGhuVxa6ODeZmr0a3Ed2NDbPPp/MNXQ.', 7, '2026-06-07 12:52:12', '8bee5171ad', NULL, '2026-04-04 19:50:08', 1, NULL, '2026-04-05 05:57:28', NULL, NULL, NULL, NULL, NULL, NULL),
(198, 'rudi467', 'rudi.voh@outlook.de', '$2y$12$PeKbWDh0m7ZM/oVcUnaZ7OgEY.MHdQ00cmUUFQXzStrYF9VRaz62m', 2, '2026-04-05 07:39:08', 'a963b2a1ba', NULL, '2026-04-05 07:37:40', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(199, 'Mirko', 'mirko.hoppe@outlook.de', '$2y$12$qjYvuh1bkNtsnhLiRxW2WePqVtIIsvu.oZ1SmVYuCdoeoWnghSBHO', 2, '2026-04-27 15:39:31', '655f4fda76', NULL, '2026-04-05 17:07:04', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(200, 'M-H', 'mirkohoppe1@gmail.com', '$2y$12$0De2L.nzmZh09C6QODuoQek2rbkWxKHMk5k6BG8gwvfjz9UgW5.LC', 1, NULL, 'dc58499314', NULL, '2026-04-05 17:14:10', 1, NULL, NULL, '2026-06-10 11:00:38', '2026-06-10 10:06:59', '2026-06-10 10:06:59', NULL, NULL, NULL),
(201, 'Lisette82', 'schneider-lisette@t-online.de', '$2y$12$M2grSv2sBLIXUK6sKvXrP.vZqzosWIwFnhTVh7B5wEjOgFGS/GKfe', 1, NULL, '8ada145b29', NULL, '2026-04-05 18:42:54', 1, NULL, NULL, '2026-06-10 11:01:34', '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(202, 'Kerze', 'jimkerzig@gmail.com', '$2y$12$ZysJ5s2c.rv5QODVUXi7.ejeaw93wjgsXC/uped/x9ZfRawQ1Uzyy', 12, '2026-05-17 07:45:19', 'bcb142056c', NULL, '2026-04-08 06:58:31', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(203, 'Joerg_Fleischer', 'joerg_fleischer@outlook.com', '$2y$12$eEKOJ/j/EmxNWXNfYVhfFubvEYhpsbRmMW1W77nsDr5NjOH06b5.y', 1, '2026-05-15 11:56:26', '7f0e52b965', 74, '2026-04-09 16:30:51', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(204, 'mussnix', 'tom.schaal@gmx.de', '$2y$12$MVDO0UgkFqIlBvgad2nsAeJVg.PVd6jo2gNJslp9jtL7eTkSRs8Su', 1, NULL, '910d58dba4', 74, '2026-04-10 05:08:54', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(205, 'Micha', 'michael-r-90@web.de', '$2y$12$54Rt30QLTIPFXJHFhBvCfOBhjQhlZ67VOHsrfqmHI88QTaEGVGoty', 14, '2026-05-16 11:47:44', '6060c5ae48', NULL, '2026-04-12 13:24:17', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(206, 'TinaH', 'tina_hundro@web.de', '$2y$12$00kb0yCx6jpDgf42maxMpuJ/5CzdxjdD3b0kkYqMK8nZ7zpsBc5r.', 1, NULL, '2d600c1c80', 192, '2026-04-14 17:41:59', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(207, 'loebelhannes', 'kreisslhannes@web.de', '$2y$12$vkTqcXD7O99Abl3znIODBuZAAZNvFLFl3rVq7lDIQYSuAlfL/q08i', 11, '2026-05-15 10:01:38', '40e86b5db7', NULL, '2026-04-16 05:11:00', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(208, 'JoergDani', 'joergdani66@gmail.com', '$2y$12$TgAqy318SR6sSs2EAQZYde/o8umk.M/dASAIj3psvoyhdHw1u2LgC', 14, '2026-05-29 23:36:45', 'e25e28b114', NULL, '2026-04-16 12:58:09', 1, NULL, '2026-05-25 15:07:11', NULL, NULL, NULL, NULL, NULL, NULL),
(209, 'Sandri', 'naumiez@web.de', '$2y$12$TlCcS/YRjYR/imcKunwJe.HZZh6UMxqfSyJ03DbH8.nMxmfSP6s92', 1, NULL, 'a4f108545f', NULL, '2026-04-18 12:10:44', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(210, 'DosTobis', 'tob86.nbi41@outlook.de', '$2y$12$TkfpCDlRf5INi1IxUpD7muH4IUgxdUGZGkR/.DDUamJB5txaOZPHm', 14, '2026-05-30 06:52:20', '4fc8f612f8', NULL, '2026-04-18 15:40:13', 1, NULL, '2026-05-15 09:27:45', NULL, NULL, NULL, NULL, 'https://www.instagram.com/tobias.nix?igsh=MXBuYTdseGlycTI1bQ%3D%3D&utm_source=qr', 'https://strava.app.link/bQQgBEw292b'),
(211, 'WUHA_Zack', 'tietz.mar@gmail.com', '$2y$12$1jVMPlFVbf8YSShrWJTpnetfxL0lcSM6ll7Iy1cA3fUpRbc0tHHD2', 10, '2026-05-20 15:10:45', '74dca487be', NULL, '2026-04-19 10:31:50', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(212, 'RyFischie', 'ronnywiese@me.com', '$2y$12$y50O3JEFQBab7koPwlLHheAnU3wlhWBvdFKzZoi35Wl16yTRMxKEC', 1, '2026-05-14 05:52:27', '043b2996ba', NULL, '2026-04-19 14:14:05', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(213, 'Basti23', 'sebastianfranke40@gmail.com', '$2y$12$UTIk0hrHRWlcnfD/xZeTJuwUGoIvbP8MGn6l38x5t1iUYjUhy9FQO', 12, '2026-06-06 19:18:33', '775792be95', NULL, '2026-04-19 16:43:56', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(214, 'Julia', 'julsei2004@gmail.com', '$2y$12$iBrxfK82DzP.K8stzu5GhefbAkGXpFYtqF1beDQiMQ5srmhNawN1W', 10, '2026-04-20 18:06:03', 'cb60bb7362', NULL, '2026-04-20 17:09:49', 1, NULL, NULL, '2026-06-10 09:59:04', NULL, NULL, NULL, NULL, NULL),
(215, 'Richito', 'richard.einenkel23@gmail.com', '$2y$12$HgFXd/jD9NEObZZo6yRFF.xewYoug.kgbkQzKZZ8psjiCaIb2B/Lm', 7, '2026-05-17 16:20:49', '1790cee6f7', NULL, '2026-04-20 17:13:42', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(216, 'Micha_Neukirchen', 'micha.berger@icloud.com', '$2y$12$ykhknSN1SoYuVZs3LOhorOmyD2Hj2xfaYE9XM0Zn.pLEMnz/zRG86', 1, NULL, '0bb9eb27af', NULL, '2026-04-21 05:28:08', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(217, 'Finn', 'finn.dani92@gmail.com', '$2y$12$Hzp8nfVo/DT2bftfu6gr6ORTTwJtTVJCyvqpgkvUyPMKs.hQBly4O', 18, '2026-06-01 10:45:17', 'ef3911dd41', NULL, '2026-04-21 20:18:46', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(218, 'Ulf', 'ulfbroeer@googlemail.com', '$2y$12$c2SkEg5TWLYoi7V4xwTZxuoBUy.mBOLRVBpIRTl40Rvz0xNWZA83W', 1, NULL, '9d49eb76c9', NULL, '2026-04-25 09:23:38', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `nutzer` (`id`, `username`, `email`, `password_hash`, `current_level`, `last_active_at`, `invite_code`, `invited_by`, `erstellt_am`, `is_verified`, `verification_token`, `last_notification_email_at`, `welcome_mail_sent_at`, `verification_reminder_1_sent_at`, `verification_reminder_2_sent_at`, `deletion_requested_at`, `instagram_account`, `strava_account`) VALUES
(219, 'Mrvnbs', 'marvin.nobis@googlemail.com', '$2y$12$vkhQJbaXSiIMZHYWXgsVe.08dp81lOZdk14yNlR4xB8iSsdDGFInW', 13, '2026-06-06 15:31:53', '08a8548a94', NULL, '2026-04-25 13:10:04', 1, NULL, '2026-05-01 14:17:14', NULL, NULL, NULL, NULL, NULL, NULL),
(220, 'violist', 'a.kunath@me.com', '$2y$12$OARYBe/6wVMjHIwJeBN2QOApOEsnqt9q.P9GBsNZxdEYgMB4nH242', 1, '2026-06-07 18:51:36', '5fd390bc3e', NULL, '2026-04-26 07:24:49', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(221, 'Winter', 'Sunjaay41@gmail.com', '$2y$12$QNEjH2sRccEqcAWPQEeBrO36nBSIvmQ7vYkOIVv99gmvyhmKWQ53W', 12, '2026-05-16 13:03:29', '63b803701d', NULL, '2026-04-26 17:41:31', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(222, 'Franz', 'franzschoenfelder123@gmail.com', '$2y$12$onWyXslrfDpIlHbNdmA/f.WMiP.YVwG8kwnhfCYwG61iTTY.yLE8q', 12, '2026-05-16 13:43:41', '4b4af1ee65', NULL, '2026-04-27 17:17:36', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(223, 'JuergenWoe', 'Juergenwoetzel@web.de', '$2y$12$TVfBQCj3Z7.YCzwcZTPOfuZStCGnalz/zHyz5yuAMlGRZ8VDG6V6i', 10, '2026-05-29 14:17:59', '1e2b354088', NULL, '2026-04-27 19:20:14', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(224, 'ecmi', 'mike.eckert@gmx.net', '$2y$12$Rso5YcwjKe8uaZFIpUP4XuZSGtkRcsiui/p8wdoaT.6TqZ6gOhbYK', 7, '2026-05-16 12:54:44', '53df04c580', NULL, '2026-04-27 20:06:41', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(225, 'Manu', 'ihm_goeck@gmx.de', '$2y$12$/NbAGWAbmoGCWyesimHOUOgm5804CvXfljK2Q7ls2LJfDf52ywylu', 12, '2026-05-16 13:48:48', 'bcde9ceac4', NULL, '2026-05-01 14:41:02', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(226, 'Hilbe', 'hilbert.joerg@gmx.de', '$2y$12$n47snvk6Qb4/Pzv/vWoGbumQ8AvSdCbuZpcFezdAY7af2/zxwS.nW', 15, '2026-05-28 15:49:47', 'a5dd2ae6a1', NULL, '2026-05-01 20:35:02', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(227, 'Burch', 'pascal.burckhardt@freenet.de', '$2y$12$wvziVvAmdfcM6ECQo0NpseXQ/Rl.ICmJgn30FOKzXaTjO7mh57buW', 11, '2026-05-19 05:53:57', '4cdf5bf651', 186, '2026-05-03 17:52:55', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(228, 'Grinser', 'andreas.lenk@gmail.com', '$2y$12$QaveksRVR9XmxYhNOtr0YOjSVN5iWc9ZwKM8SF2Zq4L0CSNsGNBWO', 12, '2026-05-16 14:16:54', '38cb62f8ef', NULL, '2026-05-04 08:47:21', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(229, 'mark', 'martin@nea-art.de', '$2y$12$IgKIJVTvqTH3ycbKxnsq5usTpD50IKSUzyMj9yvX0kpOwvPpLVi8.', 12, '2026-05-26 03:45:44', 'c564010d77', NULL, '2026-05-05 16:39:59', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(230, 'brunotti', 'info@brunokutter.de', '$2y$12$s0qRvHN6rQPJX3MY1Bow3On76BpQirKYJtIc6tf054s2wYDJ5yd0W', 6, '2026-05-16 14:15:27', '6a28e09242', 229, '2026-05-05 17:56:02', 1, NULL, NULL, '2026-06-10 09:59:05', NULL, NULL, NULL, NULL, NULL),
(231, 'Hendrik', 'hendrikxmuench@gmx.de', '$2y$12$nViyFdlWjoZPtkn39lmWJea6HP8r/X.WF1ozTHb9ixYKxGb5rx1Sa', 13, '2026-05-17 11:41:13', '046590df58', NULL, '2026-05-06 05:21:06', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(232, 'Dani_Lo', 'darth_danilo@gmx.de', '$2y$12$gzYqxc5366S6/39xX8I2.OkSHICRbcRDc6jToowxTILraZrfEBBey', 13, '2026-06-10 18:22:07', '5b42d554ad', NULL, '2026-05-06 09:14:37', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, '', 'https://strava.app.link/LnodXBgUb3b'),
(233, 'Sheed', 'enrico_kuehn@web.de', '$2y$12$MT79KMLlys6F9ODDC44oEu6bo.AqKWlbGlKJB3q8Nv1Q4cmbGofiO', 1, '2026-05-07 10:36:53', '3581a74310', NULL, '2026-05-07 10:33:38', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(234, 'Andreas', 'leuandreas@web.de', '$2y$12$mMSHEehXfYlzPhipyByj/eDIUlUQZ2HKy6kzblvduBxbPNgRWpQVW', 14, '2026-05-21 11:01:35', 'cdf28411fa', NULL, '2026-05-07 12:54:20', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(235, 'Firestriker', 'ralfundco@arcor.de', '$2y$12$lMbfE1hK625SnF.xPxwlHehaOcCGyOzYV2SMEe.lphZnQvxZ49nfi', 17, '2026-06-10 15:25:11', 'c70b015788', NULL, '2026-05-07 15:24:30', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(236, 'Filzer', 'filzer85@gmail.com', '$2y$12$bEjIKKGvRdT9mcY/JapCYONrbftTTjOMI9CzdKjhibwIrHxOgObSS', 8, '2026-05-24 16:07:12', 'f208b85d31', NULL, '2026-05-07 15:33:54', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(237, 'Honza', 'benndoj@web.de', '$2y$12$B1lTQL5GRAMJz8/RT8IsLOhgzcP/c41npZ/F63e7lobYV1HLGyeAa', 1, NULL, '8885a3557d', NULL, '2026-05-09 05:47:17', 0, '718e38900bf551d49b959e6716787e0748ced68dd85a6524945e24f88aa413c1', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(238, 'benndoja', 'jan.benndorf@outlook.de', '$2y$12$guLavUbE.FeKLMK7RZjYS.6czAgUEnl65fYYkmXkagF70lJQvL3Bu', 13, '2026-05-17 04:41:05', '3bbf8f48bc', NULL, '2026-05-09 07:47:48', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(239, 'mo_n', 'moritz_natzschka@web.de', '$2y$12$oe5EJ/CWslkzAUxm6LS2bO079P4DPuEr2oultUWwZbArE3vnMBVXS', 9, '2026-05-16 10:06:02', 'c01b309da2', NULL, '2026-05-09 16:40:11', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(240, 'ThomasG', 'thomas_gutte@freenet.de', '$2y$12$oGMsPJBz.wdYrn4qKFyE.uJxQOuqkiD1FTtV6jZdAHAZ8d1T/l.Zm', 1, '2026-05-25 10:39:22', 'd89ade8c4c', NULL, '2026-05-10 15:19:54', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(241, 'Burcki', 'patrick.burckhardt@gmx.de', '$2y$12$B9K1JoC79lhLMJSMWLhWt.RoXLEhz.UP4gyCHkMC2XYEDidJaAyHS', 1, '2026-05-16 08:29:29', 'ab78bc3119', NULL, '2026-05-10 16:40:34', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(242, 'KaiKirchhof111b', 'kai.kirchhof@googlemail.com', '$2y$12$nBHD0J.TokDRJdvwZEEXX.mdZbY61acbpGHikZ2gTHImrtjgLASiC', 9, '2026-05-16 18:52:16', 'be699e987c', NULL, '2026-05-10 17:21:25', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(243, 'Neumi', 'steffen-n@t-online.de', '$2y$12$TvaQvXRFE3/4wKUpRFqv8O.BKW3Np5SqBGeNH4/OjIvSDdes5R8Y6', 12, '2026-05-16 12:31:20', '9c351ddba2', NULL, '2026-05-11 12:25:05', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(244, 'Thomas_M', 'kadomi03@gmail.com', '$2y$12$6rDnlwUNPTx8Hs6gI0agTOZSUIG4PxOFkHsOoZg6v9PalnzuTxgJS', 1, '2026-05-11 20:08:27', '05b373b52f', 43, '2026-05-11 14:46:39', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(245, 'ThomasRR', 'thomasgutt@freenet.de', '$2y$12$9KrHtiFTThtuZaBQdNy8KOhI2Eh7fDemZ3raq9MoJ0NhuubNNcsvi', 1, NULL, '6d68ad4a71', NULL, '2026-05-11 18:13:52', 1, NULL, NULL, '2026-06-10 09:59:06', NULL, NULL, NULL, NULL, NULL),
(246, 'Lukas', 'lukxy2000@kdwelt.de', '$2y$12$r4MYF.iNoOuCWVUDY8hrXum656b1TMj5jxK3fX/UTd4bo4i/ldo1i', 3, '2026-05-18 10:28:58', '3a5e57b1fa', NULL, '2026-05-12 07:14:53', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, '', 'https://strava.app.link/Uh0jvUPaa3b'),
(247, 'Ronny', 'amsp23@gmail.com', '$2y$12$Rc/DyrCSlYni7NtB/1zWfOqP6GHIBd7QflypUQnAKZMXR0dmcgkYi', 1, '2026-05-16 08:55:43', '1734dd0397', NULL, '2026-05-12 09:46:36', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(248, 'Kathi', 'kathi@gigbus.de', '$2y$12$7XBmoVc9WRyh3R6G0RdKC.XQVsvDsKiuvsJ9OADnFRUCKydpXLFhW', 3, '2026-05-31 08:57:01', '75c3ddf22c', NULL, '2026-05-12 11:36:09', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(249, 'Eddy', 'eddy.winter2010@gmail.com', '$2y$12$ynaV4ucVaUS626dDVOrtmO14kD8v.dtHke.jX3KLiAZQDSzLVzgg6', 8, '2026-05-14 09:32:26', '48146b697f', NULL, '2026-05-12 18:34:35', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(250, 'Jasmin', 'jk.abc.9999@gmail.com', '$2y$12$Ugou1Nhg8railj1SdRpVXeTmdp278nysY6dUOd.LhzIIzKuygJSTS', 12, '2026-05-16 11:29:15', '9174e30cc8', NULL, '2026-05-12 18:56:22', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(251, 'Planschi', 'philiboy03@gmail.com', '$2y$12$Mp7BIa9AR6a1PYwklBAQaurwAdbABlZ48ZpBqo3zpZGNphGXptA9S', 8, '2026-06-05 11:44:38', 'c0096ded70', 210, '2026-05-15 11:23:54', 1, NULL, '2026-06-04 10:53:36', NULL, NULL, NULL, NULL, '@phxl.hxb', ''),
(252, 'LysLifad', 'naumann-lysann@web.de', '$2y$12$sLpXzEnzbg5p/N1yVNHug.o4zFyjpCy9MdT950xhlWbG9nLcIC2Ji', 1, NULL, 'e1ada86ec5', NULL, '2026-05-15 11:40:33', 0, '05dc4b70484966012c7443665eec2ec834db76c75a931464d7b44a0876aee2c5', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(253, 'Klameusimo', 'klausmirass85@gmx.de', '$2y$12$yZUK1hiuSw0lI5oZ8kF2IOplbmwYuv3olBZI26HqYJ.q5VyH5qeIq', 1, '2026-05-16 09:43:54', '49ed5bf6db', NULL, '2026-05-15 11:43:40', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(254, 'Lys-Lifad', 'klausmirass85@gmail.com', '$2y$12$sm2ss6VQ7J1rW0IkhOyk.uUiOljIIIjZ0F7TIApr9QGamKFUSZmSC', 1, '2026-05-16 11:57:33', 'f2270f5644', NULL, '2026-05-15 11:51:16', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(255, 'StefanVogel', 'stv79@icloud.com', '$2y$12$r40NSiWdzurcb1Afok4oh.2H8fjgzV8GR771SBudIjmTSNeSM3xc.', 11, '2026-05-16 12:28:26', 'a7126568db', 243, '2026-05-15 11:51:56', 1, NULL, NULL, '2026-06-10 09:59:07', NULL, NULL, NULL, NULL, NULL),
(256, 'Maxi', 'maxi2727@icloud.com', '$2y$12$Xi.L.MNWhnYaUL13EzI91eFZoLL3AgLBs5k96bwhcV/hfsat.b1Li', 7, '2026-05-16 14:16:47', 'f30b760698', 242, '2026-05-15 14:08:18', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(257, 'peer_k19', 'peer.kirchhof@gmail.com', '$2y$12$a0RIE2ngNReGul8x4Dp9BuZAaklbF.Xusk5Hi6Y00cGqVljqLMqGu', 7, '2026-05-16 14:17:06', 'd3d6b60991', 242, '2026-05-15 15:45:43', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(258, 'jemeier', 'jemeier@outlook.com', '$2y$12$XPR1k2HNHl2MKUazsycwoua1CBJRhnSTS5pxIG4BSf.HF9WAX2dIu', 1, NULL, '2c54129019', NULL, '2026-05-15 18:42:42', 0, 'f2a3f5f57b1ef2ef9be444144fa50ef0c48bbd533ddec7e4ea830590fccc9759', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(259, 'jens_meier', 'jens.m.floeha@gmail.com', '$2y$12$mUPX0Cy9X9EVH2MVLHiXiegVqgZEpgv5WSnjGTWvWfnKimZHX3cGi', 9, '2026-05-22 21:48:02', 'bc77776f60', NULL, '2026-05-15 19:11:40', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(260, 'Idefix', 'info@absolutbauwerk.de', '$2y$12$2/rEOdEYpnJ7cvMFuY.kYOMmrY5CwUBLlcAFxaoQCJdX9XfFek84q', 1, '2026-05-15 21:16:13', '256100c600', NULL, '2026-05-15 21:09:35', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(261, 'renzo_dileo', 'renzo.dileo@gmail.com', '$2y$12$aGxThla8zokD5d1SMtXV.uJH34u7jOSx/VreI0sCzDOIf6IUfff6W', 13, '2026-05-24 14:15:23', 'be2136497c', NULL, '2026-05-15 21:45:51', 1, NULL, '2026-05-16 08:25:27', NULL, NULL, NULL, NULL, '', 'https://strava.app.link/IpWeR3oGa3b'),
(262, 'BB-Zwickau', 'Benita.badstuebner@web.de', '$2y$12$iPtrJXHau3CJdh149cg8Z.LU6LS6yLTdDiKdE/HEPee0cl7BL92zG', 13, '2026-05-16 14:08:50', 'a4f361b94a', 185, '2026-05-16 06:30:43', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(263, 'MBS1927', 'hoehnetom@web.de', '$2y$12$j7it8L6FbfcsjqL.EBdAUOBsoN2M791bP/8q7c5qcsb3B1B4iz98y', 3, '2026-06-06 13:09:19', '5636079f34', NULL, '2026-05-16 08:58:48', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(264, 'Josch', 'j-schwenk@gmx.de', '$2y$12$7U4JuojFWaOb5zpAboU4Iexw8CnsZkFzg/IMRX0UyxIwNPtonSoL.', 12, '2026-05-16 11:36:15', '8a87d5dc3b', NULL, '2026-05-16 09:01:11', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(265, 'ubenedict', 'fambenedict@gmail.com', '$2y$12$M0buYgw5x4HQXKDkvmx8MehXni74ll78R8TtG/CEGsAea5fF9fOrC', 1, NULL, 'f315c11e11', NULL, '2026-05-16 17:10:59', 0, 'aa6fabe438c97f896bbf94f4bb1175157eaa99dd623c7f7d54613de42e361d97', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(266, 'Jensbecker', 'info@beckerjens.com', '$2y$12$iDffTNSB0cOxy.2zgZuoUOvnl9RUsWJ.M5u73T2ZCjL8gEbowTALe', 1, NULL, '3899c65997', NULL, '2026-05-17 12:30:50', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(267, 'MaxiW', 'maxi.wenzel@t-online.de', '$2y$12$C1P7vzfCiLqzWP3ClCZ1beSmYuo481bV1.BrdvdqHhdbCOsjAANIy', 1, '2026-05-17 17:30:35', '509982bbc9', 8, '2026-05-17 15:38:52', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(268, 'Thomy73', 'thomas.skora1@gmail.com', '$2y$12$z/p7GO7s5wAfx4P7mEtHTOaYUJfNxp53rlRNawUAlmxjiMtvIAalK', 1, '2026-05-18 06:52:14', '6514a7cb9a', NULL, '2026-05-17 20:47:05', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(269, 'Hanna', 'fatimazamani2209@gmail.com', '$2y$12$wv8YNJOtUmKeD3aaWLHtyOfSV7gd6NR1tdmKtiWN/zoyhzRnFkuTu', 2, '2026-05-20 12:27:55', '2e340547b6', NULL, '2026-05-20 12:21:16', 1, NULL, NULL, '2026-06-10 09:59:16', NULL, NULL, NULL, NULL, NULL),
(270, 'Cookie', 'sandra.schmerler@web.de', '$2y$12$6s8kd80OXDY68bEFOEpB3O84Em7Jj7fLs7Sf6Q8hc2/aHvl.UWkl2', 1, '2026-05-20 17:38:25', '40afcbe213', NULL, '2026-05-20 17:23:46', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(271, 'Hoschinski', 'eric.dingfelder@gmx.de', '$2y$12$FC7cWpnfCmFgyNOK9CGmeO5kvnsKh9fuYnGdhgzogmUwFp/23ltdO', 1, '2026-06-10 14:44:20', '0b3ecd57cc', NULL, '2026-05-22 02:36:22', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(272, 'MandyHaenig', 'mandyhaenigzp@gmx.de', '$2y$12$N6LO1rV7iI/uMnUIRwfaGuOHWlXTLnyyDLs7uxj4m260C0caPUi9a', 5, '2026-05-29 13:47:12', '1bd20f21ae', NULL, '2026-05-22 12:31:01', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(273, 'Maik', 'maik-werner86@gmx.de', '$2y$12$1ayaWGm/vcawCjVP.aiUj.Ub1Ll3Ix2hy8Emr3pyc4sZm1.hsv6Bu', 1, '2026-05-23 08:07:40', '12e816deb6', NULL, '2026-05-23 07:32:45', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, '', 'https://strava.app.link/toWOkcw0m3b'),
(274, 'Bibfortuna', 'donbib@gmail.com', '$2y$12$DQhbPK/JAoimeIabmANCHO.BV6qPuMfsOlaZNo06OW.cUMFD7Wk/m', 2, '2026-05-24 15:57:06', 'ac2b54c0ee', NULL, '2026-05-23 16:10:33', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(275, 'Soheil', 'soheil_aslani@outlook.com', '$2y$12$s5f8dMmuxHXPjIdrvdjcwug.DMveV5C3H4r8YNaHw8aMlBExacL9K', 1, NULL, '19d89a1f49', NULL, '2026-05-23 19:43:00', 0, '70fca6a58c60c71b0541fb0d4f2bbb5bc25b134cc8552d7904b011fd19680c42', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(276, 'SUSEN', 'susensmail@web.de', '$2y$12$sGd.BkczwhpBje6vmg7ycODAZUM.di0/yRXWJ1NG7HuCyRq2elQXK', 1, '2026-05-24 12:39:07', '0c013d1415', NULL, '2026-05-24 12:34:03', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(277, 'Aszimon', 'aszimon@aol.com', '$2y$12$l08HymHkAUhOi00A4ZRjAO.f3qh/g6FVmVTU5A1e.iakKzKa/oPHy', 1, NULL, 'cf134a2636', NULL, '2026-05-24 12:45:45', 0, 'afe79c75a6fcf4b1f55c383be639cf6322a37284f188b0142f036b35fcf65735', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(278, 'Nicole', 'Nicky1783@web.de', '$2y$12$7sejLabwngIkIH7au7snOeQZCJ0yMLj/aM7HfN5hu7BcLDbU70Bt.', 1, NULL, 'e80073ddf4', NULL, '2026-05-24 15:50:10', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(279, 'Sina', 'kleebergsina@gmail.com', '$2y$12$eaTdg3NwSOQraLhvLYWQweM/r0SHT9LL64mXrQ44OSEESsfm7vKCC', 2, '2026-05-25 17:08:05', '6532d65a44', NULL, '2026-05-25 11:00:22', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(280, 'Fiedlnils', 'nils-1.1@gmx.de', '$2y$12$DRUpvyJpEHiV87r8z9qeN.kfHJvKLSPRAHfbK6tuKei0aqVQr0Mvi', 1, NULL, '892894b7a9', NULL, '2026-05-26 17:23:18', 1, NULL, NULL, '2026-06-10 14:03:22', '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(281, 'Fieldnils', 'notnivox@gmail.com', '$2y$12$S3nFwMwmIdYO2ROIxJQq7uEMxOPQTyPDcqzVTyhVpQAVt0VpShE0e', 1, '2026-06-10 14:04:48', 'ddad8d61f8', NULL, '2026-05-26 17:28:29', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(282, 'Carlo', 'Carlo.rost@gmx.de', '$2y$12$RtcQwCvvxGjy3eI3yjGHmu1pz7Jn31XZReRffLpCWRHs5lNoGDChK', 1, '2026-05-27 10:36:20', '0223bd8eed', NULL, '2026-05-27 10:33:22', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(283, 'Franzleistner', 'franzleiste@gmail.com', '$2y$12$rZfmyiG07ZRmBa9mq9RyxebHA6B.nmcWPpvfsDSpR2XZ0czESFTpi', 11, '2026-06-09 11:45:10', '90be32bc1e', NULL, '2026-05-27 14:36:40', 1, NULL, NULL, NULL, NULL, NULL, NULL, '', 'https://strava.app.link/6AK9F9FAu3b'),
(284, 'Maxvw', 'mvw91@gmx.de', '$2y$12$/BfvyF5NtptZRZiMrufjPeX2Z7AMBJ0FvS1dEDq4gy1Zds4A0b9ju', 1, '2026-05-28 16:59:37', 'c08b07ef66', NULL, '2026-05-28 14:34:11', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(285, 'FrankJ', 'dj-frankapple@gmx.de', '$2y$12$MEWwUStmNMfXK0GYulgZ/u3V76jT1as6tzvq4TZW21NrHUMPb6QOG', 1, '2026-05-29 11:46:50', '61ea0836fa', NULL, '2026-05-29 11:44:19', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(286, 'Amina', 'aminairmischer82@gmail.com', '$2y$12$HogOe4I57iq9jGrPLXhKG.ieViuJ05dwEtk22RHQlSz.5.ZD2qmSS', 1, NULL, '6101271f0f', NULL, '2026-06-04 13:01:24', 0, '8a9bb6c8b6329cb7a78543c9b467796cad05c7515f04664186c2d65addd70d4a', NULL, NULL, '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(287, 'Katjapetau15062016', 'katjapetau@web.de', '$2y$12$msfLyrKD5bc9cIIvden9FuzEsO99AzPX9G1ScZlfBBmW/JkNFYh8y', 1, '2026-06-10 13:43:33', '616d71c1ff', NULL, '2026-06-04 13:21:05', 1, NULL, NULL, '2026-06-10 13:40:48', '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(288, 'Kreise', 'iceapp@krei.se', '$2y$12$7Lu/tdTnKwN/607P..MEk..YkXsBHsdFWlvEVB6hqtxonMHAuXM9u', 1, '2026-06-04 15:45:06', '772513f542', NULL, '2026-06-04 15:39:28', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(289, 'Baby1linda', 'ljahrisch@yahoo.de', '$2y$12$bwm0QvoQ7R6rPsb1CJ40uehMTgyUCR9AVKLYNy.pG8dV9Vdr3.cmC', 3, '2026-06-05 13:26:29', 'd6f943dc98', NULL, '2026-06-05 13:23:27', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(290, 'AlineStephan', 'adoennicke@yahoo.de', '$2y$12$F9R6f1F/NFFdu1iUOBXFEONRuNQJKFlgjCcrQo0mXPfAKSpSnq.Pm', 1, NULL, '773518596c', NULL, '2026-06-07 15:06:29', 1, NULL, NULL, '2026-06-10 11:00:20', '2026-06-10 10:07:00', '2026-06-10 10:07:00', NULL, NULL, NULL),
(291, 'EisfachInfluenzer', 'malakwehbi@outlook.de', '$2y$12$fzmWV7VtcNXFDJ8KGZFEZu2iJQGbOTOXd1InvOYxgSuam2FyrggqO', 3, '2026-06-10 08:04:14', '73f34ac040', NULL, '2026-06-08 19:13:23', 1, NULL, NULL, '2026-06-10 09:59:17', NULL, NULL, NULL, NULL, NULL),
(292, 'KevinPoser', 'Kevin.poser09@web.de', '$2y$12$IbrHC9.TuL5/uMrvMPTdV.YpSCf3av3iWZql.LDc8u4cKRx2koUGq', 1, NULL, '5c155593b9', NULL, '2026-06-10 16:39:47', 0, 'bee7245d49028a1df219b1af78c115ee1124d5daa82163243e582d658841ac4f', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=293;

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
