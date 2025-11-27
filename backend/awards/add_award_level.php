<?php
require_once '../db_connect.php';
require_once '../../backend_dev/db_connect.php'; // Entwicklungsdatenbank
header('Content-Type: application/json');

// Zielverzeichnis für Uploads
$uploadDir = '../../uploads/awards/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$award_id = $_POST['award_id'];
$level = $_POST['level'];
$threshold = $_POST['threshold'];
$title_de = $_POST['title_de'] ?? '';
$description_de = $_POST['description_de'] ?? '';
$icon_path = null;

// Bild verarbeiten, falls hochgeladen
if (isset($_FILES['icon_file']) && $_FILES['icon_file']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['icon_file']['tmp_name'];
    $originalName = basename($_FILES['icon_file']['name']);
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    $safeFilename = uniqid('award_') . '.' . strtolower($extension);
    $destination = $uploadDir . $safeFilename;

    if (move_uploaded_file($tmpName, $destination)) {
        $icon_path = 'uploads/awards/' . $safeFilename;
    } else {
        die("Fehler beim Hochladen des Bildes.");
    }
}

try {
    // Produktiv
    $stmt = $pdo->prepare("INSERT INTO award_levels 
        (award_id, level, threshold, icon_path, title_de, description_de) 
        VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$award_id, $level, $threshold, $icon_path, $title_de, $description_de]);
    // Entwicklung
    $stmt_dev = $pdo_dev->prepare("INSERT INTO award_levels 
        (award_id, level, threshold, icon_path, title_de, description_de) 
        VALUES (?, ?, ?, ?, ?, ?)");
    $stmt_dev->execute([$award_id, $level, $threshold, $icon_path, $title_de, $description_de]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
