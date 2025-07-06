<?php
require_once  __DIR__ . '/../db_connect.php';

$empfaenger1 = 'ch_helbig@mail.de';
$empfaenger2 = 'Bocki00@web.de';
$absender = 'From: noreply@ice-app.de';

// --- Zeitraum berechnen (letzte Woche Montag bis Sonntag) ---
$heute = new DateTimeImmutable();
$wochenstart = $heute->modify('last monday -7 days')->setTime(0, 0);
$wochenende = $wochenstart->modify('+6 days')->setTime(23, 59, 59);

// --- Statistikabfragen ---

// 1. Neue Nutzer
$stmt = $pdo->prepare("SELECT COUNT(*) FROM nutzer WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $wochenstart->format('Y-m-d H:i:s'), 'ende' => $wochenende->format('Y-m-d H:i:s')]);
$neueNutzer = $stmt->fetchColumn();

// 2. Anzahl Check-ins
$stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $wochenstart->format('Y-m-d H:i:s'), 'ende' => $wochenende->format('Y-m-d H:i:s')]);
$checkins = $stmt->fetchColumn();

// 3. Nutzer mit Check-ins
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT nutzer_id) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $wochenstart->format('Y-m-d H:i:s'), 'ende' => $wochenende->format('Y-m-d H:i:s')]);
$aktiveNutzer = $stmt->fetchColumn();

// 4. Eisportionen
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM checkin_sorten
    WHERE checkin_id IN (
        SELECT id FROM checkins WHERE datum BETWEEN :start AND :ende
    )
");
$stmt->execute(['start' => $wochenstart->format('Y-m-d H:i:s'), 'ende' => $wochenende->format('Y-m-d H:i:s')]);
$portionen = $stmt->fetchColumn();

// --- Mailtext erstellen ---
$betreff = "Ice-App Wochenreport: " . $wochenstart->format('d.m.Y') . " – " . $wochenende->format('d.m.Y');

$datumStart = $wochenstart->format('d.m.Y');
$datumEnde = $wochenende->format('d.m.Y');

$nachricht = <<<EOT
Hallo 👋

Hier ist dein wöchentlicher Ice-App Report für den Zeitraum
$datumStart – $datumEnde:

🧑‍💻 Neue Nutzer: $neueNutzer
$aktiveNutzer Nutzer haben $checkins Check-ins getätigt und dabei $portionen Eisportionen gegessen.

Frostige Grüße ❄️
Deine Ice-App
EOT;

// --- E-Mail versenden ---
mail($empfaenger1, $betreff, $nachricht, $absender);
mail($empfaenger2, $betreff, $nachricht, $absender);
?>