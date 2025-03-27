<?php
// Holt die JSON-Daten vom API-Endpunkt
$json = file_get_contents("https://ice-app.4lima.de/backend/get_eisdielen_preisleistung.php");
$eisdielen = json_decode($json, true);
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
        <img src="header.png" alt="Header" style=" align-self: center; height: 150px; width: 150px;">
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
            Pmin - Preis der günstigsten Eisdiele in €<br>
            <center><img src='plv-formel.png'></img></center>
        </p>
    </div>
</body>
 
</html>