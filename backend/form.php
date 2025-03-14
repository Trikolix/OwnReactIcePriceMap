<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eisdielen Bewertung</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 20px;
        }
        label {
            font-weight: bold;
            display: block;
            margin-top: 10px;
        }
        input, select, button {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        .slider-value {
            font-weight: bold;
        }
        .attribute-container {
            margin-top: 10px;
        }
        .attribute-list {
            margin-top: 5px;
        }
        .attribute-list span {
            display: inline-block;
            background: #f1f1f1;
            padding: 5px;
            margin: 3px;
            border-radius: 3px;
        }
        button {
            background: #007bff;
            color: white;
            cursor: pointer;
            margin-top: 15px;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>

<h2>Eisdielen Bewertung</h2>

<form id="eisdieleForm">
    <label for="nutzer_id">Nutzer-ID:</label>
    <input type="number" id="nutzer_id" required>

    <label for="eisdiele_id">Eisdiele-ID:</label>
    <input type="number" id="eisdiele_id" required>

    <label for="preis_kugel">Preis pro Kugel (€):</label>
    <input type="number" id="preis_kugel" step="0.01" min="0">

    <label for="preis_softeis">Preis Softeis (€):</label>
    <input type="number" id="preis_softeis" step="0.01" min="0">

    <label for="bewertung_geschmack">Geschmack:</label>
    <input type="range" id="bewertung_geschmack" min="1" max="5" step="0.5" value="3">
    <span class="slider-value" id="geschmackValue">3</span>

    <label for="bewertung_groesse_kugel">Kugelgröße:</label>
    <input type="range" id="bewertung_groesse_kugel" min="1" max="5" step="0.5" value="3">
    <span class="slider-value" id="groesseValue">3</span>

    <label for="bewertung_auswahl">Auswahl (1-40 Sorten):</label>
    <input type="range" id="bewertung_auswahl" min="1" max="5" step="1" value="3">
    <span class="slider-value" id="auswahlValue">11-20 Sorten</span>

    <div class="attribute-container">
        <label>Attribute:</label>
        <input type="text" id="attribute_input" placeholder="z.B. Vegane Optionen">
        <button type="button" onclick="addAttribute()">Hinzufügen</button>
        <div class="attribute-list" id="attribute_list"></div>
    </div>

    <button type="submit">Absenden</button>
</form>

<script>
    // Zeigt den Wert der Schieberegler an
    function updateSliderValue(id, outputId) {
        document.getElementById(outputId).innerText = document.getElementById(id).value;
    }
    function updateAuswahlSliderValue(id, outpudId) {
        $auswahlMap = {
            1: "1-2 Sorten",
            2: "3-10 Sorten",
            3: "11-20 Sorten",
            4: "21-30 Sorten",
            5: "mehr als 30 Sorten"
        }
        document.getElementById(outputId).innerText = $auswahlMap.get(document.getElementById(id).value);
    }

    document.getElementById("bewertung_geschmack").oninput = () => updateSliderValue("bewertung_geschmack", "geschmackValue");
    document.getElementById("bewertung_groesse_kugel").oninput = () => updateSliderValue("bewertung_groesse_kugel", "groesseValue");
    document.getElementById("bewertung_auswahl").oninput = () => updateAuswahlSliderValue("bewertung_auswahl", "auswahlValue");

    // Attribute hinzufügen
    let attributes = [];

    function addAttribute() {
        let input = document.getElementById("attribute_input");
        let value = input.value.trim();
        if (value && !attributes.includes(value)) {
            attributes.push(value);
            let list = document.getElementById("attribute_list");
            let span = document.createElement("span");
            span.innerText = value;
            list.appendChild(span);
            input.value = "";
        }
    }

    // Formular absenden
    document.getElementById("eisdieleForm").addEventListener("submit", function(event) {
        event.preventDefault();

        let data = {
            nutzer_id: parseInt(document.getElementById("nutzer_id").value),
            eisdiele_id: parseInt(document.getElementById("eisdiele_id").value),
            preis_kugel: document.getElementById("preis_kugel").value ? parseFloat(document.getElementById("preis_kugel").value) : null,
            preis_softeis: document.getElementById("preis_softeis").value ? parseFloat(document.getElementById("preis_softeis").value) : null,
            bewertung_geschmack: parseFloat(document.getElementById("bewertung_geschmack").value),
            bewertung_groesse_kugel: parseFloat(document.getElementById("bewertung_groesse_kugel").value),
            bewertung_auswahl: parseFloat(document.getElementById("bewertung_auswahl").value),
            attribute: attributes
        };

        fetch("eintragen.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => alert(result.message || result.error))
        .catch(error => console.error("Fehler:", error));
    });
</script>

</body>
</html>
