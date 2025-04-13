<?php
$host = "localhost";
$dbname = "db_439770_2";
$username = "USER439770_wed";
$password = "K8RYTP23y8kWSdt";
 
// Verbindung zur Datenbank
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen"]);
    exit();
}
 
// alte PLV-Formel:
// (SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) AS min_preis,
// ROUND(
//     1 + 4 * (
//         (3 * b.avg_geschmack + 2 * b.avg_kugelgroesse + 1 * b.avg_waffel) / 30
//         * (0.65 + 0.35 * ( ( SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) / p.preis ))
//     ), 2
// ) AS PLV
$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    e.adresse,
    e.openingHours,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    b.avg_auswahl,
    p.preis AS aktueller_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (0.7 * ((3 * b.avg_geschmack + b.avg_waffel) / 20))
            + (0.3 * (3 * b.avg_kugelgroesse) / (10 * p.preis))
        ), 2
    ) AS PLV,
    ((3 * b.avg_geschmack + b.avg_waffel) / 20) AS geschmacks_faktor,
    ((3 * b.avg_kugelgroesse) / (10 * p.preis)) AS preisleistungs_faktor
FROM eisdielen e
-- Durchschnittliche Bewertungen pro Eisdiele berechnen
JOIN (
    SELECT 
        eisdiele_id,
        AVG(geschmack) AS avg_geschmack,
        AVG(kugelgroesse) AS avg_kugelgroesse,
        AVG(waffel) AS avg_waffel,
        AVG(auswahl) AS avg_auswahl
    FROM bewertungen
    GROUP BY eisdiele_id
) b ON e.id = b.eisdiele_id
-- Aktuellsten Preis für Kugel pro Eisdiele finden
JOIN preise p ON e.id = p.eisdiele_id 
WHERE p.typ = 'kugel'
AND p.gemeldet_am = (
    SELECT MAX(p2.gemeldet_am) 
    FROM preise p2 
    WHERE p2.eisdiele_id = p.eisdiele_id 
    AND p2.typ = 'kugel'
)
HAVING PLV IS NOT NULL
ORDER BY PLV DESC;";
 
// SQL ausführen
$stmt = $pdo->query($sql);
$eisdielen = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eisdielen-Ranking</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <script>
    document.addEventListener("DOMContentLoaded", function() {
    const table = document.querySelector(".table");
    const headers = table.querySelectorAll("th");
    const tbody = table.querySelector("tbody");

    headers.forEach((header, columnIndex) => {
        header.style.cursor = "pointer";
        header.innerHTML += ' <span class="sort-icon"></span>';

        header.addEventListener("click", () => {
            const rows = Array.from(tbody.querySelectorAll("tr.main-row"));
            const detailRows = Array.from(tbody.querySelectorAll("tr.details-row"));
            const isAscending = header.dataset.order === "asc";

            rows.sort((rowA, rowB) => {
                let cellA = rowA.children[columnIndex].textContent.trim();
                let cellB = rowB.children[columnIndex].textContent.trim();

                if (!isNaN(parseFloat(cellA)) && !isNaN(parseFloat(cellB))) {
                    cellA = parseFloat(cellA);
                    cellB = parseFloat(cellB);
                }

                return isAscending ? (cellA > cellB ? 1 : -1) : (cellA < cellB ? 1 : -1);
            });

            // Sortierte Reihenfolge inklusive Detailzeilen einfügen
            tbody.innerHTML = "";
            rows.forEach(row => {
                const index = row.getAttribute("data-index");
                const detailRow = detailRows.find(r => r.getAttribute("data-index") === index);
                tbody.appendChild(row);
                tbody.appendChild(detailRow);
            });

            headers.forEach(h => {
                h.removeAttribute("data-order");
                h.querySelector(".sort-icon").innerHTML = "";
            });
            header.dataset.order = isAscending ? "desc" : "asc";
            header.querySelector(".sort-icon").innerHTML = isAscending ? " ▲" : " ▼";
        });
    });

    // Toggle Detailzeilen
    const mainRows = document.querySelectorAll(".main-row");
    mainRows.forEach(row => {
        row.addEventListener("click", function() {
            const index = row.getAttribute("data-index");
            const detailRow = document.querySelector(`.details-row[data-index="${index}"]`);
            detailRow.style.display = detailRow.style.display === "none" ? "table-row" : "none";
        });
    });
});
    </script>
</head>

<body>
    <div style="display: flex; flex-direction: column; background-color: #ffb522; margin: 0 auto;">
        <a href="https://ice-app.4lima.de/" style="align-self: center;"><img src="header.png" alt="Header"
                style="align-self: center; height: 150px; width: 150px;"></a>
    </div>
    <div class="container mt-4">
        <h2 class="text-center">🏆 Eisdielen-Ranking</h2>

        <!-- Tabelle -->
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Eisdiele</th>
                    <th>Geschmack</th>
                    <th>Kugelgröße</th>
                    <th>Waffel</th>
                    <th>Anzahl Sorten</th>
                    <th>Preis (€)</th>
                    <th>Rating</th>
                    <th>Geschmacksfaktor</th>
                    <th>Preis-Leistungsfaktor</th>
                </tr>
            </thead>
            <tbody id="rankingTable">
                <?php 
                foreach ($eisdielen as $index => $eisdiele): ?>
                <tr class="main-row" data-index="<?= $index ?>" style="cursor:pointer;">
                    <td><?= htmlspecialchars($eisdiele['eisdielen_name']) ?></td>
                    <td><?= number_format($eisdiele['avg_geschmack'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_kugelgroesse'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_waffel'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_auswahl'], 1) ?></td>
                    <td><?= number_format($eisdiele['aktueller_preis'], 2) ?> €</td>
                    <td><strong><?= number_format($eisdiele['PLV'], 2) ?></strong></td>
                    <td><?= number_format($eisdiele['geschmacks_faktor'], 2) ?></td>
                    <td><?= number_format($eisdiele['preisleistungs_faktor'], 2) ?></td>
                </tr>
                <tr class="details-row" data-index="<?= $index ?>" style="display: none;">
                    <td colspan="9">
                        <div class="alert alert-info mb-0">
                            <h5><?= htmlspecialchars($eisdiele['eisdielen_name']) ?></h5>
                            <strong>Adresse: </strong><?= htmlspecialchars($eisdiele['adresse']) ?><br>
                            <strong>Öffnungszeiten: </strong><br><?= nl2br(htmlspecialchars(str_replace(';', "\n", $eisdiele['openingHours']))) ?><br>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <h4 class="text-center">Erklärung zum Ranking</h4>
        <p>
            Die Preis-Leistungsverhältnis wird nach folgender Formel berechnet. Der Geschmack hat dabei eine Gewichtung
            von 70% und setzt sich zusammen aus
            Geschmack und Waffel. Wobei Geschmack 4 fach so stark gewichtet wird wie die Waffel.
            Die anderen 30% der Bewertung entsteht aus dem Verhältnis von Kugelgröße zu Preis.
            Eine Kugelgröße von 5.0 Punkten bei einem Preis von 1,5€ ergibt dabei einen Faktor 1.
            Je kleiner die Kugelgröße und je höher der Preis wird, desto kleiner wird der Faktor.
            Da der Wert 1 bei einem Preis von 1,50€ pro Kugel erreicht wird, kann der Faktor bei Eisdielen die sehr
            große Kugeln für unter 1,50€ anbieten auch größer als 1 werden.<br><br>
            G - Ø Bewertung des Geschmacks (0 - 5)<br>
            K - Ø Bewertung der Kugelgröße (0 - 5)<br>
            W - Ø Bewertung der Eiswaffel (0 - 5)<br>
            P - Preis pro Kugel in €<br>
            <center><img src='plv-formel_neu.png'></img></center>
        </p>
    </div>
</body>

</html>