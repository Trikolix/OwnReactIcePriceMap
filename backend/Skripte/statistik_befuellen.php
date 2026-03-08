<?php
require_once __DIR__ . '/../db_connect.php';

$startDatum = new DateTimeImmutable('2025-04-01');
$heute = new DateTimeImmutable('today');
$letzterSonntag = $heute->modify('last sunday');

while ($startDatum < $letzterSonntag) {
    $wochenstart = $startDatum->modify('monday this week')->setTime(0, 0);
    $wochenende = $wochenstart->modify('+6 days')->setTime(23, 59, 59);

    $startStr = $wochenstart->format('Y-m-d H:i:s');
    $endeStr  = $wochenende->format('Y-m-d H:i:s');

    // Prüfen, ob bereits ein Eintrag existiert
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM wochenstatistiken WHERE start_datum = :start");
    $stmt->execute(['start' => $wochenstart->format('Y-m-d')]);
    if ($stmt->fetchColumn() > 0) {
        // Eintrag existiert, überspringen
        $startDatum = $startDatum->modify('+7 days');
        continue;
    }

    // 1. Neue Nutzer
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM nutzer WHERE erstellt_am BETWEEN :start AND :ende");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $neueNutzer = $stmt->fetchColumn();

    // 2. Neue Eisdielen
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE erstellt_am BETWEEN :start AND :ende");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $neueEisdielen = $stmt->fetchColumn();

    // 3. Aktive Nutzer
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT nutzer_id) FROM checkins WHERE datum BETWEEN :start AND :ende");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $aktiveNutzer = $stmt->fetchColumn();

    // 4. Check-ins
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE datum BETWEEN :start AND :ende");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $checkins = $stmt->fetchColumn();

    // 5. Portionen
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM checkin_sorten
        WHERE checkin_id IN (
            SELECT id FROM checkins WHERE datum BETWEEN :start AND :ende
        )
    ");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $portionen = $stmt->fetchColumn();

    // 6. Länder mit Check-ins
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT e.land_id)
        FROM checkins c
        JOIN eisdielen e ON c.eisdiele_id = e.id
        WHERE c.datum BETWEEN :start AND :ende
    ");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $laenderMitCheckins = $stmt->fetchColumn();

    // 7. Gesamtzahlen bis zum Ende der Woche (Stichtag = Sonntag 23:59:59)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM nutzer WHERE erstellt_am <= :ende");
    $stmt->execute(['ende' => $endeStr]);
    $gesamtNutzer = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE datum <= :ende");
    $stmt->execute(['ende' => $endeStr]);
    $gesamtCheckins = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM eisdielen WHERE erstellt_am <= :ende");
    $stmt->execute(['ende' => $endeStr]);
    $gesamtEisdielen = $stmt->fetchColumn();

    // 8. Verteilungen
    $stmt = $pdo->prepare("
        SELECT typ, COUNT(*) as anzahl
        FROM checkins
        WHERE datum BETWEEN :start AND :ende
        GROUP BY typ
    ");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $checkinsNachTyp = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT anreise, COUNT(*) as anzahl
        FROM checkins
        WHERE datum BETWEEN :start AND :ende
        GROUP BY anreise
    ");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $checkinsNachAnreise = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT
            CASE WHEN b.id IS NOT NULL THEN 'Mit Bild' ELSE 'Ohne Bild' END AS bild_status,
            COUNT(DISTINCT(c.id)) as anzahl
        FROM checkins c
        LEFT JOIN bilder b ON c.id = b.checkin_id
        WHERE c.datum BETWEEN :start AND :ende
        GROUP BY bild_status
    ");
    $stmt->execute(['start' => $startStr, 'ende' => $endeStr]);
    $checkinsNachBild = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // In Datenbank speichern
    $stmt = $pdo->prepare("
        INSERT INTO wochenstatistiken (
            start_datum, end_datum,
            neue_nutzer, neue_eisdielen, aktive_nutzer,
            checkins, portionen, laender_mit_checkins,
            gesamt_nutzer, gesamt_checkins, gesamt_eisdielen,
            verteilung_checkins_typ, verteilung_anreise, verteilung_bild
        ) VALUES (
            :start_datum, :end_datum,
            :neue_nutzer, :neue_eisdielen, :aktive_nutzer,
            :checkins, :portionen, :laender_mit_checkins,
            :gesamt_nutzer, :gesamt_checkins, :gesamt_eisdielen,
            :verteilung_checkins_typ, :verteilung_anreise, :verteilung_bild
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
        'verteilung_bild' => json_encode($checkinsNachBild)
    ]);

    echo "Woche {$wochenstart->format('Y-m-d')} – {$wochenende->format('Y-m-d')} gespeichert.\n";

    // Nächste Woche
    $startDatum = $startDatum->modify('+7 days');
}

echo "Fertig.\n";
?>
