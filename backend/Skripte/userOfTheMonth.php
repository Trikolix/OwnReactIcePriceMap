<?php
// cron_monthly_report.php
require_once __DIR__ . '/../db_connect.php';

try {
    // Robustere PDO-Einstellungen
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // WICHTIG: Emulation einschalten damit wiederholte named params korrekt ersetzt werden
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
} catch (Exception $e) {
    error_log("PDO-Attribute konnten nicht gesetzt werden: " . $e->getMessage());
}

// --- Datum berechnen ---
$firstDayCurrentMonth = new DateTime('first day of this month 00:00:00');
$startDate = (clone $firstDayCurrentMonth)->modify('-1 month');
$endDate = $firstDayCurrentMonth;

$startDateStr = $startDate->format('Y-m-d');
$endDateStr   = $endDate->format('Y-m-d');

// --- Query vorbereiten ---
$sql = <<<'SQL'
SELECT 
    n.id AS nutzer_id,
    n.username,    
    COALESCE(ci_ohne_bild.count, 0) + COALESCE(ci_mit_bild.count, 0) AS anzahl_checkins,
    COALESCE(ci_ohne_bild.count, 0) * 30 AS ep_checkins_ohne_bild,    
    COALESCE(ci_mit_bild.count, 0) * 45 AS ep_checkins_mit_bild,
    COALESCE(bw.count, 0) AS anzahl_bewertungen,    
    COALESCE(bw.count, 0) * 20 AS ep_bewertungen, 
    COALESCE(pm.count, 0) AS anzahl_preismeldungen,   
    COALESCE(pm.count, 0) * 15 AS ep_preismeldungen,
    COALESCE(r.count, 0) AS anzahl_routen,
    COALESCE(r.count, 0) * 20 AS ep_routen,    
    COALESCE(a.ep, 0) AS ep_awards,    
    COALESCE(e.ep, 0) AS ep_eisdielen,
    COALESCE(gw.ep, 0) AS ep_geworbene_nutzer,    
    (
        COALESCE(ci_ohne_bild.count, 0) * 30 +
        COALESCE(ci_mit_bild.count, 0) * 45 +
        COALESCE(bw.count, 0) * 20 +
        COALESCE(pm.count, 0) * 15 +
        COALESCE(r.count, 0) * 20 +
        COALESCE(a.ep, 0) +
        COALESCE(e.ep, 0) +
        COALESCE(gw.ep, 0)
    ) AS ep_gesamt
FROM nutzer n
LEFT JOIN (
    SELECT c.nutzer_id, COUNT(*) AS count
    FROM checkins c
    LEFT JOIN bilder b ON b.checkin_id = c.id
    WHERE b.id IS NULL
      AND DATE(c.datum) BETWEEN :startDate AND :endDate
    GROUP BY c.nutzer_id
) ci_ohne_bild ON ci_ohne_bild.nutzer_id = n.id
LEFT JOIN (
    SELECT c.nutzer_id, COUNT(DISTINCT c.id) AS count
    FROM checkins c
    JOIN bilder b ON b.checkin_id = c.id
    WHERE DATE(c.datum) BETWEEN :startDate AND :endDate
    GROUP BY c.nutzer_id
) ci_mit_bild ON ci_mit_bild.nutzer_id = n.id
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM bewertungen
    WHERE DATE(bewertungen.erstellt_am) BETWEEN :startDate AND :endDate
    GROUP BY nutzer_id
) bw ON bw.nutzer_id = n.id
LEFT JOIN (
    SELECT gemeldet_von, COUNT(*) AS count
    FROM preise
    WHERE DATE(preise.gemeldet_am) BETWEEN :startDate AND :endDate
    GROUP BY gemeldet_von
) pm ON pm.gemeldet_von = n.id
LEFT JOIN (
    SELECT nutzer_id, COUNT(*) AS count
    FROM routen
    WHERE DATE(routen.erstellt_am) BETWEEN :startDate AND :endDate
    GROUP BY nutzer_id
) r ON r.nutzer_id = n.id
LEFT JOIN (
    SELECT ua.user_id, SUM(al.ep) AS ep
    FROM user_awards ua
    JOIN award_levels al 
      ON ua.award_id = al.award_id AND ua.level = al.level
    WHERE DATE(ua.awarded_at) BETWEEN :startDate AND :endDate
    GROUP BY ua.user_id
) a ON a.user_id = n.id  
LEFT JOIN (
    SELECT 
        e.user_id,
        SUM(
            CASE 
                WHEN c.id IS NULL THEN 5
                ELSE 25
            END
        ) AS ep
    FROM eisdielen e
    LEFT JOIN checkins c ON c.eisdiele_id = e.id
    WHERE DATE(e.erstellt_am) BETWEEN :startDate AND :endDate
    GROUP BY e.user_id
) e ON e.user_id = n.id
LEFT JOIN (
    SELECT 
        nu.invited_by AS nutzer_id,
        SUM(
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM checkins c WHERE c.nutzer_id = nu.id
                ) THEN 250
                ELSE 10
            END
        ) AS ep
    FROM nutzer nu
    WHERE nu.is_verified = 1 
      AND nu.invited_by IS NOT NULL
      AND DATE(nu.erstellt_am) BETWEEN :startDate AND :endDate
    GROUP BY nu.invited_by
) gw ON gw.nutzer_id = n.id
ORDER BY ep_gesamt DESC;
SQL;

// --- Statement ausführen ---
try {
    $stmt = $pdo->prepare($sql);
    // WICHTIG: execute mit keys OHNE führendes ':' benutzen
    $stmt->execute([
        'startDate' => $startDateStr,
        'endDate'   => $endDateStr
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    error_log("Query-Fehler: " . $e->getMessage());
    exit(1);
}

// --- CSV im Speicher bauen (Semikolon-Trenner für Excel DE) ---
$fp = fopen('php://memory', 'r+');
if (!empty($rows)) {
    // Kopfzeile
    fputcsv($fp, array_keys($rows[0]), ';', '"', '\\');
    // Datenzeilen
    foreach ($rows as $row) {
        fputcsv($fp, $row, ';', '"', '\\');
    }
}
rewind($fp);
$csvData = stream_get_contents($fp);
fclose($fp);

// --- Mail vorbereiten ---
$to = 'ch_helbig@mail.de';
$subject = "Ice-App Nutzer des Monats " . $startDate->format('F Y');
$bodyText = "Hallo,\n\nim Anhang findest du den Monatsreport für " . $startDate->format('F Y') . ".\n\nViele Grüße\n";
$filename = 'report_' . $startDate->format('Y_m') . '.csv';

$eol = "\r\n";
$separator = md5(time());

// Header
$headers  = "From: Eis-App Report <noreply@ice-app.de>" . $eol;
$headers .= "MIME-Version: 1.0" . $eol;
$headers .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"" . $eol;

// Body (multipart)
$body  = "--" . $separator . $eol;
$body .= "Content-Type: text/plain; charset=\"utf-8\"" . $eol;
$body .= "Content-Transfer-Encoding: 7bit" . $eol . $eol;
$body .= $bodyText . $eol;

$body .= "--" . $separator . $eol;
$body .= "Content-Type: text/csv; name=\"" . $filename . "\"" . $eol;
$body .= "Content-Transfer-Encoding: base64" . $eol;
$body .= "Content-Disposition: attachment; filename=\"" . $filename . "\"" . $eol . $eol;
$body .= chunk_split(base64_encode($csvData)) . $eol;
$body .= "--" . $separator . "--" . $eol;

$sent = mail($to, $subject, $body, $headers);
if (! $sent) {
    error_log("Monatsreport Mail konnte nicht gesendet werden.");
} else {
    error_log("Monatsreport Mail gesendet an $to.");
}
?>