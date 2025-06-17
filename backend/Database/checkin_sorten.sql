-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 17. Jun 2025 um 07:34
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
-- Tabellenstruktur für Tabelle `checkin_sorten`
--

CREATE TABLE `checkin_sorten` (
  `id` int NOT NULL,
  `checkin_id` int NOT NULL,
  `sortenname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bewertung` decimal(2,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `checkin_sorten`
--

INSERT INTO `checkin_sorten` (`id`, `checkin_id`, `sortenname`, `bewertung`) VALUES
(23, 12, 'Cookies ', '4.2'),
(24, 12, 'Schokolade', '4.2'),
(27, 14, 'Schoko/Vanille', '4.4'),
(49, 39, 'Schoko/Vanille', '4.7'),
(67, 60, 'Waldmeister', '4.0'),
(68, 61, 'Vanille', '4.5'),
(69, 62, 'Joghurt-Sanddorn', '4.6'),
(102, 71, 'Mango', '4.5'),
(103, 70, 'Erdbeer/Vanille', '4.5'),
(111, 78, 'Schoko/Vanille', '4.9'),
(123, 82, 'Spaghetti Eis', '5.0'),
(124, 83, 'Milchreis', '4.8'),
(125, 83, 'Butterkeks', '4.8'),
(130, 88, 'Karamell', '4.9'),
(131, 88, 'Weiße Schokolade', '4.9'),
(152, 103, 'Schoko/Vanille', '4.5'),
(163, 113, 'Schoko/Vanille', '4.4'),
(164, 114, 'Schoko/Vanille ', '4.4'),
(165, 115, 'Cookies ', '5.0'),
(170, 116, 'Schokolade', '3.0'),
(171, 116, 'Himbeere', '5.0'),
(194, 126, 'Milchreis', '4.7'),
(197, 127, 'Erdbeere', '4.4'),
(198, 127, 'Himbeerkuss', '4.4'),
(199, 128, 'Stracciatella', '4.3'),
(206, 130, 'Schokolade', '4.8'),
(207, 130, 'Mango', '2.8'),
(226, 129, 'Schokolade', '4.7'),
(227, 129, 'Tiramisu', '4.7'),
(228, 129, 'Marshmallow', '4.7'),
(235, 131, 'Erdbeere', '2.0'),
(236, 131, 'Schokolade', '4.3'),
(240, 136, 'Schoko/Vanille', '5.0'),
(247, 138, 'Schokolade', '4.5'),
(248, 139, 'Mango', '4.9'),
(253, 140, 'Raffaello ', '3.0'),
(254, 140, 'Bueno', '4.5'),
(261, 143, 'Schoko/Vanille ', '4.8'),
(272, 145, 'Erdbeere', '4.9'),
(274, 147, 'Schokolade', '4.0'),
(276, 149, 'Pistazie Dubai', '4.8'),
(277, 149, 'Lavendel Mango', '4.8'),
(278, 149, 'Sauerkirsch', '4.6'),
(279, 149, 'Aprikose', '4.6'),
(281, 151, 'Schoko/Vanille', '4.2'),
(282, 152, 'Schoko/Vanille', '4.8'),
(285, 154, 'Lady Madonna', '5.0'),
(286, 154, 'Joghurt Kirsch', '5.0'),
(287, 154, 'Mango ', '5.0'),
(288, 154, 'Treuener Schokolade', '5.0'),
(296, 123, 'Vanille/Mango', '5.0'),
(305, 160, 'Schoko-Trüffel ', '4.9'),
(306, 160, 'Erdbeere', '4.6'),
(307, 161, 'Melone/Mango', '3.8'),
(308, 162, 'Brombeere', '4.5'),
(309, 162, 'Schmand-Heidelbeere', '5.0'),
(310, 163, 'Augustus der Starke', '3.9'),
(336, 169, 'Pistazie', '4.3'),
(339, 170, 'Saure Apfelringe', '5.0'),
(340, 170, 'Dunkle Schokolade', '5.0'),
(341, 171, 'Spaghetti Eis', '5.0'),
(342, 171, 'Pistazie ', '5.0'),
(343, 172, 'Stracciatella ', '5.0'),
(344, 172, 'Mango ', '5.0'),
(345, 172, 'Schokolade', '5.0'),
(346, 172, 'Salted Caramel ', '5.0'),
(348, 174, 'Stracciatella ', '4.8'),
(349, 175, 'Schoko/Vanille', '4.1'),
(350, 176, 'Schokolade', '5.0'),
(351, 168, 'Rhabarber-Kokos', '5.0'),
(352, 167, 'Apfelringe ', '4.9'),
(353, 167, 'Smarties', '5.0'),
(354, 166, 'Butterkeks ', '4.9'),
(355, 166, 'Weiße Schokolade ', '4.4'),
(356, 165, 'Rhabarber ', '4.7'),
(357, 164, 'Amadeus Style ', '4.9'),
(358, 164, 'Limette Gurke', '4.9'),
(359, 159, 'Bienenstich', '4.9'),
(360, 159, 'Quacota', '4.9'),
(361, 156, 'Vanille/Rhabarber ', '5.0'),
(362, 155, 'Birne-Zimt ', '4.8'),
(363, 155, 'Gesalzenes Karamell mit Erdnüssen ', '4.8'),
(364, 153, 'Limoncello ', '4.8'),
(365, 153, 'Kinder Bueno ', '4.8'),
(366, 144, 'Stracciatella ', '4.3'),
(367, 144, 'Schokolade ', '4.7'),
(368, 144, 'Mango ', '4.4'),
(369, 142, 'Salted-Butter-Caramel', '4.7'),
(370, 142, 'Malaga', '4.3'),
(371, 141, 'Schoko/Vanille', '4.5'),
(372, 137, 'Joghurt Rote Grütze', '4.8'),
(373, 137, 'Schoko-Mint', '4.8'),
(374, 135, 'Zimt', '4.7'),
(375, 134, 'Zitrone ', '4.6'),
(376, 134, 'Weiße Schoko-Crisp', '4.8'),
(377, 125, 'Caipirinha ', '4.4'),
(378, 125, 'Mango ', '3.9'),
(379, 125, 'Schokolade', '4.8'),
(380, 122, 'Gummibären ', '4.6'),
(381, 112, 'Vanille/Erdbeere', '4.0'),
(382, 102, 'Eierlikör-Nougat', '4.6'),
(383, 90, 'Waldbeere', '4.8'),
(384, 90, 'Schokolade', '4.3'),
(385, 79, 'Eisbecher \"Orion\"', '4.5'),
(386, 77, 'Amerettini ', '4.9'),
(387, 76, 'Weiße Schokolade ', '4.0'),
(388, 75, 'Butterkeks', '4.7'),
(389, 74, 'Schoko/Vanille', '4.6'),
(390, 73, 'Stracciatella', '3.9'),
(391, 73, 'Amarena', '3.4'),
(392, 72, 'Vanille/Karamell', '3.0'),
(393, 69, 'Cheesecake-Waldbeere', '4.5'),
(394, 68, 'Schoko-Kirsch', '5.0'),
(395, 68, 'Baileys', '4.9'),
(396, 67, 'Eierlikör-Nougat', '4.8'),
(397, 67, 'Quark-Zitrone', '4.7'),
(398, 66, 'Himbeere', '4.6'),
(399, 66, 'Nougat', '4.6'),
(400, 59, 'Schoko/Vanille', '3.4'),
(401, 58, 'Lemoncurd', '4.8'),
(402, 58, 'Mohn Marzipan ', '4.6'),
(403, 57, 'Stracciatella', '2.8'),
(404, 57, 'Pfirsich-Maracuja', '2.0'),
(405, 55, 'Stracciatella', '2.5'),
(406, 54, 'Wildpreiselbeere', '4.6'),
(407, 53, 'Marzipan', '5.0'),
(408, 53, 'Cookies', '5.0'),
(409, 52, 'Heidelbeere', '4.6'),
(410, 26, 'Cookies', '4.8'),
(411, 26, 'Bella Ciao', '4.8'),
(412, 25, 'Heidelbeere', '3.9'),
(413, 24, 'Zimt ', '4.9'),
(414, 24, 'Malaga ', '4.7'),
(415, 23, 'Schoko/Vanille', '4.7'),
(416, 22, 'Schoko-Praline', '4.8'),
(417, 21, 'Mango', '4.3'),
(418, 21, 'Cookies', '4.3'),
(419, 20, 'Milchreis', '4.9'),
(420, 19, 'Dunkle Schokolade', '4.5'),
(421, 18, 'After Eight', '4.8'),
(422, 17, 'Kalter Hund', '4.9'),
(423, 16, 'gebrannte Mandeln', '4.9'),
(424, 11, 'Erdbeerkäsekuchen ', '4.6'),
(425, 10, 'Weiße Schokolade - Himbeere', '4.7'),
(426, 10, 'Nuss-Nougat', '4.7'),
(427, 10, 'Chilli Schokolade', '4.8'),
(428, 10, 'Dubai Style', '4.6'),
(429, 9, 'Bueno', '4.7'),
(430, 7, 'Cookies', '5.0'),
(431, 7, 'Salted Caramel', '5.0'),
(432, 7, 'Brombeer Holunder', '5.0'),
(433, 6, 'Erdnuss', '5.0'),
(434, 6, 'Weiße Schokolade ', '4.9'),
(435, 5, 'Schokolade', '2.6'),
(436, 5, 'Heidelbeere', '3.8'),
(437, 4, 'Salted Caramel', '4.8'),
(438, 3, 'Amarena-Kirsch', '4.5'),
(439, 3, 'Cookies', '4.5'),
(440, 2, 'Nogger', '3.5'),
(441, 2, 'Tiramisu', '3.3'),
(445, 180, 'Joghurt-Heidelbeere', '4.5'),
(446, 180, 'Schokolade ', '4.5'),
(449, 179, 'Trüffel', '3.8'),
(450, 178, 'Weiße Schokolade - Himbeere', '4.6'),
(453, 181, 'Kinder Bueno', '4.8'),
(454, 182, 'Schokolade', '4.2'),
(455, 182, 'Erdbeere', '4.2'),
(456, 183, 'Raffaello ', '4.0'),
(457, 184, 'Nutella-Yoghurt ', '3.5'),
(458, 184, 'Hasenuss', '4.0'),
(459, 185, 'Raffaello', '4.9'),
(460, 185, 'Waldmeister', '4.6'),
(461, 185, 'Maracuja', '5.0'),
(462, 185, 'Himbeere', '5.0'),
(463, 186, 'Erdbeer/Vanille ', '4.8'),
(466, 187, 'Gesalzenes Karamel', '3.0'),
(467, 188, 'Himbeere', '4.1'),
(468, 188, 'Bacio ', '4.2'),
(469, 189, 'Schoko/Vanille ', '4.6'),
(470, 190, 'Schoko/Vanille', '4.8'),
(471, 191, 'Bier ', '4.7'),
(472, 191, 'Nutella ', '5.0'),
(473, 191, 'Pistazie', '4.4'),
(474, 191, 'Mango', '4.6'),
(479, 192, 'Himbeer-Honigmelone', '4.6'),
(480, 192, 'Rocher', '4.2'),
(481, 193, 'Banane ', '4.0'),
(482, 193, 'Pfirsich-Joghurt ', '5.0'),
(483, 194, 'Vanille ', '3.6'),
(484, 194, 'Himbeere', '4.9');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD PRIMARY KEY (`id`),
  ADD KEY `checkin_id` (`checkin_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=485;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `checkin_sorten`
--
ALTER TABLE `checkin_sorten`
  ADD CONSTRAINT `checkin_sorten_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
