<?php
require_once  __DIR__ . '/../db_connect.php';

$empfaenger1 = 'ch_helbig@mail.de';
$empfaenger2 = 'Bocki00@web.de';
$absender = 'From: noreply@ice-app.de';

// --- Zeitraum berechnen (letzte Woche Montag bis Sonntag) ---
$heute = new DateTimeImmutable();
$wochenstart = $heute->modify('last monday')->setTime(0, 0);
$wochenende = $wochenstart->modify('+6 days')->setTime(23, 59, 59);
$startStr = $wochenstart->format('Y-m-d H:i:s');
$endeStr  = $wochenende->format('Y-m-d H:i:s');

// --- Statistikabfragen ---

// 1. Neue Nutzer
$stmt = $pdo->prepare("SELECT COUNT(*) FROM nutzer WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueNutzer = $stmt->fetchColumn();

// 2. Anzahl Check-ins
$stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkins = $stmt->fetchColumn();

// 3. Nutzer mit Check-ins
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT nutzer_id) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$aktiveNutzer = $stmt->fetchColumn();

// 4. Eisportionen
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM checkin_sorten
    WHERE checkin_id IN (
        SELECT id FROM checkins WHERE datum BETWEEN :start AND :ende
    )
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$portionen = $stmt->fetchColumn();

// 5. Neue Eisdielen
$stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueEisdielen = $stmt->fetchColumn();

// 6. Unterschiedliche Länder mit Check-ins
$stmt = $pdo->prepare("
    SELECT COUNT(DISTINCT e.land_id)
    FROM checkins c
    JOIN eisdielen e ON c.eisdiele_id = e.id
    WHERE c.datum BETWEEN :start AND :ende
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$laenderMitCheckins = $stmt->fetchColumn();

// 7. Gesamtanzahl Nutzer
$gesamtNutzer = $pdo->query("SELECT COUNT(*) FROM nutzer")->fetchColumn();

// 8. Gesamtanzahl Check-ins
$gesamtCheckins = $pdo->query("SELECT COUNT(*) FROM checkins")->fetchColumn();

// 9. Gesamtanzahl Eisdielen
$gesamtEisdielen = $pdo->query("SELECT COUNT(*) FROM eisdielen")->fetchColumn();

// --- Mailtext erstellen ---
$betreff = "Ice-App Wochenreport: " . $wochenstart->format('d.m.Y') . " – " . $wochenende->format('d.m.Y');

$datumStart = $wochenstart->format('d.m.Y');
$datumEnde = $wochenende->format('d.m.Y');

$nachricht = <<<EOT
Hallo 👋

Hier ist dein wöchentlicher Ice-App Report für den Zeitraum
$datumStart – $datumEnde:

📊 Wochenstatistik:
🧑‍💻 Neue Nutzer:                 $neueNutzer
📍 Neue Eisdielen:              $neueEisdielen

👥 Aktive Nutzer:               $aktiveNutzer
✅ Check-ins insgesamt:         $checkins
🍦 Eisportionen gegessen:       $portionen
🌍 Länder mit Check-ins:        $laenderMitCheckins


📈 Gesamtzahlen:
👤 Gesamtanzahl Nutzer:         $gesamtNutzer
📌 Gesamtanzahl Check-ins:      $gesamtCheckins
🏪 Gesamtanzahl Eisdielen:      $gesamtEisdielen

Frostige Grüße ❄️
Deine Ice-App
EOT;

// --- E-Mail versenden ---
mail($empfaenger1, $betreff, $nachricht, $absender);
mail($empfaenger2, $betreff, $nachricht, $absender);
?>