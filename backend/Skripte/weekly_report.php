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

// 3. Neu errungene Awards
$stmt = $pdo->prepare("SELECT COUNT(*) FROM user_awards WHERE awarded_at BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueAwards = $stmt->fetchColumn();

// 3. Verteilung der Check-ins nach Typ
$stmt = $pdo->prepare("
    SELECT typ, COUNT(*) as anzahl
    FROM checkins
    WHERE datum BETWEEN :start AND :ende
    GROUP BY typ
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachTyp = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 4. Verteilung der Check-ins nach Anreise
$stmt = $pdo->prepare("
    SELECT anreise, COUNT(*) as anzahl
    FROM checkins
    WHERE datum BETWEEN :start AND :ende
    GROUP BY anreise
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachAnreise = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 5. Verteilung der Check-ins mit oder ohne Bild
$stmt = $pdo->prepare("
    SELECT 
        CASE WHEN b.id IS NOT NULL THEN 'Mit Bild' ELSE 'Ohne Bild' END AS bild_status,
        COUNT(DISTINCT c.id) AS anzahl
    FROM checkins c
    LEFT JOIN bilder b ON c.id = b.checkin_id
    WHERE c.datum BETWEEN :start AND :ende
    GROUP BY bild_status
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachBild = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 6. Nutzer mit Check-ins
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT nutzer_id) FROM checkins WHERE datum BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$aktiveNutzer = $stmt->fetchColumn();

// 7. Eisportionen
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM checkin_sorten
    WHERE checkin_id IN (
        SELECT id FROM checkins WHERE datum BETWEEN :start AND :ende
    )
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$portionen = $stmt->fetchColumn();

// 8. Neue Eisdielen
$stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE erstellt_am BETWEEN :start AND :ende");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$neueEisdielen = $stmt->fetchColumn();

// 9. Unterschiedliche Länder mit Check-ins
$stmt = $pdo->prepare("
    SELECT COUNT(DISTINCT e.land_id)
    FROM checkins c
    JOIN eisdielen e ON c.eisdiele_id = e.id
    WHERE c.datum BETWEEN :start AND :ende
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$laenderMitCheckins = $stmt->fetchColumn();

// 9b. Verteilung Check-in Vor Ort / Nicht vor Ort (per is_on_site)
$stmt = $pdo->prepare("
    SELECT 
        CASE WHEN is_on_site = 1 THEN 'Vor Ort' ELSE 'Nicht vor Ort' END AS ort_status,
        COUNT(*) AS anzahl
    FROM checkins
    WHERE datum BETWEEN :start AND :ende
    GROUP BY ort_status
");
$stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
$checkinsNachOrt = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 10. Gesamtanzahl Nutzer
$gesamtNutzer = $pdo->query("SELECT COUNT(*) FROM nutzer")->fetchColumn();

// 11. Gesamtanzahl Check-ins
$gesamtCheckins = $pdo->query("SELECT COUNT(*) FROM checkins")->fetchColumn();

// 12. Gesamtanzahl Eisdielen
$gesamtEisdielen = $pdo->query("SELECT COUNT(*) FROM eisdielen")->fetchColumn();

// --- Mailtext erstellen ---
$betreff = "Ice-App Wochenreport: " . $wochenstart->format('d.m.Y') . " – " . $wochenende->format('d.m.Y');

$datumStart = $wochenstart->format('d.m.Y');
$datumEnde = $wochenende->format('d.m.Y');

$text_nachricht = <<<EOT
Hallo 👋

Hier ist dein wöchentlicher Ice-App Report für den Zeitraum
$datumStart – $datumEnde:

📊 Wochenstatistik:
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
    $text_nachricht .= "\n  - {$typ['typ']}: {$typ['anzahl']}";
}

$text_nachricht .= "\n\n🚗 Nach Anreise:";

// Check-in Verteilung nach Anreise hinzufügen
foreach ($checkinsNachAnreise as $anreise) {
    $text_nachricht .= "\n  - {$anreise['anreise']}: {$anreise['anzahl']}";
}

// Check-in Verteilung mit / ohne Bild hinzufügen
$text_nachricht .= "\n\n📸 Mit oder ohne Bild:";
foreach ($checkinsNachBild as $bild) {
    $text_nachricht .= "\n  - {$bild['bild_status']}: {$bild['anzahl']}";
}

// Check-in Verteilung Vor Ort / Nicht vor Ort hinzufügen
$text_nachricht .= "\n\n🏠 Vor Ort / Nicht vor Ort:";
foreach ($checkinsNachOrt as $ort) {
    $text_nachricht .= "\n  - {$ort['ort_status']}: {$ort['anzahl']}";
}

$text_nachricht .= <<<EOT

📈 Gesamtzahlen:
👤 Gesamtanzahl Nutzer: $gesamtNutzer
📌 Gesamtanzahl Check-ins: $gesamtCheckins
🏪 Gesamtanzahl Eisdielen: $gesamtEisdielen

Frostige Grüße ❄️
Deine Ice-App
EOT;

// HTML-Version der Nachricht erstellen
$nachricht = "<html><body style='font-family:sans-serif;color:#222;'>";
$nachricht .= nl2br(htmlspecialchars($text_nachricht));
$nachricht .= "</body></html>";

// Insert in die Statistik-Tabelle
$stmt = $pdo->prepare("
    INSERT INTO wochenstatistiken (
        start_datum, end_datum,
        neue_nutzer, neue_eisdielen, aktive_nutzer,
        checkins, portionen, laender_mit_checkins,
        gesamt_nutzer, gesamt_checkins, gesamt_eisdielen,
    verteilung_checkins_typ, verteilung_anreise, verteilung_bild, verteilung_ort
    )
    VALUES (
        :start_datum, :end_datum,
        :neue_nutzer, :neue_eisdielen, :aktive_nutzer,
        :checkins, :portionen, :laender_mit_checkins,
        :gesamt_nutzer, :gesamt_checkins, :gesamt_eisdielen,
    :verteilung_checkins_typ, :verteilung_anreise, :verteilung_bild, :verteilung_ort
    )
");

$stmt->execute([
    'start_datum' => $wochenstart->format('Y-m-d'),
    'end_datum' => $wochenende->format('Y-m-d'),
    'neue_nutzer' => $neueNutzer,
    'neue_eisdielen' => $neueEisdielen,
    'aktive_nutzer' => $aktiveNutzer,
    'checkins' => $checkins,
    'portionen' => $portionen,
    'laender_mit_checkins' => $laenderMitCheckins,
    'gesamt_nutzer' => $gesamtNutzer,
    'gesamt_checkins' => $gesamtCheckins,
    'gesamt_eisdielen' => $gesamtEisdielen,
    'verteilung_checkins_typ' => json_encode($checkinsNachTyp),
    'verteilung_anreise' => json_encode($checkinsNachAnreise),
    'verteilung_bild' => json_encode($checkinsNachBild),
    'verteilung_ort' => json_encode($checkinsNachOrt)
]);

// --- E-Mail versenden ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load PHPMailer classes
require __DIR__ . '/../lib/PHPMailer/src/Exception.php';
require __DIR__ . '/../lib/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../lib/PHPMailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
    //Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;                      // Enable verbose debug output
    $mail->isSMTP();                                            // Send using SMTP
    $mail->Host       = 'smtp.example.com';                     // **DEIN SMTP HOST HIER**
    $mail->SMTPAuth   = true;                                   // Enable SMTP authentication
    $mail->Username   = 'user@example.com';                     // **DEIN SMTP BENUTZERNAME HIER**
    $mail->Password   = 'secret';                               // **DEIN SMTP PASSWORT HIER**
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            // Enable implicit TLS encryption
    $mail->Port       = 465;                                    // TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
    $mail->CharSet = 'UTF-8';

    //Recipients
    $mail->setFrom('from@example.com', 'Ice-App Reporter');
    $mail->addAddress($empfaenger1);
    $mail->addAddress($empfaenger2);

    // Content
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->Subject = $betreff;
    $mail->Body    = $nachricht;
    $mail->AltBody = $text_nachricht;

    $mail->send();
    echo 'Nachricht wurde erfolgreich versendet';
} catch (Exception $e) {
    echo "Nachricht konnte nicht versendet werden. Mailer Error: {$mail->ErrorInfo}";
}
?>