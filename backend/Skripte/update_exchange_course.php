<?php
require_once __DIR__ . '/../db_connect.php';

// Alle Währungen laden
$stmt = $pdo->query("SELECT id, code FROM waehrungen");
$waehrungen = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Mapping code -> id
$codeToId = [];
foreach ($waehrungen as $w) {
    $codeToId[$w['code']] = $w['id'];
}

// Dein API Key
$apiKey = "797dbc00ed1f8b341292ae714e0a46d4";

// API-Aufruf
$url = "http://api.currencylayer.com/live?access_key=$apiKey&source=EUR";
$response = file_get_contents($url);
if ($response === false) {
    die("❌ API nicht erreichbar: $url");
}
$data = json_decode($response, true);

if (!$data || !isset($data['success']) || $data['success'] !== true) {
    die("❌ Fehler beim Abrufen der Wechselkurse: " . json_encode($data));
}

$source = $data['source']; // z.B. "EUR"

if (!isset($codeToId[$source])) {
    die("❌ Basiswährung '$source' nicht in der Tabelle 'waehrungen' gefunden!");
}

$vonId = $codeToId[$source];

// Vereinfachtes Prepared Statement (ohne gueltig_ab und timestamp)
$insert = $pdo->prepare("
    INSERT INTO wechselkurse (von_waehrung_id, zu_waehrung_id, kurs)
    VALUES (:von, :zu, :kurs)
    ON DUPLICATE KEY UPDATE 
        kurs = VALUES(kurs), 
        aktualisiert_am = CURRENT_TIMESTAMP
");

$updateCount = 0;

// Alle Kurse verarbeiten
foreach ($data['quotes'] as $pair => $kurs) {
    // $pair z.B. "EURUSD"
    $zielCode = substr($pair, strlen($source));
    if (!isset($codeToId[$zielCode])) {
        echo "⚠️  Währung '$zielCode' nicht in Datenbank gefunden, überspringe...\n";
        continue;
    }

    $zuId = $codeToId[$zielCode];

    try {
        // EUR -> Zielwährung
        $insert->execute([
            ':von' => $vonId,
            ':zu'  => $zuId,
            ':kurs' => $kurs
        ]);
        $updateCount++;
        echo "✓ EUR -> $zielCode: $kurs\n";

        // Zielwährung -> EUR (Kehrwert)
        if ($kurs > 0) {
            $kehrwert = 1 / $kurs;
            $insert->execute([
                ':von' => $zuId,
                ':zu'  => $vonId,
                ':kurs' => $kehrwert
            ]);
            $updateCount++;
            echo "✓ $zielCode -> EUR: " . number_format($kehrwert, 6) . "\n";
        }
    } catch (PDOException $e) {
        echo "❌ Fehler bei $pair: " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Wechselkurse erfolgreich aktualisiert. $updateCount Kurse verarbeitet.\n";

// Optional: Statistik der aktualisierten Kurse anzeigen
$stmt = $pdo->query("
    SELECT 
        w1.code AS von_waehrung,
        w2.code AS zu_waehrung,
        wk.kurs,
        wk.aktualisiert_am
    FROM wechselkurse wk
    JOIN waehrungen w1 ON wk.von_waehrung_id = w1.id
    JOIN waehrungen w2 ON wk.zu_waehrung_id = w2.id
    WHERE w1.code = 'EUR' OR w2.code = 'EUR'
    ORDER BY w1.code, w2.code
");

echo "\n📊 Aktuelle Wechselkurse (nur EUR-bezogene):\n";
echo str_repeat("-", 50) . "\n";
while ($row = $stmt->fetch()) {
    printf("%-8s -> %-8s: %10.6f (aktualisiert: %s)\n", 
           $row['von_waehrung'], 
           $row['zu_waehrung'], 
           $row['kurs'],
           $row['aktualisiert_am']);
}
?>
