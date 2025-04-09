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
 
$sql = "SELECT 
    e.id AS eisdielen_id,
    e.name AS eisdielen_name,
    b.avg_geschmack,
    b.avg_kugelgroesse,
    b.avg_waffel,
    b.avg_auswahl,
    p.preis AS aktueller_preis,
    (SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) AS min_preis,
    -- Preis-Leistungs-Verhältnis (PLV) berechnen
    ROUND(
        1 + 4 * (
            (3 * b.avg_geschmack + 2 * b.avg_kugelgroesse + 1 * b.avg_waffel) / 30
            * (0.65 + 0.35 * ( ( SELECT MAX(preis) AS preis FROM preise WHERE typ = 'kugel' GROUP BY eisdiele_id ORDER BY preis LIMIT 1) / p.preis ))
        ), 2
    ) AS PLV
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
            header.innerHTML += ' <span class="sort-icon"></span>'; // Sortier-Symbol Platzhalter

            header.addEventListener("click", () => {
                const rows = Array.from(tbody.querySelectorAll("tr"));
                const isAscending = header.dataset.order === "asc";
                const type = header.textContent.trim();

                rows.sort((rowA, rowB) => {
                    let cellA = rowA.children[columnIndex].textContent.trim();
                    let cellB = rowB.children[columnIndex].textContent.trim();

                    // Falls es eine Zahl ist, konvertieren
                    if (!isNaN(parseFloat(cellA)) && !isNaN(parseFloat(cellB))) {
                        cellA = parseFloat(cellA);
                        cellB = parseFloat(cellB);
                    }

                    return isAscending ? (cellA > cellB ? 1 : -1) : (cellA < cellB ? 1 :
                        -1);
                });

                // Sortierte Reihenfolge in das DOM einfügen
                tbody.innerHTML = "";
                rows.forEach(row => tbody.appendChild(row));

                // Sortierrichtung speichern
                headers.forEach(h => {
                    h.removeAttribute("data-order");
                    h.querySelector(".sort-icon").innerHTML =
                        ""; // Symbole zurücksetzen
                });
                header.dataset.order = isAscending ? "desc" : "asc";

                // Sortier-Symbol setzen
                const sortSymbol = isAscending ? " ▲" : " ▼";
                header.querySelector(".sort-icon").innerHTML = sortSymbol;
            });
        });
    });
    </script>
</head>

<body>
    <div style="display: flex; flex-direction: column; background-color: #ffb522; margin: 0 auto;">
        <a href="https://ice-app.4lima.de/" style="align-self: center;"><img src="header.png" alt="Header" style="align-self: center; height: 150px; width: 150px;"></a>
    </div>
    <div class="container mt-4">
        <h2 class="text-center">🏆 Eisdielen-Ranking</h2>

        <!-- Tabelle -->
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Eisdiele</th>
                    <th>Geschmack</th>
                    <th>Kugelgröße</th>
                    <th>Waffel</th>
                    <th>Anzahl Sorten</th>
                    <th>Preis (€)</th>
                    <th>Preis-Leistung</th>
                </tr>
            </thead>
            <tbody id="rankingTable">
                <?php foreach ($eisdielen as $eisdiele): ?>
                <tr>
                    <td><?= htmlspecialchars($eisdiele['eisdielen_name']) ?></td>
                    <td><?= number_format($eisdiele['avg_geschmack'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_kugelgroesse'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_waffel'], 1) ?></td>
                    <td><?= number_format($eisdiele['avg_auswahl'], 1) ?></td>
                    <td><?= number_format($eisdiele['aktueller_preis'], 2) ?> €</td>
                    <td><strong><?= number_format($eisdiele['PLV'], 2) ?></strong></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <h4 class="text-center">Erklärung zum Ranking</h4>
        <p>
            Die Preis-Leistungsverhältnis wird nach folgender Formel berechnet. Der Geschmack hat dabei eine Gewichtung
            von
            3, die Kugelgröße eine Wichtung von 2 und die Waffel eine Wichtung von 1.
            Das ganze wird noch mit dem Verhältnis zur günstigsten Eisdiele multipliziert. Für eine perfekte 5.0
            Bewertung
            bräuchte es also durchschnittlich 5.0 Bewertungen in allen Kategrorien
            und es müsste zeitgleich die günstigste Eisdiele in der ganzen Datenbank sein.<br><br>
            G - Ø Bewertung des Geschmacks<br>
            K - Ø Bewertung der Kugelgröße<br>
            W - Ø Bewertung der Eiswaffel<br>
            P - Preis pro Kugel in €<br>
            <center><img src='plv-formel_neu.png'></img></center>
        </p>
    </div>
</body>

</html>