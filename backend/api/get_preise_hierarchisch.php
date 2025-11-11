<?php
require_once  __DIR__ . '/../db_connect.php';

try {
    // 1. Aktuelle Kugelpreise je Eisdiele
    $stmt = $pdo->query("
        SELECT 
            e.id AS eisdiele_id,
            e.landkreis_id,
            (
                SELECT p1.preis
                FROM preise p1
                WHERE p1.eisdiele_id = e.id
                AND p1.typ = 'kugel'
                ORDER BY p1.gemeldet_am DESC
                LIMIT 1
            ) AS kugel_preis
        FROM eisdielen e
        WHERE e.landkreis_id IS NOT NULL
    ");

    $preiseRoh = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Gruppieren nach Landkreis
    $preiseProLandkreis = [];
    foreach ($preiseRoh as $eintrag) {
        if ($eintrag['kugel_preis'] !== null) {
            $lk = $eintrag['landkreis_id'];
            if (!isset($preiseProLandkreis[$lk])) {
                $preiseProLandkreis[$lk] = [];
            }
            $preiseProLandkreis[$lk][] = (float)$eintrag['kugel_preis'];
        }
    }

    // 3. Hole alle Landkreise mit Bundesland und Land
    $stmt = $pdo->query("
        SELECT 
            l.id AS landkreis_id,
            l.name AS landkreis_name,
            b.id AS bundesland_id,
            b.name AS bundesland_name,
            bl.id AS land_id,
            bl.name AS land_name
        FROM landkreise l
        JOIN bundeslaender b ON l.bundesland_id = b.id
        JOIN laender bl ON b.land_id = bl.id
    ");

    $struktur = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $landId = $row['land_id'];
        $bundeslandId = $row['bundesland_id'];
        $landkreisId = $row['landkreis_id'];

        // Preise prüfen
        $preise = $preiseProLandkreis[$landkreisId] ?? [];
        $anzahlEisdielen = count($preise);
        if ($anzahlEisdielen === 0) {
            continue;
        }

        $durchschnitt = round(array_sum($preise) / $anzahlEisdielen, 2);

        // Land initialisieren
        if (!isset($struktur[$landId])) {
            $struktur[$landId] = [
                'id' => $landId,
                'name' => $row['land_name'],
                'anzahl_eisdielen' => 0,
                'gesamtpreis_summe' => 0,
                'bundeslaender' => []
            ];
        }

        // Bundesland initialisieren
        if (!isset($struktur[$landId]['bundeslaender'][$bundeslandId])) {
            $struktur[$landId]['bundeslaender'][$bundeslandId] = [
                'id' => $bundeslandId,
                'name' => $row['bundesland_name'],
                'anzahl_eisdielen' => 0,
                'gesamtpreis_summe' => 0,
                'durchschnittlicher_kugelpreis' => null,
                'landkreise' => [],
            ];
        }

        // Landkreis hinzufügen
        $struktur[$landId]['bundeslaender'][$bundeslandId]['landkreise'][] = [
            'id' => $landkreisId,
            'name' => $row['landkreis_name'],
            'anzahl_eisdielen' => $anzahlEisdielen,
            'durchschnittlicher_kugelpreis' => $durchschnitt
        ];

        // Summieren für Bundesland & Land
        $struktur[$landId]['anzahl_eisdielen'] += $anzahlEisdielen;
        $struktur[$landId]['gesamtpreis_summe'] += $durchschnitt * $anzahlEisdielen;

        $struktur[$landId]['bundeslaender'][$bundeslandId]['anzahl_eisdielen'] += $anzahlEisdielen;
        $struktur[$landId]['bundeslaender'][$bundeslandId]['gesamtpreis_summe'] += $durchschnitt * $anzahlEisdielen;
    }

    // 4. Durchschnitte berechnen & sortieren
    foreach ($struktur as &$land) {
        foreach ($land['bundeslaender'] as &$bundesland) {
            if ($bundesland['anzahl_eisdielen'] > 0) {
                $bundesland['durchschnittlicher_kugelpreis'] = round(
                    $bundesland['gesamtpreis_summe'] / $bundesland['anzahl_eisdielen'], 2
                );
            }
            unset($bundesland['gesamtpreis_summe']);

            // Sortierung der Landkreise
            usort($bundesland['landkreise'], fn($a, $b) =>
                $a['durchschnittlicher_kugelpreis'] <=> $b['durchschnittlicher_kugelpreis']
            );
        }
        unset($bundesland);

        // Durchschnitt für Land berechnen
        if ($land['anzahl_eisdielen'] > 0) {
            $land['durchschnittlicher_kugelpreis'] = round(
                $land['gesamtpreis_summe'] / $land['anzahl_eisdielen'], 2
            );
        }
        unset($land['gesamtpreis_summe']);

        // Sortierung Bundesländer
        usort($land['bundeslaender'], fn($a, $b) =>
            $a['durchschnittlicher_kugelpreis'] <=> $b['durchschnittlicher_kugelpreis']
        );
    }
    unset($land);

    // 5. Länder sortieren
    $struktur = array_values($struktur);
    usort($struktur, fn($a, $b) =>
        $a['durchschnittlicher_kugelpreis'] <=> $b['durchschnittlicher_kugelpreis']
    );

    // 6. Indexe zurücksetzen
    foreach ($struktur as &$land) {
        $land['bundeslaender'] = array_values($land['bundeslaender']);
    }

    echo json_encode($struktur, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>