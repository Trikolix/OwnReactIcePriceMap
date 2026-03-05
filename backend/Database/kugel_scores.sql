-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: trikolix.lima-db.de:3306
-- Erstellungszeit: 25. Nov 2025 um 20:49
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
-- Struktur des Views `kugel_scores`
--

CREATE ALGORITHM=UNDEFINED DEFINER=`USER439770_pmasv`@`%` SQL SECURITY INVOKER VIEW `kugel_scores`  AS   with `bewertete_checkins` as (select `c`.`nutzer_id` AS `nutzer_id`,`c`.`eisdiele_id` AS `eisdiele_id`,`c`.`geschmackbewertung` AS `geschmackbewertung`,`c`.`waffelbewertung` AS `waffelbewertung`,(case when (`c`.`preisleistungsbewertung` is null) then `c`.`größenbewertung` else `c`.`preisleistungsbewertung` end) AS `preisleistungsbewertung`,(case when (`c`.`waffelbewertung` is null) then `c`.`geschmackbewertung` else (((4 * `c`.`geschmackbewertung`) + `c`.`waffelbewertung`) / 5.0) end) AS `geschmacksfaktor`,round(((0.7 * (case when (`c`.`waffelbewertung` is null) then `c`.`geschmackbewertung` else (((4 * `c`.`geschmackbewertung`) + `c`.`waffelbewertung`) / 5.0) end)) + (0.3 * (case when (`c`.`preisleistungsbewertung` is null) then `c`.`größenbewertung` else `c`.`preisleistungsbewertung` end))),4) AS `score` from `checkins` `c` where ((`c`.`typ` = 'Kugel') and (`c`.`geschmackbewertung` is not null) and ((`c`.`größenbewertung` is not null) or (`c`.`preisleistungsbewertung` is not null)))), `nutzer_scores` as (select `bewertete_checkins`.`eisdiele_id` AS `eisdiele_id`,`bewertete_checkins`.`nutzer_id` AS `nutzer_id`,count(0) AS `checkin_count`,avg(`bewertete_checkins`.`score`) AS `durchschnitt_score`,avg(`bewertete_checkins`.`geschmacksfaktor`) AS `durchschnitt_geschmacksfaktor`,avg(`bewertete_checkins`.`preisleistungsbewertung`) AS `durchschnitt_preisleistung`,avg(`bewertete_checkins`.`geschmackbewertung`) AS `durchschnitt_geschmack` from `bewertete_checkins` group by `bewertete_checkins`.`eisdiele_id`,`bewertete_checkins`.`nutzer_id`), `gewichtete_scores` as (select `nutzer_scores`.`eisdiele_id` AS `eisdiele_id`,`nutzer_scores`.`nutzer_id` AS `nutzer_id`,sqrt(`nutzer_scores`.`checkin_count`) AS `gewicht`,(`nutzer_scores`.`durchschnitt_score` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_score`,(`nutzer_scores`.`durchschnitt_preisleistung` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_preisleistung`,(`nutzer_scores`.`durchschnitt_geschmack` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmack`,(`nutzer_scores`.`durchschnitt_geschmacksfaktor` * sqrt(`nutzer_scores`.`checkin_count`)) AS `gewichteter_geschmacksfaktor` from `nutzer_scores`) select `g`.`eisdiele_id` AS `eisdiele_id`,round((sum(`g`.`gewichteter_score`) / nullif(sum(`g`.`gewicht`),0)),2) AS `finaler_kugel_score`,round((sum(`g`.`gewichteter_geschmack`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmack`,round((sum(`g`.`gewichteter_geschmacksfaktor`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_geschmacksfaktor`,round((sum(`g`.`gewichteter_preisleistung`) / nullif(sum(`g`.`gewicht`),0)),2) AS `avg_preisleistung` from `gewichtete_scores` `g` group by `g`.`eisdiele_id`  ;

--
-- VIEW `kugel_scores`
-- Daten: keine
--

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
