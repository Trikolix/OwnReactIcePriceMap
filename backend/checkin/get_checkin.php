<?php
require_once __DIR__ . '/../db_connect.php';
require_once __DIR__ . '/../lib/checkin.php';

// Einzelnen Checkin per ID
if (isset($_GET['checkin_id'])) {
	$checkinId = (int)$_GET['checkin_id'];
	echo json_encode(getCheckinById($pdo, $checkinId));
	exit;
}

// Alle Checkins eines Nutzers für eine Eisdiele an einem Tag
if (isset($_GET['nutzer_id']) && isset($_GET['shop_id']) && isset($_GET['date'])) {
	$nutzerId = (int)$_GET['nutzer_id'];
	$shopId = (int)$_GET['shop_id'];
	$date = $_GET['date'];
	$stmt = $pdo->prepare("SELECT id FROM checkins WHERE nutzer_id = ? AND eisdiele_id = ? AND DATE(datum) = DATE(?)");
	$stmt->execute([$nutzerId, $shopId, $date]);
	$ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
	$result = [];
	foreach ($ids as $id) {
		$result[] = getCheckinById($pdo, $id);
	}
	echo json_encode(['checkins' => $result]);
	exit;
}

echo json_encode(['error' => 'Parameter fehlen']);
?>
