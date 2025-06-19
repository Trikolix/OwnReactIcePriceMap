<?php
require_once '../db_connect.php';
header('Content-Type: application/json');

$award_id = intval($_POST['award_id']);
$level = intval($_POST['level']);
$threshold = intval($_POST['threshold']);
$ep = $_POST['ep'] ?? 0;
$title_de = $_POST['title_de'] ?? '';
$description_de = $_POST['description_de'] ?? '';

// Bestehenden Level suchen
$stmt = $pdo->prepare("SELECT icon_path FROM award_levels WHERE award_id = ? AND level = ?");
$stmt->execute([$award_id, $level]);
$existing = $stmt->fetch();

$newIconPath = $existing['icon_path'] ?? null;

try {
    // Icon ggf. ersetzen
    if (isset($_FILES['icon_file']) && $_FILES['icon_file']['error'] === UPLOAD_ERR_OK) {
        // Altes Icon löschen
        if ($newIconPath && file_exists("../../" . $newIconPath)) {
            unlink("../../" . $newIconPath);
        }

        // Neues Icon speichern
        $uploadDir = 'uploads/award_icons/';
        if (!is_dir("../../$uploadDir")) mkdir("../../$uploadDir", 0777, true);
        $filename = uniqid() . '_' . basename($_FILES['icon_file']['name']);
        $newIconPath = $uploadDir . $filename;
        move_uploaded_file($_FILES['icon_file']['tmp_name'], "../../" . $newIconPath);
    }

    // Wenn vorhanden: UPDATE, sonst INSERT
    if ($existing) {
        $stmt = $pdo->prepare("UPDATE award_levels SET threshold = ?, ep = ?, title_de = ?, description_de = ?, icon_path = ? WHERE award_id = ? AND level = ?");
        $stmt->execute([$threshold, $ep, $title_de, $description_de, $newIconPath, $award_id, $level]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO award_levels (award_id, level, threshold, ep, icon_path, title_de, description_de) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$award_id, $level, $threshold, $ep, $newIconPath, $title_de, $description_de]);
    }

    // Erfolgsmeldung
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    // Fehlermeldung
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
