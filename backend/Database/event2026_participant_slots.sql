-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 15. Mai 2026 um 20:33
-- Server-Version: 8.0.46
-- PHP-Version: 8.4.19

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
-- Tabellenstruktur für Tabelle `event2026_participant_slots`
--

CREATE TABLE `event2026_participant_slots` (
  `id` int NOT NULL,
  `registration_id` int NOT NULL,
  `event_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `route_key` varchar(32) NOT NULL DEFAULT 'classic_3',
  `distance_km` int NOT NULL,
  `pace_group` varchar(32) NOT NULL,
  `women_wave_opt_in` tinyint(1) NOT NULL DEFAULT '0',
  `public_name_consent` tinyint(1) NOT NULL DEFAULT '1',
  `jersey_interest` tinyint(1) NOT NULL DEFAULT '0',
  `clothing_interest` varchar(32) NOT NULL DEFAULT 'none',
  `jersey_size` varchar(10) DEFAULT NULL,
  `bib_size` varchar(10) DEFAULT NULL,
  `license_status` enum('pending_payment','licensed','cancelled') NOT NULL DEFAULT 'pending_payment',
  `legal_version_id` int NOT NULL,
  `legal_accepted_at` datetime NOT NULL,
  `legal_ip_hash` varchar(128) DEFAULT NULL,
  `legal_user_agent_hash` varchar(128) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Daten für Tabelle `event2026_participant_slots`
--

INSERT INTO `event2026_participant_slots` (`id`, `registration_id`, `event_id`, `user_id`, `full_name`, `email`, `route_key`, `distance_km`, `pace_group`, `women_wave_opt_in`, `public_name_consent`, `jersey_interest`, `clothing_interest`, `jersey_size`, `bib_size`, `license_status`, `legal_version_id`, `legal_accepted_at`, `legal_ip_hash`, `legal_user_agent_hash`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 23, 'Michael Knoof', 'michael.knoof@web.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-12 19:17:26', 'b42fdc7294a31054c4f25b472cd12a2273c0af4bf3c05be1f35214c0091ef557', '3275726d683cb831634aec8afb3b3e6d9b0bb995f64e1e9e3ebf1580e16b1b6d', '2026-03-12 18:17:26', '2026-05-12 19:34:13'),
(3, 3, 1, 1, 'Christian Helbig', 'ch_helbig@mail.de', 'epic_4', 180, '24_27', 0, 1, 1, 'kit_interest', '5', '5', 'licensed', 1, '2026-03-15 17:04:39', '82356b387172439b8b154042f191896ba31f67d7b58eca2e5f29c6f1971235ba', '53304b2e8c092ed66b5666499bea55dc9f17570f682a0413aeaf69034cef3f69', '2026-03-15 16:04:39', '2026-05-14 20:14:32'),
(4, 4, 1, 174, 'Michael Burgold', 'burgoldservice@gmail.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-15 18:29:06', '9ae6790f0522e0a7968935c752da07b5956e11558fcd238f6dbc47fd052ff86a', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-03-15 17:29:06', '2026-05-12 19:34:13'),
(5, 5, 1, 175, 'Lars Hiemann', 'lars-hiemann@web.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-15 23:21:19', 'fd64669011f31ffe5873ff7f67c18f60e5b2629cb667bc8477a2c5a8994d4ece', '69ea04d8e46c0585048e36e514e912d7b16736a6296438928c0dc27e78fb438d', '2026-03-15 22:21:19', '2026-05-12 19:34:13'),
(6, 6, 1, 177, 'Christian Schädel', 'christianschaedel1976@gmail.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 08:28:36', '34c5899c8af03998f098d94eecc0789ea185a69ee4d6ba0ae52145f4f99fc8be', 'fbf5aeabbd4aa99b92d7c471cab78c1606ecae1fa037a2550c06bc35b888d4af', '2026-03-16 07:28:36', '2026-05-12 19:34:13'),
(7, 7, 1, 178, 'Lars Schindler', 'schindlerlars7@web.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 15:30:45', '64ea98633547c529e8795c59dd2beedde16aaf6102c136bad736520cd568f75d', '69ea04d8e46c0585048e36e514e912d7b16736a6296438928c0dc27e78fb438d', '2026-03-16 14:30:45', '2026-03-16 14:34:54'),
(8, 8, 1, 179, 'Patrick Eppler', 'patrick-eppler@gmx.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 20:03:40', '5b54a40a55efe088925190bfd496f8c36646be4ca392fbbf1263852728f28da0', '26db7dc59ea05230b52dc533d1d4c9d2c6edb2d6be252bb45c069c21d634ca6c', '2026-03-16 19:03:40', '2026-05-12 19:34:13'),
(9, 9, 1, 180, 'Hannes Brenner', 'brennerhannes@yahoo.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 20:23:00', '474b6e70e89084b32954c399f8875c4d05d511545543e602ea2e8ea464648e99', '33a16152942fc374e82e9c23d6cb878d4caafeb98fef23c4db8923ce2fad3e28', '2026-03-16 19:23:00', '2026-05-12 19:34:13'),
(10, 10, 1, 181, 'Christian Kuhl', 'ckuhl123@yahoo.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 20:35:02', '4026e440bb7f9ee0196d9de674afde21f20c7920d2735b9ed043c086bd06c2de', '3275726d683cb831634aec8afb3b3e6d9b0bb995f64e1e9e3ebf1580e16b1b6d', '2026-03-16 19:35:02', '2026-05-12 19:34:13'),
(11, 11, 1, 182, 'Lukas Surma', 'lukas97.s@arcor.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-16 21:35:22', '7bf966a352fb879c5a7eccfc9bb4955e8059de091db710677e5b928dfe98b6bf', 'de1728e96a68bf815507c1ac19dc7ea3cf90f4eec4d95094ded41a462d302cd8', '2026-03-16 20:35:22', '2026-05-12 19:34:13'),
(12, 12, 1, 183, 'Nils Lose', 'nilslose@icloud.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-17 09:09:57', '40ef205590d0f0dd200e8167106d6541065860c64301e82c4a2df16c90a63400', '48da1af908be076363e16c00999867b2c05b0261ae4e010e737f12eae1e71aff', '2026-03-17 08:09:57', '2026-05-12 19:34:13'),
(13, 13, 1, 184, 'Florian Decker', 'quartal_keimzelle.3s@icloud.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-17 09:37:25', '26312057713ed47d5828bc77e517d912e5cdb65c9c88149b78c214b34c977beb', '515c4d163335c58ddd14e2fe49a170790676644d17803451886717916e952cc1', '2026-03-17 08:37:25', '2026-05-12 19:34:13'),
(14, 14, 1, 185, 'Nicole Neef', 'nine_@gmx.net', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-18 14:20:46', 'fe7bcf74df038c5604c329441b7f666528d849d522ad36dda05386185d99ea96', '43199383349c8f4b0ed5ef5e96de6419a3eb80db210ded7cdde6997b9e288a54', '2026-03-18 13:20:46', '2026-03-18 13:23:26'),
(15, 15, 1, 186, 'Vanessa Welz', 'welz.va@googlemail.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-19 19:15:03', 'fd1b52360d9637ae28fd832852081ebcc52bdc0ec54ea4a3339fa995c4195b3a', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-03-19 18:15:03', '2026-05-12 19:34:13'),
(16, 16, 1, 187, 'Judith von Ossowski', 'vonossowskijudith@yahoo.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-19 19:20:55', '5f43264afc7a9c2f37fb0c715190afa8d2875aeb8653cbd3c2be6d535b3d87d7', 'ff9b6d5d995c1983bdeff028fb2abdfca05db296c62989f1dd230e821d593b9b', '2026-03-19 18:20:55', '2026-05-12 19:34:13'),
(17, 17, 1, 189, 'Manja Seemann', 'manja.seemann@outlook.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-20 13:36:26', '9de5616e3e435d7848465fd3e63123523fedb837892eb216f92457b213e0c2bb', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-03-20 12:36:26', '2026-05-12 19:34:13'),
(18, 18, 1, 192, 'Anne Gottstein', 'anne.gottstein@web.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-24 07:54:37', 'ea773ce9915c035e0b255fb341cc87134b1ecb73865b4adaafe202d640e1b3c1', '69ea04d8e46c0585048e36e514e912d7b16736a6296438928c0dc27e78fb438d', '2026-03-24 06:54:37', '2026-03-24 06:56:37'),
(19, 19, 1, 156, 'Maximilian Lenk', 'thetasteofchemnitz@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-25 10:45:45', '654a2a06aaf40450fc359fb190be97b7f7b8624d1b2de192f2ce24d55127f41a', '36709a46e19405c3706894c673dbb5b2b55893ebfc03ce488a370fab29ef487a', '2026-03-25 09:45:45', '2026-04-19 20:00:49'),
(20, 20, 1, 194, 'Lennert Oechsner', 'oechsnerlennert@gmail.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-25 18:31:10', 'afbeb637fc2f24c7d2445eed28363d6cc0b712ccc29c29a99e1eb7140637d80d', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-03-25 17:31:10', '2026-05-12 19:34:13'),
(21, 21, 1, 115, 'Hagen Schanze', 'hagen.schanze@mail.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-30 21:26:15', '2f2df5a5faad76df7ff85f12e9d84433a9223a36cc92e69ceebf81be68f06266', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-03-30 19:26:15', '2026-03-30 19:26:15'),
(22, 22, 1, 74, 'Tim Tischendorf', 'tim.tischendorf@gmx.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-03-31 10:19:07', 'ddf10a07f80c4d585a6f2a0b0b906e64601d9b5a15df8efbad1b30edce10f195', '3ce8729efe3b35baaa6924f1c7a726dbf9f8a264815e98085c5be45b1fea22ed', '2026-03-31 08:19:07', '2026-03-31 08:21:20'),
(23, 23, 1, 202, 'Jim Kerzig', 'jimkerzig@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-08 08:58:31', 'cbf39ffc34450509489be242e8b12e2340ac2dc8e825e335c0e622646ad60f61', '36709a46e19405c3706894c673dbb5b2b55893ebfc03ce488a370fab29ef487a', '2026-04-08 06:58:31', '2026-04-08 07:00:34'),
(24, 24, 1, 203, 'Joerg Fleischer', 'joerg_fleischer@outlook.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-09 18:30:51', 'a03a6d533544758f51b1d4d32912b255dafed84b257b0910f28f475d988cd6c8', '9e408ca6249f2665579cec74c2153a6f35ff96b4daa450bbd3722a909f37ffdb', '2026-04-09 16:30:51', '2026-04-09 16:30:51'),
(25, 25, 1, 204, 'Tom Schaal', 'tom.schaal@gmx.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-10 07:08:54', '9bb0db7c48d72b0d643fa5d42ebc55fe12ac8a826cba2b7416082e62ba54fecb', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-04-10 05:08:54', '2026-04-10 05:08:54'),
(26, 26, 1, 205, 'Michael Roth', 'michael-r-90@web.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-12 15:24:17', '14f0f9899033f2e0bf2053e453ca79c6453b50833216ce515733ade53f79d6e3', '37fc26f1d9d30e27dfe33e440433fc4e1218deac8ea731a628557e2fef72a013', '2026-04-12 13:24:17', '2026-05-12 19:34:13'),
(27, 27, 1, 206, 'Tina Hübschmann', 'tina_hundro@web.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-14 19:41:59', '61e09194b9f41ac0d5329ac687d6e856769236df8a893b58761b8bb17bed7075', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-04-14 17:41:59', '2026-04-14 17:41:59'),
(28, 28, 1, 207, 'Hannes Löbel', 'kreisslhannes@web.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-16 07:11:00', '13074b0ade62a2a24f6e91b13d7f9a796f3e149d22dae81b7d25c5fe49fc37cc', 'c11f3f9943da004b48220d82cf9d5112b98cd02e742e1cf98b09e9ab11939221', '2026-04-16 05:11:00', '2026-05-12 19:34:13'),
(29, 29, 1, 208, 'Jörg Dani', 'joergdani66@gmail.com', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-16 15:03:05', 'f35d73ba9db582d28b391c349f4914639ef6bc0ade655fdca21432f09efc7db4', '387ae7aef0ff2cb88b68b8790a2f5eb8b677c19a765a3118517b46df17c55193', '2026-04-16 13:03:05', '2026-05-12 19:34:13'),
(30, 30, 1, 211, 'Martin Tietz', 'tietz.mar@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-19 12:31:50', '962c15206df198d55c8e905333cd77003e88b65956278529682a02c3a49d3fd1', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-04-19 10:31:50', '2026-04-19 10:35:53'),
(31, 31, 1, 214, 'Julia Seifert', 'julsei2004@gmail.com', 'classic_3', 140, 'unter_24', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-20 19:09:49', 'e6f640d0e9a9f884942f9cc270c17e9799505f7c153fbcbc85d4326e092e8b09', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-04-20 17:09:49', '2026-04-20 17:10:39'),
(32, 32, 1, 215, 'Richard Einenkel', 'richard.einenkel23@gmail.com', 'classic_3', 140, 'unter_24', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-20 19:13:42', 'ae7c298345d526f6a1353eca643f9c5525c951f1b362b96a93d23a257c0ab840', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-04-20 17:13:42', '2026-04-20 17:13:42'),
(33, 33, 1, 219, 'Marvin Nobis', 'marvin.nobis@googlemail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-25 15:10:04', '16f6d1585712bb75c9a101fe2f67eb4a22b0a7de6cd8321ab608079ea803aa6e', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-04-25 13:10:04', '2026-04-25 13:11:09'),
(34, 34, 1, 31, 'Yannick Runst', 'yannick.runst@gmx.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-25 22:38:57', '5476af3b235be724ace9406c073f5e46ffb8ab72b465372ee428c43dd2e9e491', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-04-25 20:38:57', '2026-04-25 20:39:45'),
(35, 35, 1, 221, 'Tom Winter', 'Sunjaay41@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-26 19:41:31', '28ad47c4db209535f07e9cf34faebac4cc068a1c2e95fead854ec4218cdf2589', '1da845b3609198128e48de3352efa8a788baf9b3319d5f9abb126eca001eb6e0', '2026-04-26 17:41:31', '2026-04-26 17:45:09'),
(36, 36, 1, 213, 'Sebastian Franke', 'sebastianfranke40@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-26 19:48:45', 'a2b4141ac22f3027bfdf8e82ca3f74ec8a43d2fd298ac4c57a639ad719c4d497', 'b8b7b6c444d10a277bdb3e57fed1a5b9071fe82a8ff0444f93f3d950f22fe665', '2026-04-26 17:48:45', '2026-04-26 17:58:51'),
(37, 37, 1, 222, 'Franz Schönfelder', 'franzschoenfelder123@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-27 19:17:37', 'bb3a44135a88df6dd90325621aca93fe7511621a9d118b32eaf6c083b366af1a', 'd9d5dc1e9c6ce5573c0f7c189d93043c9ee4cf0ada9c74c6a4062cb67dd7c9a2', '2026-04-27 17:17:37', '2026-04-27 17:18:14'),
(38, 38, 1, 223, 'Jürgen Wötzel', 'Juergenwoetzel@web.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-27 21:20:14', '6171a2c63105da1f60bcd9c921236fe27df517c0ea3706aa9c10c49eb504c2a4', 'ff9b6d5d995c1983bdeff028fb2abdfca05db296c62989f1dd230e821d593b9b', '2026-04-27 19:20:14', '2026-05-12 19:34:13'),
(39, 39, 1, 224, 'Mike Eckert', 'mike.eckert@gmx.net', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-27 22:06:41', '85549029b560934d7483b258826ca7b65d3cd1b2ee790dc976abd72105eccc9e', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-04-27 20:06:41', '2026-05-12 19:34:13'),
(40, 40, 1, 112, 'Silvio Rebentisch', 'silvio73@gmail.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-04-30 10:42:43', '323b89779b97c3947a406777ce8bebcbfc1147bcb7152eec7bc86ef23f3069c5', '387ae7aef0ff2cb88b68b8790a2f5eb8b677c19a765a3118517b46df17c55193', '2026-04-30 08:42:43', '2026-04-30 08:44:09'),
(41, 41, 1, 68, 'Elia Möbius', 'eliamoebius2@web.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-01 15:55:53', '6ac67518b0ae71cd9de2e34cfd917cde158e1e27a8d796bf0ce511e4ddc76de8', '48da1af908be076363e16c00999867b2c05b0261ae4e010e737f12eae1e71aff', '2026-05-01 13:55:53', '2026-05-01 13:56:49'),
(42, 42, 1, 225, 'Immanuel Göckeritz', 'ihm_goeck@gmx.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-01 16:41:02', 'c77adf6b3abcc26bf9cf5e6e166d4e685d49bb4a4c1669d7b3b7b661e1715d3d', 'd84e942950de2b93644836b7c61977321e139bd06e9d482ef8e048a4d03f6f3f', '2026-05-01 14:41:02', '2026-05-01 14:45:16'),
(43, 43, 1, 226, 'Jörg Hilbert', 'hilbert.joerg@gmx.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-01 22:35:02', 'e8d8bc043ff74b180f5e74f27ee7de156cd499df516d3ed552ba23e186dbd49f', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-01 20:35:02', '2026-05-12 19:34:13'),
(44, 44, 1, 217, 'Finn Dani', 'finn.dani92@gmail.com', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-03 09:48:42', '960aa7da82e5507275cae4ee13d6898bdda0ec540602d3ff9d7f99cebdfd046d', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-03 07:48:42', '2026-05-12 19:34:13'),
(45, 45, 1, 227, 'Pascal Burckhardt', 'pascal.burckhardt@freenet.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-03 19:52:56', '7eb7bae36b174ba441477ec75534d3acad68254dae49dbcc2e34517a98a5205d', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-05-03 17:52:56', '2026-05-12 19:34:13'),
(46, 46, 1, 228, 'Andreas Lenk', 'andreas.lenk@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-04 10:47:21', '418140c4347672eb895e6eb8f9547081838aa5f439821724f2e17df7f410d8b4', '0bc0366901d4d4ab4879cccf0b37b433ae2ce77993d3e15880a004e6cc5dc58e', '2026-05-04 08:47:21', '2026-05-04 08:48:53'),
(47, 47, 1, 11, 'Manuel Eberhardt', 'cptnmanu@web.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-04 22:03:40', '070d9fa428fe942866f002cb6408ef9e3d2b46f522dfc424a2d24d1afa27163a', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-04 20:03:40', '2026-05-12 19:34:13'),
(48, 48, 1, 62, 'Raik Helbig', 'raikhelbig@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-05 16:08:05', '5291f64d16bed31e222ab0ee3fb44522acfa28d6b225e1fc476360e8c74dd486', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-05 14:08:05', '2026-05-10 17:40:00'),
(49, 49, 1, 94, 'Jens Helbig', 'jhhot@t-online.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-05 18:30:25', '81e28b99ab9c1564ff6ec070469d87168c4a80637bfbc743661b41c13840d047', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-05 16:30:25', '2026-05-05 16:31:39'),
(50, 50, 1, 229, 'Martin Kutter', 'martin@nea-art.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-05 18:39:59', '4ad2843188053a5ed306efb582ced09df87884f2b169d1e7305b06ac915d1e1c', '9319cb88ccf0deaeba195f92fd87703a69a8f6f5c293d6c2d56aeaf87daf6433', '2026-05-05 16:39:59', '2026-05-05 17:52:47'),
(51, 51, 1, 230, 'Bruno Kutter', 'info@brunokutter.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-05 19:56:02', '4ad2843188053a5ed306efb582ced09df87884f2b169d1e7305b06ac915d1e1c', '9319cb88ccf0deaeba195f92fd87703a69a8f6f5c293d6c2d56aeaf87daf6433', '2026-05-05 17:56:02', '2026-05-05 17:56:02'),
(52, 52, 1, 231, 'Hendrik Münch', 'hendrikxmuench@gmx.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-06 07:21:06', '2e1e80d2b9e28086db7db98986b07224fc39b9a4f1faf8556cb49cc949e26e9f', 'a9e40cd29e17b848ebb6ef00a074ec5487999699a97e96504961b4e8f60f7277', '2026-05-06 05:21:06', '2026-05-06 05:30:41'),
(53, 53, 1, 232, 'Danilo Koban', 'darth_danilo@gmx.de', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-06 11:14:37', '5e02d7cb89670ae2ddccb238da9cf7ffc7ab829ed6a5b0c3cde18ea23a984cd9', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-06 09:14:37', '2026-05-08 16:54:02'),
(54, 54, 1, 43, 'Kati Pioßek', 'kadomi03@gmx.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-06 18:05:19', '686916635a4b0bf04621f3ceb317a1c8937749f352cd3081672c68a457368a77', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-06 16:05:19', '2026-05-06 16:07:00'),
(55, 55, 1, 233, 'Enrico', 'enrico_kuehn@web.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-07 12:33:38', '96245f398c047638526314c82dc48de0cd2f3dba61d898bd989e83a79c5f0e01', '0f1388d56fba2937b2bfd4712035c634df7fa6abbc6f8ebef669d076b201d042', '2026-05-07 10:33:38', '2026-05-07 10:35:01'),
(56, 56, 1, 235, 'Ralf Krumpelt', 'ralfundco@arcor.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-07 17:24:30', 'd1cf3562255f6c88823c52b2052dfe66209376ae3ca03fdd0279ff75ec6c9cd4', 'a533a05fa5ccb081213c7a658788a896d542458dad111fc996fea2b06d21ac31', '2026-05-07 15:24:30', '2026-05-07 15:27:53'),
(57, 57, 1, 236, 'Steffen Walther', 'filzer85@gmail.com', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-07 17:33:54', '15bfd0993a49c7c016c2bf9b9f4cd28c46fbd1ac680d02a19f6afbbdf9a416dd', '0bc0366901d4d4ab4879cccf0b37b433ae2ce77993d3e15880a004e6cc5dc58e', '2026-05-07 15:33:54', '2026-05-07 15:37:27'),
(58, 58, 1, 92, 'Daniel Türpe', 'daniel-tuerpe@web.de', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-08 13:59:46', 'ea6eeea3a98be0441b834e6cec5d49d6859434bfa7d1c177e68570e7e6c891f9', '1667ff80f9c32f8fc2ef206e89aec023debca38b9d45564a566589045392b831', '2026-05-08 11:59:46', '2026-05-08 12:02:27'),
(59, 59, 1, 234, 'Andreas', 'leuandreas@web.de', 'epic_4', 180, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-08 20:14:14', '34037e95f38930f925906ec8ac310edd3e883aac0306968532de7b7e62234a33', 'c280e4ed6486cd788744c294a675d5d35e202ce4598ab510e1c3275a3a456c67', '2026-05-08 18:14:14', '2026-05-08 18:15:24'),
(60, 60, 1, 238, 'Jan Benndorf', 'jan.benndorf@outlook.de', 'classic_3', 140, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-09 09:52:53', '2a0e91df12a1adaddc7d524bfc6b71e1c5f218c80ca7af2dfc0ed4658484a455', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-05-09 07:52:53', '2026-05-09 07:54:21'),
(61, 61, 1, 239, 'Moritz Natzschka', 'moritz_natzschka@web.de', 'family_2', 75, 'family', 0, 0, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-09 18:40:11', 'a90f0db5324cf79f8eb112f609b8e92efb37e3d7265223fc01410dc6994bd81d', '4987deb46b5409dbcc9d3ee75633a1ba0cdab11924a2e9af2bbaf8944db15222', '2026-05-09 16:40:11', '2026-05-09 16:41:23'),
(62, 62, 1, 241, 'Patrick Burckhardt', 'patrick.burckhardt@gmx.de', 'epic_4', 180, '24_27', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-10 18:40:34', '12825ee353726b2f98bd338d45984229a114e379df4b83b304eea16030336e5e', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-05-10 16:40:34', '2026-05-10 16:42:25'),
(63, 63, 1, 242, 'Kai Kirchhof', 'kai.kirchhof@googlemail.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-10 19:21:25', '06616ddbeeb74abdcf6b4eca059e264074520ea4b647cd96cfc95e50318ed134', '0bc0366901d4d4ab4879cccf0b37b433ae2ce77993d3e15880a004e6cc5dc58e', '2026-05-10 17:21:25', '2026-05-10 17:22:36'),
(64, 64, 1, 243, 'Steffen Neumann', 'steffen-n@t-online.de', 'classic_3', 140, 'ueber_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-11 14:25:05', '3d8d830aee1b0eaf91ebb909f75446d3ccde8a37f0a22830de3745653339f116', 'c378273f7787788aecfcfef0c93ead30970e2271e3055640af88a3f125e0ce2f', '2026-05-11 12:25:05', '2026-05-12 08:51:57'),
(65, 65, 1, 244, 'Thomas Müller', 'kadomi03@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-11 16:46:40', '91853ad1ec3611311bf85b41e4f0eb9ad859b2bf2df8ce4a217b7039e816a285', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-11 14:46:40', '2026-05-11 14:46:40'),
(66, 66, 1, 247, 'Ronny Ziemann', 'amsp23@gmail.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-12 16:28:19', '08797de42ea3db8781c8f1ea445b4c5090e0ed2a514fd0f1b719269826ad8c1c', 'e3a88b103a54f7938a76429a527a0c6a0dcadf3841b2fac67f4883e5554421aa', '2026-05-12 14:28:19', '2026-05-12 14:28:19'),
(67, 67, 1, 249, 'Eddy Winter', 'eddy.winter2010@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-12 20:34:35', '36e23a0366f31f5fd12c615fc16e934274add5925b8d3395bc402192620450fd', 'aa9807785fa8e9e9dcbd0c55192ed182369aa85e40aef3cfc81d2ab65efb59a6', '2026-05-12 18:34:35', '2026-05-12 18:35:42'),
(68, 68, 1, 250, 'Jasmin Köhler', 'jk.abc.9999@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-12 20:56:22', 'dcd92c226030ea08181c55af656f3cbcc635db0f9a3f54c1a1d90d68d5445e84', 'ce96a196fc9153c812134f19461c6e83d999ccfa1c0535f7c69f50a483fa19f9', '2026-05-12 18:56:22', '2026-05-12 18:59:41'),
(69, 69, 1, 53, 'Daniel Götze', 'danielgoetze1982@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-14 15:25:02', 'b7e41cd5d4ff7531a29d6f512abd7d41ec0ecb04df0cd789d89ada87472b6caf', 'ff9b6d5d995c1983bdeff028fb2abdfca05db296c62989f1dd230e821d593b9b', '2026-05-14 13:25:02', '2026-05-14 13:26:07'),
(70, 70, 1, 253, 'Klaus Miraß', 'klausmirass85@gmx.de', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 13:43:40', '3d87bb42a9adbd9b53305fb32e74cb9bc527df1bdef47b7d7bb799a8cf1ec95e', 'ff9b6d5d995c1983bdeff028fb2abdfca05db296c62989f1dd230e821d593b9b', '2026-05-15 11:43:40', '2026-05-15 11:48:07'),
(71, 71, 1, 254, 'Lysann Naumann', 'klausmirass85@gmail.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 13:51:16', '3d87bb42a9adbd9b53305fb32e74cb9bc527df1bdef47b7d7bb799a8cf1ec95e', 'ff9b6d5d995c1983bdeff028fb2abdfca05db296c62989f1dd230e821d593b9b', '2026-05-15 11:51:16', '2026-05-15 11:52:37'),
(72, 72, 1, 255, 'Stefan Vogel', 'stv79@icloud.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 13:51:56', '039d8f7fb5e7abb41e631339f0fe77fde0c87ba95fb0ae794932d605b836772f', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-05-15 11:51:56', '2026-05-15 11:53:29'),
(78, 73, 1, 203, 'Jörg Fleischer', 'joerg_fleischer@outlook.com', 'family_2', 75, 'family', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 14:20:18', NULL, NULL, '2026-05-15 12:20:56', '2026-05-15 12:21:13'),
(79, 74, 1, 256, 'Maximilian Schwentke', 'maxi2727@icloud.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 16:08:18', 'c9ea13b60a5c4e7b5676fa6114cc7e7b5f59ba42a021abf275e33d2e23e5ab1c', '411a78fc3aaba7d8eb56ebc73f42b1d2b9ed33d324541ee6493cc61162e1ff8d', '2026-05-15 14:08:18', '2026-05-15 14:08:18'),
(80, 75, 1, 257, 'Peer Kirchhof', 'peer.kirchhof@gmail.com', 'classic_3', 140, '27_30', 0, 1, 0, 'none', NULL, NULL, 'licensed', 1, '2026-05-15 17:45:43', '35fdba7736990df4448e9ce885a6ac2160d49a0acfe649415a530d8835274d88', 'e97887180ce58770004b06c8a8b7fbdf647d5aadee30f7814e858e5ed4ff0e1a', '2026-05-15 15:45:43', '2026-05-15 15:45:43');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `event2026_participant_slots`
--
ALTER TABLE `event2026_participant_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_event2026_slot_reg` (`registration_id`),
  ADD KEY `fk_event2026_slot_legal` (`legal_version_id`),
  ADD KEY `idx_event2026_slot_event_license` (`event_id`,`license_status`),
  ADD KEY `idx_event2026_slot_user` (`event_id`,`user_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `event2026_participant_slots`
--
ALTER TABLE `event2026_participant_slots`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `event2026_participant_slots`
--
ALTER TABLE `event2026_participant_slots`
  ADD CONSTRAINT `fk_event2026_slot_event` FOREIGN KEY (`event_id`) REFERENCES `event2026_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_event2026_slot_legal` FOREIGN KEY (`legal_version_id`) REFERENCES `event2026_legal_versions` (`id`),
  ADD CONSTRAINT `fk_event2026_slot_reg` FOREIGN KEY (`registration_id`) REFERENCES `event2026_registrations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
