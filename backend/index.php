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
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body class="container mt-4">

    <h2 class="text-center">🏆 Eisdielen-Ranking</h2>

    <!-- Filter -->
    <div class="row mb-3">
        <div class="col-md-3">
            <label for="minGeschmack" class="form-label">Min. Geschmack:</label>
            <input type="number" id="minGeschmack" class="form-control" step="0.1" min="1" max="5" value="1">
        </div>
        <div class="col-md-3">
            <label for="minPLV" class="form-label">Min. PLV:</label>
            <input type="number" id="minPLV" class="form-control" step="0.1" min="1" max="5" value="1">
        </div>
        <div class="col-md-3">
            <label for="sortBy" class="form-label">Sortieren nach:</label>
            <select id="sortBy" class="form-select">
                <option value="PLV">Preis-Leistung</option>
                <option value="geschmack">Geschmack</option>
                <option value="kugelgroesse">Kugelgröße</option>
                <option value="waffel">Waffel</option>
                <option value="auswahl">Anzahl Sorten</option>
                <option value="preis">Preis (niedrigster zuerst)</option>
            </select>
        </div>
        <div class="col-md-3 d-flex align-items-end">
            <button id="applyFilter" class="btn btn-primary w-100">Filter anwenden</button>
        </div>
    </div>

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

    <script>
        $(document).ready(function() {
            $("#applyFilter").click(function() {
                let minGeschmack = parseFloat($("#minGeschmack").val());
                let minPLV = parseFloat($("#minPLV").val());
                let sortBy = $("#sortBy").val();

                let rows = $("#rankingTable tr").get();

                rows = rows.filter(row => {
                    let geschmack = parseFloat($(row).find("td:eq(1)").text());
                    let plv = parseFloat($(row).find("td:eq(5)").text());
                    return geschmack >= minGeschmack && plv >= minPLV;
                });

                rows.sort((a, b) => {
                    let valA, valB;
                    switch (sortBy) {
                        case "PLV":
                            valA = parseFloat($(a).find("td:eq(6)").text());
                            valB = parseFloat($(b).find("td:eq(6)").text());
                            return valB - valA;
                        case "geschmack":
                            valA = parseFloat($(a).find("td:eq(1)").text());
                            valB = parseFloat($(b).find("td:eq(1)").text());
                            return valB - valA;
                        case "kugelgroesse":
                            valA = parseFloat($(a).find("td:eq(2)").text());
                            valB = parseFloat($(b).find("td:eq(2)").text());
                            return valB - valA;
                        case "waffel":
                            valA = parseFloat($(a).find("td:eq(3)").text());
                            valB = parseFloat($(b).find("td:eq(3)").text());
                            return valB - valA;
                        case "auswahl":
                            valA = parseFloat($(a).find("td:eq(4)").text());
                            valB = parseFloat($(b).find("td:eq(4)").text());
                            return valB - valA;
                        case "preis":
                            valA = parseFloat($(a).find("td:eq(5)").text());
                            valB = parseFloat($(b).find("td:eq(5)").text());
                            return valA - valB;
                    }
                });

                $("#rankingTable").html(rows);
            });
        });
    </script>

</body>
</html>
