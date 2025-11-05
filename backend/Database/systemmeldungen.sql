-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 05. Nov 2025 um 08:19
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
-- Tabellenstruktur für Tabelle `systemmeldungen`
--

CREATE TABLE `systemmeldungen` (
  `id` int NOT NULL,
  `titel` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `nachricht` text COLLATE utf8mb4_general_ci NOT NULL,
  `erstellt_am` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `systemmeldungen`
--

INSERT INTO `systemmeldungen` (`id`, `titel`, `nachricht`, `erstellt_am`) VALUES
(5, 'Jetzt neu: Challenges', '🍦 Lust auf neue Eisdielen-Abenteuer? 😋\nIhr wollt neue Spots entdecken, sucht nach Inspiration oder wollt euch einfach mal herausfordern?\n\n👉 Dann probiert jetzt die Challenge-Funktion! 🎯\nDabei wird euch eine zufällige Eisdiele in eurer Umgebung vorgeschlagen – und ihr habt wahlweise 24 Stunden ⏱️ oder 7 Tage 📆 Zeit, dort ein leckeres Eis zu genießen 🍨 und einzuchecken ✅.\n\n✨ Viel Spaß beim Ausprobieren und Schlecken! ✨\n\n➡️ Ihr findet das Ganze im Menü unter „Challenges“ 📲.\n\n💡 PS: Die Funktion ist noch in der Test- bzw. Erprobungsphase 🛠️. Belohnungen wie EP und Awards 🏆 werden bald ergänzt – aber ihr könnt schon jetzt fleißig Challenges abschließen und sammeln! 🎉', '2025-09-14 10:15:22'),
(6, 'Neue Features: 👥 Gruppen-Check-ins & Nutzer des Monats! 🌟', 'Endlich ist das neue Feature da: Verlinke deine Freunde bei eurem Eis-Date und zeigt gemeinsam, wo ihr unterwegs wart! 💬🍨\n\nAußerdem neu: die Nutzer(innen) des Monats. 🏆🗓️\nOben links findest du jetzt die aktuelle Liste. Sie wird zu Beginn jedes Monats anhand eurer Aktivitäten aktualisiert.\n\nMit etwas Einsatz kannst auch du unser nächster Nutzer des Monats werden – für besonders aktive Ice-Fans! ❄️', '2025-10-05 14:03:43');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `systemmeldungen`
--
ALTER TABLE `systemmeldungen`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `systemmeldungen`
--
ALTER TABLE `systemmeldungen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
