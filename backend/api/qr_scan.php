<?php
require_once __DIR__ . '/../db_connect.php';

// JSON-Daten lesen
$input = json_decode(file_get_contents('php://input'), true);
$code = $input['code'] ?? null;
$nutzerId = $input['nutzer_id'] ?? null;

// Validierung
if (!$code) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Kein Code uebergeben.']);
  exit;
}

// QR-Code suchen
$stmt = $pdo->prepare('SELECT * FROM qr_codes WHERE code = ?');
$stmt->execute([$code]);
$qrCode = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$qrCode) {
  http_response_code(404);
  echo json_encode(['status' => 'error', 'message' => 'QR-Code ungueltig.']);
  exit;
}

// Gueltigkeit pruefen (optional: leere Felder = immer gueltig)
$now = date('Y-m-d H:i:s');
if (
    (!empty($qrCode['valid_from']) && $now < $qrCode['valid_from']) ||
    (!empty($qrCode['valid_until']) && $now > $qrCode['valid_until'])
) {
  http_response_code(403);
  echo json_encode(['status' => 'error', 'message' => 'QR-Code nicht gueltig (zeitlich).']);
  exit;
}

$alreadyScanned = false;

// Wenn NutzerId vorhanden: Scan speichern
if ($nutzerId) {
  // Schon gescannt?
  $checkStmt = $pdo->prepare('SELECT 1 FROM user_qr_scans WHERE user_id = ? AND qr_code_id = ?');
  $checkStmt->execute([$nutzerId, $qrCode['id']]);

  if (!$checkStmt->fetch()) {
    // Noch nicht vorhanden -> eintragen
    $insert = $pdo->prepare('INSERT INTO user_qr_scans (user_id, qr_code_id) VALUES (?, ?)');
    $insert->execute([$nutzerId, $qrCode['id']]);
  } else {
    $alreadyScanned = true;
  }
}

// Erfolgreich
echo json_encode([
  'status' => 'success',
  'id' => $qrCode['id'],
  'award_type' => $qrCode['award_type'],
  'name' => $qrCode['name'],
  'icon' => $qrCode['icon_path'],
  'description' => $qrCode['description'],
  'already_scanned' => $alreadyScanned,
  'saved' => $nutzerId ? true : false,
  'message' => $nutzerId
    ? ($alreadyScanned ? 'QR-Code bereits gescannt' : 'Scan gespeichert')
    : 'Scan erkannt - bitte einloggen oder registrieren',
]);

?>
