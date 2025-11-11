<?php
require_once  __DIR__ . '/../db_connect.php';

function formatPrice(?float $value): ?string {
    if ($value === null) {
        return null;
    }
    return number_format($value, 2, '.', '');
}

function applyPriceFormatting(array &$node): void {
    $fieldsToFormat = [
        'kugel_preis',
        'kugel_preis_eur',
        'durchschnittlicher_kugelpreis',
        'durchschnittlicher_kugelpreis_eur',
    ];

    foreach ($fieldsToFormat as $field) {
        if (array_key_exists($field, $node)) {
            $node[$field] = $node[$field] === null ? null : formatPrice((float)$node[$field]);
        }
    }
}

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
            ) AS kugel_preis,
            (
                SELECT 
                    CASE 
                        WHEN w1.code = 'EUR' THEN p1.preis
                        ELSE ROUND(p1.preis * COALESCE(wk1.kurs, 1), 2)
                    END
                FROM preise p1 
                LEFT JOIN waehrungen w1 ON p1.waehrung_id = w1.id
                LEFT JOIN wechselkurse wk1 ON p1.waehrung_id = wk1.von_waehrung_id 
                    AND wk1.zu_waehrung_id = (SELECT id FROM waehrungen WHERE code = 'EUR')
                WHERE p1.eisdiele_id = e.id AND p1.typ = 'kugel' 
                ORDER BY p1.gemeldet_am DESC 
                LIMIT 1
            ) AS kugel_preis_eur
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
            $preiseProLandkreis[$lk][] = [
                'local' => (float)$eintrag['kugel_preis'],
                'eur' => $eintrag['kugel_preis_eur'] !== null ? (float)$eintrag['kugel_preis_eur'] : null,
            ];
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
            bl.name AS land_name,
            w.id AS waehrung_id,
            w.code AS waehrung_code,
            w.symbol AS waehrung_symbol
        FROM landkreise l
        JOIN bundeslaender b ON l.bundesland_id = b.id
        JOIN laender bl ON b.land_id = bl.id
        LEFT JOIN waehrungen w ON bl.waehrung_id = w.id
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

        $sumLocal = 0;
        $sumEur = 0;
        foreach ($preise as $preis) {
            if (isset($preis['local'])) {
                $sumLocal += $preis['local'];
            }
            if (isset($preis['eur'])) {
                $sumEur += $preis['eur'];
            }
        }

        $durchschnittLocal = $anzahlEisdielen > 0 ? round($sumLocal / $anzahlEisdielen, 2) : null;
        $durchschnittEur = $anzahlEisdielen > 0 ? round($sumEur / $anzahlEisdielen, 2) : null;

        // Land initialisieren
        if (!isset($struktur[$landId])) {
            $struktur[$landId] = [
                'id' => $landId,
                'name' => $row['land_name'],
                'anzahl_eisdielen' => 0,
                'gesamtpreis_summe_local' => 0,
                'gesamtpreis_summe_eur' => 0,
                'kugel_preis' => null,
                'kugel_preis_eur' => null,
                'kugel_waehrung' => $row['waehrung_symbol'],
                'kugel_waehrung_code' => $row['waehrung_code'],
                'currency' => [
                    'id' => $row['waehrung_id'],
                    'code' => $row['waehrung_code'],
                    'symbol' => $row['waehrung_symbol'],
                ],
                'durchschnittlicher_kugelpreis' => null,
                'durchschnittlicher_kugelpreis_eur' => null,
                'bundeslaender' => []
            ];
        }

        // Bundesland initialisieren
        if (!isset($struktur[$landId]['bundeslaender'][$bundeslandId])) {
            $struktur[$landId]['bundeslaender'][$bundeslandId] = [
                'id' => $bundeslandId,
                'name' => $row['bundesland_name'],
                'anzahl_eisdielen' => 0,
                'gesamtpreis_summe_local' => 0,
                'gesamtpreis_summe_eur' => 0,
                'kugel_preis' => null,
                'kugel_preis_eur' => null,
                'kugel_waehrung' => $row['waehrung_symbol'],
                'kugel_waehrung_code' => $row['waehrung_code'],
                'currency' => [
                    'id' => $row['waehrung_id'],
                    'code' => $row['waehrung_code'],
                    'symbol' => $row['waehrung_symbol'],
                ],
                'durchschnittlicher_kugelpreis' => null,
                'durchschnittlicher_kugelpreis_eur' => null,
                'landkreise' => [],
            ];
        }

        // Landkreis hinzufügen
        $struktur[$landId]['bundeslaender'][$bundeslandId]['landkreise'][] = [
            'id' => $landkreisId,
            'name' => $row['landkreis_name'],
            'anzahl_eisdielen' => $anzahlEisdielen,
            'durchschnittlicher_kugelpreis' => $durchschnittLocal,
            'durchschnittlicher_kugelpreis_eur' => $durchschnittEur,
            'kugel_preis' => $durchschnittLocal,
            'kugel_preis_eur' => $durchschnittEur,
            'kugel_waehrung' => $row['waehrung_symbol'],
            'kugel_waehrung_code' => $row['waehrung_code'],
            'currency' => [
                'id' => $row['waehrung_id'],
                'code' => $row['waehrung_code'],
                'symbol' => $row['waehrung_symbol'],
            ],
        ];

        // Summieren für Bundesland & Land
        $struktur[$landId]['anzahl_eisdielen'] += $anzahlEisdielen;
        $struktur[$landId]['gesamtpreis_summe_local'] += $sumLocal;
        $struktur[$landId]['gesamtpreis_summe_eur'] += $sumEur;

        $struktur[$landId]['bundeslaender'][$bundeslandId]['anzahl_eisdielen'] += $anzahlEisdielen;
        $struktur[$landId]['bundeslaender'][$bundeslandId]['gesamtpreis_summe_local'] += $sumLocal;
        $struktur[$landId]['bundeslaender'][$bundeslandId]['gesamtpreis_summe_eur'] += $sumEur;
    }

    $compareByPrice = function (array $a, array $b): int {
        $valA = $a['kugel_preis_eur'] ?? $a['kugel_preis'] ?? null;
        $valB = $b['kugel_preis_eur'] ?? $b['kugel_preis'] ?? null;

        if ($valA === null && $valB === null) {
            return 0;
        }
        if ($valA === null) {
            return 1;
        }
        if ($valB === null) {
            return -1;
        }

        return $valA <=> $valB;
    };

    // 4. Durchschnitte berechnen & sortieren
    foreach ($struktur as &$land) {
        foreach ($land['bundeslaender'] as &$bundesland) {
            if ($bundesland['anzahl_eisdielen'] > 0) {
                $bundesland['kugel_preis'] = round(
                    $bundesland['gesamtpreis_summe_local'] / $bundesland['anzahl_eisdielen'], 2
                );
                $bundesland['kugel_preis_eur'] = round(
                    $bundesland['gesamtpreis_summe_eur'] / $bundesland['anzahl_eisdielen'], 2
                );
                $bundesland['durchschnittlicher_kugelpreis'] = $bundesland['kugel_preis'];
                $bundesland['durchschnittlicher_kugelpreis_eur'] = $bundesland['kugel_preis_eur'];
            } else {
                $bundesland['durchschnittlicher_kugelpreis'] = null;
                $bundesland['durchschnittlicher_kugelpreis_eur'] = null;
            }
            unset($bundesland['gesamtpreis_summe_local'], $bundesland['gesamtpreis_summe_eur']);

            // Sortierung der Landkreise
            usort($bundesland['landkreise'], $compareByPrice);
        }
        unset($bundesland);

        // Durchschnitt für Land berechnen
        if ($land['anzahl_eisdielen'] > 0) {
            $land['kugel_preis'] = round(
                $land['gesamtpreis_summe_local'] / $land['anzahl_eisdielen'], 2
            );
            $land['kugel_preis_eur'] = round(
                $land['gesamtpreis_summe_eur'] / $land['anzahl_eisdielen'], 2
            );
            $land['durchschnittlicher_kugelpreis'] = $land['kugel_preis'];
            $land['durchschnittlicher_kugelpreis_eur'] = $land['kugel_preis_eur'];
        } else {
            $land['durchschnittlicher_kugelpreis'] = null;
            $land['durchschnittlicher_kugelpreis_eur'] = null;
        }
        unset($land['gesamtpreis_summe_local'], $land['gesamtpreis_summe_eur']);

        // Sortierung Bundesländer
        usort($land['bundeslaender'], $compareByPrice);
    }
    unset($land);

    // 5. Länder sortieren
    $struktur = array_values($struktur);
    usort($struktur, $compareByPrice);

    // 6. Indexe zurücksetzen
    foreach ($struktur as &$land) {
        $land['bundeslaender'] = array_values($land['bundeslaender']);
    }

    foreach ($struktur as &$land) {
        applyPriceFormatting($land);
        foreach ($land['bundeslaender'] as &$bundesland) {
            applyPriceFormatting($bundesland);
            foreach ($bundesland['landkreise'] as &$landkreis) {
                applyPriceFormatting($landkreis);
            }
            unset($landkreis);
        }
        unset($bundesland);
    }
    unset($land);

    echo json_encode($struktur, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
