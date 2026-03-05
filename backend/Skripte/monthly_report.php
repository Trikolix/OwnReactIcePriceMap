<?php
require_once  __DIR__ . '/../db_connect.php';

$empfaenger1 = 'ch_helbig@mail.de';
$empfaenger2 = 'Bocki00@web.de';

// --- Zeitraum berechnen (letzte Woche Montag bis Sonntag) ---
$heute = new DateTimeImmutable();
$monatsstart = $heute->modify('first day of last month')->setTime(0, 0);
$monatsende = $heute->modify('last day of last month')->setTime(23, 59, 59);
$startStr = $monatsstart->format('Y-m-d H:i:s');
$endeStr  = $monatsende->format('Y-m-d H:i:s');

// --- Statistikabfragen ---

// 1. Neue Nutzer
$stmt = $pdo->prepare("SELECT COUNT(*) FROM nutzer WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueNutzer = $stmt->fetchColumn();

// 2. Anzahl Check-ins
$stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkins = $stmt->fetchColumn();

// 3. Neu errungene Awards
$stmt = $pdo->prepare("SELECT COUNT(*) FROM user_awards WHERE awarded_at BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueAwards = $stmt->fetchColumn();

// 3. Verteilung der Check-ins nach Typ
$stmt = $pdo->prepare(
    "SELECT typ, COUNT(*) as anzahl\n    FROM checkins\n    WHERE datum BETWEEN :start AND :ende\n    GROUP BY typ"
);
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachTyp = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 4. Verteilung der Check-ins nach Anreise
$stmt = $pdo->prepare(
    "SELECT anreise, COUNT(*) as anzahl\n    FROM checkins\n    WHERE datum BETWEEN :start AND :ende\n    GROUP BY anreise"
);
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachAnreise = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 5. Verteilung der Check-ins mit oder ohne Bild
$stmt = $pdo->prepare(
    "SELECT 
        CASE WHEN b.id IS NOT NULL THEN 'Mit Bild' ELSE 'Ohne Bild' END AS bild_status,
        COUNT(DISTINCT c.id) AS anzahl
    FROM checkins c
    LEFT JOIN bilder b ON c.id = b.checkin_id
    WHERE c.datum BETWEEN :start AND :ende
    GROUP BY bild_status"
);
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachBild = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 6. Nutzer mit Check-ins
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT nutzer_id) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$aktiveNutzer = $stmt->fetchColumn();

// 7. Eisportionen
$stmt = $pdo->prepare(
    "SELECT COUNT(*) FROM checkin_sorten\n    WHERE checkin_id IN (\n        SELECT id FROM checkins WHERE datum BETWEEN :start AND :ende\n    )"
);
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$portionen = $stmt->fetchColumn();

// 8. Neue Eisdielen
$stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueEisdielen = $stmt->fetchColumn();

// 9. Unterschiedliche Länder mit Check-ins
$stmt = $pdo->prepare(
    "SELECT COUNT(DISTINCT e.land_id)\n    FROM checkins c\n    JOIN eisdielen e ON c.eisdiele_id = e.id\n    WHERE c.datum BETWEEN :start AND :ende"
);
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$laenderMitCheckins = $stmt->fetchColumn();

// 10. Gesamtanzahl Nutzer
$gesamtNutzer = $pdo->query("SELECT COUNT(*) FROM nutzer")->fetchColumn();

// 11. Gesamtanzahl Check-ins
$gesamtCheckins = $pdo->query("SELECT COUNT(*) FROM checkins")->fetchColumn();

// 12. Gesamtanzahl Eisdielen
$gesamtEisdielen = $pdo->query("SELECT COUNT(*) FROM eisdielen")->fetchColumn();

// --- Mailtext erstellen ---
$betreff_raw = "Ice-App Monatsreport: " . $monatsstart->format('d.m.Y') . " – " . $monatsende->format('d.m.Y');

$datumStart = $monatsstart->format('d.m.Y');
$datumEnde = $monatsende->format('d.m.Y');

$nachricht = <<<EOT
Hallo 👋

Hier ist dein monatlicher Ice-App Report für den Zeitraum
$datumStart – $datumEnde:

📊 Monatsstatistik:
🧑‍💻 Neue Nutzer: $neueNutzer
📍 Neue Eisdielen: $neueEisdielen

👥 Aktive Nutzer: $aktiveNutzer
✅ Check-ins insgesamt: $checkins
🍦 Eisportionen gegessen: $portionen
🌍 Länder mit Check-ins: $laenderMitCheckins
🏆 Neue Awards: $neueAwards

📊 Check-in Verteilung:
🍧 Nach Typ:

EOT;

// Check-in Verteilung nach Typ hinzufügen
foreach ($checkinsNachTyp as $typ) {
    $nachricht .= "  - {$typ['typ']}: {$typ['anzahl']}\n";
}

$nachricht .= "\n🚗 Nach Anreise:\n";

// Check-in Verteilung nach Anreise hinzufügen
foreach ($checkinsNachAnreise as $anreise) {
    $nachricht .= "  - {$anreise['anreise']}: {$anreise['anzahl']}\n";
}

$nachricht .= "\n📸 Mit oder ohne Bild:\n";

// Check-in Verteilung mit oder ohne Bild hinzufügen
foreach ($checkinsNachBild as $bild) {
    $nachricht .= "  - {$bild['bild_status']}: {$bild['anzahl']}\n";
}

$nachricht .= <<<EOT

📈 Gesamtzahlen:
👤 Gesamtanzahl Nutzer: $gesamtNutzer
📌 Gesamtanzahl Check-ins: $gesamtCheckins
🏪 Gesamtanzahl Eisdielen: $gesamtEisdielen

Frostige Grüße ❄️
Deine Ice-App
EOT;



// --- E-Mail versenden ---
$nachricht_html = "<html><body style='font-family:sans-serif;color:#222;'>" . nl2br(htmlspecialchars($nachricht)) . "</body></html>";

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: noreply@ice-app.de\r\n";

// Betreff für Sonderzeichen kodieren
$betreff_encoded = '=?UTF-8?B?' . base64_encode($betreff_raw) . '?=';

mail($empfaenger1, $betreff_encoded, $nachricht_html, $headers);
mail($empfaenger2, $betreff_encoded, $nachricht_html, $headers);

echo "Finale Version des Skripts wurde ausgeführt. Bitte prüfen Sie, ob die E-Mail jetzt ankommt.";
?>