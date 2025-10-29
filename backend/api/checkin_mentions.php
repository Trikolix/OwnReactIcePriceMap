<?php
require_once  __DIR__ . '/../db_connect.php';
header('Content-Type: application/json');

// GET: getStatus
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getStatus') {
    $checkin_id = isset($_GET['checkin_id']) ? (int)$_GET['checkin_id'] : null;
    $mentioned_user_id = isset($_GET['mentioned_user_id']) ? (int)$_GET['mentioned_user_id'] : null;
    if (!$checkin_id || !$mentioned_user_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'checkin_id und mentioned_user_id erforderlich']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT status, id FROM checkin_mentions WHERE checkin_id = ? AND mentioned_user_id = ? LIMIT 1");
    $stmt->execute([$checkin_id, $mentioned_user_id]);
    $row = $stmt->fetch();
    if ($row) {
        echo json_encode(['status' => $row['status'], 'mention_id' => $row['id']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Nicht gefunden']);
    }
    exit;
}

// POST: accept, decline, undoDecline
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $checkin_id = isset($input['checkin_id']) ? (int)$input['checkin_id'] : null;
    $mentioned_user_id = isset($input['mentioned_user_id']) ? (int)$input['mentioned_user_id'] : null;
    if (!$checkin_id || !$mentioned_user_id || !$action) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'checkin_id, mentioned_user_id und action erforderlich']);
        exit;
    }

    // mention_id aus DB holen
    $stmt = $pdo->prepare("SELECT id FROM checkin_mentions WHERE checkin_id = ? AND mentioned_user_id = ? LIMIT 1");
    $stmt->execute([$checkin_id, $mentioned_user_id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Mention nicht gefunden']);
        exit;
    }
    $mention_id = (int)$row['id'];

    if ($action === 'accept') {
        $responded_checkin_id = isset($input['responded_checkin_id']) ? (int)$input['responded_checkin_id'] : null;
        if (!$responded_checkin_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'responded_checkin_id erforderlich']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE checkin_mentions SET status = 'accepted', responded_checkin_id = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$responded_checkin_id, $mention_id]);
        echo json_encode(['status' => 'success', 'mention_id' => $mention_id, 'new_status' => 'accepted']);
        exit;
    }
    if ($action === 'decline') {
        $stmt = $pdo->prepare("UPDATE checkin_mentions SET status = 'declined', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$mention_id]);
        echo json_encode(['status' => 'success', 'mention_id' => $mention_id, 'new_status' => 'declined']);
        exit;
    }
    if ($action === 'undoDecline') {
        $stmt = $pdo->prepare("UPDATE checkin_mentions SET status = 'pending', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$mention_id]);
        echo json_encode(['status' => 'success', 'mention_id' => $mention_id, 'new_status' => 'pending']);
        exit;
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Aktion']);
    exit;
}

// Fallback
http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Ungültiger Request']);
exit;
?>