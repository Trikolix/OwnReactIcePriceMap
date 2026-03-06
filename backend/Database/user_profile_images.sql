-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 10.35.233.205:3306
-- Erstellungszeit: 03. Feb 2026 um 13:58
-- Server-Version: 8.0.44
-- PHP-Version: 8.4.14

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
-- Tabellenstruktur für Tabelle `user_profile_images`
--

CREATE TABLE `user_profile_images` (
  `user_id` int NOT NULL,
  `avatar_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `user_profile_images`
--

INSERT INTO `user_profile_images` (`user_id`, `avatar_path`, `updated_at`) VALUES
(1, 'uploads/user_avatars/user_1_69136960d30162.58408292.jpg', '2025-11-11 16:50:40'),
(2, 'uploads/user_avatars/user_2_690ef6e1443613.15412890.jpg', '2025-11-08 07:53:05'),
(4, 'public/assets/comic-avatars/eisbaer.png', '2025-11-11 20:59:10'),
(8, 'public/assets/comic-avatars/Lauefer.png', '2026-01-31 00:00:26'),
(13, 'public/assets/comic-avatars/Cowboy.png', '2025-11-20 13:18:00'),
(22, 'uploads/user_avatars/user_22_690f4bc5510592.94680690.jpg', '2025-11-08 13:55:17'),
(23, 'public/assets/comic-avatars/hund.png', '2025-11-15 21:25:58'),
(53, 'public/assets/comic-avatars/Radfahrer.png', '2025-11-11 08:50:28'),
(77, 'uploads/user_avatars/user_77_691b8941eff741.56070532.jpg', '2025-11-17 20:44:49'),
(118, 'uploads/user_avatars/user_118_690e52bf509122.84942112.jpg', '2025-11-07 20:12:47'),
(125, 'uploads/user_avatars/user_125_690f737e4993e8.85010394.jpg', '2025-11-08 16:44:46');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `user_profile_images`
--
ALTER TABLE `user_profile_images`
  ADD PRIMARY KEY (`user_id`);

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `user_profile_images`
--
ALTER TABLE `user_profile_images`
  ADD CONSTRAINT `fk_user_profile_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
