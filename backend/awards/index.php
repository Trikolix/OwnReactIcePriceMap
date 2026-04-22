<?php
session_start();

// Login-Logik verarbeiten
$correctPassword = "deinSicheresPasswort123";
if (isset($_POST['password'])) {
    if ($_POST['password'] === $correctPassword) {
        $_SESSION['admin'] = true;
    } else {
        $loginError = "Falsches Passwort.";
    }
}

$isAdmin = $_SESSION['admin'] ?? false;

if (isset($_GET['logout'])) {
    session_unset();      // ← Session-Variablen löschen
    session_destroy();    // ← Session beenden
    header("Location: index.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <title>Awards verwalten</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
    body {
        padding: 2rem;
    }

    .award-preview {
        max-width: 100px;
    }

    .award-card {
        content-visibility: auto;
        contain-intrinsic-size: 180px;
    }
    </style>
</head>

<body>
    <div class="container">
        <?php if (!$isAdmin): ?>
        <h3>Admin-Login</h3>
        <?php if (isset($loginError)): ?>
        <p style="color: red;"><?= htmlspecialchars($loginError) ?></p>
        <?php endif; ?>
        <form method="post">
            <input type="password" name="password" placeholder="Passwort">
            <button type="submit">Login</button>
        </form>
        <?php else: ?>
        <p><a href="?logout=1">Logout</a></p>
        <h1 class="mb-4">Award-Verwaltung</h1>

        <!-- Formular zum Hinzufügen eines Awards -->
        <form id="addAwardForm" class="mb-5">
            <div class="mb-3">
                <label class="form-label">Award Code</label>
                <input type="text" class="form-control" name="code" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Kategorie</label>
                <input type="text" class="form-control" name="category">
            </div>
            <button type="submit" class="btn btn-primary">Award hinzufügen</button>
        </form>

        <!-- Formular zum Hinzufügen eines Award-Levels -->
        <form id="awardLevelForm" class="mb-5" enctype="multipart/form-data">
            <h4 id="formTitle">Award-Level hinzufügen</h4>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label">Award ID</label>
                    <input type="number" class="form-control" name="award_id" id="award_id" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Stufe</label>
                    <input type="number" class="form-control" name="level" id="level" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Schwelle</label>
                    <input type="number" class="form-control" name="threshold" id="threshold" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">EP</label>
                    <input type="number" class="form-control" name="ep" id="ep" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Icon-Datei hochladen</label>
                <input type="file" class="form-control" name="icon_file" id="icon_file" accept="image/*">
            </div>
            <div class="mb-3">
                <label class="form-label">Titel (Deutsch)</label>
                <input type="text" class="form-control" name="title_de" id="title_de">
            </div>
            <div class="mb-3">
                <label class="form-label">Beschreibung (Deutsch)</label>
                <textarea class="form-control" name="description_de" id="description_de" rows="2"></textarea>
            </div>
            <button type="submit" class="btn btn-success">Speichern</button>
        </form>
        <?php endif; ?>
        <!-- Bestehende Awards anzeigen -->
        <div>
            <h3>Bestehende Awards</h3>
            <div id="awardList"></div>
        </div>
    </div>

    <script>
    const isAdmin = <?= $isAdmin ? 'true' : 'false' ?>;
    const awardListEl = document.getElementById("awardList");
    const levelEditStore = new Map();

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function buildAwardCardHtml(award) {
        let html =
            `<div class="mb-3 border p-3 rounded award-card" data-award-id="${award.id}">` +
            `<strong>ID: ${award.id} - ${escapeHtml(award.code)}</strong> (${escapeHtml(award.category || 'keine Kategorie')})`;

        if (award.levels && award.levels.length > 0) {
            html += '<ul class="mt-2">';
            award.levels.forEach(level => {
                const levelKey = `${award.id}:${level.level}`;
                levelEditStore.set(levelKey, level);

                const iconHtml = level.icon_path ?
                    `<img src="../../${escapeHtml(level.icon_path)}" alt="Icon" class="award-preview ms-2" loading="lazy" decoding="async">` :
                    '';

                const editButtonHtml = isAdmin ?
                    `<button type="button" class="btn btn-sm btn-outline-secondary ms-2 js-edit-level" data-award-id="${award.id}" data-level="${level.level}">Bearbeiten</button>` :
                    '';

                html += `<li>
                ${iconHtml}
                Stufe ${level.level}: ${escapeHtml(level.title_de)} – ${level.threshold} Punkte (${level.ep} EP) "${escapeHtml(level.description_de)}"
                ${editButtonHtml}
                </li>`;
            });
            html += '</ul>';
        }

        html += '</div>';
        return html;
    }

    function renderAwards(data) {
        levelEditStore.clear();

        if (!Array.isArray(data) || data.length === 0) {
            awardListEl.innerHTML = "<p>Keine Awards vorhanden.</p>";
            return;
        }

        const html = data.map(buildAwardCardHtml).join('');
        awardListEl.innerHTML = html;
    }

    async function fetchAwards() {
        awardListEl.innerHTML = "<p>Lade Awards...</p>";

        try {
            const response = await fetch("get_awards.php");
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            renderAwards(data);
        } catch (error) {
            console.error("Awards konnten nicht geladen werden:", error);
            awardListEl.innerHTML = "<p>Fehler beim Laden der Awards.</p>";
            return;
        }

        const scrollToId = localStorage.getItem("scrollToAwardId");
        if (scrollToId) {
            const target = document.querySelector(`[data-award-id="${scrollToId}"]`);
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
            localStorage.removeItem("scrollToAwardId");
        }
    }

    fetchAwards();

    awardListEl.addEventListener("click", function(e) {
        const button = e.target.closest(".js-edit-level");
        if (!button) return;

        const awardId = Number(button.dataset.awardId);
        const levelNumber = Number(button.dataset.level);
        const levelKey = `${awardId}:${levelNumber}`;
        const level = levelEditStore.get(levelKey);

        if (!level) {
            alert("Level-Daten konnten nicht geladen werden.");
            return;
        }

        editLevel(level, awardId);
    });

    function editLevel(level, awardId) {
        document.getElementById("formTitle").innerText = "Award-Level bearbeiten";
        document.getElementById("award_id").value = awardId;
        document.getElementById("level").value = level.level;
        document.getElementById("threshold").value = level.threshold;
        document.getElementById("ep").value = level.ep || 0;
        document.getElementById("title_de").value = level.title_de || '';
        document.getElementById("description_de").value = level.description_de || '';

        localStorage.setItem("scrollToAwardId", awardId);

        // Optional: Scroll zum Formular
        document.getElementById("awardLevelForm").scrollIntoView({
            behavior: "smooth"
        });
    }

    document.getElementById("addAwardForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const res = await fetch("add_award.php", {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            location.reload(); // Seite neu laden nach erfolgreichem Speichern
        } else {
            alert("Fehler beim Hinzufügen des Awards");
        }
    });

    document.getElementById("awardLevelForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const res = await fetch("save_award_level.php", {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            location.reload(); // Seite neu laden nach erfolgreichem Speichern
        } else {
            alert("Fehler beim Speichern des Levels");
        }
    });
    </script>

</body>

</html>
